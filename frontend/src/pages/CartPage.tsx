import { Link } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../api/queries';
import { formatPrice } from '../lib/format';
import { useAuth } from '../auth/useAuth';

export function CartPage() {
  const { session } = useAuth();
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (!session) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-pure-white">Your SparkZ Cart</h1>
        <p className="mt-2 text-xs text-pure-white/60">
          Sign in to view your saved component inventory, recalculate pricing, and complete your order.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 text-xs font-semibold">
          Explore Catalog
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-onyx-surface animate-pulse" />
        <div className="h-40 rounded-xl bg-onyx-surface animate-pulse" />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = Number(cart?.subtotal ?? 0);
  const freeShippingThreshold = 999;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="text-4xl">🛒</div>
        <h2 className="mt-4 text-xl font-bold text-pure-white">Your Cart is Empty</h2>
        <p className="mt-2 text-xs text-pure-white/60">
          Add microcontrollers, passives, or sensors to start a new order.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 text-xs font-semibold">
          Browse Components
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-pure-white">Shopping Cart</h1>
        <span className="font-mono text-xs text-pure-white/60">
          {cart?.itemCount} {cart?.itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Item List */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-white/10 bg-onyx-surface p-4"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-onyx p-2">
                <img
                  src={
                    item.product.imageUrls[0] ||
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={item.product.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="font-semibold text-pure-white hover:text-spark-lime text-sm"
                    >
                      {item.product.name}
                    </Link>
                    <span className="font-bold text-pure-white text-sm">
                      {formatPrice(Number(item.product.unitPrice) * item.quantity)}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-pure-white/40">
                    SKU: {item.product.sku} • {formatPrice(item.product.unitPrice)} ea
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-md border border-white/10 bg-onyx">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem.mutate({
                          productId: item.productId,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      className="px-2 py-0.5 text-xs text-pure-white/60 hover:text-pure-white disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center font-mono text-xs font-semibold text-pure-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem.mutate({
                          productId: item.productId,
                          quantity: Math.min(item.product.stockQuantity, item.quantity + 1),
                        })
                      }
                      disabled={
                        item.quantity >= item.product.stockQuantity || updateItem.isPending
                      }
                      className="px-2 py-0.5 text-xs text-pure-white/60 hover:text-pure-white disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem.mutate(item.productId)}
                    disabled={removeItem.isPending}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="h-fit space-y-4 rounded-xl border border-white/10 bg-onyx-surface p-6">
          <h2 className="text-base font-bold text-pure-white">Order Summary</h2>

          <div className="space-y-2 border-b border-white/10 pb-4 text-xs">
            <div className="flex justify-between text-pure-white/70">
              <span>Subtotal</span>
              <span className="font-mono text-pure-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-pure-white/70">
              <span>Estimated Shipping</span>
              <span className="font-mono text-pure-white">
                {qualifiesForFreeShipping ? (
                  <span className="text-spark-lime font-bold">FREE</span>
                ) : (
                  formatPrice(99)
                )}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm font-semibold text-pure-white">Total</span>
            <span className="text-xl font-black text-spark-lime">
              {formatPrice(subtotal + (qualifiesForFreeShipping ? 0 : 99))}
            </span>
          </div>

          <p className="text-[11px] text-pure-white/50">
            {qualifiesForFreeShipping
              ? '✓ You have qualified for free express component shipping!'
              : `Add ${formatPrice(freeShippingThreshold - subtotal)} more to qualify for free shipping.`}
          </p>

          <Link
            to="/checkout"
            className="btn-primary block w-full text-center py-2.5 text-sm font-bold shadow-md shadow-spark-lime/10"
          >
            Proceed to Checkout →
          </Link>
        </div>
      </div>
    </div>
  );
}
