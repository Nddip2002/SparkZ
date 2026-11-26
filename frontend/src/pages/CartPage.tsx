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
      <div className="mx-auto max-w-[680px] py-16 text-center space-y-4">
        <h1 className="heading-3 text-pure-white">Your SparkZ cart</h1>
        <p className="body-3 text-pure-white/60">
          Sign in to view your saved component inventory, verify live pricing, and complete your order.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="btn-primary">
            Browse live catalog
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#131C2E]" />
        <div className="h-40 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]" />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = Number(cart?.subtotal ?? 0);
  const freeShippingThreshold = 999;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[680px] py-20 text-center space-y-4">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#28364F] bg-[#131C2E] text-spark-lime">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 fill-current">
            <path d="M216,64H176a48,48,0,0,0-96,0H40A16,16,0,0,0,24,80V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64ZM128,32a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm88,168H40V80H80v16a8,8,0,0,0,16,0V80h64v16a8,8,0,0,0,16,0V80h40Z" />
          </svg>
        </div>
        <h1 className="heading-4 text-pure-white">Your cart is empty</h1>
        <p className="body-6 text-pure-white/60">
          Add microcontrollers, voltage regulators, or sensors from the live catalog to begin an order.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="btn-primary">
            Browse live catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Link to="/catalog" className="caption-4 text-spark-lime hover:underline">
            ← Continue browsing catalog
          </Link>
          <h1 className="heading-3 text-pure-white">Shopping cart</h1>
        </div>
        <span className="font-mono caption-2 text-pure-white/60">
          {cart?.itemCount} {cart?.itemCount === 1 ? 'unit' : 'units'} selected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Item List */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-[#28364F] bg-[#131C2E] p-4"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-[#28364F] bg-[#1A253A] p-2">
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
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="title-3 text-pure-white hover:text-spark-lime"
                    >
                      {item.product.name}
                    </Link>
                    <span className="font-mono body-4 text-pure-white">
                      {formatPrice(Number(item.product.unitPrice) * item.quantity)}
                    </span>
                  </div>
                  <p className="font-mono caption-5 text-pure-white/50">
                    SKU: {item.product.sku} · {formatPrice(item.product.unitPrice)} each
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="inline-flex items-center rounded-lg border border-[#28364F] bg-[#1A253A]">
                    <button
                      type="button"
                      aria-label="Decrease item quantity"
                      onClick={() =>
                        updateItem.mutate({
                          productId: item.productId,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      className="px-2 py-1 caption-3 text-pure-white/70 hover:text-pure-white disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-mono caption-3 text-pure-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase item quantity"
                      onClick={() =>
                        updateItem.mutate({
                          productId: item.productId,
                          quantity: Math.min(item.product.stockQuantity, item.quantity + 1),
                        })
                      }
                      disabled={
                        item.quantity >= item.product.stockQuantity || updateItem.isPending
                      }
                      className="px-2 py-1 caption-3 text-pure-white/70 hover:text-pure-white disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem.mutate(item.productId)}
                    disabled={removeItem.isPending}
                    className="caption-3 text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="h-fit space-y-4 rounded-2xl border border-[#28364F] bg-[#131C2E] p-6">
          <h2 className="title-1 text-pure-white">Order summary</h2>

          <div className="space-y-2 rounded-lg border border-[#28364F] bg-[#1A253A] p-4">
            <div className="flex justify-between caption-2 text-pure-white/70">
              <span>Subtotal</span>
              <span className="font-mono text-pure-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between caption-2 text-pure-white/70">
              <span>Estimated shipping</span>
              <span className="font-mono text-pure-white">
                {qualifiesForFreeShipping ? (
                  <span className="text-spark-lime">FREE</span>
                ) : (
                  formatPrice(99)
                )}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="title-3 text-pure-white">Total</span>
            <span className="font-mono heading-5 text-spark-lime">
              {formatPrice(subtotal + (qualifiesForFreeShipping ? 0 : 99))}
            </span>
          </div>

          <p className="caption-5 text-pure-white/60">
            {qualifiesForFreeShipping
              ? 'Your order qualifies for free express component shipping.'
              : `Add ${formatPrice(freeShippingThreshold - subtotal)} more to qualify for free express shipping.`}
          </p>

          <Link to="/checkout" className="btn-primary w-full">
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
