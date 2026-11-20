import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserPlus,
  X,
  AlertCircle
} from 'lucide-react';

const PREFIXES = ['V', 'J', 'E', 'G'];

// Parse draft from initialQuery (e.g. "V24567898" or "24567898" or "Carlos Mendoza")
function parseQuickClientDraft(query = '') {
  const trimmed = query.trim();
  if (!trimmed) {
    return { prefix: 'V', number: '', name: '' };
  }

  // Check prefix like "V-12345678" or "J-30987654-1" or "V12345678"
  const docMatch = trimmed.match(/^([VJEGvjeg])[- ]?(\d+[-\d]*)$/i);
  if (docMatch) {
    return {
      prefix: docMatch[1].toUpperCase(),
      number: docMatch[2],
      name: '',
    };
  }

  // Pure digits -> Venezuelan standard ID
  if (/^\d+$/.test(trimmed)) {
    return {
      prefix: 'V',
      number: trimmed,
      name: '',
    };
  }

  // Otherwise assume it's a name
  return {
    prefix: 'V',
    number: '',
    name: trimmed,
  };
}

export default function QuickClientModal({
  isOpen,
  initialQuery = '',
  existingClients = [],
  onClose,
  onClientCreated,
  onSelectExisting,
  showToast,
  fetchCustomers
}) {
  const [prefix, setPrefix] = useState('V');
  const [docNumber, setDocNumber] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const docInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const draft = parseQuickClientDraft(initialQuery);
    setPrefix(draft.prefix);
    setDocNumber(draft.number);
    setName(draft.name);
    setPhone('');
    setAddress('');
    setEmail('');
    setShowExtras(false);
    setIsSubmitting(false);

    const timer = setTimeout(() => {
      if (draft.number && !draft.name) {
        nameInputRef.current?.focus();
      } else {
        docInputRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, initialQuery]);

  const formattedDoc = useMemo(() => {
    const cleaned = docNumber.trim().replace(/^[VJEGvjeg]-?/i, '');
    return `${prefix}-${cleaned}`;
  }, [prefix, docNumber]);

  // Check duplicate
  const duplicateClient = useMemo(() => {
    if (!docNumber.trim()) return null;
    const cleanedTyped = docNumber.trim().replace(/\D/g, '');
    if (!cleanedTyped) return null;
    return existingClients.find((c) => {
      if (!c.id_card) return false;
      const cCleaned = c.id_card.replace(/\D/g, '');
      const cPrefix = c.id_card.charAt(0).toUpperCase();
      return cPrefix === prefix && cCleaned === cleanedTyped;
    });
  }, [existingClients, prefix, docNumber]);

  if (!isOpen) return null;

  const canSubmit = Boolean(docNumber.trim()) && Boolean(name.trim()) && !duplicateClient && !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        id_card: formattedDoc,
        phone: phone.trim() || '',
        address: address.trim() || 'Registrado en Caja',
        email: email.trim() || ''
      };

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar el cliente');
      }

      const created = await res.json();
      if (fetchCustomers) await fetchCustomers();
      if (onClientCreated) onClientCreated(created);
      if (showToast) showToast(`¡Cliente ${created.name} registrado y seleccionado con éxito!`);
      onClose();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Registro rápido de cliente en caja"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 flex flex-col gap-4 border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#E6F7F5] text-[#074E4A] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-[18px] text-[#111827] leading-tight">
                Registro Rápido de Cliente
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Se guardará y seleccionará al instante sin perder el carrito
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar registro rápido de cliente"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cédula / RIF con selector rápido de prefijo */}
        <div>
          <label
            htmlFor="quick-client-doc"
            className="text-xs font-semibold text-slate-600 block mb-1.5"
          >
            Cédula / RIF *
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center bg-[#F4F6F8] p-1 rounded-xl shrink-0"
              role="group"
              aria-label="Tipo de documento"
            >
              {PREFIXES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrefix(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono-num font-bold transition-colors cursor-pointer ${
                    prefix === p
                      ? 'bg-[#074E4A] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#111827]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              ref={docInputRef}
              id="quick-client-doc"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder={prefix === 'J' ? '30987654-1' : '24567890'}
              className="flex-1 min-w-0 bg-[#F6F8FA] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono-num font-bold text-[#111827] border border-slate-200/70 focus:border-[#074E4A] focus:outline-none transition-colors"
            />
          </div>

          {duplicateClient && (
            <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200/70 p-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold text-amber-900 truncate">
                  Ya registrado: {duplicateClient.name}
                </p>
                <p className="text-[10.5px] font-mono-num text-amber-700 truncate">
                  {duplicateClient.id_card}
                  {duplicateClient.phone ? ` · ${duplicateClient.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onSelectExisting) onSelectExisting(duplicateClient);
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#074E4A] hover:bg-[#053E3B] text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Seleccionar</span>
              </button>
            </div>
          )}
        </div>

        {/* Nombre o Razón Social */}
        <div>
          <label
            htmlFor="quick-client-name"
            className="text-xs font-semibold text-slate-600 block mb-1.5"
          >
            Nombre o Razón Social *
          </label>
          <input
            ref={nameInputRef}
            id="quick-client-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carlos Mendoza o Ferreagro C.A."
            className="w-full bg-[#F6F8FA] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#111827] border border-slate-200/70 focus:border-[#074E4A] focus:outline-none transition-colors"
          />
        </div>

        {/* Teléfono / WhatsApp (Opcional) */}
        <div>
          <label
            htmlFor="quick-client-phone"
            className="text-xs font-semibold text-slate-600 block mb-1.5"
          >
            Teléfono / WhatsApp{' '}
            <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="quick-client-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 0414-1234567"
            className="w-full bg-[#F6F8FA] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono-num text-[#111827] border border-slate-200/70 focus:border-[#074E4A] focus:outline-none transition-colors"
          />
        </div>

        {/* Datos opcionales colapsables */}
        <div>
          <button
            type="button"
            onClick={() => setShowExtras((prev) => !prev)}
            className="text-xs font-semibold text-[#074E4A] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            {showExtras ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>
              {showExtras
                ? 'Ocultar dirección y correo'
                : 'Agregar dirección o correo (opcional)'}
            </span>
          </button>

          {showExtras && (
            <div className="grid grid-cols-1 gap-3 mt-2.5 pt-2.5 border-t border-slate-100 animate-in fade-in duration-150">
              <div>
                <label
                  htmlFor="quick-client-address"
                  className="text-xs font-semibold text-slate-600 block mb-1"
                >
                  Dirección
                </label>
                <input
                  id="quick-client-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Sector Centro, Av. Bolívar"
                  className="w-full bg-[#F6F8FA] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#111827] border border-slate-200/70 focus:border-[#074E4A] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="quick-client-email"
                  className="text-xs font-semibold text-slate-600 block mb-1"
                >
                  Correo Electrónico
                </label>
                <input
                  id="quick-client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full bg-[#F6F8FA] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#111827] border border-slate-200/70 focus:border-[#074E4A] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-[#F4F6F8] hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="py-2.5 px-4 rounded-xl bg-[#074E4A] hover:bg-[#053E3B] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar y Seleccionar'}
          </button>
        </div>
      </form>
    </div>
  );
}
