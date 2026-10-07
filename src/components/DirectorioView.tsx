import React, { useState, useEffect, useMemo } from 'react';
import { DirectorioContacto, User, Language, ALL_COUNTRIES } from '../types';
import { api } from '../api';
import { tr, tText, translateRole, translateStatus } from '../utils/i18n';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Filter, 
  Plus, 
  Edit, 
  Copy, 
  Check, 
  UserCheck, 
  ShieldCheck, 
  Briefcase, 
  List, 
  LayoutGrid, 
  FilterX, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  XCircle,
  Send
} from 'lucide-react';

interface Props {
  user: User;
  lang?: Language;
}

type ViewMode = 'list' | 'grid';
type SortField = 'nombre' | 'pais' | 'tipo' | 'empresaStt' | 'estado';
type SortOrder = 'asc' | 'desc';

export default function DirectorioView({ user, lang = 'es' }: Props) {
  const [directorio, setDirectorio] = useState<DirectorioContacto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedPais, setSelectedPais] = useState<string>('Todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('Todos');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Copy status feedback
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedBatchEmails, setCopiedBatchEmails] = useState<boolean>(false);

  // Modal State for create/edit
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editContact, setEditContact] = useState<DirectorioContacto | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formTipo, setFormTipo] = useState<'Gerente / Coordinador' | 'Ejecutivo de Cuenta' | 'Asesor Comercial'>('Gerente / Coordinador');
  const [formPais, setFormPais] = useState<string>('Colombia');
  const [formEmpresa, setFormEmpresa] = useState<string>('STT Colombia S.A.S.');
  const [formCorreo, setFormCorreo] = useState<string>('');
  const [formTelefono, setFormTelefono] = useState<string>('');
  const [formEstado, setFormEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const canManage = user.rol === 'administrador' || user.rol === 'supracliente';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getDirectorio();
      setDirectorio(data);
    } catch (err) {
      console.error('Error al cargar directorio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (correo: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(correo);
    setCopiedEmail(correo);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyAllFilteredEmails = () => {
    const emails = filteredAndSorted.map(c => c.correo).filter(Boolean);
    if (emails.length === 0) return;
    navigator.clipboard.writeText(emails.join('; '));
    setCopiedBatchEmails(true);
    setTimeout(() => setCopiedBatchEmails(false), 2500);
  };

  const handleOpenModal = (contact?: DirectorioContacto) => {
    setErrorMsg('');
    if (contact) {
      setEditContact(contact);
      setFormNombre(contact.nombre);
      setFormTipo(contact.tipo);
      setFormPais(contact.pais);
      setFormEmpresa(contact.empresaStt || '');
      setFormCorreo(contact.correo);
      setFormTelefono(contact.telefono || '');
      setFormEstado(contact.estado);
    } else {
      setEditContact(null);
      setFormNombre('');
      setFormTipo('Gerente / Coordinador');
      setFormPais('Colombia');
      setFormEmpresa('STT Colombia S.A.S.');
      setFormCorreo('');
      setFormTelefono('');
      setFormEstado('Activo');
    }
    setShowModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre || !formCorreo) {
      setErrorMsg(tr('Nombre y correo corporativo son obligatorios.', 'Name and corporate email are required.', 'Nome e e-mail corporativo são obrigatórios.', lang));
      return;
    }

    try {
      if (editContact) {
        await api.updateDirectorioContacto(editContact.id, {
          nombre: formNombre,
          tipo: formTipo,
          pais: formPais,
          empresaStt: formEmpresa,
          correo: formCorreo,
          telefono: formTelefono,
          estado: formEstado
        });
      } else {
        await api.createDirectorioContacto({
          nombre: formNombre,
          tipo: formTipo,
          pais: formPais,
          empresaStt: formEmpresa,
          correo: formCorreo,
          telefono: formTelefono,
          estado: formEstado
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || tr('Error al guardar el contacto.', 'Error saving contact.', 'Erro ao salvar contato.', lang));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedPais('Todos');
    setSelectedTipo('Todos');
    setSelectedEstado('Todos');
  };

  const isFiltered = search !== '' || selectedPais !== 'Todos' || selectedTipo !== 'Todos' || selectedEstado !== 'Todos';

  // Filtering and Sorting logic
  const filteredAndSorted = useMemo(() => {
    return directorio
      .filter(item => {
        const matchesSearch = 
          item.nombre.toLowerCase().includes(search.toLowerCase()) ||
          item.correo.toLowerCase().includes(search.toLowerCase()) ||
          item.pais.toLowerCase().includes(search.toLowerCase()) ||
          (item.empresaStt && item.empresaStt.toLowerCase().includes(search.toLowerCase())) ||
          (item.telefono && item.telefono.toLowerCase().includes(search.toLowerCase()));
        
        const matchesPais = selectedPais === 'Todos' || item.pais === selectedPais;
        const matchesTipo = selectedTipo === 'Todos' || item.tipo === selectedTipo;
        const matchesEstado = selectedEstado === 'Todos' || item.estado === selectedEstado;

        return matchesSearch && matchesPais && matchesTipo && matchesEstado;
      })
      .sort((a, b) => {
        let valA = (a[sortField] || '').toString().toLowerCase();
        let valB = (b[sortField] || '').toString().toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [directorio, search, selectedPais, selectedTipo, selectedEstado, sortField, sortOrder]);

  const countGerentes = directorio.filter(d => d.tipo === 'Gerente / Coordinador').length;
  const countEjecutivos = directorio.filter(d => d.tipo === 'Ejecutivo de Cuenta').length;
  const countAsesores = directorio.filter(d => d.tipo === 'Asesor Comercial').length;

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600 font-bold" />;
  };

  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'STT';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{tr('Ecosistema de Atención STT', 'STT Service Ecosystem', 'Ecossistema de Atendimento STT', lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {tr('Directorio Institucional de Actores', 'Institutional Directory of Service Actors', 'Diretório Institucional de Atores', lang)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              {tr('Contacto consolidado de Gerentes Regionales, Coordinadores por Filial, Ejecutivos de Cuenta asignados y Asesores Comerciales STT.', 'Consolidated contact directory of Regional Managers, Subsidiary Coordinators, Assigned Account Executives, and Commercial Advisors.', 'Contatos consolidados de Gerentes Regionais, Coordenadores por Filial, Executivos de Contas e Assessores Comerciais STT.', lang)}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {filteredAndSorted.length > 0 && (
              <button
                onClick={handleCopyAllFilteredEmails}
                title={tr('Copiar lista de correos mostrados para envío masivo', 'Copy displayed email list for batch messaging', 'Copiar lista de e-mails exibidos para envio em massa', lang)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 transition-all backdrop-blur-xs border border-white/20 cursor-pointer"
              >
                {copiedBatchEmails ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-extrabold">{tr('¡Correos Copiados!', 'Emails Copied!', 'E-mails Copiados!', lang)}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-300" />
                    <span>{tr('Copiar Correos Lista', 'Copy List Emails', 'Copiar E-mails da Lista', lang)} ({filteredAndSorted.length})</span>
                  </>
                )}
              </button>
            )}

            {canManage && (
              <button
                onClick={() => handleOpenModal()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-900/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{tr('Registrar Nuevo Actor', 'Register New Actor', 'Registrar Novo Ator', lang)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tr('Total Registrados', 'Total Registered', 'Total Registrados', lang)}</span>
            <span className="text-xl font-black text-white font-mono">{directorio.length}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{tr('Gerentes & Coordinadores', 'Managers & Coordinators', 'Gerentes e Coordenadores', lang)}</span>
            <span className="text-xl font-black text-white font-mono">{countGerentes}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">{tr('Ejecutivos de Cuenta', 'Account Executives', 'Executivos de Conta', lang)}</span>
            <span className="text-xl font-black text-white font-mono">{countEjecutivos}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider">{tr('Asesores Comerciales', 'Commercial Advisors', 'Assessores Comerciais', lang)}</span>
            <span className="text-xl font-black text-white font-mono">{countAsesores}</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Top Control Bar: Category Tabs + View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {[
              { id: 'Todos', label: tr('Todos los Actores', 'All Actors', 'Todos os Atores', lang) },
              { id: 'Gerente / Coordinador', label: tr('Gerentes & Coordinadores', 'Managers & Coordinators', 'Gerentes e Coordenadores', lang) },
              { id: 'Ejecutivo de Cuenta', label: tr('Ejecutivos de Cuenta', 'Account Executives', 'Executivos de Conta', lang) },
              { id: 'Asesor Comercial', label: tr('Asesores Comerciales', 'Commercial Advisors', 'Assessores Comerciais', lang) }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTipo(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTipo === tab.id
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle Switch (Lista vs Tarjetas) */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">{tr('Visualización:', 'View:', 'Visualização:', lang)}</span>
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('list')}
                title={tr('Vista en Lista / Tabla', 'List / Table View', 'Exibição em Lista / Tabela', lang)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{tr('Lista', 'List', 'Lista', lang)}</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title={tr('Vista en Tarjetas', 'Cards / Grid View', 'Exibição em Cards', lang)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{tr('Tarjetas', 'Cards', 'Cards', lang)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search, Country & Status Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Search Field */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr('Buscar actor por nombre, correo, teléfono o empresa...', 'Search actor by name, email, phone or company...', 'Buscar ator por nome, e-mail, telefone ou empresa...', lang)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* Country Selector */}
          <div className="lg:col-span-3">
            <select
              value={selectedPais}
              onChange={(e) => setSelectedPais(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="Todos">{tr('Todos los Países', 'All Countries', 'Todos os Países', lang)} ({ALL_COUNTRIES.length})</option>
              {ALL_COUNTRIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="lg:col-span-2">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="Todos">{tr('Todos los Estados', 'All Statuses', 'Todos os Status', lang)}</option>
              <option value="Activo">{tr('Activos', 'Active', 'Ativos', lang)}</option>
              <option value="Inactivo">{tr('Inactivos', 'Inactive', 'Inativos', lang)}</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="lg:col-span-2 flex items-center">
            {isFiltered ? (
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>{tr('Limpiar', 'Clear', 'Limpar', lang)} ({filteredAndSorted.length})</span>
              </button>
            ) : (
              <div className="text-[11px] font-bold text-slate-400 text-center w-full py-1">
                {tr('Mostrando', 'Showing', 'Exibindo', lang)} {filteredAndSorted.length} {tr('contacto(s)', 'contact(s)', 'contato(s)', lang)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Rendering (List vs Grid) */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-bold text-xs">
          {tr('Cargando directorio de actores de servicio STT...', 'Loading STT service actors directory...', 'Carregando diretório de atores de serviço STT...', lang)}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">{tr('No se encontraron contactos en el directorio', 'No contacts found in directory', 'Nenhum contato encontrado no diretório', lang)}</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">{tr('Prueba cambiando los criterios de búsqueda o seleccionando otro país/rol.', 'Try adjusting search criteria or selecting another country/role.', 'Tente alterar os critérios de busca ou selecionar outro país/função.', lang)}</p>
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              {tr('Restablecer Filtros', 'Reset Filters', 'Redefinir Filtros', lang)}
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ================= VISTA LISTA / TABLA COMPACTA ================= */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/60 transition-colors group" onClick={() => handleSort('nombre')}>
                    <div className="flex items-center gap-1.5">
                      <span>{tr('Actor / Contacto', 'Actor / Contact', 'Ator / Contato', lang)}</span>
                      {renderSortIcon('nombre')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/60 transition-colors group" onClick={() => handleSort('tipo')}>
                    <div className="flex items-center gap-1.5">
                      <span>{tr('Rol / Función', 'Role / Function', 'Função / Papel', lang)}</span>
                      {renderSortIcon('tipo')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/60 transition-colors group" onClick={() => handleSort('pais')}>
                    <div className="flex items-center gap-1.5">
                      <span>{tr('País', 'Country', 'País', lang)}</span>
                      {renderSortIcon('pais')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/60 transition-colors group" onClick={() => handleSort('empresaStt')}>
                    <div className="flex items-center gap-1.5">
                      <span>{tr('Empresa / Filial STT', 'STT Subsidiary / Company', 'Empresa / Filial STT', lang)}</span>
                      {renderSortIcon('empresaStt')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">{tr('Correo Corporativo', 'Corporate Email', 'E-mail Corporativo', lang)}</th>
                  <th className="py-3.5 px-4">{tr('Teléfono', 'Phone', 'Telefone', lang)}</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/60 transition-colors group" onClick={() => handleSort('estado')}>
                    <div className="flex items-center gap-1.5">
                      <span>{tr('Estado', 'Status', 'Status', lang)}</span>
                      {renderSortIcon('estado')}
                    </div>
                  </th>
                  {canManage && <th className="py-3.5 px-4 text-right">{tr('Acciones', 'Actions', 'Ações', lang)}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filteredAndSorted.map(contact => {
                  const isGerente = contact.tipo === 'Gerente / Coordinador';
                  const isEjecutivo = contact.tipo === 'Ejecutivo de Cuenta';
                  const isAsesor = contact.tipo === 'Asesor Comercial';

                  return (
                    <tr 
                      key={contact.id} 
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name + Initials */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                            isGerente
                              ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200'
                              : isEjecutivo
                              ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200'
                              : 'bg-amber-100 text-amber-800 ring-2 ring-amber-200'
                          }`}>
                            {getInitials(contact.nombre)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {contact.nombre}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono sm:hidden">
                              {contact.correo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rol Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap ${
                          isGerente 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                            : isEjecutivo 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/80' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}>
                          {isGerente && <ShieldCheck className="w-3 h-3" />}
                          {isEjecutivo && <Briefcase className="w-3 h-3" />}
                          {isAsesor && <UserCheck className="w-3 h-3" />}
                          <span>{tr(contact.tipo, isGerente ? 'Manager / Coordinator' : isEjecutivo ? 'Account Executive' : 'Commercial Advisor', isGerente ? 'Gerente / Coordenador' : isEjecutivo ? 'Executivo de Conta' : 'Assessor Comercial', lang)}</span>
                        </span>
                      </td>

                      {/* Country */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold whitespace-nowrap">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{contact.pais}</span>
                        </span>
                      </td>

                      {/* STT Affiliate Company */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 text-[11px] font-medium flex items-center gap-1 max-w-[180px] truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{contact.empresaStt || 'STT Group'}</span>
                        </span>
                      </td>

                      {/* Corporate Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <a 
                            href={`mailto:${contact.correo}`} 
                            className="font-mono text-[11px] font-semibold text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{contact.correo}</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleCopyEmail(contact.correo, e)}
                            title={tr('Copiar correo', 'Copy email', 'Copiar e-mail', lang)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                          >
                            {copiedEmail === contact.correo ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {contact.telefono ? (
                          <a 
                            href={`tel:${contact.telefono}`} 
                            className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{contact.telefono}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          contact.estado === 'Activo' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${contact.estado === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          <span>{translateStatus(contact.estado, lang)}</span>
                        </span>
                      </td>

                      {/* Manage Actions */}
                      {canManage && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenModal(contact)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{tText('Editar', lang)}</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200/80 text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>{tr('Visualizando', 'Displaying', 'Exibindo', lang)} <strong>{filteredAndSorted.length}</strong> {tr('de', 'of', 'de', lang)} {directorio.length} {tr('actores institucionales', 'institutional actors', 'atores institucionais', lang)}</span>
            <span className="text-[11px] text-slate-400">{tr('Modo Lista Optimizado • Grupo STT', 'Optimized List Mode • STT Group', 'Modo Lista Otimizado • Grupo STT', lang)}</span>
          </div>
        </div>
      ) : (
        /* ================= VISTA TARJETAS / GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map(contact => {
            const isGerente = contact.tipo === 'Gerente / Coordinador';
            const isEjecutivo = contact.tipo === 'Ejecutivo de Cuenta';
            const isAsesor = contact.tipo === 'Asesor Comercial';

            return (
              <div 
                key={contact.id} 
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Badge Strip */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                    isGerente 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : isEjecutivo 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {isGerente && <ShieldCheck className="w-3 h-3" />}
                    {isEjecutivo && <Briefcase className="w-3 h-3" />}
                    {isAsesor && <UserCheck className="w-3 h-3" />}
                    <span>{tr(contact.tipo, isGerente ? 'Manager / Coordinator' : isEjecutivo ? 'Account Executive' : 'Commercial Advisor', isGerente ? 'Gerente / Coordenador' : isEjecutivo ? 'Executivo de Conta' : 'Assessor Comercial', lang)}</span>
                  </span>

                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>{contact.pais}</span>
                  </span>
                </div>

                {/* Main Content */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isGerente
                        ? 'bg-emerald-100 text-emerald-800'
                        : isEjecutivo
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {getInitials(contact.nombre)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {contact.nombre}
                      </h3>
                      {contact.empresaStt && (
                        <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{contact.empresaStt}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2 rounded-xl text-xs transition-colors">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <a 
                          href={`mailto:${contact.correo}`} 
                          className="font-mono text-slate-700 hover:text-indigo-600 truncate text-[11px]"
                        >
                          {contact.correo}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyEmail(contact.correo, e)}
                        title={tr('Copiar correo', 'Copy email', 'Copiar e-mail', lang)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedEmail === contact.correo ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {contact.telefono && (
                      <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 px-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{contact.telefono}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    contact.estado === 'Activo' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${contact.estado === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <span>{translateStatus(contact.estado, lang)}</span>
                  </span>

                  {canManage && (
                    <button
                      onClick={() => handleOpenModal(contact)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 py-1 px-2 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{tText('Editar', lang)}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold">
                  {editContact ? tr('Editar Contacto del Directorio', 'Edit Directory Contact', 'Editar Contato do Diretório', lang) : tr('Nuevo Actor de Servicio', 'New Service Actor', 'Novo Ator de Serviço', lang)}
                </h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{tr('Directorio institucional STT', 'STT institutional directory', 'Diretório institucional STT', lang)}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Nombre Completo *', 'Full Name *', 'Nome Completo *', lang)}</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Maria Elena Alvarez Sanchez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Tipo / Rol *', 'Type / Role *', 'Tipo / Função *', lang)}</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Gerente / Coordinador">{tr('Gerente / Coordinador', 'Manager / Coordinator', 'Gerente / Coordenador', lang)}</option>
                    <option value="Ejecutivo de Cuenta">{tr('Ejecutivo de Cuenta', 'Account Executive', 'Executivo de Conta', lang)}</option>
                    <option value="Asesor Comercial">{tr('Asesor Comercial', 'Commercial Advisor', 'Assessor Comercial', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('País *', 'Country *', 'País *', lang)}</label>
                  <select
                    value={formPais}
                    onChange={(e) => setFormPais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {ALL_COUNTRIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Empresa / Filial STT', 'STT Subsidiary / Company', 'Empresa / Filial STT', lang)}</label>
                <input
                  type="text"
                  value={formEmpresa}
                  onChange={(e) => setFormEmpresa(e.target.value)}
                  placeholder="Ej. STT México S.A. de C.V."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Correo Corporativo *', 'Corporate Email *', 'E-mail Corporativo *', lang)}</label>
                <input
                  type="email"
                  required
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  placeholder="usuario@grupostt.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Teléfono', 'Phone', 'Telefone', lang)}</label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Estado', 'Status', 'Status', lang)}</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Activo">{tr('Activo', 'Active', 'Ativo', lang)}</option>
                    <option value="Inactivo">{tr('Inactivo', 'Inactive', 'Inativo', lang)}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  {tText('Cancelar', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl cursor-pointer shadow-md"
                >
                  {editContact ? tr('Guardar Cambios', 'Save Changes', 'Salvar Alterações', lang) : tr('Registrar Contacto', 'Register Contact', 'Registrar Contato', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
