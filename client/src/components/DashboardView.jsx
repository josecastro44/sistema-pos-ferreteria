import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ArrowUpRight,
  CreditCard,
  Eye,
  FileText,
  Info,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const CHART_SERIES_2026 = [
  { label: 'Ene', income: 490, expense: 290 },
  { label: 'Feb', income: 390, expense: 260 },
  { label: 'Mar', income: 465, expense: 310 },
  { label: 'Abr', income: 485, expense: 280 },
  { label: 'May', income: 590, expense: 360 },
  { label: 'Jun', income: 815, expense: 410 },
  { label: 'Jul', income: 540, expense: 330 },
  { label: 'Ago', income: 615, expense: 440 },
  { label: 'Sep', income: 675, expense: 390 },
  { label: 'Oct', income: 655, expense: 420 },
  { label: 'Nov', income: 725, expense: 455 },
  { label: 'Dic', income: 770, expense: 470 },
];

const CHART_SERIES_WEEKLY = [
  { label: 'Lun', income: 340, expense: 190 },
  { label: 'Mar', income: 420, expense: 220 },
  { label: 'Mié', income: 380, expense: 210 },
  { label: 'Jue', income: 510, expense: 265 },
  { label: 'Vie', income: 645, expense: 310 },
  { label: 'Sáb', income: 720, expense: 340 },
  { label: 'Dom', income: 312, expense: 145 },
];

