import { Language } from '../types';

/**
 * Universal Status Translation Dictionary
 */
const STATUS_MAP: Record<string, { es: string; en: string; pt: string }> = {
  // Service Activation Statuses
  'Pendiente de contrato comercial': {
    es: 'Pendiente de contrato comercial',
    en: 'Pending commercial contract',
    pt: 'Pendente de contrato comercial'
  },
  'Contrato comercial firmado': {
    es: 'Contrato comercial firmado',
    en: 'Commercial contract signed',
    pt: 'Contrato comercial assinado'
  },
  'Pendiente de pago': {
    es: 'Pendiente de pago',
    en: 'Pending payment',
    pt: 'Pagamento pendente'
  },
  'Pago en revisión': {
    es: 'Pago en revisión',
    en: 'Payment in review',
    pt: 'Pagamento em análise'
  },
  'Pago rechazado': {
    es: 'Pago rechazado',
    en: 'Payment rejected',
    pt: 'Pagamento rejeitado'
  },
  'Pago validado': {
    es: 'Pago validado',
    en: 'Payment validated',
    pt: 'Pagamento validado'
  },
  'Servicio liberado': {
    es: 'Servicio liberado',
    en: 'Service released',
    pt: 'Serviço liberado'
  },
  'Servicio bloqueado': {
    es: 'Servicio bloqueado',
    en: 'Service blocked',
    pt: 'Serviço bloqueado'
  },
  'Servicio suspendido': {
    es: 'Servicio suspendido',
    en: 'Service suspended',
    pt: 'Serviço suspenso'
  },
  'Suspendido por Impago': {
    es: 'Suspendido por Impago',
    en: 'Suspended for Non-Payment',
    pt: 'Suspenso por Inadimplência'
  },
  'Activo': {
    es: 'Activo',
    en: 'Active',
    pt: 'Ativo'
  },
  'Inactivo': {
    es: 'Inactivo',
    en: 'Inactive',
    pt: 'Inativo'
  },
  'ACTIVA': {
    es: 'Activa',
    en: 'Active',
    pt: 'Ativa'
  },
  'INACTIVA': {
    es: 'Inactiva',
    en: 'Inactive',
    pt: 'Inativa'
  },
  'SUSPENDIDA': {
    es: 'Suspendida',
    en: 'Suspended',
    pt: 'Suspensa'
  },
  'Suspendido': {
    es: 'Suspendido',
    en: 'Suspended',
    pt: 'Suspenso'
  },
  'Pendiente de configuración': {
    es: 'Pendiente de configuración',
    en: 'Pending configuration',
    pt: 'Configuração pendente'
  },
  'En mora': {
    es: 'En mora',
    en: 'Overdue',
    pt: 'Em atraso'
  },
  'Recibida': {
    es: 'Recibida',
    en: 'Received',
    pt: 'Recebida'
  },
  'En revisión': {
    es: 'En revisión',
    en: 'In review',
    pt: 'Em análise'
  },
  'Aprobada': {
    es: 'Aprobada',
    en: 'Approved',
    pt: 'Aprovada'
  },
  'Rechazada': {
    es: 'Rechazada',
    en: 'Rejected',
    pt: 'Rejeitada'
  },
  'Cliente creado': {
    es: 'Cliente creado',
    en: 'Client created',
    pt: 'Cliente criado'
  },
  'Con observaciones': {
    es: 'Con observaciones',
    en: 'With observations',
    pt: 'Com observações'
  },
  'Firmado por cliente': {
    es: 'Firmado por cliente',
    en: 'Signed by client',
    pt: 'Assinado pelo cliente'
  },
  'Firmado por proveedor': {
    es: 'Firmado por proveedor',
    en: 'Signed by provider',
    pt: 'Assinado pelo fornecedor'
  },
  'Firmado por ambas partes': {
    es: 'Firmado por ambas partes',
    en: 'Signed by both parties',
    pt: 'Assinado por ambas as partes'
  },
  'Firmado': {
    es: 'Firmado',
    en: 'Signed',
    pt: 'Assinado'
  },
  'Pendiente de firma cliente': {
    es: 'Pendiente de firma cliente',
    en: 'Pending client signature',
    pt: 'Pendente assinatura do cliente'
  },
  'Pendiente de firma proveedor': {
    es: 'Pendiente de firma proveedor',
    en: 'Pending provider signature',
    pt: 'Pendente assinatura do fornecedor'
  },
  'Pendiente de firma': {
    es: 'Pendiente de firma',
    en: 'Pending signature',
    pt: 'Pendente de assinatura'
  },
  'Borrador': {
    es: 'Borrador',
    en: 'Draft',
    pt: 'Rascunho'
  },
  'Pagada': {
    es: 'Pagada',
    en: 'Paid',
    pt: 'Paga'
  },
  'Pendiente': {
    es: 'Pendiente',
    en: 'Pending',
    pt: 'Pendente'
  },
  'Validado': {
    es: 'Validado',
    en: 'Validated',
    pt: 'Validado'
  },
  'Aplicado': {
    es: 'Aplicado',
    en: 'Applied',
    pt: 'Aplicado'
  },
  'Anulado': {
    es: 'Anulado',
    en: 'Annulled',
    pt: 'Anulado'
  },
  'Vigente': {
    es: 'Vigente',
    en: 'Current / Active',
    pt: 'Vigente'
  },
  'Obsoleto': {
    es: 'Obsoleto',
    en: 'Obsolete',
    pt: 'Obsoleto'
  },
  'Obsoleta': {
    es: 'Obsoleta',
    en: 'Obsolete',
    pt: 'Obsoleta'
  },
  'Abierto': {
    es: 'Abierto',
    en: 'Open',
    pt: 'Aberto'
  },
  'En Proceso': {
    es: 'En Proceso',
    en: 'In Progress',
    pt: 'Em Andamento'
  },
  'Resuelto': {
    es: 'Resuelto',
    en: 'Resolved',
    pt: 'Resolvido'
  },
  'Cerrado': {
    es: 'Cerrado',
    en: 'Closed',
    pt: 'Fechado'
  },
  'Crítica': {
    es: 'Crítica',
    en: 'Critical',
    pt: 'Crítica'
  },
  'Alta': {
    es: 'Alta',
    en: 'High',
    pt: 'Alta'
  },
  'Media': {
    es: 'Media',
    en: 'Medium',
    pt: 'Média'
  },
  'Baja': {
    es: 'Baja',
    en: 'Low',
    pt: 'Baixa'
  }
};

