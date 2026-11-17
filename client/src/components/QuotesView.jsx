import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  ShoppingCart,
  Clock,
  User,
  Phone,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CheckCircle,
  Eye,
  X,
  Download,
  Share2,
  ArrowLeft,
  Sparkles,
  Box,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';
import { generateQuotePdf } from '../utils/quotePdfGenerator';

export default function QuotesView({
  settings,
  products = [],
  categories = [],
  customers = [],
  onLoadQuoteToCart,
  showToast
}) {
  // Navigation / Mode State
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // New Quote Creator State
  // currencyMode: 'divisas' | 'bolivares' | 'bcv' | 'cashea'
  const [currencyMode, setCurrencyMode] = useState('bolivares');
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteCustomerName, setQuoteCustomerName] = useState('Cliente Mostrador');
  const [quoteCustomerCi, setQuoteCustomerCi] = useState('');
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setQuotes(data || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [searchQuery]);

  // Product Image Fallback
  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  const tasaInterna = Number(settings?.tasa_interna || 960);
  const tasaBcv = Number(settings?.tasa_bcv || 883.40);
  const casheaPercent = Number(settings?.cashea_percent || 15);

  // Filter products for the quote builder (only active products)
  const activeProducts = products.filter(p => p.is_active !== 0);

  const filteredProducts = activeProducts.filter(p => {
    const term = productSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.synonyms && p.synonyms.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories list
  const allCategories = ['Todos', ...new Set(activeProducts.map(p => p.category).filter(Boolean))];

  // Helper to get unit price and label based on active mode
  const getProductPriceForMode = (prod, mode = currencyMode) => {
    if (mode === 'divisas') {
      return {
        unitPriceUsd: Number(prod.price_usd_tienda || 0),
        unitPriceBs: 0,
        displayLabel: `$${Number(prod.price_usd_tienda || 0).toFixed(2)}`
      };
    }
    if (mode === 'bcv') {
      const priceBcv = prod.price_usd_bcv ? Number(prod.price_usd_bcv) : (Number(prod.price_bs || 0) / tasaBcv);
      return {
        unitPriceUsd: priceBcv,
        unitPriceBs: Number(prod.price_bs || 0),
        displayLabel: `$${priceBcv.toFixed(2)} BCV`
      };
    }
    if (mode === 'cashea') {
      return {
        unitPriceUsd: Number(prod.price_cashea || 0),
        unitPriceBs: Number(prod.price_cashea_bs || (Number(prod.price_cashea || 0) * tasaBcv)),
        displayLabel: `$${Number(prod.price_cashea || 0).toFixed(2)} Cashea`
      };
    }
    // Default 'bolivares'
    return {
      unitPriceUsd: Number(prod.price_usd_tienda || 0),
      unitPriceBs: Number(prod.price_bs || 0),
      displayLabel: `Bs. ${Number(prod.price_bs || 0).toLocaleString('es-VE')}`
    };
  };

  // Helper to add product to quote
  const handleAddProductToQuote = (prod) => {
    const pricing = getProductPriceForMode(prod, currencyMode);

    setQuoteItems(prev => {
      const exists = prev.find(item => item.product_id === prod.id);
      if (exists) {
        return prev.map(item =>
          item.product_id === prod.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          product_code: prod.code,
          product_name: prod.name,
          unit: prod.unit || 'und',
          quantity: 1,
          price_usd: pricing.unitPriceUsd,
          price_bs: pricing.unitPriceBs
        }
      ];
    });
  };

  // Switch currency mode and recalculate existing items
  const handleSwitchCurrencyMode = (newMode) => {
    setCurrencyMode(newMode);
    setQuoteItems(prev =>
      prev.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        if (!prod) return item;
        const pricing = getProductPriceForMode(prod, newMode);
        return {
          ...item,
          price_usd: pricing.unitPriceUsd,
          price_bs: pricing.unitPriceBs
        };
      })
    );
  };

  // Stepper quantity update
  const handleUpdateQuoteQuantity = (productId, delta) => {
    setQuoteItems(prev =>
      prev
        .map(item => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Remove single item
  const handleRemoveQuoteItem = (productId) => {
    setQuoteItems(prev => prev.filter(item => item.product_id !== productId));
  };

  // Calculate quote totals
  const quoteTotalUsd = quoteItems.reduce((acc, it) => acc + (it.price_usd * it.quantity), 0);
  const quoteTotalBs = currencyMode === 'divisas'
    ? 0
    : (currencyMode === 'bcv' || currencyMode === 'cashea'
      ? Math.round(quoteTotalUsd * tasaBcv * 100) / 100
      : Math.round(quoteTotalUsd * tasaInterna * 100) / 100);

  // Save Quote & Open PDF / Proforma Preview
  const handleSaveAndGeneratePdf = async () => {
    if (quoteItems.length === 0) {
      if (showToast) showToast('Agrega al menos un producto al presupuesto', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultNote = currencyMode === 'bolivares'
        ? 'Presupuesto válido únicamente por 24 horas'
        : currencyMode === 'divisas'
        ? 'Presupuesto – Método de pago: Solo válido en Divisas (Efectivo / Zelle / Binance)'
        : currencyMode === 'bcv'
        ? 'Cotización a Tasa Oficial BCV - Válido por 24 horas'
        : 'Cotización Modalidad Cashea (+15%) a Tasa Oficial BCV';

      const payload = {
        customer_name: quoteCustomerName || 'Cliente Mostrador',
        customer_phone: quoteCustomerPhone || '',
        customer_ci: quoteCustomerCi || '',
        notes: quoteNotes || defaultNote,
        currency_mode: currencyMode,
        is_cashea: currencyMode === 'cashea',
        items: quoteItems.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity
        }))
      };

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar cotización');
      }

      const createdQuote = await res.json();

      if (showToast) showToast(`¡Presupuesto ${createdQuote.quote_number} creado con éxito!`);

      // Refresh list & Reset Creator
      fetchQuotes();
      setIsCreatingQuote(false);
      setQuoteItems([]);
      setQuoteCustomerName('Cliente Mostrador');
      setQuoteCustomerCi('');
      setQuoteCustomerPhone('');
      setQuoteNotes('');

      // Open Quote Preview with generated PDF option
      const fullQuoteData = {
        ...createdQuote,
        currency_mode: currencyMode,
        customer_ci: quoteCustomerCi,
        customer_phone: quoteCustomerPhone
      };
      setSelectedQuote(fullQuoteData);

      // Automatically trigger PDF download
      setTimeout(() => {
        generateQuotePdf(fullQuoteData, settings, 'download');
      }, 300);
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Quote
  const handleDeleteQuote = async (id) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar presupuesto');
      if (showToast) showToast('Presupuesto eliminado');
      setDeleteConfirm(null);
      fetchQuotes();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  // Load quote to POS cart
  const handleLoadToCart = (quote) => {
    if (onLoadQuoteToCart) {
      onLoadQuoteToCart(quote.items, quote.customer_name);
    }
  };

  // Share via WhatsApp with custom mode formatting
  const handleShareWhatsApp = (quote) => {
    const rawPhone = (quote.customer_phone || '').replace(/\D/g, '');
    let phoneParam = rawPhone;
    if (phoneParam.startsWith('0')) {
      phoneParam = '58' + phoneParam.substring(1);
    }

    const companyName = settings?.company_name || 'Ferretería Hebert';
    const mode = quote.currency_mode || (quote.is_cashea ? 'cashea' : 'bolivares');
    const dateStr = new Date(quote.created_at || Date.now()).toLocaleDateString('es-VE');
    const totalUsd = Number(quote.total_usd).toFixed(2);
    const totalBs = Number(quote.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 });
    const tasa = Number(quote.tasa_interna || tasaInterna).toFixed(2);

    let text = '';

    if (mode === 'divisas') {
      const itemsSummary = (quote.items || [])
        .map(it => `• ${it.quantity}x ${it.product_name || it.name}: $${Number(it.subtotal_usd || (it.price_usd * it.quantity)).toFixed(2)}`)
        .join('\n');

      text = `*PRESUPUESTO EN DIVISAS ${quote.quote_number}* - ${companyName}\n` +
        `👤 *Cliente:* ${quote.customer_name}\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `💵 *Método de pago:* Solo válido en Divisas (Efectivo / Zelle / Binance)\n\n` +
        `📋 *Productos Cotizados:*\n${itemsSummary}\n\n` +
        `💰 *TOTAL EN DÓLARES:* $${totalUsd}\n\n` +
        `🔒 *Condición:* Precios fijos en dólares durante la vigencia del presupuesto.\n` +
        `_Gracias por su preferencia._`;
    } else if (mode === 'cashea') {
      const itemsSummary = (quote.items || [])
        .map(it => `• ${it.quantity}x ${it.product_name || it.name}: $${Number(it.subtotal_usd || (it.price_usd * it.quantity)).toFixed(2)} Cashea`)
        .join('\n');

      const inicialUsd = (Number(quote.total_usd) * 0.40).toFixed(2);
      const cuotaUsd = ((Number(quote.total_usd) * 0.60) / 3).toFixed(2);
      const inicialBs = Math.round(Number(inicialUsd) * tasaBcv).toLocaleString('es-VE');

      text = `*COTIZACIÓN CASHEA (+${casheaPercent}%) ${quote.quote_number}* - ${companyName}\n` +
        `👤 *Cliente:* ${quote.customer_name}\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `🏦 *Tasa Oficial BCV:* Bs. ${tasaBcv.toFixed(2)} / $\n\n` +
        `📋 *Productos:*\n${itemsSummary}\n\n` +
        `🟣 *TOTAL FINANCIADO CASHEA:* $${totalUsd}\n` +
        `💳 *Inicial a pagar (40%):* $${inicialUsd} (Bs. ${inicialBs})\n` +
        `🗓️ *3 Cuotas c/14 días:* $${cuotaUsd} c/u\n\n` +
        `⚠️ *VÁLIDO ÚNICAMENTE POR 24 HORAS* a tasa oficial BCV.\n` +
        `_Gracias por su consulta._`;
    } else if (mode === 'bcv') {
      const totalUsdBcv = Math.round((Number(quote.total_bs) / tasaBcv) * 100) / 100;
      const itemsSummary = (quote.items || [])
        .map(it => `• ${it.quantity}x ${it.product_name || it.name}: $${Number(it.subtotal_usd || (it.price_usd * it.quantity)).toFixed(2)} BCV`)
        .join('\n');

      text = `*COTIZACIÓN TASA OFICIAL BCV ${quote.quote_number}* - ${companyName}\n` +
        `👤 *Cliente:* ${quote.customer_name}\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `🏦 *Tasa Oficial BCV:* Bs. ${tasaBcv.toFixed(2)} / $\n\n` +
        `📋 *Productos:*\n${itemsSummary}\n\n` +
        `🏦 *TOTAL USD BCV:* $${totalUsdBcv.toFixed(2)}\n` +
        `🇻🇪 *TOTAL EN BOLÍVARES:* Bs. ${totalBs}\n\n` +
        `⚠️ *VÁLIDO ÚNICAMENTE POR 24 HORAS* a tasa oficial BCV.\n` +
        `_Gracias por su consulta._`;
    } else {
      // Bolívares
      const itemsSummary = (quote.items || [])
        .map(it => `• ${it.quantity}x ${it.product_name || it.name}: Bs. ${Number(it.subtotal_bs || (it.price_bs * it.quantity) || ((it.price_usd || 0) * tasaInterna * it.quantity)).toLocaleString('es-VE')}`)
        .join('\n');

      text = `*PRESUPUESTO EN BOLÍVARES ${quote.quote_number}* - ${companyName}\n` +
        `👤 *Cliente:* ${quote.customer_name}\n` +
        `📅 *Fecha:* ${dateStr}\n` +
        `📊 *Tasa del día:* Bs. ${tasa} / $\n\n` +
        `📋 *Productos Cotizados:*\n${itemsSummary}\n\n` +
        `🇻🇪 *TOTAL EN BOLÍVARES:* Bs. ${totalBs}\n` +
        `💵 *Equivalente Ref.:* $${totalUsd}\n\n` +
        `🚨 *CLÁUSULA OBLIGATORIA: PRESUPUESTO VÁLIDO ÚNICAMENTE POR 24 HORAS* debido a la fluctuación cambiaria diaria.\n` +
        `_Gracias por su consulta._`;
    }

    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto pb-8">
      {/* ========================================================= */}
      {/* 1. MODO: CREADOR INTERACTIVO DE PRESUPUESTOS              */}
      {/* ========================================================= */}
      {isCreatingQuote ? (
        <div className="space-y-4">
          {/* Top Bar Creator */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingQuote(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Volver al listado"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>Nueva Cotización / Presupuesto</span>
                  {currencyMode === 'divisas' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      💵 Solo Divisas ($)
                    </span>
                  )}
                  {currencyMode === 'bolivares' && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      ⏳ Válido por 24 Horas
                    </span>
                  )}
                  {currencyMode === 'bcv' && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      🏦 Tasa BCV Oficial
                    </span>
                  )}
                  {currencyMode === 'cashea' && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                      🟣 Modo Cashea (+{casheaPercent}%)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400">
                  Selecciona la moneda deseada, agrega productos y genera un PDF formal o compártelo por WhatsApp
                </p>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsCreatingQuote(false)}
              className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* Currency Mode Selection Bar (4 Distinct Modes) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Selecciona la Moneda y Condiciones del Presupuesto:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Solo Divisas ($) */}
              <button
                type="button"
                onClick={() => handleSwitchCurrencyMode('divisas')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currencyMode === 'divisas'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>💵 Solo Divisas ($)</span>
                </div>
                <div className="text-[10px] text-emerald-800 font-medium mt-1">
                  100% en Dólares • Sin Bs. • Precios fijos
                </div>
              </button>

              {/* 2. En Bolívares (24h) */}
              <button
                type="button"
                onClick={() => handleSwitchCurrencyMode('bolivares')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currencyMode === 'bolivares'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>🇻🇪 En Bolívares (Bs.)</span>
                </div>
                <div className="text-[10px] text-rose-800 font-bold mt-1">
                  Tasa Tienda • Válido por 24 horas
                </div>
              </button>

              {/* 3. Dólares a Tasa BCV */}
              <button
                type="button"
                onClick={() => handleSwitchCurrencyMode('bcv')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currencyMode === 'bcv'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>🏦 Dólares BCV ($)</span>
                </div>
                <div className="text-[10px] text-indigo-800 font-medium mt-1">
                  Tasa Oficial BCV • Válido 24 horas
                </div>
              </button>

              {/* 4. Modo Cashea */}
              <button
                type="button"
                onClick={() => handleSwitchCurrencyMode('cashea')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currencyMode === 'cashea'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>🟣 Modo Cashea (+{casheaPercent}%)</span>
                </div>
                <div className="text-[10px] text-purple-800 font-medium mt-1">
                  Tasa BCV • Desglose inicial + cuotas
                </div>
              </button>
            </div>
          </div>

          {/* Builder Layout: Catalog (Left) + Quote Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* PRODUCT CATALOG SELECTOR */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
              {/* Search & Categories */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto por nombre o código para cotizar..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {allCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition-all border text-xs cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-white border-gray-300 text-[#00a884] font-semibold shadow-xs ring-1 ring-[#00a884]/15'
                          : 'bg-white border-gray-200/80 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-400">
                    <Box className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">No se encontraron productos disponibles</p>
                    <p className="text-xs text-gray-400">Prueba con otra búsqueda o categoría</p>
                  </div>
                ) : (
                  filteredProducts.map(prod => {
                    const pricing = getProductPriceForMode(prod, currencyMode);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleAddProductToQuote(prod)}
                        className="bg-white rounded-xl border border-gray-100 hover:border-[#00a884]/50 hover:shadow-xs p-2.5 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-50 relative flex items-center justify-center border border-gray-100/60 mb-2">
                            <img
                              src={getProductImage(prod)}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                              }}
                            />
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-white/90 text-gray-700 border border-gray-200/60">
                              {prod.stock} {prod.unit}
                            </span>
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            {prod.category}
                          </div>
                          <h4 className="font-bold text-xs text-gray-900 group-hover:text-[#00a884] transition-colors line-clamp-2 leading-snug mt-0.5">
                            {prod.name}
                          </h4>
                        </div>

                        {/* Price Display adapted to Mode */}
                        <div className="pt-2 border-t border-gray-100 mt-2">
                          {currencyMode === 'divisas' ? (
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm font-black font-mono text-gray-900">
                                ${pricing.unitPriceUsd.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-bold">Divisas</span>
                            </div>
                          ) : currencyMode === 'bolivares' ? (
                            <div>
                              <div className="text-sm font-black font-mono text-gray-900">
                                Bs. {pricing.unitPriceBs.toLocaleString('es-VE')}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                Ref: ${pricing.unitPriceUsd.toFixed(2)}
                              </div>
                            </div>
                          ) : currencyMode === 'bcv' ? (
                            <div>
                              <div className="text-sm font-black font-mono text-indigo-700">
                                ${pricing.unitPriceUsd.toFixed(2)} BCV
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                Bs. {pricing.unitPriceBs.toLocaleString('es-VE')}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-black font-mono text-purple-700">
                                ${pricing.unitPriceUsd.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-purple-400 font-mono">
                                Cashea (+{casheaPercent}%)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* QUOTE SUMMARY & CUSTOMER PANEL */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3 sticky top-18">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">Resumen del Presupuesto</h3>
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                  {quoteItems.length} {quoteItems.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              {/* Mode Banner Indicator */}
              <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                currencyMode === 'divisas'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : currencyMode === 'bolivares'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : currencyMode === 'bcv'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-purple-50 border-purple-200 text-purple-900'
              }`}>
                <span>
                  {currencyMode === 'divisas' && '💵 Presupuesto en Divisas (Precios Fijos)'}
                  {currencyMode === 'bolivares' && '🇻🇪 Presupuesto Válido Únicamente por 24h'}
                  {currencyMode === 'bcv' && '🏦 Cotización Tasa Oficial BCV'}
                  {currencyMode === 'cashea' && `🟣 Modo Cashea (+${casheaPercent}%)`}
                </span>
                <span className="text-[10px] opacity-80 uppercase">
                  {currencyMode}
                </span>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Nombre del Cliente / Empresa *
                  </label>
                  <input
                    type="text"
                    list="quote-customers-list"
                    value={quoteCustomerName}
                    onChange={(e) => setQuoteCustomerName(e.target.value)}
                    placeholder="Cliente Mostrador o seleccionar..."
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                  />
                  <datalist id="quote-customers-list">
                    {customers.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Cédula / RIF
                    </label>
                    <input
                      type="text"
                      value={quoteCustomerCi}
                      onChange={(e) => setQuoteCustomerCi(e.target.value)}
                      placeholder="Ej: V-12345678"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      WhatsApp / Teléfono
                    </label>
                    <input
                      type="text"
                      value={quoteCustomerPhone}
                      onChange={(e) => setQuoteCustomerPhone(e.target.value)}
                      placeholder="Ej: 0414-1234567"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Nota o Cláusula de Validez
                  </label>
                  <input
                    type="text"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder={
                      currencyMode === 'bolivares'
                        ? 'Presupuesto válido únicamente por 24 horas'
                        : currencyMode === 'divisas'
                        ? 'Solo válido en Divisas (Efectivo / Zelle / Binance)'
                        : 'Válido por 24 horas a tasa oficial BCV'
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                  />
                </div>
              </div>

              {/* Items List in Quote */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {quoteItems.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 rounded-xl bg-gray-50/50 border border-dashed border-gray-200">
                    <FileText className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                    <p className="text-xs font-medium text-gray-600">Presupuesto vacío</p>
                    <p className="text-[10px] text-gray-400">Toca productos de la izquierda para agregarlos</p>
                  </div>
                ) : (
                  quoteItems.map(item => (
                    <div
                      key={item.product_id}
                      className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-1.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 truncate">{item.product_name}</div>
                        <div className="text-[10px] font-mono text-gray-500">
                          {currencyMode === 'divisas' ? (
                            <span>${item.price_usd.toFixed(2)} c/u</span>
                          ) : currencyMode === 'bolivares' ? (
                            <span>Bs. {Math.round(item.price_usd * tasaInterna).toLocaleString('es-VE')}</span>
                          ) : (
                            <span>${item.price_usd.toFixed(2)} c/u</span>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuoteQuantity(item.product_id, -1)}
                          className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-xs text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuoteQuantity(item.product_id, 1)}
                          className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[60px]">
                        <div className="font-mono font-bold text-xs text-gray-900">
                          ${(item.price_usd * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuoteItem(item.product_id)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  {currencyMode === 'divisas' ? (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total en Dólares ($):</span>
                        <span className="text-2xl font-black font-mono text-emerald-700">
                          ${quoteTotalUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold pt-1 border-t border-gray-200/60 mt-1">
                        Solo válido para pagos en Divisas (Efectivo / Zelle / Binance)
                      </div>
                    </div>
                  ) : currencyMode === 'bolivares' ? (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total en Bolívares (Bs.):</span>
                        <span className="text-xl font-black font-mono text-rose-700">
                          Bs. {quoteTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-0.5">
                        <span>Ref. en Dólares:</span>
                        <span className="font-mono font-bold text-gray-800">${quoteTotalUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 pt-0.5 border-t border-gray-200">
                        <span>Tasa del día:</span>
                        <span className="font-mono">Bs. {tasaInterna.toFixed(2)} / $</span>
                      </div>
                      <div className="text-[10px] text-rose-700 font-bold mt-1">
                        ⚠️ Válido únicamente por 24 horas continuas
                      </div>
                    </div>
                  ) : currencyMode === 'bcv' ? (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Total Dólares BCV ($):</span>
                        <span className="text-xl font-black font-mono text-indigo-700">
                          ${quoteTotalUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600 pt-0.5">
                        <span>Equivalente en Bs.:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          Bs. {quoteTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 pt-0.5 border-t border-gray-200">
                        <span>Tasa Oficial BCV:</span>
                        <span className="font-mono">Bs. {tasaBcv.toFixed(2)} / $</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Total Cashea (+{casheaPercent}%):</span>
                        <span className="text-xl font-black font-mono text-purple-700">
                          ${quoteTotalUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-gray-200">
                        <div>
                          <span className="text-gray-400">Inicial (40%):</span>
                          <span className="font-bold text-gray-800 ml-1">${(quoteTotalUsd * 0.40).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">3 cuotas c/14d:</span>
                          <span className="font-bold text-purple-700 ml-1">${((quoteTotalUsd * 0.60) / 3).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSaveAndGeneratePdf}
                  disabled={quoteItems.length === 0 || isSubmitting}
                  className="w-full bg-[#00a884] hover:bg-[#008f6f] active:scale-98 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generando...' : '📄 Guardar y Generar PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 2. MODO: LISTADO PRINCIPAL DE PRESUPUESTOS & COTIZACIONES  */
        /* ========================================================= */
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Presupuestos & Cotizaciones</h2>
                <p className="text-xs text-gray-400">
                  Cotizaciones formales en Divisas, Bolívares (24h), BCV y Cashea con PDF y WhatsApp con 1 clic
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrencyMode('bolivares');
                  setIsCreatingQuote(true);
                }}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Cotización</span>
              </button>

              <button
                type="button"
                onClick={fetchQuotes}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                title="Actualizar presupuestos"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar presupuesto por número de cotización, cliente o teléfono..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Quotes Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50/75 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="py-3 px-4">Cotización #</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-center">Artículos</th>
                    <th className="py-3 px-4 text-right">Total ($)</th>
                    <th className="py-3 px-4 text-right">Total (Bs.)</th>
                    <th className="py-3 px-4 text-center">Modalidad</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {quotes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-semibold text-gray-600 mb-1">No hay presupuestos guardados aún</p>
                        <p className="text-xs text-gray-400 mb-3">Crea una cotización formal seleccionando productos del catálogo</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrencyMode('bolivares');
                            setIsCreatingQuote(true);
                          }}
                          className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Crear Primera Cotización</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    quotes.map((q) => {
                      const mode = q.currency_mode || (q.is_cashea ? 'cashea' : 'bolivares');

                      return (
                        <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {q.quote_number}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{q.customer_name}</div>
                            {q.customer_phone && (
                              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{q.customer_phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {new Date(q.created_at).toLocaleDateString('es-VE')} {new Date(q.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[10px]">
                              {q.items?.length || 0} ítems
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                            ${q.total_usd.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-[#00a884]">
                            {mode === 'divisas' ? (
                              <span className="text-gray-400 font-normal">Solo Divisas</span>
                            ) : (
                              `Bs. ${q.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {mode === 'divisas' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                💵 Divisas ($)
                              </span>
                            ) : mode === 'bcv' ? (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] border border-indigo-200">
                                🏦 USD BCV
                              </span>
                            ) : mode === 'cashea' ? (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] border border-purple-200">
                                🟣 Cashea
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                                ⏳ Bs. (24h)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Ver Detalle / Proforma */}
                              <button
                                type="button"
                                onClick={() => setSelectedQuote(q)}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                title="Ver detalle formal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Descargar PDF */}
                              <button
                                type="button"
                                onClick={() => generateQuotePdf(q, settings, 'download')}
                                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                                title="Descargar PDF formal"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleShareWhatsApp(q)}
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                title="Enviar por WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              {/* Cargar a Caja */}
                              <button
                                type="button"
                                onClick={() => handleLoadToCart(q)}
                                className="px-2.5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Cargar estos artículos al carrito del Punto de Venta"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span className="hidden sm:inline">Cargar</span>
                              </button>

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(q)}
                                className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                                title="Eliminar presupuesto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: VISTA PREVIA FORMAL DE COTIZACIÓN (A4 PROFORMA)  */}
      {/* ========================================================= */}
      {selectedQuote && (() => {
        const qMode = selectedQuote.currency_mode || (selectedQuote.is_cashea ? 'cashea' : 'bolivares');
        const qTasa = Number(selectedQuote.tasa_interna || tasaInterna);
        const qTasaBcv = Number(settings?.tasa_bcv || tasaBcv);

        return (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden text-xs flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-4 bg-[#0f172a] text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>Presupuesto {selectedQuote.quote_number}</span>
                    {qMode === 'divisas' && (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Solo Divisas ($)
                      </span>
                    )}
                    {qMode === 'bolivares' && (
                      <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Válido 24h
                      </span>
                    )}
                    {qMode === 'bcv' && (
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Tasa BCV
                      </span>
                    )}
                    {qMode === 'cashea' && (
                      <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Cashea
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedQuote.customer_name} {selectedQuote.customer_phone ? `• ${selectedQuote.customer_phone}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* A4 Proforma Sheet Preview */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {/* Proforma Header */}
                <div className="border-b border-gray-100 pb-3 flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-base text-gray-900 uppercase tracking-tight">
                      {settings?.company_name || 'FERRETERÍA HEBERT'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {settings?.company_rif || 'RIF: J-50123456-7'} • {settings?.company_phone || ''}
                    </p>
                    <p className="text-[11px] text-gray-400">{settings?.company_address || ''}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00a884] font-black text-xs">
                      COTIZACIÓN FORMAL
                    </span>
                    <div className="font-mono font-bold text-gray-900 mt-1">
                      {selectedQuote.quote_number}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(selectedQuote.created_at || Date.now()).toLocaleDateString('es-VE')}
                    </div>
                  </div>
                </div>

                {/* Banner Aviso según Modo */}
                {qMode === 'divisas' && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs text-center">
                    Presupuesto – Método de pago: Solo válido en Divisas (Efectivo / Zelle / Binance) • Precios fijos en USD
                  </div>
                )}
                {qMode === 'bolivares' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs text-center">
                    ⚠️ Cláusula Obligatoria: Presupuesto válido únicamente por 24 horas • Tasa del día: Bs. {qTasa.toFixed(2)}
                  </div>
                )}
                {qMode === 'bcv' && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs text-center">
                    Cotización a Tasa Oficial BCV: Bs. {qTasaBcv.toFixed(2)} • Válido por 24 horas
                  </div>
                )}
                {qMode === 'cashea' && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs text-center">
                    Cotización Modalidad Cashea (+{casheaPercent}%) a Tasa Oficial BCV • Válido por 24 horas
                  </div>
                )}

                {/* Customer Box */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Cliente:</span>
                    <div className="font-bold text-gray-900">{selectedQuote.customer_name}</div>
                    {selectedQuote.customer_ci && (
                      <div className="text-[11px] text-gray-500">C.I. / RIF: {selectedQuote.customer_ci}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Contacto:</span>
                    <div className="font-medium text-gray-700">
                      {selectedQuote.customer_phone || 'Sin número registrado'}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      {qMode === 'divisas' ? 'Precios fijos en $' : 'Válido por 24 horas'}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                      <tr>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-center">Cant.</th>
                        <th className="py-2 px-3 text-right">P. Unitario</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(selectedQuote.items || []).map((it, idx) => {
                        const price = Number(it.price_usd || it.price_usd_tienda || 0);
                        const sub = Number(it.subtotal_usd || (price * it.quantity));

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-gray-900">{it.product_name || it.name}</div>
                              <div className="text-[10px] font-mono text-gray-400">{it.product_code || it.code || 'ART'}</div>
                            </td>
                            <td className="py-2 px-3 text-center font-bold">{it.quantity} {it.unit || 'und'}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              {qMode === 'divisas'
                                ? `$${price.toFixed(2)}`
                                : qMode === 'bolivares'
                                ? `Bs. ${Math.round(price * qTasa).toLocaleString('es-VE')}`
                                : `$${price.toFixed(2)}`}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                              {qMode === 'divisas'
                                ? `$${sub.toFixed(2)}`
                                : qMode === 'bolivares'
                                ? `Bs. ${Math.round(sub * qTasa).toLocaleString('es-VE')}`
                                : `$${sub.toFixed(2)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 font-mono text-xs">
                  {qMode === 'divisas' ? (
                    <div className="flex justify-between items-baseline font-black text-emerald-700 text-base">
                      <span>Total en Dólares ($):</span>
                      <span>${Number(selectedQuote.total_usd).toFixed(2)}</span>
                    </div>
                  ) : qMode === 'bolivares' ? (
                    <div>
                      <div className="flex justify-between items-baseline font-black text-rose-700 text-base">
                        <span>Total en Bolívares (Bs.):</span>
                        <span>Bs. {Number(selectedQuote.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-200">
                        <span>Ref. en Dólares:</span>
                        <span>${Number(selectedQuote.total_usd).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Tasa del día:</span>
                        <span>Bs. {qTasa.toFixed(2)} / $</span>
                      </div>
                    </div>
                  ) : qMode === 'bcv' ? (
                    <div>
                      <div className="flex justify-between items-baseline font-black text-indigo-700 text-base">
                        <span>Total USD BCV:</span>
                        <span>${Number(selectedQuote.total_usd).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#00a884] pt-1 border-t border-gray-200">
                        <span>Total en Bolívares:</span>
                        <span>Bs. {Number(selectedQuote.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Tasa Oficial BCV:</span>
                        <span>Bs. {qTasaBcv.toFixed(2)} / $</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-baseline font-black text-purple-700 text-base">
                        <span>Total Cashea:</span>
                        <span>${Number(selectedQuote.total_usd).toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-200 text-gray-700">
                        <div>Inicial 40%: <b>${(Number(selectedQuote.total_usd) * 0.40).toFixed(2)}</b></div>
                        <div>3 Cuotas c/14d: <b>${((Number(selectedQuote.total_usd) * 0.60) / 3).toFixed(2)}</b></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Commercial disclaimer */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
                  <strong>Condiciones:</strong> {selectedQuote.notes || (
                    qMode === 'bolivares'
                      ? 'Presupuesto válido únicamente por 24 horas continuas a la tasa del día.'
                      : qMode === 'divisas'
                      ? 'Solo válido en Divisas (Efectivo / Zelle / Binance). Precios fijos en dólares.'
                      : 'Cotización sujeta a tasa oficial BCV con validez de 24 horas.'
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="py-2.5 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => generateQuotePdf(selectedQuote, settings, 'download')}
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedQuote)}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleLoadToCart(selectedQuote);
                    setSelectedQuote(null);
                  }}
                  className="py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cargar a Caja</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 4. MODAL: CONFIRMACIÓN DE ELIMINACIÓN DE PRESUPUESTO       */}
      {/* ========================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">¿Eliminar Presupuesto?</h3>
            <p className="text-xs text-gray-500">
              Esta acción eliminará permanentemente la cotización{' '}
              <strong className="text-gray-900">{deleteConfirm.quote_number}</strong> de{' '}
              {deleteConfirm.customer_name}.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQuote(deleteConfirm.id)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}