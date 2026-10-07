import React, { useState, useEffect, useMemo } from 'react';
import { 
  Percent, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Globe, 
  Scale, 
  BookOpen, 
  Info, 
  X, 
  RefreshCw,
  FileSpreadsheet,
  Check,
  Calendar,
  UserCheck
} from 'lucide-react';
import { ReglaTributariaIvaWht, User } from '../types';
import { api } from '../api';

interface IvaWhtRentaMasterProps {
  user: User;
  lang?: 'es' | 'en' | 'pt';
  readOnly?: boolean;
}

export default function IvaWhtRentaMaster({ user, lang = 'es', readOnly = false }: IvaWhtRentaMasterProps) {
  const [reglas, setReglas] = useState<ReglaTributariaIvaWht[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search per Country
  const [selectedPaisFilter, setSelectedPaisFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos');

  // Modals
  const [showDetailModal, setShowDetailModal] = useState<ReglaTributariaIvaWht | null>(null);
  const [showEditModal, setShowEditModal] = useState<ReglaTributariaIvaWht | 'new' | null>(null);

  // Form State for Maintenance
  const [formData, setFormData] = useState<Partial<ReglaTributariaIvaWht>>({
    pais: 'Colombia',
    sociedadFacturadora: 'STT Colombia S.A.S.',
    tipoFacturacion: 'Ambas',
    ivaGeneralPct: 19,
    ivaEorExportacionPct: 0,
    whtRetencionPct: 4,
    rentaIsrPct: 35,
    asuncionWht: 'Gross-Up (A cargo de Cliente)',
    baseCalculoIva: 'Solo Fee EOR',
    baseCalculoWht: 'Solo Fee EOR',
    tratadoDobleImposicion: 'Decisión 578 CAN / Convenios vigentes',
    fundamentoLegal: 'Estatuto Tributario Arts. 392, 408 y 481',
    certificadoRequerido: 'Certificado de Retención en la Fuente Formulario 220 DIAN / RUT',
    notas: 'Servicios de exportación exentos de IVA con constancia de uso exclusivo en el exterior.',
    estado: 'Vigente'
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadReglas();
  }, []);

  const loadReglas = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getReglasTributarias();
      setReglas(data || []);
    } catch (err: any) {
      console.error('Error al cargar reglas tributarias:', err);
      setError(err.message || 'No fue posible cargar el catálogo de impuestos.');
    } finally {
      setLoading(false);
    }
  };

  // Distinct country list for filter
  const distinctPaises = useMemo(() => {
    const list = Array.from(new Set(reglas.map(r => r.pais).filter(Boolean)));
    return list.sort();
  }, [reglas]);

  // Filtered rules strictly based on Country and status
  const filteredReglas = useMemo(() => {
    return reglas.filter(r => {
      // Country filter
      if (selectedPaisFilter !== 'Todos' && r.pais !== selectedPaisFilter) {
        return false;
      }
      // Status filter
      if (estadoFilter !== 'Todos' && r.estado !== estadoFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCountry = r.pais.toLowerCase().includes(query);
        const matchesSociety = r.sociedadFacturadora.toLowerCase().includes(query);
        const matchesLegal = (r.fundamentoLegal || '').toLowerCase().includes(query);
        const matchesTreaty = (r.tratadoDobleImposicion || '').toLowerCase().includes(query);
        if (!matchesCountry && !matchesSociety && !matchesLegal && !matchesTreaty) {
          return false;
        }
      }
      return true;
    });
  }, [reglas, selectedPaisFilter, estadoFilter, searchQuery]);

  const handleOpenEdit = (regla: ReglaTributariaIvaWht | 'new') => {
    if (readOnly) return;
    setFormError('');
    if (regla === 'new') {
      setFormData({
        pais: selectedPaisFilter !== 'Todos' ? selectedPaisFilter : 'México',
        sociedadFacturadora: 'STT México S.A. de C.V.',
        tipoFacturacion: 'Ambas',
        ivaGeneralPct: 16,
        ivaEorExportacionPct: 0,
        whtRetencionPct: 10,
        rentaIsrPct: 30,
        asuncionWht: 'Gross-Up (A cargo de Cliente)',
        baseCalculoIva: 'Solo Fee EOR',
        baseCalculoWht: 'Solo Fee EOR',
        tratadoDobleImposicion: 'Convenio de Doble Imposición México - Panamá',
        fundamentoLegal: 'Ley del Impuesto sobre la Renta (LISR) y Ley del IVA Art. 29',
        certificadoRequerido: 'Constancia de Situación Fiscal (CSF) SAT y Forma 36',
        notas: '',
        estado: 'Vigente'
      });
    } else {
      setFormData({ ...regla });
    }
    setShowEditModal(regla);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!formData.pais || !formData.sociedadFacturadora) {
      setFormError('Por favor complete el País y la Sociedad Facturadora.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError('');
      if (showEditModal === 'new') {
        const payload = {
          ...formData,
          usuario: user.correo,
          fechaActualizacion: new Date().toISOString().slice(0, 10),
          usuarioActualizacion: user.correo
        };
        await api.createReglaTributaria(payload);
        setSuccessMsg(`Impuestos para ${formData.pais} creados exitosamente.`);
      } else if (typeof showEditModal === 'object' && showEditModal?.id) {
        const payload = {
          ...formData,
          usuario: user.correo,
          motivo: `Actualización de IVA y WHT para ${formData.pais}`,
          fechaActualizacion: new Date().toISOString().slice(0, 10),
          usuarioActualizacion: user.correo
        };
        await api.updateReglaTributaria(showEditModal.id, payload);
        setSuccessMsg(`Impuestos de ${formData.pais} actualizados exitosamente.`);
      }
      await loadReglas();
      setShowEditModal(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error al guardar impuestos por país:', err);
      setFormError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (regla: ReglaTributariaIvaWht) => {
    if (readOnly) return;
    if (!window.confirm(`¿Está seguro de eliminar la configuración tributaria de ${regla.pais}?`)) {
      return;
    }
    try {
      setLoading(true);
      await api.deleteReglaTributaria(regla.id, user.correo);
      setSuccessMsg(`Registro de ${regla.pais} eliminado exitosamente.`);
      await loadReglas();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error al eliminar registro:', err);
      setError(err.message || 'No fue posible eliminar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (reglas.length === 0) return;
    const headers = [
      'ID',
      'País',
      'Sociedad Facturadora',
      'Tipo Facturación',
      'IVA General (%)',
      'IVA Exportación EOR (%)',
      'WHT Retención (%)',
      'Renta ISR (%)',
      'Base Cálculo IVA',
      'Base Cálculo WHT',
      'Tratado Doble Imposición',
      'Fundamento Legal',
      'Certificado Requerido',
      'Estado',
      'Última Actualización',
      'Usuario'
    ];

    const rows = filteredReglas.map(r => [
      `"${r.id}"`,
      `"${r.pais}"`,
      `"${r.sociedadFacturadora}"`,
      `"${r.tipoFacturacion}"`,
      r.ivaGeneralPct,
      r.ivaEorExportacionPct,
      r.whtRetencionPct,
      r.rentaIsrPct,
      `"${r.baseCalculoIva}"`,
      `"${r.baseCalculoWht}"`,
      `"${r.tratadoDobleImposicion?.replace(/"/g, '""') || ''}"`,
      `"${r.fundamentoLegal?.replace(/"/g, '""') || ''}"`,
      `"${r.certificadoRequerido?.replace(/"/g, '""') || ''}"`,
      `"${r.estado}"`,
      `"${r.fechaActualizacion || ''}"`,
      `"${r.usuarioActualizacion || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mantenimiento_Impuestos_IVA_WHT_${selectedPaisFilter !== 'Todos' ? selectedPaisFilter : 'Todos_Paises'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="iva-wht-maintenance-container" className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200/50">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Mantenimiento de Impuestos por País (IVA y WHT)
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Gestión centralizada de tasas de IVA, retención en la fuente (WHT), renta y fundamentos tributarios por jurisdicción.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReglas}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Recargar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          {!readOnly && (
            <button
              onClick={() => handleOpenEdit('new')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center space-x-2 shadow-sm shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo País / Regla</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Country Filter Quick Bar & Search */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Country Dropdown / Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 mr-1">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Filtrar por País:</span>
            </span>

            <select
              value={selectedPaisFilter}
              onChange={(e) => setSelectedPaisFilter(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">🌍 Todos los Países ({reglas.length})</option>
              {distinctPaises.map((pais) => (
                <option key={pais} value={pais}>
                  {pais} ({reglas.filter(r => r.pais === pais).length})
                </option>
              ))}
            </select>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Vigente">Vigente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por país, sociedad o ley..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Country Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Accesos rápidos:</span>
          <button
            onClick={() => setSelectedPaisFilter('Todos')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              selectedPaisFilter === 'Todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({reglas.length})
          </button>
          {distinctPaises.map((pais) => (
            <button
              key={pais}
              onClick={() => setSelectedPaisFilter(pais)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedPaisFilter === pais
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pais}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table for Tax Maintenance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Registros de Impuestos por País ({filteredReglas.length})
            </span>
            {selectedPaisFilter !== 'Todos' && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-800 rounded-md">
                País: {selectedPaisFilter}
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {readOnly ? 'Modo Consulta (Solo Lectura)' : 'Modo Administrador (Edición Habilitada)'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs font-bold">Cargando catálogo de impuestos por país...</p>
          </div>
        ) : filteredReglas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Globe className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No se encontraron registros de impuestos</p>
            <p className="text-xs text-slate-400">Intente cambiar los filtros de país o agregar un nuevo registro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-black text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">País</th>
                  <th className="py-3.5 px-4">Sociedad Facturadora</th>
                  <th className="py-3.5 px-4 text-center">IVA General</th>
                  <th className="py-3.5 px-4 text-center">IVA Exportación</th>
                  <th className="py-3.5 px-4 text-center">WHT (Retención)</th>
                  <th className="py-3.5 px-4 text-center">Renta (ISR)</th>
                  <th className="py-3.5 px-4">Base Cálculo WHT</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                {filteredReglas.map((regla) => (
                  <tr key={regla.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* País */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-black text-[11px] border border-indigo-100">
                          {regla.pais.slice(0, 3).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-900">{regla.pais}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{regla.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Sociedad Facturadora */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="max-w-[230px] truncate" title={regla.sociedadFacturadora}>
                        <p className="text-xs font-bold text-slate-800 truncate">{regla.sociedadFacturadora}</p>
                        <span className="text-[10px] text-slate-400">{regla.tipoFacturacion}</span>
                      </div>
                    </td>

                    {/* IVA General */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 text-xs font-extrabold bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                        {regla.ivaGeneralPct}%
                      </span>
                    </td>

                    {/* IVA Exportación */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 text-xs font-extrabold rounded-lg border ${
                        regla.ivaEorExportacionPct === 0 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {regla.ivaEorExportacionPct}%
                      </span>
                    </td>

                    {/* WHT Retención */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 text-xs font-extrabold bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                        {regla.whtRetencionPct}%
                      </span>
                    </td>

                    {/* Renta ISR */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">
                        {regla.rentaIsrPct}%
                      </span>
                    </td>

                    {/* Base Cálculo WHT */}
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <span className="font-semibold text-slate-700">{regla.baseCalculoWht}</span>
                      {regla.asuncionWht && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]" title={regla.asuncionWht}>
                          {regla.asuncionWht}
                        </p>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        regla.estado === 'Vigente'
                          ? 'bg-emerald-100 text-emerald-800'
                          : regla.estado === 'En Revisión'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {regla.estado}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setShowDetailModal(regla)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!readOnly && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(regla)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar tasas de impuestos"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(regla)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: VER DETALLES */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Detalle Tributario: {showDetailModal.pais}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {showDetailModal.sociedadFacturadora} • Código: {showDetailModal.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of Taxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">IVA General</p>
                <p className="text-xl font-black text-blue-900 mt-1">{showDetailModal.ivaGeneralPct}%</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">IVA Exportación / EOR</p>
                <p className="text-xl font-black text-emerald-900 mt-1">{showDetailModal.ivaEorExportacionPct}%</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">WHT (Retención)</p>
                <p className="text-xl font-black text-amber-900 mt-1">{showDetailModal.whtRetencionPct}%</p>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center">
                <p className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Renta / ISR</p>
                <p className="text-xl font-black text-slate-900 mt-1">{showDetailModal.rentaIsrPct}%</p>
              </div>
            </div>

            {/* Bases y Parámetros */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Tipo de Facturación:</span>
                <span className="font-extrabold text-slate-900">{showDetailModal.tipoFacturacion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Base de Cálculo de IVA:</span>
                <span className="font-extrabold text-slate-900">{showDetailModal.baseCalculoIva}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Base de Cálculo de WHT:</span>
                <span className="font-extrabold text-slate-900">{showDetailModal.baseCalculoWht}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-bold">Asunción de WHT:</span>
                <span className="font-extrabold text-slate-900">{showDetailModal.asuncionWht}</span>
              </div>
            </div>

            {/* Legal & Tratados */}
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tratados de Doble Imposición (CDI / CAN / Bilateral):</span>
                </p>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  {showDetailModal.tratadoDobleImposicion || 'No especificado'}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fundamento Legal / Artículos Aplicables:</span>
                </p>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  {showDetailModal.fundamentoLegal || 'No especificado'}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Certificado Fiscal Exigido:</span>
                </p>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  {showDetailModal.certificadoRequerido || 'No especificado'}
                </p>
              </div>

              {showDetailModal.notas && (
                <div>
                  <p className="font-bold text-slate-700 flex items-center space-x-1.5 mb-1">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Notas Operativas:</span>
                  </p>
                  <p className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-amber-900 font-medium">
                    {showDetailModal.notas}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-[11px] text-slate-400">
              <span>Actualizado el: {showDetailModal.fechaActualizacion || 'N/A'} por {showDetailModal.usuarioActualizacion || 'Admin'}</span>
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR MANTENIMIENTO */}
      {showEditModal && !readOnly && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form 
            onSubmit={handleSaveForm}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {showEditModal === 'new' ? 'Registrar Impuestos por País' : `Editar Impuestos: ${formData.pais}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Mantenimiento de tasas de IVA, Retención (WHT) y Renta por país.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Country & Society */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">País *</label>
                <input
                  type="text"
                  required
                  value={formData.pais || ''}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  placeholder="Ej: Colombia, México, Panamá"
                  className="w-full px-3.5 py-2 font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sociedad Facturadora *</label>
                <input
                  type="text"
                  required
                  value={formData.sociedadFacturadora || ''}
                  onChange={(e) => setFormData({ ...formData, sociedadFacturadora: e.target.value })}
                  placeholder="Ej: STT Colombia S.A.S."
                  className="w-full px-3.5 py-2 font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Tax Percentages Grid */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Tasas de Impuestos y Retenciones (%)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-blue-800 mb-1">IVA General (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.ivaGeneralPct ?? 0}
                    onChange={(e) => setFormData({ ...formData, ivaGeneralPct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-black text-blue-900 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">IVA Exportación (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.ivaEorExportacionPct ?? 0}
                    onChange={(e) => setFormData({ ...formData, ivaEorExportacionPct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-black text-emerald-900 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-800 mb-1">WHT Retención (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.whtRetencionPct ?? 0}
                    onChange={(e) => setFormData({ ...formData, whtRetencionPct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-black text-amber-900 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Renta / ISR (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.rentaIsrPct ?? 0}
                    onChange={(e) => setFormData({ ...formData, rentaIsrPct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 font-black text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Bases and Operational Conditions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Cálculo IVA</label>
                <select
                  value={formData.baseCalculoIva}
                  onChange={(e) => setFormData({ ...formData, baseCalculoIva: e.target.value as any })}
                  className="w-full px-3 py-2 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Solo Fee EOR">Solo Fee EOR</option>
                  <option value="Fee + Reembolsos">Fee + Reembolsos</option>
                  <option value="Nómina Total + Fee">Nómina Total + Fee</option>
                  <option value="No Aplica">No Aplica</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Cálculo WHT</label>
                <select
                  value={formData.baseCalculoWht}
                  onChange={(e) => setFormData({ ...formData, baseCalculoWht: e.target.value as any })}
                  className="w-full px-3 py-2 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Solo Fee EOR">Solo Fee EOR</option>
                  <option value="Total Facturado">Total Facturado</option>
                  <option value="No Aplica">No Aplica</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  className="w-full px-3 py-2 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Vigente">Vigente</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Legal details */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tratado de Doble Imposición (CDI / CAN)</label>
                <input
                  type="text"
                  value={formData.tratadoDobleImposicion || ''}
                  onChange={(e) => setFormData({ ...formData, tratadoDobleImposicion: e.target.value })}
                  placeholder="Ej: Decisión 578 CAN / Convenios bilaterales vigentes"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fundamento Legal / Artículos de Ley</label>
                <input
                  type="text"
                  value={formData.fundamentoLegal || ''}
                  onChange={(e) => setFormData({ ...formData, fundamentoLegal: e.target.value })}
                  placeholder="Ej: Estatuto Tributario Arts. 392, 408 y 481"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Certificado Fiscal Requerido</label>
                <input
                  type="text"
                  value={formData.certificadoRequerido || ''}
                  onChange={(e) => setFormData({ ...formData, certificadoRequerido: e.target.value })}
                  placeholder="Ej: Certificado de Retención Formulario 220 DIAN / RUT"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas Operativas</label>
                <textarea
                  rows={2}
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Instrucciones o especificaciones adicionales..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Impuestos</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
