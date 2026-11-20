import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, toQueryString } from '../lib/api';
import type {
  Cart,
  CatalogFilters,
  Order,
  OrderStatus,
  Paginated,
  Product,
  ProductInput,
  ProductQuery,
  ShippingAddress,
  UserProfile,
} from '../types/api';
import { useAuth } from '../auth/useAuth';

/** Catalog data is cacheable (30–60s). Carts and orders are user-specific and always fresh. */
const CATALOG_STALE_TIME = 60_000;

export const queryKeys = {
  products: (q: ProductQuery) => ['products', q] as const,
  product: (slug: string) => ['product', slug] as const,
  filters: ['catalog-filters'] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  me: ['me'] as const,
  adminProducts: ['admin', 'products'] as const,
  adminOrders: ['admin', 'orders'] as const,
};

// ---------- Catalog ----------

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: queryKeys.products(query),
    queryFn: ({ signal }) =>
      apiFetch<Paginated<Product>>(`/products${toQueryString({ ...query })}`, { signal }),
    staleTime: CATALOG_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(slug ?? ''),
    queryFn: ({ signal }) => apiFetch<Product>(`/products/${encodeURIComponent(slug ?? '')}`, { signal }),
    enabled: Boolean(slug),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useCatalogFilters() {
  return useQuery({
    queryKey: queryKeys.filters,
    queryFn: ({ signal }) => apiFetch<CatalogFilters>('/products/filters', { signal }),
    staleTime: CATALOG_STALE_TIME,
  });
}

// ---------- User ----------

export function useMe() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.me, session?.user.id],
    queryFn: () => apiFetch<UserProfile>('/users/me', { auth: true }),
    enabled: Boolean(session),
    staleTime: 0,
  });
}

// ---------- Cart (never cached beyond the request) ----------

export function useCart() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.cart, session?.user.id],
    queryFn: () => apiFetch<Cart>('/cart', { auth: true }),
    enabled: Boolean(session),
    staleTime: 0,
  });
}

function useInvalidateCart() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.cart });
}

export function useAddToCart() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      apiFetch<Cart>('/cart', { method: 'POST', body: input, auth: true }),
    onSuccess: invalidate,
  });
}

export function useUpdateCartItem() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiFetch<Cart>(`/cart/${productId}`, { method: 'PATCH', body: { quantity }, auth: true }),
    onSuccess: invalidate,
  });
}

export function useRemoveCartItem() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (productId: string) => apiFetch<Cart>(`/cart/${productId}`, { method: 'DELETE', auth: true }),
    onSuccess: invalidate,
  });
}

// ---------- Orders ----------

export function useOrders() {
  const { session } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.orders, session?.user.id],
    queryFn: () => apiFetch<Order[]>('/orders', { auth: true }),
    enabled: Boolean(session),
    staleTime: 0,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shippingAddress: ShippingAddress) =>
      apiFetch<Order>('/orders/checkout', { method: 'POST', body: { shippingAddress }, auth: true }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.cart }),
        qc.invalidateQueries({ queryKey: queryKeys.orders }),
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['product'] }),
      ]);
    },
  });
}

// ---------- Admin ----------

export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: () => apiFetch<Product[]>('/admin/products', { auth: true }),
    staleTime: 0,
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.adminOrders,
    queryFn: () => apiFetch<Order[]>('/admin/orders', { auth: true }),
    staleTime: 0,
  });
}

function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.adminProducts }),
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['product'] }),
      qc.invalidateQueries({ queryKey: queryKeys.filters }),
    ]);
}

export function useCreateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: ProductInput) => apiFetch<Product>('/admin/products', { method: 'POST', body: input, auth: true }),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      apiFetch<Product>(`/admin/products/${id}`, { method: 'PATCH', body: input, auth: true }),
    onSuccess: invalidate,
  });
}

export function useUpdateInventory() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, stockQuantity }: { id: string; stockQuantity: number }) =>
      apiFetch<Product>(`/admin/products/${id}/inventory`, {
        method: 'PATCH',
        body: { stockQuantity },
        auth: true,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/admin/products/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: invalidate,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiFetch<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminOrders }),
  });
}
