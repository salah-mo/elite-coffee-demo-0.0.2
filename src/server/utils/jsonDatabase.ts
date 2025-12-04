import fs from 'fs';
import path from 'path';
import type { CartItem, Order } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

export interface Database {
  carts: Record<string, CartItem[]>;
  orders: Order[];
}

function ensureDbExists(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: Database = { carts: {}, orders: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

export function readDatabase(): Database {
  try {
    ensureDbExists();
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as Database;
  } catch (error) {
    console.error('Error reading database:', error);
    return { carts: {}, orders: [] };
  }
}

export function writeDatabase(db: Database): void {
  try {
    ensureDbExists();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
}
