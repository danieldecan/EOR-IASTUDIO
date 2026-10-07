import { CuentaBancariaMaestra } from '../types';

export const normalizeCountry = (val: string): string => {
  return (val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const DEFAULT_CUENTAS_BANCARIAS: CuentaBancariaMaestra[] = [
  { id: 'CTA-001', sociedad: 'AMERICAN NATURAL CORPORATION HN', pais: 'Honduras', moneda: 'HNL', banco: 'BAC', numeroCuenta: '730460981', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-002', sociedad: 'AMERICAN NATURAL CORPORATION HN', pais: 'Honduras', moneda: 'USD', banco: 'BAC', numeroCuenta: '748601131', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-003', sociedad: 'BETA SERVICIOS TEMPORALES SAS', pais: 'Colombia', moneda: 'COP', banco: 'BANCOLOMBIA', numeroCuenta: '20100000258', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-004', sociedad: 'CONTABILIDADE INTELIGENCIA ARTIFICIAL - BCIAMM LTDA BRASIL', pais: 'Brasil', moneda: 'BRL', banco: 'BANCO ITAU', numeroCuenta: 'AGENCIA 0762 CC 99267-5', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-005', sociedad: 'EBO CONTACT CENTER SA', pais: 'Costa Rica', moneda: 'USD', banco: 'BAC', numeroCuenta: 'CR39010200009442481601 USD', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-006', sociedad: 'EBO CONTACT CENTER SA', pais: 'Costa Rica', moneda: 'CRC', banco: 'BAC', numeroCuenta: 'CR88010200009442481786', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-007', sociedad: 'E.S.T', pais: 'Chile', moneda: 'CLP', banco: 'BANCO DE CHILE', numeroCuenta: '00-005-09514-10', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-008', sociedad: 'SOCIEDAD GESTION ESTRATEGICA DE TALENTOS SPA', pais: 'Chile', moneda: 'CLP', banco: 'BCI', numeroCuenta: '78383795', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-009', sociedad: 'ENCUENTRE SU TRABAJO S.A.', pais: 'Guatemala', moneda: 'GTQ', banco: 'BANCO INDUSTRIAL', numeroCuenta: '2100029959', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-010', sociedad: 'ENCUENTRE SU TRABAJO S.A.', pais: 'Guatemala', moneda: 'USD', banco: 'BANCO INDUSTRIAL', numeroCuenta: '0272032407', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-011', sociedad: 'EVOLVING TALENT MEXICO SA DE CV', pais: 'México', moneda: 'MXN', banco: 'BBVA', numeroCuenta: '0127523688 CLABE 012180001275236888', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-012', sociedad: 'EVOLVING TALENT MEXICO SA DE CV', pais: 'México', moneda: 'MXN', banco: 'BBVA', numeroCuenta: '0127523726 CLABE 012180001275237269', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-013', sociedad: 'EVOLVING BUSINESS OPPORTUNITIE SA NIC', pais: 'Nicaragua', moneda: 'NIO', banco: 'BAC', numeroCuenta: '370288649 NIO', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-014', sociedad: 'EVOLVING BUSINESS OPPORTUNITIE SA NIC', pais: 'Nicaragua', moneda: 'USD', banco: 'BAC', numeroCuenta: '370288714 DOL', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-015', sociedad: 'EVOLVING BUSINESS OPPORTUNITIES HONDURAS SA DE CV', pais: 'Honduras', moneda: 'HNL', banco: 'BANCO ATLANTIDA', numeroCuenta: '2010093398', tipoCuenta: 'MAESTRA LPS', estado: 'ACTIVA' },
  { id: 'CTA-016', sociedad: 'EVOLVING BUSINESS OPPORTUNITIES HONDURAS SA DE CV', pais: 'Honduras', moneda: 'USD', banco: 'BANCO ATLANTIDA', numeroCuenta: '2010093402', tipoCuenta: 'MAESTRA / OPERATIVA USD', estado: 'ACTIVA' },
  { id: 'CTA-017', sociedad: 'GRUPO STT EL SALVADOR, S.A. DE C.V.', pais: 'El Salvador', moneda: 'USD', banco: 'BAC', numeroCuenta: '200968808', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-018', sociedad: 'GRUPO STT PANAMA, S.A.', pais: 'Panamá', moneda: 'USD', banco: 'BAC INTERNATIONAL BANK, INC', numeroCuenta: '100305077', tipoCuenta: 'MAESTRA INTERNACIONAL', estado: 'ACTIVA', swift: 'BCINPAPA', ruc: '976655-1-531001', direccionBanco: 'AQUILINO DE GUARDIA STREET, URB. MARBELLA, PANAMÁ, REP. PANAMÁ.', direccionBeneficiario: 'Panamá Pacifico, Centro de Negocios. Edificio 3835, oficina 101, Panamá', bancoIntermediario: 'DEUTSCHE BANK TRUST COMPANY AMERICAS', swiftIntermediario: 'BKTRUS33', abaIntermediario: '021001033', direccionBancoIntermediario: '60 WALL STREET, NEW YORK, NY 10005' },
  { id: 'CTA-019', sociedad: 'HR SOLUTIONS PERU SAC', pais: 'Perú', moneda: 'PEN', banco: 'BBVA', numeroCuenta: '0011-0751-02-00222095 AHORROS SOLES', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-020', sociedad: 'HR SOLUTIONS PERU SAC', pais: 'Perú', moneda: 'USD', banco: 'BBVA', numeroCuenta: '0011-0751-02-00225604 AHORROS DOLARES', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-021', sociedad: 'JEMO Y ASOCIADOS SA DE CV MX', pais: 'México', moneda: 'MXN', banco: 'BBVA', numeroCuenta: '0120500011 / CLAVE 012180001205000110 PESOS', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-022', sociedad: 'JEMO Y ASOCIADOS SA DE CV MX', pais: 'México', moneda: 'USD', banco: 'BBVA', numeroCuenta: '0122809966 / CABLE 012180001228099661 DOLAR', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-023', sociedad: 'JEMO Y ASOCIADOS', pais: 'Costa Rica', moneda: 'USD', banco: 'BAC', numeroCuenta: 'CR32010200009529906954 USD', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-024', sociedad: 'JEMO Y ASOCIADOS', pais: 'Costa Rica', moneda: 'CRC', banco: 'BAC', numeroCuenta: 'CR22010200009529907037', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-025', sociedad: 'PAYROLL OUTSOURCING S.A', pais: 'Costa Rica', moneda: 'CRC', banco: 'LAFISE', numeroCuenta: 'CR37011400007355381471', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-026', sociedad: 'PAYROLL OUTSOURCING S.A', pais: 'Costa Rica', moneda: 'USD', banco: 'LAFISE', numeroCuenta: 'CR53011400007455378871 $', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-027', sociedad: 'PINAMEL S.A (ZF URUGUAY)', pais: 'Uruguay', moneda: 'UYU', banco: 'SANTANDER', numeroCuenta: '005101045503', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-028', sociedad: 'REFUERTE S.A (STT URUGUAY)', pais: 'Uruguay', moneda: 'UYU', banco: 'BTG PACTUAL', numeroCuenta: '3586961-2', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-029', sociedad: 'SERVICE TOTAL TALENT S.A.', pais: 'Costa Rica', moneda: 'CRC', banco: 'LAFISE', numeroCuenta: 'CR26011400007355459463', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-030', sociedad: 'SERVICE TOTAL TALENT S.A.', pais: 'Costa Rica', moneda: 'USD', banco: 'LAFISE', numeroCuenta: 'CR36011400007455460851', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-031', sociedad: 'SIH SERVICIOS INTEGRALES HUMANOS RD', pais: 'República Dominicana', moneda: 'DOP', banco: 'BANCO POPULAR', numeroCuenta: '832176689 RD$', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-032', sociedad: 'SIH SERVICIOS INTEGRALES HUMANOS RD', pais: 'República Dominicana', moneda: 'USD', banco: 'BANCO POPULAR', numeroCuenta: '832176721 $', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-033', sociedad: 'SOCIEDAD ANONIMA SUPPLYING TOTAL TALENT ARGENTINA', pais: 'Argentina', moneda: 'ARS', banco: 'BANCO MACRO', numeroCuenta: '348003408884100', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-034', sociedad: 'STT CAPITAL DE TRABAJO', pais: 'Costa Rica', moneda: 'USD', banco: 'BAC', numeroCuenta: 'CR09010200009340426986 US$', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-035', sociedad: 'STT CAPITAL DE TRABAJO', pais: 'Costa Rica', moneda: 'CRC', banco: 'BAC', numeroCuenta: 'CR62010200009340823635 ¢', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-036', sociedad: 'STT GROUP BRASIL', pais: 'Brasil', moneda: 'BRL', banco: 'BANCO ITAU', numeroCuenta: 'AGENCIA 7633 CC 0014983-1', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-037', sociedad: 'STT GROUP DE COSTA RICA S.A.', pais: 'Costa Rica', moneda: 'CRC', banco: 'LAFISE', numeroCuenta: 'CR36011400007455468611', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-038', sociedad: 'STT GROUP DE COSTA RICA S.A.', pais: 'Costa Rica', moneda: 'USD', banco: 'LAFISE', numeroCuenta: 'CR94011400007355166560', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-039', sociedad: 'STT GROUP DE HONDURAS S.A. DE CV', pais: 'Honduras', moneda: 'HNL', banco: 'BAC', numeroCuenta: '100372811', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-040', sociedad: 'STT GROUP DE HONDURAS S.A. DE CV', pais: 'Honduras', moneda: 'USD', banco: 'BAC', numeroCuenta: '100372871', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-041', sociedad: 'STT GROUP DE LA REP. DOMINICANA', pais: 'República Dominicana', moneda: 'DOP', banco: 'BANCO POPULAR', numeroCuenta: '761260678 / DO95BPDO0000000000761260678', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-042', sociedad: 'STT GROUP DE LA REP. DOMINICANA', pais: 'República Dominicana', moneda: 'USD', banco: 'BANCO POPULAR', numeroCuenta: '761261999 / DO27BPDO0000000000761261999', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-043', sociedad: 'STT GROUP OF PUERTO RICO CORPORATION', pais: 'Puerto Rico', moneda: 'USD', banco: '1FIRST BANK', numeroCuenta: '6509205846', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-044', sociedad: 'STT GROUP PARAGUAY S.A.', pais: 'Paraguay', moneda: 'PYG', banco: 'BANCO ATLAS', numeroCuenta: '1059548', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-045', sociedad: 'STT GROUP PARAGUAY S.A.', pais: 'Paraguay', moneda: 'USD', banco: 'BANCO ATLAS', numeroCuenta: '1059549', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-046', sociedad: 'STT HOLDINGS LIMITED - JAMAICA', pais: 'Jamaica', moneda: 'JMD', banco: 'JN BANK', numeroCuenta: '02000006419', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-047', sociedad: 'STT HOLDINGS LIMITED - JAMAICA', pais: 'Jamaica', moneda: 'USD', banco: 'JN BANK', numeroCuenta: '002094351444', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-048', sociedad: 'STT OF AMERICA LLC', pais: 'Estados Unidos', moneda: 'USD', banco: 'TERRABANK, N.A.', numeroCuenta: '1295119606', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA', aba: '066012333', direccionBanco: '3191 CORAL WAY PH-1 MIAMI, FLORIDA 33145', direccionBeneficiario: '50 MTS. OESTE DE LA ESTACION DE BOMBEROS DE TIBAS, SAN JOSE, COSTA RICA' },
  { id: 'CTA-049', sociedad: 'STT PERU', pais: 'Perú', moneda: 'USD', banco: 'INTERBANK', numeroCuenta: '291-3000849590', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-050', sociedad: 'STT PERU', pais: 'Perú', moneda: 'SOL', banco: 'INTERBANK', numeroCuenta: '637-300104244-8', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-051', sociedad: 'STT RECRUTAMENTO (Brasil)', pais: 'Brasil', moneda: 'BRL', banco: 'BANCO ITAU', numeroCuenta: 'AGENCIA 7633 CC 99784-1', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-052', sociedad: 'STT SURAMERICA', pais: 'Panamá', moneda: 'USD', banco: 'LAFISE', numeroCuenta: '115000207', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-053', sociedad: 'SUPPLYING TOTAL TALENT RD SRL', pais: 'República Dominicana', moneda: 'USD', banco: 'BANCO POPULAR', numeroCuenta: '811039338 $', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-054', sociedad: 'SUPPLYING TOTAL TALENT RD SRL', pais: 'República Dominicana', moneda: 'DOP', banco: 'BANCO POPULAR', numeroCuenta: '813400215', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-055', sociedad: 'SUPPLYING TOTAL TALENT SAS CO', pais: 'Colombia', moneda: 'COP', banco: 'BANCOLOMBIA', numeroCuenta: '201-000051-19', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-056', sociedad: 'TERCERIZACION DE SERVICIOS STTGROUP BOLIVIA', pais: 'Bolivia', moneda: 'BOB', banco: 'BISA', numeroCuenta: '5157980019', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-057', sociedad: 'TERCERIZACION DE SERVICIOS STTGROUP BOLIVIA', pais: 'Bolivia', moneda: 'USD', banco: 'BISA', numeroCuenta: '5157982011', tipoCuenta: 'MAESTRA || OPERATIVA', estado: 'ACTIVA' },
  { id: 'CTA-058', sociedad: 'TOTAL TALENT ECUADOR S.A.', pais: 'Ecuador', moneda: 'USD', banco: 'BANCO BOLIVARIANO', numeroCuenta: '5081101951', tipoCuenta: 'MAESTRA', estado: 'ACTIVA' },
  { id: 'CTA-059', sociedad: 'STT INTERNATIONAL HOLDINGS INC', pais: 'Panamá', moneda: 'USD', banco: 'BANCO GENERAL PANAMA', numeroCuenta: '03-01-01-124598-1', tipoCuenta: 'OPERATIVA INTERNACIONAL', estado: 'ACTIVA', swift: 'BGENPAPA' },
  { id: 'CTA-060', sociedad: 'STT OF AMERICA LLC', pais: 'Estados Unidos', moneda: 'USD', banco: 'BANK OF AMERICA', numeroCuenta: '4830 9281 7710', tipoCuenta: 'MAESTRA INTERNACIONAL', estado: 'ACTIVA', aba: '026009593' },
  { id: 'CTA-061', sociedad: 'STT GLOBAL SERVICES INC USA', pais: 'Estados Unidos', moneda: 'USD', banco: 'JPMORGAN CHASE BANK', numeroCuenta: '9182 3041 5502', tipoCuenta: 'OPERATIVA GLOBAL', estado: 'ACTIVA', swift: 'CHASUS33', aba: '021000021' }
];

export const findBestBankAccount = (
  accounts: CuentaBancariaMaestra[],
  billingCountry: string,
  currency: string
): CuentaBancariaMaestra | null => {
  const pool = accounts && accounts.length > 0 ? accounts : DEFAULT_CUENTAS_BANCARIAS;
  const activePool = pool.filter(c => !c.estado || c.estado === 'ACTIVA');
  if (activePool.length === 0) return null;

  const targetCountryNorm = normalizeCountry(billingCountry);
  const targetCurrNorm = (currency || 'USD').toUpperCase().trim();

  // Special aliases mapping
  const countryAliases: Record<string, string[]> = {
    'estados unidos': ['estados unidos', 'usa', 'eeuu', 'united states', 'us'],
    'mexico': ['mexico', 'méxico', 'mx'],
    'panama': ['panama', 'panamá', 'pa'],
    'peru': ['peru', 'perú', 'pe'],
    'republica dominicana': ['republica dominicana', 'república dominicana', 'rd', 'do'],
    'costa rica': ['costa rica', 'cr'],
    'colombia': ['colombia', 'co'],
    'brasil': ['brasil', 'brazil', 'br'],
    'chile': ['chile', 'cl'],
    'argentina': ['argentina', 'ar'],
    'ecuador': ['ecuador', 'ec'],
    'uruguay': ['uruguay', 'uy'],
    'paraguay': ['paraguay', 'py'],
    'bolivia': ['bolivia', 'bo'],
    'guatemala': ['guatemala', 'gt'],
    'el salvador': ['el salvador', 'sv'],
    'honduras': ['honduras', 'hn'],
    'nicaragua': ['nicaragua', 'ni'],
    'puerto rico': ['puerto rico', 'pr'],
    'jamaica': ['jamaica', 'jm']
  };

  const aliases = countryAliases[targetCountryNorm] || [targetCountryNorm];

  const countryAccounts = activePool.filter(c => {
    const cNorm = normalizeCountry(c.pais);
    return aliases.some(a => cNorm === a || cNorm.includes(a) || a.includes(cNorm));
  });

  if (countryAccounts.length > 0) {
    // 1. Exact country and exact currency match
    const exactCurr = countryAccounts.find(c => c.moneda.toUpperCase().trim() === targetCurrNorm);
    if (exactCurr) return exactCurr;

    // 2. Exact country USD match (international business default)
    const usdMatch = countryAccounts.find(c => c.moneda.toUpperCase().trim() === 'USD');
    if (usdMatch) return usdMatch;

    // 3. First available in country
    return countryAccounts[0];
  }

  // If no direct country account, pick International Hub (Terrabank USA / Bank of America / BAC Panama)
  const intlHub = activePool.find(c => 
    (normalizeCountry(c.pais) === 'estados unidos' || normalizeCountry(c.pais) === 'panama') &&
    c.moneda.toUpperCase().trim() === 'USD'
  );
  if (intlHub) return intlHub;

  return activePool[0];
};
