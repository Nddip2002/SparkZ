import { useState } from 'react';
import {
  useAdminProducts,
  useAdminOrders,
  useCreateProduct,
  useUpdateInventory,
  useUpdateOrderStatus,
  useDeleteProduct,
  useMe,
} from '../api/queries';
import { formatPrice, formatDate } from '../lib/format';
import type { OrderStatus, ProductInput } from '../types/api';

const initialProductInput: ProductInput = {
  sku: '',
  mpn: '',
  category: 'Microcontrollers',
  subcategory: 'ARM Cortex',
  manufacturer: 'STMicroelectronics',
  name: '',
  slug: '',
  description: '',
  unitPrice: 299,
  stockQuantity: 50,
  imageUrls: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80'],
  datasheetUrl: '',
  specifications: { architecture: 'ARM Cortex-M4', clock_speed: '84MHz', flash: '512KB' },
  isActive: true,
};

export default function AdminPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProd, setNewProd] = useState<ProductInput>(initialProductInput);

  const { data: products, isLoading: productsLoading } = useAdminProducts();
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();

  const createProduct = useCreateProduct();
  const updateInventory = useUpdateInventory();
  const updateStatus = useUpdateOrderStatus();
  const deleteProduct = useDeleteProduct();

  if (meLoading) {
    return <div className="py-16 text-center text-pure-white/60">Verifying administrator privileges...</div>;
  }

  if (me?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-red-400">Access Restricted</h1>
        <p className="mt-2 text-xs text-pure-white/60">
          Administrator privileges are required to view and modify inventory and orders.
        </p>
      </div>
    );
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync(newProd);
    setShowCreateModal(false);
    setNewProd(initialProductInput);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-pure-white">Admin Dashboard</h1>
            <span className="rounded-md bg-spark-lime px-2 py-0.5 font-mono text-xs font-bold text-onyx">
              ADMIN
            </span>
          </div>
          <p className="mt-1 text-xs text-pure-white/60">
            Live catalog management, inventory levels, and order fulfillment.
          </p>
        </div>

        {tab === 'products' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2 text-xs font-bold"
          >
            + Create New Component
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            tab === 'products'
              ? 'border-b-2 border-spark-lime text-spark-lime'
              : 'text-pure-white/60 hover:text-pure-white'
          }`}
        >
          Products & Inventory ({products?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            tab === 'orders'
              ? 'border-b-2 border-spark-lime text-spark-lime'
              : 'text-pure-white/60 hover:text-pure-white'
          }`}
        >
          Customer Orders ({orders?.length ?? 0})
        </button>
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-onyx-surface">
          {productsLoading ? (
            <div className="p-8 text-center text-xs text-pure-white/60">Loading products...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-onyx font-mono text-pure-white/50 uppercase">
                <tr>
                  <th className="py-3 px-4">Component</th>
                  <th className="py-3 px-4">SKU / MPN</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products?.map((prod) => (
                  <tr key={prod.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-pure-white">{prod.name}</div>
                      <div className="text-[11px] text-pure-white/50">{prod.manufacturer} • {prod.category}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-pure-white/70">
                      <div>{prod.sku}</div>
                      <div className="text-[10px] text-pure-white/40">{prod.mpn}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-pure-white font-bold">
                      {formatPrice(prod.unitPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={prod.stockQuantity}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== prod.stockQuantity && !isNaN(val)) {
                              updateInventory.mutate({ id: prod.id, stockQuantity: val });
                            }
                          }}
                          className="w-20 rounded border border-white/10 bg-onyx px-2 py-1 font-mono text-xs text-pure-white"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          prod.isActive ? 'bg-spark-lime/20 text-spark-lime' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {prod.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Archive ${prod.name}?`)) {
                            deleteProduct.mutate(prod.id);
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="p-8 text-center text-xs text-pure-white/60">Loading orders...</div>
          ) : (
            orders?.map((ord) => (
              <div
                key={ord.id}
                className="rounded-xl border border-white/10 bg-onyx-surface p-4 text-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-pure-white text-sm">
                      {ord.orderNumber}
                    </span>
                    <span className="text-pure-white/50">{formatDate(ord.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-spark-lime">
                      {formatPrice(ord.totalAmount)}
                    </span>
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: ord.id,
                          status: e.target.value as OrderStatus,
                        })
                      }
                      className="rounded border border-white/15 bg-onyx px-2 py-1 font-mono text-xs text-pure-white uppercase"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-pure-white/70">
                  Customer: <strong>{ord.shippingAddress.fullName}</strong> ({ord.shippingAddress.city}, {ord.shippingAddress.state})
                </div>

                <div className="font-mono text-[11px] text-pure-white/50">
                  {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(' • ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Product */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-onyx-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-pure-white">Create New Component</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-pure-white/60 hover:text-pure-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    className="input mt-1"
                    placeholder="SZ-MCU-001"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">MPN *</label>
                  <input
                    type="text"
                    required
                    value={newProd.mpn}
                    onChange={(e) => setNewProd({ ...newProd, mpn: e.target.value })}
                    className="input mt-1"
                    placeholder="STM32F401RE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">Name *</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    className="input mt-1"
                    placeholder="STM32 Nucleo-64 Dev Board"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">Slug (kebab-case) *</label>
                  <input
                    type="text"
                    required
                    value={newProd.slug}
                    onChange={(e) => setNewProd({ ...newProd, slug: e.target.value.toLowerCase() })}
                    className="input mt-1"
                    placeholder="stm32-nucleo-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">Category *</label>
                  <input
                    type="text"
                    required
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={newProd.manufacturer}
                    onChange={(e) => setNewProd({ ...newProd, manufacturer: e.target.value })}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">Unit Price (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProd.unitPrice}
                    onChange={(e) => setNewProd({ ...newProd, unitPrice: Number(e.target.value) })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-pure-white/60">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={newProd.stockQuantity}
                    onChange={(e) => setNewProd({ ...newProd, stockQuantity: Number(e.target.value) })}
                    className="input mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-pure-white/60">Description</label>
                <textarea
                  rows={3}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-pure-white/60">Datasheet URL</label>
                <input
                  type="url"
                  value={newProd.datasheetUrl}
                  onChange={(e) => setNewProd({ ...newProd, datasheetUrl: e.target.value })}
                  className="input mt-1"
                  placeholder="https://example.com/datasheet.pdf"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending}
                  className="btn-primary py-2 text-xs font-bold"
                >
                  {createProduct.isPending ? 'Saving...' : 'Save Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
