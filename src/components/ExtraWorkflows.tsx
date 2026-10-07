import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  User, 
  Cliente, 
  PlantillaContrato, 
  ContratoComercial, 
  Adendum, 
  ContratoLaboral, 
  TipoCambio, 
  Ticket, 
  SlaConfig, 
  ReglaSla,
  SlaSeguimiento,
  SlaHistorial,
  PlantillaNotificacion, 
  AlertaNotificacion,
  ConfiguracionSistema,
  Language,
  LATAM_COUNTRIES
} from '../types';
import { renderCommercialContractHtml } from '../data/contractTemplates';
import { 
  FileText, 
  Plus, 
  Check, 
  Lock, 
  Unlock, 
  UserCheck, 
  Settings, 
  Layers, 
  History, 
  Clock, 
  PenTool, 
  Search, 
  Filter, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Bell,
  ArrowRight,
  Upload,
  Download,
  Send,
  CheckCircle2,
  Calendar,
  DollarSign,
  Globe,
  Trash2,
  Star,
  ShieldAlert,
  Eye,
  X,
  Tag,
  User as UserIcon,
  RefreshCw,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Mail,
  EyeOff,
  Key
} from 'lucide-react';

interface ExtraWorkflowsProps {
  user: User;
  lang: Language;
  activeTab: string;
  clientes: Cliente[];
  plantillasContrato: PlantillaContrato[];
  contratosComerciales: ContratoComercial[];
  adendums: Adendum[];
  contratosLaborales: ContratoLaboral[];
  tiposCambio: TipoCambio[];
  tickets: Ticket[];
  slaConfigs: SlaConfig[];
  plantillasNotificacion: PlantillaNotificacion[];
  alertasNotificacion: AlertaNotificacion[];
  onRefresh: () => void;
  usuarios?: User[];
  initialPrepClientId?: string;
  onClearInitialPrepClientId?: () => void;
}

