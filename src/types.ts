/**
 * Types & Translation Dictionary for Quick Hire EOR Management System
 */

export const LATAM_COUNTRIES = [
  'México',
  'Colombia',
  'Brasil',
  'Chile',
  'Perú',
  'Argentina',
  'Ecuador',
  'Uruguay',
  'Paraguay',
  'Bolivia',
  'Costa Rica',
  'Panamá',
  'Guatemala',
  'El Salvador',
  'Honduras',
  'Nicaragua',
  'República Dominicana',
  'Venezuela'
];

export const COUNTRY_FLAGS: Record<string, string> = {
  'México': '🇲🇽',
  'Colombia': '🇨🇴',
  'Brasil': '🇧🇷',
  'Chile': '🇨🇱',
  'Perú': '🇵🇪',
  'Argentina': '🇦🇷',
  'Ecuador': '🇪🇨',
  'Uruguay': '🇺🇾',
  'Paraguay': '🇵🇾',
  'Bolivia': '🇧🇴',
  'Costa Rica': '🇨🇷',
  'Panamá': '🇵🇦',
  'Guatemala': '🇬🇹',
  'El Salvador': '🇸🇻',
  'Honduras': '🇭🇳',
  'Nicaragua': '🇳🇮',
  'República Dominicana': '🇩🇴',
  'Venezuela': '🇻🇪',
  'Regional': '🌎'
};

export const BILLING_COUNTRIES = [
  'Estados Unidos',
  'Panamá',
  'Costa Rica',
  'México',
  'Colombia',
  'Brasil',
  'Chile',
  'Perú',
  'Argentina',
  'Ecuador',
  'Uruguay',
  'Paraguay',
  'Bolivia',
  'Guatemala',
  'El Salvador',
  'Honduras',
  'Nicaragua',
  'República Dominicana',
  'Puerto Rico',
  'Jamaica',
  'Venezuela',
  'España',
  'Reino Unido',
  'Canadá',
  'Alemania',
  'Francia',
  'Suiza',
  'Singapur',
  'Otro'
];

export type Role = 'prospecto' | 'cliente' | 'administrador' | 'supracliente' | 'asesor_comercial' | 'ejecutivo' | 'ejecutivo_cuentas' | 'gestion_cuentas' | 'tesoreria' | string;

export interface OpcionMenu {
  id: string;
  etiqueta: string;
  categoria: 'Panel de Control' | 'Operación EOR' | 'Finanzas y Pagos' | 'Legal y Plantillas' | 'Soporte y SLA' | 'Reportes y Auditoría' | 'Administración';
  descripcion: string;
}

export interface RoleDefinition {
  id: string;
  nombre: string;
  descripcion: string;
  esSistema: boolean;
  esAdmin: boolean;
  opcionesMenu: string[];
  fechaCreacion?: string;
  creadoPor?: string;
}

export interface DirectorioContacto {
  id: string;
  tipo: 'Gerente / Coordinador' | 'Ejecutivo de Cuenta' | 'Asesor Comercial';
  pais: string;
  empresaStt?: string;
  nombre: string;
  correo: string;
  telefono?: string;
  estado: 'Activo' | 'Inactivo';
}

export interface ReglaTributariaIvaWht {
  id: string;
  pais: string;
  sociedadFacturadora: string;
  tipoFacturacion: 'Local' | 'Internacional' | 'Ambas';
  ivaGeneralPct: number;
  ivaEorExportacionPct: number;
  whtRetencionPct: number;
  rentaIsrPct: number;
  asuncionWht: 'Gross-Up (A cargo de Cliente)' | 'Descuento Directo' | 'Exento por CDI/Tratado' | 'No Aplica';
  baseCalculoIva: 'Solo Fee EOR' | 'Fee + Reembolsos' | 'Nómina Total + Fee' | 'No Aplica';
  baseCalculoWht: 'Solo Fee EOR' | 'Total Facturado' | 'No Aplica';
  tratadoDobleImposicion: string;
  fundamentoLegal: string;
  certificadoRequerido: string;
  notas: string;
  estado: 'Vigente' | 'En revisión' | 'Obsoleto';
  fechaActualizacion: string;
  usuarioActualizacion?: string;
}

export interface CuentaBancariaMaestra {
  id: string;
  sociedad: string;
  pais: string;
  moneda: string;
  banco: string;
  numeroCuenta: string;
  tipoCuenta: string;
  estado: 'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA';
  swift?: string;
  aba?: string;
  bancoIntermediario?: string;
  swiftIntermediario?: string;
  abaIntermediario?: string;
  direccionBancoIntermediario?: string;
  direccionBanco?: string;
  direccionBeneficiario?: string;
  ruc?: string;
}

export interface User {
  correo: string;
  nombre: string;
  rol: Role;
  contrasena?: string;
  clienteId?: string; // Associated company if role is 'cliente'
  estado: 'Activo' | 'Suspendido' | 'Inactivo';
  ultimoAcceso?: string;
  fechaCreacion: string;
  pais?: string;
  paisesAsignados?: string[];
  unidadesOperativasAsignadas?: string[];
  idioma?: Language;
}

export interface SolicitudEOR {
  id: string;
  empresa: string;
  pais: string;
  esRegional?: boolean;
  paisesOperacion?: string[];
  servicioRequerido: string;
  moneda: string;
  cantidadTrabajadores: number;
  nombreContacto: string;
  correo: string;
  telefono: string;
  observaciones: string;
  estado: 'Recibida' | 'En revisión' | 'Aprobada' | 'Rechazada' | 'Cliente creado';
  fechaRecepcion: string;
  notasInternas?: string;
  asesorAsignado?: string; // Advisor email
  estadoComercial?: string; // Commercial state
  fechaUltimaGestion?: string;
}

export interface Cliente {
  id: string;
  empresa: string;
  pais: string;
  esRegional?: boolean;
  paisesOperacion?: string[];
  servicioContratado: string;
  moneda: string;
  feePorEmpleado: number;
  cupoTrabajadores: number;
  trabajadoresCargados: number;
  trabajadoresPendientes: number;
  beneficiosConfigurados: string[];
  plantillaAsociada: string;
  condicionesFacturacion: string;
  correoContacto: string;
  telefonoContacto: string;
  nombreContacto: string;
  estado: 'Activo' | 'Pendiente de configuración' | 'En mora' | 'Inactivo';
  descuentoVolumen?: string;
  solicitudVinculadaId?: string;
  idioma?: Language;
  
  // New customized fields for creation
  servicio?: 'EOR' | 'PEO' | 'HRO';
  tipoCliente?: 'Directo' | 'Partners' | 'Holding' | 'Filial' | string;
  proyecto?: string;
  razonSocial?: string;
  cedulaJuridica?: string;
  direccion?: string;
  fechaInicioContrato?: string;
  posicion?: string;
  tipoFacturacion?: 'Local' | 'Internacional';
  paisFacturacion?: string;
  cuentaBancariaId?: string;
  cuentaBancariaDetalle?: string;
  credito?: string;
  headcountProyecto?: number;
  frecuenciaNomina?: 'Quincenal' | 'Mensual';
  fechaInicio?: string;
  adicionales?: string;
  adicionalesExtralegales?: string;
  sociedadContratacion?: string;
  representanteLegal?: string;
  documentoRepresentante?: string;
  supraclienteId?: string; // Linked to a Supra Cliente user
  jerarquia?: 'Directo' | 'Supra' | 'Filial';
  asesorAsignado?: string; // Advisor email
  ultimaGestion?: string;
  estadoServicio?: 'Pendiente de contrato comercial' | 'Contrato generado' | 'Contrato comercial firmado' | 'Pendiente de pago' | 'Pago en revisión' | 'Pago rechazado' | 'Pago validado' | 'Servicio liberado' | 'Servicio bloqueado' | 'Servicio suspendido';
  contratoComercialId?: string;
  fechaLiberacion?: string;
  usuarioValidador?: string;
}

export interface Trabajador {
  id: string;
  clienteId: string;
  clienteNombre: string;
  nombre: string;
  correo: string;
  puesto: string;
  documentoIdentidad?: string;
  proyecto?: string;
  tipoCarga: 'Individual' | 'Masiva';
  fechaIngreso: string;
  salario: number;
  moneda: string;
  modalidadTrabajo: 'Presencial' | 'Híbrido' | 'Remoto';
  beneficiosAplicables: { beneficioId: string; costo: number }[];
  estado: 'Activo' | 'Con observaciones' | 'Inactivo' | 'En revisión';
  observaciones?: string;
  pais: string;
  cargasSocialesPatronalesPct?: number;
  cargasSocialesMonto?: number;
  feeMonto?: number;
  impuestosMonto?: number;
  costoTotalTalento?: number;
  detallesCostos?: {
    cargasSocialesPatronalesPct: number;
    cargasSocialesMonto: number;
    feeServicioMonto: number;
    impuestosMonto: number;
    costoTotal: number;
    desglose?: { concepto: string; porcentaje: number; monto: number }[];
    impuestosDetalle?: { concepto: string; monto: number }[];
  };
  ultimaActualizacion: string;
  cargaMasivaId?: string;
}

