const path = require('path');
const { createClient } = require('@libsql/client');

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://ferreteria-pos-josecastro44.aws-us-west-2.turso.io';
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MjU4MDA5MzMsImlhdCI6MTc5NDI2NDkzMywiaWQiOiIwMWExYzI4NS0yNjAxLTdmNWUtODUyMC00OTQ2ZjEyMGQzYzYiLCJraWQiOiJIbWpnbnZPOC1fRlpYY3dZTzZjREg2TWZlMEhiMng1VnN2b0N6SDYxT2tnIiwicmlkIjoiYmY3MjZhNmItOGMzYy00ZTI3LWE2MjUtODQ0NDQ0ZmQ3Y2RlIn0.sCSMS43ImgRf7wzh0QEfr7FoMiMwzobDD4SOXDa-RRv0bRzzeXwzOIlCDjcrbZA43c26H9UvMVH_hTlzXa2VDQ';

let tursoClient = null;
if (TURSO_URL && TURSO_AUTH_TOKEN) {
  try {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN
    });
    console.log('📡 Cliente Turso Cloud inicializado correctamente.');
  } catch (err) {
    console.warn('Turso client init warning:', err.message);
  }
}

let db;
let isNativeSQLite = false;

// If NOT running in Vercel serverless environment, attempt to use native better-sqlite3
if (!process.env.VERCEL && !process.env.FORCE_TURSO) {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'ferreteria.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    isNativeSQLite = true;
  } catch (err) {
    console.warn('better-sqlite3 no disponible o no compilable, usando adaptador universal conectado a Turso Cloud.');
  }
}

