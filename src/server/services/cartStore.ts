import type { CartItem } from "@/types";
import { readDatabase, writeDatabase } from "@/server/utils/jsonDatabase";

const carts = new Map<string, CartItem[]>();

function cloneCartItem(item: CartItem): CartItem {
  return {
    ...item,
    toppings: item.toppings ? [...item.toppings] : undefined,
    menuItem: item.menuItem ? { ...item.menuItem } : undefined,
  };
}

function cloneCart(items: CartItem[]): CartItem[] {
  return items.map((item) => cloneCartItem(item));
}

function getInternalCart(userId: string): CartItem[] {
  // Check in-memory first
  const existing = carts.get(userId);
  if (existing) {
    return existing;
  }
  
  // Try loading from database
  try {
    const db = readDatabase();
    const dbCart = db.carts?.[userId];
    if (dbCart && Array.isArray(dbCart)) {
      carts.set(userId, dbCart);
      return dbCart;
    }
  } catch (error) {
    console.error('Failed to load cart from database:', error);
  }
  
  // Initialize empty cart
  const initial: CartItem[] = [];
  carts.set(userId, initial);
  return initial;
}

function findMatchingItemIndex(items: CartItem[], candidate: CartItem): number {
  return items.findIndex(
    (cartItem) =>
      cartItem.menuItemId === candidate.menuItemId &&
      cartItem.size === candidate.size &&
      cartItem.flavor === candidate.flavor &&
      JSON.stringify(cartItem.toppings || []) ===
        JSON.stringify(candidate.toppings || []),
  );
}

function persistCart(userId: string, items: CartItem[]): void {
  try {
    const db = readDatabase();
    if (!db.carts) {
      db.carts = {};
    }
    db.carts[userId] = items;
    writeDatabase(db);
  } catch (error) {
    console.error('Failed to persist cart to database:', error);
  }
}

export const cartStore = {
  get(userId: string): CartItem[] {
    const cart = getInternalCart(userId);
    return cloneCart(cart);
  },

  set(userId: string, items: CartItem[]): void {
    const cloned = cloneCart(items);
    carts.set(userId, cloned);
    persistCart(userId, cloned);
  },

  addItem(userId: string, item: CartItem): void {
    const cart = getInternalCart(userId);
    const index = findMatchingItemIndex(cart, item);

    if (index > -1) {
      const existing = cart[index];
      existing.quantity += item.quantity;
      existing.price = Number((existing.price + item.price).toFixed(2));
      cart[index] = cloneCartItem(existing);
    } else {
      cart.push(cloneCartItem(item));
    }

    carts.set(userId, cart);
    persistCart(userId, cart);
  },

  removeItem(userId: string, cartItemId: string): void {
    const cart = getInternalCart(userId).filter((item) => item.id !== cartItemId);
    carts.set(userId, cart);
    persistCart(userId, cart);
  },

  updateQuantity(userId: string, cartItemId: string, quantity: number): void {
    const cart = getInternalCart(userId);
    const index = cart.findIndex((item) => item.id === cartItemId);
    if (index === -1) return;

    const existing = cart[index];
    if (existing.quantity <= 0) {
      existing.quantity = quantity;
      existing.price = Number((existing.price).toFixed(2));
    } else {
      const unitPrice = existing.price / existing.quantity;
      existing.quantity = quantity;
      existing.price = Number((unitPrice * quantity).toFixed(2));
    }

    cart[index] = cloneCartItem(existing);
    carts.set(userId, cart);
    persistCart(userId, cart);
  },

  clear(userId: string): void {
    carts.set(userId, []);
    persistCart(userId, []);
  },
};
