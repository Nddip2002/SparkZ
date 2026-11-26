import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * In-memory cache for public catalog reads only.
 * NEVER store carts, order histories or checkout stock checks here.
 * All catalog keys are tracked so admin writes can invalidate them precisely.
 */
@Injectable()
export class CatalogCacheService {
  static readonly TTL_MS = 60_000;
  /** Maximum tracked cache keys to prevent unbounded memory growth from random query strings. */
  static readonly MAX_KEYS = 250;
  private readonly keys = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async wrap<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const fullKey = `catalog:${key}`;
    const hit = await this.cache.get<T>(fullKey);
    if (hit !== undefined && hit !== null) return hit;

    const value = await loader();
    if (this.keys.size >= CatalogCacheService.MAX_KEYS) {
      const oldestKey = this.keys.values().next().value;
      if (oldestKey) {
        this.keys.delete(oldestKey);
        await this.cache.del(oldestKey);
      }
    }
    await this.cache.set(fullKey, value, CatalogCacheService.TTL_MS);
    this.keys.add(fullKey);
    return value;
  }

  /** Called after every admin product create/update/delete/inventory change and after checkout. */
  async invalidateAll(): Promise<void> {
    const keys = [...this.keys];
    this.keys.clear();
    await Promise.all(keys.map((k) => this.cache.del(k)));
  }
}
