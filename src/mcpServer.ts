import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { 
  DatabaseSchema, 
  SolicitudEOR, 
  Trabajador, 
  Ticket, 
  AuditLog 
} from './types.ts';
import { calculateFeeForTalents, OFFICIAL_DEFAULT_TARIFARIO } from './utils/feeCalculator.ts';

// Official country social rates reference
interface CountrySocialRate {
  country: string;
  code: string;
  currency: string;
  employerRate: number; // percentage
  employeeRate: number; // percentage
  aguinaldoMonths: number;
  notes: string;
}

const COUNTRY_SOCIAL_RATES: Record<string, CountrySocialRate> = {
  'costa rica': { country: 'Costa Rica', code: 'CR', currency: 'USD', employerRate: 26.5, employeeRate: 10.67, aguinaldoMonths: 1, notes: 'CCSS (26.5%), INS Riesgos del Trabajo y Banco Popular.' },
  'colombia': { country: 'Colombia', code: 'CO', currency: 'USD', employerRate: 30.5, employeeRate: 8.0, aguinaldoMonths: 2, notes: 'Salud, Pensión, ARL, CCF y Provisiones de Ley (Cesantías y Prima).' },
  'méxico': { country: 'México', code: 'MX', currency: 'USD', employerRate: 30.0, employeeRate: 5.25, aguinaldoMonths: 0.5, notes: 'IMSS patronal, INFONAVIT (5%) e Impuesto sobre Nómina (ISN).' },
  'mexico': { country: 'México', code: 'MX', currency: 'USD', employerRate: 30.0, employeeRate: 5.25, aguinaldoMonths: 0.5, notes: 'IMSS patronal, INFONAVIT (5%) e Impuesto sobre Nómina (ISN).' },
  'panamá': { country: 'Panamá', code: 'PA', currency: 'USD', employerRate: 12.25, employeeRate: 9.75, aguinaldoMonths: 1, notes: 'Caja de Seguro Social (CSS), Seguro Educativo y Riesgos Profesionales.' },
  'panama': { country: 'Panamá', code: 'PA', currency: 'USD', employerRate: 12.25, employeeRate: 9.75, aguinaldoMonths: 1, notes: 'Caja de Seguro Social (CSS), Seguro Educativo y Riesgos Profesionales.' },
  'chile': { country: 'Chile', code: 'CL', currency: 'USD', employerRate: 13.5, employeeRate: 17.0, aguinaldoMonths: 0, notes: 'SIS, Seguro de Cesantía y Mutual de Seguridad.' },
  'argentina': { country: 'Argentina', code: 'AR', currency: 'USD', employerRate: 24.0, employeeRate: 17.0, aguinaldoMonths: 1, notes: 'Aportes Jubilatorios, PAMI, Obra Social y ART.' },
  'perú': { country: 'Perú', code: 'PE', currency: 'USD', employerRate: 13.0, employeeRate: 13.0, aguinaldoMonths: 2, notes: 'EsSalud (9%), SENATI y seguro de vida ley.' },
  'peru': { country: 'Perú', code: 'PE', currency: 'USD', employerRate: 13.0, employeeRate: 13.0, aguinaldoMonths: 2, notes: 'EsSalud (9%), SENATI y seguro de vida ley.' },
  'brasil': { country: 'Brasil', code: 'BR', currency: 'USD', employerRate: 36.8, employeeRate: 11.0, aguinaldoMonths: 2, notes: 'INSS patronal, FGTS (8%) y provisiones de 13º salario y vacaciones.' },
  'brazil': { country: 'Brasil', code: 'BR', currency: 'USD', employerRate: 36.8, employeeRate: 11.0, aguinaldoMonths: 2, notes: 'INSS patronal, FGTS (8%) y provisiones de 13º salario y vacaciones.' },
  'españa': { country: 'España', code: 'ES', currency: 'EUR', employerRate: 29.9, employeeRate: 6.35, aguinaldoMonths: 2, notes: 'Seguridad Social, Desempleo, Fogasa y Formación Profesional.' },
  'spain': { country: 'España', code: 'ES', currency: 'EUR', employerRate: 29.9, employeeRate: 6.35, aguinaldoMonths: 2, notes: 'Seguridad Social, Desempleo, Fogasa y Formación Profesional.' },
  'estados unidos': { country: 'Estados Unidos', code: 'US', currency: 'USD', employerRate: 8.5, employeeRate: 7.65, aguinaldoMonths: 0, notes: 'FICA, FUTA, SUTA y Workers Compensation.' },
  'usa': { country: 'Estados Unidos', code: 'US', currency: 'USD', employerRate: 8.5, employeeRate: 7.65, aguinaldoMonths: 0, notes: 'FICA, FUTA, SUTA y Workers Compensation.' }
};

