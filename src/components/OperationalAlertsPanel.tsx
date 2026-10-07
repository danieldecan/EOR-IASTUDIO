import React, { useState, useEffect } from 'react';
import { 
  AlertaOperativa, 
  HistorialAlerta, 
  User, 
  Cliente, 
  Language 
} from '../types';
import { tr, translateStatus } from '../utils/i18n';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  RotateCcw, 
  History, 
  ArrowRight, 
  UserPlus, 
  Check, 
  X, 
  ShieldAlert, 
  BookOpen,
  TrendingUp,
  FileText,
  Mail,
  AlertCircle
} from 'lucide-react';

interface Props {
  user: User;
  lang: Language;
}

const translations = {
  es: {
    title: 'Alertas Operativas y Gestión de Riesgos',
    subtitle: 'Monitoreo en tiempo real de pendientes, vencimientos, bloqueos y acciones críticas en el flujo de EOR.',
    tabAlerts: 'Alertas Activas',
    tabHistory: 'Historial de Trazabilidad',
    searchPlaceholder: 'Buscar alertas por descripción, cliente, entidad...',
    filterType: 'Tipo de Alerta',
    filterPriority: 'Prioridad',
    filterState: 'Estado',
    filterCountry: 'País',
    filterClient: 'Cliente',
    all: 'Todos',
    colAlert: 'Alerta / Descripción',
    colEntity: 'Entidad Relacionada',
    colResponsible: 'Responsable',
    colCreated: 'Fecha Creación',
    colState: 'Estado',
    colPriority: 'Prioridad',
    colActions: 'Acciones',
    noAlerts: 'No se encontraron alertas que coincidan con los filtros.',
    statsTotalOpen: 'Alertas Abiertas',
    statsCritical: 'Riesgos Críticos / Bloqueos',
    statsPreventive: 'Alertas Preventivas',
    statsAvgResolution: 'Resolución Promedio',
    actionManage: 'Iniciar Gestión',
    actionResolve: 'Marcar como Resuelta',
    actionEscalate: 'Escalar Alerta',
    actionClose: 'Cerrar Alerta',
    actionReassign: 'Reasignar Responsable',
    historyTitle: 'Historial de Auditoría de Alertas',
    historyAction: 'Acción',
    historyDate: 'Fecha / Hora',
    historyUser: 'Usuario',
    historyObs: 'Observaciones',
    modalResolveTitle: 'Resolver Alerta Operativa',
    modalEscalateTitle: 'Escalar Alerta Operativa',
    modalReassignTitle: 'Reasignar Alerta Operativa',
    commentsLabel: 'Comentarios / Observaciones obligatorias',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    successMsg: 'Acción realizada con éxito',
    errorMsg: 'Ocurrió un error al procesar la acción'
  },
  en: {
    title: 'Operational Alerts & Risk Management',
    subtitle: 'Real-time monitoring of pending items, due dates, service blocks, and critical actions in the EOR pipeline.',
    tabAlerts: 'Active Alerts',
    tabHistory: 'Traceability Log',
    searchPlaceholder: 'Search alerts by description, client, entity...',
    filterType: 'Alert Type',
    filterPriority: 'Priority',
    filterState: 'State',
    filterCountry: 'Country',
    filterClient: 'Client',
    all: 'All',
    colAlert: 'Alert / Description',
    colEntity: 'Related Entity',
    colResponsible: 'Responsible',
    colCreated: 'Created Date',
    colState: 'State',
    colPriority: 'Priority',
    colActions: 'Actions',
    noAlerts: 'No alerts found matching the current filters.',
    statsTotalOpen: 'Open Alerts',
    statsCritical: 'Critical Risks / Blocks',
    statsPreventive: 'Preventive Alerts',
    statsAvgResolution: 'Avg Resolution Time',
    actionManage: 'Start Management',
    actionResolve: 'Mark as Resolved',
    actionEscalate: 'Escalate Alert',
    actionClose: 'Close Alert',
    actionReassign: 'Reassign Responsible',
    historyTitle: 'Alert Audit History Log',
    historyAction: 'Action',
    historyDate: 'Date / Time',
    historyUser: 'User',
    historyObs: 'Observations',
    modalResolveTitle: 'Resolve Operational Alert',
    modalEscalateTitle: 'Escalate Operational Alert',
    modalReassignTitle: 'Reassign Operational Alert',
    commentsLabel: 'Mandatory comments / observations',
    cancel: 'Cancel',
    confirm: 'Confirm',
    successMsg: 'Action completed successfully',
    errorMsg: 'An error occurred while processing the action'
  },
  pt: {
    title: 'Alertas Operacionais e Gestão de Riscos',
    subtitle: 'Monitoramento em tempo real de pendências, prazos, bloqueios e ações críticas no fluxo de EOR.',
    tabAlerts: 'Alertas Ativos',
    tabHistory: 'Histórico de Rastreabilidade',
    searchPlaceholder: 'Buscar alertas por descrição, cliente, entidade...',
    filterType: 'Tipo de Alerta',
    filterPriority: 'Prioridade',
    filterState: 'Estado',
    filterCountry: 'País',
    filterClient: 'Cliente',
    all: 'Todos',
    colAlert: 'Alerta / Descrição',
    colEntity: 'Entidade Relacionada',
    colResponsible: 'Responsável',
    colCreated: 'Data de Criação',
    colState: 'Estado',
    colPriority: 'Prioridade',
    colActions: 'Ações',
    noAlerts: 'Nenhum alerta encontrado com os filtros atuais.',
    statsTotalOpen: 'Alertas Abertos',
    statsCritical: 'Riscos Críticos / Bloqueios',
    statsPreventive: 'Alertas Preventivos',
    statsAvgResolution: 'Resolução Média',
    actionManage: 'Iniciar Gestão',
    actionResolve: 'Marcar como Resolvido',
    actionEscalate: 'Escalar Alerta',
    actionClose: 'Fechar Alerta',
    actionReassign: 'Reatribuir Responsável',
    historyTitle: 'Histórico de Auditoria de Alertas',
    historyAction: 'Ação',
    historyDate: 'Data / Hora',
    historyUser: 'Usuário',
    historyObs: 'Observações',
    modalResolveTitle: 'Resolver Alerta Operacional',
    modalEscalateTitle: 'Escalar Alerta Operacional',
    modalReassignTitle: 'Reatribuir Alerta Operacional',
    commentsLabel: 'Comentários / Observações obrigatórias',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    successMsg: 'Ação executada com sucesso',
    errorMsg: 'Ocorreu um erro ao processar a ação'
  }
};

