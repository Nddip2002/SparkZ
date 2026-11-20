import { Link } from 'react-router-dom';
import type { Product } from '../types/api';
import { formatPrice } from '../lib/format';
import { useAddToCart } from '../api/queries';
import { useAuth } from '../auth/useAuth';

interface ProductCardProps {
  product: Product;
  onRequireAuth?: () => void;
}

export function ProductCard({ product, onRequireAuth }: ProductCardProps) {
  const { session } = useAuth();
  const addToCart = useAddToCart();
  const inStock = product.stockQuantity > 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      onRequireAuth?.();
      return;
    }
    if (!inStock || addToCart.isPending) return;
    await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
  };

  const thumbnail =
    product.imageUrls.length > 0
      ? product.imageUrls[0]
      : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80';

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-white/10 bg-onyx-surface p-4 transition-all hover:border-spark-lime/50 hover:shadow-lg hover:shadow-spark-lime/5">
      <Link to={`/products/${product.slug}`} className="block">
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-onyx/80">
          <img
            src={thumbnail}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className="rounded bg-onyx/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-pure-white/80">
              {product.manufacturer}
            </span>
          </div>

          <div className="absolute top-2 right-2">
            {inStock ? (
              <span className="rounded-full bg-spark-lime/20 border border-spark-lime/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-spark-lime">
                {product.stockQuantity} in stock
              </span>
            ) : (
              <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-400">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-mono text-pure-white/50">
            <span>MPN: {product.mpn}</span>
            <span>SKU: {product.sku}</span>
          </div>
          <h3 className="mt-1 line-clamp-1 font-semibold text-pure-white group-hover:text-spark-lime">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-pure-white/60">
            {product.description}
          </p>
        </div>
      </Link>

      {/* Action & Price Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div>
          <span className="text-xs text-pure-white/40 block">Unit Price</span>
          <span className="text-base font-bold text-pure-white">
            {formatPrice(product.unitPrice)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock || addToCart.isPending}
          className="btn-primary px-3 py-1.5 text-xs font-bold"
          title={!session ? 'Sign in to add to cart' : 'Add 1 to cart'}
        >
          {addToCart.isPending ? 'Adding...' : inStock ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
    </div>
  );
}