/**
 * Common Phrase & UI Elements Dictionary
 */
const PHRASE_MAP: Record<string, { es: string; en: string; pt: string }> = {
  // Navigation & Headers
  'Manual de Usuario': {
    es: 'Manual de Usuario',
    en: 'User Manual',
    pt: 'Manual do Usuário'
  },
  'Centro de Manuales de Usuario': {
    es: 'Centro de Manuales de Usuario',
    en: 'User Manuals Center',
    pt: 'Centro de Manuais do Usuário'
  },
  'Cliente Activo:': {
    es: 'Cliente Activo:',
    en: 'Active Client:',
    pt: 'Cliente Ativo:'
  },
  'Estado del Servicio:': {
    es: 'Estado del Servicio:',
    en: 'Service Status:',
    pt: 'Status do Serviço:'
  },
  'Cerrar Sesión': {
    es: 'Cerrar Sesión',
    en: 'Sign Out',
    pt: 'Encerrar Sessão'
  },
  'Iniciar Sesión': {
    es: 'Iniciar Sesión',
    en: 'Sign In',
    pt: 'Entrar'
  },
  'Dashboard': {
    es: 'Panel de Control',
    en: 'Dashboard',
    pt: 'Painel de Controle'
  },
  'Panel de Control': {
    es: 'Panel de Control',
    en: 'Dashboard',
    pt: 'Painel de Controle'
  },
  'Dashboard Central': {
    es: 'Dashboard Central',
    en: 'Central Dashboard',
    pt: 'Painel Central'
  },
  'Indicadores Operativos': {
    es: 'Indicadores Operativos',
    en: 'Operational Metrics',
    pt: 'Indicadores Operacionais'
  },

  // EOR Activation Banner & Steps
  'Estado de Activación de Servicios EOR': {
    es: 'Estado de Activación de Servicios EOR',
    en: 'EOR Service Activation Status',
    pt: 'Status de Ativação dos Serviços EOR'
  },
  'De acuerdo con las políticas corporativas, los servicios de nómina y contratos locales requieren validación previa.': {
    es: 'De acuerdo con las políticas corporativas, los servicios de nómina y contratos locales requieren validación previa.',
    en: 'According to corporate policies, payroll services and local contracts require prior validation.',
    pt: 'De acordo com as políticas corporativas, os serviços de folha de pagamento e contratos locais requerem validação prévia.'
  },
  '1. Firma del Contrato Comercial Cliente-Proveedor': {
    es: '1. Firma del Contrato Comercial Cliente-Proveedor',
    en: '1. Client-Provider Commercial Contract Signing',
    pt: '1. Assinatura do Contrato Comercial Cliente-Fornecedor'
  },
  'Debe revisar y firmar digitalmente el acuerdo general de servicios EOR con su asesor comercial.': {
    es: 'Debe revisar y firmar digitalmente el acuerdo general de servicios EOR con su asesor comercial.',
    en: 'You must review and digitally sign the general EOR services agreement with your commercial advisor.',
    pt: 'Você deve revisar e assinar digitalmente o contrato geral de serviços EOR com seu consultor comercial.'
  },
  'Ir a firmar contrato': {
    es: 'Ir a firmar contrato',
    en: 'Go to sign contract',
    pt: 'Ir assinar contrato'
  },
  '2. Pago Inicial de Contado USD Validado': {
    es: '2. Pago Inicial de Contado USD Validado',
    en: '2. Initial Cash USD Payment Validated',
    pt: '2. Pagamento Inicial à Vista em USD Validado'
  },
  'El pago inicial de contado en USD del servicio debe ser transferido y verificado por la administración.': {
    es: 'El pago inicial de contado en USD del servicio debe ser transferido y verificado por la administración.',
    en: 'The initial cash USD payment for the service must be transferred and verified by administration.',
    pt: 'O pagamento inicial à vista em USD do serviço deve ser transferido e verificado pela administração.'
  },
  'Subir comprobante de pago': {
    es: 'Subir comprobante de pago',
    en: 'Upload payment receipt',
    pt: 'Enviar comprovante de pagamento'
  },
  'Servicio Bloqueado Temporalmente:': {
    es: 'Servicio Bloqueado Temporalmente:',
    en: 'Temporarily Blocked Service:',
    pt: 'Serviço Bloqueado Temporariamente:'
  },
  'Mientras el servicio permanezca bloqueado, no podrá acceder a contratos laborales firmados de sus empleados, emitir nuevos contratos legales, ni completar el inicio operativo de personal. El registro de colaboradores y cargas masivas permanecerá en modo de pre-registro hasta su liberación oficial.': {
    es: 'Mientras el servicio permanezca bloqueado, no podrá acceder a contratos laborales firmados de sus empleados, emitir nuevos contratos legales, ni completar el inicio operativo de personal. El registro de colaboradores y cargas masivas permanecerá en modo de pre-registro hasta su liberación oficial.',
    en: 'While the service remains blocked, you will not be able to access signed employment contracts for your employees, issue new legal contracts, or complete operational start of staff. Employee registration and bulk uploads will remain in pre-registration mode until official release.',
    pt: 'Enquanto o serviço permanecer bloqueado, você não poderá acessar contratos de trabalho assinados dos seus funcionários, emitir novos contratos legais, nem concluir o início operacional do pessoal. O cadastro de colaboradores e uploads em massa permanecerão em modo de pré-registro até a liberação oficial.'
  },

  // Dashboards Tabs & Section Titles
  'Prospectos y Solicitudes EOR': {
    es: 'Prospectos y Solicitudes EOR',
    en: 'EOR Prospects & Inquiries',
    pt: 'Prospectos e Solicitações EOR'
  },
  'Directorio de Clientes Activos': {
    es: 'Directorio de Clientes Activos',
    en: 'Active Clients Directory',
    pt: 'Diretório de Clientes Ativos'
  },
  'Nómina y Colaboradores Locales': {
    es: 'Nómina y Colaboradores Locales',
    en: 'Payroll & Local Collaborators',
    pt: 'Folha de Pagamento e Colaboradores Locais'
  },
  'Facturación y Control de Pagos': {
    es: 'Facturación y Control de Pagos',
    en: 'Invoicing & Payment Tracking',
    pt: 'Faturamento e Controle de Pagamentos'
  },
  'Matrices y Carga Social Reguladora': {
    es: 'Matrices y Carga Social Reguladora',
    en: 'Regulatory Social Charges & Matrices',
    pt: 'Matrizes e Encargos Sociais Regulatórios'
  },
  'Módulo de Contratos y Plantillas': {
    es: 'Módulo de Contratos y Plantillas',
    en: 'Contracts & Templates Module',
    pt: 'Módulo de Contratos e Modelos'
  },
  'Módulo Cambiario de Divisas': {
    es: 'Módulo Cambiario de Divisas',
    en: 'Currency Exchange Module',
    pt: 'Módulo de Câmbio de Moedas'
  },
  'Módulo de Soporte y Tickets': {
    es: 'Módulo de Soporte y Tickets',
    en: 'Support & Tickets Module',
    pt: 'Módulo de Suporte e Tickets'
  },
  'Buzón de Notificaciones y Alertas': {
    es: 'Buzón de Notificaciones y Alertas',
    en: 'Notifications & Alerts Inbox',
    pt: 'Caixa de Notificações e Alertas'
  },
  'Logs de Auditoría de Cumplimiento': {
    es: 'Logs de Auditoría de Cumplimiento',
    en: 'Compliance Audit Logs',
    pt: 'Logs de Auditoria de Conformidade'
  },
  'Diccionario de Traducción Multilenguaje': {
    es: 'Diccionario de Traducción Multilenguaje',
    en: 'Multilingual Translation Dictionary',
    pt: 'Dicionário de Tradução Multilíngue'
  },
  'Gestión de Usuarios y Asesores': {
    es: 'Gestión de Usuarios y Asesores',
    en: 'User & Advisor Management',
    pt: 'Gestão de Usuários e Consultores'
  },
  'Estructura y Gestión de Fees por País': {
    es: 'Estructura y Gestión de Fees por País',
    en: 'Country Fee Structure & Management',
    pt: 'Estrutura e Gestão de Taxas por País'
  },
  'Directorio de Actores del Servicio': {
    es: 'Directorio de Actores del Servicio',
    en: 'Service Actors Directory',
    pt: 'Diretório de Atores do Serviço'
  },
  'Maestro de Cuentas Bancarias': {
    es: 'Maestro de Cuentas Bancarias',
    en: 'Bank Accounts Master',
    pt: 'Mestre de Contas Bancárias'
  },
  'Panel de Control Comercial': {
    es: 'Panel de Control Comercial',
    en: 'Commercial Control Panel',
    pt: 'Painel de Controle Comercial'
  },
  'Gestión de Solicitudes EOR (Leads)': {
    es: 'Gestión de Solicitudes EOR (Leads)',
    en: 'EOR Inquiries Management (Leads)',
    pt: 'Gestão de Solicitações EOR (Leads)'
  },
  'Directorio de Clientes Asignados': {
    es: 'Directorio de Clientes Asignados',
    en: 'Assigned Clients Directory',
    pt: 'Diretório de Clientes Atribuídos'
  },
  'Contratos Comerciales Cliente-Proveedor': {
    es: 'Contratos Comerciales Cliente-Proveedor',
    en: 'Client-Provider Commercial Contracts',
    pt: 'Contratos Comerciais Cliente-Fornecedor'
  },
  'Directorio de Plantillas de Contratos': {
    es: 'Directorio de Plantillas de Contratos',
    en: 'Contract Templates Directory',
    pt: 'Diretório de Modelos de Contratos'
  },
  'Historial de Seguimiento Comercial': {
    es: 'Historial de Seguimiento Comercial',
    en: 'Commercial Follow-up History',
    pt: 'Histórico de Acompanhamento Comercial'
  },
  'Módulo de Tickets Comerciales y Contractuales': {
    es: 'Módulo de Tickets Comerciales y Contractuales',
    en: 'Commercial & Contractual Tickets Module',
    pt: 'Módulo de Tickets Comerciais e Contratuais'
  },
  'Perfil de Asesor Comercial': {
    es: 'Perfil de Asesor Comercial',
    en: 'Commercial Advisor Profile',
    pt: 'Perfil do Consultor Comercial'
  },
  'Generación de Facturas y Estado de Pagos': {
    es: 'Generación de Facturas y Estado de Pagos',
    en: 'Invoice Generation & Payment Status',
    pt: 'Geração de Faturas e Status de Pagamentos'
  },
  'Reportes de Gestión Comercial': {
    es: 'Reportes de Gestión Comercial',
    en: 'Commercial Management Reports',
    pt: 'Relatórios de Gestão Comercial'
  },
  'Panel de Control Corporativo • Indicadores': {
    es: 'Panel de Control Corporativo • Indicadores',
    en: 'Corporate Control Panel • Metrics',
    pt: 'Painel de Controle Corporativo • Indicadores'
  },
  'Directorio de Empresas Clientes Holding': {
    es: 'Directorio de Empresas Clientes Holding',
    en: 'Holding Client Companies Directory',
    pt: 'Diretório de Empresas Clientes Holding'
  },
  'Facturación Consolidada y Pagos Unificados': {
    es: 'Facturación Consolidada y Pagos Unificados',
    en: 'Consolidated Billing & Unified Payments',
    pt: 'Faturamento Consolidado e Pagamentos Unificados'
  },
  'Módulo de Beneficios Globales': {
    es: 'Módulo de Beneficios Globales',
    en: 'Global Benefits Module',
    pt: 'Módulo de Benefícios Globais'
  },
  'Centro de Soporte y Casos': {
    es: 'Centro de Soporte y Casos',
    en: 'Support & Cases Center',
    pt: 'Centro de Suporte e Casos'
  },
  'Reportes de Gestión Corporativa': {
    es: 'Reportes de Gestión Corporativa',
    en: 'Corporate Management Reports',
    pt: 'Relatórios de Gestão Corporativa'
  },
  'Auditoría de Seguridad y Trazabilidad': {
    es: 'Auditoría de Seguridad y Trazabilidad',
    en: 'Security Audit & Traceability',
    pt: 'Auditoria de Segurança e Rastreabilidade'
  },
  'Simulador Cotizaciones': {
    es: 'Simulador Cotizaciones',
    en: 'Quote Simulator',
    pt: 'Simulador de Orçamentos'
  },
  'Simulador de Cotizaciones y Fee EOR': {
    es: 'Simulador de Cotizaciones y Fee EOR',
    en: 'EOR Quote & Fee Simulator',
    pt: 'Simulador de Orçamentos e Taxas EOR'
  },
  'Documentación oficial, guías de uso, pantallas y matriz de permisos por rol': {
    es: 'Documentación oficial, guías de uso, pantallas y matriz de permisos por rol',
    en: 'Official documentation, user guides, screens, and permission matrix by role',
    pt: 'Documentação oficial, guias de uso, telas e matriz de permissões por perfil'
  },
  'Descargar Manual Completo en PDF': {
    es: 'Descargar Manual Completo en PDF',
    en: 'Download Complete Manual in PDF',
    pt: 'Baixar Manual Completo em PDF'
  },
  'Sincronizar información': {
    es: 'Sincronizar información',
    en: 'Sync Information',
    pt: 'Sincronizar Informações'
  },
  'Responsable de sesión:': {
    es: 'Responsable de sesión:',
    en: 'Session user:',
    pt: 'Responsável pela sessão:'
  },
  'Asesor Comercial asignado:': {
    es: 'Asesor Comercial asignado:',
    en: 'Assigned Commercial Advisor:',
    pt: 'Consultor Comercial atribuído:'
  },
  'Titular:': {
    es: 'Titular:',
    en: 'Account Owner:',
    pt: 'Titular:'
  },
  'Cupo Libre Restante': {
    es: 'Cupo Libre Restante',
    en: 'Remaining Free Quota',
    pt: 'Vagas Livres Restantes'
  },
  'Últimos Colaboradores': {
    es: 'Últimos Colaboradores',
    en: 'Recent Collaborators',
    pt: 'Últimos Colaboradores'
  },
  'Ver todos': {
    es: 'Ver todos',
    en: 'View all',
    pt: 'Ver todos'
  },

  // Common UI actions and buttons
  'Guardar': {
    es: 'Guardar',
    en: 'Save',
    pt: 'Salvar'
  },
  'Cancelar': {
    es: 'Cancelar',
    en: 'Cancel',
    pt: 'Cancelar'
  },
  'Editar': {
    es: 'Editar',
    en: 'Edit',
    pt: 'Editar'
  },
  'Eliminar': {
    es: 'Eliminar',
    en: 'Delete',
    pt: 'Excluir'
  },
  'Ver Detalle': {
    es: 'Ver Detalle',
    en: 'View Details',
    pt: 'Ver Detalhes'
  },
  'Ver Soporte': {
    es: 'Ver Soporte',
    en: 'View Receipt / Proof',
    pt: 'Ver Comprovante'
  },
  'Descargar': {
    es: 'Descargar',
    en: 'Download',
    pt: 'Baixar'
  },
  'Buscar': {
    es: 'Buscar',
    en: 'Search',
    pt: 'Buscar'
  },
  'Filtrar': {
    es: 'Filtrar',
    en: 'Filter',
    pt: 'Filtrar'
  },
  'Limpiar Filtros': {
    es: 'Limpiar Filtros',
    en: 'Clear Filters',
    pt: 'Limpar Filtros'
  },
  'Todos': {
    es: 'Todos',
    en: 'All',
    pt: 'Todos'
  },
  'Todas': {
    es: 'Todas',
    en: 'All',
    pt: 'Todas'
  },
  'Acciones': {
    es: 'Acciones',
    en: 'Actions',
    pt: 'Ações'
  },
  'Estado': {
    es: 'Estado',
    en: 'Status',
    pt: 'Status'
  },
  'País': {
    es: 'País',
    en: 'Country',
    pt: 'País'
  },
  'Moneda': {
    es: 'Moneda',
    en: 'Currency',
    pt: 'Moeda'
  },
  'Fecha': {
    es: 'Fecha',
    en: 'Date',
    pt: 'Data'
  },
  'Cliente': {
    es: 'Cliente',
    en: 'Client',
    pt: 'Cliente'
  },
  'Empresa': {
    es: 'Empresa',
    en: 'Company',
    pt: 'Empresa'
  },
  'Trabajador': {
    es: 'Trabajador',
    en: 'Employee / Worker',
    pt: 'Trabalhador'
  },
  'Puesto': {
    es: 'Puesto',
    en: 'Position / Role',
    pt: 'Cargo'
  },
  'Salario': {
    es: 'Salario',
    en: 'Salary',
    pt: 'Salário'
  },
  'Total': {
    es: 'Total',
    en: 'Total',
    pt: 'Total'
  },
  'Subtotal': {
    es: 'Subtotal',
    en: 'Subtotal',
    pt: 'Subtotal'
  },
  'Impuestos': {
    es: 'Impuestos',
    en: 'Taxes',
    pt: 'Impostos'
  },

  // Supra specific tabs
  'Supervisión Global Cuentas': {
    es: 'Supervisión Global Cuentas',
    en: 'Global Accounts Supervision',
    pt: 'Supervisão Global de Contas'
  },
  'Liberación de Servicios USD': {
    es: 'Liberación de Servicios USD',
    en: 'USD Services Release',
    pt: 'Liberação de Serviços em USD'
  },
  'Auditoría Master / Logs': {
    es: 'Auditoría Master / Logs',
    en: 'Master Audit / Logs',
    pt: 'Auditoria Master / Logs'
  },
  'Gobernanza SLA & Alertas': {
    es: 'Gobernanza SLA & Alertas',
    en: 'SLA Governance & Alerts',
    pt: 'Governança SLA e Alertas'
  },
  'Reportes Ejecutivos': {
    es: 'Reportes Ejecutivos',
    en: 'Executive Reports',
    pt: 'Relatórios Executivos'
  },
  'Simulador de Cotización': {
    es: 'Simulador de Cotización',
    en: 'Quote Simulator',
    pt: 'Simulador de Cotação'
  },
  'Alertas Operativas': {
    es: 'Alertas Operativas',
    en: 'Operational Alerts',
    pt: 'Alertas Operacionais'
  },
  'Gestión de Tarifas': {
    es: 'Gestión de Tarifas',
    en: 'Fee Management',
    pt: 'Gestão de Tarifas'
  },
  'Subir Comprobante / Soporte de Pago': {
    es: 'Subir Comprobante / Soporte de Pago',
    en: 'Upload Payment Proof / Receipt',
    pt: 'Enviar Comprovante / Suporte de Pagamento'
  },
  'Subir Soporte Ahora': {
    es: 'Subir Soporte Ahora',
    en: 'Upload Proof Now',
    pt: 'Enviar Suporte Agora'
  },
  'Subir Soporte': {
    es: 'Subir Soporte',
    en: 'Upload Proof',
    pt: 'Enviar Suporte'
  },
  'Subir Contrato Firmado': {
    es: 'Subir Contrato Firmado',
    en: 'Upload Signed Contract',
    pt: 'Enviar Contrato Assinado'
  },
  'Insertar / Agregar Firma': {
    es: 'Insertar / Agregar Firma',
    en: 'Insert / Add Signature',
    pt: 'Inserir / Adicionar Assinatura'
  },
  'Descargar Contrato': {
    es: 'Descargar Contrato',
    en: 'Download Contract',
    pt: 'Baixar Contrato'
  },
  'Descargar Adendum': {
    es: 'Descargar Adendum',
    en: 'Download Addendum',
    pt: 'Baixar Aditivo'
  },
  'Descargar Documento': {
    es: 'Descargar Documento',
    en: 'Download Document',
    pt: 'Baixar Documento'
  },
  'Descargar Contrato Laboral': {
    es: 'Descargar Contrato Laboral',
    en: 'Download Employment Contract',
    pt: 'Baixar Contrato de Trabalho'
  },
  'Ver y Firmar Contrato Ahora': {
    es: 'Ver y Firmar Contrato Ahora',
    en: 'View & Sign Contract Now',
    pt: 'Ver e Assinar Contrato Agora'
  },
  'Ver y Firmar': {
    es: 'Ver y Firmar',
    en: 'View & Sign',
    pt: 'Ver e Assinar'
  },
  'Ver Detalles': {
    es: 'Ver Detalles',
    en: 'View Details',
    pt: 'Ver Detalhes'
  },
  'Firmar Contrato': {
    es: 'Firmar Contrato',
    en: 'Sign Contract',
    pt: 'Assinar Contrato'
  },
  'Firmar Patrono': {
    es: 'Firmar Patrono',
    en: 'Sign as Employer',
    pt: 'Assinar como Empregador'
  },
  'Firmar Contrato Patrono': {
    es: 'Firmar Contrato Patrono',
    en: 'Sign Employer Contract',
    pt: 'Assinar Contrato de Empregador'
  },
  'Aplicar Firma e Insertar en Adendum': {
    es: 'Aplicar Firma e Insertar en Adendum',
    en: 'Apply Signature & Insert in Addendum',
    pt: 'Aplicar Assinatura e Inserir no Aditivo'
  },
  'Factura Pendiente de Pago Registrada': {
    es: 'Factura Pendiente de Pago Registrada',
    en: 'Pending Invoice Registered',
    pt: 'Fatura Pendente de Pagamento Registrada'
  },
  'Pagos de Contado USD (Activación de Servicio)': {
    es: 'Pagos de Contado USD (Activación de Servicio)',
    en: 'USD Cash Payments (Service Activation)',
    pt: 'Pagamentos à Vista em USD (Ativação de Serviço)'
  },
  'Soporte y Tickets': {
    es: 'Soporte y Tickets',
    en: 'Support & Tickets',
    pt: 'Suporte e Chamados'
  },
  'Abrir Ticket de Soporte': {
    es: 'Abrir Ticket de Soporte',
    en: 'Open Support Ticket',
    pt: 'Abrir Chamado de Suporte'
  },
  'Historial de Tickets de Soporte': {
    es: 'Historial de Tickets de Soporte',
    en: 'Support Tickets History',
    pt: 'Histórico de Chamados de Suporte'
  },
  'Concepto/Servicio': {
    es: 'Concepto/Servicio',
    en: 'Concept / Service',
    pt: 'Conceito / Serviço'
  },
  'Tipo Cambio (Histórico)': {
    es: 'Tipo Cambio (Histórico)',
    en: 'Exchange Rate (Historical)',
    pt: 'Taxa de Câmbio (Histórica)'
  },
  'Monto Total USD': {
    es: 'Monto Total USD',
    en: 'Total Amount USD',
    pt: 'Valor Total USD'
  },
  'ID Pago': {
    es: 'ID Pago',
    en: 'Payment ID',
    pt: 'ID Pagamento'
  },
  'Contrato ID': {
    es: 'Contrato ID',
    en: 'Contract ID',
    pt: 'ID do Contrato'
  },
  'F. Generación': {
    es: 'F. Generación',
    en: 'Generation Date',
    pt: 'Data de Geração'
  },
  'Representante Legal': {
    es: 'Representante Legal',
    en: 'Legal Representative',
    pt: 'Representante Legal'
  },
  'Tarifa / Fee': {
    es: 'Tarifa / Fee',
    en: 'Fee / Rate',
    pt: 'Tarifa / Fee'
  },
  'Estado Legal': {
    es: 'Estado Legal',
    en: 'Legal Status',
    pt: 'Status Legal'
  },
  'Acción': {
    es: 'Acción',
    en: 'Action',
    pt: 'Ação'
  },
  'Imprimir / Guardar PDF': {
    es: 'Imprimir / Guardar PDF',
    en: 'Print / Save PDF',
    pt: 'Imprimir / Salvar PDF'
  }
};

