const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://ferreteria-pos-josecastro44.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MjU4MDA5MzMsImlhdCI6MTc5NDI2NDkzMywiaWQiOiIwMWExYzI4NS0yNjAxLTdmNWUtODUyMC00OTQ2ZjEyMGQzYzYiLCJraWQiOiJIbWpnbnZPOC1fRlpYY3dZTzZjREg2TWZlMEhiMng1VnN2b0N6SDYxT2tnIiwicmlkIjoiYmY3MjZhNmItOGMzYy00ZTI3LWE2MjUtODQ0NDQ0ZmQ3Y2RlIn0.sCSMS43ImgRf7wzh0QEfr7FoMiMwzobDD4SOXDa-RRv0bRzzeXwzOIlCDjcrbZA43c26H9UvMVH_hTlzXa2VDQ'
});

async function fixTables() {
  await client.execute('DROP TABLE IF EXISTS credit_abonos');
  await client.execute('DROP TABLE IF EXISTS quotes');
  await client.execute('DROP TABLE IF EXISTS cash_closings');

  await client.execute(`
    CREATE TABLE credit_abonos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      amount_usd REAL NOT NULL,
      amount_bs REAL NOT NULL,
      payment_method TEXT NOT NULL,
      cashier_name TEXT DEFAULT 'Admin Hebert',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT UNIQUE NOT NULL,
      customer_name TEXT DEFAULT 'Cliente Mostrador',
      customer_id INTEGER,
      customer_phone TEXT DEFAULT '',
      cashier_name TEXT DEFAULT 'Admin Hebert',
      items_json TEXT NOT NULL,
      total_usd REAL NOT NULL,
      total_bs REAL NOT NULL,
      is_cashea INTEGER DEFAULT 0,
      tasa_interna REAL NOT NULL,
      status TEXT DEFAULT 'open',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE cash_closings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closing_date TEXT NOT NULL,
      opened_at DATETIME,
      closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      cashier_name TEXT NOT NULL,
      initial_cash_usd REAL DEFAULT 0.0,
      initial_cash_bs REAL DEFAULT 0.0,
      system_efectivo_usd REAL DEFAULT 0.0,
      system_zelle_usd REAL DEFAULT 0.0,
      system_binance_usd REAL DEFAULT 0.0,
      system_efectivo_bs REAL DEFAULT 0.0,
      system_pago_movil_bs REAL DEFAULT 0.0,
      system_punto_bs REAL DEFAULT 0.0,
      system_cashea_usd REAL DEFAULT 0.0,
      system_credit_usd REAL DEFAULT 0.0,
      total_system_usd REAL DEFAULT 0.0,
      total_system_bs REAL DEFAULT 0.0,
      actual_cash_usd REAL DEFAULT 0.0,
      actual_cash_bs REAL DEFAULT 0.0,
      diff_usd REAL DEFAULT 0.0,
      diff_bs REAL DEFAULT 0.0,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tablas credit_abonos, quotes y cash_closings recreadas con el esquema exacto!');
}

fixTables().catch(console.error);
