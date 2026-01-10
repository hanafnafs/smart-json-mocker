/**
 * Cache Manager for Smart JSON Mocker
 * Caches AI responses to reduce API calls
 */

import type { CacheConfig, CacheEntry } from '../types';
import { simpleHash } from '../utils';

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: Required<CacheConfig>;
  private storageKey: string;

  constructor(config: CacheConfig = { enabled: true }) {
    this.config = {
      enabled: config.enabled,
      persist: config.persist ?? false,
      ttl: config.ttl ?? 86400, // 24 hours default
      prefix: config.prefix ?? 'sjm_',
    };
    this.storageKey = `${this.config.prefix}cache`;
    
    if (this.config.persist) {
      this.loadFromStorage();
    }
  }

  /**
   * Generate a cache key from fields
   */
  generateKey(fields: Array<{ key: string; path: string }>): string {
    const keyString = fields.map(f => `${f.path}:${f.key}`).sort().join('|');
    return this.config.prefix + simpleHash(keyString);
  }

  /**
   * Get a value from cache
   */
  get(key: string): unknown | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: unknown, ttl?: number): void {
    if (!this.config.enabled) return;

    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.ttl,
    };

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Load cache from persistent storage
   */
  private loadFromStorage(): void {
    try {
      // Check if we're in a browser environment
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored) as Record<string, CacheEntry>;
          for (const [key, entry] of Object.entries(data)) {
            // Only load non-expired entries
            if (Date.now() <= entry.timestamp + entry.ttl * 1000) {
              this.cache.set(key, entry);
            }
          }
        }
      }
    } catch {
      // Silently fail if storage is not available
    }
  }

  /**
   * Save cache to persistent storage
   */
  private saveToStorage(): void {
    if (!this.config.persist) return;

    try {
      if (typeof localStorage !== 'undefined') {
        const data: Record<string, CacheEntry> = {};
        for (const [key, entry] of this.cache.entries()) {
          data[key] = entry;
        }
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch {
      // Silently fail if storage is not available
    }
  }
}

/**
 * Create a cache manager instance
 */
export function createCacheManager(config?: CacheConfig): CacheManager {
  return new CacheManager(config);
}
