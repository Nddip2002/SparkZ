import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../generated/prisma/enums.js';
import type { AuthUser, SupabaseJwtPayload } from './auth.types.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly hsSecret: Uint8Array | null;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = config.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
    this.issuer = `${supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
    const secret = config.get<string>('SUPABASE_JWT_SECRET');
    this.hsSecret = secret ? new TextEncoder().encode(secret) : null;
  }

  /** Verifies a Supabase access token (asymmetric JWKS, or legacy HS256 secret). */
  async verifyToken(token: string): Promise<SupabaseJwtPayload> {
    try {
      const { alg } = decodeProtectedHeader(token);
      const options = { issuer: this.issuer, audience: 'authenticated' };
      let payload: JWTPayload;

      if (alg === 'HS256') {
        if (!this.hsSecret) throw new Error('HS256 token received but SUPABASE_JWT_SECRET is not set');
        ({ payload } = await jwtVerify(token, this.hsSecret, { ...options, algorithms: ['HS256'] }));
      } else {
        ({ payload } = await jwtVerify(token, this.jwks, options));
      }

      if (typeof payload.sub !== 'string') throw new Error('Missing sub claim');
      return payload as SupabaseJwtPayload;
    } catch (err) {
      this.logger.debug(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Resolves the trusted identity for a verified token, provisioning the `users` row on first sight.
   * Role precedence: users table -> app_metadata.role -> CUSTOMER. user_metadata is NEVER consulted for roles.
   */
  async resolveUser(payload: SupabaseJwtPayload): Promise<AuthUser> {
    const email = payload.email;
    if (!email) throw new UnauthorizedException('Token has no email claim');

    const appRole = payload.app_metadata?.role === Role.ADMIN ? Role.ADMIN : undefined;
    const fullName =
      typeof payload.user_metadata?.full_name === 'string' ? payload.user_metadata.full_name.slice(0, 120) : null;

    const user = await this.prisma.user.upsert({
      where: { id: payload.sub },
      // Profile fields only; role is never taken from client-controlled metadata.
      create: { id: payload.sub, email, fullName, role: appRole ?? Role.CUSTOMER },
      update: { email },
      select: { id: true, email: true, role: true },
    });

    // app_metadata (server-controlled) can elevate; the DB remains authoritative otherwise.
    const role = appRole ?? user.role;
    return { id: user.id, email: user.email, role };
  }
}
