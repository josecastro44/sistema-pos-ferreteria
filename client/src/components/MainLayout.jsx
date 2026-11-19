import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  FileText,
  Wallet,
  Users,
  Pencil,
  Package,
  Receipt,
  TrendingUp,
  PlusSquare,
  Search,
  Bell,
  RefreshCw,
  Menu,
  X,
  UserCheck,
  Settings,
  ChevronDown
} from 'lucide-react';

const VIEW_HEADERS = {
  dashboard: {
    title: 'Bienvenido, Admin Hebert',
    subtitle: 'Resumen financiero y flujo de caja de tu ferretería hoy',
  },
  pos: {
    title: 'Punto de Venta',
    subtitle: 'Facturación rápida en Divisas, Bolívares, BCV y Cashea',
  },
  quotes: {
    title: 'Presupuestos & Cotizaciones',
    subtitle: 'Cotizaciones formales con carga directa a caja',
  },
  credits: {
    title: 'Cuentas por Cobrar',
    subtitle: 'Control de créditos, abonos parciales y vencimientos',
  },
  customers: {
    title: 'Directorio de Clientes',
    subtitle: 'Clientes registrados para facturación y créditos',
  },
  'register-product': {
    title: 'Registrar Producto',
    subtitle: 'Alta de nuevos artículos en el catálogo general',
  },
  'edit-product': {
    title: 'Editor & Gestión de Catálogo',
    subtitle: 'Precios, visibilidad en caja, proveedor y reposición',
  },
  inventory: {
    title: 'Inventario de Productos',
    subtitle: 'Existencias, costos, sinónimos y reposición de stock',
  },
  sales: {
    title: 'Historial de Facturación',
    subtitle: 'Operaciones registradas y reimpresión 58mm',
  },
  finances: {
    title: 'Finanzas & Cierre Z',
    subtitle: 'Ingresos, costos, rentabilidad y arqueo diario',
  },
  reports: {
    title: 'Finanzas & Cierre Z',
    subtitle: 'Ingresos, costos, rentabilidad y arqueo diario',
  },
  users: {
    title: 'Gestión de Usuarios',
    subtitle: 'Cajeros, administradores y permisos de acceso',
  },
  settings: {
    title: 'Configuración del Sistema',
    subtitle: 'Parámetros de tienda, impresoras y tasas de cambio',
  },
};

