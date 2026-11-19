import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Scale,
  CheckCircle2,
  Lock,
  Printer,
  MessageCircle,
  Search,
  Banknote,
  Building2,
  Coins,
  Smartphone,
  CreditCard,
  Wallet,
  Calendar,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const PAYMENT_CHANNELS = [
  {
    key: 'efectivo_usd',
    title: 'Efectivo USD',
    subtitle: 'Billetes en gaveta',
    currency: 'USD',
    accent: 'bg-emerald-50 text-[#074E4A]',
    Icon: Banknote,
  },
  {
    key: 'zelle_usd',
    title: 'Zelle',
    subtitle: 'Transferencias USD',
    currency: 'USD',
    accent: 'bg-indigo-50 text-indigo-600',
    Icon: Building2,
  },
  {
    key: 'binance_usd',
    title: 'Binance / USDT',
    subtitle: 'Cripto / P2P',
    currency: 'USD',
    accent: 'bg-amber-50 text-amber-600',
    Icon: Coins,
  },
  {
    key: 'cashea',
    title: 'Cashea (+15%)',
    subtitle: 'Inicial + Financiado',
    currency: 'USD',
    accent: 'bg-violet-50 text-violet-600',
    Icon: CheckCircle2,
  },
  {
    key: 'pago_movil_bs',
    title: 'Pago Móvil',
    subtitle: 'Bs. · Inmediato',
    currency: 'BS',
    accent: 'bg-sky-50 text-sky-600',
    Icon: Smartphone,
  },
  {
    key: 'punto_bs',
    title: 'Punto de Venta',
    subtitle: 'Bs. · Débito',
    currency: 'BS',
    accent: 'bg-cyan-50 text-cyan-700',
    Icon: CreditCard,
  },
  {
    key: 'efectivo_bs',
    title: 'Efectivo Bs.',
    subtitle: 'Billetes en gaveta',
    currency: 'BS',
    accent: 'bg-emerald-50 text-[#074E4A]',
    Icon: Banknote,
  },
  {
    key: 'credito_usd',
    title: 'Cuentas por Cobrar',
    subtitle: 'Créditos otorgados',
    currency: 'USD',
    accent: 'bg-rose-50 text-rose-600',
    Icon: Wallet,
  },
];