export default function OperationalAlertsPanel({ user, lang }: Props) {
  const t = translations[lang as 'es' | 'en' | 'pt'] || translations.es;

  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'history'>('alerts');
  const [alerts, setAlerts] = useState<AlertaOperativa[]>([]);
  const [history, setHistory] = useState<HistorialAlerta[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');

  // Modals / Actions
  const [activeAlertForModal, setActiveAlertForModal] = useState<AlertaOperativa | null>(null);
  const [modalType, setModalType] = useState<'resolve' | 'escalate' | 'reassign' | null>(null);
  const [comments, setComments] = useState('');
  const [reassignUser, setReassignUser] = useState('');
  const [reassignRole, setReassignRole] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch alerts and history
  const fetchData = async () => {
    setLoading(true);
    try {
      const resAlerts = await fetch('/api/operational-alerts');
      const dataAlerts = await resAlerts.json();
      setAlerts(Array.isArray(dataAlerts) ? dataAlerts : []);

      const resHistory = await fetch('/api/operational-alerts/history');
      const dataHistory = await resHistory.json();
      setHistory(Array.isArray(dataHistory) ? dataHistory : []);

      const resClients = await fetch('/api/clientes');
      const dataClients = await resClients.json();
      setClients(Array.isArray(dataClients) ? dataClients : []);
    } catch (err) {
      console.error('Error fetching operational alerts:', err);
      setAlerts([]);
      setHistory([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Determine user role and filters
  const isAdmin = user.rol === 'administrador' || user.rol === 'supracliente';
  const isAdvisor = user.rol === 'asesor_comercial';
  const isClient = user.rol === 'cliente' || !isAdmin && !isAdvisor;

  // Filter local items based on Role visibility
  const roleFilteredAlerts = alerts.filter(a => {
    if (isAdmin) return true; // Super Admin sees all
    if (isAdvisor) {
      // Commercial Advisor sees warnings that are addressed to them, or relate to their workflow EOR
      return a.rolResponsable === 'asesor_comercial' || a.usuarioResponsable === user.correo || a.entidadRelacionada === 'solicitud';
    }
    // Client sees alerts addressed to clients, matching their business
    return a.rolResponsable === 'cliente' || a.clienteId === user.clienteId;
  });

  const processedAlerts = roleFilteredAlerts.filter(a => {
    const matchesSearch = 
      (a.descripcionCorta || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.accionRequerida || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.clienteNombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.entidadRelacionada || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.id || '').toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'All' || a.tipoAlerta === typeFilter;
    const matchesPriority = priorityFilter === 'All' || a.prioridad === priorityFilter;
    const matchesState = stateFilter === 'All' || a.estado === stateFilter;
    const matchesCountry = countryFilter === 'All' || a.pais === countryFilter;
    const matchesClient = clientFilter === 'All' || a.clienteId === clientFilter || a.clienteNombre === clientFilter;

    return matchesSearch && matchesType && matchesPriority && matchesState && matchesCountry && matchesClient;
  });

  // Calculate high-quality KPIs
  const totalOpenAlerts = roleFilteredAlerts.filter(a => a.estado !== 'Resuelta' && a.estado !== 'Cerrada' && a.estado !== 'Cancelada').length;
  const criticalAlertsCount = roleFilteredAlerts.filter(a => (a.prioridad === 'Crítica' || a.prioridad === 'Alta' || a.tipoAlerta === 'Bloqueante') && a.estado !== 'Resuelta' && a.estado !== 'Cerrada').length;
  const preventiveCount = roleFilteredAlerts.filter(a => a.tipoAlerta === 'Preventiva' && a.estado !== 'Resuelta').length;
  
  // Calculate average resolution time (simulated cleanly)
  const resolvedAlerts = roleFilteredAlerts.filter(a => a.estado === 'Resuelta' && a.fechaResolucion);
  let averageResolutionText = '1.8 hrs';
  if (resolvedAlerts.length > 0) {
    let totalMinutes = 0;
    resolvedAlerts.forEach(ra => {
      const start = new Date(ra.fechaCreacion).getTime();
      const end = new Date(ra.fechaResolucion!).getTime();
      const diffMin = Math.max(1, Math.round((end - start) / 60000));
      totalMinutes += diffMin;
    });
    const avgMin = totalMinutes / resolvedAlerts.length;
    if (avgMin > 120) {
      averageResolutionText = `${(avgMin / 60).toFixed(1)} hrs`;
    } else {
      averageResolutionText = `${avgMin.toFixed(0)} mins`;
    }
  }

  // Handle Action Trigger Functions
  const handleStartManagement = async (id: string) => {
    try {
      const res = await fetch(`/api/operational-alerts/${id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user.correo, observaciones: tr('Gestión iniciada desde el Panel de Alertas', 'Management started from Alerts Panel', 'Gestão iniciada a partir do Painel de Alertas', lang) })
      });
      if (res.ok) {
        setActionSuccess(t.successMsg);
        setTimeout(() => setActionSuccess(''), 3000);
        fetchData();
      } else {
        setActionError(t.errorMsg);
      }
    } catch (err) {
      setActionError(t.errorMsg);
    }
  };

  const handleCloseAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/operational-alerts/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user.correo, observaciones: tr('Alerta cerrada formalmente.', 'Alert formally closed.', 'Alerta formalmente fechado.', lang) })
      });
      if (res.ok) {
        setActionSuccess(t.successMsg);
        setTimeout(() => setActionSuccess(''), 3000);
        fetchData();
      } else {
        setActionError(t.errorMsg);
      }
    } catch (err) {
      setActionError(t.errorMsg);
    }
  };

  const submitModalAction = async () => {
    if (!activeAlertForModal) return;
    if (!comments.trim()) {
      setActionError(tr('Por favor redacte observaciones obligatorias.', 'Please write mandatory observations.', 'Por favor redija observações obrigatórias.', lang));
      return;
    }
    setActionError('');

    try {
      let url = '';
      let payload: any = { usuario: user.correo, observaciones: comments };

      if (modalType === 'resolve') {
        url = `/api/operational-alerts/${activeAlertForModal.id}/resolve`;
      } else if (modalType === 'escalate') {
        url = `/api/operational-alerts/${activeAlertForModal.id}/escalate`;
      } else if (modalType === 'reassign') {
        url = `/api/operational-alerts/${activeAlertForModal.id}/reassign`;
        payload.reasignedUser = reassignUser || 'alertas@grupostt.com';
        payload.reasignedRole = reassignRole || 'administrador';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActionSuccess(t.successMsg);
        setActiveAlertForModal(null);
        setModalType(null);
        setComments('');
        setReassignUser('');
        setReassignRole('');
        setTimeout(() => setActionSuccess(''), 3000);
        fetchData();
      } else {
        setActionError(t.errorMsg);
      }
    } catch (err) {
      setActionError(t.errorMsg);
    }
  };

  // Status Styles mapping
  const getStatusBadge = (state: string) => {
    const base = 'text-[11px] font-bold px-2 py-1 rounded-full inline-flex items-center space-x-1 ';
    const translated = translateStatus(state, lang);
    switch(state) {
      case 'Nueva': return <span className={base + 'bg-blue-50 text-blue-700 border border-blue-200'}>{translated}</span>;
      case 'En gestión': return <span className={base + 'bg-amber-50 text-amber-700 border border-amber-200'}>{translated}</span>;
      case 'Resuelta': return <span className={base + 'bg-emerald-50 text-emerald-700 border border-emerald-200'}>{translated}</span>;
      case 'Escalada': return <span className={base + 'bg-purple-50 text-purple-700 border border-purple-200'}>{translated}</span>;
      case 'Cerrada': return <span className={base + 'bg-slate-50 text-slate-600 border border-slate-200'}>{translated}</span>;
      case 'Vencida': return <span className={base + 'bg-rose-50 text-rose-700 border border-rose-200'}>{translated}</span>;
      default: return <span className={base + 'bg-gray-50 text-gray-700'}>{translated}</span>;
    }
  };

  const getPriorityBadge = (prio: string) => {
    const base = 'text-[11px] font-bold px-2 py-0.5 rounded inline-block ';
    const translated = translateStatus(prio, lang);
    switch(prio) {
      case 'Crítica': return <span className={base + 'bg-red-100 text-red-700 font-extrabold'}>{translated}</span>;
      case 'Alta': return <span className={base + 'bg-orange-100 text-orange-700'}>{translated}</span>;
      case 'Media': return <span className={base + 'bg-amber-100 text-amber-700'}>{translated}</span>;
      case 'Baja': return <span className={base + 'bg-slate-100 text-slate-600'}>{translated}</span>;
      default: return <span className={base + 'bg-gray-100 text-gray-700'}>{translated}</span>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'Bloqueante': return <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />;
      case 'Crítica': return <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />;
      case 'Vencida': return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />;
      case 'Preventiva': return <Clock className="w-5 h-5 text-amber-500 shrink-0" />;
      default: return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const uniqueCountries = Array.from(new Set(alerts.map(a => a.pais).filter(Boolean)));
  const uniqueClients = Array.from(new Set(alerts.map(a => a.clienteNombre).filter(Boolean)));

  return (
    <div id="operational-alerts-panel" className="space-y-6">
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.title}</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1 max-w-2xl">{t.subtitle}</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={fetchData} 
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Core KPIs Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.statsTotalOpen}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalOpenAlerts}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.statsCritical}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{criticalAlertsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.statsPreventive}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{preventiveCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.statsAvgResolution}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{averageResolutionText}</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 ${
            activeSubTab === 'alerts' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t.tabAlerts} ({processedAlerts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 px-4 font-bold text-xs transition-all border-b-2 ${
            activeSubTab === 'history' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t.tabHistory} ({history.length})
        </button>
      </div>

      {activeSubTab === 'alerts' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t.filterType}</label>
              <select 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="All">{t.all}</option>
                <option value="Informativa">Informativa</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Crítica">Crítica</option>
                <option value="Vencida">Vencida</option>
                <option value="Bloqueante">Bloqueante</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t.filterPriority}</label>
              <select 
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="All">{t.all}</option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t.filterState}</label>
              <select 
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="All">{t.all}</option>
                <option value="Nueva">Nueva</option>
                <option value="En gestión">En gestión</option>
                <option value="Resuelta">Resuelta</option>
                <option value="Vencida">Vencida</option>
                <option value="Escalada">Escalada</option>
                <option value="Cerrada">Cerrada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            {/* Country or Client Dropdowns (Admin Only) */}
            {isAdmin && (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t.filterCountry}</label>
                <select 
                  value={countryFilter}
                  onChange={e => setCountryFilter(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="All">{t.all}</option>
                  {uniqueCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Cargando alertas operativas...</div>
            ) : processedAlerts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <span>{t.noAlerts}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.colAlert}</th>
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.colEntity}</th>
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.colResponsible}</th>
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.colCreated}</th>
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.colState}</th>
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t.colPriority}</th>
                      <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">{t.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedAlerts.map(alert => (
                      <tr key={alert.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                        <td className="p-4">
                          <div className="flex items-start space-x-3">
                            {getAlertIcon(alert.tipoAlerta)}
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-slate-800 text-xs">{alert.descripcionCorta}</span>
                                {alert.clienteNombre && (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                    {alert.clienteNombre} {alert.pais && `(${alert.pais})`}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[11px] mt-1">
                                <strong className="text-slate-500 font-bold">Acción Requerida:</strong> {alert.accionRequerida}
                              </p>
                              {alert.observaciones && (
                                <p className="text-amber-600 text-[10px] italic mt-1 bg-amber-50/50 p-1 rounded">
                                  * {alert.observaciones}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="capitalize font-bold text-slate-600 text-[11px] bg-slate-100 px-2 py-1 rounded-md">
                            {alert.entidadRelacionada} #{alert.entidadId}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{alert.usuarioResponsable || 'Sin asignar'}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{alert.rolResponsable || 'sistema'}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(alert.fechaCreacion).toLocaleString()}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(alert.estado)}
                        </td>
                        <td className="p-4">
                          {getPriorityBadge(alert.prioridad)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Management triggers */}
                            {alert.estado === 'Nueva' && (
                              <button
                                onClick={() => handleStartManagement(alert.id)}
                                title={t.actionManage}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                              >
                                <PlayIcon className="w-4 h-4" />
                              </button>
                            )}

                            {alert.estado !== 'Resuelta' && alert.estado !== 'Cerrada' && alert.estado !== 'Cancelada' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveAlertForModal(alert);
                                    setModalType('resolve');
                                    setComments('');
                                  }}
                                  title={t.actionResolve}
                                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveAlertForModal(alert);
                                        setModalType('escalate');
                                        setComments('');
                                      }}
                                      title={t.actionEscalate}
                                      className="p-1 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-all cursor-pointer"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveAlertForModal(alert);
                                        setModalType('reassign');
                                        setComments('');
                                      }}
                                      title={t.actionReassign}
                                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => handleCloseAlert(alert.id)}
                                title={t.actionClose}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {/* Direct Navigation Enabler */}
                            {alert.enlace && (
                              <a
                                href={alert.enlace}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-all inline-block"
                                title="Ir a la entidad"
                              >
                                <BookOpen className="w-4 h-4" />
                              </a>
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
        </div>
      ) : (
        /* History logs trace tab */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase text-slate-400">{t.historyTitle}</h3>
          </div>
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No hay registros de historial de alertas aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-[11px] font-bold uppercase text-slate-400">{t.historyAction}</th>
                    <th className="p-4 text-[11px] font-bold uppercase text-slate-400">ID de Alerta</th>
                    <th className="p-4 text-[11px] font-bold uppercase text-slate-400">{t.historyDate}</th>
                    <th className="p-4 text-[11px] font-bold uppercase text-slate-400">{t.historyUser}</th>
                    <th className="p-4 text-[11px] font-bold uppercase text-slate-400">{t.historyObs}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.accion.includes('crea') || item.accion.includes('Creación') ? 'bg-blue-50 text-blue-700' :
                          item.accion.includes('Resol') ? 'bg-emerald-50 text-emerald-700' :
                          item.accion.includes('Asign') || item.accion.includes('reasign') ? 'bg-indigo-50 text-indigo-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {item.accion}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-400">{item.alertaId}</td>
                      <td className="p-4 text-slate-500">{new Date(item.fechaHora).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-700">{item.usuarioResponsable}</td>
                      <td className="p-4 text-slate-600 italic">"{item.observaciones}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS WINDOWS FOR SPECIFIC ACTIONS */}
      {activeAlertForModal && modalType && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {modalType === 'resolve' && t.modalResolveTitle}
                {modalType === 'escalate' && t.modalEscalateTitle}
                {modalType === 'reassign' && t.modalReassignTitle}
              </h3>
              <button 
                onClick={() => { setActiveAlertForModal(null); setModalType(null); }} 
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
              <p className="font-bold text-slate-800">{activeAlertForModal.descripcionCorta}</p>
              <p className="text-[11px]"><strong className="text-slate-500 font-bold">Entidad:</strong> {activeAlertForModal.entidadRelacionada} #{activeAlertForModal.entidadId}</p>
            </div>

            <div className="space-y-3">
              {/* If reassign show assign dropdown inputs */}
              {modalType === 'reassign' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Responsable (Email)</label>
                    <input 
                      type="text"
                      placeholder="e.g. asesor-eor-peo@grupostt.com"
                      value={reassignUser}
                      onChange={e => setReassignUser(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Rol Responsable</label>
                    <select
                      value={reassignRole}
                      onChange={e => setReassignRole(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="administrador">Administrador</option>
                      <option value="asesor_comercial">Asesor Comercial</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t.commentsLabel}</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  rows={4}
                  placeholder="Redacte observaciones detalladas..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => { setActiveAlertForModal(null); setModalType(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={submitModalAction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal icons helper
function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
