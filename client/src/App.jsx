import React, { useState, useEffect, useRef } from 'react';
import MainLayout from './components/MainLayout';
import PosView from './components/PosView';
import CustomersView from './components/CustomersView';
import EditProductView from './components/EditProductView';
import FinancesView from './components/FinancesView';
import UsersView from './components/UsersView';
import CreditsView from './components/CreditsView';
import QuotesView from './components/QuotesView';
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
  FileText,
  Lock,
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
    store_name: 'Bodega Jeym',
    rif: 'J-12345678-9',
    phone: '0414-0000000',
    address: 'Calle Principal, Local 1',
    tasa_interna: 960.00,
    tasa_bcv: 883.40,
    cashea_percent: 15.0,
    receipt_footer: '¡Gracias por su compra!'
  });

  // Rates Modal
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [tempRates, setTempRates] = useState({ tasa_interna: 960, cashea_percent: 15 });

  // POS State & Cashea Mode Toggle
  const [isCasheaActive, setIsCasheaActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const searchInputRef = useRef(null);

  // Quote (Presupuesto) Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Decimal Quantity Modal for items like kg / meters
  const [decimalItemModal, setDecimalItemModal] = useState(null);
  const [decimalQtyInput, setDecimalQtyInput] = useState('1');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('bolivares'); // 'bolivares', 'dolares', 'cashea', 'credito', 'mixto'
  const [bsSubMethod, setBsSubMethod] = useState('Pago Móvil'); // 'Pago Móvil', 'Punto de Venta', 'Efectivo Bs'
  const [usdSubMethod, setUsdSubMethod] = useState('efectivo_usd'); // 'efectivo_usd', 'zelle_usd', 'binance_usd'
  const [amountPaidBs, setAmountPaidBs] = useState('');
  const [amountPaidUsd, setAmountPaidUsd] = useState('');
  const [casheaInitialPaid, setCasheaInitialPaid] = useState('');
  const [casheaInitialMethod, setCasheaInitialMethod] = useState('pago_movil_bs');
  const [creditDueDate, setCreditDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [creditInitialAbono, setCreditInitialAbono] = useState('0');
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
      setTempRates({
        tasa_interna: data.tasa_interna,
        tasa_bcv: data.tasa_bcv,
        cashea_percent: data.cashea_percent ?? 15
      });
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
          tasa_bcv: parseFloat(tempRates.tasa_bcv),
          cashea_percent: parseFloat(tempRates.cashea_percent) || 15
        })
      });
      const updated = await res.json();
      setSettings(updated);
      setIsRatesModalOpen(false);
      showToast('¡Tasas y Recargo Cashea actualizados con éxito!');
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

  // Cart Totals (Adapta automáticamente a modo Cashea sin enredos de BCV)
  const cartTotals = cart.reduce((acc, item) => {
    const unitPriceUsd = isCasheaActive ? (item.price_cashea || item.price_usd_tienda) : item.price_usd_tienda;
    const unitPriceBs = isCasheaActive ? (item.price_cashea_bs || item.price_bs) : item.price_bs;
    acc.total_usd_tienda += unitPriceUsd * item.quantity;
    acc.total_bs += unitPriceBs * item.quantity;
    return acc;
  }, { total_usd_tienda: 0, total_bs: 0 });

  cartTotals.total_usd_tienda = Math.round(cartTotals.total_usd_tienda * 100) / 100;
  cartTotals.total_bs = Math.round(cartTotals.total_bs * 100) / 100;

  // Checkout Calculations
  const openCheckout = () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }
    setCheckoutMethod('bolivares');
    setAmountPaidBs(cartTotals.total_bs.toString());
    setAmountPaidUsd(cartTotals.total_usd_tienda.toString());
    setCasheaInitialPaid((cartTotals.total_usd_tienda * 0.4).toFixed(2));
    setCreditInitialAbono('0');
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

      let paidEfectivoUsd = 0;
      let paidZelleUsd = 0;
      let paidBinanceUsd = 0;
      let paidEfectivoBs = 0;
      let paidPagoMovilBs = 0;
      let paidPuntoBs = 0;
      let casheaInitialUsd = 0;
      let casheaFinancedUsd = 0;

      const isCasheaSale = isCasheaActive || checkoutMethod === 'cashea';
      const isCreditSale = checkoutMethod === 'credito';

      if (isCreditSale && (!customerName || customerName.trim() === 'Cliente Mostrador')) {
        throw new Error('Para ventas a crédito o facturas abiertas debe seleccionar o ingresar el nombre del cliente');
      }

      if (checkoutMethod === 'bolivares') {
        paidBs = parseFloat(amountPaidBs) || cartTotals.total_bs;
        changeBs = Math.max(0, paidBs - cartTotals.total_bs);
        notes = `Bolívares (${bsSubMethod})`;
        if (bsSubMethod === 'Pago Móvil') paidPagoMovilBs = cartTotals.total_bs;
        else if (bsSubMethod === 'Punto de Venta') paidPuntoBs = cartTotals.total_bs;
        else paidEfectivoBs = cartTotals.total_bs;
      } else if (checkoutMethod === 'dolares') {
        paidUsd = parseFloat(amountPaidUsd) || cartTotals.total_usd_tienda;
        changeUsd = Math.max(0, paidUsd - cartTotals.total_usd_tienda);
        changeBs = Math.round((changeUsd * settings.tasa_interna) * 100) / 100;
        
        if (usdSubMethod === 'efectivo_usd') {
          paidEfectivoUsd = cartTotals.total_usd_tienda;
          notes = 'Divisas Efectivo ($ Billetes en caja)';
        } else if (usdSubMethod === 'zelle_usd') {
          paidZelleUsd = cartTotals.total_usd_tienda;
          notes = 'Zelle (Transferencia bancaria USD)';
        } else if (usdSubMethod === 'binance_usd') {
          paidBinanceUsd = cartTotals.total_usd_tienda;
          notes = 'Binance / USDT (Cripto)';
        }
      } else if (checkoutMethod === 'cashea') {
        casheaInitialUsd = parseFloat(casheaInitialPaid) || 0;
        casheaFinancedUsd = Math.max(0, cartTotals.total_usd_tienda - casheaInitialUsd);
        notes = `Cashea: Inicial $${casheaInitialUsd} (${casheaInitialMethod}) + $${casheaFinancedUsd} Financiado en cuotas`;
        if (casheaInitialMethod === 'efectivo_usd') paidEfectivoUsd = casheaInitialUsd;
        else if (casheaInitialMethod === 'pago_movil_bs') paidPagoMovilBs = Math.round(casheaInitialUsd * settings.tasa_interna * 100) / 100;
        else if (casheaInitialMethod === 'punto_bs') paidPuntoBs = Math.round(casheaInitialUsd * settings.tasa_interna * 100) / 100;
        else if (casheaInitialMethod === 'zelle_usd') paidZelleUsd = casheaInitialUsd;
        else if (casheaInitialMethod === 'binance_usd') paidBinanceUsd = casheaInitialUsd;
      } else if (checkoutMethod === 'credito') {
        const abonoInit = parseFloat(creditInitialAbono) || 0;
        notes = `Venta a Crédito / Factura Abierta (Vence: ${creditDueDate}). Abono inicial: $${abonoInit}`;
        if (abonoInit > 0) paidEfectivoUsd = abonoInit;
      } else if (checkoutMethod === 'mixto') {
        paidUsd = parseFloat(mixtoUsdPaid) || 0;
        const remainingInBs = Math.max(0, cartTotals.total_bs - (paidUsd * settings.tasa_interna));
        paidBs = remainingInBs;
        paidEfectivoUsd = paidUsd;
        paidPagoMovilBs = paidBs;
        notes = `Pago Mixto: $${paidUsd} Divisas + Bs. ${paidBs.toLocaleString('es-VE')} en Bolívares`;
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
        is_cashea: isCasheaSale ? 1 : 0,
        is_credit: isCreditSale ? 1 : 0,
        credit_due_date: isCreditSale ? creditDueDate : null,
        credit_balance_usd: isCreditSale ? Math.max(0, cartTotals.total_usd_tienda - (parseFloat(creditInitialAbono) || 0)) : 0,
        paid_efectivo_usd: paidEfectivoUsd,
        paid_zelle_usd: paidZelleUsd,
        paid_binance_usd: paidBinanceUsd,
        paid_efectivo_bs: paidEfectivoBs,
        paid_pago_movil_bs: paidPagoMovilBs,
        paid_punto_bs: paidPuntoBs,
        cashea_initial_usd: casheaInitialUsd,
        cashea_financed_usd: casheaFinancedUsd,
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
      showToast(isCreditSale ? '¡Venta a Crédito registrada con éxito!' : '¡Venta completada con éxito!');
      fetchProducts(searchQuery);
      fetchDailyReport();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Cargar presupuesto al carrito del punto de venta
  const handleLoadQuoteToCart = (quoteItems, custName) => {
    if (!quoteItems || !quoteItems.length) return;
    const newCart = quoteItems.map(it => {
      const prod = products.find(p => p.id === it.product_id) || {};
      return {
        product_id: it.product_id,
        code: prod.code || '',
        name: it.product_name,
        unit: it.unit || 'und',
        price_usd_tienda: it.price_usd || prod.price_usd_tienda || 0,
        price_bs: it.price_bs || prod.price_bs || 0,
        price_cashea: prod.price_cashea || it.price_usd || 0,
        price_cashea_bs: prod.price_cashea_bs || it.price_bs || 0,
        quantity: it.quantity
      };
    });
    setCart(newCart);
    if (custName) setCustomerName(custName);
    setActiveTab('pos');
    showToast('¡Cotización cargada al Punto de Venta!');
  };

  // Crear Presupuesto (Sin descontar inventario)
  const handleCreateQuote = async () => {
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error');
      return;
    }
    setSubmittingQuote(true);
    try {
      const payload = {
        customer_name: customerName || 'Cliente Cotización',
        customer_phone: quoteCustomerPhone || '',
        notes: quoteNotes || 'Cotización de materiales y herramientas. Los precios en dólares se mantienen. Los montos en bolívares están sujetos a la tasa de cambio vigente al momento de concretar la compra.',
        created_by: currentUser?.name || 'Admin Hebert',
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'und',
          price_usd: item.price_usd_tienda,
          price_bs: item.price_bs
        }))
      };

      const res = await fetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al generar presupuesto');
      }

      setIsQuoteModalOpen(false);
      setCart([]);
      setQuoteCustomerPhone('');
      setQuoteNotes('');
      showToast('¡Presupuesto generado con éxito!');
      setActiveTab('quotes');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingQuote(false);
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
          isCasheaActive={isCasheaActive}
          setIsCasheaActive={setIsCasheaActive}
          settings={settings}
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
          onGenerateQuote={() => {
            if (cart.length === 0) {
              showToast('El carrito está vacío para cotizar', 'error');
              return;
            }
            setIsQuoteModalOpen(true);
          }}
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
      {/* VISTA 7: PRESUPUESTOS & COTIZACIONES                      */}
      {/* ========================================================= */}
      {activeTab === 'quotes' && (
        <QuotesView
          settings={settings}
          onLoadQuoteToCart={handleLoadQuoteToCart}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* VISTA 8: CRÉDITOS & FACTURAS ABIERTAS                     */}
      {/* ========================================================= */}
      {activeTab === 'credits' && (
        <CreditsView
          settings={settings}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* VISTA 9: FINANZAS & CIERRE DE CAJA DIARIO                 */}
      {/* ========================================================= */}
      {(activeTab === 'finances' || activeTab === 'reports') && (
        <FinancesView settings={settings} currentUser={currentUser} />
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
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80">
                <label className="font-semibold text-purple-900 block mb-1">
                  Recargo Global Cashea (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono font-bold text-purple-400">%</span>
                  <input
                    type="number"
                    step="1"
                    value={tempRates.cashea_percent ?? 15}
                    onChange={(e) => setTempRates({ ...tempRates, cashea_percent: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-purple-200 rounded-lg font-mono font-bold text-sm text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <p className="text-[11px] text-purple-700 mt-1">
                  Porcentaje automático para calcular el Precio Cashea en productos sin precio individual.
                </p>
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

            {/* Total Box (Clean, Zero BCV!) */}
            <div className="bg-gray-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Total a Cobrar</span>
                  {(isCasheaActive || checkoutMethod === 'cashea') && (
                    <span className="text-[9px] bg-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-400/40">
                      🟣 Cashea
                    </span>
                  )}
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  Bs. {cartTotals.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-black text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  ${cartTotals.total_usd_tienda.toFixed(2)} USD
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-1">
                  Tasa: Bs. {Number(settings.tasa_interna || 960).toFixed(2)}
                </div>
              </div>
            </div>

            {/* 5 One-Click Buttons: Bolívares, Divisas 3en1, Cashea, Crédito, Mixto */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* 1. Bolívares */}
              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('bolivares');
                  setAmountPaidBs(cartTotals.total_bs.toString());
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  checkoutMethod === 'bolivares'
                    ? 'border-[#00a884] bg-emerald-50 text-[#00a884] ring-2 ring-[#00a884]/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">Bolívares</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Punto / Pago Móvil</div>
              </button>

              {/* 2. Divisas (3 en 1) */}
              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('dolares');
                  setAmountPaidUsd(cartTotals.total_usd_tienda.toString());
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  checkoutMethod === 'dolares'
                    ? 'border-[#00a884] bg-emerald-50 text-[#00a884] ring-2 ring-[#00a884]/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">Divisas ($)</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Efectivo / Zelle / Binance</div>
              </button>

              {/* 3. Cashea */}
              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('cashea');
                  setIsCasheaActive(true);
                  setCasheaInitialPaid((cartTotals.total_usd_tienda * 0.4).toFixed(2));
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  checkoutMethod === 'cashea'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">🟣 Cashea</div>
                <div className="text-[10px] text-purple-600 mt-0.5">Precio 2 (+{settings?.cashea_percent || 15}%)</div>
              </button>

              {/* 4. A Crédito */}
              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('credito');
                  setCreditInitialAbono('0');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  checkoutMethod === 'credito'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">🤝 A Crédito</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Factura Abierta</div>
              </button>

              {/* 5. Pago Mixto */}
              <button
                type="button"
                onClick={() => {
                  setCheckoutMethod('mixto');
                  setMixtoUsdPaid('10');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  checkoutMethod === 'mixto'
                    ? 'border-amber-600 bg-amber-50 text-amber-700 ring-2 ring-amber-600/20 font-bold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">Pago Mixto</div>
                <div className="text-[10px] text-gray-400 mt-0.5">$ + Bolívares</div>
              </button>
            </div>

            {/* Sub-method panel */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
              {/* =================================================== */}
              {/* SUB-MÉTODO: BOLÍVARES                               */}
              {/* =================================================== */}
              {checkoutMethod === 'bolivares' && (
                <>
                  <div className="flex gap-2">
                    {['Pago Móvil', 'Punto de Venta', 'Efectivo Bs'].map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setBsSubMethod(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 border transition-all cursor-pointer ${
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
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
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

              {/* =================================================== */}
              {/* SUB-MÉTODO: DIVISAS (3 EN 1: EFECTIVO, ZELLE, BINANCE) */}
              {/* =================================================== */}
              {checkoutMethod === 'dolares' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">
                      Canal de Pago en Divisas:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setUsdSubMethod('efectivo_usd')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          usdSubMethod === 'efectivo_usd'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        💵 Efectivo $ (Billetes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsdSubMethod('zelle_usd')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          usdSubMethod === 'zelle_usd'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        🏦 Zelle (Dólares)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsdSubMethod('binance_usd')}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          usdSubMethod === 'binance_usd'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        🟡 Binance (USDT)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Monto Recibido en Dólares ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaidUsd}
                      onChange={(e) => setAmountPaidUsd(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                    />
                  </div>

                  {parseFloat(amountPaidUsd) > cartTotals.total_usd_tienda && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900">Vuelto en Dólares:</span>
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          ${(parseFloat(amountPaidUsd) - cartTotals.total_usd_tienda).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500">
                        <span>O en Bolívares (Tasa del Día):</span>
                        <span className="font-mono font-bold text-teal-800">
                          Bs. {((parseFloat(amountPaidUsd) - cartTotals.total_usd_tienda) * settings.tasa_interna).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* =================================================== */}
              {/* SUB-MÉTODO: CASHEA (PRECIO 2 + INICIAL + FINANCIADO)*/}
              {/* =================================================== */}
              {checkoutMethod === 'cashea' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-purple-900">
                      <span>Total Venta Cashea:</span>
                      <span className="font-mono text-sm">${cartTotals.total_usd_tienda.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-purple-700 text-[11px]">
                      <span>Comisión trasladada al cliente:</span>
                      <span>+{settings?.cashea_percent || 15}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Monto Inicial a Cobrar ($):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={casheaInitialPaid}
                        onChange={(e) => setCasheaInitialPaid(e.target.value)}
                        placeholder="Inicial (ej. 40%)"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Canal Pago de la Inicial:
                      </label>
                      <select
                        value={casheaInitialMethod}
                        onChange={(e) => setCasheaInitialMethod(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none"
                      >
                        <option value="pago_movil_bs">📱 Pago Móvil (Bs)</option>
                        <option value="efectivo_usd">💵 Efectivo Dólares ($)</option>
                        <option value="punto_bs">💳 Punto de Venta (Bs)</option>
                        <option value="zelle_usd">🏦 Zelle (Dólares)</option>
                        <option value="binance_usd">🟡 Binance (USDT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-100 border border-gray-200 flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Saldo Restante Financiado por Cashea:</span>
                    <span className="font-mono font-black text-purple-700 text-sm">
                      ${Math.max(0, cartTotals.total_usd_tienda - (parseFloat(casheaInitialPaid) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* SUB-MÉTODO: CRÉDITO (FACTURA ABIERTA)               */}
              {/* =================================================== */}
              {checkoutMethod === 'credito' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold">⚠️ Venta a Crédito / Factura Abierta</div>
                    <p className="text-[11px] text-amber-800">
                      El inventario se descontará de inmediato. La factura quedará registrada en "Cuentas por Cobrar" asociada a este cliente.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Fecha Límite de Pago (Vencimiento):
                      </label>
                      <input
                        type="date"
                        value={creditDueDate}
                        onChange={(e) => setCreditDueDate(e.target.value)}
                        required
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Abono Inicial (Opcional $):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={creditInitialAbono}
                        onChange={(e) => setCreditInitialAbono(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex justify-between items-center text-xs">
                    <span className="text-indigo-900 font-bold">Deuda que queda por cobrar:</span>
                    <span className="font-mono font-black text-indigo-700 text-sm">
                      ${Math.max(0, cartTotals.total_usd_tienda - (parseFloat(creditInitialAbono) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* SUB-MÉTODO: PAGO MIXTO                              */}
              {/* =================================================== */}
              {checkoutMethod === 'mixto' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      ¿Cuántos Dólares en Divisas entrega el cliente? ($):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={mixtoUsdPaid}
                      onChange={(e) => setMixtoUsdPaid(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                      placeholder="Ejemplo: 20"
                    />
                  </div>

                  {parseFloat(mixtoUsdPaid) > 0 && (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
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
                      <div className="h-px bg-amber-200 my-1" />
                      <div className="flex justify-between items-baseline font-bold">
                        <span className="text-xs text-amber-900 uppercase">Resta por cobrar en Bolívares:</span>
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
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessSale}
                className="flex-1 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>CONFIRMAR VENTA E IMPRIMIR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GENERAR PRESUPUESTO / COTIZACIÓN                   */}
      {/* ========================================================= */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Generar Presupuesto / Cotización</span>
              </h3>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>ℹ️ Cotización informativa</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                No descuenta inventario ni afecta el cierre de caja. Podrás cargarla de nuevo al carrito en 1 clic desde la pestaña <strong>Presupuestos</strong>.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Juan Pérez / Taller Mecánico"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={quoteCustomerPhone}
                  onChange={(e) => setQuoteCustomerPhone(e.target.value)}
                  placeholder="Ej: 0414-1234567"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 block text-[11px]">Artículos a cotizar:</span>
                  <span className="font-bold text-gray-800 text-sm">{cart.length} productos ({cart.reduce((s, i) => s + i.quantity, 0)} unid.)</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block text-[11px]">Total Cotizado:</span>
                  <span className="font-black text-[#00a884] text-base">${cartTotals.total_usd_tienda.toFixed(2)}</span>
                  <span className="block text-[10px] text-gray-400 font-mono">Bs. {cartTotals.total_bs.toLocaleString('es-VE')}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nota de Validez Comercial</label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Los precios en dólares se mantienen. Los montos en bolívares están sujetos a la tasa de cambio vigente al concretar..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingQuote}
                onClick={handleCreateQuote}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{submittingQuote ? 'Guardando...' : 'Guardar Cotización'}</span>
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
                  price_cashea: formData.get('price_cashea') ? parseFloat(formData.get('price_cashea')) : null,
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="font-semibold text-[#00a884] block mb-1">
                    Precio Tienda USD *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_usd"
                    defaultValue={editingProduct?.price_usd ?? 1}
                    required
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-purple-700 block mb-1 flex items-center justify-between">
                    <span>Precio Cashea ($)</span>
                    <span className="text-[10px] text-purple-400 font-normal">Opcional</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_cashea"
                    defaultValue={editingProduct?.price_cashea ?? ''}
                    placeholder={`Auto (+${settings?.cashea_percent || 15}%)`}
                    className="w-full p-2 bg-purple-50/50 border border-purple-200 rounded-lg text-purple-900 font-mono font-bold placeholder:text-gray-400 placeholder:font-normal"
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
