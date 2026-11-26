import { Link } from 'react-router-dom';
import type { Product } from '../types/api';
import { formatPrice } from '../lib/format';
import { useAddToCart } from '../api/queries';
import { useAuth } from '../auth/useAuth';

interface ProductCardProps {
  product: Product;
  onRequireAuth?: () => void;
}

/**
 * ProductCard (SKILL.md B1, B2, B3, B4, B9):
 * - Outer card: rounded-2xl (16px) with p-4 (16px) or p-2 (8px) nested formula.
 *   Here outer is rounded-2xl (16px) with p-2 (8px) around the image box -> inner image box is rounded-lg (8px: 16 - 8 = 8).
 * - Borders go all the way around (border-[#28364F]), flat surface bg-[#131C2E].
 */
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
    <article className="group flex flex-col justify-between rounded-2xl border border-[#28364F] bg-[#131C2E] p-2 transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-spark-lime">
      <Link to={`/products/${product.slug}`} className="block">
        {/* Product Image Container: outer 16px radius - 8px padding = 8px (rounded-lg) */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#28364F] bg-[#1A253A]">
          <img
            src={thumbnail}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className="rounded-md border border-[#28364F] bg-[#0B111E] px-2 py-0.5 font-mono caption-4 text-pure-white/80">
              {product.manufacturer}
            </span>
          </div>

          <div className="absolute top-2 right-2">
            {inStock ? (
              <span className="rounded-md border border-spark-lime/40 bg-[#0F2537] px-2 py-0.5 font-mono caption-3 text-spark-lime">
                {product.stockQuantity} in stock
              </span>
            ) : (
              <span className="rounded-md border border-red-500/40 bg-[#131C2E] px-2 py-0.5 font-mono caption-3 text-red-400">
                Out of stock
              </span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="p-2 pt-3">
          <div className="flex items-center justify-between font-mono caption-5 text-pure-white/50">
            <span>MPN: {product.mpn}</span>
            <span>SKU: {product.sku}</span>
          </div>
          <h3 className="mt-1 line-clamp-1 title-3 text-pure-white transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-spark-lime">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 body-6 text-pure-white/60">
            {product.description}
          </p>
        </div>
      </Link>

      {/* Action & Price Footer (full all-around inner card border per B4) */}
      <div className="mt-2 flex items-center justify-between rounded-lg border border-[#28364F] bg-[#1A253A] p-3">
        <div>
          <span className="caption-5 text-pure-white/50 block">Unit price</span>
          <span className="font-mono body-1 text-pure-white">
            {formatPrice(product.unitPrice)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock || addToCart.isPending}
          className="btn-sm-primary"
        >
          {addToCart.isPending ? 'Adding...' : inStock ? 'Add to cart' : 'Sold out'}
        </button>
      </div>
    </article>
  );
}
