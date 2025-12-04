/**
 * Orders management hook with caching support
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderStatus } from "@/types";
import { cachedFetch, invalidateCache } from "@/lib/apiCache";

const USER_ID = "demo-user";
const ORDERS_CACHE_KEY = "orders-list";
const ORDERS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const SINGLE_ORDER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseOrdersOptions {
  limit?: number;
  offset?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseOrdersReturn {
  orders: Order[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    note?: string,
  ) => Promise<Order | null>;
}

/**
 * Hook for managing user orders with caching
 *
 * @param options - Configuration options
 * @returns Orders data and management functions
 *
 * @example
 * ```tsx
 * function OrdersList() {
 *   const { orders, loading, error, refetch } = useOrders({
 *     limit: 20,
 *     autoRefresh: true,
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       {orders.map(order => (
 *         <OrderCard key={order.id} order={order} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const {
    limit = 20,
    offset = 0,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch orders from API with caching
   */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const data = await cachedFetch<{ orders: Order[]; total: number }>(
        `/api/orders?${params}`,
        {
          cacheKey: `${ORDERS_CACHE_KEY}-${limit}-${offset}`,
          cacheTTL: ORDERS_CACHE_TTL,
          headers: {
            "x-user-id": USER_ID,
          },
        },
      );

      setOrders(data.orders);
      setTotal(data.total);

      // Also cache in localStorage for offline support
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `elite-orders-${USER_ID}`,
            JSON.stringify({
              orders: data.orders,
              total: data.total,
              timestamp: Date.now(),
            }),
          );
        } catch (err) {
          console.warn("Failed to cache orders in localStorage:", err);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMessage);

      // Try to load from localStorage on error
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`elite-orders-${USER_ID}`);
          if (cached) {
            const { orders: cachedOrders, total: cachedTotal } =
              JSON.parse(cached);
            setOrders(cachedOrders);
            setTotal(cachedTotal);
            setError(
              `${errorMessage} (showing cached data)`,
            );
          }
        } catch (cacheErr) {
          console.warn("Failed to load cached orders:", cacheErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  /**
   * Get a single order by ID with caching
   */
  const getOrderById = useCallback(
    async (orderId: string): Promise<Order | null> => {
      try {
        // First check if we have it in the current orders list
        const existingOrder = orders.find((o) => o.id === orderId);
        if (existingOrder) {
          return existingOrder;
        }

        // Otherwise fetch from API
        const order = await cachedFetch<Order>(`/api/orders/${orderId}`, {
          cacheKey: `order-${orderId}`,
          cacheTTL: SINGLE_ORDER_CACHE_TTL,
          headers: {
            "x-user-id": USER_ID,
          },
        });

        // Update the orders list if we fetched a new order
        if (order && !orders.find((o) => o.id === order.id)) {
          setOrders((prev) => [order, ...prev]);
        }

        return order;
      } catch (err) {
        console.error(`Failed to fetch order ${orderId}:`, err);
        return null;
      }
    },
    [orders],
  );

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      note?: string,
    ): Promise<Order | null> => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": USER_ID,
          },
          body: JSON.stringify({ status, note }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to update order status");
        }

        const updatedOrder = result.data;

        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? updatedOrder : order,
          ),
        );

        // Invalidate cache for this order and orders list
        invalidateCache(`order-${orderId}`);
        invalidateCache(ORDERS_CACHE_KEY);

        // Update localStorage
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem(`elite-orders-${USER_ID}`);
            if (cached) {
              const data = JSON.parse(cached);
              data.orders = data.orders.map((order: Order) =>
                order.id === orderId ? updatedOrder : order,
              );
              data.timestamp = Date.now();
              localStorage.setItem(
                `elite-orders-${USER_ID}`,
                JSON.stringify(data),
              );
            }
          } catch (err) {
            console.warn("Failed to update cached order in localStorage:", err);
          }
        }

        return updatedOrder;
      } catch (err) {
        console.error("Failed to update order status:", err);
        return null;
      }
    },
    [],
  );

  /**
   * Refetch orders (bypassing cache)
   */
  const refetch = useCallback(async () => {
    // Clear cache before refetching
    invalidateCache(ORDERS_CACHE_KEY);
    await fetchOrders();
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOrders]);

  return {
    orders,
    total,
    loading,
    error,
    refetch,
    getOrderById,
    updateOrderStatus,
  };
}

/**
 * Hook for a single order with real-time updates
 *
 * @param orderId - The order ID to track
 * @param options - Configuration options
 * @returns Order data and management functions
 *
 * @example
 * ```tsx
 * function OrderDetails({ orderId }: { orderId: string }) {
 *   const { order, loading, error, refetch, updateStatus } = useOrder(orderId, {
 *     autoRefresh: true,
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!order) return <div>Order not found</div>;
 *
 *   return (
 *     <div>
 *       <h1>Order {order.orderNumber}</h1>
 *       <p>Status: {order.status}</p>
 *       <button onClick={() => updateStatus(OrderStatus.CONFIRMED)}>
 *         Confirm Order
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrder(
  orderId: string,
  options: { autoRefresh?: boolean; refreshInterval?: number } = {},
) {
  const { autoRefresh = false, refreshInterval = 10000 } = options;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await cachedFetch<Order>(`/api/orders/${orderId}`, {
        cacheKey: `order-${orderId}`,
        cacheTTL: SINGLE_ORDER_CACHE_TTL,
        headers: {
          "x-user-id": USER_ID,
        },
      });

      setOrder(data);

      // Cache in localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `elite-order-${orderId}`,
            JSON.stringify({
              order: data,
              timestamp: Date.now(),
            }),
          );
        } catch (err) {
          console.warn("Failed to cache order in localStorage:", err);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch order";
      setError(errorMessage);

      // Try to load from localStorage on error
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`elite-order-${orderId}`);
          if (cached) {
            const { order: cachedOrder } = JSON.parse(cached);
            setOrder(cachedOrder);
            setError(`${errorMessage} (showing cached data)`);
          }
        } catch (cacheErr) {
          console.warn("Failed to load cached order:", cacheErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const updateStatus = useCallback(
    async (status: OrderStatus, note?: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": USER_ID,
          },
          body: JSON.stringify({ status, note }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to update order status");
        }

        setOrder(result.data);

        // Invalidate cache
        invalidateCache(`order-${orderId}`);
        invalidateCache(ORDERS_CACHE_KEY);

        // Update localStorage
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `elite-order-${orderId}`,
              JSON.stringify({
                order: result.data,
                timestamp: Date.now(),
              }),
            );
          } catch (err) {
            console.warn("Failed to update cached order:", err);
          }
        }

        return true;
      } catch (err) {
        console.error("Failed to update order status:", err);
        setError(err instanceof Error ? err.message : "Update failed");
        return false;
      }
    },
    [orderId],
  );

  const refetch = useCallback(async () => {
    invalidateCache(`order-${orderId}`);
    await fetchOrder();
  }, [orderId, fetchOrder]);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOrder();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch,
    updateStatus,
  };
}
