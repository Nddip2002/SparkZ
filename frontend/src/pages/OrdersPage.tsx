import { useSearchParams, Link } from 'react-router-dom';
import { useOrders } from '../api/queries';
import { formatPrice, formatDate } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import type { OrderStatus } from '../types/api';

const statusBadgeColor: Record<OrderStatus, string> = {
  PENDING: 'border-yellow-500/40 bg-[#0F2537] text-yellow-400',
  PROCESSING: 'border-blue-500/40 bg-[#131C2E] text-blue-400',
  SHIPPED: 'border-purple-500/40 bg-[#131C2E] text-purple-400',
  DELIVERED: 'border-spark-lime/40 bg-[#0F2537] text-spark-lime',
  CANCELLED: 'border-red-500/40 bg-[#131C2E] text-red-400',
};

export function OrdersPage() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const successOrderNumber = params.get('success');
  const { data: orders, isLoading } = useOrders();

  if (!session) {
    return (
      <div className="mx-auto max-w-[680px] py-16 text-center space-y-4">
        <h1 className="heading-3 text-pure-white">Order history</h1>
        <p className="body-6 text-pure-white/60">
          Sign in to view your placed component orders and fulfillment status updates.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="btn-primary">
            Browse live catalog
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#131C2E]" />
        <div className="h-32 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 pt-6">
      {successOrderNumber && (
        <div
          role="status"
          className="rounded-2xl border border-spark-lime/40 bg-[#0F2537] p-6 text-center space-y-2"
        >
          <p className="font-mono title-2 text-spark-lime">Order confirmed</p>
          <p className="body-5 text-pure-white">
            Order <strong className="font-mono text-spark-lime">{successOrderNumber}</strong> has been created and stock quantities are locked.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Link to="/catalog" className="caption-4 text-spark-lime hover:underline">
            ← Back to catalog
          </Link>
          <h1 className="heading-3 text-pure-white">Your orders</h1>
          <p className="caption-2 text-pure-white/60">
            Live fulfillment tracking and immutable purchase history.
          </p>
        </div>
        <span className="font-mono caption-2 text-pure-white/60">
          {orders?.length ?? 0} {orders?.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-12 text-center space-y-4">
          <p className="title-1 text-pure-white">You have not placed any orders yet.</p>
          <Link to="/catalog" className="btn-primary">
            Browse live catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-4 space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#28364F] bg-[#1A253A] p-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="caption-5 text-pure-white/50 block">Order number</span>
                    <span className="font-mono body-4 text-pure-white">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="caption-5 text-pure-white/50 block">Date</span>
                    <span className="caption-2 text-pure-white/80">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-md border px-2 py-1 font-mono caption-3 uppercase ${
                      statusBadgeColor[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                  <div>
                    <span className="caption-5 text-pure-white/50 block text-right">Total amount</span>
                    <span className="font-mono body-4 text-spark-lime">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#28364F] bg-[#1A253A] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-[#28364F] bg-[#131C2E] p-1">
                        <img
                          src={
                            item.product.imageUrls[0] ||
                            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&q=80'
                          }
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div>
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="title-4 text-pure-white hover:text-spark-lime"
                        >
                          {item.product.name}
                        </Link>
                        <p className="font-mono caption-5 text-pure-white/50">
                          SKU: {item.product.sku} · Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono caption-1 text-pure-white">
                      {formatPrice(Number(item.unitPriceAtPurchase) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping Address Snapshot Footer */}
              <div className="rounded-lg border border-[#28364F] bg-[#1A253A] px-4 py-2 caption-5 text-pure-white/60">
                Shipped to: {order.shippingAddress.fullName}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
