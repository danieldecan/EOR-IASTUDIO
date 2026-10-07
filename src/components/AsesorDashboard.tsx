import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, Calendar, CreditCard, Clock, CheckCircle, 
  ArrowRight, Info, HelpCircle, FileText, AlertCircle, Plus, 
  MessageSquare, Bell, History, Briefcase, FileSpreadsheet, 
  FileSignature, LogOut, Search, UserCheck, Trash2, Edit2, 
  Send, RefreshCw, Filter, Globe, ChevronRight, ChevronDown, Check, X, UserPlus, DollarSign,
  Copy, Eye, Download, Layers, ShieldCheck, Percent
} from 'lucide-react';
import { api } from '../api';
import ManagementReportsPanel from './ManagementReportsPanel';
import DirectorioView from './DirectorioView';
import FeesManagementPanel from './FeesManagementPanel';
import IvaWhtRentaMaster from './IvaWhtRentaMaster';
import LanguageSelector from './LanguageSelector';
import UserManualModal from './UserManualModal';
import { PWAInstallButton } from './PWAInstallButton';
import QuoteSimulatorModal from './QuoteSimulatorModal';
import UserEditModal from './UserEditModal';
import { DEFAULT_ROLES_CONFIG, ALL_MENU_IDS } from '../data/menuOptions';
import { BookOpen, Calculator, Contact } from 'lucide-react';
import { tText, translateStatus, tr, translateRole } from '../utils/i18n';
import { 
  SolicitudEOR, Cliente, ContratoComercial, Ticket, 
  User, SeguimientoComercial, Language, i18n, PlantillaContrato, PlantillaNotificacion, Factura, Tarifa, ALL_COUNTRIES,
  LATAM_COUNTRIES, COUNTRY_FLAGS,
  RoleDefinition, Trabajador
} from '../types';
import { calcularCostoTalento } from '../utils/laborCalculator';
import { CONTRATO_MARCO_EOR_PLANTILLA_HTML, renderCommercialContractHtml } from '../data/contractTemplates';

const DEFAULT_PLANTILLAS_FALLBACK: PlantillaContrato[] = [
  {
    id: 'PL-CONTR-001',
    nombre: 'Contrato Marco de Prestación de Servicios EOR (Único Estándar Master)',
    tipo: 'comercial',
    pais: 'Todos',
    servicio: 'Todos',
    version: '1.0',
    vigencia: '2026-01-01 a 2026-12-31',
    estado: 'Activo',
    variables: ['empresa', 'razonSocial', 'cedulaJuridica', 'pais', 'direccion', 'nombreContacto', 'representanteLegal', 'documentoRepresentante', 'correoContacto', 'telefonoContacto', 'servicioContratado', 'moneda', 'feePorEmpleado', 'fechaInicio', 'credito'],
    archivoBase: CONTRATO_MARCO_EOR_PLANTILLA_HTML,
    observaciones: 'Única plantilla de contrato comercial estándar para todos los clientes (Admin & Asesor).',
    usuarioResponsable: 'administrador-eor-peo@grupostt.com',
    fechaCreacion: '2026-01-15T08:00:00Z',
    fechaModificacion: '2026-01-15T08:00:00Z'
  },
  {
    id: 'PL-CONTR-002',
    nombre: 'Contrato Laboral de Empleado (Local)',
    tipo: 'laboral',
    pais: 'México',
    servicio: 'EOR',
    version: '1.2',
    vigencia: '2026-01-01 a 2026-12-31',
    estado: 'Activo',
    variables: ['trabajadorNombre', 'documentoIdentificacion', 'puesto', 'fechaIngreso', 'salario', 'moneda', 'modalidadTrabajo', 'clienteNombre'],
    archivoBase: '<h1>CONTRATO INDIVIDUAL DE TRABAJO (BAJO REGLAMENTO LOCAL)</h1><p>En la ciudad correspondiente, se formaliza este acuerdo laboral entre la entidad local contratadora de <b>Quick Hire</b> y el trabajador <b>{{trabajadorNombre}}</b>, de identificación fiscal {{documentoIdentificacion}}.</p><p><b>PRIMERA (Puesto y Funciones):</b> El trabajador desempeñará las labores de {{puesto}} prestando servicio directo asignado a la empresa cliente {{clienteNombre}}.</p><p><b>SEGUNDA (Fecha de Ingreso):</b> La fecha oficial de ingreso del colaborador es el {{fechaIngreso}}.</p><p><b>TERCERA (Remuneración):</b> El trabajador percibirá un salario mensual bruto de {{moneda}} {{salario}}, pagadero bajo la frecuencia establecida.</p><p><b>CUARTA (Modalidad):</b> La modalidad de trabajo acordada es {{modalidadTrabajo}}.</p><p>Firmas en conformidad:</p><p>El Trabajador: _______________________ ({{trabajadorNombre}})<br/>El Patrón: _______________________ (Representante Quick Hire)</p>',
    observaciones: 'Plantilla de contrato laboral alineada con la Ley Federal del Trabajo de México.',
    usuarioResponsable: 'administrador-eor-peo@grupostt.com',
    fechaCreacion: '2026-01-18T10:30:00Z',
    fechaModificacion: '2026-01-20T11:00:00Z'
  },
  {
    id: 'PL-CONTR-003',
    nombre: 'Adendum de Ajuste Salarial / Beneficios',
    tipo: 'adendum',
    pais: 'Todos',
    servicio: 'Todos',
    version: '1.0',
    vigencia: '2026-01-01 a 2026-12-31',
    estado: 'Activo',
    variables: ['empresa', 'motivoCambio', 'fechaGeneracion'],
    archivoBase: '<h1>ANEXO / ADENDUM AL CONTRATO PRINCIPAL</h1><p>Este documento constituye un anexo modificatorio al contrato de servicios celebrado con el cliente <b>{{empresa}}</b>.</p><p><b>MODIFICACIÓN:</b> Se acuerda la modificación de las condiciones iniciales debido a: {{motivoCambio}}.</p><p>Este cambio rige formalmente a partir del {{fechaGeneracion}} conservando el resto de las cláusulas contractuales inalteradas.</p><p>Firmas:</p><p>Cliente: _______________________<br/>Quick Hire: _______________________</p>',
    observaciones: 'Plantilla para anexos y adendas generales.',
    usuarioResponsable: 'administrador-eor-peo@grupostt.com',
    fechaCreacion: '2026-02-01T09:00:00Z',
    fechaModificacion: '2026-02-01T09:00:00Z'
  }
];

interface AsesorDashboardProps {
  user: User;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onLogout: () => void;
}