// Universal In-Memory Database Fallback for Vercel Serverless (with Turso Cloud persistence)
if (!isNativeSQLite) {
  let settingsState = {
    id: 1,
    store_name: 'Bodega Jeym',
    rif: 'J-12345678-9',
    phone: '0414-0000000',
    address: 'Calle Principal, Local 1',
    tasa_interna: 960.00,
    tasa_bcv: 883.40,
    cashea_percent: 15.0,
    receipt_footer: '¡Gracias por su compra!'
  };

  let productsState = [
    { id: 1, code: 'HER-001', name: 'Llave Inglesa Ajustable 10"', category: 'Herramientas', unit: 'und', allow_decimals: 0, cost_usd: 28.00, price_usd: 40.00, price_cashea: 46.00, stock: 12, min_stock: 3, synonyms: 'llave, llave inglesa, ajustable, perico, 10 pulgadas', image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 2, code: 'ELE-001', name: 'Electrodos 6013 1/8" (por Kilo)', category: 'Herrería y Soldadura', unit: 'kg', allow_decimals: 1, cost_usd: 3.10, price_usd: 4.50, price_cashea: 5.20, stock: 65.5, min_stock: 10.0, synonyms: 'electrodo, electrodos, soldadura, varilla soldar, 6013, 1/8', image_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 3, code: 'PLO-001', name: 'Cinta Teflón 3/4" x 10m', category: 'Plomería', unit: 'und', allow_decimals: 0, cost_usd: 0.40, price_usd: 0.85, price_cashea: 1.00, stock: 120, min_stock: 20, synonyms: 'teflon, cinta rosca, tirro plomo, cinta selladora, 3/4', image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 4, code: 'PLO-002', name: 'Llave de Paso 1/2" Bronce Esfera', category: 'Plomería', unit: 'und', allow_decimals: 0, cost_usd: 4.50, price_usd: 6.50, price_cashea: 7.50, stock: 28, min_stock: 5, synonyms: 'llave de paso, valvula, valvula esfera, bronce, 1/2', image_url: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 5, code: 'CON-001', name: 'Manguera de Nivel Transparente 1/2" (por Metro)', category: 'Construcción', unit: 'metro', allow_decimals: 1, cost_usd: 0.35, price_usd: 0.60, price_cashea: 0.70, stock: 100.0, min_stock: 20.0, synonyms: 'manguera nivel, nivel, albanil, transparente, 1/2', image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 6, code: 'ELE-002', name: 'Cable THW Calibre #12 Cobre (por Metro)', category: 'Electricidad', unit: 'metro', allow_decimals: 1, cost_usd: 0.50, price_usd: 0.75, price_cashea: 0.90, stock: 180.0, min_stock: 30.0, synonyms: 'cable 12, alambre, thw, cobre, 7 hilos, electricidad', image_url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 7, code: 'FIJ-001', name: 'Clavos de Acero para Concreto 2" (por Kilo)', category: 'Fijación y Tornillos', unit: 'kg', allow_decimals: 1, cost_usd: 2.10, price_usd: 3.20, price_cashea: 3.70, stock: 45.0, min_stock: 10.0, synonyms: 'clavos, clavos acero, concreto, 2 pulgadas, fijacion', image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 8, code: 'ILU-001', name: 'Bombillo LED 12W Rosca E27 Luz Blanca', category: 'Iluminación', unit: 'und', allow_decimals: 0, cost_usd: 0.90, price_usd: 1.50, price_cashea: 1.75, stock: 75, min_stock: 15, synonyms: 'bombillo led, foco, bombilla, 12w, e27, luz blanca', image_url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 9, code: 'HER-002', name: 'Disco de Corte para Metal 4 1/2" x 1mm', category: 'Herramientas', unit: 'und', allow_decimals: 0, cost_usd: 0.65, price_usd: 1.20, price_cashea: 1.40, stock: 150, min_stock: 25, synonyms: 'disco corte, disco esmeril, 4 1/2, 4.5, metal, corte fino', image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 10, code: 'ADH-001', name: 'Pega Tanque Epóxico Doble Componente', category: 'Adhesivos y Químicos', unit: 'und', allow_decimals: 0, cost_usd: 2.20, price_usd: 3.50, price_cashea: 4.00, stock: 40, min_stock: 8, synonyms: 'pega tanque, soldadura fria, epoxico, pegatank, pegatanque', image_url: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() },
    { id: 11, code: 'PLO-003', name: 'Tubo PVC Aguas Negras 2" (Tubo 3 Metros)', category: 'Plomería', unit: 'und', allow_decimals: 0, cost_usd: 3.50, price_usd: 5.20, price_cashea: 6.00, stock: 22, min_stock: 5, synonyms: 'tubo pvc, aguas negras, drenaje, tuberia, 2 pulgadas, 3m', image_url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=300&auto=format&fit=crop&q=80', created_at: new Date().toISOString() }
  ];

  let customersState = [
    { id: 1, name: 'Cliente Mostrador', id_card: 'V-00000000', phone: '0414-0000000', address: 'Mostrador', email: 'cliente@ferreteria.local', created_at: new Date().toISOString() },
    { id: 2, name: 'Juan Pérez', id_card: 'V-18456789', phone: '0414-1234567', address: 'Sector Centro, Calle 5', email: 'juan.perez@gmail.com', created_at: new Date().toISOString() },
    { id: 3, name: 'Constructora Ávila C.A.', id_card: 'J-30987654-1', phone: '0424-9876543', address: 'Zona Industrial Local 8', email: 'contacto@constructoraavila.com', created_at: new Date().toISOString() }
  ];

  let usersState = [
    { id: 1, username: 'admin', name: 'Admin Hebert', role: 'admin', pin: '1234', created_at: new Date().toISOString() },
    { id: 2, username: 'cajero1', name: 'Carlos Cajero', role: 'cajero', pin: '0000', created_at: new Date().toISOString() }
  ];

  let salesState = [];
  let saleItemsState = [];
  let creditAbonosState = [];
  let quotesState = [];
  let cashClosingsState = [];
  let nextSaleId = 1;
  let nextProductId = 12;
  let nextCustomerId = 4;
  let nextUserId = 3;
  let nextAbonoId = 1;
  let nextQuoteId = 1;
  let nextClosingId = 1;

  let isTursoSynced = false;
  const pendingWrites = [];

  async function syncWithTurso() {
    if (!tursoClient || isTursoSynced) return;
    try {
      const [settingsRes, prodsRes, custsRes, usersRes, salesRes, itemsRes, abonosRes, quotesRes, closingsRes] = await Promise.all([
        tursoClient.execute('SELECT * FROM settings WHERE id = 1'),
        tursoClient.execute('SELECT * FROM products ORDER BY name ASC'),
        tursoClient.execute('SELECT * FROM customers ORDER BY name ASC'),
        tursoClient.execute('SELECT * FROM users'),
        tursoClient.execute('SELECT * FROM sales ORDER BY id DESC'),
        tursoClient.execute('SELECT * FROM sale_items'),
        tursoClient.execute('SELECT * FROM credit_abonos ORDER BY id DESC'),
        tursoClient.execute('SELECT * FROM quotes ORDER BY id DESC'),
        tursoClient.execute('SELECT * FROM cash_closings ORDER BY id DESC')
      ]);

      if (settingsRes.rows.length) settingsState = { ...settingsState, ...settingsRes.rows[0] };
      if (prodsRes.rows.length) productsState = prodsRes.rows.map(r => ({ ...r }));
      if (custsRes.rows.length) customersState = custsRes.rows.map(r => ({ ...r }));
      if (usersRes.rows.length) usersState = usersRes.rows.map(r => ({ ...r }));
      if (salesRes.rows.length) salesState = salesRes.rows.map(r => ({ ...r }));
      if (itemsRes.rows.length) saleItemsState = itemsRes.rows.map(r => ({ ...r }));
      if (abonosRes.rows.length) creditAbonosState = abonosRes.rows.map(r => ({ ...r }));
      if (quotesRes.rows.length) quotesState = quotesRes.rows.map(r => ({ ...r }));
      if (closingsRes.rows.length) cashClosingsState = closingsRes.rows.map(r => ({ ...r }));

      if (productsState.length) nextProductId = Math.max(...productsState.map(p => p.id)) + 1;
      if (salesState.length) nextSaleId = Math.max(...salesState.map(s => s.id)) + 1;
      if (customersState.length) nextCustomerId = Math.max(...customersState.map(c => c.id)) + 1;
      if (creditAbonosState.length) nextAbonoId = Math.max(...creditAbonosState.map(a => a.id)) + 1;
      if (quotesState.length) nextQuoteId = Math.max(...quotesState.map(q => q.id)) + 1;
      if (cashClosingsState.length) nextClosingId = Math.max(...cashClosingsState.map(c => c.id)) + 1;

      isTursoSynced = true;
      console.log('✅ Base de datos sincronizada con Turso Cloud! Total productos:', productsState.length);
    } catch (err) {
      console.error('Error sincronizando con Turso Cloud:', err.message);
    }
  }

  db = {
    pragma: () => {},
    exec: () => {},
    transaction: (fn) => (...args) => fn(...args),
    isTursoSynced: () => isTursoSynced,
    pendingWrites,
    syncWithTurso,
    prepare: (sql) => {
      const cleanSql = sql.trim().replace(/\s+/g, ' ');

      return {
        get: (...params) => {
          if (cleanSql.includes('SELECT tasa_interna, tasa_bcv FROM settings') || cleanSql.includes('SELECT * FROM settings')) {
            return { ...settingsState };
          }
          if (cleanSql.includes('SELECT COUNT(*) as total FROM products')) {
            return { total: productsState.length };
          }
          if (cleanSql.includes('SELECT COUNT(*) as total FROM customers')) {
            return { total: customersState.length };
          }
          if (cleanSql.includes('SELECT COUNT(*) as total FROM users')) {
            return { total: usersState.length };
          }
          if (cleanSql.includes('SELECT id FROM sales ORDER BY id DESC LIMIT 1')) {
            if (!salesState.length) return null;
            const maxId = Math.max(...salesState.map(s => s.id));
            return { id: maxId };
          }
          if (cleanSql.includes('SELECT id FROM quotes ORDER BY id DESC LIMIT 1')) {
            if (!quotesState.length) return null;
            const maxId = Math.max(...quotesState.map(q => q.id));
            return { id: maxId };
          }
          if (cleanSql.includes('SELECT * FROM products WHERE id = ?')) {
            return productsState.find(p => p.id === parseInt(params[0])) || null;
          }
          if (cleanSql.includes('SELECT * FROM customers WHERE id = ?')) {
            return customersState.find(c => c.id === parseInt(params[0])) || null;
          }
          if (cleanSql.includes('SELECT id, username, name, role, pin FROM users WHERE username = ?')) {
            return usersState.find(u => u.username === String(params[0]).toLowerCase()) || null;
          }
          if (cleanSql.includes('SELECT id, username, name, role, pin, created_at FROM users WHERE id = ?')) {
            return usersState.find(u => u.id === parseInt(params[0])) || null;
          }
          if (cleanSql.includes('SELECT * FROM sales WHERE id = ?')) {
            return salesState.find(s => s.id === parseInt(params[0])) || null;
          }
          if (cleanSql.includes('SELECT COALESCE(SUM(total_usd_tienda)')) {
            const dateStr = params[0];
            const matching = salesState.filter(s => s.created_at.startsWith(dateStr));
            return {
              total_usd: matching.reduce((sum, s) => sum + s.total_usd_tienda, 0),
              total_bs: matching.reduce((sum, s) => sum + s.total_bs, 0),
              tickets: matching.length
            };
          }
          if (cleanSql.includes('SELECT * FROM quotes WHERE id = ?')) {
            return quotesState.find(q => q.id === parseInt(params[0])) || null;
          }
          if (cleanSql.includes('FROM cash_closings WHERE closing_date = ?')) {
            return cashClosingsState.find(c => c.closing_date === params[0]) || null;
          }
          if (cleanSql.includes('SELECT SUM(p.cost_usd * si.quantity)')) {
            const dateStr = params[0];
            const matchingSales = salesState.filter(s => s.created_at.startsWith(dateStr));
            let totalCost = 0;
            matchingSales.forEach(s => {
              const items = saleItemsState.filter(si => si.sale_id === s.id);
              items.forEach(si => {
                const prod = productsState.find(p => p.id === si.product_id);
                if (prod) totalCost += (prod.cost_usd * si.quantity);
              });
            });
            return { total_cost_usd: totalCost };
          }
          return null;
        },

        all: (...params) => {
          if (cleanSql.includes('SELECT * FROM products ORDER BY name ASC') || cleanSql.includes('SELECT * FROM products WHERE') || cleanSql.includes('SELECT * FROM products')) {
            if (cleanSql.includes('WHERE stock <= min_stock')) {
              return productsState.filter(p => p.stock <= p.min_stock);
            }
            if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
              const term = params[0].replace(/%/g, '').toLowerCase();
              return productsState.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.code.toLowerCase().includes(term) ||
                (p.synonyms && p.synonyms.toLowerCase().includes(term))
              );
            }
            return [...productsState].sort((a, b) => a.name.localeCompare(b.name));
          }

          if (cleanSql.includes('FROM customers')) {
            const result = customersState.map(c => {
              const custSales = salesState.filter(s => s.customer_name === c.name || s.customer_id === c.id);
              return {
                ...c,
                total_purchases: custSales.length,
                total_spent_usd: custSales.reduce((acc, s) => acc + s.total_usd_tienda, 0),
                total_spent_bs: custSales.reduce((acc, s) => acc + s.total_bs, 0)
              };
            });
            if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
              const term = params[0].replace(/%/g, '').toLowerCase();
              return result.filter(c => c.name.toLowerCase().includes(term) || c.id_card.toLowerCase().includes(term));
            }
            return result;
          }

          if (cleanSql.includes('FROM users')) {
            return [...usersState];
          }

          if (cleanSql.includes('FROM quotes')) {
            return [...quotesState].reverse();
          }

          if (cleanSql.includes('FROM credit_abonos')) {
            if (cleanSql.includes('WHERE sale_id = ?')) {
              return creditAbonosState.filter(a => a.sale_id === parseInt(params[0]));
            }
            return [...creditAbonosState].reverse();
          }

          if (cleanSql.includes('FROM cash_closings')) {
            return [...cashClosingsState].reverse();
          }

          if (cleanSql.includes('FROM sales WHERE is_credit = 1')) {
            return salesState.filter(s => s.is_credit === 1);
          }

          if (cleanSql.includes('FROM sales WHERE DATE(created_at')) {
            const dateStr = params[0];
            return salesState.filter(s => s.created_at.startsWith(dateStr));
          }

          if (cleanSql.includes('FROM sales ORDER BY id DESC')) {
            return [...salesState].reverse().slice(0, parseInt(params[0]) || 50);
          }

          if (cleanSql.includes('FROM sale_items WHERE sale_id = ?')) {
            return saleItemsState.filter(si => si.sale_id === parseInt(params[0]));
          }

          if (cleanSql.includes('SELECT product_name, SUM(quantity)')) {
            const map = {};
            saleItemsState.forEach(si => {
              if (!map[si.product_name]) map[si.product_name] = { product_name: si.product_name, total_qty: 0, total_usd: 0, total_bs: 0 };
              map[si.product_name].total_qty += si.quantity;
              map[si.product_name].total_usd += si.subtotal_usd_tienda;
              map[si.product_name].total_bs += si.subtotal_bs;
            });
            return Object.values(map).sort((a, b) => b.total_qty - a.total_qty).slice(0, 5);
          }

          if (cleanSql.includes('SELECT p.category, SUM(si.subtotal_usd_tienda)')) {
            const map = {};
            saleItemsState.forEach(si => {
              const prod = productsState.find(p => p.id === si.product_id);
              const cat = prod ? prod.category : 'General';
              if (!map[cat]) map[cat] = { category: cat, total_usd: 0, total_qty: 0 };
              map[cat].total_usd += si.subtotal_usd_tienda;
              map[cat].total_qty += si.quantity;
            });
            return Object.values(map).sort((a, b) => b.total_usd - a.total_usd);
          }

          return [];
        },

        run: (...params) => {
          if (tursoClient) {
            pendingWrites.push(
              tursoClient.execute({ sql, args: params }).catch(err => {
                console.warn('Turso write async notice:', err.message);
              })
            );
          }

          if (cleanSql.includes('UPDATE settings')) {
            const [store_name, rif, phone, address, tasa_interna, tasa_bcv, cashea_percent, receipt_footer] = params;
            if (store_name) settingsState.store_name = store_name;
            if (rif) settingsState.rif = rif;
            if (phone) settingsState.phone = phone;
            if (address) settingsState.address = address;
            if (tasa_interna) settingsState.tasa_interna = parseFloat(tasa_interna);
            if (tasa_bcv) settingsState.tasa_bcv = parseFloat(tasa_bcv);
            if (cashea_percent !== undefined && cashea_percent !== null) settingsState.cashea_percent = parseFloat(cashea_percent);
            if (receipt_footer) settingsState.receipt_footer = receipt_footer;
            return { changes: 1 };
          }

          if (cleanSql.includes('INSERT INTO products')) {
            const [code, name, category, unit, allow_decimals, cost_usd, price_usd, price_cashea, stock, min_stock, synonyms, image_url] = params;
            const newProd = {
              id: nextProductId++,
              code,
              name,
              category: category || 'General',
              unit: unit || 'und',
              allow_decimals: allow_decimals ? 1 : 0,
              cost_usd: parseFloat(cost_usd) || 0,
              price_usd: parseFloat(price_usd) || 0,
              price_cashea: price_cashea !== undefined && price_cashea !== null ? parseFloat(price_cashea) : 0,
              stock: parseFloat(stock) || 0,
              min_stock: parseFloat(min_stock) || 5,
              synonyms: synonyms || '',
              image_url: image_url || '',
              created_at: new Date().toISOString()
            };
            productsState.push(newProd);
            return { lastInsertRowid: newProd.id, changes: 1 };
          }

          if (cleanSql.includes('UPDATE products SET code = COALESCE')) {
            const [code, name, category, unit, allow_decimals, cost_usd, price_usd, price_cashea, stock, min_stock, synonyms, image_url, id] = params;
            const prod = productsState.find(p => p.id === parseInt(id));
            if (prod) {
              if (code) prod.code = code;
              if (name) prod.name = name;
              if (category) prod.category = category;
              if (unit) prod.unit = unit;
              if (allow_decimals !== null && allow_decimals !== undefined) prod.allow_decimals = allow_decimals ? 1 : 0;
              if (cost_usd !== null && cost_usd !== undefined) prod.cost_usd = parseFloat(cost_usd);
              if (price_usd !== null && price_usd !== undefined) prod.price_usd = parseFloat(price_usd);
              if (price_cashea !== null && price_cashea !== undefined) prod.price_cashea = parseFloat(price_cashea);
              if (stock !== null && stock !== undefined) prod.stock = parseFloat(stock);
              if (min_stock !== null && min_stock !== undefined) prod.min_stock = parseFloat(min_stock);
              if (synonyms !== null && synonyms !== undefined) prod.synonyms = synonyms;
              if (image_url !== null && image_url !== undefined) prod.image_url = image_url;
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('UPDATE products SET stock = stock + ? WHERE id = ?')) {
            const [qty, id] = params;
            const prod = productsState.find(p => p.id === parseInt(id));
            if (prod) {
              prod.stock += parseFloat(qty);
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('UPDATE products SET stock = stock - ? WHERE id = ?')) {
            const [qty, id] = params;
            const prod = productsState.find(p => p.id === parseInt(id));
            if (prod) {
              prod.stock -= parseFloat(qty);
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('DELETE FROM products WHERE id = ?')) {
            const before = productsState.length;
            productsState = productsState.filter(p => p.id !== parseInt(params[0]));
            return { changes: before - productsState.length };
          }

          if (cleanSql.includes('INSERT INTO customers')) {
            const [name, id_card, phone, address, email] = params;
            const newCust = {
              id: nextCustomerId++,
              name,
              id_card,
              phone: phone || '',
              address: address || '',
              email: email || '',
              created_at: new Date().toISOString()
            };
            customersState.push(newCust);
            return { lastInsertRowid: newCust.id, changes: 1 };
          }

          if (cleanSql.includes('UPDATE customers SET name = COALESCE')) {
            const [name, id_card, phone, address, email, id] = params;
            const cust = customersState.find(c => c.id === parseInt(id));
            if (cust) {
              if (name) cust.name = name;
              if (id_card) cust.id_card = id_card;
              if (phone !== undefined) cust.phone = phone;
              if (address !== undefined) cust.address = address;
              if (email !== undefined) cust.email = email;
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('DELETE FROM customers WHERE id = ?')) {
            const before = customersState.length;
            customersState = customersState.filter(c => c.id !== parseInt(params[0]));
            return { changes: before - customersState.length };
          }

          if (cleanSql.includes('INSERT INTO users')) {
            const [username, name, role, pin] = params;
            const newUser = {
              id: nextUserId++,
              username: String(username).toLowerCase(),
              name,
              role: role || 'cajero',
              pin: pin || '1234',
              created_at: new Date().toISOString()
            };
            usersState.push(newUser);
            return { lastInsertRowid: newUser.id, changes: 1 };
          }

          if (cleanSql.includes('UPDATE users SET username = COALESCE')) {
            const [username, name, role, pin, id] = params;
            const user = usersState.find(u => u.id === parseInt(id));
            if (user) {
              if (username) user.username = String(username).toLowerCase();
              if (name) user.name = name;
              if (role) user.role = role;
              if (pin) user.pin = pin;
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('DELETE FROM users WHERE id = ?')) {
            const before = usersState.length;
            usersState = usersState.filter(u => u.id !== parseInt(params[0]));
            return { changes: before - usersState.length };
          }

          if (cleanSql.includes('INSERT INTO sales')) {
            const saleObj = typeof params[0] === 'object' && params.length === 1 ? params[0] : null;
            let newSale;
            if (saleObj) {
              newSale = {
                id: nextSaleId++,
                ...saleObj,
                created_at: new Date().toISOString()
              };
            } else {
              const [sale_number, customer_name, customer_id, cashier_name, tasa_interna, tasa_bcv, total_usd_tienda, total_bs, total_usd_bcv, payment_method, amount_paid_bs, amount_paid_usd, change_bs, change_usd, notes, is_cashea, is_credit, credit_due_date, credit_status, credit_balance_usd, paid_efectivo_usd, paid_zelle_usd, paid_binance_usd, paid_efectivo_bs, paid_pago_movil_bs, paid_punto_bs, cashea_initial_usd, cashea_financed_usd] = params;
              newSale = {
                id: nextSaleId++,
                sale_number,
                customer_name,
                customer_id: customer_id ? parseInt(customer_id) : null,
                cashier_name: cashier_name || 'Admin Hebert',
                tasa_interna: parseFloat(tasa_interna),
                tasa_bcv: parseFloat(tasa_bcv),
                total_usd_tienda: parseFloat(total_usd_tienda),
                total_bs: parseFloat(total_bs),
                total_usd_bcv: parseFloat(total_usd_bcv),
                payment_method,
                amount_paid_bs: parseFloat(amount_paid_bs) || 0,
                amount_paid_usd: parseFloat(amount_paid_usd) || 0,
                change_bs: parseFloat(change_bs) || 0,
                change_usd: parseFloat(change_usd) || 0,
                notes: notes || '',
                is_cashea: is_cashea ? 1 : 0,
                is_credit: is_credit ? 1 : 0,
                credit_due_date: credit_due_date || null,
                credit_status: credit_status || 'none',
                credit_balance_usd: parseFloat(credit_balance_usd) || 0,
                paid_efectivo_usd: parseFloat(paid_efectivo_usd) || 0,
                paid_zelle_usd: parseFloat(paid_zelle_usd) || 0,
                paid_binance_usd: parseFloat(paid_binance_usd) || 0,
                paid_efectivo_bs: parseFloat(paid_efectivo_bs) || 0,
                paid_pago_movil_bs: parseFloat(paid_pago_movil_bs) || 0,
                paid_punto_bs: parseFloat(paid_punto_bs) || 0,
                cashea_initial_usd: parseFloat(cashea_initial_usd) || 0,
                cashea_financed_usd: parseFloat(cashea_financed_usd) || 0,
                created_at: new Date().toISOString()
              };
            }
            salesState.push(newSale);
            return { lastInsertRowid: newSale.id, changes: 1 };
          }

          if (cleanSql.includes('UPDATE sales SET credit_balance_usd')) {
            const [balance, status, id] = params;
            const sale = salesState.find(s => s.id === parseInt(id));
            if (sale) {
              sale.credit_balance_usd = parseFloat(balance);
              if (status) sale.credit_status = status;
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('INSERT INTO quotes')) {
            const [quote_number, customer_name, customer_id, customer_phone, cashier_name, items_json, total_usd, total_bs, is_cashea, tasa_interna, notes] = params;
            const newQuote = {
              id: nextQuoteId++,
              quote_number,
              customer_name: customer_name || 'Cliente Mostrador',
              customer_id: customer_id ? parseInt(customer_id) : null,
              customer_phone: customer_phone || '',
              cashier_name: cashier_name || 'Admin Hebert',
              items_json,
              total_usd: parseFloat(total_usd),
              total_bs: parseFloat(total_bs),
              is_cashea: is_cashea ? 1 : 0,
              tasa_interna: parseFloat(tasa_interna),
              status: 'open',
              notes: notes || '',
              created_at: new Date().toISOString()
            };
            quotesState.push(newQuote);
            return { lastInsertRowid: newQuote.id, changes: 1 };
          }

          if (cleanSql.includes('UPDATE quotes SET status')) {
            const [status, id] = params;
            const q = quotesState.find(item => item.id === parseInt(id));
            if (q) {
              q.status = status;
              return { changes: 1 };
            }
            return { changes: 0 };
          }

          if (cleanSql.includes('INSERT INTO credit_abonos')) {
            const [sale_id, amount_usd, amount_bs, payment_method, cashier_name, notes] = params;
            const newAbono = {
              id: nextAbonoId++,
              sale_id: parseInt(sale_id),
              amount_usd: parseFloat(amount_usd),
              amount_bs: parseFloat(amount_bs),
              payment_method,
              cashier_name: cashier_name || 'Admin Hebert',
              notes: notes || '',
              created_at: new Date().toISOString()
            };
            creditAbonosState.push(newAbono);
            return { lastInsertRowid: newAbono.id, changes: 1 };
          }

          if (cleanSql.includes('INSERT INTO cash_closings')) {
            const [closing_date, cashier_name, initial_cash_usd, initial_cash_bs, system_efectivo_usd, system_zelle_usd, system_binance_usd, system_efectivo_bs, system_pago_movil_bs, system_punto_bs, system_cashea_usd, system_credit_usd, total_system_usd, total_system_bs, actual_cash_usd, actual_cash_bs, diff_usd, diff_bs, notes] = params;
            const newClosing = {
              id: nextClosingId++,
              closing_date,
              closed_at: new Date().toISOString(),
              cashier_name,
              initial_cash_usd: parseFloat(initial_cash_usd) || 0,
              initial_cash_bs: parseFloat(initial_cash_bs) || 0,
              system_efectivo_usd: parseFloat(system_efectivo_usd) || 0,
              system_zelle_usd: parseFloat(system_zelle_usd) || 0,
              system_binance_usd: parseFloat(system_binance_usd) || 0,
              system_efectivo_bs: parseFloat(system_efectivo_bs) || 0,
              system_pago_movil_bs: parseFloat(system_pago_movil_bs) || 0,
              system_punto_bs: parseFloat(system_punto_bs) || 0,
              system_cashea_usd: parseFloat(system_cashea_usd) || 0,
              system_credit_usd: parseFloat(system_credit_usd) || 0,
              total_system_usd: parseFloat(total_system_usd) || 0,
              total_system_bs: parseFloat(total_system_bs) || 0,
              actual_cash_usd: parseFloat(actual_cash_usd) || 0,
              actual_cash_bs: parseFloat(actual_cash_bs) || 0,
              diff_usd: parseFloat(diff_usd) || 0,
              diff_bs: parseFloat(diff_bs) || 0,
              notes: notes || '',
              created_at: new Date().toISOString()
            };
            cashClosingsState.push(newClosing);
            return { lastInsertRowid: newClosing.id, changes: 1 };
          }

          if (cleanSql.includes('INSERT INTO sale_items')) {
            const [sale_id, product_id, product_code, product_name, unit, quantity, price_usd_tienda, price_bs, price_usd_bcv, subtotal_usd_tienda, subtotal_bs, subtotal_usd_bcv] = params;
            const newItem = {
              id: saleItemsState.length + 1,
              sale_id: parseInt(sale_id),
              product_id: parseInt(product_id),
              product_code,
              product_name,
              unit,
              quantity: parseFloat(quantity),
              price_usd_tienda: parseFloat(price_usd_tienda),
              price_bs: parseFloat(price_bs),
              price_usd_bcv: parseFloat(price_usd_bcv),
              subtotal_usd_tienda: parseFloat(subtotal_usd_tienda),
              subtotal_bs: parseFloat(subtotal_bs),
              subtotal_usd_bcv: parseFloat(subtotal_usd_bcv)
            };
            saleItemsState.push(newItem);
            return { lastInsertRowid: newItem.id, changes: 1 };
          }

          return { changes: 1 };
        }
      };
    }
  };
} else {
  // Initialize native database schema when running locally on PC
  function initDB() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        store_name TEXT NOT NULL DEFAULT 'Bodega Jeym',
        rif TEXT DEFAULT 'J-12345678-9',
        phone TEXT DEFAULT '0414-0000000',
        address TEXT DEFAULT 'Calle Principal, Local 1',
        tasa_interna REAL NOT NULL DEFAULT 960.00,
        tasa_bcv REAL NOT NULL DEFAULT 883.40,
        receipt_footer TEXT DEFAULT '¡Gracias por su compra!'
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        unit TEXT NOT NULL DEFAULT 'und',
        allow_decimals INTEGER NOT NULL DEFAULT 0,
        cost_usd REAL NOT NULL DEFAULT 0.0,
        price_usd REAL NOT NULL DEFAULT 0.0,
        stock REAL NOT NULL DEFAULT 0.0,
        min_stock REAL NOT NULL DEFAULT 5.0,
        synonyms TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_number TEXT UNIQUE NOT NULL,
        customer_name TEXT DEFAULT 'Cliente Mostrador',
        customer_id INTEGER,
        cashier_name TEXT DEFAULT 'Admin Hebert',
        tasa_interna REAL NOT NULL,
        tasa_bcv REAL NOT NULL,
        total_usd_tienda REAL NOT NULL,
        total_bs REAL NOT NULL,
        total_usd_bcv REAL NOT NULL,
        payment_method TEXT NOT NULL,
        amount_paid_bs REAL DEFAULT 0.0,
        amount_paid_usd REAL DEFAULT 0.0,
        change_bs REAL DEFAULT 0.0,
        change_usd REAL DEFAULT 0.0,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_code TEXT,
        product_name TEXT NOT NULL,
        unit TEXT NOT NULL,
        quantity REAL NOT NULL,
        price_usd_tienda REAL NOT NULL,
        price_bs REAL NOT NULL,
        price_usd_bcv REAL NOT NULL,
        subtotal_usd_tienda REAL NOT NULL,
        subtotal_bs REAL NOT NULL,
        subtotal_usd_bcv REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        id_card TEXT UNIQUE NOT NULL,
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        email TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'cajero',
        pin TEXT DEFAULT '1234',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS credit_abonos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        amount_usd REAL NOT NULL,
        amount_bs REAL NOT NULL,
        payment_method TEXT NOT NULL,
        cashier_name TEXT DEFAULT 'Admin Hebert',
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotes (
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
      );

      CREATE TABLE IF NOT EXISTS cash_closings (
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
      );
    `);

    try { db.exec("ALTER TABLE settings ADD COLUMN cashea_percent REAL DEFAULT 15.0"); } catch (e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT ''"); } catch (e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN price_cashea REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN cashier_name TEXT DEFAULT 'Admin Hebert'"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN customer_id INTEGER"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN is_cashea INTEGER DEFAULT 0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN is_credit INTEGER DEFAULT 0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN credit_due_date TEXT"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN credit_status TEXT DEFAULT 'none'"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN credit_balance_usd REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN paid_efectivo_usd REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN paid_zelle_usd REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN paid_binance_usd REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN paid_efectivo_bs REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN paid_pago_movil_bs REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN paid_punto_bs REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN cashea_initial_usd REAL DEFAULT 0.0"); } catch (e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN cashea_financed_usd REAL DEFAULT 0.0"); } catch (e) {}

    // Ensure default settings exist
    const existingSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!existingSettings) {
      db.prepare(`
        INSERT INTO settings (id, store_name, rif, phone, address, tasa_interna, tasa_bcv, receipt_footer)
        VALUES (1, 'Bodega Jeym', 'J-12345678-9', '0414-0000000', 'Calle Principal, Local 1', 960.00, 883.40, '¡Gracias por su compra!')
      `).run();
    }

    // Ensure default customers exist
    const custCount = db.prepare('SELECT COUNT(*) as total FROM customers').get().total;
    if (custCount === 0) {
      const insertCust = db.prepare('INSERT INTO customers (name, id_card, phone, address, email) VALUES (?, ?, ?, ?, ?)');
      insertCust.run('Cliente Mostrador', 'V-00000000', '0414-0000000', 'Mostrador', 'cliente@ferreteria.local');
      insertCust.run('Juan Pérez', 'V-18456789', '0414-1234567', 'Sector Centro, Calle 5', 'juan.perez@gmail.com');
      insertCust.run('Constructora Ávila C.A.', 'J-30987654-1', '0424-9876543', 'Zona Industrial Local 8', 'contacto@constructoraavila.com');
    }

    // Ensure default users exist
    const userCount = db.prepare('SELECT COUNT(*) as total FROM users').get().total;
    if (userCount === 0) {
      const insertUser = db.prepare('INSERT INTO users (username, name, role, pin) VALUES (?, ?, ?, ?)');
      insertUser.run('admin', 'Admin Hebert', 'admin', '1234');
      insertUser.run('cajero1', 'Carlos Cajero', 'cajero', '0000');
    }

    // Pre-seed sample products if empty
    const count = db.prepare('SELECT COUNT(*) as total FROM products').get().total;
    if (count === 0) {
      const seedProducts = [
        { code: 'HER-001', name: 'Llave Inglesa Ajustable 10"', category: 'Herramientas', unit: 'und', allow_decimals: 0, cost_usd: 28.00, price_usd: 40.00, stock: 12, min_stock: 3, synonyms: 'llave, llave inglesa, ajustable, perico, 10 pulgadas', image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80' },
        { code: 'ELE-001', name: 'Electrodos 6013 1/8" (por Kilo)', category: 'Herrería y Soldadura', unit: 'kg', allow_decimals: 1, cost_usd: 3.10, price_usd: 4.50, stock: 65.5, min_stock: 10.0, synonyms: 'electrodo, electrodos, soldadura, varilla soldar, 6013, 1/8', image_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=80' },
        { code: 'PLO-001', name: 'Cinta Teflón 3/4" x 10m', category: 'Plomería', unit: 'und', allow_decimals: 0, cost_usd: 0.40, price_usd: 0.85, stock: 120, min_stock: 20, synonyms: 'teflon, cinta rosca, tirro plomo, cinta selladora, 3/4', image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80' },
        { code: 'PLO-002', name: 'Llave de Paso 1/2" Bronce Esfera', category: 'Plomería', unit: 'und', allow_decimals: 0, cost_usd: 4.50, price_usd: 6.50, stock: 28, min_stock: 5, synonyms: 'llave de paso, valvula, valvula esfera, bronce, 1/2', image_url: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=300&auto=format&fit=crop&q=80' },
        { code: 'CON-001', name: 'Manguera de Nivel Transparente 1/2" (por Metro)', category: 'Construcción', unit: 'metro', allow_decimals: 1, cost_usd: 0.35, price_usd: 0.60, stock: 100.0, min_stock: 20.0, synonyms: 'manguera nivel, nivel, albanil, transparente, 1/2', image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=300&auto=format&fit=crop&q=80' },
        { code: 'ELE-002', name: 'Cable THW Calibre #12 Cobre (por Metro)', category: 'Electricidad', unit: 'metro', allow_decimals: 1, cost_usd: 0.50, price_usd: 0.75, stock: 180.0, min_stock: 30.0, synonyms: 'cable 12, alambre, thw, cobre, 7 hilos, electricidad', image_url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=300&auto=format&fit=crop&q=80' },
        { code: 'FIJ-001', name: 'Clavos de Acero para Concreto 2" (por Kilo)', category: 'Fijación y Tornillos', unit: 'kg', allow_decimals: 1, cost_usd: 2.10, price_usd: 3.20, stock: 45.0, min_stock: 10.0, synonyms: 'clavos, clavos acero, concreto, 2 pulgadas, fijacion', image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&auto=format&fit=crop&q=80' },
        { code: 'ILU-001', name: 'Bombillo LED 12W Rosca E27 Luz Blanca', category: 'Iluminación', unit: 'und', allow_decimals: 0, cost_usd: 0.90, price_usd: 1.50, stock: 75, min_stock: 15, synonyms: 'bombillo led, foco, bombilla, 12w, e27, luz blanca', image_url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=300&auto=format&fit=crop&q=80' },
        { code: 'HER-002', name: 'Disco de Corte para Metal 4 1/2" x 1mm', category: 'Herramientas', unit: 'und', allow_decimals: 0, cost_usd: 0.65, price_usd: 1.20, stock: 150, min_stock: 25, synonyms: 'disco corte, disco esmeril, 4 1/2, 4.5, metal, corte fino', image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&auto=format&fit=crop&q=80' },
        { code: 'ADH-001', name: 'Pega Tanque Epóxico Doble Componente', category: 'Adhesivos y Químicos', unit: 'und', allow_decimals: 0, cost_usd: 2.20, price_usd: 3.50, stock: 40, min_stock: 8, synonyms: 'pega tanque, soldadura fria, epoxico, pegatank, pegatanque', image_url: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300&auto=format&fit=crop&q=80' },
        { code: 'PLO-003', name: 'Tubo PVC Aguas Negras 2" (Tubo 3 Metros)', category: 'Plomería', unit: 'und', allow_decimals: 0, cost_usd: 3.50, price_usd: 5.20, stock: 22, min_stock: 5, synonyms: 'tubo pvc, aguas negras, drenaje, tuberia, 2 pulgadas, 3m', image_url: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=300&auto=format&fit=crop&q=80' }
      ];

      const insertStmt = db.prepare(`
        INSERT INTO products (code, name, category, unit, allow_decimals, cost_usd, price_usd, stock, min_stock, synonyms, image_url)
        VALUES (@code, @name, @category, @unit, @allow_decimals, @cost_usd, @price_usd, @stock, @min_stock, @synonyms, @image_url)
      `);

      const insertMany = db.transaction((items) => {
        for (const item of items) insertStmt.run(item);
      });

      insertMany(seedProducts);
    }
  }

  initDB();
}

module.exports = db;
