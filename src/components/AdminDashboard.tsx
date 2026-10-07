import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import ExtraWorkflows from './ExtraWorkflows';
import OperationalAlertsPanel from './OperationalAlertsPanel';
import ManagementReportsPanel from './ManagementReportsPanel';
import AuditPanel from './AuditPanel';
import DictionaryPanel from './DictionaryPanel';
import DirectorioView from './DirectorioView';
import CuentasBancariasView from './CuentasBancariasView';
import FeesManagementPanel from './FeesManagementPanel';
import IvaWhtRentaMaster from './IvaWhtRentaMaster';
import RolesManagementPanel from './RolesManagementPanel';
import UserEditModal from './UserEditModal';
import { DEFAULT_ROLES_CONFIG, ALL_MENU_IDS } from '../data/menuOptions';
import { 
  User, 
  RoleDefinition,
  SolicitudEOR, 
  Cliente, 
  Trabajador, 
  CargaSocial, 
  Tarifa, 
  Beneficio, 
  ContratoRequisito, 
  Factura, 
  Pago, 
  HistorialLog,
  i18n,
  Language,
  PlantillaContrato,
  ContratoComercial,
  Adendum,
  ContratoLaboral,
  TipoCambio,
  Ticket,
  SlaConfig,
  PlantillaNotificacion,
  AlertaNotificacion,
  PagoContadoUSD,
  LATAM_COUNTRIES,
  COUNTRY_FLAGS,
  ALL_COUNTRIES,
  BILLING_COUNTRIES,
  CuentaBancariaMaestra,
  TarifarioEOR
} from '../types';
import { calculateFeeForTalents } from '../utils/feeCalculator';
import { calcularCostoTalento } from '../utils/laborCalculator';
import { DEFAULT_CUENTAS_BANCARIAS, findBestBankAccount, normalizeCountry } from '../utils/cuentasBancariasData';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Briefcase, 
  Settings, 
  ShieldAlert, 
  DollarSign, 
  LayoutDashboard,
  MessageSquare,
  Bell, 
  Plus, 
  Gift,
  Search, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  History,
  Building2,
  Percent,
  Calendar,
  Globe,
  Coins,
  BadgePercent,
  FileSignature,
  FileSpreadsheet,
  Eye,
  LogOut,
  Clock,
  Languages,
  UserPlus,
  UserCheck,
  UserCog,
  Edit,
  Pencil,
  Landmark,
  Contact,
  BookUser,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck,
  Building,
  Save,
  Mail,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import LanguageSelector from './LanguageSelector';
import UserManualModal from './UserManualModal';
import { PWAInstallButton } from './PWAInstallButton';
import { BookOpen } from 'lucide-react';
import { tText, translateStatus, tr, translateRole } from '../utils/i18n';

