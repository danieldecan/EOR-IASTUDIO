import { 
  SolicitudEOR, 
  Cliente, 
  Trabajador, 
  CargaSocial, 
  Tarifa, 
  Beneficio, 
  ContratoRequisito, 
  PlantillaCarga, 
  User, 
  HistorialCargaMasiva, 
  Factura, 
  Pago, 
  HistorialLog,
  PlantillaContrato,
  ContratoComercial,
  Adendum,
  ContratoLaboral,
  TipoCambio,
  Ticket,
  TicketComentario,
  SlaConfig,
  ReglaSla,
  SlaSeguimiento,
  SlaHistorial,
  PlantillaNotificacion,
  AlertaNotificacion,
  HistorialNotificacion,
  ConfiguracionSistema,
  PagoContadoUSD,
  HistorialLiberacion,
  Traduccion,
  DirectorioContacto,
  CuentaBancariaMaestra,
  TarifarioEOR,
  ReglaTributariaIvaWht,
  RoleDefinition
} from './types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const sessionStr = localStorage.getItem('qh_session');
    if (sessionStr) {
      const sessionObj = JSON.parse(sessionStr);
      const userEmail = sessionObj.correo || sessionObj.email;
      if (userEmail) headers['X-User-Email'] = userEmail;
      if (sessionObj.rol) headers['X-User-Role'] = sessionObj.rol;
    }
  } catch (e) {}

  const res = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    headers: {
      ...headers,
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    let errMsg = `HTTP error! status: ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.error) {
        errMsg = errData.error;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) errMsg = text;
      } catch {}
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (correo: string, pass: string) => 
    request<{ success: boolean; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: correo, password: pass }),
    }),

  // Solicitudes
  getSolicitudes: () => request<SolicitudEOR[]>('/solicitudes'),
  createSolicitud: (data: Partial<SolicitudEOR>) => 
    request<SolicitudEOR>('/solicitudes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSolicitud: (id: string, data: Partial<SolicitudEOR> & { usuario?: string }) => 
    request<SolicitudEOR>(`/solicitudes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSolicitud: (id: string, params?: { usuario?: string; motivo?: string }) =>
    request<{ success: boolean; message: string }>(`/solicitudes/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(params || {}),
    }),

  // Clientes
  getClientes: () => request<Cliente[]>('/clientes'),
  createCliente: (data: Partial<Cliente> & { usuario?: string }) => 
    request<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCliente: (id: string, data: Partial<Cliente> & { motivo: string; usuario: string }) => 
    request<Cliente>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCliente: (id: string, params?: { motivo?: string; usuario?: string }) =>
    request<{ success: boolean; message: string }>(`/clientes/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(params || {}),
    }),

  // Trabajadores
  getTrabajadores: (clienteId?: string) => 
    request<Trabajador[]>(`/trabajadores${clienteId ? `?clienteId=${clienteId}` : ''}`),
  createTrabajador: (data: Partial<Trabajador> & { usuario: string }) => 
    request<Trabajador>('/trabajadores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTrabajador: (id: string, data: Partial<Trabajador> & { motivo?: string; usuario: string }) => 
    request<Trabajador>(`/trabajadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTrabajador: (id: string, usuario: string) =>
    request<{ success: boolean; message: string }>(`/trabajadores/${id}?usuario=${encodeURIComponent(usuario)}`, {
      method: 'DELETE',
    }),
  bulkUploadTrabajadores: (data: { clienteId: string; archivoNombre: string; registros: any[]; usuario: string }) => 
    request<{ success: boolean; cargaHistorial: HistorialCargaMasiva; trabajadoresAgregados: number }>('/trabajadores/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // History Loads
  getHistorialCargas: () => request<HistorialCargaMasiva[]>('/historial-cargas'),

  // Cargas Sociales
  getCargasSociales: () => request<CargaSocial[]>('/cargas-sociales'),
  createCargaSocial: (data: Partial<CargaSocial> & { usuario: string }) => 
    request<CargaSocial>('/cargas-sociales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCargaSocial: (id: string, data: Partial<CargaSocial> & { motivo: string; usuario: string }) => 
    request<CargaSocial>(`/cargas-sociales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCargaSocial: (id: string, usuario: string) => 
    request<{ success: boolean }>(`/cargas-sociales/${id}?usuario=${encodeURIComponent(usuario)}`, {
      method: 'DELETE',
    }),

  // Tarifas
  getTarifas: () => request<Tarifa[]>('/tarifas'),
  createTarifa: (data: Partial<Tarifa> & { usuario: string }) => 
    request<Tarifa>('/tarifas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTarifa: (id: string, data: Partial<Tarifa> & { motivo: string; usuario: string }) => 
    request<Tarifa>(`/tarifas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Beneficios
  getBeneficios: () => request<Beneficio[]>('/beneficios'),
  createBeneficio: (data: Partial<Beneficio> & { usuario: string }) => 
    request<Beneficio>('/beneficios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Contratos y Requisitos
  getContratosRequisitos: () => request<ContratoRequisito[]>('/contratos-requisitos'),
  createContratoRequisito: (data: Partial<ContratoRequisito>) => 
    request<ContratoRequisito>('/contratos-requisitos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Plantillas de carga
  getPlantillas: () => request<PlantillaCarga[]>('/plantillas'),

  // Usuarios
  getUsuarios: () => request<User[]>('/usuarios'),
  createUsuario: (data: Partial<User> & { usuario: string; contrasena?: string; pais?: string }) => 
    request<User>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUsuario: (correo: string, data: Partial<User> & { nuevoCorreo?: string; contrasena?: string; motivo?: string; usuario: string }) => 
    request<User>(`/usuarios/${encodeURIComponent(correo)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUsuario: (correo: string, usuario?: string) =>
    request<{ success: boolean; message: string }>(`/usuarios/${encodeURIComponent(correo)}`, {
      method: 'DELETE',
      body: JSON.stringify({ usuario }),
    }),

  // Facturas y Pagos
  getFacturas: () => request<Factura[]>('/facturas'),
  getPagos: () => request<Pago[]>('/pagos'),
  generarFactura: (data: { clienteId: string; periodo: string; impuestoPorcentaje?: number; ivaPct?: number; comisionPct?: number; whtPct?: number; otrosImpuestosPct?: number; feePorEmpleado?: number; usuario: string }) => 
    request<Factura>('/facturas/generar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFactura: (id: string, data: { estado?: string; observaciones?: string; usuario: string }) => 
    request<Factura>(`/facturas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  registrarPago: (data: { facturaId: string; monto: number; metodo: string; comprobante?: string; observaciones?: string; usuario: string }) => 
    request<{ pago: Pago; factura: Factura }>('/pagos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Pagos de Contado USD (Activación de Servicio)
  getPagosContado: () => request<PagoContadoUSD[]>('/pagos-contado'),
  crearPagoContado: (data: { contratoId: string; concepto: string; montoUsd: number; usuario: string }) =>
    request<PagoContadoUSD>('/pagos-contado/crear', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  subirSoportePagoContado: (id: string, data: { metodoPago: string; fechaPago: string; archivoSoporte: string; usuario: string }) =>
    request<PagoContadoUSD>(`/pagos-contado/${id}/soporte`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  validarPagoContado: (id: string, data: { estado: 'Validado' | 'Rechazado' | 'Anulado' | 'En revisión' | 'Aplicado'; observaciones?: string; usuario: string }) =>
    request<PagoContadoUSD>(`/pagos-contado/${id}/validar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHistorialLiberacion: () => request<HistorialLiberacion[]>('/historial-liberacion'),
  actualizarEstadoServicio: (data: { clienteId: string; estadoNuevo: string; motivo: string; observaciones?: string; usuario: string }) =>
    request<{ success: boolean; estadoServicio: string }>('/clientes/estado-servicio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Logs
  getLogs: () => request<HistorialLog[]>('/logs'),
  createLog: (data: { tabla?: string; registroId?: string; campo?: string; valorAnterior?: string; valorNuevo?: string; motivo?: string; usuario?: string }) =>
    request<{ success: boolean }>('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Billing Configuration
  getConfiguracionFactura: () => request<{ ivaPct: number; comisionPct: number; whtPct: number; impuestoPct: number }>('/configuracion-factura'),
  updateConfiguracionFactura: (data: { ivaPct: number; comisionPct: number; whtPct: number; impuestoPct: number }) => 
    request<{ ivaPct: number; comisionPct: number; whtPct: number; impuestoPct: number }>('/configuracion-factura', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // System & Notification Sender Configuration
  getConfiguracionSistema: () => request<ConfiguracionSistema>('/configuracion-sistema'),
  updateConfiguracionSistema: (data: Partial<ConfiguracionSistema>) =>
    request<ConfiguracionSistema>('/configuracion-sistema', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testSmtp: () => request<{ ok: boolean; host?: string; port?: number; user?: string; error?: string }>('/test-smtp'),
  sendTestEmail: (destinatario: string) => request<{ success: boolean; message: string; messageId?: string }>('/test-email', {
    method: 'POST',
    body: JSON.stringify({ destinatario }),
  }),
  enviarCredencialesUsuario: (correo: string, contrasena?: string) => request<{ success: boolean; message: string; contrasenaTemporal?: string }>(`/usuarios/${encodeURIComponent(correo)}/enviar-credenciales`, {
    method: 'POST',
    body: JSON.stringify({ contrasena }),
  }),

  // Plantillas de Contratos
  getPlantillasContrato: () => request<PlantillaContrato[]>('/plantillas-contrato'),
  createPlantillaContrato: (data: Partial<PlantillaContrato>) => 
    request<PlantillaContrato>('/plantillas-contrato', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlantillaContrato: (id: string, data: Partial<PlantillaContrato>) => 
    request<PlantillaContrato>(`/plantillas-contrato/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Contratos Comerciales
  getContratosComerciales: () => request<ContratoComercial[]>('/contratos-comerciales'),
  createContratoComercial: (data: Partial<ContratoComercial>) => 
    request<ContratoComercial>('/contratos-comerciales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContratoComercial: (id: string, data: Partial<ContratoComercial>) => 
    request<ContratoComercial>(`/contratos-comerciales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteContratoComercial: (id: string) =>
    request<{ message: string; removed: ContratoComercial }>(`/contratos-comerciales/${id}`, {
      method: 'DELETE',
    }),
  deleteAllContratosComerciales: () =>
    request<{ message: string; total: number }>('/contratos-comerciales', {
      method: 'DELETE',
    }),
  enviarCorreoContratoComercial: (id: string, payload?: { correoDestinatario?: string; observaciones?: string; usuario?: string }) => 
    request<{ success: boolean; contrato: ContratoComercial; mensaje: string }>(`/contratos-comerciales/${id}/enviar-correo`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  // Adendums
  getAdendums: () => request<Adendum[]>('/adendums'),
  createAdendum: (data: Partial<Adendum>) => 
    request<Adendum>('/adendums', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdendum: (id: string, data: Partial<Adendum>) => 
    request<Adendum>(`/adendums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Contratos Laborales
  getContratosLaborales: () => request<ContratoLaboral[]>('/contratos-laborales'),
  createContratoLaboral: (data: Partial<ContratoLaboral>) => 
    request<ContratoLaboral>('/contratos-laborales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContratoLaboral: (id: string, data: Partial<ContratoLaboral>) => 
    request<ContratoLaboral>(`/contratos-laborales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  enviarCorreoContratoLaboral: (id: string, payload?: { correoDestinatario?: string; observaciones?: string; usuario?: string }) => 
    request<{ success: boolean; contrato: ContratoLaboral; mensaje: string }>(`/contratos-laborales/${id}/enviar-correo`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  // Tipos de Cambio
  getTiposCambio: () => request<TipoCambio[]>('/tipos-cambio'),
  createTipoCambio: (data: Partial<TipoCambio>) => 
    request<TipoCambio>('/tipos-cambio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tickets de Soporte y Casos
  getTickets: () => request<Ticket[]>('/tickets'),
  createTicket: (data: Partial<Ticket>) => 
    request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTicket: (id: string, data: Partial<Ticket>) => 
    request<Ticket>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  responderTicket: (id: string, data: { usuario: string; autorEmail?: string; rol: string; mensaje: string; esInterno?: boolean; adjuntoNombre?: string; adjuntoUrl?: string }) => 
    request<Ticket>(`/tickets/${id}/respuesta`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  calificarTicket: (id: string, data: { calificacion: number; comentarioCalificacion?: string; usuario: string }) =>
    request<Ticket>(`/tickets/${id}/calificacion`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Mantenimiento y Reglas SLA Parametrizables
  getSlaRules: () => request<ReglaSla[]>('/sla-rules'),
  createSlaRule: (data: Partial<ReglaSla>) => 
    request<ReglaSla>('/sla-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSlaRule: (id: string, data: Partial<ReglaSla>) => 
    request<ReglaSla>(`/sla-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSlaRule: (id: string) => 
    request<{ success: boolean; id: string }>(`/sla-rules/${id}`, {
      method: 'DELETE',
    }),
  toggleSlaRule: (id: string) => 
    request<ReglaSla>(`/sla-rules/${id}/toggle`, {
      method: 'POST',
    }),

  // SLA Trackers & History
  getSlaTrackers: () => request<SlaSeguimiento[]>('/sla-trackers'),
  getSlaHistorial: () => request<SlaHistorial[]>('/sla-historial'),
  pauseSlaTracker: (id: string, data: { usuario: string; observaciones?: string }) => 
    request<SlaSeguimiento>(`/sla-trackers/${id}/pause`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resumeSlaTracker: (id: string, data: { usuario: string; observaciones?: string }) => 
    request<SlaSeguimiento>(`/sla-trackers/${id}/resume`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  escalateSlaTracker: (id: string, data: { usuario: string; observaciones?: string }) => 
    request<SlaSeguimiento>(`/sla-trackers/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resolveSlaTracker: (id: string, data: { usuario: string; observaciones?: string }) => 
    request<SlaSeguimiento>(`/sla-trackers/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Configuración SLA Legacy
  getSlaConfigs: () => request<SlaConfig[]>('/sla-configs'),
  createSlaConfig: (data: Partial<SlaConfig>) => 
    request<SlaConfig>('/sla-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSlaConfig: (id: string, data: Partial<SlaConfig>) => 
    request<SlaConfig>(`/sla-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Plantillas de Notificación
  getPlantillasNotificacion: () => request<PlantillaNotificacion[]>('/plantillas-notificacion'),
  createPlantillaNotificacion: (data: Partial<PlantillaNotificacion>) => 
    request<PlantillaNotificacion>('/plantillas-notificacion', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlantillaNotificacion: (id: string, data: Partial<PlantillaNotificacion>) => 
    request<PlantillaNotificacion>(`/plantillas-notificacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Alertas
  getAlertasNotificacion: () => request<AlertaNotificacion[]>('/alertas-notificacion'),
  marcarAlertaLeida: (id: string) => 
    request<{ success: boolean }>(`/alertas-notificacion/${id}/leer`, {
      method: 'POST',
    }),
  getHistorialNotificaciones: () => request<HistorialNotificacion[]>('/notificaciones/historial'),

  // Seguimientos Comerciales
  getSeguimientosComerciales: () => request<any[]>('/seguimientos-comerciales'),
  createSeguimientoComercial: (data: any) => 
    request<any>('/seguimientos-comerciales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Logs
  getAuditLogs: () => request<any[]>('/audit-logs'),
  createAuditLog: (data: any) => 
    request<any>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Traducciones
  getTraducciones: () => request<Traduccion[]>('/traducciones'),
  createTraduccion: (data: Partial<Traduccion>) => 
    request<Traduccion>('/traducciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTraduccion: (id: string, data: Partial<Traduccion>) => 
    request<Traduccion>(`/traducciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTraduccion: (id: string) => 
    request<{ success: boolean }>(`/traducciones/${id}`, {
      method: 'DELETE',
    }),

  // Directorio
  getDirectorio: () => request<DirectorioContacto[]>('/directorio'),
  createDirectorioContacto: (data: Partial<DirectorioContacto>) =>
    request<DirectorioContacto>('/directorio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDirectorioContacto: (id: string, data: Partial<DirectorioContacto>) =>
    request<DirectorioContacto>(`/directorio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Maestro de Cuentas Bancarias
  getCuentasBancarias: () => request<CuentaBancariaMaestra[]>('/cuentas-bancarias'),
  createCuentaBancaria: (data: Partial<CuentaBancariaMaestra>) =>
    request<CuentaBancariaMaestra>('/cuentas-bancarias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCuentaBancaria: (id: string, data: Partial<CuentaBancariaMaestra>) =>
    request<CuentaBancariaMaestra>(`/cuentas-bancarias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tarifarios EOR por Volumen
  getTarifarios: () => request<TarifarioEOR[]>('/tarifarios'),
  createTarifario: (data: Partial<TarifarioEOR>) =>
    request<TarifarioEOR>('/tarifarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTarifario: (id: string, data: Partial<TarifarioEOR>) =>
    request<TarifarioEOR>(`/tarifarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTarifario: (id: string) =>
    request<{ success: boolean }>(`/tarifarios/${id}`, {
      method: 'DELETE',
    }),

  // Matriz de Reglas Tributarias (IVA - WHT y Renta)
  getReglasTributarias: () => request<ReglaTributariaIvaWht[]>('/reglas-tributarias'),
  createReglaTributaria: (data: Partial<ReglaTributariaIvaWht> & { usuario?: string }) =>
    request<ReglaTributariaIvaWht>('/reglas-tributarias', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateReglaTributaria: (id: string, data: Partial<ReglaTributariaIvaWht> & { motivo?: string; usuario?: string }) =>
    request<ReglaTributariaIvaWht>(`/reglas-tributarias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteReglaTributaria: (id: string, usuario?: string) =>
    request<{ success: boolean }>(`/reglas-tributarias/${id}?usuario=${encodeURIComponent(usuario || '')}`, {
      method: 'DELETE',
    }),

  // Roles y Permisos de Menú
  getRoles: () => request<RoleDefinition[]>('/roles'),
  createRol: (data: Partial<RoleDefinition>) =>
    request<RoleDefinition>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRol: (id: string, data: Partial<RoleDefinition>) =>
    request<RoleDefinition>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRol: (id: string) =>
    request<{ success: boolean }>(`/roles/${id}`, {
      method: 'DELETE',
    }),
  copiarRol: (id: string, nuevoNombre: string) =>
    request<RoleDefinition>(`/roles/${id}/copiar`, {
      method: 'POST',
      body: JSON.stringify({ nuevoNombre }),
    }),
};
