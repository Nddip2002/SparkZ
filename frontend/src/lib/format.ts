const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return inr.format(Number.isFinite(n) ? n : 0);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
