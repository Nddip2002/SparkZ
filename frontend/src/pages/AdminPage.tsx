import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [newProd, setNewProd] = useState<ProductInput>(initialProductInput);

  const { data: products, isLoading: productsLoading } = useAdminProducts();
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();

  const createProduct = useCreateProduct();
  const updateInventory = useUpdateInventory();
  const updateStatus = useUpdateOrderStatus();
  const deleteProduct = useDeleteProduct();

  if (meLoading) {
    return (
      <div className="mx-auto max-w-5xl py-16 space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[#131C2E]" />
        <div className="h-64 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]" />
      </div>
    );
  }

  if (me?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-[680px] py-16 text-center space-y-4">
        <h1 className="heading-3 text-red-400">Access restricted</h1>
        <p className="body-6 text-pure-white/60">
          Administrator privileges are required to view and modify inventory and orders.
        </p>
        <div className="pt-2">
          <Link to="/" className="btn-ghost">
            Back to overview
          </Link>
        </div>
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
    <div className="space-y-8 pb-20 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Link to="/" className="caption-4 text-spark-lime hover:underline">
            ← Back to overview
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="heading-3 text-pure-white">Admin dashboard</h1>
            <span className="rounded-md bg-spark-lime px-2 py-0.5 font-mono caption-3 text-[#0B111E]">
              ADMIN
            </span>
          </div>
          <p className="caption-2 text-pure-white/60">
            Live catalog management, inventory levels, and order fulfillment.
          </p>
        </div>

        {tab === 'products' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            + Create new component
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setTab('products')}
          className={tab === 'products' ? 'btn-sm-primary' : 'btn-ghost'}
        >
          Products and inventory ({products?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={tab === 'orders' ? 'btn-sm-primary' : 'btn-ghost'}
        >
          Customer orders ({orders?.length ?? 0})
        </button>
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="overflow-hidden rounded-2xl border border-[#28364F] bg-[#131C2E]">
          {productsLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[#1A253A]" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1A253A] font-mono caption-3 uppercase text-pure-white/60">
                  <tr>
                    <th scope="col" className="py-3 px-4">Component</th>
                    <th scope="col" className="py-3 px-4">SKU / MPN</th>
                    <th scope="col" className="py-3 px-4">Price</th>
                    <th scope="col" className="py-3 px-4">Stock</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="body-6">
                  {products?.map((prod) => (
                    <tr key={prod.id} className="even:bg-[#1A253A]/50">
                      <td className="py-3 px-4">
                        <div className="title-4 text-pure-white">{prod.name}</div>
                        <div className="caption-5 text-pure-white/50">{prod.manufacturer} · {prod.category}</div>
                      </td>
                      <td className="py-3 px-4 font-mono caption-2 text-pure-white/80">
                        <div>{prod.sku}</div>
                        <div className="caption-5 text-pure-white/40">{prod.mpn}</div>
                      </td>
                      <td className="py-3 px-4 font-mono body-4 text-pure-white">
                        {formatPrice(prod.unitPrice)}
                      </td>
                      <td className="py-3 px-4">
                        <label htmlFor={`stock-${prod.id}`} className="skip-link">
                          Stock quantity for {prod.name}
                        </label>
                        <input
                          id={`stock-${prod.id}`}
                          type="number"
                          min={0}
                          defaultValue={prod.stockQuantity}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== prod.stockQuantity && !Number.isNaN(val)) {
                              updateInventory.mutate({ id: prod.id, stockQuantity: val });
                            }
                          }}
                          className="w-20 rounded-lg border border-[#28364F] bg-[#0B111E] px-2 py-1 font-mono caption-2 text-pure-white"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 font-mono caption-4 ${
                            prod.isActive
                              ? 'border-spark-lime/40 bg-[#0F2537] text-spark-lime'
                              : 'border-red-500/40 bg-[#131C2E] text-red-400'
                          }`}
                        >
                          {prod.isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {confirmDeactivateId === prod.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                deleteProduct.mutate(prod.id);
                                setConfirmDeactivateId(null);
                              }}
                              className="caption-3 text-red-400 hover:underline"
                            >
                              Confirm archive
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeactivateId(null)}
                              className="caption-4 text-pure-white/60 hover:text-pure-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeactivateId(prod.id)}
                            className="caption-3 text-red-400 hover:text-red-300"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]" />
              ))}
            </div>
          ) : (
            orders?.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#28364F] bg-[#1A253A] p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono body-4 text-pure-white">
                      {ord.orderNumber}
                    </span>
                    <span className="caption-2 text-pure-white/50">{formatDate(ord.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono body-4 text-spark-lime">
                      {formatPrice(ord.totalAmount)}
                    </span>
                    <label htmlFor={`status-${ord.id}`} className="skip-link">
                      Order status for {ord.orderNumber}
                    </label>
                    <select
                      id={`status-${ord.id}`}
                      value={ord.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: ord.id,
                          status: e.target.value as OrderStatus,
                        })
                      }
                      className="rounded-lg border border-[#28364F] bg-[#0B111E] px-2 py-1 font-mono caption-3 text-pure-white uppercase"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="caption-2 text-pure-white/75">
                  Customer: <strong>{ord.shippingAddress.fullName}</strong> ({ord.shippingAddress.city}, {ord.shippingAddress.state})
                </div>

                <div className="font-mono caption-5 text-pure-white/50">
                  {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(' · ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Product */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-component-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B111E]/80 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#28364F] bg-[#1A253A] p-3">
              <h2 id="create-component-heading" className="title-1 text-pure-white">
                Create new component
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowCreateModal(false)}
                className="text-pure-white/60 hover:text-pure-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="new-sku" className="block caption-3 uppercase text-pure-white/60">SKU</label>
                  <input
                    id="new-sku"
                    type="text"
                    required
                    value={newProd.sku}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    className="input"
                    placeholder="SZ-MCU-001"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="new-mpn" className="block caption-3 uppercase text-pure-white/60">MPN</label>
                  <input
                    id="new-mpn"
                    type="text"
                    required
                    value={newProd.mpn}
                    onChange={(e) => setNewProd({ ...newProd, mpn: e.target.value })}
                    className="input"
                    placeholder="STM32F401RE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="new-name" className="block caption-3 uppercase text-pure-white/60">Name</label>
                  <input
                    id="new-name"
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    className="input"
                    placeholder="STM32 Nucleo 64 Dev Board"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="new-slug" className="block caption-3 uppercase text-pure-white/60">URL slug</label>
                  <input
                    id="new-slug"
                    type="text"
                    required
                    value={newProd.slug}
                    onChange={(e) => setNewProd({ ...newProd, slug: e.target.value.toLowerCase() })}
                    className="input"
                    placeholder="stm32-nucleo-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="new-cat" className="block caption-3 uppercase text-pure-white/60">Category</label>
                  <input
                    id="new-cat"
                    type="text"
                    required
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="new-mfr" className="block caption-3 uppercase text-pure-white/60">Manufacturer</label>
                  <input
                    id="new-mfr"
                    type="text"
                    required
                    value={newProd.manufacturer}
                    onChange={(e) => setNewProd({ ...newProd, manufacturer: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="new-price" className="block caption-3 uppercase text-pure-white/60">Unit price (INR)</label>
                  <input
                    id="new-price"
                    type="number"
                    step="0.01"
                    required
                    value={newProd.unitPrice}
                    onChange={(e) => setNewProd({ ...newProd, unitPrice: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="new-stock" className="block caption-3 uppercase text-pure-white/60">Stock quantity</label>
                  <input
                    id="new-stock"
                    type="number"
                    required
                    value={newProd.stockQuantity}
                    onChange={(e) => setNewProd({ ...newProd, stockQuantity: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="new-desc" className="block caption-3 uppercase text-pure-white/60">Description</label>
                <textarea
                  id="new-desc"
                  rows={3}
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="new-ds" className="block caption-3 uppercase text-pure-white/60">Datasheet URL</label>
                <input
                  id="new-ds"
                  type="url"
                  value={newProd.datasheetUrl}
                  onChange={(e) => setNewProd({ ...newProd, datasheetUrl: e.target.value })}
                  className="input"
                  placeholder="https://example.com/datasheet.pdf"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending}
                  className="btn-primary"
                >
                  {createProduct.isPending ? 'Saving...' : 'Save component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
