import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Copy, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  Users, 
  Layers, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  Settings2,
  ChevronRight,
  Info
} from 'lucide-react';
import { RoleDefinition, User, Language } from '../types';
import { ALL_MENU_OPTIONS, ALL_MENU_IDS, DEFAULT_ROLES_CONFIG } from '../data/menuOptions';
import { api } from '../api';

interface Props {
  roles: RoleDefinition[];
  usuarios: User[];
  currentUser: User;
  lang: Language;
  onRolesChange: () => void;
}

export default function RolesManagementPanel({
  roles,
  usuarios,
  currentUser,
  lang,
  onRolesChange
}: Props) {
  const [searchFilter, setSearchFilter] = useState('');
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [copyingFromRole, setCopyingFromRole] = useState<RoleDefinition | null>(null);
  const [copyNewName, setCopyNewName] = useState('');

  // Form states for creating / editing
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMenuOptions, setFormMenuOptions] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Grouped menu options for easy display
  const menuCategories = Array.from(new Set(ALL_MENU_OPTIONS.map(o => o.categoria)));

  const handleOpenEdit = (role: RoleDefinition) => {
    setEditingRole(role);
    setIsCreatingNew(false);
    setFormName(role.nombre);
    setFormDescription(role.descripcion || '');
    setFormMenuOptions(role.id === 'administrador' ? [...ALL_MENU_IDS] : [...role.opcionesMenu]);
    setFormError('');
    setFormSuccess('');
  };

  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormMenuOptions(['kpis', 'solicitudes', 'clientes']);
    setFormError('');
    setFormSuccess('');
  };

  const handleOpenCopy = (role: RoleDefinition) => {
    setCopyingFromRole(role);
    setCopyNewName(`Copia de ${role.nombre}`);
    setFormError('');
  };

  const handleConfirmCopy = async () => {
    if (!copyingFromRole) return;
    if (!copyNewName.trim()) {
      setFormError('Ingresa un nombre para el nuevo rol.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const nuevo = await api.copiarRol(copyingFromRole.id, copyNewName.trim());
      setCopyingFromRole(null);
      setCopyNewName('');
      onRolesChange();
      // Open the newly created role for immediate customization
      handleOpenEdit(nuevo);
      setFormSuccess(`Rol "${nuevo.nombre}" copiado con éxito. Puedes personalizar sus opciones de menú.`);
    } catch (err: any) {
      setFormError(err.message || 'Error al copiar rol.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMenuOption = (optionId: string) => {
    if (editingRole?.id === 'administrador' || editingRole?.esAdmin) {
      return; // Locked for admin
    }

    setFormMenuOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleSelectAllOptions = () => {
    if (editingRole?.id === 'administrador') return;
    setFormMenuOptions([...ALL_MENU_IDS]);
  };

  const handleDeselectAllOptions = () => {
    if (editingRole?.id === 'administrador') return;
    setFormMenuOptions([]);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El nombre del rol es obligatorio.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (isCreatingNew) {
        await api.createRol({
          nombre: formName.trim(),
          descripcion: formDescription.trim(),
          opcionesMenu: formMenuOptions
        });
        setFormSuccess('Nuevo rol creado exitosamente.');
      } else if (editingRole) {
        await api.updateRol(editingRole.id, {
          nombre: editingRole.esSistema ? editingRole.nombre : formName.trim(),
          descripcion: formDescription.trim(),
          opcionesMenu: editingRole.id === 'administrador' ? ALL_MENU_IDS : formMenuOptions
        });
        setFormSuccess('Rol y permisos de menú actualizados con éxito.');
      }

      onRolesChange();
      setTimeout(() => {
        setEditingRole(null);
        setIsCreatingNew(false);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar rol.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (role: RoleDefinition) => {
    if (role.esSistema || ['administrador', 'asesor_comercial', 'ejecutivo_cuentas', 'cliente', 'tesoreria'].includes(role.id)) {
      alert('No es posible eliminar los roles base del sistema.');
      return;
    }

    const assignedCount = usuarios.filter(u => u.rol === role.id || u.rol === role.nombre).length;
    if (assignedCount > 0) {
      alert(`No se puede eliminar este rol porque tiene ${assignedCount} usuario(s) asignado(s). Reasigna los usuarios a otro rol primero.`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el rol "${role.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.deleteRol(role.id);
      onRolesChange();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar rol.');
    }
  };

  const filteredRoles = roles.filter(r => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return r.nombre.toLowerCase().includes(q) || (r.descripcion && r.descripcion.toLowerCase().includes(q));
  });

  return (
    <div id="roles-management-panel" className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-sm border border-indigo-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold tracking-tight">Matriz de Roles y Visibilidad de Menú</h3>
          </div>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl font-medium">
            Define qué opciones y módulos del sistema puede ver cada rol. Puedes crear nuevos roles, duplicar existentes y ocultar opciones de menú para todos los roles menos para Administrador.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear Nuevo Rol</span>
        </button>
      </div>

      {/* Search and Info bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-medium">
            Total de roles configurados: <strong className="text-slate-900">{roles.length}</strong> (5 roles base del sistema + {roles.filter(r => !r.esSistema).length} personalizados).
          </span>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar rol por nombre o descripción..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map(role => {
          const userCount = usuarios.filter(u => u.rol === role.id || u.rol === role.nombre).length;
          const isAdmin = role.id === 'administrador' || role.esAdmin;
          const visibleCount = isAdmin ? ALL_MENU_IDS.length : role.opcionesMenu.length;
          const totalCount = ALL_MENU_IDS.length;
          const isCoreSystem = ['administrador', 'asesor_comercial', 'ejecutivo_cuentas', 'cliente', 'tesoreria'].includes(role.id);

          return (
            <div
              key={role.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                isAdmin 
                  ? 'border-indigo-200 ring-1 ring-indigo-100 bg-gradient-to-b from-indigo-50/20 to-white' 
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isAdmin 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : isCoreSystem 
                        ? 'bg-slate-100 text-slate-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isAdmin ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{role.nombre}</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {role.id}</span>
                    </div>
                  </div>

                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      <Lock className="w-2.5 h-2.5" /> Menú Completo
                    </span>
                  ) : isCoreSystem ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Rol Principal
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Personalizado
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-4 min-h-[38px] line-clamp-2">
                  {role.descripcion || 'Sin descripción detallada.'}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Usuarios Asignados</span>
                    <div className="flex items-center space-x-1.5 font-extrabold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{userCount} cuenta{userCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Opciones de Menú</span>
                    <div className="flex items-center space-x-1.5 font-extrabold text-indigo-700">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{visibleCount} de {totalCount}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar of visible menu options */}
                <div className="mb-4">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isAdmin ? 'bg-indigo-600 w-full' : 'bg-emerald-500'
                      }`}
                      style={{ width: isAdmin ? '100%' : `${Math.round((visibleCount / totalCount) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                    <span>Visibilidad: {Math.round((visibleCount / totalCount) * 100)}% del sistema</span>
                    {isAdmin && <span className="text-indigo-600 font-bold">🔒 No editable</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => handleOpenEdit(role)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    isAdmin
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>{isAdmin ? 'Ver Menú (Fijo)' : 'Configurar Menú'}</span>
                </button>

                <button
                  onClick={() => handleOpenCopy(role)}
                  className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  title={`Copiar rol "${role.nombre}" para crear uno nuevo`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {!isCoreSystem && (
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="p-1.5 rounded-xl text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
                    title="Eliminar este rol personalizado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CONFIGURAR PERMISOS / CREAR ROL */}
      {(editingRole || isCreatingNew) && (
        <div id="modal-role-permissions" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col my-8 max-h-[90vh]">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  {isCreatingNew ? <Plus className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {isCreatingNew 
                      ? 'Crear Nuevo Rol de Acceso' 
                      : `Configuración de Menú: ${editingRole?.nombre}`
                    }
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {editingRole?.id === 'administrador'
                      ? 'El rol Administrador cuenta con acceso total inmutable a todas las opciones del menú.'
                      : 'Selecciona las opciones que estarán visibles en el menú lateral para los usuarios con este rol.'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setEditingRole(null); setIsCreatingNew(false); }}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 overflow-y-auto space-y-5 text-left flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Informative banner for Admin role */}
              {editingRole?.id === 'administrador' && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-extrabold block">Acceso Total Obligatorio para Administrador</span>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Por regla de seguridad, el rol Administrador no puede tener opciones de menú ocultas. Si requieres un rol administrativo con menú restringido, utiliza la opción <strong>"Copiar Rol"</strong> para crear una variante personalizada.
                    </p>
                  </div>
                </div>
              )}

              {/* Basic Role Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nombre del Rol <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.esSistema}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Ejecutivo de Expansión"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none disabled:opacity-60"
                  />
                  {editingRole?.esSistema && (
                    <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                      El nombre de los roles base del sistema está protegido.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Descripción del Alcance
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Breve resumen de responsabilidades..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Options selection toolbar */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Opciones de Menú Visibles ({formMenuOptions.length} seleccionadas)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Marca las casillas que deseas mostrar y desmarca las que quieras ocultar en el menú lateral.
                  </p>
                </div>

                {editingRole?.id !== 'administrador' && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllOptions}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      Mostrar Todo
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllOptions}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      Ocultar Todo
                    </button>
                  </div>
                )}
              </div>

              {/* Categorized menu checkboxes */}
              <div className="space-y-4">
                {menuCategories.map(cat => {
                  const optionsInCat = ALL_MENU_OPTIONS.filter(o => o.categoria === cat);
                  const selectedInCat = optionsInCat.filter(o => formMenuOptions.includes(o.id)).length;

                  return (
                    <div key={cat} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
                      <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-200/60">
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                          <span>{cat}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {selectedInCat} de {optionsInCat.length} visibles
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {optionsInCat.map(option => {
                          const isChecked = editingRole?.id === 'administrador' ? true : formMenuOptions.includes(option.id);
                          const isLockedAdmin = editingRole?.id === 'administrador';

                          return (
                            <label
                              key={option.id}
                              className={`flex items-start space-x-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                isChecked 
                                  ? 'bg-white border-indigo-200 shadow-2xs' 
                                  : 'bg-white/40 border-slate-200 opacity-60 hover:opacity-100'
                              } ${isLockedAdmin ? 'cursor-not-allowed' : ''}`}
                            >
                              <input
                                type="checkbox"
                                disabled={isLockedAdmin}
                                checked={isChecked}
                                onChange={() => handleToggleMenuOption(option.id)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 flex items-center justify-between text-[11px]">
                                  <span>{option.etiqueta}</span>
                                  {isChecked ? (
                                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                      <Eye className="w-2.5 h-2.5" /> Visible
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                      <EyeOff className="w-2.5 h-2.5" /> Oculto
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">
                                  {option.descripcion}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setEditingRole(null); setIsCreatingNew(false); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCreatingNew ? 'Crear Rol' : 'Guardar Cambios de Menú'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COPIAR ROL */}
      {copyingFromRole && (
        <div id="modal-copy-role" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">Copiar Rol Existente</h3>
              </div>
              <button
                onClick={() => setCopyingFromRole(null)}
                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-slate-600">
                Crea un nuevo rol duplicando las <strong>{copyingFromRole.opcionesMenu.length} opciones de menú</strong> del rol <strong>{copyingFromRole.nombre}</strong>. Podrás personalizarlo inmediatamente.
              </p>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre del Nuevo Rol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={copyNewName}
                  onChange={(e) => setCopyNewName(e.target.value)}
                  placeholder="Ej: Asesor Senior México"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCopyingFromRole(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmCopy}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Copiando...' : 'Crear y Personalizar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
