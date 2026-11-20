import type { Role } from '../generated/prisma/enums.js';

/** Identity attached to `request.user` after JwtAuthGuard succeeds. */
export interface AuthUser {
  id: string;
  email: string;
  /** Role from the trusted source: users table (or app_metadata fallback). Never user_metadata. */
  role: Role;
}

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  app_metadata?: { role?: string; [key: string]: unknown };
  user_metadata?: { full_name?: string; [key: string]: unknown };
}
