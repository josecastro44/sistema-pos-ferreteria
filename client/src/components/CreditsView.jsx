import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Printer,
  ChevronRight,
  User,
  Calendar,
  Coins,
  History,
  X
} from 'lucide-react';

export default function CreditsView({ settings, onSelectCustomerForPos }) {
  const [credits, setCredits] = useState([]);
  const [summary, setSummary] = useState({
    total_records: 0,
    total_pending_usd: 0,
    total_pending_bs: 0,
    total_overdue_usd: 0,
    total_overdue_bs: 0
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'overdue', 'paid'
  const [searchQuery, setSearchQuery] = useState('');

  // Abono Modal State
  const [selectedCreditForAbono, setSelectedCreditForAbono] = useState(null);
  const [abonoAmountUsd, setAbonoAmountUsd] = useState('');
  const [abonoMethod, setAbonoMethod] = useState('efectivo_usd'); // 'efectivo_usd', 'pago_movil_bs', 'punto_bs', 'zelle_usd', 'binance_usd', 'efectivo_bs'
  const [abonoNotes, setAbonoNotes] = useState('');
  const [submittingAbono, setSubmittingAbono] = useState(false);

  // History Modal State
  const [selectedCreditForHistory, setSelectedCreditForHistory] = useState(null);
  const [creditHistoryAbonos, setCreditHistoryAbonos] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Last Printed Abono Receipt
  const [lastAbonoReceipt, setLastAbonoReceipt] = useState(null);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/credits?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setCredits(data.credits || []);
      setSummary(data.summary || {
        total_records: 0,
        total_pending_usd: 0,
        total_pending_bs: 0,
        total_overdue_usd: 0,
        total_overdue_bs: 0
      });
    } catch (err) {
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [statusFilter, searchQuery]);

  const handleOpenAbonoModal = (credit) => {
    setSelectedCreditForAbono(credit);
    setAbonoAmountUsd(credit.credit_balance_usd ? credit.credit_balance_usd.toString() : '');
    setAbonoMethod('efectivo_usd');
    setAbonoNotes('');
  };

  const handleOpenHistoryModal = async (credit) => {
    setSelectedCreditForHistory(credit);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/sales/${credit.id}`);
      const data = await res.json();
      const abonosRes = await fetch(`/api/credits?q=${encodeURIComponent(credit.sale_number)}`);
      const abonosData = await abonosRes.json();
      // Fetch abonos list
      const directAbonos = credit.abonos || [];
      setCreditHistoryAbonos(directAbonos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveAbono = async (e) => {
    e.preventDefault();
    if (!selectedCreditForAbono) return;
    const amount = parseFloat(abonoAmountUsd);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }
    if (amount > (selectedCreditForAbono.credit_balance_usd + 0.05)) {
      alert(`El monto ($${amount}) no puede superar el saldo pendiente ($${selectedCreditForAbono.credit_balance_usd.toFixed(2)})`);
      return;
    }

    setSubmittingAbono(true);
    try {
      const res = await fetch(`/api/credits/${selectedCreditForAbono.id}/abono`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_usd: amount,
          payment_method: abonoMethod,
          cashier_name: settings?.cashier_name || 'Admin Hebert',
          notes: abonoNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el abono');

      // Set receipt for quick print option
      setLastAbonoReceipt({
        sale: selectedCreditForAbono,
        amount_usd: amount,
        amount_bs: Math.round(amount * (settings?.tasa_interna || 960) * 100) / 100,
        payment_method: abonoMethod,
        new_balance_usd: data.new_balance_usd,
        date: new Date().toLocaleString('es-VE')
      });

      setSelectedCreditForAbono(null);
      fetchCredits();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingAbono(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* ========================================================= */}
      {/* HEADER & TOP STATS CARDS                                  */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cuentas por Cobrar & Facturas Abiertas</h2>
            <p className="text-xs text-gray-400">Control de créditos otorgados, abonos parciales y alertas de vencimiento</p>
          </div>
        </div>

        <button
          onClick={fetchCredits}
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
          title="Actualizar listado"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Pendiente */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Pendiente por Cobrar</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 mt-1">
              ${summary.total_pending_usd.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
              Bs. {summary.total_pending_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Vencido en Mora */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Total Vencido en Mora</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 mt-1">
              ${summary.total_overdue_usd.toFixed(2)}
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
              Bs. {summary.total_overdue_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Registros */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Créditos Registrados</span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {summary.total_records} facturas
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Descuento de inventario automático
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTERS & SEARCH ROW                                      */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pendientes / Por Cobrar
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Vencidas (Mora)
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-[#00a884] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pagadas
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Todas
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, cédula, teléfono o ticket..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* CREDITS TABLE                                             */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Cliente & Contacto</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4 text-right">Total Crédito</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {credits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <CreditCard className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    No se encontraron cuentas a crédito con el filtro actual.
                  </td>
                </tr>
              ) : (
                credits.map((c) => {
                  const isPaid = c.computed_status === 'paid';
                  const isOverdue = c.computed_status === 'overdue';

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Ticket # */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {c.sale_number}
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{c.customer_name}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          {c.customer_phone && <span>📞 {c.customer_phone}</span>}
                          {c.customer_id_card && <span>• ID: {c.customer_id_card}</span>}
                        </div>
                      </td>

                      {/* Emisión */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('es-VE')}
                      </td>

                      {/* Vencimiento */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {c.credit_due_date ? (
                          <div>
                            <div className="font-semibold text-gray-800">
                              {new Date(c.credit_due_date).toLocaleDateString('es-VE')}
                            </div>
                            {!isPaid && (
                              <div
                                className={`text-[10px] font-bold ${
                                  isOverdue
                                    ? 'text-rose-600'
                                    : c.days_remaining <= 3
                                    ? 'text-amber-600'
                                    : 'text-gray-400'
                                }`}
                              >
                                {isOverdue
                                  ? `Vencida hace ${Math.abs(c.days_remaining)} días`
                                  : c.days_remaining === 0
                                  ? 'Vence hoy'
                                  : `Quedan ${c.days_remaining} días`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Sin fecha límite</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="font-bold text-gray-900">${c.total_usd_tienda.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">
                          Bs. {c.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className={`font-black text-sm ${isPaid ? 'text-gray-400 line-through' : isOverdue ? 'text-rose-600' : 'text-amber-600'}`}>
                          ${(c.credit_balance_usd || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Bs. {Math.round((c.credit_balance_usd || 0) * (c.tasa_interna || 960)).toLocaleString('es-VE')}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle className="w-3 h-3" />
                            Pagado
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Vencida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="w-3 h-3" />
                            Por Cobrar
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenAbonoModal(c)}
                              className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title="Registrar Abono o Pago"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/api/sales/${c.id}`, '_blank')}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Ver detalles de la venta"
                          >
                            <ChevronRight className="w-4 h-4" />
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

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR ABONO                                    */}
      {/* ========================================================= */}
      {selectedCreditForAbono && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Registrar Abono a Crédito</h3>
                <p className="text-xs text-white/80">
                  {selectedCreditForAbono.sale_number} • {selectedCreditForAbono.customer_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCreditForAbono(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAbono} className="p-5 space-y-4 text-xs">
              {/* Balance Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700">Saldo Pendiente Actual:</span>
                  <div className="text-xl font-black font-mono text-amber-800">
                    ${selectedCreditForAbono.credit_balance_usd.toFixed(2)}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-amber-900">
                  <div>Bs. {Math.round(selectedCreditForAbono.credit_balance_usd * (settings?.tasa_interna || 960)).toLocaleString('es-VE')}</div>
                  <div className="text-[10px] text-amber-700">Tasa: Bs. {settings?.tasa_interna || 960}</div>
                </div>
              </div>

              {/* Monto del Abono */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Monto a Abonar en Dólares ($):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedCreditForAbono.credit_balance_usd}
                    value={abonoAmountUsd}
                    onChange={(e) => setAbonoAmountUsd(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono text-base font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                  />
                </div>
                {abonoAmountUsd && (
                  <div className="mt-1 text-[11px] font-mono text-gray-500 text-right">
                    Equivalente en Bolívares: <strong className="text-gray-800">Bs. {Math.round(parseFloat(abonoAmountUsd || 0) * (settings?.tasa_interna || 960)).toLocaleString('es-VE')}</strong>
                  </div>
                )}
              </div>

              {/* Canal de Pago */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Método de Pago con el que Abona:
                </label>
                <select
                  value={abonoMethod}
                  onChange={(e) => setAbonoMethod(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                >
                  <option value="efectivo_usd">💵 Efectivo Dólares ($ Billetes)</option>
                  <option value="pago_movil_bs">📱 Pago Móvil (Bolívares)</option>
                  <option value="punto_bs">💳 Punto de Venta (Tarjeta Débito)</option>
                  <option value="zelle_usd">🏦 Zelle (Dólares)</option>
                  <option value="binance_usd">🟡 Binance / USDT</option>
                  <option value="efectivo_bs">🪙 Efectivo Bolívares (Bs Físico)</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Notas o Referencia bancaria (Opcional):
                </label>
                <input
                  type="text"
                  value={abonoNotes}
                  onChange={(e) => setAbonoNotes(e.target.value)}
                  placeholder="Ej. Ref #4582 / Entregó billete de $20..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCreditForAbono(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAbono}
                  className="flex-1 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingAbono ? 'Guardando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TICKET DE ABONO IMPRESO / COMPROBANTE                    */}
      {/* ========================================================= */}
      {lastAbonoReceipt && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-xs space-y-3">
            <div className="text-center border-b border-gray-200 pb-2">
              <CheckCircle className="w-8 h-8 text-[#00a884] mx-auto mb-1" />
              <h4 className="font-extrabold text-sm text-gray-900">¡Abono Registrado con Éxito!</h4>
              <p className="text-[10px] text-gray-400">{lastAbonoReceipt.date}</p>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Factura:</span>
                <span className="font-bold text-gray-900">{lastAbonoReceipt.sale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-bold text-gray-900">{lastAbonoReceipt.sale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método:</span>
                <span className="capitalize">{lastAbonoReceipt.payment_method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dashed border-gray-200">
                <span className="text-gray-500 font-bold">Monto Abonado:</span>
                <span className="font-black text-[#00a884] text-xs">${lastAbonoReceipt.amount_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nuevo Saldo:</span>
                <span className="font-black text-amber-700">${lastAbonoReceipt.new_balance_usd.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setLastAbonoReceipt(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
