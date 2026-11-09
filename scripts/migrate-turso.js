const { createClient } = require('@libsql/client');
const Database = require('better-sqlite3');
const path = require('path');

const TURSO_URL = 'libsql://ferreteria-pos-josecastro44.aws-us-west-2.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MjU4MDA5MzMsImlhdCI6MTc5NDI2NDkzMywiaWQiOiIwMWExYzI4NS0yNjAxLTdmNWUtODUyMC00OTQ2ZjEyMGQzYzYiLCJraWQiOiJIbWpnbnZPOC1fRlpYY3dZTzZjREg2TWZlMEhiMng1VnN2b0N6SDYxT2tnIiwicmlkIjoiYmY3MjZhNmItOGMzYy00ZTI3LWE2MjUtODQ0NDQ0ZmQ3Y2RlIn0.sCSMS43ImgRf7wzh0QEfr7FoMiMwzobDD4SOXDa-RRv0bRzzeXwzOIlCDjcrbZA43c26H9UvMVH_hTlzXa2VDQ';

async function migrate() {
  console.log('--- Conectando a Turso y a ferreteria.db local ---');
  const turso = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN
  });

  const localDb = new Database(path.join(__dirname, '..', 'ferreteria.db'));

  // 1. Create tables in Turso
  console.log('1. Creando tablas en Turso...');
  const tableSchemas = [
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT DEFAULT 'Bodega Jeym',
      rif TEXT DEFAULT 'J-12345678-9',
      phone TEXT DEFAULT '0414-0000000',
      address TEXT DEFAULT 'Calle Principal, Local 1',
      tasa_interna REAL DEFAULT 960.00,
      tasa_bcv REAL DEFAULT 883.40,
      cashea_percent REAL DEFAULT 15.0,
      receipt_footer TEXT DEFAULT '¡Gracias por su compra!'
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      unit TEXT DEFAULT 'und',
      allow_decimals INTEGER DEFAULT 0,
      cost_usd REAL DEFAULT 0,
      price_usd REAL NOT NULL,
      price_cashea REAL,
      stock REAL DEFAULT 0,
      min_stock REAL DEFAULT 5,
      synonyms TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'cajero',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE,
      customer_name TEXT DEFAULT 'Cliente Mostrador',
      customer_id INTEGER,
      cashier_name TEXT,
      total_usd_tienda REAL NOT NULL,
      total_bs REAL NOT NULL,
      total_usd_bcv REAL DEFAULT 0,
      tasa_interna REAL NOT NULL,
      tasa_bcv REAL NOT NULL,
      payment_method TEXT NOT NULL,
      amount_paid_bs REAL DEFAULT 0,
      amount_paid_usd REAL DEFAULT 0,
      change_bs REAL DEFAULT 0,
      change_usd REAL DEFAULT 0,
      notes TEXT,
      is_cashea INTEGER DEFAULT 0,
      is_credit INTEGER DEFAULT 0,
      credit_due_date TEXT,
      credit_status TEXT DEFAULT 'pending',
      credit_balance_usd REAL DEFAULT 0,
      paid_efectivo_usd REAL DEFAULT 0,
      paid_zelle_usd REAL DEFAULT 0,
      paid_binance_usd REAL DEFAULT 0,
      paid_efectivo_bs REAL DEFAULT 0,
      paid_pago_movil_bs REAL DEFAULT 0,
      paid_punto_bs REAL DEFAULT 0,
      cashea_initial_usd REAL DEFAULT 0,
      cashea_financed_usd REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_code TEXT,
      product_name TEXT,
      unit TEXT DEFAULT 'und',
      quantity REAL NOT NULL,
      price_usd_tienda REAL NOT NULL,
      price_bs REAL NOT NULL,
      price_usd_bcv REAL DEFAULT 0,
      subtotal_usd_tienda REAL NOT NULL,
      subtotal_bs REAL NOT NULL,
      subtotal_usd_bcv REAL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS credit_abonos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      amount_usd REAL NOT NULL,
      amount_bs REAL NOT NULL,
      tasa_cambio REAL NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT UNIQUE,
      customer_name TEXT DEFAULT 'Cliente Presupuesto',
      customer_phone TEXT,
      total_usd REAL NOT NULL,
      total_bs REAL NOT NULL,
      tasa_interna REAL NOT NULL,
      notes TEXT,
      created_by TEXT,
      status TEXT DEFAULT 'active',
      items_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cash_closings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closing_number TEXT UNIQUE,
      cashier_name TEXT,
      initial_cash_usd REAL DEFAULT 0,
      initial_cash_bs REAL DEFAULT 0,
      system_efectivo_usd REAL DEFAULT 0,
      system_zelle_usd REAL DEFAULT 0,
      system_binance_usd REAL DEFAULT 0,
      system_efectivo_bs REAL DEFAULT 0,
      system_pago_movil_bs REAL DEFAULT 0,
      system_punto_bs REAL DEFAULT 0,
      system_cashea_usd REAL DEFAULT 0,
      system_credit_usd REAL DEFAULT 0,
      total_system_usd REAL DEFAULT 0,
      total_system_bs REAL DEFAULT 0,
      actual_cash_usd REAL DEFAULT 0,
      actual_cash_bs REAL DEFAULT 0,
      diff_usd REAL DEFAULT 0,
      diff_bs REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tableSchemas) {
    await turso.execute(sql);
  }
  console.log('✅ Esquema de tablas creado con éxito en Turso.');

  // 2. Migrate settings
  const settings = localDb.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (settings) {
    console.log('Migrando configuración...');
    await turso.execute({
      sql: `INSERT OR REPLACE INTO settings (id, store_name, rif, phone, address, tasa_interna, tasa_bcv, cashea_percent, receipt_footer)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        settings.store_name,
        settings.rif,
        settings.phone,
        settings.address,
        settings.tasa_interna,
        settings.tasa_bcv,
        settings.cashea_percent || 15.0,
        settings.receipt_footer
      ]
    });
  }

  // 3. Migrate users
  const users = localDb.prepare('SELECT * FROM users').all();
  console.log(`Migrando ${users.length} usuarios...`);
  for (const u of users) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO users (id, username, pin, name, role) VALUES (?, ?, ?, ?, ?)`,
      args: [u.id, u.username, u.pin, u.name, u.role]
    });
  }

  // 4. Migrate customers
  const customers = localDb.prepare('SELECT * FROM customers').all();
  console.log(`Migrando ${customers.length} clientes...`);
  for (const c of customers) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO customers (id, name, id_card, phone, address, email) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.name, c.id_card, c.phone, c.address, c.email]
    });
  }

  // 5. Migrate products
  const products = localDb.prepare('SELECT * FROM products').all();
  console.log(`Migrando ${products.length} productos ferreteros a Turso...`);
  
  // Use batch for speed
  const batchStatements = [];
  for (const p of products) {
    batchStatements.push({
      sql: `INSERT OR REPLACE INTO products (id, code, name, category, unit, allow_decimals, cost_usd, price_usd, price_cashea, stock, min_stock, synonyms, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.id,
        p.code,
        p.name,
        p.category,
        p.unit,
        p.allow_decimals,
        p.cost_usd,
        p.price_usd,
        p.price_cashea || (p.price_usd * 1.15),
        p.stock,
        p.min_stock,
        p.synonyms || '',
        p.image_url || ''
      ]
    });

    if (batchStatements.length >= 100) {
      await turso.batch(batchStatements.splice(0, batchStatements.length), 'write');
      process.stdout.write('.');
    }
  }
  if (batchStatements.length > 0) {
    await turso.batch(batchStatements, 'write');
  }
  console.log('\n✅ Todos los productos fueron migrados a Turso Cloud!');

  // Verify
  const verify = await turso.execute('SELECT count(*) as count FROM products');
  console.log('Total productos en Turso:', verify.rows[0].count);
}

migrate().catch(console.error);