/**
 * Role translations
 */
const ROLE_MAP: Record<string, { es: string; en: string; pt: string }> = {
  'supracliente': {
    es: 'Super Admin (Supracliente)',
    en: 'Super Admin (Supraclient)',
    pt: 'Super Admin (Supracliente)'
  },
  'administrador': {
    es: 'Administrador EOR',
    en: 'EOR Administrator',
    pt: 'Administrador EOR'
  },
  'Administrador': {
    es: 'Administrador EOR',
    en: 'EOR Administrator',
    pt: 'Administrador EOR'
  },
  'asesor_comercial': {
    es: 'Asesor Comercial',
    en: 'Commercial Advisor',
    pt: 'Consultor Comercial'
  },
  'ejecutivo': {
    es: 'Ejecutivo de Cuenta',
    en: 'Account Executive',
    pt: 'Executivo de Contas'
  },
  'cliente': {
    es: 'Cliente (Empresa Contratante)',
    en: 'Client (Contracting Company)',
    pt: 'Cliente (Empresa Contratante)'
  },
  'prospecto': {
    es: 'Prospecto',
    en: 'Prospect',
    pt: 'Prospecto'
  },
  'gestion_cuentas': {
    es: 'Gestión de Cuentas',
    en: 'Accounts Management',
    pt: 'Gestão de Contas'
  }
};

