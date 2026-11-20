import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, useAddToCart } from '../api/queries';
import { formatPrice } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import { AuthModal } from '../components/AuthModal';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { session, configured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, error } = useProduct(slug);
  const addToCart = useAddToCart();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-8 py-8">
        <div className="h-8 w-48 rounded bg-onyx-surface" />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="aspect-square rounded-xl bg-onyx-surface" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-onyx-surface" />
            <div className="h-6 w-1/3 rounded bg-onyx-surface" />
            <div className="h-32 rounded bg-onyx-surface" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="text-xl font-bold text-pure-white">Component Not Found</h2>
        <p className="mt-2 text-xs text-pure-white/60">
          The requested part may have been decommissioned or the URL slug is invalid.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 text-xs font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const inStock = product.stockQuantity > 0;
  const maxPurchase = Math.min(product.stockQuantity, 99);
  const images = product.imageUrls.length > 0
    ? product.imageUrls
    : ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'];

  const handleAddToCart = async () => {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    if (!inStock) return;
    await addToCart.mutateAsync({ productId: product.id, quantity });
  };

  const specs = Object.entries(product.specifications || {});

  return (
    <div className="space-y-12 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-pure-white/50">
        <Link to="/" className="hover:text-spark-lime">Home</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-spark-lime">Catalog</Link>
        <span>/</span>
        <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-spark-lime">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-pure-white truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-onyx-surface p-8">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="h-full w-full object-contain"
            />
            <div className="absolute top-4 left-4">
              <span className="rounded bg-onyx/90 px-2.5 py-1 font-mono text-xs uppercase text-spark-lime border border-spark-lime/30">
                {product.manufacturer}
              </span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-onyx-surface p-2 transition-colors ${
                    selectedImage === idx ? 'border-spark-lime' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Buy Box */}
        <div className="flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-pure-white/60">
              <span className="rounded border border-white/10 bg-onyx-surface px-2 py-0.5">
                MPN: <strong className="text-pure-white">{product.mpn}</strong>
              </span>
              <span className="rounded border border-white/10 bg-onyx-surface px-2 py-0.5">
                SKU: <strong className="text-pure-white">{product.sku}</strong>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-pure-white sm:text-4xl">
              {product.name}
            </h1>

            <p className="text-sm text-pure-white/70 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {product.datasheetUrl && (
              <a
                href={product.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-onyx-surface px-3 py-2 text-xs font-medium text-spark-lime transition-colors hover:border-spark-lime hover:bg-spark-lime/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Official Datasheet (PDF) ↗
              </a>
            )}
          </div>

          {/* Pricing & Add to Cart Box */}
          <div className="rounded-xl border border-white/10 bg-onyx-surface p-6 space-y-6">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs text-pure-white/40 block">Unit Price (excl. tax)</span>
                <span className="text-3xl font-black text-pure-white">
                  {formatPrice(product.unitPrice)}
                </span>
              </div>

              <div>
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-spark-lime/40 bg-spark-lime/10 px-3 py-1 font-mono text-xs font-bold text-spark-lime">
                    <span className="h-2 w-2 rounded-full bg-spark-lime" />
                    {product.stockQuantity} in stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 font-mono text-xs font-bold text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {inStock && (
              <div className="flex items-center gap-4">
                <label className="text-xs font-medium uppercase text-pure-white/60">
                  Quantity:
                </label>
                <div className="flex items-center rounded-lg border border-white/15 bg-onyx">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-pure-white/70 hover:text-pure-white disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center font-mono text-sm font-semibold text-pure-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxPurchase, q + 1))}
                    disabled={quantity >= maxPurchase}
                    className="px-3 py-1.5 text-pure-white/70 hover:text-pure-white disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock || addToCart.isPending}
              className="btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-spark-lime/10"
            >
              {addToCart.isPending
                ? 'Updating Cart...'
                : !session
                ? 'Sign In to Purchase'
                : inStock
                ? `Add ${quantity} to Cart • ${formatPrice(Number(product.unitPrice) * quantity)}`
                : 'Currently Unavailable'}
            </button>

            {addToCart.isSuccess && (
              <p className="text-center font-mono text-xs text-spark-lime">
                ✓ Added to cart! <Link to="/cart" className="underline font-bold">Go to Cart</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Table (30% Pure White Surface for maximum contrast) */}
      <section className="space-y-4 pt-8">
        <h2 className="text-xl font-bold text-pure-white">Technical Specifications (JSONB)</h2>
        {specs.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-pure-white text-onyx shadow-md">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-black/10 bg-off-white font-mono uppercase tracking-wider text-onyx/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Parameter / Attribute</th>
                  <th className="py-3 px-4 font-semibold">Specification Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-mono">
                {specs.map(([key, val]) => (
                  <tr key={key} className="hover:bg-off-white/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-onyx/80 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-onyx">
                      {String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-pure-white/50">
            No dynamic specifications recorded for this component.
          </p>
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