export default function AsesorDashboard({ user, lang, onLanguageChange, onLogout }: AsesorDashboardProps) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<
    'panel' | 'solicitudes' | 'clientes' | 'trabajadores' | 'contratos' | 'plantillas' | 'seguimiento' | 'tickets' | 'users' | 'perfil' | 'reports' | 'billing' | 'fees' | 'directorio' | 'iva_wht_renta'
  >('panel');

  // Expanded state for grouped menu sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    gestion: true,
    contratos: true,
    finanzas: true,
    soporte: true,
    reportes: true,
    admin: true,
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };
  
  // States for System Users & Advisors Management
  const [sysUserModalOpen, setSysUserModalOpen] = useState(false);
  const [sysUserName, setSysUserName] = useState('');
  const [sysUserEmail, setSysUserEmail] = useState('');
  const [sysUserRole, setSysUserRole] = useState<'asesor_comercial' | 'administrador' | 'cliente'>('cliente');
  const [sysUserClientId, setSysUserClientId] = useState('');
  const [sysUserLang, setSysUserLang] = useState<'es' | 'en' | 'pt'>('es');
  const [sysUserError, setSysUserError] = useState('');
  const [sysUserSuccess, setSysUserSuccess] = useState('');
  const [sysRoleFilter, setSysRoleFilter] = useState('all');

  // Data States
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES_CONFIG);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudEOR[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<ContratoComercial[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [seguimientos, setSeguimientos] = useState<SeguimientoComercial[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaContrato[]>(DEFAULT_PLANTILLAS_FALLBACK);
  const [plantillasNotificacion, setPlantillasNotificacion] = useState<PlantillaNotificacion[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [tplSubTab, setTplSubTab] = useState<'contratos' | 'notificaciones'>('contratos');
  const [solicitudToDelete, setSolicitudToDelete] = useState<{ id: string; empresa: string } | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const fetchRoles = async () => {
    try {
      const fetchedRoles = await api.getRoles();
      if (fetchedRoles && fetchedRoles.length > 0) {
        setRoles(fetchedRoles);
      }
    } catch (err) {
      console.error('Error fetching roles in AsesorDashboard:', err);
    }
  };

  const currentRoleDef = useMemo(() => {
    if (user.rol === 'administrador' || user.rol === 'Administrador' || user.rol === 'supracliente') {
      return {
        id: 'administrador',
        nombre: 'Administrador',
        descripcion: 'Control y administración total del sistema',
        esAdmin: true,
        esSistema: true,
        opcionesMenu: ALL_MENU_IDS
      } as RoleDefinition;
    }
    const userRoleLower = (user.rol || '').toLowerCase().trim();
    const found = roles.find(r => 
      r.id === user.rol || 
      r.id.toLowerCase() === userRoleLower ||
      r.nombre.toLowerCase() === userRoleLower ||
      (userRoleLower.includes('asesor') && (r.id === 'asesor_comercial' || r.id === 'asesor'))
    );
    return found || DEFAULT_ROLES_CONFIG.find(r => r.id === 'asesor_comercial') || DEFAULT_ROLES_CONFIG[1];
  }, [roles, user.rol]);

  const isMenuVisible = (menuId: string): boolean => {
    if (user.rol === 'administrador' || user.rol === 'Administrador' || user.rol === 'supracliente') {
      return true;
    }
    if (!currentRoleDef) return true;
    return currentRoleDef.opcionesMenu.includes(menuId);
  };

  const handleDeleteUser = async (u: User) => {
    if (u.correo.toLowerCase() === 'administrador-eor-peo@grupostt.com' || u.correo.toLowerCase() === 'daniel.decan@nominasaps.com') {
      alert('No es posible eliminar la cuenta principal de administración del sistema.');
      return;
    }
    if (u.correo.toLowerCase() === user.correo.toLowerCase()) {
      alert('No puedes eliminar tu propia cuenta mientras estás conectado.');
      return;
    }
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${u.nombre || u.correo}" (${u.correo})?\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      const res = await api.deleteUsuario(u.correo, user.correo);
      alert(res.message || 'Usuario eliminado exitosamente.');
      const updatedUsers = await api.getUsuarios().catch(() => []);
      setAllUsers(updatedUsers);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el usuario.');
    }
  };

  // Invoice creation states
  const [genClienteId, setGenClienteId] = useState('');
  const [genPeriodo, setGenPeriodo] = useState('2026-08');
  const [genImpuesto, setGenImpuesto] = useState(19);
  const [genComisionPct, setGenComisionPct] = useState(2.5);
  const [genWhtPct, setGenWhtPct] = useState(4);
  const [genOtrosImpuestosPct, setGenOtrosImpuestosPct] = useState(1.5);
  const [genFeePorEmpleado, setGenFeePorEmpleado] = useState<number | ''>('');
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');
  const [selectedFacturaDetail, setSelectedFacturaDetail] = useState<Factura | null>(null);
  const [feeCountryFilter, setFeeCountryFilter] = useState('all');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [commStatusFilter, setCommStatusFilter] = useState<string>('All');
  const [tplTypeFilter, setTplTypeFilter] = useState<string>('All');
  
  // Master lists for multi-country scope
  const [allSolicitudes, setAllSolicitudes] = useState<SolicitudEOR[]>([]);
  const [allClientes, setAllClientes] = useState<Cliente[]>([]);
  const [allContratos, setAllContratos] = useState<ContratoComercial[]>([]);
  
  // Modal & Active Item States
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEOR | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<ContratoComercial | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<PlantillaContrato | null>(null);

  // Edit Client States
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editClientEmpresa, setEditClientEmpresa] = useState('');
  const [editClientPais, setEditClientPais] = useState('México');
  const [editClientFee, setEditClientFee] = useState<number | string>(150);
  const [editClientCupo, setEditClientCupo] = useState<number | string>(10);
  const [editClientMoneda, setEditClientMoneda] = useState('USD');
  const [editClientCorreo, setEditClientCorreo] = useState('');
  const [editClientTelefono, setEditClientTelefono] = useState('');
  const [editClientContacto, setEditClientContacto] = useState('');
  const [editClientEstado, setEditClientEstado] = useState('Activo');
  const [editClientSupraclienteId, setEditClientSupraclienteId] = useState('');
  const [editClientTipoSocio, setEditClientTipoSocio] = useState<string>('Directo');
  const [editClientRazonSocial, setEditClientRazonSocial] = useState('');
  const [editClientRepresentanteLegal, setEditClientRepresentanteLegal] = useState('');
  const [editClientCedulaJuridica, setEditClientCedulaJuridica] = useState('');
  const [editClientError, setEditClientError] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  
  // Action Forms States
  const [showCreateSeguimientoModal, setShowCreateSeguimientoModal] = useState<boolean>(false);
  const [showGenerateContractModal, setShowGenerateContractModal] = useState<boolean>(false);
  const [seguimientoForm, setSeguimientoForm] = useState({
    relacionadoTipo: 'solicitud' as 'solicitud' | 'cliente' | 'contrato',
    relacionadoId: '',
    tipoSeguimiento: 'Llamada',
    comentario: '',
    proximaAccion: '',
    fechaProximaGestion: '',
    estadoComercialSugerido: ''
  });
  
  const [contractForm, setContractForm] = useState({
    clienteId: '',
    plantillaId: '',
    representanteCliente: '',
    representanteProveedor: user.nombre,
    feePorEmpleado: 1500,
    condicionesComerciales: 'Suscripción base mensual por colaborador. Soporte local incluido.',
    cedulaJuridica: '',
    direccion: '',
    variablesValidadas: {} as Record<string, string>,
  });
  const [isGeneratingContract, setIsGeneratingContract] = useState<boolean>(false);
  const [contractModalError, setContractModalError] = useState<string>('');

  const [ticketResponse, setTicketResponse] = useState<string>('');
  const [ticketResponseIsInternal, setTicketResponseIsInternal] = useState<boolean>(false);
  const [isSubmittingTicketResponse, setIsSubmittingTicketResponse] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Tariff / Fee management modal states
  const [showTarifaModal, setShowTarifaModal] = useState<Tarifa | 'new' | null>(null);
  const [tariffPais, setTariffPais] = useState<string>('Colombia');
  const [tariffServicio, setTariffServicio] = useState<string>('Employer of Record (EOR)');
  const [tariffMoneda, setTariffMoneda] = useState<string>('USD');
  const [tariffFee, setTariffFee] = useState<number>(200);
  const [tariffVigencia, setTariffVigencia] = useState<string>('2026-12-31');
  const [tariffEstado, setTariffEstado] = useState<string>('Vigente');
  const [tariffMotivo, setTariffMotivo] = useState<string>('');
  const [tariffError, setTariffError] = useState<string>('');

  // Plantilla creation states
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState<boolean>(false);
  const [tplFormNombre, setTplFormNombre] = useState<string>('');
  const [tplFormTipo, setTplFormTipo] = useState<'comercial' | 'laboral' | 'adendum'>('comercial');
  const [tplFormPais, setTplFormPais] = useState<string>('Colombia');
  const [tplFormServicio, setTplFormServicio] = useState<string>('Employer of Record (EOR)');
  const [tplFormVersion, setTplFormVersion] = useState<string>('1.0');
  const [tplFormVigencia, setTplFormVigencia] = useState<string>('2026-01-01 a 2026-12-31');
  const [tplFormVariables, setTplFormVariables] = useState<string>('cliente, pais, servicio, feePorEmpleado, condicionesComerciales, representanteCliente, representanteProveedor');
  const [tplFormArchivoBase, setTplFormArchivoBase] = useState<string>(
    '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px;">' +
    '<h1 style="color: #1e1b4b; text-align: center; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS EOR</h1>' +
    '<p>En la ciudad de Bogotá, entre <strong>{{cliente}}</strong> con domicilio en {{pais}} y <strong>Quick Hire EOR Services</strong>, se acuerda la prestación del servicio de <strong>{{servicio}}</strong> con un fee comercial de <strong>{{feePorEmpleado}}</strong>.</p>' +
    '<h3 style="color: #312e81; font-size: 14px; margin-top: 20px;">CONDICIONES COMERCIALES</h3>' +
    '<p>{{condicionesComerciales}}</p>' +
    '<div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">' +
    '<div style="border-top: 1px solid #94a3b8; padding-top: 8px;"><strong>POR EL CLIENTE:</strong><br/>{{representanteCliente}}</div>' +
    '<div style="border-top: 1px solid #94a3b8; padding-top: 8px;"><strong>POR EL PROVEEDOR:</strong><br/>{{representanteProveedor}}</div>' +
    '</div>' +
    '</div>'
  );
  const [tplFormLoading, setTplFormLoading] = useState<boolean>(false);
  const [tplFormError, setTplFormError] = useState<string>('');

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTplFormError('');

    if (!tplFormNombre.trim() || !tplFormArchivoBase.trim()) {
      setTplFormError('El nombre y el contenido base del contrato son obligatorios.');
      return;
    }

    try {
      setTplFormLoading(true);
      const vars = tplFormVariables.split(',').map(v => v.trim()).filter(Boolean);
      await api.createPlantillaContrato({
        nombre: tplFormNombre.trim(),
        tipo: tplFormTipo,
        pais: tplFormPais,
        servicio: tplFormServicio,
        version: tplFormVersion.trim() || '1.0',
        vigencia: tplFormVigencia.trim() || '2026-01-01 a 2026-12-31',
        variables: vars,
        archivoBase: tplFormArchivoBase,
        usuarioResponsable: user.correo,
        estado: 'Activo'
      });
      triggerToast('Nueva plantilla legal creada y activada correctamente.');
      setShowCreateTemplateModal(false);
      setTplFormNombre('');
      setTplFormError('');
      fetchData();
    } catch (err: any) {
      setTplFormError(err.message || 'Error al crear la plantilla de contrato.');
    } finally {
      setTplFormLoading(false);
    }
  };

  const handleSaveTarifa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTariffError('');

    try {
      if (showTarifaModal === 'new') {
        await api.createTarifa({
          pais: tariffPais,
          servicio: tariffServicio,
          moneda: tariffMoneda,
          feeBase: Number(tariffFee),
          tramosVolumen: '',
          descuentos: '',
          vigencia: tariffVigencia,
          usuario: user.correo
        });
        triggerToast('Nueva tarifa por país creada exitosamente.');
      } else if (showTarifaModal && typeof showTarifaModal === 'object') {
        if (!tariffMotivo.trim()) {
          setTariffError('Se requiere obligatoriamente registrar el motivo de la actualización de tarifa.');
          return;
        }

        await api.updateTarifa(showTarifaModal.id, {
          feeBase: Number(tariffFee),
          estado: tariffEstado,
          motivo: tariffMotivo,
          usuario: user.correo
        });
        triggerToast(`Tarifa para ${tariffPais} actualizada correctamente.`);
      }

      setShowTarifaModal(null);
      setTariffMotivo('');
      fetchData();
    } catch (err: any) {
      setTariffError(err.message || 'Error al guardar tarifa.');
    }
  };

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sData, cData, ctData, tData, segData, pData, uData, fData, tfData, pnData] = await Promise.all([
        api.getSolicitudes().catch(() => []),
        api.getClientes().catch(() => []),
        api.getContratosComerciales().catch(() => []),
        api.getTickets().catch(() => []),
        api.getSeguimientosComerciales().catch(() => []),
        api.getPlantillasContrato().catch(() => []),
        api.getUsuarios().catch(() => []),
        api.getFacturas().catch(() => []),
        api.getTarifas().catch(() => []),
        api.getPlantillasNotificacion().catch(() => []),
      ]);
      setTarifas(tfData);
      setPlantillasNotificacion(pnData);
      
      // Store all records for full multi-country scope visibility
      setAllSolicitudes(sData || []);
      setAllClientes(cData || []);
      setAllContratos(ctData || []);

      // Filter data by Advisor's assignment
      const assignedSols = (sData || []).filter(s => s.asesorAsignado === user.correo);
      const assignedSolsIds = assignedSols.map(s => s.id);
      
      const assignedClientes = (cData || []).filter(c => 
        c.asesorAsignado === user.correo || 
        (c.solicitudVinculadaId && assignedSolsIds.includes(c.solicitudVinculadaId))
      );
      const assignedClientIds = assignedClientes.map(c => c.id);

      const assignedContratos = (ctData || []).filter(ct => 
        ct.asesorAsignado === user.correo || 
        assignedClientIds.includes(ct.clienteId) || 
        (ct.solicitudId && assignedSolsIds.includes(ct.solicitudId))
      );

      const assignedTickets = tData.filter(t => 
        t.asesorAsignado === user.correo || 
        assignedClientIds.includes(t.clienteId) ||
        !t.asesorAsignado ||
        t.asesorAsignado === 'asesor-eor-peo@grupostt.com' ||
        assignedClientIds.length === 0
      );

      // Filter follow-ups linked to the advisor's scope
      const assignedSegs = segData.filter((seg: SeguimientoComercial) => 
        seg.usuario === user.correo ||
        (seg.relacionadoTipo === 'solicitud' && assignedSolsIds.includes(seg.relacionadoId)) ||
        (seg.relacionadoTipo === 'cliente' && assignedClientIds.includes(seg.relacionadoId)) ||
        (seg.relacionadoTipo === 'contrato' && assignedContratos.map(co => co.id).includes(seg.relacionadoId))
      );

      // Invoices for advisor's clients (or all if fallback)
      const assignedFacturas = fData.filter(f => assignedClientIds.includes(f.clienteId) || user.rol === 'asesor_comercial');

      setSolicitudes(assignedSols);
      setClientes(assignedClientes.length > 0 ? assignedClientes : cData);
      setContratos(assignedContratos);
      setTickets(assignedTickets);
      setSeguimientos(assignedSegs);
      setPlantillas(pData && pData.length > 0 ? pData : DEFAULT_PLANTILLAS_FALLBACK);
      setAllUsers(uData);
      setFacturas(assignedFacturas.length > 0 ? assignedFacturas : fData);
    } catch (err) {
      console.error('Error fetching data for advisor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError('');
    setGenSuccess('');
    if (!genClienteId || !genPeriodo) {
      setGenError('Por favor selecciona un cliente y un periodo de facturación.');
      return;
    }
    try {
      const nueva = await api.generarFactura({
        clienteId: genClienteId,
        periodo: genPeriodo,
        ivaPct: Number(genImpuesto),
        comisionPct: Number(genComisionPct),
        whtPct: Number(genWhtPct),
        otrosImpuestosPct: Number(genOtrosImpuestosPct),
        feePorEmpleado: genFeePorEmpleado !== '' ? Number(genFeePorEmpleado) : undefined,
        usuario: user.correo
      });
      setGenSuccess(`Factura ${nueva.id} generada exitosamente para el cliente.`);
      fetchData();
    } catch (err: any) {
      setGenError(err.message || 'Error al generar la factura.');
    }
  };

  const handleUpdateInvoiceStatus = async (facturaId: string, nuevoEstado: string) => {
    try {
      await api.updateFactura(facturaId, { estado: nuevoEstado, usuario: user.correo });
      setActionSuccess(`Estado de la factura ${facturaId} actualizado a "${nuevoEstado}".`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Error actualizando estado de factura.');
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [user.correo]);

  // Auto-switch to first available menu option if current tab is not permitted for the user's role
  useEffect(() => {
    if (!loading && currentRoleDef?.opcionesMenu) {
      const tabToMenuMap: Record<string, string> = {
        panel: 'kpis',
        solicitudes: 'solicitudes',
        clientes: 'clientes',
        seguimiento: 'solicitudes',
        contratos: 'contracts',
        plantillas: 'plantillas',
        billing: 'billing',
        fees: 'fees',
        directorio: 'directorio',
        iva_wht_renta: 'iva_wht_renta',
        tickets: 'tickets',
        reports: 'reports',
        users: 'users'
      };
      const requiredMenuId = tabToMenuMap[activeTab];
      if (requiredMenuId && !isMenuVisible(requiredMenuId)) {
        const firstVisibleMenu = currentRoleDef.opcionesMenu.find(m => isMenuVisible(m));
        if (firstVisibleMenu) {
          const menuToTabMap: Record<string, any> = {
            kpis: 'panel',
            solicitudes: 'solicitudes',
            clientes: 'clientes',
            contracts: 'contratos',
            plantillas: 'plantillas',
            billing: 'billing',
            fees: 'fees',
            directorio: 'directorio',
            iva_wht_renta: 'iva_wht_renta',
            tickets: 'tickets',
            reports: 'reports',
            users: 'users'
          };
          const targetTab = menuToTabMap[firstVisibleMenu] || 'panel';
          setActiveTab(targetTab);
        }
      }
    }
  }, [currentRoleDef, activeTab, loading]);

  // Handle Toast helper
  const triggerToast = (msg: string, isError: boolean = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(''), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 5000);
    }
  };

  const handleCreateSystemUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSysUserError('');
    setSysUserSuccess('');

    if (!sysUserName.trim() || !sysUserEmail.trim()) {
      setSysUserError('Por favor ingrese el nombre completo y correo electrónico.');
      return;
    }

    if (!sysUserClientId) {
      setSysUserError('Debe seleccionar la empresa cliente vinculada.');
      return;
    }

    try {
      await api.createUsuario({
        correo: sysUserEmail.trim(),
        nombre: sysUserName.trim(),
        rol: 'cliente',
        clienteId: sysUserClientId,
        estado: 'Activo',
        idioma: sysUserLang,
        usuario: user.correo
      });

      setSysUserSuccess(`Usuario Cliente creado exitosamente. Se ha enviado un correo de bienvenida con las credenciales de acceso a ${sysUserEmail.trim()} vía alertas@grupostt.com.`);
      setSysUserName('');
      setSysUserEmail('');
      setSysUserClientId('');
      setSysUserModalOpen(false);

      // Reload user list
      const updatedUsers = await api.getUsuarios().catch(() => []);
      setAllUsers(updatedUsers);
    } catch (err: any) {
      setSysUserError(err.message || 'Error al crear el usuario.');
    }
  };

  // Follow-up commercial states options
  const commercialStates = [
    'Nueva asignación',
    'En contacto',
    'En revisión comercial',
    'Pendiente de información del cliente',
    'Lista para contrato',
    'Contrato generado',
    'Contrato enviado',
    'Pendiente de firma',
    'Contrato firmado',
    'Pendiente de pago',
    'Convertida en cliente',
    'Descartada'
  ];

  // Countries options list from assigned data
  const uniqueCountries = Array.from(new Set([
    ...solicitudes.map(s => s.pais),
    ...clientes.map(c => c.pais)
  ])).filter(Boolean);

  // Submit follow-up handler
  const handleCreateSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seguimientoForm.relacionadoId || !seguimientoForm.comentario) {
      triggerToast('Por favor complete la entidad relacionada y el comentario.', true);
      return;
    }

    try {
      // Find name for related entity
      let relacionadoNombre = '';
      if (seguimientoForm.relacionadoTipo === 'solicitud') {
        const sol = solicitudes.find(s => s.id === seguimientoForm.relacionadoId);
        relacionadoNombre = sol ? sol.empresa : 'Solicitud';
      } else if (seguimientoForm.relacionadoTipo === 'cliente') {
        const cl = clientes.find(c => c.id === seguimientoForm.relacionadoId);
        relacionadoNombre = cl ? cl.empresa : 'Cliente';
      } else if (seguimientoForm.relacionadoTipo === 'contrato') {
        const co = contratos.find(c => c.id === seguimientoForm.relacionadoId);
        relacionadoNombre = co ? `${co.clienteNombre} (${co.id})` : 'Contrato';
      }

      const payload = {
        relacionadoTipo: seguimientoForm.relacionadoTipo,
        relacionadoId: seguimientoForm.relacionadoId,
        relacionadoNombre,
        tipoSeguimiento: seguimientoForm.tipoSeguimiento,
        comentario: seguimientoForm.comentario,
        fecha: new Date().toISOString(),
        usuario: user.correo,
        proximaAccion: seguimientoForm.proximaAccion || undefined,
        fechaProximaGestion: seguimientoForm.fechaProximaGestion || undefined,
        estadoComercialSugerido: seguimientoForm.estadoComercialSugerido || undefined
      };

      await api.createSeguimientoComercial(payload);

      // Perform state triggers if commercial status change was requested
      if (seguimientoForm.estadoComercialSugerido) {
        if (seguimientoForm.relacionadoTipo === 'solicitud') {
          await api.updateSolicitud(seguimientoForm.relacionadoId, {
            estadoComercial: seguimientoForm.estadoComercialSugerido,
            fechaUltimaGestion: new Date().toISOString()
          });
        } else if (seguimientoForm.relacionadoTipo === 'cliente') {
          await api.updateCliente(seguimientoForm.relacionadoId, {
            ultimaGestion: `Seguimiento: ${seguimientoForm.estadoComercialSugerido}`,
            motivo: `Actualización de estado comercial a: ${seguimientoForm.estadoComercialSugerido}`,
            usuario: user.correo
          });
        }
      }

      triggerToast('Seguimiento registrado y guardado en la auditoría con éxito.');
      setShowCreateSeguimientoModal(false);
      setSeguimientoForm({
        relacionadoTipo: 'solicitud',
        relacionadoId: '',
        tipoSeguimiento: 'Llamada',
        comentario: '',
        proximaAccion: '',
        fechaProximaGestion: '',
        estadoComercialSugerido: ''
      });
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error registrando el seguimiento comercial.', true);
    }
  };

  // Helper to open generate contract modal pre-selecting client and template
  const openGenerateContractModal = (client?: Cliente | null, template?: PlantillaContrato | null) => {
    setContractModalError('');
    setIsGeneratingContract(false);
    const currentPlantillas = plantillas.length > 0 ? plantillas : DEFAULT_PLANTILLAS_FALLBACK;
    const targetClient = client || (contractForm.clienteId ? clientes.find(c => c.id === contractForm.clienteId) : clientes[0]);
    
    // Find matching template
    let targetTemplate = template || null;
    if (!targetTemplate && contractForm.plantillaId) {
      targetTemplate = currentPlantillas.find(p => p.id === contractForm.plantillaId) || null;
    }
    if (!targetTemplate && targetClient) {
      targetTemplate = currentPlantillas.find(p => p.tipo === 'comercial' && p.estado === 'Activo' && (p.pais === targetClient.pais || p.pais === 'Todos')) || null;
    }
    if (!targetTemplate) {
      targetTemplate = currentPlantillas.find(p => p.tipo === 'comercial' && p.estado === 'Activo') || currentPlantillas[0];
    }

    const selectedFee = targetClient?.feePorEmpleado ? Number(targetClient.feePorEmpleado) : 1500;
    const selectedRep = targetClient?.representanteLegal || targetClient?.nombreContacto || '';
    const selectedCedula = targetClient?.cedulaJuridica || (targetClient as any)?.nit || (targetClient as any)?.idFiscal || (targetClient ? `${targetClient.pais === 'México' ? 'MX' : 'COL'}-900344` : 'COL-900344');
    const selectedDir = targetClient?.direccion || (targetClient as any)?.domicilioFiscal || (targetClient ? `Sede Principal ${targetClient.pais}` : 'Av. Principal #100');

    setContractForm({
      clienteId: targetClient ? targetClient.id : (clientes[0]?.id || ''),
      plantillaId: targetTemplate ? targetTemplate.id : (currentPlantillas[0]?.id || 'PL-CONTR-001'),
      representanteCliente: selectedRep,
      representanteProveedor: user.nombre || 'Daniel Decan',
      feePorEmpleado: selectedFee,
      condicionesComerciales: 'Suscripción base mensual por colaborador. Soporte local incluido.',
      cedulaJuridica: selectedCedula,
      direccion: selectedDir,
      variablesValidadas: {},
    });
    setShowGenerateContractModal(true);
  };

  // Generate contract handler
  const handleGenerateContract = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setContractModalError('');

    const availablePlantillas = plantillas.length > 0 ? plantillas : DEFAULT_PLANTILLAS_FALLBACK;
    const currentClientId = contractForm.clienteId || clientes[0]?.id;
    const currentPlantillaId = contractForm.plantillaId || availablePlantillas[0]?.id;

    if (!currentClientId) {
      setContractModalError('Por favor seleccione un cliente de la lista.');
      return;
    }

    setIsGeneratingContract(true);

    try {
      const selectedCl = clientes.find(c => c.id === currentClientId) || clientes[0];
      const selectedPl = availablePlantillas.find(p => p.id === currentPlantillaId) || availablePlantillas[0];

      if (!selectedCl || !selectedPl) {
        setContractModalError('No se encontró el cliente o la plantilla seleccionada.');
        setIsGeneratingContract(false);
        return;
      }

      // Compile content: replace all standard & custom variables
      let rawBase = selectedPl.archivoBase;
      if (selectedPl.tipo === 'comercial' && (!rawBase || rawBase.length < 2000)) {
        rawBase = CONTRATO_MARCO_EOR_PLANTILLA_HTML;
      }
      let finalContent = rawBase;

      const targetCountry = selectedCl.pais || 'Colombia';
      const varsToReplace: Record<string, string> = {
        empresa: selectedCl.empresa,
        clienteNombre: selectedCl.empresa,
        razonSocial: selectedCl.razonSocial || selectedCl.empresa,
        cedulaJuridica: contractForm.cedulaJuridica || selectedCl.cedulaJuridica || (selectedCl as any)?.nit || 'COL-900344',
        nit: contractForm.cedulaJuridica || selectedCl.cedulaJuridica || (selectedCl as any)?.nit || 'COL-900344',
        pais: targetCountry,
        direccion: contractForm.direccion || selectedCl.direccion || 'Sede Principal',
        nombreContacto: contractForm.representanteCliente || selectedCl.nombreContacto || 'Representante Legal',
        representanteCliente: contractForm.representanteCliente || selectedCl.nombreContacto || 'Representante Legal',
        representanteLegal: contractForm.representanteCliente || selectedCl.nombreContacto || 'Representante Legal',
        documentoRepresentante: contractForm.cedulaJuridica || 'COL-900344',
        correoContacto: selectedCl.correoContacto || 'contacto@empresa.com',
        telefonoContacto: selectedCl.telefonoContacto || '+1 (555) 019-2834',
        servicio: selectedCl.servicioContratado || 'Employer of Record (EOR)',
        servicioContratado: selectedCl.servicioContratado || 'Employer of Record (EOR)',
        feePorEmpleado: String(contractForm.feePorEmpleado || selectedCl.feePorEmpleado || 200),
        moneda: selectedCl.moneda || 'USD',
        condicionesComerciales: contractForm.condicionesComerciales || 'Suscripción base mensual por colaborador. Soporte local incluido.',
        representanteProveedor: contractForm.representanteProveedor || user.nombre || 'Daniel Decan',
        fechaGeneracion: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        fechaInicio: new Date().toISOString().split('T')[0],
        credito: selectedCl.credito || contractForm.condicionesComerciales || '30 días calendario',
        sttEntidad: selectedCl.sociedadContratacion || `QUICK HIRE ${targetCountry.toUpperCase()} S.A.S. (STT ${targetCountry.toUpperCase()})`,
        sttPais: targetCountry,
        sttIdentificacion: 'NIT 900.123.456-1',
        sttDomicilio: `Sede Principal Quick Hire / STT - ${targetCountry}`,
        sttRepresentante: contractForm.representanteProveedor || user.nombre || 'Daniel Decan (Director Legal)',
        cantidadEstimada: String(selectedCl.cupoTrabajadores || 1)
      };

      Object.entries(varsToReplace).forEach(([key, value]) => {
        finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      });

      // Apply dynamic fields
      if (contractForm.variablesValidadas) {
        Object.entries(contractForm.variablesValidadas).forEach(([key, value]) => {
          finalContent = finalContent.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        });
      }

      const payload = {
        clienteId: selectedCl.id,
        clienteNombre: selectedCl.empresa,
        solicitudId: selectedCl.solicitudVinculadaId,
        pais: selectedCl.pais || 'Colombia',
        servicioContratado: selectedCl.servicioContratado || 'Employer of Record (EOR)',
        moneda: selectedCl.moneda || 'USD',
        feePorEmpleado: Number(contractForm.feePorEmpleado) || Number(selectedCl.feePorEmpleado) || 200,
        condicionesComerciales: contractForm.condicionesComerciales || 'Suscripción base mensual por colaborador. Soporte local incluido.',
        beneficiosContratados: selectedCl.beneficiosConfigurados || [],
        representanteCliente: contractForm.representanteCliente || selectedCl.nombreContacto || 'Representante Legal',
        representanteProveedor: contractForm.representanteProveedor || user.nombre || 'Daniel Decan',
        cedulaJuridica: contractForm.cedulaJuridica || selectedCl.cedulaJuridica || (selectedCl as any)?.nit || 'COL-900344',
        direccion: contractForm.direccion || selectedCl.direccion || 'Sede Principal',
        fechaGeneracion: new Date().toISOString(),
        estado: 'Generado' as const,
        contenido: finalContent,
        plantillaId: selectedPl.id,
        versionPlantilla: selectedPl.version || 'v1.0',
        usuarioCreador: user.correo,
        asesorAsignado: user.correo
      };

      const newContract = await api.createContratoComercial(payload);
      
      // Update local state immediately
      setContratos(prev => [newContract, ...prev]);

      // Auto-register a follow up safely
      try {
        await api.createSeguimientoComercial({
          relacionadoTipo: 'cliente',
          relacionadoId: selectedCl.id,
          relacionadoNombre: selectedCl.empresa,
          tipoSeguimiento: 'Observación',
          comentario: `Se generó el contrato comercial ${selectedPl.nombre} (${selectedPl.id})`,
          fecha: new Date().toISOString(),
          usuario: user.correo,
          estadoComercialSugerido: 'Contrato generado'
        });
      } catch (segErr) {
        console.warn('Seguimiento log skipped:', segErr);
      }

      triggerToast('Contrato comercial generado exitosamente.');
      setShowGenerateContractModal(false);
      setIsGeneratingContract(false);
      setActiveTab('contratos');
      fetchData();
    } catch (err: any) {
      console.error('Error in handleGenerateContract:', err);
      setContractModalError(err.message || 'Error al generar el contrato comercial en el servidor.');
      setIsGeneratingContract(false);
    }
  };

  // Send contract commercial to client
  const handleSendContractToClient = async (contract: ContratoComercial) => {
    try {
      await api.updateContratoComercial(contract.id, {
        estado: 'Enviado al cliente',
        fechaEnvio: new Date().toISOString()
      });

      // Add commercial seguimiento log
      await api.createSeguimientoComercial({
        relacionadoTipo: 'contrato',
        relacionadoId: contract.id,
        relacionadoNombre: `${contract.clienteNombre} (${contract.id})`,
        tipoSeguimiento: 'Correo',
        comentario: 'El contrato comercial ha sido enviado por correo electrónico desde la plataforma al cliente para firma electrónica.',
        fecha: new Date().toISOString(),
        usuario: user.correo,
        estadoComercialSugerido: 'Contrato enviado'
      });

      triggerToast('Contrato enviado por correo al cliente exitosamente.');
      fetchData();
      if (selectedContrato && selectedContrato.id === contract.id) {
        setSelectedContrato({ ...selectedContrato, estado: 'Enviado al cliente', fechaEnvio: new Date().toISOString() });
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error enviando el contrato comercial.', true);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este contrato comercial?')) return;
    try {
      await api.deleteContratoComercial(id);
      triggerToast('Contrato eliminado exitosamente.');
      if (selectedContrato?.id === id) setSelectedContrato(null);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error eliminando el contrato.', true);
    }
  };

  const handleConfirmDeleteSolicitud = async () => {
    if (!solicitudToDelete) return;
    setIsDeletingItem(true);
    try {
      await api.deleteSolicitud(solicitudToDelete.id, { usuario: user.correo, motivo: `Lead de ${solicitudToDelete.empresa} (${solicitudToDelete.id}) eliminado por asesor ${user.correo}` });
      triggerToast(`Lead de ${solicitudToDelete.empresa} eliminado exitosamente.`);
      if (selectedSolicitud?.id === solicitudToDelete.id) setSelectedSolicitud(null);
      setSolicitudToDelete(null);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error eliminando el Lead.', true);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleConfirmDeleteCliente = async () => {
    if (!clienteToDelete) return;
    setIsDeletingItem(true);
    try {
      await api.deleteCliente(clienteToDelete.id, { usuario: user.correo, motivo: `Cliente ${clienteToDelete.empresa} (${clienteToDelete.id}) eliminado por asesor ${user.correo}` });
      triggerToast(`Cliente ${clienteToDelete.empresa} eliminado exitosamente.`);
      if (selectedCliente?.id === clienteToDelete.id) setSelectedCliente(null);
      setClienteToDelete(null);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error eliminando el cliente.', true);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleOpenEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    setEditClientEmpresa(c.empresa || '');
    setEditClientPais(c.pais || 'México');
    setEditClientFee(c.feePorEmpleado || 150);
    setEditClientCupo(c.cupoTrabajadores || 10);
    setEditClientMoneda(c.moneda || 'USD');
    setEditClientCorreo(c.correoContacto || '');
    setEditClientTelefono(c.telefonoContacto || '');
    setEditClientContacto(c.nombreContacto || '');
    setEditClientEstado(c.estado || 'Activo');
    const normalizedSupra = (c.supraclienteId === 'guadalupe.gonzalez@grupostt.com' || (c.proyecto && c.proyecto.toLowerCase().includes('pagus') && !c.supraclienteId))
      ? 'CLI-876'
      : (c.supraclienteId || '');
    setEditClientSupraclienteId(normalizedSupra);
    setEditClientTipoSocio(c.tipoCliente || 'Directo');
    setEditClientRazonSocial(c.razonSocial || c.empresa || '');
    setEditClientRepresentanteLegal(c.representanteLegal || c.nombreContacto || '');
    setEditClientCedulaJuridica(c.cedulaJuridica || '');
    setEditClientError('');
  };

  const handleSaveEditCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCliente) return;
    setIsSavingClient(true);
    setEditClientError('');
    try {
      await api.updateCliente(editingCliente.id, {
        empresa: editClientEmpresa.trim(),
        pais: editClientPais,
        feePorEmpleado: Number(editClientFee),
        cupoTrabajadores: Number(editClientCupo),
        moneda: editClientMoneda,
        correoContacto: editClientCorreo.trim(),
        telefonoContacto: editClientTelefono.trim(),
        nombreContacto: editClientContacto.trim(),
        estado: editClientEstado,
        supraclienteId: editClientSupraclienteId || undefined,
        tipoCliente: editClientTipoSocio,
        razonSocial: editClientRazonSocial.trim() || editClientEmpresa.trim(),
        representanteLegal: editClientRepresentanteLegal.trim() || editClientContacto.trim(),
        cedulaJuridica: editClientCedulaJuridica.trim(),
        usuario: user.correo,
        motivo: `Actualización de cliente por asesor comercial ${user.correo}`
      });
      triggerToast(`Cliente "${editClientEmpresa.trim()}" actualizado exitosamente.`);
      setEditingCliente(null);
      fetchData();
    } catch (err: any) {
      setEditClientError(err.message || 'Error guardando los cambios del cliente.');
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDeleteAllContracts = async () => {
    if (!window.confirm('¿Está seguro de eliminar TODOS los contratos comerciales?')) return;
    try {
      await api.deleteAllContratosComerciales();
      triggerToast('Todos los contratos comerciales han sido eliminados.');
      setSelectedContrato(null);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error eliminando los contratos.', true);
    }
  };

  // Ticket response handler
  const handleRespondTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketResponse.trim()) return;

    setIsSubmittingTicketResponse(true);
    try {
      const updatedT = await api.responderTicket(selectedTicket.id, {
        usuario: user.nombre || user.correo,
        autorEmail: user.correo,
        rol: 'asesor_comercial',
        mensaje: ticketResponse.trim(),
        esInterno: ticketResponseIsInternal
      });

      triggerToast(ticketResponseIsInternal ? 'Nota interna guardada con éxito.' : 'Respuesta enviada al cliente.');
      setTicketResponse('');
      setSelectedTicket(updatedT);
      fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error enviando la respuesta del ticket.', true);
    } finally {
      setIsSubmittingTicketResponse(false);
    }
  };

  // Country matching helper for multi-country LATAM scope
  const checkCountryMatch = (itemPais?: string, isRegional?: boolean, opCountries?: string[]) => {
    if (countryFilter === 'All') return true;
    if (countryFilter === 'Regional') {
      return isRegional || itemPais === 'Regional';
    }
    if (itemPais === countryFilter) return true;
    if ((isRegional || itemPais === 'Regional') && opCountries && opCountries.includes(countryFilter)) return true;
    return false;
  };

  const handleAssignToMe = async (sId: string) => {
    try {
      await api.updateSolicitud(sId, {
        asesorAsignado: user.correo,
        estadoComercial: 'En revisión comercial',
        notasInternas: `Lead tomado por asesor ${user.nombre || user.correo}`
      });
      triggerToast('Solicitud asignada a tu gestión comercial exitosamente.');
      await fetchData();
    } catch (err: any) {
      triggerToast(err.message || 'Error al autoasignar la solicitud', true);
    }
  };

  // Filter application helper
  const targetSolicitudes = scopeFilter === 'assigned'
    ? allSolicitudes.filter(s => s.asesorAsignado === user.correo)
    : allSolicitudes;

  const targetClientes = scopeFilter === 'assigned'
    ? allClientes.filter(c => c.asesorAsignado === user.correo)
    : allClientes;

  const targetContratos = scopeFilter === 'assigned'
    ? allContratos.filter(ct => ct.asesorAsignado === user.correo)
    : allContratos;

  const filteredSolicitudesList = targetSolicitudes.filter(s => {
    const matchesSearch = s.empresa.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nombreContacto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = checkCountryMatch(s.pais, s.esRegional, s.paisesOperacion);
    const matchesState = statusFilter === 'All' || s.estado === statusFilter;
    const matchesComm = commStatusFilter === 'All' || s.estadoComercial === commStatusFilter;
    return matchesSearch && matchesCountry && matchesState && matchesComm;
  });

  const filteredClientesList = targetClientes.filter(c => {
    const matchesSearch = c.empresa.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.nombreContacto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = checkCountryMatch(c.pais, c.esRegional, c.paisesOperacion);
    const matchesState = statusFilter === 'All' || c.estado === statusFilter;
    return matchesSearch && matchesCountry && matchesState;
  });

  const filteredContratosList = targetContratos.filter(ct => {
    const matchesSearch = ct.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ct.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = checkCountryMatch(ct.pais, false, undefined);
    const matchesState = statusFilter === 'All' || ct.estado === statusFilter;
    return matchesSearch && matchesCountry && matchesState;
  });

  // KPI Calculations strictly in scope
  const totalAssignedSols = targetSolicitudes.length;
  const pendingFollowUpSols = targetSolicitudes.filter(s => !s.fechaUltimaGestion).length;
  const inReviewSols = targetSolicitudes.filter(s => s.estadoComercial === 'En revisión comercial' || s.estado === 'En revisión').length;
  const readyForContractSols = targetSolicitudes.filter(s => s.estadoComercial === 'Lista para contrato' || s.estado === 'Aprobada').length;
  
  const totalContractsGenerated = contratos.filter(c => c.estado === 'Generado').length;
  const totalContractsSent = contratos.filter(c => c.estado === 'Enviado al cliente').length;
  const totalContractsPendingSign = contratos.filter(c => c.estado === 'Pendiente de firma del cliente').length;
  const totalContractsSigned = contratos.filter(c => c.estado === 'Firmado por cliente').length;

  return (
    <div id="asesor-dashboard-root" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-xs text-slate-800">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col border-r border-slate-800 font-sans">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
              <Briefcase className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Quick Hire</h1>
              <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Portal Comercial</p>
            </div>
          </div>
        </div>

        {/* Sidebar Body Menu list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
          {/* 1. Panel Comercial */}
          {isMenuVisible('kpis') && (
            <button
              onClick={() => { setActiveTab('panel'); setSearchQuery(''); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'panel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Panel Comercial</span>
              </div>
            </button>
          )}

          {/* 2. Gestión Comercial */}
          {(isMenuVisible('solicitudes') || isMenuVisible('clientes')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('gestion')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Gestión Comercial</span>
                </div>
                {expandedGroups.gestion ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.gestion && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-indigo-500/30 ml-2">
                  {isMenuVisible('solicitudes') && (
                    <button
                      onClick={() => { setActiveTab('solicitudes'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'solicitudes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span>Solicitudes Asignadas</span>
                      </div>
                      {solicitudes.filter(s => s.estadoComercial === 'Nueva asignación' || !s.estadoComercial).length > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          {solicitudes.filter(s => s.estadoComercial === 'Nueva asignación' || !s.estadoComercial).length}
                        </span>
                      )}
                    </button>
                  )}

                  {isMenuVisible('clientes') && (
                    <button
                      onClick={() => { setActiveTab('clientes'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'clientes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Clientes Asignados</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('solicitudes') && (
                    <button
                      onClick={() => { setActiveTab('seguimiento'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'seguimiento' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <History className="w-3.5 h-3.5 shrink-0" />
                        <span>Seguimiento Comercial</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Contratos */}
          {(isMenuVisible('contracts') || isMenuVisible('plantillas')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('contratos')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FileSignature className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contratos</span>
                </div>
                {expandedGroups.contratos ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.contratos && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-blue-500/30 ml-2">
                  {isMenuVisible('contracts') && (
                    <button
                      onClick={() => { setActiveTab('contratos'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'contratos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <FileSignature className="w-3.5 h-3.5 shrink-0" />
                        <span>Contratos Comerciales</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('plantillas') && (
                    <button
                      onClick={() => { setActiveTab('plantillas'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'plantillas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span>Plantillas de Contratos</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Finanzas */}
          {(isMenuVisible('billing') || isMenuVisible('fees') || isMenuVisible('iva_wht_renta')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('finanzas')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Finanzas</span>
                </div>
                {expandedGroups.finanzas ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.finanzas && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-emerald-500/30 ml-2">
                  {isMenuVisible('billing') && (
                    <button
                      onClick={() => { setActiveTab('billing'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span>Facturación y Pagos</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('fees') && (
                    <button
                      onClick={() => { setActiveTab('fees'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'fees' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>Fees por País</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('iva_wht_renta') && (
                    <button
                      onClick={() => { setActiveTab('iva_wht_renta'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'iva_wht_renta' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Percent className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>IVA - WHT y Renta</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Soporte */}
          {isMenuVisible('tickets') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('soporte')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Soporte</span>
                </div>
                {expandedGroups.soporte ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.soporte && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-amber-500/30 ml-2">
                  <button
                    onClick={() => { setActiveTab('tickets'); setSearchQuery(''); }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                      activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Tickets Comerciales</span>
                    </div>
                    {tickets.filter(t => t.estado === 'Nuevo' || t.estado === 'Abierto').length > 0 && (
                      <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        {tickets.filter(t => t.estado === 'Nuevo' || t.estado === 'Abierto').length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. Reportes */}
          {isMenuVisible('reports') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('reportes')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reportes</span>
                </div>
                {expandedGroups.reportes ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.reportes && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-purple-500/30 ml-2">
                  <button
                    onClick={() => { setActiveTab('reports'); setSearchQuery(''); }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                      activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                      <span>Reportes de Gestión</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. Administración */}
          {isMenuVisible('users') && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('admin')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>Administración</span>
                </div>
                {expandedGroups.admin ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.admin && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-rose-500/30 ml-2">
                  <button
                    onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                      activeTab === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Gestión de Usuarios y Asesores</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold bg-slate-950/20 text-center">
          Quick Hire EOR &bull; Asesor Comercial
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === 'panel' && tText('Panel de Control Comercial', lang)}
              {activeTab === 'solicitudes' && tText('Gestión de Solicitudes EOR (Leads)', lang)}
              {activeTab === 'clientes' && tText('Directorio de Clientes Asignados', lang)}
              {activeTab === 'contratos' && tText('Contratos Comerciales Cliente-Proveedor', lang)}
              {activeTab === 'plantillas' && tText('Directorio de Plantillas de Contratos', lang)}
              {activeTab === 'seguimiento' && tText('Historial de Seguimiento Comercial', lang)}
              {activeTab === 'tickets' && tText('Módulo de Tickets Comerciales y Contractuales', lang)}
              {activeTab === 'perfil' && tText('Perfil de Asesor Comercial', lang)}
              {activeTab === 'users' && tText('Gestión de Usuarios y Asesores', lang)}
              {activeTab === 'billing' && tText('Generación de Facturas y Estado de Pagos', lang)}
              {activeTab === 'reports' && tText('Reportes de Gestión Comercial', lang)}
              {activeTab === 'directorio' && tText('Directorio de Actores del Servicio', lang)}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold">
              {tText('Asesor Comercial asignado:', lang)} <strong className="text-slate-700">{user.nombre}</strong> ({user.correo})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition-all font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              title={tText('Simulador de Cotizaciones y Fee EOR', lang)}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{tText('Simulador Cotizaciones', lang)}</span>
            </button>
            <button
              onClick={() => setIsManualOpen(true)}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl transition-all border border-indigo-100 font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title={tText('Centro de Manuales de Usuario', lang)}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{tText('Manual de Usuario', lang)}</span>
            </button>
            <LanguageSelector currentLanguage={lang} onLanguageChange={onLanguageChange} />
            <button 
              onClick={fetchData}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-slate-600 cursor-pointer"
              title={tText('Sincronizar información', lang)}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            </button>
            <button
              onClick={onLogout}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl transition-all border border-rose-100 font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{i18n[lang].auth.logout}</span>
            </button>
          </div>
        </header>

        {/* MULTI-COUNTRY & SCOPE FILTER BAR */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              Alcance Territorial:
            </span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer transition-all shadow-xs"
            >
              <option value="All">🌎 Todos los Países (Red LATAM)</option>
              <option value="Regional">🌎 Regional (Multi-país LATAM)</option>
              <optgroup label="Países Individuales">
                {LATAM_COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {COUNTRY_FLAGS[c] ? `${COUNTRY_FLAGS[c]} ` : ''}{c}
                  </option>
                ))}
              </optgroup>
            </select>

            {countryFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setCountryFilter('All')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                Limpiar filtro país
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Vista Comercial:
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas las Solicitudes ({allSolicitudes.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scopeFilter === 'assigned'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mis Asignadas ({allSolicitudes.filter(s => s.asesorAsignado === user.correo).length})
              </button>
            </div>
          </div>
        </div>

        {/* USER MANUAL MODAL */}
        <UserManualModal 
          user={user} 
          lang={lang} 
          isOpen={isManualOpen} 
          onClose={() => setIsManualOpen(false)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />

        {/* SIMULADOR DE COTIZACIONES Y FEE EOR MODAL */}
        <QuoteSimulatorModal
          user={user}
          lang={lang}
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />

        {/* Global Toast Messages */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start space-x-2.5 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{actionSuccess}</p>
          </div>
        )}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{actionError}</p>
          </div>
        )}

        {/* CONTENT LOADING STATE */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium mt-3 text-xs">Cargando alcance comercial asignado...</p>
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-6">
            
            {/* 1. PANEL COMERCIAL */}
            {activeTab === 'panel' && (
              <div id="asesor-tab-panel" className="space-y-6">
                
                {/* Metrics block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Solicitudes Asignadas</span>
                      <strong className="text-2xl font-black text-indigo-900 mt-1 block">{totalAssignedSols}</strong>
                      <p className="text-[9px] text-indigo-500 font-bold mt-1">{pendingFollowUpSols} sin gestión reciente</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-indigo-100 shrink-0" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clientes Activos</span>
                      <strong className="text-2xl font-black text-emerald-900 mt-1 block">{clientes.length}</strong>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1">Con servicio contratado</p>
                    </div>
                    <Building2 className="w-8 h-8 text-emerald-100 shrink-0" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contratos Generados</span>
                      <strong className="text-2xl font-black text-slate-900 mt-1 block">{contratos.length}</strong>
                      <p className="text-[9px] text-slate-500 font-bold mt-1">{totalContractsSent} enviados a cliente</p>
                    </div>
                    <FileSignature className="w-8 h-8 text-slate-100 shrink-0" />
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tickets Soporte</span>
                      <strong className="text-2xl font-black text-amber-900 mt-1 block">{tickets.filter(t => t.estado !== 'Resuelto' && t.estado !== 'Cerrado').length}</strong>
                      <p className="text-[9px] text-amber-500 font-bold mt-1">Pendientes de respuesta</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-amber-100 shrink-0" />
                  </div>
                </div>

                {/* Sub KPI Block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Solicitudes States breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2.5">Estado de Leads EOR</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Nuevas Asignaciones</span>
                        <strong className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                          {solicitudes.filter(s => s.estadoComercial === 'Nueva asignación' || !s.estadoComercial).length}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>En Revisión Comercial</span>
                        <strong className="font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{inReviewSols}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Listas para Contrato</span>
                        <strong className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{readyForContractSols}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Descartadas</span>
                        <strong className="font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{solicitudes.filter(s => s.estadoComercial === 'Descartada').length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Contracts commercial state breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2.5">Embudo Comercial Contratos</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Contratos en Borrador/Generados</span>
                        <strong className="font-bold font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg">{totalContractsGenerated}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Enviados a Cliente</span>
                        <strong className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{totalContractsSent}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Pendientes de Firma</span>
                        <strong className="font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{totalContractsPendingSign}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Firmados por Cliente</span>
                        <strong className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{totalContractsSigned}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recent Gestiones / Alertas */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2.5">Próximas Acciones Comerciales</h3>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {seguimientos.filter(s => s.fechaProximaGestion).length === 0 ? (
                        <div className="text-center text-slate-400 py-6 font-semibold">No hay acciones futuras sugeridas.</div>
                      ) : (
                        seguimientos.filter(s => s.fechaProximaGestion).sort((a,b) => new Date(a.fechaProximaGestion!).getTime() - new Date(b.fechaProximaGestion!).getTime()).map(seg => (
                          <div key={seg.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-indigo-700 capitalize text-[10px]">{seg.tipoSeguimiento}</span>
                              <span className="text-[9px] text-slate-500 font-bold">{new Date(seg.fechaProximaGestion!).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-700 font-semibold">{seg.proximaAccion}</p>
                            <p className="text-[9px] text-slate-400 font-medium truncate">Relación: {seg.relacionadoNombre}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      setSeguimientoForm({ ...seguimientoForm, relacionadoId: solicitudes[0]?.id || '' });
                      setShowCreateSeguimientoModal(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Registrar Gestión Comercial</span>
                  </button>

                  <button
                    onClick={() => {
                      openGenerateContractModal();
                    }}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <FileSignature className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span>Generar Contrato Comercial</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. SOLICITUDES ASIGNADAS */}
            {activeTab === 'solicitudes' && (
              <div id="asesor-tab-solicitudes" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Solicitudes de EOR Asignadas</h3>
                    <p className="text-slate-500 mt-0.5">Vea y controle sus leads asignados. Mantenga registrado el contacto comercial.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por Empresa o Contacto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-slate-200 px-3.5 py-2 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                    />
                    <select
                      value={commStatusFilter}
                      onChange={(e) => setCommStatusFilter(e.target.value)}
                      className="border border-slate-200 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-600"
                    >
                      <option value="All">Todos los Estados Comerciales</option>
                      {commercialStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">ID / Empresa</th>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Servicio Requerido</th>
                        <th className="px-4 py-3">Estado General</th>
                        <th className="px-4 py-3">Estado Comercial</th>
                        <th className="px-4 py-3">Última Gestión</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSolicitudesList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No hay solicitudes asignadas con los criterios seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredSolicitudesList.map((sol) => (
                          <tr key={sol.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-4 py-4">
                              <div>
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md mb-1 inline-block">{sol.id}</span>
                                <div className="font-bold text-slate-900">{sol.empresa}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{sol.nombreContacto} ({sol.correo})</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <span>{COUNTRY_FLAGS[sol.pais] || '🌎'}</span>
                                <span>{sol.pais}</span>
                              </span>
                              {sol.esRegional && sol.paisesOperacion && sol.paisesOperacion.length > 0 && (
                                <span className="text-[9px] text-slate-400 block truncate max-w-[140px]" title={sol.paisesOperacion.join(', ')}>
                                  {sol.paisesOperacion.join(', ')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">{sol.servicioRequerido} <span className="font-mono text-slate-500">({sol.cantidadTrabajadores} emp)</span></td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sol.estado === 'Recibida' ? 'bg-indigo-50 text-indigo-700' :
                                sol.estado === 'En revisión' ? 'bg-amber-50 text-amber-700' :
                                sol.estado === 'Aprobada' || sol.estado === 'Cliente creado' ? 'bg-emerald-50 text-emerald-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {sol.estado}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-bold text-indigo-600 bg-indigo-50/40 px-2 py-0.5 rounded-lg border border-indigo-100 block">
                                {sol.estadoComercial || 'Nueva asignación'}
                              </span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                {sol.asesorAsignado ? (sol.asesorAsignado === user.correo ? 'Tú' : sol.asesorAsignado) : 'Sin Asignar'}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-500">
                              {sol.fechaUltimaGestion ? new Date(sol.fechaUltimaGestion).toLocaleDateString() : 'Ninguna'}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {sol.asesorAsignado !== user.correo && (
                                  <button
                                    onClick={() => handleAssignToMe(sol.id)}
                                    title="Tomar y autoasignarme esta solicitud"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1 cursor-pointer shadow-xs text-[11px]"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Tomar Lead</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedSolicitud(sol)}
                                  className="border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-indigo-600 font-bold px-3 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <span>Ver Detalle</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setSolicitudToDelete({ id: sol.id, empresa: sol.empresa })}
                                  title="Eliminar Lead permanentemente"
                                  className="p-1.5 border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. CLIENTES ASIGNADOS */}
            {activeTab === 'clientes' && (
              <div id="asesor-tab-clientes" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Clientes Asignados</h3>
                    <p className="text-slate-500 mt-0.5">Consulte la información general de sus cuentas asignadas.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por Empresa o Contacto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border border-slate-200 px-3.5 py-2 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">ID / Empresa</th>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Servicio Contratado</th>
                        <th className="px-4 py-3">Contacto Principal</th>
                        <th className="px-4 py-3">Estado Cliente</th>
                        <th className="px-4 py-3">Contrato Comercial</th>
                        <th className="px-4 py-3">Liberación EOR</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientesList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No hay clientes asignados con los criterios seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredClientesList.map((client) => {
                          const linkedContract = contratos.find(c => c.clienteId === client.id);
                          return (
                            <tr key={client.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-4 py-4">
                                <div>
                                  <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-md mb-1 inline-block">{client.id}</span>
                                  <div className="font-bold text-slate-900">{client.empresa}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold">{client.razonSocial || 'No especificada'}</div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-700">{client.pais}</td>
                              <td className="px-4 py-4">
                                <div>
                                  <span className="font-bold">{client.servicioContratado}</span>
                                  <p className="text-[10px] text-slate-400">Fee: {client.feePorEmpleado} {client.moneda}/emp</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium">
                                <div>{client.nombreContacto}</div>
                                <p className="text-[9px] text-slate-400">{client.correoContacto}</p>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  client.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {client.estado}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                {linkedContract ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    linkedContract.estado === 'Firmado por cliente' || linkedContract.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {linkedContract.estado}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">No generado</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  client.estadoServicio === 'Servicio liberado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  client.estadoServicio === 'Pago en revisión' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                                  ['Pago rechazado', 'Servicio bloqueado', 'Servicio suspendido'].includes(client.estadoServicio || '') ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {client.estadoServicio || 'Pendiente de contrato'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    onClick={() => handleOpenEditCliente(client)}
                                    className="border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/60 bg-white text-indigo-700 font-bold px-2.5 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1 text-xs cursor-pointer shadow-3xs"
                                    title="Editar datos y jerarquía del cliente"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedCliente(client)}
                                    className="border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-indigo-600 font-bold px-2.5 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1 text-xs cursor-pointer"
                                  >
                                    <span>Ver Ficha</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setClienteToDelete(client)}
                                    title="Eliminar Cliente permanentemente"
                                    className="p-1.5 border border-rose-200 hover:border-rose-400 bg-rose-50/70 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shadow-3xs"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

            {/* 4. CONTRATOS COMERCIALES */}
            {activeTab === 'contratos' && (
              <div id="asesor-tab-contratos" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Contratos Comerciales y Plantillas</h3>
                    <p className="text-slate-500 mt-0.5">Controle los contratos comerciales emitidos y gestione los modelos de contratos estándar.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => { setActiveTab('plantillas'); setTplSubTab('contratos'); }}
                      className="border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all"
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>Ver Directorio de Plantillas ({plantillas.length})</span>
                    </button>
                    {filteredContratosList.length > 0 && (
                      <button
                        onClick={handleDeleteAllContracts}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center space-x-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Borrar Todos</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        openGenerateContractModal();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Generar Contrato desde Plantilla</span>
                    </button>
                  </div>
                </div>

                {/* Subnav switcher inside Contratos */}
                <div className="flex border-b border-slate-100 pb-2 space-x-3 text-xs font-bold">
                  <button
                    onClick={() => {}}
                    className="text-indigo-600 border-b-2 border-indigo-600 pb-2 px-1 flex items-center space-x-1.5"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>Contratos Comerciales Generados ({filteredContratosList.length})</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('plantillas'); setTplSubTab('contratos'); }}
                    className="text-slate-500 hover:text-slate-800 pb-2 px-1 flex items-center space-x-1.5 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Plantillas Legales de Contrato ({plantillas.length})</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('plantillas'); setTplSubTab('notificaciones'); }}
                    className="text-slate-500 hover:text-slate-800 pb-2 px-1 flex items-center space-x-1.5 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Plantillas de Correos ({plantillasNotificacion.length})</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold text-xs">
                      <tr>
                        <th className="px-4 py-3">Número de Contrato</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Servicio</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Generado El</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredContratosList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No hay contratos comerciales asociados a sus clientes. Puede generar uno usando una plantilla de contrato.
                          </td>
                        </tr>
                      ) : (
                        filteredContratosList.map((contract) => (
                          <tr key={contract.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-4 py-4 font-mono font-bold text-indigo-700">{contract.id}</td>
                            <td className="px-4 py-4">
                              <div className="font-bold text-slate-900">{contract.clienteNombre}</div>
                              <p className="text-[10px] text-slate-400">Creador: {contract.usuarioCreador}</p>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">{contract.pais}</td>
                            <td className="px-4 py-4">{contract.servicioContratado} <span className="text-slate-400">({contract.moneda})</span></td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                contract.estado === 'Firmado por cliente' || contract.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700' :
                                contract.estado === 'Borrador' || contract.estado === 'Generado' ? 'bg-slate-100 text-slate-700' :
                                contract.estado === 'Enviado al cliente' || contract.estado === 'Pendiente de firma del cliente' ? 'bg-indigo-50 text-indigo-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {contract.estado}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-500">
                              {new Date(contract.fechaGeneracion).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-right flex justify-end gap-2">
                              {contract.estado === 'Generado' && (
                                <button
                                  onClick={() => handleSendContractToClient(contract)}
                                  className="border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Enviar al Cliente</span>
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedContrato(contract)}
                                className="border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition-all"
                              >
                                Ver Detalle
                              </button>
                              <button
                                onClick={() => handleDeleteContract(contract.id)}
                                className="border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold p-1.5 rounded-xl transition-all"
                                title="Eliminar contrato"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4.5. PLANTILLAS DE CONTRATOS Y NOTIFICACIONES */}
            {activeTab === 'plantillas' && (
              <div id="asesor-tab-plantillas" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <BookOpen className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-950">Directorio de Plantillas Legales y Notificaciones</h3>
                        <p className="text-slate-500 text-xs">Modelos contractuales estandarizados por país y plantillas de correo automatizadas.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCreateTemplateModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Nueva Plantilla</span>
                    </button>
                    <button
                      onClick={() => {
                        const commTpl = plantillas.find(p => p.tipo === 'comercial' && p.estado === 'Activo') || plantillas[0];
                        setContractForm({ ...contractForm, clienteId: clientes[0]?.id || '', plantillaId: commTpl?.id || '' });
                        setShowGenerateContractModal(true);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-xs"
                    >
                      <FileSignature className="w-4 h-4 text-indigo-600" />
                      <span>Generar Contrato</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics for Plantillas */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Modelos</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">{plantillas.length}</p>
                    <span className="text-[10px] text-indigo-600 font-semibold">Contratos activos</span>
                  </div>
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Comerciales EOR</p>
                    <p className="text-xl font-extrabold text-indigo-950 mt-1">
                      {plantillas.filter(p => p.tipo === 'comercial').length}
                    </p>
                    <span className="text-[10px] text-indigo-600 font-semibold">Cliente - Proveedor</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Laborales Locales</p>
                    <p className="text-xl font-extrabold text-emerald-950 mt-1">
                      {plantillas.filter(p => p.tipo === 'laboral').length}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">Por país operativo</span>
                  </div>
                  <div className="p-3.5 bg-amber-50/50 border border-amber-100/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Adendums / Anexos</p>
                    <p className="text-xl font-extrabold text-amber-950 mt-1">
                      {plantillas.filter(p => p.tipo === 'adendum').length}
                    </p>
                    <span className="text-[10px] text-amber-600 font-semibold">Modificaciones</span>
                  </div>
                  <div className="p-3.5 bg-purple-50/50 border border-purple-100/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Plantillas Email</p>
                    <p className="text-xl font-extrabold text-purple-950 mt-1">
                      {plantillasNotificacion.length}
                    </p>
                    <span className="text-[10px] text-purple-600 font-semibold">Mensajería transaccional</span>
                  </div>
                </div>

                {/* Sub Tab selector */}
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold max-w-md">
                  <button
                    onClick={() => setTplSubTab('contratos')}
                    className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                      tplSubTab === 'contratos' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Plantillas de Contrato ({plantillas.length})</span>
                  </button>
                  <button
                    onClick={() => setTplSubTab('notificaciones')}
                    className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                      tplSubTab === 'notificaciones' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Plantillas de Correos ({plantillasNotificacion.length})</span>
                  </button>
                </div>

                {tplSubTab === 'contratos' ? (
                  <div className="space-y-6">
                    {/* Filter and Search Bar */}
                    <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 text-xs">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre de plantilla, código ID, país o variables (ej: {{fee}}, {{cliente}})..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>

                      <div className="w-full md:w-56">
                        <select
                          value={tplTypeFilter}
                          onChange={(e) => setTplTypeFilter(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="All">Todos los Tipos de Contrato</option>
                          <option value="comercial">Comercial (Cliente - EOR)</option>
                          <option value="laboral">Laboral (Empleado Local)</option>
                          <option value="adendum">Adendums / Anexos</option>
                        </select>
                      </div>

                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 font-bold transition-all"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>

                    {/* Plantillas Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plantillas
                        .filter(tpl => {
                          const matchesType = tplTypeFilter === 'All' || tpl.tipo === tplTypeFilter;
                          const q = (searchQuery || '').toLowerCase();
                          const matchesSearch = !q ||
                            (tpl.nombre && tpl.nombre.toLowerCase().includes(q)) ||
                            (tpl.id && tpl.id.toLowerCase().includes(q)) ||
                            (tpl.pais && tpl.pais.toLowerCase().includes(q)) ||
                            (tpl.servicio && tpl.servicio.toLowerCase().includes(q)) ||
                            (tpl.variables && Array.isArray(tpl.variables) && tpl.variables.some(v => String(v).toLowerCase().includes(q)));
                          return matchesType && matchesSearch;
                        })
                        .map((tpl) => (
                          <div 
                            key={tpl.id}
                            className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                                    tpl.tipo === 'comercial' ? 'bg-indigo-100 text-indigo-800' :
                                    tpl.tipo === 'laboral' ? 'bg-emerald-100 text-emerald-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {tpl.tipo}
                                  </span>
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-bold">
                                    {tpl.pais}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-mono font-bold">
                                    v{tpl.version}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  tpl.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {tpl.estado}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{tpl.nombre}</h4>
                                <span className="text-[10px] text-slate-400 font-mono font-semibold block mt-0.5">{tpl.id}</span>
                              </div>

                              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Servicio:</span>
                                  <span className="font-semibold text-slate-800">{tpl.servicio}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Vigencia:</span>
                                  <span className="font-mono text-slate-700 text-[11px]">{tpl.vigencia || '2026-01-01 a 2026-12-31'}</span>
                                </div>
                              </div>

                              {/* Variables Chips */}
                              {tpl.variables && Array.isArray(tpl.variables) && tpl.variables.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Variables Dinámicas ({tpl.variables.length})</p>
                                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                    {tpl.variables.slice(0, 6).map((v) => (
                                      <span
                                        key={v}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard?.writeText(`{{${v}}}`);
                                          triggerToast(`Variable {{${v}}} copiada al portapapeles`);
                                        }}
                                        title={`Clic para copiar {{${v}}}`}
                                        className="bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                      >
                                        {`{{${v}}}`}
                                      </span>
                                    ))}
                                    {tpl.variables.length > 6 && (
                                      <span className="text-[9px] text-slate-400 font-mono font-bold self-center">
                                        +{tpl.variables.length - 6} más
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                onClick={() => setActiveTemplate(tpl)}
                                className="flex-1 py-2 px-3 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Ver Modelo</span>
                              </button>
                              <button
                                onClick={() => {
                                  openGenerateContractModal(null, tpl);
                                }}
                                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1 shadow-xs"
                                title="Generar Contrato con esta Plantilla"
                              >
                                <FileSignature className="w-3.5 h-3.5" />
                                <span>Usar</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Table View of Plantillas */}
                    <div className="space-y-2 pt-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vista Detallada en Tabla</h4>
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                            <tr>
                              <th className="px-4 py-3">Plantilla</th>
                              <th className="px-4 py-3">Tipo</th>
                              <th className="px-4 py-3">País</th>
                              <th className="px-4 py-3">Servicio</th>
                              <th className="px-4 py-3">Versión</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {plantillas
                              .filter(tpl => {
                                const matchesType = tplTypeFilter === 'All' || tpl.tipo === tplTypeFilter;
                                const q = (searchQuery || '').toLowerCase();
                                const matchesSearch = !q || 
                                  (tpl.nombre && tpl.nombre.toLowerCase().includes(q)) ||
                                  (tpl.id && tpl.id.toLowerCase().includes(q)) ||
                                  (tpl.variables && Array.isArray(tpl.variables) && tpl.variables.some(v => String(v).toLowerCase().includes(q)));
                                return matchesType && matchesSearch;
                              })
                              .length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                                    No se encontraron plantillas de contrato con los filtros aplicados.
                                  </td>
                                </tr>
                              ) : (
                                plantillas
                                  .filter(tpl => {
                                    const matchesType = tplTypeFilter === 'All' || tpl.tipo === tplTypeFilter;
                                    const q = (searchQuery || '').toLowerCase();
                                    const matchesSearch = !q || 
                                      (tpl.nombre && tpl.nombre.toLowerCase().includes(q)) ||
                                      (tpl.id && tpl.id.toLowerCase().includes(q)) ||
                                      (tpl.variables && Array.isArray(tpl.variables) && tpl.variables.some(v => String(v).toLowerCase().includes(q)));
                                    return matchesType && matchesSearch;
                                  })
                                  .map((tpl) => (
                                    <tr key={tpl.id} className="hover:bg-slate-50/50 transition-all">
                                      <td className="px-4 py-4">
                                        <div className="font-bold text-slate-900">{tpl.nombre}</div>
                                        <span className="text-[10px] text-slate-400 font-mono font-bold">{tpl.id}</span>
                                      </td>
                                      <td className="px-4 py-4 uppercase font-bold text-[10px] text-indigo-600">
                                        {tpl.tipo}
                                      </td>
                                      <td className="px-4 py-4 font-semibold text-slate-700">{tpl.pais}</td>
                                      <td className="px-4 py-4 font-medium text-slate-600">{tpl.servicio}</td>
                                      <td className="px-4 py-4 font-mono font-semibold text-slate-500">v{tpl.version}</td>
                                      <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tpl.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                          {tpl.estado}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-1.5">
                                          <button
                                            onClick={() => setActiveTemplate(tpl)}
                                            className="border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition-all"
                                          >
                                            Ver Modelo
                                          </button>
                                          <button
                                            onClick={() => {
                                              openGenerateContractModal(null, tpl);
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl transition-all"
                                          >
                                            Generar
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Plantillas de Notificaciones y Correos Transaccionales</h4>
                        <p className="text-[11px] text-slate-500">Mensajes disparados automáticamente ante eventos del flujo EOR, firma de contratos y altas de colaboradores.</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold">
                        {plantillasNotificacion.length} plantillas configuradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plantillasNotificacion.map((tpl) => (
                        <div key={tpl.id} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-3 shadow-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-bold text-[8px] uppercase tracking-wider">
                                {tpl.evento || 'Evento'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 mt-1">{tpl.nombre}</h4>
                              <span className="text-[9px] text-slate-400 font-mono">{tpl.codigo || tpl.id}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                            <div className="flex flex-wrap gap-1">
                              {tpl.variables.map((v) => (
                                <span key={v} className="bg-slate-200 text-slate-700 text-[8px] font-mono px-1.5 py-0.5 rounded-md">
                                  {v.startsWith('{') ? v : `{${v}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. SEGUIMIENTO COMERCIAL */}
            {activeTab === 'seguimiento' && (
              <div id="asesor-tab-seguimiento" className="space-y-6">
                
                {/* Seguimientos log panel */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">Bitácora de Gestión Comercial</h3>
                      <p className="text-slate-500 mt-0.5">Historial completo de contactos, llamadas, correos y observaciones con leads o clientes.</p>
                    </div>
                    <button
                      onClick={() => {
                        setSeguimientoForm({ ...seguimientoForm, relacionadoId: solicitudes[0]?.id || '' });
                        setShowCreateSeguimientoModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Registrar Nuevo Contacto / Gestión</span>
                    </button>
                  </div>

                  <div className="relative border-l-2 border-indigo-100 pl-6 ml-4 space-y-6">
                    {seguimientos.length === 0 ? (
                      <div className="text-center text-slate-400 py-12 font-semibold border border-slate-100 rounded-3xl bg-slate-50/50">
                        No hay ningún seguimiento registrado en su cuenta de asesor. ¡Haga clic en Registrar Gestión para comenzar!
                      </div>
                    ) : (
                      seguimientos.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((seg) => (
                        <div key={seg.id} className="relative">
                          {/* Dot marker */}
                          <div className="absolute -left-[31px] top-1.5 bg-indigo-600 w-2.5 h-2.5 rounded-full ring-4 ring-white" />
                          
                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl max-w-2xl space-y-2">
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px] uppercase">
                                  {seg.tipoSeguimiento}
                                </span>
                                <span className="text-slate-400 font-bold">|</span>
                                <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">
                                  {seg.relacionadoTipo}: <strong className="text-slate-800">{seg.relacionadoNombre}</strong>
                                </span>
                              </div>
                              <span className="text-slate-400 text-[10px] font-mono">{new Date(seg.fecha).toLocaleString()}</span>
                            </div>
                            
                            <p className="text-slate-700 font-medium whitespace-pre-line leading-relaxed text-xs">
                              {seg.comentario}
                            </p>

                            {/* Additional Actions info */}
                            {(seg.proximaAccion || seg.fechaProximaGestion || seg.estadoComercialSugerido) && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-[10px] text-slate-600 font-semibold bg-white/40 p-2 rounded-xl">
                                {seg.proximaAccion && (
                                  <div>
                                    <span className="block text-[8px] uppercase text-slate-400 font-bold">Próxima Acción Sugerida</span>
                                    <span className="text-slate-900 font-bold">{seg.proximaAccion}</span>
                                  </div>
                                )}
                                {seg.fechaProximaGestion && (
                                  <div>
                                    <span className="block text-[8px] uppercase text-slate-400 font-bold">Fecha de Próxima Gestión</span>
                                    <span className="text-slate-900 font-mono">{new Date(seg.fechaProximaGestion).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {seg.estadoComercialSugerido && (
                                  <div className="col-span-2">
                                    <span className="block text-[8px] uppercase text-slate-400 font-bold">Cambio Estado Sugerido</span>
                                    <span className="text-indigo-600 font-bold">{seg.estadoComercialSugerido}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="text-right text-[9px] text-slate-400 font-medium">
                              Registrado por: {seg.usuario}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. TICKETS COMERCIALES */}
            {activeTab === 'tickets' && (
              <div id="asesor-tab-tickets" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Módulo de Tickets Comerciales y Contractuales</h3>
                    <p className="text-slate-500 mt-0.5 text-xs">Responda consultas, gestione SLAs y atienda requerimientos de clientes.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                      Total: {tickets.length} tickets
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-slate-600 text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">ID & Categoría</th>
                        <th className="px-4 py-3">Cliente / Solicitante</th>
                        <th className="px-4 py-3">Asunto</th>
                        <th className="px-4 py-3">Prioridad</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">SLA / Límite</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No hay tickets de soporte registrados en el sistema.
                          </td>
                        </tr>
                      ) : (
                        tickets.map((t) => {
                          const clientCompany = t.clienteNombre || clientes.find(c => c.id === t.clienteId)?.empresa || t.clienteId;
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-4 py-3.5">
                                <span className="font-mono font-bold text-indigo-700 block">{t.id}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">{t.categoria || 'Soporte General'}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <strong className="text-slate-900 block font-bold">{clientCompany}</strong>
                                {t.solicitanteNombre && (
                                  <span className="text-[10px] text-slate-400 block">{t.solicitanteNombre}</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-slate-800 line-clamp-1">{t.asunto}</span>
                                <span className="text-[9.5px] text-slate-400 font-mono">{new Date(t.fechaCreacion).toLocaleDateString()}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  t.prioridad === 'Crítica' ? 'bg-rose-100 text-rose-700' :
                                  t.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700' :
                                  t.prioridad === 'Baja' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {t.prioridad || 'Media'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                  t.estado === 'Nuevo' || t.estado === 'Abierto' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  t.estado === 'En Proceso' || t.estado === 'En progreso' ? 'bg-blue-100 text-blue-800' :
                                  t.estado === 'Respondido' ? 'bg-indigo-100 text-indigo-800' :
                                  t.estado === 'Resuelto' || t.estado === 'Cerrado' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.estado}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold block w-fit ${
                                  t.slaEstado === 'Vencido' ? 'bg-rose-100 text-rose-700 font-black' :
                                  t.slaEstado === 'Próximo a vencer' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                  t.slaEstado === 'Cumplido' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {t.slaEstado || 'Dentro de tiempo'}
                                </span>
                                {t.slaFechaLimiteResolucion && t.estado !== 'Resuelto' && t.estado !== 'Cerrado' && (
                                  <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5">
                                    Límite: {new Date(t.slaFechaLimiteResolucion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedTicket(t);
                                    setTicketResponse('');
                                    setTicketResponseIsInternal(false);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                                >
                                  Atender / Conversación
                                </button>
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

            {/* 7. MI PERFIL */}
            {activeTab === 'perfil' && (
              <div id="asesor-tab-perfil" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-6 max-w-xl">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Mi Perfil de Funcionario</h3>
                  <p className="text-slate-500 mt-0.5">Consulte su nivel de accesos, permisos y alcance geográfico asignado en la plataforma.</p>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Nombre Completo</span>
                    <span className="col-span-2 text-slate-900 font-black text-xs">{user.nombre}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Correo Electrónico</span>
                    <span className="col-span-2 text-slate-900 font-mono font-bold text-xs">{user.correo}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Rol de Sistema</span>
                    <span className="col-span-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase">
                        {user.rol === 'asesor_comercial' ? 'Asesor Comercial NY' : user.rol}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Estado Cuenta</span>
                    <span className="col-span-2 text-slate-900 font-bold">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px]">
                        {user.estado || 'Activo'}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Países Asignados</span>
                    <span className="col-span-2 text-slate-700 font-semibold">
                      {user.paisesAsignados && user.paisesAsignados.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.paisesAsignados.map(p => (
                            <span key={p} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-bold">{p}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Global (Todo LatAm / US)</span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Unidades Operativas</span>
                    <span className="col-span-2 text-slate-700 font-semibold">
                      {user.unidadesOperativasAsignadas && user.unidadesOperativasAsignadas.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.unidadesOperativasAsignadas.map(u => (
                            <span key={u} className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg font-bold">{u}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unidad Central grupostt.com</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. GESTIÓN DE USUARIOS Y ASESORES */}
            {activeTab === 'users' && (
              <div id="asesor-tab-users" className="space-y-6">
                {/* Header banner */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-sm border border-indigo-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold tracking-tight">Gestión Central de Usuarios y Asesores</h3>
                    </div>
                    <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                      Administra cuentas con acceso al sistema, crea nuevos <strong>Asesores Comerciales</strong>, Administradores EOR y gestores de Clientes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSysUserError('');
                      setSysUserSuccess('');
                      setSysUserName('');
                      setSysUserEmail('');
                      setSysUserRole('cliente');
                      setSysUserModalOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Crear Nuevo Usuario / Asesor</span>
                  </button>
                </div>

                {/* Filters bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filtrar por Rol:</span>
                    <button
                      onClick={() => setSysRoleFilter('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${sysRoleFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Todos ({allUsers.length})
                    </button>
                    <button
                      onClick={() => setSysRoleFilter('asesor_comercial')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${sysRoleFilter === 'asesor_comercial' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      Asesores Comerciales ({allUsers.filter(u => u.rol === 'asesor_comercial').length})
                    </button>
                    <button
                      onClick={() => setSysRoleFilter('administrador')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${sysRoleFilter === 'administrador' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                    >
                      Administradores ({allUsers.filter(u => u.rol === 'administrador').length})
                    </button>
                    <button
                      onClick={() => setSysRoleFilter('cliente')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${sysRoleFilter === 'cliente' ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
                    >
                      Clientes ({allUsers.filter(u => u.rol === 'cliente').length})
                    </button>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar usuario o correo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Users table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                          <th className="px-4 py-3">Usuario / Nombre</th>
                          <th className="px-4 py-3">Correo Electrónico</th>
                          <th className="px-4 py-3">Rol de Acceso</th>
                          <th className="px-4 py-3">Empresa Vinculada</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {allUsers
                          .filter(u => {
                            const matchesRole = sysRoleFilter === 'all' || u.rol === sysRoleFilter;
                            const matchesSearch = !searchQuery || 
                              (u.nombre && u.nombre.toLowerCase().includes(searchQuery.toLowerCase())) || 
                              (u.correo && u.correo.toLowerCase().includes(searchQuery.toLowerCase()));
                            return matchesRole && matchesSearch;
                          })
                          .map(u => {
                            const clientObj = clientes.find(c => c.id === u.clienteId);
                            return (
                              <tr key={u.correo} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center space-x-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                                      u.rol === 'asesor_comercial' ? 'bg-emerald-100 text-emerald-800' :
                                      u.rol === 'administrador' ? 'bg-indigo-100 text-indigo-800' :
                                      u.rol === 'supracliente' ? 'bg-slate-900 text-white' :
                                      'bg-sky-100 text-sky-800'
                                    }`}>
                                      {u.nombre ? u.nombre.charAt(0) : u.correo.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block">{u.nombre || 'Sin Nombre'}</span>
                                      <span className="text-[10px] text-slate-400">ID: {u.correo}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 font-mono text-slate-600">{u.correo}</td>
                                <td className="px-4 py-3.5">
                                  {u.rol === 'asesor_comercial' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Asesor Comercial
                                    </span>
                                  )}
                                  {u.rol === 'administrador' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Administrador EOR
                                    </span>
                                  )}
                                  {u.rol === 'supracliente' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                                      Super Admin
                                    </span>
                                  )}
                                  {u.rol === 'cliente' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                      Cliente (Empresa)
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-slate-500">
                                  {clientObj ? (
                                    <span className="font-bold text-slate-800">{clientObj.empresa} ({clientObj.pais})</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Acceso Global</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    u.estado === 'Suspendido' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {u.estado || 'Activo'}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setUserToEdit(u);
                                      setIsEditUserModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer inline-flex items-center space-x-1"
                                    title="Editar información de usuario"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const nextState = u.estado === 'Suspendido' ? 'Activo' : 'Suspendido';
                                        await api.updateUsuario(u.correo, {
                                          estado: nextState,
                                          usuario: user.correo,
                                          motivo: `Estado actualizado a ${nextState}`
                                        });
                                        const updatedUsers = await api.getUsuarios().catch(() => []);
                                        setAllUsers(updatedUsers);
                                      } catch (err: any) {
                                        alert(err.message || 'Error al actualizar usuario');
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                  >
                                    {u.estado === 'Suspendido' ? 'Activar' : 'Suspender'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer inline-flex items-center space-x-1"
                                    title="Eliminar usuario permanentemente"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {allUsers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400">No se encontraron usuarios registrados.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 9. REPORTES DE GESTION */}
            {activeTab === 'reports' && (
              <div className="p-1">
                <ManagementReportsPanel user={user} lang={lang} />
              </div>
            )}

            {/* 10. FACTURACION Y PAGOS (ASESOR) */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-fade-in">
                {/* Notice banner */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-6 h-6 text-indigo-400" />
                      <h3 className="text-lg font-black tracking-tight">Emisión y Gestión de Facturas EOR</h3>
                    </div>
                    <p className="text-xs text-slate-300">
                      Como Asesor Comercial puedes emitir facturas mensuales para tus clientes asignados, consultar el estado de cobranza y verificar saldos pendientes.
                    </p>
                  </div>
                </div>

                {genSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{genSuccess}</span>
                    </div>
                    <button onClick={() => setGenSuccess('')} className="text-emerald-500 hover:text-emerald-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {genError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>{genError}</span>
                    </div>
                    <button onClick={() => setGenError('')} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Form to generate new invoice */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Crear Nueva Factura de Servicio EOR</span>
                  </h4>

                  <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Cliente Solicitante *</label>
                        <select
                          value={genClienteId}
                          onChange={(e) => setGenClienteId(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
                          required
                        >
                          <option value="">-- Seleccionar Cliente --</option>
                          {clientes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.empresa} ({c.pais}) - Fee Base: ${c.feePorEmpleado}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Periodo de Facturación *</label>
                        <input
                          type="month"
                          value={genPeriodo}
                          onChange={(e) => setGenPeriodo(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Fee EOR Unitario USD (Opcional)</label>
                        <input
                          type="number"
                          placeholder="Monto por empleado..."
                          value={genFeePorEmpleado}
                          onChange={(e) => setGenFeePorEmpleado(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      <div>
                        <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">IVA / Impuestos (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={genImpuesto}
                          onChange={(e) => setGenImpuesto(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Comisión Bancaria (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={genComisionPct}
                          onChange={(e) => setGenComisionPct(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Retención WHT (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={genWhtPct}
                          onChange={(e) => setGenWhtPct(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Otros Impuestos (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={genOtrosImpuestosPct}
                          onChange={(e) => setGenOtrosImpuestosPct(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Generar Factura Personalizada</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of generated invoices */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Historial de Facturas Emitidas ({facturas.length})
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Nº Factura</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Periodo</th>
                          <th className="px-4 py-3 text-right">Monto Total</th>
                          <th className="px-4 py-3 text-right">Saldo Pendiente</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                          <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {facturas.map((fac) => {
                          const cli = clientes.find((c) => c.id === fac.clienteId);
                          return (
                            <tr key={fac.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-slate-900">{fac.id}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{cli?.empresa || fac.clienteId}</td>
                              <td className="px-4 py-3 font-medium">{fac.periodo}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                ${(fac.montoTotalUSD || fac.totalUSD || 0).toLocaleString()} USD
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                                ${(fac.saldoPendienteUSD ?? (fac.estado === 'Pagada' ? 0 : fac.montoTotalUSD || fac.totalUSD || 0)).toLocaleString()} USD
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                  fac.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800' :
                                  fac.estado === 'Emitida' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {fac.estado}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center space-x-1.5">
                                {fac.estado !== 'Pagada' && (
                                  <button
                                    onClick={() => handleUpdateInvoiceStatus(fac.id, 'Pagada')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs"
                                  >
                                    Marcar Pagada
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {facturas.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                              No hay facturas generadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: FEES POR PAÍS */}
            {activeTab === 'fees' && (
              <div id="asesor-tab-fees" className="space-y-6">
                <FeesManagementPanel user={user} lang={lang} />
              </div>
            )}

            {/* TAB: DIRECTORIO DE ACTORES DE SERVICIO */}
            {activeTab === 'directorio' && (
              <div id="asesor-tab-directorio" className="space-y-6">
                <DirectorioView user={user} lang={lang} />
              </div>
            )}

            {/* TAB: IVA - WHT Y RENTA (SOLO CONSULTA / READ-ONLY) */}
            {activeTab === 'iva_wht_renta' && (
              <div id="asesor-tab-iva-wht-renta" className="space-y-6">
                <IvaWhtRentaMaster user={user} lang={lang} readOnly={true} />
              </div>
            )}

          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS SECTION */}
      {/* ======================================================== */}

      {/* A. SOLICITUD DETAILS MODAL */}
      {selectedSolicitud && (
        <div id="asesor-solicitud-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Detalle de Solicitud de EOR</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Revise los parámetros y cargue gestiones sobre esta solicitud.</p>
              </div>
              <button onClick={() => setSelectedSolicitud(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-slate-600">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Empresa / Prospecto</span>
                  <strong className="text-slate-900 font-bold">{selectedSolicitud.empresa}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">País</span>
                  <span className="font-semibold text-slate-900">{selectedSolicitud.pais}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Contacto Directo</span>
                  <span className="font-bold text-slate-900">{selectedSolicitud.nombreContacto}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Correo Electrónico</span>
                  <span className="font-mono">{selectedSolicitud.correo}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cantidad Colaboradores</span>
                  <span className="font-mono font-bold text-slate-950">{selectedSolicitud.cantidadTrabajadores}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Servicio Solicitado</span>
                  <span className="font-bold text-indigo-600">{selectedSolicitud.servicioRequerido}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Estado Comercial</span>
                  <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 inline-block mt-0.5">
                    {selectedSolicitud.estadoComercial || 'Nueva asignación'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Fecha Recepción</span>
                  <span>{new Date(selectedSolicitud.fechaRecepcion).toLocaleString()}</span>
                </div>
              </div>

              {selectedSolicitud.observaciones && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong className="font-bold text-slate-800">Descripción de Requisitos:</strong>
                  <p className="text-slate-600 leading-relaxed">{selectedSolicitud.observaciones}</p>
                </div>
              )}

              {/* Related Follow-ups */}
              <div className="space-y-2">
                <strong className="font-bold text-indigo-900 block">Gestiones Relacionadas:</strong>
                {seguimientos.filter(s => s.relacionadoId === selectedSolicitud.id).length === 0 ? (
                  <p className="text-slate-400 italic">No hay gestiones comerciales registradas para esta solicitud.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {seguimientos.filter(s => s.relacionadoId === selectedSolicitud.id).map(seg => (
                      <div key={seg.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-[11px]">
                        <div className="flex justify-between items-center font-bold text-slate-500 text-[10px]">
                          <span className="text-indigo-600 font-black uppercase">{seg.tipoSeguimiento}</span>
                          <span>{new Date(seg.fecha).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700">{seg.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSolicitudToDelete({ id: selectedSolicitud.id, empresa: selectedSolicitud.empresa })}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all flex items-center space-x-1.5 border border-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Lead</span>
                </button>
                <button
                  onClick={() => {
                    setSeguimientoForm({
                      ...seguimientoForm,
                      relacionadoTipo: 'solicitud',
                      relacionadoId: selectedSolicitud.id
                    });
                    setSelectedSolicitud(null);
                    setShowCreateSeguimientoModal(true);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Gestión sobre esta Solicitud</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. CLIENT DETAILS MODAL */}
      {selectedCliente && (
        <div id="asesor-client-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Ficha Informativa del Cliente</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Consulte los parámetros operacionales y comerciales de este cliente.</p>
              </div>
              <button onClick={() => setSelectedCliente(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-slate-600">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Razón Social</span>
                  <strong className="text-slate-900 font-bold">{selectedCliente.empresa}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cédula Jurídica</span>
                  <span className="font-semibold text-slate-900">{selectedCliente.cedulaJuridica || 'No especificada'}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">País de Operación</span>
                  <span className="font-bold text-slate-900">{selectedCliente.pais}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Servicio Contratado</span>
                  <span className="font-bold text-indigo-600">{selectedCliente.servicioContratado}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Contacto Principal</span>
                  <span className="font-bold text-slate-900">{selectedCliente.nombreContacto}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email Contacto</span>
                  <span className="font-mono">{selectedCliente.correoContacto}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Fee por Colaborador</span>
                  <span className="font-mono font-bold text-slate-950">{selectedCliente.feePorEmpleado} {selectedCliente.moneda}/mensual</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cupo de Nómina</span>
                  <span className="font-mono">{selectedCliente.trabajadoresCargados} / {selectedCliente.cupoTrabajadores} empleados</span>
                </div>
              </div>

              {selectedCliente.beneficiosConfigurados && selectedCliente.beneficiosConfigurados.length > 0 && (
                <div>
                  <strong className="font-bold text-slate-800 block mb-1">Beneficios y Adicionales Configurados:</strong>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCliente.beneficiosConfigurados.map(b => (
                      <span key={b} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-bold">{b}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Contracts info */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <strong className="font-bold text-indigo-900 block">Contrato Comercial Cliente-Proveedor:</strong>
                {contratos.find(c => c.clienteId === selectedCliente.id) ? (
                  (() => {
                    const ct = contratos.find(c => c.clienteId === selectedCliente.id)!;
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">{ct.id}</p>
                          <p className="text-[10px] text-slate-500">Estado: <span className="font-bold text-indigo-600">{ct.estado}</span></p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedContrato(ct);
                            setSelectedCliente(null);
                          }}
                          className="text-xs text-indigo-600 hover:underline font-bold"
                        >
                          Ver Contrato
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex justify-between items-center">
                    <span className="text-amber-800 font-semibold">No se ha generado ningún contrato para este cliente.</span>
                    <button
                      onClick={() => {
                        openGenerateContractModal(selectedCliente);
                        setSelectedCliente(null);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold"
                    >
                      Generar Contrato
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cl = selectedCliente;
                      setSelectedCliente(null);
                      handleOpenEditCliente(cl);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all flex items-center space-x-1.5 border border-indigo-200 cursor-pointer text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Cliente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClienteToDelete(selectedCliente)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all flex items-center space-x-1.5 border border-rose-200 cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Cliente</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCliente(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN DE CLIENTE (ASESOR) */}
      {editingCliente && (
        <div id="asesor-edit-client-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-indigo-300" />
                  <span>Editar Ficha de Cliente: {editClientEmpresa}</span>
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">
                  ID: <span className="font-mono font-bold text-white">{editingCliente.id}</span> • Modifica parámetros comerciales, jerarquía corporativa y datos fiscales.
                </p>
              </div>
              <button 
                onClick={() => setEditingCliente(null)} 
                className="text-indigo-200 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditCliente} className="p-6 overflow-y-auto space-y-5 flex-1">
              {editClientError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editClientError}</span>
                </div>
              )}

              {/* SECCIÓN 1: IDENTIFICACIÓN Y JERARQUÍA */}
              <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200/80 pb-2">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Identificación Comercial y Jerarquía</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nombre Comercial <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientEmpresa}
                      onChange={(e) => setEditClientEmpresa(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Razón Social
                    </label>
                    <input
                      type="text"
                      value={editClientRazonSocial}
                      onChange={(e) => setEditClientRazonSocial(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cédula / Identificación Fiscal
                    </label>
                    <input
                      type="text"
                      value={editClientCedulaJuridica}
                      onChange={(e) => setEditClientCedulaJuridica(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      País de Operación
                    </label>
                    <select
                      value={editClientPais}
                      onChange={(e) => setEditClientPais(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                    >
                      {ALL_COUNTRIES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Tipo de Socio / Rol Corporativo
                    </label>
                    <select
                      value={editClientTipoSocio}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditClientTipoSocio(val);
                        if (val === 'Directo') {
                          setEditClientSupraclienteId('');
                        } else if (val === 'Filial') {
                          if (!editClientSupraclienteId) {
                            const pagus = allClientes.find(c => c.empresa.toLowerCase().includes('pagus'));
                            if (pagus) setEditClientSupraclienteId(pagus.id);
                          }
                        } else if (val === 'Holding') {
                          setEditClientSupraclienteId('supracliente-eor-peo@grupostt.com');
                        }
                      }}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                    >
                      <option value="Directo">Directo (Cliente Individual)</option>
                      <option value="Filial">Filial (Asociado a un Supra Cliente / Holding)</option>
                      <option value="Holding">Supra Cliente (Holding Matriz Principal)</option>
                      <option value="Partners">Partners (Canal / Agencia)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cliente Propietario (Jerarquía Corporativa)
                    </label>
                    <select
                      value={editClientSupraclienteId}
                      onChange={(e) => setEditClientSupraclienteId(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-indigo-200 rounded-xl text-indigo-950 text-xs font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-3xs"
                    >
                      <option value="">🏢 Cliente Directo Individual (Sin Propietario / Holding)</option>
                      <optgroup label="🏢 Empresas Propietarias / Holdings Registrados">
                        {allClientes
                          .filter(cl => {
                            if (cl.id === editingCliente.id) return false;
                            const emp = (cl.empresa || '').toLowerCase();
                            const cont = (cl.nombreContacto || '').toLowerCase();
                            if (emp.includes('jose andres') || emp.includes('henao') || cont.includes('henao')) return false;
                            return true;
                          })
                          .map(cl => (
                            <option key={cl.id} value={cl.id}>
                              {cl.empresa} ({cl.id} • {cl.pais})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="🌐 Cuentas Global Holding">
                        <option value="supracliente-eor-peo@grupostt.com">
                          Supra Cliente Global Holding
                        </option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-medium">
                  {editClientSupraclienteId 
                    ? `Este cliente operará bajo la supervisión y consolidación de: ${
                        allClientes.find(cl => cl.id === editClientSupraclienteId || cl.empresa.toLowerCase() === editClientSupraclienteId.toLowerCase())?.empresa ||
                        (editClientSupraclienteId === 'CLI-876' || editClientSupraclienteId.toLowerCase().includes('pagus') ? 'PAGUS LLC' : '') ||
                        (editClientSupraclienteId === 'supracliente-eor-peo@grupostt.com' ? 'Supra Cliente Global Holding' : editClientSupraclienteId)
                      }. Al ingresar el Supra Cliente con su usuario, podrá ver y gestionar a esta empresa en su cuenta.`
                    : 'Cliente directo e individual sin dependencia de ningún grupo holding.'}
                </p>
              </div>

              {/* SECCIÓN 2: TARIFAS, CONTACTO Y ESTADO */}
              <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200/80 pb-2">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Tarifas, Parámetros y Contacto</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Fee por Empleado / Mes
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editClientFee}
                      onChange={(e) => setEditClientFee(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Moneda
                    </label>
                    <select
                      value={editClientMoneda}
                      onChange={(e) => setEditClientMoneda(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="MXN">MXN</option>
                      <option value="COP">COP</option>
                      <option value="BRL">BRL</option>
                      <option value="CLP">CLP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Cupo de Nómina
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editClientCupo}
                      onChange={(e) => setEditClientCupo(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Contacto Comercial Principal
                    </label>
                    <input
                      type="text"
                      value={editClientContacto}
                      onChange={(e) => setEditClientContacto(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Representante Legal
                    </label>
                    <input
                      type="text"
                      value={editClientRepresentanteLegal}
                      onChange={(e) => setEditClientRepresentanteLegal(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editClientCorreo}
                      onChange={(e) => setEditClientCorreo(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={editClientTelefono}
                      onChange={(e) => setEditClientTelefono(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={editClientEstado}
                    onChange={(e) => setEditClientEstado(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En mora">En mora</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const cl = editingCliente;
                    setEditingCliente(null);
                    if (cl) setClienteToDelete(cl);
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all flex items-center space-x-1.5 border border-rose-200 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Cliente</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingCliente(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingClient}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingClient ? (
                      <span>Guardando...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. CONTRATO DETAILS MODAL */}
      {selectedContrato && (
        <div id="asesor-contract-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-md font-bold uppercase text-[9px]">
                    Contrato Marco Comercial EOR
                  </span>
                  <span className="font-mono text-indigo-300 text-[10px] font-bold">
                    {selectedContrato.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{selectedContrato.clienteNombre}</h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">Documento legal oficial y términos vinculantes acordados.</p>
              </div>
              <button onClick={() => setSelectedContrato(null)} className="text-indigo-200 hover:text-white font-bold text-xl p-1 rounded-lg hover:bg-white/10 transition-colors">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-slate-600">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cliente Razón Social</span>
                  <strong className="text-slate-900 font-bold block truncate">{selectedContrato.clienteNombre}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">País Destino</span>
                  <span className="font-bold text-slate-900">{selectedContrato.pais}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Estado</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-0.5">{selectedContrato.estado}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Plantilla Base</span>
                  <span className="font-mono text-[10px] block truncate">{selectedContrato.plantillaId || 'PL-CONTR-001'} (v{selectedContrato.versionPlantilla || '1.0'})</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Firma Cliente</span>
                  <span className="text-[11px] text-slate-700 font-medium">{selectedContrato.firmaCliente ? `Firmado por ${selectedContrato.firmaCliente.nombre} el ${new Date(selectedContrato.firmaCliente.fecha).toLocaleDateString()}` : 'Pendiente de firma del cliente'}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Firma Proveedor (Quick Hire)</span>
                  <span className="text-[11px] text-slate-700 font-medium">{selectedContrato.firmaProveedor ? `Firmado por ${selectedContrato.firmaProveedor.nombre} el ${new Date(selectedContrato.firmaProveedor.fecha).toLocaleDateString()}` : 'Pendiente de firma del proveedor'}</span>
                </div>
              </div>

              {/* Complete compiled document container */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs overflow-y-auto max-h-[56vh] text-slate-800 font-sans leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: renderCommercialContractHtml(selectedContrato, clientes.find(c => c.id === selectedContrato.clienteId || c.empresa === selectedContrato.clienteNombre)) }} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end gap-2">
              {selectedContrato.estado === 'Generado' && (
                <button
                  onClick={() => handleSendContractToClient(selectedContrato)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar por Email al Cliente</span>
                </button>
              )}
              <button
                onClick={() => setSelectedContrato(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. TICKET DETAILS / MESSAGE MODAL */}
      {selectedTicket && (
        <div id="asesor-ticket-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-black">{selectedTicket.id}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">{selectedTicket.categoria || 'Soporte General'}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    selectedTicket.prioridad === 'Crítica' ? 'bg-rose-500/30 text-rose-300' :
                    selectedTicket.prioridad === 'Alta' ? 'bg-amber-500/30 text-amber-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {selectedTicket.prioridad || 'Media'}
                  </span>
                </div>
                <h3 className="text-sm font-bold mt-1.5">{selectedTicket.asunto}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Cliente: <strong>{selectedTicket.clienteNombre || clientes.find(c => c.id === selectedTicket.clienteId)?.empresa || selectedTicket.clienteId}</strong>
                  {selectedTicket.solicitanteNombre && <span> • Solicitado por: <strong>{selectedTicket.solicitanteNombre} ({selectedTicket.solicitanteEmail || 'Cliente'})</strong></span>}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white font-bold text-xl p-1 cursor-pointer">&times;</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* SLA & Status Header */}
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">SLA:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black ${
                    selectedTicket.slaEstado === 'Vencido' ? 'bg-rose-100 text-rose-700' :
                    selectedTicket.slaEstado === 'Próximo a vencer' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                    selectedTicket.slaEstado === 'Cumplido' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {selectedTicket.slaEstado || 'Dentro de tiempo'}
                  </span>
                </div>
                {selectedTicket.slaFechaLimiteResolucion && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Límite SLA: <strong className="text-slate-700">{new Date(selectedTicket.slaFechaLimiteResolucion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Estado Actual:</label>
                  <select
                    value={selectedTicket.estado}
                    onChange={async (e) => {
                      try {
                        const updated = await api.updateTicket(selectedTicket.id, { estado: e.target.value });
                        setSelectedTicket(updated);
                        triggerToast(`Estado cambiado a: ${e.target.value}`);
                        fetchData();
                      } catch (err: any) {
                        triggerToast(err.message, true);
                      }
                    }}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Abierto">Abierto</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Respondido">Respondido</option>
                    <option value="Pendiente de Cliente">Pendiente de Cliente</option>
                    <option value="Resuelto">Resuelto</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>
              </div>

              {/* Customer Rating Box if present */}
              {selectedTicket.calificacion && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-amber-900 font-bold text-[10.5px]">
                    <span>CALIFICACIÓN DEL CLIENTE</span>
                    <span>{selectedTicket.calificacion} / 5 ⭐</span>
                  </div>
                  {selectedTicket.comentarioCalificacion && (
                    <p className="text-[11px] text-amber-950 italic">"{selectedTicket.comentarioCalificacion}"</p>
                  )}
                </div>
              )}

              {/* Conversation messages thread */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 max-h-72 overflow-y-auto">
                {/* Initial Description */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                    <span className="font-bold text-slate-600">Descripción Inicial ({selectedTicket.solicitanteNombre || 'Cliente'})</span>
                    <span>{new Date(selectedTicket.fechaCreacion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed font-semibold bg-white p-3 rounded-xl border border-slate-200 shadow-3xs">
                    {selectedTicket.descripcion.split('\n\n[Respuesta')[0]}
                  </p>
                </div>

                {/* Structured Comments */}
                {selectedTicket.comentarios && selectedTicket.comentarios.length > 0 ? (
                  <div className="space-y-2.5 border-t border-slate-200 pt-2.5">
                    <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Historial de Conversación:</div>
                    {selectedTicket.comentarios.map((c) => {
                      const isStaff = c.autorRol === 'asesor_comercial' || c.autorRol === 'administrador';
                      const isInternal = c.esInterno;

                      return (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            isInternal 
                              ? 'bg-amber-50 border-amber-200 text-amber-950' 
                              : isStaff 
                                ? 'bg-indigo-50/70 border-indigo-100 text-indigo-950' 
                                : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <strong className="font-bold">{c.autor}</strong>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                isStaff ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-200 text-slate-800'
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
                  selectedTicket.descripcion.includes('\n\n[Respuesta') && (
                    <div className="space-y-2 border-t border-slate-200 pt-2">
                      <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Respuestas Anteriores:</div>
                      {selectedTicket.descripcion.split('\n\n[Respuesta').slice(1).map((resp, i) => (
                        <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 text-[10.5px] font-semibold text-slate-700">
                          {resp.trim()}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Add answer / internal note form */}
              <form onSubmit={handleRespondTicket} className="space-y-3 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {ticketResponseIsInternal ? 'Escribir Nota Interna Privada (🔒 Solo Staff)' : 'Escribir Respuesta al Cliente'}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={ticketResponseIsInternal}
                      onChange={(e) => setTicketResponseIsInternal(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>🔒 Nota Interna (Privada)</span>
                  </label>
                </div>

                <textarea
                  rows={3}
                  required
                  placeholder={ticketResponseIsInternal ? "Escribe una nota interna para el equipo comercial / soporte..." : "Escribe la respuesta formal que el cliente verá en su panel..."}
                  value={ticketResponse}
                  onChange={(e) => setTicketResponse(e.target.value)}
                  className={`w-full border p-3 rounded-2xl focus:outline-none font-medium text-xs transition-colors ${
                    ticketResponseIsInternal 
                      ? 'border-amber-300 bg-amber-50/40 focus:ring-2 focus:ring-amber-500 text-amber-950' 
                      : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900'
                  }`}
                />

                <div className="flex justify-end items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingTicketResponse}
                    className={`font-bold px-5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-white ${
                      ticketResponseIsInternal 
                        ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400' 
                        : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
                    }`}
                  >
                    <span>{isSubmittingTicketResponse ? 'Enviando...' : ticketResponseIsInternal ? 'Guardar Nota Interna' : 'Enviar Respuesta al Cliente'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* E. REGISTER SEGUIMIENTO COMERCIAL MODAL */}
      {showCreateSeguimientoModal && (
        <div id="asesor-create-seguimiento-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Registrar Gestión Comercial</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Cargue un reporte de contacto o comentario para el control de cumplimiento.</p>
              </div>
              <button onClick={() => setShowCreateSeguimientoModal(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateSeguimiento} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Entidad Relacionada</label>
                  <select
                    value={seguimientoForm.relacionadoTipo}
                    onChange={(e) => setSeguimientoForm({ 
                      ...seguimientoForm, 
                      relacionadoTipo: e.target.value as 'solicitud' | 'cliente' | 'contrato',
                      relacionadoId: e.target.value === 'solicitud' ? (solicitudes[0]?.id || '') : e.target.value === 'cliente' ? (clientes[0]?.id || '') : (contratos[0]?.id || '')
                    })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600"
                  >
                    <option value="solicitud">Solicitud de Lead EOR</option>
                    <option value="cliente">Cliente Activo</option>
                    <option value="contrato">Contrato Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Seleccionar Item Específico</label>
                  <select
                    value={seguimientoForm.relacionadoId}
                    onChange={(e) => setSeguimientoForm({ ...seguimientoForm, relacionadoId: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600 font-semibold"
                  >
                    <option value="">-- Seleccionar --</option>
                    {seguimientoForm.relacionadoTipo === 'solicitud' && solicitudes.map(s => (
                      <option key={s.id} value={s.id}>{s.empresa} ({s.id})</option>
                    ))}
                    {seguimientoForm.relacionadoTipo === 'cliente' && clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa} ({c.id})</option>
                    ))}
                    {seguimientoForm.relacionadoTipo === 'contrato' && contratos.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.clienteNombre} - {ct.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Medio de Contacto / Tipo</label>
                  <select
                    value={seguimientoForm.tipoSeguimiento}
                    onChange={(e) => setSeguimientoForm({ ...seguimientoForm, tipoSeguimiento: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600"
                  >
                    <option value="Llamada">Llamada Comercial</option>
                    <option value="Reunión">Videollamada / Reunión</option>
                    <option value="Correo">Correo Electrónico</option>
                    <option value="Observación">Observación Interna</option>
                    <option value="Otro">Otro Medio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Actualizar Estado Comercial</label>
                  <select
                    value={seguimientoForm.estadoComercialSugerido}
                    onChange={(e) => setSeguimientoForm({ ...seguimientoForm, estadoComercialSugerido: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600"
                  >
                    <option value="">Dejar estado sin cambios</option>
                    {commercialStates.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Comentario Comercial Detallado</label>
                  <textarea
                    rows={4}
                    placeholder="Redacte las notas formales de lo conversado, acuerdos preliminares y cualquier observación relevante..."
                    value={seguimientoForm.comentario}
                    onChange={(e) => setSeguimientoForm({ ...seguimientoForm, comentario: e.target.value })}
                    className="w-full border border-slate-200 p-3 rounded-2xl focus:outline-none focus:border-indigo-500 font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Próxima Acción Requerida (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Enviar cotización actualizada"
                    value={seguimientoForm.proximaAccion}
                    onChange={(e) => setSeguimientoForm({ ...seguimientoForm, proximaAccion: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Fecha Sugerida de Gestión</label>
                  <input
                    type="date"
                    value={seguimientoForm.fechaProximaGestion}
                    onChange={(e) => setSeguimientoForm({ ...seguimientoForm, fechaProximaGestion: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSeguimientoModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  Guardar Gestión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* F. GENERATE CONTRATO COMERCIAL MODAL */}
      {showGenerateContractModal && (
        <div id="asesor-generate-contract-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-indigo-300" />
                  Generar Contrato Comercial Cliente-Proveedor
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Genere y emita el contrato mercantil/EOR seleccionando la plantilla legal adecuada.</p>
              </div>
              <button onClick={() => setShowGenerateContractModal(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleGenerateContract} className="p-6 space-y-4 text-left overflow-y-auto flex-1">
              {contractModalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] font-semibold">
                    <p className="font-bold text-rose-900">Error al generar contrato:</p>
                    <p className="mt-0.5">{contractModalError}</p>
                  </div>
                </div>
              )}

              {(() => {
                const availablePlantillas = plantillas.length > 0 ? plantillas : DEFAULT_PLANTILLAS_FALLBACK;
                const activePl = availablePlantillas.find(p => p.id === contractForm.plantillaId) || availablePlantillas[0];

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cliente selector */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                          1. Seleccionar Empresa Cliente <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={contractForm.clienteId}
                          onChange={(e) => {
                            const selectedC = clientes.find(c => c.id === e.target.value);
                            const matchingPl = availablePlantillas.find(p => p.tipo === 'comercial' && (p.pais === selectedC?.pais || p.pais === 'Todos')) || availablePlantillas[0];
                            setContractForm({ 
                              ...contractForm, 
                              clienteId: e.target.value,
                              plantillaId: matchingPl ? matchingPl.id : (contractForm.plantillaId || availablePlantillas[0]?.id),
                              feePorEmpleado: selectedC?.feePorEmpleado ? Number(selectedC.feePorEmpleado) : 1500,
                              representanteCliente: selectedC ? (selectedC.representanteLegal || selectedC.nombreContacto || '') : '',
                              cedulaJuridica: selectedC?.cedulaJuridica || (selectedC as any)?.nit || (selectedC ? `${selectedC.pais === 'México' ? 'MX' : 'COL'}-900344` : 'COL-900344'),
                              direccion: selectedC?.direccion || (selectedC ? `Sede Principal ${selectedC.pais}` : 'Av. Principal #100')
                            });
                          }}
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 font-bold text-xs bg-slate-50/50"
                          required
                        >
                          <option value="">-- Seleccione un Cliente --</option>
                          {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.empresa} ({c.pais}) - {c.id}</option>
                          ))}
                        </select>
                      </div>

                      {/* Plantilla selector */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                          2. Seleccionar Plantilla Legal <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={contractForm.plantillaId || (activePl?.id || '')}
                          onChange={(e) => setContractForm({ ...contractForm, plantillaId: e.target.value })}
                          className="w-full border border-indigo-200 bg-indigo-50/30 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-indigo-900 font-bold text-xs"
                          required
                        >
                          <option value="">-- Seleccione una Plantilla --</option>
                          <optgroup label="Plantillas Comerciales (Cliente - Proveedor)">
                            {availablePlantillas.filter(p => p.tipo === 'comercial').map(p => (
                              <option key={p.id} value={p.id}>
                                📄 [{p.pais}] {p.nombre} ({p.id})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Otras Plantillas (Laborales / Confidencialidad)">
                            {availablePlantillas.filter(p => p.tipo !== 'comercial').map(p => (
                              <option key={p.id} value={p.id}>
                                📝 [{p.pais}] {p.nombre} ({p.id})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* Plantilla Info Card */}
                    {activePl && (
                      <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded-lg text-[10px] uppercase">
                              {activePl.tipo}
                            </span>
                            <span className="font-mono text-xs font-bold text-indigo-950">
                              {activePl.id} (v{activePl.version || '1.0'})
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                              País: {activePl.pais}
                            </span>
                          </div>
                          <p className="text-slate-700 font-semibold text-[11px]">{activePl.nombre}</p>
                          <p className="text-slate-500 text-[10px]">{activePl.descripcion}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            Estado: {activePl.estado || 'Activo'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">ID Fiscal del Cliente (NIT / Cédula) <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={contractForm.cedulaJuridica}
                          onChange={(e) => setContractForm({ ...contractForm, cedulaJuridica: e.target.value })}
                          placeholder="Ej: COL-900344-1 / RFC: ABC123456"
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-[11px] font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Dirección / Sede del Cliente <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={contractForm.direccion}
                          onChange={(e) => setContractForm({ ...contractForm, direccion: e.target.value })}
                          placeholder="Ej: Carrera 7 # 71-21, Bogotá"
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-[11px] font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Representante Legal del Cliente <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={contractForm.representanteCliente}
                          onChange={(e) => setContractForm({ ...contractForm, representanteCliente: e.target.value })}
                          placeholder="Ej: Carlos Ramírez"
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-[11px] font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Representante Proveedor (Asesor)</label>
                        <input
                          type="text"
                          value={contractForm.representanteProveedor || user.nombre}
                          onChange={(e) => setContractForm({ ...contractForm, representanteProveedor: e.target.value })}
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600 bg-slate-50 font-bold text-[11px]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Fee Comercial por Colaborador (USD / Moneda) <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          value={contractForm.feePorEmpleado}
                          onChange={(e) => setContractForm({ ...contractForm, feePorEmpleado: Number(e.target.value) })}
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono font-bold text-[11px]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Moneda Aplicada</label>
                        <input
                          type="text"
                          value={clientes.find(c => c.id === contractForm.clienteId)?.moneda || 'USD'}
                          readOnly
                          className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 text-slate-600 font-mono font-bold text-[11px]"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Condiciones Comerciales y Cláusulas Especiales <span className="text-rose-500">*</span></label>
                        <textarea
                          rows={2}
                          value={contractForm.condicionesComerciales}
                          onChange={(e) => setContractForm({ ...contractForm, condicionesComerciales: e.target.value })}
                          className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-sans text-[11px]"
                          required
                        />
                      </div>
                    </div>

                    {/* Real-time validation checklist */}
                    {(() => {
                      const missingList = [];
                      if (!contractForm.clienteId) missingList.push("Seleccionar Empresa Cliente");
                      if (!contractForm.plantillaId && !activePl) missingList.push("Seleccionar Plantilla Legal");
                      if (!contractForm.cedulaJuridica) missingList.push("ID Fiscal / Cédula Jurídica");
                      if (!contractForm.direccion) missingList.push("Dirección del Cliente");
                      if (!contractForm.representanteCliente) missingList.push("Representante del Cliente");
                      if (!contractForm.feePorEmpleado || contractForm.feePorEmpleado <= 0) missingList.push("Fee comercial válido");
                      if (!contractForm.condicionesComerciales) missingList.push("Condiciones comerciales estándar");

                      return missingList.length > 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                          <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                            ℹ️ Campos requeridos para completar el contrato:
                          </p>
                          <ul className="list-disc pl-4 text-amber-700 text-[10px] font-semibold space-y-0.5">
                            {missingList.map((m, idx) => <li key={idx}>{m}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                          <p className="font-bold text-emerald-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                            ✅ Formulario completo y validado. Listo para generar el contrato oficial.
                          </p>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateContractModal(false)}
                  disabled={isGeneratingContract}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isGeneratingContract ||
                    !contractForm.clienteId ||
                    !contractForm.cedulaJuridica ||
                    !contractForm.direccion ||
                    !contractForm.representanteCliente ||
                    !contractForm.feePorEmpleado ||
                    contractForm.feePorEmpleado <= 0 ||
                    !contractForm.condicionesComerciales
                  }
                  className={`px-5 py-2 text-white font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 text-xs ${
                    (isGeneratingContract ||
                     !contractForm.clienteId ||
                     !contractForm.cedulaJuridica ||
                     !contractForm.direccion ||
                     !contractForm.representanteCliente ||
                     !contractForm.feePorEmpleado ||
                     contractForm.feePorEmpleado <= 0 ||
                     !contractForm.condicionesComerciales)
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {isGeneratingContract ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Generando Contrato...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Generar Contrato Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SYSTEM USER / ADVISOR MODAL */}
      {sysUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  Crear Usuario Cliente
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">
                  Registra un nuevo usuario con acceso al portal de empresa cliente.
                </p>
              </div>
              <button onClick={() => setSysUserModalOpen(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateSystemUser} className="p-6 space-y-4">
              {sysUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-xl">
                  {sysUserError}
                </div>
              )}
              {sysUserSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-xl">
                  {sysUserSuccess}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rol de Acceso *</label>
                <select
                  disabled
                  value="cliente"
                  className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-100 font-bold text-slate-800 text-xs cursor-not-allowed"
                >
                  <option value="cliente">Cliente (Acceso al Portal de Empresa)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Lic. María Fernández"
                  value={sysUserName}
                  onChange={(e) => setSysUserName(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={sysUserEmail}
                  onChange={(e) => setSysUserEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  required
                />
              </div>

              {sysUserRole === 'cliente' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Empresa Cliente Vinculada *</label>
                  <select
                    value={sysUserClientId}
                    onChange={(e) => setSysUserClientId(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  >
                    <option value="">-- Seleccionar Empresa --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa} ({c.pais})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Idioma de Preferencia</label>
                <select
                  value={sysUserLang}
                  onChange={(e) => setSysUserLang(e.target.value as any)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                  <option value="pt">Português (PT)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSysUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE TEMPLATE PREVIEW MODAL */}
      {activeTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-md font-bold uppercase text-[9px]">
                    {activeTemplate.tipo}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded-md font-bold text-[9px]">
                    {activeTemplate.pais}
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-800/80 text-indigo-300 font-mono text-[9px]">
                    v{activeTemplate.version}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{activeTemplate.nombre}</h3>
                <p className="text-[11px] text-indigo-200 font-mono">ID: {activeTemplate.id} | Servicio: {activeTemplate.servicio}</p>
              </div>
              <button 
                onClick={() => setActiveTemplate(null)} 
                className="text-indigo-200 hover:text-white font-bold text-xl p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-left overflow-y-auto flex-1">
              {/* Dynamic Variables Section */}
              <div className="bg-indigo-50/50 border border-indigo-100/70 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-extrabold text-indigo-900 tracking-wider">
                    Variables Dinámicas Compatibles ({activeTemplate.variables?.length || 0})
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Clic en un marcador para copiar</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTemplate.variables || []).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(`{{${v}}}`);
                        triggerToast(`Variable {{${v}}} copiada`);
                      }}
                      className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono text-[10px] rounded-lg font-bold transition-colors flex items-center space-x-1"
                    >
                      <Copy className="w-2.5 h-2.5 text-indigo-500" />
                      <span>{`{{${v}}}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Rendered Preview */}
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Vista Previa del Documento Contractual
                </span>
                <div 
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 max-h-96 overflow-y-auto text-[11px] leading-relaxed text-slate-800 font-sans shadow-inner" 
                  dangerouslySetInnerHTML={{ __html: activeTemplate.archivoBase }} 
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500">
                Estado: <span className="font-bold text-emerald-600">{activeTemplate.estado}</span> | Vigencia: <span className="font-mono">{activeTemplate.vigencia || '2026-12-31'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTemplate(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition text-xs"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const tpl = activeTemplate;
                    setActiveTemplate(null);
                    setContractForm({ ...contractForm, clienteId: clientes[0]?.id || '', plantillaId: tpl.id });
                    setShowGenerateContractModal(true);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs shadow-md flex items-center space-x-1.5"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Generar Contrato con esta Plantilla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW TEMPLATE MODAL */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Crear Nueva Plantilla de Contrato</h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">Registre un modelo estandarizado para contratos comerciales o laborales.</p>
              </div>
              <button 
                onClick={() => setShowCreateTemplateModal(false)} 
                className="text-indigo-200 hover:text-white font-bold text-xl p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              {tplFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {tplFormError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Nombre de la Plantilla <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Contrato Marco EOR - Colombia (Servicios Profesionales)"
                  value={tplFormNombre}
                  onChange={(e) => setTplFormNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tipo de Contrato</label>
                  <select
                    value={tplFormTipo}
                    onChange={(e) => setTplFormTipo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="comercial">Comercial (Cliente-EOR)</option>
                    <option value="laboral">Laboral (Empleado Local)</option>
                    <option value="adendum">Adendum / Anexo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">País Aplicable</label>
                  <select
                    value={tplFormPais}
                    onChange={(e) => setTplFormPais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {ALL_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Servicio</label>
                  <input
                    type="text"
                    value={tplFormServicio}
                    onChange={(e) => setTplFormServicio(e.target.value)}
                    placeholder="ej. Employer of Record (EOR)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Versión</label>
                  <input
                    type="text"
                    value={tplFormVersion}
                    onChange={(e) => setTplFormVersion(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Vigencia</label>
                  <input
                    type="text"
                    value={tplFormVigencia}
                    onChange={(e) => setTplFormVigencia(e.target.value)}
                    placeholder="2026-01-01 a 2026-12-31"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Variables Dinámicas (Separadas por comas)
                </label>
                <input
                  type="text"
                  value={tplFormVariables}
                  onChange={(e) => setTplFormVariables(e.target.value)}
                  placeholder="cliente, pais, servicio, feePorEmpleado, condicionesComerciales..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[9px] text-slate-400">Estas variables podrán sustituirse con el formato {`{{variable}}`} dentro del texto.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Contenido HTML / Texto del Contrato <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  value={tplFormArchivoBase}
                  onChange={(e) => setTplFormArchivoBase(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-indigo-500"
                  placeholder="<h1>CONTRATO DE SERVICIOS</h1><p>Entre {{cliente}} y...</p>"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={tplFormLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs shadow-md flex items-center space-x-1"
                >
                  {tplFormLoading ? 'Guardando...' : 'Crear y Publicar Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGULATORY SERVICE BASE RATES / FEES EDIT */}
      {showTarifaModal && (
        <div id="tariff-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">
                  {showTarifaModal === 'new' ? 'Nueva Tarifa EOR Base' : 'Modificar Tarifa EOR Base'}
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Controla la matriz de precios comerciales asignados por país.</p>
              </div>
              <button onClick={() => setShowTarifaModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveTarifa} className="p-5 space-y-4">
              {tariffError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">{tariffError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">País</label>
                  <select
                    disabled={showTarifaModal !== 'new'}
                    value={tariffPais}
                    onChange={(e) => setTariffPais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-bold"
                  >
                    {ALL_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Fee Base Commercial ($)</label>
                  <input
                    type="number"
                    required
                    value={tariffFee}
                    onChange={(e) => setTariffFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Moneda</label>
                  <select
                    disabled={showTarifaModal !== 'new'}
                    value={tariffMoneda}
                    onChange={(e) => setTariffMoneda(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-bold"
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                    <option value="COP">COP</option>
                    <option value="BRL">BRL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Vigencia Límite</label>
                  <input
                    type="date"
                    required
                    value={tariffVigencia}
                    onChange={(e) => setTariffVigencia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Estatus Matriz</label>
                <select
                  value={tariffEstado}
                  onChange={(e) => setTariffEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-bold"
                >
                  <option value="Vigente">Vigente</option>
                  <option value="Histórico">Histórico</option>
                </select>
              </div>

              {showTarifaModal !== 'new' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Motivo de Modificación (Auditoría Mandatoria) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={tariffMotivo}
                    onChange={(e) => setTariffMotivo(e.target.value)}
                    placeholder="Escriba la razón de ajuste de fee para registro de auditoría comercial..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTarifaModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  {showTarifaModal === 'new' ? 'Crear Tarifa' : 'Guardar Cambios de Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER MANUAL MODAL */}
      <UserManualModal
        user={user}
        lang={lang}
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onOpenSimulator={() => {
          setIsManualOpen(false);
          setIsSimulatorOpen(true);
        }}
      />

      {/* QUOTE SIMULATOR MODAL */}
      <QuoteSimulatorModal
        user={user}
        lang={lang}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* USER EDIT MODAL */}
      <UserEditModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
        currentUser={user}
        clientes={clientes}
        roles={roles}
        onUserUpdated={() => {
          api.getUsuarios().then(setAllUsers).catch(() => {});
        }}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE LEAD / SOLICITUD */}
      {solicitudToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">¿Eliminar Lead permanentemente?</h3>
              <p className="text-sm text-slate-500 mt-1">
                ¿Está seguro de que desea eliminar el Lead de <strong className="text-slate-800">{solicitudToDelete.empresa}</strong> ({solicitudToDelete.id})? Esta acción no se puede deshacer y el registro se borrará de forma definitiva.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setSolicitudToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={handleConfirmDeleteSolicitud}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeletingItem ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, eliminar Lead</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CLIENTE */}
      {clienteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">¿Eliminar Cliente permanentemente?</h3>
              <p className="text-sm text-slate-500 mt-1">
                ¿Está seguro de que desea eliminar permanentemente al cliente <strong className="text-slate-800">{clienteToDelete.empresa}</strong> ({clienteToDelete.id})? Esta acción no se puede deshacer y desvinculará sus registros asociados.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setClienteToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={handleConfirmDeleteCliente}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeletingItem ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, eliminar Cliente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