/**
 * Translates any raw status string into the target language.
 */
export function translateStatus(status?: string, lang: Language = 'es'): string {
  if (!status) return '';
  const trimmed = status.trim();
  if (STATUS_MAP[trimmed]) {
    return STATUS_MAP[trimmed][lang] || trimmed;
  }
  // Try case insensitive lookup
  const key = Object.keys(STATUS_MAP).find(k => k.toLowerCase() === trimmed.toLowerCase());
  if (key) {
    return STATUS_MAP[key][lang] || trimmed;
  }
  return trimmed;
}

/**
 * Translates any known UI phrase, label, or header into the target language.
 */
export function tText(text: string, lang: Language = 'es'): string {
  if (!text) return '';
  const trimmed = text.trim();
  
  if (PHRASE_MAP[trimmed]) {
    return PHRASE_MAP[trimmed][lang] || trimmed;
  }
  if (STATUS_MAP[trimmed]) {
    return STATUS_MAP[trimmed][lang] || trimmed;
  }
  if (ROLE_MAP[trimmed]) {
    return ROLE_MAP[trimmed][lang] || trimmed;
  }

  // Check case insensitive
  const phraseKey = Object.keys(PHRASE_MAP).find(k => k.toLowerCase() === trimmed.toLowerCase());
  if (phraseKey) return PHRASE_MAP[phraseKey][lang] || trimmed;

  const statusKey = Object.keys(STATUS_MAP).find(k => k.toLowerCase() === trimmed.toLowerCase());
  if (statusKey) return STATUS_MAP[statusKey][lang] || trimmed;

  const roleKey = Object.keys(ROLE_MAP).find(k => k.toLowerCase() === trimmed.toLowerCase());
  if (roleKey) return ROLE_MAP[roleKey][lang] || trimmed;

  return text;
}

/**
 * Helper to dynamically pick text based on lang: tr(es, en, pt, lang)
 */
export function tr(es: string, en: string, pt: string, lang: Language = 'es'): string {
  if (lang === 'en') return en;
  if (lang === 'pt') return pt;
  return es;
}

/**
 * Translates user role names
 */
export function translateRole(role?: string, lang: Language = 'es'): string {
  if (!role) return '';
  const trimmed = role.trim();
  if (ROLE_MAP[trimmed]) {
    return ROLE_MAP[trimmed][lang] || trimmed;
  }
  return trimmed;
}
