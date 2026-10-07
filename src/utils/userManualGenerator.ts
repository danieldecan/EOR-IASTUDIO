import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Role } from '../types';

export interface ManualSection {
  title: string;
  subtitle?: string;
  screenDescription: string;
  steps: string[];
  tips?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface RoleManualConfig {
  roleId: Role;
  title: string;
  subtitle: string;
  targetAudience: string;
  version: string;
  lastUpdated: string;
  description: string;
  sections: ManualSection[];
  faq: { question: string; answer: string }[];
  permissionsMatrix: { module: string; accessLevel: string; notes: string }[];
}

export const MANUALS_DATA: Record<Role, RoleManualConfig> = {
  supracliente: {
    roleId: 'supracliente',
    title: 'Manual de Usuario - Super Admin (Supracliente)',
    subtitle: 'Guía Operativa y de Control Master para la Gestión Global Quick Hire',
    targetAudience: 'Directores de Operaciones, Super Administradores y Ejecutivos Holding',
    version: '2.5.0',
    lastUpdated: '2026-07-23',
    description: 'Manual integral para la supervisión global de cuentas corporativas, validación de liberaciones en USD, parametrización de niveles de servicio (SLA), beneficios y gobernanza multi-país.',
    permissionsMatrix: [
      { module: 'Supervisión Global Cuentas', accessLevel: 'Total (Crear, Editar, Congelar, Activar)', notes: 'Gestión master de supraclientes y empresas cliente.' },
      { module: 'Liberación de Servicios USD', accessLevel: 'Aprobación / Anulación Final', notes: 'Validación de pagos de contado en USD y liberación del servicio EOR.' },
      { module: 'Gobernanza SLA & Alertas', accessLevel: 'Parametrización Global', notes: 'Definición de reglas de escalamiento y alertas en tiempo real.' },
      { module: 'Diccionario Multilenguaje', accessLevel: 'Edición Master', notes: 'Administración de términos en ES, EN y PT.' }
    ],
    sections: [
      {
        title: '1. Resumen y Arquitectura de Control Master',
        screenDescription: 'El panel Supracliente ofrece una vista panorámica ejecutiva de todas las operaciones EOR internacionales en tiempo real, consolidando métricas financieras, clientes activos, estado de servicios e indicadores de riesgo.',
        steps: [
          'Inicie sesión con sus credenciales de Super Admin.',
          'Consulte los KPI estratégicos en la barra superior: Total Clientes, Servicios Activos vs. Congelados, Facturación Mensual USD y Tickets Abiertos.',
          'Navegue entre las pestañas superiores: Clientes & Servicios, Liberaciones USD, SLA & Alertas y Reportes Ejecutivos.'
        ]
      },
      {
        title: '2. Módulo de Liberación de Servicios USD (Pagos de Contado)',
        screenDescription: 'Pantalla de control financiero dedicada a revisar los comprobantes de depósito/transferencia en USD de los clientes para activar o suspender formalmente el servicio EOR.',
        steps: [
          'Haga clic en la pestaña "Liberación de Servicios USD".',
          'Filtre los registros por estado: "En Revisión", "Validado", "Aplicado" o "Anulado".',
          'Para validar un pago, seleccione la fila correspondiente y haga clic en "Ver Soporte".',
          'Examine la imagen o documento del comprobante bancario adjunto.',
          'Haga clic en "Aprobar y Liberar Servicio". Ingrese la observación obligatoria.',
          'El sistema cambiará automáticamente el estado del cliente a "Servicio Liberado / Activo" y notificará por correo en el idioma configurado.'
        ],
        tableData: {
          headers: ['Estado Pago', 'Acción Permitida', 'Efecto Operativo'],
          rows: [
            ['En revisión', 'Validar / Rechazar', 'Pendiente de confirmación de fondos en cuenta bancaria.'],
            ['Validado', 'Aplicar Liberación', 'Genera registro de activación formal de nómina EOR.'],
            ['Rechazado', 'Re-solicitar Soporte', 'Notifica al cliente el rechazo especificando el motivo.'],
            ['Anulado', 'Ninguna (Cerrado)', 'Invalida la transacción por inconsistencias o duplicidad.']
          ]
        }
      },
      {
        title: '3. Gobernanza SLA y Alertas Operativas',
        screenDescription: 'Módulo para configurar las ventanas de respuesta máximas (Horas SLA) según la prioridad de las solicitudes y los tickets de soporte.',
        steps: [
          'Ingrese a "Configuración SLA".',
          'Defina los tiempos límite para prioridades Crítica, Alta, Media y Baja.',
          'Active las reglas de escalamiento automático por correo cuando el SLA alcance el 80% o supere el 100% del tiempo estipulado.'
        ]
      }
    ],
    faq: [
      { question: '¿Cómo congelar un cliente por impago?', answer: 'En el panel de Clientes, haga clic en "Actualizar Estado Servicio", seleccione "Suspendido por Impago" e indique la justificación.' },
      { question: '¿Un Super Admin puede modificar el idioma predeterminado del sistema?', answer: 'Sí, desde el módulo Diccionario Multilenguaje puede ajustar los textos en ES, EN y PT.' }
    ]
  },

  administrador: {
    roleId: 'administrador',
    title: 'Manual de Usuario - Administrador EOR',
    subtitle: 'Guía de Operaciones, Gestión de Nómina, Contratos y Atenciones Administrativas',
    targetAudience: 'Administradores Operativos, Gestores de Recursos Humanos y Coordinadores de Nómina EOR',
    version: '2.5.0',
    lastUpdated: '2026-07-23',
    description: 'Manual de referencia operativa para la atención de solicitudes EOR, enrolamiento de trabajadores, emisión de contratos comerciales y laborales, facturación periódica y soporte técnico.',
    permissionsMatrix: [
      { module: 'Solicitudes EOR', accessLevel: 'Completo (Aprobar, Cotizar, Rechazar)', notes: 'Evaluación y procesamiento de solicitudes de clientes prospectos.' },
      { module: 'Clientes & Trabajadores', accessLevel: 'Alta, Carga Masiva y Edición', notes: 'Administración de ficha técnica y contratos de empleados.' },
      { module: 'Contratos & Adendums', accessLevel: 'Generación y Firma Digital', notes: 'Creación de contratos comerciales y laborales por país e idioma.' },
      { module: 'Cargas Sociales y Tarifas', accessLevel: 'Configuración Regulada', notes: 'Mantenimiento de tablas de retenciones por país.' },
      { module: 'Facturación & Pagos', accessLevel: 'Generación e Ingreso de Pagos', notes: 'Emisión de facturas periódicas y validación de cobros.' }
    ],
    sections: [
      {
        title: '1. Procesamiento de Solicitudes EOR',
        screenDescription: 'Panel de control principal donde se reciben y gestionan las cotizaciones y solicitudes de contratación internacional enviadas por prospectos o clientes.',
        steps: [
          'Vaya a la pestaña "Solicitudes EOR".',
          'Haga clic en la solicitud que desea gestionar.',
          'Revise los datos: Empresa, País de Contratación, Cantidad de Empleados, Puesto y Salario Estimado.',
          'Haga clic en "Calcular Cotización" para generar el desglose de Cargas Sociales y Fee Quick Hire.',
          'Seleccione "Aprobar Solicitud" para derivarla a creación de contrato comercial.'
        ]
      },
      {
        title: '2. Registro de Trabajadores y Carga Masiva de Nómina',
        screenDescription: 'Módulo para el enrolamiento individual o masivo de colaboradores contratados bajo la modalidad EOR.',
        steps: [
          'Ingrese a la sección "Trabajadores".',
          'Para registro individual: presione "Nuevo Trabajador" y complete el formulario (Datos Personales, Puesto, Salario, Moneda, Beneficios).',
          'Para Carga Masiva: haga clic en "Carga Masiva Excel", descargue la plantilla estándar en el idioma correspondiente, complete los campos solicitados y suba el archivo.',
          'El sistema validará sintaxis de datos y creará automáticamente los expedientes digitales.'
        ]
      },
      {
        title: '3. Emisión de Contratos Comerciales, Laborales y Adendums',
        screenDescription: 'Centro de generación documental respaldado por plantillas legales dinámicas por país e idioma.',
        steps: [
          'Seleccione la pestaña "Contratos & Documentos".',
          'Haga clic en "Crear Contrato Comercial" o "Crear Contrato Laboral".',
          'Elija el Cliente, País, Idioma del Contrato (ES/EN/PT) y Plantilla Base.',
          'Complete las variables del contrato (Fecha Inicio, Cargo, Cláusulas Especiales).',
          'Haga clic en "Generar Documento PDF". El documento se enviará para firma electrónica al cliente o trabajador.'
        ]
      },
      {
        title: '4. Facturación, Cobros y Conciliación',
        screenDescription: 'Modulo financiero para generar proformas, facturas de servicios EOR y conciliar depósitos.',
        steps: [
          'Ingrese a "Facturación y Pagos".',
          'Haga clic en "Generar Factura Período". Seleccione el cliente y el mes de cobro.',
          'Revise la liquidación de Nómina + Cargas Sociales + Fee EOR.',
          'Haga clic en "Emitir Factura" y envíela al correo del cliente.'
        ]
      }
    ],
    faq: [
      { question: '¿Qué ocurre si un trabajador tiene beneficios extralegales?', answer: 'Puede agregarlos en la ficha del trabajador bajo el apartado "Adicionales Extralegales" para que se desglosen correctamente en la facturación.' },
      { question: '¿Cómo se asignan los países a un administrador?', answer: 'Un Super Admin define la lista de países asignados en la ficha del usuario Administrador.' }
    ]
  },

  asesor_comercial: {
    roleId: 'asesor_comercial',
    title: 'Manual de Usuario - Asesor Comercial',
    subtitle: 'Guía de Prospección, Registro de Actividades, Cotizaciones y Seguimiento a Clientes',
    targetAudience: 'Ejecutivos Comerciales, Business Development Managers y Consultores de Ventas EOR',
    version: '2.5.0',
    lastUpdated: '2026-07-23',
    description: 'Manual de uso para la gestión comercial en Quick Hire: seguimiento de prospectos EOR, registro de minutas/llamadas, envío de cotizaciones preliminares y canalización hacia contratación formal.',
    permissionsMatrix: [
      { module: 'Embudo de Solicitudes', accessLevel: 'Consulta y Actualización Comercial', notes: 'Acceso a las solicitudes asignadas a su gestión comercial.' },
      { module: 'Seguimiento & Minutas', accessLevel: 'Creación de Bitácora', notes: 'Registro de llamadas, reuniones y propuestas comerciales.' },
      { module: 'Directorio de Clientes', accessLevel: 'Solo Lectura', notes: 'Consulta de estado de clientes asignados.' },
      { module: 'Tickets de Soporte', accessLevel: 'Creación y Seguimiento', notes: 'Atención a inquietudes comerciales de clientes.' }
    ],
    sections: [
      {
        title: '1. Embudo Comercial y Solicitudes EOR',
        screenDescription: 'El panel comercial muestra el listado de oportunidades y solicitudes asignadas al asesor, ordenadas por etapa (Nueva, Cotizada, En Negociación, Cerrada/Aprobada).',
        steps: [
          'Inicie sesión como Asesor Comercial.',
          'Consulte el embudo en la sección "Mis Solicitudes Asignadas".',
          'Haga clic en una solicitud para ver los detalles del prospecto (Empresa, Contacto, País de interés, Número de puestos).'
        ]
      },
      {
        title: '2. Registro de Seguimiento Comercial (Llamadas, Correos, Minutas)',
        screenDescription: 'Herramienta para mantener la trazabilidad de cada interacción con el prospecto y evitar alertas de inactividad comercial.',
        steps: [
          'En el detalle de la solicitud, haga clic en "Agregar Seguimiento Comercial".',
          'Seleccione el tipo de actividad: "Llamada Telefónica", "Reunión Virtual", "Envío de Cotización" o "Correo de Seguimiento".',
          'Escriba las notas clave de la conversación y el próximo compromiso.',
          'Defina la "Fecha del Próximo Contacto". El sistema agendará el recordatorio en su tablero.'
        ]
      },
      {
        title: '3. Simulador de Cotizaciones y Fee EOR',
        screenDescription: 'Calculadora integrada para estimar el costo total de empleabilidad EOR (Salario + Cargas Sociales Estimadas + Fee) para entregar cotizaciones rápidas al cliente.',
        steps: [
          'Haga clic en el botón "Simular Cotización EOR".',
          'Seleccione el País de Contratación y la Moneda.',
          'Ingrese el salario bruto propuesto.',
          'El sistema desglosará automáticamente la carga social estimada del empleador y el Fee EOR sugerido.',
          'Haga clic en "Exportar Cotización PDF" para enviarla por correo al cliente.'
        ]
      },
      {
        title: '4. Canalización a Contratación Formal',
        screenDescription: 'Procedimiento para marcar una oportunidad como "Cerrada / Aprobada" y transferir el expediente al equipo de Administración para la emisión de contratos.',
        steps: [
          'Una vez que el cliente acepta la cotización, actualice el estado a "Aprobada por Cliente".',
          'Adjunte los datos legales completos de la empresa (Cédula Jurídica / Tax ID, Representante Legal, Correo de Facturación).',
          'Haga clic en "Solicitar Emisión de Contrato Comercial".'
        ]
      }
    ],
    faq: [
      { question: '¿Por qué aparece una alerta roja de inactividad comercial?', answer: 'Ocurre cuando una solicitud asignada lleva más de 5 días hábiles sin ninguna minuta o seguimiento registrado.' },
      { question: '¿Puedo modificar los datos de facturación de un cliente firmado?', answer: 'No, los cambios en clientes existentes deben solicitarse al equipo de Administradores.' }
    ]
  },

  cliente: {
    roleId: 'cliente',
    title: 'Manual de Usuario - Cliente (Empresa Contratante)',
    subtitle: 'Guía de Autoservicio para Solicitudes, Firma de Contratos, Nómina y Soporte',
    targetAudience: 'Directores de RRHH, Gerentes de Operaciones y Administradores de Empresas Cliente',
    version: '2.5.0',
    lastUpdated: '2026-07-23',
    description: 'Manual de usuario del portal de autoservicio de Quick Hire para clientes corporativos: cómo solicitar contrataciones EOR, firmar contratos y adendums, revisar su nómina, subir pagos y abrir tickets de soporte.',
    permissionsMatrix: [
      { module: 'Portal de Inicio & Dashboard', accessLevel: 'Visualización de Equipo & KPIs', notes: 'Resumen de colaboradores activos por país y costo total.' },
      { module: 'Solicitar Nueva Contratación', accessLevel: 'Creación de Solicitudes EOR', notes: 'Envío de peticiones para integrar nuevos trabajadores EOR.' },
      { module: 'Contratos & Firma Digital', accessLevel: 'Revisión y Firma Electrónica', notes: 'Acceso a contratos comerciales y adendums.' },
      { module: 'Nómina & Colaboradores', accessLevel: 'Consulta y Carga Masiva', notes: 'Vista de expediente de trabajadores y reporte de novedades.' },
      { module: 'Facturación & Pagos USD', accessLevel: 'Consulta y Carga de Comprobantes', notes: 'Subida de comprobantes de pago para activación de servicio.' },
      { module: 'Módulo de Soporte / Tickets', accessLevel: 'Apertura y Seguimiento de Tickets', notes: 'Comunicación directa con la mesa de ayuda EOR.' }
    ],
    sections: [
      {
        title: '1. Navegación en el Portal del Cliente',
        screenDescription: 'Al ingresar, verá el resumen ejecutivo de su cuenta: cantidad de trabajadores contratados, países operativos, estado de sus contratos y facturas pendientes.',
        steps: [
          'Inicie sesión con su correo corporativo y contraseña.',
          'Consulte los paneles de acceso rápido: "Mis Trabajadores", "Solicitudes EOR", "Mis Facturas" y "Mis Contratos".',
          'Seleccione su idioma preferido (Español, English, Português) en el selector superior derecho.'
        ]
      },
      {
        title: '2. Cómo Presentar una Nueva Solicitud de Contratación EOR',
        screenDescription: 'Formulario simplificado para solicitar la contratación de personal en cualquiera de los países soportados por Quick Hire.',
        steps: [
          'Haga clic en el botón "Nueva Solicitud EOR".',
          'Seleccione el País de Contratación, Título del Puesto, Moneda de Pago y Salario Bruto Mensual.',
          'Indique si el trabajador requiere beneficios opcionales (Seguro Médico, Vale de Alimentación, etc.).',
          'Complete el nombre y correo de contacto del candidato.',
          'Haga clic en "Enviar Solicitud". Recibirá una notificación confirmando la recepción y la cotización formal.'
        ]
      },
      {
        title: '3. Firma de Contratos Comerciales y Adendums',
        screenDescription: 'Modulo seguro para revisar y firmar electrónicamente los acuerdos legales de servicio EOR y sus anexos.',
        steps: [
          'Ingrese a la sección "Contratos Comerciales".',
          'Si tiene un contrato o adendum pendiente de firma, verá la alerta "Pendiente de Firma".',
          'Haga clic en "Ver Documento PDF" para leer los términos legales.',
          'Haga clic en "Firmar Digitalmente", ingrese el nombre del representante legal autorizador y confirme.',
          'El documento quedará registrado con sello de fecha y hora.'
        ]
      },
      {
        title: '4. Registro de Pagos USD y Activación de Servicio',
        screenDescription: 'Módulo para subir la evidencia del depósito o transferencia bancaria en USD correspondiente al costo de la nómina y servicio EOR.',
        steps: [
          'Acceda a "Facturación y Pagos USD".',
          'Ubique la proforma o el cobro de contado pendiente.',
          'Haga clic en "Subir Comprobante de Pago".',
          'Indique el Método de Pago (Transferencia Swift/ACH/Cable), Fecha del Depósito y adjunte el archivo PDF/PNG.',
          'El equipo de Finanzas validará el soporte y notificará la liberación del servicio.'
        ]
      },
      {
        title: '5. Apertura de Tickets de Soporte y Consultas Reguladas',
        screenDescription: 'Canal directo para consultar inquietudes sobre nómina, vacaciones, bajas o temas legales del personal contratado.',
        steps: [
          'Vaya a "Soporte y Tickets".',
          'Haga clic en "Crear Nuevo Ticket".',
          'Elija la categoría (Nómina, Duda Legal, Incidencia, Vacaciones).',
          'Describa la consulta y adjunte archivos de soporte si es necesario.',
          'Siga las respuestas del equipo EOR en tiempo real.'
        ]
      }
    ],
    faq: [
      { question: '¿Dónde puedo descargar las facturas electrónicas de meses anteriores?', answer: 'En la pestaña "Facturas y Pagos", utilice el filtro por año/mes y presione el botón "Descargar PDF".' },
      { question: '¿Cómo puedo cambiar el idioma de las notificaciones que recibo por correo?', answer: 'Vaya a su Perfil de Usuario en la esquina superior derecha y seleccione su idioma de preferencia (ES, EN o PT).' }
    ]
  },
  prospecto: {
    roleId: 'prospecto',
    title: 'Manual de Usuario - Cliente (Empresa Contratante)',
    subtitle: 'Guía de Autoservicio para Solicitudes, Firma de Contratos, Nómina y Soporte',
    targetAudience: 'Directores de RRHH, Gerentes de Operaciones y Administradores de Empresas Cliente',
    version: '2.5.0',
    lastUpdated: '2026-07-23',
    description: 'Manual de usuario del portal de autoservicio de Quick Hire para clientes corporativos: cómo solicitar contrataciones EOR, firmar contratos y adendums, revisar su nómina, subir pagos y abrir tickets de soporte.',
    permissionsMatrix: [
      { module: 'Portal de Inicio & Dashboard', accessLevel: 'Visualización de Equipo & KPIs', notes: 'Resumen de colaboradores activos por país y costo total.' },
      { module: 'Solicitar Nueva Contratación', accessLevel: 'Creación de Solicitudes EOR', notes: 'Envío de peticiones para integrar nuevos trabajadores EOR.' },
      { module: 'Contratos & Firma Digital', accessLevel: 'Revisión y Firma Electrónica', notes: 'Acceso a contratos comerciales y adendums.' },
      { module: 'Nómina & Colaboradores', accessLevel: 'Consulta y Carga Masiva', notes: 'Vista de expediente de trabajadores y reporte de novedades.' },
      { module: 'Facturación & Pagos USD', accessLevel: 'Consulta y Carga de Comprobantes', notes: 'Subida de comprobantes de pago para activación de servicio.' },
      { module: 'Módulo de Soporte / Tickets', accessLevel: 'Apertura y Seguimiento de Tickets', notes: 'Comunicación directa con la mesa de ayuda EOR.' }
    ],
    sections: [
      {
        title: '1. Navegación en el Portal del Cliente',
        screenDescription: 'Al ingresar, verá el resumen ejecutivo de su cuenta: cantidad de trabajadores contratados, países operativos, estado de sus contratos y facturas pendientes.',
        steps: [
          'Inicie sesión con su correo corporativo y contraseña.',
          'Consulte los paneles de acceso rápido: "Mis Trabajadores", "Solicitudes EOR", "Mis Facturas" y "Mis Contratos".',
          'Seleccione su idioma preferido (Español, English, Português) en el selector superior derecho.'
        ]
      },
      {
        title: '2. Cómo Presentar una Nueva Solicitud de Contratación EOR',
        screenDescription: 'Formulario simplificado para solicitar la contratación de personal en cualquiera de los países soportados por Quick Hire.',
        steps: [
          'Haga clic en el botón "Nueva Solicitud EOR".',
          'Seleccione el País de Contratación, Título del Puesto, Moneda de Pago y Salario Bruto Mensual.',
          'Indique si el trabajador requiere beneficios opcionales (Seguro Médico, Vale de Alimentación, etc.).',
          'Complete el nombre y correo de contacto del candidato.',
          'Haga clic en "Enviar Solicitud". Recibirá una notificación confirmando la recepción y la cotización formal.'
        ]
      }
    ],
    faq: [
      { question: '¿Dónde puedo descargar las facturas electrónicas de meses anteriores?', answer: 'En la pestaña "Facturas y Pagos", utilice el filtro por año/mes y presione el botón "Descargar PDF".' },
      { question: '¿Cómo puedo cambiar el idioma de las notificaciones que recibo por correo?', answer: 'Vaya a su Perfil de Usuario en la esquina superior derecha y seleccione su idioma de preferencia (ES, EN o PT).' }
    ]
  },

  ejecutivo: {
    roleId: 'ejecutivo',
    title: 'Manual de Usuario - Ejecutivo de Cuenta / Asesor Comercial',
    subtitle: 'Guía de Asignación por País, Gestión de Oportunidades y Tarifas EOR',
    targetAudience: 'Ejecutivos de Cuenta, Asesores Comerciales y Especialistas de Asignación por País',
    version: '2.5.0',
    lastUpdated: '2026-08-10',
    description: 'Manual operativo para Ejecutivos de Cuenta y Asesores Comerciales asignados automáticamente por país: gestión de leads desde la landing, simulador de tarifas EOR y seguimiento de propuestas.',
    permissionsMatrix: [
      { module: 'Asignación Automática por País', accessLevel: 'Recepción Directa', notes: 'Recepción aleatoria de leads de la landing según país asignado.' },
      { module: 'Gestión Comercial & Seguimiento', accessLevel: 'Creación de Minutas y Estados', notes: 'Actualización de estatus de prospección y minutas de llamadas.' },
      { module: 'Matriz de Tarifas & Fees por País', accessLevel: 'Consulta de Estructura EOR', notes: 'Acceso a la tabla oficial de fees EOR por país.' }
    ],
    sections: [
      {
        title: '1. Asignación Automática de Leads por País',
        screenDescription: 'Módulo de recepción directa de prospectos y solicitudes que llegan desde la landing page.',
        steps: [
          'Al ingresar una nueva solicitud desde la landing, el sistema detecta el país.',
          'Asigna automáticamente un Ejecutivo o Asesor activo configurado para dicho país.',
          'Notifica al Ejecutivo mediante alerta en la plataforma para iniciar el contacto.'
        ]
      }
    ],
    faq: [
      { question: '¿Cómo se asigna el país a mi perfil de Ejecutivo?', answer: 'El Administrador asigna el país de operación durante la creación o modificación de su usuario.' }
    ]
  },

  gestion_cuentas: {
    roleId: 'gestion_cuentas',
    title: 'Manual de Usuario - Gestión de Cuentas Bancarias',
    subtitle: 'Guía de Tesorería para la Administración de Cuentas Bancarias Maestras STT',
    targetAudience: 'Analistas de Tesorería, Gerentes Financieros y Administradores de Cuentas',
    version: '2.5.0',
    lastUpdated: '2026-08-11',
    description: 'Manual de usuario exclusivo para el módulo de Gestión de Cuentas Bancarias: administración del maestro de cuentas bancarias de las sociedades STT, sociedades titulares, bancos y monedas.',
    permissionsMatrix: [
      { module: 'Maestro de Cuentas Bancarias', accessLevel: 'Control Total (Crear, Editar, Activar/Inactivar)', notes: 'Administración de cuentas maestras y operativas por país y sociedad.' },
      { module: 'Directorio de Actores', accessLevel: 'Consulta & Copiado', notes: 'Acceso a datos de contacto de gerentes y ejecutivos.' }
    ],
    sections: [
      {
        title: '1. Maestro de Cuentas Bancarias',
        screenDescription: 'Catálogo oficial de cuentas bancarias maestras y operativas de las sociedades STT en América Latina y EE.UU.',
        steps: [
          'Inicie sesión con su usuario con rol de Gestión de Cuentas (tesoreria-eor-peo@grupostt.com).',
          'Acceda a la pestaña "Maestro de Cuentas" en el menú lateral.',
          'Consulte el listado de cuentas con sociedad titular, país, moneda, banco, número de cuenta y estado.',
          'Utilice el botón "Agregar Cuenta Bancaria" para registrar una nueva cuenta o "Editar" para modificar una existente.'
        ]
      }
    ],
    faq: [
      { question: '¿Quién tiene acceso a ver las cuentas bancarias maestras?', answer: 'Únicamente los usuarios con el rol específico de "Gestión de Cuentas Bancarias" y Administradores Generales.' }
    ]
  }
};

/**
 * Generate a styled PDF User Manual for a specific role
 */
export function generateUserManualPDF(role: Role, userLanguage: 'es' | 'en' | 'pt' = 'es'): jsPDF {
  const manual = MANUALS_DATA[role] || MANUALS_DATA['cliente'];
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [30, 41, 59]; // slate-800
  const accentColor = [79, 70, 229]; // indigo-600
  const lightBg = [248, 250, 252]; // slate-50
  const textColor = [51, 65, 85]; // slate-700

  // --- PAGE 1: COVER PAGE ---
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 297, 'F');

