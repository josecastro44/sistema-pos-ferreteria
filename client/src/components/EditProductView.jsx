import React, { useState } from 'react';
import {
  Pencil,
  Search,
  Box,
  Layers,
  DollarSign,
  Tag,
  Check,
  AlertCircle,
  Power,
  Trash2,
  Eye,
  EyeOff,
  Building,
  LayoutGrid,
  List
} from 'lucide-react';
import ProductThumbnail from './ProductThumbnail';

export default function EditProductView({
  products = [],
  categories = [],
  onEditProduct,
  onAdjustStock,
  settings,
  fetchProducts,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todos');
  const [layoutMode, setLayoutMode] = useState('list'); // 'list' by default, or 'grid'
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  const tasaBcvVal = Number(settings?.tasa_bcv || 883.40);
  const tasaTienda = Number(settings?.tasa_interna || 960);
  const casheaPercent = Number(settings?.cashea_percent || 15);

  const filtered = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.synonyms && p.synonyms.toLowerCase().includes(term)) ||
      (p.provider_code && p.provider_code.toLowerCase().includes(term))
    );
    const matchCat = selectedCat === 'Todos' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  const activeCount = products.filter(p => p.is_active !== 0).length;

  const handleToggleActive = async (prod) => {
    setTogglingId(prod.id);
    try {
      const res = await fetch(`/api/products/${prod.id}/toggle-active`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Error al cambiar estado del producto');
      const updated = await res.json();
      if (fetchProducts) await fetchProducts();
      if (showToast) {
        showToast(
          updated.is_active === 1
            ? `Producto "${prod.name}" activado en POS`
            : `Producto "${prod.name}" pausado (oculto en POS)`
        );
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteProduct = async (prod) => {
    try {
      const res = await fetch(`/api/products/${prod.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar producto');
      if (fetchProducts) await fetchProducts();
      if (showToast) showToast(`Producto "${prod.name}" eliminado`);
      setDeleteProductConfirm(null);
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-[1780px] mx-auto pb-8">
      {/* Header bar */}
      <div className="card-surface p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-bold text-[18px] text-[#111827] tracking-tight">
                Editor & Gestión de Catálogo
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#F2F7F6] text-[#074E4A] font-mono-num text-[11px] font-semibold">
                {activeCount} activos · {products.length} total
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Modifica precios, activa o desactiva productos del POS, gestiona códigos de proveedor y elimina artículos
            </p>
          </div>
        </div>

        {/* Right Controls: Search + View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, proveedor o nombre..."
              className="w-full bg-[#F6F8FA] focus:bg-white text-xs text-[#111827] placeholder:text-slate-400 pl-9 pr-3.5 py-2 rounded-xl border border-transparent focus:border-[#074E4A]/30 focus:outline-none transition-colors"
            />
          </div>

          {/* View Switcher: Lista vs Cuadrícula */}
          <div className="flex items-center bg-[#F4F6F8] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setLayoutMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                layoutMode === 'list'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-slate-500 hover:text-[#111827]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-slate-500 hover:text-[#111827]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cuadrícula</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCat === cat
                ? 'bg-[#074E4A] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#111827] border border-slate-100 hover:border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <div className="card-surface p-16 text-center text-slate-400">
          <Box className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No se encontraron productos</p>
          <p className="text-xs text-slate-400 mt-0.5">Prueba con otro término de búsqueda o categoría</p>
        </div>
      ) : layoutMode === 'list' ? (
        /* ========================================================= */
        /* VISTA EN LISTA (TABLE)                                    */
        /* ========================================================= */
        <div className="card-surface overflow-hidden border border-slate-100/90 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-[#FAFBFC] leading-tight">
                  <th className="py-3.5 pl-4 pr-2">Producto</th>
                  <th className="py-3.5 px-2 text-center whitespace-nowrap">Estado POS</th>
                  <th className="py-3.5 px-2 text-center whitespace-nowrap">Stock</th>
                  <th className="py-3.5 px-2 text-right whitespace-nowrap">Precio Tienda ($)</th>
                  <th className="py-3.5 px-2 text-right whitespace-nowrap">Bs. Tienda</th>
                  <th className="py-3.5 px-2 text-right whitespace-nowrap">USD BCV ($)</th>
                  <th className="py-3.5 px-2 text-right whitespace-nowrap">Cashea (+{casheaPercent}%)</th>
                  <th className="py-3.5 pl-2 pr-4 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px]">
                {filtered.map(prod => {
                  const isActive = prod.is_active !== 0;
                  const priceUsd = Number(prod.price_usd_tienda || 0);
                  const displayPriceBs = prod.price_bs || (priceUsd * tasaTienda);
                  const displayPriceUsdBcv = prod.price_usd_bcv ? Number(prod.price_usd_bcv) : (displayPriceBs / tasaBcvVal);
                  const casheaPrice = prod.price_cashea ? Number(prod.price_cashea) : (priceUsd * (1 + casheaPercent / 100));
                  const isLowStock = prod.stock <= (prod.min_stock || 5);
                  const outOfStock = prod.stock <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-[#F7FAF9] transition-colors group ${
                        !isActive ? 'bg-slate-50/60 opacity-80' : ''
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-2.5">
                          <ProductThumbnail product={prod} size="sm" />
                          <div className="min-w-0 max-w-[240px]">
                            <p className="font-semibold text-[#111827] leading-snug truncate" title={prod.name}>
                              {prod.name}
                            </p>
                            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              <span className="font-mono-num font-semibold text-slate-500">
                                {prod.code}
                              </span>{' '}
                              · {prod.category} · [{prod.unit}]
                              {prod.provider_code && (
                                <span className="ml-1 text-slate-500 font-semibold">
                                  · Cat: {prod.provider_code}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod)}
                          disabled={togglingId === prod.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#E6F7F5] text-[#074E4A] hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={isActive ? 'Clic para pausar (ocultar en POS)' : 'Clic para activar en POS'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{isActive ? 'Activo en POS' : 'Oculto POS'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg font-mono-num text-[11px] font-semibold ${
                            outOfStock
                              ? 'bg-rose-50 text-rose-600'
                              : isLowStock
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-[#F4F6F8] text-slate-600'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-right font-mono-num font-bold text-[#111827] whitespace-nowrap">
                        ${priceUsd.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-right font-mono-num font-semibold text-[#074E4A] whitespace-nowrap">
                        Bs. {Number(displayPriceBs).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-2 text-right font-mono-num font-semibold text-indigo-700 whitespace-nowrap">
                        ${displayPriceUsdBcv.toFixed(2)}
                      </td>

                      <td className="py-3 px-2 text-right font-mono-num font-semibold text-violet-700 whitespace-nowrap">
                        ${casheaPrice.toFixed(2)}
                      </td>

                      <td className="py-3 pl-2 pr-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(prod)}
                            disabled={togglingId === prod.id}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#F4F6F8] hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                            }`}
                            title={isActive ? 'Pausar (ocultar en POS)' : 'Activar en POS'}
                          >
                            {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => onAdjustStock(prod)}
                            className="px-2.5 h-8 rounded-xl bg-[#F4F6F8] hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ajustar inventario / stock"
                          >
                            <Layers className="w-3 h-3 text-[#074E4A]" />
                            <span>Stock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditProduct(prod)}
                            className="px-3 h-8 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Editar datos del producto"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteProductConfirm(prod)}
                            className="w-8 h-8 rounded-xl bg-rose-50/70 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                            title="Eliminar producto permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* VISTA EN CUADRÍCULA (GRID)                                */
        /* ========================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(prod => {
            const isActive = prod.is_active !== 0;
            const priceUsd = Number(prod.price_usd_tienda || 0);
            const displayPriceBs = prod.price_bs || (priceUsd * tasaTienda);
            const displayPriceUsdBcv = prod.price_usd_bcv ? Number(prod.price_usd_bcv) : (displayPriceBs / tasaBcvVal);
            const casheaPrice = prod.price_cashea ? Number(prod.price_cashea) : (priceUsd * (1 + casheaPercent / 100));

            return (
              <div
                key={prod.id}
                className={`card-surface card-surface-hover p-4 flex flex-col justify-between gap-3.5 ${
                  !isActive ? 'opacity-80 bg-slate-50/60' : ''
                }`}
              >
                <div>
                  {/* Top Product Identity */}
                  <div className="flex items-start gap-3">
                    <ProductThumbnail product={prod} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 text-[10px]">
                        <span className="font-mono-num text-slate-400 font-semibold shrink-0">
                          {prod.code}
                        </span>
                        <span className="uppercase tracking-wide text-slate-400 font-semibold truncate text-right">
                          {prod.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[13.5px] text-[#111827] leading-snug mt-0.5 line-clamp-2" title={prod.name}>
                        {prod.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={`px-2 py-0.5 rounded-md font-mono-num text-[11px] font-semibold ${
                          prod.stock <= prod.min_stock
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-[#F2F7F6] text-[#074E4A]'
                        }`}>
                          Stock: {prod.stock} {prod.unit}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            isActive
                              ? 'bg-[#E6F7F5] text-[#074E4A]'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isActive ? 'Activo en POS' : 'Oculto POS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provider notes if exists */}
                  {(prod.provider_code || prod.provider_notes) && (
                    <div className="mt-2.5 p-2 rounded-xl bg-[#F6F8FA] text-[11px] text-slate-600 flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {prod.provider_code && <strong className="text-slate-800">Cat: {prod.provider_code} </strong>}
                        {prod.provider_notes && <span>• {prod.provider_notes}</span>}
                      </span>
                    </div>
                  )}

                  {/* 4-Row Financial Breakdown */}
                  <div className="bg-[#F6F8FA] rounded-xl p-3 flex flex-col gap-1.5 text-xs mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-semibold text-slate-400 uppercase">
                        Precio Tienda ($)
                      </span>
                      <span className="font-mono-num font-bold text-[#111827] text-sm">
                        ${priceUsd.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Bs. Tienda:</span>
                      <span className="font-mono-num font-semibold text-[#074E4A]">
                        Bs. {Number(displayPriceBs).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">USD BCV ($):</span>
                      <span className="font-mono-num font-semibold text-indigo-600">
                        ${displayPriceUsdBcv.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Cashea:</span>
                      <span className="font-mono-num font-semibold text-violet-600">
                        ${casheaPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(prod)}
                    disabled={togglingId === prod.id}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#F4F6F8] hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                    }`}
                    title={isActive ? 'Pausar (ocultar en POS)' : 'Activar en POS'}
                  >
                    {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onAdjustStock(prod)}
                    className="px-2.5 h-8 rounded-xl bg-[#F4F6F8] hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Ajustar stock"
                  >
                    <Layers className="w-3 h-3 text-[#074E4A]" />
                    <span>Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditProduct(prod)}
                    className="flex-1 h-8 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteProductConfirm(prod)}
                    className="w-8 h-8 rounded-xl bg-rose-50/70 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="card-surface max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-[#111827]">¿Eliminar Producto?</h3>
            <p className="text-xs text-slate-500">
              ¿Estás seguro de eliminar <strong className="text-[#111827]">{deleteProductConfirm.name}</strong> ({deleteProductConfirm.code})? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                className="flex-1 py-2.5 bg-[#F4F6F8] hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteProductConfirm)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
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
