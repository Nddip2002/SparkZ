import { useState, useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
    <div className="space-y-8 pb-20 pt-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Link to="/" className="caption-4 text-spark-lime hover:underline">
            ← Back to overview
          </Link>
          <h1 className="heading-3 text-pure-white">Component catalog</h1>
          <p className="caption-2 text-pure-white/60">
            {data
              ? `${data.total} verified components indexed across all categories`
              : 'Loading verified inventory...'}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <label htmlFor="catalog-search" className="skip-link">
            Search SKU, MPN, or component name
          </label>
          <input
            id="catalog-search"
            type="search"
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search SKU, MPN, or name..."
            className="input pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => updateParam('search', null)}
              aria-label="Clear search query"
              className="absolute right-3 top-2.5 caption-3 text-pure-white/50 hover:text-pure-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <aside
          aria-label="Catalog filters"
          className="h-fit space-y-6 rounded-2xl border border-[#28364F] bg-[#131C2E] p-6"
        >
          <div className="flex items-center justify-between rounded-lg border border-[#28364F] bg-[#1A253A] p-3">
            <h2 className="title-4 text-pure-white">Filters</h2>
            <button
              type="button"
              onClick={clearFilters}
              className="caption-3 text-spark-lime hover:underline"
            >
              Reset all
            </button>
          </div>

          {/* In-Stock Toggle */}
          <div>
            <label className="flex cursor-pointer items-center gap-3 title-4 text-pure-white">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
                className="h-4 w-4 rounded border-[#28364F] bg-[#0B111E] accent-spark-lime"
              />
              In stock only
            </label>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label
              htmlFor="filter-category"
              className="block caption-3 uppercase tracking-wider text-pure-white/60"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => updateParam('category', e.target.value || null)}
              className="input"
            >
              <option value="">All categories</option>
              {filtersData?.categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div className="space-y-2">
            <label
              htmlFor="filter-manufacturer"
              className="block caption-3 uppercase tracking-wider text-pure-white/60"
            >
              Manufacturer
            </label>
            <select
              id="filter-manufacturer"
              value={manufacturer}
              onChange={(e) => updateParam('manufacturer', e.target.value || null)}
              className="input"
            >
              <option value="">All manufacturers</option>
              {filtersData?.manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selection */}
          <div className="space-y-2">
            <label
              htmlFor="filter-sort"
              className="block caption-3 uppercase tracking-wider text-pure-white/60"
            >
              Sort order
            </label>
            <select
              id="filter-sort"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input"
            >
              <option value="newest">Newest arrivals</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name_asc">Alphabetical (A to Z)</option>
            </select>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]"
                />
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
                <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#28364F] bg-[#131C2E] p-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                    className="btn-ghost"
                  >
                    ← Previous
                  </button>

                  <span className="font-mono caption-2 text-pure-white/70">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                    className="btn-ghost"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-12 text-center space-y-3">
              <p className="title-1 text-pure-white">No components matched your filters.</p>
              <p className="body-6 text-pure-white/60">
                Clear active search terms or broaden your manufacturer filter to view available silicon.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Reset filters
                </button>
              </div>
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
