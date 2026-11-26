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
      <div className="mx-auto max-w-[680px] py-16 text-center space-y-4">
        <h1 className="heading-3 text-pure-white">Checkout</h1>
        <p className="body-6 text-pure-white/60">
          Sign in to verify your cart inventory and place an order.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="btn-primary">
            Return to catalog
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#131C2E]" />
        <div className="h-64 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]" />
      </div>
    );
  }

  const items = cart?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[680px] py-16 text-center space-y-4">
        <h1 className="heading-3 text-pure-white">Your cart is empty</h1>
        <p className="body-6 text-pure-white/60">
          Add components from the catalog before proceeding to checkout.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="btn-primary">
            Browse live catalog
          </Link>
        </div>
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
      setError((err as Error).message || 'Checkout failed. Please review your shipping details and try again.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 pt-6">
      <div className="space-y-1">
        <Link to="/cart" className="caption-4 text-spark-lime hover:underline">
          ← Back to shopping cart
        </Link>
        <h1 className="heading-3 text-pure-white">Secure checkout</h1>
        <p className="caption-2 text-pure-white/60">
          Atomic inventory verification and immediate order number assignment.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/40 bg-[#131C2E] p-4 body-5 text-red-400"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Shipping Address Inputs */}
        <div className="space-y-6 rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 lg:col-span-2">
          <h2 className="title-1 text-pure-white">Shipping destination</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="ship-name" className="block caption-3 uppercase tracking-wider text-pure-white/60">
                Full name
              </label>
              <input
                id="ship-name"
                type="text"
                required
                autoComplete="name"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className="input"
                placeholder="Nikola Tesla"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ship-phone" className="block caption-3 uppercase tracking-wider text-pure-white/60">
                Phone number
              </label>
              <input
                id="ship-phone"
                type="tel"
                required
                autoComplete="tel"
                pattern="^\+?[0-9\s-]{7,20}$"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="input"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="ship-line1" className="block caption-3 uppercase tracking-wider text-pure-white/60">
              Address line 1
            </label>
            <input
              id="ship-line1"
              type="text"
              required
              autoComplete="address-line1"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              className="input"
              placeholder="Plot 42, Tech Park, Industrial Area"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ship-line2" className="block caption-3 uppercase tracking-wider text-pure-white/60">
              Address line 2 (optional)
            </label>
            <input
              id="ship-line2"
              type="text"
              autoComplete="address-line2"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
              className="input"
              placeholder="Lab 3B, Building 5"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="ship-city" className="block caption-3 uppercase tracking-wider text-pure-white/60">
                City
              </label>
              <input
                id="ship-city"
                type="text"
                required
                autoComplete="address-level2"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="input"
                placeholder="Bengaluru"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ship-state" className="block caption-3 uppercase tracking-wider text-pure-white/60">
                State
              </label>
              <input
                id="ship-state"
                type="text"
                required
                autoComplete="address-level1"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="input"
                placeholder="Karnataka"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ship-postal" className="block caption-3 uppercase tracking-wider text-pure-white/60">
                Postal code
              </label>
              <input
                id="ship-postal"
                type="text"
                required
                autoComplete="postal-code"
                pattern="^[A-Za-z0-9\s-]{3,12}$"
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                className="input"
                placeholder="560100"
              />
            </div>
          </div>
        </div>

        {/* Order Review & Pay CTA */}
        <div className="h-fit space-y-6 rounded-2xl border border-[#28364F] bg-[#131C2E] p-6">
          <h2 className="title-1 text-pure-white">Order review</h2>

          <div className="max-h-60 space-y-3 overflow-y-auto rounded-lg border border-[#28364F] bg-[#1A253A] p-4">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between items-center gap-2 caption-2 text-pure-white/80">
                <span className="truncate">
                  {i.quantity}x {i.product.name}
                </span>
                <span className="font-mono text-pure-white">
                  {formatPrice(Number(i.product.unitPrice) * i.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-[#28364F] bg-[#1A253A] p-4">
            <div className="flex justify-between caption-2 text-pure-white/70">
              <span>Subtotal</span>
              <span className="font-mono text-pure-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between caption-2 text-pure-white/70">
              <span>Shipping</span>
              <span className="font-mono text-pure-white">
                {shippingCost === 0 ? <span className="text-spark-lime">FREE</span> : formatPrice(shippingCost)}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="title-3 text-pure-white">Total amount</span>
            <span className="font-mono heading-5 text-spark-lime">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <button
            type="submit"
            disabled={checkout.isPending}
            className="btn-primary w-full"
          >
            {checkout.isPending ? 'Locking inventory and placing order...' : 'Place SparkZ order'}
          </button>

          <p className="caption-5 text-pure-white/50 text-center">
            Atomic stock decrement inside PostgreSQL transaction.
          </p>
        </div>
      </form>
    </div>
  );
}
