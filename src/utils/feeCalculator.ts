import type { TarifarioEOR, TramoTalentos } from '../types.ts';

export const OFFICIAL_DEFAULT_TARIFARIO: TarifarioEOR = {
  id: 'TAR-STD-OFFICIAL',
  nombre: 'Tarifario Oficial Estándar STT',
  descripcion: 'Matriz tarifaria oficial por volumen de talentos aplicable por defecto a todos los países y clientes.',
  esDefault: true,
  paisesAplicables: ['Todos'],
  clientesAplicables: ['Todos'],
  estado: 'Activo',
  fechaActualizacion: '2026-08-11',
  usuarioActualizacion: 'administrador-eor-peo@grupostt.com',
  tramos: [
    { id: 'TRM-1', minTalentos: 1, maxTalentos: 50, etiqueta: '1 – 50 Talents', feeUsd: 350.00 },
    { id: 'TRM-2', minTalentos: 51, maxTalentos: 80, etiqueta: '80 Talents', feeUsd: 300.00 },
    { id: 'TRM-3', minTalentos: 81, maxTalentos: 150, etiqueta: '150 Talents', feeUsd: 280.00 },
    { id: 'TRM-4', minTalentos: 151, maxTalentos: 320, etiqueta: '320 Talents (Cell Cap)', feeUsd: 250.00 },
    { id: 'TRM-5', minTalentos: 321, maxTalentos: 99999, etiqueta: '500+ Talents', feeUsd: 230.00 }
  ]
};

export interface FeeCalculationResult {
  feePorCabezaUsd: number;
  feeTotalMensualUsd: number;
  tarifarioAplicado: TarifarioEOR;
  tramoAplicado?: TramoTalentos;
  origen: 'Cliente Específico' | 'País Específico' | 'Oficial Estándar';
}

export function calculateFeeForTalents(
  tarifarios: TarifarioEOR[],
  pais: string,
  cantidadTalentos: number,
  clienteIdOrNombre?: string
): FeeCalculationResult {
  const count = Math.max(1, Number(cantidadTalentos) || 1);
  const activeTarifarios = Array.isArray(tarifarios) && tarifarios.length > 0 
    ? tarifarios.filter(t => t.estado === 'Activo')
    : [OFFICIAL_DEFAULT_TARIFARIO];

  // 1. Specific Client Match
  let match: TarifarioEOR | undefined;
  let origen: 'Cliente Específico' | 'País Específico' | 'Oficial Estándar' = 'Oficial Estándar';

  if (clienteIdOrNombre) {
    match = activeTarifarios.find(t => 
      !t.esDefault &&
      t.clientesAplicables && 
      t.clientesAplicables.length > 0 &&
      !t.clientesAplicables.includes('Todos') &&
      t.clientesAplicables.some(c => c.toLowerCase() === clienteIdOrNombre.toLowerCase()) &&
      (t.paisesAplicables.includes('Todos') || t.paisesAplicables.some(p => p.toLowerCase() === pais.toLowerCase()))
    );
    if (match) origen = 'Cliente Específico';
  }

  // 2. Specific Country Match
  if (!match) {
    match = activeTarifarios.find(t => 
      !t.esDefault &&
      t.paisesAplicables &&
      t.paisesAplicables.length > 0 &&
      !t.paisesAplicables.includes('Todos') &&
      t.paisesAplicables.some(p => p.toLowerCase() === pais.toLowerCase())
    );
    if (match) origen = 'País Específico';
  }

  // 3. Fallback to default official rate card
  if (!match) {
    match = activeTarifarios.find(t => t.esDefault) || OFFICIAL_DEFAULT_TARIFARIO;
    origen = 'Oficial Estándar';
  }

  // Find tier in matching rate card
  const tramo = match.tramos.find(tr => count >= tr.minTalentos && count <= tr.maxTalentos)
    || match.tramos[match.tramos.length - 1] 
    || OFFICIAL_DEFAULT_TARIFARIO.tramos[0];

  const feePorCabezaUsd = tramo ? tramo.feeUsd : 350.00;
  const feeTotalMensualUsd = feePorCabezaUsd * count;

  return {
    feePorCabezaUsd,
    feeTotalMensualUsd,
    tarifarioAplicado: match,
    tramoAplicado: tramo,
    origen
  };
}