interface Props {
  user: User;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

export default function AdminDashboard({ user, lang, onLanguageChange, onLogout }: Props) {
  const commonT = i18n[lang].common;
  const adminT = i18n[lang].adminDashboard;

  // Active resource states
  const [solicitudes, setSolicitudes] = useState<SolicitudEOR[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [solicitudToDelete, setSolicitudToDelete] = useState<{ id: string; empresa: string } | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [workers, setWorkers] = useState<Trabajador[]>([]);
  const [cargasSociales, setCargasSociales] = useState<CargaSocial[]>([]);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancariaMaestra[]>(DEFAULT_CUENTAS_BANCARIAS);
  const [tarifarios, setTarifarios] = useState<TarifarioEOR[]>([]);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [contratos, setContratos] = useState<ContratoRequisito[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [logs, setLogs] = useState<HistorialLog[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  // New workflow modules states
  const [plantillasContrato, setPlantillasContrato] = useState<PlantillaContrato[]>([]);
  const [contratosComerciales, setContratosComerciales] = useState<ContratoComercial[]>([]);
  const [adendums, setAdendums] = useState<Adendum[]>([]);
  const [contratosLaborales, setContratosLaborales] = useState<ContratoLaboral[]>([]);
  const [tiposCambio, setTiposCambio] = useState<TipoCambio[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>([]);
  const [plantillasNotificacion, setPlantillasNotificacion] = useState<PlantillaNotificacion[]>([]);
  const [alertasNotificacion, setAlertasNotificacion] = useState<AlertaNotificacion[]>([]);
  const [pagosContado, setPagosContado] = useState<PagoContadoUSD[]>([]);
  
  // Payment Review states
  const [reviewPagoContado, setReviewPagoContado] = useState<PagoContadoUSD | null>(null);
  const [rechazoComentarios, setRechazoComentarios] = useState('');
  const [pagoReviewError, setPagoReviewError] = useState('');
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Modal for client users
  const [selectedClientForUsers, setSelectedClientForUsers] = useState<Cliente | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserError, setNewUserError] = useState('');
  const [newUserSuccess, setNewUserSuccess] = useState('');

  // States for System Users & Advisors Management
  const [sysUserModalOpen, setSysUserModalOpen] = useState(false);
  const [sysUserName, setSysUserName] = useState('');
  const [sysUserEmail, setSysUserEmail] = useState('');
  const [sysUserRole, setSysUserRole] = useState<string>('asesor_comercial');
  const [sysUserCountry, setSysUserCountry] = useState('México');
  const [sysUserAssignedCountries, setSysUserAssignedCountries] = useState<string[]>(['México', 'Colombia']);
  const [sysUserClientId, setSysUserClientId] = useState('');
  const [sysUserLang, setSysUserLang] = useState<'es' | 'en' | 'pt'>('es');
  const [sysUserPassword, setSysUserPassword] = useState('123456');
  const [sysUserError, setSysUserError] = useState('');
  const [sysUserSuccess, setSysUserSuccess] = useState('');
  const [sysRoleFilter, setSysRoleFilter] = useState('all');

  // Dynamic RBAC Roles State & Subtabs
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES_CONFIG);
  const [usersSubTab, setUsersSubTab] = useState<'usuarios' | 'roles'>('usuarios');
  const [roleChangeModalUser, setRoleChangeModalUser] = useState<User | null>(null);
  const [newAssignedRole, setNewAssignedRole] = useState<string>('asesor_comercial');
  const [changeRoleLoading, setChangeRoleLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      const r = await api.getRoles();
      if (Array.isArray(r) && r.length > 0) {
        setRoles(r);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const isTesoreriaUser = user.rol === 'tesoreria' || user.rol === 'gestion_cuentas' || user.rol?.toLowerCase().includes('tesorer') || user.rol?.toLowerCase().includes('cuenta');

  const currentRoleDef = useMemo(() => {
    if (user.rol === 'administrador' || user.rol === 'supracliente' || user.rol === 'Administrador') {
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
    const isTeso = userRoleLower.includes('tesorer') || userRoleLower.includes('cuenta') || user.rol === 'tesoreria' || user.rol === 'gestion_cuentas';
    const isAsesor = userRoleLower.includes('asesor') || user.rol === 'asesor_comercial' || user.rol === 'asesor';

    const found = roles.find(r => 
      r.id === user.rol || 
      r.id.toLowerCase() === userRoleLower ||
      r.nombre.toLowerCase() === userRoleLower ||
      (isAsesor && (r.id === 'asesor_comercial' || r.id === 'asesor')) ||
      (isTeso && (r.id === 'tesoreria' || r.id === 'gestion_cuentas'))
    );
    if (found) return found;

    if (isTeso) {
      const defTeso = DEFAULT_ROLES_CONFIG.find(r => r.id === 'tesoreria');
      if (defTeso) return defTeso;
    }

    return DEFAULT_ROLES_CONFIG.find(r => r.id === user.rol) || DEFAULT_ROLES_CONFIG.find(r => r.id === 'asesor_comercial') || DEFAULT_ROLES_CONFIG[1];
  }, [roles, user.rol]);

  const isMenuVisible = (menuId: string): boolean => {
    if (user.rol === 'administrador' || user.rol === 'supracliente' || user.rol === 'Administrador') {
      return true;
    }
    if (!currentRoleDef) return true;
    return currentRoleDef.opcionesMenu.includes(menuId);
  };

  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

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
      setUsuarios(updatedUsers);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el usuario.');
    }
  };

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kpis' | 'solicitudes' | 'clientes' | 'trabajadores' | 'billing' | 'masters' | 'logs' | 'contracts' | 'plantillas' | 'exchange' | 'tickets' | 'notifications' | 'sla' | 'operational_alerts' | 'reports' | 'dictionary' | 'users' | 'fees' | 'directorio' | 'cuentas_bancarias' | 'iva_wht_renta'>(
    isTesoreriaUser ? 'cuentas_bancarias' : 'kpis'
  );

  // Auto-switch to first available menu option if current tab is not permitted for the user's role
  useEffect(() => {
    if (!loading && currentRoleDef?.opcionesMenu) {
      if (!isMenuVisible(activeTab)) {
        const firstVisible = currentRoleDef.opcionesMenu.find(m => isMenuVisible(m));
        if (firstVisible) {
          setActiveTab(firstVisible as any);
        } else if (isTesoreriaUser) {
          setActiveTab('cuentas_bancarias');
        }
      }
    }
  }, [currentRoleDef, activeTab, loading, isTesoreriaUser]);

  // Expanded state for grouped menu sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    operacion: true,
    finanzas: true,
    legal: true,
    soporte: true,
    reportes: true,
    admin: true,
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Sub-tabs for Regulatory Masters
  const [masterSubTab, setMasterSubTab] = useState<'social' | 'rates' | 'benefits' | 'contracts'>('social');

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [regionalFilterCountries, setRegionalFilterCountries] = useState<string[]>([...LATAM_COUNTRIES]);
  
  // Specific Filters for Workers, Invoices, Social Charges
  const [workerClientFilter, setWorkerClientFilter] = useState('All');
  const [workerCountryFilter, setWorkerCountryFilter] = useState('All');
  const [facturaClientFilter, setFacturaClientFilter] = useState('All');
  const [facturaCountryFilter, setFacturaCountryFilter] = useState('All');
  const [socialCountryFilter, setSocialCountryFilter] = useState('All');
  const [feeCountryFilter, setFeeCountryFilter] = useState('all');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');

  // Modals visibility
  const [showClientModal, setShowClientModal] = useState<Cliente | 'new' | null>(null);
  const [showSolicitudModal, setShowSolicitudModal] = useState<SolicitudEOR | null>(null);
  const [showAuditModal, setShowAuditModal] = useState<Trabajador | null>(null);
  const [showSocialModal, setShowSocialModal] = useState<CargaSocial | 'new' | null>(null);
  const [showTarifaModal, setShowTarifaModal] = useState<Tarifa | 'new' | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [newlyCreatedClient, setNewlyCreatedClient] = useState<any | null>(null);
  const [initialPrepClientId, setInitialPrepClientId] = useState<string>('');

  // Client Form Fields
  const [clientEmpresa, setClientEmpresa] = useState('');
  const [clientPais, setClientPais] = useState('México');
  const [clientPaisesOperacion, setClientPaisesOperacion] = useState<string[]>(['México', 'Colombia']);
  const [clientServicio, setClientServicio] = useState('Employer of Record (EOR)');
  const [clientMoneda, setClientMoneda] = useState('USD');
  const [clientFee, setClientFee] = useState(250);
  const [clientCupo, setClientCupo] = useState(15);
  const [clientCorreo, setClientCorreo] = useState('');
  const [clientTelefono, setClientTelefono] = useState('');
  const [clientContacto, setClientContacto] = useState('');
  const [clientDescuento, setClientDescuento] = useState(0);
  const [clientLinkedSolicitud, setClientLinkedSolicitud] = useState('');
  const [clientEstado, setClientEstado] = useState('Activo');
  const [clientMotivo, setClientMotivo] = useState('');
  const [clientError, setClientError] = useState('');

  // Additional fields for Client Creation (Point 5)
  const [clientServicioTipo, setClientServicioTipo] = useState<'EOR' | 'PEO' | 'HRO'>('EOR');
  const [clientTipoSocio, setClientTipoSocio] = useState<'Directo' | 'Partners'>('Directo');
  const [clientJerarquia, setClientJerarquia] = useState<'Directo' | 'Supra' | 'Filial'>('Directo');
  const [clientProyecto, setClientProyecto] = useState('');
  const [clientRazonSocial, setClientRazonSocial] = useState('');
  const [clientCedulaJuridica, setClientCedulaJuridica] = useState('');
  const [clientDireccion, setClientDireccion] = useState('');
  const [clientFechaInicioContrato, setClientFechaInicioContrato] = useState('');
  const [clientPosicion, setClientPosicion] = useState('');
  const [clientTipoFacturacion, setClientTipoFacturacion] = useState<'Local' | 'Internacional'>('Local');
  const [clientPaisFacturacion, setClientPaisFacturacion] = useState('México');
  const [clientCuentaBancariaId, setClientCuentaBancariaId] = useState('');
  const [clientCuentaBancariaDetalle, setClientCuentaBancariaDetalle] = useState('');
  const [clientFeeInfo, setClientFeeInfo] = useState('');
  const [clientCredito, setClientCredito] = useState('10 días');
  const [clientHeadcountProyecto, setClientHeadcountProyecto] = useState(1);
  const [clientFrecuenciaNomina, setClientFrecuenciaNomina] = useState<'Quincenal' | 'Mensual'>('Mensual');
  const [clientFechaInicio, setClientFechaInicio] = useState('');
  const [clientAdicionales, setClientAdicionales] = useState('');
  const [clientAdicionalesExtralegales, setClientAdicionalesExtralegales] = useState('');
  const [clientSociedadContratacion, setClientSociedadContratacion] = useState('');
  const [clientRepresentanteLegal, setClientRepresentanteLegal] = useState('');
  const [clientDocumentoRepresentante, setClientDocumentoRepresentante] = useState('');
  const [clientSupraclienteId, setClientSupraclienteId] = useState('');
  const [clientAsesorAsignado, setClientAsesorAsignado] = useState('');
  const [clientIdioma, setClientIdioma] = useState<Language>('es');

  // Manual Solicitud Fields (Point 4)
  const [showManualSolicitudModal, setShowManualSolicitudModal] = useState(false);
  const [manualSolEmpresa, setManualSolEmpresa] = useState('');
  const [manualSolPais, setManualSolPais] = useState('México');
  const [manualSolPaises, setManualSolPaises] = useState<string[]>(['México', 'Colombia']);
  const [manualSolCantidad, setManualSolCantidad] = useState(10);
  const [manualSolServicio, setManualSolServicio] = useState('Employer of Record (EOR)');
  const [manualSolNombre, setManualSolNombre] = useState('');
  const [manualSolCorreo, setManualSolCorreo] = useState('');
  const [manualSolTelefono, setManualSolTelefono] = useState('');
  const [manualSolNotas, setManualSolNotas] = useState('');

  // Billing configuration state (Point 3)
  const [billingConfig, setBillingConfig] = useState({ ivaPct: 19, comisionPct: 2.5, whtPct: 4, impuestoPct: 1.5 });

  // Custom states for Social Charges and Tariffs
  const [socialNombreCarga, setSocialNombreCarga] = useState('');
  const [tariffRangos, setTariffRangos] = useState<{ desde: number; hasta: number; descuentoPorcentaje: number; feePersonalizado?: number }[]>([]);

  // Audit Form Fields
  const [auditEstado, setAuditEstado] = useState<'Activo' | 'Con observaciones' | 'Inactivo'>('Activo');
  const [auditObservaciones, setAuditObservaciones] = useState('');
  const [auditMotivo, setAuditMotivo] = useState('');
  const [auditError, setAuditError] = useState('');
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<any>(null);

  // Social Charge Form Fields
  const [socialPais, setSocialPais] = useState('México');
  const [socialTipo, setSocialTipo] = useState('Salud / IMSS');
  const [socialPorcentaje, setSocialPorcentaje] = useState(12.5);
  const [socialResponsable, setSocialResponsable] = useState<'Patrono' | 'Empleado'>('Patrono');
  const [socialVigencia, setSocialVigencia] = useState('2026-12-31');
  const [socialEstado, setSocialEstado] = useState('Vigente');
  const [socialMotivo, setSocialMotivo] = useState('');
  const [socialError, setSocialError] = useState('');

  // Tariff Form Fields
  const [tariffPais, setTariffPais] = useState('México');
  const [tariffServicio, setTariffServicio] = useState('Employer of Record (EOR)');
  const [tariffMoneda, setTariffMoneda] = useState('USD');
  const [tariffFee, setTariffFee] = useState(200);
  const [tariffVigencia, setTariffVigencia] = useState('2026-12-31');
  const [tariffEstado, setTariffEstado] = useState('Vigente');
  const [tariffMotivo, setTariffMotivo] = useState('');
  const [tariffError, setTariffError] = useState('');

  // Benefits Form Fields
  const [showBenefitModal, setShowBenefitModal] = useState<'new' | null>(null);
  const [benefitNombre, setBenefitNombre] = useState('');
  const [benefitTipo, setBenefitTipo] = useState<'Salud' | 'Seguro Vida' | 'Equipos' | 'Viáticos' | 'Otros'>('Salud');
  const [benefitModalidad, setBenefitModalidad] = useState<'Mensual' | 'Único' | 'Anual'>('Mensual');
  const [benefitMoneda, setBenefitMoneda] = useState('USD');
  const [benefitCosto, setBenefitCosto] = useState(50);
  const [benefitAplicaTrabajador, setBenefitAplicaTrabajador] = useState(true);
  const [benefitAplicaCliente, setBenefitAplicaCliente] = useState(true);
  const [benefitEstado, setBenefitEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [benefitVigencia, setBenefitVigencia] = useState('2026-12-31');
  const [benefitError, setBenefitError] = useState('');

  // Contracts Form Fields
  const [showContractModal, setShowContractModal] = useState<'new' | null>(null);
  const [contractPais, setContractPais] = useState('México');
  const [contractServicio, setContractServicio] = useState('Employer of Record (EOR)');
  const [contractTipo, setContractTipo] = useState('Contrato de Trabajo por Tiempo Indeterminado');
  const [contractPlantillaNombre, setContractPlantillaNombre] = useState('MX_EOR_INDETERMINADO_V2.docx');
  const [contractObligatorio, setContractObligatorio] = useState(true);
  const [contractEstado, setContractEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [contractError, setContractError] = useState('');

  // Invoice Generator Fields
  const [genClienteId, setGenClienteId] = useState('');
  const [genPeriodo, setGenPeriodo] = useState('2026-07');
  const [genImpuesto, setGenImpuesto] = useState(16);
  const [genComisionPct, setGenComisionPct] = useState(2.5);
  const [genWhtPct, setGenWhtPct] = useState(4);
  const [genOtrosImpuestosPct, setGenOtrosImpuestosPct] = useState(1.5);
  const [genFeePorEmpleado, setGenFeePorEmpleado] = useState<number | ''>('');
  const [genSuccess, setGenSuccess] = useState('');
  const [genError, setGenError] = useState('');

  // Load everything
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        sList,
        cList,
        wList,
        scList,
        tList,
        bList,
        crList,
        fList,
        lList,
        bConfig,
        uList,
        pcList,
        ccList,
        adList,
        clList,
        tcList,
        tickList,
        scfList,
        pnList,
        anList,
        pContadoList,
        cbList,
        trfList,
        rolesList
      ] = await Promise.all([
        api.getSolicitudes(),
        api.getClientes(),
        api.getTrabajadores(),
        api.getCargasSociales(),
        api.getTarifas(),
        api.getBeneficios(),
        api.getContratosRequisitos(),
        api.getFacturas(),
        api.getLogs(),
        api.getConfiguracionFactura().catch(() => ({ ivaPct: 19, comisionPct: 2.5, whtPct: 4, impuestoPct: 1.5 })),
        api.getUsuarios().catch(() => []),
        api.getPlantillasContrato().catch(() => []),
        api.getContratosComerciales().catch(() => []),
        api.getAdendums().catch(() => []),
        api.getContratosLaborales().catch(() => []),
        api.getTiposCambio().catch(() => []),
        api.getTickets().catch(() => []),
        api.getSlaConfigs().catch(() => []),
        api.getPlantillasNotificacion().catch(() => []),
        api.getAlertasNotificacion().catch(() => []),
        api.getPagosContado().catch(() => []),
        api.getCuentasBancarias().catch(() => []),
        api.getTarifarios().catch(() => []),
        api.getRoles().catch(() => DEFAULT_ROLES_CONFIG)
      ]);

      setSolicitudes(sList);
      setClientes(cList);
      setWorkers(wList);
      setCargasSociales(scList);
      setTarifas(tList);
      setCuentasBancarias(cbList && Array.isArray(cbList) && cbList.length > 0 ? cbList : DEFAULT_CUENTAS_BANCARIAS);
      setTarifarios(trfList);
      if (rolesList && Array.isArray(rolesList) && rolesList.length > 0) {
        setRoles(rolesList);
      }
      setBeneficios(bList);
      setContratos(crList);
      setFacturas(fList);
      setLogs(lList);
      setUsuarios(uList);
      setPlantillasContrato(pcList);
      setContratosComerciales(ccList);
      setAdendums(adList);
      setContratosLaborales(clList);
      setTiposCambio(tcList);
      setTickets(tickList);
      setSlaConfigs(scfList);
      setPlantillasNotificacion(pnList);
      setAlertasNotificacion(anList);
      setPagosContado(pContadoList);
      if (bConfig) {
        setBillingConfig(bConfig);
      }
    } catch (err) {
      console.error('Error loading admin consolidated data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update prospect status
  const handleUpdateSolicitudStatus = async (id: string, nextEstado: 'Recibida' | 'En revisión' | 'Aprobada' | 'Rechazada' | 'Cliente creado', notas?: string) => {
    try {
      await api.updateSolicitud(id, {
        estado: nextEstado,
        notasInternas: notas || `Estado actualizado a ${nextEstado} por Admin`,
        usuario: user.correo
      });
      loadAllData();
      setShowSolicitudModal(null);
    } catch (e) {
      alert('Error al actualizar solicitud');
    }
  };

  // Delete prospect / lead
  const handleConfirmDeleteSolicitud = async () => {
    if (!solicitudToDelete) return;
    setIsDeletingItem(true);
    try {
      await api.deleteSolicitud(solicitudToDelete.id, { usuario: user.correo, motivo: `Lead de ${solicitudToDelete.empresa} (${solicitudToDelete.id}) eliminado por ${user.correo}` });
      setSolicitudes(prev => prev.filter(s => s.id !== solicitudToDelete.id));
      if (showSolicitudModal?.id === solicitudToDelete.id) {
        setShowSolicitudModal(null);
      }
      setSolicitudToDelete(null);
      loadAllData();
    } catch (e: any) {
      alert(`Error al eliminar el Lead: ${e.message}`);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Delete client
  const handleConfirmDeleteCliente = async () => {
    if (!clienteToDelete) return;
    setIsDeletingItem(true);
    try {
      await api.deleteCliente(clienteToDelete.id, { usuario: user.correo, motivo: `Cliente ${clienteToDelete.empresa} (${clienteToDelete.id}) eliminado por ${user.correo}` });
      setClientes(prev => prev.filter(item => item.id !== clienteToDelete.id));
      if (typeof showClientModal === 'object' && showClientModal?.id === clienteToDelete.id) {
        setShowClientModal(null);
      }
      setClienteToDelete(null);
      loadAllData();
    } catch (e: any) {
      alert(`Error al eliminar el cliente: ${e.message}`);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Helper to recalculate Fee automatically according to country, talent count, and pricing matrix
  const autoCalculateClientFee = (pais: string, qty: number, clientName?: string, currentTarifarios = tarifarios) => {
    const safeQty = Math.max(1, Number(qty) || 1);
    const res = calculateFeeForTalents(currentTarifarios, pais, safeQty, clientName);
    setClientFee(res.feePorCabezaUsd);
    setClientFeeInfo(`${res.tarifarioAplicado.nombre} • ${res.tramoAplicado?.etiqueta || 'Estándar'} (${res.origen}) → $${res.feePorCabezaUsd} USD/empleado`);
    return res.feePorCabezaUsd;
  };

  // Helper to associate Master Bank Account according to billing country and currency
  const autoSelectAccount = (billingCountry: string, currency: string, accountsList = cuentasBancarias) => {
    const list = accountsList && accountsList.length > 0 ? accountsList : DEFAULT_CUENTAS_BANCARIAS;
    const best = findBestBankAccount(list, billingCountry, currency);
    if (best) {
      setClientCuentaBancariaId(best.id);
      setClientCuentaBancariaDetalle(`${best.banco} - ${best.numeroCuenta} (${best.moneda}) | ${best.sociedad}`);
    }
  };

  // Convert prospect to Client
  const triggerConversion = (sol: SolicitudEOR) => {
    const isReg = sol.esRegional || sol.pais === 'Regional';
    setClientEmpresa(sol.empresa);
    setClientPais(isReg ? 'Regional' : sol.pais);
    setClientPaisesOperacion(isReg ? (sol.paisesOperacion && sol.paisesOperacion.length > 0 ? sol.paisesOperacion : ['México', 'Colombia']) : [sol.pais]);
    setClientServicio(sol.servicioRequerido || 'Employer of Record (EOR)');
    setClientMoneda(sol.moneda || 'USD');
    setClientCorreo(sol.correo);
    setClientTelefono(sol.telefono);
    setClientContacto(sol.nombreContacto);
    setClientLinkedSolicitud(sol.id);
    const qty = sol.cantidadTrabajadores || 10;
    setClientCupo(qty);
    setClientHeadcountProyecto(qty);
    autoCalculateClientFee(sol.pais, qty, sol.empresa);
    setClientDescuento(0);
    setClientEstado('Activo');
    setClientMotivo('Alta por conversión de prospecto.');

    // Custom creation properties mapped from the EOR lead request
    const mappedServTipo = (sol.servicioRequerido || '').includes('PEO') ? 'PEO' : 
                           (sol.servicioRequerido || '').includes('HRO') ? 'HRO' : 'EOR';
    setClientServicioTipo(mappedServTipo);
    setClientTipoSocio('Directo');
    setClientProyecto(sol.empresa + ' Project');
    setClientRazonSocial(sol.empresa);
    setClientCedulaJuridica('');
    setClientDireccion('');
    setClientFechaInicioContrato(new Date().toISOString().split('T')[0]);
    setClientPosicion(sol.nombreContacto);
    if (isReg) {
      setClientTipoFacturacion('Internacional');
      setClientPaisFacturacion('Estados Unidos');
      autoSelectAccount('Estados Unidos', sol.moneda || 'USD');
    } else {
      setClientTipoFacturacion('Local');
      setClientPaisFacturacion(sol.pais);
      autoSelectAccount(sol.pais, sol.moneda || 'USD');
    }
    setClientCredito('10 días');
    setClientFrecuenciaNomina('Mensual');
    setClientFechaInicio(new Date().toISOString().split('T')[0]);
    setClientAdicionales(sol.observaciones || '');
    setClientAdicionalesExtralegales('');
    setClientSociedadContratacion('');
    setClientRepresentanteLegal(sol.nombreContacto || '');
    setClientDocumentoRepresentante('');
    setClientSupraclienteId('');
    setClientAsesorAsignado(sol.asesorAsignado || user.correo);
    setClientIdioma('es');

    setShowClientModal('new');
    setShowSolicitudModal(null);
  };

  // Save/Create Client
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    const repLegalName = clientRepresentanteLegal || clientContacto;

    if (showClientModal === 'new') {
      const missingContractFields: string[] = [];
      if (!clientEmpresa.trim()) missingContractFields.push("Nombre Comercial (Empresa)");
      if (!clientCedulaJuridica.trim()) missingContractFields.push("Cédula Jurídica / NIT / Tax ID");
      if (!clientDireccion.trim()) missingContractFields.push("Dirección Fiscal Completa");
      if (!clientPais.trim()) missingContractFields.push("País de Operación");
      if (!clientCorreo.trim()) missingContractFields.push("Correo Electrónico");
      if (!clientTelefono.trim()) missingContractFields.push("Teléfono de Enlace");
      if (!repLegalName.trim()) missingContractFields.push("Representante Legal del Cliente");
      if (!clientDocumentoRepresentante.trim()) missingContractFields.push("Pasaporte / Cédula No. del Representante Legal");
      if (!clientFee || Number(clientFee) <= 0) missingContractFields.push("Fee EOR Base por Empleado");

      if (missingContractFields.length > 0) {
        setClientError(`Error de Validación Contractual: Faltan datos requeridos en la creación del cliente para el contrato marco: ${missingContractFields.join(', ')}.`);
        return;
      }
    } else {
      if (!clientEmpresa.trim()) {
        setClientError('El nombre comercial o razón de la empresa es obligatorio.');
        return;
      }
    }

    if (clientPais === 'Regional' && (!clientPaisesOperacion || clientPaisesOperacion.length === 0)) {
      setClientError('Por favor selecciona al menos un país para la operación regional del cliente.');
      return;
    }

    try {
      if (showClientModal === 'new') {
        const created = await api.createCliente({
          empresa: clientEmpresa.trim(),
          pais: clientPais,
          esRegional: clientPais === 'Regional',
          paisesOperacion: clientPais === 'Regional' ? clientPaisesOperacion : [clientPais],
          servicioContratado: clientServicio,
          moneda: clientMoneda,
          feePorEmpleado: Number(clientFee),
          cupoTrabajadores: Number(clientCupo),
          beneficiosConfigurados: clientAdicionales ? clientAdicionales.split(',').map(b => b.trim()) : [],
          plantillaAsociada: `Layout_${clientPais.toUpperCase()}.csv`,
          condicionesFacturacion: clientCredito,
          correoContacto: clientCorreo,
          telefonoContacto: clientTelefono,
          nombreContacto: clientContacto,
          estado: 'Activo',
          descuentoVolumen: String(clientDescuento),
          solicitudVinculadaId: clientLinkedSolicitud || undefined,
          usuario: user.correo,

          // New custom fields
          servicio: clientServicioTipo,
          tipoCliente: clientTipoSocio,
          jerarquia: clientJerarquia,
          proyecto: clientProyecto,
          razonSocial: clientRazonSocial || clientEmpresa.trim(),
          cedulaJuridica: clientCedulaJuridica,
          direccion: clientDireccion,
          representanteLegal: repLegalName,
          documentoRepresentante: clientDocumentoRepresentante,
          fechaInicioContrato: clientFechaInicioContrato,
          posicion: clientPosicion,
          tipoFacturacion: clientTipoFacturacion,
          paisFacturacion: clientPaisFacturacion,
          cuentaBancariaId: clientCuentaBancariaId,
          cuentaBancariaDetalle: clientCuentaBancariaDetalle,
          credito: clientCredito,
          headcountProyecto: Number(clientHeadcountProyecto),
          frecuenciaNomina: clientFrecuenciaNomina,
          fechaInicio: clientFechaInicio,
          adicionales: clientAdicionales,
          adicionalesExtralegales: clientAdicionalesExtralegales,
          sociedadContratacion: clientSociedadContratacion,
          supraclienteId: clientJerarquia === 'Filial' ? (clientSupraclienteId || undefined) : clientJerarquia === 'Supra' ? 'supracliente-eor-peo@grupostt.com' : undefined,
          asesorAsignado: clientAsesorAsignado || undefined,
          idioma: clientIdioma
        });

        setNewlyCreatedClient(created);

        // Auto approve associated request if available
        if (clientLinkedSolicitud) {
          await api.updateSolicitud(clientLinkedSolicitud, {
            estado: 'Cliente creado',
            notasInternas: `Conversión completada. Empresa: ${clientEmpresa.trim()}`,
            usuario: user.correo
          });
        }
      } else if (showClientModal && typeof showClientModal === 'object') {
        const effectiveMotivo = clientMotivo.trim() || 'Actualización de datos del cliente por administrador';

        await api.updateCliente(showClientModal.id, {
          empresa: clientEmpresa.trim(),
          pais: clientPais,
          esRegional: clientPais === 'Regional',
          paisesOperacion: clientPais === 'Regional' ? clientPaisesOperacion : [clientPais],
          servicioContratado: clientServicio,
          moneda: clientMoneda,
          feePorEmpleado: Number(clientFee),
          cupoTrabajadores: Number(clientCupo),
          beneficiosConfigurados: clientAdicionales ? clientAdicionales.split(',').map(b => b.trim()) : [],
          condicionesFacturacion: clientCredito,
          correoContacto: clientCorreo,
          telefonoContacto: clientTelefono,
          nombreContacto: clientContacto,
          descuentoVolumen: String(clientDescuento),
          estado: clientEstado,
          motivo: effectiveMotivo,
          usuario: user.correo,

          // Allow modifying new fields on edit too
          servicio: clientServicioTipo,
          tipoCliente: clientTipoSocio,
          jerarquia: clientJerarquia,
          proyecto: clientProyecto,
          razonSocial: clientRazonSocial || clientEmpresa.trim(),
          cedulaJuridica: clientCedulaJuridica,
          direccion: clientDireccion,
          representanteLegal: repLegalName,
          documentoRepresentante: clientDocumentoRepresentante,
          fechaInicioContrato: clientFechaInicioContrato,
          posicion: clientPosicion,
          tipoFacturacion: clientTipoFacturacion,
          paisFacturacion: clientPaisFacturacion,
          cuentaBancariaId: clientCuentaBancariaId,
          cuentaBancariaDetalle: clientCuentaBancariaDetalle,
          credito: clientCredito,
          headcountProyecto: Number(clientHeadcountProyecto),
          frecuenciaNomina: clientFrecuenciaNomina,
          fechaInicio: clientFechaInicio,
          adicionales: clientAdicionales,
          adicionalesExtralegales: clientAdicionalesExtralegales,
          sociedadContratacion: clientSociedadContratacion,
          supraclienteId: clientJerarquia === 'Filial' ? (clientSupraclienteId || undefined) : clientJerarquia === 'Supra' ? 'supracliente-eor-peo@grupostt.com' : undefined,
          asesorAsignado: clientAsesorAsignado || undefined,
          idioma: clientIdioma
        });
      }

      setShowClientModal(null);
      setClientMotivo('');
      loadAllData();
    } catch (err: any) {
      setClientError(err.message || 'Error al guardar cliente.');
    }
  };

  // Save Manual Solicitud de EOR (Point 4)
  const handleCreateManualSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSolPais === 'Regional' && manualSolPaises.length === 0) {
      alert('Por favor selecciona al menos un país para la operación regional.');
      return;
    }
    try {
      await api.createSolicitud({
        empresa: manualSolEmpresa,
        pais: manualSolPais === 'Regional' ? 'Regional' : manualSolPais,
        esRegional: manualSolPais === 'Regional',
        paisesOperacion: manualSolPais === 'Regional' ? manualSolPaises : [manualSolPais],
        cantidadTrabajadores: Number(manualSolCantidad),
        servicioRequerido: manualSolServicio,
        nombreContacto: manualSolNombre,
        correo: manualSolCorreo,
        telefono: manualSolTelefono,
        observaciones: manualSolNotas,
        estado: 'Recibida'
      });

      setShowManualSolicitudModal(false);
      // Reset fields
      setManualSolEmpresa('');
      setManualSolPais('México');
      setManualSolPaises(['México', 'Colombia']);
      setManualSolCantidad(10);
      setManualSolNombre('');
      setManualSolCorreo('');
      setManualSolTelefono('');
      setManualSolNotas('');

      loadAllData();
    } catch (err: any) {
      alert('Error al crear la solicitud de EOR de forma manual: ' + err.message);
    }
  };

  // Create corporate benefit
  const handleCreateBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenefitError('');
    if (!benefitNombre.trim()) {
      setBenefitError('El nombre del beneficio es obligatorio.');
      return;
    }
    try {
      await api.createBeneficio({
        nombre: benefitNombre,
        tipo: benefitTipo,
        modalidad: benefitModalidad,
        moneda: benefitMoneda,
        costo: Number(benefitCosto),
        aplicaTrabajador: benefitAplicaTrabajador,
        aplicaCliente: benefitAplicaCliente,
        estado: benefitEstado,
        vigencia: benefitVigencia,
        usuario: user.correo
      });

      setShowBenefitModal(null);
      // Reset fields
      setBenefitNombre('');
      setBenefitTipo('Salud');
      setBenefitModalidad('Mensual');
      setBenefitMoneda('USD');
      setBenefitCosto(50);
      setBenefitAplicaTrabajador(true);
      setBenefitAplicaCliente(true);
      setBenefitEstado('Activo');
      setBenefitVigencia('2026-12-31');
      
      loadAllData();
    } catch (err: any) {
      setBenefitError('Error al crear beneficio: ' + (err.message || err));
    }
  };

  // Create contract requirement
  const handleCreateContractRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractError('');
    if (!contractTipo.trim() || !contractPlantillaNombre.trim()) {
      setContractError('Todos los campos obligatorios deben completarse.');
      return;
    }
    try {
      await api.createContratoRequisito({
        pais: contractPais,
        servicio: contractServicio,
        tipoContrato: contractTipo,
        plantillaNombre: contractPlantillaNombre,
        obligatorio: contractObligatorio,
        estado: contractEstado
      });

      setShowContractModal(null);
      // Reset fields
      setContractPais('México');
      setContractServicio('Employer of Record (EOR)');
      setContractTipo('Contrato de Trabajo por Tiempo Indeterminado');
      setContractPlantillaNombre('MX_EOR_INDETERMINADO_V2.docx');
      setContractObligatorio(true);
      setContractEstado('Activo');

      loadAllData();
    } catch (err: any) {
      setContractError('Error al crear requisito: ' + (err.message || err));
    }
  };

  // Run audit on employee onboarding
  const handleAuditWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuditError('');

    if (!showAuditModal) return;

    if (!auditMotivo.trim()) {
      setAuditError('Para fines de auditoría es obligatorio registrar el motivo o descripción del dictamen.');
      return;
    }

    try {
      await api.updateTrabajador(showAuditModal.id, {
        estado: auditEstado,
        observaciones: auditObservaciones || 'Aprobado sin observaciones.',
        motivo: auditMotivo,
        usuario: user.correo
      });

      setShowAuditModal(null);
      setAuditObservaciones('');
      setAuditMotivo('');
      loadAllData();
    } catch (err: any) {
      setAuditError(err.message || 'Error al procesar dictamen.');
    }
  };

  // Save social charge master
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialError('');

    try {
      if (showSocialModal === 'new') {
        await api.createCargaSocial({
          pais: socialPais,
          tipoCarga: socialTipo,
          porcentaje: Number(socialPorcentaje),
          responsablePago: socialResponsable,
          montoFijo: 0,
          tope: 0,
          vigencia: socialVigencia,
          usuario: user.correo
        });
      } else if (showSocialModal && typeof showSocialModal === 'object') {
        if (!socialMotivo.trim()) {
          setSocialError('Es obligatorio registrar el motivo para auditar este cambio regulatorio.');
          return;
        }

        await api.updateCargaSocial(showSocialModal.id, {
          pais: socialPais,
          tipoCarga: socialTipo,
          responsablePago: socialResponsable,
          porcentaje: Number(socialPorcentaje),
          vigencia: socialVigencia,
          estado: socialEstado,
          motivo: socialMotivo,
          usuario: user.correo
        });
      }

      setShowSocialModal(null);
      setSocialMotivo('');
      loadAllData();
    } catch (err: any) {
      setSocialError(err.message || 'Error al guardar carga social.');
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta tasa de carga social de forma permanente?')) {
      return;
    }
    try {
      await api.deleteCargaSocial(id, user.correo);
      loadAllData();
    } catch (err: any) {
      alert('Error al eliminar carga social: ' + (err.message || err));
    }
  };

  const handleCreateClientUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError('');
    setNewUserSuccess('');

    if (!selectedClientForUsers) return;

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setNewUserError('Por favor completa todos los campos.');
      return;
    }

    try {
      await api.createUsuario({
        correo: newUserEmail.trim(),
        nombre: newUserName.trim(),
        rol: 'cliente',
        clienteId: selectedClientForUsers.id,
        estado: 'Activo',
        usuario: user.correo
      });

      setNewUserSuccess(`Usuario creado exitosamente. Credenciales de acceso: Usuario: ${newUserEmail.trim()} | Contraseña: 123456. Se intentó el despacho vía alertas@grupostt.com.`);
      setNewUserName('');
      setNewUserEmail('');
      
      // Reload user list
      const updatedUsers = await api.getUsuarios().catch(() => []);
      setUsuarios(updatedUsers);
    } catch (err: any) {
      setNewUserError(err.message || 'Error al crear usuario.');
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

    if (sysUserRole === 'cliente' && !sysUserClientId) {
      setSysUserError('Debe seleccionar la empresa cliente vinculada.');
      return;
    }

    try {
      const selectedRoleObj = roles.find(r => r.id === sysUserRole);
      const roleDisplayName = selectedRoleObj ? selectedRoleObj.nombre : sysUserRole;
      const isReg = sysUserCountry === 'Regional';
      const isAdmOrMultiCountry = sysUserRole === 'administrador' || sysUserRole === 'supracliente' || sysUserRole === 'asesor_comercial' || sysUserRole === 'asesor';

      await api.createUsuario({
        correo: sysUserEmail.trim(),
        nombre: sysUserName.trim(),
        rol: sysUserRole,
        contrasena: sysUserPassword.trim() || '123456',
        clienteId: (sysUserRole === 'cliente' || sysUserRole === 'supracliente') ? (sysUserClientId || undefined) : undefined,
        pais: isReg ? 'Regional' : sysUserCountry,
        paisesAsignados: isAdmOrMultiCountry
          ? (sysUserAssignedCountries.length > 0 ? sysUserAssignedCountries : [...LATAM_COUNTRIES])
          : (isReg ? (sysUserAssignedCountries.length > 0 ? sysUserAssignedCountries : ['México']) : [sysUserCountry]),
        estado: 'Activo',
        idioma: sysUserLang,
        usuario: user.correo
      });

      const createdPass = sysUserPassword.trim() || '123456';
      setSysUserSuccess(`Usuario '${sysUserName.trim()}' creado exitosamente con el rol '${roleDisplayName}'. Credenciales: Correo: ${sysUserEmail.trim()} | Contraseña: ${createdPass}.`);
      setSysUserName('');
      setSysUserEmail('');
      setSysUserClientId('');
      setSysUserPassword('123456');
      setSysUserModalOpen(false);

      // Reload user list
      const updatedUsers = await api.getUsuarios().catch(() => []);
      setUsuarios(updatedUsers);
    } catch (err: any) {
      setSysUserError(err.message || 'Error al crear el usuario.');
    }
  };

  const handleUpdateUserRole = async (correo: string, newRol: string) => {
    setChangeRoleLoading(true);
    try {
      const selectedRoleObj = roles.find(r => r.id === newRol);
      const roleDisplayName = selectedRoleObj ? selectedRoleObj.nombre : newRol;

      await api.updateUsuario(correo, {
        rol: newRol,
        usuario: user.correo,
        motivo: `Rol reasignado a '${roleDisplayName}'`
      });

      const updatedUsers = await api.getUsuarios().catch(() => []);
      setUsuarios(updatedUsers);
      setRoleChangeModalUser(null);
      alert(`✓ Rol del usuario actualizado a '${roleDisplayName}'`);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el rol del usuario.');
    } finally {
      setChangeRoleLoading(false);
    }
  };

  // Save service base tariff
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
      }

