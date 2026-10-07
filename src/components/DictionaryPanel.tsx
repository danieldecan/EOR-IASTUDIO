import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Traduccion, Language } from '../types';
import { tr } from '../utils/i18n';
import { 
  Languages, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Globe, 
  Save, 
  Filter, 
  Clock, 
  User, 
  Info, 
  AlertCircle 
} from 'lucide-react';

interface DictionaryPanelProps {
  currentUser: any;
  lang?: Language | string;
}

export default function DictionaryPanel({ currentUser, lang = 'es' }: DictionaryPanelProps) {
  const currentLang = (lang as Language) || 'es';
  const [traducciones, setTraducciones] = useState<Traduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating / editing
  const [editingKey, setEditingKey] = useState<Traduccion | null>(null);
  const [isNew, setIsNew] = useState(false);
  
  // New/Edit form fields
  const [formId, setFormId] = useState('');
  const [formEs, setFormEs] = useState('');
  const [formEn, setFormEn] = useState('');
  const [formPt, setFormPt] = useState('');
  const [formModulo, setFormModulo] = useState('General');
  const [formActivo, setFormActivo] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModulo, setSelectedModulo] = useState('All');

  // Load translations
  const loadTraducciones = async () => {
    setLoading(true);
    try {
      const data = await api.getTraducciones();
      setTraducciones(data);
      setError('');
    } catch (err: any) {
      setError(err.message || tr('Error al cargar el diccionario de traducción.', 'Error loading translation dictionary.', 'Erro ao carregar o dicionário de tradução.', currentLang));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTraducciones();
  }, []);

  const handleStartAdd = () => {
    setIsNew(true);
    setFormId('');
    setFormEs('');
    setFormEn('');
    setFormPt('');
    setFormModulo('General');
    setFormActivo(true);
    setEditingKey({
      id: '',
      es: '',
      en: '',
      pt: '',
      modulo: 'General',
      activo: true,
      fechaActualizacion: new Date().toISOString(),
      usuarioResponsable: currentUser?.correo || 'admin'
    });
  };

  const handleStartEdit = (item: Traduccion) => {
    setIsNew(false);
    setFormId(item.id);
    setFormEs(item.es);
    setFormEn(item.en);
    setFormPt(item.pt);
    setFormModulo(item.modulo || 'General');
    setFormActivo(item.activo);
    setEditingKey(item);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim()) {
      setError(tr('El identificador único (ID) es obligatorio.', 'Unique key identifier (ID) is required.', 'O identificador único (ID) é obrigatório.', currentLang));
      return;
    }
    if (!formEs.trim()) {
      setError(tr('La traducción en español (por defecto) es obligatoria.', 'Spanish translation (default) is required.', 'A tradução em espanhol (padrão) é obrigatória.', currentLang));
      return;
    }

    try {
      const payload: Partial<Traduccion> = {
        id: formId.trim(),
        es: formEs.trim(),
        en: formEn.trim(),
        pt: formPt.trim(),
        modulo: formModulo,
        activo: formActivo,
        usuarioResponsable: currentUser?.correo || 'admin'
      };

      if (isNew) {
        // Check duplicate
        if (traducciones.some(t => t.id.toLowerCase() === formId.trim().toLowerCase())) {
          setError(tr(`El ID "${formId}" ya existe en el diccionario.`, `Key ID "${formId}" already exists in the dictionary.`, `O ID "${formId}" já existe no dicionário.`, currentLang));
          return;
        }
        await api.createTraduccion(payload);
        setSuccess(tr('Clave de traducción creada exitosamente.', 'Translation key created successfully.', 'Chave de tradução criada com sucesso.', currentLang));
      } else {
        await api.updateTraduccion(formId, payload);
        setSuccess(tr('Clave de traducción actualizada exitosamente.', 'Translation key updated successfully.', 'Chave de tradução atualizada com sucesso.', currentLang));
      }

      setEditingKey(null);
      await loadTraducciones();
      
      // Auto-clear success message
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || tr('Error al guardar la traducción.', 'Error saving translation.', 'Erro ao salvar a tradução.', currentLang));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(tr('¿Está seguro de que desea eliminar permanentemente esta clave de traducción?', 'Are you sure you want to permanently delete this translation key?', 'Tem certeza de que deseja excluir permanentemente esta chave de tradução?', currentLang))) {
      return;
    }
    try {
      await api.deleteTraduccion(id);
      setSuccess(tr('Clave eliminada exitosamente.', 'Key deleted successfully.', 'Chave excluída com sucesso.', currentLang));
      await loadTraducciones();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || tr('Error al eliminar la clave.', 'Error deleting key.', 'Erro ao excluir a chave.', currentLang));
    }
  };

  const handleToggleActivo = async (item: Traduccion) => {
    try {
      await api.updateTraduccion(item.id, {
        ...item,
        activo: !item.activo,
        usuarioResponsable: currentUser?.correo || 'admin'
      });
      await loadTraducciones();
      setSuccess(tr(
        `Clave "${item.id}" ${!item.activo ? 'activada' : 'desactivada'} correctamente.`,
        `Key "${item.id}" ${!item.activo ? 'activated' : 'deactivated'} successfully.`,
        `Chave "${item.id}" ${!item.activo ? 'ativada' : 'desativada'} com sucesso.`,
        currentLang
      ));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(tr('Error al cambiar el estado.', 'Error changing status.', 'Erro ao alterar o status.', currentLang));
    }
  };

  // Extract unique modules
  const modulos = ['All', ...Array.from(new Set(traducciones.map(t => t.modulo || 'General')))];

  // Filtered translations
  const filteredTranslations = traducciones.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModulo = selectedModulo === 'All' || item.modulo === selectedModulo;

    return matchesSearch && matchesModulo;
  });

  return (
    <div id="dictionary-panel" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Languages className="w-5 h-5 text-indigo-600" />
            <span>{tr('Diccionario de Traducción Multilenguaje', 'Multi-Language Translation Dictionary', 'Dicionário de Tradução Multilíngue', currentLang)}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tr(
              'Administra los textos, botones, etiquetas y placeholders del sistema para Español, Inglés y Portugués de Brasil.',
              'Manage system texts, buttons, labels, and placeholders for Spanish, English, and Brazilian Portuguese.',
              'Gerencie os textos, botões, rótulos e marcadores do sistema para Espanhol, Inglês e Português do Brasil.',
              currentLang
            )}
          </p>
        </div>

        <button
          id="btn-add-translation"
          onClick={handleStartAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Agregar Nueva Clave', 'Add New Key', 'Adicionar Nova Chave', currentLang)}</span>
        </button>
      </div>

      {/* Notification Area */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-800">{tr('Ha ocurrido un error', 'An error occurred', 'Ocorreu um erro', currentLang)}</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-emerald-800">{tr('Operación exitosa', 'Operation successful', 'Operação bem-sucedida', currentLang)}</p>
            <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit / New Modal Form */}
      {editingKey && (
        <div className="m-6 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-inner">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>
              {isNew 
                ? tr('Registrar Nueva Clave de Traducción', 'Register New Translation Key', 'Registrar Nova Chave de Tradução', currentLang) 
                : `${tr('Editar Clave:', 'Edit Key:', 'Editar Chave:', currentLang)} ${editingKey.id}`}
            </span>
          </h3>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {tr('Identificador de Clave (ID)', 'Key Identifier (ID)', 'Identificador da Chave (ID)', currentLang)}
              </label>
              <input
                id="form-trans-id"
                type="text"
                disabled={!isNew}
                required
                placeholder={tr('Ej. menu.dashboard o button.save', 'e.g. menu.dashboard or button.save', 'Ex. menu.dashboard ou button.save', currentLang)}
                value={formId}
                onChange={e => setFormId(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {tr('Usa nomenclatura jerárquica separada por puntos.', 'Use dot-separated hierarchical naming.', 'Use nomenclatura hierárquica separada por pontos.', currentLang)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {tr('Módulo del Sistema', 'System Module', 'Módulo do Sistema', currentLang)}
              </label>
              <select
                id="form-trans-modulo"
                value={formModulo}
                onChange={e => setFormModulo(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Menús">{tr('Menús / Navegación', 'Menus / Navigation', 'Menus / Navegação', currentLang)}</option>
                <option value="Botones">{tr('Botones', 'Buttons', 'Botões', currentLang)}</option>
                <option value="Estados del sistema">{tr('Estados del sistema', 'System States', 'Status do Sistema', currentLang)}</option>
                <option value="Alertas">{tr('Alertas operativas', 'Operational Alerts', 'Alertas Operacionais', currentLang)}</option>
                <option value="Notificaciones">{tr('Notificaciones / Emails', 'Notifications / Emails', 'Notificações / E-mails', currentLang)}</option>
                <option value="General">{tr('General / Global', 'General / Global', 'Geral / Global', currentLang)}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {tr('Texto en Español (Idioma por defecto / Fallback)', 'Text in Spanish (Default / Fallback)', 'Texto em Espanhol (Idioma padrão / Fallback)', currentLang)}
              </label>
              <textarea
                id="form-trans-es"
                required
                rows={2}
                placeholder={tr('Texto en español que se mostrará en la plataforma...', 'Spanish text displayed in platform...', 'Texto em espanhol exibido na plataforma...', currentLang)}
                value={formEs}
                onChange={e => setFormEs(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {tr('Texto en Inglés (English)', 'Text in English', 'Texto em Inglês (English)', currentLang)}
              </label>
              <textarea
                id="form-trans-en"
                rows={2}
                placeholder={tr('English translation...', 'English translation...', 'Tradução em inglês...', currentLang)}
                value={formEn}
                onChange={e => setFormEn(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {tr('Texto en Portugués (Português de Brasil)', 'Text in Portuguese (Brazil)', 'Texto em Português (Brasil)', currentLang)}
              </label>
              <textarea
                id="form-trans-pt"
                rows={2}
                placeholder={tr('Tradução em português brasileiro...', 'Tradução em português brasileiro...', 'Tradução em português brasileiro...', currentLang)}
                value={formPt}
                onChange={e => setFormPt(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 py-2">
              <input
                id="form-trans-activo"
                type="checkbox"
                checked={formActivo}
                onChange={e => setFormActivo(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="form-trans-activo" className="text-xs font-bold text-slate-700 cursor-pointer">
                {tr('Clave de traducción activa (Habilitada en la plataforma)', 'Active translation key (Enabled in platform)', 'Chave de tradução ativa (Habilitada na plataforma)', currentLang)}
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-indigo-100">
              <button
                type="button"
                onClick={() => setEditingKey(null)}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                {tr('Cancelar', 'Cancel', 'Cancelar', currentLang)}
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{tr('Guardar Cambios', 'Save Changes', 'Salvar Alterações', currentLang)}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="trans-search-input"
            type="text"
            placeholder={tr('Buscar por ID, traducción, palabra clave...', 'Search by ID, translation, keyword...', 'Buscar por ID, tradução, palavra-chave...', currentLang)}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">{tr('Módulo:', 'Module:', 'Módulo:', currentLang)}</span>
          <select
            id="trans-modulo-select"
            value={selectedModulo}
            onChange={e => setSelectedModulo(e.target.value)}
            className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
          >
            {modulos.map(m => (
              <option key={m} value={m}>
                {m === 'All' ? tr('Todos los módulos', 'All modules', 'Todos os módulos', currentLang) : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">{tr('Cargando diccionario de traducciones...', 'Loading translation dictionary...', 'Carregando dicionário de traduções...', currentLang)}</p>
        </div>
      ) : filteredTranslations.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">{tr('No se encontraron claves de traducción', 'No translation keys found', 'Nenhuma chave de tradução encontrada', currentLang)}</p>
          <p className="text-xs mt-1 text-slate-400">{tr('Intenta reajustando tus filtros o agrega una nueva clave.', 'Try adjusting your filters or add a new key.', 'Tente ajustar seus filtros ou adicione uma nova chave.', currentLang)}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="py-3 px-4 font-bold">{tr('Identificador (ID)', 'Identifier (ID)', 'Identificador (ID)', currentLang)}</th>
                <th className="py-3 px-4 font-bold">{tr('Módulo', 'Module', 'Módulo', currentLang)}</th>
                <th className="py-3 px-4 font-bold">{tr('Español (ES)', 'Spanish (ES)', 'Espanhol (ES)', currentLang)}</th>
                <th className="py-3 px-4 font-bold">{tr('Inglés (EN)', 'English (EN)', 'Inglês (EN)', currentLang)}</th>
                <th className="py-3 px-4 font-bold">{tr('Portugués (PT)', 'Portuguese (PT)', 'Português (PT)', currentLang)}</th>
                <th className="py-3 px-4 font-bold">{tr('Trazabilidad / Auditoría', 'Audit / Traceability', 'Rastreabilidade / Auditoria', currentLang)}</th>
                <th className="py-3 px-4 text-center font-bold">{tr('Estado', 'Status', 'Status', currentLang)}</th>
                <th className="py-3 px-4 text-right font-bold">{tr('Acciones', 'Actions', 'Ações', currentLang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTranslations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 text-xs transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-800 break-all max-w-[200px]">
                    {item.id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {item.modulo || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[180px] truncate" title={item.es}>
                    {item.es}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate italic" title={item.en}>
                    {item.en || <span className="text-amber-500 font-semibold text-[10px]">{tr('Sin traducción', 'Untranslated', 'Sem tradução', currentLang)}</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate italic" title={item.pt}>
                    {item.pt || <span className="text-amber-500 font-semibold text-[10px]">{tr('Sin traducción', 'Untranslated', 'Sem tradução', currentLang)}</span>}
                  </td>
                  <td className="py-3 px-4 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.usuarioResponsable || tr('Sistema', 'System', 'Sistema', currentLang)}</span>
                    </div>
                    {item.fechaActualizacion && (
                      <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.fechaActualizacion).toLocaleString()}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      id={`toggle-status-${item.id}`}
                      onClick={() => handleToggleActivo(item)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        item.activo 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {item.activo ? tr('Activo', 'Active', 'Ativo', currentLang) : tr('Inactivo', 'Inactive', 'Inativo', currentLang)}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`btn-edit-${item.id}`}
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        title={tr('Editar Clave', 'Edit Key', 'Editar Chave', currentLang)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title={tr('Eliminar Clave', 'Delete Key', 'Excluir Chave', currentLang)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer statistics */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span>{tr('Claves totales:', 'Total keys:', 'Total de chaves:', currentLang)} <strong className="text-slate-700">{traducciones.length}</strong></span>
          <span>{tr('Activas:', 'Active:', 'Ativas:', currentLang)} <strong className="text-emerald-600">{traducciones.filter(t => t.activo).length}</strong></span>
          <span>{tr('Inactivas:', 'Inactive:', 'Inativas:', currentLang)} <strong className="text-slate-600">{traducciones.filter(t => !t.activo).length}</strong></span>
        </div>
        <span>Quick Hire Localization System &copy; 2026</span>
      </div>
    </div>
  );
}
