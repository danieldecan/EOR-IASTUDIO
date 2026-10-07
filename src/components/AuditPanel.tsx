import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { AuditLog, Role } from '../types';
import { tr, translateStatus } from '../utils/i18n';
import { 
  ShieldAlert, ShieldCheck, Search, Filter, RefreshCw, 
  Download, FileText, Calendar, Eye, AlertTriangle, CheckCircle, 
  X, ChevronLeft, ChevronRight, BarChart2, Users, Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface AuditPanelProps {
  user: any;
  lang: 'es' | 'en' | 'pt';
}

const t = {
  es: {
    title: 'Auditoría de Permisos y Trazabilidad',
    subtitle: 'Bitácora centralizada de control de accesos, seguridad e intentos de operaciones críticas',
    filters: 'Filtros de Auditoría',
    user: 'Usuario Correo',
    role: 'Rol de Acceso',
    module: 'Módulo del Sistema',
    action: 'Acción Realizada',
    country: 'País',
    result: 'Resultado',
    date: 'Fecha',
    clear: 'Limpiar Filtros',
    exportExcel: 'Exportar a Excel (CSV)',
    exportPdf: 'Imprimir / PDF',
    totalLogs: 'Total Eventos',
    blockedLogs: 'Intentos Bloqueados',
    successLogs: 'Acciones Exitosas',
    failedLogs: 'Errores Operativos',
    tableDate: 'Fecha y Hora',
    tableUser: 'Usuario / Rol',
    tableModule: 'Módulo',
    tableAction: 'Acción',
    tableTarget: 'Entidad / ID',
    tableResult: 'Resultado',
    details: 'Detalles',
    modalTitle: 'Detalle Completo de Auditoría',
    modalTechnicalId: 'ID de Auditoría',
    modalPrevState: 'Estado Anterior',
    modalNewState: 'Estado Nuevo',
    modalPrevVal: 'Valor Anterior',
    modalNewVal: 'Valor Nuevo',
    modalReason: 'Motivo u Observación',
    modalIp: 'Identificador / Dispositivo',
    modalError: 'Mensaje de Error / Rechazo',
    all: 'Todos los Roles',
    allModules: 'Todos los Módulos',
    allResults: 'Todos los Resultados',
    exitoso: 'Exitoso',
    fallido: 'Fallido',
    bloqueado: 'Bloqueado (No Autorizado)',
    noLogs: 'No se encontraron registros de auditoría que coincidan con los filtros seleccionados.',
    close: 'Cerrar Detalle',
    searchPlaceholder: 'Buscar por usuario, acción o entidad...',
    pages: 'Página'
  },
  en: {
    title: 'Permissions Audit & Traceability',
    subtitle: 'Centralized access log, security checks, and attempts to execute critical operations',
    filters: 'Audit Filters',
    user: 'User Email',
    role: 'Access Role',
    module: 'System Module',
    action: 'Action Executed',
    country: 'Country',
    result: 'Result',
    date: 'Date',
    clear: 'Clear Filters',
    exportExcel: 'Export to Excel (CSV)',
    exportPdf: 'Print / Export PDF',
    totalLogs: 'Total Events',
    blockedLogs: 'Blocked Attempts',
    successLogs: 'Successful Actions',
    failedLogs: 'Operational Errors',
    tableDate: 'Date and Time',
    tableUser: 'User / Role',
    tableModule: 'Module',
    tableAction: 'Action',
    tableTarget: 'Entity / ID',
    tableResult: 'Result',
    details: 'Details',
    modalTitle: 'Full Audit Entry Detail',
    modalTechnicalId: 'Audit ID',
    modalPrevState: 'Previous State',
    modalNewState: 'New State',
    modalPrevVal: 'Previous Value',
    modalNewVal: 'New Value',
    modalReason: 'Reason / Observation',
    modalIp: 'Identifier / Device',
    modalError: 'Error / Rejection Message',
    all: 'All Roles',
    allModules: 'All Modules',
    allResults: 'All Results',
    exitoso: 'Successful',
    fallido: 'Failed',
    bloqueado: 'Blocked (Unauthorized)',
    noLogs: 'No audit logs found matching the selected filters.',
    close: 'Close Detail',
    searchPlaceholder: 'Search by user, action or entity...',
    pages: 'Page'
  },
  pt: {
    title: 'Auditoria de Permissões e Rastreabilidade',
    subtitle: 'Log centralizado de acesso, verificações de segurança e tentativas de operações críticas',
    filters: 'Filtros de Auditoria',
    user: 'E-mail do Usuário',
    role: 'Função de Acesso',
    module: 'Módulo do Sistema',
    action: 'Ação Realizada',
    country: 'País',
    result: 'Resultado',
    date: 'Data',
    clear: 'Limpar Filtros',
    exportExcel: 'Exportar para Excel (CSV)',
    exportPdf: 'Imprimir / PDF',
    totalLogs: 'Total de Eventos',
    blockedLogs: 'Tentativas Bloqueadas',
    successLogs: 'Ações com Sucesso',
    failedLogs: 'Erros Operacionais',
    tableDate: 'Data e Hora',
    tableUser: 'Usuário / Função',
    tableModule: 'Módulo',
    tableAction: 'Ação',
    tableTarget: 'Entidade / ID',
    tableResult: 'Resultado',
    details: 'Detalhes',
    modalTitle: 'Detalhe Completo da Auditoria',
    modalTechnicalId: 'ID de Auditoria',
    modalPrevState: 'Estado Anterior',
    modalNewState: 'Novo Estado',
    modalPrevVal: 'Valor Anterior',
    modalNewVal: 'Novo Valor',
    modalReason: 'Motivo ou Observação',
    modalIp: 'Identificador / Dispositivo',
    modalError: 'Mensagem de Erro / Rejeição',
    all: 'Todas as Funções',
    allModules: 'Todos os Módulos',
    allResults: 'Todos os Resultados',
    exitoso: 'Sucesso',
    fallido: 'Falha',
    bloqueado: 'Bloqueado (Não Autorizado)',
    noLogs: 'Nenhum registro de auditoria encontrado correspondente aos filtros selecionados.',
    close: 'Fechar Detalhe',
    searchPlaceholder: 'Buscar por usuário, ação ou entidade...',
    pages: 'Página'
  }
};

export default function AuditPanel({ user, lang }: AuditPanelProps) {
  const currentT = t[lang] || t.es;
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [resultFilter, setResultFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All');
    setModuleFilter('All');
    setResultFilter('All');
    setDateFilter('');
    setCurrentPage(1);
  };

  // Unique Modules and Countries in DB
  const modules = Array.from(new Set(logs.map(l => l.modulo).filter(Boolean)));
  
  // Filtered Logs
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.accion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entidadAfectada.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.entidadId && l.entidadId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.motivoObservacion && l.motivoObservacion.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'All' || l.rol === roleFilter;
    const matchesModule = moduleFilter === 'All' || l.modulo === moduleFilter;
    const matchesResult = resultFilter === 'All' || l.resultado === resultFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      matchesDate = l.fechaHora.startsWith(dateFilter);
    }

    return matchesSearch && matchesRole && matchesModule && matchesResult && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, moduleFilter, resultFilter, dateFilter]);

  // KPIs Calculations
  const stats = {
    total: filteredLogs.length,
    success: filteredLogs.filter(l => l.resultado === 'exitoso').length,
    blocked: filteredLogs.filter(l => l.resultado === 'bloqueado').length,
    failed: filteredLogs.filter(l => l.resultado === 'fallido').length
  };

  // Recharts Chart Data
  // Group counts by Module
  const moduleChartData = Array.from(
    filteredLogs.reduce((acc, current) => {
      const key = current.modulo || 'General';
      const exist = acc.get(key) || { name: key, Exitoso: 0, Bloqueado: 0, Fallido: 0 };
      if (current.resultado === 'exitoso') exist.Exitoso += 1;
      else if (current.resultado === 'bloqueado') exist.Bloqueado += 1;
      else exist.Fallido += 1;
      acc.set(key, exist);
      return acc;
    }, new Map<string, any>()).values()
  ).slice(0, 8); // top 8 modules

  // Group counts by Result for Pie Chart
  const pieChartData = [
    { name: currentT.exitoso, value: stats.success, color: '#10B981' },
    { name: currentT.bloqueado, value: stats.blocked, color: '#EF4444' },
    { name: currentT.fallido, value: stats.failed, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  // Native CSV Export
  const handleExportExcel = () => {
    const headers = [
      'ID de Auditoría',
      'Fecha y Hora',
      'Usuario',
      'Rol',
      'Módulo afectado',
      'Acción',
      'Entidad afectada',
      'ID Entidad',
      'Estado Anterior',
      'Estado Nuevo',
      'Valor Anterior',
      'Valor Nuevo',
      'Resultado',
      'Observaciones / Justificación',
      'ID Técnico'
    ];
    
    const rows = filteredLogs.map(l => [
      l.id,
      l.fechaHora,
      l.usuario,
      l.rol,
      l.modulo,
      l.accion,
      l.entidadAfectada,
      l.entidadId || '',
      l.estadoAnterior || '',
      l.estadoNuevo || '',
      l.valorAnterior || '',
      l.valorNuevo || '',
      l.resultado,
      l.motivoObservacion || '',
      l.identificadorTecnico || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quick_Hire_Auditoria_Permisos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Register log export event
    api.createAuditLog({
      usuario: user.correo,
      rol: user.rol,
      modulo: 'Reportes',
      accion: 'Exportar Excel',
      entidadAfectada: 'Auditoría de Permisos',
      resultado: 'exitoso',
      motivoObservacion: `Exportación exitosa de ${filteredLogs.length} registros de auditoría de permisos`
    }).catch(() => {});
  };

  // Native Print / PDF Trigger
  const handleExportPdf = () => {
    window.print();
    
    // Register log export event
    api.createAuditLog({
      usuario: user.correo,
      rol: user.rol,
      modulo: 'Reportes',
      accion: 'Exportar PDF',
      entidadAfectada: 'Auditoría de Permisos',
      resultado: 'exitoso',
      motivoObservacion: `Exportación a PDF/Impresión de la bitácora de auditoría de permisos`
    }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Style Overlay */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <span>{currentT.title}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{currentT.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-xs"
            title="Sincronizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{currentT.exportExcel}</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{currentT.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{currentT.totalLogs}</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">{currentT.blockedLogs}</span>
            <h3 className="text-2xl font-black text-rose-600 mt-0.5">{stats.blocked}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{currentT.successLogs}</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{stats.success}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{currentT.failedLogs}</span>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{stats.failed}</h3>
          </div>
        </div>
      </div>

      {/* Interactive Charts Dashboard */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Bar Chart by Modules */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-2">
            <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Eventos Críticos por Módulo</span>
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Exitoso" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Bloqueado" fill="#EF4444" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Fallido" fill="#F59E0B" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart of Results */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Distribución de Resultados de Acceso</span>
            </h4>
            <div className="h-64 flex flex-col justify-center items-center">
              {pieChartData.length > 0 ? (
                <>
                  <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom Legends */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                    {pieChartData.map((d, i) => (
                      <div key={i} className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span>{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 font-medium">{currentT.noLogs}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Area Wrapper */}
      <div id="print-area">
        {/* Printable view header, visible ONLY in print */}
        <div className="hidden print:block mb-8 border-b border-slate-300 pb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            QUICK HIRE - AUDITORÍA DE SEGURIDAD Y PERMISOS
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Fecha de impresión: {new Date().toLocaleString()} | Usuario responsable: {user.nombre} ({user.correo})
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4 border border-slate-200 p-4 rounded-xl bg-slate-50">
            <div>
              <span className="text-xs text-slate-500 font-bold">TOTAL ACCIONES:</span>
              <p className="text-lg font-black">{stats.total}</p>
            </div>
            <div>
              <span className="text-xs text-rose-500 font-bold">INTENTOS BLOQUEADOS:</span>
              <p className="text-lg font-black text-rose-600">{stats.blocked}</p>
            </div>
            <div>
              <span className="text-xs text-emerald-500 font-bold">OPERACIONES EXITOSAS:</span>
              <p className="text-lg font-black text-emerald-600">{stats.success}</p>
            </div>
          </div>
        </div>

        {/* Filters Widget (no-print) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs no-print space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>{currentT.filters}</span>
            </h3>
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center space-x-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{currentT.clear}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Query */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentT.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm font-medium transition-all"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm font-medium transition-all"
              >
                <option value="All">{currentT.all}</option>
                <option value="supracliente">Super Admin</option>
                <option value="administrador">Administrador</option>
                <option value="asesor_comercial">Asesor Comercial</option>
                <option value="cliente">Cliente</option>
                <option value="prospecto">Prospecto</option>
              </select>
            </div>

            {/* Module Filter */}
            <div>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm font-medium transition-all"
              >
                <option value="All">{currentT.allModules}</option>
                <option value="Usuarios">Usuarios</option>
                <option value="Solicitudes EOR">Solicitudes EOR</option>
                <option value="Clientes">Clientes</option>
                <option value="Contratos comerciales">Contratos comerciales</option>
                <option value="Contratos laborales">Contratos laborales</option>
                <option value="Adendums">Adendums</option>
                <option value="Facturación y pagos">Facturación y pagos</option>
                <option value="Tipo de cambio">Tipo de cambio</option>
                <option value="Tickets">Tickets</option>
                <option value="SLA">SLA</option>
                <option value="Alertas operativas">Alertas operativas</option>
                <option value="Reportes">Reportes</option>
                <option value="Notificaciones">Notificaciones</option>
                <option value="Configuración general">Configuración general</option>
              </select>
            </div>

            {/* Result Filter */}
            <div>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm font-medium transition-all"
              >
                <option value="All">{currentT.allResults}</option>
                <option value="exitoso">{currentT.exitoso}</option>
                <option value="fallido">{currentT.fallido}</option>
                <option value="bloqueado">{currentT.bloqueado}</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">{currentT.tableDate}</th>
                  <th className="px-6 py-4">{currentT.tableUser}</th>
                  <th className="px-6 py-4">{currentT.tableModule}</th>
                  <th className="px-6 py-4">{currentT.tableAction}</th>
                  <th className="px-6 py-4">{currentT.tableTarget}</th>
                  <th className="px-6 py-4">{currentT.tableResult}</th>
                  <th className="px-6 py-4 text-right no-print">{currentT.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
                      <span className="font-semibold text-slate-500">Cargando registros de auditoría...</span>
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold">
                      <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                      <span>{currentT.noLogs}</span>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {new Date(log.fechaHora).toLocaleString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US')}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="max-w-[180px] truncate font-bold text-slate-800" title={log.usuario}>
                          {log.usuario}
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mt-0.5">
                          {log.rol === 'supracliente' ? 'Super Admin' : log.rol}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                          {log.modulo}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-700 max-w-[160px] truncate" title={log.accion}>
                        {log.accion}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-xs text-slate-700 font-bold">{log.entidadAfectada}</div>
                        {log.entidadId && (
                          <span className="text-[10px] font-mono font-medium text-slate-400 block mt-0.5">
                            ID: {log.entidadId}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {log.resultado === 'exitoso' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{currentT.exitoso}</span>
                          </span>
                        )}
                        {log.resultado === 'bloqueado' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>{currentT.bloqueado}</span>
                          </span>
                        )}
                        {log.resultado === 'fallido' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{currentT.fallido}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap no-print">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar (no-print) */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 no-print">
              <span className="text-xs text-slate-500 font-bold">
                {currentT.pages} {currentPage} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 rounded-lg transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 rounded-lg transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Detail Modal overlay (no-print) */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <h3 className="font-black text-lg tracking-tight">{currentT.modalTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalTechnicalId}</label>
                  <p className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100">
                    {selectedLog.id}
                  </p>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.tableDate}</label>
                  <p className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100">
                    {new Date(selectedLog.fechaHora).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.tableUser}</label>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100">
                    {selectedLog.usuario} <span className="text-slate-400">({selectedLog.rol})</span>
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.tableModule}</label>
                  <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg mt-1 border border-indigo-100/50">
                    {selectedLog.modulo} — {selectedLog.accion}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalPrevState}</label>
                  <p className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100 min-h-[30px]">
                    {selectedLog.estadoAnterior || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalNewState}</label>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100 min-h-[30px]">
                    {selectedLog.estadoNuevo || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalPrevVal}</label>
                  <p className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100 min-h-[30px] overflow-x-auto truncate">
                    {selectedLog.valorAnterior || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalNewVal}</label>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100 min-h-[30px] overflow-x-auto truncate">
                    {selectedLog.valorNuevo || '-'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalReason}</label>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-2.5 rounded-lg mt-1 border border-slate-100 leading-relaxed">
                    {selectedLog.motivoObservacion || '-'}
                  </p>
                </div>

                {selectedLog.mensajeError && (
                  <div>
                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{currentT.modalError}</label>
                    <p className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-2.5 rounded-lg mt-1 border border-rose-100 leading-relaxed">
                      {selectedLog.mensajeError}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.modalIp}</label>
                    <p className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg mt-1 border border-slate-100">
                      {selectedLog.identificadorTecnico || 'Internal'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentT.tableResult}</label>
                    <div className="mt-1">
                      {selectedLog.resultado === 'exitoso' && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>{currentT.exitoso}</span>
                        </span>
                      )}
                      {selectedLog.resultado === 'bloqueado' && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{currentT.bloqueado}</span>
                        </span>
                      )}
                      {selectedLog.resultado === 'fallido' && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{currentT.fallido}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black rounded-xl shadow-sm transition-all"
              >
                {currentT.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
