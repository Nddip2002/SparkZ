import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../api/queries';
import { ProductCard } from '../components/ProductCard';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../auth/useAuth';

export function HomePage() {
  const { configured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const { data: featured, isLoading } = useProducts({ pageSize: 8 });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-onyx-surface p-8 sm:p-12 lg:p-16">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-spark-lime/40 bg-spark-lime/10 px-3 py-1 font-mono text-xs font-semibold text-spark-lime">
            <span>⚡ NEXT-GEN SILICON HARDWARE</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-pure-white sm:text-5xl lg:text-6xl">
            Precision Electronics for Builders & Systems Engineers.
          </h1>
          <p className="text-base text-pure-white/70 sm:text-lg">
            High-grade microcontrollers, low-dropout regulators, inertial measurement units, and passives. Every item backed by full datasheets and atomic inventory tracking.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/catalog" className="btn-primary text-sm font-bold">
              Explore Catalog →
            </Link>
            <Link to="/catalog?inStock=true" className="btn-ghost text-sm">
              In-Stock Components
            </Link>
          </div>
        </div>

        {/* Decorative Grid Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-spark-lime/10 blur-3xl" />
      </section>

      {/* Value Propositions */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-onyx-surface p-6">
          <div className="font-mono text-2xl text-spark-lime">01 // DATA</div>
          <h3 className="mt-2 text-base font-bold text-pure-white">Datasheets & JSON Specs</h3>
          <p className="mt-1 text-xs text-pure-white/60">
            Query components by exact pin pitch, supply voltage, bus protocols, and operating temp.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-onyx-surface p-6">
          <div className="font-mono text-2xl text-spark-lime">02 // STOCK</div>
          <h3 className="mt-2 text-base font-bold text-pure-white">Zero Overselling</h3>
          <p className="mt-1 text-xs text-pure-white/60">
            Atomic transactions guarantee that stock numbers in your cart are locked and verified at checkout.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-onyx-surface p-6">
          <div className="font-mono text-2xl text-spark-lime">03 // SPEED</div>
          <h3 className="mt-2 text-base font-bold text-pure-white">Edge-Cached Catalog</h3>
          <p className="mt-1 text-xs text-pure-white/60">
            Sub-millisecond navigation powered by React Query, Tailwind v4 and NestJS memory caching.
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-pure-white">Featured Components</h2>
            <p className="text-xs text-pure-white/60">Popular microcontrollers, sensors, and development essentials.</p>
          </div>
          <Link to="/catalog" className="text-xs font-semibold text-spark-lime hover:underline">
            View All ({featured?.total ?? 0}) →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-white/5 bg-onyx-surface" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured?.items.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onRequireAuth={() => setAuthOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      {authOpen && (
        <AuthModal
          configured={configured}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}