export default function FinancesView({ settings = {}, currentUser, showToast }) {
  const [period, setPeriod] = useState('Hoy');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const [financesData, setFinancesData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cash drawer reconciliation inputs
  const [initialFundUsd, setInitialFundUsd] = useState('0');
  const [initialFundBs, setInitialFundBs] = useState('0');
  const [countedUsd, setCountedUsd] = useState('');
  const [countedBs, setCountedBs] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);

  const tasaTienda = Number(settings.tasa_interna || 960);
  const tasaBcv = Number(settings.tasa_bcv || 866.56);

  const formatUsd = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatBs = (val) => `Bs. ${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSelectPeriod = (tab) => {
    setPeriod(tab);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (tab === 'Hoy') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (tab === 'Ayer') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (tab === 'Esta Semana') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (tab === 'Este Mes') {
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
        method: methodFilter === 'ALL' ? 'all' : methodFilter
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

  // Derived Values
  const totalSalesUsd = financesData?.total_sales_usd || 0;
  const totalSalesBs = financesData?.total_sales_bs || (totalSalesUsd * tasaTienda);
  const grossProfitUsd = financesData?.gross_profit_usd || 0;
  const grossProfitBs = financesData?.gross_profit_bs || (grossProfitUsd * tasaTienda);
  const totalCostUsd = financesData?.total_cost_usd || Math.max(0, totalSalesUsd - grossProfitUsd);
  const marginPercent = totalSalesUsd > 0 ? (grossProfitUsd / totalSalesUsd) * 100 : 0;
  const operationsCount = financesData?.sales_count || 0;

  // Expected Cash Drawer Calculations
  const efectivoUsdEsperado = financesData?.methods?.efectivo_usd || 0;
  const efectivoBsEsperado = financesData?.methods?.efectivo_bs || 0;

  const parsedInitUsd = Math.max(0, parseFloat(initialFundUsd) || 0);
  const parsedInitBs = Math.max(0, parseFloat(initialFundBs) || 0);

  const totalEsperadoUsd = parsedInitUsd + efectivoUsdEsperado;
  const totalEsperadoBs = parsedInitBs + efectivoBsEsperado;

  const parsedCountedUsd = countedUsd.trim() === '' ? totalEsperadoUsd : (parseFloat(countedUsd) || 0);
  const parsedCountedBs = countedBs.trim() === '' ? totalEsperadoBs : (parseFloat(countedBs) || 0);

  const diffUsd = parsedCountedUsd - totalEsperadoUsd;
  const diffBs = parsedCountedBs - totalEsperadoBs;

  // WhatsApp Report Generation
  const buildWhatsAppReport = () => {
    const ownerName = settings.store_owner || 'Hebert';
    const storeName = settings.store_name || 'Ferretería Hebert';
    const dateFormatted = new Date().toLocaleDateString('es-VE');

    return [
      `📊 *CIERRE Z - ${storeName.toUpperCase()}*`,
      `📅 Fecha: ${dateFormatted} | Periodo: ${period}`,
      `👤 Cajero Responsable: ${currentUser?.name || 'Admin Hebert'}`,
      `──────────────────────────`,
      `💰 *VENTAS TOTALES:* ${formatUsd(totalSalesUsd)}`,
      `🇻🇪 *EQUIVALENTE BS.:* ${formatBs(totalSalesBs)}`,
      `📈 *GANANCIA BRUTA:* ${formatUsd(grossProfitUsd)} (${marginPercent.toFixed(1)}%)`,
      `📦 *COSTO MERCANCÍA:* ${formatUsd(totalCostUsd)}`,
      `🧾 *OPERACIONES:* ${operationsCount}`,
      `──────────────────────────`,
      `*DESGLOSE POR CANALES:*`,
      `• Efectivo $: ${formatUsd(financesData?.methods?.efectivo_usd || 0)}`,
      `• Zelle: ${formatUsd(financesData?.methods?.zelle_usd || 0)}`,
      `• Binance/USDT: ${formatUsd(financesData?.methods?.binance_usd || 0)}`,
      `• Cashea (+15%): ${formatUsd((financesData?.methods?.cashea_initial_usd || 0) + (financesData?.methods?.cashea_financed_usd || 0))}`,
      `• Pago Móvil: ${formatBs(financesData?.methods?.pago_movil_bs || 0)}`,
      `• Punto de Venta: ${formatBs(financesData?.methods?.punto_bs || 0)}`,
      `• Efectivo Bs: ${formatBs(financesData?.methods?.efectivo_bs || 0)}`,
      `• Créditos: ${formatUsd(financesData?.methods?.credito_total_usd || 0)}`,
      `──────────────────────────`,
      `*ARQUEO DE CAJA CHICA:*`,
      `• Fondo Inicial: ${formatUsd(parsedInitUsd)} / ${formatBs(parsedInitBs)}`,
      `• Efectivo $ Gaveta: Contado ${formatUsd(parsedCountedUsd)} (Esperado ${formatUsd(totalEsperadoUsd)}) -> Dif: ${diffUsd >= 0 ? '+' : ''}${formatUsd(diffUsd)}`,
      `• Efectivo Bs Gaveta: Contado ${formatBs(parsedCountedBs)} (Esperado ${formatBs(totalEsperadoBs)}) -> Dif: ${diffBs >= 0 ? '+' : ''}${formatBs(diffBs)}`,
      `──────────────────────────`,
      `_Reporte generado automáticamente por Sistema POS._`
    ].join('\n');
  };

  const handleSendWhatsApp = () => {
    const text = buildWhatsAppReport();
    const phone = settings.owner_phone ? settings.owner_phone.replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
    if (showToast) showToast('Reporte Cierre Z listo para enviar por WhatsApp');
  };

  const handlePrintZReport = () => {
    window.print();
  };

  const handleSaveCloseout = async () => {
    if (!financesData) return;
    setSubmittingClose(true);
    try {
      const res = await fetch('/api/cash-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_date: endDate,
          cashier_name: currentUser?.name || 'Admin Hebert',
          initial_cash_usd: parsedInitUsd,
          initial_cash_bs: parsedInitBs,
          system_efectivo_usd: financesData.methods?.efectivo_usd || 0,
          system_zelle_usd: financesData.methods?.zelle_usd || 0,
          system_binance_usd: financesData.methods?.binance_usd || 0,
          system_efectivo_bs: financesData.methods?.efectivo_bs || 0,
          system_pago_movil_bs: financesData.methods?.pago_movil_bs || 0,
          system_punto_bs: financesData.methods?.punto_bs || 0,
          system_cashea_usd: (financesData.methods?.cashea_initial_usd || 0) + (financesData.methods?.cashea_financed_usd || 0),
          system_credit_usd: financesData.methods?.credito_total_usd || 0,
          total_system_usd: totalSalesUsd,
          actual_cash_usd: parsedCountedUsd,
          actual_cash_bs: parsedCountedBs,
          diff_usd: diffUsd,
          diff_bs: diffBs,
          notes: `Cierre realizado por ${currentUser?.name || 'Admin Hebert'}`
        })
      });

      if (!res.ok) throw new Error('Error al registrar cierre de caja');

      setCloseSuccess(true);
      setTimeout(() => setCloseSuccess(false), 3000);
      if (showToast) showToast('¡Cierre Z registrado exitosamente en la base de datos!');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSubmittingClose(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1720px] mx-auto pb-10">
      {/* ========================================================= */}
      {/* HEADER BANNER — EXACTO AL SCREENSHOT 1                    */}
      {/* ========================================================= */}
      <div className="card-surface p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#E6F7F5] text-[#074E4A] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[19px] text-[#111827]">
              Finanzas, Ganancias & Cierre de Caja
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-400 mt-0.5">
              Auditoría en tiempo real de ingresos, costos de inventario, ganancias y arqueo de turnos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="px-4 py-2.5 rounded-xl bg-[#E6F7F5] hover:bg-[#D1F0EC] text-[#074E4A] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handlePrintZReport}
            className="px-4 py-2.5 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cierre Z</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTROS DE PERÍODO & BÚSQUEDA — EXACTO A SCREENSHOT 1      */}
      {/* ========================================================= */}
      <div className="card-surface p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Period Filter Tabs */}
          <div
            className="flex flex-wrap items-center gap-1 bg-[#F4F6F8] p-1 rounded-xl"
            role="tablist"
            aria-label="Periodo financiero"
          >
            {['Hoy', 'Ayer', 'Esta Semana', 'Este Mes', 'Personalizado'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={period === tab}
                onClick={() => handleSelectPeriod(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  period === tab
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-slate-500 hover:text-[#111827]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-slate-500">
              <span>Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriod('Personalizado');
                }}
                className="bg-[#F6F8FA] rounded-lg px-2.5 py-1.5 font-mono-num text-xs text-[#111827] border border-slate-100"
              />
            </label>
            <label className="flex items-center gap-1.5 text-slate-500">
              <span>Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriod('Personalizado');
                }}
                className="bg-[#F6F8FA] rounded-lg px-2.5 py-1.5 font-mono-num text-xs text-[#111827] border border-slate-100"
              />
            </label>
          </div>
        </div>

        {/* Search & Channel Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por # ticket, cliente o cajero..."
              className="w-full bg-[#F6F8FA] focus:bg-white text-[13px] text-[#111827] placeholder:text-slate-400 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-[#074E4A]/30 focus:outline-none transition-colors"
            />
          </div>
          <select
            aria-label="Filtrar por método de cobro"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-[#F6F8FA] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] border border-slate-100 cursor-pointer"
          >
            <option value="ALL">Todos los Métodos</option>
            {PAYMENT_CHANNELS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 TARJETAS KPI FINANCIERAS — EXACTO A SCREENSHOT 1        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Ventas */}
        <div className="card-surface card-surface-hover p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Total Ventas ($ USD)
            </p>
            <p className="font-display font-bold text-[24px] text-[#111827] font-mono-num mt-1">
              {formatUsd(totalSalesUsd)}
            </p>
            <p className="font-mono-num text-xs font-semibold text-[#074E4A] mt-1">
              {formatBs(totalSalesBs)}
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-[#E6F7F5] text-[#074E4A] flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>

        {/* KPI 2: Ganancia Bruta Real */}
        <div className="card-surface card-surface-hover p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Ganancia Bruta Real
            </p>
            <p className="font-display font-bold text-[24px] text-[#074E4A] font-mono-num mt-1">
              {formatUsd(grossProfitUsd)}
            </p>
            <p className="font-mono-num text-xs text-slate-400 mt-1">
              {formatBs(grossProfitBs)}
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-[#F2FCE2] text-[#3F6212] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>

        {/* KPI 3: Costo Mercancía Vendida */}
        <div className="card-surface card-surface-hover p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Costo Mercancía Vendida
            </p>
            <p className="font-display font-bold text-[24px] text-[#111827] font-mono-num mt-1">
              {formatUsd(totalCostUsd)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Costo base de reposición
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </span>
        </div>

        {/* KPI 4: Margen de Rentabilidad */}
        <div className="card-surface card-surface-hover p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">
              Margen de Rentabilidad
            </p>
            <p className="font-display font-bold text-[24px] text-indigo-600 font-mono-num mt-1">
              {marginPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {operationsCount} operaciones
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2 COLUMNAS: DESGLOSE DE CANALES + CIERRE DE CAJA ARQUEO   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Desglose por Canales de Cobro */}
        <section
          className="xl:col-span-7 card-surface p-5 sm:p-6"
          aria-label="Desglose por canales de cobro"
        >
          <h3 className="font-display font-bold text-[16px] text-[#111827] mb-4">
            Desglose por Canales de Cobro (Divisas 3 en 1, Bolívares y Cashea)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_CHANNELS.map(({ key, title, subtitle, currency, accent, Icon }) => {
              let valUsd = 0;
              let valBs = 0;

              if (financesData?.methods) {
                if (key === 'efectivo_usd') valUsd = financesData.methods.efectivo_usd || 0;
                else if (key === 'zelle_usd') valUsd = financesData.methods.zelle_usd || 0;
                else if (key === 'binance_usd') valUsd = financesData.methods.binance_usd || 0;
                else if (key === 'cashea') valUsd = (financesData.methods.cashea_initial_usd || 0) + (financesData.methods.cashea_financed_usd || 0);
                else if (key === 'pago_movil_bs') {
                  valBs = financesData.methods.pago_movil_bs || 0;
                  valUsd = valBs / tasaTienda;
                } else if (key === 'punto_bs') {
                  valBs = financesData.methods.punto_bs || 0;
                  valUsd = valBs / tasaTienda;
                } else if (key === 'efectivo_bs') {
                  valBs = financesData.methods.efectivo_bs || 0;
                  valUsd = valBs / tasaTienda;
                } else if (key === 'credito_usd') {
                  valUsd = financesData.methods.credito_total_usd || 0;
                }
              }

              return (
                <div
                  key={key}
                  className="bg-[#F6F8FA] rounded-xl p-3 flex items-center justify-between gap-2 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-8 h-8 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] whitespace-nowrap">
                        {title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono-num text-[13px] font-bold text-[#111827] whitespace-nowrap">
                      {currency === 'USD' ? formatUsd(valUsd) : formatBs(valBs)}
                    </p>
                    {currency === 'BS' && valUsd > 0 && (
                      <p className="font-mono-num text-[10.5px] text-slate-400">
                        {formatUsd(valUsd)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Columna Derecha: Cierre de Caja Diario (Arqueo) */}
        <section
          className="xl:col-span-5 card-surface p-5 sm:p-6 flex flex-col gap-4"
          aria-label="Cierre de caja diario"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#074E4A]" />
              <h3 className="font-display font-bold text-[16px] text-[#111827]">
                Cierre de Caja Diario (Arqueo)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#E6F7F5] text-[#074E4A] text-[11px] font-semibold">
              Cajero: {currentUser?.name || 'Admin Hebert'}
            </span>
          </div>

          {/* Inputs de Fondos Iniciales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="init-fund-usd"
                className="text-[11px] font-semibold text-slate-500 block mb-1"
              >
                Fondo Inicial ($)
              </label>
              <input
                id="init-fund-usd"
                type="number"
                min="0"
                step="0.01"
                value={initialFundUsd}
                onChange={(e) => setInitialFundUsd(e.target.value)}
                className="w-full bg-[#F6F8FA] rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-[#111827] border border-slate-100 focus:bg-white focus:outline-none focus:border-[#074E4A]"
              />
            </div>
            <div>
              <label
                htmlFor="init-fund-bs"
                className="text-[11px] font-semibold text-slate-500 block mb-1"
              >
                Fondo Inicial (Bs)
              </label>
              <input
                id="init-fund-bs"
                type="number"
                min="0"
                step="1"
                value={initialFundBs}
                onChange={(e) => setInitialFundBs(e.target.value)}
                className="w-full bg-[#F6F8FA] rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-[#111827] border border-slate-100 focus:bg-white focus:outline-none focus:border-[#074E4A]"
              />
            </div>

            {/* Inputs de Billetes Contados */}
            <div>
              <label
                htmlFor="counted-usd"
                className="text-[11px] font-semibold text-slate-500 block mb-1"
              >
                Billetes $ Contados
              </label>
              <input
                id="counted-usd"
                type="number"
                min="0"
                step="0.01"
                value={countedUsd}
                onChange={(e) => setCountedUsd(e.target.value)}
                placeholder={totalEsperadoUsd.toFixed(2)}
                className="w-full bg-[#F6F8FA] rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-[#111827] border border-slate-100 focus:bg-white focus:outline-none focus:border-[#074E4A]"
              />
            </div>
            <div>
              <label
                htmlFor="counted-bs"
                className="text-[11px] font-semibold text-slate-500 block mb-1"
              >
                Billetes Bs Contados
              </label>
              <input
                id="counted-bs"
                type="number"
                min="0"
                step="1"
                value={countedBs}
                onChange={(e) => setCountedBs(e.target.value)}
                placeholder={totalEsperadoBs.toFixed(2)}
                className="w-full bg-[#F6F8FA] rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-[#111827] border border-slate-100 focus:bg-white focus:outline-none focus:border-[#074E4A]"
              />
            </div>
          </div>

          {/* Desglose de Totales Esperados vs Diferencia */}
          <div className="bg-[#F6F8FA] rounded-xl p-3.5 flex flex-col gap-2.5 text-xs border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Efectivo $ Esperado:</span>
              <span className="font-mono-num font-bold text-[#111827]">
                {formatUsd(totalEsperadoUsd)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Diferencia $:</span>
              <span
                className={`font-mono-num font-bold ${
                  diffUsd < 0
                    ? 'text-rose-600'
                    : diffUsd > 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                }`}
              >
                {diffUsd >= 0 ? '+' : ''}
                {formatUsd(diffUsd)}
              </span>
            </div>
            <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between">
              <span className="text-slate-500">Efectivo Bs Esperado:</span>
              <span className="font-mono-num font-bold text-[#111827]">
                {formatBs(totalEsperadoBs)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Diferencia Bs:</span>
              <span
                className={`font-mono-num font-bold ${
                  diffBs < 0
                    ? 'text-rose-600'
                    : diffBs > 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                }`}
              >
                {diffBs >= 0 ? '+' : ''}
                {formatBs(diffBs)}
              </span>
            </div>
          </div>

          {/* Botón Guardar Cierre */}
          <button
            type="button"
            disabled={submittingClose}
            onClick={handleSaveCloseout}
            className="w-full py-3 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{submittingClose ? 'Registrando Cierre...' : closeSuccess ? '✓ ¡Cierre Z Guardado!' : 'Guardar y Cerrar Turno (Cierre Z)'}</span>
          </button>
        </section>
      </div>
    </div>
  );
}
