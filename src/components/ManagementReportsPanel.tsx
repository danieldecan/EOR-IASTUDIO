import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  User, 
  Cliente, 
  SolicitudEOR, 
  ContratoComercial, 
  Adendum, 
  PagoContadoUSD, 
  HistorialLiberacion, 
  Trabajador, 
  ContratoLaboral, 
  Ticket, 
  AlertaOperativa, 
  HistorialLog,
  SlaConfig
} from '../types';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle, 
  Users, 
  Ticket as TicketIcon, 
  FileCheck, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Briefcase, 
  History, 
  UserCheck, 
  Printer, 
  TrendingUp, 
  Globe, 
  Layers,
  FileSpreadsheet,
  Building
} from 'lucide-react';
import { tr, translateStatus } from '../utils/i18n';

interface ManagementReportsPanelProps {
  user: User;
  lang: 'es' | 'en' | 'pt';
}

type ReportType = 
  | 'estado_integral' 
  | 'solicitudes_comercial' 
  | 'contratos_adendums' 
  | 'facturacion_pagos' 
  | 'liberacion_servicio' 
  | 'trabajadores_laboral' 
  | 'tickets_sla' 
  | 'alertas_operativas' 
  | 'gestion_asesores' 
  | 'auditoria_trazabilidad';

export default function ManagementReportsPanel({ user, lang }: ManagementReportsPanelProps) {
  // Navigation & Report Selection
  const [activeReport, setActiveReport] = useState<ReportType>('estado_integral');

  // Core Data Collections
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudEOR[]>([]);
  const [contratosComerciales, setContratosComerciales] = useState<ContratoComercial[]>([]);
  const [adendums, setAdendums] = useState<Adendum[]>([]);
  const [pagosContado, setPagosContado] = useState<PagoContadoUSD[]>([]);
  const [historialLiberacion, setHistorialLiberacion] = useState<HistorialLiberacion[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [contratosLaborales, setContratosLaborales] = useState<ContratoLaboral[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [alertasOperativas, setAlertasOperativas] = useState<AlertaOperativa[]>([]);
  const [logs, setLogs] = useState<HistorialLog[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>([]);
  const [seguimientos, setSeguimientos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [traceHistory, setTraceHistory] = useState<{ id: string; action: string; reportName: string; date: string; format: string }[]>([]);

  // Filter States
  const [filterCliente, setFilterCliente] = useState<string>('all');
  const [filterPais, setFilterPais] = useState<string>('all');
  const [filterServicio, setFilterServicio] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterAsesor, setFilterAsesor] = useState<string>('all');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Translations Dictionary
  const t = {
    es: {
      title: 'Reportes de Gestión EOR',
      description: 'Módulo unificado para control de punta a punta, visibilidad por rol y descargas ejecutivas.',
      filters: 'Filtros de Búsqueda',
      searchPlaceholder: 'Buscar en los resultados...',
      generatePdf: 'Imprimir PDF / Reporte Ejecutivo',
      generateExcel: 'Descargar Excel',
      all: 'Todos',
      client: 'Cliente',
      country: 'País',
      service: 'Servicio',
      state: 'Estado',
      advisor: 'Asesor Comercial',
      period: 'Periodo',
      dateRange: 'Rango de Fechas',
      startDate: 'Desde',
      endDate: 'Hasta',
      applyFilters: 'Aplicar Filtros',
      clearFilters: 'Limpiar Filtros',
      noData: 'No se encontraron registros que coincidan con los criterios.',
      unauthorized: 'No tiene permisos para visualizar este reporte.',
      actionRegistered: 'Acción registrada con éxito en el log de auditoría.',
      loadingText: 'Cargando datos y generando reportes...',
      summaryKpis: 'Resumen Ejecutivo e Indicadores Clave',
      generationDate: 'Fecha de generación',
      generatedBy: 'Generado por',
      activeFiltersText: 'Filtros aplicados',
      auditTrailTitle: 'Trazabilidad de este Reporte',
      historyLogs: 'Historial de Descargas',

      // Report list names & descriptions
      reports: {
        estado_integral: {
          name: '1. Estado Integral del Proceso EOR',
          desc: 'Avance unificado del cliente: Solicitud, Contrato, Pagos, Liberación, Trabajadores y Alertas.',
        },
        solicitudes_comercial: {
          name: '2. Solicitudes y Gestión Comercial',
          desc: 'Seguimiento de Leads/Solicitudes EOR, estado de conversión y próxima acción comercial.',
        },
        contratos_adendums: {
          name: '3. Contratos Comerciales y Adendums',
          desc: 'Control de acuerdos Cliente-Proveedor, firmas, adendums vigentes y estados legales.',
        },
        facturacion_pagos: {
          name: '4. Facturación y Control de Pagos',
          desc: 'Control de pagos de contado y mensuales, montos en USD, tipos de cambio y validaciones.',
        },
        liberacion_servicio: {
          name: '5. Liberación de Servicio EOR',
          desc: 'Estatus del semáforo de liberación comercial: pagos aprobados, firmas y habilitación de contratos.',
        },
        trabajadores_laboral: {
          name: '6. Trabajadores y Contratos Laborales',
          desc: 'Onboarding de colaboradores, contratos individuales de trabajo firmados y estados de revisión.',
        },
        tickets_sla: {
          name: '7. Tickets de Soporte y Cumplimiento SLA',
          desc: 'Cumplimiento de tiempos de respuesta contractuales por país, tickets abiertos y resolución.',
        },
        alertas_operativas: {
          name: '8. Alertas Operativas y Riesgos',
          desc: 'Alertas preventivas y críticas: contratos vencidos, retrasos en firmas, pagos pendientes.',
        },
        gestion_asesores: {
          name: '9. Gestión de Asesores Comerciales',
          desc: 'Productividad de asesores comerciales: conversión de leads, contratos logrados y seguimientos.',
        },
        auditoria_trazabilidad: {
          name: '10. Auditoría de Seguridad y Trazabilidad',
          desc: 'Acciones críticas de los usuarios: creación de clientes, cambios de estado, descargas y edición.',
        }
      }
    },
    en: {
      title: 'EOR Management Reports',
      description: 'Unified module for end-to-end control, role-based visibility, and executive downloads.',
      filters: 'Search Filters',
      searchPlaceholder: 'Search in results...',
      generatePdf: 'Print PDF / Executive Report',
      generateExcel: 'Download Excel',
      all: 'All',
      client: 'Client',
      country: 'Country',
      service: 'Service',
      state: 'State',
      advisor: 'Commercial Advisor',
      period: 'Period',
      dateRange: 'Date Range',
      startDate: 'From',
      endDate: 'To',
      applyFilters: 'Apply Filters',
      clearFilters: 'Clear Filters',
      noData: 'No records found matching the criteria.',
      unauthorized: 'You do not have permission to view this report.',
      actionRegistered: 'Action successfully registered in the audit log.',
      loadingText: 'Loading data and generating reports...',
      summaryKpis: 'Executive Summary and Key Indicators',
      generationDate: 'Generation Date',
      generatedBy: 'Generated by',
      activeFiltersText: 'Applied filters',
      auditTrailTitle: 'Audit Trail of this Report',
      historyLogs: 'Downloads History',

      // Report list names & descriptions
      reports: {
        estado_integral: {
          name: '1. Integral EOR Process Status',
          desc: 'Unified client progress: Request, Contract, Payments, Service Release, Workers, and Alerts.',
        },
        solicitudes_comercial: {
          name: '2. EOR Requests & Commercial Management',
          desc: 'Tracking of EOR Leads/Requests, conversion state, and next commercial action.',
        },
        contratos_adendums: {
          name: '3. Commercial Contracts & Addendums',
          desc: 'Control of Client-Provider agreements, signatures, active addendums, and legal states.',
        },
        facturacion_pagos: {
          name: '4. Billing and Payment Control',
          desc: 'Control of upfront and monthly payments, USD amounts, exchange rates, and validations.',
        },
        liberacion_servicio: {
          name: '5. EOR Service Release EOR',
          desc: 'Commercial release semaphore status: validated payments, signatures, and contract activation.',
        },
        trabajadores_laboral: {
          name: '6. Workers and Labor Contracts',
          desc: 'Colleague onboarding, signed individual labor contracts, and review states.',
        },
        tickets_sla: {
          name: '7. Support Tickets & SLA Compliance',
          desc: 'Contractual response times compliance by country, open tickets, and resolutions.',
        },
        alertas_operativas: {
          name: '8. Operational Alerts & Risks',
          desc: 'Preventive and critical alerts: expired contracts, signature delays, pending payments.',
        },
        gestion_asesores: {
          name: '9. Commercial Advisor Productivity',
          desc: 'Commercial advisor output: lead conversion, contracts finalized, and follow-ups.',
        },
        auditoria_trazabilidad: {
          name: '10. Security Audit & Traceability',
          desc: 'Critical user actions: client creation, state shifts, downloads, and edits.',
        }
      }
    },
    pt: {
      title: 'Relatórios de Gestão EOR',
      description: 'Módulo unificado para controle de ponta a ponta, visibilidade por função e downloads executivos.',
      filters: 'Filtros de Pesquisa',
      searchPlaceholder: 'Buscar nos resultados...',
      generatePdf: 'Imprimir PDF / Relatório Executivo',
      generateExcel: 'Baixar Excel',
      all: 'Todos',
      client: 'Cliente',
      country: 'País',
      service: 'Serviço',
      state: 'Estado',
      advisor: 'Consultor Comercial',
      period: 'Período',
      dateRange: 'Intervalo de Datas',
      startDate: 'De',
      endDate: 'Até',
      applyFilters: 'Aplicar Filtros',
      clearFilters: 'Limpar Filtros',
      noData: 'Nenhum registro encontrado que corresponda aos critérios.',
      unauthorized: 'Você não tem permissão para visualizar este relatório.',
      actionRegistered: 'Ação registrada com sucesso no log de auditoria.',
      loadingText: 'Carregando dados e gerando relatórios...',
      summaryKpis: 'Resumo Executivo e Indicadores Chave',
      generationDate: 'Data de geração',
      generatedBy: 'Gerado por',
      activeFiltersText: 'Filtros aplicados',
      auditTrailTitle: 'Trazabilidade deste Relatório',
      historyLogs: 'Histórico de Downloads',

      // Report list names & descriptions
      reports: {
        estado_integral: {
          name: '1. Estado Integral do Processo EOR',
          desc: 'Progresso unificado do cliente: Solicitação, Contrato, Pagamentos, Liberação, Trabalhadores e Alertas.',
        },
        solicitudes_comercial: {
          name: '2. Solicitações e Gestão Comercial',
          desc: 'Acompanhamento de Leads/Solicitações EOR, estado de conversão e próxima ação comercial.',
        },
        contratos_adendums: {
          name: '3. Contratos Comerciais e Adendos',
          desc: 'Controle de acordos Cliente-Fornecedor, assinaturas, adendos vigentes e status jurídico.',
        },
        facturacion_pagos: {
          name: '4. Faturamento e Controle de Pagamentos',
          desc: 'Controle de pagamentos à vista e mensais, valores em USD, taxas de câmbio e validações.',
        },
        liberacion_servicio: {
          name: '5. Liberação do Serviço EOR',
          desc: 'Status do semáforo de liberação comercial: pagamentos aprovados, assinaturas e ativação de contratos.',
        },
        trabajadores_laboral: {
          name: '6. Trabalhadores e Contratos Trabalhistas',
          desc: 'Onboarding de colaboradores, contratos individuais de trabalho assinados e status de revisão.',
        },
        tickets_sla: {
          name: '7. Tickets de Suporte e Acordo de SLA',
          desc: 'Cumprimento de prazos de resposta contratuais por país, tickets abertos e resoluções.',
        },
        alertas_operativas: {
          name: '8. Alertas Operacionais e Riscos',
          desc: 'Alertas preventivos e críticos: contratos vencidos, atrasos em assinaturas, pagamentos pendentes.',
        },
        gestion_asesores: {
          name: '9. Gestão de Consultores Comerciais',
          desc: 'Produtividade dos consultores comerciais: conversão de leads, contratos fechados e acompanhamentos.',
        },
        auditoria_trazabilidad: {
          name: '10. Auditoria de Segurança e Rastreabilidade',
          desc: 'Ações críticas dos usuários: criação de clientes, mudanças de estado, downloads e edições.',
        }
      }
    }
  };

  const currentT = t[lang] || t.es;

  // Fetch initial data
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [
          clientsData,
          solicitudesData,
          contratosComercialesData,
          adendumsData,
          pagosContadoData,
          historialLiberacionData,
          trabajadoresData,
          contratosLaboralesData,
          ticketsData,
          logsData,
          slaConfigsData,
          seguimientosData,
          usuariosData
        ] = await Promise.all([
          api.getClientes().catch(() => []),
          api.getSolicitudes().catch(() => []),
          api.getContratosComerciales().catch(() => []),
          api.getAdendums().catch(() => []),
          api.getPagosContado().catch(() => []),
          api.getHistorialLiberacion().catch(() => []),
          api.getTrabajadores().catch(() => []),
          api.getContratosLaborales().catch(() => []),
          api.getTickets().catch(() => []),
          api.getLogs().catch(() => []),
          api.getSlaConfigs().catch(() => []),
          api.getSeguimientosComerciales().catch(() => []),
          api.getUsuarios().catch(() => [])
        ]);

        // Operational alerts need explicit fetch
        const alertsResponse = await fetch('/api/operational-alerts').catch(() => null);
        const alertsData = alertsResponse && alertsResponse.ok ? await alertsResponse.json() : [];

        setClientes(clientsData);
        setSolicitudes(solicitudesData);
        setContratosComerciales(contratosComercialesData);
        setAdendums(adendumsData);
        setPagosContado(pagosContadoData);
        setHistorialLiberacion(historialLiberacionData);
        setTrabajadores(trabajadoresData);
        setContratosLaborales(contratosLaboralesData);
        setTickets(ticketsData);
        setAlertasOperativas(alertsData);
        setLogs(logsData);
        setSlaConfigs(slaConfigsData);
        setSeguimientos(seguimientosData);
        setUsuarios(usuariosData);
      } catch (err) {
        console.error('Error loading reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Check Role Permissions for currently selected report
  const isReportAllowed = (report: ReportType): boolean => {
    const isAdmin = user.rol === 'administrador' || user.rol === 'supracliente';
    const isAdvisor = user.rol === 'asesor_comercial';
    const isClient = user.rol === 'cliente' || (!isAdmin && !isAdvisor && user.rol === 'prospecto');

    if (isAdmin) return true; // Super Admin & admin have full access

    switch (report) {
      case 'estado_integral':
        return true; // Everyone can see theirs
      case 'solicitudes_comercial':
        return isAdvisor; // Advisors and admins
      case 'contratos_adendums':
        return isAdvisor || isClient; // Client, advisor, admin
      case 'facturacion_pagos':
        return isAdvisor || isClient; // Client, advisor, admin (advisor read only)
      case 'liberacion_servicio':
        return isAdvisor || isClient;
      case 'trabajadores_laboral':
        return isClient; // Clients can see theirs. Advisors do NOT see detail.
      case 'tickets_sla':
        return isAdvisor || isClient;
      case 'alertas_operativas':
        return isAdvisor || isClient;
      case 'gestion_asesores':
        return isAdvisor; // Advisors can see their own management
      case 'auditoria_trazabilidad':
        return false; // Only admins see audit trail
      default:
        return false;
    }
  };

  // Helper to record download action in Audit log
  const trackDownloadLog = async (reportId: string, format: 'PDF' | 'Excel') => {
    try {
      const details = `Descargado reporte [${reportId}] por ${user.nombre} (${user.rol}) en formato ${format}. Filtros: Cliente: ${filterCliente}, País: ${filterPais}, Servicio: ${filterServicio}.`;
      await api.createLog({
        tabla: 'Reportes',
        registroId: reportId,
        campo: 'Descarga',
        valorAnterior: 'Pantalla',
        valorNuevo: format,
        motivo: details,
        usuario: user.correo
      });

      // Local trace history for current session
      const newTrace = {
        id: `TRACE-${Date.now()}`,
        action: format === 'PDF' ? 'Generación PDF' : 'Exportación Excel',
        reportName: currentT.reports[activeReport]?.name || activeReport,
        date: new Date().toISOString(),
        format
      };
      setTraceHistory(prev => [newTrace, ...prev]);
    } catch (err) {
      console.error('Error tracking download log:', err);
    }
  };

  // Reset Filters helper
  const handleClearFilters = () => {
    setFilterCliente('all');
    setFilterPais('all');
    setFilterServicio('all');
    setFilterEstado('all');
    setFilterAsesor('all');
    setFilterPeriodo('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // Filter & Compute Report Data dynamically
  const getProcessedReportData = () => {
    let rows: any[] = [];
    let kpis = { total: 0, metricA: 0, metricB: 0, metricC: 0 };
    let headers: string[] = [];
    let keys: string[] = [];

    const matchesSearch = (text: string) => {
      if (!searchQuery) return true;
      return text?.toLowerCase().includes(searchQuery.toLowerCase());
    };

    // Date range helper
    const matchesDate = (dateStr: string) => {
      if (!dateStr) return true;
      const rowDate = new Date(dateStr);
      if (startDate && new Date(startDate) > rowDate) return false;
      if (endDate && new Date(endDate) < rowDate) return false;
      return true;
    };

    // Client restriction helper
    const isRowVisibleForUser = (rowClienteId?: string, rowAsesorEmail?: string) => {
      if (user.rol === 'administrador' || user.rol === 'supracliente') return true;
      if (user.rol === 'cliente') {
        if (rowClienteId && user.clienteId && rowClienteId === user.clienteId) return true;
        const clientObj = clientes.find(c => c.correoContacto?.toLowerCase() === user.correo?.toLowerCase());
        if (clientObj && clientObj.id === rowClienteId) return true;
        if (!user.clienteId && !clientObj && clientes.length > 0) {
          // Fallback to first client if demo user
          return rowClienteId === clientes[0].id;
        }
        return false;
      }
      if (user.rol === 'asesor_comercial') {
        // Advisors see only assigned EOR requests or clients
        return rowAsesorEmail === user.correo || rowClienteId ? clientes.find(c => c.id === rowClienteId)?.asesorAsignado === user.correo : true;
      }
      return false;
    };

    switch (activeReport) {
      case 'estado_integral': {
        headers = lang === 'es' 
          ? ['Empresa', 'País', 'Servicio', 'Contrato', 'Último Pago', 'Liberación', 'Colaboradores', 'Tickets', 'Alertas']
          : lang === 'pt'
          ? ['Empresa', 'País', 'Serviço', 'Contrato', 'Último Pagamento', 'Liberação', 'Colaboradores', 'Tickets', 'Alertas']
          : ['Company', 'Country', 'Service', 'Contract', 'Last Payment', 'Release', 'Employees', 'Tickets', 'Alerts'];
        keys = ['empresa', 'pais', 'servicio', 'contratoEstado', 'ultimoPago', 'estadoServicio', 'colaboradoresCount', 'ticketsAbiertos', 'alertasActivas'];

        clientes.forEach(c => {
          if (!isRowVisibleForUser(c.id, c.asesorAsignado)) return;

          // Filters
          if (filterCliente !== 'all' && c.id !== filterCliente) return;
          if (filterPais !== 'all' && c.pais !== filterPais) return;
          if (filterServicio !== 'all' && c.servicioContratado !== filterServicio) return;
          if (filterEstado !== 'all' && c.estadoServicio !== filterEstado) return;

          const cc = contratosComerciales.find(contract => contract.clienteId === c.id && contract.estado !== 'Anulado');
          const clientPayments = pagosContado.filter(p => p.clienteId === c.id);
          const lastPayment = clientPayments.length > 0 ? clientPayments[clientPayments.length - 1] : null;
          const clientWorkers = trabajadores.filter(t => t.clienteId === c.id);
          const openTickets = tickets.filter(t => t.clienteId === c.id && t.estado !== 'Cerrado');
          const clientAlerts = alertasOperativas.filter(a => a.clienteId === c.id && a.estado !== 'Cerrada');

          const val = {
            id: c.id,
            empresa: c.empresa,
            pais: c.pais,
            servicio: c.servicioContratado,
            contratoEstado: cc ? translateStatus(cc.estado, lang) : tr('Sin contrato', 'No contract', 'Sem contrato', lang),
            ultimoPago: lastPayment ? `${lastPayment.montoUsd} - ${translateStatus(lastPayment.estado, lang)}` : tr('Sin pagos', 'No payments', 'Sem pagamentos', lang),
            estadoServicio: translateStatus(c.estadoServicio || 'Pendiente de contrato', lang),
            colaboradoresCount: clientWorkers.length,
            ticketsAbiertos: openTickets.length,
            alertasActivas: clientAlerts.length
          };

          if (matchesSearch(`${val.empresa} ${val.pais} ${val.servicio} ${val.estadoServicio}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.estadoServicio === translateStatus('Servicio liberado', lang)).length; // Liberados
        kpis.metricB = rows.reduce((sum, r) => sum + r.colaboradoresCount, 0); // Total trabajadores
        kpis.metricC = rows.reduce((sum, r) => sum + r.alertasActivas, 0); // Alertas totales
        break;
      }

      case 'solicitudes_comercial': {
        headers = lang === 'es'
          ? ['ID', 'Empresa', 'País', 'Servicio', 'Estado', 'Asesor', 'Última Gestión', 'Próxima Acción', 'Creado']
          : lang === 'pt'
          ? ['ID', 'Empresa', 'País', 'Serviço', 'Status', 'Consultor', 'Último Contato', 'Próxima Ação', 'Criado']
          : ['ID', 'Company', 'Country', 'Service', 'Status', 'Advisor', 'Last Activity', 'Next Action', 'Created'];
        keys = ['id', 'empresa', 'pais', 'servicioRequerido', 'estado', 'asesor', 'ultimaGestion', 'proximaAccion', 'fechaRecepcion'];

        solicitudes.forEach(s => {
          if (!isRowVisibleForUser(undefined, s.asesorAsignado)) return;

          // Filters
          if (filterPais !== 'all' && s.pais !== filterPais) return;
          if (filterServicio !== 'all' && s.servicioRequerido !== filterServicio) return;
          if (filterEstado !== 'all' && s.estado !== filterEstado) return;
          if (filterAsesor !== 'all' && s.asesorAsignado !== filterAsesor) return;
          if (!matchesDate(s.fechaRecepcion)) return;

          const assignedUser = usuarios.find(u => u.correo === s.asesorAsignado);
          const followUps = seguimientos.filter(seg => seg.relacionadoId === s.id);
          const lastFollowUp = followUps.length > 0 ? followUps[followUps.length - 1] : null;

          const val = {
            id: s.id,
            empresa: s.empresa,
            pais: s.pais,
            servicioRequerido: s.servicioRequerido,
            estado: translateStatus(s.estado, lang),
            asesor: assignedUser ? assignedUser.nombre : (s.asesorAsignado || tr('Sin asignar', 'Unassigned', 'Não atribuído', lang)),
            ultimaGestion: lastFollowUp ? lastFollowUp.descripcion : tr('Sin contacto aún', 'No contact yet', 'Sem contato ainda', lang),
            proximaAccion: lastFollowUp?.proximaAccion || tr('No planificada', 'Unplanned', 'Não planejada', lang),
            fechaRecepcion: s.fechaRecepcion ? s.fechaRecepcion.split('T')[0] : ''
          };

          if (matchesSearch(`${val.empresa} ${val.pais} ${val.estado} ${val.asesor}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.estado === translateStatus('Cliente creado', lang) || r.estado === translateStatus('Aprobada', lang)).length; // Convertidos
        kpis.metricB = rows.filter(r => r.estado === translateStatus('En revisión', lang) || r.estado === translateStatus('Recibida', lang)).length; // En proceso
        kpis.metricC = rows.filter(r => r.proximaAccion && r.proximaAccion !== tr('No planificada', 'Unplanned', 'Não planejada', lang)).length; // Con planes
        break;
      }

      case 'contratos_adendums': {
        headers = lang === 'es'
          ? ['Nº Contrato', 'Cliente', 'País', 'Servicio', 'Estado', 'Generado', 'Firmado', 'Adendums', 'Responsable']
          : lang === 'pt'
          ? ['Nº Contrato', 'Cliente', 'País', 'Serviço', 'Status', 'Gerado', 'Assinado', 'Aditivos', 'Responsável']
          : ['Contract No.', 'Client', 'Country', 'Service', 'Status', 'Generated', 'Signed', 'Addenda', 'Owner'];
        keys = ['id', 'clienteNombre', 'pais', 'servicioContratado', 'estado', 'fechaGeneracion', 'fechaFirma', 'adendumsCount', 'usuarioCreador'];

        contratosComerciales.forEach(cc => {
          if (!isRowVisibleForUser(cc.clienteId, cc.asesorAsignado)) return;

          // Filters
          if (filterCliente !== 'all' && cc.clienteId !== filterCliente) return;
          if (filterPais !== 'all' && cc.pais !== filterPais) return;
          if (filterServicio !== 'all' && cc.servicioContratado !== filterServicio) return;
          if (filterEstado !== 'all' && cc.estado !== filterEstado) return;
          if (!matchesDate(cc.fechaGeneracion)) return;

          const associatedAdendums = adendums.filter(ad => ad.contratoComercialId === cc.id);

          const val = {
            id: cc.id,
            clienteNombre: cc.clienteNombre,
            pais: cc.pais,
            servicioContratado: cc.servicioContratado,
            estado: translateStatus(cc.estado, lang),
            fechaGeneracion: cc.fechaGeneracion ? cc.fechaGeneracion.split('T')[0] : '',
            fechaFirma: cc.fechaFirma ? cc.fechaFirma.split('T')[0] : tr('Pendiente', 'Pending', 'Pendente', lang),
            adendumsCount: associatedAdendums.length,
            usuarioCreador: cc.usuarioCreador
          };

          if (matchesSearch(`${val.clienteNombre} ${val.pais} ${val.estado}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.estado === translateStatus('Firmado por cliente', lang) || r.estado === translateStatus('Aprobado', lang) || r.estado === translateStatus('Servicio liberado', lang)).length; // Firmados
        kpis.metricB = rows.filter(r => r.estado === translateStatus('Borrador', lang) || r.estado === translateStatus('Generado', lang) || r.estado === translateStatus('Enviado al cliente', lang)).length; // En trámite
        kpis.metricC = rows.reduce((sum, r) => sum + r.adendumsCount, 0); // Total adendums
        break;
      }

      case 'facturacion_pagos': {
        headers = lang === 'es'
          ? ['Cliente', 'País', 'Servicio', 'Concepto', 'Monto USD', 'Estado', 'F. Soporte', 'F. Validación', 'Validador']
          : lang === 'pt'
          ? ['Cliente', 'País', 'Serviço', 'Conceito', 'Valor USD', 'Status', 'D. Comprovante', 'D. Validação', 'Validador']
          : ['Client', 'Country', 'Service', 'Concept', 'Amount USD', 'Status', 'Proof Date', 'Validation Date', 'Validator'];
        keys = ['clienteNombre', 'pais', 'servicio', 'concepto', 'montoUsd', 'estado', 'fechaPago', 'fechaValidacion', 'usuarioValidacion'];

        pagosContado.forEach(p => {
          if (!isRowVisibleForUser(p.clienteId)) return;

          // Filters
          if (filterCliente !== 'all' && p.clienteId !== filterCliente) return;
          if (filterPais !== 'all' && p.pais !== filterPais) return;
          if (filterServicio !== 'all' && p.servicio !== filterServicio) return;
          if (filterEstado !== 'all' && p.estado !== filterEstado) return;
          if (!matchesDate(p.fechaCreacion)) return;

          const val = {
            id: p.id,
            clienteNombre: p.clienteNombre,
            pais: p.pais,
            servicio: p.servicio,
            concepto: p.concepto,
            montoUsd: p.montoUsd,
            estado: translateStatus(p.estado, lang),
            fechaPago: p.fechaPago ? p.fechaPago.split('T')[0] : tr('No cargado', 'Not uploaded', 'Não carregado', lang),
            fechaValidacion: p.fechaValidacion ? p.fechaValidacion.split('T')[0] : tr('Sin validar', 'Unvalidated', 'Não validado', lang),
            usuarioValidacion: p.usuarioValidacion || 'N/A'
          };

          if (matchesSearch(`${val.clienteNombre} ${val.concepto} ${val.estado}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.reduce((sum, r) => r.estado === translateStatus('Validado', lang) || r.estado === translateStatus('Aplicado', lang) ? sum + r.montoUsd : sum, 0); // USD validados
        kpis.metricB = rows.reduce((sum, r) => r.estado === translateStatus('Soporte cargado', lang) || r.estado === translateStatus('En revisión', lang) ? sum + r.montoUsd : sum, 0); // USD en revisión
        kpis.metricC = rows.filter(r => r.estado === translateStatus('Pendiente', lang)).length; // Pagos pendientes
        break;
      }

      case 'liberacion_servicio': {
        headers = lang === 'es'
          ? ['Cliente', 'País', 'Servicio', 'Contrato Firmado', 'Pago Aprobado', 'Estado Servicio', 'Fecha Liberado', 'Liberó/Validador']
          : lang === 'pt'
          ? ['Cliente', 'País', 'Serviço', 'Contrato Assinado', 'Pagamento Aprovado', 'Status do Serviço', 'Data Liberação', 'Validador']
          : ['Client', 'Country', 'Service', 'Signed Contract', 'Approved Payment', 'Service Status', 'Release Date', 'Validator'];
        keys = ['clienteNombre', 'pais', 'servicio', 'contratoFirmado', 'pagoAprobado', 'estadoServicio', 'fechaLiberacion', 'usuarioValidador'];

        clientes.forEach(c => {
          if (!isRowVisibleForUser(c.id, c.asesorAsignado)) return;

          // Filters
          if (filterCliente !== 'all' && c.id !== filterCliente) return;
          if (filterPais !== 'all' && c.pais !== filterPais) return;
          if (filterServicio !== 'all' && c.servicioContratado !== filterServicio) return;
          if (filterEstado !== 'all' && c.estadoServicio !== filterEstado) return;

          const cc = contratosComerciales.find(contract => contract.clienteId === c.id && contract.estado !== 'Anulado');
          const isContractSigned = cc && ['Firmado por cliente', 'Aprobado', 'Servicio liberado', 'Pagado'].includes(cc.estado);
          const hasPayments = pagosContado.filter(p => p.clienteId === c.id);
          const isPagoValid = hasPayments.some(p => p.estado === 'Validado' || p.estado === 'Aplicado');

          const val = {
            id: c.id,
            clienteNombre: c.empresa,
            pais: c.pais,
            servicio: c.servicioContratado,
            contratoFirmado: isContractSigned ? tr('SÍ', 'YES', 'SIM', lang) : tr('NO', 'NO', 'NÃO', lang),
            pagoAprobado: isPagoValid ? tr('SÍ', 'YES', 'SIM', lang) : tr('NO', 'NO', 'NÃO', lang),
            estadoServicio: translateStatus(c.estadoServicio || 'Pendiente de contrato', lang),
            fechaLiberacion: c.fechaLiberacion ? c.fechaLiberacion.split('T')[0] : tr('No liberado', 'Not released', 'Não liberado', lang),
            usuarioValidador: c.usuarioValidador || tr('Pendiente', 'Pending', 'Pendente', lang)
          };

          if (matchesSearch(`${val.clienteNombre} ${val.pais} ${val.estadoServicio}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.estadoServicio === translateStatus('Servicio liberado', lang)).length; // Liberados
        kpis.metricB = rows.filter(r => r.estadoServicio === translateStatus('Servicio bloqueado', lang)).length; // Bloqueados
        kpis.metricC = rows.filter(r => r.contratoFirmado === tr('SÍ', 'YES', 'SIM', lang) && r.pagoAprobado === tr('NO', 'NO', 'NÃO', lang)).length; // Pendientes Pago
        break;
      }

      case 'trabajadores_laboral': {
        headers = lang === 'es'
          ? ['Colaborador', 'Cliente', 'País', 'Puesto', 'Ingreso', 'Estatus Colaborador', 'Contrato Laboral', 'Fecha Firma', 'Observaciones']
          : lang === 'pt'
          ? ['Colaborador', 'Cliente', 'País', 'Cargo', 'Admissão', 'Status Colaborador', 'Contrato de Trabalho', 'Data Assinatura', 'Observações']
          : ['Employee', 'Client', 'Country', 'Position', 'Hire Date', 'Employee Status', 'Labor Contract', 'Signature Date', 'Notes'];
        keys = ['nombre', 'clienteNombre', 'pais', 'puesto', 'fechaIngreso', 'estado', 'contratoEstado', 'fechaFirma', 'observaciones'];

        trabajadores.forEach(t => {
          if (!isRowVisibleForUser(t.clienteId)) return;

          // Filters
          if (filterCliente !== 'all' && t.clienteId !== filterCliente) return;
          if (filterPais !== 'all' && t.pais !== filterPais) return;
          if (filterEstado !== 'all' && t.estado !== filterEstado) return;
          if (!matchesDate(t.fechaIngreso)) return;

          const cl = contratosLaborales.find(contract => contract.trabajadorId === t.id && contract.estado !== 'Anulado');

          const val = {
            id: t.id,
            nombre: t.nombre,
            clienteNombre: t.clienteNombre,
            pais: t.pais,
            puesto: t.puesto,
            fechaIngreso: t.fechaIngreso ? t.fechaIngreso.split('T')[0] : '',
            estado: translateStatus(t.estado, lang),
            contratoEstado: cl ? translateStatus(cl.estado, lang) : tr('Sin contrato laboral', 'No labor contract', 'Sem contrato de trabalho', lang),
            fechaFirma: cl?.firmaTrabajador?.fecha ? cl.firmaTrabajador.fecha.split('T')[0] : tr('Pendiente', 'Pending', 'Pendente', lang),
            observaciones: t.observaciones || tr('Sin novedades', 'No updates', 'Sem alterações', lang)
          };

          if (matchesSearch(`${val.nombre} ${val.clienteNombre} ${val.puesto} ${val.estado}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.estado === translateStatus('Activo', lang)).length; // Activos
        kpis.metricB = rows.filter(r => r.contratoEstado === translateStatus('Firmado', lang)).length; // Firmados
        kpis.metricC = rows.filter(r => r.estado === translateStatus('En revisión', lang) || r.estado === translateStatus('Con observaciones', lang)).length; // Observados
        break;
      }

      case 'tickets_sla': {
        headers = lang === 'es'
          ? ['Nº Ticket', 'Cliente', 'Asunto', 'Prioridad', 'Estado', 'Asignado', 'Creado', 'Cumple SLA', 'Vencimiento/Diferencia']
          : lang === 'pt'
          ? ['Nº Ticket', 'Cliente', 'Assunto', 'Prioridade', 'Status', 'Atribuído', 'Criado', 'Cumpre SLA', 'Vencimento/Diferença']
          : ['Ticket No.', 'Client', 'Subject', 'Priority', 'Status', 'Assignee', 'Created', 'SLA Compliant', 'Due / Difference'];
        keys = ['id', 'clienteId', 'asunto', 'prioridad', 'estado', 'asesorAsignado', 'fechaCreacion', 'cumpleSla', 'horasRestantes'];

        tickets.forEach(tick => {
          const client = clientes.find(c => c.id === tick.clienteId);
          if (!isRowVisibleForUser(tick.clienteId, tick.asesorAsignado)) return;

          // Filters
          if (filterCliente !== 'all' && tick.clienteId !== filterCliente) return;
          if (filterEstado !== 'all' && tick.estado !== filterEstado) return;
          if (!matchesDate(tick.fechaCreacion)) return;

          const configSla = slaConfigs.find(config => config.pais === client?.pais);
          const limitHours = configSla ? configSla.tiempoRespuestaHoras : 48; // default 48h SLA

          // Compute SLA compliance
          const createdTime = new Date(tick.fechaCreacion).getTime();
          const currTime = Date.now();
          const hoursDiff = (currTime - createdTime) / (1000 * 60 * 60);
          const isBreached = tick.estado !== 'Cerrado' && tick.estado !== 'Resuelto' && hoursDiff > limitHours;

          const val = {
            id: tick.id,
            clienteId: client ? client.empresa : tr('Cliente', 'Client', 'Cliente', lang),
            asunto: tick.asunto,
            prioridad: translateStatus(tick.prioridad || 'Media', lang),
            estado: translateStatus(tick.estado, lang),
            asesorAsignado: tick.asesorAsignado || tr('Soporte General', 'General Support', 'Suporte Geral', lang),
            fechaCreacion: tick.fechaCreacion ? tick.fechaCreacion.split('T')[0] : '',
            cumpleSla: isBreached ? tr('NO', 'NO', 'NÃO', lang) : tr('SÍ', 'YES', 'SIM', lang),
            horasRestantes: isBreached 
              ? `${Math.round(hoursDiff - limitHours)}h ${tr('Vencido', 'Overdue', 'Vencido', lang)}` 
              : tick.estado === 'Cerrado' ? tr('Resuelto', 'Resolved', 'Resolvido', lang) : `${Math.round(limitHours - hoursDiff)}h ${tr('restantes', 'remaining', 'restantes', lang)}`
          };

          if (matchesSearch(`${val.clienteId} ${val.asunto} ${val.estado}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.estado !== translateStatus('Cerrado', lang) && r.estado !== translateStatus('Resuelto', lang)).length; // Abiertos
        kpis.metricB = rows.filter(r => r.cumpleSla === tr('NO', 'NO', 'NÃO', lang)).length; // SLA Vencido
        kpis.metricC = rows.filter(r => r.prioridad === translateStatus('Alta', lang) || r.prioridad === translateStatus('Crítica', lang)).length; // Urgentes
        break;
      }

      case 'alertas_operativas': {
        headers = lang === 'es'
          ? ['Tipo', 'Prioridad', 'Estado', 'Cliente', 'Proceso', 'Creado', 'Límite', 'Responsable', 'Acción Requerida']
          : lang === 'pt'
          ? ['Tipo', 'Prioridade', 'Status', 'Cliente', 'Processo', 'Criado', 'Prazo', 'Responsável', 'Ação Necessária']
          : ['Type', 'Priority', 'Status', 'Client', 'Process', 'Created', 'Deadline', 'Owner', 'Required Action'];
        keys = ['tipoAlerta', 'prioridad', 'estado', 'clienteNombre', 'entidadRelacionada', 'fechaCreacion', 'fechaLimite', 'usuarioResponsable', 'accionRequerida'];

        alertasOperativas.forEach(a => {
          if (!isRowVisibleForUser(a.clienteId, a.usuarioResponsable)) return;

          // Filters
          if (filterCliente !== 'all' && a.clienteId !== filterCliente) return;
          if (filterPais !== 'all' && a.pais !== filterPais) return;
          if (filterEstado !== 'all' && a.estado !== filterEstado) return;
          if (!matchesDate(a.fechaCreacion)) return;

          const val = {
            id: a.id,
            tipoAlerta: translateStatus(a.tipoAlerta, lang),
            prioridad: translateStatus(a.prioridad, lang),
            estado: translateStatus(a.estado, lang),
            clienteNombre: a.clienteNombre || 'N/A',
            entidadRelacionada: a.entidadRelacionada,
            fechaCreacion: a.fechaCreacion ? a.fechaCreacion.split('T')[0] : '',
            fechaLimite: a.fechaLimite ? a.fechaLimite.split('T')[0] : tr('Inmediata', 'Immediate', 'Imediata', lang),
            usuarioResponsable: a.usuarioResponsable || tr('Sin asignar', 'Unassigned', 'Não atribuído', lang),
            accionRequerida: a.accionRequerida
          };

          if (matchesSearch(`${val.clienteNombre} ${val.tipoAlerta} ${val.accionRequerida} ${val.estado}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.prioridad === translateStatus('Crítica', lang) || r.tipoAlerta === translateStatus('Bloqueante', lang)).length; // Críticas / Bloqueantes
        kpis.metricB = rows.filter(r => r.estado === translateStatus('Nueva', lang)).length; // Nuevas
        kpis.metricC = rows.filter(r => r.estado === translateStatus('En gestión', lang)).length; // En proceso
        break;
      }

      case 'gestion_asesores': {
        headers = lang === 'es'
          ? ['Asesor', 'Leads Asignados', 'Leads Convertidos', 'Fórmula de Éxito', 'Contratos Generados', 'Contratos Enviados', 'Contratos Firmados', 'Seguimientos']
          : lang === 'pt'
          ? ['Consultor', 'Leads Atribuídos', 'Leads Convertidos', 'Taxa de Conversão', 'Contratos Gerados', 'Contratos Enviados', 'Contratos Assinados', 'Acompanhamentos']
          : ['Advisor', 'Assigned Leads', 'Converted Leads', 'Conversion Rate', 'Generated Contracts', 'Sent Contracts', 'Signed Contracts', 'Follow-ups'];
        keys = ['asesorNombre', 'leadsAsignados', 'leadsConvertidos', 'tasaConversion', 'contratosGenerados', 'contratosEnviados', 'contratosFirmados', 'seguimientosCount'];

        const advisors = usuarios.filter(u => u.rol === 'asesor_comercial');

        advisors.forEach(adv => {
          if (user.rol === 'asesor_comercial' && adv.correo !== user.correo) return; // can only see themselves

          const advLeads = solicitudes.filter(s => s.asesorAsignado === adv.correo);
          const advConverted = advLeads.filter(s => s.estado === 'Cliente creado');
          const advCCs = contratosComerciales.filter(c => c.asesorAsignado === adv.correo);
          const advFollows = seguimientos.filter(seg => seg.usuario === adv.correo);

          const conversionPct = advLeads.length > 0 ? `${Math.round((advConverted.length / advLeads.length) * 100)}%` : '0%';

          const val = {
            id: adv.correo,
            asesorNombre: adv.nombre,
            leadsAsignados: advLeads.length,
            leadsConvertidos: advConverted.length,
            tasaConversion: conversionPct,
            contratosGenerados: advCCs.filter(c => c.estado !== 'Borrador').length,
            contratosEnviados: advCCs.filter(c => ['Enviado al cliente', 'Visto por cliente', 'Pendiente de firma del cliente', 'Firmado por cliente', 'Aprobado', 'Servicio liberado'].includes(c.estado)).length,
            contratosFirmados: advCCs.filter(c => ['Firmado por cliente', 'Aprobado', 'Servicio liberado'].includes(c.estado)).length,
            seguimientosCount: advFollows.length
          };

          if (matchesSearch(`${val.asesorNombre}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.reduce((sum, r) => sum + r.leadsAsignados, 0); // Leads totales
        kpis.metricB = rows.reduce((sum, r) => sum + r.leadsConvertidos, 0); // Leads logrados
        kpis.metricC = rows.reduce((sum, r) => sum + r.contratosFirmados, 0); // Contratos completados
        break;
      }

      case 'auditoria_trazabilidad': {
        headers = lang === 'es'
          ? ['Fecha/Hora', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Estado Anterior', 'Estado Nuevo', 'Observaciones/Motivo']
          : lang === 'pt'
          ? ['Data/Hora', 'Usuário', 'Função', 'Módulo', 'Ação', 'Status Anterior', 'Novo Status', 'Observações/Motivo']
          : ['Date/Time', 'User', 'Role', 'Module', 'Action', 'Previous State', 'New State', 'Notes/Reason'];
        keys = ['fecha', 'usuario', 'rol', 'tabla', 'campo', 'valorAnterior', 'valorNuevo', 'motivo'];

        logs.forEach(l => {
          // Filters
          if (filterAsesor !== 'all' && l.usuario !== filterAsesor) return;
          if (!matchesDate(l.fecha)) return;

          const u = usuarios.find(usr => usr.correo === l.usuario);
          const val = {
            id: l.id,
            fecha: l.fecha ? l.fecha.replace('T', ' ').substring(0, 19) : '',
            usuario: l.usuario,
            rol: u ? u.rol : tr('Usuario', 'User', 'Usuário', lang),
            tabla: l.tabla || tr('Sistema', 'System', 'Sistema', lang),
            campo: l.campo || tr('Gestión', 'Management', 'Gestão', lang),
            valorAnterior: l.valorAnterior || '-',
            valorNuevo: l.valorNuevo || '-',
            motivo: l.motivo || 'N/A'
          };

          if (matchesSearch(`${val.usuario} ${val.tabla} ${val.campo} ${val.motivo}`)) {
            rows.push(val);
          }
        });

        kpis.total = rows.length;
        kpis.metricA = rows.filter(r => r.campo === 'Descarga').length; // Descargas de reportes
        kpis.metricB = rows.filter(r => r.rol === 'supracliente' || r.rol === 'administrador').length; // Acciones administrativas
        kpis.metricC = rows.filter(r => r.tabla === 'Clientes' || r.tabla === 'Colaboradores').length; // Entidades críticas alteradas
        break;
      }
    }

    return { rows, headers, keys, kpis };
  };

  const { rows, headers, keys, kpis } = getProcessedReportData();

  // Excel Export Logic: Download beautiful formatted tabular file
  const handleExportExcel = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `Reporte: ${currentT.reports[activeReport]?.name}\n`;
    csvContent += `Generador: ${user.nombre} (${user.correo})\n`;
    csvContent += `Fecha de Generación: ${new Date().toLocaleString()}\n`;
    csvContent += `Filtros Aplicados: Cliente: ${filterCliente}, Pais: ${filterPais}, Servicio: ${filterServicio}, Estado: ${filterEstado}\n\n`;

    // Headers
    csvContent += headers.join('\t') + '\n';

    // Rows
    rows.forEach(row => {
      const line = keys.map(k => {
        let val = row[k];
        if (val === undefined || val === null) return '';
        // escape tabs/newlines
        return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
      });
      csvContent += line.join('\t') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `QuickHire_Reporte_${activeReport}_${new Date().toISOString().substring(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track download in log
    trackDownloadLog(activeReport, 'Excel');
  };

  // PDF Export Logic (Interactive view that fits the guidelines)
  const handleOpenPrintPreview = () => {
    setShowPrintModal(true);
    trackDownloadLog(activeReport, 'PDF');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Unique list of clients for filter dropdown
  const uniqueClients = Array.from(new Set(clientes.map(c => c.id))).map(id => {
    return clientes.find(c => c.id === id);
  }).filter(Boolean) as Cliente[];

  // Unique countries
  const countries = Array.from(new Set([
    ...clientes.map(c => c.pais),
    ...solicitudes.map(s => s.pais)
  ])).filter(Boolean);

  // Unique advisors/responsibles
  const advisors = usuarios.filter(u => u.rol === 'asesor_comercial');

  // Check if current report is allowed for user
  if (!isReportAllowed(activeReport)) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-xl mx-auto shadow-xs my-10">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">{currentT.unauthorized}</h3>
        <p className="text-slate-500 text-sm">
          {lang === 'es' ? 'Comuníquese con el administrador si requiere acceso a este reporte de gestión.' : 'Contact the administrator if you require access to this management report.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Printable Area Styles */}
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
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header card with background pattern */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
          <Layers className="w-64 h-64 text-indigo-900" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-2.5">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentT.title}</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">{currentT.description}</p>
          </div>
          {/* User profile identifier context */}
          <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-slate-800">{user.nombre}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.rol.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Catalog / Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.entries(currentT.reports).map(([key, item]) => {
          const reportKey = key as ReportType;
          const allowed = isReportAllowed(reportKey);
          if (!allowed) return null;

          const isSelected = activeReport === reportKey;
          return (
            <button
              key={reportKey}
              onClick={() => {
                setActiveReport(reportKey);
                handleClearFilters();
              }}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/10'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {reportKey === 'estado_integral' && <Layers className="w-4 h-4" />}
                  {reportKey === 'solicitudes_comercial' && <Briefcase className="w-4 h-4" />}
                  {reportKey === 'contratos_adendums' && <FileCheck className="w-4 h-4" />}
                  {reportKey === 'facturacion_pagos' && <CreditCard className="w-4 h-4" />}
                  {reportKey === 'liberacion_servicio' && <CheckCircle2 className="w-4 h-4" />}
                  {reportKey === 'trabajadores_laboral' && <Users className="w-4 h-4" />}
                  {reportKey === 'tickets_sla' && <TicketIcon className="w-4 h-4" />}
                  {reportKey === 'alertas_operativas' && <ShieldAlert className="w-4 h-4" />}
                  {reportKey === 'gestion_asesores' && <UserCheck className="w-4 h-4" />}
                  {reportKey === 'auditoria_trazabilidad' && <History className="w-4 h-4" />}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-xs mt-3 line-clamp-1">{item.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-50">
          <Filter className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">{currentT.filters}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Cliente Filter - disabled or pre-selected for Clients */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentT.client}</label>
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              disabled={user.rol === 'cliente'}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
            >
              {user.rol !== 'cliente' && <option value="all">{currentT.all}</option>}
              {uniqueClients.map(c => (
                <option key={c.id} value={c.id}>{c.empresa}</option>
              ))}
              {user.rol === 'cliente' && (
                <option value={user.clienteId}>{clientes.find(c => c.id === user.clienteId)?.empresa || 'Mi Empresa'}</option>
              )}
            </select>
          </div>

          {/* Pais Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentT.country}</label>
            <select
              value={filterPais}
              onChange={(e) => setFilterPais(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{currentT.all}</option>
              {countries.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Servicio Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentT.service}</label>
            <select
              value={filterServicio}
              onChange={(e) => setFilterServicio(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{currentT.all}</option>
              <option value="EOR">EOR (Employer of Record)</option>
              <option value="PEO">PEO (Professional Employer Org)</option>
              <option value="HRO">HRO (HR Outsourcing)</option>
            </select>
          </div>

          {/* Estado Filter (Context dependent) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentT.state}</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">{currentT.all}</option>
              {activeReport === 'solicitudes_comercial' && (
                <>
                  <option value="Recibida">Recibida</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Cliente creado">Cliente creado</option>
                </>
              )}
              {activeReport === 'contratos_adendums' && (
                <>
                  <option value="Borrador">Borrador</option>
                  <option value="Generado">Generado</option>
                  <option value="Enviado al cliente">Enviado al cliente</option>
                  <option value="Firmado por cliente">Firmado por cliente</option>
                  <option value="Aprobado">Aprobado</option>
                </>
              )}
              {activeReport === 'facturacion_pagos' && (
                <>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Soporte cargado">Soporte cargado</option>
                  <option value="Validado">Validado</option>
                  <option value="Rechazado">Rechazado</option>
                </>
              )}
              {activeReport === 'liberacion_servicio' && (
                <>
                  <option value="Pendiente de contrato comercial">Pendiente de contrato comercial</option>
                  <option value="Pendiente de pago">Pendiente de pago</option>
                  <option value="Pago en revisión">Pago en revisión</option>
                  <option value="Pago validado">Pago validado</option>
                  <option value="Servicio liberado">Servicio liberado</option>
                  <option value="Servicio bloqueado">Servicio bloqueado</option>
                </>
              )}
              {activeReport === 'trabajadores_laboral' && (
                <>
                  <option value="Activo">Activo</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Con observaciones">Con observaciones</option>
                  <option value="Inactivo">Inactivo</option>
                </>
              )}
              {activeReport === 'alertas_operativas' && (
                <>
                  <option value="Nueva">Nueva</option>
                  <option value="En gestión">En gestión</option>
                  <option value="Resuelta">Resuelta</option>
                  <option value="Cerrada">Cerrada</option>
                </>
              )}
            </select>
          </div>

          {/* Asesor / Responsable Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentT.advisor}</label>
            <select
              value={filterAsesor}
              onChange={(e) => setFilterAsesor(e.target.value)}
              disabled={user.rol === 'asesor_comercial'}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
            >
              {user.rol !== 'asesor_comercial' && <option value="all">{currentT.all}</option>}
              {advisors.map(adv => (
                <option key={adv.correo} value={adv.correo}>{adv.nombre}</option>
              ))}
              {user.rol === 'asesor_comercial' && (
                <option value={user.correo}>{user.nombre}</option>
              )}
            </select>
          </div>

          {/* Rango de fecha inputs */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{currentT.startDate}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-white text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Clear and filter triggers */}
        <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-slate-50 gap-2">
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={currentT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none w-full"
            />
          </div>
          <div className="flex space-x-2.5">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {currentT.clearFilters}
            </button>
          </div>
        </div>
      </div>

      {/* KPI BOX BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total volume */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tr('Total Registros', 'Total Records', 'Total de Registros', lang)}</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{kpis.total}</h3>
          </div>
        </div>

        {/* Card 2: Main KPI Contextual */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            {activeReport === 'facturacion_pagos' ? <CreditCard className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {activeReport === 'estado_integral' && tr('Clientes Liberados', 'Released Clients', 'Clientes Liberados', lang)}
              {activeReport === 'solicitudes_comercial' && tr('Clientes Convertidos', 'Converted Clients', 'Clientes Convertidos', lang)}
              {activeReport === 'contratos_adendums' && tr('Contratos Firmados', 'Signed Contracts', 'Contratos Assinados', lang)}
              {activeReport === 'facturacion_pagos' && tr('Monto Recaudado', 'Collected Amount', 'Valor Arrecadado', lang)}
              {activeReport === 'liberacion_servicio' && tr('Servicios Activos', 'Active Services', 'Serviços Ativos', lang)}
              {activeReport === 'trabajadores_laboral' && tr('Trabajadores Activos', 'Active Employees', 'Colaboradores Ativos', lang)}
              {activeReport === 'tickets_sla' && tr('Tickets Abiertos', 'Open Tickets', 'Tickets Abertos', lang)}
              {activeReport === 'alertas_operativas' && tr('Alertas Críticas', 'Critical Alerts', 'Alertas Críticos', lang)}
              {activeReport === 'gestion_asesores' && tr('Total Leads Asignados', 'Total Assigned Leads', 'Total Leads Atribuídos', lang)}
              {activeReport === 'auditoria_trazabilidad' && tr('Descargas Registradas', 'Logged Downloads', 'Downloads Registrados', lang)}
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {activeReport === 'facturacion_pagos' ? `${kpis.metricA.toLocaleString()}` : kpis.metricA}
            </h3>
          </div>
        </div>

        {/* Card 3: Second KPI Contextual */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {activeReport === 'estado_integral' && tr('Total Colaboradores', 'Total Employees', 'Total de Colaboradores', lang)}
              {activeReport === 'solicitudes_comercial' && tr('Solicitudes en Trámite', 'Pending Requests', 'Solicitações em Trâmite', lang)}
              {activeReport === 'contratos_adendums' && tr('Contratos en Proceso', 'Contracts in Process', 'Contratos em Processo', lang)}
              {activeReport === 'facturacion_pagos' && tr('Monto en Revisión', 'Amount in Review', 'Valor em Revisão', lang)}
              {activeReport === 'liberacion_servicio' && tr('Servicios Bloqueados', 'Blocked Services', 'Serviços Bloqueados', lang)}
              {activeReport === 'trabajadores_laboral' && tr('Contratos Firmados', 'Signed Contracts', 'Contratos Assinados', lang)}
              {activeReport === 'tickets_sla' && tr('SLA Vencido', 'SLA Breached', 'SLA Vencido', lang)}
              {activeReport === 'alertas_operativas' && tr('Alertas Nuevas', 'New Alerts', 'Novos Alertas', lang)}
              {activeReport === 'gestion_asesores' && tr('Convertidos con Éxito', 'Successfully Converted', 'Convertidos com Sucesso', lang)}
              {activeReport === 'auditoria_trazabilidad' && tr('Admin Logs', 'Admin Logs', 'Logs Admin', lang)}
            </p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {activeReport === 'facturacion_pagos' ? `${kpis.metricB.toLocaleString()}` : kpis.metricB}
            </h3>
          </div>
        </div>

        {/* Card 4: Action triggers */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <FileSpreadsheet className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">{tr('Exportación Ejecutiva', 'Executive Export', 'Exportação Executiva', lang)}</p>
          <div className="flex space-x-2 mt-4 relative z-10">
            <button
              onClick={handleOpenPrintPreview}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* REPORT DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">
              {currentT.reports[activeReport]?.name} - {tr('Datos Completos', 'Full Data View', 'Visualização Completa', lang)}
            </h3>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            {rows.length} {tr('filas encontradas', 'rows found', 'linhas encontradas', lang)}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">{currentT.loadingText}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-20 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-semibold">{currentT.noData}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    {keys.map((k, keyIdx) => {
                      const val = row[k];
                      return (
                        <td key={keyIdx} className="p-4 text-xs font-semibold text-slate-700">
                          {/* Rich Badge rendering for statuses */}
                          {k === 'estado' || k === 'estadoServicio' || k === 'contratoEstado' ? (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              val === 'Servicio liberado' || val === 'Validado' || val === 'Aplicado' || val === 'Cliente creado' || val === 'Firmado por cliente' || val === 'Aprobado' || val === 'SÍ' || val === 'Activo' || val === 'YES' || val === 'SIM' || val === 'Active' || val === 'Released'
                                ? 'bg-emerald-50 text-emerald-700'
                                : val === 'Pendiente' || val === 'En revisión' || val === 'Soporte cargado' || val === 'Borrador' || val === 'Generado' || val === 'Enviado al cliente' || val === 'Pending' || val === 'Draft' || val === 'Under review'
                                ? 'bg-amber-50 text-amber-700'
                                : val === 'Servicio bloqueado' || val === 'Rechazado' || val === 'NO' || val === 'Vencida' || val === 'Anulado' || val === 'Blocked' || val === 'Rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {String(val)}
                            </span>
                          ) : k === 'prioridad' || k === 'tipoAlerta' ? (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              val === 'Alta' || val === 'Crítica' || val === 'Bloqueante' || val === 'High' || val === 'Critical' || val === 'Blocking'
                                ? 'bg-rose-50 text-rose-700'
                                : val === 'Media' || val === 'Preventiva' || val === 'Medium' || val === 'Preventive'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {String(val)}
                            </span>
                          ) : k === 'montoUsd' ? (
                            <span className="font-bold text-slate-900">${val.toLocaleString()}</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SESSION GENERATION TRACE LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Information Alert Box */}
        <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h4 className="font-extrabold text-slate-800 text-sm">{tr('Internacionalización y Alcance', 'Internationalization & Scope', 'Internacionalização e Escopo', lang)}</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {tr(
                'Este reporte se adapta automáticamente a la configuración regional seleccionada (Español, Inglés o Portugués) y aplica los filtros de seguridad de datos por rol (RLS). Los clientes solo tienen acceso a datos de su propia compañía, los asesores comerciales a sus leads y cuentas asignadas, y los administradores tienen visibilidad global completa.',
                'This report dynamically adapts to the selected regional locale (Spanish, English, or Portuguese) and enforces Role-Based Data Security (RLS). Clients can only view records corresponding to their company, commercial advisors are limited to their assigned leads, and administrators enjoy full global visibility.',
                'Este relatório adapta-se automaticamente à configuração regional selecionada (Espanhol, Inglês ou Português) e aplica filtros de segurança de dados por função (RLS). Os clientes só têm acesso aos dados de sua própria empresa, os consultores comerciais aos seus leads e contas atribuídas, e os administradores têm visibilidade global completa.',
                lang
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{currentT.generatedBy}: {user.correo}</span>
            <span>{currentT.generationDate}: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Trace logs history of the report */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
            <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">{currentT.historyLogs}</h4>
            <History className="w-4 h-4 text-indigo-600" />
          </div>
          {traceHistory.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-semibold text-center py-6">
              {tr('No se han generado descargas en esta sesión.', 'No downloads triggered in this session.', 'Nenhum download gerado nesta sessão.', lang)}
            </p>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {traceHistory.map(trace => (
                <div key={trace.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-800">{trace.action}</p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{trace.reportName}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${trace.format === 'PDF' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {trace.format}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINT PREVIEW / EXECUTIVE PDF PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">{tr('Vista Previa Impresión PDF', 'PDF Print Preview', 'Visualização de Impressão PDF', lang)}</h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE PRINTABLE PREVIEW CONTENT */}
            <div className="overflow-y-auto flex-1 p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100" id="print-area">
              <div className="bg-white p-8 max-w-3xl mx-auto shadow-sm border border-slate-200 text-slate-800 font-sans leading-relaxed">
                {/* Header info */}
                <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-5 mb-6">
                  <div>
                    <h1 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Quick Hire EOR</h1>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{tr('Sistema Global de Nómina y EOR', 'Global Payroll & EOR Platform', 'Sistema Global de Folha e EOR', lang)}</p>
                    <p className="text-xs text-slate-400 mt-2">ID: {activeReport.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-md font-bold text-slate-800">{currentT.reports[activeReport]?.name}</h2>
                    <p className="text-[10px] text-slate-400 mt-1">{currentT.generationDate}: {new Date().toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400">{currentT.generatedBy}: {user.nombre} ({user.correo})</p>
                  </div>
                </div>

                {/* Executive Summary & KPIs */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">{currentT.summaryKpis}</h3>
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{tr('Total Registros', 'Total Records', 'Total de Registros', lang)}</p>
                      <p className="text-xl font-extrabold text-slate-800 mt-1">{kpis.total}</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {activeReport === 'facturacion_pagos' ? tr('Monto Aprobado', 'Approved Amount', 'Valor Aprovado', lang) : tr('Métrica A', 'Metric A', 'Métrica A', lang)}
                      </p>
                      <p className="text-xl font-extrabold text-emerald-600 mt-1">
                        {activeReport === 'facturacion_pagos' ? `${kpis.metricA.toLocaleString()}` : kpis.metricA}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {activeReport === 'facturacion_pagos' ? tr('Monto en Revisión', 'Amount under Review', 'Valor em Revisão', lang) : tr('Métrica B', 'Metric B', 'Métrica B', lang)}
                      </p>
                      <p className="text-xl font-extrabold text-amber-600 mt-1">
                        {activeReport === 'facturacion_pagos' ? `${kpis.metricB.toLocaleString()}` : kpis.metricB}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filters context */}
                <div className="mb-6 p-3 bg-indigo-50/50 rounded-lg text-slate-600 border border-indigo-100/50">
                  <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">{currentT.activeFiltersText}:</p>
                  <p className="text-[10px] font-semibold mt-1">
                    {tr('Cliente', 'Client', 'Cliente', lang)}: <span className="text-slate-800 font-bold">{filterCliente === 'all' ? tr('Todos', 'All', 'Todos', lang) : uniqueClients.find(c => c.id === filterCliente)?.empresa}</span> | 
                    {tr('País', 'Country', 'País', lang)}: <span className="text-slate-800 font-bold">{filterPais === 'all' ? tr('Todos', 'All', 'Todos', lang) : filterPais}</span> | 
                    {tr('Servicio', 'Service', 'Serviço', lang)}: <span className="text-slate-800 font-bold">{filterServicio === 'all' ? tr('Todos', 'All', 'Todos', lang) : filterServicio}</span> | 
                    {tr('Estado', 'Status', 'Status', lang)}: <span className="text-slate-800 font-bold">{filterEstado === 'all' ? tr('Todos', 'All', 'Todos', lang) : filterEstado}</span>
                  </p>
                </div>

                {/* Data Table Print */}
                <div>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100">
                        {headers.map((h, idx) => (
                          <th key={idx} className="border border-slate-200 p-2 text-[9px] font-bold text-slate-600 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {keys.map((k, keyIdx) => {
                            const val = row[k];
                            return (
                              <td key={keyIdx} className="border border-slate-200 p-2 text-[9px] font-semibold text-slate-700">
                                {String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footnote */}
                <div className="mt-10 border-t border-slate-200 pt-3 text-center text-[9px] font-bold text-slate-400 uppercase">
                  <p>{tr('Documento confidencial generado automáticamente por Quick Hire EOR.', 'Confidential document automatically generated by Quick Hire EOR.', 'Documento confidencial gerado automaticamente pela Quick Hire EOR.', lang)}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                {tr('Cerrar', 'Close', 'Fechar', lang)}
              </button>
              <button
                onClick={handlePrintPdf}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{tr('Enviar a Impresora / Guardar PDF', 'Send to Printer / Save PDF', 'Enviar para Impressora / Salvar PDF', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
