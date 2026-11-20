import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  CheckCircle,
  Clock,
  Download,
  X
} from 'lucide-react';

export default function SalesView({
  salesList = [],
  fetchSales,
  settings = {},
  onInspectSale,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todas'); // 'Todas', 'Contado', 'Credito'
  const [ticketPreview, setTicketPreview] = useState(null);

  const safeSales = useMemo(() => {
    return Array.isArray(salesList) ? salesList : [];
  }, [salesList]);

  const tasaTienda = Number(settings?.tasa_interna || 960);
  const tasaBcv = Number(settings?.tasa_bcv || 866.56);

  const formatUsd = (val) => `$${Number(val || 0).toFixed(2)}`;
  const formatBs = (val) => `Bs. ${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return `${d.toLocaleDateString('es-VE')} ${d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return String(dateStr);
    }
  };

  const filteredSales = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return safeSales.filter(s => {
      if (!s) return false;
      const num = String(s.sale_number || s.id || '').toLowerCase();
      const client = String(s.customer_name || '').toLowerCase();
      const method = String(s.notes || s.payment_method || '').toLowerCase();

      const matchesSearch = !q || num.includes(q) || client.includes(q) || method.includes(q);

      if (typeFilter === 'Credito') {
        return matchesSearch && Boolean(s.is_credit);
      }
      if (typeFilter === 'Contado') {
        return matchesSearch && !s.is_credit;
      }
      return matchesSearch;
    });
  }, [safeSales, searchTerm, typeFilter]);

  const handlePrintClick = (sale) => {
    if (onInspectSale) {
      onInspectSale(sale);
    } else {
      setTicketPreview(sale);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1780px] mx-auto pb-10">
      {/* Header Card — Estilo Deep Teal Ferretería Hebert */}
      <div className="card-surface p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#F2F7F6] text-[#074E4A] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-bold text-[19px] text-[#111827]">
                Historial de Facturación
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#F2F7F6] text-[#074E4A] font-mono-num text-[11px] font-semibold">
                {safeSales.length} ventas registradas
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-400 mt-0.5">
              Registro de operaciones con reimpresión de comprobante 58mm y auditoría
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ticket, cliente o forma de pago..."
              className="w-full bg-[#F6F8FA] focus:bg-white text-xs text-[#111827] placeholder:text-slate-400 pl-9 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#074E4A]/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              if (fetchSales) fetchSales();
              if (showToast) showToast('Historial de ventas actualizado');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#F4F6F8] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#074E4A]" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['Todas', 'Contado', 'Credito'].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setTypeFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              typeFilter === tab
                ? 'bg-[#074E4A] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#111827] border border-slate-100 hover:border-slate-200'
            }`}
          >
            {tab === 'Todas' ? 'Todas las Ventas' : tab === 'Contado' ? 'Ventas de Contado' : 'Ventas a Crédito'}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card-surface overflow-hidden border border-slate-100/90 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#FAFBFC] text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                <th className="py-3.5 pl-6 pr-3">Ticket #</th>
                <th className="py-3.5 px-3">Fecha y Hora</th>
                <th className="py-3.5 px-3">Cliente</th>
                <th className="py-3.5 px-3">Forma de Pago</th>
                <th className="py-3.5 px-3 text-right">USD Tienda</th>
                <th className="py-3.5 px-3 text-right">Total Bolívares</th>
                <th className="py-3.5 px-3 text-right">USD BCV</th>
                <th className="py-3.5 pl-3 pr-6 text-center">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-display font-semibold text-[#111827] mb-1">
                      No se encontraron ventas
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchTerm ? 'Prueba con otro término de búsqueda' : 'Las operaciones facturadas en el Punto de Venta aparecerán aquí.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const saleNumber = sale.sale_number || `TICK-${String(sale.id || 0).padStart(5, '0')}`;
                  const totalUsd = Number(sale.total_usd_tienda ?? sale.total_usd ?? 0);
                  const totalBs = Number(sale.total_bs ?? (totalUsd * tasaTienda));
                  const totalBcv = Number(sale.total_usd_bcv ?? (tasaBcv > 0 ? totalBs / tasaBcv : 0));
                  const isCredit = Boolean(sale.is_credit);
                  const isCashea = Boolean(sale.is_cashea);

                  return (
                    <tr key={sale.id} className="hover:bg-[#F7FAF9] transition-colors">
                      <td className="py-4 pl-6 pr-3 font-mono-num font-bold text-[#074E4A] whitespace-nowrap">
                        {saleNumber}
                      </td>

                      <td className="py-4 px-3 text-slate-500 text-xs font-mono-num whitespace-nowrap">
                        {formatDate(sale.created_at)}
                      </td>

                      <td className="py-4 px-3 font-semibold text-[#111827] max-w-[200px] truncate">
                        {sale.customer_name || 'Cliente Mostrador'}
                      </td>

                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                            isCredit
                              ? 'bg-amber-50 text-amber-700'
                              : isCashea
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-[#E6F7F5] text-[#074E4A]'
                          }`}
                        >
                          {isCredit
                            ? 'Venta a Crédito'
                            : isCashea
                              ? 'Cashea (+15%)'
                              : (sale.notes || sale.payment_method || 'Efectivo')}
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right font-mono-num font-bold text-[#111827] whitespace-nowrap">
                        {formatUsd(totalUsd)}
                      </td>

                      <td className="py-4 px-3 text-right font-mono-num font-semibold text-[#074E4A] whitespace-nowrap">
                        {formatBs(totalBs)}
                      </td>

                      <td className="py-4 px-3 text-right font-mono-num font-semibold text-indigo-600 whitespace-nowrap">
                        {formatUsd(totalBcv)}
                      </td>

                      <td className="py-4 pl-3 pr-6 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handlePrintClick(sale)}
                          className="px-3 py-1.5 bg-[#074E4A] hover:bg-[#053E3B] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Reimprimir ticket de venta 58mm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>58mm</span>
                        </button>
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
  );
}
