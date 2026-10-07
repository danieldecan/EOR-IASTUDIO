import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Building2, Globe, Key, AlertCircle } from 'lucide-react';
import { User, Cliente, ALL_COUNTRIES, RoleDefinition } from '../types';
import { api } from '../api';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  currentUser: User;
  clientes: Cliente[];
  roles: RoleDefinition[];
  onUserUpdated: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  currentUser,
  clientes,
  roles,
  onUserUpdated
}) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState<'Activo' | 'Suspendido'>('Activo');
  const [clienteId, setClienteId] = useState<string>('');
  const [pais, setPais] = useState<string>('');
  const [paisesAsignados, setPaisesAsignados] = useState<string[]>([]);
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre || '');
      setCorreo(userToEdit.correo || '');
      setRol(userToEdit.rol || 'cliente');
      setEstado(userToEdit.estado === 'Suspendido' ? 'Suspendido' : 'Activo');
      setClienteId(userToEdit.clienteId || '');
      const userPais = (userToEdit as any).pais || '';
      setPais(userPais);
      setPaisesAsignados((userToEdit as any).paisesAsignados || (userPais && userPais !== 'Regional' ? [userPais] : ['México', 'Colombia']));
      setContrasena('');
      setError(null);
    }
  }, [userToEdit]);

  if (!isOpen || !userToEdit) return null;

  const isProtectedAdmin = 
    userToEdit.correo.toLowerCase() === 'administrador-eor-peo@grupostt.com' ||
    userToEdit.correo.toLowerCase() === 'daniel.decan@nominasaps.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (!correo.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isRegional = pais === 'Regional';
      const payload: any = {
        nombre: nombre.trim(),
        rol,
        estado,
        clienteId: rol === 'cliente' ? (clienteId || undefined) : undefined,
        pais: isRegional ? 'Regional' : (pais || undefined),
        paisesAsignados: (rol === 'administrador' || rol === 'supracliente' || rol === 'asesor_comercial' || rol === 'asesor')
          ? (paisesAsignados.length > 0 ? paisesAsignados : [...ALL_COUNTRIES])
          : (isRegional ? (paisesAsignados.length > 0 ? paisesAsignados : ['México']) : (pais ? [pais] : undefined)),
        usuario: currentUser.correo,
        motivo: 'Edición de usuario desde panel de administración'
      };

      if (correo.trim().toLowerCase() !== userToEdit.correo.toLowerCase()) {
        payload.nuevoCorreo = correo.trim().toLowerCase();
      }

      if (contrasena.trim()) {
        payload.contrasena = contrasena.trim();
      }

      await api.updateUsuario(userToEdit.correo, payload);
      onUserUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      setError(err.message || 'Error al actualizar el usuario. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Editar Usuario</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{userToEdit.correo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {isProtectedAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-2 text-amber-800 text-[11px]">
              <Shield className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Esta es una cuenta administrativa principal protegida del sistema.</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              disabled={isProtectedAdmin}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl font-medium ${
                isProtectedAdmin
                  ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Rol del Usuario <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isProtectedAdmin}
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-xl font-semibold ${
                  isProtectedAdmin
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none'
                }`}
              >
                {roles && roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="administrador">Administrador EOR</option>
                    <option value="asesor_comercial">Asesor Comercial</option>
                    <option value="tesoreria">Tesoreria / Cuentas</option>
                    <option value="cliente">Cliente (Empresa)</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Estado de la Cuenta
              </label>
              <select
                disabled={isProtectedAdmin}
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className={`w-full px-3 py-2.5 border rounded-xl font-semibold ${
                  isProtectedAdmin
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none'
                }`}
              >
                <option value="Activo">Activo</option>
                <option value="Suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Empresa cliente (si rol es cliente o supracliente) */}
          {(rol === 'cliente' || rol === 'supracliente') && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                {rol === 'supracliente' ? 'Empresa Holding / Supra Propietaria Vinculada' : 'Empresa Cliente Vinculada'}
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none font-medium"
              >
                <option value="">-- Sin vincular / Acceso Global --</option>
                {clientes
                  .filter(c => {
                    const emp = (c.empresa || '').toLowerCase();
                    return !emp.includes('jose andres') && !emp.includes('henao');
                  })
                  .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa} ({c.id} - {c.pais})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* País asignado */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                País Asignado / Alcance Operativo
              </span>
              {pais === 'Regional' && (
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  {paisesAsignados.length} seleccionados
                </span>
              )}
            </label>
            <select
              value={pais}
              onChange={(e) => {
                const val = e.target.value;
                setPais(val);
                if (val === 'Regional' && paisesAsignados.length === 0) {
                  setPaisesAsignados(['México', 'Colombia']);
                }
              }}
              className={`w-full px-3 py-2.5 border rounded-xl font-bold transition-all ${
                pais === 'Regional' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 ring-1 ring-indigo-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none'
              }`}
            >
              <option value="">-- Sin país específico / Acceso Global --</option>
              <option value="Regional" className="font-bold text-indigo-700">
                🌎 Regional (Multi-país LATAM)
              </option>
              <optgroup label="Países Individuales">
                {ALL_COUNTRIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Despliegue de selección de países para operación regional */}
          {pais === 'Regional' && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                  Países Asignados ({paisesAsignados.length})
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaisesAsignados([...ALL_COUNTRIES])}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    ✓ Todos (18)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaisesAsignados([])}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-indigo-100">
                {ALL_COUNTRIES.map((c) => {
                  const isSel = paisesAsignados.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        if (isSel) setPaisesAsignados(paisesAsignados.filter(p => p !== c));
                        else setPaisesAsignados([...paisesAsignados, c]);
                      }}
                      className={`text-[10px] p-1.5 rounded-lg text-left flex items-center justify-between border cursor-pointer select-none transition-all ${
                        isSel
                          ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span className="truncate">{c}</span>
                      {isSel && <span className="text-[8px] ml-1 font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nueva Contraseña (opcional) */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              Asignar Nueva Contraseña (Opcional)
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Dejar en blanco para conservar la actual"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default UserEditModal;
