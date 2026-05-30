import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'reservation.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      avatar_url TEXT,
      line_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      avatar_color TEXT DEFAULT '#8B7355',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL DEFAULT 60,
      price INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT '美甲',
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_user_id INTEGER REFERENCES users(id),
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      style TEXT,
      service_id INTEGER REFERENCES services(id),
      staff_id INTEGER REFERENCES staff(id),
      views INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT,
      link_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_blocked INTEGER DEFAULT 0,
      note TEXT
    );
  `);

  // Seed default data if empty
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  const custHash = bcrypt.hashSync('customer123', 10);

  db.prepare(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`).run(
    'admin@salon.com', hash, 'hao', '0900000000', 'admin'
  );
  db.prepare(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`).run(
    'hao1@salon.com', hash, 'hao1', '0911111111', 'staff'
  );
  db.prepare(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`).run(
    'customer@salon.com', custHash, '小明', '0900000000', 'customer'
  );

  db.prepare(`INSERT INTO staff (user_id, name, username) VALUES (?, ?, ?)`).run(1, 'hao', 'hao');
  db.prepare(`INSERT INTO staff (user_id, name, username) VALUES (?, ?, ?)`).run(2, 'hao1', 'hao1');

  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run(
    '美甲', '基礎美甲服務', 60, 800, '美甲'
  );
  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run(
    '指定造型', '客製化指定造型設計', 180, 2000, '造型'
  );

  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('store_name', '美甲');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('address', '台北市信義區信義路五段7號');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('phone', '02-2345-6789');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('email', 'info@delicious-store.com');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('open_time', '09:00');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('close_time', '21:00');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('slot_interval', '30');

  db.prepare(`INSERT INTO portfolio (title, image_url, style, staff_id) VALUES (?, ?, ?, ?)`).run(
    '美甲作品二', '/images/nail2.jpg', '美甲風格二', 1
  );
  db.prepare(`INSERT INTO portfolio (title, image_url, style, staff_id) VALUES (?, ?, ?, ?)`).run(
    '美甲作品一', '/images/nail1.jpg', '美甲風格一', 1
  );

  // Seed some appointments for demo
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`INSERT INTO appointments (customer_name, customer_phone, customer_user_id, staff_id, service_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '小明', '0900000000', 3, 1, 2, today, '10:00', '13:00', 'completed'
  );
  db.prepare(`INSERT INTO appointments (customer_name, customer_phone, customer_user_id, staff_id, service_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '小明', '0900000000', 3, 1, 1, today, '18:00', '19:00', 'confirmed'
  );
  db.prepare(`INSERT INTO appointments (customer_name, customer_phone, customer_user_id, staff_id, service_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    '小明', '0900000000', 3, 1, 1, today, '21:30', '22:30', 'pending'
  );
}
