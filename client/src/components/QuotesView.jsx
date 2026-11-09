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
  Trash2,
  DollarSign,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';

export default function QuotesView({ settings, onLoadQuoteToCart }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);

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

  const handlePrintQuote = (quote) => {
    setSelectedQuote(quote);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleLoadToCart = (quote) => {
    if (onLoadQuoteToCart) {
      onLoadQuoteToCart(quote.items, quote.customer_name);
    }
  };

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* ========================================================= */}
      {/* HEADER BAR                                                */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Presupuestos & Cotizaciones</h2>
            <p className="text-xs text-gray-400">Genera cotizaciones sin descontar stock y cárgalas al carrito en 1 clic</p>
          </div>
        </div>

        <button
          onClick={fetchQuotes}
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
          title="Actualizar presupuestos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Quotes List Table */}
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
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No hay presupuestos guardados aún. Genera uno desde el Punto de Venta.
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
                        <div className="text-[10px] text-gray-400">📞 {q.customer_phone}</div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedQuote(q)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePrintQuote(q)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Imprimir Cotización"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Imprimir</span>
                        </button>

                        <button
                          onClick={() => handleLoadToCart(q)}
                          className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title="Cargar estos artículos al carrito del Punto de Venta"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Cargar a Caja</span>
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

      {/* ========================================================= */}
      {/* MODAL: VER DETALLE DE COTIZACIÓN                         */}
      {/* ========================================================= */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Presupuesto {selectedQuote.quote_number}</h3>
                <p className="text-xs text-indigo-100">{selectedQuote.customer_name}</p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {selectedQuote.items?.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{it.product_name}</div>
                      <div className="text-[10px] text-gray-400">
                        {it.quantity} {it.unit} × ${it.price_usd?.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold">
                      <div className="text-gray-900">${it.subtotal_usd?.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">Bs. {it.subtotal_bs?.toLocaleString('es-VE')}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Box */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1 font-mono text-xs">
                <div className="flex justify-between font-bold text-gray-900 text-sm">
                  <span>Total en Dólares ($):</span>
                  <span>${selectedQuote.total_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#00a884]">
                  <span>Total en Bolívares (Bs.):</span>
                  <span>Bs. {selectedQuote.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                  <span>Tasa Aplicada:</span>
                  <span>Bs. {selectedQuote.tasa_interna?.toFixed(2)}</span>
                </div>
              </div>

              {/* Commercial disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
                <strong>Nota Comercial:</strong> Los precios en dólares se mantienen. Los montos en bolívares están sujetos a la tasa de cambio vigente al momento de concretar la compra.
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5">
              <button
                onClick={() => setSelectedQuote(null)}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => handlePrintQuote(selectedQuote)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => {
                  handleLoadToCart(selectedQuote);
                  setSelectedQuote(null);
                }}
                className="flex-1 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cargar a Caja</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
