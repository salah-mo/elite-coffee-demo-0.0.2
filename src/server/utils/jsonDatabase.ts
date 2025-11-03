import fs from 'fs';
import path from 'path';
import { CartItem, Order } from '@/types';

// Define the database structure
interface Database {
  carts: Record<string, CartItem[]>;
  orders: Order[];
}

// Path to the JSON database file
const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

// Ensure the data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize database file if it doesn't exist
function initializeDatabase(): Database {
  ensureDataDirectory();
  
  if (!fs.existsSync(DB_PATH)) {
    const initialData: Database = {
      carts: {},
      orders: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    const initialData: Database = {
      carts: {},
      orders: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

// Read from database
function readDatabase(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return initializeDatabase();
  }
}

// Write to database
function writeDatabase(data: Database): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database:', error);
    throw new Error('Failed to write to database');
  }
}

// Cart operations
export const cartDB = {
  // Get cart for a user
  get: (userId: string): CartItem[] => {
    const db = readDatabase();
    return db.carts[userId] || [];
  },

  // Set cart for a user
  set: (userId: string, cart: CartItem[]): void => {
    const db = readDatabase();
    db.carts[userId] = cart;
    writeDatabase(db);
  },

  // Add item to cart
  addItem: (userId: string, item: CartItem): void => {
    const db = readDatabase();
    if (!db.carts[userId]) {
      db.carts[userId] = [];
    }
    
    // Check if item already exists
    const existingItemIndex = db.carts[userId].findIndex(
      (cartItem) =>
        cartItem.menuItemId === item.menuItemId &&
        cartItem.size === item.size &&
        cartItem.flavor === item.flavor &&
        JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      db.carts[userId][existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      db.carts[userId].push(item);
    }
    
    writeDatabase(db);
  },

  // Remove item from cart
  removeItem: (userId: string, cartItemId: string): void => {
    const db = readDatabase();
    if (db.carts[userId]) {
      db.carts[userId] = db.carts[userId].filter((item) => item.id !== cartItemId);
      writeDatabase(db);
    }
  },

  // Update item quantity
  updateQuantity: (userId: string, cartItemId: string, quantity: number): void => {
    const db = readDatabase();
    if (db.carts[userId]) {
      const item = db.carts[userId].find((item) => item.id === cartItemId);
      if (item) {
        item.quantity = quantity;
        writeDatabase(db);
      }
    }
  },

  // Clear cart
  clear: (userId: string): void => {
    const db = readDatabase();
    db.carts[userId] = [];
    writeDatabase(db);
  },
};

// Order operations
export const orderDB = {
  // Get all orders
  getAll: (): Order[] => {
    const db = readDatabase();
    return db.orders;
  },

  // Get order by ID
  getById: (orderId: string): Order | null => {
    const db = readDatabase();
    return db.orders.find((order) => order.id === orderId) || null;
  },

  // Get orders by user ID
  getByUserId: (userId: string): Order[] => {
    const db = readDatabase();
    return db.orders.filter((order) => order.userId === userId);
  },

  // Create new order
  create: (order: Order): Order => {
    const db = readDatabase();
    db.orders.push(order);
    writeDatabase(db);
    return order;
  },

  // Update order
  update: (orderId: string, updates: Partial<Order>): Order | null => {
    const db = readDatabase();
    const orderIndex = db.orders.findIndex((order) => order.id === orderId);
    
    if (orderIndex === -1) {
      return null;
    }

    db.orders[orderIndex] = { ...db.orders[orderIndex], ...updates };
    writeDatabase(db);
    return db.orders[orderIndex];
  },

  // Delete order
  delete: (orderId: string): boolean => {
    const db = readDatabase();
    const initialLength = db.orders.length;
    db.orders = db.orders.filter((order) => order.id !== orderId);
    
    if (db.orders.length < initialLength) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// Initialize database on module load
initializeDatabase();
