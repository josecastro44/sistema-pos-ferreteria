const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware to ensure Turso Cloud sync & await cloud writes before response
app.use(async (req, res, next) => {
  try {
    if (db.syncWithTurso && (!db.isTursoSynced || !db.isTursoSynced())) {
      await db.syncWithTurso();
    }
  } catch (e) {
    console.warn('Sync middleware notice:', e.message);
  }

  const originalJson = res.json.bind(res);
  res.json = async function(data) {
    if (db.pendingWrites && db.pendingWrites.length > 0) {
      const writesToWait = [...db.pendingWrites];
      db.pendingWrites.length = 0;
      await Promise.allSettled(writesToWait);
    }
    return originalJson(data);
  };

  next();
});

// Helper to get active rates
function getRates() {
  const settings = db.prepare('SELECT tasa_interna, tasa_bcv, cashea_percent FROM settings WHERE id = 1').get();
  return {
    tasa_interna: settings ? (settings.tasa_interna || 960.00) : 960.00,
    tasa_bcv: settings ? (settings.tasa_bcv || 866.56) : 866.56,
    cashea_percent: settings && settings.cashea_percent !== undefined ? parseFloat(settings.cashea_percent) : 15.0
  };
}

// Calculate prices helper
function formatProductPrices(prod, rates) {
  const price_usd_tienda = prod.price_usd;
  const price_bs = Math.round((price_usd_tienda * rates.tasa_interna) * 100) / 100;
  const price_usd_bcv = Math.round((price_bs / rates.tasa_bcv) * 100) / 100;

  // Cashea calculation: if product has explicit price_cashea > 0, use it. Otherwise, calculate with global cashea_percent.
  const price_cashea = prod.price_cashea && parseFloat(prod.price_cashea) > 0
    ? parseFloat(prod.price_cashea)
    : Math.round((price_usd_tienda * (1 + rates.cashea_percent / 100)) * 100) / 100;
  const price_cashea_bs = Math.round((price_cashea * rates.tasa_interna) * 100) / 100;

  return {
    ...prod,
    price_usd_tienda,
    price_bs,
    price_usd_bcv,
    price_cashea,
    price_cashea_bs
  };
}

// ==========================================
// 1. SETTINGS & RATES
// ==========================================
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const { store_name, rif, phone, address, tasa_interna, tasa_bcv, cashea_percent, receipt_footer } = req.body;
    db.prepare(`
      UPDATE settings
      SET store_name = COALESCE(?, store_name),
          rif = COALESCE(?, rif),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          tasa_interna = COALESCE(?, tasa_interna),
          tasa_bcv = COALESCE(?, tasa_bcv),
          cashea_percent = COALESCE(?, cashea_percent),
          receipt_footer = COALESCE(?, receipt_footer)
      WHERE id = 1
    `).run(
      store_name,
      rif,
      phone,
      address,
      tasa_interna ? parseFloat(tasa_interna) : null,
      tasa_bcv ? parseFloat(tasa_bcv) : null,
      cashea_percent !== undefined && cashea_percent !== null ? parseFloat(cashea_percent) : null,
      receipt_footer
    );

    const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PRODUCTS (with hardware store search)