// Tool Definitions for MCP
export const MCP_TOOLS = [
  {
    name: 'crear_solicitud_eor',
    description: 'Registra una nueva solicitud de servicios EOR (Employer of Record) o PEO de Grupo STT. Crea el prospecto en el pipeline comercial, dispara la auditoría y genera alertas para los asesores.',
    inputSchema: {
      type: 'object',
      properties: {
        empresa: { type: 'string', description: 'Nombre o razón social de la empresa cliente solicitante.' },
        pais: { type: 'string', description: 'País donde se contratará el talento (ej: Costa Rica, México, Colombia, Panamá, etc.).' },
        puestosRequeridos: { type: 'string', description: 'Título o descripción de los puestos requeridos (ej: Ingeniero DevOps, Diseñador UI/UX).' },
        cantidadTrabajadores: { type: 'number', description: 'Cantidad estimada de talentos a contratar. Por defecto 1.' },
        salarioAproximadoUSD: { type: 'number', description: 'Salario mensual bruto estimado por colaborador en USD.' },
        nombreContacto: { type: 'string', description: 'Nombre y apellido de la persona de contacto.' },
        correoContacto: { type: 'string', description: 'Correo electrónico institucional del contacto.' },
        telefonoContacto: { type: 'string', description: 'Número de teléfono o WhatsApp de contacto (opcional).' },
        servicio: { 
          type: 'string', 
          enum: ['EOR', 'PEO', 'Payroll', 'Reclutamiento'], 
          description: 'Modalidad de servicio solicitada. Por defecto EOR.' 
        },
        observaciones: { type: 'string', description: 'Requisitos adicionales, fecha deseada de contratación o notas comerciales.' }
      },
      required: ['empresa', 'pais', 'puestosRequeridos', 'salarioAproximadoUSD', 'nombreContacto', 'correoContacto']
    }
  },
  {
    name: 'listar_solicitudes_eor',
    description: 'Consulta las solicitudes y prospectos de servicio EOR registrados en el pipeline comercial de Grupo STT.',
    inputSchema: {
      type: 'object',
      properties: {
        estado: { 
          type: 'string', 
          enum: ['Recibida', 'En revisión', 'Aprobada', 'Rechazada', 'Cliente creado', 'Todos'], 
          description: 'Filtrar por estado comercial de la solicitud. Por defecto Todos.' 
        },
        pais: { type: 'string', description: 'Filtrar solicitudes por país de contratación (opcional).' },
        limite: { type: 'number', description: 'Cantidad máxima de solicitudes a retornar. Por defecto 20.' }
      }
    }
  },
  {
    name: 'simular_cotizacion_eor',
    description: 'Calcula con precisión legal y financiera la cotización oficial de nómina EOR por país: salario bruto, cargas sociales patronales, provisión de prestaciones/aguinaldo y fee mensual de Grupo STT con escala por volumen de talentos.',
    inputSchema: {
      type: 'object',
      properties: {
        pais: { type: 'string', description: 'País de contratación (ej: Costa Rica, Colombia, México, Panamá, Chile, etc.).' },
        salarioBruto: { type: 'number', description: 'Salario mensual bruto pactado por colaborador.' },
        moneda: { type: 'string', enum: ['USD', 'EUR', 'Local'], description: 'Moneda base para la cotización. Por defecto USD.' },
        cantidadTalentos: { type: 'number', description: 'Número de colaboradores a contratar. Aplica descuentos por tramo de talentos oficial de Grupo STT. Por defecto 1.' },
        beneficiosAdicionales: { type: 'number', description: 'Monto mensual adicional por colaborador por concepto de beneficios opcionales (seguro privado, viáticos, etc.). Por defecto 0.' }
      },
      required: ['pais', 'salarioBruto']
    }
  },
  {
    name: 'listar_clientes',
    description: 'Lista las empresas cliente que tienen servicios activos de EOR o PEO formalizados con Grupo STT.',
    inputSchema: {
      type: 'object',
      properties: {
        pais: { type: 'string', description: 'Filtrar por país donde opera el cliente (opcional).' },
        asesor: { type: 'string', description: 'Filtrar por correo o nombre del asesor comercial responsable (opcional).' }
      }
    }
  },
  {
    name: 'consultar_cliente',
    description: 'Consulta el expediente y detalle completo de un cliente EOR, incluyendo sus términos contractuales, cupos, fee pactado y la lista de colaboradores en nómina.',
    inputSchema: {
      type: 'object',
      properties: {
        clienteIdOrNombre: { type: 'string', description: 'ID del cliente (ej: CLI-001) o nombre/razón social de la empresa.' }
      },
      required: ['clienteIdOrNombre']
    }
  },
  {
    name: 'registrar_trabajador',
    description: 'Da de alta a un nuevo colaborador o talento bajo el servicio EOR asignado a una empresa cliente en Grupo STT.',
    inputSchema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string', description: 'ID del cliente al cual se asignará el trabajador.' },
        nombreCompleto: { type: 'string', description: 'Nombre completo del trabajador.' },
        documentoIdentidad: { type: 'string', description: 'Número de identificación oficial (DNI, Cédula, RFC, Pasaporte).' },
        puesto: { type: 'string', description: 'Cargo o posición del colaborador.' },
        salario: { type: 'number', description: 'Salario mensual bruto pactado.' },
        moneda: { type: 'string', description: 'Moneda del salario (ej: USD, CRC, MXN, COP). Por defecto USD.' },
        fechaIngreso: { type: 'string', description: 'Fecha de ingreso en formato YYYY-MM-DD.' },
        correo: { type: 'string', description: 'Correo electrónico del colaborador (opcional).' },
        modalidad: { type: 'string', enum: ['Remoto', 'Híbrido', 'Presencial'], description: 'Modalidad de trabajo. Por defecto Remoto.' }
      },
      required: ['clienteId', 'nombreCompleto', 'documentoIdentidad', 'puesto', 'salario', 'fechaIngreso']
    }
  },
  {
    name: 'consultar_tickets_soporte',
    description: 'Consulta los tickets de soporte, consultas y requerimientos operativos con su estado de SLA en tiempo real.',
    inputSchema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string', description: 'Filtrar tickets por ID de cliente (opcional).' },
        estado: { 
          type: 'string', 
          description: 'Filtrar por estado del ticket (ej: Nuevo, Abierto, En Proceso, Resuelto, Cerrado, Todos). Por defecto Todos.' 
        },
        prioridad: { 
          type: 'string', 
          enum: ['Baja', 'Media', 'Alta', 'Crítica', 'Todas'], 
          description: 'Filtrar por prioridad.' 
        }
      }
    }
  },
  {
    name: 'crear_ticket_soporte',
    description: 'Abre un nuevo ticket de soporte, consulta o requerimiento operativo para un cliente con cálculo automático de SLA de resolución.',
    inputSchema: {
      type: 'object',
      properties: {
        clienteId: { type: 'string', description: 'ID del cliente solicitante.' },
        asunto: { type: 'string', description: 'Resumen o motivo del requerimiento.' },
        descripcion: { type: 'string', description: 'Detalle descriptivo de la solicitud.' },
        categoria: { 
          type: 'string', 
          enum: ['Soporte General', 'Nómina y Pagos', 'Contratos y Adendums', 'Facturación', 'Consultas Laborales', 'Altas y Bajas', 'Beneficios', 'Otro'], 
          description: 'Categoría operativa del requerimiento. Por defecto Soporte General.' 
        },
        prioridad: { 
          type: 'string', 
          enum: ['Baja', 'Media', 'Alta', 'Crítica'], 
          description: 'Prioridad de atención. Por defecto Media.' 
        },
        solicitanteEmail: { type: 'string', description: 'Correo electrónico del solicitante o contacto.' }
      },
      required: ['clienteId', 'asunto', 'descripcion', 'solicitanteEmail']
    }
  },
  {
    name: 'consultar_resumen_ejecutivo',
    description: 'Obtiene las métricas consolidadas en tiempo real de Quick Hire: total de solicitudes pendientes, clientes activos, colaboradores bajo nómina EOR y tickets en curso.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Resources List for MCP
export const MCP_RESOURCES = [
  {
    uri: 'quickhire://tarifarios',
    name: 'Tarifario Oficial EOR Grupo STT',
    description: 'Matriz oficial de tarifas por tramos de talentos (Cell Caps) y descuentos por volumen.',
    mimeType: 'application/json'
  },
  {
    uri: 'quickhire://cargas-sociales',
    name: 'Cargas Sociales Patronales por País',
    description: 'Tasas vigentes de seguridad social patronal, riesgos de trabajo y provisiones legales en Latinoamérica y España.',
    mimeType: 'application/json'
  },
  {
    uri: 'quickhire://cuentas-bancarias',
    name: 'Cuentas Bancarias Maestras Grupo STT',
    description: 'Directorio oficial de cuentas bancarias en USD y monedas locales para recepción de fondos y dispersión de nómina.',
    mimeType: 'application/json'
  },
  {
    uri: 'quickhire://reglas-tributarias',
    name: 'Matriz Tributaria IVA / WHT por País',
    description: 'Reglas de aplicación de Impuesto al Valor Agregado y Retención en la Fuente para servicios transfronterizos EOR.',
    mimeType: 'application/json'
  },
  {
    uri: 'quickhire://sla-politicas',
    name: 'Políticas de SLAs de Atención',
    description: 'Tiempos máximos de primera respuesta y resolución comprometidos según severidad (Crítica, Alta, Media, Baja).',
    mimeType: 'application/json'
  }
];

// Prompts List for MCP
export const MCP_PROMPTS = [
  {
    name: 'cotizacion_eor_formal',
    description: 'Genera una propuesta formal ejecutiva de servicios EOR para un prospecto, lista para enviar por correo.',
    arguments: [
      { name: 'empresa', description: 'Nombre de la empresa prospecto', required: true },
      { name: 'pais', description: 'País donde se contratará el talento', required: true },
      { name: 'puesto', description: 'Puesto o perfil del colaborador', required: true },
      { name: 'salarioBrutoUSD', description: 'Salario mensual bruto pactado en USD', required: true },
      { name: 'cantidadTalentos', description: 'Número de colaboradores', required: false }
    ]
  },
  {
    name: 'guia_onboarding_empleado',
    description: 'Genera la lista de verificación y requisitos legales para dar de alta a un colaborador bajo legislación laboral local.',
    arguments: [
      { name: 'pais', description: 'País del colaborador', required: true },
      { name: 'modalidad', description: 'Modalidad (Remoto, Presencial o Híbrido)', required: false }
    ]
  }
];

// Core tool executor function (shared across SSE, JSON-RPC and REST)
export async function executeMcpTool(
  toolName: string, 
  args: any, 
  getDb: () => DatabaseSchema, 
  saveDb: (db: DatabaseSchema) => void,
  writeAuditLog: Function
): Promise<{ success: boolean; data?: any; error?: string }> {
  const db = getDb();
  args = args || {};

  try {
    switch (toolName) {
      case 'crear_solicitud_eor': {
        const id = `SOL-${Date.now().toString().slice(-6)}`;
        const nuevaSolicitud: SolicitudEOR = {
          id,
          empresa: String(args.empresa || '').trim(),
          pais: String(args.pais || '').trim(),
          servicioRequerido: String(args.servicio || 'EOR').trim(),
          moneda: 'USD',
          cantidadTrabajadores: Number(args.cantidadTrabajadores) || 1,
          nombreContacto: String(args.nombreContacto || '').trim(),
          correo: String(args.correoContacto || '').trim(),
          telefono: String(args.telefonoContacto || '').trim(),
          observaciones: `${args.puestosRequeridos ? `Puestos: ${args.puestosRequeridos}. ` : ''}${args.salarioAproximadoUSD ? `Salario est: $${args.salarioAproximadoUSD} USD. ` : ''}${args.observaciones || ''}`.trim(),
          estado: 'Recibida',
          fechaRecepcion: new Date().toISOString()
        };

        if (!nuevaSolicitud.empresa || !nuevaSolicitud.correo) {
          return { success: false, error: 'Los campos empresa y correoContacto son obligatorios.' };
        }

        db.solicitudes.unshift(nuevaSolicitud);
        saveDb(db);

        writeAuditLog({
          usuario: args.correoContacto || 'Agente MCP',
          rol: 'mcp_agent',
          modulo: 'Pipeline Comercial EOR',
          accion: 'Crear Solicitud EOR vía MCP',
          entidadAfectada: 'SolicitudEOR',
          entidadId: id,
          estadoNuevo: 'Recibida',
          motivoObservacion: `Solicitud registrada por IA para ${nuevaSolicitud.empresa} en ${nuevaSolicitud.pais}`,
          resultado: 'exitoso'
        });

        return {
          success: true,
          data: {
            mensaje: 'Solicitud EOR registrada exitosamente en el pipeline comercial de Grupo STT.',
            solicitudId: id,
            solicitud: nuevaSolicitud
          }
        };
      }

      case 'listar_solicitudes_eor': {
        const estado = args.estado || 'Todos';
        const pais = args.pais ? String(args.pais).toLowerCase().trim() : null;
        const limite = Math.min(100, Math.max(1, Number(args.limite) || 20));

        let list = [...(db.solicitudes || [])];
        if (estado && estado !== 'Todos') {
          list = list.filter(s => s.estado.toLowerCase() === estado.toLowerCase());
        }
        if (pais) {
          list = list.filter(s => s.pais.toLowerCase().includes(pais));
        }

        const totalEncontradas = list.length;
        const resultados = list.slice(0, limite).map(s => ({
          id: s.id,
          empresa: s.empresa,
          pais: s.pais,
          servicioRequerido: s.servicioRequerido,
          cantidadTrabajadores: s.cantidadTrabajadores,
          estado: s.estado,
          nombreContacto: s.nombreContacto,
          correo: s.correo,
          observaciones: s.observaciones,
          fechaRecepcion: s.fechaRecepcion
        }));

        return {
          success: true,
          data: {
            totalEncontradas,
            limiteAplicado: limite,
            solicitudes: resultados
          }
        };
      }

      case 'simular_cotizacion_eor': {
        const paisRaw = String(args.pais || 'Costa Rica').toLowerCase().trim();
        const rateSpec = COUNTRY_SOCIAL_RATES[paisRaw] || {
          country: args.pais || 'Personalizado',
          code: 'GEN',
          currency: 'USD',
          employerRate: 25.0,
          employeeRate: 10.0,
          aguinaldoMonths: 1,
          notes: 'Tasa estimada general para Latinoamérica.'
        };

        const salarioBruto = Math.max(1, Number(args.salarioBruto) || 2500);
        const cantidadTalentos = Math.max(1, Number(args.cantidadTalentos) || 1);
        const beneficios = Math.max(0, Number(args.beneficiosAdicionales) || 0);
        const moneda = args.moneda || 'USD';

        // Official volume tier fee calculation
        const feeResult = calculateFeeForTalents(
          db.tarifarios || [OFFICIAL_DEFAULT_TARIFARIO],
          rateSpec.country,
          cantidadTalentos
        );

        const feePorCabeza = feeResult.feePorCabezaUsd;
        const cargasSocialesPorCabeza = Math.round((salarioBruto * (rateSpec.employerRate / 100)) * 100) / 100;
        const provisionPrestaciones = rateSpec.aguinaldoMonths > 0 
          ? Math.round(((salarioBruto * rateSpec.aguinaldoMonths) / 12) * 100) / 100 
          : 0;

        const costoPorEmpleadoMes = salarioBruto + cargasSocialesPorCabeza + provisionPrestaciones + beneficios + feePorCabeza;
        const costoTotalMensual = Math.round(costoPorEmpleadoMes * cantidadTalentos * 100) / 100;
        const costoTotalAnual = Math.round(costoTotalMensual * 12 * 100) / 100;

        return {
          success: true,
          data: {
            pais: rateSpec.country,
            codigoPais: rateSpec.code,
            moneda,
            cantidadTalentos,
            desglosePorColaborador: {
              salarioBrutoMensual: salarioBruto,
              cargasSocialesPatronales: cargasSocialesPorCabeza,
              porcentajeCargasPatronales: `${rateSpec.employerRate}%`,
              provisionPrestacionesYAguinaldo: provisionPrestaciones,
              beneficiosAdicionales: beneficios,
              feeEorGrupoStt: feePorCabeza,
              tramoAplicado: feeResult.tramoAplicado?.etiqueta || 'Estándar',
              subtotalMensualPorColaborador: costoPorEmpleadoMes
            },
            resumenGlobal: {
              totalSalariosBrutosMensuales: salarioBruto * cantidadTalentos,
              totalCargasSocialesMensuales: cargasSocialesPorCabeza * cantidadTalentos,
              totalFeeGrupoSttMensual: feePorCabeza * cantidadTalentos,
              totalMensualFacturable: costoTotalMensual,
              proyeccionAnualFacturable12Meses: costoTotalAnual
            },
            referenciaLegal: rateSpec.notes
          }
        };
      }

      case 'listar_clientes': {
        const pais = args.pais ? String(args.pais).toLowerCase().trim() : null;
        const asesor = args.asesor ? String(args.asesor).toLowerCase().trim() : null;

        let clientes = [...(db.clientes || [])];
        if (pais) {
          clientes = clientes.filter(c => c.pais.toLowerCase().includes(pais));
        }
        if (asesor) {
          clientes = clientes.filter(c => (c.asesorAsignado || '').toLowerCase().includes(asesor));
        }

        const resumen = clientes.map(c => {
          const trabajadoresCount = (db.trabajadores || []).filter(t => t.clienteId === c.id && t.estado === 'Activo').length;
          return {
            id: c.id,
            empresa: c.empresa,
            pais: c.pais,
            asesorAsignado: c.asesorAsignado || 'Sin Asesor',
            cupoTrabajadores: c.cupoTrabajadores,
            trabajadoresActivos: trabajadoresCount,
            moneda: c.moneda,
            feePorEmpleado: c.feePorEmpleado,
            fechaInicio: c.fechaInicio || c.fechaInicioContrato
          };
        });

        return {
          success: true,
          data: {
            totalClientes: resumen.length,
            clientes: resumen
          }
        };
      }

      case 'consultar_cliente': {
        const query = String(args.clienteIdOrNombre || '').toLowerCase().trim();
        if (!query) {
          return { success: false, error: 'Debe especificar clienteIdOrNombre.' };
        }

        const cliente = (db.clientes || []).find(c => 
          c.id.toLowerCase() === query || 
          c.empresa.toLowerCase().includes(query) ||
          (c.razonSocial && c.razonSocial.toLowerCase().includes(query))
        );

        if (!cliente) {
          return { success: false, error: `No se encontró ningún cliente que coincida con "${args.clienteIdOrNombre}".` };
        }

        const trabajadores = (db.trabajadores || []).filter(t => t.clienteId === cliente.id);
        const facturas = (db.facturas || []).filter(f => f.clienteId === cliente.id);

        return {
          success: true,
          data: {
            cliente: {
              id: cliente.id,
              empresa: cliente.empresa,
              razonSocial: cliente.razonSocial,
              cedulaJuridica: cliente.cedulaJuridica,
              pais: cliente.pais,
              asesorAsignado: cliente.asesorAsignado,
              moneda: cliente.moneda,
              feePorEmpleado: cliente.feePorEmpleado,
              cupoTrabajadores: cliente.cupoTrabajadores,
              credito: cliente.credito,
              fechaInicio: cliente.fechaInicio || cliente.fechaInicioContrato,
              totalColaboradoresActivos: trabajadores.filter(t => t.estado === 'Activo').length
            },
            colaboradores: trabajadores.map(t => ({
              id: t.id,
              nombre: t.nombre,
              puesto: t.puesto,
              salario: t.salario,
              moneda: t.moneda,
              fechaIngreso: t.fechaIngreso,
              estado: t.estado
            })),
            facturacionReciente: facturas.slice(-3).map(f => ({
              id: f.id,
              periodo: f.periodo,
              totalFacturado: f.totalFacturado,
              saldoPendiente: f.saldoPendiente,
              moneda: f.moneda,
              fechaEmision: f.fechaEmision,
              estado: f.estado
            }))
          }
        };
      }

      case 'registrar_trabajador': {
        const clienteId = String(args.clienteId || '').trim();
        const cliente = (db.clientes || []).find(c => c.id.toLowerCase() === clienteId.toLowerCase() || c.empresa.toLowerCase().includes(clienteId.toLowerCase()));
        
        if (!cliente) {
          return { success: false, error: `Cliente no encontrado con ID "${args.clienteId}".` };
        }

        const trabajadoresActuales = (db.trabajadores || []).filter(t => t.clienteId === cliente.id && t.estado === 'Activo');
        if (trabajadoresActuales.length >= cliente.cupoTrabajadores) {
          return { 
            success: false, 
            error: `El cliente ha alcanzado su cupo máximo contratado de ${cliente.cupoTrabajadores} trabajadores (Activos actuales: ${trabajadoresActuales.length}). Solicite una ampliación de cupo comercial.` 
          };
        }

        const id = `TRAB-${Date.now().toString().slice(-5)}`;
        const nuevoTrabajador: Trabajador = {
          id,
          clienteId: cliente.id,
          clienteNombre: cliente.empresa,
          nombre: String(args.nombreCompleto || '').trim(),
          correo: args.correo || '',
          puesto: String(args.puesto || '').trim(),
          tipoCarga: 'Individual',
          salario: Number(args.salario) || 0,
          moneda: args.moneda || cliente.moneda || 'USD',
          fechaIngreso: String(args.fechaIngreso || new Date().toISOString().split('T')[0]),
          modalidadTrabajo: (args.modalidad as any) || 'Remoto',
          beneficiosAplicables: [],
          pais: cliente.pais,
          observaciones: `Registrado vía MCP por IA. Documento: ${args.documentoIdentidad || 'N/A'}`,
          estado: 'Activo',
          ultimaActualizacion: new Date().toISOString()
        };

        if (!nuevoTrabajador.nombre || !nuevoTrabajador.salario) {
          return { success: false, error: 'Faltan campos requeridos (nombreCompleto, salario).' };
        }

        db.trabajadores.push(nuevoTrabajador);
        cliente.trabajadoresCargados = (cliente.trabajadoresCargados || 0) + 1;
        saveDb(db);

        writeAuditLog({
          usuario: 'Agente MCP',
          rol: 'mcp_agent',
          modulo: 'Nómina & Colaboradores',
          accion: 'Alta de Trabajador vía MCP',
          entidadAfectada: 'Trabajador',
          entidadId: id,
          estadoNuevo: 'Activo',
          motivoObservacion: `Trabajador ${nuevoTrabajador.nombre} asignado a ${cliente.empresa}`,
          resultado: 'exitoso'
        });

        return {
          success: true,
          data: {
            mensaje: 'Colaborador dado de alta exitosamente en nómina EOR.',
            trabajadorId: id,
            trabajador: nuevoTrabajador,
            clienteEmpresa: cliente.empresa,
            cupoRestante: cliente.cupoTrabajadores - (trabajadoresActuales.length + 1)
          }
        };
      }

      case 'consultar_tickets_soporte': {
        const clienteId = args.clienteId ? String(args.clienteId).toLowerCase().trim() : null;
        const estado = args.estado || 'Todos';
        const prioridad = args.prioridad || 'Todas';

        let tickets = [...(db.tickets || [])];
        if (clienteId) {
          tickets = tickets.filter(t => t.clienteId.toLowerCase() === clienteId);
        }
        if (estado && estado !== 'Todos') {
          tickets = tickets.filter(t => (t.estado || '').toLowerCase() === estado.toLowerCase());
        }
        if (prioridad && prioridad !== 'Todas') {
          tickets = tickets.filter(t => (t.prioridad || '').toLowerCase() === prioridad.toLowerCase());
        }

        const resultado = tickets.map(t => {
          const cliente = (db.clientes || []).find(c => c.id === t.clienteId);
          return {
            id: t.id,
            asunto: t.asunto,
            clienteEmpresa: cliente?.empresa || t.clienteNombre || t.clienteId,
            categoria: t.categoria || 'Soporte General',
            prioridad: t.prioridad || 'Media',
            estado: t.estado,
            fechaCreacion: t.fechaCreacion,
            slaFechaLimiteResolucion: t.slaFechaLimiteResolucion,
            slaEstado: t.slaEstado || 'Dentro de tiempo'
          };
        });

        return {
          success: true,
          data: {
            totalTickets: resultado.length,
            tickets: resultado
          }
        };
      }

      case 'crear_ticket_soporte': {
        const clienteId = String(args.clienteId || '').trim();
        const cliente = (db.clientes || []).find(c => c.id.toLowerCase() === clienteId.toLowerCase() || c.empresa.toLowerCase().includes(clienteId.toLowerCase()));
        
        if (!cliente) {
          return { success: false, error: `Cliente no encontrado con ID o nombre "${args.clienteId}".` };
        }

        const id = `TCK-${Date.now().toString().slice(-6)}`;
        const prioridad = (args.prioridad as any) || 'Media';
        
        // SLA hours by priority
        const slaHours = prioridad === 'Crítica' ? 4 : prioridad === 'Alta' ? 12 : prioridad === 'Media' ? 24 : 48;
        const fechaCreacion = new Date();
        const fechaVencimiento = new Date(fechaCreacion.getTime() + slaHours * 60 * 60 * 1000);

        const nuevoTicket: Ticket = {
          id,
          clienteId: cliente.id,
          clienteNombre: cliente.empresa,
          asunto: String(args.asunto || '').trim(),
          descripcion: String(args.descripcion || '').trim(),
          categoria: (args.categoria as any) || 'Soporte General',
          prioridad,
          estado: 'Abierto',
          solicitanteEmail: String(args.solicitanteEmail || '').trim(),
          solicitanteNombre: cliente.empresa,
          solicitanteRol: 'cliente',
          asesorAsignado: cliente.asesorAsignado || 'asesor-eor-peo@grupostt.com',
          slaHorasResolucion: slaHours,
          fechaCreacion: fechaCreacion.toISOString(),
          slaFechaLimiteResolucion: fechaVencimiento.toISOString(),
          slaEstado: 'Dentro de tiempo',
          comentarios: [{
            id: `COM-${Date.now()}`,
            autor: 'Agente MCP',
            autorEmail: args.solicitanteEmail || 'mcp@grupostt.com',
            autorRol: 'cliente',
            mensaje: 'Ticket generado vía Model Context Protocol por agente de IA.',
            fecha: fechaCreacion.toISOString()
          }]
        };

        if (!db.tickets) db.tickets = [];
        db.tickets.unshift(nuevoTicket);
        saveDb(db);

        writeAuditLog({
          usuario: args.solicitanteEmail || 'Agente MCP',
          rol: 'mcp_agent',
          modulo: 'Mesa de Ayuda & SLAs',
          accion: 'Crear Ticket vía MCP',
          entidadAfectada: 'Ticket',
          entidadId: id,
          estadoNuevo: 'Abierto',
          motivoObservacion: `Ticket ${id} para ${cliente.empresa}`,
          resultado: 'exitoso'
        });

        return {
          success: true,
          data: {
            mensaje: 'Ticket de soporte creado exitosamente con SLA de atención registrado.',
            ticketId: id,
            prioridad,
            slaComprometidoHoras: slaHours,
            slaFechaLimiteResolucion: fechaVencimiento.toISOString()
          }
        };
      }

      case 'consultar_resumen_ejecutivo': {
        const totalSolicitudes = (db.solicitudes || []).length;
        const pendientesSolicitudes = (db.solicitudes || []).filter(s => s.estado === 'Recibida' || s.estado === 'En revisión').length;
        const totalClientes = (db.clientes || []).length;
        const trabajadoresActivos = (db.trabajadores || []).filter(t => t.estado === 'Activo').length;
        const ticketsAbiertos = (db.tickets || []).filter(t => (t.estado || '').toLowerCase() === 'abierto' || (t.estado || '').toLowerCase() === 'en proceso' || (t.estado || '').toLowerCase() === 'nuevo').length;
        const paisesOperacion = Array.from(new Set((db.clientes || []).map(c => c.pais)));

        return {
          success: true,
          data: {
            resumen: 'Indicadores Globales de Quick Hire Grupo STT',
            pipelineComercial: {
              totalSolicitudes,
              solicitudesPendientesDeGestion: pendientesSolicitudes
            },
            carteraClientes: {
              totalClientesActivos: totalClientes,
              paisesConOperacionActiva: paisesOperacion
            },
            nominaTalentos: {
              totalColaboradoresActivosEor: trabajadoresActivos
            },
            servicioYAtencion: {
              ticketsPendientesDeResolucion: ticketsAbiertos
            },
            serviciosDisponibles: ['Employer of Record (EOR)', 'PEO Internacional', 'Payroll Local', 'Reclutamiento Transfronterizo']
          }
        };
      }

      default:
        return { success: false, error: `Herramienta desconocida: "${toolName}".` };
    }
  } catch (err: any) {
    return { success: false, error: `Error durante la ejecución de la herramienta ${toolName}: ${err.message}` };
  }
}

// Resource content reader
export function readMcpResource(uri: string, getDb: () => DatabaseSchema): { uri: string; mimeType: string; text: string } {
  const db = getDb();

  switch (uri) {
    case 'quickhire://tarifarios':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.tarifarios || [OFFICIAL_DEFAULT_TARIFARIO], null, 2)
      };

    case 'quickhire://cargas-sociales':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(COUNTRY_SOCIAL_RATES, null, 2)
      };

    case 'quickhire://cuentas-bancarias':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.cuentasBancarias || [], null, 2)
      };

    case 'quickhire://reglas-tributarias':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.reglasTributarias || [], null, 2)
      };

    case 'quickhire://sla-politicas':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.slaConfigs || [], null, 2)
      };

    default:
      throw new Error(`Recurso no encontrado para URI: ${uri}`);
  }
}

