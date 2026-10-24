import React, { useState, useEffect, useRef } from 'react';
import MainLayout from './components/MainLayout';
import PosView from './components/PosView';
import CustomersView from './components/CustomersView';
import EditProductView from './components/EditProductView';
import FinancesView from './components/FinancesView';
import UsersView from './components/UsersView';
import {
  Plus,
  Edit,
  Trash2,
  Printer,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  CreditCard,
  Smartphone,
  Layers,
  Coins,
  Search,
  Box,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'dashboard', 'customers', 'inventory', 'edit-product', 'sales', 'finances', 'users', 'settings'
  const [posViewMode, setPosViewMode] = useState('grid'); // 'grid' (Cuadrícula) or 'list' (Lista)

  // Customers State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Users & Shift State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pos_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { id: 1, username: 'admin', name: 'Admin Hebert', role: 'admin' };
  });
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState(false);
  const [switchUserPinInput, setSwitchUserPinInput] = useState('');
  const [targetUserToSwitch, setTargetUserToSwitch] = useState(null);

  // Global settings & rates
  const [settings, setSettings] = useState({
    store_name: 'Ferretería Hebert',
    rif: 'J-12345678-9',
    phone: '0414-0000000',
    address: 'Calle Principal, Local 1',
    tasa_interna: 960.00,
    tasa_bcv: 866.56,
    receipt_footer: '¡Gracias por su compra!'
  });

  // Rates Modal
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [tempRates, setTempRates] = useState({ tasa_interna: 960, tasa_bcv: 866.56 });

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const searchInputRef = useRef(null);

  // Decimal Quantity Modal for items like kg / meters
  const [decimalItemModal, setDecimalItemModal] = useState(null);
  const [decimalQtyInput, setDecimalQtyInput] = useState('1');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('bolivares'); // 'bolivares', 'dolares_tienda', 'dolares_bcv', 'mixto'
  const [bsSubMethod, setBsSubMethod] = useState('Pago Móvil'); // 'Pago Móvil', 'Punto de Venta', 'Efectivo Bs'
  const [amountPaidBs, setAmountPaidBs] = useState('');
  const [amountPaidUsd, setAmountPaidUsd] = useState('');
  const [mixtoUsdPaid, setMixtoUsdPaid] = useState('');

  // Receipt Modal State
  const [printedSale, setPrintedSale] = useState(null);

  // Inventory Management State
  const [inventorySearch, setInventorySearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [stockAdjustModal, setStockAdjustModal] = useState(null);
  const [stockAdjustQty, setStockAdjustQty] = useState('');

  // Sales History & Daily Report State
  const [salesList, setSalesList] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [chartMetric, setChartMetric] = useState('usd'); // 'usd' or 'bs'

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Keyboard Shortcuts (F2: Search, F4: Checkout, Esc: Close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (activeTab === 'pos' && cart.length > 0) {
          openCheckout();
        }
      } else if (e.key === 'Escape') {
        setIsRatesModalOpen(false);
        setDecimalItemModal(null);
        setIsCheckoutOpen(false);
        setPrintedSale(null);
        setIsProductModalOpen(false);
        setStockAdjustModal(null);
        setDeleteConfirmModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, cart]);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      setSettings(data);
      setTempRates({ tasa_interna: data.tasa_interna, tasa_bcv: data.tasa_bcv });
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Fetch Products
  const fetchProducts = async (q = '') => {
    try {
      const res = await fetch(`${API_BASE}/products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch Sales
  const fetchSales = async () => {
    try {
      const res = await fetch(`${API_BASE}/sales`);
      const data = await res.json();
      setSalesList(data);
    } catch (err) {
      console.error('Error fetching sales:', err);
    }
  };

  // Fetch Daily Report & Analytics
  const fetchDailyReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/daily`);
      const data = await res.json();
      setDailyReport(data);
    } catch (err) {
      console.error('Error fetching daily report:', err);
    }
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    fetchDailyReport();
    fetchCustomers();
    fetchUsers();
  }, []);

  // When changing tabs
  useEffect(() => {
    if (activeTab === 'pos') {
      fetchProducts(searchQuery);
      fetchCustomers();
    } else if (activeTab === 'inventory' || activeTab === 'edit-product') {
      fetchProducts();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'sales') {
      fetchSales();
    } else if (activeTab === 'dashboard' || activeTab === 'finances') {
      fetchDailyReport();
      fetchProducts();
    }
  }, [activeTab]);

  // Handle live search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchProducts(val);
  };

  // Update Rates
  const handleSaveRates = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasa_interna: parseFloat(tempRates.tasa_interna),
          tasa_bcv: parseFloat(tempRates.tasa_bcv)
        })
      });
      const updated = await res.json();
      setSettings(updated);
      setIsRatesModalOpen(false);
      showToast('¡Tasas actualizadas con éxito!');
      fetchProducts(searchQuery);
      fetchDailyReport();
    } catch (err) {
      showToast('Error actualizando tasas', 'error');
    }
  };

  // Add to cart logic
  const handleProductClick = (prod) => {
    if (prod.allow_decimals) {
      setDecimalItemModal(prod);
      setDecimalQtyInput('1');
    } else {
      addToCart(prod, 1);
    }
  };

  const addToCart = (prod, qty) => {
    const quantity = parseFloat(qty);
    if (isNaN(quantity) || quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product_id === prod.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === prod.id
            ? { ...item, quantity: Math.round((item.quantity + quantity) * 100) / 100 }
            : item
        );
      }
      return [...prev, {
        product_id: prod.id,
        code: prod.code,
        name: prod.name,
        unit: prod.unit,
        price_usd_tienda: prod.price_usd_tienda,
        price_bs: prod.price_bs,
        price_usd_bcv: prod.price_usd_bcv,
        quantity: quantity
      }];
    });

    setDecimalItemModal(null);
    showToast(`Agregado: ${prod.name}`);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = Math.round((item.quantity + delta) * 100) / 100;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  // Cart Totals
  const cartTotals = cart.reduce((acc, item) => {
    acc.total_usd_tienda += item.price_usd_tienda * item.quantity;
    acc.total_bs += item.price_bs * item.quantity;
    acc.total_usd_bcv += item.price_usd_bcv * item.quantity;
    return acc;
  }, { total_usd_tienda: 0, total_bs: 0, total_usd_bcv: 0 });

  cartTotals.total_usd_tienda = Math.round(cartTotals.total_usd_tienda * 100) / 100;
  cartTotals.total_bs = Math.round(cartTotals.total_bs * 100) / 100;
  cartTotals.total_usd_bcv = Math.round(cartTotals.total_usd_bcv * 100) / 100;

  // Checkout Calculations
  const openCheckout = () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }
    setCheckoutMethod('bolivares');
    setAmountPaidBs(cartTotals.total_bs.toString());
    setAmountPaidUsd('');
    setMixtoUsdPaid('');
    setIsCheckoutOpen(true);
  };

  // Process Checkout
  const handleProcessSale = async () => {
    try {
      let paidBs = 0;
      let paidUsd = 0;
      let changeBs = 0;
      let changeUsd = 0;
      let notes = '';

      if (checkoutMethod === 'bolivares') {
        paidBs = parseFloat(amountPaidBs) || cartTotals.total_bs;
        changeBs = Math.max(0, paidBs - cartTotals.total_bs);
        notes = `Bolívares (${bsSubMethod})`;
      } else if (checkoutMethod === 'dolares_tienda') {
        paidUsd = parseFloat(amountPaidUsd) || cartTotals.total_usd_tienda;
        changeUsd = Math.max(0, paidUsd - cartTotals.total_usd_tienda);
        changeBs = Math.round((changeUsd * settings.tasa_interna) * 100) / 100;
        notes = 'Divisas Efectivo / Zelle (Tasa Tienda)';
      } else if (checkoutMethod === 'dolares_bcv') {
        paidUsd = parseFloat(amountPaidUsd) || cartTotals.total_usd_bcv;
        changeUsd = Math.max(0, paidUsd - cartTotals.total_usd_bcv);
        changeBs = Math.round((changeUsd * settings.tasa_bcv) * 100) / 100;
        notes = 'Divisas (Tasa Oficial BCV)';
      } else if (checkoutMethod === 'mixto') {
        paidUsd = parseFloat(mixtoUsdPaid) || 0;
        const remainingInBs = Math.max(0, cartTotals.total_bs - (paidUsd * settings.tasa_interna));
        paidBs = remainingInBs;
        notes = `Pago Mixto: $${paidUsd} Efectivo + Bs. ${paidBs.toLocaleString('es-VE')} en Bolívares`;
      }

      const payload = {
        customer_name: customerName || 'Cliente Mostrador',
        customer_id: selectedCustomerId,
        cashier_name: currentUser?.name || 'Admin Hebert',
        payment_method: checkoutMethod,
        amount_paid_bs: paidBs,
        amount_paid_usd: paidUsd,
        change_bs: changeBs,
        change_usd: changeUsd,
        notes,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      };

      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al procesar venta');
      }

      const result = await res.json();
      setIsCheckoutOpen(false);
      setCart([]);
      setPrintedSale(result);
      showToast('¡Venta completada con éxito!');
      fetchProducts(searchQuery);
      fetchDailyReport();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete product logic
  const handleDeleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Producto eliminado');
        setDeleteConfirmModal(null);
        fetchProducts();
      } else {
        showToast('Error al eliminar producto', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Categories list
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Low stock products count
  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      cartCount={cart.length}
      lowStockCount={lowStockCount}
      settings={settings}
      onOpenRatesModal={() => {
        setTempRates({ tasa_interna: settings.tasa_interna, tasa_bcv: settings.tasa_bcv });
        setIsRatesModalOpen(true);
      }}
      onOpenNewProductModal={() => {
        setEditingProduct(null);
        setProductImagePreview('');
        setIsProductModalOpen(true);
      }}
      currentUser={currentUser}
      onSwitchUser={() => {
        setSwitchUserPinInput('');
        setTargetUserToSwitch(users.find(u => u.id !== currentUser?.id) || users[0]);
        setIsSwitchUserModalOpen(true);
      }}
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
    >
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white font-medium flex items-center gap-3 transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle className="w-5 h-5 text-white" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 1: PUNTO DE VENTA (POS)                              */}
      {/* ========================================================= */}
      {activeTab === 'pos' && (
        <PosView
          products={filteredProducts}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          posViewMode={posViewMode}
          setPosViewMode={setPosViewMode}
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customers={customers}
          cartTotals={cartTotals}
          onProductClick={handleProductClick}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          clearCart={() => setCart([])}
          onOpenCheckout={openCheckout}
        />
      )}

      {/* ========================================================= */}
      {/* VISTA 2: DASHBOARD & MÉTRICAS                              */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && dailyReport && (
        <div className="space-y-4 max-w-[1720px] mx-auto">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard General</h2>
            <p className="text-xs text-gray-400 mt-1">Métricas clave, flujo de caja y distribución de ventas</p>
          </div>

          {/* Metric Cards in Pure White */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Ventas en Bolívares</span>
                <div className="text-2xl font-black font-mono text-gray-900 mt-1">
                  Bs. {dailyReport.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Ingresos de hoy</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total USD (Tienda)</span>
                <div className="text-2xl font-black font-mono text-gray-900 mt-1">
                  ${dailyReport.total_usd_tienda.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Tasa reposición</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                $
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total USD (BCV)</span>
                <div className="text-2xl font-black font-mono text-gray-900 mt-1">
                  ${dailyReport.total_usd_bcv.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Tasa oficial bancaria</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tickets Emitidos</span>
                <div className="text-2xl font-black font-mono text-gray-900 mt-1">
                  {dailyReport.total_tickets}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Operaciones completadas</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Box className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: CLIENTES                                         */}
      {/* ========================================================= */}
      {activeTab === 'customers' && (
        <CustomersView
          customers={customers}
          fetchCustomers={fetchCustomers}
          onSelectCustomerForSale={(cust) => {
            setCustomerName(`${cust.name} (${cust.id_card})`);
            setSelectedCustomerId(cust.id);
            setActiveTab('pos');
            showToast(`Cliente ${cust.name} asignado al mostrador`);
          }}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* VISTA 4: EDITAR PRODUCTO (BÚSQUEDA Y EDICIÓN RÁPIDA)      */}
      {/* ========================================================= */}
      {activeTab === 'edit-product' && (
        <EditProductView
          products={products}
          categories={categories}
          onEditProduct={(prod) => {
            setEditingProduct(prod);
            setProductImagePreview(prod.image_url || '');
            setIsProductModalOpen(true);
          }}
          onAdjustStock={(prod) => {
            setStockAdjustModal(prod);
            setStockAdjustQty('');
          }}
          settings={settings}
        />
      )}

      {/* ========================================================= */}
      {/* VISTA 5: INVENTARIO & PRODUCTOS (COMPLETO)                 */}
      {/* ========================================================= */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-4 shadow-xs max-w-[1720px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Catálogo de Productos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Administra precios, fotos y existencias de la ferretería</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => {
                    setInventorySearch(e.target.value);
                    fetchProducts(e.target.value);
                  }}
                  placeholder="Buscar producto o código..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-800 w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                />
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductImagePreview('');
                  setIsProductModalOpen(true);
                }}
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Foto</th>
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Nombre & Sinónimos</th>
                  <th className="pb-3">Categoría</th>
                  <th className="pb-3 text-center">Stock</th>
                  <th className="pb-3 text-right">Costo USD</th>
                  <th className="pb-3 text-right text-gray-700">USD Tienda</th>
                  <th className="pb-3 text-right text-emerald-600">Precio Bolívares</th>
                  <th className="pb-3 text-right text-[#4f46e5]">USD BCV</th>
                  <th className="pb-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 font-mono font-medium text-gray-500">{p.code}</td>
                    <td className="py-3">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      {p.synonyms && (
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{p.synonyms}</div>
                      )}
                    </td>
                    <td className="py-3 text-gray-600 font-medium">{p.category}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                          p.stock <= p.min_stock
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-gray-400">${p.cost_usd.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-bold text-gray-800">
                      ${p.price_usd_tienda.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-black text-emerald-600">
                      Bs. {p.price_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-[#4f46e5]">
                      ${p.price_usd_bcv.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setStockAdjustModal(p);
                            setStockAdjustQty('');
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ajustar Stock"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setProductImagePreview(p.image_url || '');
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmModal(p)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 4: HISTORIAL DE VENTAS                              */}
      {/* ========================================================= */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-4 shadow-xs max-w-[1720px] mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Historial de Facturación</h2>
              <p className="text-xs text-gray-400 mt-0.5">Registro de operaciones con reimpresión de comprobante 58mm</p>
            </div>
            <button
              onClick={fetchSales}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-gray-200"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#4f46e5]" />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Ticket</th>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Forma de Pago</th>
                  <th className="pb-3 text-right">USD Tienda</th>
                  <th className="pb-3 text-right text-emerald-600">Total Bolívares</th>
                  <th className="pb-3 text-right text-[#4f46e5]">USD BCV</th>
                  <th className="pb-3 text-center">Ticket 58mm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salesList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      No hay ventas registradas aún
                    </td>
                  </tr>
                ) : (
                  salesList.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-gray-900">{sale.sale_number}</td>
                      <td className="py-3 text-gray-500 font-mono">
                        {new Date(sale.created_at).toLocaleString('es-VE')}
                      </td>
                      <td className="py-3 font-semibold text-gray-900">{sale.customer_name}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                          {sale.notes || sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-gray-900">
                        ${sale.total_usd_tienda.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-emerald-600">
                        Bs. {sale.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-[#4f46e5]">
                        ${sale.total_usd_bcv.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={async () => {
                            const res = await fetch(`${API_BASE}/sales/${sale.id}`);
                            const data = await res.json();
                            setPrintedSale(data);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reimprimir</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 8: FINANZAS & ARQUEO DE CAJA                        */}
      {/* ========================================================= */}
      {(activeTab === 'finances' || activeTab === 'reports') && (
        <FinancesView settings={settings} />
      )}

      {/* ========================================================= */}
      {/* VISTA 10: USUARIOS DEL SISTEMA                            */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <UsersView
          users={users}
          fetchUsers={fetchUsers}
          currentUser={currentUser}
          onSwitchUserSession={(u) => {
            setTargetUserToSwitch(u);
            setSwitchUserPinInput('');
            setIsSwitchUserModalOpen(true);
          }}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* VISTA 11: CONFIGURACIÓN & TICKETS                         */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ajustes de la Ferretería & Ticket 58mm</h2>
            <p className="text-xs text-gray-400 mt-0.5">Información que encabeza los comprobantes de compra</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-gray-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">RIF / Cédula</label>
              <input
                type="text"
                value={settings.rif}
                onChange={(e) => setSettings({ ...settings, rif: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Teléfono</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Dirección</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-gray-700 block mb-1">Mensaje al Pie del Ticket</label>
              <input
                type="text"
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#4f46e5]" />
              <span>Conexión para 2da PC y Celular en Red Local</span>
            </div>
            <p className="text-gray-500">
              Conecta cualquier dispositivo a la red WiFi y abre en el navegador:
            </p>
            <div className="p-2 bg-white rounded-lg border border-gray-200 font-mono text-xs font-bold text-gray-800 inline-block mt-1">
              http://[IP-DE-ESTA-PC]:3000
            </div>
          </div>

          <button
            onClick={async () => {
              await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
              });
              showToast('¡Configuración guardada!');
            }}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs"
          >
            Guardar Ajustes
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CAMBIAR TASAS DEL DÍA                              */}
      {/* ========================================================= */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>Actualizar Tasas del Día</span>
              </h3>
              <button onClick={() => setIsRatesModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Todos los precios en Bolívares y Dólares BCV se actualizarán automáticamente.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <label className="font-semibold text-gray-700 block mb-1">
                  Tasa Tienda / Reposición (Bs. / USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-bold text-gray-400">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRates.tasa_interna}
                    onChange={(e) => setTempRates({ ...tempRates, tasa_interna: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <label className="font-semibold text-gray-700 block mb-1">
                  Tasa Oficial Banco Central (BCV)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-bold text-gray-400">Bs.</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRates.tasa_bcv}
                    onChange={(e) => setTempRates({ ...tempRates, tasa_bcv: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRates}
                className="flex-1 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Actualizar Tasas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CANTIDAD DECIMAL (KG / METROS)                      */}
      {/* ========================================================= */}
      {decimalItemModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">
                Indicar Cantidad ({decimalItemModal.unit})
              </h3>
              <button onClick={() => setDecimalItemModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="font-bold text-gray-900 text-xs">{decimalItemModal.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                Bs. {decimalItemModal.price_bs.toLocaleString('es-VE')} / {decimalItemModal.unit} (${decimalItemModal.price_usd_tienda})
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Cantidad a despachar ({decimalItemModal.unit}):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={decimalQtyInput}
                onChange={(e) => setDecimalQtyInput(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-mono font-bold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addToCart(decimalItemModal, decimalQtyInput);
                }}
              />
              <div className="flex gap-1.5 mt-2 justify-center">
                {['0.25', '0.5', '1', '2', '5'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDecimalQtyInput(val)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                  >
                    {val} {decimalItemModal.unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDecimalItemModal(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => addToCart(decimalItemModal, decimalQtyInput)}
                className="flex-1 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Agregar a Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COBRO CON 1 SOLO CLIC                               */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">Finalizar Venta & Cobro</h3>
                <p className="text-xs text-gray-400">Cliente: {customerName || 'Cliente Mostrador'}</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Box */}
            <div className="bg-gray-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Total a Cobrar</span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  Bs. {cartTotals.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-300 font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                  ${cartTotals.total_usd_tienda.toFixed(2)} Tienda
                </div>
                <div className="text-xs text-sky-300 font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg mt-1">
                  ${cartTotals.total_usd_bcv.toFixed(2)} BCV
                </div>
              </div>
            </div>

            {/* 4 One-Click Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('bolivares');
                  setAmountPaidBs(cartTotals.total_bs.toString());
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  checkoutMethod === 'bolivares'
                    ? 'border-[#4f46e5] bg-indigo-50/60 text-[#4f46e5] ring-2 ring-[#4f46e5]/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">Bolívares</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Punto / Pago Móvil</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('dolares_tienda');
                  setAmountPaidUsd(cartTotals.total_usd_tienda.toString());
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  checkoutMethod === 'dolares_tienda'
                    ? 'border-[#4f46e5] bg-indigo-50/60 text-[#4f46e5] ring-2 ring-[#4f46e5]/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">$ Tienda</div>
                <div className="text-[10px] text-gray-400 mt-0.5">${cartTotals.total_usd_tienda.toFixed(2)}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('dolares_bcv');
                  setAmountPaidUsd(cartTotals.total_usd_bcv.toString());
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  checkoutMethod === 'dolares_bcv'
                    ? 'border-[#4f46e5] bg-indigo-50/60 text-[#4f46e5] ring-2 ring-[#4f46e5]/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">$ BCV</div>
                <div className="text-[10px] text-gray-400 mt-0.5">${cartTotals.total_usd_bcv.toFixed(2)}</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('mixto');
                  setMixtoUsdPaid('10');
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  checkoutMethod === 'mixto'
                    ? 'border-[#4f46e5] bg-indigo-50/60 text-[#4f46e5] ring-2 ring-[#4f46e5]/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">Pago Mixto</div>
                <div className="text-[10px] text-gray-400 mt-0.5">$ + Bolívares</div>
              </button>
            </div>

            {/* Sub-method panel */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
              {checkoutMethod === 'bolivares' && (
                <>
                  <div className="flex gap-2">
                    {['Pago Móvil', 'Punto de Venta', 'Efectivo Bs'].map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setBsSubMethod(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 border transition-all ${
                          bsSubMethod === sub
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Monto Recibido en Bolívares (Bs.):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaidBs}
                      onChange={(e) => setAmountPaidBs(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                    />
                  </div>

                  {parseFloat(amountPaidBs) > cartTotals.total_bs && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-800">Vuelto a entregar al cliente:</span>
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        Bs. {(parseFloat(amountPaidBs) - cartTotals.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </>
              )}

              {checkoutMethod === 'dolares_tienda' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Monto Recibido en Dólares ($ Efectivo / Zelle):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaidUsd}
                      onChange={(e) => setAmountPaidUsd(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                    />
                  </div>

                  {parseFloat(amountPaidUsd) > cartTotals.total_usd_tienda && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-900">Vuelto en Dólares:</span>
                        <span className="font-mono font-black text-amber-700 text-sm">
                          ${(parseFloat(amountPaidUsd) - cartTotals.total_usd_tienda).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500">
                        <span>O en Bolívares (Tasa Tienda):</span>
                        <span className="font-mono font-bold text-emerald-700">
                          Bs. {((parseFloat(amountPaidUsd) - cartTotals.total_usd_tienda) * settings.tasa_interna).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {checkoutMethod === 'dolares_bcv' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Monto Recibido en Dólares a Tasa BCV:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaidUsd}
                      onChange={(e) => setAmountPaidUsd(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                    />
                  </div>

                  {parseFloat(amountPaidUsd) > cartTotals.total_usd_bcv && (
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs flex justify-between items-center">
                      <span className="font-bold text-sky-900">Vuelto en Divisas:</span>
                      <span className="font-mono font-black text-sky-700 text-sm">
                        ${(parseFloat(amountPaidUsd) - cartTotals.total_usd_bcv).toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {checkoutMethod === 'mixto' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      ¿Cuántos Dólares en Efectivo entrega el cliente? ($):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={mixtoUsdPaid}
                      onChange={(e) => setMixtoUsdPaid(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                      placeholder="Ejemplo: 20"
                    />
                  </div>

                  {parseFloat(mixtoUsdPaid) > 0 && (
                    <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs space-y-1">
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Dólares entregados:</span>
                        <strong className="font-mono font-bold text-gray-900">${parseFloat(mixtoUsdPaid).toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Equivalente cubierto:</span>
                        <strong className="font-mono text-gray-900">
                          Bs. {(parseFloat(mixtoUsdPaid) * settings.tasa_interna).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div className="h-px bg-indigo-100 my-1" />
                      <div className="flex justify-between items-baseline font-bold">
                        <span className="text-xs text-[#4f46e5] uppercase">Resta por cobrar en Bolívares:</span>
                        <span className="text-base font-black text-emerald-700 font-mono">
                          Bs. {Math.max(0, cartTotals.total_bs - (parseFloat(mixtoUsdPaid) * settings.tasa_interna)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessSale}
                className="flex-1 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>CONFIRMAR VENTA E IMPRIMIR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VISTA DE TICKET 58MM                               */}
      {/* ========================================================= */}
      {printedSale && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Comprobante de Venta 58mm</span>
              </h3>
              <button onClick={() => setPrintedSale(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-[60vh] overflow-y-auto">
              <div
                id="printable-receipt"
                className="mx-auto bg-white p-3 shadow-xs border border-gray-200 text-[11px] font-mono leading-tight text-gray-950 w-[58mm] max-w-full"
              >
                <div className="text-center space-y-0.5">
                  <div className="font-black text-xs uppercase">{settings.store_name}</div>
                  <div>RIF: {settings.rif}</div>
                  <div>Telf: {settings.phone}</div>
                  <div className="text-[10px]">{settings.address}</div>
                  <div>--------------------------------</div>
                </div>

                <div className="my-1 text-[10px] space-y-0.5">
                  <div>Ticket: <strong>{printedSale.sale.sale_number}</strong></div>
                  <div>Fecha: {new Date(printedSale.sale.created_at).toLocaleString('es-VE')}</div>
                  <div>Cliente: {printedSale.sale.customer_name}</div>
                  <div>Tasa Tienda: Bs. {Number(printedSale.sale.tasa_interna).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                  <div>Tasa BCV:    Bs. {Number(printedSale.sale.tasa_bcv).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                  <div>--------------------------------</div>
                </div>

                <div className="space-y-1 my-1">
                  {printedSale.items.map((item, idx) => (
                    <div key={idx} className="border-b border-dotted border-gray-200 pb-1">
                      <div className="font-bold truncate">{item.product_name}</div>
                      <div className="flex justify-between text-[10px]">
                        <span>{item.quantity} {item.unit} x ${item.price_usd_tienda}</span>
                        <span>Bs. {item.subtotal_bs.toLocaleString('es-VE')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] my-1">
                  <div>--------------------------------</div>
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>TOTAL BS:</span>
                    <span>Bs. {printedSale.sale.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total USD (Tienda):</span>
                    <span>${printedSale.sale.total_usd_tienda.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total USD (BCV):</span>
                    <span>${printedSale.sale.total_usd_bcv.toFixed(2)}</span>
                  </div>
                  <div>--------------------------------</div>
                  <div>Pago: {printedSale.sale.notes || printedSale.sale.payment_method}</div>
                  {printedSale.sale.change_bs > 0 && (
                    <div className="font-bold">Vuelto: Bs. {printedSale.sale.change_bs.toLocaleString('es-VE')}</div>
                  )}
                  {printedSale.sale.change_usd > 0 && (
                    <div className="font-bold">Vuelto: ${printedSale.sale.change_usd.toFixed(2)}</div>
                  )}
                  <div>================================</div>
                  <div className="text-center mt-1 text-[10px] font-semibold">
                    {settings.receipt_footer}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPrintedSale(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir 58mm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR / EDITAR PRODUCTO                           */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingProduct ? 'Editar Producto Ferretero' : 'Registrar Nuevo Producto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = {
                  code: formData.get('code'),
                  name: formData.get('name'),
                  category: formData.get('category'),
                  unit: formData.get('unit'),
                  allow_decimals: formData.get('allow_decimals') === 'on' ? 1 : 0,
                  cost_usd: parseFloat(formData.get('cost_usd')) || 0,
                  price_usd: parseFloat(formData.get('price_usd')) || 0,
                  stock: parseFloat(formData.get('stock')) || 0,
                  min_stock: parseFloat(formData.get('min_stock')) || 5,
                  synonyms: formData.get('synonyms') || '',
                  image_url: productImagePreview || ''
                };

                const url = editingProduct ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
                const method = editingProduct ? 'PUT' : 'POST';

                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });

                if (res.ok) {
                  showToast(editingProduct ? 'Producto actualizado' : 'Producto creado con éxito');
                  setIsProductModalOpen(false);
                  fetchProducts();
                } else {
                  showToast('Error al guardar producto', 'error');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  URL de la Foto del Producto
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                    {productImagePreview ? (
                      <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      name="image_url"
                      value={productImagePreview}
                      onChange={(e) => setProductImagePreview(e.target.value)}
                      placeholder="https://... enlace de la imagen"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Código / SKU *</label>
                  <input
                    name="code"
                    defaultValue={editingProduct?.code || ''}
                    required
                    placeholder="Ej: HER-005"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Categoría</label>
                  <input
                    name="category"
                    defaultValue={editingProduct?.category || 'General'}
                    placeholder="Ej: Plomería, Herramientas..."
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre del Producto *</label>
                <input
                  name="name"
                  defaultValue={editingProduct?.name || ''}
                  required
                  placeholder="Ej: Llave de paso 1/2 pulgada"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Unidad de Medida</label>
                  <select
                    name="unit"
                    defaultValue={editingProduct?.unit || 'und'}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                  >
                    <option value="und">und (Unidad)</option>
                    <option value="kg">kg (Kilo)</option>
                    <option value="metro">metro (Metro)</option>
                    <option value="par">par (Par)</option>
                    <option value="litro">litro (Litro)</option>
                  </select>
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allow_decimals"
                      defaultChecked={editingProduct ? Boolean(editingProduct.allow_decimals) : false}
                      className="w-4 h-4 text-[#4f46e5] rounded border-gray-300"
                    />
                    <span className="font-medium text-gray-700">Venta Fraccionada (0.5 kg, 2.5 m)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Costo Compra ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost_usd"
                    defaultValue={editingProduct?.cost_usd ?? 0}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#4f46e5] block mb-1">
                    Precio Venta USD (Tasa Tienda) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_usd"
                    defaultValue={editingProduct?.price_usd ?? 1}
                    required
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg text-gray-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Stock Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    name="stock"
                    defaultValue={editingProduct?.stock ?? 10}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    name="min_stock"
                    defaultValue={editingProduct?.min_stock ?? 3}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Sinónimos & Medidas para Búsqueda
                </label>
                <input
                  name="synonyms"
                  defaultValue={editingProduct?.synonyms || ''}
                  placeholder="Ej: teflon, tirro plomo, cinta rosca, 3/4"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold rounded-xl shadow-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AJUSTAR STOCK RÁPIDO                               */}
      {/* ========================================================= */}
      {stockAdjustModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Ajuste de Stock</h3>
              <button onClick={() => setStockAdjustModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="font-bold text-gray-900 text-xs">{stockAdjustModal.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Stock actual: <strong className="text-gray-800">{stockAdjustModal.stock} {stockAdjustModal.unit}</strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Cantidad a sumar (+) o restar (-):
              </label>
              <input
                type="number"
                step="0.01"
                value={stockAdjustQty}
                onChange={(e) => setStockAdjustQty(e.target.value)}
                placeholder="Ej: 10 o -3"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-center font-bold text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5]"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStockAdjustModal(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const qty = parseFloat(stockAdjustQty);
                  if (isNaN(qty)) return;
                  await fetch(`${API_BASE}/products/${stockAdjustModal.id}/adjust-stock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: qty })
                  });
                  showToast('Stock actualizado');
                  setStockAdjustModal(null);
                  fetchProducts();
                  fetchDailyReport();
                }}
                className="flex-1 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN                               */}
      {/* ========================================================= */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">¿Eliminar Producto?</h3>
                <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
              ¿Deseas eliminar permanentemente <strong>{deleteConfirmModal.name}</strong> del inventario?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmModal.id)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CAMBIO RÁPIDO DE CAJERO / INICIO DE TURNO         */}
      {/* ========================================================= */}
      {isSwitchUserModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00a884]" />
                <h3 className="font-bold text-sm text-gray-900">Cambiar de Cajero / Turno</h3>
              </div>
              <button
                onClick={() => setIsSwitchUserModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const target = targetUserToSwitch || users[0];
                if (!target) return;
                try {
                  const res = await fetch(`${API_BASE}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: target.username, pin: switchUserPinInput })
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'PIN incorrecto');
                  }
                  const data = await res.json();
                  setCurrentUser(data.user);
                  localStorage.setItem('pos_current_user', JSON.stringify(data.user));
                  showToast(`¡Turno activado: ${data.user.name}!`);
                  setIsSwitchUserModalOpen(false);
                  setSwitchUserPinInput('');
                } catch (err) {
                  showToast(err.message, 'error');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Seleccionar Usuario</label>
                <select
                  value={targetUserToSwitch?.username || (users[0]?.username || '')}
                  onChange={(e) => {
                    const u = users.find(x => x.username === e.target.value);
                    setTargetUserToSwitch(u);
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] font-medium"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.name} (@{u.username}) - {u.role === 'admin' ? 'Administrador' : 'Cajero'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Ingresar PIN (ej: 1234 o 0000)</label>
                <input
                  type="password"
                  maxLength="6"
                  autoFocus
                  required
                  value={switchUserPinInput}
                  onChange={(e) => setSwitchUserPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono text-center tracking-widest font-bold text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchUserModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold shadow-xs"
                >
                  Activar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
