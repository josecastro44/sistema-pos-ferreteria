import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Coins,
  Smartphone,
  CreditCard,
  Printer,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown
} from 'lucide-react';

export default function FinancesView({ settings, currentUser }) {
  // Preset date filter: 'today', 'yesterday', 'this_week', 'this_month', 'custom'
  const [datePreset, setDatePreset] = useState('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const [financesData, setFinancesData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cierre de Caja Inputs
  const [initialCashUsd, setInitialCashUsd] = useState('0');
  const [initialCashBs, setInitialCashBs] = useState('0');
  const [actualCashUsd, setActualCashUsd] = useState('');
  const [actualCashBs, setActualCashBs] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingSaved, setClosingSaved] = useState(false);
  const [submittingClose, setSubmittingClose] = useState(false);

  // Set date based on preset
  const handleSelectPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'this_week') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    }
  };

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        q: searchQuery,
        method: methodFilter
      });
      const res = await fetch(`/api/finances?${params.toString()}`);
      const data = await res.json();
      setFinancesData(data);
    } catch (err) {
      console.error('Error fetching finances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, [startDate, endDate, searchQuery, methodFilter]);

  const handlePrintZReport = () => {
    window.print();
  };

  const handleSaveDailyClose = async () => {
    if (!financesData) return;
    setSubmittingClose(true);
    try {
      const res = await fetch('/api/cash-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_date: endDate,
          cashier_name: currentUser?.name || 'Admin Hebert',
          initial_cash_usd: parseFloat(initialCashUsd) || 0,
          initial_cash_bs: parseFloat(initialCashBs) || 0,
          system_efectivo_usd: financesData.methods.efectivo_usd || 0,
          system_zelle_usd: financesData.methods.zelle_usd || 0,
          system_binance_usd: financesData.methods.binance_usd || 0,
          system_efectivo_bs: financesData.methods.efectivo_bs || 0,
          system_pago_movil_bs: financesData.methods.pago_movil_bs || 0,
          system_punto_bs: financesData.methods.punto_bs || 0,
          system_cashea_usd: (financesData.methods.cashea_initial_usd || 0) + (financesData.methods.cashea_financed_usd || 0),
          system_credit_usd: financesData.methods.credito_total_usd || 0,
          total_system_usd: financesData.total_sales_usd || 0,
          total_system_bs: financesData.total_sales_bs || 0,
          actual_cash_usd: parseFloat(actualCashUsd) || 0,
          actual_cash_bs: parseFloat(actualCashBs) || 0,
          notes: closingNotes
        })
      });
      if (!res.ok) throw new Error('Error al guardar el cierre');
      setClosingSaved(true);
      setTimeout(() => setClosingSaved(false), 4000);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingClose(false);
    }
  };

  // Difference calculations for cash register
  const expectedEfectivoUsd = (parseFloat(initialCashUsd) || 0) + (financesData?.methods?.efectivo_usd || 0);
  const countedEfectivoUsd = actualCashUsd !== '' ? parseFloat(actualCashUsd) : expectedEfectivoUsd;
  const diffUsd = Math.round((countedEfectivoUsd - expectedEfectivoUsd) * 100) / 100;

  const expectedEfectivoBs = (parseFloat(initialCashBs) || 0) + (financesData?.methods?.efectivo_bs || 0);
  const countedEfectivoBs = actualCashBs !== '' ? parseFloat(actualCashBs) : expectedEfectivoBs;
  const diffBs = Math.round((countedEfectivoBs - expectedEfectivoBs) * 100) / 100;

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* ========================================================= */}
      {/* HEADER BAR                                                */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Finanzas, Ganancias & Cierre de Caja</h2>
            <p className="text-xs text-gray-400">Auditoría en tiempo real de ingresos, costos de inventario, ganancias y arqueo de turnos</p>
          </div>
        </div>

        {/* Quick Print Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchFinances}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrintZReport}
            className="bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cierre Z</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADVANCED FILTERS ROW                                      */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl font-semibold">
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'this_week', label: 'Esta Semana' },
              { id: 'this_month', label: 'Este Mes' },
              { id: 'custom', label: 'Personalizado' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-gray-400 font-medium">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setStartDate(e.target.value);
                }}
                className="bg-transparent font-medium text-gray-800 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-gray-400 font-medium">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setEndDate(e.target.value);
                }}
                className="bg-transparent font-medium text-gray-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Search & Method Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por # ticket, cliente o cajero..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Método de Cobro:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none"
            >
              <option value="all">Todos los Métodos</option>
              <option value="efectivo_usd">💵 Efectivo Dólares ($ Billetes)</option>
              <option value="zelle">🏦 Zelle (Dólares)</option>
              <option value="binance">🟡 Binance / USDT</option>
              <option value="pago móvil">📱 Pago Móvil (Bs)</option>
              <option value="punto">💳 Punto de Venta (Bs)</option>
              <option value="cashea">🟣 Cashea</option>
              <option value="credito">🤝 A Crédito (Factura Abierta)</option>
            </select>
          </div>
        </div>
      </div>

      {financesData && (
        <>
          {/* ========================================================= */}
          {/* 4 MAIN KPI CARDS                                         */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Ventas USD */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Ventas ($ USD)</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-gray-900 mt-1">
                  ${financesData.total_sales_usd.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#00a884] font-mono mt-0.5 font-bold">
                  Bs. {financesData.total_sales_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Ganancia Bruta Real */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Ganancia Bruta Real</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#00a884] mt-1">
                  ${financesData.gross_profit_usd.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Bs. {financesData.gross_profit_bs.toLocaleString('es-VE')}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            {/* Costo Mercancía Vendida */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Costo Mercancía Vendida</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-gray-700 mt-1">
                  ${financesData.total_cost_usd.toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">Costo base de reposición</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            {/* Margen de Rentabilidad */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Margen de Rentabilidad</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 mt-1">
                  {financesData.profit_margin_percent}%
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{financesData.total_tickets} operaciones</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PAYMENT CHANNELS (DIVISAS 3 EN 1, CASHEA, ETC.)           */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Payment Method Breakdown (8 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
                Desglose por Canales de Cobro (Divisas 3 en 1, Bolívares y Cashea)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Efectivo Dólares */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      💵
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Efectivo Dólares ($)</div>
                      <div className="text-[10px] text-gray-400">Billetes físicos en gaveta</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-emerald-700 text-sm">
                    ${financesData.methods.efectivo_usd.toFixed(2)}
                  </div>
                </div>

                {/* 2. Zelle */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                      🏦
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Zelle (Dólares)</div>
                      <div className="text-[10px] text-gray-400">Transferencias EE.UU.</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-purple-700 text-sm">
                    ${financesData.methods.zelle_usd.toFixed(2)}
                  </div>
                </div>

                {/* 3. Binance */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      🟡
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Binance / USDT</div>
                      <div className="text-[10px] text-gray-400">Criptomonedas / P2P</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-amber-700 text-sm">
                    ${financesData.methods.binance_usd.toFixed(2)}
                  </div>
                </div>

                {/* 4. Cashea */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-200 text-purple-900 flex items-center justify-center font-bold">
                      🟣
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Cashea (Precio 2)</div>
                      <div className="text-[10px] text-gray-400">Inicial + Financiado</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-purple-800 text-sm">
                    ${(financesData.methods.cashea_initial_usd + financesData.methods.cashea_financed_usd).toFixed(2)}
                  </div>
                </div>

                {/* 5. Pago Móvil Bs */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Pago Móvil (Bs)</div>
                      <div className="text-[10px] text-gray-400">Transferencias inmediatas</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-gray-900 text-sm">
                    Bs. {financesData.methods.pago_movil_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* 6. Punto de Venta Bs */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Punto de Venta (Bs)</div>
                      <div className="text-[10px] text-gray-400">Tarjetas de Débito</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-gray-900 text-sm">
                    Bs. {financesData.methods.punto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* 7. Efectivo Bolívares */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Efectivo Bolívares</div>
                      <div className="text-[10px] text-gray-400">Billetes en gaveta</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-gray-900 text-sm">
                    Bs. {financesData.methods.efectivo_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* 8. Créditos Otorgados */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                      🤝
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Ventas a Crédito</div>
                      <div className="text-[10px] text-gray-400">Facturas abiertas</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-black text-indigo-700 text-sm">
                    ${financesData.methods.credito_total_usd.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* CIERRE DE CAJA DIARIO (ARQUEO & CUADRE DE TURNO)           */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#00a884]" />
                  <span>Cierre de Caja Diario (Arqueo)</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                  Cajero: {currentUser?.name || 'Admin'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Fondos Iniciales */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-600 font-semibold block mb-1">
                      Fondo Inicial ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialCashUsd}
                      onChange={(e) => setInitialCashUsd(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2 bg-gray-50 border border-gray-200/80 rounded-xl font-mono text-gray-900 text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-semibold block mb-1">
                      Fondo Inicial (Bs):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialCashBs}
                      onChange={(e) => setInitialCashBs(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2 bg-gray-50 border border-gray-200/80 rounded-xl font-mono text-gray-900 text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Arqueo Ciego / Conteo Real */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  <div>
                    <label className="text-gray-700 font-bold block mb-1">
                      Billetes $ Contados en Caja:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actualCashUsd}
                      onChange={(e) => setActualCashUsd(e.target.value)}
                      placeholder={expectedEfectivoUsd.toFixed(2)}
                      className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono text-gray-900 font-bold text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-bold block mb-1">
                      Billetes Bs Contados en Caja:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actualCashBs}
                      onChange={(e) => setActualCashBs(e.target.value)}
                      placeholder={expectedEfectivoBs.toFixed(2)}
                      className="w-full p-2 bg-teal-50/50 border border-teal-200 rounded-xl font-mono text-gray-900 font-bold text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Cuadre & Diferencias */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Efectivo $ Esperado:</span>
                    <span className="font-bold">${expectedEfectivoUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diferencia USD:</span>
                    <span className={`font-black ${diffUsd === 0 ? 'text-[#00a884]' : diffUsd > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {diffUsd === 0 ? '✓ Cuadre Exacto' : diffUsd > 0 ? `+${diffUsd.toFixed(2)} Sobrante` : `${diffUsd.toFixed(2)} Faltante`}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between text-gray-600">
                    <span>Efectivo Bs Esperado:</span>
                    <span className="font-bold">Bs. {expectedEfectivoBs.toLocaleString('es-VE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diferencia Bs:</span>
                    <span className={`font-black ${diffBs === 0 ? 'text-[#00a884]' : diffBs > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {diffBs === 0 ? '✓ Cuadre Exacto' : diffBs > 0 ? `+Bs. ${diffBs.toLocaleString('es-VE')} Sobrante` : `Bs. ${diffBs.toLocaleString('es-VE')} Faltante`}
                    </span>
                  </div>
                </div>

                {/* Botón Guardar Cierre */}
                <button
                  type="button"
                  onClick={handleSaveDailyClose}
                  disabled={submittingClose}
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{submittingClose ? 'Guardando Cierre...' : 'Guardar Cierre de Caja Definitivo'}</span>
                </button>

                {closingSaved && (
                  <div className="p-2.5 bg-emerald-50 text-[#00a884] border border-emerald-200 rounded-xl text-center text-xs font-bold animate-in fade-in">
                    ✓ Cierre de Caja guardado con éxito en el historial
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DETAILED SALES AUDIT TABLE (COSTO, VENTA, GANANCIA)        */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Auditoría Detallada de Operaciones</h3>
                <p className="text-[11px] text-gray-400">Desglose de cada venta con costo de inventario y ganancia calculada</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                {financesData.sales?.length || 0} tickets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50/75 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4 text-right">Venta ($)</th>
                    <th className="py-3 px-4 text-right">Costo ($)</th>
                    <th className="py-3 px-4 text-right">Ganancia ($)</th>
                    <th className="py-3 px-4 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {financesData.sales?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-gray-400">
                        No hay ventas registradas en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    financesData.sales?.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-900">
                          {s.sale_number}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400 whitespace-nowrap">
                          {new Date(s.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-900">
                          {s.customer_name}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 capitalize">
                            {s.is_cashea ? '🟣 Cashea' : s.is_credit ? '🤝 Crédito' : s.payment_method?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                          ${s.total_usd_tienda.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-gray-500">
                          ${s.sale_cost_usd?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#00a884]">
                          +${s.sale_profit_usd?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[11px] font-semibold text-indigo-600">
                          {s.profit_margin_percent}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* THERMAL PRINTER CIERRE Z FORMAT (CLEAN, NO BCV)            */}
      {/* ========================================================= */}
      <div id="printable-receipt" className="hidden">
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{settings.store_name}</div>
          <div style={{ fontSize: '10px' }}>RIF: {settings.rif}</div>
          <div style={{ fontSize: '10px' }}>{settings.phone}</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>CIERRE FINANCIERO (Z)</div>
          <div style={{ fontSize: '10px' }}>Período: {startDate} {startDate !== endDate ? `al ${endDate}` : ''}</div>
          <div style={{ fontSize: '10px' }}>Cajero: {currentUser?.name || 'Admin'}</div>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
        {financesData && (
          <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
            <div>Total Tickets: {financesData.total_tickets}</div>
            <div>Total Ventas USD: ${financesData.total_sales_usd.toFixed(2)}</div>
            <div>Total Bolívares: Bs. {financesData.total_sales_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
            <div>💵 Efectivo USD: ${financesData.methods.efectivo_usd.toFixed(2)}</div>
            <div>🏦 Zelle USD: ${financesData.methods.zelle_usd.toFixed(2)}</div>
            <div>🟡 Binance USDT: ${financesData.methods.binance_usd.toFixed(2)}</div>
            <div>🟣 Cashea: ${(financesData.methods.cashea_initial_usd + financesData.methods.cashea_financed_usd).toFixed(2)}</div>
            <div>📱 Pago Móvil: Bs. {financesData.methods.pago_movil_bs.toLocaleString('es-VE')}</div>
            <div>💳 Punto Venta: Bs. {financesData.methods.punto_bs.toLocaleString('es-VE')}</div>
            <div>🪙 Efectivo Bs: Bs. {financesData.methods.efectivo_bs.toLocaleString('es-VE')}</div>
            <div>🤝 Ventas a Crédito: ${financesData.methods.credito_total_usd.toFixed(2)}</div>
            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
            <div>Costo Mercancía: ${financesData.total_cost_usd.toFixed(2)}</div>
            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Ganancia Real: ${financesData.gross_profit_usd.toFixed(2)}</div>
            <div style={{ fontWeight: 'bold' }}>Margen: {financesData.profit_margin_percent}%</div>
          </div>
        )}
        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '6px' }}>
          Reporte emitido por Sistema POS
        </div>
      </div>
    </div>
  );
}
