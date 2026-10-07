import React, { useState, useEffect } from 'react';
import { User, Language, CargaSocial, TarifarioEOR } from '../types';
import { api } from '../api';
import { calculateFeeForTalents } from '../utils/feeCalculator';
import { 
  Calculator, DollarSign, Building2, Globe, Users, FileText, 
  Download, Copy, Check, Sparkles, X, ChevronRight, ShieldCheck, 
  PieChart as PieIcon, ArrowRight, Info, AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { tr } from '../utils/i18n';

interface QuoteSimulatorModalProps {
  user?: User;
  lang?: Language;
  isOpen: boolean;
  onClose: () => void;
  onApplyToRequest?: (quoteData: any) => void;
}

interface CountryRates {
  country: string;
  code: string;
  currency: string;
  employerSocialRate: number; // percentage e.g. 26.5
  employeeSocialRate: number; // percentage e.g. 10.5
  aguinaldoMonths: number; // e.g. 1 month per year
  notes: string;
}

const DEFAULT_COUNTRY_RATES: CountryRates[] = [
  { country: 'Costa Rica', code: 'CR', currency: 'USD', employerSocialRate: 26.5, employeeSocialRate: 10.67, aguinaldoMonths: 1, notes: 'Incluye CCSS (26.5%), INS Riesgos del Trabajo y BP.' },
  { country: 'Colombia', code: 'CO', currency: 'USD', employerSocialRate: 30.5, employeeSocialRate: 8.0, aguinaldoMonths: 2, notes: 'Incluye Salud, Pensión, ARL, CCF y Provisiones de Ley (Cesantías y Prima).' },
  { country: 'México', code: 'MX', currency: 'USD', employerSocialRate: 30.0, employeeSocialRate: 5.25, aguinaldoMonths: 0.5, notes: 'Incluye IMSS patronal, INFONAVIT (5%) e Impuesto sobre Nómina (ISN).' },
  { country: 'Panamá', code: 'PA', currency: 'USD', employerSocialRate: 12.25, employeeSocialRate: 9.75, aguinaldoMonths: 1, notes: 'Incluye Caja de Seguro Social (CSS), Seguro Educativo y Riesgos Profesional.' },
  { country: 'Chile', code: 'CL', currency: 'USD', employerSocialRate: 13.5, employeeSocialRate: 17.0, aguinaldoMonths: 0, notes: 'Incluye SIS, Seguro de Cesantía y Mutual de Seguridad.' },
  { country: 'Argentina', code: 'AR', currency: 'USD', employerSocialRate: 24.0, employeeSocialRate: 17.0, aguinaldoMonths: 1, notes: 'Incluye Aportes Jubilatorios, PAMI, Obra Social y ART.' },
  { country: 'Perú', code: 'PE', currency: 'USD', employerSocialRate: 13.0, employeeSocialRate: 13.0, aguinaldoMonths: 2, notes: 'Incluye EsSalud (9%), SENATI y seguro de vida ley.' },
  { country: 'Brasil', code: 'BR', currency: 'USD', employerSocialRate: 36.8, employeeSocialRate: 11.0, aguinaldoMonths: 2, notes: 'Incluye INSS patronal, FGTS (8%) y provisiones de 13º salario y vacaciones.' },
  { country: 'España', code: 'ES', currency: 'EUR', employerSocialRate: 29.9, employeeSocialRate: 6.35, aguinaldoMonths: 2, notes: 'Incluye Seguridad Social, Desempleo, Fogasa y Formación Profesional.' },
  { country: 'Estados Unidos', code: 'US', currency: 'USD', employerSocialRate: 8.5, employeeSocialRate: 7.65, aguinaldoMonths: 0, notes: 'Incluye FICA, FUTA, SUTA y Workers Compensation.' }
];

export default function QuoteSimulatorModal({ user, lang = 'es', isOpen, onClose, onApplyToRequest }: QuoteSimulatorModalProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('Costa Rica');
  const [currency, setCurrency] = useState<string>('USD');
  const [numEmployees, setNumEmployees] = useState<number>(1);
  const [monthlyGrossSalary, setMonthlyGrossSalary] = useState<number>(2500);
  const [eorFeePerEmployee, setEorFeePerEmployee] = useState<number>(150);
  const [healthInsurance, setHealthInsurance] = useState<number>(0);
  const [foodVoucher, setFoodVoucher] = useState<number>(0);
  const [otherPerks, setOtherPerks] = useState<number>(0);
  const [clientName, setClientName] = useState<string>('');
  
  const [copied, setCopied] = useState<boolean>(false);
  const [cargasSocialesDb, setCargasSocialesDb] = useState<CargaSocial[]>([]);
  const [tarifariosDb, setTarifariosDb] = useState<TarifarioEOR[]>([]);
  const [appliedRateInfo, setAppliedRateInfo] = useState<{ schemeName: string; tierLabel: string }>({ schemeName: '', tierLabel: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [cargasList, tarifariosList] = await Promise.all([
          api.getCargasSociales().catch(() => []),
          api.getTarifarios().catch(() => [])
        ]);

        if (Array.isArray(cargasList) && cargasList.length > 0) {
          setCargasSocialesDb(cargasList);
        }
        if (Array.isArray(tarifariosList) && tarifariosList.length > 0) {
          setTarifariosDb(tarifariosList);
        }
      } catch (e) {
        // Fallback
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Automatically update fee when country, talent count, or rate cards change
  useEffect(() => {
    if (isOpen) {
      const res = calculateFeeForTalents(tarifariosDb, selectedCountry, numEmployees, clientName || undefined);
      setEorFeePerEmployee(res.feePorCabezaUsd);
      setAppliedRateInfo({
        schemeName: res.tarifarioAplicado.nombre,
        tierLabel: res.tramoAplicado?.etiqueta || ''
      });
    }
  }, [selectedCountry, numEmployees, clientName, tarifariosDb, isOpen]);

  if (!isOpen) return null;

  // Find country specs
  const countrySpec = DEFAULT_COUNTRY_RATES.find(c => c.country === selectedCountry) || DEFAULT_COUNTRY_RATES[0];
  
  // Calculate employer social rate from database if available, else default
  const dbRate = cargasSocialesDb.find(c => c.pais === selectedCountry && c.estado === 'Vigente');
  const employerSocialRate = dbRate ? dbRate.porcentajeAportePatronal : countrySpec.employerSocialRate;

  // Calculations per employee
  const salaryPerEmp = Number(monthlyGrossSalary) || 0;
  const socialChargesPerEmp = (salaryPerEmp * employerSocialRate) / 100;
  const perksPerEmp = (Number(healthInsurance) || 0) + (Number(foodVoucher) || 0) + (Number(otherPerks) || 0);
  const feePerEmp = Number(eorFeePerEmployee) || 0;

  const totalPerEmployeeMonthly = salaryPerEmp + socialChargesPerEmp + perksPerEmp + feePerEmp;

  // Total for all employees
  const totalEmployees = Math.max(1, Number(numEmployees) || 1);
  const totalSalariesMonthly = salaryPerEmp * totalEmployees;
  const totalSocialChargesMonthly = socialChargesPerEmp * totalEmployees;
  const totalPerksMonthly = perksPerEmp * totalEmployees;
  const totalEorFeeMonthly = feePerEmp * totalEmployees;
  const totalMonthlyGrand = totalPerEmployeeMonthly * totalEmployees;
  const totalAnnualGrand = totalMonthlyGrand * 12;

  // Percentage distribution
  const pctSalary = totalMonthlyGrand > 0 ? Math.round((totalSalariesMonthly / totalMonthlyGrand) * 100) : 0;
  const pctSocial = totalMonthlyGrand > 0 ? Math.round((totalSocialChargesMonthly / totalMonthlyGrand) * 100) : 0;
  const pctPerks = totalMonthlyGrand > 0 ? Math.round((totalPerksMonthly / totalMonthlyGrand) * 100) : 0;
  const pctFee = totalMonthlyGrand > 0 ? Math.round((totalEorFeeMonthly / totalMonthlyGrand) * 100) : 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  };

  const handleCopySummary = () => {
    const text = `
=== ${tr('SIMULACIÓN DE COTIZACIÓN EOR QUICK HIRE', 'QUICK HIRE EOR QUOTE SIMULATION', 'SIMULAÇÃO DE COTAÇÃO EOR QUICK HIRE', lang)} ===
${tr('Cliente:', 'Client:', 'Cliente:', lang)} ${clientName || tr('Prospecto Corporativo', 'Corporate Prospect', 'Prospecto Corporativo', lang)}
${tr('País de Contratación:', 'Hiring Country:', 'País de Contratação:', lang)} ${selectedCountry} (${countrySpec.code})
${tr('Moneda:', 'Currency:', 'Moeda:', lang)} ${currency}
${tr('Número de Colaboradores:', 'Number of Employees:', 'Número de Colaboradores:', lang)} ${totalEmployees}

--- ${tr('DESGLOSE INDIVIDUAL (POR COLABORADOR / MES)', 'INDIVIDUAL BREAKDOWN (PER EMPLOYEE / MONTH)', 'DESDOBRAMENTO INDIVIDUAL (POR COLABORADOR / MÊS)', lang)} ---
• ${tr('Salario Bruto Mensual', 'Monthly Gross Salary', 'Salário Bruto Mensal', lang)}: ${formatMoney(salaryPerEmp)}
• ${tr('Cargas Sociales Patronales', 'Employer Social Security', 'Encargos Sociais Patronais', lang)} (${employerSocialRate}%): ${formatMoney(socialChargesPerEmp)}
• ${tr('Beneficios / Extras', 'Benefits / Extras', 'Benefícios / Extras', lang)}: ${formatMoney(perksPerEmp)}
• ${tr('Fee EOR Quick Hire', 'Quick Hire EOR Fee', 'Taxa EOR Quick Hire', lang)}: ${formatMoney(feePerEmp)}
= ${tr('Total Mensual por Colaborador', 'Total Monthly per Employee', 'Total Mensal por Colaborador', lang)}: ${formatMoney(totalPerEmployeeMonthly)}

--- ${tr('RESUMEN GLOBAL', 'GLOBAL SUMMARY', 'RESUMO GLOBAL', lang)} (${totalEmployees} ${tr('COLABORADOR/ES', 'EMPLOYEE(S)', 'COLABORADOR(ES)', lang)}) ---
• ${tr('Subtotal Salarios', 'Salaries Subtotal', 'Subtotal Salários', lang)}: ${formatMoney(totalSalariesMonthly)}
• ${tr('Subtotal Cargas Sociales Patronales', 'Employer Social Security Subtotal', 'Subtotal Encargos Sociais Patronais', lang)}: ${formatMoney(totalSocialChargesMonthly)}
• ${tr('Subtotal Beneficios Adicionales', 'Additional Perks Subtotal', 'Subtotal Benefícios Adicionais', lang)}: ${formatMoney(totalPerksMonthly)}
• ${tr('Subtotal Fee EOR Quick Hire', 'Quick Hire EOR Fee Subtotal', 'Subtotal Taxa EOR Quick Hire', lang)}: ${formatMoney(totalEorFeeMonthly)}
==================================================
${tr('COSTO TOTAL MENSUAL ESTIMADO', 'ESTIMATED TOTAL MONTHLY COST', 'CUSTO TOTAL MENSAL ESTIMADO', lang)}: ${formatMoney(totalMonthlyGrand)}
${tr('COSTO ANUAL ESTIMADO (12 MESES)', 'ESTIMATED ANNUAL COST (12 MONTHS)', 'CUSTO ANUAL ESTIMADO (12 MESES)', lang)}: ${formatMoney(totalAnnualGrand)}
==================================================
${tr('Nota Legal:', 'Legal Note:', 'Nota Legal:', lang)} ${tr('Las cargas sociales patronales corresponden a las tasas vigentes de', 'Employer social charges correspond to current rates of', 'Os encargos sociais patronais correspondem às taxas vigentes de', lang)} ${selectedCountry} (${countrySpec.notes}).
${tr('Cotización emitida por la Plataforma EOR Quick Hire.', 'Quote issued by Quick Hire EOR Platform.', 'Cotação emitida pela Plataforma EOR Quick Hire.', lang)}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header Background
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 210, 40, 'F');

    // Accent line
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 0, 210, 4, 'F');

    // Branding Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(tr('QUICK HIRE EOR - COTIZACIÓN DE SERVICIOS', 'QUICK HIRE EOR - SERVICE QUOTE', 'QUICK HIRE EOR - COTAÇÃO DE SERVIÇOS', lang), 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(199, 210, 254);
    doc.text(tr('Simulador Comercial & Desglose Estructurado de Empleabilidad Internacional', 'Commercial Simulator & Structured Breakdown of International Employment', 'Simulador Comercial & Desdobramento Estruturado de Empregabilidade Internacional', lang), 15, 28);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${tr('Fecha:', 'Date:', 'Data:', lang)} ${new Date().toISOString().split('T')[0]} | ${tr('Moneda:', 'Currency:', 'Moeda:', lang)} ${currency}`, 15, 34);

    let y = 48;

    // Client & Country Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 180, 24, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${tr('Cliente / Prospecto:', 'Client / Prospect:', 'Cliente / Prospecto:', lang)} ${clientName || tr('Cliente Prospecto EOR', 'EOR Prospect Client', 'Cliente Prospecto EOR', lang)}`, 20, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${tr('País de Contratación:', 'Hiring Country:', 'País de Contratação:', lang)} ${selectedCountry} (${countrySpec.code}) | ${tr('Empleados:', 'Employees:', 'Funcionários:', lang)} ${totalEmployees}`, 20, y + 15);
    doc.text(`${tr('Regulación Social Aplicada:', 'Social Regulation Applied:', 'Regulamentação Social Aplicada:', lang)} ${employerSocialRate}%`, 20, y + 21);

    y += 32;

    // Detailed Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(tr('Desglose Financiero de Empleabilidad (Mensual)', 'Financial Employment Breakdown (Monthly)', 'Desdobramento Financeiro de Empregabilidade (Mensal)', lang), 15, y);
    y += 6;

    const tableHeaders = [
      tr('Concepto de Costo', 'Cost Item', 'Item de Custo', lang),
      tr('Tasa / Regla', 'Rate / Rule', 'Taxa / Regra', lang),
      tr('Costo por Colaborador', 'Cost per Employee', 'Custo por Colaborador', lang),
      `${tr('Total Mensual', 'Monthly Total', 'Total Mensal', lang)} (${totalEmployees} ${tr('emp', 'emp', 'func', lang)})`
    ];
    const tableRows = [
      [tr('Salario Bruto Acordado', 'Agreed Gross Salary', 'Salário Bruto Acordado', lang), tr('100% Sueldo Base', '100% Base Salary', '100% Salário Base', lang), formatMoney(salaryPerEmp), formatMoney(totalSalariesMonthly)],
      [`${tr('Cargas Sociales Patronales', 'Employer Social Security', 'Encargos Sociais Patronais', lang)}`, `${employerSocialRate}% (${selectedCountry})`, formatMoney(socialChargesPerEmp), formatMoney(totalSocialChargesMonthly)],
      [tr('Beneficios / Seguros / Extras', 'Benefits / Insurance / Perks', 'Benefícios / Seguros / Extras', lang), tr('Aportes Opcionales', 'Optional Perks', 'Aportes Opcionais', lang), formatMoney(perksPerEmp), formatMoney(totalPerksMonthly)],
      [tr('Fee de Gestión EOR Quick Hire', 'Quick Hire EOR Management Fee', 'Taxa de Gestão EOR Quick Hire', lang), tr('Tarifa por Colaborador', 'Rate per Employee', 'Tarifa por Colaborador', lang), formatMoney(feePerEmp), formatMoney(totalEorFeeMonthly)],
      [{ content: tr('COSTO TOTAL MENSUAL ESTIMADO', 'ESTIMATED TOTAL MONTHLY COST', 'CUSTO TOTAL MENSAL ESTIMADO', lang), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [238, 242, 255], textColor: [67, 56, 202] } }, 
       { content: formatMoney(totalPerEmployeeMonthly), styles: { fontStyle: 'bold', fillColor: [238, 242, 255] } },
       { content: formatMoney(totalMonthlyGrand), styles: { fontStyle: 'bold', fillColor: [238, 242, 255], textColor: [67, 56, 202] } }]
    ];

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableRows as any,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: [51, 65, 85], fontSize: 8.5 },
      margin: { left: 15, right: 15 }
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // Annual Summary Box
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(15, y, 180, 25, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(tr('PRESUPUESTO ESTIMADO ANUAL (12 MESES OPERATIVOS)', 'ESTIMATED ANNUAL BUDGET (12 OPERATING MONTHS)', 'ORÇAMENTO ESTIMADO ANUAL (12 MESES OPERACIONAIS)', lang), 22, y + 10);

    doc.setTextColor(199, 210, 254);
    doc.setFontSize(16);
    doc.text(`${formatMoney(totalAnnualGrand)} ${currency}`, 22, y + 19);

    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`* ${tr('Incluye la proyección consolidada de nómina, cargas e impuestos patronales y fee EOR.', 'Includes consolidated payroll forecast, employer taxes and charges, and EOR fee.', 'Inclui a projeção consolidada da folha, encargos e impostos patronais e taxa EOR.', lang)}`, 110, y + 19);

    y += 35;

    // Legal Notes
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tr('Notas de Regulación Local', 'Local Regulation Notes', 'Notas de Regulamentação Local', lang)} (${selectedCountry}):`, 15, y);
    doc.text(countrySpec.notes, 15, y + 5, { maxWidth: 180 });
    doc.text(tr('Esta estimación comercial es válida por 30 días naturales y está sujeta a la validación de normativas laborales locales.', 'This quote is valid for 30 calendar days and subject to local labor law validation.', 'Esta cotação comercial é válida por 30 dias corridos e está sujeita à validação das normas trabalhistas locais.', lang), 15, y + 12);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Quick Hire Global EOR Solutions Inc. - ${tr('Documento Informativo de Cotización Comercial', 'Commercial Quote Informational Document', 'Documento Informativo de Cotação Comercial', lang)}`, 15, 285);

    doc.save(`Cotizacion_EOR_QuickHire_${selectedCountry.replace(/\s+/g, '_')}_${totalEmployees}Emp.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {tr('Simulador de Cotizaciones y Fee EOR', 'Quote & EOR Fee Simulator', 'Simulador de Cotações e Fee EOR', lang)}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {tr('Multipaís & Tiempo Real', 'Multi-country & Real Time', 'Multipaís & Tempo Real', lang)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {tr(
                  'Calculadora financiera de costo total de empleabilidad, cargas patronales y comisión EOR',
                  'Financial calculator for total employment cost, employer social charges, and EOR fee',
                  'Calculadora financeira de custo total de empregabilidade, encargos patronais e comissão EOR',
                  lang
                )}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {tr('Parámetros de la Cotización', 'Quote Parameters', 'Parâmetros da Cotação', lang)}
              </h3>
            </div>

            {/* Client Name Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {tr('Nombre del Cliente / Prospecto', 'Client / Prospect Name', 'Nome do Cliente / Prospecto', lang)}
              </label>
              <input 
                type="text"
                placeholder={tr('Ej. Acme Global Inc.', 'e.g. Acme Global Inc.', 'Ex. Acme Global Inc.', lang)}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            {/* Country & Currency Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {tr('País de Contratación', 'Hiring Country', 'País de Contratação', lang)}
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {DEFAULT_COUNTRY_RATES.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {tr('Moneda', 'Currency', 'Moeda', lang)}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CRC">CRC (₡)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="COP">COP ($)</option>
                  <option value="CLP">CLP ($)</option>
                  <option value="PEN">PEN (S/)</option>
                  <option value="BRL">BRL (R$)</option>
                </select>
              </div>
            </div>

            {/* Number of Employees & Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {tr('Cantidad de Empleados', 'Number of Employees', 'Quantidade de Funcionários', lang)}
                </label>
                <input 
                  type="number"
                  min="1"
                  max="500"
                  value={numEmployees}
                  onChange={(e) => setNumEmployees(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {tr('Salario Bruto / Emp', 'Gross Salary / Emp', 'Salário Bruto / Func', lang)} ({currency})
                </label>
                <input 
                  type="number"
                  step="100"
                  min="0"
                  value={monthlyGrossSalary}
                  onChange={(e) => setMonthlyGrossSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Fee EOR per Employee */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {tr('Fee EOR Quick Hire / Emp', 'Quick Hire EOR Fee / Emp', 'Taxa EOR Quick Hire / Func', lang)} ({currency})
                </label>
                <span className="text-[10px] text-indigo-600 font-bold">
                  {tr('Autocalculado por Tarifario', 'Auto-calculated by Rate Card', 'Autocalculado por Tarifário', lang)}
                </span>
              </div>
              <input 
                type="number"
                step="10"
                min="0"
                value={eorFeePerEmployee}
                onChange={(e) => setEorFeePerEmployee(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {appliedRateInfo.schemeName && (
                <div className="mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center justify-between font-medium">
                  <span>{tr('Aplicado:', 'Applied:', 'Aplicado:', lang)} <strong>{appliedRateInfo.schemeName}</strong></span>
                  {appliedRateInfo.tierLabel && (
                    <span className="font-bold text-emerald-800">[{appliedRateInfo.tierLabel}]</span>
                  )}
                </div>
              )}
            </div>

            {/* Optional Benefits */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {tr('Beneficios Extralegales Adicionales / Emp', 'Additional Perks & Benefits / Emp', 'Benefícios Adicionais / Func', lang)} ({currency})
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] text-slate-500 font-medium mb-0.5">
                    {tr('Seguro Médico / Vida', 'Health / Life Insurance', 'Seguro Médico / Vida', lang)}
                  </span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={healthInsurance || ''}
                    onChange={(e) => setHealthInsurance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <span className="block text-[10px] text-slate-500 font-medium mb-0.5">
                    {tr('Vale Alimentación', 'Food Voucher / Allowance', 'Vale Alimentação', lang)}
                  </span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={foodVoucher || ''}
                    onChange={(e) => setFoodVoucher(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Regulatory badge */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-[11px] space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>{tr('Regulación Social:', 'Social Regulation:', 'Regulamentação Social:', lang)} {selectedCountry} ({employerSocialRate}%)</span>
              </div>
              <p className="text-amber-800 text-[10px] leading-relaxed">
                {countrySpec.notes}
              </p>
            </div>

          </div>

          {/* Right Column: Financial Results & Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
            
            <div className="space-y-4">
              
              {/* Grand Total Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Monthly Grand Total Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-lg border border-indigo-800/50 space-y-2">
                  <div className="flex items-center justify-between text-indigo-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {tr('Costo Total Mensual', 'Total Monthly Cost', 'Custo Total Mensal', lang)} ({totalEmployees} {tr('emp', 'emp', 'func', lang)})
                    </span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-white font-mono">
                    {formatMoney(totalMonthlyGrand)}
                  </div>
                  <div className="text-[11px] text-indigo-200 flex items-center justify-between">
                    <span>{tr('Por colaborador:', 'Per employee:', 'Por colaborador:', lang)}</span>
                    <strong className="text-emerald-300 font-mono">{formatMoney(totalPerEmployeeMonthly)}/{tr('mes', 'mo', 'mês', lang)}</strong>
                  </div>
                </div>

                {/* Annual Grand Total Card */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {tr('Presupuesto Anual Estimado (12M)', 'Estimated Annual Budget (12M)', 'Orçamento Anual Estimado (12M)', lang)}
                    </span>
                    <Globe className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-white font-mono">
                    {formatMoney(totalAnnualGrand)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {tr('Incluye salarios, cargas sociales y fee EOR', 'Includes salaries, social charges, and EOR fee', 'Inclui salários, encargos sociais e taxa EOR', lang)}
                  </div>
                </div>

              </div>

              {/* Visual Percentage Distribution Bar */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{tr('Distribución Visual del Costo Total', 'Visual Distribution of Total Cost', 'Distribuição Visual do Custo Total', lang)}</span>
                  <span className="text-slate-500 font-mono text-[11px]">100% {tr('Presupuesto', 'Budget', 'Orçamento', lang)}</span>
                </div>

                {/* Progress Stack */}
                <div className="h-4 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div style={{ width: `${pctSalary}%` }} className="bg-indigo-600 transition-all" title={`Salario Base: ${pctSalary}%`} />
                  <div style={{ width: `${pctSocial}%` }} className="bg-amber-500 transition-all" title={`Cargas Sociales: ${pctSocial}%`} />
                  <div style={{ width: `${pctPerks}%` }} className="bg-emerald-500 transition-all" title={`Beneficios: ${pctPerks}%`} />
                  <div style={{ width: `${pctFee}%` }} className="bg-purple-600 transition-all" title={`Fee EOR: ${pctFee}%`} />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="text-slate-600">{tr('Sueldo', 'Salary', 'Salário', lang)} ({pctSalary}%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600">{tr('Cargas', 'Social Charges', 'Encargos', lang)} ({pctSocial}%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">{tr('Extras', 'Perks', 'Benefícios', lang)} ({pctPerks}%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span className="text-slate-600">{tr('Fee EOR', 'EOR Fee', 'Taxa EOR', lang)} ({pctFee}%)</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">{tr('Concepto', 'Item / Concept', 'Item / Conceito', lang)}</th>
                      <th className="p-3">{tr('Por Colaborador', 'Per Employee', 'Por Colaborador', lang)}</th>
                      <th className="p-3 text-right">{tr('Subtotal', 'Subtotal', 'Subtotal', lang)} ({totalEmployees} {tr('emp', 'emp', 'func', lang)})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    <tr>
                      <td className="p-3">{tr('Salario Bruto Base', 'Base Gross Salary', 'Salário Bruto Base', lang)}</td>
                      <td className="p-3 font-mono">{formatMoney(salaryPerEmp)}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatMoney(totalSalariesMonthly)}</td>
                    </tr>
                    <tr className="bg-amber-50/30">
                      <td className="p-3 flex items-center space-x-1.5">
                        <span>{tr('Cargas Sociales Patronales', 'Employer Social Security & Charges', 'Encargos Sociais Patronais', lang)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">{employerSocialRate}%</span>
                      </td>
                      <td className="p-3 font-mono">{formatMoney(socialChargesPerEmp)}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-900">{formatMoney(totalSocialChargesMonthly)}</td>
                    </tr>
                    {perksPerEmp > 0 && (
                      <tr className="bg-emerald-50/30">
                        <td className="p-3">{tr('Beneficios Extralegales', 'Additional Perks', 'Benefícios Extralegais', lang)}</td>
                        <td className="p-3 font-mono">{formatMoney(perksPerEmp)}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-900">{formatMoney(totalPerksMonthly)}</td>
                      </tr>
                    )}
                    <tr className="bg-indigo-50/30">
                      <td className="p-3 text-indigo-950 font-bold">{tr('Fee EOR Quick Hire', 'Quick Hire EOR Fee', 'Taxa EOR Quick Hire', lang)}</td>
                      <td className="p-3 font-mono text-indigo-900">{formatMoney(feePerEmp)}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-900">{formatMoney(totalEorFeeMonthly)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold">
                    <tr>
                      <td className="p-3">{tr('TOTAL MENSUAL', 'TOTAL MONTHLY', 'TOTAL MENSAL', lang)}</td>
                      <td className="p-3 font-mono text-indigo-200">{formatMoney(totalPerEmployeeMonthly)}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 text-sm">{formatMoney(totalMonthlyGrand)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{tr('Exportar Cotización PDF', 'Export Quote PDF', 'Exportar Cotação em PDF', lang)}</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copied ? tr('¡Copiado!', 'Copied!', 'Copiado!', lang) : tr('Copiar Texto', 'Copy Text', 'Copiar Texto', lang)}</span>
                </button>
              </div>

              {onApplyToRequest && (
                <button
                  onClick={() => {
                    onApplyToRequest({
                      pais: selectedCountry,
                      moneda: currency,
                      cantidadEmpleados: totalEmployees,
                      salarioBruto: salaryPerEmp,
                      feeEOR: feePerEmp,
                      costoTotalMensual: totalMonthlyGrand
                    });
                    onClose();
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>{tr('Usar en Nueva Solicitud', 'Use in New Request', 'Usar em Nova Solicitação', lang)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