export default function ExtraWorkflows({
  user,
  lang,
  activeTab,
  clientes,
  plantillasContrato = [],
  contratosComerciales = [],
  adendums = [],
  contratosLaborales = [],
  tiposCambio = [],
  tickets = [],
  slaConfigs = [],
  plantillasNotificacion = [],
  alertasNotificacion = [],
  onRefresh,
  usuarios = [],
  initialPrepClientId = '',
  onClearInitialPrepClientId
}: ExtraWorkflowsProps) {
  // Nested contracts / templates tab
  const [contractSubTab, setContractSubTab] = useState<'templates' | 'commercial' | 'laboral' | 'adendum' | 'brand' | 'notifications_tpl'>(
    activeTab === 'plantillas' ? 'templates' : 'commercial'
  );

  useEffect(() => {
    if (activeTab === 'plantillas') {
      setContractSubTab('templates');
    } else if (activeTab === 'contracts' && contractSubTab === 'notifications_tpl') {
      setContractSubTab('commercial');
    }
  }, [activeTab]);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedEstado, setSelectedEstado] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active items for detailed view/modals
  const [activeTemplate, setActiveTemplate] = useState<PlantillaContrato | null>(null);
  const [activeCommercial, setActiveCommercial] = useState<ContratoComercial | null>(null);
  const [activeLaboral, setActiveLaboral] = useState<ContratoLaboral | null>(null);
  
  const [asesores, setAsesores] = useState<User[]>([]);
  useEffect(() => {
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAsesores(data.filter((u: any) => u.rol === 'asesor_comercial' || u.rol === 'administrador'));
        }
      })
      .catch(() => {});
  }, []);

  const availableAdvisors = (usuarios.length > 0 ? usuarios : asesores).filter(u => u.rol === 'asesor_comercial' || u.rol === 'administrador');
  
  // Creation Modals
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateCommercial, setShowCreateCommercial] = useState(false);
  const [showCreateLaboral, setShowCreateLaboral] = useState(false);
  const [showCreateAdendum, setShowCreateAdendum] = useState(false);

  // Form states
  // 1. Template form
  const [tplNombre, setTplNombre] = useState('');
  const [tplTipo, setTplTipo] = useState<'comercial' | 'laboral' | 'adendum'>('comercial');
  const [tplPais, setTplPais] = useState('México');
  const [tplServicio, setTplServicio] = useState('EOR');
  const [tplVersion, setTplVersion] = useState('1.0');
  const [tplVigencia, setTplVigencia] = useState('2026-01-01 a 2026-12-31');
  const [tplVariables, setTplVariables] = useState<string[]>(['empresa', 'cedulaJuridica', 'pais', 'direccion']);
  const [tplArchivoBase, setTplArchivoBase] = useState('');
  const [tplObservaciones, setTplObservaciones] = useState('');

  // 2. Commercial contract form
  const [commClienteId, setCommClienteId] = useState('');
  const [commPlantillaId, setCommPlantillaId] = useState('');
  const [commCedula, setCommCedula] = useState('');
  const [commDireccion, setCommDireccion] = useState('');
  const [commRepresentante, setCommRepresentante] = useState('');
  const [commRepresentanteProv, setCommRepresentanteProv] = useState('Daniel Decan');
  const [commFechaInicio, setCommFechaInicio] = useState('');
  const [commFee, setCommFee] = useState(1500);
  const [commMoneda, setCommMoneda] = useState('USD');
  const [commCondiciones, setCommCondiciones] = useState('Mensual - Pago Anticipado');
  const [commBeneficios, setCommBeneficios] = useState<string[]>([]);

  // 3. Laboral contract form
  const [labTrabajadorId, setLabTrabajadorId] = useState('');
  const [labPlantillaId, setLabPlantillaId] = useState('');
  const [labCedula, setLabCedula] = useState('');
  const [labSalario, setLabSalario] = useState(35000);
  const [labPuesto, setLabPuesto] = useState('');
  const [labModalidad, setLabModalidad] = useState('Remoto');

  // 4. Adendum Form
  const [adCommId, setAdCommId] = useState('');
  const [adPlantillaId, setAdPlantillaId] = useState('');
  const [adMotivo, setAdMotivo] = useState('');
  const [adDescripcionCambio, setAdDescripcionCambio] = useState('');
  const [adUsuarioResponsable, setAdUsuarioResponsable] = useState('');
  const [adObservaciones, setAdObservaciones] = useState('');
  const [adContenido, setAdContenido] = useState('');

  // 5. Exchange rate form
  const [exchangeMonedaOrigen, setExchangeMonedaOrigen] = useState('USD');
  const [exchangeMonedaDestino, setExchangeMonedaDestino] = useState('MXN');
  const [exchangeTasa, setExchangeTasa] = useState('');
  const [exchangeMarkup, setExchangeMarkup] = useState('');

  // 6. Support Ticket states
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketAsunto, setTicketAsunto] = useState('');
  const [ticketDescripcion, setTicketDescripcion] = useState('');
  const [ticketClienteId, setTicketClienteId] = useState('');
  const [ticketPrioridad, setTicketPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
  const [ticketCategoria, setTicketCategoria] = useState('Soporte General');
  const [ticketReply, setTicketReply] = useState('');
  const [ticketReplyEsInterno, setTicketReplyEsInterno] = useState(false);
  const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
  const [ticketFilterCategory, setTicketFilterCategory] = useState('all');
  const [ticketFilterPriority, setTicketFilterPriority] = useState('all');
  const [ticketFilterSearch, setTicketFilterSearch] = useState('');

  // 8. SLA module states
  const [slaSubTab, setSlaSubTab] = useState<'trackers' | 'rules' | 'history'>('rules');
  const [reglasSla, setReglasSla] = useState<ReglaSla[]>([]);
  const [slaSeguimientos, setSlaSeguimientos] = useState<SlaSeguimiento[]>([]);
  const [slaHistoriales, setSlaHistoriales] = useState<SlaHistorial[]>([]);
  
  const [showCreateSlaRule, setShowCreateSlaRule] = useState(false);
  const [showPauseResumeSlaModal, setShowPauseResumeSlaModal] = useState(false);
  const [activeSlaSeguimiento, setActiveSlaSeguimiento] = useState<SlaSeguimiento | null>(null);
  const [pauseSlaReason, setPauseSlaReason] = useState('');
  
  // Rule form states
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [slaNombre, setSlaNombre] = useState('');
  const [slaDescripcion, setSlaDescripcion] = useState('');
  const [slaTipoProceso, setSlaTipoProceso] = useState('ticket_creado');
  const [slaCategoria, setSlaCategoria] = useState('Soporte General');
  const [slaPrioridad, setSlaPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
  const [slaPais, setSlaPais] = useState('Global');
  const [slaClienteId, setSlaClienteId] = useState('Global');
  const [slaTiempoRespuesta, setSlaTiempoRespuesta] = useState(4);
  const [slaTiempoResolucion, setSlaTiempoResolucion] = useState(24);
  const [slaHorarioLaboral, setSlaHorarioLaboral] = useState('24/7');
  const [slaTiempoAlertaPreviaHoras, setSlaTiempoAlertaPreviaHoras] = useState(2);
  const [slaResponsablePrincipal, setSlaResponsablePrincipal] = useState('administrador-eor-peo@grupostt.com');
  const [slaResponsableEscalamiento, setSlaResponsableEscalamiento] = useState('superadministrador-eor-peo@grupostt.com');
  const [slaActivo, setSlaActivo] = useState(true);
  const [slaFechaInicioVigencia, setSlaFechaInicioVigencia] = useState('2026-01-01');
  const [slaFechaFinVigencia, setSlaFechaFinVigencia] = useState('2026-12-31');

  // Fetch SLA data
  const fetchSlaData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/sla-rules').then(r => r.json()),
      fetch('/api/sla-trackers').then(r => r.json()),
      fetch('/api/sla-historial').then(r => r.json())
    ])
      .then(([rules, trackers, history]) => {
        if (Array.isArray(rules)) setReglasSla(rules);
        if (Array.isArray(trackers)) setSlaSeguimientos(trackers);
        if (Array.isArray(history)) setSlaHistoriales(history);
      })
      .catch((err) => {
        console.error('Error fetching SLA data:', err);
        setError('Error al cargar datos del SLA.');
      })
      .finally(() => setLoading(false));
  };

  const handleEscalateSla = (track: SlaSeguimiento) => {
    setLoading(true);
    fetch(`/api/sla-trackers/${track.id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: user.correo,
        observaciones: 'Escalamiento manual solicitado por el administrador.'
      })
    })
      .then(r => {
        if (!r.ok) throw new Error('Error al escalar SLA.');
        return r.json();
      })
      .then(() => {
        fetchSlaData();
      })
      .catch((err) => {
        console.error(err);
        setError('Error al escalar el tracker de SLA.');
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta regla de SLA?')) return;
    setLoading(true);
    fetch(`/api/sla-rules/${ruleId}`, {
      method: 'DELETE'
    })
      .then(r => {
        if (!r.ok) throw new Error('Error al eliminar regla SLA.');
        return r.json();
      })
      .then(() => {
        fetchSlaData();
      })
      .catch((err) => {
        console.error(err);
        setError('Error al eliminar la regla de SLA.');
      })
      .finally(() => setLoading(false));
  };

  const handleToggleRule = (ruleId: string) => {
    setLoading(true);
    fetch(`/api/sla-rules/${ruleId}/toggle`, {
      method: 'POST'
    })
      .then(r => {
        if (!r.ok) throw new Error('Error al cambiar estado de regla SLA.');
        return r.json();
      })
      .then(() => {
        fetchSlaData();
      })
      .catch((err) => {
        console.error(err);
        setError('Error al actualizar estado de la regla SLA.');
      })
      .finally(() => setLoading(false));
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      nombre: slaNombre || undefined,
      descripcion: slaDescripcion || undefined,
      tipoProceso: slaTipoProceso,
      categoria: slaCategoria,
      prioridad: slaPrioridad,
      pais: slaPais,
      clienteId: slaClienteId,
      tiempoRespuestaHoras: Number(slaTiempoRespuesta),
      tiempoResolucionHoras: Number(slaTiempoResolucion),
      horarioLaboral: slaHorarioLaboral,
      tiempoAlertaPreviaHoras: Number(slaTiempoAlertaPreviaHoras),
      responsablePrincipal: slaResponsablePrincipal,
      responsableEscalamiento: slaResponsableEscalamiento,
      activo: slaActivo,
      fechaInicioVigencia: slaFechaInicioVigencia,
      fechaFinVigencia: slaFechaFinVigencia
    };

    const url = editingRuleId ? `/api/sla-rules/${editingRuleId}` : '/api/sla-rules';
    const method = editingRuleId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => {
        if (!r.ok) throw new Error('Error al guardar regla SLA.');
        return r.json();
      })
      .then(() => {
        fetchSlaData();
        setShowCreateSlaRule(false);
        setEditingRuleId(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Error al guardar la regla de SLA.');
      })
      .finally(() => setLoading(false));
  };

  const handlePauseResumeSla = () => {
    if (!activeSlaSeguimiento) return;
    setLoading(true);
    const action = activeSlaSeguimiento.estadoSla === 'Pausado' ? 'resume' : 'pause';
    fetch(`/api/sla-trackers/${activeSlaSeguimiento.id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: user.correo,
        observaciones: pauseSlaReason
      })
    })
      .then(r => {
        if (!r.ok) throw new Error(`Error al ${action === 'pause' ? 'pausar' : 'reanudar'} SLA.`);
        return r.json();
      })
      .then(() => {
        fetchSlaData();
        setShowPauseResumeSlaModal(false);
        setActiveSlaSeguimiento(null);
        setPauseSlaReason('');
      })
      .catch((err) => {
        console.error(err);
        setError(`Error al cambiar el estado del SLA tracker.`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'sla') {
      fetchSlaData();
    }
  }, [activeTab]);

  // 7. Signature and Brand configurations
  const [logoBase64, setLogoBase64] = useState<string>(() => localStorage.getItem('qh_contract_logo') || '');
  const [signatureBase64, setSignatureBase64] = useState<string>(() => localStorage.getItem('qh_contract_sig') || '');
  const [signatureRepBase64, setSignatureRepBase64] = useState<string>(() => localStorage.getItem('qh_contract_sig_rep') || '');

  const downloadContractAsHtmlFile = (contractId: string, title: string, content: string, clientName: string, representativeName: string) => {
    const logoHtml = logoBase64 ? `<img src="${logoBase64}" style="max-height: 70px; display: block; margin-bottom: 20px;" />` : '';
    const sigClienteHtml = signatureRepBase64 ? `<img src="${signatureRepBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
    const sigProvHtml = signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
    const fullHtml = `
      <html>
        <head>
          <title>${title} - ${contractId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; font-size: 13px; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
            .sig-box { border-top: 1px solid #94a3b8; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #0f172a;">${title}</h1>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">ID Contrato: ${contractId}</p>
          </div>
          <div style="color: #334155;">${content}</div>
          <div class="signatures">
            <div class="sig-box">
              <strong>POR EL CLIENTE/COLABORADOR:</strong><br/>
              ${clientName}<br/>
              ${sigClienteHtml}
            </div>
            <div class="sig-box">
              <strong>POR EL PROVEEDOR (Quick Hire EOR):</strong><br/>
              ${representativeName}<br/>
              ${sigProvHtml}
            </div>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Contrato_${contractId}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Extra workflows data lists local hooks or states if needed
  const [workers, setWorkers] = useState<any[]>([]);

  const [sysConfig, setSysConfig] = useState<ConfiguracionSistema>({
    nombreRemitente: 'Quick Hire LATAM - Alertas STT',
    correoRemitente: 'alertas@grupostt.com',
    correoCopiaSolicitudes: 'alertas@grupostt.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'alertas@grupostt.com',
    smtpPass: 'smjl brpm xyer bwzp',
    notificacionesActivas: true
  });
  const [savingSysConfig, setSavingSysConfig] = useState(false);
  const [sysConfigMsg, setSysConfigMsg] = useState('');
  const [testEmailRecipient, setTestEmailRecipient] = useState('alertas@grupostt.com');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  useEffect(() => {
    if (activeTab === 'notifications') {
      api.getConfiguracionSistema()
        .then(res => {
          if (res) setSysConfig(res);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    // Load workers list to map in laborals
    fetch('/api/trabajadores')
      .then(r => r.json())
      .then(data => setWorkers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (commClienteId) {
      const cli = clientes.find(c => c.id === commClienteId);
      if (cli) {
        setCommCedula(cli.cedulaJuridica || '');
        setCommDireccion(cli.direccion || '');
        setCommRepresentante(cli.nombreContacto || '');
        setCommMoneda(cli.moneda || 'USD');
        setCommFee(cli.feePorEmpleado || 1500);
        setCommCondiciones(cli.condicionesFacturacion || 'Mensual - Pago Anticipado');
        setCommBeneficios(cli.beneficiosConfigurados || []);
      }
    }
  }, [commClienteId, clientes]);

  useEffect(() => {
    if (initialPrepClientId && clientes.length > 0) {
      const cli = clientes.find(c => c.id === initialPrepClientId);
      if (cli) {
        // Switch subtab to commercial contracts
        setContractSubTab('commercial');
        
        // Find a matching template if possible
        const matchingTemplate = plantillasContrato.find(p => p.tipo === 'comercial' && p.pais.toLowerCase() === cli.pais.toLowerCase());
        const defaultTemplateId = matchingTemplate ? matchingTemplate.id : (plantillasContrato.find(p => p.tipo === 'comercial')?.id || '');

        // Prepopulate the form states
        setCommClienteId(cli.id);
        setCommPlantillaId(defaultTemplateId);
        setCommCedula(cli.cedulaJuridica || '');
        setCommDireccion(cli.direccion || '');
        setCommRepresentante(cli.nombreContacto || '');
        setCommRepresentanteProv('Daniel Decan'); // Default Provider rep
        setCommMoneda(cli.moneda || 'USD');
        setCommFee(cli.feePorEmpleado || 250);
        setCommCondiciones(cli.credito ? `Mensual - Crédito a ${cli.credito}` : 'Mensual - Pago Anticipado');
        setCommBeneficios(cli.beneficiosConfigurados || []);
        
        // Open modal
        setShowCreateCommercial(true);
      }
      if (onClearInitialPrepClientId) {
        onClearInitialPrepClientId();
      }
    }
  }, [initialPrepClientId, clientes, plantillasContrato, onClearInitialPrepClientId]);

  const t = {
    es: {
      templates: "Plantillas de Contrato",
      commercial: "Contratos Comerciales",
      laboral: "Contratos Laborales",
      adendum: "Adendums (Anexos)",
      createTemplate: "Nueva Plantilla",
      createCommercial: "Generar Contrato Comercial",
      createLaboral: "Generar Contrato Laboral",
      createAdendum: "Generar Adendum",
      name: "Nombre",
      type: "Tipo",
      country: "País",
      service: "Servicio",
      version: "Versión",
      validity: "Vigencia",
      state: "Estado",
      actions: "Acciones",
      active: "Activo",
      inactive: "Inactivo",
      variables: "Variables Soportadas",
      baseText: "Cuerpo / Texto Base de la Plantilla",
      save: "Guardar",
      cancel: "Cancelar",
      generate: "Generar",
      client: "Cliente",
      representative: "Representante",
      currency: "Moneda",
      fee: "Fee Mensual",
      paymentLockTitle: "Validación de Pago Requerida",
      paymentLockDesc: "Por motivos de seguridad y compliance, los contratos laborales individuales de empleados no se habilitan para firma hasta que un Administrador valide el pago del contrato comercial inicial.",
      paymentUnlocked: "Pago Comercial Validado - Servicio Liberado",
      paymentLocked: "Pago Comercial Pendiente - Contratos Laborales Bloqueados",
      overridePayment: "Confirmar Pago & Liberar Servicio",
      signContract: "Firmar Contrato",
      signAsCliente: "Firmar como Cliente",
      signAsProveedor: "Firmar como Proveedor",
      signAsTrabajador: "Firmar como Trabajador",
      signed: "Firmado",
      draft: "Borrador",
      sent: "Enviado",
      released: "Servicio Liberado",
      auditTrace: "Traceabilidad de Auditoría",
      addVariable: "Agregar Variable",
      selectTemplate: "Seleccionar Plantilla",
      selectClient: "Seleccionar Cliente",
      selectWorker: "Seleccionar Trabajador",
      modalidad: "Modalidad",
      salario: "Salario Mensual",
      puesto: "Puesto / Cargo",
      motivo: "Motivo de Cambio",
      associatedContract: "Contrato Comercial Asociado",
      exchangeRates: "Tipos de Cambio Multidivisa",
      tickets: "Mesa de Ayuda (Tickets)",
      notifications: "Plantillas de Notificaciones"
    },
    en: {
      templates: "Contract Templates",
      commercial: "Commercial Contracts",
      laboral: "Labor Contracts",
      adendum: "Adendums (Addenda)",
      createTemplate: "New Template",
      createCommercial: "Generate Commercial Contract",
      createLaboral: "Generate Labor Contract",
      createAdendum: "Generate Adendum",
      name: "Name",
      type: "Type",
      country: "Country",
      service: "Service",
      version: "Version",
      validity: "Validity",
      state: "State",
      actions: "Actions",
      active: "Active",
      inactive: "Inactive",
      variables: "Supported Variables",
      baseText: "Template Body / Base Text",
      save: "Save",
      cancel: "Cancel",
      generate: "Generate",
      client: "Client",
      representative: "Representative",
      currency: "Currency",
      fee: "Monthly Fee",
      paymentLockTitle: "Payment Validation Required",
      paymentLockDesc: "For safety and compliance, individual employee labor contracts are not enabled for signing until an Administrator validates the payment of the initial commercial service contract.",
      paymentUnlocked: "Commercial Payment Validated - Service Active",
      paymentLocked: "Commercial Payment Pending - Labor Contracts Locked",
      overridePayment: "Validate Payment & Enable Service",
      signContract: "Sign Contract",
      signAsCliente: "Sign as Client",
      signAsProveedor: "Sign as Provider",
      signAsTrabajador: "Sign as Employee",
      signed: "Signed",
      draft: "Draft",
      sent: "Sent",
      released: "Service Active",
      auditTrace: "Audit Traceability",
      addVariable: "Add Variable",
      selectTemplate: "Select Template",
      selectClient: "Select Client",
      selectWorker: "Select Employee",
      modalidad: "Modality",
      salario: "Monthly Salary",
      puesto: "Position",
      motivo: "Reason for Change",
      associatedContract: "Associated Commercial Contract",
      exchangeRates: "Multi-Currency Exchange Rates",
      tickets: "Support Helpdesk Tickets",
      notifications: "Notification Templates"
    },
    pt: {
      templates: "Modelos de Contrato",
      commercial: "Contratos Comerciais",
      laboral: "Contratos de Trabalho",
      adendum: "Adendums (Aditivos)",
      createTemplate: "Novo Modelo",
      createCommercial: "Gerar Contrato Comercial",
      createLaboral: "Gerar Contrato de Trabalho",
      createAdendum: "Gerar Aditivo",
      name: "Nome",
      type: "Tipo",
      country: "País",
      service: "Serviço",
      version: "Versão",
      validity: "Vigência",
      state: "Estado",
      actions: "Ações",
      active: "Ativo",
      inactive: "Inativo",
      variables: "Variáveis Suportadas",
      baseText: "Texto Base do Modelo",
      save: "Salvar",
      cancel: "Cancelar",
      generate: "Gerar",
      client: "Cliente",
      representative: "Representante",
      currency: "Moeda",
      fee: "Taxa Mensal",
      paymentLockTitle: "Validação de Pagamento Requerida",
      paymentLockDesc: "Por motivos de segurança e compliance, os contratos de trabalho dos colaboradores não são liberados para assinatura até que um Administrador valide o pagamento comercial inicial.",
      paymentUnlocked: "Pagamento Comercial Validado - Serviço Liberado",
      paymentLocked: "Pagamento Comercial Pendente - Contratos de Trabalho Bloqueados",
      overridePayment: "Validar Pagamento & Liberar Serviço",
      signContract: "Assinar Contrato",
      signAsCliente: "Assinar como Cliente",
      signAsProveedor: "Assinar como Provedor",
      signAsTrabajador: "Assinar como Colaborador",
      signed: "Assinado",
      draft: "Rascunho",
      sent: "Enviado",
      released: "Serviço Liberado",
      auditTrace: "Rastreamento de Auditoria",
      addVariable: "Adicionar Variável",
      selectTemplate: "Selecionar Modelo",
      selectClient: "Selecionar Cliente",
      selectWorker: "Selecionar Colaborador",
      modalidad: "Modalidade",
      salario: "Salário Mensal",
      puesto: "Cargo",
      motivo: "Motivo da Alteração",
      associatedContract: "Contrato Comercial Associado",
      exchangeRates: "Taxas de Câmbio",
      tickets: "Central de Suporte (Tickets)",
      notifications: "Modelos de Notificações"
    }
  }[lang || 'es'];

  // Handlers
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createPlantillaContrato({
        nombre: tplNombre,
        tipo: tplTipo,
        pais: tplPais,
        servicio: tplServicio,
        version: tplVersion,
        vigencia: tplVigencia,
        variables: tplVariables,
        archivoBase: tplArchivoBase,
        observaciones: tplObservaciones,
        usuarioResponsable: user.correo,
        estado: 'Activo'
      });
      setSuccess("Plantilla de contrato creada y publicada con éxito!");
      setShowCreateTemplate(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al guardar plantilla.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommercial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cli = clientes.find(c => c.id === commClienteId);
      if (!cli) throw new Error("Cliente no seleccionado.");

      // Front-end validations before sending
      if (!commCedula || !commDireccion || !commRepresentante || !commRepresentanteProv || !commMoneda || commFee <= 0 || !commCondiciones) {
        throw new Error("Por favor complete todos los datos obligatorios requeridos para el contrato comercial.");
      }

      await api.createContratoComercial({
        clienteId: commClienteId,
        clienteNombre: cli.empresa,
        pais: cli.pais,
        servicioContratado: cli.servicioContratado,
        moneda: commMoneda,
        feePorEmpleado: commFee,
        condicionesComerciales: commCondiciones,
        beneficiosContratados: commBeneficios,
        representanteCliente: commRepresentante,
        representanteProveedor: commRepresentanteProv,
        plantillaId: commPlantillaId,
        usuarioCreador: user.correo,
        cedulaJuridica: commCedula,
        direccion: commDireccion,
        asesorAsignado: cli.asesorAsignado || user.correo
      });
      setSuccess("Contrato comercial generado en borrador con éxito!");
      setShowCreateCommercial(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al generar contrato.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLaboral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const w = workers.find(t => t.id === labTrabajadorId);
      if (!w) throw new Error("Trabajador no seleccionado.");

      await api.createContratoLaboral({
        clienteId: w.clienteId,
        trabajadorId: labTrabajadorId,
        trabajadorNombre: w.nombre,
        pais: w.pais,
        servicio: 'Employer of Record (EOR)',
        puesto: labPuesto || w.puesto,
        fechaIngreso: w.fechaIngreso,
        salario: labSalario,
        moneda: w.moneda,
        modalidadTrabajo: labModalidad,
        beneficiosAplicables: w.beneficiosAplicables?.map((b: any) => b.beneficioId) || [],
        plantillaId: labPlantillaId,
        usuarioCreador: user.correo
      });
      setSuccess("Contrato laboral del empleado generado con éxito!");
      setShowCreateLaboral(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al generar contrato laboral.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdPlantillaChange = (tplId: string, commId: string) => {
    setAdPlantillaId(tplId);
    const tpl = plantillasContrato.find(p => p.id === tplId);
    if (tpl) {
      const comm = contratosComerciales.find(c => c.id === commId);
      let content = tpl.archivoBase || '';
      if (comm) {
        content = content
          .replace(/{{contratoId}}/g, comm.id)
          .replace(/{{clienteNombre}}/g, comm.clienteNombre)
          .replace(/{{empresa}}/g, comm.clienteNombre)
          .replace(/{{cedulaJuridica}}/g, comm.cedulaJuridica || '')
          .replace(/{{direccion}}/g, comm.direccion || '')
          .replace(/{{pais}}/g, comm.pais)
          .replace(/{{servicio}}/g, comm.servicioContratado)
          .replace(/{{feePorEmpleado}}/g, comm.feePorEmpleado?.toLocaleString() || '')
          .replace(/{{moneda}}/g, comm.moneda);
      }
      setAdContenido(content);
    }
  };

  const handleAdCommChange = (commId: string, tplId: string) => {
    setAdCommId(commId);
    const tpl = plantillasContrato.find(p => p.id === tplId);
    const comm = contratosComerciales.find(c => c.id === commId);
    if (tpl && comm) {
      let content = tpl.archivoBase || '';
      content = content
        .replace(/{{contratoId}}/g, comm.id)
        .replace(/{{clienteNombre}}/g, comm.clienteNombre)
        .replace(/{{empresa}}/g, comm.clienteNombre)
        .replace(/{{cedulaJuridica}}/g, comm.cedulaJuridica || '')
        .replace(/{{direccion}}/g, comm.direccion || '')
        .replace(/{{pais}}/g, comm.pais)
        .replace(/{{servicio}}/g, comm.servicioContratado)
        .replace(/{{feePorEmpleado}}/g, comm.feePorEmpleado?.toLocaleString() || '')
        .replace(/{{moneda}}/g, comm.moneda);
      setAdContenido(content);
    }
  };

  const handleCreateAdendum = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const comm = contratosComerciales.find(c => c.id === adCommId);
      if (!comm) throw new Error("Contrato comercial no seleccionado.");

      await api.createAdendum({
        contratoComercialId: adCommId,
        clienteId: comm.clienteId,
        pais: comm.pais,
        servicio: comm.servicioContratado,
        motivoCambio: adMotivo,
        descripcionCambio: adDescripcionCambio,
        plantillaId: adPlantillaId,
        contenido: adContenido,
        usuarioResponsable: adUsuarioResponsable || user.correo || 'administrador-eor-peo@grupostt.com',
        observaciones: adObservaciones,
        usuarioCreador: user.correo
      } as any);

      setSuccess("Adendum generado con éxito en borrador.");
      setShowCreateAdendum(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error generando adendum.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignCommercial = async (id: string, side: 'cliente' | 'proveedor') => {
    setLoading(true);
    setError(null);
    try {
      const c = contratosComerciales.find(cc => cc.id === id);
      if (!c) throw new Error("Contrato no encontrado");

      const updateData: Partial<ContratoComercial> = {};
      if (side === 'cliente') {
        updateData.firmaCliente = {
          nombre: c.representanteCliente,
          fecha: new Date().toISOString(),
          ip: '200.55.122.9'
        };
        updateData.estado = c.firmaProveedor ? 'Firmado por cliente' : 'Pendiente de firma del cliente';
      } else {
        updateData.firmaProveedor = {
          nombre: c.representanteProveedor,
          fecha: new Date().toISOString(),
          ip: '190.24.120.55'
        };
        updateData.estado = c.firmaCliente ? 'Firmado por cliente' : 'En revisión interna';
      }

      await api.updateContratoComercial(id, updateData);
      setSuccess("Firma estampada digitalmente con estampa de tiempo y dirección IP!");
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error firmando documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseService = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.updateContratoComercial(id, {
        estado: 'Servicio liberado',
        usuarioCreador: user.correo
      });
      setSuccess("¡Servicio comercial liberado con éxito! Los contratos de trabajo individuales para los empleados ya están desbloqueados.");
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error liberando servicio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommercial = async (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este contrato comercial?")) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteContratoComercial(id);
      setSuccess("Contrato comercial eliminado con éxito.");
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar contrato.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllCommercials = async () => {
    if (!window.confirm("¿Está seguro de eliminar TODOS los contratos comerciales? Esta acción es irreversible.")) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteAllContratosComerciales();
      setSuccess("Todos los contratos comerciales han sido eliminados con éxito.");
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar los contratos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignLaboral = async (id: string, side: 'trabajador' | 'representante') => {
    setLoading(true);
    setError(null);
    try {
      const cl = contratosLaborales.find(c => c.id === id);
      if (!cl) throw new Error("Contrato no encontrado");

      const updateData: Partial<ContratoLaboral> = {};
      if (side === 'trabajador') {
        updateData.firmaTrabajador = {
          nombre: cl.trabajadorNombre,
          fecha: new Date().toISOString()
        };
        updateData.estado = cl.firmaRepresentante ? 'Firmado' : 'Pendiente de firma';
      } else {
        updateData.firmaRepresentante = {
          nombre: user.nombre || 'Representante Legal',
          fecha: new Date().toISOString()
        };
        updateData.estado = cl.firmaTrabajador ? 'Firmado' : 'Pendiente de firma';
      }

      await api.updateContratoLaboral(id, updateData);
      setSuccess("Contrato laboral del empleado firmado digitalmente.");
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al firmar contrato laboral.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="extra-workflows-container" className="space-y-6">
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl flex items-start gap-3 border border-red-100 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-2xl flex items-start gap-3 border border-emerald-100 animate-fade-in">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {/* Main Tab Rendering */}
      {(activeTab === 'contracts' || activeTab === 'plantillas') && (
        <div className="space-y-6">
          
          {/* Contracts / Templates Header & Nested Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {activeTab === 'plantillas' ? 'Directorio Central de Plantillas y Modelos' : 'Módulo de Contratos y Compliance'}
                </h2>
                <p className="text-[10px] text-slate-500">
                  {activeTab === 'plantillas' 
                    ? 'Modelos legales estandarizados para contratos comerciales, locales, adendums y plantillas de correo/notificación transaccional.' 
                    : 'Administración de plantillas, contratos comerciales Cliente-EOR y contratos laborales locales.'}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl text-[10px] self-start sm:self-auto overflow-x-auto max-w-full">
              <button 
                onClick={() => setContractSubTab('templates')}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all ${contractSubTab === 'templates' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {activeTab === 'plantillas' ? 'Plantillas de Contratos' : t.templates}
              </button>
              {activeTab === 'plantillas' ? (
                <button 
                  onClick={() => setContractSubTab('notifications_tpl')}
                  className={`px-3 py-1.5 font-bold rounded-xl transition-all ${contractSubTab === 'notifications_tpl' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Plantillas de Correos y Notificaciones
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setContractSubTab('commercial')}
                    className={`px-3 py-1.5 font-bold rounded-xl transition-all ${contractSubTab === 'commercial' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.commercial}
                  </button>
                  <button 
                    onClick={() => setContractSubTab('laboral')}
                    className={`px-3 py-1.5 font-bold rounded-xl transition-all ${contractSubTab === 'laboral' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.laboral}
                  </button>
                  <button 
                    onClick={() => setContractSubTab('adendum')}
                    className={`px-3 py-1.5 font-bold rounded-xl transition-all ${contractSubTab === 'adendum' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.adendum}
                  </button>
                </>
              )}
              <button 
                onClick={() => setContractSubTab('brand')}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all ${contractSubTab === 'brand' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Logos y Firmas
              </button>
            </div>
          </div>

          {/* Sub Tab: Templates */}
          {contractSubTab === 'templates' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-xs">
                  <h3 className="font-bold text-slate-800">Directorio de Plantillas Legales y Comerciales</h3>
                  <p className="text-[10px] text-slate-400">Modelos estandarizados con variables dinámicas para EOR local y comercial.</p>
                </div>
                {(user.rol === 'administrador' || user.rol === 'supracliente' || user.rol === 'asesor_comercial' || user.rol === 'asesor') && (
                  <button 
                    onClick={() => {
                      setTplNombre('');
                      setTplArchivoBase('');
                      setTplObservaciones('');
                      setShowCreateTemplate(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.createTemplate}
                  </button>
                )}
              </div>

              {/* Template List */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">{t.name}</th>
                      <th className="p-3">{t.type}</th>
                      <th className="p-3">{t.country}</th>
                      <th className="p-3">{t.service}</th>
                      <th className="p-3">{t.version}</th>
                      <th className="p-3">{t.state}</th>
                      <th className="p-3">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantillasContrato.map(tpl => (
                      <tr key={tpl.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">
                          <div>{tpl.nombre}</div>
                          <span className="text-[9px] text-slate-400 font-mono">{tpl.id}</span>
                        </td>
                        <td className="p-3 uppercase font-semibold text-[10px] text-indigo-600">
                          {tpl.tipo}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{tpl.pais}</td>
                        <td className="p-3 text-slate-600">{tpl.servicio}</td>
                        <td className="p-3 font-mono text-slate-500">v{tpl.version}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${tpl.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {tpl.estado === 'Activo' ? t.active : t.inactive}
                          </span>
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => setActiveTemplate(tpl)}
                            className="px-2.5 py-1 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-slate-300 font-bold rounded-xl transition text-[10px]"
                          >
                            Ver Modelo
                          </button>
                        </td>
                      </tr>
                    ))}
                    {plantillasContrato.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          No hay plantillas registradas. Agrega una plantilla comercial o laboral para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Notification Templates (Email & Notifications Hub) */}
          {contractSubTab === 'notifications_tpl' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Plantillas de Notificaciones y Correos Electrónicos</h3>
                  <p className="text-[10px] text-slate-400">Mensajes transaccionales automáticos por evento, variables de reemplazo y canales de entrega.</p>
                </div>
                <span className="text-[10px] bg-indigo-50 font-bold text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">
                  {plantillasNotificacion.length} Plantillas Activas
                </span>
              </div>

              {/* Grid of Notification Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plantillasNotificacion.map(tpl => (
                  <div key={tpl.id} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-3 hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-100/70 text-indigo-800 rounded-md font-bold text-[8px] uppercase tracking-wider">
                          {tpl.evento || 'Evento'}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 mt-1">{tpl.nombre}</h4>
                        <span className="text-[9px] text-slate-400 font-mono">{tpl.codigo || tpl.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${tpl.activo !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-200 text-slate-600'}`}>
                        {tpl.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {tpl.asunto && (
                      <div className="text-[10px] text-slate-700 font-semibold bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-normal">Asunto: </span>
                        {tpl.asunto}
                      </div>
                    )}

                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed italic">
                      "{tpl.plantilla}"
                    </div>

                    {tpl.variables && tpl.variables.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Variables Dinámicas:</div>
                        <div className="flex flex-wrap gap-1">
                          {tpl.variables.map(v => (
                            <span key={v} className="bg-slate-200/80 text-slate-700 text-[8.5px] font-mono px-1.5 py-0.5 rounded-md">
                              {v.startsWith('{') ? v : `{${v}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                      <span>Canal: <strong className="text-indigo-900 uppercase font-bold">{tpl.canal || 'correo'}</strong></span>
                      <span>Idioma: <strong className="text-slate-700 uppercase font-bold">{tpl.idioma || 'es'}</strong></span>
                    </div>
                  </div>
                ))}

                {plantillasNotificacion.length === 0 && (
                  <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No hay plantillas de notificación registradas.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub Tab: Commercial */}
          {contractSubTab === 'commercial' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-xs">
                  <h3 className="font-bold text-slate-800">Contratos Comerciales Cliente-Proveedor</h3>
                  <p className="text-[10px] text-slate-400">Administra los acuerdos de prestación de servicio EOR y tarifas asociadas.</p>
                </div>
                {(user.rol === 'administrador' || user.rol === 'supracliente' || user.rol === 'asesor_comercial') && (
                  <div className="flex items-center gap-2">
                    {contratosComerciales.length > 0 && (
                      <button 
                        onClick={handleDeleteAllCommercials}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-2xl transition text-[10px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Borrar Todos
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (clientes.length > 0) setCommClienteId(clientes[0].id);
                        const commercialTpl = plantillasContrato.find(p => p.tipo === 'comercial');
                        if (commercialTpl) setCommPlantillaId(commercialTpl.id);
                        setShowCreateCommercial(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.createCommercial}
                    </button>
                  </div>
                )}
              </div>

              {/* Commercial List */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">{t.client}</th>
                      <th className="p-3">{t.country}</th>
                      <th className="p-3">{t.service}</th>
                      <th className="p-3">{t.fee}</th>
                      <th className="p-3">{t.state}</th>
                      <th className="p-3">Firmas</th>
                      <th className="p-3">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratosComerciales.map(c => {
                      const hasFirmaCliente = !!c.firmaCliente;
                      const hasFirmaProveedor = !!c.firmaProveedor;
                      const isReleased = c.estado === 'Servicio liberado' || c.estado === 'Pagado';

                      return (
                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            <div>{c.clienteNombre}</div>
                            <span className="text-[9px] text-slate-400 font-mono">{c.id}</span>
                          </td>
                          <td className="p-3 text-slate-600 font-semibold">{c.pais}</td>
                          <td className="p-3 text-slate-600">{c.servicioContratado}</td>
                          <td className="p-3 font-bold text-indigo-700">
                            {c.moneda} {c.feePorEmpleado.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isReleased ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {c.estado}
                            </span>
                          </td>
                          <td className="p-3 text-[10px] space-y-1">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${hasFirmaCliente ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              <span>Cliente: {hasFirmaCliente ? 'SÍ' : 'NO'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${hasFirmaProveedor ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              <span>Proveedor: {hasFirmaProveedor ? 'SÍ' : 'NO'}</span>
                            </div>
                          </td>
                          <td className="p-3 space-x-1.5">
                            <button 
                              onClick={() => setActiveCommercial(c)}
                              className="px-2 py-1 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-slate-300 font-bold rounded-xl transition text-[10px]"
                            >
                              Ver Contrato
                            </button>

                            {/* Sign buttons */}
                            {!hasFirmaCliente && (user.rol === 'cliente' || user.rol === 'administrador') && (
                              <button 
                                onClick={() => handleSignCommercial(c.id, 'cliente')}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-xl transition text-[10px]"
                              >
                                {t.signAsCliente}
                              </button>
                            )}

                            {!hasFirmaProveedor && (user.rol === 'administrador' || user.rol === 'supracliente') && (
                              <button 
                                onClick={() => handleSignCommercial(c.id, 'proveedor')}
                                className="px-2 py-1 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl transition text-[10px]"
                              >
                                {t.signAsProveedor}
                              </button>
                            )}

                            {/* Release/Approve payment button for admins */}
                            {!isReleased && hasFirmaCliente && (user.rol === 'administrador' || user.rol === 'supracliente') && (
                              <button 
                                onClick={() => handleReleaseService(c.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-[10px] flex inline-items items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" />
                                {t.overridePayment}
                              </button>
                            )}

                            {(user.rol === 'administrador' || user.rol === 'supracliente' || user.rol === 'asesor_comercial') && (
                              <button 
                                onClick={() => handleDeleteCommercial(c.id)}
                                className="px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 font-bold rounded-xl transition text-[10px]"
                                title="Eliminar contrato"
                              >
                                <Trash2 className="w-3 h-3 inline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {contratosComerciales.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          No hay contratos comerciales activos o en borrador.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Laboral */}
          {contractSubTab === 'laboral' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              
              {/* Payment Lock Alert Indicator */}
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex gap-3 text-xs text-amber-900">
                <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">{t.paymentLockTitle}</h4>
                  <p className="text-[10px] text-amber-800 mt-1">{t.paymentLockDesc}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs">
                  <h3 className="font-bold text-slate-800">Contratos Laborales de Empleados EOR</h3>
                  <p className="text-[10px] text-slate-400">Contratos individuales bajo regulación laboral local del país asignado.</p>
                </div>
                {(user.rol === 'administrador' || user.rol === 'supracliente') && (
                  <button 
                    onClick={() => {
                      if (workers.length > 0) {
                        setLabTrabajadorId(workers[0].id);
                        setLabPuesto(workers[0].puesto);
                        setLabSalario(workers[0].salario);
                      }
                      const laboralTpl = plantillasContrato.find(p => p.tipo === 'laboral');
                      if (laboralTpl) setLabPlantillaId(laboralTpl.id);
                      setShowCreateLaboral(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.createLaboral}
                  </button>
                )}
              </div>

              {/* Laboral List */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">Empleado</th>
                      <th className="p-3">País / Puesto</th>
                      <th className="p-3">{t.salario}</th>
                      <th className="p-3">Modalidad</th>
                      <th className="p-3">{t.state}</th>
                      <th className="p-3">Firmas</th>
                      <th className="p-3">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratosLaborales.map(cl => {
                      // Check if client has paid and service is fully released
                      const clientObj = clientes.find(c => c.id === cl.clienteId);
                      const cc = contratosComerciales.filter(c => c.clienteId === cl.clienteId);
                      const isPaymentUnlocked = (clientObj && clientObj.estadoServicio === 'Servicio liberado') || cc.some(c => c.estado === 'Servicio liberado' || c.estado === 'Pagado');
                      const hasFirmaTrabajador = !!cl.firmaTrabajador;
                      const hasFirmaRepresentante = !!cl.firmaRepresentante;

                      return (
                        <tr key={cl.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            <div>{cl.trabajadorNombre}</div>
                            <span className="text-[9px] text-slate-400 font-mono">{cl.id}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold">{cl.pais}</div>
                            <div className="text-[10px] text-slate-500">{cl.puesto}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-700">
                            {cl.moneda} {cl.salario.toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-600">{cl.modalidadTrabajo}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {!isPaymentUnlocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700">
                                  <Lock className="w-2.5 h-2.5" />
                                  Bloqueado por Pago
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  cl.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                }`}>
                                  <Unlock className="w-2.5 h-2.5" />
                                  {cl.estado}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-[10px] space-y-1">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${hasFirmaTrabajador ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              <span>Colaborador: {hasFirmaTrabajador ? 'SÍ' : 'NO'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${hasFirmaRepresentante ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              <span>Patrón: {hasFirmaRepresentante ? 'SÍ' : 'NO'}</span>
                            </div>
                          </td>
                          <td className="p-3 space-x-1.5">
                            {isPaymentUnlocked ? (
                              <>
                                <button 
                                  onClick={() => setActiveLaboral(cl)}
                                  className="px-2 py-1 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-slate-300 font-bold rounded-xl transition text-[10px]"
                                >
                                  Ver Contrato
                                </button>

                                {!hasFirmaTrabajador && (user.rol === 'cliente' || user.rol === 'administrador') && (
                                  <button 
                                    onClick={() => handleSignLaboral(cl.id, 'trabajador')}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-xl transition text-[10px]"
                                  >
                                    {t.signAsTrabajador}
                                  </button>
                                )}

                                {!hasFirmaRepresentante && (user.rol === 'administrador' || user.rol === 'supracliente') && (
                                  <button 
                                    onClick={() => handleSignLaboral(cl.id, 'representante')}
                                    className="px-2 py-1 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl transition text-[10px]"
                                  >
                                    Sign Representante
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Liberar pago comercial para habilitar</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {contratosLaborales.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-400">
                          No hay contratos laborales cargados para los empleados actuales.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Adendum */}
          {contractSubTab === 'adendum' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-xs">
                  <h3 className="font-bold text-slate-800">Adendums y Anexos Modificatorios</h3>
                  <p className="text-[10px] text-slate-400">Genera trazabilidad de ajustes contractuales sobre contratos existentes.</p>
                </div>
                {(user.rol === 'administrador' || user.rol === 'supracliente' || user.rol === 'asesor_comercial') && (
                  <button 
                    onClick={() => {
                      const firstComm = contratosComerciales.length > 0 ? contratosComerciales[0].id : '';
                      setAdCommId(firstComm);
                      const adTpls = plantillasContrato.filter(p => p.tipo === 'adendum');
                      if (adTpls.length > 0) {
                        setAdPlantillaId(adTpls[0].id);
                        const tpl = adTpls[0];
                        const comm = contratosComerciales.find(c => c.id === firstComm);
                        let content = tpl.archivoBase || '';
                        if (comm) {
                          content = content
                            .replace(/{{contratoId}}/g, comm.id)
                            .replace(/{{clienteNombre}}/g, comm.clienteNombre)
                            .replace(/{{empresa}}/g, comm.clienteNombre)
                            .replace(/{{cedulaJuridica}}/g, comm.cedulaJuridica || '')
                            .replace(/{{direccion}}/g, comm.direccion || '')
                            .replace(/{{pais}}/g, comm.pais)
                            .replace(/{{servicio}}/g, comm.servicioContratado)
                            .replace(/{{feePorEmpleado}}/g, comm.feePorEmpleado?.toLocaleString() || '')
                            .replace(/{{moneda}}/g, comm.moneda);
                        }
                        setAdContenido(content);
                      } else {
                        setAdPlantillaId('');
                        setAdContenido('Adendum Modificatorio:\n\nPor medio del presente...');
                      }
                      setAdMotivo('');
                      setAdDescripcionCambio('');
                      setAdUsuarioResponsable(user.correo || 'administrador-eor-peo@grupostt.com');
                      setAdObservaciones('');
                      setShowCreateAdendum(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.createAdendum}
                  </button>
                )}
              </div>

              {/* Adendums List */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3">Adendum ID</th>
                      <th className="p-3">{t.associatedContract}</th>
                      <th className="p-3">{t.motivo}</th>
                      <th className="p-3">Generación</th>
                      <th className="p-3">{t.state}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adendums.map(ad => (
                      <tr key={ad.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{ad.id}</td>
                        <td className="p-3 text-slate-600 font-mono">{ad.contratoComercialId}</td>
                        <td className="p-3 text-slate-700 font-medium">{ad.motivoCambio}</td>
                        <td className="p-3 text-slate-500">{new Date(ad.fechaGeneracion).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700">
                            {ad.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {adendums.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-slate-400">
                          No hay adendums cargados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Brand Logos and Signatures */}
          {contractSubTab === 'brand' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  Gestor de Logos, Firmas y Identidad Legal
                </h3>
                <p className="text-[10px] text-slate-500">Carga los logotipos corporativos y las firmas digitales de los representantes legales para estamparlas automáticamente en todos los contratos y adendums generados.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* 1. Brand Logo */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800">Logotipo de la Empresa (EOR)</h4>
                    <p className="text-[10px] text-slate-400">Logotipo de Quick Hire o del proveedor de servicios que aparecerá en el encabezado de los contratos.</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white min-h-[140px] flex flex-col items-center justify-center relative">
                    {logoBase64 ? (
                      <div className="space-y-2">
                        <img src={logoBase64} alt="Company Logo" className="max-h-[90px] max-w-full mx-auto object-contain rounded-md" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => {
                            setLogoBase64('');
                            localStorage.removeItem('qh_contract_logo');
                          }}
                          className="text-[9px] font-bold text-rose-600 hover:underline block mx-auto animate-fade-in"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="block text-[10px] text-slate-500 font-medium">No se ha cargado logo</span>
                      </div>
                    )}
                  </div>

                  <label className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-center cursor-pointer transition-all block text-xs">
                    <span>{logoBase64 ? 'Reemplazar Logo' : 'Seleccionar Archivo'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const b64 = reader.result as string;
                            setLogoBase64(b64);
                            localStorage.setItem('qh_contract_logo', b64);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* 2. Provider Rep Signature */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800">Firma del Proveedor (EOR)</h4>
                    <p className="text-[10px] text-slate-400">Firma del representante de Quick Hire (e.g. Daniel Decan) que se estampa al pie de firma.</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white min-h-[140px] flex flex-col items-center justify-center relative">
                    {signatureBase64 ? (
                      <div className="space-y-2">
                        <img src={signatureBase64} alt="Provider Signature" className="max-h-[90px] max-w-full mx-auto object-contain rounded-md" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => {
                            setSignatureBase64('');
                            localStorage.removeItem('qh_contract_sig');
                          }}
                          className="text-[9px] font-bold text-rose-600 hover:underline block mx-auto animate-fade-in"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <PenTool className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="block text-[10px] text-slate-500 font-medium">No se ha cargado firma</span>
                      </div>
                    )}
                  </div>

                  <label className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-center cursor-pointer transition-all block text-xs">
                    <span>{signatureBase64 ? 'Reemplazar Firma' : 'Seleccionar Archivo'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const b64 = reader.result as string;
                            setSignatureBase64(b64);
                            localStorage.setItem('qh_contract_sig', b64);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* 3. Client Rep Signature */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800">Firma de Representante Cliente</h4>
                    <p className="text-[10px] text-slate-400">Firma del representante legal de la empresa cliente que se estampa de forma automática.</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-white min-h-[140px] flex flex-col items-center justify-center relative">
                    {signatureRepBase64 ? (
                      <div className="space-y-2">
                        <img src={signatureRepBase64} alt="Client Signature" className="max-h-[90px] max-w-full mx-auto object-contain rounded-md" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => {
                            setSignatureRepBase64('');
                            localStorage.removeItem('qh_contract_sig_rep');
                          }}
                          className="text-[9px] font-bold text-rose-600 hover:underline block mx-auto animate-fade-in"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="block text-[10px] text-slate-500 font-medium">No se ha cargado firma</span>
                      </div>
                    )}
                  </div>

                  <label className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-center cursor-pointer transition-all block text-xs">
                    <span>{signatureRepBase64 ? 'Reemplazar Firma' : 'Seleccionar Archivo'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const b64 = reader.result as string;
                            setSignatureRepBase64(b64);
                            localStorage.setItem('qh_contract_sig_rep', b64);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Exchange Rates Tab */}
      {activeTab === 'exchange' && (
        <div className="space-y-6">
          {/* Banner / Header */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Módulo Cambiario de Divisas</h2>
                  <p className="text-[10px] text-slate-500">Consulta, actualiza y gestiona las tasas de cambio de divisas para cotizaciones comerciales y cálculo de nóminas en toda Latinoamérica.</p>
                </div>
              </div>
              <div className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-bold font-mono">
                Actualizado: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rates load form */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4 lg:col-span-1 h-fit">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Cargar Tipo de Cambio
                </h3>
                <p className="text-[9px] text-slate-400">Actualiza o registra una nueva tasa cambiaria de referencia para EOR.</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!exchangeTasa || Number(exchangeTasa) <= 0) {
                  setError('Por favor ingrese una tasa válida.');
                  return;
                }
                const markupVal = Number(exchangeMarkup) || 0;
                const finalCalculatedTasa = Number(exchangeTasa) * (1 + markupVal / 100);

                setLoading(true);
                setError(null);
                setSuccess(null);
                try {
                  await api.createTipoCambio({
                    monedaOrigen: exchangeMonedaOrigen,
                    monedaDestino: exchangeMonedaDestino,
                    tasa: finalCalculatedTasa,
                    baseTasa: Number(exchangeTasa),
                    porcentajeSuma: markupVal
                  });
                  setSuccess(`Tasa de cambio ${exchangeMonedaOrigen} a ${exchangeMonedaDestino} registrada con éxito. (Tasa base: ${exchangeTasa} + ${markupVal}% = ${finalCalculatedTasa.toFixed(4)})`);
                  setExchangeTasa('');
                  setExchangeMarkup('');
                  onRefresh();
                } catch (err) {
                  setError('No se pudo registrar la tasa cambiaria. Verifique la conexión.');
                } finally {
                  setLoading(false);
                }
              }} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Divisa de Origen (Base)</label>
                  <select
                    value={exchangeMonedaOrigen}
                    onChange={(e) => setExchangeMonedaOrigen(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 font-medium"
                  >
                    <option value="USD">USD - Dólar Estadounidense 🇺🇸</option>
                    <option value="EUR">EUR - Euro 🇪🇺</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">País / Divisa Destino</label>
                  <select
                    value={exchangeMonedaDestino}
                    onChange={(e) => setExchangeMonedaDestino(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 font-medium"
                  >
                    <option value="MXN">México - Peso Mexicano (MXN) 🇲🇽</option>
                    <option value="COP">Colombia - Peso Colombiano (COP) 🇨🇴</option>
                    <option value="BRL">Brasil - Real Brasileño (BRL) 🇧🇷</option>
                    <option value="DOP">República Dominicana - Peso Dominicano (DOP) 🇩🇴</option>
                    <option value="USD">Puerto Rico - Dólar Estadounidense (USD) 🇵🇷</option>
                    <option value="JMD">Jamaica - Dólar Jamaiquino (JMD) 🇯🇲</option>
                    <option value="ARS">Argentina - Peso Argentino (ARS) 🇦🇷</option>
                    <option value="CLP">Chile - Peso Chileno (CLP) 🇨🇱</option>
                    <option value="PEN">Perú - Sol Peruano (PEN) 🇵🇪</option>
                    <option value="USD">Ecuador - Dólar Estadounidense (USD) 🇪🇨</option>
                    <option value="CRC">Costa Rica - Colón Costarricense (CRC) 🇨🇷</option>
                    <option value="USD">Panamá - Dólar/Balboa (USD) 🇵🇦</option>
                    <option value="USD">El Salvador - Dólar Estadounidense (USD) 🇸🇻</option>
                    <option value="HNL">Honduras - Lempira Hondureño (HNL) 🇭🇳</option>
                    <option value="NIO">Nicaragua - Córdoba Nicaragüense (NIO) 🇳🇮</option>
                    <option value="GTQ">Guatemala - Quetzal Guatemalteco (GTQ) 🇬🇹</option>
                    <option value="BOB">Bolivia - Boliviano (BOB) 🇧🇴</option>
                    <option value="UYU">Uruguay - Peso Uruguayo (UYU) 🇺🇾</option>
                    <option value="PYG">Paraguay - Guaraní Paraguayo (PYG) 🇵🇾</option>
                    <option value="VES">Venezuela - Bolívar Soberano (VES) 🇻🇪</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tasa de Cambio Base (Equivalencia)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 font-mono">1 {exchangeMonedaOrigen} =</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      placeholder="e.g. 17.85"
                      value={exchangeTasa}
                      onChange={(e) => setExchangeTasa(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-20 pr-16 py-2 font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3.5 top-2.5 font-bold text-slate-500 font-mono">{exchangeMonedaDestino}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">% Sumado (Recargo / Incremento)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 5"
                      value={exchangeMarkup}
                      onChange={(e) => setExchangeMarkup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3.5 top-2.5 font-bold text-slate-500 font-mono">% más</span>
                  </div>
                </div>

                {exchangeTasa && Number(exchangeTasa) > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100/75 rounded-xl p-3 space-y-1">
                    <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider block">Vista Previa Tipo Cambio Final</span>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-semibold">
                      1 {exchangeMonedaOrigen} = <strong className="text-indigo-700 font-mono font-black">{(Number(exchangeTasa) * (1 + (Number(exchangeMarkup) || 0) / 100)).toFixed(4)}</strong> {exchangeMonedaDestino}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium leading-none">
                      Calculado como tasa base {exchangeTasa} + {Number(exchangeMarkup) || 0}% de incremento.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>{loading ? 'Guardando...' : 'Cargar Tipo Cambio'}</span>
                </button>
              </form>
            </div>

            {/* List and visual grid of loaded exchange rates */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4 lg:col-span-2">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Historial y Tipos de Cambio Activos</h3>
                  <p className="text-[9px] text-slate-400">Tasas cargadas actualmente para operaciones de nóminas locales.</p>
                </div>
                <div className="text-[9px] font-bold text-slate-400">
                  {tiposCambio.length} monedas registradas
                </div>
              </div>

              {tiposCambio.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No hay tasas de cambio registradas en el sistema.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Utilice el formulario lateral para ingresar la primera tasa cambiaria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiposCambio.map((tc) => {
                    // Find country flag/desc mapping
                    const mapped = [
                      { code: 'MXN', flag: '🇲🇽', desc: 'Peso Mexicano', country: 'México' },
                      { code: 'COP', flag: '🇨🇴', desc: 'Peso Colombiano', country: 'Colombia' },
                      { code: 'BRL', flag: '🇧🇷', desc: 'Real Brasileño', country: 'Brasil' },
                      { code: 'DOP', flag: '🇩🇴', desc: 'Peso Dominicano', country: 'Rep. Dominicana' },
                      { code: 'JMD', flag: '🇯🇲', desc: 'Dólar Jamaiquino', country: 'Jamaica' },
                      { code: 'ARS', flag: '🇦🇷', desc: 'Peso Argentino', country: 'Argentina' },
                      { code: 'CLP', flag: '🇨🇱', desc: 'Peso Chileno', country: 'Chile' },
                      { code: 'PEN', flag: '🇵🇪', desc: 'Sol Peruano', country: 'Perú' },
                      { code: 'USD', flag: '🇵🇷', desc: 'Dólar (Puerto Rico)', country: 'Puerto Rico' },
                      { code: 'CRC', flag: '🇨🇷', desc: 'Colón Costarricense', country: 'Costa Rica' },
                      { code: 'HNL', flag: '🇭🇳', desc: 'Lempira', country: 'Honduras' },
                      { code: 'NIO', flag: '🇳🇮', desc: 'Córdoba', country: 'Nicaragua' },
                      { code: 'GTQ', flag: '🇬🇹', desc: 'Quetzal', country: 'Guatemala' },
                      { code: 'BOB', flag: '🇧🇴', desc: 'Boliviano', country: 'Bolivia' },
                      { code: 'UYU', flag: '🇺🇾', desc: 'Peso Uruguayo', country: 'Uruguay' },
                      { code: 'PYG', flag: '🇵🇾', desc: 'Guaraní', country: 'Paraguay' },
                      { code: 'VES', flag: '🇻🇪', desc: 'Bolívar', country: 'Venezuela' }
                    ].find(m => m.code === tc.monedaDestino);

                    const flag = mapped ? mapped.flag : '🌎';
                    const country = mapped ? mapped.country : tc.monedaDestino;
                    const desc = mapped ? mapped.desc : 'Moneda Local';

                    return (
                      <div key={tc.id} className="bg-slate-50 hover:bg-slate-100/75 rounded-2xl p-4 border border-slate-100 flex justify-between items-center transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-base leading-none">{flag}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{country}</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-900">
                            {desc} ({tc.monedaDestino})
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tc.fecha).toLocaleDateString()} {new Date(tc.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-semibold">1 {tc.monedaOrigen} =</div>
                          <div className="text-sm font-black text-indigo-700 font-mono">
                            {tc.tasa.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </div>
                          {tc.baseTasa !== undefined && tc.porcentajeSuma !== undefined && (
                            <div className="text-[9px] text-indigo-500 font-bold font-mono">
                              Base: {tc.baseTasa.toFixed(4)} (+{tc.porcentajeSuma}%)
                            </div>
                          )}
                          <div className="text-[8px] text-slate-500 font-bold font-mono">ID: {tc.id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Módulo de Soporte, Tickets y Casos EOR</h2>
                <p className="text-[10px] text-slate-500">Gestión integrada de solicitudes de clientes, atención de asesores y cumplimiento de SLA global.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setTicketAsunto('');
                setTicketDescripcion('');
                setTicketClienteId(clientes[0]?.id || '');
                setTicketPrioridad('Media');
                setTicketCategoria('Soporte General');
                setShowCreateTicket(true);
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Nuevo Ticket</span>
            </button>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-3xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</div>
              <div className="text-xl font-black text-slate-900 mt-1">{tickets.length}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-3xs">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Abiertos / En Proceso</div>
              <div className="text-xl font-black text-amber-600 mt-1">
                {tickets.filter(t => ['Nuevo', 'Abierto', 'En revisión', 'En Proceso', 'Pendiente de Cliente'].includes(t.estado)).length}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-3xs">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Resueltos / Cerrados</div>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {tickets.filter(t => ['Resuelto', 'Cerrado'].includes(t.estado)).length}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-3xs">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Cumplimiento SLA</div>
              <div className="text-xl font-black text-indigo-600 mt-1">
                {tickets.length > 0 
                  ? `${Math.round((tickets.filter(t => t.slaEstado !== 'Vencido').length / tickets.length) * 100)}%` 
                  : '100%'}
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-center justify-between shadow-3xs">
            <div className="flex flex-1 min-w-[200px] items-center bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por ID, asunto, descripción o cliente..."
                value={ticketFilterSearch}
                onChange={(e) => setTicketFilterSearch(e.target.value)}
                className="bg-transparent w-full outline-none text-slate-800 font-medium placeholder:text-slate-400"
              />
              {ticketFilterSearch && (
                <button onClick={() => setTicketFilterSearch('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={ticketFilterStatus}
                onChange={(e) => setTicketFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Abierto">Abierto</option>
                <option value="En revisión">En revisión</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Respondido">Respondido</option>
                <option value="Pendiente de Cliente">Pendiente de Cliente</option>
                <option value="Resuelto">Resuelto</option>
                <option value="Cerrado">Cerrado</option>
              </select>

              <select
                value={ticketFilterPriority}
                onChange={(e) => setTicketFilterPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todas las Prioridades</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>

              <select
                value={ticketFilterCategory}
                onChange={(e) => setTicketFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Soporte General">Soporte General</option>
                <option value="Nómina y Pagos">Nómina y Pagos</option>
                <option value="Contratos y Adendums">Contratos y Adendums</option>
                <option value="Facturación">Facturación</option>
                <option value="Altas y Bajas">Altas y Bajas</option>
                <option value="Consultas Laborales">Consultas Laborales</option>
                <option value="Beneficios">Beneficios</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Tickets List Table */}
            <div className={`bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4 ${activeTicket ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Bandeja de Tickets y Solicitudes</h3>
                  <p className="text-[9px] text-slate-400">Atención de incidencias con cálculo de SLA dinámico e historial unificado.</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {tickets.filter(tk => {
                    const matchSearch = !ticketFilterSearch || 
                      tk.id.toLowerCase().includes(ticketFilterSearch.toLowerCase()) ||
                      tk.asunto.toLowerCase().includes(ticketFilterSearch.toLowerCase()) ||
                      tk.descripcion.toLowerCase().includes(ticketFilterSearch.toLowerCase());
                    const matchStatus = ticketFilterStatus === 'all' || tk.estado === ticketFilterStatus;
                    const matchPriority = ticketFilterPriority === 'all' || tk.prioridad === ticketFilterPriority;
                    const matchCat = ticketFilterCategory === 'all' || tk.categoria === ticketFilterCategory;
                    return matchSearch && matchStatus && matchPriority && matchCat;
                  }).length} tickets filtrados
                </span>
              </div>

              {tickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No hay tickets de soporte registrados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="p-3">Ticket / Categoría</th>
                        <th className="p-3">Cliente / Solicitante</th>
                        <th className="p-3">Asunto</th>
                        <th className="p-3">Prioridad</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">SLA Status</th>
                        <th className="p-3">Asesor</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tickets
                        .filter(tk => {
                          const matchSearch = !ticketFilterSearch || 
                            tk.id.toLowerCase().includes(ticketFilterSearch.toLowerCase()) ||
                            tk.asunto.toLowerCase().includes(ticketFilterSearch.toLowerCase()) ||
                            tk.descripcion.toLowerCase().includes(ticketFilterSearch.toLowerCase());
                          const matchStatus = ticketFilterStatus === 'all' || tk.estado === ticketFilterStatus;
                          const matchPriority = ticketFilterPriority === 'all' || tk.prioridad === ticketFilterPriority;
                          const matchCat = ticketFilterCategory === 'all' || tk.categoria === ticketFilterCategory;
                          return matchSearch && matchStatus && matchPriority && matchCat;
                        })
                        .map((tk) => {
                          const cliente = clientes.find(c => c.id === tk.clienteId);
                          const clientName = tk.clienteNombre || (cliente ? cliente.empresa : 'Cliente EOR');
                          const priority = tk.prioridad || 'Media';
                          const category = tk.categoria || 'Soporte General';
                          const isSelected = activeTicket?.id === tk.id;

                          return (
                            <tr key={tk.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50/60'}`}>
                              <td className="p-3">
                                <div className="font-bold text-indigo-900 font-mono text-[11px]">{tk.id}</div>
                                <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                                  {category}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{clientName}</div>
                                {tk.solicitanteNombre && (
                                  <div className="text-[9px] text-slate-400">{tk.solicitanteNombre}</div>
                                )}
                              </td>
                              <td className="p-3 text-slate-700 font-medium max-w-xs">
                                <div className="truncate font-semibold">{tk.asunto}</div>
                                <div className="text-[9px] text-slate-400 font-mono">{new Date(tk.fechaCreacion).toLocaleDateString()}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  priority === 'Crítica' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                  priority === 'Alta' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                  priority === 'Media' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {priority}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  tk.estado === 'Nuevo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                                  tk.estado === 'Respondido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  tk.estado === 'En revisión' || tk.estado === 'En Proceso' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  tk.estado === 'Resuelto' || tk.estado === 'Cerrado' ? 'bg-slate-100 text-slate-600' :
                                  'bg-purple-50 text-purple-700'
                                }`}>
                                  {tk.estado}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  tk.slaEstado === 'Vencido' ? 'bg-rose-100 text-rose-700 font-black' :
                                  tk.slaEstado === 'Próximo a vencer' ? 'bg-amber-100 text-amber-700 font-bold animate-pulse' :
                                  tk.slaEstado === 'Cumplido' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {tk.slaEstado || 'Dentro de tiempo'}
                                </span>
                                {tk.slaFechaLimiteResolucion && tk.estado !== 'Resuelto' && tk.estado !== 'Cerrado' && (
                                  <div className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                                    Límite: {new Date(tk.slaFechaLimiteResolucion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(tk.slaFechaLimiteResolucion).toLocaleDateString([], { month: 'numeric', day: 'numeric' })})
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-[10px] text-slate-500">
                                {tk.asesorAsignado ? (
                                  <span className="font-semibold text-slate-700 truncate block max-w-[100px]" title={tk.asesorAsignado}>
                                    {tk.asesorAsignado.split('@')[0]}
                                  </span>
                                ) : (
                                  <span className="text-amber-500 font-bold text-[9px]">Sin asignar</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setActiveTicket(tk);
                                    setTicketReply('');
                                    setTicketReplyEsInterno(false);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700'
                                  }`}
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ticket Detailed View & Thread panel */}
            {activeTicket && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4 xl:col-span-1 h-fit">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{activeTicket.id}</span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{activeTicket.categoria || 'Soporte General'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        activeTicket.prioridad === 'Crítica' ? 'bg-rose-100 text-rose-700' :
                        activeTicket.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeTicket.prioridad || 'Media'}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{activeTicket.asunto}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Cliente: <strong>{activeTicket.clienteNombre || clientes.find(c => c.id === activeTicket.clienteId)?.empresa || 'Cliente EOR'}</strong>
                      {activeTicket.solicitanteNombre && <span> • Solicitado por: <strong>{activeTicket.solicitanteNombre}</strong></span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTicket(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {/* SLA Status Widget */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500">Compromiso de SLA:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      activeTicket.slaEstado === 'Vencido' ? 'bg-rose-100 text-rose-700' :
                      activeTicket.slaEstado === 'Próximo a vencer' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                      activeTicket.slaEstado === 'Cumplido' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {activeTicket.slaEstado || 'Dentro de tiempo'}
                    </span>
                  </div>
                  {activeTicket.slaFechaLimiteResolucion && (
                    <div className="text-[9.5px] text-slate-500 flex justify-between">
                      <span>Límite Resolución:</span>
                      <strong className="text-slate-700 font-mono">
                        {new Date(activeTicket.slaFechaLimiteResolucion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </strong>
                    </div>
                  )}
                  {activeTicket.fechaResolucion && (
                    <div className="text-[9.5px] text-emerald-600 flex justify-between">
                      <span>Resuelto el:</span>
                      <strong className="font-mono">{new Date(activeTicket.fechaResolucion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  {/* Status update & advisor assignment */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</label>
                      <select
                        value={activeTicket.estado}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            const updated = await api.updateTicket(activeTicket.id, { estado: newStatus });
                            setActiveTicket(updated);
                            onRefresh();
                          } catch (err) {
                            alert('Error al actualizar estado');
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 text-xs"
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Abierto">Abierto</option>
                        <option value="En revisión">En revisión</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Respondido">Respondido</option>
                        <option value="Pendiente de Cliente">Pendiente de Cliente</option>
                        <option value="Resuelto">Resuelto</option>
                        <option value="Cerrado">Cerrado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Asesor Asignado</label>
                      <select
                        value={activeTicket.asesorAsignado || ''}
                        onChange={async (e) => {
                          const email = e.target.value;
                          try {
                            const updated = await api.updateTicket(activeTicket.id, { asesorAsignado: email || undefined });
                            setActiveTicket(updated);
                            onRefresh();
                          } catch (err: any) {
                            alert(`Error al asignar asesor: ${err.message}`);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 text-xs truncate"
                      >
                        <option value="">-- Sin Asignar --</option>
                        {availableAdvisors.map(u => (
                          <option key={u.correo} value={u.correo}>{u.nombre} ({u.correo.split('@')[0]})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer Rating if available */}
                  {activeTicket.calificacion && (
                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 text-[10px] uppercase tracking-wider">Calificación del Cliente</span>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= (activeTicket.calificacion || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {activeTicket.comentarioCalificacion && (
                        <p className="text-[10.5px] text-amber-950 italic">"{activeTicket.comentarioCalificacion}"</p>
                      )}
                    </div>
                  )}

                  {/* Thread Dialogue / Comments list */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 max-h-72 overflow-y-auto space-y-3 font-sans">
                    {/* Initial Description */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                        <span className="font-bold text-slate-600">Descripción Inicial ({activeTicket.solicitanteNombre || 'Cliente'})</span>
                        <span>{new Date(activeTicket.fechaCreacion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                        {activeTicket.descripcion.split('\n\n[Respuesta')[0]}
                      </p>
                    </div>

                    {/* Structured Comments */}
                    {activeTicket.comentarios && activeTicket.comentarios.length > 0 ? (
                      <div className="space-y-2.5 border-t border-slate-200/60 pt-2.5">
                        <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Respuestas y Seguimiento:</div>
                        {activeTicket.comentarios.map((c) => {
                          const isStaff = c.autorRol === 'administrador' || c.autorRol === 'asesor_comercial';
                          const isInternal = c.esInterno;

                          return (
                            <div 
                              key={c.id} 
                              className={`p-3 rounded-xl border text-xs space-y-1 ${
                                isInternal 
                                  ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
                                  : isStaff 
                                    ? 'bg-indigo-50/60 border-indigo-100 text-indigo-950' 
                                    : 'bg-white border-slate-200/80 text-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[9px]">
                                <div className="flex items-center gap-1.5">
                                  <strong className="font-bold">{c.autor}</strong>
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                    c.autorRol === 'administrador' ? 'bg-indigo-200 text-indigo-900' :
                                    c.autorRol === 'asesor_comercial' ? 'bg-blue-200 text-blue-900' :
                                    'bg-slate-200 text-slate-800'
                                  }`}>
                                    {c.autorRol}
                                  </span>
                                  {isInternal && (
                                    <span className="bg-amber-200 text-amber-900 text-[8px] font-black px-1.5 py-0.2 rounded">
                                      🔒 Nota Interna
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400 font-mono">{new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[10.5px] leading-relaxed font-semibold whitespace-pre-wrap">{c.mensaje}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Legacy split fallback if comments not yet array */
                      activeTicket.descripcion.includes('\n\n[Respuesta') && (
                        <div className="space-y-2.5 border-t border-slate-200/60 pt-2.5">
                          <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Historial:</div>
                          {activeTicket.descripcion.split('\n\n[Respuesta').slice(1).map((resp, i) => {
                            const cleaned = '[Respuesta' + resp;
                            const header = cleaned.split(']:')[0] + ']';
                            const msg = cleaned.split(']:')[1] || '';
                            const isStaff = header.includes('admin') || header.includes('asesor_comercial');
                            return (
                              <div key={i} className={`p-2.5 rounded-xl border ${isStaff ? 'bg-indigo-50/50 border-indigo-100 text-indigo-950' : 'bg-white border-slate-200 text-slate-800'}`}>
                                <span className="block text-[8px] font-mono text-slate-400 font-bold mb-0.5">{header.replace('[', '').replace(']', '')}</span>
                                <p className="text-[10px] leading-relaxed font-semibold">{msg.trim()}</p>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!ticketReply.trim()) return;
                    setLoading(true);
                    try {
                      const updated = await api.responderTicket(activeTicket.id, {
                        usuario: user.nombre,
                        autorEmail: user.correo,
                        rol: user.rol,
                        mensaje: ticketReply,
                        esInterno: ticketReplyEsInterno
                      });
                      setActiveTicket(updated);
                      setTicketReply('');
                      setTicketReplyEsInterno(false);
                      onRefresh();
                    } catch (err) {
                      alert('No se pudo enviar la respuesta');
                    } finally {
                      setLoading(false);
                    }
                  }} className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {ticketReplyEsInterno ? '🔒 Redactar Nota Interna (Privada)' : 'Redactar Respuesta Oficial al Cliente'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setTicketReplyEsInterno(!ticketReplyEsInterno)}
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                          ticketReplyEsInterno
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {ticketReplyEsInterno ? 'Modo: Nota Interna' : 'Cambiar a Nota Interna'}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      required
                      placeholder={ticketReplyEsInterno ? "Escriba una nota privada visible sólo para el equipo de asesores y administración..." : "Escriba la respuesta oficial para el cliente solicitante..."}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      className={`w-full border rounded-xl p-3 text-[11px] font-medium outline-none transition-all ${
                        ticketReplyEsInterno ? 'bg-amber-50/40 border-amber-200 focus:bg-white' : 'bg-slate-50 border-slate-200 focus:bg-white'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-2 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer ${
                        ticketReplyEsInterno ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{loading ? 'Enviando...' : ticketReplyEsInterno ? 'Guardar Nota Interna' : 'Enviar Respuesta al Cliente'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* TICKET CREATION MODAL */}
          {showCreateTicket && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs">
                <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold">Abrir Nuevo Ticket de Soporte</h3>
                    <p className="text-[10px] text-indigo-200 mt-0.5">Registra una incidencia o consulta con asignación automática de SLA.</p>
                  </div>
                  <button onClick={() => setShowCreateTicket(false)} className="text-white hover:text-indigo-200 font-bold text-lg cursor-pointer">&times;</button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!ticketClienteId || !ticketAsunto.trim() || !ticketDescripcion.trim()) {
                    alert('Faltan campos obligatorios');
                    return;
                  }
                  setLoading(true);
                  try {
                    const selectedClient = clientes.find(c => c.id === ticketClienteId);
                    await api.createTicket({
                      clienteId: ticketClienteId,
                      clienteNombre: selectedClient?.empresa || 'Cliente EOR',
                      solicitanteNombre: user.nombre,
                      solicitanteEmail: user.correo,
                      solicitanteRol: user.rol,
                      categoria: ticketCategoria,
                      prioridad: ticketPrioridad,
                      asunto: ticketAsunto,
                      descripcion: ticketDescripcion
                    });
                    setShowCreateTicket(false);
                    setTicketAsunto('');
                    setTicketDescripcion('');
                    onRefresh();
                  } catch (err) {
                    alert('Error al crear ticket');
                  } finally {
                    setLoading(false);
                  }
                }} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente Asociado *</label>
                    <select
                      required
                      value={ticketClienteId}
                      onChange={(e) => setTicketClienteId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-800"
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.empresa} ({c.pais})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría de Consulta *</label>
                      <select
                        value={ticketCategoria}
                        onChange={(e) => setTicketCategoria(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                      >
                        <option value="Soporte General">Soporte General</option>
                        <option value="Nómina y Pagos">Nómina y Pagos</option>
                        <option value="Contratos y Adendums">Contratos y Adendums</option>
                        <option value="Facturación">Facturación</option>
                        <option value="Altas y Bajas">Altas y Bajas</option>
                        <option value="Consultas Laborales">Consultas Laborales</option>
                        <option value="Beneficios">Beneficios</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridad / Urgencia *</label>
                      <select
                        value={ticketPrioridad}
                        onChange={(e) => setTicketPrioridad(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                      >
                        <option value="Baja">Baja (Normal)</option>
                        <option value="Media">Media (Estándar)</option>
                        <option value="Alta">Alta (Urgente)</option>
                        <option value="Crítica">Crítica (Operación detenida)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Asunto / Resumen *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Discrepancia en retención de impuestos local"
                      value={ticketAsunto}
                      onChange={(e) => setTicketAsunto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción Detallada *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Detalle de la consulta o incidencia, colaboradores involucrados o periodos..."
                      value={ticketDescripcion}
                      onChange={(e) => setTicketDescripcion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateTicket(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                    >
                      {loading ? 'Creando...' : 'Crear Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Módulo de Alertas, Notificaciones y Compliance</h2>
                <p className="text-[10px] text-slate-500">Supervisa las plantillas de comunicación automatizadas para empleados, firmas de contratos y notificaciones críticas.</p>
              </div>
            </div>
          </div>

          {/* Sender & SMTP Configuration Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Servicio de Correo Corporativo Gmail
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Gmail Activo: {sysConfig.correoRemitente || 'alertas@grupostt.com'}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500">Conexión dedicada mediante cuenta de Gmail y Contraseña de Aplicación de Google para envío automatizado de credenciales, avisos y contratos.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={sysConfig.notificacionesActivas !== false}
                    onChange={e => setSysConfig({ ...sysConfig, notificacionesActivas: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Envío de Correos Habilitado</span>
                </label>
              </div>
            </div>

            {sysConfigMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sysConfigMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre del Remitente</label>
                <input
                  type="text"
                  value={sysConfig.nombreRemitente}
                  onChange={e => setSysConfig({ ...sysConfig, nombreRemitente: e.target.value })}
                  placeholder="Quick Hire LATAM - Alertas STT"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Cuenta de Correo Gmail (Emisor)</label>
                <input
                  type="email"
                  value={sysConfig.correoRemitente}
                  onChange={e => setSysConfig({ ...sysConfig, correoRemitente: e.target.value, smtpUser: e.target.value })}
                  placeholder="alertas@grupostt.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Copia para Solicitudes (CC)</label>
                <input
                  type="email"
                  value={sysConfig.correoCopiaSolicitudes || ''}
                  onChange={e => setSysConfig({ ...sysConfig, correoCopiaSolicitudes: e.target.value })}
                  placeholder="alertas@grupostt.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Servicio de Correo</label>
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Google Gmail (smtp.gmail.com)</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Nativo SSL 465</span>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Contraseña de Aplicación de Google (16 caracteres)</span>
                  <span className="text-[9px] text-slate-400 font-normal">Generada en Cuenta de Google &gt; Seguridad &gt; Contraseñas de aplicaciones</span>
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={sysConfig.smtpPass || ''}
                    onChange={e => setSysConfig({ ...sysConfig, smtpPass: e.target.value })}
                    placeholder="smjl brpm xyer bwzp"
                    className="w-full text-xs font-mono tracking-wider px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              {/* Test section */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={e => setTestEmailRecipient(e.target.value)}
                  placeholder="Destinatario para prueba"
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl w-64 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setTestingSmtp(true);
                    setTestEmailMsg(null);
                    try {
                      const res = await api.testSmtp();
                      if (res.ok) {
                        setTestEmailMsg({ type: 'success', text: `✓ Conexión con Gmail (${res.user}) verificada exitosamente mediante Contraseña de Aplicación.` });
                      } else {
                        setTestEmailMsg({ type: 'error', text: `✕ Error de autenticación Gmail: ${res.error}` });
                      }
                    } catch (err: any) {
                      setTestEmailMsg({ type: 'error', text: err.message || 'Error al verificar conexión con Gmail' });
                    } finally {
                      setTestingSmtp(false);
                    }
                  }}
                  disabled={testingSmtp}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                  {testingSmtp ? 'Verificando...' : 'Verificar Conexión Gmail'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setSendingTestEmail(true);
                    setTestEmailMsg(null);
                    try {
                      const res = await api.sendTestEmail(testEmailRecipient);
                      if (res.success) {
                        setTestEmailMsg({ type: 'success', text: `✓ ${res.message}` });
                      } else {
                        setTestEmailMsg({ type: 'error', text: 'Error al enviar correo' });
                      }
                    } catch (err: any) {
                      setTestEmailMsg({ type: 'error', text: err.message || 'Error al enviar prueba' });
                    } finally {
                      setSendingTestEmail(false);
                    }
                  }}
                  disabled={sendingTestEmail}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                  {sendingTestEmail ? 'Enviando...' : 'Enviar Correo de Prueba'}
                </button>
              </div>

              <button
                onClick={async () => {
                  setSavingSysConfig(true);
                  setSysConfigMsg('');
                  try {
                    await api.updateConfiguracionSistema(sysConfig);
                    setSysConfigMsg('✓ Configuración del servidor de correos y remitente guardada correctamente.');
                    setTimeout(() => setSysConfigMsg(''), 4000);
                  } catch (err: any) {
                    alert('Error al guardar configuración: ' + (err.message || 'Error de servidor'));
                  } finally {
                    setSavingSysConfig(false);
                  }
                }}
                disabled={savingSysConfig}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {savingSysConfig ? 'Guardando...' : 'Guardar Configuración Gmail'}
              </button>
            </div>

            {testEmailMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                testEmailMsg.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {testEmailMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testEmailMsg.text}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Templates */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Plantillas de Notificaciones Activas</h3>
                  <p className="text-[9px] text-slate-400">Mensajes del sistema enviados de forma automática ante eventos.</p>
                </div>
                <span className="text-[9px] bg-slate-100 font-bold text-slate-500 px-2.5 py-1 rounded-xl">
                  {plantillasNotificacion.length} Plantillas
                </span>
              </div>

              <div className="space-y-3.5">
                {plantillasNotificacion.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No hay plantillas de notificación.</div>
                ) : (
                  plantillasNotificacion.map(tpl => (
                    <div key={tpl.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] font-bold text-slate-800">{tpl.nombre}</h4>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[8px] uppercase tracking-wider">{tpl.canal}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold italic">"{tpl.plantilla}"</p>
                      <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between">
                        <span>Canal de envío: <strong>{tpl.canal}</strong></span>
                        <span>ID: {tpl.id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Alerts list */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Alertas de Compliance en Tiempo Real</h3>
                  <p className="text-[9px] text-slate-400">Incidentes y avisos pendientes de revisión por los asesores.</p>
                </div>
                <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-xl">
                  {alertasNotificacion.filter(a => !a.leida).length} Pendientes
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {alertasNotificacion.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">¡Todo al día!</p>
                    <p className="text-[10px] text-slate-400">No hay alertas de compliance activas.</p>
                  </div>
                ) : (
                  alertasNotificacion.map(al => (
                    <div key={al.id} className={`p-4 rounded-2xl border transition-all ${al.leida ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-rose-50/40 border-rose-100/70'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${al.leida ? 'bg-slate-400' : 'bg-rose-600 animate-pulse'}`} />
                            <h4 className="text-[11px] font-bold text-slate-800">Alerta de Compliance</h4>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{al.mensaje}</p>
                          <span className="block text-[9px] text-slate-400 font-mono">{new Date(al.fecha).toLocaleString()}</span>
                        </div>
                        {!al.leida && (
                          <button
                            onClick={async () => {
                              try {
                                await api.marcarAlertaLeida(al.id);
                                onRefresh();
                              } catch (err) {
                                alert('Error al marcar como leída');
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-bold transition-all text-slate-700 shrink-0"
                          >
                            Entendido
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLA Module Tab */}
      {activeTab === 'sla' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Módulo de SLA y Procesos Críticos</h2>
                <p className="text-[10px] text-slate-500">Mantenimiento de reglas de tiempos de atención, respuesta, resolución y auditoría en tiempo real para el servicio EOR.</p>
              </div>
            </div>

            {/* Sub-tabs buttons */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl text-[10px] self-start md:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setSlaSubTab('trackers')}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all ${slaSubTab === 'trackers' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Seguimiento Activo ({slaSeguimientos.length})
              </button>
              <button
                onClick={() => setSlaSubTab('rules')}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all ${slaSubTab === 'rules' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Reglas y Parámetros ({reglasSla.length})
              </button>
              <button
                onClick={() => setSlaSubTab('history')}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all ${slaSubTab === 'history' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Auditoría / Historial ({slaHistoriales.length})
              </button>
            </div>
          </div>

          {/* Success / Error Messages */}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 font-bold text-[10px] flex justify-between items-center animate-fade-in">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800 text-xs font-bold">&times;</button>
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 font-bold text-[10px] flex justify-between items-center animate-fade-in">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs font-bold">&times;</button>
            </div>
          )}

          {/* Tab 1: Trackers */}
          {slaSubTab === 'trackers' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Control de SLA en Procesos de Negocio</h3>
                  <p className="text-[10px] text-slate-400">Monitoreo de tiempos límites para contratos, soporte, pagos y liberación de servicios.</p>
                </div>
                <button
                  onClick={fetchSlaData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-all"
                >
                  Sincronizar Estados
                </button>
              </div>

              {/* Grid / Table trackers */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3 text-[10px] uppercase">Proceso</th>
                      <th className="p-3 text-[10px] uppercase">Entidad Ref</th>
                      <th className="p-3 text-[10px] uppercase">Cliente</th>
                      <th className="p-3 text-[10px] uppercase">País</th>
                      <th className="p-3 text-[10px] uppercase">Prioridad</th>
                      <th className="p-3 text-[10px] uppercase">Estado SLA</th>
                      <th className="p-3 text-[10px] uppercase">Límites</th>
                      <th className="p-3 text-[10px] uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaSeguimientos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-slate-400 text-[11px]">
                          No hay procesos con SLA activo en este momento.
                        </td>
                      </tr>
                    ) : (
                      slaSeguimientos.map(track => {
                        const isOverdue = track.estadoSla === 'Vencido' || track.estadoSla === 'Escalado' || track.estadoSla === 'Resuelto fuera de SLA';
                        const isSuccess = track.estadoSla === 'Resuelto dentro de SLA';
                        const isPaused = track.estadoSla === 'Pausado';
                        const isWarning = track.estadoSla === 'Próximo a vencer';

                        return (
                          <tr key={track.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="p-3">
                              <span className="font-bold text-slate-800 capitalize text-[11px]">
                                {track.tipoProceso.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-mono text-[10px] text-slate-500 font-bold">
                                {track.entidadTipo.toUpperCase()}: {track.entidadId}
                              </div>
                            </td>
                            <td className="p-3 text-slate-600 font-bold text-[11px]">
                              {track.clienteNombre || track.clienteId}
                            </td>
                            <td className="p-3 text-slate-600">
                              {track.pais}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                track.prioridad === 'Crítica' ? 'bg-rose-100 text-rose-700' :
                                track.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700' :
                                track.prioridad === 'Media' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {track.prioridad}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                                isPaused ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {track.estadoSla}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] space-y-0.5">
                              <div className="text-slate-400 font-semibold">
                                Lim. Resp: <span className="text-slate-700 font-bold">{new Date(track.fechaLimiteRespuesta).toLocaleString()}</span>
                              </div>
                              <div className="text-slate-400 font-semibold">
                                Lim. Resol: <span className="text-slate-700 font-bold">{new Date(track.fechaLimiteResolucion).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setActiveSlaSeguimiento(track);
                                    setShowPauseResumeSlaModal(true);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition ${
                                    isPaused
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {isPaused ? 'Reanudar' : 'Pausar'}
                                </button>
                                {track.estadoSla !== 'Escalado' && !track.estadoSla.startsWith('Resuelto') && (
                                  <button
                                    onClick={() => handleEscalateSla(track)}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[9px] font-bold transition"
                                  >
                                    Escalar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Rules Maintenance */}
          {slaSubTab === 'rules' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Mantenimiento de Reglas SLA Globales</h3>
                  <p className="text-[10px] text-slate-400">
                    Configuración paramétrica de tiempos de respuesta, resolución y horarios de cobertura para todos los países y clientes.
                  </p>
                </div>
                {user.rol === 'administrador' ? (
                  <button
                    onClick={() => {
                      setEditingRuleId(null);
                      setSlaNombre('');
                      setSlaDescripcion('');
                      setSlaTipoProceso('ticket_creado');
                      setSlaCategoria('Soporte General');
                      setSlaPrioridad('Media');
                      setSlaPais('Global');
                      setSlaClienteId('Global');
                      setSlaTiempoRespuesta(4);
                      setSlaTiempoResolucion(24);
                      setSlaHorarioLaboral('24/7');
                      setSlaTiempoAlertaPreviaHoras(2);
                      setSlaResponsablePrincipal('administrador-eor-peo@grupostt.com');
                      setSlaResponsableEscalamiento('superadministrador-eor-peo@grupostt.com');
                      setSlaActivo(true);
                      setSlaFechaInicioVigencia('2026-01-01');
                      setSlaFechaFinVigencia('2026-12-31');
                      setShowCreateSlaRule(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-[10px] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Regla SLA
                  </button>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 text-slate-500 text-[10px] px-3 py-1.5 rounded-xl font-medium">
                    🔒 Modo solo lectura (Configurable exclusivamente por Administradores)
                  </div>
                )}
              </div>

              {/* Rules list table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <th className="p-3 text-[10px] uppercase">Regla / Proceso</th>
                      <th className="p-3 text-[10px] uppercase">Categoría / Prioridad</th>
                      <th className="p-3 text-[10px] uppercase">Horario Cobertura</th>
                      <th className="p-3 text-[10px] uppercase text-center">1ª Respuesta</th>
                      <th className="p-3 text-[10px] uppercase text-center">Resolución Total</th>
                      <th className="p-3 text-[10px] uppercase">Responsables</th>
                      <th className="p-3 text-[10px] uppercase text-center">Estado</th>
                      {user.rol === 'administrador' && <th className="p-3 text-[10px] uppercase text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {reglasSla.length === 0 ? (
                      <tr>
                        <td colSpan={user.rol === 'administrador' ? 8 : 7} className="text-center p-8 text-slate-400 text-[11px]">
                          No hay reglas de SLA configuradas en el sistema.
                        </td>
                      </tr>
                    ) : (
                      reglasSla.map(rule => (
                        <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-bold text-slate-800 text-[11px]">
                              {rule.nombre || rule.tipoProceso.replace(/_/g, ' ')}
                            </div>
                            {rule.descripcion && (
                              <div className="text-[9.5px] text-slate-400 font-normal truncate max-w-xs">{rule.descripcion}</div>
                            )}
                            <span className="text-[8.5px] text-slate-400 font-mono font-bold">{rule.id}</span>
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="text-slate-600 font-semibold text-[10.5px]">{rule.categoria || 'Soporte'}</div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                              rule.prioridad === 'Crítica' ? 'bg-rose-100 text-rose-700' :
                              rule.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700' :
                              rule.prioridad === 'Media' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {rule.prioridad}
                            </span>
                          </td>
                          <td className="p-3 text-[10.5px] font-semibold text-slate-600">
                            <div>{rule.horarioLaboral || '24/7'}</div>
                            <span className="text-[9px] text-slate-400">Alerta: {rule.tiempoAlertaPreviaHoras || 2}h antes</span>
                          </td>
                          <td className="p-3 font-bold text-slate-800 text-center text-xs">
                            <span className="bg-slate-100 px-2 py-1 rounded-lg font-mono">{rule.tiempoRespuestaHoras} hrs</span>
                          </td>
                          <td className="p-3 font-bold text-indigo-700 text-center text-xs">
                            <span className="bg-indigo-50 px-2 py-1 rounded-lg font-mono">{rule.tiempoResolucionHoras} hrs</span>
                          </td>
                          <td className="p-3 text-[9.5px] text-slate-500">
                            <div>Princ: <strong>{rule.responsablePrincipal.split('@')[0]}</strong></div>
                            <div>Esc: <strong className="text-purple-600">{rule.responsableEscalamiento.split('@')[0]}</strong></div>
                          </td>
                          <td className="p-3 text-center">
                            {user.rol === 'administrador' ? (
                              <button
                                onClick={() => handleToggleRule(rule.id)}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black transition-all cursor-pointer ${
                                  rule.activo ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Haga clic para activar o desactivar la regla"
                              >
                                {rule.activo ? '● Activa' : '○ Inactiva'}
                              </button>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                rule.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {rule.activo ? 'Activa' : 'Inactiva'}
                              </span>
                            )}
                          </td>
                          {user.rol === 'administrador' && (
                            <td className="p-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingRuleId(rule.id);
                                    setSlaNombre(rule.nombre || '');
                                    setSlaDescripcion(rule.descripcion || '');
                                    setSlaTipoProceso(rule.tipoProceso);
                                    setSlaCategoria(rule.categoria || 'Soporte General');
                                    setSlaPrioridad(rule.prioridad);
                                    setSlaPais(rule.pais || 'Global');
                                    setSlaClienteId(rule.clienteId || 'Global');
                                    setSlaTiempoRespuesta(rule.tiempoRespuestaHoras);
                                    setSlaTiempoResolucion(rule.tiempoResolucionHoras);
                                    setSlaHorarioLaboral(rule.horarioLaboral || '24/7');
                                    setSlaTiempoAlertaPreviaHoras(rule.tiempoAlertaPreviaHoras || 2);
                                    setSlaResponsablePrincipal(rule.responsablePrincipal);
                                    setSlaResponsableEscalamiento(rule.responsableEscalamiento);
                                    setSlaActivo(rule.activo);
                                    setSlaFechaInicioVigencia(rule.fechaInicioVigencia || '2026-01-01');
                                    setSlaFechaFinVigencia(rule.fechaFinVigencia || '2026-12-31');
                                    setShowCreateSlaRule(true);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[9.5px] font-bold transition cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[9.5px] font-bold transition cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: History & Audits */}
          {slaSubTab === 'history' && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100 p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Bitácora de Eventos de SLA</h3>
                <p className="text-[10px] text-slate-400">Trazabilidad histórica completa de todas las asignaciones, pausas, reanudaciones y alertas de vencimiento.</p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                {slaHistoriales.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No hay registros en la bitácora de SLA.</div>
                ) : (
                  [...slaHistoriales].reverse().map(log => {
                    const isAlert = ['Vencimiento', 'Escalamiento'].includes(log.accion);
                    const isSuccess = ['Resolución', 'Primera respuesta'].includes(log.accion);

                    return (
                      <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              isAlert ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {log.accion}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">SLA: {log.slaId}</span>
                          </div>
                          <p className="text-slate-700 text-[11px] font-bold leading-relaxed">{log.observaciones}</p>
                          {log.estadoAnterior && (
                            <div className="text-[9px] text-slate-400 font-semibold">
                              Cambio de estado: <strong>{log.estadoAnterior}</strong> &rarr; <strong className="text-slate-700">{log.estadoNuevo}</strong>
                            </div>
                          )}
                        </div>

                        <div className="text-right text-[10px] text-slate-400 font-semibold shrink-0">
                          <div>Registrado por: <strong className="text-slate-700 font-bold">{log.usuarioResponsable}</strong></div>
                          <div>{new Date(log.fechaHora).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SLA Rule Create/Edit Modal */}
          {showCreateSlaRule && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs max-h-[90vh] flex flex-col">
                <div className="bg-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-sm font-bold">{editingRuleId ? 'Modificar Regla SLA Global' : 'Parametrizar Nueva Regla SLA'}</h3>
                    <p className="text-[10px] text-indigo-200 mt-0.5">Configuración de tiempos límites de respuesta, resolución y cobertura aplicables a todos los países.</p>
                  </div>
                  <button onClick={() => { setShowCreateSlaRule(false); setEditingRuleId(null); }} className="text-indigo-200 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
                </div>

                <form onSubmit={handleSaveRule} className="p-6 space-y-4 overflow-y-auto">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Nombre Identificador de la Regla SLA</label>
                    <input
                      type="text"
                      required
                      value={slaNombre}
                      onChange={e => setSlaNombre(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ej. SLA Crítico - Interrupción de Servicio o Nómina"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Descripción del Alcance</label>
                    <input
                      type="text"
                      value={slaDescripcion}
                      onChange={e => setSlaDescripcion(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ej. Aplica a incidentes que bloqueen la operación de nómina o firma legal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Tipo de Proceso</label>
                      <select
                        value={slaTipoProceso}
                        onChange={e => setSlaTipoProceso(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      >
                        <option value="ticket_creado">Ticket del Cliente / Soporte</option>
                        <option value="contrato_comercial_enviado">Contrato Comercial Pendiente Firma</option>
                        <option value="pago_revision">Validación de Soporte de Pago inicial</option>
                        <option value="servicio_pendiente_liberacion">Liberación del Servicio EOR</option>
                        <option value="contrato_laboral_pendiente">Contrato Laboral de Empleado Pendiente</option>
                        <option value="adendum_firma_pendiente">Adendum Comercial Pendiente Firma</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Categoría del Proceso</label>
                      <input
                        type="text"
                        required
                        value={slaCategoria}
                        onChange={e => setSlaCategoria(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                        placeholder="Ej. Soporte, Nómina, Legal, Facturación"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Nivel de Prioridad</label>
                      <select
                        value={slaPrioridad}
                        onChange={e => setSlaPrioridad(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      >
                        <option value="Baja">Baja (Consultas generales)</option>
                        <option value="Media">Media (Ajustes regulares)</option>
                        <option value="Alta">Alta (Urgencias operativas)</option>
                        <option value="Crítica">Crítica (Bloqueo de operaciones)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Horario Laboral / Cobertura</label>
                      <select
                        value={slaHorarioLaboral}
                        onChange={e => setSlaHorarioLaboral(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      >
                        <option value="24/7">24/7 (Continuo fines de semana y festivos)</option>
                        <option value="8x5 (Lun-Vie 8:00-18:00)">8x5 (Lunes a Viernes 8:00 a 18:00)</option>
                        <option value="12x5 (Lun-Vie 7:00-19:00)">12x5 (Lunes a Viernes 7:00 a 19:00)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">1ª Respuesta (Horas)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={slaTiempoRespuesta}
                        onChange={e => setSlaTiempoRespuesta(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Resolución Total (Horas)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={slaTiempoResolucion}
                        onChange={e => setSlaTiempoResolucion(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Alerta Previa (Horas)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={slaTiempoAlertaPreviaHoras}
                        onChange={e => setSlaTiempoAlertaPreviaHoras(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Responsable Principal</label>
                      <input
                        type="email"
                        required
                        value={slaResponsablePrincipal}
                        onChange={e => setSlaResponsablePrincipal(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Responsable de Escalamiento</label>
                      <input
                        type="email"
                        required
                        value={slaResponsableEscalamiento}
                        onChange={e => setSlaResponsableEscalamiento(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Fecha Inicio Vigencia</label>
                      <input
                        type="date"
                        required
                        value={slaFechaInicioVigencia}
                        onChange={e => setSlaFechaInicioVigencia(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Fecha Fin Vigencia</label>
                      <input
                        type="date"
                        required
                        value={slaFechaFinVigencia}
                        onChange={e => setSlaFechaFinVigencia(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="rule-active"
                      checked={slaActivo}
                      onChange={e => setSlaActivo(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="rule-active" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                      Regla de SLA activa e inmediatamente operativa en el motor de tiempos global
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowCreateSlaRule(false); setEditingRuleId(null); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition text-[10px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-xs text-[10px] cursor-pointer"
                    >
                      {loading ? 'Guardando...' : 'Guardar Regla SLA'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Pause / Resume Reason Modal */}
          {showPauseResumeSlaModal && activeSlaSeguimiento && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
                <div className="bg-indigo-950 text-white p-5">
                  <h3 className="text-sm font-bold">
                    {activeSlaSeguimiento.estadoSla === 'Pausado' ? 'Reanudar Seguimiento de SLA' : 'Pausar Seguimiento de SLA'}
                  </h3>
                  <p className="text-[10px] text-indigo-200 mt-0.5">
                    Proceso: {activeSlaSeguimiento.tipoProceso} | ID: {activeSlaSeguimiento.entidadId}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Motivo del Cambio de Estado de SLA</label>
                    <textarea
                      required
                      value={pauseSlaReason}
                      onChange={e => setPauseSlaReason(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-800 font-semibold"
                      placeholder={
                        activeSlaSeguimiento.estadoSla === 'Pausado'
                          ? 'Describa el motivo por el cual se reanuda la cuenta regresiva del SLA...'
                          : 'Describa el motivo de la pausa (ej. esperando respuesta aclaratoria del cliente o soporte extra)...'
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowPauseResumeSlaModal(false); setActiveSlaSeguimiento(null); setPauseSlaReason(''); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition text-[10px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handlePauseResumeSla}
                      disabled={loading || !pauseSlaReason}
                      className={`px-4 py-2 text-white font-bold rounded-2xl transition text-[10px] ${
                        activeSlaSeguimiento.estadoSla === 'Pausado'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {loading ? 'Procesando...' : activeSlaSeguimiento.estadoSla === 'Pausado' ? 'Confirmar Reanudación' : 'Confirmar Pausa'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE TEMPLATE PREVIEW MODAL */}
      {activeTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{activeTemplate.nombre}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Versión {activeTemplate.version} | {activeTemplate.pais} | {activeTemplate.servicio}</p>
              </div>
              <button onClick={() => setActiveTemplate(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Variables Dinámicas Asociadas</span>
                <div className="flex flex-wrap gap-1">
                  {activeTemplate.variables.map(v => (
                    <span key={v} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] rounded-md font-bold">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2">Contenido de la Plantilla</span>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-72 overflow-y-auto text-[10px] leading-relaxed text-slate-700 font-mono" dangerouslySetInnerHTML={{ __html: activeTemplate.archivoBase }} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setActiveTemplate(null)} className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-300 transition text-[10px]">
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE COMMERCIAL CONTRACT PREVIEW MODAL */}
      {activeCommercial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Contrato Comercial: {activeCommercial.clienteNombre}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">ID: {activeCommercial.id} | {activeCommercial.pais}</p>
              </div>
              <button onClick={() => setActiveCommercial(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Dynamic Logo header inside contract */}
              {logoBase64 && (
                <div className="flex justify-start pb-2 border-b border-slate-100">
                  <img src={logoBase64} alt="Brand Logo" className="max-h-[50px] object-contain" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-h-[50vh] overflow-y-auto text-slate-800 font-sans leading-relaxed shadow-xs" dangerouslySetInnerHTML={{ __html: renderCommercialContractHtml(activeCommercial, clientes.find(c => c.id === activeCommercial.clienteId || c.empresa === activeCommercial.clienteNombre)) }} />
              
              {/* Digit Stamp details with loaded signature graphics */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-[9px]">
                <div className="bg-indigo-50/50 rounded-xl p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="block font-bold text-indigo-900 mb-1">ESTAMPA DE FIRMA - CLIENTE</span>
                    {activeCommercial.firmaCliente ? (
                      <div className="space-y-0.5">
                        <div>Firmante: <strong>{activeCommercial.firmaCliente.nombre}</strong></div>
                        <div>Fecha: {new Date(activeCommercial.firmaCliente.fecha).toLocaleString()}</div>
                        <div>IP: {activeCommercial.firmaCliente.ip}</div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> VERIFICADO
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Pendiente de firma digital de representante de cliente.</div>
                    )}
                  </div>
                  {/* Real visual signature or quick sign */}
                  <div className="mt-2 pt-2 border-t border-indigo-100/60">
                    {activeCommercial.firmaCliente && signatureRepBase64 ? (
                      <img src={signatureRepBase64} alt="Client Representative Signature" className="max-h-[40px] object-contain" referrerPolicy="no-referrer" />
                    ) : !activeCommercial.firmaCliente && signatureRepBase64 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updated = await api.updateContratoComercial(activeCommercial.id, {
                              firmaCliente: {
                                nombre: activeCommercial.representanteCliente || "Representante de Cliente",
                                fecha: new Date().toISOString(),
                                ip: "186.23.45.190"
                              }
                            });
                            setActiveCommercial(updated);
                            onRefresh();
                          } catch (err) {
                            alert('No se pudo estampar firma');
                          }
                        }}
                        className="w-full py-1 bg-indigo-600 text-white rounded-lg font-bold text-[8px] uppercase hover:bg-indigo-500"
                      >
                        Estampar mi Firma (Cliente)
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-400">Suba una firma en "Logos y Firmas" para estampar.</span>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-xl p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="block font-bold text-indigo-900 mb-1">ESTAMPA DE FIRMA - PROVEEDOR</span>
                    {activeCommercial.firmaProveedor ? (
                      <div className="space-y-0.5">
                        <div>Firmante: <strong>{activeCommercial.firmaProveedor.nombre}</strong></div>
                        <div>Fecha: {new Date(activeCommercial.firmaProveedor.fecha).toLocaleString()}</div>
                        <div>IP: {activeCommercial.firmaProveedor.ip}</div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> VERIFICADO
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Pendiente de firma digital de representante Quick Hire.</div>
                    )}
                  </div>
                  {/* Real visual signature or quick sign */}
                  <div className="mt-2 pt-2 border-t border-indigo-100/60">
                    {activeCommercial.firmaProveedor && signatureBase64 ? (
                      <img src={signatureBase64} alt="Provider Signature" className="max-h-[40px] object-contain" referrerPolicy="no-referrer" />
                    ) : !activeCommercial.firmaProveedor && signatureBase64 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updated = await api.updateContratoComercial(activeCommercial.id, {
                              firmaProveedor: {
                                nombre: "Daniel Decan (Quick Hire Representante)",
                                fecha: new Date().toISOString(),
                                ip: "190.11.23.204"
                              }
                            });
                            setActiveCommercial(updated);
                            onRefresh();
                          } catch (err) {
                            alert('No se pudo estampar firma');
                          }
                        }}
                        className="w-full py-1 bg-indigo-600 text-white rounded-lg font-bold text-[8px] uppercase hover:bg-indigo-500"
                      >
                        Estampar mi Firma (Proveedor)
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-400">Suba una firma en "Logos y Firmas" para estampar.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Asignación de Asesor Comercial */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2 mt-4">
                <span className="block text-[9px] uppercase font-bold text-indigo-950 tracking-wider">Gestión del Contrato Comercial</span>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 font-semibold">Asesor Comercial Asignado</label>
                  <select
                    value={activeCommercial.asesorAsignado || ''}
                    onChange={async (e) => {
                      try {
                        const email = e.target.value;
                        const updated = await api.updateContratoComercial(activeCommercial.id, { 
                           asesorAsignado: email || undefined 
                        });
                        setActiveCommercial(updated);
                        onRefresh();
                        alert(`Asesor asignado con éxito: ${email || 'Desasignado'}`);
                      } catch (err: any) {
                        alert(`Error al asignar asesor: ${err.message}`);
                      }
                    }}
                    className="w-full border border-indigo-200 bg-white px-3 py-2 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Sin Asesor Comercial Asignado --</option>
                    {availableAdvisors.map(u => (
                      <option key={u.correo} value={u.correo}>{u.nombre} ({u.correo}) - {u.rol === 'administrador' ? 'Administrador' : 'Asesor'}</option>
                    ))}
                    {activeCommercial.asesorAsignado && !availableAdvisors.some(u => u.correo === activeCommercial.asesorAsignado) && (
                      <option key={activeCommercial.asesorAsignado} value={activeCommercial.asesorAsignado}>{activeCommercial.asesorAsignado}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Gestión de Archivo Físico / Offline */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-4">
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Gestión de Archivo Físico / Offline</span>
                <p className="text-[10px] text-slate-500">
                  Si el cliente prefiere firmar de manera física, descargue el borrador en formato HTML/Documento, recopile las firmas manuscritas, y cargue el archivo escaneado para formalizar.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadContractAsHtmlFile(
                      activeCommercial.id,
                      'CONTRATO MARCO COMERCIAL DE SERVICIOS EOR',
                      activeCommercial.contenido || '',
                      activeCommercial.clienteNombre || 'Cliente',
                      activeCommercial.representanteProveedor || 'Daniel Decan'
                    )}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 font-bold rounded-xl transition text-[10px] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar Borrador
                  </button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const base64Data = event.target?.result as string;
                              const updated = await api.updateContratoComercial(activeCommercial.id, {
                                estado: 'Firmado por cliente',
                                archivoFirmado: base64Data,
                                firmaCliente: {
                                  nombre: `${activeCommercial.clienteNombre} (Cargado por archivo firmado)`,
                                  fecha: new Date().toISOString(),
                                  ip: 'Cargado Offline'
                                }
                              });
                              setActiveCommercial(updated);
                              onRefresh();
                              alert('¡Contrato comercial firmado cargado con éxito!');
                            } catch (err: any) {
                              alert(`Error al guardar archivo firmado: ${err.message}`);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-[10px] flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Subir Escaneado
                    </button>
                  </div>
                </div>

                {activeCommercial.archivoFirmado && (
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="truncate text-[9px] font-bold">✓ Archivo de contrato firmado cargado</span>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = activeCommercial.archivoFirmado || '';
                        link.download = `Contrato_Comercial_Firmado_${activeCommercial.id}.pdf`;
                        link.click();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[8px] flex items-center gap-1 uppercase"
                    >
                      <Download className="w-2.5 h-2.5" /> Descargar Archivo
                    </button>
                  </div>
                )}
              </div>

            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex gap-2">
                {/* Print PDF Button */}
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const logoHtml = logoBase64 ? `<img src="${logoBase64}" style="max-height: 70px; display: block; margin-bottom: 20px;" />` : '';
                      const sigClienteHtml = signatureRepBase64 ? `<img src="${signatureRepBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
                      const sigProvHtml = signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Contrato EOR Comercial - ${activeCommercial.clienteNombre}</title>
                            <style>
                              body { font-family: -apple-system, sans-serif; padding: 40px; color: #222; line-height: 1.6; font-size: 13px; }
                              .header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                              .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
                              .sig-box { border-top: 1px solid #777; padding-top: 12px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div>
                                ${logoHtml}
                                <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">CONTRATO MARCO COMERCIAL DE SERVICIOS EOR</h1>
                                <p style="margin: 5px 0 0 0; font-size: 11px; color: #555;">ID Contrato: ${activeCommercial.id} | País: ${activeCommercial.pais}</p>
                              </div>
                            </div>
                            <div>
                              ${activeCommercial.contenido}
                            </div>
                            <div class="signatures">
                              <div class="sig-box">
                                <strong>POR EL CLIENTE:</strong><br/>
                                ${activeCommercial.representanteCliente || 'Representante Cliente'}<br/>
                                ${sigClienteHtml}
                                <p style="font-size: 8px; color: #888; margin-top: 5px;">IP: 186.23.45.190 - Registro Certificado por Quick Hire EOR</p>
                              </div>
                              <div class="sig-box">
                                <strong>POR EL PROVEEDOR (Quick Hire EOR):</strong><br/>
                                Daniel Decan<br/>
                                ${sigProvHtml}
                                <p style="font-size: 8px; color: #888; margin-top: 5px;">IP: 190.11.23.204 - Registro Certificado por Quick Hire EOR</p>
                              </div>
                            </div>
                            <script>
                              window.onload = function() {
                                window.print();
                              }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition text-[10px] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Generar PDF / Imprimir
                </button>

                {/* Send Contract Button */}
                {activeCommercial.estado !== 'Enviado al cliente' && activeCommercial.estado !== 'Firmado por cliente' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const client = clientes.find(c => c.id === activeCommercial.clienteId);
                      const defaultEmail = client?.correoContacto || activeCommercial.usuarioCreador || '';
                      const targetEmail = prompt('Ingrese el correo electrónico del destinatario para enviar el contrato comercial:', defaultEmail);
                      if (targetEmail === null) return; // User cancelled
                      try {
                        const res = await api.enviarCorreoContratoComercial(activeCommercial.id, {
                          correoDestinatario: targetEmail,
                          usuario: user.correo
                        });
                        setActiveCommercial(res.contrato);
                        onRefresh();
                        alert(res.mensaje || 'Contrato comercial enviado con éxito por correo.');
                      } catch (err: any) {
                        alert(`No se pudo enviar el contrato:\n${err.message || 'Error desconocido del servidor.'}`);
                      }
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition text-[10px] flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar por Correo
                  </button>
                )}
              </div>
              <button onClick={() => setActiveCommercial(null)} className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-300 transition text-[10px]">
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE LABORAL CONTRACT PREVIEW MODAL */}
      {activeLaboral && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Contrato de Colaborador: {activeLaboral.trabajadorNombre}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">País: {activeLaboral.pais} | Puesto: {activeLaboral.puesto}</p>
              </div>
              <button onClick={() => setActiveLaboral(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Dynamic Logo header inside contract */}
              {logoBase64 && (
                <div className="flex justify-start pb-2 border-b border-slate-100">
                  <img src={logoBase64} alt="Brand Logo" className="max-h-[50px] object-contain" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-72 overflow-y-auto text-[10px] leading-relaxed text-slate-700 font-mono" dangerouslySetInnerHTML={{ __html: activeLaboral.contenido || 'Sin contenido de contrato generado.' }} />
              
              {/* Digit Stamp details */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-[9px]">
                <div className="bg-indigo-50/50 rounded-xl p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="block font-bold text-indigo-900 mb-1">ESTAMPA DE FIRMA - TRABAJADOR</span>
                    {activeLaboral.firmaTrabajador ? (
                      <div className="space-y-0.5">
                        <div>Firmante: <strong>{activeLaboral.firmaTrabajador.nombre}</strong></div>
                        <div>Fecha: {new Date(activeLaboral.firmaTrabajador.fecha).toLocaleString()}</div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> FIRMADO
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Pendiente de firma del colaborador local.</div>
                    )}
                  </div>
                  {/* Visual Signature or quick sign */}
                  <div className="mt-2 pt-2 border-t border-indigo-100/60">
                    {activeLaboral.firmaTrabajador && signatureRepBase64 ? (
                      <img src={signatureRepBase64} alt="Worker Signature Graphic" className="max-h-[40px] object-contain" referrerPolicy="no-referrer" />
                    ) : !activeLaboral.firmaTrabajador && signatureRepBase64 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updated = await api.updateContratoLaboral(activeLaboral.id, {
                              firmaTrabajador: {
                                nombre: activeLaboral.trabajadorNombre,
                                fecha: new Date().toISOString(),
                                ip: "186.41.92.110"
                              }
                            });
                            setActiveLaboral(updated);
                            onRefresh();
                          } catch (err) {
                            alert('Error al firmar');
                          }
                        }}
                        className="w-full py-1 bg-indigo-600 text-white rounded-lg font-bold text-[8px] uppercase hover:bg-indigo-500"
                      >
                        Estampar mi Firma (Trabajador)
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-400">Cargue firmas para poder estamparlas digitalmente.</span>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-xl p-3 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="block font-bold text-indigo-900 mb-1">ESTAMPA DE FIRMA - PATRÓN (QUICK HIRE)</span>
                    {activeLaboral.firmaRepresentante ? (
                      <div className="space-y-0.5">
                        <div>Firmante: <strong>{activeLaboral.firmaRepresentante.nombre}</strong></div>
                        <div>Fecha: {new Date(activeLaboral.firmaRepresentante.fecha).toLocaleString()}</div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> FIRMADO
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Pendiente de firma de representante legal patronal.</div>
                    )}
                  </div>
                  {/* Visual Signature or quick sign */}
                  <div className="mt-2 pt-2 border-t border-indigo-100/60">
                    {activeLaboral.firmaRepresentante && signatureBase64 ? (
                      <img src={signatureBase64} alt="Provider Signature Graphic" className="max-h-[40px] object-contain" referrerPolicy="no-referrer" />
                    ) : !activeLaboral.firmaRepresentante && signatureBase64 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const updated = await api.updateContratoLaboral(activeLaboral.id, {
                              firmaRepresentante: {
                                nombre: "Daniel Decan (Apoderado Quick Hire)",
                                fecha: new Date().toISOString(),
                                ip: "190.11.23.204"
                              }
                            });
                            setActiveLaboral(updated);
                            onRefresh();
                          } catch (err) {
                            alert('Error al firmar');
                          }
                        }}
                        className="w-full py-1 bg-indigo-600 text-white rounded-lg font-bold text-[8px] uppercase hover:bg-indigo-500"
                      >
                        Estampar mi Firma (Patrón)
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-400">Cargue firmas en "Logos y Firmas" para estamparlas.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Gestión de Archivo Físico / Offline */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-4 text-xs text-slate-700">
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Gestión de Archivo Físico / Offline</span>
                <p className="text-[10px] text-slate-500">
                  Si el colaborador prefiere firmar de manera física, descargue el borrador en formato HTML/Documento, recopile las firmas manuscritas, y cargue el archivo escaneado para formalizar.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadContractAsHtmlFile(
                      activeLaboral.id,
                      'CONTRATO INDIVIDUAL DE TRABAJO LOCAL',
                      activeLaboral.contenido || '',
                      activeLaboral.trabajadorNombre || 'Trabajador',
                      'Daniel Decan'
                    )}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200 font-bold rounded-xl transition text-[10px] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar Borrador
                  </button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const base64Data = event.target?.result as string;
                              const updated = await api.updateContratoLaboral(activeLaboral.id, {
                                estado: 'Firmado',
                                archivoFirmado: base64Data,
                                firmaTrabajador: {
                                  nombre: `${activeLaboral.trabajadorNombre} (Firma Manuscrita Cargada)`,
                                  fecha: new Date().toISOString(),
                                  ip: 'Cargado Offline'
                                },
                                firmaRepresentante: {
                                  nombre: 'Daniel Decan (Apoderado Quick Hire - Cargado Offline)',
                                  fecha: new Date().toISOString(),
                                  ip: 'Cargado Offline'
                                }
                              });
                              setActiveLaboral(updated);
                              onRefresh();
                              alert('¡Contrato laboral firmado cargado con éxito!');
                            } catch (err: any) {
                              alert(`Error al guardar archivo firmado: ${err.message}`);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-[10px] flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Subir Escaneado
                    </button>
                  </div>
                </div>

                {activeLaboral.archivoFirmado && (
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="truncate text-[9px] font-bold">✓ Archivo de contrato firmado cargado</span>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = activeLaboral.archivoFirmado || '';
                        link.download = `Contrato_Laboral_Firmado_${activeLaboral.id}.pdf`;
                        link.click();
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[8px] flex items-center gap-1 uppercase"
                    >
                      <Download className="w-2.5 h-2.5" /> Descargar Archivo
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex gap-2">
                {/* Print PDF Button */}
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const logoHtml = logoBase64 ? `<img src="${logoBase64}" style="max-height: 70px; display: block; margin-bottom: 20px;" />` : '';
                      const sigTrabHtml = signatureRepBase64 ? `<img src="${signatureRepBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
                      const sigRepHtml = signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Contrato de Trabajo Local - ${activeLaboral.trabajadorNombre}</title>
                            <style>
                              body { font-family: -apple-system, sans-serif; padding: 40px; color: #222; line-height: 1.6; font-size: 13px; }
                              .header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                              .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
                              .sig-box { border-top: 1px solid #777; padding-top: 12px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div>
                                ${logoHtml}
                                <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">CONTRATO INDIVIDUAL DE TRABAJO LOCAL</h1>
                                <p style="margin: 5px 0 0 0; font-size: 11px; color: #555;">ID Contrato: ${activeLaboral.id} | Colaborador: ${activeLaboral.trabajadorNombre} | Puesto: ${activeLaboral.puesto}</p>
                              </div>
                            </div>
                            <div>
                              ${activeLaboral.contenido}
                            </div>
                            <div class="signatures">
                              <div class="sig-box">
                                <strong>POR EL TRABAJADOR:</strong><br/>
                                ${activeLaboral.trabajadorNombre}<br/>
                                ${sigTrabHtml}
                                <p style="font-size: 8px; color: #888; margin-top: 5px;">IP: 186.41.92.110 - Firma Electrónica Registrada</p>
                              </div>
                              <div class="sig-box">
                                <strong>POR EL PATRÓN (Quick Hire EOR):</strong><br/>
                                Daniel Decan<br/>
                                ${sigRepHtml}
                                <p style="font-size: 8px; color: #888; margin-top: 5px;">IP: 190.11.23.204 - Firma Electrónica Registrada</p>
                              </div>
                            </div>
                            <script>
                              window.onload = function() {
                                window.print();
                              }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition text-[10px] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Generar PDF / Imprimir
                </button>

                {/* Send Contract Button */}
                {activeLaboral.estado !== 'Enviado a firma' && activeLaboral.estado !== 'Firmado' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const defaultEmail = activeLaboral.trabajadorNombre || '';
                      const targetEmail = prompt('Ingrese el correo electrónico del colaborador para enviarle el contrato a firma:', defaultEmail);
                      if (targetEmail === null) return; // User cancelled
                      try {
                        const res = await api.enviarCorreoContratoLaboral(activeLaboral.id, {
                          correoDestinatario: targetEmail,
                          usuario: user.correo
                        });
                        setActiveLaboral(res.contrato);
                        onRefresh();
                        alert(res.mensaje || 'Contrato laboral enviado con éxito por correo.');
                      } catch (err: any) {
                        alert(`No se pudo enviar el contrato laboral:\n${err.message || 'Error desconocido del servidor.'}`);
                      }
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition text-[10px] flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar por Correo
                  </button>
                )}
              </div>
              <button onClick={() => setActiveLaboral(null)} className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-300 transition text-[10px]">
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Crear Plantilla Legal de Contrato</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Añade una nueva plantilla con marcadores dinámicos.</p>
              </div>
              <button onClick={() => setShowCreateTemplate(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Nombre</label>
                  <input required value={tplNombre} onChange={e => setTplNombre(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="Contrato Marco Local EOR" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Tipo</label>
                  <select value={tplTipo} onChange={e => setTplTipo(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    <option value="comercial">Comercial Cliente-Proveedor</option>
                    <option value="laboral">Laboral de Empleados</option>
                    <option value="adendum">Adendum / Anexo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">País</label>
                  <select value={tplPais} onChange={e => setTplPais(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    <option value="Todos">Todos (Global)</option>
                    {LATAM_COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Servicio</label>
                  <input required value={tplServicio} onChange={e => setTplServicio(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="EOR" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Versión</label>
                  <input required value={tplVersion} onChange={e => setTplVersion(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="1.0" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Vigencia</label>
                  <input required value={tplVigencia} onChange={e => setTplVigencia(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="2026-01-01 a 2026-12-31" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Variables Soportadas (Separadas por comas)</label>
                <input value={tplVariables.join(',')} onChange={e => setTplVariables(e.target.value.split(',').map(s => s.trim()))} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono" />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.baseText} (Usa HTML estructurado)</label>
                <textarea required value={tplArchivoBase} onChange={e => setTplArchivoBase(e.target.value)} rows={6} className="w-full p-2.5 rounded-xl border border-slate-200 text-[10px] font-mono leading-relaxed" placeholder="<h1>CONTRATO</h1><p>Por medio del presente {{empresa}}...</p>" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateTemplate(false)} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-2xl hover:bg-slate-200 transition text-[10px]">
                  {t.cancel}
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]">
                  {loading ? 'Publicando...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE COMMERCIAL CONTRACT MODAL */}
      {showCreateCommercial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{t.createCommercial}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">El sistema compilará las variables para generar el contrato comercial de prestación.</p>
              </div>
              <button onClick={() => setShowCreateCommercial(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateCommercial} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.selectClient}</label>
                  <select value={commClienteId} onChange={e => setCommClienteId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa} ({c.pais})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.selectTemplate}</label>
                  <select value={commPlantillaId} onChange={e => setCommPlantillaId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    {plantillasContrato.filter(p => p.tipo === 'comercial').map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (v{p.version})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">ID Fiscal del Cliente (Cédula)</label>
                  <input required value={commCedula} onChange={e => setCommCedula(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="COL-900344 / MX-234234" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Dirección del Cliente</label>
                  <input required value={commDireccion} onChange={e => setCommDireccion(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="Bogotá, Colombia" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Representante del Cliente</label>
                  <input required value={commRepresentante} onChange={e => setCommRepresentante(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="Carlos Andrés" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Representante del Proveedor</label>
                  <input required value={commRepresentanteProv} onChange={e => setCommRepresentanteProv(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.currency}</label>
                  <input required value={commMoneda} onChange={e => setCommMoneda(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="COP" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.fee}</label>
                  <input required value={commFee} onChange={e => setCommFee(Number(e.target.value))} type="number" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Fecha de Inicio de Servicios</label>
                  <input required value={commFechaInicio} onChange={e => setCommFechaInicio(e.target.value)} type="date" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Condiciones de Cobro</label>
                  <input required value={commCondiciones} onChange={e => setCommCondiciones(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="Mensual - Vencimiento 10 días" />
                </div>
              </div>

              {/* Real-time validation checklist */}
              {(() => {
                const commMissingList = [];
                if (!commClienteId) commMissingList.push("Seleccionar Cliente");
                if (!commPlantillaId) commMissingList.push("Seleccionar Plantilla Comercial");
                if (!commCedula) commMissingList.push("ID Fiscal / Cédula del Cliente");
                if (!commDireccion) commMissingList.push("Dirección de la Empresa Cliente");
                if (!commRepresentante) commMissingList.push("Representante Legal del Cliente");
                if (!commRepresentanteProv) commMissingList.push("Representante Legal del Proveedor");
                if (!commMoneda) commMissingList.push("Moneda");
                if (!commFee || commFee <= 0) commMissingList.push("Fee comercial válido");
                if (!commCondiciones) commMissingList.push("Condiciones comerciales");

                return commMissingList.length > 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <p className="font-bold text-rose-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      ⚠️ Faltan datos mandatorios para generar el contrato:
                    </p>
                    <ul className="list-disc pl-4 text-rose-700 text-[10px] font-semibold space-y-0.5">
                      {commMissingList.map((m, idx) => <li key={idx}>{m}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      ✅ Todos los campos obligatorios han sido validados. Listo para generar.
                    </p>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateCommercial(false)} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-2xl hover:bg-slate-200 transition text-[10px]">
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={loading || (() => {
                    if (!commClienteId || !commPlantillaId || !commCedula || !commDireccion || !commRepresentante || !commRepresentanteProv || !commMoneda || commFee <= 0 || !commCondiciones) return true;
                    return false;
                  })()} 
                  className={`px-4 py-2 text-white font-bold rounded-2xl transition text-[10px] ${
                    loading || (!commClienteId || !commPlantillaId || !commCedula || !commDireccion || !commRepresentante || !commRepresentanteProv || !commMoneda || commFee <= 0 || !commCondiciones)
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-indigo-950 hover:bg-indigo-900 shadow-md'
                  }`}
                >
                  {loading ? 'Compilando...' : t.generate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE LABORAL CONTRACT MODAL */}
      {showCreateLaboral && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{t.createLaboral}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">El sistema compilará las variables para generar el contrato laboral individual local.</p>
              </div>
              <button onClick={() => setShowCreateLaboral(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateLaboral} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.selectWorker}</label>
                  <select value={labTrabajadorId} onChange={e => {
                    setLabTrabajadorId(e.target.value);
                    const selected = workers.find(w => w.id === e.target.value);
                    if (selected) {
                      setLabPuesto(selected.puesto);
                      setLabSalario(selected.salario);
                    }
                  }} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.nombre} ({w.clienteNombre})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.selectTemplate}</label>
                  <select value={labPlantillaId} onChange={e => setLabPlantillaId(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    {plantillasContrato.filter(p => p.tipo === 'laboral').map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (v{p.version} - {p.pais})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Cédula o Doc Identidad Colaborador</label>
                  <input required value={labCedula} onChange={e => setLabCedula(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" placeholder="ID-881231" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.salario}</label>
                  <input required value={labSalario} onChange={e => setLabSalario(Number(e.target.value))} type="number" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.puesto}</label>
                  <input required value={labPuesto} onChange={e => setLabPuesto(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">{t.modalidad}</label>
                  <select value={labModalidad} onChange={e => setLabModalidad(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
                    <option value="Remoto">Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateLaboral(false)} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-2xl hover:bg-slate-200 transition text-[10px]">
                  {t.cancel}
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]">
                  {loading ? 'Compilando...' : t.generate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ADENDUM MODAL */}
      {showCreateAdendum && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{t.createAdendum}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Asocia un adendum a un contrato comercial existente.</p>
              </div>
              <button onClick={() => setShowCreateAdendum(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateAdendum} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Contrato Comercial Principal</label>
                <select 
                  value={adCommId} 
                  onChange={e => handleAdCommChange(e.target.value, adPlantillaId)} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                >
                  {contratosComerciales.map(c => (
                    <option key={c.id} value={c.id}>{c.clienteNombre} - {c.id} ({c.servicioContratado})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Plantilla de Adendum Vigente</label>
                <select 
                  value={adPlantillaId} 
                  onChange={e => handleAdPlantillaChange(e.target.value, adCommId)} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800"
                >
                  <option value="">-- Sin Plantilla (Edición Manual) --</option>
                  {plantillasContrato.filter(p => p.tipo === 'adendum').map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.pais})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Motivo / Tipo de Modificación</label>
                <input required value={adMotivo} onChange={e => setAdMotivo(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800" placeholder="Ajuste de Fee Anual / Reajuste de Beneficios" />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Descripción del Cambio / Motivo Detallado</label>
                <textarea required value={adDescripcionCambio} onChange={e => setAdDescripcionCambio(e.target.value)} rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-800" placeholder="Escriba de forma resumida el motivo de este anexo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Usuario Responsable</label>
                  <input required value={adUsuarioResponsable} onChange={e => setAdUsuarioResponsable(e.target.value)} type="email" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800" placeholder="usuario@grupostt.com" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Observaciones Iniciales</label>
                  <input value={adObservaciones} onChange={e => setAdObservaciones(e.target.value)} type="text" className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800" placeholder="Opcional..." />
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Contenido Modificatorio del Adendum</label>
                <textarea required value={adContenido} onChange={e => setAdContenido(e.target.value)} rows={6} className="w-full p-2.5 rounded-xl border border-slate-200 text-[10px] font-mono leading-relaxed text-slate-800" placeholder="Por medio de este anexo, se acuerda reajustar..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateAdendum(false)} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-2xl hover:bg-slate-200 transition text-[10px]">
                  {t.cancel}
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-950 text-white font-bold rounded-2xl hover:bg-indigo-900 transition text-[10px]">
                  {loading ? 'Generando...' : t.generate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
