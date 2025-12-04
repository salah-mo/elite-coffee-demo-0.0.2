/**
 * API caching and request optimization utilities
 */
"use client";

import { API_CONFIG } from "@/lib/constants";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface RequestOptions extends RequestInit {
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
  retries?: number;
  retryDelay?: number;
}

/**
 * Simple in-memory cache for API responses with localStorage persistence
 */
class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly localStoragePrefix = "elite-api-cache-";
  private readonly persistKeys = new Set<string>([
    "orders-list",
    "order-",
    "menu-items",
    "cart-",
  ]);

  constructor() {
    // Load persisted cache from localStorage on initialization
    if (typeof window !== "undefined") {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Load cache entries from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.localStoragePrefix)) {
          const cacheKey = key.replace(this.localStoragePrefix, "");
          const value = localStorage.getItem(key);
          if (value) {
            const entry = JSON.parse(value) as CacheEntry<unknown>;
            // Only load if not expired
            if (Date.now() <= entry.expiry) {
              this.cache.set(cacheKey, entry);
            } else {
              // Clean up expired entries
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load cache from localStorage:", err);
    }
  }

  /**
   * Save cache entry to localStorage if it should be persisted
   */
  private saveToLocalStorage(key: string, entry: CacheEntry<unknown>): void {
    if (typeof window === "undefined") return;

    const shouldPersist = Array.from(this.persistKeys).some((pattern) =>
      key.includes(pattern),
    );

    if (!shouldPersist) return;

    try {
      localStorage.setItem(
        `${this.localStoragePrefix}${key}`,
        JSON.stringify(entry),
      );
    } catch (err) {
      console.warn(`Failed to persist cache key ${key}:`, err);
    }
  }

  /**
   * Remove cache entry from localStorage
   */
  private removeFromLocalStorage(key: string): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(`${this.localStoragePrefix}${key}`);
    } catch (err) {
      console.warn(`Failed to remove cache key ${key} from localStorage:`, err);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      this.removeFromLocalStorage(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    };
    this.cache.set(key, entry);
    this.saveToLocalStorage(key, entry);
  }

  delete(key: string): boolean {
    this.removeFromLocalStorage(key);
    return this.cache.delete(key);
  }

  clear(): void {
    // Clear localStorage cache entries
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.localStoragePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (err) {
        console.warn("Failed to clear localStorage cache:", err);
      }
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries from both memory and localStorage
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.removeFromLocalStorage(key);
      }
    }
  }
}

// Global cache instance
const apiCache = new ApiCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => apiCache.cleanup(), 5 * 60 * 1000);
}

/**
 * Enhanced fetch with caching, retries, and better error handling
 *
 * @param url - Request URL
 * @param options - Request options including caching configuration
 * @returns Promise with response data
 *
 * @example
 * ```tsx
 * const data = await cachedFetch('/api/menu', {
 *   cacheKey: 'menu-items',
 *   cacheTTL: 10 * 60 * 1000, // 10 minutes
 *   retries: 3
 * });
 * ```
 */
export async function cachedFetch<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    cacheKey,
    cacheTTL,
    retries = 1,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Generate cache key if not provided
  const finalCacheKey = cacheKey || generateCacheKey(url, fetchOptions);

  // Try to get from cache first (only for GET requests)
  if (
    (!fetchOptions.method || fetchOptions.method === "GET") &&
    finalCacheKey
  ) {
    const cachedData = apiCache.get<T>(finalCacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  let lastError: Error;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "API request failed");
      }

      // Cache successful responses for GET requests
      if (
        (!fetchOptions.method || fetchOptions.method === "GET") &&
        finalCacheKey
      ) {
        apiCache.set(finalCacheKey, data.data, cacheTTL);
      }

      return data.data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on the last attempt
      if (attempt < retries) {
        await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }

  throw lastError!;
}

/**
 * Generate a cache key based on URL and options
 */
function generateCacheKey(url: string, options: RequestInit): string {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : "";
  return `${method}:${url}:${body}`;
}

/**
 * Delay utility for retries
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Preload and cache data for better performance
 *
 * @param urls - Array of URLs to preload
 * @param options - Preload options
 */
export async function preloadData(
  urls: string[],
  options: { cacheTTL?: number } = {},
): Promise<void> {
  const promises = urls.map((url) =>
    cachedFetch(url, {
      cacheKey: `preload:${url}`,
      cacheTTL: options.cacheTTL,
    }).catch((error) => {
      console.warn(`Failed to preload ${url}:`, error);
    }),
  );

  await Promise.allSettled(promises);
}

/**
 * Invalidate cache entries by pattern
 *
 * @param pattern - Regex pattern or string to match cache keys
 */
export function invalidateCache(pattern: string | RegExp): void {
  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

  for (const key of apiCache["cache"].keys()) {
    if (regex.test(key)) {
      apiCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: apiCache.size(),
    entries: Array.from(apiCache["cache"].keys()),
  };
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Order-specific cache management
 */
export const orderCache = {
  /**
   * Get cached orders list
   */
  getOrders(userId: string = "demo-user"): { orders: Order[]; total: number } | null {
    return apiCache.get(`orders-list-${userId}`);
  },

  /**
   * Cache orders list
   */
  setOrders(
    data: { orders: Order[]; total: number },
    userId: string = "demo-user",
    ttl = 2 * 60 * 1000,
  ): void {
    apiCache.set(`orders-list-${userId}`, data, ttl);
  },

  /**
   * Get a single cached order
   */
  getOrder(orderId: string): Order | null {
    return apiCache.get(`order-${orderId}`);
  },

  /**
   * Cache a single order
   */
  setOrder(order: Order, ttl = 5 * 60 * 1000): void {
    apiCache.set(`order-${order.id}`, order, ttl);
  },

  /**
   * Invalidate all order-related caches
   */
  invalidateAll(): void {
    invalidateCache(/^orders?-/);
  },

  /**
   * Invalidate cache for a specific order
   */
  invalidateOrder(orderId: string): void {
    apiCache.delete(`order-${orderId}`);
  },

  /**
   * Invalidate orders list cache
   */
  invalidateList(userId: string = "demo-user"): void {
    invalidateCache(new RegExp(`^orders-list-.*${userId}`));
  },
};

// Import Order type for type safety
import type { Order } from "@/types";

/**
 * Hook for using cached API data
 */
export function useCachedApi<T>(
  url: string,
  options: RequestOptions & { enabled?: boolean } = {},
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { enabled = true, ...fetchOptions } = options;

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const result = await cachedFetch<T>(url, fetchOptions);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [url, enabled, fetchOptions]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Re-export React for the hook
import React from "react";