// Express Route Setup
export function setupMcpRoutes(
  app: express.Express,
  getDb: () => DatabaseSchema,
  saveDb: (db: DatabaseSchema) => void,
  writeAuditLog: Function
) {
  // Store active SSE connections
  const activeTransports = new Map<string, SSEServerTransport>();

  // Helper to create an initialized MCP Server instance
  function createConfiguredMcpServer(): Server {
    const server = new Server(
      {
        name: 'quick-hire-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    // Register Tools List
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: MCP_TOOLS };
    });

    // Register Tool Call
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: toolArgs } = request.params;
      const result = await executeMcpTool(name, toolArgs, getDb, saveDb, writeAuditLog);

      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Error al ejecutar ${name}: ${result.error}`
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2)
          }
        ]
      };
    });

    // Register Resources List
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: MCP_RESOURCES };
    });

    // Register Resource Read
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resourceData = readMcpResource(request.params.uri, getDb);
      return {
        contents: [
          {
            uri: resourceData.uri,
            mimeType: resourceData.mimeType,
            text: resourceData.text
          }
        ]
      };
    });

    // Register Prompts List
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { prompts: MCP_PROMPTS };
    });

    // Register Prompt Get
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      const promptArgs = request.params.arguments || {};

      if (promptName === 'cotizacion_eor_formal') {
        const empresa = promptArgs.empresa || 'Empresa Cliente';
        const pais = promptArgs.pais || 'Costa Rica';
        const puesto = promptArgs.puesto || 'Especialista';
        const salario = promptArgs.salarioBrutoUSD || '2,500';
        const cantidad = promptArgs.cantidadTalentos || '1';

        return {
          description: 'Plantilla de propuesta formal EOR',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Actúa como Director Comercial de Grupo STT. Redacta una propuesta ejecutiva formal de servicios EOR (Employer of Record) dirigida a ${empresa}. Se cotizará la contratación de ${cantidad} colaborador(es) en el puesto de ${puesto} en ${pais}, con un salario mensual bruto de $${salario} USD. Utiliza la herramienta simular_cotizacion_eor para obtener el desglose exacto de cargas sociales y fees, y presenta la información con una estructura impecable y transparente.`
              }
            }
          ]
        };
      }

      if (promptName === 'guia_onboarding_empleado') {
        const pais = promptArgs.pais || 'el país solicitado';
        const modalidad = promptArgs.modalidad || 'Remoto';

        return {
          description: 'Guía de onboarding y cumplimiento laboral',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Actúa como Especialista en Cumplimiento Laboral y Nómina de Grupo STT. Explica a un cliente los requisitos legales, documentos obligatorios que debe firmar el trabajador, exámenes médicos y pasos de alta en seguridad social para iniciar a un colaborador bajo modalidad ${modalidad} en ${pais} bajo la figura de EOR.`
              }
            }
          ]
        };
      }

      throw new Error(`Prompt no encontrado: ${promptName}`);
    });

    return server;
  }

  // 1. SSE Endpoint: GET /api/mcp/sse
  app.get('/api/mcp/sse', async (req, res) => {
    try {
      const transport = new SSEServerTransport('/api/mcp/messages', res);
      const server = createConfiguredMcpServer();

      activeTransports.set(transport.sessionId, transport);

      req.on('close', () => {
        activeTransports.delete(transport.sessionId);
      });

      await server.connect(transport);
    } catch (err: any) {
      console.error('Error in MCP SSE connection:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish MCP SSE stream', details: err.message });
      }
    }
  });

  // 2. Post Messages Endpoint for SSE clients: POST /api/mcp/messages
  app.post('/api/mcp/messages', async (req, res) => {
    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);
    if (!sessionId) {
      res.status(400).json({ error: 'Falta el parámetro sessionId en la query de mensajes MCP.' });
      return;
    }

    const transport = activeTransports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: `Sesión MCP no encontrada o expirada (ID: ${sessionId}).` });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (err: any) {
      console.error(`Error handling MCP message for session ${sessionId}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error procesando mensaje MCP', details: err.message });
      }
    }
  });

  // 3. Direct JSON-RPC Endpoint: POST /api/mcp
  // Allows direct JSON-RPC 2.0 calls without persistent SSE (ideal for cloud agents, n8n, Flowise, curl)
  app.post('/api/mcp', async (req, res) => {
    const { jsonrpc, id, method, params } = req.body || {};

    if (jsonrpc !== '2.0' && !method) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request: se requiere payload JSON-RPC 2.0 con "method".' }
      });
      return;
    }

    try {
      switch (method) {
        case 'initialize':
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: 'quick-hire-mcp-server',
                version: '1.0.0',
                description: 'Model Context Protocol Server para Quick Hire - Plataforma EOR y PEO de Grupo STT'
              },
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              instructions: 'Servidor MCP de Grupo STT para gestión de servicios EOR, cálculo de cotizaciones, clientes, colaboradores y tickets de soporte.'
            }
          });
          break;

        case 'tools/list':
          res.json({
            jsonrpc: '2.0',
            id,
            result: { tools: MCP_TOOLS }
          });
          break;

        case 'tools/call': {
          const { name, arguments: toolArgs } = params || {};
          const result = await executeMcpTool(name, toolArgs, getDb, saveDb, writeAuditLog);

          if (!result.success) {
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: `Error: ${result.error}` }],
                isError: true
              }
            });
          } else {
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }]
              }
            });
          }
          break;
        }

        case 'resources/list':
          res.json({
            jsonrpc: '2.0',
            id,
            result: { resources: MCP_RESOURCES }
          });
          break;

        case 'resources/read': {
          const uri = params?.uri;
          try {
            const resource = readMcpResource(uri, getDb);
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                contents: [{
                  uri: resource.uri,
                  mimeType: resource.mimeType,
                  text: resource.text
                }]
              }
            });
          } catch (e: any) {
            res.status(404).json({
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: e.message }
            });
          }
          break;
        }

        case 'prompts/list':
          res.json({
            jsonrpc: '2.0',
            id,
            result: { prompts: MCP_PROMPTS }
          });
          break;

        default:
          res.status(404).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Método JSON-RPC no soportado: ${method}` }
          });
      }
    } catch (err: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: `Internal error: ${err.message}` }
      });
    }
  });

  // 4. REST Convenience: GET /api/mcp/status & Manifest
  app.get('/api/mcp/status', (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      status: 'active',
      name: 'Quick Hire MCP Server (Grupo STT)',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      transports: {
        sse: `${baseUrl}/api/mcp/sse`,
        messages: `${baseUrl}/api/mcp/messages`,
        directJsonRpc: `${baseUrl}/api/mcp`,
        directRestTools: `${baseUrl}/api/mcp/tools`
      },
      sesionesSseActivas: activeTransports.size,
      totalHerramientas: MCP_TOOLS.length,
      totalRecursos: MCP_RESOURCES.length,
      totalPrompts: MCP_PROMPTS.length,
      herramientasDisponibles: MCP_TOOLS.map(t => ({ name: t.name, description: t.description }))
    });
  });

  // 5. REST Tools Discovery: GET /api/mcp/tools
  app.get('/api/mcp/tools', (req, res) => {
    res.json({
      success: true,
      total: MCP_TOOLS.length,
      tools: MCP_TOOLS
    });
  });

  // 6. REST Tool Direct Execution: POST /api/mcp/tools/:toolName
  app.post('/api/mcp/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const result = await executeMcpTool(toolName, req.body, getDb, saveDb, writeAuditLog);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
    } else {
      res.json({ success: true, data: result.data });
    }
  });

  // 7. Config template generator for Claude Desktop and Cursor: GET /api/mcp/config
  app.get('/api/mcp/config', (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      claudeDesktopConfig: {
        mcpServers: {
          quickHireSTT: {
            url: `${baseUrl}/api/mcp/sse`
          }
        }
      },
      cursorConfig: {
        mcp: {
          servers: [
            {
              name: 'quickHireSTT',
              type: 'sse',
              url: `${baseUrl}/api/mcp/sse`
            }
          ]
        }
      },
      restDocs: {
        endpoint: `${baseUrl}/api/mcp`,
        toolsList: `${baseUrl}/api/mcp/tools`,
        executeTool: `POST ${baseUrl}/api/mcp/tools/{toolName}`
      }
    });
  });

  console.log('✅ Model Context Protocol (MCP) Server endpoints mounted at /api/mcp/*');
}
