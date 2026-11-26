import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useCart, useMe } from '../api/queries';
import { AuthModal } from './AuthModal';

/**
 * Floating Navigation Bar (SKILL.md B7):
 * - Resting state: compact bar that floats off the top edge, centered and sized to its content,
 *   translucent surface over background blur.
 * - Menu toggle: open/close icon transforms between its two states on cubic-bezier(0.22,1,0.36,1).
 * - Mobile menu: opens as a full-height panel with staggered link entrance (60ms steps, 24px rise).
 */
export function Navbar() {
  const { session, signOut, configured } = useAuth();
  const { data: me } = useMe();
  const { data: cart } = useCart();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = cart?.itemCount ?? 0;
  const isAdmin = me?.role === 'ADMIN';

  const navItems = [
    { to: '/', label: 'Overview', end: true },
    { to: '/catalog', label: 'Catalog', end: false },
    ...(session ? [{ to: '/orders', label: 'Orders', end: false }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', end: false }] : []),
  ];

  return (
    <>
      <header className="sticky top-4 z-40 mx-auto flex w-full max-w-5xl justify-center px-4">
        <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#28364F] bg-[#131C2E]/90 px-4 py-2 backdrop-blur-md">
          {/* Brand Logo */}
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-spark-lime font-mono text-sm font-semibold text-[#0B111E] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
              SZ
            </span>
            <span className="title-2 text-pure-white">
              Spark<span className="text-spark-lime">Z</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `title-4 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime ${
                    isActive ? 'text-spark-lime' : 'text-pure-white/80'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Cart Link */}
            <NavLink
              to="/cart"
              aria-label="View shopping cart"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg border px-3 py-2 button-sm transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ${
                  isActive
                    ? 'border-spark-lime bg-[#1A253A] text-spark-lime'
                    : 'border-[#28364F] bg-[#1A253A] text-pure-white hover:border-spark-lime hover:text-spark-lime'
                }`
              }
            >
              {/* Phosphor Bag Icon */}
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="h-4 w-4 fill-current"
              >
                <path d="M216,64H176a48,48,0,0,0-96,0H40A16,16,0,0,0,24,80V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64ZM128,32a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm88,168H40V80H80v16a8,8,0,0,0,16,0V80h64v16a8,8,0,0,0,16,0V80h40Z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-spark-lime px-1 font-mono caption-3 text-[#0B111E]">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {/* Auth Button */}
            {session ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="caption-2 text-pure-white/70 max-w-36 truncate">
                  {me?.fullName || session.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="btn-ghost"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="btn-sm-primary"
              >
                Sign in
              </button>
            )}

            {/* Mobile Menu Toggle (SKILL.md B7 transforming lines) */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-[#28364F] bg-[#1A253A] text-pure-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-spark-lime"
            >
              <span className="relative flex h-4 w-4 flex-col justify-between">
                <span
                  className={`block h-0.5 w-4 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen ? 'translate-y-[7px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 bg-current transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen ? '-translate-y-[7px] -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Height Mobile Menu Panel (SKILL.md B7) */}
      <div
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-30 md:hidden bg-[#0B111E]/95 backdrop-blur-xl transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav
          aria-label="Mobile navigation"
          className="flex h-full flex-col justify-between px-6 pt-24 pb-12"
        >
          <div className="flex flex-col gap-6">
            {navItems.map((item, idx) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                style={{ transitionDelay: mobileOpen ? `${Math.min(idx * 60, 400)}ms` : '0ms' }}
                className={({ isActive }) =>
                  `heading-4 transition-[transform,opacity,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  } ${isActive ? 'text-spark-lime' : 'text-pure-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[#28364F] bg-[#131C2E] p-4">
            {session ? (
              <>
                <p className="caption-1 text-pure-white/70">
                  Signed in as {me?.fullName || session.user.email}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="btn-ghost w-full"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setAuthOpen(true);
                }}
                className="btn-primary w-full"
              >
                Sign in to SparkZ
              </button>
            )}
          </div>
        </nav>
      </div>

      {authOpen && (
        <AuthModal
          configured={configured}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </>
  );
}
