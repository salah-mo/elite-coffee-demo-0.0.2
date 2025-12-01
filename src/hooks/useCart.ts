import { useState, useEffect, useCallback } from "react";
import { API_CONFIG, ERROR_MESSAGES } from "@/lib/constants";
import { cachedFetch, invalidateCache } from "@/lib/apiCache";
import type { Cart, CartItem } from "@/types";

interface UseCartReturn {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (
    menuItemId: string,
    quantity: number,
    options?: {
      size?: string;
      flavor?: string;
      toppings?: string[];
    },
  ) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
  total: number;
}

/**
 * Custom hook for managing shopping cart
 *
 * Usage:
 * ```tsx
 * const { cart, addToCart, removeFromCart } = useCart();
 *
 * // Add item to cart
 * await addToCart('item-id', 2, { size: 'Large', flavor: 'Vanilla' });
 * ```
 */
export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await cachedFetch<{ cart: Cart }>(
        `${API_CONFIG.BASE_URL}/cart`,
        {
          headers: {
            "x-user-id": API_CONFIG.DEFAULT_USER_ID, // TODO: Replace with actual user ID from auth
          },
          cacheKey: `cart:${API_CONFIG.DEFAULT_USER_ID}`,
          cacheTTL: 30 * 1000, // 30 seconds cache for cart data
        },
      );

      setCart(data.cart);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      setError(errorMessage);
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = useCallback(
    async (
      menuItemId: string,
      quantity: number,
      options?: {
        size?: string;
        flavor?: string;
        toppings?: string[];
      },
    ) => {
      try {
        setError(null);

        await cachedFetch(`${API_CONFIG.BASE_URL}/cart`, {
          method: "POST",
          headers: {
            "x-user-id": API_CONFIG.DEFAULT_USER_ID, // TODO: Replace with actual user ID
          },
          body: JSON.stringify({
            menuItemId,
            quantity,
            ...options,
          }),
        });

        // Invalidate cart cache and refresh
        invalidateCache(`cart:${API_CONFIG.DEFAULT_USER_ID}`);
        await fetchCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
        setError(errorMessage);
        console.error("Failed to add item to cart:", err);
        throw err;
      }
    },
    [fetchCart],
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        setError(null);

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/cart/${cartItemId}`,
          {
            method: "DELETE",
            headers: {
              "x-user-id": API_CONFIG.DEFAULT_USER_ID,
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || ERROR_MESSAGES.GENERIC);
        }

        await fetchCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
        setError(errorMessage);
        console.error("Failed to remove item from cart:", err);
        throw err;
      }
    },
    [fetchCart],
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setError(null);

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/cart/${cartItemId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": API_CONFIG.DEFAULT_USER_ID,
            },
            body: JSON.stringify({ quantity }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || ERROR_MESSAGES.GENERIC);
        }

        await fetchCart();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
        setError(errorMessage);
        console.error("Failed to update quantity:", err);
        throw err;
      }
    },
    [fetchCart],
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/cart`, {
        method: "DELETE",
        headers: {
          "x-user-id": API_CONFIG.DEFAULT_USER_ID,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || ERROR_MESSAGES.GENERIC);
      }

      setCart(null);
      await fetchCart();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_MESSAGES.GENERIC;
      setError(errorMessage);
      console.error("Failed to clear cart:", err);
      throw err;
    }
  }, [fetchCart]);

  // Calculate item count
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Calculate total
  const total = cart?.items.reduce((sum, item) => sum + item.price, 0) || 0;

  return {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart,
    itemCount,
    total,
  };
}
