import { useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem } from '@/types';

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
    }
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

      const response = await fetch('/api/cart', {
        headers: {
          'x-user-id': 'demo-user', // TODO: Replace with actual user ID from auth
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setCart(data.data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      }
    ) => {
      try {
        setError(null);

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user', // TODO: Replace with actual user ID
          },
          body: JSON.stringify({
            menuItemId,
            quantity,
            ...options,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add item to cart');
        }

        // Refresh cart after adding
        await fetchCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        throw err;
      }
    },
    [fetchCart]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        setError(null);

        const response = await fetch(`/api/cart/${cartItemId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': 'demo-user',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to remove item from cart');
        }

        await fetchCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        throw err;
      }
    },
    [fetchCart]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setError(null);

        const response = await fetch(`/api/cart/${cartItemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user',
          },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) {
          throw new Error('Failed to update quantity');
        }

        await fetchCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        throw err;
      }
    },
    [fetchCart]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'x-user-id': 'demo-user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      setCart(null);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [fetchCart]);

  // Calculate item count
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

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