export interface CargaSocial {
  id: string;
  pais: string;
  tipoCarga: string; // e.g., "Seguridad Social", "Fondo Vivienda"
  nombreCarga?: string; // Specific name of the charge (e.g. "Aporte CCSS", "IMSS Salud", etc.)
  responsablePago: 'Patrón' | 'Empleado' | 'Ambos';
  porcentaje: number;
  montoFijo?: number;
  tope?: number;
  vigencia: string;
  estado: 'Vigente' | 'Obsoleto';
  observaciones?: string;
  fechaActualizacion: string;
  usuarioResponsable: string;
}

export interface TramoTalentos {
  id: string;
  minTalentos: number;
  maxTalentos: number;
  etiqueta: string; // e.g. "1 – 50 Talents", "80 Talents", "150 Talents", "320 Talents (Cell Cap)", "500+ Talents"
  feeUsd: number;
}

export interface TarifarioEOR {
  id: string;
  nombre: string;
  descripcion?: string;
  esDefault: boolean;
  paisesAplicables: string[]; // e.g. ['Todos'] or ['Costa Rica', 'Colombia']
  clientesAplicables?: string[]; // e.g. ['Todos'] or ['CLI-001', 'CLI-002']
  tramos: TramoTalentos[];
  estado: 'Activo' | 'Inactivo';
  fechaActualizacion: string;
  usuarioActualizacion?: string;
}

export interface Tarifa {
  id: string;
  pais: string;
  servicio: string;
  moneda: string;
  feeBase: number;
  tramosVolumen: string; // e.g., "1-5: $100, 6-20: $80, 21+: $60"
  descuentos: string;
  vigencia: string;
  estado: 'Activo' | 'Inactivo';
  rangos?: { desde: number; hasta: number; descuentoPorcentaje: number; feePersonalizado?: number }[]; // Dynamic volume discount ranges
}

export interface Beneficio {
  id: string;
  nombre: string;
  tipo: 'Salud' | 'Seguro Vida' | 'Equipos' | 'Viáticos' | 'Otros';
  modalidad: 'Mensual' | 'Único' | 'Anual';
  moneda: string;
  costo: number;
  aplicaTrabajador: boolean;
  aplicaCliente: boolean;
  estado: 'Activo' | 'Inactivo';
  vigencia: string;
}

export interface ContratoRequisito {
  id: string;
  pais: string;
  servicio: string;
  tipoContrato: string;
  plantillaNombre: string;
  documentosRequeridos: string[]; // List of documents needed
  obligatorio: boolean;
  vigencia: string;
  estado: 'Activo' | 'Inactivo';
}

export interface PlantillaCarga {
  id: string;
  nombre: string;
  pais: string;
  servicio: string;
  version: string;
  fechaVigencia: string;
  estado: 'Vigente' | 'Obsoleta';
  observaciones?: string;
  columnas: string[];
}

export interface HistorialCargaMasiva {
  id: string;
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  archivoNombre: string;
  totalRegistros: number;
  registrosValidos: number;
  registrosConObservaciones: number;
  errores: { fila: number; campo: string; error: string; valorOriginal?: string }[];
  estado: 'Procesado' | 'Con observaciones' | 'Rechazado';
  usuarioResponsable: string;
}

export interface Factura {
  id: string;
  clienteId: string;
  clienteNombre: string;
  pais: string;
  moneda: string;
  periodo: string; // e.g. "2026-06"
  cantidadTrabajadores: number;
  feeAplicado: number;
  beneficiosCobrados: number;
  descuentos: number;
  impuestos: number;
  totalFacturado: number;
  pagosAplicados: number;
  saldoPendiente: number;
  estado: 'Borrador' | 'Emitida' | 'Enviada' | 'Pagada' | 'Vencida' | 'Anulada';
  fechaEmision: string;
  fechaVencimiento: string;
  observaciones?: string;
  asesorAsignado?: string;
  
  // Custom detailed invoice fields (IVA, fee, bank commission, WHT, taxes)
  baseFee?: number;
  iva?: number;
  comisionBancaria?: number;
  wht?: number;
  otrosImpuestos?: number;
  ivaPct?: number;
  comisionPct?: number;
  whtPct?: number;
  otrosImpuestosPct?: number;
  detallesTrabajadores?: { nombre: string; puesto: string; salario: number; fee: number; beneficios: number }[];
}

export interface Pago {
  id: string;
  facturaId: string;
  clienteId: string;
  clienteNombre: string;
  monto: number;
  moneda: string;
  fecha: string;
  metodo: string; // e.g. "Transferencia", "Tarjeta"
  comprobante: string; // reference/ticket number
  estado: 'Pendiente' | 'Parcial' | 'Completado' | 'Rechazado' | 'Reversado';
  observaciones?: string;
}

export interface HistorialLog {
  id: string;
  tabla: string;
  registroId: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  motivo: string;
  usuario: string;
  fecha: string;
}

export type Language = 'es' | 'en' | 'pt';

