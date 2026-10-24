import React from 'react';
import {
  LayoutGrid,
  List,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  ShoppingCart,
  Box
} from 'lucide-react';

export default function PosView({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  posViewMode,
  setPosViewMode,
  cart,
  customerName,
  setCustomerName,
  customers = [],
  cartTotals,
  onProductClick,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  onOpenCheckout
}) {
  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  return (
    <div className="space-y-3.5 w-full max-w-[1720px] mx-auto">
      {/* ========================================================= */}
      {/* TITLE & TOP ACTIONS                                       */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Punto de Venta</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Box className="w-3.5 h-3.5" />
            <span>{products.length} productos</span>
            <span>•</span>
            <span className="text-[#4f46e5] font-semibold">[F2] para buscar</span>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2">
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
              {products.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => onProductClick(prod)}
                  className="bg-white rounded-xl border border-gray-100 hover:border-[#4f46e5]/40 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between p-2.5 sm:p-3 group relative"
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
                    </div>

                    {/* Category & Name */}
                    <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      {prod.category}
                    </div>
                    <h4
                      className="font-bold text-xs text-gray-900 group-hover:text-[#4f46e5] transition-colors line-clamp-2 leading-snug mt-0.5"
                      title={prod.name}
                    >
                      {prod.name}
                    </h4>
                  </div>

                  {/* Dual Currency Price */}
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <div className="text-sm sm:text-base font-extrabold text-gray-900 font-mono tracking-tight leading-none">
                      Bs. {Number(prod.price_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-gray-500">
                      <span className="font-medium text-gray-600">${Number(prod.price_usd_tienda).toFixed(2)} Tienda</span>
                      <span className="font-semibold text-[#4f46e5]">${Number(prod.price_usd_bcv).toFixed(2)} BCV</span>
                    </div>
                  </div>
                </div>
              ))}
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
                    <th className="pb-2.5 text-right">Bs.</th>
                    <th className="pb-2.5 text-right">USD Tienda</th>
                    <th className="pb-2.5 text-right">USD BCV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(prod => (
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
                        <div className="font-bold text-xs text-gray-900 group-hover:text-[#4f46e5] transition-colors">
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
                        Bs. {prod.price_bs.toLocaleString('es-VE')}
                      </td>
                      <td className="py-2 text-right font-mono text-gray-600 text-xs">
                        ${prod.price_usd_tienda.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-[#4f46e5] text-xs">
                        ${prod.price_usd_bcv.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CART CONTAINER (COMPACTO Y BIEN PROPORCIONADO)            */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-xs p-3.5 sm:p-4 space-y-3 sticky top-18">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900">Orden de Venta</h3>
            </div>
            <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
              {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
            </span>
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
                      Bs. {(item.price_bs * item.quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="font-mono text-[10px] text-gray-500">
                      ${(item.price_usd_tienda * item.quantity).toFixed(2)}
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

          {/* Totals Breakdown */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Bolívares:</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-gray-900 tracking-tight">
                  Bs. {cartTotals.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="h-px bg-gray-200/60" />

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">USD (Tasa Tienda):</span>
                <span className="font-mono font-bold text-gray-900">
                  ${cartTotals.total_usd_tienda.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">USD (Tasa BCV):</span>
                <span className="font-mono font-bold text-[#00a884]">
                  ${cartTotals.total_usd_bcv.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-0.5">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer"
              >
                Vaciar
              </button>
              <button
                onClick={onOpenCheckout}
                disabled={cart.length === 0}
                className="flex-1 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold py-2 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cobrar Orden [F4]</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
