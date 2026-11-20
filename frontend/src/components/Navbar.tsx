import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useCart, useMe } from '../api/queries';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const { session, signOut, configured } = useAuth();
  const { data: me } = useMe();
  const { data: cart } = useCart();
  const [authOpen, setAuthOpen] = useState(false);

  const cartCount = cart?.itemCount ?? 0;
  const isAdmin = me?.role === 'ADMIN';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-onyx/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-spark-lime font-mono text-lg font-black text-onyx shadow-sm transition-transform group-hover:scale-105">
              ⚡
            </span>
            <span className="text-xl font-bold tracking-tight text-pure-white">
              Spark<span className="text-spark-lime">Z</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-spark-lime ${
                  isActive ? 'text-spark-lime' : 'text-pure-white/80'
                }`
              }
            >
              Catalog
            </NavLink>

            {session && (
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-spark-lime ${
                    isActive ? 'text-spark-lime' : 'text-pure-white/80'
                  }`
                }
              >
                Orders
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-md border border-spark-lime/40 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase transition-colors hover:bg-spark-lime hover:text-onyx ${
                    isActive ? 'bg-spark-lime text-onyx' : 'text-spark-lime'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Cart Link */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-onyx-surface px-3 py-2 text-sm font-medium text-pure-white transition-colors hover:border-spark-lime/60 hover:text-spark-lime"
              aria-label="View Shopping Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-spark-lime px-1.5 text-xs font-bold text-onyx">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Button */}
            {session ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-pure-white/60 md:inline">
                  {me?.fullName || session.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-lg border border-white/10 bg-onyx-surface px-3 py-2 text-xs font-medium text-pure-white/80 transition-colors hover:border-white/30 hover:text-pure-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="btn-primary py-1.5 text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {authOpen && (
        <AuthModal
          configured={configured}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </>
  );
}
