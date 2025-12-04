import type { Order } from "@/types";
import { readDatabase, writeDatabase } from "@/server/utils/jsonDatabase";

const ordersByUser = new Map<string, Order[]>();

function cloneOrder(order: Order): Order {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      toppings: item.toppings ? [...item.toppings] : undefined,
      menuItem: item.menuItem ? { ...item.menuItem } : undefined,
    })),
    internetCard: order.internetCard
      ? { ...order.internetCard }
      : undefined,
    integrations: order.integrations
      ? {
          ...order.integrations,
          odoo: order.integrations.odoo
            ? {
                ...order.integrations.odoo,
                warnings: order.integrations.odoo.warnings
                  ? [...order.integrations.odoo.warnings]
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

function cloneOrders(orders: Order[]): Order[] {
  return orders.map((order) => cloneOrder(order));
}

function loadOrdersFromDb(): void {
  try {
    const db = readDatabase();
    if (db.orders && Array.isArray(db.orders)) {
      // Group orders by userId
      const grouped = new Map<string, Order[]>();
      for (const order of db.orders) {
        const userOrders = grouped.get(order.userId) || [];
        userOrders.push(order);
        grouped.set(order.userId, userOrders);
      }
      // Load into memory
      for (const [userId, orders] of grouped.entries()) {
        ordersByUser.set(userId, orders);
      }
    }
  } catch (error) {
    console.error('Failed to load orders from database:', error);
  }
}

function getUserOrders(userId: string): Order[] {
  // Load from DB if not in memory
  if (ordersByUser.size === 0) {
    loadOrdersFromDb();
  }
  
  const existing = ordersByUser.get(userId);
  if (existing) {
    return existing;
  }
  const initial: Order[] = [];
  ordersByUser.set(userId, initial);
  return initial;
}

function findOrderOwner(orderId: string): string | undefined {
  for (const [userId, orders] of ordersByUser.entries()) {
    if (orders.some((order) => order.id === orderId)) {
      return userId;
    }
  }
  return undefined;
}

function persistOrders(): void {
  try {
    const db = readDatabase();
    const allOrders: Order[] = [];
    for (const orders of ordersByUser.values()) {
      allOrders.push(...orders);
    }
    db.orders = allOrders;
    writeDatabase(db);
  } catch (error) {
    console.error('Failed to persist orders to database:', error);
  }
}

export const orderStore = {
  getAll(): Order[] {
    // Ensure loaded from DB
    if (ordersByUser.size === 0) {
      loadOrdersFromDb();
    }
    const collected: Order[] = [];
    for (const orders of ordersByUser.values()) {
      collected.push(...orders.map((order) => cloneOrder(order)));
    }
    return collected;
  },

  getById(orderId: string): Order | null {
    // Ensure loaded from DB
    if (ordersByUser.size === 0) {
      loadOrdersFromDb();
    }
    for (const orders of ordersByUser.values()) {
      const found = orders.find((order) => order.id === orderId);
      if (found) {
        return cloneOrder(found);
      }
    }
    return null;
  },

  getByUserId(userId: string): Order[] {
    const orders = getUserOrders(userId);
    return cloneOrders(orders);
  },

  create(order: Order): Order {
    const stored = cloneOrder(order);
    const orders = getUserOrders(order.userId);
    orders.push(stored);
    ordersByUser.set(order.userId, orders);
    persistOrders();
    return cloneOrder(stored);
  },

  update(orderId: string, updates: Partial<Order>): Order | null {
    const targetUserId = updates.userId || findOrderOwner(orderId);
    if (!targetUserId) {
      return null;
    }

    const orders = getUserOrders(targetUserId);
    const index = orders.findIndex((order) => order.id === orderId);
    if (index === -1) {
      return null;
    }

    const current = orders[index];
    const merged: Order = {
      ...current,
      ...updates,
      items: updates.items ? updates.items.map((item) => ({
        ...item,
        toppings: item.toppings ? [...item.toppings] : undefined,
        menuItem: item.menuItem ? { ...item.menuItem } : undefined,
      })) : current.items,
      internetCard: updates.internetCard
        ? { ...updates.internetCard }
        : current.internetCard,
      integrations: updates.integrations
        ? {
            ...updates.integrations,
            odoo: updates.integrations.odoo
              ? {
                  ...updates.integrations.odoo,
                  warnings: updates.integrations.odoo.warnings
                    ? [...updates.integrations.odoo.warnings]
                    : undefined,
                }
              : undefined,
          }
        : current.integrations,
      createdAt: new Date(current.createdAt),
      updatedAt: new Date(updates.updatedAt ?? current.updatedAt),
    };

    orders[index] = merged;
    ordersByUser.set(targetUserId, orders);
    persistOrders();
    return cloneOrder(merged);
  },

  delete(orderId: string): boolean {
    const owner = findOrderOwner(orderId);
    if (!owner) {
      return false;
    }
    const orders = getUserOrders(owner);
    const filtered = orders.filter((order) => order.id !== orderId);
    const changed = filtered.length !== orders.length;
    if (changed) {
      ordersByUser.set(owner, filtered);
      persistOrders();
    }
    return changed;
  },
};
