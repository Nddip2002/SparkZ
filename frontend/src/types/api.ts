/**
 * API contract types mirrored from the SparkZ NestJS backend.
 * Decimal columns are serialized by Prisma as strings to avoid float precision loss.
 */

export type Role = 'CUSTOMER' | 'ADMIN';
export type AccountType = 'INDIVIDUAL' | 'BUSINESS';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type SpecValue = string | number | boolean;
export type Specifications = Record<string, SpecValue>;

export interface Product {
  id: string;
  sku: string;
  mpn: string;
  category: string;
  subcategory: string | null;
  manufacturer: string;
  name: string;
  slug: string;
  description: string;
  unitPrice: string;
  stockQuantity: number;
  imageUrls: string[];
  datasheetUrl: string | null;
  specifications: Specifications;
  isActive: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export interface ProductQuery {
  search?: string;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface CatalogFilters {
  categories: { category: string; subcategories: string[] }[];
  manufacturers: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: string;
  product: Pick<
    Product,
    'id' | 'name' | 'slug' | 'sku' | 'unitPrice' | 'stockQuantity' | 'imageUrls' | 'isActive'
  >;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
  itemCount: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceAtPurchase: string;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'sku' | 'imageUrls'>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddress: ShippingAddress;
  subtotal: string;
  shippingCost: string;
  totalAmount: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: Role;
  accountType: AccountType;
  createdAt: string;
}

export interface ProductInput {
  sku: string;
  mpn: string;
  category: string;
  subcategory?: string;
  manufacturer: string;
  name: string;
  slug: string;
  description: string;
  unitPrice: number;
  stockQuantity: number;
  imageUrls: string[];
  datasheetUrl?: string;
  specifications: Specifications;
  isActive: boolean;
}
