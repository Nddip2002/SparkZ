const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';

export const env = {
  apiUrl: apiUrl.replace(/\/$/, ''),
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '',
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
