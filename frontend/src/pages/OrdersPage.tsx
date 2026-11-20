import { useSearchParams, Link } from 'react-router-dom';
import { useOrders } from '../api/queries';
import { formatPrice, formatDate } from '../lib/format';
import { useAuth } from '../auth/useAuth';
import type { OrderStatus } from '../types/api';

const statusBadgeColor: Record<OrderStatus, string> = {
  PENDING: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  PROCESSING: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  SHIPPED: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  DELIVERED: 'border-spark-lime/40 bg-spark-lime/10 text-spark-lime',
  CANCELLED: 'border-red-500/40 bg-red-500/10 text-red-400',
};

export function OrdersPage() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const successOrderNumber = params.get('success');
  const { data: orders, isLoading } = useOrders();

  if (!session) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-pure-white">Order History</h1>
        <p className="mt-2 text-xs text-pure-white/60">
          Sign in to view your placed orders and status updates.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 text-xs font-semibold">
          Explore Catalog
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-onyx-surface animate-pulse" />
        <div className="h-32 rounded-xl bg-onyx-surface animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {successOrderNumber && (
        <div className="rounded-xl border border-spark-lime/40 bg-spark-lime/10 p-6 text-center space-y-2">
          <div className="font-mono text-2xl text-spark-lime font-bold">⚡ Order Confirmed!</div>
          <p className="text-sm text-pure-white">
            Thank you! Your order <strong className="font-mono text-spark-lime">{successOrderNumber}</strong> has been placed and stock quantities have been reserved.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pure-white">Your Orders</h1>
          <p className="mt-1 text-xs text-pure-white/60">
            Real-time status tracking and purchased component history.
          </p>
        </div>
        <span className="font-mono text-xs text-pure-white/60">
          {orders?.length ?? 0} {orders?.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-onyx-surface p-12 text-center">
          <p className="text-base font-semibold text-pure-white">You have not placed any orders yet.</p>
          <Link to="/catalog" className="btn-primary mt-4 py-1.5 text-xs font-semibold">
            Browse Electronic Components
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-white/10 bg-onyx-surface overflow-hidden transition-colors hover:border-white/20"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-onyx/50 p-4 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-pure-white/40 block">Order Number</span>
                    <span className="font-mono font-bold text-pure-white text-sm">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-pure-white/40 block">Date</span>
                    <span className="text-pure-white/80">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase ${
                      statusBadgeColor[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                  <div>
                    <span className="text-pure-white/40 block text-right">Total Amount</span>
                    <span className="font-mono font-bold text-spark-lime text-sm">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-white/5 p-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-onyx p-1">
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
                          className="font-semibold text-pure-white hover:text-spark-lime"
                        >
                          {item.product.name}
                        </Link>
                        <p className="font-mono text-pure-white/40 text-[10px]">
                          SKU: {item.product.sku} • Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-pure-white">
                      {formatPrice(Number(item.unitPriceAtPurchase) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping Address Snapshot Footer */}
              <div className="border-t border-white/5 bg-onyx/20 px-4 py-2 text-[11px] text-pure-white/50">
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
