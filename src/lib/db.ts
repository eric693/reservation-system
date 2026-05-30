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
      is_pinned INTEGER DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_user_id INTEGER REFERENCES users(id),
      staff_id INTEGER REFERENCES staff(id),
      service_id INTEGER REFERENCES services(id),
      preferred_date TEXT NOT NULL,
      preferred_time_start TEXT DEFAULT '09:00',
      preferred_time_end TEXT DEFAULT '21:00',
      status TEXT DEFAULT 'waiting',
      notified_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS member_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      service_id INTEGER REFERENCES services(id),
      total_sessions INTEGER NOT NULL,
      bonus_sessions INTEGER DEFAULT 0,
      price INTEGER NOT NULL,
      valid_days INTEGER DEFAULT 365,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_user_id INTEGER NOT NULL REFERENCES users(id),
      package_id INTEGER NOT NULL REFERENCES member_packages(id),
      total_sessions INTEGER NOT NULL,
      used_sessions INTEGER DEFAULT 0,
      purchase_date TEXT DEFAULT (datetime('now')),
      expiry_date TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS customer_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_user_id INTEGER NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      balance_after INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      date TEXT NOT NULL,
      is_working INTEGER DEFAULT 1,
      work_start TEXT DEFAULT '10:00',
      work_end TEXT DEFAULT '21:00',
      note TEXT,
      UNIQUE(staff_id, date)
    );

    CREATE TABLE IF NOT EXISTS portfolio_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_user_id INTEGER NOT NULL REFERENCES users(id),
      portfolio_id INTEGER NOT NULL REFERENCES portfolio(id),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(customer_user_id, portfolio_id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT '甲油',
      unit TEXT DEFAULT '瓶',
      quantity REAL DEFAULT 0,
      min_quantity REAL DEFAULT 5,
      cost INTEGER DEFAULT 0,
      supplier TEXT,
      note TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL REFERENCES inventory(id),
      change_amount REAL NOT NULL,
      type TEXT NOT NULL,
      note TEXT,
      staff_id INTEGER REFERENCES staff(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS marketing_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      trigger_days INTEGER,
      message TEXT NOT NULL,
      discount_percent INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      last_run TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS marketing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES marketing_tasks(id),
      customer_user_id INTEGER REFERENCES users(id),
      customer_name TEXT,
      message TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'sent'
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('percent','fixed')),
      value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      valid_from TEXT,
      valid_until TEXT,
      service_id INTEGER REFERENCES services(id),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupon_uses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL REFERENCES coupons(id),
      customer_user_id INTEGER REFERENCES users(id),
      appointment_id INTEGER REFERENCES appointments(id),
      used_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id),
      customer_user_id INTEGER REFERENCES users(id),
      staff_id INTEGER REFERENCES staff(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT '',
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER REFERENCES staff(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

  `);

  // Add columns that may not exist in older DBs
  const safeAlter = (sql: string) => { try { db.exec(sql); } catch {} };
  safeAlter("ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))");
  safeAlter("ALTER TABLE users ADD COLUMN notes TEXT DEFAULT ''");
  safeAlter("ALTER TABLE users ADD COLUMN is_vip INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
  safeAlter("ALTER TABLE announcements ADD COLUMN is_pinned INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE appointments ADD COLUMN reminder_sent INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE appointments ADD COLUMN coupon_id INTEGER REFERENCES coupons(id)");
  safeAlter("ALTER TABLE appointments ADD COLUMN discount_amount REAL DEFAULT 0");
  safeAlter("ALTER TABLE appointments ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))");

  // Performance indexes
  const idx = (sql: string) => { try { db.exec(sql); } catch {} };
  idx('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date)');
  idx('CREATE INDEX IF NOT EXISTS idx_appointments_staff_date ON appointments(staff_id, date)');
  idx('CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_user_id)');
  idx('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
  idx('CREATE INDEX IF NOT EXISTS idx_portfolio_active ON portfolio(is_active)');
  idx('CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active)');
  idx('CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active)');
  idx('CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status, preferred_date)');
  idx('CREATE INDEX IF NOT EXISTS idx_marketing_logs_task ON marketing_logs(task_id, sent_at)');
  idx('CREATE INDEX IF NOT EXISTS idx_customer_packages_user ON customer_packages(customer_user_id)');
  idx('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  idx('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
  idx('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)');
  idx('CREATE INDEX IF NOT EXISTS idx_reviews_staff ON reviews(staff_id, is_public)');
  idx('CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date, staff_id)');
  idx('CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)');
  idx('CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id, customer_user_id)');

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
    'admin@salon.com', hash, '雅婷', '0900000000', 'admin'
  );
  db.prepare(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`).run(
    'xiaowen@salon.com', hash, '小雯', '0911111111', 'staff'
  );
  db.prepare(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`).run(
    'customer@salon.com', custHash, '小明', '0912345678', 'customer'
  );

  db.prepare(`INSERT INTO staff (user_id, name, username) VALUES (?, ?, ?)`).run(1, '雅婷', 'yating');
  db.prepare(`INSERT INTO staff (user_id, name, username) VALUES (?, ?, ?)`).run(2, '小雯', 'xiaowen');

  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run('基礎美甲', '單色、法式、漸層等基礎款式', 60, 800, '美甲');
  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run('客製造型', '依需求設計獨特款式，含手繪/貼鑽/3D', 180, 2000, '造型');
  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run('光療卸甲', '專業卸除凝膠光療，含護甲保養', 60, 400, '保養');
  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run('手部護理', '磨砂去角質 + 保濕按摩 + 上油', 45, 500, '保養');
  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run('凝膠延甲', '鋼片/玻璃纖維延甲，附基礎彩繪', 150, 1500, '延甲');
  db.prepare(`INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)`).run('腳部美甲', '修甲 + 基礎彩繪（足部）', 60, 700, '足部');

  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('store_name', '雅婷美甲工作室');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('logo_text', '美');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('banner_url', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=400&fit=crop');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('address', '台北市信義區信義路五段7號');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('phone', '02-2345-6789');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('email', 'info@yating-nail.com');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('open_time', '10:00');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('close_time', '21:00');
  db.prepare(`INSERT INTO store_settings (key, value) VALUES (?, ?)`).run('slot_interval', '30');

  const portfolioInsert = db.prepare(`INSERT INTO portfolio (title, image_url, style, staff_id, views) VALUES (?, ?, ?, ?, ?)`);
  portfolioInsert.run('深棕流星美甲', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop', '深色系', 1, 47);
  portfolioInsert.run('裸粉珍珠光療', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=600&fit=crop', '裸色系', 1, 27);
  portfolioInsert.run('灰藍霧面質感', 'https://images.unsplash.com/photo-1516914589923-f105f1535f88?w=600&h=600&fit=crop', '霧面系', 2, 34);
  portfolioInsert.run('莫蘭迪粉霧光', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop', '裸色系', 1, 58);
  portfolioInsert.run('法式白尖貓眼', 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&h=600&fit=crop', '法式系', 2, 71);

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
