import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthProvider';
import { ChipCoreBackground } from './components/ChipCoreBackground';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LegalPage } from './pages/LegalPage';

// Lazy-load heavy routes per architectural guidelines
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Skeleton Loader shaped like the real layout (SKILL.md B9: never circular spinners) */
function LoadingFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-12">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-[#131C2E]" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E] md:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]" />
      </div>
    </div>
  );
}

export default function App() {
  const [bgPaused, setBgPaused] = useState<boolean>(false);

  const toggleBgPaused = () => {
    setBgPaused((prev) => !prev);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="relative flex min-h-dvh flex-col bg-[#0B111E] text-pure-white selection:bg-spark-lime selection:text-[#0B111E]">
            {/* Skip to main content link for keyboard users (SKILL.md B10) */}
            <a
              href="#main-content"
              className="skip-link fixed top-4 left-4 z-50 rounded-lg bg-spark-lime px-3 py-2 button-sm text-[#0B111E]"
            >
              Skip to main content
            </a>

            <ChipCoreBackground paused={bgPaused} />
            <CustomCursor />
            <Navbar />

            <main
              id="main-content"
              tabIndex={-1}
              className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8 focus:outline-none"
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/products/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/privacy" element={<LegalPage type="privacy" />} />
                  <Route path="/terms" element={<LegalPage type="terms" />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>

            <Footer bgPaused={bgPaused} onToggleBgPaused={toggleBgPaused} />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