      setShowTarifaModal(null);
      setTariffMotivo('');
      loadAllData();
    } catch (err: any) {
      setTariffError(err.message || 'Error al guardar tarifa.');
    }
  };

  // Generate monthly invoices
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError('');
    setGenSuccess('');

    if (!genClienteId) {
      setGenError('Selecciona un cliente para liquidar.');
      return;
    }

    try {
      const fac = await api.generarFactura({
        clienteId: genClienteId,
        periodo: genPeriodo,
        ivaPct: Number(genImpuesto),
        comisionPct: Number(genComisionPct),
        whtPct: Number(genWhtPct),
        otrosImpuestosPct: Number(genOtrosImpuestosPct),
        feePorEmpleado: genFeePorEmpleado !== '' ? Number(genFeePorEmpleado) : undefined,
        usuario: user.correo
      });

      setGenSuccess(`Factura liquidada con éxito! ID: ${fac.id} por ${fac.totalFacturado.toLocaleString()} ${fac.moneda}.`);
      loadAllData();
    } catch (err: any) {
      setGenError(err.message || 'Error liquidando factura para este periodo.');
    }
  };

  // Process USD Cash Payment activation validation
  const handleValidarPagoContado = async (pagoId: string, aprobado: boolean) => {
    try {
      setPagoReviewError('');
      if (!aprobado && !rechazoComentarios.trim()) {
        setPagoReviewError('Debe especificar un comentario o motivo de rechazo.');
        return;
      }
      await api.validarPagoContado(pagoId, {
        estado: aprobado ? 'Validado' : 'Rechazado',
        observaciones: aprobado ? 'Pago validado y verificado correctamente.' : rechazoComentarios,
        usuario: user.correo
      });
      setReviewPagoContado(null);
      setRechazoComentarios('');
      loadAllData();
    } catch (err: any) {
      setPagoReviewError(err.message || 'Error al procesar la validación.');
    }
  };

  // Country matching helper for global filter
  const checkCountryMatch = (itemPais?: string, isRegional?: boolean, opCountries?: string[]) => {
    if (countryFilter === 'All') return true;
    if (countryFilter === 'Regional') {
      if (isRegional || itemPais === 'Regional') {
        if (!regionalFilterCountries || regionalFilterCountries.length === 0) return true;
        const list = opCountries && opCountries.length > 0 ? opCountries : [];
        return list.length === 0 || list.some(p => regionalFilterCountries.includes(p));
      }
      return false;
    }
    // Specific single country filter selected (e.g. 'México', 'Colombia')
    if (itemPais === countryFilter) return true;
    if ((isRegional || itemPais === 'Regional') && opCountries && opCountries.includes(countryFilter)) return true;
    return false;
  };

  // Filter lists based on search queries & criteria
  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesSearch = s.empresa.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nombreContacto.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = checkCountryMatch(s.pais, s.esRegional, s.paisesOperacion);
    const matchesAsesor = user.rol !== 'asesor_comercial' || !s.asesorAsignado || s.asesorAsignado === user.correo;
    return matchesSearch && matchesCountry && matchesAsesor;
  });

  const filteredClientes = clientes.filter(c => {
    const supraName = c.supraclienteId ? (usuarios.find(u => u.correo.toLowerCase() === c.supraclienteId?.toLowerCase())?.nombre || '') : '';
    const matchesSearch = c.empresa.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (supraName && supraName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.nombreContacto && c.nombreContacto.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCountry = checkCountryMatch(c.pais, c.esRegional, c.paisesOperacion);
    
    let matchesAsesor = true;
    if (user.rol === 'asesor_comercial') {
      const linkedSol = solicitudes.find(s => s.id === c.solicitudVinculadaId);
      const isAssigned = linkedSol && linkedSol.asesorAsignado === user.correo;
      matchesAsesor = !!(isAssigned || !c.solicitudVinculadaId);
    }
    return matchesSearch && matchesCountry && matchesAsesor;
  });

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = !searchQuery || 
                          w.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.puesto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          w.correo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = (workerCountryFilter === 'All') 
      ? (countryFilter === 'All' ? true : countryFilter === 'Regional' ? (regionalFilterCountries.length === 0 || regionalFilterCountries.includes(w.pais)) : w.pais === countryFilter) 
      : w.pais === workerCountryFilter;
    const matchesClient = workerClientFilter === 'All' || w.clienteId === workerClientFilter;
    
    let matchesAsesor = true;
    if (user.rol === 'asesor_comercial') {
      const parentClient = clientes.find(c => c.id === w.clienteId);
      if (parentClient) {
        const linkedSol = solicitudes.find(s => s.id === parentClient.solicitudVinculadaId);
        matchesAsesor = !linkedSol || linkedSol.asesorAsignado === user.correo;
      }
    }
    return matchesSearch && matchesCountry && matchesClient && matchesAsesor;
  });

  // KPI Chart Data
  const getCountryChartData = () => {
    const countMap: Record<string, number> = {};
    workers.filter(w => w.estado === 'Activo').forEach(w => {
      countMap[w.pais] = (countMap[w.pais] || 0) + 1;
    });
    return Object.entries(countMap).map(([name, value]) => ({ name, value }));
  };

  const getBillingStatusData = () => {
    let paidTotal = 0;
    let pendingTotal = 0;
    facturas.forEach(f => {
      if (f.estado === 'Pagada') {
        paidTotal += f.totalFacturado;
      } else {
        pendingTotal += f.saldoPendiente;
      }
    });

    return [
      { name: 'Pagado', value: Math.round(paidTotal) },
      { name: 'Pendiente', value: Math.round(pendingTotal) }
    ];
  };

  const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  const BILLING_COLORS = ['#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div id="admin-loading-spinner" className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm font-semibold">{commonT.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-root" className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col md:flex-row">
      {/* Left Persistent Sidebar (Desktop) */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col border-r border-indigo-950">
        {/* Branding logo */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
            QH
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">Quick Hire EOR</h1>
            <p className="text-[10px] text-indigo-300">Admin Control Center</p>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 text-[11px] space-y-1">
          <div className="text-slate-300 font-semibold">{user.nombre}</div>
          <div className="text-[10px] text-indigo-400 capitalize font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {currentRoleDef?.nombre || user.rol.replace('_', ' ')}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
          {/* 1. Panel de Control */}
          {isMenuVisible('kpis') && (
            <button
              onClick={() => { setActiveTab('kpis'); setSearchQuery(''); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'kpis' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Panel de Control</span>
              </div>
            </button>
          )}

          {/* 2. Operación EOR */}
          {(isMenuVisible('solicitudes') || isMenuVisible('clientes') || isMenuVisible('trabajadores') || isMenuVisible('directorio')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('operacion')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Operación EOR</span>
                </div>
                {expandedGroups.operacion ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.operacion && (
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
                        <span>Solicitudes EOR</span>
                      </div>
                      {solicitudes.filter(s => s.estado === 'Recibida').length > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          {solicitudes.filter(s => s.estado === 'Recibida').length}
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
                        <span>Clientes</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('trabajadores') && (
                    <button
                      onClick={() => { setActiveTab('trabajadores'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'trabajadores' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>Trabajadores</span>
                      </div>
                      {workers.filter(w => w.estado === 'En revisión').length > 0 && (
                        <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {workers.filter(w => w.estado === 'En revisión').length}
                        </span>
                      )}
                    </button>
                  )}

                  {isMenuVisible('directorio') && (
                    <button
                      onClick={() => { setActiveTab('directorio'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'directorio' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Contact className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                        <span>Directorio de Actores</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Finanzas y Pagos */}
          {(isMenuVisible('billing') || isMenuVisible('fees') || isMenuVisible('exchange') || isMenuVisible('cuentas_bancarias') || isMenuVisible('iva_wht_renta')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('finanzas')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Finanzas y Pagos</span>
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
                        <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
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

                  {isMenuVisible('exchange') && (
                    <button
                      onClick={() => { setActiveTab('exchange'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'exchange' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Tipos de Cambio</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('cuentas_bancarias') && (
                    <button
                      onClick={() => { setActiveTab('cuentas_bancarias'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'cuentas_bancarias' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Landmark className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                        <span>Cuentas Bancarias</span>
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

          {/* 4. Legal y Plantillas */}
          {(isMenuVisible('masters') || isMenuVisible('contracts') || isMenuVisible('plantillas')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('legal')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <FileSignature className="w-3.5 h-3.5 text-blue-400" />
                  <span>Legal y Plantillas</span>
                </div>
                {expandedGroups.legal ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.legal && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-blue-500/30 ml-2">
                  {isMenuVisible('masters') && (
                    <button
                      onClick={() => { setActiveTab('masters'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'masters' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Matrices Reguladoras</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('contracts') && (
                    <button
                      onClick={() => { setActiveTab('contracts'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'contracts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <FileSignature className="w-3.5 h-3.5 shrink-0" />
                        <span>Contratos EOR</span>
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
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Directorio de Plantillas</span>
                      </div>
                      <span className="bg-indigo-500/30 text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        {plantillasContrato.length + plantillasNotificacion.length}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Soporte y SLA */}
          {(isMenuVisible('tickets') || isMenuVisible('sla') || isMenuVisible('operational_alerts') || isMenuVisible('notifications')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('soporte')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Soporte y SLA</span>
                </div>
                {expandedGroups.soporte ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.soporte && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-amber-500/30 ml-2">
                  {isMenuVisible('tickets') && (
                    <button
                      onClick={() => { setActiveTab('tickets'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>Tickets y Casos</span>
                      </div>
                      {tickets.filter(t => t.estado === 'Nuevo' || t.estado === 'En revisión').length > 0 && (
                        <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          {tickets.filter(t => t.estado === 'Nuevo' || t.estado === 'En revisión').length}
                        </span>
                      )}
                    </button>
                  )}

                  {isMenuVisible('sla') && (
                    <button
                      onClick={() => { setActiveTab('sla'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'sla' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Mantenimiento SLA</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('operational_alerts') && (
                    <button
                      onClick={() => { setActiveTab('operational_alerts'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'operational_alerts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Alertas Operativas</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('notifications') && (
                    <button
                      onClick={() => { setActiveTab('notifications'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Bell className="w-3.5 h-3.5 shrink-0" />
                        <span>Notificaciones</span>
                      </div>
                      {alertasNotificacion.filter(a => !a.leido).length > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                          {alertasNotificacion.filter(a => !a.leido).length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. Reportes y Auditoría */}
          {(isMenuVisible('reports') || isMenuVisible('logs')) && (
            <div className="pt-1">
              <button
                onClick={() => toggleGroup('reportes')}
                className="w-full text-left px-3 py-2 rounded-lg font-extrabold text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reportes y Auditoría</span>
                </div>
                {expandedGroups.reportes ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {expandedGroups.reportes && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-purple-500/30 ml-2">
                  {isMenuVisible('reports') && (
                    <button
                      onClick={() => { setActiveTab('reports'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Reportes de Gestión</span>
                      </div>
                    </button>
                  )}

                  {isMenuVisible('logs') && (
                    <button
                      onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                        activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <History className="w-3.5 h-3.5 shrink-0" />
                        <span>Trazabilidad</span>
                      </div>
                    </button>
                  )}
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
                      <span>Gestión de Usuarios</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold bg-slate-950/20 text-center">
          Quick Hire EOR &bull; v2.2
        </div>
      </aside>

      {/* Right Main Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Content Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === 'kpis' && (i18n[lang].menu.dashboard || tText('Dashboard Central', lang))}
              {activeTab === 'solicitudes' && tText('Prospectos y Solicitudes EOR', lang)}
              {activeTab === 'clientes' && tText('Directorio de Clientes Activos', lang)}
              {activeTab === 'trabajadores' && tText('Nómina y Colaboradores Locales', lang)}
              {activeTab === 'billing' && tText('Facturación y Control de Pagos', lang)}
              {activeTab === 'masters' && tText('Matrices y Carga Social Reguladora', lang)}
              {activeTab === 'contracts' && tText('Módulo de Contratos y Compliance', lang)}
              {activeTab === 'plantillas' && tText('Directorio Central de Plantillas y Modelos', lang)}
              {activeTab === 'exchange' && tText('Módulo Cambiario de Divisas', lang)}
              {activeTab === 'tickets' && tText('Módulo de Soporte y Tickets', lang)}
              {activeTab === 'notifications' && tText('Buzón de Notificaciones y Alertas', lang)}
              {activeTab === 'logs' && tText('Logs de Auditoría de Cumplimiento', lang)}
              {activeTab === 'dictionary' && tText('Diccionario de Traducción Multilenguaje', lang)}
              {activeTab === 'users' && tText('Gestión de Usuarios', lang)}
              {activeTab === 'fees' && tText('Estructura y Gestión de Fees por País', lang)}
              {activeTab === 'directorio' && tText('Directorio de Actores del Servicio', lang)}
              {activeTab === 'cuentas_bancarias' && tText('Maestro de Cuentas Bancarias', lang)}
              {activeTab === 'iva_wht_renta' && tText('Matriz Tributaria: IVA - WHT y Renta', lang)}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold">
              {tText('Responsable de sesión:', lang)} <strong className="text-slate-700">{user.nombre}</strong> ({translateRole(user.rol, lang)})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton />
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
              onClick={onLogout}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl transition-all border border-rose-100 font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{i18n[lang].auth.logout}</span>
            </button>
          </div>
        </header>

        {/* USER MANUAL MODAL */}
        <UserManualModal 
          user={user} 
          lang={lang} 
          isOpen={isManualOpen} 
          onClose={() => setIsManualOpen(false)}
        />

        {/* Main Grid content inside sidebar layout */}
        <div className="flex-1 p-4 md:p-6 space-y-6">
        
        {/* KPI VIEW PANEL */}
        {activeTab === 'kpis' && (
          <div id="admin-tab-kpis" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">{lang === 'es' ? 'Indicadores Operativos' : lang === 'en' ? 'Operational Metrics' : 'Indicadores Operacionais'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">{adminT.activeClients}</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {clientes.filter(c => c.estado === 'Activo').length}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {tr('De', 'Out of', 'De', lang)} {clientes.length} {tr('empresas totales', 'total companies', 'empresas totais', lang)}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">{adminT.activeWorkers}</span>
                <span className="text-3xl font-black text-indigo-600 mt-1 block">
                  {workers.filter(w => w.estado === 'Activo').length}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {workers.filter(w => w.estado === 'En revisión').length} {tr('solicitudes de alta pendientes', 'pending registration requests', 'solicitações pendentes', lang)}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">{tr('Prospectos Recibidos', 'Received Leads', 'Prospectos Recebidos', lang)}</span>
                <span className="text-3xl font-black text-amber-600 mt-1 block">
                  {solicitudes.filter(s => s.estado === 'Recibida').length}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {tr('De', 'Out of', 'De', lang)} {solicitudes.length} {tr('registros totales', 'total records', 'registros totais', lang)}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">{tr('Facturado Pendiente', 'Pending Invoiced', 'Faturamento Pendente', lang)}</span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block">
                  $ {facturas.reduce((acc, f) => acc + (f.estado !== 'Pagada' ? f.saldoPendiente : 0), 0).toLocaleString()} USD
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">En periodo corriente de nómina</span>
              </div>
            </div>

            {/* Charts using recharts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Distribución de Trabajadores por País
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getCountryChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getCountryChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Cumplimiento de Cobro de Facturación
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getBillingStatusData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      >
                        {getBillingStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BILLING_COLORS[index % BILLING_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH AND FILTERS GRID FOR CONCRETE DATA VIEWS */}
        {activeTab !== 'kpis' && activeTab !== 'masters' && activeTab !== 'logs' && activeTab !== 'fees' && activeTab !== 'directorio' && activeTab !== 'cuentas_bancarias' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por empresa, contacto o ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(e) => {
                const val = e.target.value;
                setCountryFilter(val);
                if (val === 'Regional' && regionalFilterCountries.length === 0) {
                  setRegionalFilterCountries([...LATAM_COUNTRIES]);
                }
              }}
              className={`px-3 py-2 border rounded-xl font-bold w-full md:w-auto transition-all cursor-pointer ${
                countryFilter === 'Regional'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 ring-1 ring-indigo-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">País: {commonT.all}</option>
              <option value="Regional" className="font-bold text-indigo-700">
                🌎 Regional (Multi-país LATAM)
              </option>
              <optgroup label="Países Individuales">
                {LATAM_COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {COUNTRY_FLAGS[c] ? `${COUNTRY_FLAGS[c]} ` : ''}{c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        {/* DESPLIEGUE REGIONAL EN FILTRO GLOBAL */}
        {activeTab !== 'kpis' && activeTab !== 'masters' && activeTab !== 'logs' && activeTab !== 'fees' && activeTab !== 'directorio' && activeTab !== 'cuentas_bancarias' && countryFilter === 'Regional' && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/90 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs shadow-xs">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Filtro de Cobertura Regional</span>
                    <span className="text-[9px] bg-indigo-200/80 text-indigo-900 font-black px-2 py-0.5 rounded-full">
                      {regionalFilterCountries.length} de {LATAM_COUNTRIES.length} países
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Filtra prospectos, clientes, nóminas y contratos regionales que operen en los países seleccionados:
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRegionalFilterCountries([...LATAM_COUNTRIES])}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shadow-xs cursor-pointer transition-all"
                >
                  ✓ Todos (18)
                </button>
                <button
                  type="button"
                  onClick={() => setRegionalFilterCountries([])}
                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs cursor-pointer transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Chips interactivos de países */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {LATAM_COUNTRIES.map(c => {
                const isSel = regionalFilterCountries.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (isSel) setRegionalFilterCountries(regionalFilterCountries.filter(p => p !== c));
                      else setRegionalFilterCountries([...regionalFilterCountries, c]);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                      isSel
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span>{COUNTRY_FLAGS[c] || '🌎'}</span>
                    <span>{c}</span>
                    {isSel && <span className="text-[8px] ml-0.5 font-black">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SOLICITUDES DE EOR / PROSPECT CLIENTS */}
        {activeTab === 'solicitudes' && (
          <div id="admin-tab-solicitudes" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-sans">Solicitudes de EOR (Leads)</h2>
                <p className="text-slate-500 text-xs mt-0.5">Controla, analiza y convierte prospectos de servicio Employer of Record en Clientes Activos.</p>
              </div>
              <button
                onClick={() => setShowManualSolicitudModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md"
              >
                <span>+ Crear Solicitud Manual</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">País</th>
                    <th className="px-4 py-3">Trabajadores Estimados</th>
                    <th className="px-4 py-3">Servicio Requerido</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSolicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-semibold">
                        No hay solicitudes coincidentes con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredSolicitudes.map((sol) => (
                      <tr key={sol.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-bold text-slate-900">{sol.empresa}</div>
                            <div className="text-[10px] text-slate-500">{sol.nombreContacto} ({sol.correo})</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {sol.esRegional || sol.pais === 'Regional' ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center space-x-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] w-fit">
                                <span>🌎 Regional</span>
                              </span>
                              {sol.paisesOperacion && sol.paisesOperacion.length > 0 && (
                                <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[180px]" title={sol.paisesOperacion.join(', ')}>
                                  {sol.paisesOperacion.length} países: {sol.paisesOperacion.join(', ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {COUNTRY_FLAGS[sol.pais] ? `${COUNTRY_FLAGS[sol.pais]} ` : ''}{sol.pais}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-slate-950">{sol.cantidadTrabajadores}</td>
                        <td className="px-4 py-4">{sol.servicioRequired || sol.servicioRequerido}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sol.estado === 'Recibida' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            sol.estado === 'En análisis' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            sol.estado === 'Procesada' || sol.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {sol.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setShowSolicitudModal(sol)}
                              className="inline-flex items-center space-x-1 border border-slate-200 bg-white hover:border-indigo-200 text-indigo-600 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:bg-indigo-50/40"
                            >
                              <span>Dictaminar / Crear Cliente</span>
                            </button>
                            <button
                              onClick={() => setSolicitudToDelete({ id: sol.id, empresa: sol.empresa })}
                              title="Eliminar Lead permanentemente"
                              className="p-1.5 border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
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

        {/* TAB 3: CLIENTES ONBOARDING & EDITS */}
        {activeTab === 'clientes' && (
          <div id="admin-tab-clientes" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Directorio de Clientes Corporativos</h2>
                <p className="text-slate-500 text-xs mt-0.5">Controla suscripciones, cupos máximos, descuentos de volumen y el estatus crediticio de tus clientes.</p>
              </div>
              <button
                onClick={() => {
                  setClientEmpresa('');
                  setClientPais('México');
                  setClientServicio('Employer of Record (EOR)');
                  setClientMoneda('USD');
                  setClientCupo(10);
                  setClientHeadcountProyecto(10);
                  autoCalculateClientFee('México', 10);
                  setClientCorreo('');
                  setClientTelefono('');
                  setClientContacto('');
                  setClientDescuento(0);
                  setClientLinkedSolicitud('');
                  setClientEstado('Activo');
                  setClientMotivo('');

                  // Clean new custom fields as well
                  setClientServicioTipo('EOR');
                  setClientTipoSocio('Directo');
                  setClientJerarquia('Directo');
                  setClientProyecto('');
                  setClientRazonSocial('');
                  setClientCedulaJuridica('');
                  setClientDireccion('');
                  setClientFechaInicioContrato(new Date().toISOString().split('T')[0]);
                  setClientPosicion('');
                  setClientTipoFacturacion('Local');
                  setClientPaisFacturacion('México');
                  autoSelectAccount('México', 'USD');
                  setClientCredito('10 días');
                  setClientFrecuenciaNomina('Mensual');
                  setClientFechaInicio(new Date().toISOString().split('T')[0]);
                  setClientAdicionales('');
                  setClientAdicionalesExtralegales('');
                  setClientSociedadContratacion('');
                  setClientRepresentanteLegal('');
                  setClientDocumentoRepresentante('');
                  setClientSupraclienteId('');
                  setClientAsesorAsignado('');
                  setClientIdioma('es');

                  setShowClientModal('new');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Cliente Nuevo</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">País de Operación</th>
                    <th className="px-4 py-3">EOR Fee Base</th>
                    <th className="px-4 py-3">Colaboradores</th>
                    <th className="px-4 py-3">Descuento Volumen</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClientes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-semibold">
                        No hay clientes coincidentes.
                      </td>
                    </tr>
                  ) : (
                    filteredClientes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-55 transition-all">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-bold text-slate-900">{c.empresa}</div>
                            <div className="text-[10px] text-slate-500">ID: {c.id} | {c.nombreContacto}</div>
                            {c.supraclienteId && (
                              <div className="mt-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Holding: {
                                    clientes.find(cl => cl.id === c.supraclienteId || cl.empresa.toLowerCase() === c.supraclienteId?.toLowerCase())?.empresa ||
                                    (c.supraclienteId === 'CLI-876' || c.supraclienteId.toLowerCase().includes('pagus') ? 'PAGUS LLC' : '') ||
                                    (c.supraclienteId === 'supracliente-eor-peo@grupostt.com' ? 'Supra Cliente Global Holding' : c.supraclienteId)
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {c.esRegional || c.pais === 'Regional' ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center space-x-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] w-fit shadow-2xs">
                                <span>🌎 Regional</span>
                              </span>
                              {c.paisesOperacion && c.paisesOperacion.length > 0 && (
                                <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[180px]" title={c.paisesOperacion.join(', ')}>
                                  {c.paisesOperacion.length} países: {c.paisesOperacion.join(', ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {COUNTRY_FLAGS[c.pais] ? `${COUNTRY_FLAGS[c.pais]} ` : ''}{c.pais}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-slate-900">
                          {c.feePorEmpleado.toLocaleString()} {c.moneda}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          <span className="font-bold text-slate-900">{workers.filter(w => w.clienteId === c.id).length}</span>
                          <span className="text-[10px] text-slate-500 block">({workers.filter(w => w.clienteId === c.id && w.estado === 'Activo').length} activos)</span>
                        </td>
                        <td className="px-4 py-4 text-emerald-600 font-bold">
                          {c.descuentoVolumen}%
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            c.estado === 'En mora' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => {
                              setClientEmpresa(c.empresa);
                              setClientPais(c.pais);
                              setClientPaisesOperacion(c.paisesOperacion && c.paisesOperacion.length > 0 ? c.paisesOperacion : (c.pais === 'Regional' ? ['México', 'Colombia'] : [c.pais]));
                              setClientServicio(c.servicioContratado);
                              setClientMoneda(c.moneda);
                              setClientFee(c.feePorEmpleado);
                              setClientCupo(c.cupoTrabajadores);
                              setClientCorreo(c.correoContacto);
                              setClientTelefono(c.telefonoContacto);
                              setClientContacto(c.nombreContacto);
                              setClientDescuento(c.descuentoVolumen);
                              setClientLinkedSolicitud(c.solicitudVinculadaId || '');
                              setClientEstado(c.estado);
                              setClientMotivo('');

                              // Load new custom properties
                              setClientServicioTipo(c.servicio || 'EOR');
                              setClientTipoSocio(c.tipoCliente === 'Partners' ? 'Partners' : 'Directo');
                              if (c.jerarquia === 'Supra' || c.tipoCliente === 'Holding' || c.tipoCliente === 'Supra' || c.id === 'CLI-876' || (c.empresa && c.empresa.toLowerCase().includes('pagus')) || c.supraclienteId === 'supracliente-eor-peo@grupostt.com') {
                                setClientJerarquia('Supra');
                                setClientSupraclienteId('supracliente-eor-peo@grupostt.com');
                              } else if (c.jerarquia === 'Filial' || (c.supraclienteId && c.supraclienteId !== 'supracliente-eor-peo@grupostt.com')) {
                                setClientJerarquia('Filial');
                                setClientSupraclienteId(c.supraclienteId);
                              } else {
                                setClientJerarquia('Directo');
                                setClientSupraclienteId('');
                              }
                              setClientProyecto(c.proyecto || '');
                              setClientRazonSocial(c.razonSocial || '');
                              setClientCedulaJuridica(c.cedulaJuridica || '');
                              setClientDireccion(c.direccion || '');
                              setClientFechaInicioContrato(c.fechaInicioContrato || '');
                              setClientPosicion(c.posicion || '');
                              const tFact = c.tipoFacturacion || (c.paisFacturacion && c.paisFacturacion !== c.pais ? 'Internacional' : 'Local');
                              setClientTipoFacturacion(tFact);
                              const pFact = c.paisFacturacion || c.pais;
                              setClientPaisFacturacion(pFact);
                              setClientCuentaBancariaId(c.cuentaBancariaId || '');
                              setClientCuentaBancariaDetalle(c.cuentaBancariaDetalle || '');
                              if (!c.cuentaBancariaId) {
                                autoSelectAccount(pFact, c.moneda);
                              }
                              setClientFeeInfo(`Fee acordado: $${c.feePorEmpleado} ${c.moneda}/mes por talento (Cupo: ${c.cupoTrabajadores})`);
                              setClientCredito(c.credito || '10 días');
                              setClientHeadcountProyecto(c.headcountProyecto || 1);
                              setClientFrecuenciaNomina(c.frecuenciaNomina || 'Mensual');
                              setClientFechaInicio(c.fechaInicio || '');
                              setClientAdicionales(c.adicionales || '');
                              setClientAdicionalesExtralegales(c.adicionalesExtralegales || '');
                              setClientSociedadContratacion(c.sociedadContratacion || '');
                              setClientRepresentanteLegal(c.representanteLegal || c.nombreContacto || '');
                              setClientDocumentoRepresentante(c.documentoRepresentante || '');
                              setClientAsesorAsignado(c.asesorAsignado || '');
                              setClientIdioma(c.idioma || 'es');

                              setShowClientModal(c);
                            }}
                            className="inline-flex items-center space-x-1 border border-indigo-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-300 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shadow-3xs cursor-pointer"
                            title="Editar datos, razón social, país y propietario del cliente"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClientForUsers(c);
                            }}
                            className="inline-flex items-center space-x-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ml-1.5 cursor-pointer"
                          >
                            <span>Usuarios</span>
                          </button>
                          <button
                            onClick={() => {
                              setInitialPrepClientId(c.id);
                              setActiveTab('contracts');
                            }}
                            className="inline-flex items-center space-x-1 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ml-1.5 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 shrink-0" />
                            <span>Preparar Contrato</span>
                          </button>
                          <button
                            onClick={() => setClienteToDelete(c)}
                            title="Eliminar Cliente permanentemente"
                            className="p-1.5 border border-rose-200 hover:border-rose-400 bg-rose-50/70 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer ml-1.5 inline-flex items-center justify-center shadow-3xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* TAB 4: AUDITORÍA DE TRABAJADORES (ALTA / DICTAMEN) */}
        {activeTab === 'trabajadores' && (
          <div id="admin-tab-trabajadores" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Control de Altas y Auditoría Laboral</h2>
                <p className="text-slate-500 text-xs mt-0.5">Trabajadores agrupados y filtrados por Empresa Cliente y País para control operativo eficiente.</p>
              </div>

              {/* Filter controls by Client and Country */}
              <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (!filteredWorkers || filteredWorkers.length === 0) {
                      alert('No hay trabajadores para exportar con los filtros seleccionados.');
                      return;
                    }
                    const headers = [
                      'ID Colaborador',
                      'Cliente ID',
                      'Empresa Cliente',
                      'Proyecto',
                      'Nombre Completo',
                      'Correo Electrónico',
                      'Documento Identidad',
                      'País',
                      'Puesto / Cargo',
                      'Modalidad',
                      'Fecha Ingreso',
                      'Salario Bruto',
                      'Moneda',
                      'Cargas Sociales Patronales (%)',
                      'Monto Cargas Sociales ($)',
                      'Fee EOR ($)',
                      'Impuestos Locales ($)',
                      'Costo Total Talento ($)',
                      'Estado'
                    ];
                    const rows = filteredWorkers.map(w => {
                      const cost = w.detallesCostos || calcularCostoTalento(w.salario, w.pais, w.moneda);
                      return [
                        `"${w.id}"`,
                        `"${w.clienteId}"`,
                        `"${w.clienteNombre || ''}"`,
                        `"${w.proyecto || 'General'}"`,
                        `"${w.nombre}"`,
                        `"${w.correo}"`,
                        `"${w.documentoIdentidad || 'N/A'}"`,
                        `"${w.pais}"`,
                        `"${w.puesto}"`,
                        `"${w.modalidadTrabajo || 'Remoto'}"`,
                        `"${w.fechaIngreso || ''}"`,
                        w.salario || 0,
                        `"${w.moneda || 'USD'}"`,
                        w.cargasSocialesPatronalesPct || cost.cargasSocialesPatronalesPct || 0,
                        w.cargasSocialesMonto || cost.cargasSocialesMonto || 0,
                        w.feeMonto || (cost as any).feeServicioMonto || 0,
                        w.impuestosMonto || (cost as any).impuestosMonto || 0,
                        w.costoTotalTalento || (cost as any).costoTotal || (cost as any).costoTotalTalento || (w.salario * 1.3),
                        `"${w.estado}"`
                      ].join(',');
                    });
                    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `Auditoria_Nomina_Colaboradores_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                  title="Descargar reporte consolidado de colaboradores en CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar CSV</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-600 text-[11px]">Cliente:</span>
                  <select
                    value={workerClientFilter}
                    onChange={(e) => setWorkerClientFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white text-slate-900"
                  >
                    <option value="All">🏢 Todos los Clientes ({clientes.length})</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa} ({c.pais})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-600 text-[11px]">País:</span>
                  <select
                    value={workerCountryFilter}
                    onChange={(e) => setWorkerCountryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white text-slate-900"
                  >
                    <option value="All">🌍 Todos los Países</option>
                    {ALL_COUNTRIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grouped Worker Tables by Client and Country */}
            {filteredWorkers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-500">No hay trabajadores que coincidan con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(new Set(filteredWorkers.map(w => w.clienteId))).map(cId => {
                  const clientObj = clientes.find(c => c.id === cId);
                  const clientWorkers = filteredWorkers.filter(w => w.clienteId === cId);
                  
                  // Group workers within this client by country
                  const countriesInClient = Array.from(new Set(clientWorkers.map(w => w.pais)));

                  return (
                    <div key={cId} className="border border-indigo-100 rounded-2xl overflow-hidden shadow-xs bg-slate-50/50">
                      {/* Client Header Banner */}
                      <div className="bg-indigo-900 text-white px-5 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-800 rounded-xl">
                            <Building2 className="w-4 h-4 text-indigo-300" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm tracking-wide text-white">{clientObj?.empresa || 'Cliente Corporativo'}</h3>
                            <p className="text-[10px] text-indigo-200 font-medium">ID Cliente: {cId} | Contacto: {clientObj?.nombreContacto || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-800/80 text-indigo-100 text-[11px] font-bold px-3 py-1 rounded-full border border-indigo-700">
                            {clientWorkers.length} {clientWorkers.length === 1 ? 'Trabajador' : 'Trabajadores'}
                          </span>
                        </div>
                      </div>

                      {/* Render worker tables for each country of this client */}
                      <div className="p-4 space-y-4 bg-white">
                        {countriesInClient.map(country => {
                          const workersInCountry = clientWorkers.filter(w => w.pais === country);
                          return (
                            <div key={country} className="space-y-2 border-b border-slate-100 last:border-b-0 pb-3 last:pb-0">
                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>País: {country}</span>
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {workersInCountry.length} registrados
                                </span>
                              </div>

                              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                                <table className="w-full text-left text-xs text-slate-600">
                                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold">
                                    <tr>
                                      <th className="px-3 py-2.5">Colaborador</th>
                                      <th className="px-3 py-2.5">Puesto / Modilidad</th>
                                      <th className="px-3 py-2.5">Salario</th>
                                      <th className="px-3 py-2.5">Estado</th>
                                      <th className="px-3 py-2.5 text-right">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {workersInCountry.map((w) => (
                                      <tr key={w.id} className="hover:bg-slate-50 transition-all">
                                        <td className="px-3 py-3">
                                          <div>
                                            <div className="font-bold text-slate-900">{w.nombre}</div>
                                            <div className="text-[10px] text-slate-500">{w.correo} | Ingreso: {w.fechaIngreso}</div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div>
                                            <div className="font-semibold text-slate-800">{w.puesto}</div>
                                            <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-500">{w.modalidadTrabajo}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 font-mono font-bold text-slate-900">
                                          {w.salario.toLocaleString()} {w.moneda}
                                        </td>
                                        <td className="px-3 py-3">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            w.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            w.estado === 'En revisión' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                            'bg-rose-50 text-rose-700 border border-rose-100'
                                          }`}>
                                            {w.estado}
                                          </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                          <button
                                            onClick={() => {
                                              setAuditEstado(w.estado as any);
                                              setAuditObservaciones(w.observaciones || '');
                                              setAuditMotivo('');
                                              setShowAuditModal(w);
                                            }}
                                            className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-xs"
                                          >
                                            <span>Auditar / Dictaminar</span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BILLING GENERATOR & EMISSIONS */}
        {activeTab === 'billing' && (
          <div id="admin-tab-billing" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Liquidator form */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>Liquidador de Nómina y Fee EOR</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Liquida masivamente el mes para generar los borradores de cobro para el cliente. Incorpora los sueldos consolidados, beneficios aplicables y cargas de seguro social por país.
              </p>

              <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
                {genError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">{genError}</div>}
                {genSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold">{genSuccess}</div>}

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Cliente Corporativo</label>
                  <select
                    value={genClienteId}
                    onChange={(e) => setGenClienteId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                  >
                    <option value="">-- Selecciona Cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.empresa} ({c.pais})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Periodo Liquidado</label>
                  <input
                    type="text"
                    value={genPeriodo}
                    onChange={(e) => setGenPeriodo(e.target.value)}
                    placeholder="2026-07"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tasa IVA (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={genImpuesto}
                      onChange={(e) => setGenImpuesto(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Comisión Bancaria (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={genComisionPct}
                      onChange={(e) => setGenComisionPct(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Retención WHT (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={genWhtPct}
                      onChange={(e) => setGenWhtPct(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Otros Impuestos (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={genOtrosImpuestosPct}
                      onChange={(e) => setGenOtrosImpuestosPct(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Fee EOR Unitario USD (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Escribir monto personalizado o dejar vacío..."
                    value={genFeePorEmpleado}
                    onChange={(e) => setGenFeePorEmpleado(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                  />
                  <span className="text-[9px] text-slate-400 block">Si se deja en blanco, usará el fee por omisión del cliente.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md"
                >
                  Liquidar e Iniciar Cobro
                </button>
              </form>

              {/* Parametrizar Detalles de Factura Section (Point 3) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 space-y-3 text-xs">
                <strong className="text-indigo-900 block font-black uppercase text-[10px] tracking-wider">Parametrización de Facturas (Global)</strong>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">IVA Global:</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={billingConfig.ivaPct}
                        onChange={(e) => setBillingConfig({ ...billingConfig, ivaPct: Number(e.target.value) })}
                        className="w-12 bg-white border border-slate-200 px-1 py-0.5 rounded text-center font-mono font-bold"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Comisión Bancaria:</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={billingConfig.comisionPct}
                        onChange={(e) => setBillingConfig({ ...billingConfig, comisionPct: Number(e.target.value) })}
                        className="w-12 bg-white border border-slate-200 px-1 py-0.5 rounded text-center font-mono font-bold"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Retención de WHT:</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={billingConfig.whtPct}
                        onChange={(e) => setBillingConfig({ ...billingConfig, whtPct: Number(e.target.value) })}
                        className="w-12 bg-white border border-slate-200 px-1 py-0.5 rounded text-center font-mono font-bold"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Otros Impuestos:</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={billingConfig.impuestoPct}
                        onChange={(e) => setBillingConfig({ ...billingConfig, impuestoPct: Number(e.target.value) })}
                        className="w-12 bg-white border border-slate-200 px-1 py-0.5 rounded text-center font-mono font-bold"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.updateConfiguracionFactura(billingConfig);
                      alert('Parámetros de facturación actualizados exitosamente en la base de datos.');
                    } catch (err: any) {
                      alert('Error al guardar configuración: ' + err.message);
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-xl transition-all text-[11px]"
                >
                  Guardar Parámetros
                </button>
              </div>
            </div>

            {/* Invoices List */}
            <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Historial General de Liquidaciones / Facturas</h3>
                
                {/* Filter controls by Client and Country */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-slate-500 text-[10px]">Cliente:</span>
                    <select
                      value={facturaClientFilter}
                      onChange={(e) => setFacturaClientFilter(e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white"
                    >
                      <option value="All">🏢 Todos los Clientes</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.empresa}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-slate-500 text-[10px]">País:</span>
                    <select
                      value={facturaCountryFilter}
                      onChange={(e) => setFacturaCountryFilter(e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white"
                    >
                      <option value="All">🌍 Todos los Países</option>
                      {ALL_COUNTRIES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto border border-slate-100 rounded-2xl text-xs">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-3 py-3">ID Factura</th>
                      <th className="px-3 py-3">Cliente / País</th>
                      <th className="px-3 py-3">Periodo</th>
                      <th className="px-3 py-3">Monto Total</th>
                      <th className="px-3 py-3">Pendiente</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {facturas.filter(f => {
                      const cl = clientes.find(c => c.id === f.clienteId);
                      const fCountry = f.pais || cl?.pais || '';
                      const matchesClient = facturaClientFilter === 'All' || f.clienteId === facturaClientFilter;
                      const matchesCountry = facturaCountryFilter === 'All' || fCountry === facturaCountryFilter;
                      const matchesSearch = !searchQuery || 
                                            f.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            f.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (cl && cl.empresa.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchesClient && matchesCountry && matchesSearch;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-slate-500 font-medium">No hay facturas que coincidan con los filtros seleccionados.</td>
                      </tr>
                    ) : (
                      facturas.filter(f => {
                        const cl = clientes.find(c => c.id === f.clienteId);
                        const fCountry = f.pais || cl?.pais || '';
                        const matchesClient = facturaClientFilter === 'All' || f.clienteId === facturaClientFilter;
                        const matchesCountry = facturaCountryFilter === 'All' || fCountry === facturaCountryFilter;
                        const matchesSearch = !searchQuery || 
                                              f.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              f.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                              (cl && cl.empresa.toLowerCase().includes(searchQuery.toLowerCase()));
                        return matchesClient && matchesCountry && matchesSearch;
                      }).map(fac => {
                        const cl = clientes.find(c => c.id === fac.clienteId);
                        const displayCountry = fac.pais || cl?.pais || 'Global';
                        return (
                          <tr key={fac.id} className="hover:bg-slate-50">
                            <td className="px-3 py-4 font-mono font-bold text-indigo-600">{fac.id}</td>
                            <td className="px-3 py-4">
                              <div className="font-semibold text-slate-900">{cl?.empresa || fac.clienteNombre || 'Cliente Desconocido'}</div>
                              <span className="text-[10px] text-slate-500 font-medium">🌍 {displayCountry}</span>
                            </td>
                            <td className="px-3 py-4 font-medium">{fac.periodo}</td>
                            <td className="px-3 py-4 font-mono font-bold text-slate-950">
                              {fac.totalFacturado.toLocaleString()} {fac.moneda}
                            </td>
                            <td className="px-3 py-4 font-mono font-bold text-rose-600">
                              {fac.saldoPendiente.toLocaleString()} {fac.moneda}
                            </td>
                            <td className="px-3 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                fac.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                {fac.estado}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-right space-x-1">
                              <button
                                onClick={() => setSelectedInvoiceForDetail(fac)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2 py-1 rounded-md transition-all inline-block"
                              >
                                Ver Detalle / PDF
                              </button>
                              {fac.estado !== 'Pagada' && (
                                <button
                                  onClick={async () => {
                                    if (confirm('¿Marcar factura como PAGADA administrativamente tras recibir fondos?')) {
                                      await api.updateFactura(fac.id, { estado: 'Pagada', usuario: user.correo });
                                      loadAllData();
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded-md transition-all inline-block"
                                >
                                  Marcar Pagada
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN COMPLEMENTARIA: VALIDACIÓN DE PAGOS DE CONTADO USD */}
            <div className="lg:col-span-12 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 mt-6">
              <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Validación de Pagos de Contado USD (Activación de Servicio)</h3>
                  <p className="text-slate-500 text-[11px]">Control de pagos iniciales requeridos para la liberación de servicios de EOR y contratos laborales locales.</p>
                </div>
              </div>

              {pagosContado.length === 0 ? (
                <p className="text-center py-8 text-slate-400 font-semibold text-xs">No hay registros de solicitudes de pago de contado USD en el sistema.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">ID Pago</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Concepto / Servicio</th>
                        <th className="px-4 py-3">Monto USD</th>
                        <th className="px-4 py-3">Moneda Local (Histórico)</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Soporte</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800 font-sans">
                      {pagosContado.map(pago => {
                        const cl = clientes.find(c => c.id === pago.clienteId);
                        return (
                          <tr key={pago.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 font-mono font-bold text-slate-900">{pago.id}</td>
                            <td className="px-4 py-4">
                              <div className="text-slate-900">{cl?.empresa || 'Cliente Desconocido'}</div>
                              <div className="text-[10px] text-slate-400">ID: {pago.clienteId}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-slate-800">{pago.concepto}</div>
                              <div className="text-[10px] text-slate-400">Servicio: {pago.servicio}</div>
                            </td>
                            <td className="px-4 py-4 font-mono text-indigo-700 font-bold">
                              ${pago.montoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </td>
                            <td className="px-4 py-4 font-mono text-slate-600">
                              {pago.monedaLocal ? (
                                <div className="space-y-0.5">
                                  <div>1 USD = {pago.tipoCambio} {pago.monedaLocal}</div>
                                  <div className="text-[9px] text-slate-400">Total: {(pago.montoUsd * pago.tipoCambio).toLocaleString()} {pago.monedaLocal}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium text-[10px]">No aplica (USD nativo)</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pago.estado === 'Validado' || pago.estado === 'Aplicado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                pago.estado === 'Soporte cargado' || pago.estado === 'En revisión' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                                pago.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {pago.estado}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {pago.archivoSoporte ? (
                                <div className="space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const win = window.open();
                                      if (win) {
                                        win.document.write(`<iframe src="${pago.archivoSoporte}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                      } else {
                                        alert("Habilite las ventanas emergentes.");
                                      }
                                    }}
                                    className="text-indigo-600 hover:text-indigo-500 font-bold flex items-center space-x-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Ver Soporte</span>
                                  </button>
                                  {pago.fechaPago && (
                                    <div className="text-[10px] text-slate-400">Fecha: {pago.fechaPago}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">Sin soporte</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {(pago.estado === 'Soporte cargado' || pago.estado === 'En revisión' || pago.estado === 'Pendiente' || pago.estado === 'Rechazado') ? (
                                <button
                                  onClick={() => {
                                    setReviewPagoContado(pago);
                                    setRechazoComentarios('');
                                    setPagoReviewError('');
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] px-3 py-1.5 rounded-xl transition-all shadow-sm inline-block"
                                >
                                  Revisar / Validar
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Validado por {pago.usuarioValidador || 'Admin'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: REGULATORY MASTERS (SOCIAL CHARGES & BASE TARIFFS) */}
        {activeTab === 'masters' && (
          <div id="admin-tab-masters" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Masters Reguladores País</h2>
                <p className="text-slate-500 text-xs mt-0.5">Gobierna de forma segura las tasas del seguro social, las tarifas de suscripción y los beneficios aplicables.</p>
              </div>

              {/* Toggle Sub Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs flex-wrap gap-1">
                <button
                  onClick={() => setMasterSubTab('social')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${masterSubTab === 'social' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Tasas Patronales
                </button>
                <button
                  onClick={() => setMasterSubTab('rates')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${masterSubTab === 'rates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Matriz de Tarifas
                </button>
                <button
                  onClick={() => setMasterSubTab('benefits')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${masterSubTab === 'benefits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Beneficios Corporativos
                </button>
                <button
                  onClick={() => setMasterSubTab('contracts')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${masterSubTab === 'contracts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Contratos y Requisitos
                </button>
              </div>
            </div>

            {/* SUB-TAB: SOCIAL CHARGES */}
            {masterSubTab === 'social' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Cargas Patronales y Regulaciones de Seguridad Social</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Filtra y visualiza el % total de cargas sociales que suma cada país.</p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs w-full sm:w-auto">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-700 text-[11px]">Filtrar País:</span>
                      <select
                        value={socialCountryFilter}
                        onChange={(e) => setSocialCountryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="All">🌍 Todos los Países ({ALL_COUNTRIES.length})</option>
                        {ALL_COUNTRIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setSocialPais('México');
                        setSocialTipo('Salud / IMSS');
                        setSocialPorcentaje(10.5);
                        setSocialResponsable('Patronal');
                        setSocialVigencia('2026-12-31');
                        setSocialEstado('Vigente');
                        setSocialMotivo('');
                        setSocialError('');
                        setShowSocialModal('new');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-xs shrink-0"
                    >
                      + Crear Nueva Tasa
                    </button>
                  </div>
                </div>

                {/* Totalized Summary Cards by Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_COUNTRIES.filter(p => socialCountryFilter === 'All' || socialCountryFilter === p)
                    .map(country => {
                      const chargesForCountry = cargasSociales.filter(cs => cs.pais === country);
                      if (chargesForCountry.length === 0 && socialCountryFilter !== country) return null;

                      let totalPatron = 0;
                      let totalEmpleado = 0;
                      let totalGeneral = 0;

                      chargesForCountry.forEach(cs => {
                        const pct = Number(cs.porcentaje) || 0;
                        totalGeneral += pct;
                        if (cs.responsablePago === 'Patrón' || cs.responsablePago === 'Patronal' as any) {
                          totalPatron += pct;
                        } else if (cs.responsablePago === 'Empleado') {
                          totalEmpleado += pct;
                        } else {
                          totalPatron += pct / 2;
                          totalEmpleado += pct / 2;
                        }
                      });

                      return (
                        <div key={country} className="bg-white border border-indigo-100 p-4 rounded-2xl shadow-xs space-y-2 relative overflow-hidden">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <Globe className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{country}</span>
                            </span>
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                              {chargesForCountry.length} conceptos
                            </span>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-500">Carga Patronal (%):</span>
                              <span className="font-bold text-indigo-700">{totalPatron.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-500">Aporte Empleado (%):</span>
                              <span className="font-bold text-slate-700">{totalEmpleado.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-xs font-mono pt-1.5 border-t border-slate-100 font-bold">
                              <span className="text-slate-900">Total Suma País (%):</span>
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">{totalGeneral.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl text-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Tipo / Concepto de Seguro</th>
                        <th className="px-4 py-3">Porcentaje Aporte</th>
                        <th className="px-4 py-3">Responsable Pago</th>
                        <th className="px-4 py-3">Vigencia Límite</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cargasSociales
                        .filter(cs => socialCountryFilter === 'All' || cs.pais === socialCountryFilter)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-500 font-medium">
                            No hay cargas sociales registradas para el país seleccionado.
                          </td>
                        </tr>
                      ) : (
                        cargasSociales
                          .filter(cs => socialCountryFilter === 'All' || cs.pais === socialCountryFilter)
                          .map((cs) => (
                            <tr key={cs.id} className="hover:bg-slate-50">
                              <td className="px-4 py-4 font-bold text-slate-900">{cs.pais}</td>
                              <td className="px-4 py-4 font-medium text-slate-800">{cs.tipoCarga}</td>
                              <td className="px-4 py-4 font-mono font-bold text-slate-950">{cs.porcentaje}%</td>
                              <td className="px-4 py-4 font-semibold text-indigo-700">{cs.responsablePago}</td>
                              <td className="px-4 py-4">{cs.vigencia}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cs.estado === 'Vigente' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {cs.estado}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right space-x-1.5">
                                <button
                                  onClick={() => {
                                    setSocialPais(cs.pais);
                                    setSocialTipo(cs.tipoCarga);
                                    setSocialPorcentaje(cs.porcentaje);
                                    setSocialResponsable(cs.responsablePago);
                                    setSocialVigencia(cs.vigencia);
                                    setSocialEstado(cs.estado);
                                    setSocialMotivo('');
                                    setShowSocialModal(cs);
                                  }}
                                  className="border border-slate-200 hover:border-indigo-200 bg-white text-indigo-600 font-bold px-2.5 py-1 rounded-md text-[10px]"
                                >
                                  Modificar
                                </button>
                                <button
                                  onClick={() => handleDeleteSocial(cs.id)}
                                  className="border border-rose-200 hover:border-rose-300 bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-md text-[10px] transition-all"
                                >
                                  Eliminar
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

            {/* SUB-TAB: RATES MATRICES */}
            {masterSubTab === 'rates' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <h3 className="font-bold text-slate-800 text-sm">Matriz de Tarifas EOR por País</h3>
                  <button
                    onClick={() => {
                      setTariffPais('México');
                      setTariffServicio('Employer of Record (EOR)');
                      setTariffMoneda('USD');
                      setTariffFee(200);
                      setTariffVigencia('2026-12-31');
                      setTariffEstado('Vigente');
                      setTariffMotivo('');
                      setTariffError('');
                      setShowTarifaModal('new');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition-all"
                  >
                    Crear Base Tarifaria
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl text-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Servicio Vinculado</th>
                        <th className="px-4 py-3">EOR Fee Base Sugerido</th>
                        <th className="px-4 py-3">Vigencia Límite</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tarifas.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-bold text-slate-900">{tr.pais}</td>
                          <td className="px-4 py-4 font-medium text-slate-800">{tr.servicio}</td>
                          <td className="px-4 py-4 font-mono font-bold text-slate-950">
                            {tr.feeBase.toLocaleString()} {tr.moneda}
                          </td>
                          <td className="px-4 py-4">{tr.vigencia}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tr.estado === 'Vigente' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {tr.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => {
                                setTariffPais(tr.pais);
                                setTariffServicio(tr.servicio);
                                setTariffMoneda(tr.moneda);
                                setTariffFee(tr.feeBase);
                                setTariffVigencia(tr.vigencia);
                                setTariffEstado(tr.estado);
                                setTariffMotivo('');
                                setShowTarifaModal(tr);
                              }}
                              className="border border-slate-200 hover:border-indigo-200 bg-white text-indigo-600 font-bold px-2.5 py-1 rounded-md text-[10px]"
                            >
                              Modificar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: CORPORATE BENEFITS */}
            {masterSubTab === 'benefits' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Catálogo de Beneficios Corporativos y Flexibles</h3>
                    <p className="text-[10px] text-slate-400">Configura beneficios adicionales reembolsables que aplican a trabajadores o clientes.</p>
                  </div>
                  <button
                    onClick={() => {
                      setBenefitNombre('');
                      setBenefitTipo('Salud');
                      setBenefitModalidad('Mensual');
                      setBenefitMoneda('USD');
                      setBenefitCosto(50);
                      setBenefitAplicaTrabajador(true);
                      setBenefitAplicaCliente(true);
                      setBenefitEstado('Activo');
                      setBenefitVigencia('2026-12-31');
                      setBenefitError('');
                      setShowBenefitModal('new');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Configurar Nuevo Beneficio</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl text-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Nombre del Beneficio</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Modalidad</th>
                        <th className="px-4 py-3">Costo Base</th>
                        <th className="px-4 py-3">Destinatarios</th>
                        <th className="px-4 py-3">Vigencia Límite</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {beneficios.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-bold text-slate-900 flex items-center space-x-1.5">
                            <Gift className="w-4 h-4 text-indigo-500" />
                            <span>{b.nombre}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px]">
                              {b.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                              {b.modalidad}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-slate-950">
                            {b.costo.toLocaleString()} {b.moneda}
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {b.aplicaTrabajador && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold mr-1">Empleado</span>}
                            {b.aplicaCliente && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold">Cliente</span>}
                          </td>
                          <td className="px-4 py-4 font-mono text-slate-500">{b.vigencia}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {b.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {beneficios.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">No hay beneficios corporativos preconfigurados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: CONTRACTS REQUIREMENTS */}
            {masterSubTab === 'contracts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Matriz de Requisitos Contractuales y Cumplimiento</h3>
                    <p className="text-[10px] text-slate-400">Asocia plantillas de contratos de trabajo obligatorias por país y servicio.</p>
                  </div>
                  <button
                    onClick={() => {
                      setContractPais('México');
                      setContractServicio('Employer of Record (EOR)');
                      setContractTipo('Contrato de Trabajo por Tiempo Indeterminado');
                      setContractPlantillaNombre('MX_EOR_INDETERMINADO_V2.docx');
                      setContractObligatorio(true);
                      setContractEstado('Activo');
                      setContractError('');
                      setShowContractModal('new');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Requisito de Contrato</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl text-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Servicio Vinculado</th>
                        <th className="px-4 py-3">Tipo de Contrato / Requisito</th>
                        <th className="px-4 py-3">Plantilla Asociada</th>
                        <th className="px-4 py-3">Carácter</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {contratos.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 font-bold text-slate-900">{c.pais}</td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{c.servicio}</td>
                          <td className="px-4 py-4 text-slate-800">{c.tipoContrato}</td>
                          <td className="px-4 py-4 font-mono text-indigo-600 flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>{c.plantillaNombre}</span>
                          </td>
                          <td className="px-4 py-4">
                            {c.obligatorio ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-bold text-[10px]">Mandatorio</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px]">Opcional</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {contratos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">No hay requisitos de contratos configurados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CONSOLIDATED AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div id="admin-tab-logs" className="space-y-6">
            <AuditPanel user={user} lang={lang} />
          </div>
        )}

        {/* TAB 8: DICTIONARY LOCALIZATION PANEL */}
        {activeTab === 'dictionary' && (
          <div id="admin-tab-dictionary" className="space-y-6">
            <DictionaryPanel currentUser={user} lang={lang} />
          </div>
        )}

        {(activeTab === 'contracts' || activeTab === 'plantillas' || activeTab === 'exchange' || activeTab === 'tickets' || activeTab === 'notifications' || activeTab === 'sla') && (
          <ExtraWorkflows
            user={user}
            lang={lang}
            activeTab={activeTab}
            clientes={clientes}
            plantillasContrato={plantillasContrato}
            contratosComerciales={contratosComerciales}
            adendums={adendums}
            contratosLaborales={contratosLaborales}
            tiposCambio={tiposCambio}
            tickets={tickets}
            slaConfigs={slaConfigs}
            plantillasNotificacion={plantillasNotificacion}
            alertasNotificacion={alertasNotificacion}
            onRefresh={loadAllData}
            usuarios={usuarios}
            initialPrepClientId={initialPrepClientId}
            onClearInitialPrepClientId={() => setInitialPrepClientId('')}
          />
        )}

        {activeTab === 'operational_alerts' && (
          <OperationalAlertsPanel user={user} lang={lang} />
        )}

        {activeTab === 'reports' && (
          <ManagementReportsPanel user={user} lang={lang} />
        )}

        {/* TAB: GESTIÓN DE USUARIOS */}
        {activeTab === 'users' && (
          <div id="admin-tab-users" className="space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-sm border border-indigo-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold tracking-tight">Gestión Central de Usuarios</h3>
                </div>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                  Crea usuarios y asigna su rol correspondiente. Las opciones del menú se adaptarán según los permisos y visibilidad definidos para cada rol.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSysUserError('');
                    setSysUserSuccess('');
                    setSysUserName('');
                    setSysUserEmail('');
                    setSysUserPassword('123456');
                    setSysUserRole(roles[0]?.id || 'asesor_comercial');
                    setSysUserModalOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Crear Nuevo Usuario</span>
                </button>
              </div>
            </div>

            {/* Sub-navigation tabs: Usuarios vs Roles */}
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setUsersSubTab('usuarios')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  usersSubTab === 'usuarios'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Usuarios ({usuarios.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setUsersSubTab('roles')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  usersSubTab === 'roles'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Roles y Opciones de Menú ({roles.length})</span>
              </button>
            </div>

            {usersSubTab === 'roles' ? (
              <RolesManagementPanel
                roles={roles}
                usuarios={usuarios}
                currentUser={user}
                lang={lang}
                onRolesChange={fetchRoles}
              />
            ) : (
              <>
                {/* Filters bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filtrar por Rol:</span>
                    <button
                      onClick={() => setSysRoleFilter('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${sysRoleFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Todos ({usuarios.length})
                    </button>
                    {roles.map(r => {
                      const count = usuarios.filter(u => u.rol === r.id || u.rol === r.nombre).length;
                      const isSelected = sysRoleFilter === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSysRoleFilter(r.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {r.nombre} ({count})
                        </button>
                      );
                    })}
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
                          <th className="px-4 py-3">Empresa / País</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {usuarios
                          .filter(u => {
                            const matchesRole = sysRoleFilter === 'all' || u.rol === sysRoleFilter;
                            const matchesSearch = !searchQuery || 
                              (u.nombre && u.nombre.toLowerCase().includes(searchQuery.toLowerCase())) || 
                              (u.correo && u.correo.toLowerCase().includes(searchQuery.toLowerCase()));
                            return matchesRole && matchesSearch;
                          })
                          .map(u => {
                            const clientObj = clientes.find(c => c.id === u.clienteId);
                            const roleDef = roles.find(r => r.id === u.rol || r.nombre.toLowerCase() === u.rol.toLowerCase());
                            const roleLabel = roleDef ? roleDef.nombre : u.rol;

                            return (
                              <tr key={u.correo} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center space-x-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                                      u.rol === 'asesor_comercial' ? 'bg-emerald-100 text-emerald-800' :
                                      u.rol === 'ejecutivo_cuentas' || u.rol === 'ejecutivo' ? 'bg-purple-100 text-purple-800' :
                                      u.rol === 'tesoreria' ? 'bg-amber-100 text-amber-800' :
                                      u.rol === 'administrador' || u.rol === 'supracliente' ? 'bg-indigo-100 text-indigo-800' :
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
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    u.rol === 'asesor_comercial' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    u.rol === 'ejecutivo_cuentas' || u.rol === 'ejecutivo' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    u.rol === 'tesoreria' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    u.rol === 'administrador' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    u.rol === 'supracliente' ? 'bg-slate-900 text-white border-slate-900' :
                                    'bg-sky-50 text-sky-700 border-sky-200'
                                  }`}>
                                    {roleLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-slate-500">
                                  {clientObj ? (
                                    <span className="font-bold text-slate-800">{clientObj.empresa} ({clientObj.pais})</span>
                                  ) : u.pais === 'Regional' || (u.paisesAsignados && u.paisesAsignados.length > 1) ? (
                                    <div className="flex flex-col">
                                      <span className="inline-flex items-center space-x-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] w-fit shadow-2xs">
                                        <span>🌎 Regional</span>
                                      </span>
                                      {u.paisesAsignados && u.paisesAsignados.length > 0 && (
                                        <span className="text-[9px] text-slate-500 font-medium mt-0.5 truncate max-w-[170px]" title={u.paisesAsignados.join(', ')}>
                                          {u.paisesAsignados.length} países: {u.paisesAsignados.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  ) : u.pais ? (
                                    <span className="font-bold text-slate-800">{COUNTRY_FLAGS[u.pais] ? `${COUNTRY_FLAGS[u.pais]} ` : '🌍 '}{u.pais}</span>
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
                                    type="button"
                                    onClick={() => {
                                      setUserToEdit(u);
                                      setIsEditUserModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="Editar datos de este usuario"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoleChangeModalUser(u);
                                      setNewAssignedRole(u.rol);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="Reasignar rol a este usuario"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    Rol
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await api.enviarCredencialesUsuario(u.correo);
                                        alert(`✓ ${res.message}\nContraseña asignada: ${res.contrasenaTemporal}`);
                                      } catch (err: any) {
                                        alert(err.message || 'Error al enviar credenciales');
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="Enviar credenciales de acceso por correo electrónico"
                                  >
                                    <Mail className="w-3 h-3" />
                                    Reenviar Acceso
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
                                        setUsuarios(updatedUsers);
                                      } catch (err: any) {
                                        alert(err.message || 'Error al actualizar usuario');
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                                  >
                                    {u.estado === 'Suspendido' ? 'Activar' : 'Suspender'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="Eliminar usuario permanentemente"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {usuarios.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400">No se encontraron usuarios registrados.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: FEES Y TARIFAS POR PAÍS */}
        {activeTab === 'fees' && (
          <div id="admin-tab-fees" className="space-y-6">
            <FeesManagementPanel user={user} lang={lang} />
          </div>
        )}

        {/* TAB: DIRECTORIO DE ACTORES DE SERVICIO */}
        {activeTab === 'directorio' && (
          <div id="admin-tab-directorio" className="space-y-6">
            <DirectorioView user={user} lang={lang} />
          </div>
        )}

        {/* TAB: MAESTRO DE CUENTAS BANCARIAS */}
        {activeTab === 'cuentas_bancarias' && (
          <div id="admin-tab-cuentas-bancarias" className="space-y-6">
            <CuentasBancariasView user={user} lang={lang} />
          </div>
        )}

        {/* TAB: IVA - WHT Y RENTA */}
        {activeTab === 'iva_wht_renta' && (
          <div id="admin-tab-iva-wht-renta" className="space-y-6">
            <IvaWhtRentaMaster user={user} lang={lang} readOnly={false} />
          </div>
        )}
      </div>
    </div>

      {/* MODAL CREAR USUARIO */}
      {sysUserModalOpen && (
        <div id="modal-create-sys-user" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Crear Nuevo Usuario</span>
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">
                  Registra un usuario y selecciona su rol. Se enviarán sus credenciales automáticamente por correo Gmail.
                </p>
              </div>
              <button
                onClick={() => setSysUserModalOpen(false)}
                className="text-indigo-200 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSystemUser} className="p-6 space-y-4 text-left overflow-y-auto">
              {sysUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-[11px]">
                  {sysUserError}
                </div>
              )}
              {sysUserSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-[11px]">
                  {sysUserSuccess}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Rol de Acceso <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sysUserRole}
                  onChange={(e) => setSysUserRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} &mdash; {r.descripcion}
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  El rol determinará las opciones del menú y módulos a los que este usuario tendrá acceso.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>País Asignado / Alcance <span className="text-rose-500">*</span></span>
                  {sysUserCountry === 'Regional' && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                      {sysUserAssignedCountries.length} seleccionados
                    </span>
                  )}
                </label>
                <select
                  value={sysUserCountry}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSysUserCountry(val);
                    if (val === 'Regional' && sysUserAssignedCountries.length === 0) {
                      setSysUserAssignedCountries(['México', 'Colombia']);
                    }
                  }}
                  className={`w-full p-2.5 border rounded-xl text-xs font-bold transition-all ${
                    sysUserCountry === 'Regional'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 ring-1 ring-indigo-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'
                  }`}
                >
                  <option value="Regional" className="font-bold text-indigo-700">
                    🌎 Regional (Multi-país LATAM)
                  </option>
                  <optgroup label="Países Individuales">
                    {ALL_COUNTRIES.map(p => (
                      <option key={p} value={p}>{COUNTRY_FLAGS[p] ? `${COUNTRY_FLAGS[p]} ` : ''}{p}</option>
                    ))}
                  </optgroup>
                </select>
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  Para Asesores, Directores y Ejecutivos, define la cobertura territorial de clientes y operaciones.
                </span>
              </div>

              {/* Panel de despliegue de países regionales en creación de usuario */}
              {sysUserCountry === 'Regional' && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                      Países Asignados ({sysUserAssignedCountries.length})
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSysUserAssignedCountries([...ALL_COUNTRIES])}
                        className="text-[9px] font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        Todos (18)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSysUserAssignedCountries([])}
                        className="text-[9px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-indigo-100">
                    {ALL_COUNTRIES.map(c => {
                      const isSel = sysUserAssignedCountries.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (isSel) setSysUserAssignedCountries(sysUserAssignedCountries.filter(p => p !== c));
                            else setSysUserAssignedCountries([...sysUserAssignedCountries, c]);
                          }}
                          className={`text-[10px] p-1.5 rounded text-left flex items-center justify-between border cursor-pointer transition-all ${
                            isSel ? 'bg-indigo-600 text-white font-bold border-indigo-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                          }`}
                        >
                          <span className="truncate">{COUNTRY_FLAGS[c] || '🌎'} {c}</span>
                          {isSel && <span className="text-[8px] ml-0.5">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. María Fernández"
                  value={sysUserName}
                  onChange={(e) => setSysUserName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Correo Electrónico (Usuario de Ingreso) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={sysUserEmail}
                  onChange={(e) => setSysUserEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contraseña Inicial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={sysUserPassword}
                  onChange={(e) => setSysUserPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  El usuario podrá ingresar de inmediato con esta contraseña y su correo electrónico.
                </span>
              </div>

              {(sysUserRole === 'cliente' || sysUserRole === 'supracliente') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {sysUserRole === 'supracliente' ? 'Empresa Holding / Supra Propietaria Vinculada' : 'Empresa Cliente Vinculada'} {sysUserRole === 'cliente' && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={sysUserClientId}
                    onChange={(e) => setSysUserClientId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">{sysUserRole === 'supracliente' ? '-- Acceso Global / Todas las Empresas --' : '-- Selecciona Cliente Corporativo --'}</option>
                    {clientes
                      .filter(c => {
                        const emp = (c.empresa || '').toLowerCase();
                        return !emp.includes('jose andres') && !emp.includes('henao');
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.empresa} ({c.id} - {c.pais})</option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Idioma Preferido
                </label>
                <select
                  value={sysUserLang}
                  onChange={(e) => setSysUserLang(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSysUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Guardar y Crear Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REASIGNAR ROL A USUARIO */}
      {roleChangeModalUser && (
        <div id="modal-change-user-role" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs flex flex-col">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Reasignar Rol de Acceso</span>
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">
                  Modifica el rol y las opciones de menú para este usuario.
                </p>
              </div>
              <button
                onClick={() => setRoleChangeModalUser(null)}
                className="text-indigo-200 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario Seleccionado:</div>
                <div className="font-bold text-slate-900 text-sm">{roleChangeModalUser.nombre || 'Sin Nombre'}</div>
                <div className="text-[11px] font-mono text-slate-600">{roleChangeModalUser.correo}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Rol actual: <span className="font-bold text-indigo-600">{roleChangeModalUser.rol}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nuevo Rol Asignado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newAssignedRole}
                  onChange={(e) => setNewAssignedRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} &mdash; ({r.opcionesMenu?.length || 0} opciones de menú)
                    </option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  El usuario verá las opciones de menú y permisos definidos para este rol en su próxima navegación.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRoleChangeModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateUserRole}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Guardar Nuevo Rol</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL FOR CLIENT CREATED / PREPARE CONTRACT */}
      {newlyCreatedClient && (
        <div id="modal-client-success" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-6 text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 id="success-modal-title" className="text-sm font-bold tracking-tight">¡Cliente Corporativo Creado con Éxito!</h3>
              <p className="text-[10px] text-indigo-200">Se ha dado de alta a la empresa en la plataforma.</p>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                La empresa <strong className="text-slate-900 font-extrabold">{newlyCreatedClient.empresa}</strong> se registró para operar en <strong className="text-slate-900 font-extrabold">{newlyCreatedClient.pais}</strong> con una tarifa base de <strong className="text-indigo-600">{newlyCreatedClient.feePorEmpleado} {newlyCreatedClient.moneda}</strong> por empleado.
              </p>
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 text-left space-y-1">
                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Próximo Paso Requerido:</span>
                <span className="text-[10px] font-bold text-indigo-950 block">Generación del Contrato de Servicios EOR</span>
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  Para formalizar la relación comercial y activar los flujos de nómina, es necesario preparar el contrato comercial con sus cláusulas y firmarlo digitalmente.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="btn-prepare-contract-now"
                  onClick={() => {
                    setInitialPrepClientId(newlyCreatedClient.id);
                    setActiveTab('contracts');
                    setNewlyCreatedClient(null);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition shadow-xs text-[10px] flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Preparar Contrato Comercial Ahora
                </button>
                <button
                  id="btn-prepare-contract-later"
                  onClick={() => setNewlyCreatedClient(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition text-[10px]"
                >
                  Hacerlo más tarde (Permanecer aquí)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DICTAMEN / CONVERSION SOLICITUD */}
      {showSolicitudModal && (
        <div id="solicitud-detail-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Detalle de Solicitud Lead</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Analiza los requisitos de este prospecto antes de habilitar el alta cliente.</p>
              </div>
              <button onClick={() => setShowSolicitudModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4 text-slate-600">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Empresa</span>
                  <strong className="text-slate-900 font-bold">{showSolicitudModal.empresa}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">País / Alcance</span>
                  {showSolicitudModal.esRegional || showSolicitudModal.pais === 'Regional' ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center space-x-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                        <span>🌎 Regional ({showSolicitudModal.paisesOperacion?.length || 0} países)</span>
                      </span>
                      {showSolicitudModal.paisesOperacion && showSolicitudModal.paisesOperacion.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {showSolicitudModal.paisesOperacion.map(p => (
                            <span key={p} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                              {COUNTRY_FLAGS[p] || ''} {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {COUNTRY_FLAGS[showSolicitudModal.pais] ? `${COUNTRY_FLAGS[showSolicitudModal.pais]} ` : ''}{showSolicitudModal.pais}
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Contacto</span>
                  <span className="font-bold text-slate-900">{showSolicitudModal.nombreContacto}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email</span>
                  <span>{showSolicitudModal.correo}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Trabajadores</span>
                  <span className="font-mono font-bold text-slate-950">{showSolicitudModal.cantidadTrabajadores} empleados</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Moneda</span>
                  <span className="font-mono font-bold">{showSolicitudModal.moneda}</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="block text-[9px] uppercase font-bold text-indigo-900 tracking-wider">Asignación de Asesor Comercial</span>
                  {user.rol !== 'asesor_comercial' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSolicitudModal(null);
                        setActiveTab('users');
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1"
                    >
                      + Crear / Gestionar Asesores
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={showSolicitudModal.asesorAsignado || ''}
                    onChange={async (e) => {
                      try {
                        const email = e.target.value;
                        await api.updateSolicitud(showSolicitudModal.id, { 
                          asesorAsignado: email || undefined
                        });
                        setShowSolicitudModal({ ...showSolicitudModal, asesorAsignado: email || undefined });
                        
                        // Sync list in state
                        const updatedSols = solicitudes.map(s => s.id === showSolicitudModal.id ? { ...s, asesorAsignado: email || undefined } : s);
                        setSolicitudes(updatedSols);
                        
                        alert(`Asesor comercial asignado con éxito: ${email || 'Desasignado'}`);
                      } catch (err: any) {
                        alert(`Error asignando asesor: ${err.message}`);
                      }
                    }}
                    className="w-full border border-indigo-200 bg-white px-3 py-1.5 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="">-- Sin Asesor Comercial Asignado --</option>
                    {usuarios.filter(u => u.rol === 'asesor_comercial' || u.rol === 'administrador').map(u => (
                      <option key={u.correo} value={u.correo}>{u.nombre} ({u.correo}) - {u.rol === 'administrador' ? 'Administrador' : 'Asesor'}</option>
                    ))}
                    {showSolicitudModal.asesorAsignado && !usuarios.some(u => u.correo === showSolicitudModal.asesorAsignado) && (
                      <option key={showSolicitudModal.asesorAsignado} value={showSolicitudModal.asesorAsignado}>{showSolicitudModal.asesorAsignado}</option>
                    )}
                  </select>
                </div>
              </div>

              {showSolicitudModal.observaciones && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong className="font-bold text-slate-800 block mb-0.5">Observaciones del Lead:</strong>
                  <p className="text-slate-600">{showSolicitudModal.observaciones}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSolicitudToDelete({ id: showSolicitudModal.id, empresa: showSolicitudModal.empresa })}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Lead</span>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateSolicitudStatus(showSolicitudModal.id, 'Rechazada')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Rechazar Lead
                  </button>
                  <button
                    onClick={() => handleUpdateSolicitudStatus(showSolicitudModal.id, 'En revisión')}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition-all cursor-pointer border border-amber-200/50"
                  >
                    Marcar En Análisis
                  </button>
                  <button
                    onClick={() => triggerConversion(showSolicitudModal)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Aprobar y Crear Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO / AUDITORÍA DE CLIENTE */}
      {showClientModal && (
        <div id="client-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-3xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold">
                  {showClientModal === 'new' ? 'Registrar Nuevo Cliente (Ficha Completa)' : `Editar y Ajustar Ficha del Cliente: ${clientEmpresa || (typeof showClientModal === 'object' ? showClientModal.empresa : '')}`}
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Controla las condiciones de pago, parámetros impositivos y límites operativos.</p>
              </div>
              <button onClick={() => setShowClientModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 overflow-y-auto space-y-6 flex-1">
              {clientError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">{clientError}</div>}

              {/* SECCIÓN 1: IDENTIFICACIÓN JURÍDICA Y FISCAL */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Identificación Comercial y Fiscal</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Datos del Contrato y Razón Social</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Nombre Comercial (Empresa) <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientEmpresa}
                      onChange={(e) => setClientEmpresa(e.target.value)}
                      placeholder="Ej: Acme Corp"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-semibold transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Razón Social Legal
                      </label>
                    </div>
                    <input
                      type="text"
                      value={clientRazonSocial}
                      onChange={(e) => setClientRazonSocial(e.target.value)}
                      placeholder="Ej: Acme International S.A."
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Legal ID / Cédula Jurídica <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientCedulaJuridica}
                      onChange={(e) => setClientCedulaJuridica(e.target.value)}
                      placeholder="Ej: 3-101-789012 / NIT / RFC"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-mono transition-all shadow-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Dirección Fiscal Completa <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientDireccion}
                      onChange={(e) => setClientDireccion(e.target.value)}
                      placeholder="Calle, Edificio, Oficina, Provincia, Código Postal, País..."
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Sociedad Emisora STT
                      </label>
                    </div>
                    <input
                      type="text"
                      value={clientSociedadContratacion}
                      onChange={(e) => setClientSociedadContratacion(e.target.value)}
                      placeholder="Ej: Quick Hire Latam S.R.L."
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: PARÁMETROS DEL SERVICIO CONTRATADO Y TARIFAS */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Configuración de Servicios y Escala Tarifaria</span>
                  </h4>
                  {clientFeeInfo && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center space-x-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>{clientFeeInfo}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Servicio Específico
                      </label>
                    </div>
                    <select
                      value={clientServicioTipo}
                      onChange={(e) => setClientServicioTipo(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-semibold transition-all shadow-xs"
                    >
                      <option value="EOR">EOR (Employer of Record)</option>
                      <option value="PEO">PEO (Professional Employer Org)</option>
                      <option value="HRO">HRO (Human Resources Outsource)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Tipo de Socio / Rol Corporativo
                      </label>
                    </div>
                    <select
                      value={clientTipoSocio}
                      onChange={(e) => setClientTipoSocio(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Directo">Cliente Directo</option>
                      <option value="Partners">Partner</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cliente Propietario (Jerarquía Corporativa)</span>
                      </label>
                    </div>
                    <select
                      value={clientJerarquia}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setClientJerarquia(val);
                        if (val === 'Directo') {
                          setClientSupraclienteId('');
                        } else if (val === 'Supra') {
                          setClientSupraclienteId('supracliente-eor-peo@grupostt.com');
                        } else if (val === 'Filial') {
                          if (!clientSupraclienteId || clientSupraclienteId === 'supracliente-eor-peo@grupostt.com') {
                            const firstSupra = clientes.find(cl => 
                              cl.id === 'CLI-876' || 
                              cl.empresa.toLowerCase().includes('pagus') ||
                              cl.tipoCliente === 'Holding' ||
                              cl.tipoCliente === 'Supra' ||
                              (cl as any).jerarquia === 'Supra' ||
                              cl.supraclienteId === 'supracliente-eor-peo@grupostt.com'
                            );
                            if (firstSupra) {
                              setClientSupraclienteId(firstSupra.id);
                            } else if (clientes.length > 0) {
                              setClientSupraclienteId(clientes[0].id);
                            }
                          }
                        }
                      }}
                      className="w-full h-10 px-3 bg-white border border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-indigo-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Supra">Supra (Holding / Matriz Principal)</option>
                      <option value="Filial">Filial Asociada</option>
                      <option value="Directo">Cliente Directo Individual (Sin Jerarquía Holding)</option>
                    </select>
                  </div>
                </div>

                {/* Cuando se selecciona Filial Asociada, DEBAJO aparece la lista de clientes supras para asociarlo */}
                {clientJerarquia === 'Filial' && (
                  <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl animate-fade-in space-y-1.5">
                    <label className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider block flex items-center justify-between">
                      <span>Seleccionar Cliente Supra Propietario para Asociar <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-indigo-700 font-semibold lowercase">empresa matriz que consolidará esta filial</span>
                    </label>
                    <select
                      value={clientSupraclienteId}
                      onChange={(e) => setClientSupraclienteId(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-indigo-300 rounded-xl text-indigo-950 text-xs font-bold shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">-- Seleccionar Empresa Supra Matriz --</option>
                      <optgroup label="🏢 Clientes Supra / Matriz Registrados">
                        {clientes
                          .filter(cl => {
                            if (showClientModal !== 'new' && typeof showClientModal === 'object' && showClientModal.id === cl.id) return false;
                            return (
                              cl.id === 'CLI-876' ||
                              cl.empresa.toLowerCase().includes('pagus') ||
                              cl.tipoCliente === 'Holding' ||
                              cl.tipoCliente === 'Supra' ||
                              (cl as any).jerarquia === 'Supra' ||
                              cl.supraclienteId === 'supracliente-eor-peo@grupostt.com'
                            );
                          })
                          .map(cl => (
                            <option key={cl.id} value={cl.id}>
                              ★ {cl.empresa} ({cl.id} • {cl.pais}) [Matriz Supra]
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="🏢 Otras Empresas Clientes Registradas (Vincular como Matriz)">
                        {clientes
                          .filter(cl => {
                            if (showClientModal !== 'new' && typeof showClientModal === 'object' && showClientModal.id === cl.id) return false;
                            const isAlreadySupra = (
                              cl.id === 'CLI-876' ||
                              cl.empresa.toLowerCase().includes('pagus') ||
                              cl.tipoCliente === 'Holding' ||
                              cl.tipoCliente === 'Supra' ||
                              (cl as any).jerarquia === 'Supra' ||
                              cl.supraclienteId === 'supracliente-eor-peo@grupostt.com'
                            );
                            return !isAlreadySupra;
                          })
                          .map(cl => (
                            <option key={cl.id} value={cl.id}>
                              {cl.empresa} ({cl.id} • {cl.pais})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="🌐 Cuentas Global Holding">
                        <option value="supracliente-eor-peo@grupostt.com">
                          Supra Cliente Global Holding (STT Latam)
                        </option>
                      </optgroup>
                    </select>
                    <p className="text-[10px] text-indigo-700 font-medium">
                      Esta filial se consolidará automáticamente bajo la cuenta del Supra Cliente seleccionado.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Proyecto Asociado
                      </label>
                    </div>
                    <input
                      type="text"
                      value={clientProyecto}
                      onChange={(e) => setClientProyecto(e.target.value)}
                      placeholder="Ej: Core Tech Team 2026"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Moneda Facturación
                      </label>
                    </div>
                    <select
                      value={clientMoneda}
                      onChange={(e) => {
                        const newMoneda = e.target.value;
                        setClientMoneda(newMoneda);
                        autoSelectAccount(clientPaisFacturacion || clientPais, newMoneda);
                      }}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-bold transition-all shadow-xs"
                    >
                      <option value="USD">USD - Dólares US</option>
                      <option value="MXN">MXN - Pesos Mexicanos</option>
                      <option value="COP">COP - Pesos Colombianos</option>
                      <option value="BRL">BRL - Reales Brasileños</option>
                      <option value="EUR">EUR - Euros</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        País de Operación <span className="text-rose-500">*</span>
                      </label>
                      {clientPais === 'Regional' && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                          {clientPaisesOperacion.length} seleccionados
                        </span>
                      )}
                    </div>
                    <select
                      value={clientPais}
                      onChange={(e) => {
                        const newPais = e.target.value;
                        setClientPais(newPais);
                        if (newPais === 'Regional') {
                          if (clientPaisesOperacion.length === 0) {
                            setClientPaisesOperacion(['México', 'Colombia']);
                          }
                          setClientTipoFacturacion('Internacional');
                          setClientPaisFacturacion('Estados Unidos');
                          autoSelectAccount('Estados Unidos', clientMoneda);
                        } else {
                          if (clientTipoFacturacion === 'Local') {
                            setClientPaisFacturacion(newPais);
                            autoSelectAccount(newPais, clientMoneda);
                          }
                        }
                        autoCalculateClientFee(newPais, clientCupo, clientEmpresa);
                      }}
                      className={`w-full h-10 px-3 border rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-bold disabled:bg-slate-100 disabled:opacity-60 transition-all shadow-xs ${
                        clientPais === 'Regional'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="Regional" className="font-bold text-indigo-700">
                        🌎 Regional (Multi-país LATAM)
                      </option>
                      <optgroup label="Países Individuales">
                        {LATAM_COUNTRIES.map(c => (
                          <option key={c} value={c}>{COUNTRY_FLAGS[c] ? `${COUNTRY_FLAGS[c]} ` : ''}{c}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Despliegue interactivo de selección de países regionales para Cliente */}
                  {clientPais === 'Regional' && (
                    <div className="md:col-span-3 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/40 border-2 border-indigo-200 rounded-2xl p-4 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-xs">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>Despliegue de Países para Operación Regional</span>
                              <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                                {clientPaisesOperacion.length} seleccionados
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Haz clic para seleccionar o desmarcar cada país donde este cliente operará y contratará talento:
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setClientPaisesOperacion([...LATAM_COUNTRIES])}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            ✓ Todos (18)
                          </button>
                          <button
                            type="button"
                            onClick={() => setClientPaisesOperacion([])}
                            className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/80 rounded-xl border border-indigo-100">
                        {LATAM_COUNTRIES.map((c) => {
                          const isSel = clientPaisesOperacion.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                if (isSel) {
                                  setClientPaisesOperacion(clientPaisesOperacion.filter(p => p !== c));
                                } else {
                                  setClientPaisesOperacion([...clientPaisesOperacion, c]);
                                }
                              }}
                              className={`p-2 rounded-xl border text-left flex items-center justify-between text-[11px] transition-all cursor-pointer select-none ${
                                isSel
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                              }`}
                            >
                              <span className="flex items-center space-x-1 truncate">
                                <span>{COUNTRY_FLAGS[c] || '🌎'}</span>
                                <span className="truncate">{c}</span>
                              </span>
                              {isSel && <span className="text-[9px] font-black shrink-0 ml-1">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1º CANTIDAD DE TRABAJADORES (PRIMERO) */}
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        1º Cantidad Colaboradores <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-indigo-700 font-bold bg-indigo-100/70 px-1.5 py-0.5 rounded-md">
                        Disparador
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={clientCupo}
                      onChange={(e) => {
                        const newQty = Math.max(1, Number(e.target.value) || 1);
                        setClientCupo(newQty);
                        setClientHeadcountProyecto(newQty);
                        autoCalculateClientFee(clientPais, newQty, clientEmpresa);
                      }}
                      className="w-full h-10 px-3 bg-indigo-50/40 border border-indigo-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 font-mono font-bold text-xs transition-all shadow-xs"
                      placeholder="Ej: 10"
                    />
                  </div>

                  {/* 2º FEE EOR BASE AUTOMÁTICO (SEGUNDO) */}
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        2º Fee EOR Base / Talento <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => autoCalculateClientFee(clientPais, clientCupo, clientEmpresa)}
                        title="Re-calcular según Tarifario Maestro"
                        className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 hover:underline"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Sincronizar</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        required
                        value={clientFee}
                        onChange={(e) => setClientFee(Number(e.target.value))}
                        className="w-full h-10 pl-3 pr-16 bg-emerald-50/40 border border-emerald-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-950 font-mono font-bold text-xs transition-all shadow-xs"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-700 pointer-events-none">
                        {clientMoneda}/mes
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Descuento Volumen (%)
                      </label>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={clientDescuento}
                      onChange={(e) => setClientDescuento(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 font-mono text-xs transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: FACTURACIÓN, CUENTAS BANCARIAS MAESTRAS Y CONDICIONES */}
              <div className="space-y-4 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/80">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                    <span>3. Tipo de Facturación y Cuenta Bancaria Asociada</span>
                  </h4>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/60 px-2 py-0.5 rounded-md">
                    Automatización de Cobro & Dispersión
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TIPO DE FACTURACIÓN: LOCAL O INTERNACIONAL */}
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Tipo de Facturación <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <select
                      value={clientTipoFacturacion}
                      onChange={(e) => {
                        const val = e.target.value as 'Local' | 'Internacional';
                        setClientTipoFacturacion(val);
                        if (val === 'Local') {
                          setClientPaisFacturacion(clientPais);
                          autoSelectAccount(clientPais, clientMoneda);
                        } else {
                          const targetCountry = clientPaisFacturacion && clientPaisFacturacion !== clientPais ? clientPaisFacturacion : 'Estados Unidos';
                          setClientPaisFacturacion(targetCountry);
                          autoSelectAccount(targetCountry, clientMoneda);
                        }
                      }}
                      className="w-full h-10 px-3 bg-white border border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 text-xs font-bold transition-all shadow-xs"
                    >
                      <option value="Local">Local (Mismo país de operación: {clientPais})</option>
                      <option value="Internacional">Internacional (Facturación Transfronteriza)</option>
                    </select>
                  </div>

                  {/* PAÍS DE FACTURACIÓN (LISTA DESPLEGABLE) */}
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        País de Facturación <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    {clientTipoFacturacion === 'Local' ? (
                      <div className="w-full h-10 px-3 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-800 font-bold flex items-center justify-between text-xs shadow-xs">
                        <span>{clientPais}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">Local</span>
                      </div>
                    ) : (
                      <select
                        value={clientPaisFacturacion}
                        onChange={(e) => {
                          const newCountry = e.target.value;
                          setClientPaisFacturacion(newCountry);
                          autoSelectAccount(newCountry, clientMoneda);
                        }}
                        className="w-full h-10 px-3 bg-white border border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 text-xs font-bold transition-all shadow-xs"
                      >
                        {BILLING_COUNTRIES.map((pais) => (
                          <option key={pais} value={pais}>{pais}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* ASOCIACIÓN DE CUENTA BANCARIA DEL MAESTRO */}
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Cuenta Bancaria Asociada <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                        Auto-vinculada
                      </span>
                    </div>
                    {(() => {
                      const allAccs = cuentasBancarias && cuentasBancarias.length > 0 ? cuentasBancarias : DEFAULT_CUENTAS_BANCARIAS;
                      const activeAccs = allAccs.filter(c => !c.estado || c.estado === 'ACTIVA');
                      const effectiveCountry = clientTipoFacturacion === 'Local' ? clientPais : clientPaisFacturacion;
                      const effNorm = normalizeCountry(effectiveCountry);

                      // Filter country matching accounts
                      const countryAccs = activeAccs.filter(c => normalizeCountry(c.pais) === effNorm || normalizeCountry(c.pais).includes(effNorm) || effNorm.includes(normalizeCountry(c.pais)));
                      // International accounts
                      const intlAccs = activeAccs.filter(c => (normalizeCountry(c.pais) === 'estados unidos' || normalizeCountry(c.pais) === 'panama') && !countryAccs.some(ca => ca.id === c.id));
                      // Other accounts
                      const otherAccs = activeAccs.filter(c => !countryAccs.some(ca => ca.id === c.id) && !intlAccs.some(ia => ia.id === c.id));

                      return (
                        <select
                          value={clientCuentaBancariaId}
                          onChange={(e) => {
                            const accId = e.target.value;
                            setClientCuentaBancariaId(accId);
                            const acc = allAccs.find(c => c.id === accId);
                            if (acc) {
                              setClientCuentaBancariaDetalle(`${acc.banco} - ${acc.numeroCuenta} (${acc.moneda}) | ${acc.sociedad}`);
                            }
                          }}
                          className="w-full h-10 px-3 bg-white border border-emerald-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-950 text-xs font-semibold transition-all shadow-xs"
                        >
                          {countryAccs.length > 0 && (
                            <optgroup label={`── Cuentas de ${effectiveCountry} ──`}>
                              {countryAccs.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.banco} • {acc.numeroCuenta} ({acc.moneda}) — {acc.sociedad}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {intlAccs.length > 0 && (
                            <optgroup label="── Cuentas Internacionales (Hub USA / Panamá) ──">
                              {intlAccs.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.banco} • {acc.numeroCuenta} ({acc.moneda}) — {acc.sociedad} [{acc.pais}]
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {otherAccs.length > 0 && (
                            <optgroup label="── Otras Cuentas Maestras Activas ──">
                              {otherAccs.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.banco} • {acc.numeroCuenta} ({acc.moneda}) — {acc.sociedad} [{acc.pais}]
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      );
                    })()}
                  </div>
                </div>

                {/* TARJETA DETALLADA DE LA CUENTA BANCARIA VINCULADA */}
                {(() => {
                  const allAccs = cuentasBancarias && cuentasBancarias.length > 0 ? cuentasBancarias : DEFAULT_CUENTAS_BANCARIAS;
                  const effectiveCountry = clientTipoFacturacion === 'Local' ? clientPais : clientPaisFacturacion;
                  const selectedAcc = allAccs.find(c => c.id === clientCuentaBancariaId) ||
                                     findBestBankAccount(allAccs, effectiveCountry, clientMoneda) ||
                                     allAccs[0];
                  if (!selectedAcc) return null;
                  return (
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span className="text-sm">{selectedAcc.banco}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono font-bold">
                              {selectedAcc.moneda}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200 flex items-center space-x-1">
                              <span>✓</span>
                              <span>Cuenta de Recaudo Vinculada</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <div>
                              <span className="font-medium text-slate-500">No. Cuenta / CLABE:</span>{' '}
                              <span className="font-mono font-bold text-slate-900">{selectedAcc.numeroCuenta}</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div>
                              <span className="font-medium text-slate-500">Titular:</span>{' '}
                              <span className="font-semibold text-slate-800">{selectedAcc.sociedad}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <div><span className="font-medium text-slate-400">Jurisdicción:</span> <span className="font-semibold text-slate-800">{selectedAcc.pais}</span></div>
                        {selectedAcc.swift && <div><span className="font-medium text-slate-400">SWIFT:</span> <span className="font-mono font-bold text-indigo-700">{selectedAcc.swift}</span></div>}
                        {selectedAcc.aba && <div><span className="font-medium text-slate-400">ABA:</span> <span className="font-mono font-bold text-slate-800">{selectedAcc.aba}</span></div>}
                      </div>
                    </div>
                  );
                })()}

                {/* CONDICIONES FINANCIERAS Y FECHAS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-indigo-100">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Frecuencia de Nómina
                      </label>
                    </div>
                    <select
                      value={clientFrecuenciaNomina}
                      onChange={(e) => setClientFrecuenciaNomina(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-semibold transition-all shadow-xs"
                    >
                      <option value="Mensual">Mensual</option>
                      <option value="Quincenal">Quincenal</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Condiciones de Crédito
                      </label>
                    </div>
                    <select
                      value={clientCredito}
                      onChange={(e) => setClientCredito(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-semibold transition-all shadow-xs"
                    >
                      <option value="Pago anticipado">Pago anticipado (Prepago)</option>
                      <option value="10 días">Net 10 (10 días de crédito)</option>
                      <option value="15 días">Net 15 (15 días de crédito)</option>
                      <option value="30 días">Net 30 (30 días de crédito)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Inicio Contrato Comercial
                      </label>
                    </div>
                    <input
                      type="date"
                      value={clientFechaInicioContrato}
                      onChange={(e) => setClientFechaInicioContrato(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 font-mono text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Arranque Operativo
                      </label>
                    </div>
                    <input
                      type="date"
                      value={clientFechaInicio}
                      onChange={(e) => setClientFechaInicio(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 font-mono text-xs transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: PERSONAS DE CONTACTO Y REPRESENTANTE LEGAL */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>4. Representante Legal y Contacto Comercial</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Requisitos para Contratación Legal</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Representante Legal <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientRepresentanteLegal}
                      onChange={(e) => {
                        setClientRepresentanteLegal(e.target.value);
                        if (!clientContacto) setClientContacto(e.target.value);
                      }}
                      placeholder="Ej: John Doe"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-semibold transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Pasaporte / Cédula No. <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientDocumentoRepresentante}
                      onChange={(e) => setClientDocumentoRepresentante(e.target.value)}
                      placeholder="Ej: PAS-98765432 / CED-10928374"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-mono transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Posición del Representante
                      </label>
                    </div>
                    <input
                      type="text"
                      value={clientPosicion}
                      onChange={(e) => setClientPosicion(e.target.value)}
                      placeholder="Ej: Director Regional, Apoderado"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Idioma del Contrato
                      </label>
                    </div>
                    <select
                      value={clientIdioma}
                      onChange={(e) => setClientIdioma(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs font-bold transition-all shadow-xs"
                    >
                      <option value="es">Español (ES)</option>
                      <option value="en">English (EN)</option>
                      <option value="pt">Português (PT)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Correo Notificaciones <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="email"
                      required
                      value={clientCorreo}
                      onChange={(e) => setClientCorreo(e.target.value)}
                      placeholder="finance@acme.com"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Teléfono de Enlace <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientTelefono}
                      onChange={(e) => setClientTelefono(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Contacto Operativo / Administrativo
                      </label>
                    </div>
                    <input
                      type="text"
                      value={clientContacto}
                      onChange={(e) => setClientContacto(e.target.value)}
                      placeholder="Ej: Jane Smith (Directora RRHH)"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 text-xs transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: BENEFICIOS ADICIONALES & EXTRALEGALES */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Gift className="w-3.5 h-3.5 text-indigo-600" />
                    <span>5. Beneficios Extralegales & Condiciones Operativas</span>
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Catálogo de Beneficios Habilitados (Formato Nombre:Monto)
                      </label>
                    </div>
                    <input
                      type="text"
                      value={clientAdicionales}
                      onChange={(e) => setClientAdicionales(e.target.value)}
                      placeholder="Ej: Seguro Médico Privado:150, Bono de Desempeño:300, Fondo de Ahorro:100"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 font-mono text-xs transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Cláusulas y Adicionales Extralegales (Texto descriptivo para contrato)
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      value={clientAdicionalesExtralegales}
                      onChange={(e) => setClientAdicionalesExtralegales(e.target.value)}
                      placeholder="Ej: 30 días de aguinaldo, seguro de gastos médicos mayores internacional, vales de despensa..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 text-xs resize-none transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: ASIGNACIÓN COMERCIAL Y ESTATUS */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-indigo-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>6. Asignación Comercial y Estatus de Activación</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Asesor Comercial Asignado
                      </label>
                    </div>
                    <select
                      value={clientAsesorAsignado}
                      onChange={(e) => setClientAsesorAsignado(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 text-xs transition-all shadow-xs"
                    >
                      <option value="">-- Sin Asesor Comercial Asignado --</option>
                      {usuarios.filter(u => u.rol === 'asesor_comercial' || u.rol === 'administrador').map(u => (
                        <option key={u.correo} value={u.correo}>{u.nombre} ({u.correo}) - {u.rol === 'administrador' ? 'Admin' : 'Asesor'}</option>
                      ))}
                      {clientAsesorAsignado && !usuarios.some(u => u.correo === clientAsesorAsignado) && (
                        <option key={clientAsesorAsignado} value={clientAsesorAsignado}>{clientAsesorAsignado}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Estatus Portal Cliente
                      </label>
                    </div>
                    <select
                      value={clientEstado}
                      onChange={(e) => setClientEstado(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-950 text-xs font-bold transition-all shadow-xs"
                    >
                      <option value="Activo">Activo (Habilitado)</option>
                      <option value="En mora">Bloqueado / En Mora</option>
                      <option value="Inactivo">Inactivo / Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                      <label className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                        Motivo / Justificación <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={clientMotivo}
                      onChange={(e) => setClientMotivo(e.target.value)}
                      placeholder="Ej: Registro nuevo cliente / Adendo 2026..."
                      className="w-full h-10 px-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-slate-950 font-semibold text-xs transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 shrink-0">
                {showClientModal !== 'new' && typeof showClientModal === 'object' && (
                  <button
                    type="button"
                    onClick={() => setClienteToDelete(showClientModal)}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cliente</span>
                  </button>
                )}
                <div className="flex space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowClientModal(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                  >
                    {commonT.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{commonT.save}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DICTAMEN / AUDIT DE COLABORADOR */}
      {showAuditModal && (
        <div id="audit-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Dictamen de Alta Colaborador</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Analiza y aprueba la liquidación del colaborador en la base del portal.</p>
              </div>
              <button onClick={() => setShowAuditModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleAuditWorkerSubmit} className="p-5 space-y-4">
              {auditError && <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">{auditError}</div>}

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className="text-slate-500">Colaborador:</span>
                  <strong className="text-slate-900 text-right">{showAuditModal.nombre}</strong>
                  <span className="text-slate-500">Salario Base:</span>
                  <strong className="text-slate-900 text-right">{showAuditModal.salario.toLocaleString()} {showAuditModal.moneda}</strong>
                  <span className="text-slate-500">País Regulador:</span>
                  <strong className="text-indigo-600 text-right">{showAuditModal.pais}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Dictamen Final</label>
                <select
                  value={auditEstado}
                  onChange={(e) => setAuditEstado(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-bold"
                >
                  <option value="Activo">Aprobar Alta (Activo)</option>
                  <option value="Con observaciones">Rechazar con Observaciones</option>
                  <option value="Inactivo">Dar de Baja (Inactivo)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Observaciones Generales</label>
                <textarea
                  rows={2}
                  value={auditObservaciones}
                  onChange={(e) => setAuditObservaciones(e.target.value)}
                  placeholder="Instrucciones para el cliente..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 resize-none"
                />
              </div>

              {/* MANDATORY REASON FOR TRANSACTIONS TRACKING */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  Motivo o Justificación del Dictamen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={auditMotivo}
                  onChange={(e) => setAuditMotivo(e.target.value)}
                  placeholder="Para compliance, describe el motivo técnico de esta aprobación/rechazo..."
                  className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-xl focus:bg-white text-slate-950 font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Registrar Dictamen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGULATORY SOCIAL CHARGES */}
      {showSocialModal && (
        <div id="social-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">
                  {showSocialModal === 'new' ? 'Nueva Tasa Reguladora' : 'Modificar Tasa Reguladora'}
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Define aportes patronales u obreros regulados.</p>
              </div>
              <button onClick={() => setShowSocialModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveSocial} className="p-5 space-y-4">
              {socialError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">{socialError}</div>}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tipo / Concepto de Seguro *</label>
                <input
                  type="text"
                  required
                  value={socialTipo}
                  onChange={(e) => setSocialTipo(e.target.value)}
                  placeholder="Ej: Salud / IMSS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">País</label>
                  <select
                    value={socialPais}
                    onChange={(e) => setSocialPais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-semibold"
                  >
                    {LATAM_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Porcentaje Tasa (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={socialPorcentaje}
                    onChange={(e) => setSocialPorcentaje(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Responsable Aporte</label>
                  <select
                    value={socialResponsable}
                    onChange={(e) => setSocialResponsable(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-semibold"
                  >
                    <option value="Patrono">Patrono</option>
                    <option value="Empleado">Empleado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Vigencia Límite</label>
                  <input
                    type="date"
                    required
                    value={socialVigencia}
                    onChange={(e) => setSocialVigencia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Estatus Matriz</label>
                <select
                  value={socialEstado}
                  onChange={(e) => setSocialEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-semibold"
                >
                  <option value="Vigente">Vigente</option>
                  <option value="Histórico">Histórico</option>
                </select>
              </div>

              {/* MANDATORY COMPLIANCE REASON */}
              {showSocialModal !== 'new' && (
                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Motivo del Ajuste Regulatorio <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={socialMotivo}
                    onChange={(e) => setSocialMotivo(e.target.value)}
                    placeholder="Describe el diario oficial o adendo legal aplicable..."
                    className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-xl focus:bg-white text-slate-950 font-semibold resize-none"
                  />
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                {showSocialModal !== 'new' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof showSocialModal === 'object') {
                        handleDeleteSocial(showSocialModal.id);
                        setShowSocialModal(null);
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all"
                  >
                    Eliminar Tasa
                  </button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowSocialModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                  >
                    Guardar Tasa
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLIENT USERS */}
      {selectedClientForUsers && (
        <div id="client-users-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[85vh]">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold">Cuentas de Usuario - {selectedClientForUsers.empresa}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Administra los accesos de los administradores y gestores de este cliente.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedClientForUsers(null);
                  setNewUserError('');
                  setNewUserSuccess('');
                  setNewUserName('');
                  setNewUserEmail('');
                }}
                className="text-indigo-200 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {/* LIST OF CURRENT USERS */}
              <div className="space-y-2">
                <h4 className="text-indigo-900 font-bold text-[11px] uppercase tracking-wider">Usuarios con Acceso Activo</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {usuarios.filter(u => u.clienteId === selectedClientForUsers.id || u.correo === selectedClientForUsers.correoContacto).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 font-semibold">
                      No hay usuarios adicionales creados para este cliente. El contacto principal ingresa con {selectedClientForUsers.correoContacto}.
                    </div>
                  ) : (
                    usuarios.filter(u => u.clienteId === selectedClientForUsers.id || u.correo === selectedClientForUsers.correoContacto).map(u => (
                      <div key={u.correo} className="p-3 bg-slate-50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">{u.nombre}</p>
                          <p className="text-[10px] text-slate-500">{u.correo} | Rol: <span className="font-semibold text-indigo-600 capitalize">{u.rol}</span></p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${u.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.estado || 'Activo'}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const nextState = u.estado === 'Suspendido' ? 'Activo' : 'Suspendido';
                                await api.updateUsuario(u.correo, {
                                  estado: nextState,
                                  usuario: user.correo,
                                  motivo: `Estado cambiado a ${nextState} por Administrador`
                                });
                                // Reload user list
                                const updatedUsers = await api.getUsuarios().catch(() => []);
                                setUsuarios(updatedUsers);
                              } catch (err: any) {
                                alert(err.message || 'Error al actualizar usuario');
                              }
                            }}
                            className="text-[10px] text-indigo-600 hover:underline font-bold"
                          >
                            {u.estado === 'Suspendido' ? 'Activar' : 'Suspender'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CREATE USER FORM */}
              <form onSubmit={handleCreateClientUser} className="space-y-3 border-t border-slate-100 pt-4 text-left">
                <h4 className="text-indigo-900 font-bold text-[11px] uppercase tracking-wider">Crear Nuevo Usuario de Acceso</h4>
                
                {newUserError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">{newUserError}</div>}
                {newUserSuccess && <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold">{newUserSuccess}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre Completo <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Correo Electrónico <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
                  >
                    + Registrar Usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE FACTURA / EXPORTAR PDF / IMPRIMIR (Point 2) */}
      {selectedInvoiceForDetail && (
        <div id="invoice-detail-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[85vh]">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold">Comprobante Fiscal / Detalle Liquidación</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">ID Factura: {selectedInvoiceForDetail.id} | Periodo: {selectedInvoiceForDetail.periodo}</p>
              </div>
              <button onClick={() => setSelectedInvoiceForDetail(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 printable-invoice" id="invoice-print-area">
              {/* Encabezado Factura */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h4 className="text-lg font-black text-indigo-900">QUICK HIRE</h4>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Employer of Record Service</span>
                  <p className="text-slate-600 mt-2 font-semibold">Quick Hire Latam S.R.L.</p>
                  <p className="text-slate-400">Dirección Fiscal: San José, Costa Rica</p>
                  <p className="text-slate-400">Email: tesoreria-eor-peo@grupostt.com | Tel: +506 4000-8000</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[10px] border border-indigo-100">
                    {selectedInvoiceForDetail.estado}
                  </span>
                  <p className="text-slate-400 mt-3">Fecha de Emisión:</p>
                  <p className="font-bold text-slate-800 font-mono">{selectedInvoiceForDetail.fechaEmision}</p>
                  <p className="text-slate-400 mt-1">Fecha de Vencimiento:</p>
                  <p className="font-bold text-slate-800 font-mono">{selectedInvoiceForDetail.fechaVencimiento}</p>
                </div>
              </div>

              {/* Información de Cliente */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Facturado a:</span>
                  <h5 className="font-bold text-slate-900 mt-0.5 text-sm">{selectedInvoiceForDetail.clienteNombre}</h5>
                  <p className="text-slate-600 mt-1">País: {selectedInvoiceForDetail.pais}</p>
                  <p className="text-slate-500">Moneda de Pago: {selectedInvoiceForDetail.moneda}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Detalles Operativos:</span>
                  <p className="text-slate-600 mt-1 font-semibold">Headcount Contratado: {selectedInvoiceForDetail.cantidadTrabajadores} Empleados</p>
                  <p className="text-slate-500">Periodo de Servicio: {selectedInvoiceForDetail.periodo}</p>
                </div>
              </div>

              {/* Detalle Desglosado de Liquidación */}
              {(() => {
                const baseFeeVal = selectedInvoiceForDetail.baseFee ?? (selectedInvoiceForDetail.feeAplicado * (selectedInvoiceForDetail.cantidadTrabajadores || 1));
                const beneficiosVal = selectedInvoiceForDetail.beneficiosCobrados ?? 0;
                const descuentosVal = selectedInvoiceForDetail.descuentos ?? 0;
                const subtotalNeto = baseFeeVal + beneficiosVal - descuentosVal;
                const comisionVal = selectedInvoiceForDetail.comisionBancaria ?? Math.round(subtotalNeto * ((billingConfig?.comisionPct || 2.5) / 100));
                const whtVal = selectedInvoiceForDetail.wht ?? Math.round(subtotalNeto * ((billingConfig?.whtPct || 4) / 100));
                const ivaVal = selectedInvoiceForDetail.iva ?? Math.round(subtotalNeto * ((billingConfig?.ivaPct || 19) / 100));
                const otrosImpuestosVal = selectedInvoiceForDetail.otrosImpuestos ?? Math.round(subtotalNeto * ((billingConfig?.impuestoPct || 1.5) / 100));

                return (
                  <div className="space-y-4">
                    {/* Itemized Worker Breakdown if available */}
                    {selectedInvoiceForDetail.detallesTrabajadores && selectedInvoiceForDetail.detallesTrabajadores.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-indigo-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">Nomina e Imputación por Colaborador</h5>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden text-[10.5px]">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[8.5px]">
                              <tr>
                                <th className="px-3 py-2">Colaborador</th>
                                <th className="px-3 py-2">Puesto</th>
                                <th className="px-3 py-2 text-right">Salario Base</th>
                                <th className="px-3 py-2 text-right">EOR Fee</th>
                                <th className="px-3 py-2 text-right">Beneficios</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {selectedInvoiceForDetail.detallesTrabajadores.map((d: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="px-3 py-2 font-bold text-slate-900">{d.nombre}</td>
                                  <td className="px-3 py-2 text-slate-500">{d.puesto}</td>
                                  <td className="px-3 py-2 text-right font-mono">{d.salario?.toLocaleString() || '0'} {selectedInvoiceForDetail.moneda}</td>
                                  <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-700">{d.fee?.toLocaleString() || baseFeeVal} {selectedInvoiceForDetail.moneda}</td>
                                  <td className="px-3 py-2 text-right font-mono text-slate-600">{d.beneficios?.toLocaleString() || '0'} {selectedInvoiceForDetail.moneda}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <h5 className="text-indigo-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">Desglose Paramétrico de Fee e Impuestos</h5>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                            <tr>
                              <th className="px-3 py-2">Concepto Liquidado</th>
                              <th className="px-3 py-2 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            <tr>
                              <td className="px-3 py-2">Base EOR Management Fee (Costo Operación)</td>
                              <td className="px-3 py-2 text-right font-mono font-bold">{baseFeeVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Beneficios Adicionales Habilitados y Reembolsos</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">{beneficiosVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                            </tr>
                            {descuentosVal > 0 && (
                              <tr>
                                <td className="px-3 py-2 text-rose-600">Descuento de Volumen Comercial (-)</td>
                                <td className="px-3 py-2 text-right font-mono text-rose-600">- {descuentosVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="px-3 py-2">Comisión por Gestión Bancaria e Ingress ({billingConfig.comisionPct}%)</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">+{comisionVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Impuesto de Retención en la Fuente (WHT -{billingConfig.whtPct}%)</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">-{whtVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Impuesto sobre Valor Agregado (IVA / VAT {billingConfig.ivaPct}%)</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">+{ivaVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Otros Impuestos Regulatorios Locales ({billingConfig.impuestoPct}%)</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">+{otrosImpuestosVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Total Final */}
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <div className="w-1/2 text-right space-y-1">
                        <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                          <span>Subtotal Neto Fee:</span>
                          <span className="font-mono">{subtotalNeto.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</span>
                        </div>
                        <div className="flex justify-between font-bold text-indigo-900 text-sm border-t border-indigo-100 pt-2">
                          <span>Monto Total Cobrado:</span>
                          <span className="font-mono text-lg font-black">{selectedInvoiceForDetail.totalFacturado.toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedInvoiceForDetail.moneda}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Nota Legal */}
              <div className="p-3 bg-indigo-50/50 rounded-2xl text-[9px] text-slate-500 text-center leading-relaxed">
                Este comprobante de cobro detalla los servicios de Employer of Record prestados por Quick Hire Latam S.R.L. de acuerdo con el contrato mercantil comercial firmado. Los impuestos, comisiones bancarias e IVA han sido desglosados y parametrizados en cumplimiento de las regulaciones hacendarias aplicables.
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span>Generar PDF / Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREACIÓN MANUAL DE SOLICITUD DE EOR (Point 4) */}
      {showManualSolicitudModal && (
        <div id="manual-solicitud-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Crear Solicitud de EOR Manual</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Habilita prospectos de forma manual en caso de que no lleguen desde el portal público.</p>
              </div>
              <button onClick={() => setShowManualSolicitudModal(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateManualSolicitud} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre Empresa <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={manualSolEmpresa}
                    onChange={(e) => setManualSolEmpresa(e.target.value)}
                    placeholder="Ej: Globex Inc"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">País Destino <span className="text-rose-500">*</span></label>
                  <select
                    value={manualSolPais}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualSolPais(val);
                      if (val === 'Regional' && manualSolPaises.length === 0) {
                        setManualSolPaises(['México', 'Colombia']);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-xl focus:bg-white text-slate-950 font-semibold ${
                      manualSolPais === 'Regional' ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="Regional" className="font-bold text-indigo-700">
                      🌎 Regional (Multi-país LATAM)
                    </option>
                    <optgroup label="Países Individuales">
                      {LATAM_COUNTRIES.map(c => (
                        <option key={c} value={c}>{COUNTRY_FLAGS[c] ? `${COUNTRY_FLAGS[c]} ` : ''}{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Panel de selección de países regionales en modal manual */}
              {manualSolPais === 'Regional' && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                      Países de Cobertura Regional ({manualSolPaises.length})
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setManualSolPaises([...LATAM_COUNTRIES])}
                        className="text-[9px] font-bold text-indigo-700 hover:underline cursor-pointer"
                      >
                        Todos (18)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setManualSolPaises([])}
                        className="text-[9px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-indigo-100">
                    {LATAM_COUNTRIES.map(c => {
                      const isSel = manualSolPaises.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (isSel) setManualSolPaises(manualSolPaises.filter(p => p !== c));
                            else setManualSolPaises([...manualSolPaises, c]);
                          }}
                          className={`text-[10px] p-1.5 rounded text-left flex items-center justify-between border cursor-pointer ${
                            isSel ? 'bg-indigo-600 text-white font-bold border-indigo-700' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                          }`}
                        >
                          <span className="truncate">{COUNTRY_FLAGS[c]} {c}</span>
                          {isSel && <span className="text-[8px] ml-0.5">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Cantidad de Empleados <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={manualSolCantidad}
                    onChange={(e) => setManualSolCantidad(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Servicio Solicitado</label>
                  <select
                    value={manualSolServicio}
                    onChange={(e) => setManualSolServicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                  >
                    <option value="Employer of Record (EOR)">Employer of Record (EOR)</option>
                    <option value="PEO (Professional Employer Org)">PEO (Professional Employer Org)</option>
                    <option value="HRO (Human Resources Outsource)">HRO (Human Resources Outsource)</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre del Contacto <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={manualSolNombre}
                    onChange={(e) => setManualSolNombre(e.target.value)}
                    placeholder="Ej: Sarah Connor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Correo Electrónico <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={manualSolCorreo}
                    onChange={(e) => setManualSolCorreo(e.target.value)}
                    placeholder="sconnor@globex.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Teléfono de Enlace <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={manualSolTelefono}
                    onChange={(e) => setManualSolTelefono(e.target.value)}
                    placeholder="+506 8888 7777"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Observaciones / Requisitos Especiales</label>
                <textarea
                  rows={2}
                  value={manualSolNotas}
                  onChange={(e) => setManualSolNotas(e.target.value)}
                  placeholder="Escribe aquí notas sobre el prospecto, compensación deseada, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualSolicitudModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Crear Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO BENEFICIO CORPORATIVO */}
      {showBenefitModal === 'new' && (
        <div id="create-benefit-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Configurar Nuevo Beneficio Corporativo</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Define un nuevo beneficio reembolsable o flexible para la plataforma.</p>
              </div>
              <button onClick={() => setShowBenefitModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateBenefit} className="p-5 space-y-4">
              {benefitError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{benefitError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre del Beneficio <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={benefitNombre}
                  onChange={(e) => setBenefitNombre(e.target.value)}
                  placeholder="Ej: Seguro de Gastos Médicos Mayores"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tipo</label>
                  <select
                    value={benefitTipo}
                    onChange={(e) => setBenefitTipo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    <option value="Salud">Salud</option>
                    <option value="Seguro Vida">Seguro Vida</option>
                    <option value="Equipos">Equipos</option>
                    <option value="Viáticos">Viáticos</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Modalidad</label>
                  <select
                    value={benefitModalidad}
                    onChange={(e) => setBenefitModalidad(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Único">Único</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Moneda</label>
                  <select
                    value={benefitMoneda}
                    onChange={(e) => setBenefitMoneda(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                    <option value="COP">COP</option>
                    <option value="BRL">BRL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Costo Base <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={benefitCosto}
                    onChange={(e) => setBenefitCosto(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">¿Quién puede asumir este beneficio?</label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={benefitAplicaTrabajador}
                      onChange={(e) => setBenefitAplicaTrabajador(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Empleado / Trabajador</span>
                  </label>
                  <label className="flex items-center space-x-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={benefitAplicaCliente}
                      onChange={(e) => setBenefitAplicaCliente(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Cliente (Empresa)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Estado</label>
                  <select
                    value={benefitEstado}
                    onChange={(e) => setBenefitEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Vigencia Límite</label>
                  <input
                    type="date"
                    required
                    value={benefitVigencia}
                    onChange={(e) => setBenefitVigencia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBenefitModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Beneficio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR REQUISITO DE CONTRATO */}
      {showContractModal === 'new' && (
        <div id="create-contract-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Registrar Requisito Contractual</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Asigna y asocia una plantilla de contrato mandatoria por país.</p>
              </div>
              <button onClick={() => setShowContractModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateContractRequirement} className="p-5 space-y-4">
              {contractError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{contractError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">País Destino</label>
                  <select
                    value={contractPais}
                    onChange={(e) => setContractPais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    {LATAM_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Servicio Asociado</label>
                  <select
                    value={contractServicio}
                    onChange={(e) => setContractServicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    <option value="Employer of Record (EOR)">Employer of Record (EOR)</option>
                    <option value="PEO (Professional Employer Org)">PEO (Professional Employer Org)</option>
                    <option value="Servicios de Reclutamiento">Servicios de Reclutamiento</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tipo de Contrato / Documento <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={contractTipo}
                  onChange={(e) => setContractTipo(e.target.value)}
                  placeholder="Ej: Contrato Individual de Trabajo por Tiempo Indeterminado"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre de Archivo de Plantilla <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={contractPlantillaNombre}
                  onChange={(e) => setContractPlantillaNombre(e.target.value)}
                  placeholder="Ej: MX_EOR_INDETERMINADO_V2.docx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono text-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Obligatoriedad</label>
                  <select
                    value={contractObligatorio ? "true" : "false"}
                    onChange={(e) => setContractObligatorio(e.target.value === "true")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    <option value="true">Obligatorio / Mandatorio</option>
                    <option value="false">Opcional</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Estado</label>
                  <select
                    value={contractEstado}
                    onChange={(e) => setContractEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowContractModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Registrar Requisito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGULATORY SERVICE BASE RATES */}
      {showTarifaModal && (
        <div id="tariff-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">
                  {showTarifaModal === 'new' ? 'Nueva Tarifa EOR Base' : 'Modificar Tarifa EOR Base'}
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Controla la matriz de suscripción y precios comerciales.</p>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950"
                  >
                    {LATAM_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Fee Base Comercial</label>
                  <input
                    type="number"
                    required
                    value={tariffFee}
                    onChange={(e) => setTariffFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Moneda</label>
                  <select
                    disabled={showTarifaModal !== 'new'}
                    value={tariffMoneda}
                    onChange={(e) => setTariffMoneda(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-950"
                >
                  <option value="Vigente">Vigente</option>
                  <option value="Histórico">Histórico</option>
                </select>
              </div>

              {/* MANDATORY CHANGE REASON */}
              {showTarifaModal !== 'new' && (
                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Motivo de Modificación Tarifaria <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={tariffMotivo}
                    onChange={(e) => setTariffMotivo(e.target.value)}
                    placeholder="Registra el adendo o ajuste de inflación comercial..."
                    className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-xl focus:bg-white text-slate-950 font-semibold resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTarifaModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW USD CASH PAYMENT MODAL */}
      {reviewPagoContado && (
        <div id="review-cash-payment-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Validación de Pago de Contado USD</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Valida el soporte cargado para activar el servicio de EOR.</p>
              </div>
              <button onClick={() => setReviewPagoContado(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {pagoReviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {pagoReviewError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {clientes.find(c => c.id === reviewPagoContado.clienteId)?.empresa || 'Cargando...'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Concepto</span>
                  <span className="font-bold text-slate-800 text-xs">{reviewPagoContado.concepto}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monto USD</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    ${reviewPagoContado.montoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tr('Equivalente de Cambio', 'Exchange Equivalent', 'Equivalente de Câmbio', lang)}</span>
                  <span className="font-mono font-semibold text-slate-600 text-xs">
                    {reviewPagoContado.monedaLocal 
                      ? `${(reviewPagoContado.montoUsd * reviewPagoContado.tipoCambio).toLocaleString()} ${reviewPagoContado.monedaLocal} (${tr('Tasa:', 'Rate:', 'Taxa:', lang)} ${reviewPagoContado.tipoCambio})`
                      : tr('No aplica (USD Directo)', 'Not applicable (Direct USD)', 'Não se aplica (USD Direto)', lang)}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2 mt-1 flex justify-between items-center text-[10.5px]">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider mr-1">{tr('Método de pago:', 'Payment method:', 'Método de pagamento:', lang)}</span>
                    <span className="font-bold text-slate-700">{reviewPagoContado.metodoPago || tr('No registrado', 'Not recorded', 'Não registrado', lang)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider mr-1">{tr('Fecha de Pago:', 'Payment Date:', 'Data de Pagamento:', lang)}</span>
                    <span className="font-mono font-bold text-slate-700">{reviewPagoContado.fechaPago || tr('No registrada', 'Not recorded', 'Não registrada', lang)}</span>
                  </div>
                </div>
              </div>

              {/* Support Document View Container */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{tr('Documento Soporte de Pago Cargado', 'Uploaded Payment Proof Document', 'Comprovante de Pagamento Carregado', lang)}</span>
                {reviewPagoContado.archivoSoporte ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-4">
                    <iframe 
                      src={reviewPagoContado.archivoSoporte} 
                      className="w-full h-48 rounded-xl border border-slate-200 bg-white"
                      title={tr('Soporte de pago', 'Payment proof', 'Comprovante de pagamento', lang)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${reviewPagoContado.archivoSoporte}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }
                      }}
                      className="mt-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-100 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{tr('Ver en pantalla completa', 'View full screen', 'Ver em tela cheia', lang)}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-semibold">
                    {tr('El cliente no ha cargado ningún comprobante de pago aún.', 'The client has not uploaded any payment voucher yet.', 'O cliente ainda não enviou nenhum comprovante de pagamento.', lang)}
                  </div>
                )}
              </div>

              {/* Reject Observation Input Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {tr('Comentarios de Validación / Motivo de Rechazo', 'Validation Comments / Rejection Reason', 'Comentários de Validação / Motivo de Rejeição', lang)} <span className="text-rose-500 font-normal">({tr('Requerido para rechazar', 'Required to reject', 'Obrigatório para rejeitar', lang)})</span>
                </label>
                <textarea
                  rows={2}
                  value={rechazoComentarios}
                  onChange={(e) => setRechazoComentarios(e.target.value)}
                  placeholder={tr('Por favor, especifique el motivo del rechazo del comprobante o comentarios internos de la conciliación bancaria...', 'Please specify the reason for receipt rejection or internal bank reconciliation comments...', 'Por favor, especifique o motivo da rejeição do comprovante ou comentários internos da conciliação bancária...', lang)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewPagoContado(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-all cursor-pointer"
                >
                  {tr('Cancelar', 'Cancel', 'Cancelar', lang)}
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleValidarPagoContado(reviewPagoContado.id, false)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {tr('Rechazar Pago', 'Reject Payment', 'Rejeitar Pagamento', lang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidarPagoContado(reviewPagoContado.id, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {tr('Validar y Liberar Servicio', 'Validate & Release Service', 'Validar e Liberar Serviço', lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL DE EDICIÓN DE USUARIO */}
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
        onUserUpdated={async () => {
          const updatedUsers = await api.getUsuarios().catch(() => []);
          setUsuarios(updatedUsers);
        }}
      />
    </div>
  );
}

// Inline language wrapper component to bind the selector nicely
function LanguageBadge({ lang }: { lang: Language }) {
  const [current, setCurrent] = useState(lang);
  useEffect(() => {
    setCurrent(lang);
  }, [lang]);
  return (
    <div className="bg-slate-800 text-slate-300 rounded-xl px-3 py-1.5 font-semibold text-xs border border-slate-700 uppercase">
      {current === 'es' ? 'ES 🇪🇸' : current === 'en' ? 'EN 🇺🇸' : 'PT 🇧🇷'}
    </div>
  );
}
