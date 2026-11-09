import React from 'react';
import {
  LayoutGrid,
  Store,
  Users,
  PackagePlus,
  Pencil,
  Boxes,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  UserCheck,
  Settings,
  Search,
  Bell,
  Coins,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  FileText,
  CreditCard
} from 'lucide-react';

export default function MainLayout({
  activeTab,
  setActiveTab,
  cartCount = 0,
  lowStockCount = 0,
  settings,
  onOpenRatesModal,
  onOpenNewProductModal,
  currentUser,
  onSwitchUser,
  searchQuery,
  onSearchChange,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(
    new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Nav Item Helper
  const renderNavItem = (key, label, Icon, options = {}) => {
    const isActive = activeTab === key;
    const badge = options.badge;
    const onClick = options.onClick || (() => {
      setActiveTab(key);
      setSidebarOpen(false);
    });

    return (
      <button
        key={key}
        onClick={onClick}
        title={label}
        className={`w-full flex items-center ${
          sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
        } py-2.5 rounded-2xl font-medium text-xs transition-all cursor-pointer ${
          isActive
            ? 'bg-[#00a884] text-white font-semibold shadow-xs shadow-[#00a884]/20'
            : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100/70'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
          {!sidebarCollapsed && <span className="tracking-tight">{label}</span>}
        </div>
        {!sidebarCollapsed && badge !== undefined && badge > 0 && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#f5f6fa] text-gray-900 font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-gray-900/25 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* ========================================================= */}
      {/* SIDEBAR EXACTO AL ESTILO DE LA REFERENCIA                */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col justify-between shrink-0 transition-all duration-200 lg:static ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'
        } ${sidebarOpen ? 'w-60 flex' : 'hidden lg:flex'} print:hidden`}
      >
        <div className={`p-4 space-y-4 overflow-y-auto ${sidebarCollapsed ? 'px-2' : ''}`}>
          {/* Header del Negocio */}
          <div className="space-y-2">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#10b981] flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                  BJ
                </div>
                {!sidebarCollapsed && (
                  <div className="overflow-hidden">
                    <h1 className="font-extrabold text-sm tracking-tight text-gray-900 truncate leading-tight">
                      {settings.store_name || 'Bodega Jeym'}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-medium">Sistema POS</p>
                  </div>
                )}
              </div>

              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pastilla de Tasa de Cambio (Estilo 💵 1$ = Bs 960,00) */}
            {!sidebarCollapsed ? (
              <button
                onClick={onOpenRatesModal}
                title="Haga clic para cambiar las tasas de cambio"
                className="w-full py-1.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold text-gray-800 transition-colors cursor-pointer group"
              >
                <span>💵</span>
                <span>1$ = Bs {Number(settings.tasa_interna || 960).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </button>
            ) : (
              <button
                onClick={onOpenRatesModal}
                title="Cambiar Tasa de Cambio"
                className="w-full flex justify-center p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              >
                <span className="text-xs">💵</span>
              </button>
            )}
          </div>

          {/* Menú de Botones Funcionales (Bloque Superior) */}
          <div className="space-y-0.5">
            {/* 1. Dashboard */}
            {renderNavItem('dashboard', 'Dashboard', LayoutGrid)}

            {/* 2. Punto de Venta */}
            {renderNavItem('pos', 'Punto de Venta', Store, { badge: cartCount })}

            {/* 3. Presupuestos (Cotizaciones) */}
            {renderNavItem('quotes', 'Presupuestos', FileText)}

            {/* 4. Cuentas por Cobrar (Créditos) */}
            {renderNavItem('credits', 'Cuentas por Cobrar', CreditCard)}

            {/* 5. Clientes */}
            {renderNavItem('customers', 'Clientes', Users)}

            {/* 6. Registrar Producto */}
            {renderNavItem('register-product', 'Registrar Producto', PackagePlus, {
              onClick: () => {
                if (onOpenNewProductModal) onOpenNewProductModal();
                setSidebarOpen(false);
              }
            })}

            {/* 7. Editar Producto */}
            {renderNavItem('edit-product', 'Editar Producto', Pencil)}

            {/* 8. Inventario */}
            {renderNavItem('inventory', 'Inventario', Boxes, { badge: lowStockCount })}

            {/* 9. Ventas Realizadas */}
            {renderNavItem('sales', 'Ventas Realizadas', ShoppingCart)}

            {/* 10. Finanzas */}
            {renderNavItem('finances', 'Finanzas & Cierre Z', TrendingUp)}
          </div>

          {/* Línea Divisoria */}
          <div className="border-t border-gray-100 pt-1">
            {/* Menú de Botones Funcionales (Bloque Inferior) */}
            <div className="space-y-0.5">
              {/* 9. Tasa de Cambio */}
              {renderNavItem('rates', 'Tasa de Cambio', DollarSign, {
                onClick: () => {
                  if (onOpenRatesModal) onOpenRatesModal();
                  setSidebarOpen(false);
                }
              })}

              {/* 10. Usuarios */}
              {renderNavItem('users', 'Usuarios', UserCheck)}

              {/* 11. Configuración */}
              {renderNavItem('settings', 'Configuración', Settings)}
            </div>
          </div>
        </div>

        {/* Footer del Sidebar con Usuario Activo */}
        <div className={`p-3 border-t border-gray-100 ${sidebarCollapsed ? 'px-2' : ''}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-[#00a884] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {(currentUser?.name || 'AH').substring(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-gray-900 text-xs truncate leading-tight">
                    {currentUser?.name || 'Admin Hebert'}
                  </div>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {currentUser?.role || 'Administrador'}
                  </div>
                </div>
              </div>

              {onSwitchUser && (
                <button
                  onClick={onSwitchUser}
                  title="Cambiar de Cajero / Usuario"
                  className="text-[10px] font-bold text-[#00a884] hover:text-[#008f6f] px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onSwitchUser}
              title={`Usuario: ${currentUser?.name || 'Admin'}`}
              className="w-full flex justify-center p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-[#00a884] text-white font-bold text-[10px] flex items-center justify-center">
                {(currentUser?.name || 'A').substring(0, 1).toUpperCase()}
              </div>
            </button>
          )}

          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-1'} text-[10px] text-gray-400 mt-2`}>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {!sidebarCollapsed && <span className="font-medium text-gray-500">SQLite Local OK</span>}
            </span>
            {!sidebarCollapsed && <span className="font-mono text-gray-400">{currentTime}</span>}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* HEADER SUPERIOR Y CONTENIDO CENTRAL                       */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="h-14 sm:h-15 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2.5">
            {/* Toggle Sidebar Button */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Alternar Menú Lateral"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Clean Minimal Search Input */}
            <div className="relative w-64 sm:w-80 md:w-96">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Buscar por código, '1/2', '3/4', nombre... [F2]"
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50/80 border border-gray-200/80 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition-all"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Rates Pill */}
            <div
              onClick={onOpenRatesModal}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200/70 text-xs font-mono cursor-pointer hover:bg-gray-100 transition-colors"
              title="Clic para cambiar tasas"
            >
              <span className="text-gray-400 font-sans text-[10px]">Tienda:</span>
              <span className="font-bold text-gray-900 text-xs">Bs. {Number(settings.tasa_interna).toLocaleString('es-VE')}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400 font-sans text-[10px]">BCV:</span>
              <span className="font-bold text-[#00a884] text-xs">Bs. {Number(settings.tasa_bcv).toLocaleString('es-VE')}</span>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setActiveTab('inventory')}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                title="Notificaciones de stock"
              >
                <Bell className="w-4 h-4" />
              </button>
              {lowStockCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>

            {/* Profile Avatar & Switcher */}
            <div
              onClick={onSwitchUser}
              className="flex items-center gap-2 pl-2 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
              title="Clic para cambiar de cajero"
            >
              <div className="w-8 h-8 rounded-xl bg-[#00a884] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(currentUser?.name || 'AH').substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {currentUser?.name || 'Admin Hebert'}
                </div>
                <div className="text-[10px] text-gray-400 font-medium leading-none mt-0.5 capitalize">
                  {currentUser?.role || 'Administrador'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
