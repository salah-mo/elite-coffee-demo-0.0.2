/**
 * In-Memory Data Store
 * Simple data storage for development without database
 * Replace with actual database when ready
 */

import type { CartItem, Order } from '@/types';

// In-memory storage
const carts = new Map<string, CartItem[]>();
const orders = new Map<string, Order[]>();

let orderCounter = 1;

export const inMemoryStore = {
  // Cart operations
  cart: {
    get: (userId: string): CartItem[] => {
      return carts.get(userId) || [];
    },
    
    set: (userId: string, items: CartItem[]) => {
      carts.set(userId, items);
    },
    
    add: (userId: string, item: CartItem) => {
      const userCart = carts.get(userId) || [];
      userCart.push(item);
      carts.set(userId, userCart);
      return item;
    },
    
    remove: (userId: string, itemId: string) => {
      const userCart = carts.get(userId) || [];
      const filtered = userCart.filter(item => item.id !== itemId);
      carts.set(userId, filtered);
    },
    
    clear: (userId: string) => {
      carts.set(userId, []);
    },
  },

  // Order operations
  orders: {
    getAll: (userId: string): Order[] => {
      return orders.get(userId) || [];
    },
    
    getById: (userId: string, orderId: string): Order | undefined => {
      const userOrders = orders.get(userId) || [];
      return userOrders.find(order => order.id === orderId);
    },
    
    create: (userId: string, order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
      const userOrders = orders.get(userId) || [];
      const newOrder: Order = {
        ...order,
        id: `order-${Date.now()}`,
        orderNumber: `ORD-${orderCounter++}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userOrders.push(newOrder);
      orders.set(userId, userOrders);
      return newOrder;
    },
    
    update: (userId: string, orderId: string, updates: Partial<Order>): Order | undefined => {
      const userOrders = orders.get(userId) || [];
      const index = userOrders.findIndex(order => order.id === orderId);
      if (index === -1) return undefined;
      
      userOrders[index] = {
        ...userOrders[index],
        ...updates,
        updatedAt: new Date(),
      };
      orders.set(userId, userOrders);
      return userOrders[index];
    },
  },
};
