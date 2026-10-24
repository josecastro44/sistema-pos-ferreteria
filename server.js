const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper to get active rates
function getRates() {
  const settings = db.prepare('SELECT tasa_interna, tasa_bcv FROM settings WHERE id = 1').get();
  return {
    tasa_interna: settings ? settings.tasa_interna : 960.00,
    tasa_bcv: settings ? settings.tasa_bcv : 866.56,
  };
}

// Calculate prices helper
function formatProductPrices(prod, rates) {
  const price_usd_tienda = prod.price_usd;
  const price_bs = Math.round((price_usd_tienda * rates.tasa_interna) * 100) / 100;
  const price_usd_bcv = Math.round((price_bs / rates.tasa_bcv) * 100) / 100;
  return {
    ...prod,
    price_usd_tienda,
    price_bs,
    price_usd_bcv
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
    const { store_name, rif, phone, address, tasa_interna, tasa_bcv, receipt_footer } = req.body;
    db.prepare(`
      UPDATE settings
      SET store_name = COALESCE(?, store_name),
          rif = COALESCE(?, rif),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          tasa_interna = COALESCE(?, tasa_interna),
          tasa_bcv = COALESCE(?, tasa_bcv),
          receipt_footer = COALESCE(?, receipt_footer)
      WHERE id = 1
    `).run(
      store_name,
      rif,
      phone,
      address,
      tasa_interna ? parseFloat(tasa_interna) : null,
      tasa_bcv ? parseFloat(tasa_bcv) : null,
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
    const { code, name, category, unit, allow_decimals, cost_usd, price_usd, stock, min_stock, synonyms, image_url } = req.body;
    if (!code || !name || price_usd === undefined) {
      return res.status(400).json({ error: 'Código, nombre y precio en USD son obligatorios' });
    }

    const info = db.prepare(`
      INSERT INTO products (code, name, category, unit, allow_decimals, cost_usd, price_usd, stock, min_stock, synonyms, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim(),
      name.trim(),
      category || 'General',
      unit || 'und',
      allow_decimals ? 1 : 0,
      parseFloat(cost_usd) || 0.0,
      parseFloat(price_usd) || 0.0,
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
    const { code, name, category, unit, allow_decimals, cost_usd, price_usd, stock, min_stock, synonyms, image_url } = req.body;

    db.prepare(`
      UPDATE products
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          unit = COALESCE(?, unit),
          allow_decimals = COALESCE(?, allow_decimals),
          cost_usd = COALESCE(?, cost_usd),
          price_usd = COALESCE(?, price_usd),
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
      cashier_name,
      payment_method, // 'bolivares', 'dolares_tienda', 'dolares_bcv', 'mixto'
      amount_paid_bs,
      amount_paid_usd,
      change_bs,
      change_usd,
      notes,
      items
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'La venta debe contener al menos un producto' });
    }

    const rates = getRates();

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
      const subtotal_usd_tienda = Math.round(prices.price_usd_tienda * qty * 100) / 100;
      const subtotal_bs = Math.round(prices.price_bs * qty * 100) / 100;
      const subtotal_usd_bcv = Math.round(prices.price_usd_bcv * qty * 100) / 100;

      total_usd_tienda += subtotal_usd_tienda;
      total_bs += subtotal_bs;
      total_usd_bcv += subtotal_usd_bcv;

      return {
        product_id: prod.id,
        product_code: prod.code,
        product_name: prod.name,
        unit: prod.unit,
        quantity: qty,
        price_usd_tienda: prices.price_usd_tienda,
        price_bs: prices.price_bs,
        price_usd_bcv: prices.price_usd_bcv,
        subtotal_usd_tienda,
        subtotal_bs,
        subtotal_usd_bcv
      };
    });

    total_usd_tienda = Math.round(total_usd_tienda * 100) / 100;
    total_bs = Math.round(total_bs * 100) / 100;
    total_usd_bcv = Math.round(total_usd_bcv * 100) / 100;

    // Generate unique sale number like TICK-00001
    const lastSale = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get();
    const nextId = (lastSale ? lastSale.id : 0) + 1;
    const sale_number = `TICK-${String(nextId).padStart(5, '0')}`;

    // Execute sale and inventory deduction in a single SQLite transaction
    const executeSale = db.transaction(() => {
      // 1. Insert sale record
      const insertSale = db.prepare(`
        INSERT INTO sales (
          sale_number, customer_name, customer_id, cashier_name, tasa_interna, tasa_bcv,
          total_usd_tienda, total_bs, total_usd_bcv,
          payment_method, amount_paid_bs, amount_paid_usd,
          change_bs, change_usd, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sale_number,
        customer_name || 'Cliente Mostrador',
        customer_id ? parseInt(customer_id) : null,
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
        notes || ''
      );

      const saleId = insertSale.lastInsertRowid;

      // 2. Insert items and discount inventory stock
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
// 7. FINANCES (Finanzas & Flujo de Caja)
// ==========================================
app.get('/api/finances', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const allSales = db.prepare(`SELECT * FROM sales WHERE DATE(created_at, 'localtime') = DATE(?)`).all(date);
    
    let totalBs = 0;
    let totalUsdTienda = 0;
    let totalUsdBcv = 0;
    
    let pagoMovilBs = 0;
    let puntoVentaBs = 0;
    let efectivoBs = 0;
    let efectivoUsd = 0;
    let zelleUsd = 0;
    let mixtoBs = 0;
    let mixtoUsd = 0;

    allSales.forEach(s => {
      totalBs += s.total_bs;
      totalUsdTienda += s.total_usd_tienda;
      totalUsdBcv += s.total_usd_bcv;

      const method = (s.payment_method || '').toLowerCase();
      const notes = (s.notes || '').toLowerCase();

      if (method === 'bolivares') {
        if (notes.includes('pago móvil') || notes.includes('pago movil')) pagoMovilBs += s.total_bs;
        else if (notes.includes('punto')) puntoVentaBs += s.total_bs;
        else efectivoBs += s.total_bs;
      } else if (method === 'dolares_tienda' || method === 'dolares_bcv') {
        if (notes.includes('zelle') || notes.includes('transf')) zelleUsd += s.total_usd_tienda;
        else efectivoUsd += s.total_usd_tienda;
      } else if (method === 'mixto') {
        mixtoBs += (s.amount_paid_bs || 0);
        mixtoUsd += (s.amount_paid_usd || 0);
      }
    });

    const cogsQuery = db.prepare(`
      SELECT SUM(p.cost_usd * si.quantity) as total_cost_usd
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at, 'localtime') = DATE(?)
    `).get(date);

    const totalCostUsd = cogsQuery && cogsQuery.total_cost_usd ? Math.round(cogsQuery.total_cost_usd * 100) / 100 : 0;
    const grossProfitUsd = Math.round((totalUsdTienda - totalCostUsd) * 100) / 100;
    const rates = getRates();
    const grossProfitBs = Math.round(grossProfitUsd * rates.tasa_interna * 100) / 100;

    res.json({
      date,
      total_tickets: allSales.length,
      total_bs: Math.round(totalBs * 100) / 100,
      total_usd_tienda: Math.round(totalUsdTienda * 100) / 100,
      total_usd_bcv: Math.round(totalUsdBcv * 100) / 100,
      total_cost_usd: totalCostUsd,
      gross_profit_usd: grossProfitUsd,
      gross_profit_bs: grossProfitBs,
      methods: {
        pago_movil_bs: Math.round(pagoMovilBs * 100) / 100,
        punto_venta_bs: Math.round(puntoVentaBs * 100) / 100,
        efectivo_bs: Math.round(efectivoBs * 100) / 100,
        efectivo_usd: Math.round(efectivoUsd * 100) / 100,
        zelle_usd: Math.round(zelleUsd * 100) / 100,
        mixto_bs: Math.round(mixtoBs * 100) / 100,
        mixto_usd: Math.round(mixtoUsd * 100) / 100,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build if exists
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Serve frontend fallback for SPA
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
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