// ==========================================
app.get('/api/products', (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    const rates = getRates();

    let products = [];
    if (!query) {
      products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
    } else {
      // Split search query into tokens to support e.g. "llave 1/2", "disco 4 1/2", "teflon 3/4"
      const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      const sqlConditions = tokens.map(() => 
        "(LOWER(name) LIKE ? OR LOWER(code) LIKE ? OR LOWER(synonyms) LIKE ? OR LOWER(category) LIKE ?)"
      ).join(" AND ");

      const params = [];
      tokens.forEach(t => {
        const pattern = `%${t}%`;
        params.push(pattern, pattern, pattern, pattern);
      });

      const stmt = db.prepare(`SELECT * FROM products WHERE ${sqlConditions} ORDER BY name ASC`);
      products = stmt.all(...params);
    }

    const calculated = products.map(p => formatProductPrices(p, rates));
    res.json(calculated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { code, name, category, unit, allow_decimals, cost_usd, price_usd, price_cashea, stock, min_stock, synonyms, image_url } = req.body;
    if (!code || !name || price_usd === undefined) {
      return res.status(400).json({ error: 'Código, nombre y precio en USD son obligatorios' });
    }

    const info = db.prepare(`
      INSERT INTO products (code, name, category, unit, allow_decimals, cost_usd, price_usd, price_cashea, stock, min_stock, synonyms, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim(),
      name.trim(),
      category || 'General',
      unit || 'und',
      allow_decimals ? 1 : 0,
      parseFloat(cost_usd) || 0.0,
      parseFloat(price_usd) || 0.0,
      price_cashea !== undefined && price_cashea !== null ? parseFloat(price_cashea) : 0.0,
      parseFloat(stock) || 0.0,
      parseFloat(min_stock) || 5.0,
      synonyms || '',
      image_url || ''
    );

    const rates = getRates();
    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(formatProductPrices(created, rates));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { code, name, category, unit, allow_decimals, cost_usd, price_usd, price_cashea, stock, min_stock, synonyms, image_url } = req.body;

    db.prepare(`
      UPDATE products
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          unit = COALESCE(?, unit),
          allow_decimals = COALESCE(?, allow_decimals),
          cost_usd = COALESCE(?, cost_usd),
          price_usd = COALESCE(?, price_usd),
          price_cashea = COALESCE(?, price_cashea),
          stock = COALESCE(?, stock),
          min_stock = COALESCE(?, min_stock),
          synonyms = COALESCE(?, synonyms),
          image_url = COALESCE(?, image_url)
      WHERE id = ?
    `).run(
      code ? code.trim() : null,
      name ? name.trim() : null,
      category,
      unit,
      allow_decimals !== undefined ? (allow_decimals ? 1 : 0) : null,
      cost_usd !== undefined ? parseFloat(cost_usd) : null,
      price_usd !== undefined ? parseFloat(price_usd) : null,
      price_cashea !== undefined ? parseFloat(price_cashea) : null,
      stock !== undefined ? parseFloat(stock) : null,
      min_stock !== undefined ? parseFloat(min_stock) : null,
      synonyms,
      image_url,
      id
    );

    const rates = getRates();
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(formatProductPrices(updated, rates));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:id/adjust-stock', (req, res) => {
  try {
    const { quantity, reason } = req.body; // quantity can be positive (purchase) or negative
    const qty = parseFloat(quantity);
    if (isNaN(qty)) return res.status(400).json({ error: 'Cantidad inválida' });

    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(qty, req.params.id);
    const rates = getRates();
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(formatProductPrices(updated, rates));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. SALES & CHECKOUT (Multi-rate POS)
// ==========================================
app.post('/api/sales', (req, res) => {
  try {
    const {
      customer_name,
      customer_id,
      customer_id_card,
      customer_phone,
      cashier_name,
      payment_method, // 'bolivares', 'dolares_efectivo', 'zelle', 'binance', 'cashea', 'credito', 'mixto'
      amount_paid_bs,
      amount_paid_usd,
      change_bs,
      change_usd,
      notes,
      is_cashea,
      is_credit,
      credit_due_date,
      credit_balance_usd,
      paid_efectivo_usd,
      paid_zelle_usd,
      paid_binance_usd,
      paid_efectivo_bs,
      paid_pago_movil_bs,
      paid_punto_bs,
      cashea_initial_usd,
      cashea_financed_usd,
      items
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'La venta debe contener al menos un producto' });
    }

    const rates = getRates();

    // Auto-create or link customer with CI and phone
    let finalCustomerId = customer_id ? parseInt(customer_id) : null;
    let customerObj = null;

    if (customer_name && customer_name.trim() !== 'Cliente Mostrador') {
      const cleanName = customer_name.trim();
      const cleanCi = (customer_id_card || '').trim();
      const cleanPhone = (customer_phone || '').trim();

      let existing = null;
      if (cleanCi) {
        existing = db.prepare('SELECT * FROM customers WHERE id_card = ?').get(cleanCi);
      }
      if (!existing && cleanName) {
        existing = db.prepare('SELECT * FROM customers WHERE LOWER(name) = ?').get(cleanName.toLowerCase());
      }

      if (existing) {
        finalCustomerId = existing.id;
        customerObj = { ...existing };
        if (cleanPhone || cleanCi) {
          db.prepare('UPDATE customers SET phone = COALESCE(NULLIF(?, ""), phone), id_card = COALESCE(NULLIF(?, ""), id_card) WHERE id = ?').run(cleanPhone, cleanCi, existing.id);
          if (cleanPhone) customerObj.phone = cleanPhone;
          if (cleanCi) customerObj.id_card = cleanCi;
        }
      } else {
        const insertCust = db.prepare('INSERT INTO customers (name, id_card, phone, address, email) VALUES (?, ?, ?, ?, ?)').run(
          cleanName,
          cleanCi || `V-${Math.floor(Math.random() * 89999999 + 10000000)}`,
          cleanPhone || '',
          'Registrado en Venta',
          ''
        );
        finalCustomerId = insertCust.lastInsertRowid;
        customerObj = { id: finalCustomerId, name: cleanName, id_card: cleanCi, phone: cleanPhone };
      }
    }

    // Calculate totals from items
    let total_usd_tienda = 0;
    let total_bs = 0;
    let total_usd_bcv = 0;

    const validatedItems = items.map(item => {
      const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!prod) throw new Error(`Producto ID ${item.product_id} no existe`);

      const qty = parseFloat(item.quantity);
      if (qty <= 0) throw new Error(`Cantidad inválida para ${prod.name}`);

      const prices = formatProductPrices(prod, rates);

      // If sale is Cashea, use price_cashea as base price!
      const itemUnitPriceUsd = is_cashea ? prices.price_cashea : prices.price_usd_tienda;
      const itemUnitPriceBs = Math.round((itemUnitPriceUsd * rates.tasa_interna) * 100) / 100;
      const itemUnitPriceBcv = prices.price_usd_bcv;

      const subtotal_usd_tienda = Math.round(itemUnitPriceUsd * qty * 100) / 100;
      const subtotal_bs = Math.round(itemUnitPriceBs * qty * 100) / 100;
      const subtotal_usd_bcv = Math.round(itemUnitPriceBcv * qty * 100) / 100;

      total_usd_tienda += subtotal_usd_tienda;
      total_bs += subtotal_bs;
      total_usd_bcv += subtotal_usd_bcv;

      return {
        product_id: prod.id,
        product_code: prod.code,
        product_name: prod.name,
        unit: prod.unit,
        quantity: qty,
        price_usd_tienda: itemUnitPriceUsd,
        price_bs: itemUnitPriceBs,
        price_usd_bcv: itemUnitPriceBcv,
        subtotal_usd_tienda,
        subtotal_bs,
        subtotal_usd_bcv
      };
    });

    total_usd_tienda = Math.round(total_usd_tienda * 100) / 100;
    total_bs = Math.round(total_bs * 100) / 100;
    total_usd_bcv = Math.round(total_usd_bcv * 100) / 100;

    // Credit calculation
    const isCreditSale = Boolean(is_credit || payment_method === 'credito');
    const creditStatus = isCreditSale ? 'pending' : 'none';
    const initialCreditBalance = isCreditSale 
      ? (credit_balance_usd !== undefined ? parseFloat(credit_balance_usd) : total_usd_tienda - (parseFloat(amount_paid_usd) || 0))
      : 0.0;

    // Generate unique sale number like TICK-00001
    const lastSale = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get();
    const nextId = (lastSale ? lastSale.id : 0) + 1;
    const sale_number = `TICK-${String(nextId).padStart(5, '0')}`;

    // Execute sale and inventory deduction in a single transaction
    const executeSale = db.transaction(() => {
      // 1. Insert sale record
      const insertSale = db.prepare(`
        INSERT INTO sales (
          sale_number, customer_name, customer_id, cashier_name, tasa_interna, tasa_bcv,
          total_usd_tienda, total_bs, total_usd_bcv,
          payment_method, amount_paid_bs, amount_paid_usd,
          change_bs, change_usd, notes,
          is_cashea, is_credit, credit_due_date, credit_status, credit_balance_usd,
          paid_efectivo_usd, paid_zelle_usd, paid_binance_usd,
          paid_efectivo_bs, paid_pago_movil_bs, paid_punto_bs,
          cashea_initial_usd, cashea_financed_usd
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?
        )
      `).run(
        sale_number,
        customer_name || 'Cliente Mostrador',
        finalCustomerId,
        cashier_name || 'Admin Hebert',
        rates.tasa_interna,
        rates.tasa_bcv,
        total_usd_tienda,
        total_bs,
        total_usd_bcv,
        payment_method || 'bolivares',
        parseFloat(amount_paid_bs) || 0.0,
        parseFloat(amount_paid_usd) || 0.0,
        parseFloat(change_bs) || 0.0,
        parseFloat(change_usd) || 0.0,
        notes || '',
        is_cashea ? 1 : 0,
        isCreditSale ? 1 : 0,
        credit_due_date || null,
        creditStatus,
        Math.max(0, initialCreditBalance),
        parseFloat(paid_efectivo_usd) || 0.0,
        parseFloat(paid_zelle_usd) || 0.0,
        parseFloat(paid_binance_usd) || 0.0,
        parseFloat(paid_efectivo_bs) || 0.0,
        parseFloat(paid_pago_movil_bs) || 0.0,
        parseFloat(paid_punto_bs) || 0.0,
        parseFloat(cashea_initial_usd) || 0.0,
        parseFloat(cashea_financed_usd) || 0.0
      );

      const saleId = insertSale.lastInsertRowid;

      // 2. Insert items and discount inventory stock IMMEDIATELY (even for credit sales)
      const insertItemStmt = db.prepare(`
        INSERT INTO sale_items (
          sale_id, product_id, product_code, product_name, unit, quantity,
          price_usd_tienda, price_bs, price_usd_bcv,
          subtotal_usd_tienda, subtotal_bs, subtotal_usd_bcv
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `);

      for (const item of validatedItems) {
        insertItemStmt.run(
          saleId,
          item.product_id,
          item.product_code,
          item.product_name,
          item.unit,
          item.quantity,
          item.price_usd_tienda,
          item.price_bs,
          item.price_usd_bcv,
          item.subtotal_usd_tienda,
          item.subtotal_bs,
          item.subtotal_usd_bcv
        );

        updateStockStmt.run(item.quantity, item.product_id);
      }

      return saleId;
    });

    const createdSaleId = executeSale();
    const fullSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(createdSaleId);
    const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(createdSaleId);
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    res.status(201).json({
      sale: fullSale,
      items: saleItems,
      customer: customerObj,
      settings
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/sales', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sales = db.prepare('SELECT * FROM sales ORDER BY id DESC LIMIT ?').all(limit);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sales/:id', (req, res) => {
  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({ sale, items, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. DAILY REPORT & SUMMARY
// ==========================================
app.get('/api/reports/daily', (req, res) => {
  try {
    // Current date YYYY-MM-DD
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const sales = db.prepare(`
      SELECT * FROM sales 
      WHERE DATE(created_at, 'localtime') = DATE(?, 'localtime')
      ORDER BY id DESC
    `).all(date);

    let total_usd_tienda = 0;
    let total_bs = 0;
    let total_usd_bcv = 0;
    let total_tickets = sales.length;

    const breakdown = {
      bolivares: { count: 0, total_bs: 0 },
      dolares_tienda: { count: 0, total_usd: 0 },
      dolares_bcv: { count: 0, total_usd: 0 },
      mixto: { count: 0, total_bs: 0, total_usd: 0 }
    };

    sales.forEach(s => {
      total_usd_tienda += s.total_usd_tienda;
      total_bs += s.total_bs;
      total_usd_bcv += s.total_usd_bcv;

      if (breakdown[s.payment_method]) {
        breakdown[s.payment_method].count++;
        if (s.payment_method === 'bolivares') breakdown[s.payment_method].total_bs += s.total_bs;
        if (s.payment_method === 'dolares_tienda') breakdown[s.payment_method].total_usd += s.total_usd_tienda;
        if (s.payment_method === 'dolares_bcv') breakdown[s.payment_method].total_usd += s.total_usd_bcv;
        if (s.payment_method === 'mixto') {
          breakdown[s.payment_method].total_bs += s.amount_paid_bs;
          breakdown[s.payment_method].total_usd += s.amount_paid_usd;
        }
      }
    });

    const lowStock = db.prepare('SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC').all();

    // Top selling products
    const topProducts = db.prepare(`
      SELECT product_name, SUM(quantity) as total_qty, SUM(subtotal_usd_tienda) as total_usd, SUM(subtotal_bs) as total_bs
      FROM sale_items
      GROUP BY product_name
      ORDER BY total_qty DESC
      LIMIT 5
    `).all();

    // Sales by Category
    const categorySales = db.prepare(`
      SELECT p.category, SUM(si.subtotal_usd_tienda) as total_usd, SUM(si.quantity) as total_qty
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.category
      ORDER BY total_usd DESC
    `).all();

    // Last 7 days trend for chart
    const daysTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()];
      
      const daySales = db.prepare(`
        SELECT COALESCE(SUM(total_usd_tienda), 0) as total_usd, COALESCE(SUM(total_bs), 0) as total_bs, COUNT(*) as tickets
        FROM sales
        WHERE DATE(created_at, 'localtime') = DATE(?)
      `).get(dayStr);

      daysTrend.push({
        date: dayStr,
        day: dayName,
        total_usd: daySales ? daySales.total_usd : 0,
        total_bs: daySales ? daySales.total_bs : 0,
        tickets: daySales ? daySales.tickets : 0
      });
    }

    res.json({
      date,
      total_tickets,
      total_usd_tienda: Math.round(total_usd_tienda * 100) / 100,
      total_bs: Math.round(total_bs * 100) / 100,
      total_usd_bcv: Math.round(total_usd_bcv * 100) / 100,
      breakdown,
      sales,
      low_stock_products: lowStock,
      top_products: topProducts,
      category_sales: categorySales,
      days_trend: daysTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CUSTOMERS (Clientes)
// ==========================================
app.get('/api/customers', (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    let customers;
    if (q) {
      customers = db.prepare(`
        SELECT c.*, 
               COUNT(s.id) as total_purchases, 
               COALESCE(SUM(s.total_usd_tienda), 0) as total_spent_usd,
               COALESCE(SUM(s.total_bs), 0) as total_spent_bs
        FROM customers c
        LEFT JOIN sales s ON s.customer_name = c.name OR s.customer_id = c.id
        WHERE LOWER(c.name) LIKE ? OR LOWER(c.id_card) LIKE ? OR LOWER(c.phone) LIKE ?
        GROUP BY c.id
        ORDER BY c.name ASC
      `).all(`%${q}%`, `%${q}%`, `%${q}%`);
    } else {
      customers = db.prepare(`
        SELECT c.*, 
               COUNT(s.id) as total_purchases, 
               COALESCE(SUM(s.total_usd_tienda), 0) as total_spent_usd,
               COALESCE(SUM(s.total_bs), 0) as total_spent_bs
        FROM customers c
        LEFT JOIN sales s ON s.customer_name = c.name OR s.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
      `).all();
    }
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, id_card, phone, address, email } = req.body;
    if (!name || !id_card) {
      return res.status(400).json({ error: 'Nombre y Cédula/RIF son obligatorios' });
    }
    const info = db.prepare(`
      INSERT INTO customers (name, id_card, phone, address, email)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), id_card.trim(), phone || '', address || '', email || '');
    
    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { name, id_card, phone, address, email } = req.body;
    db.prepare(`
      UPDATE customers
      SET name = COALESCE(?, name),
          id_card = COALESCE(?, id_card),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          email = COALESCE(?, email)
      WHERE id = ?
    `).run(name ? name.trim() : null, id_card ? id_card.trim() : null, phone, address, email, req.params.id);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. USERS (Usuarios del Sistema)
// ==========================================
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, pin, created_at FROM users ORDER BY id ASC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, name, role, pin } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: 'Usuario y Nombre son obligatorios' });
    }
    const info = db.prepare(`
      INSERT INTO users (username, name, role, pin)
      VALUES (?, ?, ?, ?)
    `).run(username.trim().toLowerCase(), name.trim(), role || 'cajero', pin || '1234');

    const created = db.prepare('SELECT id, username, name, role, pin, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { username, name, role, pin } = req.body;
    db.prepare(`
      UPDATE users
      SET username = COALESCE(?, username),
          name = COALESCE(?, name),
          role = COALESCE(?, role),
          pin = COALESCE(?, pin)
      WHERE id = ?
    `).run(username ? username.trim().toLowerCase() : null, name ? name.trim() : null, role, pin, req.params.id);

    const updated = db.prepare('SELECT id, username, name, role, pin, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    if (parseInt(req.params.id) === 1) {
      return res.status(400).json({ error: 'No se puede eliminar el usuario administrador principal' });
    }
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/login', (req, res) => {
  try {
    const { username, pin } = req.body;
    const user = db.prepare('SELECT id, username, name, role, pin FROM users WHERE username = ?').get((username || '').trim().toLowerCase());
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.pin && user.pin !== pin) return res.status(401).json({ error: 'PIN incorrecto' });
    res.json({ success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. CREDITS & CUENTAS POR COBRAR
// ==========================================
app.get('/api/credits', (req, res) => {
  try {
    const statusFilter = (req.query.status || 'all').toLowerCase(); // 'all', 'pending', 'overdue', 'paid'
    const search = (req.query.q || '').trim().toLowerCase();

    let query = `
      SELECT s.*, 
             c.phone as customer_phone,
             c.id_card as customer_id_card,
             c.address as customer_address,
             (SELECT COUNT(*) FROM credit_abonos ca WHERE ca.sale_id = s.id) as abonos_count,
             (SELECT COALESCE(SUM(ca.amount_usd), 0) FROM credit_abonos ca WHERE ca.sale_id = s.id) as total_abonos_usd
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.is_credit = 1
    `;

    const params = [];
    if (search) {
      query += ` AND (LOWER(s.customer_name) LIKE ? OR LOWER(s.sale_number) LIKE ? OR LOWER(c.phone) LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY s.id DESC`;
    let credits = db.prepare(query).all(...params);

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute dynamic overdue status and days
    credits = credits.map(c => {
      let isOverdue = false;
      let daysDiff = 0;
      if (c.credit_due_date) {
        const dueDate = new Date(c.credit_due_date);
        const today = new Date(todayStr);
        const diffTime = dueDate.getTime() - today.getTime();
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysDiff < 0 && c.credit_balance_usd > 0.01) {
          isOverdue = true;
        }
      }

      let currentStatus = c.credit_status;
      if (c.credit_balance_usd <= 0.01) {
        currentStatus = 'paid';
      } else if (isOverdue) {
        currentStatus = 'overdue';
      } else {
        currentStatus = 'pending';
      }

      return {
        ...c,
        days_remaining: daysDiff,
        is_overdue: isOverdue,
        computed_status: currentStatus
      };
    });

    if (statusFilter !== 'all') {
      credits = credits.filter(c => c.computed_status === statusFilter);
    }

    // Calculate KPI summaries
    const totalPendingUsd = credits
      .filter(c => c.computed_status !== 'paid')
      .reduce((sum, c) => sum + (c.credit_balance_usd || 0), 0);
    const totalOverdueUsd = credits
      .filter(c => c.computed_status === 'overdue')
      .reduce((sum, c) => sum + (c.credit_balance_usd || 0), 0);
    const rates = getRates();

    res.json({
      credits,
      summary: {
        total_records: credits.length,
        total_pending_usd: Math.round(totalPendingUsd * 100) / 100,
        total_pending_bs: Math.round(totalPendingUsd * rates.tasa_interna * 100) / 100,
        total_overdue_usd: Math.round(totalOverdueUsd * 100) / 100,
        total_overdue_bs: Math.round(totalOverdueUsd * rates.tasa_interna * 100) / 100,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credits/:id/abono', (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    const { amount_usd, payment_method, cashier_name, notes } = req.body;

    const abonoUsd = parseFloat(amount_usd);
    if (isNaN(abonoUsd) || abonoUsd <= 0) {
      return res.status(400).json({ error: 'Monto del abono inválido' });
    }

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    if (!sale) return res.status(404).json({ error: 'Crédito / Venta no encontrada' });
    if (!sale.is_credit) return res.status(400).json({ error: 'Esta venta no es un crédito' });

    const rates = getRates();
    const abonoBs = Math.round(abonoUsd * rates.tasa_interna * 100) / 100;
    const currentBalance = sale.credit_balance_usd || 0;
    const newBalance = Math.max(0, Math.round((currentBalance - abonoUsd) * 100) / 100);
    const newStatus = newBalance <= 0.01 ? 'paid' : 'pending';

    const registerAbono = db.transaction(() => {
      // 1. Insert abono record
      db.prepare(`
        INSERT INTO credit_abonos (sale_id, amount_usd, amount_bs, payment_method, cashier_name, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        saleId,
        abonoUsd,
        abonoBs,
        payment_method || 'efectivo_usd',
        cashier_name || 'Admin Hebert',
        notes || ''
      );

      // 2. Update sale balance and status
      db.prepare(`
        UPDATE sales
        SET credit_balance_usd = ?,
            credit_status = ?
        WHERE id = ?
      `).run(newBalance, newStatus, saleId);
    });

    registerAbono();

    const updatedSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    const abonosList = db.prepare('SELECT * FROM credit_abonos WHERE sale_id = ? ORDER BY id DESC').all(saleId);

    res.json({
      success: true,
      sale: updatedSale,
      abonos: abonosList,
      new_balance_usd: newBalance,
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. QUOTES / PRESUPUESTOS (Cotizaciones)
// ==========================================
app.get('/api/quotes', (req, res) => {
  try {
    const search = (req.query.q || '').trim().toLowerCase();
    let quotes;
    if (search) {
      quotes = db.prepare(`
        SELECT * FROM quotes
        WHERE LOWER(customer_name) LIKE ? OR LOWER(quote_number) LIKE ? OR LOWER(customer_phone) LIKE ?
        ORDER BY id DESC
      `).all(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      quotes = db.prepare('SELECT * FROM quotes ORDER BY id DESC LIMIT 50').all();
    }

    const parsed = quotes.map(q => {
      let items = [];
      try { items = JSON.parse(q.items_json); } catch (e) {}
      return { ...q, items };
    });

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotes', (req, res) => {
  try {
    const {
      customer_name,
      customer_id,
      customer_phone,
      cashier_name,
      items,
      is_cashea,
      notes
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'El presupuesto debe tener al menos un producto' });
    }

    const rates = getRates();
    let total_usd = 0;

    const validatedItems = items.map(item => {
      const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!prod) throw new Error(`Producto ${item.product_id} no existe`);
      const prices = formatProductPrices(prod, rates);
      const unitPriceUsd = is_cashea ? prices.price_cashea : prices.price_usd_tienda;
      const unitPriceBs = Math.round(unitPriceUsd * rates.tasa_interna * 100) / 100;
      const qty = parseFloat(item.quantity) || 1;
      const subtotalUsd = Math.round(unitPriceUsd * qty * 100) / 100;
      const subtotalBs = Math.round(unitPriceBs * qty * 100) / 100;
      total_usd += subtotalUsd;

      return {
        product_id: prod.id,
        product_code: prod.code,
        product_name: prod.name,
        unit: prod.unit,
        quantity: qty,
        price_usd: unitPriceUsd,
        price_bs: unitPriceBs,
        subtotal_usd: subtotalUsd,
        subtotal_bs: subtotalBs
      };
    });

    total_usd = Math.round(total_usd * 100) / 100;
    const total_bs = Math.round(total_usd * rates.tasa_interna * 100) / 100;

    const lastQuote = db.prepare('SELECT id FROM quotes ORDER BY id DESC LIMIT 1').get();
    const nextId = (lastQuote ? lastQuote.id : 0) + 1;
    const quote_number = `COT-${String(nextId).padStart(5, '0')}`;

    const info = db.prepare(`
      INSERT INTO quotes (
        quote_number, customer_name, customer_id, customer_phone, cashier_name,
        items_json, total_usd, total_bs, is_cashea, tasa_interna, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      quote_number,
      customer_name || 'Cliente Mostrador',
      customer_id ? parseInt(customer_id) : null,
      customer_phone || '',
      cashier_name || 'Admin Hebert',
      JSON.stringify(validatedItems),
      total_usd,
      total_bs,
      is_cashea ? 1 : 0,
      rates.tasa_interna,
      notes || ''
    );

    const created = db.prepare('SELECT * FROM quotes WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({
      ...created,
      items: validatedItems,
      settings: db.prepare('SELECT * FROM settings WHERE id = 1').get()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/quotes/:id', (req, res) => {
  try {
    const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    let items = [];
    try { items = JSON.parse(q.items_json); } catch (e) {}
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json({ ...q, items, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotes/:id/convert', (req, res) => {
  try {
    const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    db.prepare("UPDATE quotes SET status = 'converted' WHERE id = ?").run(req.params.id);
    let items = [];
    try { items = JSON.parse(q.items_json); } catch (e) {}
    res.json({ success: true, quote: q, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/quotes/:id', (req, res) => {
  try {
    const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Presupuesto eliminado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. CASH CLOSINGS (Cierres de Caja Diarios)
// ==========================================
app.get('/api/cash-closings', (req, res) => {
  try {
    const closings = db.prepare('SELECT * FROM cash_closings ORDER BY id DESC LIMIT 30').all();
    res.json(closings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-closings', (req, res) => {
  try {
    const {
      closing_date,
      cashier_name,
      initial_cash_usd,
      initial_cash_bs,
      system_efectivo_usd,
      system_zelle_usd,
      system_binance_usd,
      system_efectivo_bs,
      system_pago_movil_bs,
      system_punto_bs,
      system_cashea_usd,
      system_credit_usd,
      total_system_usd,
      total_system_bs,
      actual_cash_usd,
      actual_cash_bs,
      notes
    } = req.body;

    const actualUsd = parseFloat(actual_cash_usd) || 0.0;
    const actualBs = parseFloat(actual_cash_bs) || 0.0;
    const expectedUsd = (parseFloat(initial_cash_usd) || 0) + (parseFloat(system_efectivo_usd) || 0);
    const expectedBs = (parseFloat(initial_cash_bs) || 0) + (parseFloat(system_efectivo_bs) || 0);
    const diffUsd = Math.round((actualUsd - expectedUsd) * 100) / 100;
    const diffBs = Math.round((actualBs - expectedBs) * 100) / 100;

    const info = db.prepare(`
      INSERT INTO cash_closings (
        closing_date, cashier_name, initial_cash_usd, initial_cash_bs,
        system_efectivo_usd, system_zelle_usd, system_binance_usd,
        system_efectivo_bs, system_pago_movil_bs, system_punto_bs,
        system_cashea_usd, system_credit_usd,
        total_system_usd, total_system_bs,
        actual_cash_usd, actual_cash_bs,
        diff_usd, diff_bs, notes
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?
      )
    `).run(
      closing_date || new Date().toISOString().split('T')[0],
      cashier_name || 'Admin Hebert',
      parseFloat(initial_cash_usd) || 0.0,
      parseFloat(initial_cash_bs) || 0.0,
      parseFloat(system_efectivo_usd) || 0.0,
      parseFloat(system_zelle_usd) || 0.0,
      parseFloat(system_binance_usd) || 0.0,
      parseFloat(system_efectivo_bs) || 0.0,
      parseFloat(system_pago_movil_bs) || 0.0,
      parseFloat(system_punto_bs) || 0.0,
      parseFloat(system_cashea_usd) || 0.0,
      parseFloat(system_credit_usd) || 0.0,
      parseFloat(total_system_usd) || 0.0,
      parseFloat(total_system_bs) || 0.0,
      actualUsd,
      actualBs,
      diffUsd,
      diffBs,
      notes || ''
    );

    const created = db.prepare('SELECT * FROM cash_closings WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. FINANCES (Finanzas Avanzadas con Filtros)
// ==========================================
app.get('/api/finances', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || req.query.date || today;
    const endDate = req.query.endDate || startDate;
    const search = (req.query.q || '').trim().toLowerCase();
    const methodFilter = (req.query.method || 'all').toLowerCase();

    // Query sales within date range
    let query = `
      SELECT s.*,
             (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as total_items_count
      FROM sales s
      WHERE DATE(s.created_at, 'localtime') >= DATE(?)
        AND DATE(s.created_at, 'localtime') <= DATE(?)
    `;

    const params = [startDate, endDate];

    if (search) {
      query += ` AND (LOWER(s.sale_number) LIKE ? OR LOWER(s.customer_name) LIKE ? OR LOWER(s.cashier_name) LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (methodFilter !== 'all') {
      if (methodFilter === 'cashea') {
        query += ` AND s.is_cashea = 1`;
      } else if (methodFilter === 'credito') {
        query += ` AND s.is_credit = 1`;
      } else {
        query += ` AND LOWER(s.payment_method) LIKE ?`;
        params.push(`%${methodFilter}%`);
      }
    }

    query += ` ORDER BY s.id DESC`;
    const sales = db.prepare(query).all(...params);

    // Calculate aggregated metrics
    let totalSalesUsd = 0;
    let totalSalesBs = 0;
    let totalCogsUsd = 0;

    let efectivoUsd = 0;
    let zelleUsd = 0;
    let binanceUsd = 0;

    let efectivoBs = 0;
    let pagoMovilBs = 0;
    let puntoBs = 0;

    let casheaInitialUsd = 0;
    let casheaFinancedUsd = 0;
    let creditoTotalUsd = 0;

    // Attach items and compute per-sale cost & profit
    const detailedSales = sales.map(s => {
      const items = db.prepare(`
        SELECT si.*, p.cost_usd
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(s.id);

      let saleCostUsd = 0;
      items.forEach(it => {
        const itemCost = (it.cost_usd || 0) * it.quantity;
        saleCostUsd += itemCost;
      });

      saleCostUsd = Math.round(saleCostUsd * 100) / 100;
      const saleProfitUsd = Math.round((s.total_usd_tienda - saleCostUsd) * 100) / 100;
      const profitMarginPct = s.total_usd_tienda > 0 ? Math.round((saleProfitUsd / s.total_usd_tienda) * 1000) / 10 : 0;

      totalSalesUsd += s.total_usd_tienda;
      totalSalesBs += s.total_bs;
      totalCogsUsd += saleCostUsd;

      // Channels Breakdown
      if (s.is_cashea) {
        casheaInitialUsd += (s.cashea_initial_usd || s.amount_paid_usd || 0);
        casheaFinancedUsd += (s.cashea_financed_usd || Math.max(0, s.total_usd_tienda - (s.cashea_initial_usd || 0)));
      } else if (s.is_credit) {
        creditoTotalUsd += s.total_usd_tienda;
      }

      // Check specific channel fields or fallback to notes / payment_method
      if (s.paid_efectivo_usd > 0) efectivoUsd += s.paid_efectivo_usd;
      if (s.paid_zelle_usd > 0) zelleUsd += s.paid_zelle_usd;
      if (s.paid_binance_usd > 0) binanceUsd += s.paid_binance_usd;

      if (s.paid_efectivo_bs > 0) efectivoBs += s.paid_efectivo_bs;
      if (s.paid_pago_movil_bs > 0) pagoMovilBs += s.paid_pago_movil_bs;
      if (s.paid_punto_bs > 0) puntoBs += s.paid_punto_bs;

      // Fallback for earlier records
      if (!s.paid_efectivo_usd && !s.paid_zelle_usd && !s.paid_binance_usd && !s.paid_efectivo_bs && !s.paid_pago_movil_bs && !s.paid_punto_bs) {
        const method = (s.payment_method || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        if (method === 'bolivares') {
          if (notes.includes('pago móvil') || notes.includes('pago movil')) pagoMovilBs += s.total_bs;
          else if (notes.includes('punto')) puntoBs += s.total_bs;
          else efectivoBs += s.total_bs;
        } else if (method === 'dolares_tienda' || method === 'dolares_bcv' || method === 'dolares_efectivo') {
          if (notes.includes('zelle')) zelleUsd += s.total_usd_tienda;
          else if (notes.includes('binance')) binanceUsd += s.total_usd_tienda;
          else efectivoUsd += s.total_usd_tienda;
        } else if (method === 'mixto') {
          efectivoUsd += (s.amount_paid_usd || 0);
          pagoMovilBs += (s.amount_paid_bs || 0);
        }
      }

      return {
        ...s,
        sale_cost_usd: saleCostUsd,
        sale_profit_usd: saleProfitUsd,
        profit_margin_percent: profitMarginPct,
        items
      };
    });

    totalSalesUsd = Math.round(totalSalesUsd * 100) / 100;
    totalSalesBs = Math.round(totalSalesBs * 100) / 100;
    totalCogsUsd = Math.round(totalCogsUsd * 100) / 100;
    const grossProfitUsd = Math.round((totalSalesUsd - totalCogsUsd) * 100) / 100;
    const rates = getRates();
    const grossProfitBs = Math.round(grossProfitUsd * rates.tasa_interna * 100) / 100;
    const overallMarginPct = totalSalesUsd > 0 ? Math.round((grossProfitUsd / totalSalesUsd) * 1000) / 10 : 0;

    res.json({
      startDate,
      endDate,
      total_tickets: sales.length,
      total_sales_usd: totalSalesUsd,
      total_sales_bs: totalSalesBs,
      total_cost_usd: totalCogsUsd,
      gross_profit_usd: grossProfitUsd,
      gross_profit_bs: grossProfitBs,
      profit_margin_percent: overallMarginPct,
      methods: {
        efectivo_usd: Math.round(efectivoUsd * 100) / 100,
        zelle_usd: Math.round(zelleUsd * 100) / 100,
        binance_usd: Math.round(binanceUsd * 100) / 100,
        efectivo_bs: Math.round(efectivoBs * 100) / 100,
        pago_movil_bs: Math.round(pagoMovilBs * 100) / 100,
        punto_bs: Math.round(puntoBs * 100) / 100,
        cashea_initial_usd: Math.round(casheaInitialUsd * 100) / 100,
        cashea_financed_usd: Math.round(casheaFinancedUsd * 100) / 100,
        credito_total_usd: Math.round(creditoTotalUsd * 100) / 100
      },
      sales: detailedSales
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build if exists (support both root dist and client/dist)
const fs = require('fs');
const distPath = fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, 'client', 'dist');

app.use(express.static(distPath));

// Serve frontend fallback for SPA
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: 'API Ferretería Hebert activa. Cliente Web en desarrollo.' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Sistema Ferretería Hebert iniciado con éxito!`);
    console.log(`👉 En esta PC:   http://localhost:${PORT}`);
    console.log(`👉 Para la 2da PC o Teléfono en WiFi local: http://<IP-DE-ESTA-PC>:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
