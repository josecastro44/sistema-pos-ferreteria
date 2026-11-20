import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  ShoppingCart,
  Box,
  FileText,
  Sparkles,
  X,
  UserPlus,
  User,
  Search,
  ChevronDown,
  Check,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import QuickClientModal from './QuickClientModal';
import ProductThumbnail from './ProductThumbnail';

export default function PosView({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  posViewMode,
  setPosViewMode,
  isCasheaActive,
  setIsCasheaActive,
  settings,
  cart,
  customerName,
  setCustomerName,
  customerCi = '',
  setCustomerCi = () => {},
  customerPhone = '',
  setCustomerPhone = () => {},
  selectedCustomerId = null,
  setSelectedCustomerId = () => {},
  customers = [],
  cartTotals,
  onProductClick,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  onOpenCheckout,
  onGenerateQuote,
  fetchCustomers,
  showToast
}) {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientDraft, setQuickClientDraft] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const clientPickerRef = useRef(null);
  const clientSearchInputRef = useRef(null);

  // Active client object
  const selectedClient = useMemo(() => {
    if (selectedCustomerId) {
      const found = customers.find(c => c.id === selectedCustomerId);
      if (found) return found;
    }
    if (customerName && customerName !== 'Cliente Mostrador') {
      const found = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase() || `${c.name} (${c.id_card})` === customerName);
      if (found) return found;
    }
    return {
      id: 1,
      name: customerName || 'Cliente Mostrador',
      id_card: customerCi || 'V-00000000',
      phone: customerPhone || '0414-0000000'
    };
  }, [customers, selectedCustomerId, customerName, customerCi, customerPhone]);

  // Matching clients for search dropdown
  const matchingClients = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.id_card && c.id_card.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  }, [customers, clientSearchQuery]);

  const handleSelectClient = (client) => {
    if (!client) return;
    setSelectedCustomerId(client.id);
    setCustomerName(client.name);
    setCustomerCi(client.id_card || '');
    setCustomerPhone(client.phone || '');
    setClientPickerOpen(false);
    setClientSearchQuery('');
  };

  const handleClientCreated = (newClient) => {
    handleSelectClient(newClient);
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!clientPickerOpen) return;
    const handleClickOutside = (e) => {
      if (clientPickerRef.current && !clientPickerRef.current.contains(e.target)) {
        setClientPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clientPickerOpen]);

  // Keyboard shortcut F3 to trigger quick client modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setClientPickerOpen(false);
        setQuickClientDraft(clientSearchQuery);
        setIsQuickClientOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clientSearchQuery]);

  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  const casheaPercent = settings?.cashea_percent || 15;
  const activeProducts = products.filter(p => p.is_active !== 0);

  return (
    <div className="w-full max-w-[1780px] mx-auto pb-6">
      {/* ========================================================= */}
      {/* MAIN LAYOUT: CATALOG (LEFT 7-8 COLS) + CART (RIGHT 4-5 COLS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
        {/* CATALOG CONTAINER CARD */}
        <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 flex flex-col gap-4 min-w-0">
          <div className="card-surface p-5 flex flex-col gap-4">
            {/* Catalog Card Header matching Screenshot 7 & 8 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-[17px] text-[#111827]">
                    Catálogo de Productos
                  </h2>
                  <span className="text-xs font-mono-num font-semibold px-2.5 py-0.5 rounded-lg bg-[#F2F7F6] text-[#074E4A]">
                    {activeProducts.length} productos
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Haz clic en un artículo para agregarlo · [F2] para buscar
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Price Mode Toggle: Estándar vs Cashea (+15%) */}
                <div
                  className="flex items-center bg-[#F4F6F8] p-1 rounded-xl"
                  role="group"
                  aria-label="Modalidad de precio"
                >
                  <button
                    type="button"
                    onClick={() => setIsCasheaActive(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      !isCasheaActive
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-500 hover:text-[#111827]'
                    }`}
                  >
                    Precio Estándar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCasheaActive(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isCasheaActive
                        ? 'bg-[#074E4A] text-white shadow-xs'
                        : 'text-slate-500 hover:text-[#111827]'
                    }`}
                  >
                    <span>Cashea (+{casheaPercent}%)</span>
                  </button>
                </div>

                {/* Layout Mode Toggle: Cuadrícula vs Lista */}
                <div
                  className="flex items-center bg-[#F4F6F8] p-1 rounded-xl"
                  role="group"
                  aria-label="Vista de catálogo"
                >
                  <button
                    type="button"
                    onClick={() => setPosViewMode('grid')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      posViewMode === 'grid'
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-500 hover:text-[#111827]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cuadrícula</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosViewMode('list')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      posViewMode === 'list'
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-500 hover:text-[#111827]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lista</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Strip matching Screenshot 7 */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="Categorías de productos"
            >
              {categories.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#074E4A] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-[#111827] border border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Catalog Content: List or Grid */}
            {activeProducts.length === 0 ? (
              <div className="card-surface p-12 text-center">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-display font-semibold text-[#111827]">
                  No se encontraron productos
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Prueba con otro término de búsqueda o selecciona la categoría Todos.
                </p>
              </div>
            ) : posViewMode === 'list' ? (
              <div className="card-surface overflow-hidden border border-slate-100/90 rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-[#FAFBFC] leading-tight">
                        <th className="py-3 pl-3.5 pr-1.5">Producto</th>
                        <th className="py-3 px-1 text-center whitespace-nowrap">Stock</th>
                        <th className="py-3 px-1.5 text-right whitespace-nowrap">
                          Precio<br />USD
                        </th>
                        <th className="py-3 px-1.5 text-right whitespace-nowrap">
                          Precio<br />Bs.
                        </th>
                        <th
                          className={`py-3 px-1.5 text-right whitespace-nowrap ${
                            isCasheaActive
                              ? 'text-indigo-600 bg-indigo-50/50'
                              : 'text-indigo-500/80'
                          }`}
                        >
                          Precio USD<br />Cashea
                        </th>
                        <th
                          className={`py-3 px-1.5 text-right whitespace-nowrap ${
                            isCasheaActive
                              ? 'text-indigo-600 bg-indigo-50/50'
                              : 'text-indigo-500/80'
                          }`}
                        >
                          Precio Bs.<br />Cashea
                        </th>
                        <th className="py-3 pl-1 pr-3 text-center whitespace-nowrap">
                          Agregar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[12px]">
                      {activeProducts.map((product) => {
                        const priceUsd = Number(product.price_usd_tienda || 0);
                        const priceBs = Number(product.price_bs || (priceUsd * Number(settings?.tasa_interna || 960)));
                        const casheaUsd = Number(product.price_cashea || (priceUsd * (1 + casheaPercent / 100)));
                        const casheaBs = Number(product.price_cashea_bs || (casheaUsd * Number(settings?.tasa_interna || 960)));
                        const isLowStock = product.stock <= (product.min_stock || 5);
                        const outOfStock = product.stock <= 0;

                        return (
                          <tr
                            key={product.id}
                            onClick={() => onProductClick(product)}
                            className="hover:bg-[#F7FAF9] transition-colors group cursor-pointer"
                          >
                            <td className="py-2.5 pl-3.5 pr-1.5">
                              <div className="flex items-center gap-2">
                                <ProductThumbnail product={product} size="sm" />
                                <div className="min-w-0 max-w-[170px] sm:max-w-[210px]">
                                  <p className="font-semibold text-[#111827] leading-snug line-clamp-2">
                                    {product.name}
                                  </p>
                                  <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                                    <span className="font-mono-num font-semibold text-slate-500">
                                      {product.code}
                                    </span>{' '}
                                    · {product.category} · [{product.unit}]
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-1 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-lg font-mono-num text-[10.5px] font-semibold ${
                                  outOfStock
                                    ? 'bg-rose-50 text-rose-600'
                                    : isLowStock
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-[#F4F6F8] text-slate-600'
                                }`}
                              >
                                {product.stock} {product.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-1.5 text-right font-mono-num font-bold text-[#111827] whitespace-nowrap">
                              ${priceUsd.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-1.5 text-right font-mono-num font-semibold text-[#074E4A] whitespace-nowrap">
                              Bs. {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </td>
                            <td
                              className={`py-2.5 px-1.5 text-right font-mono-num font-bold text-indigo-600 whitespace-nowrap ${
                                isCasheaActive ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              ${casheaUsd.toFixed(2)}
                            </td>
                            <td
                              className={`py-2.5 px-1.5 text-right font-mono-num font-semibold text-violet-700 whitespace-nowrap ${
                                isCasheaActive ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              Bs. {casheaBs.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 pl-1 pr-3 text-center">
                              <button
                                type="button"
                                disabled={outOfStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onProductClick(product);
                                }}
                                aria-label={`Agregar ${product.name} al carrito`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#F2F7F6] text-[#074E4A] hover:bg-[#074E4A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeProducts.map((product) => {
                  const priceUsd = Number(product.price_usd_tienda || 0);
                  const priceBs = Number(product.price_bs || (priceUsd * Number(settings?.tasa_interna || 960)));
                  const casheaUsd = Number(product.price_cashea || (priceUsd * (1 + casheaPercent / 100)));
                  const casheaBs = Number(product.price_cashea_bs || (casheaUsd * Number(settings?.tasa_interna || 960)));
                  const isLowStock = product.stock <= (product.min_stock || 5);
                  const outOfStock = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => onProductClick(product)}
                      className="card-surface card-surface-hover p-4 flex flex-col justify-between gap-3.5 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <ProductThumbnail product={product} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono-num text-[11px] font-medium text-slate-400">
                              {product.code}
                            </span>
                            <span
                              className={`font-mono-num text-[11px] font-semibold ${
                                outOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-500'
                              }`}
                            >
                              {product.stock} {product.unit}
                            </span>
                          </div>
                          <h3 className="font-semibold text-[13.5px] text-[#111827] leading-snug mt-0.5 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {product.category}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className={`rounded-xl px-2.5 py-2 border transition-colors ${
                            !isCasheaActive
                              ? 'bg-[#F4F8F7] border-[#074E4A]/15'
                              : 'bg-[#F6F8FA] border-slate-100'
                          }`}
                        >
                          <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                            Precio Estándar
                          </p>
                          <p className="font-mono-num text-[13px] font-bold text-[#111827] leading-tight mt-0.5 whitespace-nowrap">
                            ${priceUsd.toFixed(2)}
                          </p>
                          <p className="font-mono-num text-[11px] font-semibold text-[#074E4A] leading-tight mt-0.5 whitespace-nowrap">
                            Bs. {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div
                          className={`rounded-xl px-2.5 py-2 border transition-colors ${
                            isCasheaActive
                              ? 'bg-indigo-50/70 border-indigo-200'
                              : 'bg-[#F6F8FA] border-slate-100'
                          }`}
                        >
                          <p className="text-[9.5px] font-semibold uppercase tracking-wide text-indigo-500 whitespace-nowrap">
                            Cashea (+{casheaPercent}%)
                          </p>
                          <p className="font-mono-num text-[13px] font-bold text-indigo-600 leading-tight mt-0.5 whitespace-nowrap">
                            ${casheaUsd.toFixed(2)}
                          </p>
                          <p className="font-mono-num text-[11px] font-semibold text-violet-700 leading-tight mt-0.5 whitespace-nowrap">
                            Bs. {casheaBs.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductClick(product);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CART CONTAINER (ORDEN DE VENTA - AMPLIADO Y PROPORCIONADO) */}
        {/* ========================================================= */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-5 2xl:col-span-4 min-w-0">
          <div className="card-surface p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 sticky top-4">
            {/* Header matching Screenshot 1 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F2F7F6] text-[#074E4A] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-[17px] text-[#111827] leading-tight">
                    Orden de Venta
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {isCasheaActive ? `Modalidad Cashea (+${casheaPercent}%)` : 'Precio estándar tienda'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCasheaActive && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-lg">
                    CASHEA
                  </span>
                )}
                <span className="text-xs bg-[#F4F6F8] text-[#111827] font-mono-num font-bold px-3 py-1 rounded-xl">
                  {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
            </div>

            {/* Smart Client Selector matching Screenshot 1 & 3 */}
            <div ref={clientPickerRef} className="relative">
              <div className="bg-[#F6F8FA] rounded-2xl p-3.5 sm:p-4 border border-transparent focus-within:border-[#074E4A]/30 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Cliente (Nombre / Cédula) · [F3]
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setClientPickerOpen(false);
                      setQuickClientDraft(clientSearchQuery);
                      setIsQuickClientOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#E6F7F5] hover:bg-[#074E4A] text-[#074E4A] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Nuevo</span>
                  </button>
                </div>

                <button
                  type="button"
                  aria-expanded={clientPickerOpen}
                  onClick={() => setClientPickerOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#074E4A] flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#111827] truncate">
                        {selectedClient?.name || 'Cliente Mostrador'}
                      </p>
                      <p className="text-xs font-mono-num text-slate-400 truncate mt-0.5">
                        {selectedClient?.id_card || 'V-00000000'}
                        {selectedClient?.phone ? ` · ${selectedClient.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      clientPickerOpen ? 'rotate-180 text-[#074E4A]' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Client Search & Dropdown Popover */}
              {clientPickerOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 overflow-hidden animate-in fade-in duration-100">
                  <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={clientSearchInputRef}
                        type="search"
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Buscar cédula, nombre o teléfono..."
                        className="w-full bg-[#F6F8FA] focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-slate-400 border border-transparent focus:border-[#074E4A]/30 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {matchingClients.length === 0 ? (
                      <div className="px-4 py-5 text-center">
                        <p className="text-xs font-medium text-slate-500">
                          No existe ningún cliente con &ldquo;{clientSearchQuery}&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Regístralo al instante sin salir de caja
                        </p>
                      </div>
                    ) : (
                      matchingClients.map((c) => {
                        const isSelected = selectedClient?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectClient(c)}
                            className={`w-full px-4 py-3 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                              isSelected ? 'bg-[#F2F7F6]' : 'hover:bg-[#FAFBFC]'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-[#111827] truncate">
                                {c.name}
                              </p>
                              <p className="text-xs font-mono-num text-slate-400 truncate">
                                {c.id_card}
                                {c.phone ? ` · ${c.phone}` : ''}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#074E4A] shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2.5 bg-[#FAFBFC] border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        const typed = clientSearchQuery;
                        setClientPickerOpen(false);
                        setClientSearchQuery('');
                        setQuickClientDraft(typed);
                        setIsQuickClientOpen(true);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="truncate">
                        {clientSearchQuery.trim()
                          ? `Registrar "${clientSearchQuery.trim()}" ahora`
                          : 'Registrar nuevo cliente'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 rounded-2xl bg-[#FAFBFC] border border-dashed border-slate-200">
                  <ShoppingCart className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">Carrito vacío</p>
                  <p className="text-xs text-slate-400 mt-0.5">Haz clic en un producto o presiona [F2]</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.product_id}
                    className="p-3 rounded-xl bg-[#F8FAFB] border border-slate-100 flex items-center justify-between gap-2.5 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] text-[#111827] truncate">{item.name}</div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        ${item.price_usd_tienda.toFixed(2)} • Bs. {item.price_bs.toLocaleString('es-VE')}
                      </div>
                    </div>

                    {/* Quantity Changer */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs">
                      <button
                        onClick={() => updateCartQuantity(item.product_id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#074E4A] rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-[#111827]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product_id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#074E4A] rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[75px]">
                      <div className="font-mono-num font-bold text-sm text-[#111827]">
                        ${(item.price_usd_tienda * item.quantity).toFixed(2)}
                      </div>
                      <div className="font-mono-num text-[11px] text-[#074E4A] font-semibold">
                        Bs. {(item.price_bs * item.quantity).toLocaleString('es-VE')}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Quitar artículo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totals Breakdown (Deep Forest Teal Accent Card) */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
              <div className="deep-teal-card rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div
                  className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/[0.05] pointer-events-none"
                  aria-hidden="true"
                />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-emerald-100/90">
                    Total Dólares
                  </span>
                  <span className="font-mono-num font-extrabold text-[30px] sm:text-[34px] tracking-tight">
                    ${cartTotals.total_usd_tienda.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs sm:text-[13px]">
                  <span className="text-emerald-100/80">Equivalente Bolívares</span>
                  <span className="font-mono-num font-bold text-[#BEF264]">
                    Bs. {cartTotals.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1.5 text-xs text-emerald-100/70">
                  <span>Referencia BCV (Bs. {Number(settings?.tasa_bcv || 866.56).toFixed(2)})</span>
                  <span className="font-mono-num">
                    ${(cartTotals.total_bs / Number(settings?.tasa_bcv || 866.56)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Presupuesto Button & Cobrar Button */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="py-3 px-4 rounded-xl bg-[#F4F6F8] hover:bg-slate-200/80 text-slate-700 font-semibold text-xs sm:text-[13px] transition-colors disabled:opacity-40 cursor-pointer text-center"
                  >
                    Vaciar
                  </button>
                  <button
                    type="button"
                    onClick={onGenerateQuote}
                    disabled={cart.length === 0}
                    className="py-3 px-4 rounded-xl border border-[#074E4A]/25 text-[#074E4A] hover:bg-[#F2F7F6] font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Generar cotización formal sin descontar inventario"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Presupuesto</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-4 px-5 rounded-2xl text-white font-bold text-sm sm:text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-45 cursor-pointer transition-colors shadow-md ${
                    isCasheaActive
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-[#074E4A] hover:bg-[#053E3B]'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Cobrar Orden [F4]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FLOATING CART BAR (MOBILE/TABLET - EXACT TO IMAGE 1)       */}
      {/* ========================================================= */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:right-6 sm:left-auto sm:w-[420px] z-40 lg:hidden">
          <div
            onClick={() => setIsCartDrawerOpen(true)}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between border border-slate-800 transition-all cursor-pointer active:scale-[0.99] select-none"
          >
            {/* Left: Cart Icon with Badge & Prices */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#074E4A] flex items-center justify-center text-white shadow-md">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 bg-white text-gray-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-gray-200">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="text-left">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                    ${cartTotals.total_usd_tienda.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold font-mono text-[#074E4A]">
                    (Bs. {Math.round(cartTotals.total_bs).toLocaleString('es-VE')})
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-medium">
                  Toca para revisar cuenta
                </p>
              </div>
            </div>

            {/* Right: Cobrar Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCheckout();
              }}
              className="bg-[#074E4A] hover:bg-[#053E3B] active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              <span>Cobrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER / BOTTOM SHEET: CARRITO DE DESPACHO (IMAGE 3)      */}
      {/* ========================================================= */}
      {isCartDrawerOpen && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartDrawerOpen(false)}
          />

          {/* Bottom Sheet Box */}
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#074E4A] flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    Carrito de Despacho
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.length === 1 ? 'producto en lista' : 'productos en lista'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setIsCartDrawerOpen(false);
                  }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 transition-colors cursor-pointer"
                >
                  Vaciar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Selector: CLIENTE / TALLER */}
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  CLIENTE (NOMBRE / CÉDULA) · [F3]
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuickClientDraft('');
                    setIsQuickClientOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#E6F7F5] hover:bg-[#074E4A] text-[#074E4A] hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo</span>
                </button>
              </div>
              <select
                value={selectedCustomerId || selectedClient?.id || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = customers.find(c => String(c.id) === val);
                  if (found) {
                    handleSelectClient(found);
                  } else {
                    setSelectedCustomerId(null);
                    setCustomerName('Cliente Mostrador');
                    setCustomerCi('V-00000000');
                    setCustomerPhone('0414-0000000');
                  }
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#074E4A]/20 focus:border-[#074E4A] cursor-pointer shadow-2xs"
              >
                <option value="">Cliente Mostrador (V-00000000 · 0414-0000000)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id_card || 'S/C'}) {c.phone ? `· ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Items List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
              {cart.map(item => (
                <div
                  key={item.product_id}
                  className="bg-white border border-gray-100 rounded-xl p-3 shadow-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {item.code || 'ART'} • ${item.price_usd_tienda.toFixed(2)} c/u
                    </div>
                  </div>

                  {/* Stepper [-] qty [+] */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/80 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product_id, -1)}
                      className="w-6 h-6 rounded-md bg-white text-gray-600 hover:text-gray-900 flex items-center justify-center text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product_id, 1)}
                      className="w-6 h-6 rounded-md bg-white text-gray-600 hover:text-gray-900 flex items-center justify-center text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Delete Icon */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-600" />
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Totals & Action */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium text-xs">Total en Dólares:</span>
                <span className="font-black font-mono text-gray-900 text-lg">
                  ${cartTotals.total_usd_tienda.toFixed(2)}
                </span>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-[#074E4A] font-bold text-xs">Total en Bolívares:</span>
                <span className="font-black font-mono text-[#074E4A] text-base">
                  Bs. {cartTotals.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onGenerateQuote();
                  }}
                  className="px-3.5 py-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Generar cotización"
                >
                  <FileText className="w-4 h-4" />
                  <span>Presupuesto</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onOpenCheckout();
                  }}
                  className="flex-1 bg-[#074E4A] hover:bg-[#053E3B] active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>💳 Cobrar e Imprimir Factura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUICK CLIENT MODAL IDENTICAL TO SCREENSHOT 3               */}
      {/* ========================================================= */}
      <QuickClientModal
        isOpen={isQuickClientOpen}
        initialQuery={quickClientDraft}
        existingClients={customers}
        onClose={() => {
          setIsQuickClientOpen(false);
          setQuickClientDraft('');
        }}
        onClientCreated={handleClientCreated}
        onSelectExisting={handleSelectClient}
        showToast={showToast}
        fetchCustomers={fetchCustomers}
      />
    </div>
  );
}