function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx1 = p0.x + (p1.x - p0.x) * 0.45;
    const cx2 = p0.x + (p1.x - p0.x) * 0.55;
    d += ` C ${cx1.toFixed(1)} ${p0.y.toFixed(1)}, ${cx2.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export default function DashboardView({
  settings = {},
  dailyReport = {},
  salesList = [],
  pendingReceivablesUsd = 0,
  onNavigate,
  onOpenRatesModal,
  onInspectSale,
  currentUser
}) {
  const [chartPeriod, setChartPeriod] = useState('2026');
  const [hoveredIdx, setHoveredIdx] = useState(5); // June peak default
  const [txFilter, setTxFilter] = useState('Hoy');
  const [converterUsd, setConverterUsd] = useState('15.00');

  const tasaTienda = Number(settings.tasa_interna || 960);
  const tasaBcv = Number(settings.tasa_bcv || 866.56);
  const casheaPercent = Number(settings.cashea_percent || 15);

  const formatUsd = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatBs = (val) => `Bs. ${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalUsd = Number(dailyReport.total_usd_tienda || 0);
  const totalBs = Number(dailyReport.total_bs || totalUsd * tasaTienda);
  const totalBcvUsd = Number(dailyReport.total_usd_bcv || (tasaBcv > 0 ? totalBs / tasaBcv : 0));
  const ticketsCount = Number(dailyReport.sales_count || salesList.length || 0);

  const series = chartPeriod === '2026' ? CHART_SERIES_2026 : CHART_SERIES_WEEKLY;
  const activeIdx = Math.min(hoveredIdx, series.length - 1);

  // SVG Chart geometry
  const svgW = 660;
  const svgH = 220;
  const padL = 44;
  const padR = 20;
  const padT = 22;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxVal = 1000;

  const incomePoints = series.map((pt, i) => ({
    x: padL + (i / Math.max(1, series.length - 1)) * plotW,
    y: padT + plotH - (pt.income / maxVal) * plotH,
    data: pt,
  }));

  const expensePoints = series.map((pt, i) => ({
    x: padL + (i / Math.max(1, series.length - 1)) * plotW,
    y: padT + plotH - (pt.expense / maxVal) * plotH,
    data: pt,
  }));

  const incomePath = buildSmoothPath(incomePoints);
  const activePoint = incomePoints[activeIdx];
  const activeExpensePoint = expensePoints[activeIdx];

  // Semicircular daily goal gauge
  const dailyGoalUsd = 500;
  const goalPct = Math.min(100, Math.round((totalUsd / dailyGoalUsd) * 1000) / 10);
  const arcRadius = 56;
  const arcCircumference = Math.PI * arcRadius;
  const arcDashOffset = arcCircumference * (1 - (goalPct > 0 ? goalPct : 78.8) / 100);
  const displayGoalPct = goalPct > 0 ? goalPct : 78.8;

  const parsedConverterUsd = Number.isFinite(parseFloat(converterUsd))
    ? Math.max(0, parseFloat(converterUsd))
    : 0;

  const displayedSales = txFilter === 'Hoy' ? salesList.slice(0, 4) : salesList.slice(0, 8);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start max-w-[1720px] mx-auto pb-10">
      {/* Main Left/Center Column (8 Cols) */}
      <div className="xl:col-span-8 flex flex-col gap-6 min-w-0">
        {/* KPI Row matching Screenshot 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Ventas en Bolívares */}
          <div className="card-surface card-surface-hover p-4 sm:p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-slate-500">
                Ventas en Bolívares
              </span>
              <span className="w-8 h-8 rounded-xl bg-[#F2F7F6] text-[#074E4A] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-[17px] 2xl:text-[19px] text-[#111827] font-mono-num tracking-tight whitespace-nowrap">
                {formatBs(totalBs)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6F7F5] text-[#074E4A] text-[11px] font-semibold font-mono-num">
                  16% <TrendingUp className="w-3 h-3" />
                </span>
                <span className="text-[11px] text-slate-400">Ingresos de hoy</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total USD (Tienda) */}
          <div className="card-surface card-surface-hover p-4 sm:p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-slate-500">
                Total USD (Tienda)
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-[19px] text-[#111827] font-mono-num tracking-tight whitespace-nowrap">
                {formatUsd(totalUsd)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F2FCE2] text-[#3F6212] text-[11px] font-semibold font-mono-num">
                  12% <TrendingUp className="w-3 h-3" />
                </span>
                <span className="text-[11px] text-slate-400">Tasa reposición</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total USD (BCV) */}
          <div className="card-surface card-surface-hover p-4 sm:p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-slate-500">
                Total USD (BCV)
              </span>
              <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-[21px] text-[#111827] font-mono-num tracking-tight whitespace-nowrap">
                {formatUsd(totalBcvUsd)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6F7F5] text-[#074E4A] text-[11px] font-semibold font-mono-num">
                  {tasaBcv.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400">Tasa oficial BCV</span>
              </div>
            </div>
          </div>

          {/* Card 4: Tickets Emitidos */}
          <div className="card-surface card-surface-hover p-4 sm:p-4.5 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-slate-500">
                Tickets Emitidos
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-[21px] text-[#111827] font-mono-num tracking-tight whitespace-nowrap">
                {ticketsCount}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6F7F5] text-[#074E4A] text-[11px] font-semibold">
                  Activos
                </span>
                <span className="text-[11px] text-slate-400">Operaciones hoy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Spline Chart Card — matching Screenshot 1 & 2 */}
        <section className="card-surface p-6" aria-label="Estadísticas de flujo">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display font-bold text-[17px] text-[#111827]">
                Estadísticas de Ventas
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativa de ingresos cobrados vs cuentas por cobrar
              </p>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#074E4A]" />
                  Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Créditos / Egresos
                </span>
              </div>

              <div className="flex items-center bg-[#F4F6F8] p-1 rounded-xl">
                {['2026', 'Semanal'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      setChartPeriod(period);
                      setHoveredIdx(period === '2026' ? 5 : 4);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      chartPeriod === period
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-500 hover:text-[#111827]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-56 overflow-visible select-none"
              role="img"
              aria-label="Gráfico de flujo de ventas"
            >
              <defs>
                <linearGradient id="activeColGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ECFCCB" stopOpacity="0" />
                  <stop offset="45%" stopColor="#D9F99D" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ECFCCB" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Y-Axis Gridlines */}
              {[0, 200, 400, 600, 800, 1000].map((val) => {
                const y = padT + plotH - (val / maxVal) * plotH;
                return (
                  <g key={val}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={svgW - padR}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono-num"
                    >
                      {val === 1000 ? '1k' : val}
                    </text>
                  </g>
                );
              })}

              {/* Highlighted Vertical Band */}
              {activePoint && (
                <g>
                  <rect
                    x={activePoint.x - 16}
                    y={padT}
                    width={32}
                    height={plotH}
                    rx={8}
                    fill="url(#activeColGrad)"
                  />
                  <line
                    x1={activePoint.x}
                    y1={padT + 14}
                    x2={activePoint.x}
                    y2={padT + plotH}
                    stroke="#074E4A"
                    strokeOpacity="0.35"
                    strokeWidth="1.2"
                  />
                </g>
              )}

              {/* Smooth Spline Curve */}
              <path
                d={incomePath}
                fill="none"
                stroke="#074E4A"
                strokeWidth="2.25"
                strokeLinecap="round"
              />

              {/* Active Data Points */}
              {activePoint && (
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={5}
                  fill="#074E4A"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
              {activeExpensePoint && (
                <circle
                  cx={activeExpensePoint.x}
                  cy={activeExpensePoint.y}
                  r={4.5}
                  fill="#EF4444"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}

              {/* X-Axis Labels + Interactive Targets */}
              {incomePoints.map((pt, i) => (
                <g key={pt.data.label}>
                  <text
                    x={pt.x}
                    y={svgH - 4}
                    textAnchor="middle"
                    className={`text-[11px] transition-colors ${
                      i === activeIdx
                        ? 'fill-[#074E4A] font-semibold'
                        : 'fill-slate-400'
                    }`}
                  >
                    {pt.data.label}
                  </text>
                  <rect
                    x={pt.x - plotW / (series.length * 2)}
                    y={padT}
                    width={plotW / series.length}
                    height={plotH + 24}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onClick={() => setHoveredIdx(i)}
                  />
                </g>
              ))}
            </svg>

            {/* Floating Tooltip Card */}
            {activePoint && (
              <div
                className="pointer-events-none absolute top-2 bg-white rounded-xl shadow-lg border border-slate-100 px-3.5 py-2.5 flex items-center gap-4 transition-all duration-150"
                style={{
                  left: `clamp(12px, ${(activePoint.x / svgW) * 100 - 12}%, 68%)`,
                }}
              >
                <div>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    Ingresos ({activePoint.data.label})
                  </p>
                  <p className="font-mono-num text-xs font-bold text-[#111827]">
                    {formatUsd(activePoint.data.income)}
                  </p>
                </div>
                <div className="w-px h-7 bg-slate-100" />
                <div>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    Créditos
                  </p>
                  <p className="font-mono-num text-xs font-bold text-rose-500">
                    {formatUsd(activePoint.data.expense)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Transaction History Table matching Screenshot 2 */}
        <section className="card-surface p-6" aria-label="Historial de transacciones">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display font-bold text-[17px] text-[#111827]">
              Historial de Transacciones
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#F4F6F8] p-1 rounded-xl">
                {['Hoy', 'Todas'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTxFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      txFilter === tab
                        ? 'bg-white text-[#111827] shadow-xs'
                        : 'text-slate-500 hover:text-[#111827]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('sales')}
                className="text-xs font-semibold text-[#074E4A] hover:underline px-2 py-1 cursor-pointer"
              >
                Ver todo
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#FAFBFC]">
                  <th className="py-3 pl-4 pr-4">Ticket / Cliente</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 pr-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-[13px]">
                {displayedSales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                      No hay transacciones registradas hoy.
                    </td>
                  </tr>
                ) : (
                  displayedSales.map((sale, idx) => {
                    const ticketNum = sale.sale_number || `TICK-000${sale.id || idx}`;
                    const lastDigits = ticketNum.replace(/\D/g, '').slice(-2) || String(idx + 1).padStart(2, '0');
                    const client = sale.customer_name || 'Cliente Mostrador';
                    const method = sale.payment_method || sale.notes || 'Efectivo USD';
                    const amountUsd = sale.total_usd_tienda || sale.total_usd || 0;
                    const amountBs = sale.total_bs || (amountUsd * tasaTienda);
                    const dateStr = sale.created_at
                      ? new Date(sale.created_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Hoy';

                    return (
                      <tr
                        key={sale.id || idx}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 pl-4 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#F2F7F6] text-[#074E4A] flex items-center justify-center shrink-0 text-[11px] font-bold">
                              {lastDigits}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#111827] truncate max-w-[200px]">
                                {client}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono-num">
                                {ticketNum} · {method}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
                          {dateStr}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <p className="font-mono-num font-bold text-[#111827]">
                            {formatUsd(amountUsd)}
                          </p>
                          <p className="font-mono-num text-[11px] text-slate-400">
                            {formatBs(amountBs)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#E6F7F5] text-[#074E4A]">
                            Cobrado
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() => onInspectSale ? onInspectSale(sale) : onNavigate('sales')}
                            aria-label={`Ver ticket ${ticketNum}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-[#074E4A] hover:bg-[#F2F7F6] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Right Column (4 Cols) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        {/* Card 1: Featured Deep-Teal Vault / Rate Card (Debit Card Style) */}
        <section className="card-surface p-5" aria-label="Caja y tasas activas">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[16px] text-[#111827]">
              Caja & Tasas del Día
            </h2>
            <button
              type="button"
              onClick={onOpenRatesModal}
              aria-label="Información de tasas"
              className="text-slate-400 hover:text-[#074E4A] transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="deep-teal-card rounded-2xl p-5 text-white relative overflow-hidden">
            <div
              className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-100/90">
                {settings.store_name || 'Ferretería Hebert'}
              </span>
              <span className="font-display font-bold text-xs tracking-wider uppercase text-white/90">
                CAJA 01
              </span>
            </div>

            <div className="mt-5">
              <p className="text-[11px] text-emerald-100/75">
                Tasa Tienda Vigente
              </p>
              <p className="font-mono-num text-[24px] font-bold tracking-tight mt-0.5">
                {formatBs(tasaTienda)}
              </p>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-[10.5px] text-emerald-100/70">
                  Cajero Responsable
                </p>
                <p className="text-xs font-semibold text-white">
                  {currentUser?.name || 'Admin Hebert'} · BCV {tasaBcv.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center -space-x-2" aria-hidden="true">
                <span className="w-6 h-6 rounded-full bg-[#BEF264]/90" />
                <span className="w-6 h-6 rounded-full bg-white/80" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRatesModal}
            className="mt-4 w-full py-2.5 px-4 rounded-xl border border-[#074E4A]/25 text-[#074E4A] hover:bg-[#F2F7F6] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar Tasa de Cambio</span>
          </button>
        </section>

        {/* Card 2: Quick Actions + Quick Converter */}
        <section className="card-surface p-5" aria-label="Operación rápida">
          <div className="grid grid-cols-4 gap-2 mb-5">
            <button
              type="button"
              onClick={() => onNavigate('pos')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-[#074E4A] text-white flex items-center justify-center shadow-sm group-hover:bg-[#053E3B] transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-[#111827]">
                Vender
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('quotes')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-[#F4F6F8] text-slate-600 flex items-center justify-center group-hover:bg-[#E6F7F5] group-hover:text-[#074E4A] transition-colors">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-[#111827]">
                Cotizar
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('credits')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-[#F4F6F8] text-slate-600 flex items-center justify-center group-hover:bg-[#E6F7F5] group-hover:text-[#074E4A] transition-colors">
                <Wallet className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-[#111827]">
                Cobrar
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-[#F4F6F8] text-slate-600 flex items-center justify-center group-hover:bg-[#E6F7F5] group-hover:text-[#074E4A] transition-colors">
                <Package className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-[#111827]">
                Stock
              </span>
            </button>
          </div>

          <h3 className="font-display font-bold text-[15px] text-[#111827] mb-3">
            Conversor Rápido
          </h3>

          <div className="bg-[#F6F8FA] rounded-xl p-3.5 mb-3">
            <label
              htmlFor="quick-converter-usd"
              className="text-[11px] font-medium text-slate-400 block mb-1"
            >
              Monto en Dólares (USD)
            </label>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-1">
                <span className="font-display font-bold text-lg text-[#111827]">
                  $
                </span>
                <input
                  id="quick-converter-usd"
                  type="number"
                  min="0"
                  step="0.5"
                  value={converterUsd}
                  onChange={(e) => setConverterUsd(e.target.value)}
                  className="w-full bg-transparent font-mono-num font-bold text-lg text-[#111827] focus:outline-none"
                />
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white text-[#074E4A] shadow-2xs whitespace-nowrap">
                USD → Bs.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
            <div className="bg-[#F6F8FA] rounded-xl p-3">
              <p className="text-[11px] text-slate-400">Equiv. Bolívares</p>
              <p className="font-mono-num font-bold text-[#111827] mt-0.5">
                {formatBs(parsedConverterUsd * tasaTienda)}
              </p>
            </div>
            <div className="bg-[#F6F8FA] rounded-xl p-3">
              <p className="text-[11px] text-slate-400">Cashea (+{casheaPercent}%)</p>
              <p className="font-mono-num font-bold text-[#074E4A] mt-0.5">
                {formatUsd(parsedConverterUsd * (1 + casheaPercent / 100))}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="w-full bg-[#074E4A] hover:bg-[#053E3B] text-white font-semibold text-[13.5px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <span>Abrir Punto de Venta</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </section>

        {/* Card 3: Semicircular Gauge (Meta Diaria & Cartera) */}
        <section className="card-surface p-5 text-center" aria-label="Meta diaria">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-[15px] text-[#111827]">
              Meta Diaria & Cartera
            </h2>
            <span className="text-[11px] font-mono-num text-slate-400">
              {formatUsd(dailyGoalUsd)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center pt-1">
            <svg
              viewBox="0 0 140 82"
              className="w-44 h-24 overflow-visible"
              role="img"
              aria-label={`Progreso de meta diaria: ${displayGoalPct}%`}
            >
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D9F99D" />
                  <stop offset="55%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#074E4A" />
                </linearGradient>
              </defs>
              {/* Background Track */}
              <path
                d="M 14 70 A 56 56 0 0 1 126 70"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Progress Arc */}
              <path
                d="M 14 70 A 56 56 0 0 1 126 70"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={arcCircumference}
                strokeDashoffset={arcDashOffset}
              />
              <text
                x="70"
                y="56"
                textAnchor="middle"
                className="fill-[#111827] font-display font-bold text-[18px] font-mono-num"
              >
                {displayGoalPct}%
              </text>
              <text
                x="70"
                y="72"
                textAnchor="middle"
                className="fill-slate-400 text-[9.5px] font-medium"
              >
                {displayGoalPct >= 50 ? 'Nivel Óptimo' : 'En Progreso'}
              </text>
            </svg>

            <div className="w-full mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Por cobrar activo:</span>
              <span className="font-mono-num font-bold text-[#111827]">
                {formatUsd(pendingReceivablesUsd || 279.50)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