export const i18n = {
  es: {
    appName: 'Quick Hire',
    slogan: 'Gestión EOR Simplificada',
    landing: {
      title: 'Simplifica la contratación global con nuestro servicio Employer of Record (EOR)',
      subtitle: 'Contrata talento en América Latina sin crear sucursales locales. Cumplimos con la legislación local, gestionamos nóminas, cargas sociales y beneficios de forma 100% digital.',
      formTitle: 'Solicitud de Información y Alta de Servicio EOR',
      formSubtitle: 'Completa los datos de tu empresa y nos pondremos en contacto a la brevedad. Tu solicitud iniciará en estado "Recibida".',
      companyName: 'Nombre de la Empresa',
      country: 'País de Operación',
      serviceRequired: 'Servicio Requerido',
      currency: 'Moneda Preferida',
      employeesEst: 'Cantidad Estimada de Trabajadores',
      contactName: 'Nombre de Contacto',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      notes: 'Observaciones / Requisitos Particulares',
      submitBtn: 'Enviar Solicitud',
      successTitle: '¡Solicitud Recibida Exitosamente!',
      successDesc: 'Se ha creado la solicitud en el sistema con estado "Recibida". Nuestro equipo operativo la revisará a la brevedad.',
      exploreLanding: 'Ver Landing de Presentación',
      accessSystem: 'Acceder al Sistema',
      featuresTitle: 'Por qué elegir Quick Hire',
      feat1Title: 'Cumplimiento Local Garantizado',
      feat1Desc: 'Cargas sociales, contratos locales y regulaciones de cada país integradas de forma automatizada.',
      feat2Title: 'Carga Masiva Eficiente',
      feat2Desc: 'Carga y valida cientos de empleados con nuestra plantilla inteligente de validación en tiempo real.',
      feat3Title: 'Facturación Clara',
      feat3Desc: 'Visualiza tarifas por empleado, aportes patronales, beneficios opcionales y pagos en una sola plataforma.'
    },
    auth: {
      loginTitle: 'Iniciar Sesión',
      loginSubtitle: 'Ingresa tus credenciales para acceder a Quick Hire',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      role: 'Rol de Acceso',
      enter: 'Entrar',
      invalidCreds: 'Credenciales inválidas o cuenta inactiva',
      logout: 'Cerrar Sesión',
      mockHint: 'Cuentas de prueba: administrador-eor-peo@grupostt.com / cliente@clientcorp.com (Pass: 123456)'
    },
    menu: {
      dashboard: 'Panel de Control',
      workers: 'Trabajadores',
      requests: 'Solicitudes EOR',
      clients: 'Clientes',
      rates: 'Tarifas',
      benefits: 'Beneficios',
      socialCharges: 'Cargas Sociales',
      contracts: 'Contratos y Requisitos',
      templates: 'Plantillas de Carga',
      users: 'Usuarios',
      billing: 'Facturación y Pagos',
      logs: 'Trazabilidad',
      reports: 'Reportes',
      config: 'Configuración General'
    },
    clientDashboard: {
      welcome: 'Bienvenido,',
      summaryTitle: 'Resumen de Empresa',
      serviceType: 'Servicio Contratado',
      baseFee: 'Fee base por Empleado',
      allowance: 'Cupo de Trabajadores',
      workersRegistered: 'Trabajadores Activos',
      workersPending: 'En Revisión / Obs.',
      status: 'Estado Comercial',
      activeBenefits: 'Beneficios Base',
      chargeState: 'Estado General de Carga',
      noWorkersYet: 'Aún no has registrado ningún trabajador. ¡Comienza cargando un trabajador de forma individual o masiva!',
      downloadTemplate: 'Descargar Plantilla Oficial',
      uploadBulk: 'Carga Masiva de Trabajadores',
      individualBtn: 'Registrar Trabajador Individual',
      bulkBtn: 'Subir Carga Masiva'
    },
    adminDashboard: {
      title: 'Consola del Administrador',
      subtitle: 'Visión general de la operación global de Employer of Record',
      requestsPending: 'Solicitudes Recibidas',
      activeClients: 'Clientes Activos',
      activeWorkers: 'Trabajadores Totales',
      workersObs: 'Con Observaciones',
      billingSummary: 'Facturación y Saldos',
      pendingBilling: 'Facturas Pendientes',
      collected: 'Recaudado',
      unpaid: 'Saldo Pendiente',
      alerts: 'Alertas Operativas',
      countries: 'Países Activos',
      services: 'Servicios',
      newRequestAlert: 'Nueva solicitud recibida de {company} ({country})',
      obsAlert: 'Trabajador {worker} requiere atención por observaciones de plantilla',
      pendingInvoicesAlert: 'Nómina mensual requiere emitir facturas para el periodo actual.'
    },
    workers: {
      title: 'Gestión de Trabajadores',
      subtitle: 'Listado consolidado de colaboradores activos y en proceso de alta',
      addIndividual: 'Registrar Trabajador',
      bulkUpload: 'Carga Masiva',
      name: 'Nombre Completo',
      email: 'Correo',
      position: 'Puesto',
      startDate: 'Fecha Ingreso',
      salary: 'Salario',
      currency: 'Moneda',
      modality: 'Modalidad',
      status: 'Estado',
      actions: 'Acciones',
      filterClient: 'Filtrar por Cliente',
      filterCountry: 'Filtrar por País',
      filterStatus: 'Filtrar por Estado',
      searchPlaceholder: 'Buscar por nombre o puesto...',
      errorsDetected: 'Errores Detectados',
      validatedOk: 'Registros Válidos',
      obsLabel: 'Observaciones',
      editWorker: 'Editar Trabajador',
      details: 'Detalle del Trabajador',
      personalData: 'Datos Personales y Laborales',
      workMode: 'Modalidad de Trabajo',
      benefitsTitle: 'Beneficios Aplicables',
      socialChargesTitle: 'Cargas Sociales Estimadas (Automáticas por País)',
      socialChargesDesc: 'Cargas calculadas según regulaciones vigentes en {country}. No editables por el cliente.',
      saveBtn: 'Guardar Trabajador',
      registerSuccess: 'Trabajador registrado con éxito.',
      updateSuccess: 'Trabajador actualizado con éxito.'
    },
    bulk: {
      title: 'Procesamiento de Carga Masiva',
      downloadBtn: 'Descargar Plantilla Vigente ({version})',
      selectFile: 'Seleccionar Archivo de Carga (CSV o TSV)',
      dragDrop: 'Arrastra y suelta tu archivo aquí, o haz clic para buscar',
      instructions: 'Instrucciones: El archivo debe contener los encabezados oficiales: Nombre, Correo, Puesto, FechaIngreso, Salario, Moneda, Modalidad. Los errores críticos deben corregirse antes de guardar.',
      totalDetected: 'Total registros detectados',
      validRecords: 'Válidos para procesar',
      obsRecords: 'Con observaciones de validación',
      errorRecords: 'Filas con errores críticos',
      tableRow: 'Fila',
      tableField: 'Campo',
      tableError: 'Detalle del Error',
      originalValue: 'Valor original',
      processBtn: 'Procesar Carga Válida',
      historyTitle: 'Historial de Cargas Masivas',
      historyFilename: 'Archivo',
      historyDate: 'Fecha y Hora',
      historySuccess: 'Carga masiva procesada con éxito. Registros importados.'
    },
    requests: {
      title: 'Solicitudes de Servicio EOR',
      subtitle: 'Solicitudes recibidas desde el portal público de contratación',
      tableId: 'ID Solicitud',
      company: 'Empresa',
      country: 'País',
      service: 'Servicio',
      contact: 'Contacto',
      estWorkers: 'Trabajadores Est.',
      status: 'Estado',
      date: 'Fecha',
      viewDetail: 'Ver Detalle',
      detailsTitle: 'Detalle de Solicitud EOR',
      internalNotes: 'Notas Internas del Operador',
      changeStatus: 'Cambiar Estado',
      rejectBtn: 'Rechazar Solicitud',
      approveBtn: 'Aprobar Solicitud',
      createClientBtn: 'Convertir a Cliente',
      clientCreatedSuccess: '¡Cliente creado con éxito! Se ha habilitado la cuenta comercial con los datos precargados y cargas sociales automatizadas.'
    },
    clients: {
      title: 'Listado de Clientes EOR',
      subtitle: 'Administración de empresas clientes, cupos y configuraciones comerciales',
      addClient: 'Registrar Nuevo Cliente',
      company: 'Empresa / Cliente',
      country: 'País de Contratación',
      service: 'Servicio Contratado',
      baseFee: 'Fee por Trabajador',
      allowance: 'Cupo Máximo',
      registered: 'Cargados',
      status: 'Estado',
      details: 'Detalle del Cliente',
      feeSetup: 'Configuración Tarifaria',
      socialChargesApplied: 'Cargas Sociales Asociadas a este País',
      createClientForm: 'Crear Cliente / Configuración EOR',
      contactDetails: 'Datos de Contacto Comercial',
      billingConditions: 'Condiciones de Facturación',
      saveClientBtn: 'Guardar Cliente',
      autoChargesMsg: 'Cargas sociales aplicadas automáticamente desde el registro país:'
    },
    rates: {
      title: 'Tarifario del Servicio EOR',
      subtitle: 'Configuración de fees base, tramos de volumen y descuentos aplicables por país y servicio',
      addRate: 'Agregar Tarifa',
      country: 'País',
      service: 'Servicio',
      currency: 'Moneda',
      feeBase: 'Fee Base',
      volumeTiers: 'Tramos por Volumen',
      discount: 'Descuentos Aplicables',
      validity: 'Vigencia',
      status: 'Estado'
    },
    benefits: {
      title: 'Catálogo de Beneficios y Adicionales',
      subtitle: 'Seguros, equipos, viáticos y beneficios aplicables a contratos locales',
      addBenefit: 'Agregar Beneficio',
      name: 'Nombre del Beneficio',
      type: 'Tipo de Beneficio',
      frequency: 'Modalidad de Cobro',
      cost: 'Costo Base',
      appliesWorker: 'Aplica a Trabajador',
      appliesClient: 'Aplica a Cliente',
      status: 'Estado'
    },
    socialCharges: {
      title: 'Cargas Sociales y Aportes por País',
      subtitle: 'Administración centralizada de porcentajes y topes legales para el cálculo de nómina EOR',
      addCharge: 'Agregar Carga Social',
      type: 'Tipo de Aporte / Concepto',
      payer: 'Responsable de Pago',
      percentage: 'Porcentaje (%)',
      fixedAmount: 'Monto Fijo',
      cap: 'Tope / Límite',
      validity: 'Vigencia',
      lastUpdate: 'Última Actualización',
      responsible: 'Usuario Responsable',
      auditMsg: 'Las cargas sociales alimentan automáticamente la creación de nuevos clientes y estimaciones de nómina.'
    },
    contracts: {
      title: 'Contratos y Requisitos Legales',
      subtitle: 'Plantillas y documentación obligatoria requerida por país y tipo de servicio',
      addContract: 'Configurar Requisito',
      contractType: 'Tipo de Contrato',
      templateName: 'Nombre de Plantilla',
      requiredDocs: 'Documentos Requeridos',
      mandatory: 'Obligatorio',
      status: 'Estado'
    },
    templates: {
      title: 'Plantillas de Carga de Personal',
      subtitle: 'Control de versiones de plantillas Excel/CSV que los clientes deben descargar',
      addTemplate: 'Registrar Plantilla',
      name: 'Nombre de Plantilla',
      version: 'Versión',
      validFrom: 'Fecha de Vigencia',
      columns: 'Columnas Estructura',
      status: 'Estado'
    },
    users: {
      title: 'Gestión de Usuarios',
      subtitle: 'Control de accesos, roles y asignación de clientes para Quick Hire',
      addUser: 'Crear Usuario',
      name: 'Nombre',
      email: 'Correo Electrónico',
      role: 'Rol',
      associatedClient: 'Cliente Asociado',
      status: 'Estado',
      lastAccess: 'Último Acceso',
      actionActive: 'Activar',
      actionSuspend: 'Suspender',
      actionInactive: 'Inactivar'
    },
    billing: {
      title: 'Facturación y Control de Pagos EOR',
      subtitle: 'Generación de prefacturas mensuales por fee base, número de empleados activos y adicionales',
      generateInvoices: 'Generar Facturación del Periodo',
      invoiceId: 'Factura ID',
      period: 'Periodo',
      quantity: 'N° Empleados',
      total: 'Total Facturado',
      paid: 'Monto Pagado',
      pending: 'Saldo Pendiente',
      status: 'Estado Factura',
      actions: 'Acciones',
      generateSuccess: 'Facturación del periodo generada exitosamente basada en contratos activos.',
      invoiceDetails: 'Detalle de Factura',
      concept: 'Concepto / Detalle',
      unitPrice: 'Precio Unitario',
      subtotal: 'Subtotal',
      discounts: 'Descuentos por Volumen',
      taxes: 'Impuestos locales',
      recordPaymentBtn: 'Registrar Pago',
      paymentAmount: 'Monto a Registrar',
      paymentMethod: 'Método de Pago',
      receiptNo: 'N° Comprobante / Ref',
      paymentSuccess: 'Pago registrado con éxito. Factura actualizada.',
      invoiceStates: {
        Borrador: 'Borrador',
        Emitida: 'Emitida',
        Enviada: 'Enviada',
        Pagada: 'Pagada',
        Vencida: 'Vencida',
        Anulada: 'Anulada'
      }
    },
    logs: {
      title: 'Bitácora de Cambios Críticos (Trazabilidad EOR)',
      subtitle: 'Auditoría detallada de modificaciones en tarifas, cargas sociales, datos de facturación y configuraciones',
      table: 'Módulo / Sección',
      field: 'Campo Modificado',
      oldValue: 'Valor Anterior',
      newValue: 'Valor Nuevo',
      reason: 'Motivo del Cambio',
      user: 'Usuario Responsable',
      date: 'Fecha de Cambio'
    },
    reports: {
      title: 'Módulo de Reportes Operativos',
      subtitle: 'Indicadores clave del servicio Employer of Record',
      tabGeneral: 'General',
      tabFinancial: 'Financiero',
      tabWorkers: 'Trabajadores',
      cardsByCountry: 'Clientes por País',
      cardsByStatus: 'Solicitudes por Estado',
      billingByClient: 'Facturación por Cliente',
      evolution: 'Evolución Mensual',
      exportBtn: 'Exportar Reporte (CSV)',
      searchLabel: 'Filtrar por Periodo'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      status: 'Estado',
      active: 'Activo',
      inactive: 'Inactivo',
      all: 'Todos',
      search: 'Buscar',
      actions: 'Acciones',
      close: 'Cerrar',
      back: 'Volver',
      loading: 'Cargando...',
      success: 'Operación realizada con éxito',
      reasonRequired: 'Es necesario ingresar un motivo para registrar este cambio crítico.',
      reasonLabel: 'Motivo del Cambio (Requerido para Auditoría)',
      systemLogs: 'Ver Bitácora de Auditoría'
    }
  },
  en: {
    appName: 'Quick Hire',
    slogan: 'EOR Management Simplified',
    landing: {
      title: 'Simplify Global Hiring with our Employer of Record (EOR) Service',
      subtitle: 'Hire talent in Latin America and Europe without establishing local entities. We handle local compliance, manage payroll, social charges, and benefits 100% digitally.',
      formTitle: 'Information Request & EOR Service Onboarding',
      formSubtitle: 'Fill in your company details and we will contact you shortly. Your request will automatically start in "Received" status.',
      companyName: 'Company Name',
      country: 'Operating Country',
      serviceRequired: 'Required Service',
      currency: 'Preferred Currency',
      employeesEst: 'Estimated Employee Count',
      contactName: 'Contact Name',
      email: 'Email Address',
      phone: 'Phone Number',
      notes: 'Special Remarks / Custom Requirements',
      submitBtn: 'Submit Request',
      successTitle: 'Request Received Successfully!',
      successDesc: 'Your request has been created in the system with "Received" status. Our operational team will review it shortly.',
      exploreLanding: 'View Presentation Landing',
      accessSystem: 'Access System',
      featuresTitle: 'Why Choose Quick Hire',
      feat1Title: 'Guaranteed Local Compliance',
      feat1Desc: 'Social security contributions, local agreements, and regulations of each country are automatically integrated.',
      feat2Title: 'Efficient Bulk Upload',
      feat2Desc: 'Upload and validate hundreds of employees with our real-time smart validation template.',
      feat3Title: 'Clear and Honest Invoicing',
      feat3Desc: 'Monitor employee rates, employer contributions, optional benefits, and payments all in a single platform.'
    },
    auth: {
      loginTitle: 'Sign In',
      loginSubtitle: 'Enter your credentials to access Quick Hire',
      email: 'Email Address',
      password: 'Password',
      role: 'Access Role',
      enter: 'Login',
      invalidCreds: 'Invalid credentials or inactive account',
      logout: 'Sign Out',
      mockHint: 'Test accounts: administrador-eor-peo@grupostt.com / cliente@clientcorp.com (Pass: 123456)'
    },
    menu: {
      dashboard: 'Dashboard',
      workers: 'Workers',
      requests: 'EOR Requests',
      clients: 'Clients',
      rates: 'Rates',
      benefits: 'Benefits',
      socialCharges: 'Social Charges',
      contracts: 'Contracts & Req.',
      templates: 'Upload Templates',
      users: 'Users',
      billing: 'Billing & Payments',
      logs: 'Audit Logs',
      reports: 'Reports',
      config: 'General Settings'
    },
    clientDashboard: {
      welcome: 'Welcome,',
      summaryTitle: 'Company Summary',
      serviceType: 'Contracted Service',
      baseFee: 'Base Fee per Employee',
      allowance: 'Worker Cap Allowance',
      workersRegistered: 'Active Workers',
      workersPending: 'Under Review / Obs.',
      status: 'Commercial Status',
      activeBenefits: 'Base Benefits',
      chargeState: 'General Upload Status',
      noWorkersYet: 'You have not registered any workers yet. Start by adding a worker individually or via bulk upload!',
      downloadTemplate: 'Download Official Template',
      uploadBulk: 'Bulk Employee Upload',
      individualBtn: 'Register Individual Worker',
      bulkBtn: 'Upload Bulk Template'
    },
    adminDashboard: {
      title: 'Administrator Console',
      subtitle: 'Global overview of Employer of Record operations',
      requestsPending: 'Requests Received',
      activeClients: 'Active Clients',
      activeWorkers: 'Total Workers',
      workersObs: 'With Issues',
      billingSummary: 'Invoicing & Balances',
      pendingBilling: 'Pending Invoices',
      collected: 'Collected',
      unpaid: 'Outstanding Balance',
      alerts: 'Operational Alerts',
      countries: 'Active Countries',
      services: 'Services',
      newRequestAlert: 'New request received from {company} ({country})',
      obsAlert: 'Worker {worker} requires attention due to validation remarks',
      pendingInvoicesAlert: 'Monthly payroll requires generating invoices for the current period.'
    },
    workers: {
      title: 'Worker Management',
      subtitle: 'Consolidated list of active employees and onboarding processes',
      addIndividual: 'Add Worker',
      bulkUpload: 'Bulk Upload',
      name: 'Full Name',
      email: 'Email',
      position: 'Position',
      startDate: 'Start Date',
      salary: 'Salary',
      currency: 'Currency',
      modality: 'Work Mode',
      status: 'Status',
      actions: 'Actions',
      filterClient: 'Filter by Client',
      filterCountry: 'Filter by Country',
      filterStatus: 'Filter by Status',
      searchPlaceholder: 'Search by name or position...',
      errorsDetected: 'Errors Detected',
      validatedOk: 'Valid Records',
      obsLabel: 'Remarks',
      editWorker: 'Edit Worker',
      details: 'Worker Details',
      personalData: 'Personal & Job Data',
      workMode: 'Work Mode',
      benefitsTitle: 'Applicable Benefits',
      socialChargesTitle: 'Estimated Social Charges (Auto-filled by Country)',
      socialChargesDesc: 'Contributions calculated based on active regulations in {country}. Client cannot edit.',
      saveBtn: 'Save Worker',
      registerSuccess: 'Worker registered successfully.',
      updateSuccess: 'Worker updated successfully.'
    },
    bulk: {
      title: 'Bulk Onboarding Processing',
      downloadBtn: 'Download Active Template ({version})',
      selectFile: 'Select Upload File (CSV or TSV)',
      dragDrop: 'Drag and drop your file here, or click to browse',
      instructions: 'Instructions: The file must contain the official headers: Nombre, Correo, Puesto, FechaIngreso, Salario, Moneda, Modalidad. Critical errors must be fixed before saving.',
      totalDetected: 'Total records detected',
      validRecords: 'Valid to process',
      obsRecords: 'With validation remarks',
      errorRecords: 'Rows with critical errors',
      tableRow: 'Row',
      tableField: 'Field',
      tableError: 'Error Details',
      originalValue: 'Original value',
      processBtn: 'Process Valid Upload',
      historyTitle: 'Bulk Upload History',
      historyFilename: 'File Name',
      historyDate: 'Date & Time',
      historySuccess: 'Bulk upload processed successfully. Workers imported.'
    },
    requests: {
      title: 'EOR Service Requests',
      subtitle: 'Applications received from the public hiring portal',
      tableId: 'Request ID',
      company: 'Company',
      country: 'Country',
      service: 'Service',
      contact: 'Contact',
      estWorkers: 'Est. Workers',
      status: 'Status',
      date: 'Date',
      viewDetail: 'View Detail',
      detailsTitle: 'EOR Request Details',
      internalNotes: 'Operator Internal Notes',
      changeStatus: 'Change Status',
      rejectBtn: 'Reject Request',
      approveBtn: 'Approve Request',
      createClientBtn: 'Convert to Client',
      clientCreatedSuccess: 'Client created successfully! The business account has been initialized with prefilled data and automated social charges.'
    },
    clients: {
      title: 'EOR Client Directory',
      subtitle: 'Manage client accounts, workforce allowance, and commercial setups',
      addClient: 'Register New Client',
      company: 'Company / Client',
      country: 'Hiring Country',
      service: 'Contracted Service',
      baseFee: 'Fee per Worker',
      allowance: 'Max Allowance Limit',
      registered: 'Active Workers',
      status: 'Status',
      details: 'Client Details',
      feeSetup: 'Commercial Fee Settings',
      socialChargesApplied: 'Social Charges Associated with this Country',
      createClientForm: 'Create Client / EOR Configuration',
      contactDetails: 'Business Contact Info',
      billingConditions: 'Billing Terms',
      saveClientBtn: 'Save Client Account',
      autoChargesMsg: 'Social charges automatically mapped based on the registered country:'
    },
    rates: {
      title: 'EOR Service Rate Cards',
      subtitle: 'Configure base fees, volume discount brackets, and country/service validity rules',
      addRate: 'Add Rate Card',
      country: 'Country',
      service: 'Service',
      currency: 'Currency',
      feeBase: 'Base Fee',
      volumeTiers: 'Volume Brackets',
      discount: 'Applicable Discounts',
      validity: 'Validity Period',
      status: 'Status'
    },
    benefits: {
      title: 'Benefits & Add-ons Catalog',
      subtitle: 'Insurances, equipment, stipends, and optional local benefits',
      addBenefit: 'Add Benefit',
      name: 'Benefit Name',
      type: 'Benefit Type',
      frequency: 'Billing Cycle',
      cost: 'Base Cost',
      appliesWorker: 'Applies to Employee',
      appliesClient: 'Applies to Client Account',
      status: 'Status'
    },
    socialCharges: {
      title: 'Social Charges & Contributions by Country',
      subtitle: 'Centralized tax percentage and cap limits for automated EOR payroll estimation',
      addCharge: 'Add Social Charge',
      type: 'Contribution Type',
      payer: 'Payer Liability',
      percentage: 'Percentage (%)',
      fixedAmount: 'Fixed Amount',
      cap: 'Cap / Limit',
      validity: 'Validity Period',
      lastUpdate: 'Last Updated',
      responsible: 'Updated By',
      auditMsg: 'Social charges automatically populate new client EOR quotes and payroll mockups.'
    },
    contracts: {
      title: 'Contracts & Statutory Requirements',
      subtitle: 'Pre-vetted templates and onboarding documents required per country/service',
      addContract: 'Set Obligation Rule',
      contractType: 'Contract Type',
      templateName: 'Template Reference',
      requiredDocs: 'Required Documents',
      mandatory: 'Mandatory',
      status: 'Status'
    },
    templates: {
      title: 'Hiring Templates',
      subtitle: 'Manage template structures (Excel/CSV) that clients must download and fill out',
      addTemplate: 'Register Template',
      name: 'Template Name',
      version: 'Version',
      validFrom: 'Effective Date',
      columns: 'Required Columns',
      status: 'Status'
    },
    users: {
      title: 'User Access Control',
      subtitle: 'Manage logins, permissions, roles, and client ownership assignments',
      addUser: 'Create User Profile',
      name: 'Full Name',
      email: 'Email',
      role: 'Role',
      associatedClient: 'Client Organization',
      status: 'Status',
      lastAccess: 'Last Login',
      actionActive: 'Activate',
      actionSuspend: 'Suspend',
      actionInactive: 'Deactivate'
    },
    billing: {
      title: 'EOR Billing & Payments',
      subtitle: 'Track monthly retainer invoices generated based on worker counts and additional benefits',
      generateInvoices: 'Generate Current Period Billing',
      invoiceId: 'Invoice ID',
      period: 'Billing Period',
      quantity: 'Workers count',
      total: 'Total Invoiced',
      paid: 'Amount Paid',
      pending: 'Outstanding Balance',
      status: 'Invoice Status',
      actions: 'Actions',
      generateSuccess: 'Monthly invoices successfully generated based on active work agreements.',
      invoiceDetails: 'Invoice Detail View',
      concept: 'Concept / Description',
      unitPrice: 'Unit Price',
      subtotal: 'Subtotal',
      discounts: 'Volume Discounts',
      taxes: 'Local Taxes',
      recordPaymentBtn: 'Record Payment Receipt',
      paymentAmount: 'Amount to Apply',
      paymentMethod: 'Payment Mode',
      receiptNo: 'Receipt Reference #',
      paymentSuccess: 'Payment registered successfully. Invoice balance updated.',
      invoiceStates: {
        Borrador: 'Draft',
        Emitida: 'Issued',
        Enviada: 'Sent',
        Pagada: 'Paid',
        Vencida: 'Overdue',
        Anulada: 'Cancelled'
      }
    },
    logs: {
      title: 'Critical Audit Logs (EOR Traceability)',
      subtitle: 'Detailed chronological registry of rate changes, tax additions, and commercial tweaks',
      table: 'Module / Area',
      field: 'Modified Property',
      oldValue: 'Previous Value',
      newValue: 'New Value',
      reason: 'Change Reason',
      user: 'Operator',
      date: 'Timestamp'
    },
    reports: {
      title: 'Operational Reports',
      subtitle: 'Key business metrics of Employer of Record global operations',
      tabGeneral: 'General',
      tabFinancial: 'Financials',
      tabWorkers: 'Workforce',
      cardsByCountry: 'Clients by Country',
      cardsByStatus: 'Requests by State',
      billingByClient: 'Billing by Client',
      evolution: 'Monthly Evolution',
      exportBtn: 'Export Report (CSV)',
      searchLabel: 'Filter by Period'
    },
    common: {
      save: 'Save Changes',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      all: 'All',
      search: 'Search',
      actions: 'Actions',
      close: 'Close',
      back: 'Back',
      loading: 'Loading...',
      success: 'Operation completed successfully',
      reasonRequired: 'A justified reason is required to submit this critical change for compliance tracking.',
      reasonLabel: 'Change Justification / Compliance Reason (Required)',
      systemLogs: 'Check Audit Registry'
    }
  },
  pt: {
    appName: 'Quick Hire',
    slogan: 'Gestão EOR Simplificada',
    landing: {
      title: 'Simplifique a contratação global com nosso serviço Employer of Record (EOR)',
      subtitle: 'Contrate talentos na América Latina sem precisar abrir filiais locais. Garantimos conformidade legal, gestão de folha de pagamento, encargos sociais e benefícios 100% digitais.',
      formTitle: 'Solicitação de Informações e Início de Serviço EOR',
      formSubtitle: 'Preencha os dados da sua empresa e entraremos em contato em breve. Sua solicitação iniciará com o status "Recebida".',
      companyName: 'Nome da Empresa',
      country: 'País de Operação',
      serviceRequired: 'Serviço Requerido',
      currency: 'Moeda Preferida',
      employeesEst: 'Quantidade Estimada de Trabalhadores',
      contactName: 'Nome de Contato',
      email: 'E-mail de Contato',
      phone: 'Telefone',
      notes: 'Observações / Requisitos Especiais',
      submitBtn: 'Enviar Solicitação',
      successTitle: 'Solicitação Recebida com Sucesso!',
      successDesc: 'A solicitação foi criada no sistema com status "Recebida". Nossa equipe de operações analisará os dados em breve.',
      exploreLanding: 'Ver Landing de Apresentação',
      accessSystem: 'Acessar o Sistema',
      featuresTitle: 'Por que escolher a Quick Hire',
      feat1Title: 'Conformidade Local Garantida',
      feat1Desc: 'Encargos trabalhistas, contratos locais e regulamentações de cada país integrados automaticamente.',
      feat2Title: 'Carga em Lote Eficiente',
      feat2Desc: 'Cadastre e valide centenas de funcionários com nossa planilha inteligente com validação em tempo real.',
      feat3Title: 'Faturamento Transparente',
      feat3Desc: 'Acompanhe as taxas por funcionário, contribuições patronais, benefícios adicionais e pagamentos em uma só tela.'
    },
    auth: {
      loginTitle: 'Iniciar Sessão',
      loginSubtitle: 'Insira suas credenciais para acessar o Quick Hire',
      email: 'E-mail',
      password: 'Senha',
      role: 'Função de Acesso',
      enter: 'Entrar',
      invalidCreds: 'Credenciais inválidas ou conta inativa',
      logout: 'Sair',
      mockHint: 'Contas de teste: administrador-eor-peo@grupostt.com / cliente@clientcorp.com (Senha: 123456)'
    },
    menu: {
      dashboard: 'Painel de Controle',
      workers: 'Trabalhadores',
      requests: 'Solicitações EOR',
      clients: 'Clientes',
      rates: 'Tarifas',
      benefits: 'Benefícios',
      socialCharges: 'Encargos Sociais',
      contracts: 'Contratos e Requisitos',
      templates: 'Modelos de Carga',
      users: 'Usuários',
      billing: 'Faturamento e Pagos',
      logs: 'Auditoria (Logs)',
      reports: 'Relatórios',
      config: 'Configuração Geral'
    },
    clientDashboard: {
      welcome: 'Bem-vindo,',
      summaryTitle: 'Resumo da Empresa',
      serviceType: 'Serviço Contratado',
      baseFee: 'Taxa Base por Funcionário',
      allowance: 'Limite de Trabalhadores',
      workersRegistered: 'Trabalhadores Ativos',
      workersPending: 'Em Análise / Obs.',
      status: 'Status Comercial',
      activeBenefits: 'Benefícios Base',
      chargeState: 'Estado Geral de Carga',
      noWorkersYet: 'Você ainda não registrou nenhum trabalhador. Comece cadastrando um funcionário individualmente ou em lote!',
      downloadTemplate: 'Baixar Modelo Oficial',
      uploadBulk: 'Carga Massiva de Trabalhadores',
      individualBtn: 'Cadastrar Funcionário Individual',
      bulkBtn: 'Subir Carga em Lote'
    },
    adminDashboard: {
      title: 'Console de Administrador',
      subtitle: 'Visão geral da operação global de Employer of Record',
      requestsPending: 'Solicitações Recebidas',
      activeClients: 'Clientes Ativos',
      activeWorkers: 'Trabalhadores Totais',
      workersObs: 'Com Observações',
      billingSummary: 'Faturamento e Saldos',
      pendingBilling: 'Faturas Pendentes',
      collected: 'Arrecadado',
      unpaid: 'Saldo Pendente',
      alerts: 'Alertas Operacionais',
      countries: 'Países Ativos',
      services: 'Serviços',
      newRequestAlert: 'Nova solicitação recebida de {company} ({country})',
      obsAlert: 'O trabalhador {worker} exige atenção devido a observações na importação',
      pendingInvoicesAlert: 'A folha mensal necessita gerar faturas para o período atual.'
    },
    workers: {
      title: 'Gestão de Trabalhadores',
      subtitle: 'Lista consolidada de colaboradores ativos e em processo de admissão',
      addIndividual: 'Cadastrar Trabalhador',
      bulkUpload: 'Carga em Lote',
      name: 'Nome Completo',
      email: 'E-mail',
      position: 'Cargo',
      startDate: 'Data de Admissão',
      salary: 'Salário',
      currency: 'Moeda',
      modality: 'Modalidade',
      status: 'Status',
      actions: 'Ações',
      filterClient: 'Filtrar por Cliente',
      filterCountry: 'Filtrar por País',
      filterStatus: 'Filtrar por Status',
      searchPlaceholder: 'Buscar por nome ou cargo...',
      errorsDetected: 'Erros Detectados',
      validatedOk: 'Registros Válidos',
      obsLabel: 'Observações',
      editWorker: 'Editar Trabalhador',
      details: 'Detalhes do Trabalhador',
      personalData: 'Dados Pessoais e Profissionais',
      workMode: 'Modalidade de Trabalho',
      benefitsTitle: 'Benefícios Aplicáveis',
      socialChargesTitle: 'Encargos Sociais Estimados (Automáticos por País)',
      socialChargesDesc: 'Encargos calculados conforme legislação vigente em {country}. Não editável pelo cliente.',
      saveBtn: 'Salvar Trabalhador',
      registerSuccess: 'Trabalhador cadastrado com sucesso.',
      updateSuccess: 'Trabalhador atualizado com sucesso.'
    },
    bulk: {
      title: 'Processamento de Carga em Lote',
      downloadBtn: 'Baixar Modelo Vigente ({version})',
      selectFile: 'Selecionar Arquivo de Carga (CSV ou TSV)',
      dragDrop: 'Arraste e solte seu arquivo aqui, ou clique para buscar',
      instructions: 'Instruções: O arquivo deve conter os cabeçalhos oficiais: Nombre, Correo, Puesto, FechaIngreso, Salario, Moneda, Modalidad. Erros críticos devem ser corrigidos antes de salvar.',
      totalDetected: 'Total de registros detectados',
      validRecords: 'Válidos para processar',
      obsRecords: 'Com observações de validação',
      errorRecords: 'Linhas com erros críticos',
      tableRow: 'Linha',
      tableField: 'Campo',
      tableError: 'Detalhe do Erro',
      originalValue: 'Valor original',
      processBtn: 'Processar Importação Válida',
      historyTitle: 'Histórico de Importações',
      historyFilename: 'Nome do Arquivo',
      historyDate: 'Data e Hora',
      historySuccess: 'Carga em lote processada com sucesso. Trabalhadores importados.'
    },
    requests: {
      title: 'Solicitações de Serviço EOR',
      subtitle: 'Solicitações recebidas através do portal público de contratação',
      tableId: 'ID Solicitação',
      company: 'Empresa',
      country: 'País',
      service: 'Serviço',
      contact: 'Contato',
      estWorkers: 'Trabalhadores Est.',
      status: 'Status',
      date: 'Data',
      viewDetail: 'Ver Detalhes',
      detailsTitle: 'Detalhes da Solicitação EOR',
      internalNotes: 'Notas Internas de Operações',
      changeStatus: 'Alterar Status',
      rejectBtn: 'Rejeitar Solicitação',
      approveBtn: 'Aprovar Solicitação',
      createClientBtn: 'Converter em Cliente',
      clientCreatedSuccess: 'Cliente criado com sucesso! Conta comercial ativada com dados pré-carregados e encargos automáticos.'
    },
    clients: {
      title: 'Listagem de Clientes EOR',
      subtitle: 'Administração de contas de empresas clientes, limites e acordos comerciais',
      addClient: 'Registrar Novo Cliente',
      company: 'Empresa / Cliente',
      country: 'País de Contratação',
      service: 'Serviço Contratado',
      baseFee: 'Taxa por Funcionário',
      allowance: 'Limite Máximo',
      registered: 'Cadastrados',
      status: 'Status',
      details: 'Detalhes do Cliente',
      feeSetup: 'Configuração Comercial de Taxas',
      socialChargesApplied: 'Encargos Sociais Associados a este País',
      createClientForm: 'Criar Cliente / Configuração EOR',
      contactDetails: 'Dados de Contato Comercial',
      billingConditions: 'Condições de Faturamento',
      saveClientBtn: 'Salvar Conta de Cliente',
      autoChargesMsg: 'Encargos trabalhistas vinculados automaticamente baseados no país cadastrado:'
    },
    rates: {
      title: 'Tabela de Tarifas EOR',
      subtitle: 'Configuração de taxas base, descontos progressivos e vigências por país e serviço',
      addRate: 'Adicionar Tarifa',
      country: 'País',
      service: 'Serviço',
      currency: 'Moeda',
      feeBase: 'Taxa Base',
      volumeTiers: 'Faixas de Volume',
      discount: 'Descontos Aplicáveis',
      validity: 'Vigência',
      status: 'Status'
    },
    benefits: {
      title: 'Catálogo de Benefícios e Adicionais',
      subtitle: 'Seguros, equipamentos, auxílios e benefícios aplicáveis aos contratos locais',
      addBenefit: 'Adicionar Benefício',
      name: 'Nome do Benefício',
      type: 'Tipo de Benefício',
      frequency: 'Ciclo de Cobrança',
      cost: 'Custo Base',
      appliesWorker: 'Aplica-se ao Trabalhador',
      appliesClient: 'Aplica-se à Empresa Cliente',
      status: 'Status'
    },
    socialCharges: {
      title: 'Encargos Sociais e Contribuições por País',
      subtitle: 'Gestão de taxas patronais e limites legais para cálculo automatizado de folha EOR',
      addCharge: 'Adicionar Encargo Social',
      type: 'Tipo de Encargo / Contribuição',
      payer: 'Responsabilidade de Pagamento',
      percentage: 'Porcentagem (%)',
      fixedAmount: 'Valor Fixo',
      cap: 'Teto / Limite',
      validity: 'Período de Vigência',
      lastUpdate: 'Última Atualização',
      responsible: 'Atualizado Por',
      auditMsg: 'Os encargos sociais são aplicados automaticamente na contratação de clientes e estimativas salariais.'
    },
    contracts: {
      title: 'Contratos e Requisitos Legais',
      subtitle: 'Modelos e documentos obrigatórios exigidos por país e tipo de serviço',
      addContract: 'Configurar Regra de Documentação',
      contractType: 'Tipo de Contrato',
      templateName: 'Nome do Modelo',
      requiredDocs: 'Documentos Exigidos',
      mandatory: 'Obrigatório',
      status: 'Status'
    },
    templates: {
      title: 'Modelos para Importação de Funcionários',
      subtitle: 'Controle de versões de modelos de arquivo (Excel/CSV) que os clientes devem baixar',
      addTemplate: 'Cadastrar Modelo',
      name: 'Nome do Modelo',
      version: 'Versão',
      validFrom: 'Data de Vigência',
      columns: 'Colunas Necessárias',
      status: 'Status'
    },
    users: {
      title: 'Controle de Acessos de Usuários',
      subtitle: 'Gerenciamento de contas, permissões, funções e atribuição de empresas',
      addUser: 'Criar Perfil de Usuário',
      name: 'Nome Completo',
      email: 'E-mail de Login',
      role: 'Função',
      associatedClient: 'Empresa Cliente',
      status: 'Status',
      lastAccess: 'Último Acesso',
      actionActive: 'Ativar',
      actionSuspend: 'Suspender',
      actionInactive: 'Inativar'
    },
    billing: {
      title: 'Faturamento e Controle de Pagamentos',
      subtitle: 'Acompanhamento de faturas mensais geradas com base na contagem de funcionários e benefícios adicionais',
      generateInvoices: 'Gerar Faturamento do Período',
      invoiceId: 'ID da Fatura',
      period: 'Período de Faturamento',
      quantity: 'N° Funcionários',
      total: 'Total Faturado',
      paid: 'Valor Pago',
      pending: 'Saldo Pendente',
      status: 'Status da Fatura',
      actions: 'Ações',
      generateSuccess: 'Faturamento do período gerado com sucesso baseado em contratos de trabalho ativos.',
      invoiceDetails: 'Detalhamento da Fatura',
      concept: 'Conceito / Descrição',
      unitPrice: 'Preço Unitário',
      subtotal: 'Subtotal',
      discounts: 'Descontos por Volume',
      taxes: 'Impostos locais',
      recordPaymentBtn: 'Registrar Comprovante de Pagamento',
      paymentAmount: 'Valor a Aplicar',
      paymentMethod: 'Modo de Pagamento',
      receiptNo: 'Referência do Comprovante',
      paymentSuccess: 'Pagamento registrado com sucesso. Saldo da fatura atualizado.',
      invoiceStates: {
        Borrador: 'Rascunho',
        Emitida: 'Emitida',
        Enviada: 'Enviada',
        Pagada: 'Paga',
        Vencida: 'Atrasada',
        Anulada: 'Cancelada'
      }
    },
    logs: {
      title: 'Histórico de Alterações Críticas (Auditoria EOR)',
      subtitle: 'Registro cronológico detalhado de revisões de tarifas, novos impostos e alterações comerciais',
      table: 'Módulo / Setor',
      field: 'Propriedade Alterada',
      oldValue: 'Valor Anterior',
      newValue: 'Valor Novo',
      reason: 'Motivo da Alteração',
      user: 'Responsável',
      date: 'Data e Hora'
    },
    reports: {
      title: 'Relatórios de Negócios',
      subtitle: 'Métricas e indicadores operacionais globais de Employer of Record',
      tabGeneral: 'Geral',
      tabFinancial: 'Financeiro',
      tabWorkers: 'Equipe',
      cardsByCountry: 'Clientes por País',
      cardsByStatus: 'Solicitações por Status',
      billingByClient: 'Faturamento por Cliente',
      evolution: 'Evolução Mensual',
      exportBtn: 'Exportar Relatório (CSV)',
      searchLabel: 'Filtrar por Período'
    },
    common: {
      save: 'Salvar Alterações',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Excluir',
      status: 'Status',
      active: 'Ativo',
      inactive: 'Inativo',
      all: 'Todos',
      search: 'Buscar',
      actions: 'Ações',
      close: 'Fechar',
      back: 'Voltar',
      loading: 'Carregando...',
      success: 'Operação concluída com sucesso',
      reasonRequired: 'É necessário preencher um motivo para justificar esta alteração para fins de conformidade comercial.',
      reasonLabel: 'Justificativa de Conformidade / Motivo da Alteração (Obrigatório)',
      systemLogs: 'Ver Histórico de Auditoria'
    }
  }
};

