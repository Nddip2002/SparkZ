import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart, useCheckout } from '../api/queries';
import { formatPrice } from '../lib/format';
import type { ShippingAddress } from '../types/api';
import { useAuth } from '../auth/useAuth';

export default function CheckoutPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const checkout = useCheckout();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-pure-white">Checkout</h1>
        <p className="mt-2 text-xs text-pure-white/60">
          Please sign in to proceed with your component order.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 text-xs font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center text-pure-white/60">
        Loading checkout details...
      </div>
    );
  }

  const items = cart?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-pure-white">Your Cart is Empty</h1>
        <p className="mt-2 text-xs text-pure-white/60">
          There are no components in your cart to checkout.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 text-xs font-semibold">
          Browse Products
        </Link>
      </div>
    );
  }

  const subtotal = Number(cart?.subtotal ?? 0);
  const shippingCost = subtotal >= 999 ? 0 : 99;
  const totalAmount = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const order = await checkout.mutateAsync(address);
      navigate(`/orders?success=${order.orderNumber}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to complete checkout');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-pure-white">Secure Checkout</h1>
        <p className="mt-1 text-xs text-pure-white/60">
          Atomic inventory verification and immediate order generation.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <strong>Order Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Shipping Address Inputs */}
        <div className="space-y-6 rounded-xl border border-white/10 bg-onyx-surface p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-pure-white">Shipping Destination</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className="input mt-1 text-xs"
                placeholder="Nikola Tesla"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="input mt-1 text-xs"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
              Address Line 1 *
            </label>
            <input
              type="text"
              required
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              className="input mt-1 text-xs"
              placeholder="Plot 42, Tech Park, Industrial Area"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
              className="input mt-1 text-xs"
              placeholder="Lab 3B, Building 5"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
                City *
              </label>
              <input
                type="text"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="input mt-1 text-xs"
                placeholder="Bengaluru"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
                State *
              </label>
              <input
                type="text"
                required
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="input mt-1 text-xs"
                placeholder="Karnataka"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
                PIN / Postal Code *
              </label>
              <input
                type="text"
                required
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                className="input mt-1 text-xs"
                placeholder="560100"
              />
            </div>
          </div>
        </div>

        {/* Order Review & Pay CTA */}
        <div className="h-fit space-y-6 rounded-xl border border-white/10 bg-onyx-surface p-6">
          <h2 className="text-base font-bold text-pure-white">Order Summary</h2>

          <div className="max-h-60 space-y-3 overflow-y-auto border-b border-white/10 pb-4 pr-1 text-xs">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between items-center text-pure-white/80">
                <span className="truncate max-w-[180px]">
                  {i.quantity}x {i.product.name}
                </span>
                <span className="font-mono">
                  {formatPrice(Number(i.product.unitPrice) * i.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-b border-white/10 pb-4 text-xs">
            <div className="flex justify-between text-pure-white/70">
              <span>Subtotal</span>
              <span className="font-mono text-pure-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-pure-white/70">
              <span>Shipping</span>
              <span className="font-mono text-pure-white">
                {shippingCost === 0 ? <span className="text-spark-lime font-bold">FREE</span> : formatPrice(shippingCost)}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm font-semibold text-pure-white">Total Amount</span>
            <span className="text-xl font-black text-spark-lime font-mono">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <button
            type="submit"
            disabled={checkout.isPending}
            className="btn-primary w-full py-3 text-sm font-bold shadow-md shadow-spark-lime/10"
          >
            {checkout.isPending ? 'Validating & Placing Order...' : 'Place SparkZ Order →'}
          </button>

          <p className="text-[10px] text-pure-white/40 text-center">
            Guaranteed atomic stock decrement. Order prefix generated as SZ-YYYY-XXXX.
          </p>
        </div>
      </form>
    </div>
  );
}
