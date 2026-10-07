import { OpcionMenu, RoleDefinition } from '../types';
export type { RoleDefinition };

export const ALL_MENU_OPTIONS: OpcionMenu[] = [
  // 1. Panel de Control
  {
    id: 'kpis',
    etiqueta: 'Panel de Control',
    categoria: 'Panel de Control',
    descripcion: 'Métricas clave, indicadores ejecutivos, resumen de solicitudes y estado general del servicio.'
  },
  // 2. Operación EOR
  {
    id: 'solicitudes',
    etiqueta: 'Solicitudes EOR',
    categoria: 'Operación EOR',
    descripcion: 'Recepción, seguimiento y cotización de prospectos comerciales y solicitudes de contratación.'
  },
  {
    id: 'clientes',
    etiqueta: 'Clientes',
    categoria: 'Operación EOR',
    descripcion: 'Directorio de empresas cliente, expedientes corporativos y configuración de cuenta.'
  },
  {
    id: 'trabajadores',
    etiqueta: 'Trabajadores',
    categoria: 'Operación EOR',
    descripcion: 'Colaboradores locales contratados bajo modalidad EOR, nómina y expedientes individuales.'
  },
  {
    id: 'directorio',
    etiqueta: 'Directorio de Actores',
    categoria: 'Operación EOR',
    descripcion: 'Directorio de gerentes, coordinadores de país, ejecutivos y asesores comerciales de Grupo STT.'
  },
  // 3. Finanzas y Pagos
  {
    id: 'billing',
    etiqueta: 'Facturación y Pagos',
    categoria: 'Finanzas y Pagos',
    descripcion: 'Generación de facturas, pre-facturas, validación de comprobantes y control de pagos.'
  },
  {
    id: 'fees',
    etiqueta: 'Fees por País',
    categoria: 'Finanzas y Pagos',
    descripcion: 'Estructura tarifaria porcentual y fee mínimo por país para contratación EOR.'
  },
  {
    id: 'exchange',
    etiqueta: 'Tipos de Cambio',
    categoria: 'Finanzas y Pagos',
    descripcion: 'Gestión cambiaria de divisas locales versus USD y políticas de cobertura.'
  },
  {
    id: 'cuentas_bancarias',
    etiqueta: 'Cuentas Bancarias',
    categoria: 'Finanzas y Pagos',
    descripcion: 'Maestro de cuentas bancarias corporativas de Grupo STT por cada país de operación.'
  },
  {
    id: 'iva_wht_renta',
    etiqueta: 'IVA - WHT y Renta',
    categoria: 'Finanzas y Pagos',
    descripcion: 'Matriz impositiva de retenciones en la fuente (WHT), tasas de IVA y normativa fiscal.'
  },
  // 4. Legal y Plantillas
  {
    id: 'masters',
    etiqueta: 'Matrices Reguladoras',
    categoria: 'Legal y Plantillas',
    descripcion: 'Cargas sociales patronales, beneficios legales obligatorios y normativas de trabajo locales.'
  },
  {
    id: 'contracts',
    etiqueta: 'Contratos EOR',
    categoria: 'Legal y Plantillas',
    descripcion: 'Generación, firma digital y compliance de contratos comerciales y laborales.'
  },
  {
    id: 'plantillas',
    etiqueta: 'Directorio de Plantillas',
    categoria: 'Legal y Plantillas',
    descripcion: 'Repositorio de modelos de contratos, anexos y plantillas estandarizadas.'
  },
  // 5. Soporte y SLA
  {
    id: 'tickets',
    etiqueta: 'Tickets y Casos',
    categoria: 'Soporte y SLA',
    descripcion: 'Mesa de ayuda para incidencias, consultas operativas y solicitudes de clientes.'
  },
  {
    id: 'sla',
    etiqueta: 'Mantenimiento SLA',
    categoria: 'Soporte y SLA',
    descripcion: 'Configuración de tiempos máximos de respuesta, semaforización y escalamiento automático.'
  },
  {
    id: 'operational_alerts',
    etiqueta: 'Alertas Operativas',
    categoria: 'Soporte y SLA',
    descripcion: 'Monitoreo de vencimientos, riesgos de compliance y avisos preventivos.'
  },
  {
    id: 'notifications',
    etiqueta: 'Notificaciones',
    categoria: 'Soporte y SLA',
    descripcion: 'Historial de avisos por correo electrónico y alertas del sistema.'
  },
  // 6. Reportes y Auditoría
  {
    id: 'reports',
    etiqueta: 'Reportes de Gestión',
    categoria: 'Reportes y Auditoría',
    descripcion: 'Módulo analítico, métricas consolidadas y exportación de datos de gestión.'
  },
  {
    id: 'logs',
    etiqueta: 'Trazabilidad',
    categoria: 'Reportes y Auditoría',
    descripcion: 'Bitácora inmutable de auditoría de todas las acciones ejecutadas en el sistema.'
  },
  // 7. Administración
  {
    id: 'users',
    etiqueta: 'Gestión de Usuarios',
    categoria: 'Administración',
    descripcion: 'Control central de cuentas, asignación de roles y configuración de visibilidad de menú.'
  }
];

export const ALL_MENU_IDS = ALL_MENU_OPTIONS.map(o => o.id);

export const DEFAULT_ROLES_CONFIG: RoleDefinition[] = [
  {
    id: 'administrador',
    nombre: 'Administrador',
    descripcion: 'Acceso total y permanente a todos los módulos y configuraciones operativas del sistema.',
    esSistema: true,
    esAdmin: true,
    opcionesMenu: [...ALL_MENU_IDS]
  },
  {
    id: 'asesor_comercial',
    nombre: 'Asesor Comercial',
    descripcion: 'Atención a prospectos comerciales, cálculo de cotizaciones, tarifas y modelos de contratos.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis',
      'solicitudes',
      'clientes',
      'contracts',
      'fees',
      'exchange',
      'iva_wht_renta',
      'plantillas',
      'tickets',
      'notifications'
    ]
  },
  {
    id: 'ejecutivo_cuentas',
    nombre: 'Ejecutivo de Cuentas',
    descripcion: 'Gestión operativa de clientes asignados, supervisión de colaboradores locales y soporte de cuenta.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis',
      'clientes',
      'trabajadores',
      'billing',
      'contracts',
      'tickets',
      'sla',
      'notifications'
    ]
  },
  {
    id: 'cliente',
    nombre: 'Cliente',
    descripcion: 'Portal corporativo para visualización de nómina, contratos, facturas y tickets de soporte.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis',
      'trabajadores',
      'billing',
      'contracts',
      'tickets',
      'notifications',
      'solicitudes'
    ]
  },
  {
    id: 'tesoreria',
    nombre: 'Tesorería',
    descripcion: 'Gestión exclusiva del maestro de cuentas bancarias corporativas de Grupo STT.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'cuentas_bancarias'
    ]
  }
];