export interface PlantillaContrato {
  id: string;
  nombre: string;
  tipo: 'comercial' | 'laboral' | 'adendum';
  pais: string;
  servicio: string;
  version: string;
  vigencia: string;
  estado: 'Activo' | 'Inactivo';
  idioma?: Language;
  variables: string[];
  archivoBase: string;
  observaciones?: string;
  usuarioResponsable: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface HistorialContratoComercial {
  id: string;
  contratoId: string;
  accion: string; // 'Creado' | 'Generado' | 'Enviado' | 'Visto' | 'Firmado/Devuelto' | 'Rechazado' | 'Aprobado' | 'Cambio de estado' | 'Observaciones registradas'
  estadoAnterior?: string;
  estadoNuevo: string;
  usuario: string;
  fecha: string;
  observaciones?: string;
  archivoRelacionado?: string;
}

export interface ContratoComercial {
  id: string;
  solicitudId?: string;
  clienteId: string;
  clienteNombre: string;
  pais: string;
  servicioContratado: string;
  moneda: string;
  feePorEmpleado: number;
  cupoTrabajadores?: number;
  condicionesComerciales?: string;
  beneficiosContratados?: string[];
  representanteCliente?: string;
  representanteProveedor?: string;
  fechaGeneracion?: string;
  estado: 'Borrador' | 'Generado' | 'Enviado al cliente' | 'Visto por cliente' | 'Pendiente de firma del cliente' | 'Firmado por cliente' | 'En revisión interna' | 'Aprobado' | 'Rechazado' | 'Con observaciones' | 'Pendiente de pago' | 'Anulado' | 'Pagado' | 'Servicio liberado';
  contenido?: string;
  plantillaId?: string;
  versionPlantilla?: string;
  fechaVencimiento?: string;
  terminosLegales?: string;
  firmaCliente?: { nombre: string; fecha: string; ip?: string; imagen?: string };
  firmaProveedor?: { nombre: string; fecha: string; ip?: string; imagen?: string };
  observaciones?: string;
  usuarioCreador: string;
  fechaLiberacion?: string;
  asesorAsignado?: string;
  fechaEnvio?: string;
  fechaFirma?: string;
  fechaVisto?: string;
  firmadoPorCliente?: boolean;
  firmadoPorProveedor?: boolean;
  archivoFirmado?: string;
  cedulaJuridica?: string;
  direccion?: string;
  historial?: HistorialContratoComercial[];
}

export interface ContratoLaboral {
  id: string;
  clienteId: string;
  clienteNombre?: string;
  trabajadorId: string;
  trabajadorNombre: string;
  trabajadorCorreo?: string;
  pais: string;
  servicio?: string;
  tipoContrato?: string;
  puesto: string;
  fechaIngreso: string;
  salario: number;
  moneda: string;
  modalidadTrabajo?: string;
  beneficiosAplicables?: string[];
  plantillaId?: string;
  estado: 'No disponible' | 'Pendiente de liberación' | 'Disponible' | 'Generado' | 'Enviado a firma' | 'Pendiente de firma' | 'Firmado' | 'Rechazado' | 'Con observaciones' | 'Anulado';
  contenido?: string;
  firmadoPorTrabajador?: boolean;
  firmadoPorEmpresa?: boolean;
  documentoUrl?: string;
  fechaGeneracion?: string;
  usuarioCreador?: string;
  firmaTrabajador?: { nombre: string; fecha: string; ip?: string; imagen?: string };
  firmaRepresentante?: { nombre: string; fecha: string; ip?: string; imagen?: string };
  archivoFirmado?: string;
  observaciones?: string;
  historial?: { fecha: string; accion: string; estadoAnterior: string; estadoNuevo: string; usuario: string; observaciones?: string }[];
}

export interface Adendum {
  id: string;
  contratoComercialId: string;
  clienteId: string;
  clienteNombre?: string;
  pais: string;
  servicio: string;
  motivoCambio: string;
  descripcionCambio?: string;
  plantillaId?: string;
  fechaGeneracion: string;
  estado: 'Borrador' | 'Generado' | 'Enviado' | 'Pendiente de firma' | 'Firmado' | 'Aprobado' | 'Anulado';
  contenido: string;
  archivoFirmado?: string;
  usuarioResponsable?: string;
  observaciones?: string;
  firma?: { nombre: string; fecha: string; ip?: string; imagen?: string };
  usuarioCreador?: string;
  historial?: { fecha: string; accion: string; estadoAnterior: string; estadoNuevo: string; usuario: string; observaciones?: string }[];
}

export interface TipoCambio {
  id: string;
  pais?: string;
  monedaOrigen: string;
  monedaDestino: string;
  tasa: number;
  fecha: string;
  baseTasa?: number;
  porcentajeSuma?: number;
}

export interface TicketComentario {
  id: string;
  autor: string;
  autorEmail: string;
  autorRol: 'cliente' | 'supracliente' | 'asesor_comercial' | 'administrador' | 'trabajador' | string;
  mensaje: string;
  fecha: string;
  esInterno?: boolean;
  adjuntoNombre?: string;
  adjuntoUrl?: string;
}

export interface Ticket {
  id: string;
  clienteId: string;
  clienteNombre?: string;
  supraclienteId?: string;
  solicitanteNombre?: string;
  solicitanteEmail?: string;
  solicitanteRol?: string;
  asunto: string;
  descripcion: string;
  categoria?: 'Soporte General' | 'Nómina y Pagos' | 'Contratos y Adendums' | 'Facturación' | 'Consultas Laborales' | 'Altas y Bajas' | 'Beneficios' | 'Otro' | string;
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado: string; // 'Nuevo' | 'Abierto' | 'En Proceso' | 'Pendiente de Cliente' | 'Respondido' | 'Resuelto' | 'Cerrado'
  fechaCreacion: string;
  fechaActualizacion?: string;
  asesorAsignado?: string; // Advisor email
  adminAsignado?: string;
  
