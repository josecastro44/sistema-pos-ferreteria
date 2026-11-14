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
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteCustomerName, setQuoteCustomerName] = useState('Cliente Mostrador');
  const [quoteCustomerCi, setQuoteCustomerCi] = useState('');
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('Válido por 3 días continuos');
  const [isCasheaQuote, setIsCasheaQuote] = useState(false);
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
  const casheaPercent = Number(settings?.cashea_percent || 15);

  // Filter products for the quote builder
  const filteredProducts = products.filter(p => {
    const term = productSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.synonyms && p.synonyms.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories list
  const allCategories = ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Helper to add product to quote
  const handleAddProductToQuote = (prod) => {
    const unitPriceUsd = isCasheaQuote ? prod.price_cashea : prod.price_usd_tienda;
    const unitPriceBs = isCasheaQuote ? prod.price_cashea_bs : prod.price_bs;

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
          price_usd: unitPriceUsd,
          price_bs: unitPriceBs
        }
      ];
    });
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
  const quoteTotalUsd = quoteItems.reduce((acc, it) => {
    return acc + (it.price_usd * it.quantity);
  }, 0);
  const quoteTotalBs = Math.round(quoteTotalUsd * tasaInterna * 100) / 100;

  // Save Quote & Open PDF / Proforma Preview
  const handleSaveAndGeneratePdf = async () => {
    if (quoteItems.length === 0) {
      if (showToast) showToast('Agrega al menos un producto al presupuesto', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: quoteCustomerName || 'Cliente Mostrador',
        customer_phone: quoteCustomerPhone || '',
        customer_ci: quoteCustomerCi || '',
        notes: quoteNotes || '',
        is_cashea: isCasheaQuote,
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

      // Open Quote Preview with generated PDF option
      setSelectedQuote({
        ...createdQuote,
        customer_ci: quoteCustomerCi,
        customer_phone: quoteCustomerPhone
      });

      // Automatically trigger PDF download
      setTimeout(() => {
        generateQuotePdf(createdQuote, settings, 'download');
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

  // Share via WhatsApp
  const handleShareWhatsApp = (quote) => {
    const rawPhone = (quote.customer_phone || '').replace(/\D/g, '');
    let phoneParam = rawPhone;
    if (phoneParam.startsWith('0')) {
      phoneParam = '58' + phoneParam.substring(1);
    }

    const companyName = settings?.company_name || 'Ferretería Hebert';
    const totalUsd = Number(quote.total_usd).toFixed(2);
    const totalBs = Number(quote.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 });
    const tasa = Number(quote.tasa_interna || tasaInterna).toFixed(2);

    const itemsSummary = (quote.items || [])
      .map(it => `• ${it.quantity}x ${it.product_name || it.name}: $${Number(it.subtotal_usd || (it.price_usd * it.quantity)).toFixed(2)}`)
      .join('\n');

    const text = `*PRESUPUESTO ${quote.quote_number}* - ${companyName}\n` +
      `👤 *Cliente:* ${quote.customer_name}\n` +
      `📅 *Fecha:* ${new Date(quote.created_at || Date.now()).toLocaleDateString('es-VE')}\n\n` +
      `📋 *Productos Cotizados:*\n${itemsSummary}\n\n` +
      `💵 *Total en Dólares:* $${totalUsd}\n` +
      `🇻🇪 *Total en Bolívares:* Bs. ${totalBs}\n` +
      `📊 *Tasa Ref.:* Bs. ${tasa} / $\n\n` +
      `⚠️ *Validez:* 3 días continuos.\n` +
      `_Gracias por su consulta._`;

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
                  {isCasheaQuote && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2 py-0.5 rounded-full">
                      🟣 Modo Cashea (+{casheaPercent}%)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-400">
                  Selecciona los productos del catálogo y genera un PDF profesional listo para enviar
                </p>
              </div>
            </div>

            {/* Switch Cashea & Cancel */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100/90 p-0.5 rounded-xl border border-gray-200/60 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCasheaQuote(false)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    !isCasheaQuote ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Estándar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCasheaQuote(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    isCasheaQuote ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700'
                  }`}
                >
                  🟣 Cashea
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingQuote(false)}
                className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
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
                    <p className="text-sm font-semibold text-gray-600">No se encontraron productos</p>
                    <p className="text-xs text-gray-400">Prueba con otra búsqueda o categoría</p>
                  </div>
                ) : (
                  filteredProducts.map(prod => {
                    const priceUsd = isCasheaQuote ? prod.price_cashea : prod.price_usd_tienda;
                    const priceBs = isCasheaQuote ? prod.price_cashea_bs : prod.price_bs;

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

                        <div className="pt-2 border-t border-gray-100 mt-2 flex items-baseline justify-between">
                          <span className="text-sm font-black font-mono text-gray-900">
                            ${Number(priceUsd).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-gray-500">
                            Bs. {Number(priceBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </span>
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
                    Nota o Validez
                  </label>
                  <input
                    type="text"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Ej: Válido por 3 días continuos"
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
                          ${item.price_usd.toFixed(2)} • Bs. {Math.round(item.price_usd * tasaInterna).toLocaleString('es-VE')}
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
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Dólares:</span>
                    <span className="text-xl font-black font-mono text-gray-900">
                      ${quoteTotalUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Equivalente en Bs.:</span>
                    <span className="font-mono font-black text-[#00a884] text-sm">
                      Bs. {quoteTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                    <span>Tasa de Cambio:</span>
                    <span className="font-mono">Bs. {tasaInterna.toFixed(2)} / $</span>
                  </div>
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
                  Crea cotizaciones seleccionando productos, genera PDF y envíalas por WhatsApp o cárgalas a caja
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingQuote(true)}
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
                        <p className="text-xs text-gray-400 mb-3">Crea una cotización seleccionando los productos de tu catálogo</p>
                        <button
                          type="button"
                          onClick={() => setIsCreatingQuote(true)}
                          className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Crear Primera Cotización</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    quotes.map((q) => (
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
                          Bs. {q.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {q.is_cashea ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                              Cashea
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                              Estándar
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
                              title="Ver detalle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Descargar PDF */}
                            <button
                              type="button"
                              onClick={() => generateQuotePdf(q, settings, 'download')}
                              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                              title="Descargar PDF"
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
                    ))
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
      {selectedQuote && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden text-xs flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-[#0f172a] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>Presupuesto {selectedQuote.quote_number}</span>
                  {selectedQuote.is_cashea ? (
                    <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Cashea
                    </span>
                  ) : null}
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
                  <div className="text-[10px] text-emerald-600 font-bold">Válido por 3 días</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                    <tr>
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">P. Unit ($)</th>
                      <th className="py-2 px-3 text-right">Subtotal ($)</th>
                      <th className="py-2 px-3 text-right text-emerald-700">Subtotal (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(selectedQuote.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3">
                          <div className="font-bold text-gray-900">{it.product_name || it.name}</div>
                          <div className="text-[10px] font-mono text-gray-400">{it.product_code || it.code || 'ART'}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{it.quantity} {it.unit || 'und'}</td>
                        <td className="py-2 px-3 text-right font-mono">${Number(it.price_usd || it.price_usd_tienda || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                          ${Number(it.subtotal_usd || (it.price_usd * it.quantity)).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#00a884]">
                          Bs. {Number(it.subtotal_bs || (it.subtotal_usd * tasaInterna) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-baseline font-bold text-gray-900 text-sm">
                  <span>Total Dólares ($):</span>
                  <span className="text-base">${Number(selectedQuote.total_usd).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline font-black text-[#00a884] text-sm">
                  <span>Total Bolívares (Bs.):</span>
                  <span className="text-base">Bs. {Number(selectedQuote.total_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                  <span>Tasa de Referencia:</span>
                  <span>Bs. {Number(selectedQuote.tasa_interna || tasaInterna).toFixed(2)} / $</span>
                </div>
              </div>

              {/* Commercial disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
                <strong>Nota Comercial:</strong> Los precios en dólares se mantienen durante los 3 días de vigencia de esta cotización. Los montos en bolívares se calculan a la tasa del día al momento de concretar la compra.
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
      )}

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
