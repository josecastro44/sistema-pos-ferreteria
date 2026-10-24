import React, { useState } from 'react';
import {
  Pencil,
  Search,
  Box,
  Layers,
  DollarSign,
  Tag,
  Check,
  AlertCircle
} from 'lucide-react';

export default function EditProductView({
  products = [],
  categories = [],
  onEditProduct,
  onAdjustStock,
  settings
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todos');

  const getProductImage = (prod) => {
    if (prod.image_url && prod.image_url.trim()) return prod.image_url;
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
  };

  const filtered = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.synonyms && p.synonyms.toLowerCase().includes(term))
    );
    const matchCat = selectedCat === 'Todos' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Editor Rápido de Productos</h2>
            <p className="text-xs text-gray-400">Busca cualquier artículo por nombre, medida o código para modificar sus precios o foto</p>
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
            placeholder="Buscar para editar ('1/2', '3/4', nombre)..."
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
            <p className="text-xs text-gray-400">Prueba con otro término o código</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filtered.map(prod => (
              <div
                key={prod.id}
                className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-xs bg-gray-50/40 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex gap-3 items-start">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                      <img
                        src={getProductImage(prod)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                        <span>{prod.code}</span>
                        <span className="font-sans font-bold uppercase">{prod.category}</span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 line-clamp-2 mt-0.5 leading-snug" title={prod.name}>
                        {prod.name}
                      </h4>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          prod.stock <= prod.min_stock
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          Stock: {prod.stock} {prod.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing info */}
                  <div className="p-2.5 rounded-xl bg-white border border-gray-100 mt-3 space-y-1 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Precio Bolívares:</span>
                      <span className="font-mono font-black text-gray-900 text-sm">
                        Bs. {Number(prod.price_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-gray-500 pt-0.5 border-t border-gray-50">
                      <span>USD Tienda: <b className="text-gray-800">${Number(prod.price_usd_tienda).toFixed(2)}</b></span>
                      <span>BCV: <b className="text-[#00a884]">${Number(prod.price_usd_bcv).toFixed(2)}</b></span>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => onAdjustStock(prod)}
                    className="py-1.5 px-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Ajustar cantidad de stock"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Stock</span>
                  </button>

                  <button
                    onClick={() => onEditProduct(prod)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modificar Datos</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
