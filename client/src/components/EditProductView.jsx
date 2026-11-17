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
  Building
} from 'lucide-react';

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
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  const tasaBcvVal = Number(settings?.tasa_bcv || 883.40);

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
    <div className="space-y-4 max-w-[1720px] mx-auto pb-8">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Editor & Gestión de Catálogo</h2>
            <p className="text-xs text-gray-400">
              Modifica precios, activa o desactiva productos del POS, gestiona códigos de proveedor y elimina artículos
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-72 sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, proveedor o nombre..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition-all border text-xs cursor-pointer ${
              selectedCat === cat
                ? 'bg-white border-gray-300 text-[#00a884] font-semibold shadow-xs ring-1 ring-[#00a884]/10'
                : 'bg-white border-gray-200/80 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid to Edit */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Box className="w-10 h-10 mx-auto stroke-1 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">No se encontraron productos</p>
            <p className="text-xs text-gray-400">Prueba con otro término de búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filtered.map(prod => {
              const isActive = prod.is_active !== 0;
              const displayPriceBs = prod.price_bs || 0;
              const displayPriceUsdBcv = prod.price_usd_bcv ? Number(prod.price_usd_bcv) : (displayPriceBs / tasaBcvVal);

              return (
                <div
                  key={prod.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    !isActive
                      ? 'bg-gray-50/90 border-gray-200 opacity-80'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Row: Product Card */}
                    <div className="flex gap-3 items-start">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0 relative">
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                        {!isActive && (
                          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center text-white text-[9px] font-bold">
                            PAUSADO
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span>{prod.code}</span>
                          <span className="font-sans font-bold uppercase">{prod.category}</span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 line-clamp-2 mt-0.5 leading-snug" title={prod.name}>
                          {prod.name}
                        </h4>

                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            prod.stock <= prod.min_stock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            Stock: {prod.stock} {prod.unit}
                          </span>

                          {/* Active / Inactive Badge */}
                          {isActive ? (
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              🟢 Activo en POS
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              ⏸ Oculto en POS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Provider info if exists */}
                    {(prod.provider_code || prod.provider_notes) && (
                      <div className="mt-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-600 flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {prod.provider_code && <strong className="text-gray-800">Cat: {prod.provider_code} </strong>}
                          {prod.provider_notes && <span>• {prod.provider_notes}</span>}
                        </span>
                      </div>
                    )}

                    {/* Pricing info (Tienda USD, Bs., USD BCV y Cashea) */}
                    <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 mt-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Precio Tienda ($):</span>
                        <span className="font-mono font-black text-gray-900 text-sm">
                          ${Number(prod.price_usd_tienda).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono pt-1 border-t border-gray-100">
                        <span className="text-gray-600">Bs. Tienda:</span>
                        <b className="text-emerald-700 font-bold">Bs. {Number(displayPriceBs).toLocaleString('es-VE')}</b>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-indigo-600 font-medium">USD BCV ($):</span>
                        <b className="text-indigo-700 font-bold">${displayPriceUsdBcv.toFixed(2)}</b>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-purple-700 pt-0.5 border-t border-gray-100">
                        <span>Cashea:</span>
                        <b>${Number(prod.price_cashea).toFixed(2)}</b>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 flex items-center gap-1.5">
                    {/* Toggle Active Switch Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(prod)}
                      disabled={togglingId === prod.id}
                      className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-gray-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-gray-600'
                          : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                      }`}
                      title={isActive ? 'Desactivar / Ocultar del Punto de Venta' : 'Activar para vender en Punto de Venta'}
                    >
                      {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                    </button>

                    {/* Stock Adjustment */}
                    <button
                      type="button"
                      onClick={() => onAdjustStock(prod)}
                      className="py-1.5 px-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Ajustar cantidad de stock"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Stock</span>
                    </button>

                    {/* Edit Product Data */}
                    <button
                      type="button"
                      onClick={() => onEditProduct(prod)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {/* Delete Product Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteProductConfirm(prod)}
                      className="p-1.5 rounded-xl border border-rose-100 bg-white hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                      title="Eliminar producto permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">¿Eliminar Producto?</h3>
            <p className="text-xs text-gray-500">
              ¿Estás seguro de eliminar <strong className="text-gray-900">{deleteProductConfirm.name}</strong> ({deleteProductConfirm.code})? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteProductConfirm)}
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