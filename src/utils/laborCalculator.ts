/**
 * Calculadora de Cargas Sociales, Impuestos y Costo Total del Talento para Quick Hire EOR Latam
 */

export interface DesgloseConcepto {
  concepto: string;
  porcentaje: number;
  monto: number;
  esObligatorio: boolean;
}

export interface CalculoTalentoResult {
  pais: string;
  salarioBruto: number;
  moneda: string;
  cargasSocialesPatronalesPct: number;
  cargasSocialesMonto: number;
  feeServicioMonto: number;
  impuestosMonto: number;
  costoTotalTalento: number;
  desglose: DesgloseConcepto[];
  impuestosDetalle: { concepto: string; monto: number }[];
}

export interface PaisLaborRegla {
  cargasSocialesPct: number;
  desglose: { concepto: string; pct: number }[];
  impuestosNominaPct: number; // e.g. ISN en Mexico o impuesto local
  impuestosNominaNombre: string;
  feeDefaultUsd: number;
  ivaSobreFeePct: number;
}

export const PAIS_LABOR_REGLAS: Record<string, PaisLaborRegla> = {
  'Costa Rica': {
    cargasSocialesPct: 26.5,
    desglose: [
      { concepto: 'CCSS Seguro de Salud (SEM)', pct: 9.25 },
      { concepto: 'CCSS Pensiones (IVM)', pct: 5.42 },
      { concepto: 'Banco Popular y Asignaciones Familiares (FODESAF)', pct: 5.25 },
      { concepto: 'INA, IMAS y Banco Popular Aporte Patronal', pct: 2.0 },
      { concepto: 'INS Riesgos del Trabajo (Estimado)', pct: 2.0 },
      { concepto: 'Provisión Aguinaldo Legal', pct: 2.58 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto estatal de nómina',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 13
  },
  'Colombia': {
    cargasSocialesPct: 28.5,
    desglose: [
      { concepto: 'Aporte Pensión Patronal', pct: 12.0 },
      { concepto: 'Aporte Salud Patronal', pct: 8.5 },
      { concepto: 'Caja de Compensación Familiar (CCF)', pct: 4.0 },
      { concepto: 'ARL Riesgos Laborales (Riesgo I-II)', pct: 1.0 },
      { concepto: 'SENA / ICBF (Parafiscales)', pct: 3.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto local directo adicional',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 19
  },
  'México': {
    cargasSocialesPct: 26.0,
    desglose: [
      { concepto: 'IMSS Cuota Patronal (Enfermedad y Maternidad)', pct: 13.5 },
      { concepto: 'IMSS Invalidez y Vida + Retiro Cesantía/Vejez', pct: 5.5 },
      { concepto: 'INFONAVIT Fondo de Vivienda', pct: 5.0 },
      { concepto: 'IMSS Riesgo de Trabajo (Clase I)', pct: 2.0 }
    ],
    impuestosNominaPct: 3.0,
    impuestosNominaNombre: 'Impuesto Sobre Nómina (ISN Estatal)',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 16
  },
  'Brasil': {
    cargasSocialesPct: 35.8,
    desglose: [
      { concepto: 'INSS Patronal Previdenciário', pct: 20.0 },
      { concepto: 'FGTS Fundo de Garantia por Tempo de Serviço', pct: 8.0 },
      { concepto: 'Sistema S (SESI/SENAI/SEBRAE)', pct: 5.8 },
      { concepto: 'RAT Riscos Ambientais do Trabalho', pct: 2.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'Contribuicões incidentes incluídas no FGTS/INSS',
    feeDefaultUsd: 180,
    ivaSobreFeePct: 0
  },
  'Chile': {
    cargasSocialesPct: 7.5,
    desglose: [
      { concepto: 'Seguro de Cesantía Patronal (AFC)', pct: 2.4 },
      { concepto: 'Seguro de Invalidez y Sobrevivencia (SIS)', pct: 1.49 },
      { concepto: 'Mutual de Seguridad (Accidentes del Trabajo)', pct: 1.61 },
      { concepto: 'Ley SANNA (Cuidado Integral)', pct: 2.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'Tributación retenida a cargo del trabajador',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 19
  },
  'Perú': {
    cargasSocialesPct: 11.5,
    desglose: [
      { concepto: 'EsSalud Aporte Patronal', pct: 9.0 },
      { concepto: 'SCTR Salud y Pensión (Trabajo de Riesgo)', pct: 1.5 },
      { concepto: 'Seguro de Vida Ley Obligatorio', pct: 1.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto local adicional sobre nómina',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 18
  },
  'Argentina': {
    cargasSocialesPct: 24.0,
    desglose: [
      { concepto: 'SIPA Jubilación Patronal', pct: 10.7 },
      { concepto: 'INSSJyP (PAMI)', pct: 1.5 },
      { concepto: 'Fondo Nacional de Empleo y Asignaciones', pct: 4.8 },
      { concepto: 'Obra Social Patronal', pct: 6.0 },
      { concepto: 'ART Aseguradora de Riesgos del Trabajo', pct: 1.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'Impuestos locales directos no aplicables',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 21
  },
  'Panamá': {
    cargasSocialesPct: 15.25,
    desglose: [
      { concepto: 'Caja de Seguro Social (CSS Patronal)', pct: 12.25 },
      { concepto: 'Seguro Educativo Patronal', pct: 1.5 },
      { concepto: 'Riesgos Profesionales (Estimado clase I)', pct: 1.5 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto municipal directo sobre salario',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 7
  },
  'Guatemala': {
    cargasSocialesPct: 12.67,
    desglose: [
      { concepto: 'IGSS Seguridad Social Patronal', pct: 10.67 },
      { concepto: 'IRTRA Recreación de los Trabajadores', pct: 1.0 },
      { concepto: 'INTECAP Capacitación Técnica', pct: 1.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto adicional',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 12
  },
  'El Salvador': {
    cargasSocialesPct: 16.25,
    desglose: [
      { concepto: 'ISSS Seguro Social Patronal', pct: 7.5 },
      { concepto: 'AFP Administradora de Fondos de Pensiones', pct: 7.75 },
      { concepto: 'INSAFORP Formación Profesional', pct: 1.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto adicional',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 13
  },
  'Honduras': {
    cargasSocialesPct: 11.5,
    desglose: [
      { concepto: 'IHSS Seguro Social Patronal', pct: 7.2 },
      { concepto: 'RAP Régimen de Aportaciones Privadas', pct: 1.5 },
      { concepto: 'INFOP Formación Profesional', pct: 1.0 },
      { concepto: 'Fondo de Cobertura Laboral', pct: 1.8 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto adicional',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 15
  },
  'Nicaragua': {
    cargasSocialesPct: 23.5,
    desglose: [
      { concepto: 'INSS Instituto Nicaragüense de Seguridad Social', pct: 21.5 },
      { concepto: 'INATEC Aporte de Capacitación Técnica', pct: 2.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto adicional',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 15
  },
  'República Dominicana': {
    cargasSocialesPct: 16.39,
    desglose: [
      { concepto: 'TSS Seguro Familiar de Salud (SFS Patronal)', pct: 7.09 },
      { concepto: 'TSS Seguro de Vejez, Discapacidad y Sobrevivencia (SVDS)', pct: 7.10 },
      { concepto: 'TSS Seguro de Riesgos Laborales (SRL)', pct: 1.20 },
      { concepto: 'INFOTEP Instituto Nacional de Formación Técnico Profesional', pct: 1.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto directo a la empresa',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 18
  },
  'Uruguay': {
    cargasSocialesPct: 12.63,
    desglose: [
      { concepto: 'BPS Aporte Jubilatorio Patronal', pct: 7.5 },
      { concepto: 'FONASA Fondo Nacional de Salud Patronal', pct: 5.0 },
      { concepto: 'FRL Fondo de Reconversión Laboral', pct: 0.13 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 22
  },
  'Ecuador': {
    cargasSocialesPct: 12.15,
    desglose: [
      { concepto: 'IESS Aporte Patronal Obligatorio', pct: 11.15 },
      { concepto: 'SECAP Servicio de Capacitación Profesional', pct: 0.5 },
      { concepto: 'IECE Instituto de Crédito Educativo', pct: 0.5 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto municipal a nómina',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 15
  }
};

/**
 * Calcula de forma exacta el desglose de costos de un talento:
 * Salario + Cargas Sociales Patronales del país + Fee de Servicio EOR + Impuestos locales aplicables
 */
export function calcularCostoTalento(
  salarioBruto: number,
  pais: string,
  moneda: string = 'USD',
  feeClienteConfigurado?: number,
  feePctConfigurado?: number
): CalculoTalentoResult {
  const regla = PAIS_LABOR_REGLAS[pais] || {
    cargasSocialesPct: 25.0,
    desglose: [
      { concepto: `Cargas Sociales Patronales (${pais})`, pct: 25.0 }
    ],
    impuestosNominaPct: 0,
    impuestosNominaNombre: 'No aplica impuesto especial',
    feeDefaultUsd: 150,
    ivaSobreFeePct: 0
  };

  const montoSalario = Number(salarioBruto) || 0;
  
  // 1. Cargas sociales patronales
  const cargasSocialesMonto = Number(((montoSalario * regla.cargasSocialesPct) / 100).toFixed(2));
  
  const desglose: DesgloseConcepto[] = regla.desglose.map(item => ({
    concepto: item.concepto,
    porcentaje: item.pct,
    monto: Number(((montoSalario * item.pct) / 100).toFixed(2)),
    esObligatorio: true
  }));

  // 2. Impuestos de nómina patronales (e.g. ISN 3% en México)
  let impuestosNominaMonto = 0;
  const impuestosDetalle: { concepto: string; monto: number }[] = [];

  if (regla.impuestosNominaPct > 0) {
    impuestosNominaMonto = Number(((montoSalario * regla.impuestosNominaPct) / 100).toFixed(2));
    impuestosDetalle.push({
      concepto: regla.impuestosNominaNombre,
      monto: impuestosNominaMonto
    });
  }

  // 3. Fee de servicio Quick Hire EOR
  let feeServicioMonto = 0;
  if (feeClienteConfigurado !== undefined && feeClienteConfigurado > 0) {
    feeServicioMonto = Number(feeClienteConfigurado);
  } else if (feePctConfigurado !== undefined && feePctConfigurado > 0) {
    feeServicioMonto = Number(((montoSalario * feePctConfigurado) / 100).toFixed(2));
  } else {
    feeServicioMonto = regla.feeDefaultUsd;
  }

  // 4. Impuesto IVA sobre el Fee (si aplica según jurisdicción)
  let ivaFeeMonto = 0;
  if (regla.ivaSobreFeePct > 0) {
    ivaFeeMonto = Number(((feeServicioMonto * regla.ivaSobreFeePct) / 100).toFixed(2));
    impuestosDetalle.push({
      concepto: `IVA sobre Fee (${regla.ivaSobreFeePct}%)`,
      monto: ivaFeeMonto
    });
  }

  const impuestosMontoTotal = Number((impuestosNominaMonto + ivaFeeMonto).toFixed(2));

  // 5. Costo Total del Talento para el Cliente
  const costoTotalTalento = Number(
    (montoSalario + cargasSocialesMonto + feeServicioMonto + impuestosMontoTotal).toFixed(2)
  );

  return {
    pais,
    salarioBruto: montoSalario,
    moneda,
    cargasSocialesPatronalesPct: regla.cargasSocialesPct,
    cargasSocialesMonto,
    feeServicioMonto,
    impuestosMonto: impuestosMontoTotal,
    costoTotalTalento,
    desglose,
    impuestosDetalle
  };
}
