import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  Phone,
  MapPin,
  Mail,
  CreditCard,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function CustomersView({
  customers = [],
  fetchCustomers,
  onSelectCustomerForSale,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    id_card: '',
    phone: '',
    address: '',
    email: ''
  });

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      id_card: '',
      phone: '',
      address: '',
      email: ''
    });
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      id_card: cust.id_card,
      phone: cust.phone || '',
      address: cust.address || '',
      email: cust.email || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id_card.trim()) {
      showToast('Nombre y Cédula/RIF son obligatorios', 'error');
      return;
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar cliente');
      }

      showToast(editingCustomer ? 'Cliente actualizado' : 'Cliente registrado con éxito');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar cliente');
      showToast('Cliente eliminado');
      setDeleteConfirm(null);
      fetchCustomers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter customers
  const filtered = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.id_card && c.id_card.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Directorio de Clientes</h2>
              <p className="text-xs text-gray-400">Administra los datos de clientes frecuentes, cédulas y contactos</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cédula, nombre o teléfono..."
              className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-800 w-64 sm:w-72 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
            />
          </div>

          <button
            onClick={openNewCustomerModal}
            className="bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4">Cédula / RIF</th>
                <th className="py-3 px-4">Nombre / Razón Social</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Compras Realizadas</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto stroke-1 text-gray-300 mb-1" />
                    <p className="text-xs font-semibold text-gray-600">No se encontraron clientes</p>
                    <p className="text-[11px] text-gray-400">Prueba con otro término o agrega un nuevo cliente</p>
                  </td>
                </tr>
              ) : (
                filtered.map(cust => (
                  <tr key={cust.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {cust.id_card}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {cust.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {cust.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{cust.phone}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {cust.address ? (
                        <span className="flex items-center gap-1.5" title={cust.address}>
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                      {cust.email || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 text-gray-800">
                        {cust.total_purchases || 0} tickets
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Botón rápido para vender a este cliente en el POS */}
                        <button
                          onClick={() => onSelectCustomerForSale(cust)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#00a884] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Iniciar venta con este cliente en el POS"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Vender</span>
                        </button>

                        <button
                          onClick={() => openEditCustomerModal(cust)}
                          className="p-1.5 text-gray-400 hover:text-[#00a884] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm(cust)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Registrar / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00a884]" />
                <h3 className="font-bold text-base text-gray-900">
                  {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre Completo o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Juan Pérez o Constructora Ávila C.A."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Cédula o RIF *</label>
                <input
                  type="text"
                  required
                  value={formData.id_card}
                  onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                  placeholder="Ej: V-18456789 o J-12345678-0"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej: 0414-1234567"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Dirección de Entrega / Facturación</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Sector Centro, Calle 5"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold shadow-xs"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Cliente */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-sm text-gray-900">¿Eliminar Cliente?</h3>
              <p className="text-xs text-gray-500 mt-1">
                ¿Estás seguro de eliminar a <span className="font-bold">{deleteConfirm.name}</span>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCustomer(deleteConfirm.id)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
