import { useState, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalogFilters, useProducts } from '../api/queries';
import { ProductCard } from '../components/ProductCard';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../auth/useAuth';
import type { ProductSort } from '../types/api';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();
  const { configured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const manufacturer = searchParams.get('manufacturer') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = (searchParams.get('sort') as ProductSort) || 'newest';
  const page = Number(searchParams.get('page') ?? '1');

  const { data: filtersData } = useCatalogFilters();
  const { data, isLoading } = useProducts({
    search: search || undefined,
    category: category || undefined,
    manufacturer: manufacturer || undefined,
    inStock: inStock ? true : undefined,
    sort,
    page,
    pageSize: 16,
  });

  const updateParam = (key: string, value: string | null) => {
    startTransition(() => {
      const next = new URLSearchParams(searchParams);
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      if (key !== 'page') {
        next.delete('page');
      }
      setSearchParams(next);
    });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pure-white">Component Catalog</h1>
          <p className="mt-1 text-xs text-pure-white/60">
            {data ? `${data.total} components indexed across all categories` : 'Loading components...'}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search SKU, MPN, or name..."
            className="input pr-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => updateParam('search', null)}
              className="absolute right-2.5 top-2.5 text-xs text-pure-white/40 hover:text-pure-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <aside className="space-y-6 rounded-xl border border-white/10 bg-onyx-surface p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-pure-white">Filters</h3>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-spark-lime hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* In-Stock Toggle */}
          <div>
            <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-pure-white">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
                className="h-4 w-4 rounded border-white/20 bg-onyx accent-spark-lime"
              />
              In-Stock Only
            </label>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/50">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value || null)}
              className="input mt-1.5 text-xs"
            >
              <option value="">All Categories</option>
              {filtersData?.categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/50">
              Manufacturer
            </label>
            <select
              value={manufacturer}
              onChange={(e) => updateParam('manufacturer', e.target.value || null)}
              className="input mt-1.5 text-xs"
            >
              <option value="">All Manufacturers</option>
              {filtersData?.manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/50">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input mt-1.5 text-xs"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl border border-white/5 bg-onyx-surface" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onRequireAuth={() => setAuthOpen(true)}
                  />
                ))}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <span className="font-mono text-xs text-pure-white/60">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-onyx-surface p-12 text-center">
              <p className="text-base font-semibold text-pure-white">No components matched your filters.</p>
              <p className="mt-1 text-xs text-pure-white/60">
                Try clearing search terms or expanding manufacturer categories.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="btn-primary mt-4 py-1.5 text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {authOpen && (
        <AuthModal
          configured={configured}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}
