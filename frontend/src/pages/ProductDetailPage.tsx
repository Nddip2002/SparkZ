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
        <div className="h-8 w-48 rounded-lg bg-[#131C2E]" />
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="aspect-square rounded-2xl border border-[#28364F] bg-[#131C2E]" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded-lg bg-[#131C2E]" />
            <div className="h-6 w-1/3 rounded-lg bg-[#131C2E]" />
            <div className="h-32 rounded-2xl bg-[#131C2E]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[680px] py-16 text-center space-y-4">
        <h1 className="heading-4 text-pure-white">Component not found</h1>
        <p className="body-6 text-pure-white/60">
          The requested part may have been archived or the URL slug is invalid.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="btn-primary">
            Return to catalog
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stockQuantity > 0;
  const maxPurchase = Math.min(product.stockQuantity, 99);
  const images =
    product.imageUrls.length > 0
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
    <div className="space-y-12 pb-20 pt-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono caption-4 text-pure-white/60">
        <Link to="/" className="hover:text-spark-lime">Overview</Link>
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
        {/* Left: Gallery (outer rounded-2xl 16px, p-2 8px -> inner rounded-lg 8px) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#28364F] bg-[#1A253A] p-8">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-contain"
              />
              <div className="absolute top-4 left-4">
                <span className="rounded-md border border-[#28364F] bg-[#0B111E] px-2 py-1 font-mono caption-3 text-spark-lime">
                  {product.manufacturer}
                </span>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  aria-label={`View product image ${idx + 1}`}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-[#131C2E] p-2 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    selectedImage === idx ? 'border-spark-lime' : 'border-[#28364F] hover:border-pure-white/40'
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
            <div className="flex flex-wrap items-center gap-3 font-mono caption-4 text-pure-white/70">
              <span className="rounded-lg border border-[#28364F] bg-[#131C2E] px-3 py-1">
                MPN: <strong className="text-pure-white">{product.mpn}</strong>
              </span>
              <span className="rounded-lg border border-[#28364F] bg-[#131C2E] px-3 py-1">
                SKU: <strong className="text-pure-white">{product.sku}</strong>
              </span>
            </div>

            <h1 className="heading-3 text-pure-white">
              {product.name}
            </h1>

            <p className="body-3 text-pure-white/75 whitespace-pre-line">
              {product.description}
            </p>

            {product.datasheetUrl && (
              <a
                href={product.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                {/* Phosphor FilePdf Icon */}
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-4 w-4 fill-current text-spark-lime">
                  <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM152,88V44l44,44Z" />
                </svg>
                <span>Open manufacturer datasheet (PDF)</span>
              </a>
            )}
          </div>

          {/* Pricing & Add to Cart Box */}
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-6">
            <div className="flex items-baseline justify-between rounded-lg border border-[#28364F] bg-[#1A253A] p-4">
              <div>
                <span className="caption-4 text-pure-white/50 block">Unit price</span>
                <span className="font-mono heading-4 text-pure-white">
                  {formatPrice(product.unitPrice)}
                </span>
              </div>

              <div>
                {inStock ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-spark-lime/40 bg-[#0F2537] px-3 py-1 font-mono caption-3 text-spark-lime">
                    <span className="h-2 w-2 rounded-full bg-spark-lime" />
                    {product.stockQuantity} in stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-[#131C2E] px-3 py-1 font-mono caption-3 text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Out of stock
                  </span>
                )}
              </div>
            </div>

            {inStock && (
              <div className="flex items-center gap-4">
                <span className="caption-3 uppercase text-pure-white/60">
                  Quantity
                </span>
                <div className="inline-flex items-center rounded-lg border border-[#28364F] bg-[#1A253A]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="px-3 py-2 button-sm text-pure-white/70 hover:text-pure-white disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center font-mono body-4 text-pure-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxPurchase, q + 1))}
                    disabled={quantity >= maxPurchase}
                    aria-label="Increase quantity"
                    className="px-3 py-2 button-sm text-pure-white/70 hover:text-pure-white disabled:opacity-30"
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
              className="btn-primary w-full"
            >
              {addToCart.isPending
                ? 'Updating cart...'
                : !session
                ? 'Sign in to purchase'
                : inStock
                ? `Add ${quantity} to cart · ${formatPrice(Number(product.unitPrice) * quantity)}`
                : 'Currently unavailable'}
            </button>

            {addToCart.isSuccess && (
              <p className="text-center font-mono caption-3 text-spark-lime">
                Added to cart. <Link to="/cart" className="underline">View cart</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Specifications Table (30% Pure White Surface for maximum contrast per AGENTS.md) */}
      <section className="space-y-4 pt-8">
        <h2 className="heading-5 text-pure-white">Technical specifications (JSONB)</h2>
        {specs.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#28364F] bg-pure-white text-[#0B111E]">
            <table className="w-full text-left">
              <caption className="skip-link">
                Technical parameters and specifications for {product.name}
              </caption>
              <thead className="bg-off-white font-mono caption-3 uppercase tracking-wider text-[#0B111E]/70">
                <tr>
                  <th scope="col" className="py-3 px-4">Parameter</th>
                  <th scope="col" className="py-3 px-4">Specification value</th>
                </tr>
              </thead>
              <tbody className="font-mono body-5">
                {specs.map(([key, val]) => (
                  <tr key={key} className="even:bg-off-white/60">
                    <th scope="row" className="py-3 px-4 font-medium text-[#0B111E]/80 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </th>
                    <td className="py-3 px-4 font-semibold text-[#0B111E]">
                      {String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="caption-2 text-pure-white/50">
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