export default function MainLayout({
  activeTab,
  setActiveTab,
  cartCount = 0,
  lowStockCount = 0,
  settings = {},
  onOpenRatesModal,
  onOpenNewProductModal,
  currentUser,
  onSwitchUser,
  searchQuery = '',
  onSearchChange,
  children
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const header = VIEW_HEADERS[activeTab] || {
    title: 'Ferretería Hebert',
    subtitle: 'Sistema POS e Inventario Comercial'
  };

  const tasaTienda = Number(settings.tasa_interna || 960);
  const tasaBcv = Number(settings.tasa_bcv || 866.56);

  const formatBs = (val) => {
    return `Bs. ${Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const primaryItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingBag, badge: cartCount },
    { id: 'quotes', label: 'Presupuestos', icon: FileText },
    { id: 'credits', label: 'Cuentas por Cobrar', icon: Wallet },
  ];

  const managementItems = [
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'edit-product', label: 'Editar Producto', icon: Pencil },
    { id: 'inventory', label: 'Inventario', icon: Package, badge: lowStockCount },
    { id: 'sales', label: 'Ventas Realizadas', icon: Receipt },
    { id: 'finances', label: 'Finanzas & Cierre Z', icon: TrendingUp },
  ];

  const configItems = [
    { id: 'users', label: 'Usuarios', icon: UserCheck },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F6F8FA] text-[#111827] antialiased">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================= */}
      {/* SIDEBAR CORPORATIVO — ESTILO DEEP TEAL FERRETERÍA HEBERT   */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] shrink-0 bg-white border-r border-slate-100 flex flex-col justify-between transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } print:hidden`}
        aria-label="Navegación principal"
      >
        <div className="p-5 flex flex-col gap-5 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className="flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#074E4A] rounded-xl p-1 -m-1"
            >
              <div className="w-9 h-9 rounded-xl bg-[#074E4A] flex items-center justify-center relative shadow-sm shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#BEF264] border-2 border-white" />
              </div>
              <div className="min-w-0">
                <span className="font-display font-bold text-[17px] tracking-tight text-[#111827] block leading-tight whitespace-nowrap">
                  {settings.store_name || 'Ferretería Hebert'}
                </span>
                <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                  Sistema POS
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Operations Nav */}
          <nav className="flex flex-col gap-1" aria-label="Operación principal">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13.5px] transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#F2F7F6] text-[#111827] font-semibold'
                      : 'text-slate-500 font-medium hover:text-[#111827] hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#074E4A] text-white shadow-xs'
                          : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-mono-num font-semibold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#074E4A]/10 text-[#074E4A]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Management Views */}
          <div className="pt-3 border-t border-slate-100">
            <p className="px-3 mb-2 text-[11px] font-medium text-slate-400">
              Gestión & Finanzas
            </p>
            <nav className="flex flex-col gap-1" aria-label="Gestión">
              {/* Registrar Producto Button */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenNewProductModal) onOpenNewProductModal();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] text-slate-500 font-medium hover:text-[#111827] hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-slate-400">
                  <PlusSquare className="w-4 h-4" />
                </span>
                <span>Registrar Producto</span>
              </button>

              {managementItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'finances' && activeTab === 'reports');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13.5px] transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#F2F7F6] text-[#111827] font-semibold'
                        : 'text-slate-500 font-medium hover:text-[#111827] hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#074E4A] text-white shadow-xs'
                            : 'text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span
                        className={`text-[11px] font-mono-num font-semibold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-[#074E4A]/10 text-[#074E4A]'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Config Section */}
          <div className="pt-3 border-t border-slate-100">
            <nav className="flex flex-col gap-1" aria-label="Sistema">
              {configItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#F2F7F6] text-[#111827] font-semibold'
                        : 'text-slate-500 font-medium hover:text-[#111827] hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#074E4A] text-white shadow-xs'
                          : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM FEATURED DEEP-TEAL CARD — TASA TIENDA VIGENTE       */}
        {/* ========================================================= */}
        <div className="p-4 pt-2">
          <div className="deep-teal-card rounded-2xl p-4 text-white relative overflow-hidden">
            <div
              className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/5 pointer-events-none"
              aria-hidden="true"
            />
            <p className="text-[11px] text-emerald-100/80 font-medium">
              Tasa Tienda Vigente
            </p>
            <p className="font-mono-num text-[17px] font-bold tracking-tight mt-0.5">
              1$ = {formatBs(tasaTienda)}
            </p>
            <p className="text-[11px] font-mono-num text-emerald-100/75 mt-0.5 mb-3">
              BCV: {formatBs(tasaBcv)}
            </p>
            <button
              type="button"
              onClick={onOpenRatesModal}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#074E4A] hover:bg-emerald-50 font-semibold text-xs py-2 px-3 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ajustar Tasas</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA & TOPBAR                                */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR EXACTA DE LA MAQUETA */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between gap-4 shrink-0 relative z-30 print:hidden">
          {/* Zone 1: Mobile Hamburger & Page Title */}
          <div className="flex items-center gap-3 min-w-0 max-w-[300px] lg:max-w-[420px]">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú lateral"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-[18px] sm:text-[19px] text-[#111827] tracking-tight truncate">
                {header.title}
              </h1>
              <p className="text-[12px] text-slate-400 truncate hidden sm:block">
                {header.subtitle}
              </p>
            </div>
          </div>

          {/* Zone 2: Clean Search Input */}
          <div className="flex-1 min-w-[210px] max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-pos-search"
                type="search"
                value={searchQuery}
                onChange={onSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && activeTab !== 'pos') {
                    setActiveTab('pos');
                  }
                }}
                placeholder="Buscar código, producto, cliente... [F2]"
                className="w-full bg-[#F4F6F8] hover:bg-[#EFF2F5] focus:bg-white text-[13px] text-[#111827] placeholder:text-slate-400 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-[#074E4A]/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Zone 3: Rates Chip, Ir a Caja, Bell & User Chip */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Rates Chip */}
            <button
              type="button"
              onClick={onOpenRatesModal}
              className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F4F6F8] hover:bg-[#EAF2F1] text-xs transition-colors whitespace-nowrap cursor-pointer"
              title="Actualizar tasas de cambio"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#074E4A]" />
              <span className="text-slate-500">
                Tienda: <strong className="font-mono-num text-[#111827]">{formatBs(tasaTienda)}</strong>
              </span>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <span className="text-slate-500">
                BCV: <strong className="font-mono-num text-[#074E4A]">{formatBs(tasaBcv)}</strong>
              </span>
            </button>

            {/* Ir a Caja Button */}
            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => handleNav('pos')}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ir a Caja</span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notificaciones"
                className="w-9 h-9 rounded-full bg-[#F4F6F8] hover:bg-slate-200/70 flex items-center justify-center text-slate-600 relative transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {lowStockCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-sm text-[#111827]">
                      Alertas Operativas
                    </h3>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  {lowStockCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        handleNav('inventory');
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-50 text-left transition-colors cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#111827]">
                          Stock Bajo
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Hay {lowStockCount} artículos con existencias mínimas.
                        </p>
                      </div>
                    </button>
                  ) : (
                    <p className="text-xs text-slate-400 py-2 text-center">
                      Todo en orden, sin alertas activas.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Chip */}
            <div
              onClick={onSwitchUser}
              className="flex items-center gap-2 pl-2 border-l border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
              title="Cambiar cajero o usuario"
            >
              <div className="w-8 h-8 rounded-full bg-[#074E4A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(currentUser?.name || 'AH').substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-[#111827] leading-tight">
                  {currentUser?.name || 'Admin Hebert'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 capitalize">
                  {currentUser?.role || 'Administrador'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