  // Decorative Accent Bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 8, 'F');

  // Branding Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('QUICK HIRE EOR PLATFORM', 20, 50);

  doc.setFontSize(14);
  doc.setTextColor(199, 210, 254);
  doc.text('SISTEMA GLOBAL DE GESTIÓN DE NÓMINA & CONTRATACIÓN', 20, 60);

  // White Box Container for Manual Specs
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 80, 170, 160, 4, 4, 'F');

  // Badge
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(30, 95, 150, 12, 2, 2, 'F');
  doc.setTextColor(67, 56, 202);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`DOCUMENTO OFICIAL DE CAPACITACIÓN - ROL: ${manual.roleId.toUpperCase()}`, 35, 103);

  // Main Manual Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.text(manual.title, 30, 122, { maxWidth: 150 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(manual.subtitle, 30, 138, { maxWidth: 150 });

  // Metadata Block
  doc.setDrawColor(226, 232, 240);
  doc.line(30, 152, 180, 152);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('Público Objetivo:', 30, 162);
  doc.setFont('helvetica', 'normal');
  doc.text(manual.targetAudience, 70, 162, { maxWidth: 110 });

  doc.setFont('helvetica', 'bold');
  doc.text('Versión Sistema:', 30, 172);
  doc.setFont('helvetica', 'normal');
  doc.text(manual.version, 70, 172);

  doc.setFont('helvetica', 'bold');
  doc.text('Última Actualización:', 30, 182);
  doc.setFont('helvetica', 'normal');
  doc.text(manual.lastUpdated, 70, 182);

  doc.setFont('helvetica', 'bold');
  doc.text('Idiomas Soportados:', 30, 192);
  doc.setFont('helvetica', 'normal');
  doc.text('Español (ES), English (EN), Português Brasil (PT)', 70, 192);

  doc.setFont('helvetica', 'bold');
  doc.text('Descripción:', 30, 202);
  doc.setFont('helvetica', 'normal');
  doc.text(manual.description, 70, 202, { maxWidth: 110 });

  // Cover Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Quick Hire Global EOR Solutions Inc. © 2026 - Todos los derechos reservados.', 20, 275);
  doc.text('Documento generado automáticamente por la Plataforma de Gobernanza Quick Hire.', 20, 281);


  // --- PAGE 2: PERMISSIONS MATRIX & TABLE OF CONTENTS ---
  doc.addPage();
  
  // Header Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('QUICK HIRE EOR - MANUAL DE USUARIO', 15, 12);
  doc.text(`ROL: ${role.toUpperCase()}`, 160, 12);

  let currentY = 28;

  // Title: Matriz de Permisos
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Alcance Operativo y Matriz de Permisos', 15, currentY);
  currentY += 8;

  const permissionsHeaders = ['Módulo del Sistema', 'Nivel de Acceso', 'Notas y Alcance'];
  const permissionsRows = manual.permissionsMatrix.map(p => [p.module, p.accessLevel, p.notes]);

  autoTable(doc, {
    startY: currentY,
    head: [permissionsHeaders],
    body: permissionsRows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: [51, 65, 85], fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Table of Contents
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. Contenido del Manual de Uso', 15, currentY);
  currentY += 8;

  manual.sections.forEach((sec, idx) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, currentY, 180, 10, 1.5, 1.5, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${sec.title}`, 20, currentY + 6.5);
    currentY += 13;
  });

  // --- PAGE 3+: DETAILED SECTIONS ---
  manual.sections.forEach((sec, idx) => {
    doc.addPage();
    
    // Header Bar
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`QUICK HIRE MANUAL - ${manual.title}`, 15, 12);
    doc.text(`SECCIÓN ${idx + 1}`, 175, 12);

    let secY = 28;

    // Section Title
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(sec.title, 15, secY);
    secY += 8;

    // Screen Description Box
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(15, secY, 180, 20, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text('DESCRIPCIÓN DE LA PANTALLA Y MÓDULO:', 20, secY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(sec.screenDescription, 20, secY + 12, { maxWidth: 170 });

    secY += 28;

    // Step-by-Step Procedure
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Procedimiento Paso a Paso de Uso:', 15, secY);
    secY += 8;

    sec.steps.forEach((step, stepIdx) => {
      doc.setFillColor(79, 70, 229);
      doc.circle(18, secY - 1.5, 2.5, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(String(stepIdx + 1), 17, secY - 0.5);

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(step, 24, secY, { maxWidth: 168 });
      
      secY += 10;
    });

    secY += 4;

    // Table data if present
    if (sec.tableData) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Guía de Referencia Rápida de Estados:', 15, secY);
      secY += 6;

      autoTable(doc, {
        startY: secY,
        head: [sec.tableData.headers],
        body: sec.tableData.rows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { textColor: [51, 65, 85], fontSize: 8 },
        margin: { left: 15, right: 15 }
      });

      secY = (doc as any).lastAutoTable.finalY + 8;
    }
  });

  // --- LAST PAGE: FAQ & SUPPORT ---
  doc.addPage();
  
  // Header Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('QUICK HIRE MANUAL - PREGUNTAS FRECUENTES & SOPORTE', 15, 12);

  let faqY = 28;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Preguntas Frecuentes y Resolución de Incidencias', 15, faqY);
  faqY += 10;

  manual.faq.forEach((item, fIdx) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, faqY, 180, 22, 2, 2, 'FD');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`P${fIdx + 1}: ${item.question}`, 20, faqY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`R: ${item.answer}`, 20, faqY + 14, { maxWidth: 170 });

    faqY += 26;
  });

  faqY += 10;

  // Contact Box
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(15, faqY, 180, 35, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('Mesa de Ayuda y Soporte Técnico Quick Hire', 20, faqY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Para recibir atención personalizada o solicitar asistencia en Vivo con la plataforma:', 20, faqY + 15);
  doc.text('• Correo Electrónico: alertas@grupostt.com / alertas@grupostt.com', 20, faqY + 22);
  doc.text('• Módulo de Tickets: Vaya a la pestaña "Tickets de Soporte" en su panel de usuario.', 20, faqY + 28);

  // Add Page Numbers to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`Quick Hire EOR Platform - Documento Oficial de Capacitación`, 15, 288);
      doc.text(`Página ${i} de ${totalPages}`, 180, 288);
    }
  }

  return doc;
}

/**
 * Check if user with userRole is authorized to view/download targetManualRole
 */
export function isRoleAllowedForManual(userRole: Role, targetManualRole: Role): boolean {
  if (userRole === 'supracliente') return true;
  if (userRole === 'administrador') {
    return ['administrador', 'asesor_comercial', 'cliente'].includes(targetManualRole);
  }
  if (userRole === 'asesor_comercial') {
    return ['asesor_comercial', 'cliente'].includes(targetManualRole);
  }
  if (userRole === 'cliente' || userRole === 'prospecto') {
    return targetManualRole === 'cliente';
  }
  return false;
}

/**
 * Trigger browser download for target manual PDF
 */
export function downloadUserManualPDF(targetManualRole: Role, userRole: Role, userLanguage: 'es' | 'en' | 'pt' = 'es') {
  if (!isRoleAllowedForManual(userRole, targetManualRole)) {
    throw new Error(`Acceso denegado: Su rol (${userRole}) no posee permisos para acceder al manual de ${targetManualRole}`);
  }

  const doc = generateUserManualPDF(targetManualRole, userLanguage);
  const fileName = `Manual_de_Usuario_QuickHire_${targetManualRole.toUpperCase()}.pdf`;
  doc.save(fileName);
}
