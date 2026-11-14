import React, { useState } from 'react';
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
  ArrowRight,
  CreditCard
} from 'lucide-react';

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
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', id_card: '', phone: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.id_card.trim()) {
      if (showToast) showToast('Nombre y Cédula/RIF son obligatorios', 'error');
      return;
    }
    setIsCreatingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar cliente');
      }
      if (fetchCustomers) await fetchCustomers();
      setCustomerName(newCustomerForm.name);
      setIsNewCustomerModalOpen(false);
      setNewCustomerForm({ name: '', id_card: '', phone: '' });
      if (showToast) showToast(`Cliente ${newCustomerForm.name} registrado con éxito`);
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  const casheaPercent = settings?.cashea_percent || 15;

  return (
    <div className="space-y-3.5 w-full max-w-[1720px] mx-auto">
      {/* ========================================================= */}
      {/* TITLE & TOP ACTIONS                                       */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Punto de Venta</h2>
            {isCasheaActive && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-black tracking-wide border border-purple-200 animate-pulse">
                🟣 Modo Cashea Activo (+{casheaPercent}%)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Box className="w-3.5 h-3.5" />
            <span>{products.length} productos</span>
            <span>•</span>
            <span className="text-[#00a884] font-semibold">[F2] para buscar</span>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Modalidad Cashea Toggle (Precio 1 vs Precio 2) */}
          <div className="flex items-center bg-gray-100/90 p-0.5 rounded-xl border border-gray-200/60 text-xs">
            <button
              type="button"
              onClick={() => setIsCasheaActive(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                !isCasheaActive
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Precio Estándar
            </button>
            <button
              type="button"
              onClick={() => setIsCasheaActive(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                isCasheaActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span>🟣 Cashea</span>
              <span className="text-[10px] opacity-80">(+{casheaPercent}%)</span>
            </button>
          </div>

          {/* Segmented Switcher (Cuadrícula / Lista) */}
          <div className="flex items-center bg-gray-100/90 p-0.5 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setPosViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                posViewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#00a884]" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </button>
            <button
              onClick={() => setPosViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                posViewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-[#00a884]" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          {/* Quick Pay Button */}
          {cart.length > 0 && (
            <button
              onClick={onOpenCheckout}
              className="bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cobrar (${cartTotals.total_usd_tienda.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER PILLS ROW                                          */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat}
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

      {/* ========================================================= */}
      {/* MAIN LAYOUT: CATALOG (LEFT 8-9 COLS) + CART (RIGHT 3-4)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* CATALOG CONTAINER */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 bg-white rounded-2xl border border-gray-100 shadow-xs p-3.5 sm:p-4">
          {products.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Box className="w-10 h-10 mx-auto stroke-1 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">No se encontraron productos</p>
              <p className="text-xs text-gray-400">Prueba con otro término de búsqueda o categoría</p>
            </div>
          ) : posViewMode === 'grid' ? (
            /* =================================================== */
            /* VISTA CUADRÍCULA COMPACTA Y EFICIENTE (4-5 COLS)    */
            /* =================================================== */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
              {products.map(prod => {
                const displayPriceUsd = isCasheaActive ? prod.price_cashea : prod.price_usd_tienda;
                const displayPriceBs = isCasheaActive ? prod.price_cashea_bs : prod.price_bs;

                return (
                  <div
                    key={prod.id}
                    onClick={() => onProductClick(prod)}
                    className={`bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between p-2.5 sm:p-3 group relative ${
                      isCasheaActive
                        ? 'border-purple-200 hover:border-purple-500 hover:shadow-purple-100 shadow-xs'
                        : 'border-gray-100 hover:border-[#00a884]/40 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Thumbnail Image Box */}
                      <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden bg-gray-50 relative flex items-center justify-center border border-gray-100/60 mb-2">
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                        {/* Floating Stock Tag */}
                        <span
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-xs shadow-xs ${
                            prod.stock <= prod.min_stock
                              ? 'bg-rose-50/90 text-rose-700 border border-rose-200'
                              : 'bg-white/90 text-gray-700 border border-gray-200/60'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>

                        {isCasheaActive && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-purple-700 text-white shadow-xs">
                            CASHEA
                          </span>
                        )}
                      </div>

                      {/* Category & Name */}
                      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        {prod.category}
                      </div>
                      <h4
                        className="font-bold text-xs text-gray-900 group-hover:text-[#00a884] transition-colors line-clamp-2 leading-snug mt-0.5"
                        title={prod.name}
                      >
                        {prod.name}
                      </h4>
                    </div>

                    {/* Clean Pricing: No BCV Clutter! */}
                    <div className="pt-2 border-t border-gray-100 mt-2">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-base font-extrabold font-mono tracking-tight leading-none ${isCasheaActive ? 'text-purple-700' : 'text-gray-900'}`}>
                          ${Number(displayPriceUsd).toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 font-mono">
                          Bs. {Number(displayPriceBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =================================================== */
            /* VISTA EN LISTA COMPACTA                            */
            /* =================================================== */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="pb-2.5 pl-2">Foto</th>
                    <th className="pb-2.5">Código</th>
                    <th className="pb-2.5">Producto</th>
                    <th className="pb-2.5">Stock</th>
                    <th className="pb-2.5 text-right">Precio USD ($)</th>
                    <th className="pb-2.5 text-right">Precio Bs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(prod => {
                    const displayPriceUsd = isCasheaActive ? prod.price_cashea : prod.price_usd_tienda;
                    const displayPriceBs = isCasheaActive ? prod.price_cashea_bs : prod.price_bs;

                    return (
                      <tr
                        key={prod.id}
                        onClick={() => onProductClick(prod)}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-2 pl-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            <img
                              src={getProductImage(prod)}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-2 font-mono text-[11px] font-medium text-gray-500">{prod.code}</td>
                        <td className="py-2">
                          <div className="font-bold text-xs text-gray-900 group-hover:text-[#00a884] transition-colors">
                            {prod.name}
                          </div>
                          <div className="text-[10px] text-gray-400">{prod.category} • [{prod.unit}]</div>
                        </td>
                        <td className="py-2 font-medium">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              prod.stock <= prod.min_stock
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900 text-xs">
                          ${displayPriceUsd.toFixed(2)}
                          {isCasheaActive && <span className="ml-1 text-[9px] text-purple-700 font-bold">Cashea</span>}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-[#00a884] text-xs">
                          Bs. {displayPriceBs.toLocaleString('es-VE')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CART CONTAINER (DESKTOP ONLY - COMPACTO Y PROPORCIONADO)  */}
        {/* ========================================================= */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-4 2xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-xs p-3.5 sm:p-4 space-y-3 sticky top-18">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900">Orden de Venta</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {isCasheaActive && (
                <span className="text-[9px] bg-purple-100 text-purple-800 font-black px-1.5 py-0.5 rounded-md">
                  CASHEA
                </span>
              )}
              <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
          </div>

          {/* Customer Input with Autocomplete */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Cliente (Nombre / Cédula)
              </label>
              {customers.length > 0 && (
                <span className="text-[10px] text-gray-400 font-medium">
                  {customers.length} registrados
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                list="customers-datalist"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Cliente Mostrador o buscar..."
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
              />
              <datalist id="customers-datalist">
                {customers.map(c => (
                  <option key={c.id} value={`${c.name} (${c.id_card})`} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-6 text-center text-gray-400 rounded-xl bg-gray-50/50 border border-dashed border-gray-200/80">
                <ShoppingCart className="w-6 h-6 mx-auto stroke-1 text-gray-300 mb-1" />
                <p className="text-xs font-medium text-gray-600">Carrito vacío</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Haz clic en un producto o presiona [F2]</p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product_id}
                  className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-gray-900 truncate">{item.name}</div>
                    <div className="text-[10px] font-mono text-gray-500">
                      ${item.price_usd_tienda.toFixed(2)} • Bs. {item.price_bs.toLocaleString('es-VE')}
                    </div>
                  </div>

                  {/* Quantity Changer */}
                  <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.product_id, -1)}
                      className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-xs cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product_id, 1)}
                      className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded text-xs cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[65px]">
                    <div className="font-mono font-bold text-xs text-gray-900">
                      ${(item.price_usd_tienda * item.quantity).toFixed(2)}
                    </div>
                    <div className="font-mono text-[10px] text-[#00a884]">
                      Bs. {(item.price_bs * item.quantity).toLocaleString('es-VE')}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals Breakdown (Clean, Zero BCV Clutter!) */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Dólares:</span>
                <span className="text-2xl font-black font-mono text-gray-900 tracking-tight">
                  ${cartTotals.total_usd_tienda.toFixed(2)}
                </span>
              </div>

              <div className="h-px bg-gray-200/60" />

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Equivalente en Bolívares:</span>
                <span className="font-mono font-black text-[#00a884] text-sm">
                  Bs. {cartTotals.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-400 pt-0.5">
                <span>Tasa de Cambio:</span>
                <span className="font-mono font-medium">Bs. {Number(settings?.tasa_interna || 960).toFixed(2)} / $</span>
              </div>
            </div>

            {/* Presupuesto Button & Cobrar Button */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer"
                >
                  Vaciar
                </button>
                <button
                  type="button"
                  onClick={onGenerateQuote}
                  disabled={cart.length === 0}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-3 rounded-xl border border-indigo-200/60 transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 cursor-pointer"
                  title="Generar cotización sin descontar inventario"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Presupuesto</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenCheckout}
                disabled={cart.length === 0}
                className={`w-full text-white font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 cursor-pointer ${
                  isCasheaActive
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-[#00a884] hover:bg-[#008f6f]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cobrar Orden [F4]</span>
              </button>
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
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-md">
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
                  <span className="text-xs font-bold font-mono text-[#00a884]">
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
              className="bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
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
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a884] flex items-center justify-center">
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
                  CLIENTE / TALLER:
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="text-xs font-bold text-[#00a884] hover:text-[#008f6f] flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo</span>
                </button>
              </div>
              <select
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] cursor-pointer shadow-2xs"
              >
                <option value="Cliente Mostrador">Cliente Mostrador (Venta Rápida)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.id_card ? `(${c.id_card})` : ''}
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
                <span className="text-[#00a884] font-bold text-xs">Total en Bolívares:</span>
                <span className="font-black font-mono text-[#00a884] text-base">
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
                  className="flex-1 bg-[#00a884] hover:bg-[#008f6f] active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
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
      {/* QUICK NEW CUSTOMER MODAL                                   */}
      {/* ========================================================= */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsNewCustomerModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl z-10 p-4 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#00a884]" />
                <span>Nuevo Cliente / Taller</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="Ej: Inversiones Los Andes / Taller Juan"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Cédula o RIF *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.id_card}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, id_card: e.target.value })}
                  placeholder="Ej: V-12345678 o J-123456789"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="Ej: 0414-1234567"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="flex-1 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCustomer ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
