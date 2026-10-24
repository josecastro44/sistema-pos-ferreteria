import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  User,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function UsersView({
  users = [],
  fetchUsers,
  currentUser,
  onSwitchUserSession,
  showToast
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPins, setShowPins] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'cajero',
    pin: '1234'
  });

  const openNewUserModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      role: 'cajero',
      pin: '1234'
    });
    setIsModalOpen(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      name: u.name,
      role: u.role,
      pin: u.pin || '1234'
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim()) {
      showToast('Usuario y Nombre son obligatorios', 'error');
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar usuario');
      }

      showToast(editingUser ? 'Usuario actualizado' : 'Usuario creado con éxito');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar usuario');
      }
      showToast('Usuario eliminado');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00a884] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios & Cajeros</h2>
            <p className="text-xs text-gray-400">Control de acceso, roles de venta y PIN rápido de inicio de turno</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPins(!showPins)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center gap-1.5 text-xs"
            title="Mostrar / ocultar PINs"
          >
            {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showPins ? 'Ocultar PIN' : 'Ver PINs'}</span>
          </button>

          <button
            onClick={openNewUserModal}
            className="bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">PIN de Acceso</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => {
                const isCurrent = currentUser?.id === u.id || currentUser?.username === u.username;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      @{u.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {u.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Cajero'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {showPins ? (
                        <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-xs">{u.pin}</span>
                      ) : (
                        <span>••••</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00a884]/15 text-[#00a884] flex items-center gap-1 w-max">
                          <CheckCircle className="w-3 h-3" />
                          <span>Sesión Activa</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Disponible</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isCurrent && (
                          <button
                            onClick={() => onSwitchUserSession(u)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#00a884] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Cambiar a este cajero para vender"
                          >
                            <span>Activar Turno</span>
                          </button>
                        )}

                        <button
                          onClick={() => openEditUserModal(u)}
                          className="p-1.5 text-gray-400 hover:text-[#00a884] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {u.id !== 1 && (
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00a884]" />
                <h3 className="font-bold text-base text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Carlos Cajero"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre de Usuario (Login) *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ej: cajero1"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Rol en el Sistema</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
                >
                  <option value="cajero">Cajero (Ventas, POS y Catálogo)</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">PIN Rápido (4 dígitos) *</label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="1234"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl font-mono text-center tracking-widest font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]"
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
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Usuario */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-sm text-gray-900">¿Eliminar Usuario?</h3>
              <p className="text-xs text-gray-500 mt-1">
                ¿Estás seguro de eliminar a <span className="font-bold">{deleteConfirm.name}</span>?
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
                onClick={() => handleDeleteUser(deleteConfirm.id)}
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
