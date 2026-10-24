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
  Scale
} from 'lucide-react';

export default function FinancesView({ settings }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [financesData, setFinancesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialCash, setInitialCash] = useState('0');

  const fetchFinances = async (date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finances?date=${date || selectedDate}`);
      const data = await res.json();
      setFinancesData(data);
    } catch (err) {
      console.error('Error fetching finances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances(selectedDate);
  }, [selectedDate]);

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#00a884] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Finanzas & Arqueo de Caja</h2>
            <p className="text-xs text-gray-400">Control de ingresos, utilidades estimadas y desglose por método de pago</p>
          </div>
        </div>

        {/* Date Selector and Print Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-gray-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchFinances(selectedDate)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
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

      {financesData && (
        <>
          {/* Main Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Bolívares */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Ingresos Bs.</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-gray-900 mt-1">
                  Bs. {financesData.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{financesData.total_tickets} operaciones</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            {/* Total USD Tienda */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total USD (Tienda)</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-gray-900 mt-1">
                  ${financesData.total_usd_tienda.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Tasa Reposición</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Ganancia / Utilidad Bruta */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ganancia Bruta Est.</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-[#00a884] mt-1">
                  ${financesData.gross_profit_usd.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                  Bs. {financesData.gross_profit_bs.toLocaleString('es-VE')}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            {/* Costo Mercancía */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Costo de Mercancía</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-gray-700 mt-1">
                  ${financesData.total_cost_usd.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Costo base inversión</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Breakdown & Arqueo Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Payment Method Breakdown (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
                Desglose de Cobros por Método de Pago
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Pago Móvil */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Pago Móvil</div>
                      <div className="text-[10px] text-gray-400">Transferencia inmediata Bs</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-black text-gray-900 text-sm">
                      Bs. {financesData.methods.pago_movil_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Punto de Venta */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100/70 text-sky-800 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Punto de Venta</div>
                      <div className="text-[10px] text-gray-400">Tarjetas de Débito Bs</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-black text-gray-900 text-sm">
                      Bs. {financesData.methods.punto_venta_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Efectivo Bolívares */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Efectivo Bolívares</div>
                      <div className="text-[10px] text-gray-400">Billetes en caja Bs</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-black text-gray-900 text-sm">
                      Bs. {financesData.methods.efectivo_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Efectivo Divisas USD */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-100/70 text-green-800 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Efectivo Dólares ($)</div>
                      <div className="text-[10px] text-gray-400">Billetes físicos en caja</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-black text-emerald-600 text-sm">
                      ${financesData.methods.efectivo_usd.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Zelle / Transferencias */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-800 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Zelle / Dólares Digitales</div>
                      <div className="text-[10px] text-gray-400">Transferencias en USD</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-black text-indigo-600 text-sm">
                      ${financesData.methods.zelle_usd.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Pagos Mixtos */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-800 flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Pagos Combinados / Mixtos</div>
                      <div className="text-[10px] text-gray-400">Parte $ y parte Bs</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-black text-purple-700 text-xs">
                      ${financesData.methods.mixto_usd.toFixed(2)} + Bs. {financesData.methods.mixto_bs.toLocaleString('es-VE')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arqueo de Caja / Cuadre (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
                Arqueo de Efectivo en Caja
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-600 font-semibold block mb-1">
                    Fondo Inicial de Caja (Apertura USD / Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Fondo Inicial:</span>
                    <span className="font-mono font-bold">${parseFloat(initialCash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Efectivo $ Recaudado:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +${(financesData.methods.efectivo_usd + financesData.methods.mixto_usd).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200/60" />
                  <div className="flex justify-between text-gray-900 font-bold">
                    <span>Total Efectivo Esperado:</span>
                    <span className="font-mono text-sm text-[#00a884]">
                      ${(parseFloat(initialCash || 0) + financesData.methods.efectivo_usd + financesData.methods.mixto_usd).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5 font-bold text-gray-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
                    <span>Control y Auditoría</span>
                  </div>
                  <p>
                    El arqueo compara automáticamente los billetes físicos registrados con las ventas del día para asegurar cero descuadres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hidden Thermal Printer Format for Report */}
      <div id="printable-receipt" className="hidden">
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{settings.store_name}</div>
          <div style={{ fontSize: '10px' }}>RIF: {settings.rif}</div>
          <div style={{ fontSize: '10px' }}>{settings.phone}</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>CIERRE FINANCIERO (Z)</div>
          <div style={{ fontSize: '10px' }}>Fecha: {selectedDate}</div>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
        {financesData && (
          <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
            <div>Tickets Emitidos: {financesData.total_tickets}</div>
            <div>Total Bolívares: Bs. {financesData.total_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
            <div>Total USD (Tienda): ${financesData.total_usd_tienda.toFixed(2)}</div>
            <div>Total USD (BCV): ${financesData.total_usd_bcv.toFixed(2)}</div>
            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
            <div>Pago Móvil: Bs. {financesData.methods.pago_movil_bs.toLocaleString('es-VE')}</div>
            <div>Punto de Venta: Bs. {financesData.methods.punto_venta_bs.toLocaleString('es-VE')}</div>
            <div>Efectivo Bs: Bs. {financesData.methods.efectivo_bs.toLocaleString('es-VE')}</div>
            <div>Efectivo USD: ${financesData.methods.efectivo_usd.toFixed(2)}</div>
            <div>Zelle / Transf USD: ${financesData.methods.zelle_usd.toFixed(2)}</div>
            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
            <div style={{ fontWeight: 'bold' }}>Ganancia Est: ${financesData.gross_profit_usd.toFixed(2)}</div>
          </div>
        )}
        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '6px' }}>
          Reporte generado automáticamente
        </div>
      </div>
    </div>
  );
}