  // Dynamic SLA attributes
  slaReglaId?: string;
  slaHorasRespuesta?: number;
  slaHorasResolucion?: number;
  slaFechaLimiteRespuesta?: string;
  slaFechaLimiteResolucion?: string;
  slaEstado?: 'Dentro de tiempo' | 'Próximo a vencer' | 'Vencido' | 'Cumplido' | 'Escalado';
  fechaPrimeraRespuesta?: string;
  fechaResolucion?: string;
  fechaCierre?: string;
  
  // Satisfaction evaluation
  calificacion?: number; // 1 to 5
  comentarioCalificacion?: string;
  
  // Thread & attachments
  comentarios?: TicketComentario[];
  adjuntos?: string[];
  historial?: { fecha: string; usuario: string; accion: string; detalle?: string }[];
}

export interface SlaConfig {
  id: string;
  pais: string;
  tiempoRespuestaHoras: number;
}

export interface PlantillaNotificacion {
  id: string;
  codigo: string;
  nombre: string;
  evento: string;
  canal: 'correo' | 'plataforma' | 'ambos';
  idioma: 'es' | 'en' | 'pt';
  asunto: string;
  plantilla: string; // Se usa como cuerpo del mensaje
  variables: string[];
  activo: boolean;
  usuarioResponsable: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface ConfiguracionSistema {
  correoRemitente: string;
  nombreRemitente: string;
  correoCopiaSolicitudes?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  notificacionesActivas?: boolean;
}

export interface HistorialNotificacion {
  id: string;
  evento: string;
  plantillaId: string;
  canal: string;
  destinatario: string;
  correoDestinatario?: string;
  remitente?: string;
  correoRemitente?: string;
  entidadRelacionada: string; // solicitud, contrato, pago, ticket, trabajador, adendum, etc
  entidadId?: string;
  fecha: string;
  estado: 'Pendiente' | 'Enviada' | 'Fallida' | 'Reintentada' | 'Cancelada';
  idioma: string;
  error?: string;
  usuarioDisparador?: string;
}

export interface AlertaNotificacion {
  id: string;
  usuario: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  leido?: boolean; // Para compatibilidad con !a.leido
  fecha: string;
  evento?: string;
  prioridad?: 'Baja' | 'Media' | 'Alta';
  enlace?: string;
}

export interface SeguimientoComercial {
  id: string;
  relacionadoTipo: 'solicitud' | 'cliente' | 'contrato';
  relacionadoId: string;
  relacionadoNombre: string;
  tipoSeguimiento: string; // e.g. "Llamada", "Reunión", "Correo", "Observación", "Otro"
  comentario: string;
  fecha: string;
  usuario: string; // User email / name
  proximaAccion?: string;
  fechaProximaGestion?: string;
  estadoComercialSugerido?: string;
}

export interface PagoContadoUSD {
  id: string;
  clienteId: string;
  clienteNombre: string;
  contratoId: string;
  pais: string;
  servicio: string;
  concepto: string;
  montoUsd: number;
  monedaLocal?: string;
  tipoCambio: number;
  fechaPago?: string;
  metodoPago?: string;
  archivoSoporte?: string; // base64, URL, or filename of uploaded receipt
  estado: 'Pendiente' | 'Soporte cargado' | 'En revisión' | 'Validado' | 'Rechazado' | 'Aplicado' | 'Anulado';
  usuarioCarga?: string;
  usuarioValidacion?: string;
  fechaValidacion?: string;
  observaciones?: string;
  fechaCreacion: string;
  historial?: {
    estadoAnterior?: string;
    estadoNuevo: string;
    usuario: string;
    fecha: string;
    observaciones?: string;
  }[];
}

export interface HistorialLiberacion {
  id: string;
  clienteId: string;
  clienteNombre: string;
  contratoId?: string;
  pagoId?: string;
  estadoAnterior: string;
  estadoNuevo: string;
  usuario: string;
  fecha: string;
  motivo?: string;
  observaciones?: string;
  eventoGenerado?: string;
  notificacionEnviada?: boolean;
}

export interface DatabaseSchema {
  solicitudes: SolicitudEOR[];
  clientes: Cliente[];
  trabajadores: Trabajador[];
  cargasSociales: CargaSocial[];
  tarifas: Tarifa[];
  beneficios: Beneficio[];
  contratos: ContratoRequisito[];
  plantillas: PlantillaCarga[];
  usuarios: User[];
  historialCargas: HistorialCargaMasiva[];
  facturas: Factura[];
  pagos: Pago[];
  logs: HistorialLog[];
  configuracionFactura?: { ivaPct: number; comisionPct: number; whtPct: number; impuestoPct: number };
  configuracionSistema?: ConfiguracionSistema;
  plantillasContrato: PlantillaContrato[];
  contratosComerciales: ContratoComercial[];
  contratosLaborales: ContratoLaboral[];
  adendums: Adendum[];
  tiposCambio?: TipoCambio[];
  tickets?: Ticket[];
  slaConfigs?: SlaConfig[];
  plantillasNotificacion?: PlantillaNotificacion[];
  alertasNotificacion?: AlertaNotificacion[];
  historialNotificaciones?: HistorialNotificacion[];
  seguimientosComerciales?: SeguimientoComercial[];
  pagosContadoUSD?: PagoContadoUSD[];
  historialLiberacion?: HistorialLiberacion[];
  reglasSla?: ReglaSla[];
  slaSeguimientos?: SlaSeguimiento[];
  slaHistoriales?: SlaHistorial[];
  alertasOperativas?: AlertaOperativa[];
  historialAlertasOperativas?: HistorialAlerta[];
  auditLogs?: AuditLog[];
  traducciones?: Traduccion[];
  directorio?: DirectorioContacto[];
  cuentasBancarias?: CuentaBancariaMaestra[];
  tarifarios?: TarifarioEOR[];
  reglasTributarias?: ReglaTributariaIvaWht[];
  roles?: RoleDefinition[];
}

export interface Traduccion {
  id: string; // e.g. 'menu.dashboard'
  es: string;
  en: string;
  pt: string;
  modulo: string;
  activo: boolean;
  fechaActualizacion: string;
  usuarioResponsable: string;
}

export interface AlertaOperativa {
  id: string;
  tipoAlerta: 'Informativa' | 'Preventiva' | 'Crítica' | 'Vencida' | 'Bloqueante';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  estado: 'Nueva' | 'En gestión' | 'Resuelta' | 'Vencida' | 'Escalada' | 'Cerrada' | 'Cancelada';
  entidadRelacionada: 'solicitud' | 'contrato' | 'pago' | 'servicio' | 'ticket' | 'trabajador' | 'carga masiva' | 'adendum';
  entidadId: string;
  clienteId?: string;
  clienteNombre?: string;
  pais?: string;
  usuarioResponsable?: string; // email
  rolResponsable?: string; // rol e.g. 'administrador', 'supracliente', 'asesor_comercial', 'cliente'
  fechaCreacion: string;
  fechaLimite?: string;
  fechaResolucion?: string;
  descripcionCorta: string;
  accionRequerida: string;
  enlace: string;
  usuarioResolvio?: string;
  observaciones?: string;
}

export interface HistorialAlerta {
  id: string;
  alertaId: string;
  accion: 'Creación de alerta' | 'Cambio de estado' | 'Cambio de prioridad' | 'Asignación o reasignación' | 'Escalamiento' | 'Resolución' | 'Cierre';
  usuarioResponsable: string;
  fechaHora: string;
  observaciones?: string;
}

export interface ReglaSla {
  id: string;
  nombre?: string;
  tipoProceso: string; // e.g. 'ticket_soporte', 'ticket_creado', 'contrato_comercial_enviado', etc.
  categoria?: string; // e.g. 'Soporte General', 'Facturación', 'Nómina y Pagos', 'Legal', 'Operaciones', etc.
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  pais?: string; // Unified Global standard
  clienteId?: string; // Global or specific
  tiempoRespuestaHoras: number;
  tiempoResolucionHoras: number;
  horarioLaboral?: '24/7' | '8x5 (Lun-Vie 8:00-18:00)' | '12x5' | string;
  responsablePrincipal: string; // e.g. email or role
  responsableEscalamiento: string; // e.g. email
  tiempoAlertaPreviaHoras?: number;
  activo: boolean;
  descripcion?: string;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string;
}

export interface SlaSeguimiento {
  id: string;
  tipoProceso: string;
  entidadTipo: 'ticket' | 'contrato_comercial' | 'pago' | 'servicio' | 'contrato_laboral' | 'adendum';
  entidadId: string;
  clienteId: string;
  clienteNombre?: string;
  pais: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  responsable: string;
  fechaInicio: string;
  fechaLimiteRespuesta: string;
  fechaLimiteResolucion: string;
  fechaRespuesta?: string;
  fechaResolucion?: string;
  estadoSla: 'Dentro de tiempo' | 'Próximo a vencer' | 'Vencido' | 'Escalado' | 'Resuelto dentro de SLA' | 'Resuelto fuera de SLA' | 'Pausado';
  escalamientoAplicado: boolean;
  usuarioResponsable: string;
  observaciones?: string;
}

export interface SlaHistorial {
  id: string;
  slaId: string;
  fechaHora: string;
  accion: 'SLA asignado' | 'Cambio de estado' | 'Pausa' | 'Reanudación' | 'Primera respuesta' | 'Resolución' | 'Vencimiento' | 'Escalamiento';
  estadoAnterior?: string;
  estadoNuevo?: string;
  usuarioResponsable: string;
  observaciones?: string;
  eventoNotificacion?: string;
}

export interface AuditLog {
  id: string;
  usuario: string; // email
  rol: Role;
  fechaHora: string; // ISO string
  modulo: string;
  accion: string;
  entidadAfectada: string;
  entidadId?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivoObservacion?: string;
  identificadorTecnico?: string; // IP or browser/client info
  resultado: 'exitoso' | 'fallido' | 'bloqueado';
  mensajeError?: string;
}

export const ALL_COUNTRIES = LATAM_COUNTRIES;
