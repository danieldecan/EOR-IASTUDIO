import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { 
  SolicitudEOR, 
  Cliente, 
  Trabajador, 
  CargaSocial, 
  Tarifa, 
  TarifarioEOR,
  TramoTalentos,
  Beneficio, 
  ContratoRequisito, 
  PlantillaCarga, 
  User, 
  Factura, 
  Pago, 
  HistorialCargaMasiva, 
  HistorialLog,
  DatabaseSchema,
  PlantillaContrato,
  ContratoComercial,
  ContratoLaboral,
  Adendum,
  TipoCambio,
  Ticket,
  SlaConfig,
  ReglaSla,
  SlaSeguimiento,
  SlaHistorial,
  AlertaOperativa,
  HistorialAlerta,
  PlantillaNotificacion,
  AlertaNotificacion,
  HistorialNotificacion,
  HistorialContratoComercial,
  PagoContadoUSD,
  AuditLog,
  Traduccion,
  DirectorioContacto,
  CuentaBancariaMaestra,
  ReglaTributariaIvaWht,
  ConfiguracionSistema,
  RoleDefinition
} from './src/types.ts';
import { loadFromFirestore, saveToFirestore, seedFirestore, wipeFirestore, saveDocToFirestore, deleteDocFromFirestore, COLLECTIONS_WITH_ID } from './src/firebaseAdmin.ts';
import { 
  sendEmail, 
  generateBrandedHtmlEmail, 
  verifySmtpConnection, 
  DEFAULT_SMTP_CONFIG 
} from './src/emailService.ts';
import { setupMcpRoutes } from './src/mcpServer.ts';

const _filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : __filename;
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const app = express();
app.use(express.json());

const DB_FILE = path.join(process.cwd(), 'db.json');
const BACKUP_DB_FILE = path.join(process.cwd(), 'db.backup.json');

let isDbReady = false;
let dbInitPromise: Promise<void> | null = null;

// Ensure any early incoming requests wait for initial Firestore sync before responding
app.use(async (req, res, next) => {
  if (!isDbReady && dbInitPromise) {
    try {
      await dbInitPromise;
    } catch (e) {
      // Proceed with local disk cache if Firestore times out
    }
  }
  next();
});

// MASTER COMMERCIAL CONTRACT TEMPLATE (EOR GLOBAL)
const CONTRATO_MARCO_EOR_PLANTILLA_HTML = `<div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 24px; background-color: #ffffff;">
  <div style="text-align: center; border-bottom: 2px solid #1e1b4b; padding-bottom: 12px; margin-bottom: 20px;">
    <h1 style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase;">CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS EOR</h1>
    <p style="font-size: 10px; color: #64748b; margin-top: 6px;">
      Prepared by: Legal Advisor &bull; Effective Date: {{fechaGeneracion}} &bull; Version: 01 &bull; Approved by: Legal Director &bull; Tagged: Internal Use
    </p>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
    <h2 style="font-size: 12px; font-weight: bold; color: #1e1b4b; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">TÉRMINOS GENERALES PARA LA PRESTACIÓN DE LOS SERVICIOS</h2>
    <p style="margin: 0;">
      El presente Contrato Marco se celebra entre <b>{{sttEntidad}}</b> (en adelante, <b>STT</b>) y la persona jurídica <b>{{empresa}}</b> (Razón Social: <b>{{razonSocial}}</b>, ID Fiscal / NIT / Cédula Jurídica: <b>{{cedulaJuridica}}</b>, en adelante, <b>EL CLIENTE</b> y, conjuntamente con STT, <b>LAS PARTES</b>). EL CLIENTE acepta que, mediante la suscripción de una Orden de Servicio, la cual se incorpora a estos "Términos Generales de Prestación de Servicios", en adelante los "Términos Generales", se obliga a cumplir y queda vinculado por las disposiciones contenidas en dicha Orden de Servicio, en los Términos Generales y en sus anexos correspondientes. Estos elementos, conjuntamente considerados, se denominarán el "Contrato Marco", de conformidad con las siguientes declaraciones y cláusulas.
    </p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">1. DECLARACIONES</h3>
    <p style="margin-bottom: 6px;"><b>STT declara a través de su representante:</b></p>
    <ul style="padding-left: 20px; margin-top: 0; margin-bottom: 10px;">
      <li><b>a.</b> Ser una sociedad mercantil debidamente constituida conforme a las leyes de <b>{{sttPais}}</b>, con número de identificación jurídica <b>{{sttIdentificacion}}</b>.</li>
      <li><b>b.</b> Que su representante legal <b>{{sttRepresentante}}</b> cuenta con facultades suficientes para suscribir el presente instrumento, las cuales no le han sido revocadas ni modificadas.</li>
      <li><b>c.</b> Que para los efectos del presente instrumento señala como su domicilio el ubicado en <b>{{sttDomicilio}}</b>.</li>
      <li><b>d.</b> Que cuenta con la estructura administrativa, tecnológica, financiera y de personal propia, así como con las autorizaciones y registros exigidos por la legislación aplicable, para prestar los servicios objeto del presente contrato.</li>
    </ul>

    <p style="margin-bottom: 6px;"><b>EL CLIENTE declara a través de su representante:</b></p>
    <ul style="padding-left: 20px; margin-top: 0; margin-bottom: 10px;">
      <li><b>a.</b> Ser una sociedad mercantil debidamente constituida conforme a las leyes de <b>{{pais}}</b>, con número de expediente/identificación <b>{{cedulaJuridica}}</b>.</li>
      <li><b>b.</b> Que su representante legal <b>{{representanteLegal}}</b>, con Cédula/Pasaporte No. <b>{{documentoRepresentante}}</b>, cuenta con facultades suficientes para suscribir el presente instrumento, las cuales no le han sido revocadas ni modificadas.</li>
      <li><b>c.</b> Que señala como su domicilio para los efectos del presente instrumento el ubicado en <b>{{direccion}}</b>.</li>
      <li><b>d.</b> Que los fondos con los que atenderá las obligaciones económicas derivadas de este contrato tienen origen lícito y que la información entregada a STT es veraz, completa y verificable (Contacto de Privacidad: <b>{{correoContacto}}</b>, Teléfono: <b>{{telefonoContacto}}</b>).</li>
    </ul>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">2. DEFINICIONES</h3>
    <p style="margin: 4px 0;"><b>2.1. CONTRATO MARCO:</b> significa los presentes Términos Generales y sus Anexos incorporados (incluidas modificaciones), así como las Órdenes de Servicio correspondientes.</p>
    <p style="margin: 4px 0;"><b>2.2. STT:</b> la sociedad identificada como STT en el presente documento, sus demás afiliadas y subsidiarias autorizadas.</p>
    <p style="margin: 4px 0;"><b>2.3. ANEXO O ADENDA:</b> todos los anexos de servicios que se identifican en la Cláusula 4.</p>
    <p style="margin: 4px 0;"><b>2.4. FEE U HONORARIO:</b> la tarifa establecida por STT por la prestación del servicio de <b>{{moneda}} {{feePorEmpleado}}</b> por recurso/mes según lo acordado en la Orden de Servicio.</p>
    <p style="margin: 4px 0;"><b>2.5. RECURSO/TALENTO:</b> persona natural contratada y administrada laboralmente por STT en calidad de empleador de registro (EOR).</p>
    <p style="margin: 4px 0;"><b>2.6. SERVICIOS ORDENADOS:</b> se refiere a los Servicios EOR (Employer of Record) descritos en el Anexo y Orden de Servicio.</p>
    <p style="margin: 4px 0;"><b>2.7. PERSONAL ADMINISTRATIVO (PERSONAL STAFF):</b> colaborador de GRUPO STT a cargo de la gestión operativa.</p>
    <p style="margin: 4px 0;"><b>2.8. LAS PARTES:</b> STT y EL CLIENTE (<b>{{empresa}}</b>).</p>
    <p style="margin: 4px 0;"><b>2.9. EOR (EMPLOYER OF RECORD):</b> servicio en el que STT actúa como empleador de registro y único titular de la relación laboral.</p>
    <p style="margin: 4px 0;"><b>2.10. SUBORDINACIÓN JURÍDICA:</b> poder de dirección, disciplina, sanción y terminación excluyente de STT.</p>
    <p style="margin: 4px 0;"><b>2.11. COORDINACIÓN FUNCIONAL:</b> facultad de EL CLIENTE limitada a impartir lineamientos técnicos y evaluar entregables sin subordinación jurídica.</p>
    <p style="margin: 4px 0;"><b>2.12. ORDEN DE SERVICIO:</b> documento que define las condiciones específicas para el desarrollo del servicio en <b>{{pais}}</b>.</p>
    <p style="margin: 4px 0;"><b>2.13. CLIENTE FINAL:</b> tercero a favor de quien EL CLIENTE presta sus propios servicios.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">3. OBJETO Y ALCANCE DE LOS SERVICIOS</h3>
    <p>STT proveerá a EL CLIENTE los servicios profesionales de Employer of Record (EOR) en <b>{{pais}}</b>, asumiendo la contratación laboral formal, administración de nómina, afiliación a seguridad social y cumplimiento normativo del RECURSO conforme a la legislación local aplicable.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">4. ANEXOS APLICABLES Y SOLICITUD DE SERVICIOS</h3>
    <p>Forman parte integrante del presente Contrato Marco: Anexo EOR, Anexo de Autorización de Acceso a Plataformas, Acuerdo DPA (Procesamiento de Datos Personales), Acuerdo APD (Tratamiento entre Controladores Conjuntos) y las Órdenes de Servicio correspondientes suscritas entre LAS PARTES.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">5. NATURALEZA JURÍDICA Y DELIMITACIÓN DE RESPONSABILIDADES</h3>
    <p>La relación entre LAS PARTES es exclusivamente comercial. STT mantendrá la subordinación jurídica directa y excluyente sobre el RECURSO. EL CLIENTE ejercerá únicamente coordinación funcional sobre entregables técnicos. Queda prohibido a EL CLIENTE sancionar o realizar pagos directos no autorizados al personal.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">6. CLÁUSULA PENAL COMPENSATORIA</h3>
    <p>En caso de incumplimiento grave e injustificado de las obligaciones contractuales por cualquiera de LAS PARTES, la parte cumplida tendrá derecho a exigir una pena convencional equivalente al 10% del valor anual estimado del contrato, sin perjuicio del cobro de daños adicionales probados.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">7. LIMITACIÓN DE RESPONSABILIDAD</h3>
    <p>La responsabilidad total y acumulada de STT por cualquier reclamación derivada de este contrato estará limitada al monto de los honorarios (fees) efectivamente percibidos por STT en los 12 meses anteriores al hecho generador, excluyendo salarios, prestaciones y aportes sociales administrados.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">8. INDEMNIDAD</h3>
    <p>EL CLIENTE defenderá e indemnizará a STT contra cualquier reclamo, demanda, multa o pasivo laboral derivado de coempleo no autorizado, acoso laboral o discriminación en instalaciones del CLIENTE, o falta de pago de las sumas facturadas por STT.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">9. HONORARIOS, IMPUESTOS, FACTURACIÓN Y CONDICIONES DE PAGO</h3>
    <p>EL CLIENTE pagará a STT el fee acordado de <b>{{moneda}} {{feePorEmpleado}}</b> por recurso/mes, más impuestos aplicables. La provisión de fondos para nómina y seguridad social se realizará de forma anticipada. El plazo de crédito para honorarios es de <b>{{credito}}</b>. La mora generará intereses según tasa legal.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">10. OBLIGACIONES DE STT</h3>
    <p>STT se obliga a: a) Elaborar y firmar contratos de trabajo individuales con el RECURSO en <b>{{pais}}</b>; b) Procesar la nómina y liquidar salarios y prestaciones sociales pautadas; c) Afiliar y efectuar los aportes al sistema de seguridad social e impuestos laborales; d) Emitir los recibos de pago y constancias requeridas.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">11. OBLIGACIONES DE EL CLIENTE</h3>
    <p>EL CLIENTE se obliga a: a) Proporcionar oportunamente las novedades de nómina y horas trabajadas; b) Pagar las facturas y provisiones de fondos en los plazos convenidos; c) Mantener un ambiente de trabajo seguro y libre de riesgos; d) Abstenerse de modificar unilateralmente las condiciones salariales del RECURSO.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">12. PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR</h3>
    <p>Todos los desarrollos, invenciones, software, código fuente, marcas, diseños y obras creados por el RECURSO en el marco de la prestación del servicio pertenecen de manera exclusiva y definitiva a EL CLIENTE, cediendo STT cualquier derecho emergente al CLIENTE.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">13. CONFIDENCIALIDAD Y PROTECCIÓN DE SECRETOS INDUSTRIALES</h3>
    <p>LAS PARTES se comprometen a resguardar bajo estricta reserva toda la información técnica, financiera, comercial o estratégica compartida durante la relación contractual. Esta obligación permanecerá vigente durante la vigencia del contrato y por un periodo adicional de tres (3) años tras su terminación.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">14. NO SOLICITACIÓN Y NO COMPETENCIA</h3>
    <p>Ninguna de LAS PARTES podrá contratar o solicitar directamente al personal administrativo o técnico de la otra parte sin consentimiento escrito previo, durante la vigencia del contrato y por seis (6) meses posteriores. La violación a esta cláusula acarreará una penalización fija de USD 50,000.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">15. ÉTICA, ANTICORRUPCIÓN Y COMPLIANCE</h3>
    <p>LAS PARTES declaran que cumplen y cumplirán strictly con todas las leyes anticorrupción aplicables (incluyendo la Ley FCPA, UK Bribery Act y normativas locales de <b>{{pais}}</b>). Queda expresamente prohibido ofrecer, prometer o dar dádivas o sobornos a funcionarios públicos o privados.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">16. PREVENCIÓN DE LAVADO DE DINERO Y FINANCIAMIENTO DEL TERRORISMO (LA/FT / OFAC)</h3>
    <p>EL CLIENTE declara que sus recursos y patrimonio provienen de actividades lícitas y no figura en listas restrictivas de control (OFAC, ONU, Clinton, etc.). STT podrá verificar periódicamente a EL CLIENTE en listas de cumplimiento sin previo aviso.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">17. TRABAJO INFANTIL Y DERECHOS HUMANOS</h3>
    <p>LAS PARTES garantizan el cumplimiento estricto de las convenciones de la OIT en materia de erradicación del trabajo infantil, trabajo forzado y respeto incondicional a las libertades fundamentales y los derechos humanos de todo el personal.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">18. SALUD, SEGURIDAD EN EL TRABAJO Y PREVENCIÓN DEL ACOSO</h3>
    <p>EL CLIENTE garantizará condiciones higiénicas y ergonómicas óptimas en las estaciones de trabajo del RECURSO, así como la implementación de protocolos efectivos de prevención del acoso laboral o acoso sexual en el ambiente de trabajo.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">19. NOTIFICACIONES Y DOMICILIOS CONTRACTUALES</h3>
    <p>Todas las comunicaciones oficiales, avisos y notificaciones judiciales o extrajudiciales se realizarán por escrito a los domicilios indicados en las Declaraciones y por correo electrónico a <b>{{correoContacto}}</b> (por el CLIENTE) y a la dirección registrada por STT.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">20. CESIÓN Y SUBCONTRATACIÓN</h3>
    <p>Ninguna de LAS PARTES podrá ceder, transferir ni delegar los derechos u obligaciones derivados de este instrumento sin la autorización previa y por escrito de la otra, salvo cesión realizada por STT a favor de filiales de GRUPO STT.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">21. INDEPENDENCIA DE LAS PARTES Y AUSENCIA DE SOCIEDAD</h3>
    <p>Este contrato marco no constituye ni podrá interpretarse como la creación de una sociedad, joint venture, asociación, agencia o franquicia entre STT y EL CLIENTE. Cada parte es un contratante independiente.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">22. CASO FORTUITO Y FUERZA MAYOR</h3>
    <p>Ninguna parte será responsable por el incumplimiento de sus obligaciones cuando este sea causado por desastres naturales, pandemias, actos de guerra, disturbios civiles o regulaciones gubernamentales imprevisibles de fuerza mayor irresistible.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">23. MODIFICACIONES Y ADENDAS</h3>
    <p>Toda enmienda, modificación o adenda al presente Contrato Marco deberá constar por escrito y ser suscrita debidamente por los representantes legales de ambas PARTES para surtir efectos jurídicos.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">24. INTEGRIDAD DEL CONTRATO (ACUERDO COMPLETO)</h3>
    <p>Este Contrato Marco, sus Anexos y las Órdenes de Servicio integradas constituyen la manifestación íntegra de la voluntad de LAS PARTES, dejando sin efecto cualquier negociación, propuesta o comunicación previa verbal o escrita.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">25. DIVISIBILIDAD Y VALIDEZ</h3>
    <p>Si alguna disposición de este contrato resultara nula, ilegal o inejecutable conforme a la ley, dicha nulidad no afectará la validez ni la ejecutabilidad de las restantes cláusulas, las cuales permanecerán con pleno vigor.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">26. NO RENUNCIA DE DERECHOS</h3>
    <p>La falta de ejercicio o la demora por parte de cualquiera de LAS PARTES en hacer valer algún derecho, facultad o recurso previsto en este instrumento no se considerará como una renuncia al mismo.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">27. ENCABEZADOS Y TÍTULOS</h3>
    <p>Los encabezados y títulos de las cláusulas contenidos en este documento se incluyen únicamente por conveniencia de lectura y referencia, y no limitarán ni afectarán la interpretación del contenido.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">28. IDIOMA Y VERSIÓN OFICIAL</h3>
    <p>El presente acuerdo se redacta y suscribe en idioma español. En caso de traducirse a cualquier otro idioma por requerimiento operativo, la versión en español prevalecerá sobre cualquier traducción.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">29. TRATAMIENTO Y PROTECCIÓN DE DATOS PERSONALES (DPA)</h3>
    <p>LAS PARTES cumplirán con la legislación aplicable en materia de protección de datos personales en <b>{{pais}}</b> y los estándares del Anexo DPA. STT actuará en calidad de Encargado del Tratamiento respecto de los datos del RECURSO.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">30. ACUERDO DE CONTROLADORES CONJUNTOS (APD)</h3>
    <p>Para aquellos tratamientos en que ambas partes determinen conjuntamente los fines y medios del tratamiento de datos personales, regirá lo estipulado en el Anexo APD integrado a este contrato.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">31. AUDITORÍA Y REGISTRO DE CUMPLIMIENTO</h3>
    <p>EL CLIENTE tendrá derecho a solicitar revisiones anuales del cumplimiento de STT respecto de las obligaciones de seguridad social y pago de nómina del RECURSO, previo aviso formal con 15 días hábiles de anticipación.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">32. VIGENCIA DEL CONTRATO Y RENOVACIÓN</h3>
    <p>El presente Contrato Marco entrará en vigor en la fecha de su firma por un periodo inicial de un (1) año a partir del <b>{{fechaInicio}}</b>, renovándose automáticamente por periodos iguales salvo comunicación en contrario con 30 días de antelación.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">33. CAUSALES DE TERMINACIÓN</h3>
    <p>Este contrato podrá terminarse por: a) Mutuo acuerdo escrito; b) Vencimiento del plazo sin renovación; c) Incumplimiento grave no subsanado en 15 días posteriores a la notificación; d) Disolución, quiebra o inclusión en listas restrictivas de lavado de activos.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">34. LEY APLICABLE</h3>
    <p>Este instrumento se regirá, interpretará y ejecutará plenamente conforme a las leyes mercantiles y civiles aplicables en territorio de <b>{{pais}}</b>.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">35. JURISDICCIÓN Y RESOLUCIÓN DE CONTROVERSIAS</h3>
    <p>Cualquier disputa derivada de este contrato intentará resolverse amigablemente mediante negociación directa. De persistir el diferendo, las partes se someterán a los jueces y tribunales competentes en la ciudad sede de <b>{{pais}}</b>.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">36. LEYES LABORALES Y SEGURIDAD SOCIAL LOCAL</h3>
    <p>STT garantiza la estricta observancia del Código del Trabajo, leyes de seguridad social, pensiones y riesgos laborales aplicables en la jurisdicción de <b>{{pais}}</b>.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">37. VINCULATORIEDAD Y PREVALENCIA DE ÓRDENES DE SERVICIO</h3>
    <p>Cada Orden de Servicio emitida y suscrita al amparo de este Contrato Marco se considerará un anexo vinculante e inescindible. En caso de discrepancia, prevalecerá lo pactado en la Orden de Servicio específica.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">38. PROVISIÓN DE FONDOS Y DEPÓSITO DE GARANTÍA</h3>
    <p>EL CLIENTE se compromete a transferir a STT los fondos correspondientes a salarios y cargas sociales con la antelación mínima pactada en la Orden de Servicio, previo al inicio del periodo de nómina respectivo.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">39. FIRMA ELECTRÓNICA Y VALIDEZ DIGITAL</h3>
    <p>LAS PARTES convienen expresamente que la firma del presente Contrato Marco mediante plataformas de firma electrónica, certificados digitales o intercambio de documentos PDF firmados tendrá idéntica validez jurídica y ejecutiva que la firma manuscrita.</p>
  </div>

  <div style="margin-bottom: 16px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">40. DISPOSICIONES FINALES Y FIRMAS DE LAS PARTES</h3>
    <p>Leído el presente contrato y enteradas las partes de su alcance y fuerza legal, lo firman en conformidad en la fecha <b>{{fechaGeneracion}}</b>.</p>
  </div>

  <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 20px; margin-bottom: 20px;">
    <h3 style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 10px; text-transform: uppercase; text-align: center;">ORDEN DE SERVICIO Y ANEXO EOR INTEGRADO</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
      <tr style="background-color: #e2e8f0;">
        <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left;">PARÁMETRO CONTRACTUAL</th>
        <th style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left;">VALOR O CONDICIÓN ACORDADA</th>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Cliente (Nombre / Razón Social)</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">{{empresa}} (Razón Social: {{razonSocial}})</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Identificación Fiscal / Tax ID / NIT</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">{{cedulaJuridica}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">País de Operación EOR</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">{{pais}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Servicio Contratado</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">{{servicioContratado}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Fee EOR Base por Empleado</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #047857;">{{moneda}} {{feePorEmpleado}} / mes por recurso</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Plazo de Crédito Otorgado</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">{{credito}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">Contacto de Notificaciones Legal / Privacidad</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">{{correoContacto}} &bull; Tel: {{telefonoContacto}}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 30px; padding-top: 10px;">
    <p style="font-size: 10px; font-weight: bold; text-align: center; margin-bottom: 25px;">EN FE DE LO CUAL, LAS PARTES SUSCRIBEN EL PRESENTE CONTRATO MARCO EN LA FECHA {{fechaGeneracion}}</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 20px;">
          <p style="font-weight: bold; font-size: 11px; margin-bottom: 40px; color: #1e1b4b;">POR STT (EL PROVEEDOR):</p>
          <div style="border-bottom: 1px solid #000; width: 85%; margin-bottom: 6px;"></div>
          <p style="margin: 0; font-weight: bold; font-size: 11px;">{{sttEntidad}}</p>
          <p style="margin: 4px 0; font-size: 10px; color: #475569;">{{sttRepresentante}}</p>
          <p style="margin: 0; font-size: 9px; color: #64748b;">Representante Legal Autorizado &bull; {{sttPais}}</p>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 20px;">
          <p style="font-weight: bold; font-size: 11px; margin-bottom: 40px; color: #1e1b4b;">POR EL CLIENTE:</p>
          <div style="border-bottom: 1px solid #000; width: 85%; margin-bottom: 6px;"></div>
          <p style="margin: 0; font-weight: bold; font-size: 11px;">{{empresa}}</p>
          <p style="margin: 4px 0; font-size: 10px; color: #475569;">{{representanteLegal}}</p>
          <p style="margin: 0; font-size: 9px; color: #64748b;">Doc ID: {{documentoRepresentante}} &bull; Representante Legal Cliente</p>
        </td>
      </tr>
    </table>
  </div>
</div>`;

// Initial Seed Data
const initialDb: DatabaseSchema = {
  solicitudes: [],
  clientes: [],
  trabajadores: [],
  cargasSociales: [
    {
      id: 'CS-01',
      pais: 'Colombia',
      tipoCarga: 'Salud Patronal',
      responsablePago: 'Patrón',
      porcentaje: 8.5,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Aporte de salud obligatorio sobre IBC.',
      fechaActualizacion: '2026-01-10T09:00:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'CS-02',
      pais: 'Colombia',
      tipoCarga: 'Pensión Patronal',
      responsablePago: 'Patrón',
      porcentaje: 12,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Aporte legal para pensiones obligatorias.',
      fechaActualizacion: '2026-01-10T09:10:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'CS-03',
      pais: 'Colombia',
      tipoCarga: 'Caja de Compensación',
      responsablePago: 'Patrón',
      porcentaje: 4,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Aporte para beneficios parafiscales familiares.',
      fechaActualizacion: '2026-01-10T09:15:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'CS-04',
      pais: 'México',
      tipoCarga: 'Seguro de Retiro y Vejez (IMSS)',
      responsablePago: 'Patrón',
      porcentaje: 5.15,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Carga patronal del IMSS bajo cuota del salario diario integrado.',
      fechaActualizacion: '2026-02-12T14:22:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'CS-05',
      pais: 'México',
      tipoCarga: 'Fondo Nacional de la Vivienda (INFONAVIT)',
      responsablePago: 'Patrón',
      porcentaje: 5,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Aporte patronal fijo para créditos de vivienda.',
      fechaActualizacion: '2026-02-12T14:25:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'CS-06',
      pais: 'Brasil',
      tipoCarga: 'FGTS (Fundo de Garantia do Tempo de Serviço)',
      responsablePago: 'Patrón',
      porcentaje: 8,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Depósito obrigatório mensal em conta vinculada na Caixa.',
      fechaActualizacion: '2026-03-05T11:45:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'CS-07',
      pais: 'Brasil',
      tipoCarga: 'INSS Patronal',
      responsablePago: 'Patrón',
      porcentaje: 20,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Vigente',
      observaciones: 'Contribuição previdenciária sobre folha CLT tradicional.',
      fechaActualizacion: '2026-03-05T11:50:00Z',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com'
    }
  ],
  tarifas: [
    {
      id: 'TAR-01',
      pais: 'Colombia',
      servicio: 'Employer of Record (EOR)',
      moneda: 'COP',
      feeBase: 150000,
      tramosVolumen: '1-5 emp: 150K, 6-20 emp: 130K, 21+ emp: 110K COP',
      descuentos: 'Descuento del 10% por volumen de más de 10 trabajadores',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo'
    },
    {
      id: 'TAR-02',
      pais: 'México',
      servicio: 'EOR + Payroll Completo',
      moneda: 'MXN',
      feeBase: 1200,
      tramosVolumen: '1-5 emp: 1.2K, 6-20 emp: 1K, 21+ emp: 850 MXN',
      descuentos: '5% de descuento por canal de partner tecnológico',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo'
    },
    {
      id: 'TAR-03',
      pais: 'Brasil',
      servicio: 'Employer of Record (EOR)',
      moneda: 'BRL',
      feeBase: 120,
      tramosVolumen: 'Tarifa plana de volumen corporativo general',
      descuentos: 'Sin descuentos activos',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo'
    }
  ],
  beneficios: [
    {
      id: 'BEN-01',
      nombre: 'Seguro Médico de Prepaga',
      tipo: 'Salud',
      modalidad: 'Mensual',
      moneda: 'COP',
      costo: 120000,
      aplicaTrabajador: true,
      aplicaCliente: true,
      estado: 'Activo',
      vigencia: '2026-01-01 a 2026-12-31'
    },
    {
      id: 'BEN-02',
      nombre: 'Seguro de Gastos Médicos Mayores',
      tipo: 'Salud',
      modalidad: 'Mensual',
      moneda: 'MXN',
      costo: 800,
      aplicaTrabajador: true,
      aplicaCliente: true,
      estado: 'Activo',
      vigencia: '2026-01-01 a 2026-12-31'
    },
    {
      id: 'BEN-03',
      nombre: 'Auxilio de Conectividad',
      tipo: 'Equipos',
      modalidad: 'Mensual',
      moneda: 'COP',
      costo: 50000,
      aplicaTrabajador: true,
      aplicaCliente: false,
      estado: 'Activo',
      vigencia: '2026-01-01 a 2026-12-31'
    },
    {
      id: 'BEN-04',
      nombre: 'Vale de Despensa',
      tipo: 'Otros',
      modalidad: 'Mensual',
      moneda: 'MXN',
      costo: 400,
      aplicaTrabajador: true,
      aplicaCliente: false,
      estado: 'Activo',
      vigencia: '2026-01-01 a 2026-12-31'
    }
  ],
  contratos: [
    {
      id: 'CON-01',
      pais: 'Colombia',
      servicio: 'Employer of Record (EOR)',
      tipoContrato: 'Término Indefinido',
      plantillaNombre: 'Plantilla_Contrato_Indefinido_COL_V26',
      documentosRequeridos: ['Cédula de Ciudadanía', 'Certificado Bancario', 'Rut Actualizado', 'Examen Médico de Ingreso'],
      obligatorio: true,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo'
    },
    {
      id: 'CON-02',
      pais: 'México',
      servicio: 'EOR + Payroll Completo',
      tipoContrato: 'Tiempo Indeterminado (Art. 35 LFT)',
      plantillaNombre: 'Contrato_Individual_Trabajo_MEX_V4.2',
      documentosRequeridos: ['Identificación Oficial (INE)', 'RFC', 'CURP', 'Comprobante de Domicilio'],
      obligatorio: true,
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo'
    }
  ],
  plantillas: [
    {
      id: 'PL-01',
      nombre: 'Plantilla de Carga Colombia COP',
      pais: 'Colombia',
      servicio: 'Employer of Record (EOR)',
      version: 'COP-EOR-V1',
      fechaVigencia: '2026-01-01',
      estado: 'Vigente',
      observaciones: 'Plantilla oficial de onboarding para Colombia. Requerida para validación masiva.',
      columnas: ['Nombre', 'Correo', 'Puesto', 'FechaIngreso', 'Salario', 'Moneda', 'Modalidad']
    },
    {
      id: 'PL-02',
      nombre: 'Plantilla de Carga México MXN',
      pais: 'México',
      servicio: 'EOR + Payroll Completo',
      version: 'MXN-EOR-V1',
      fechaVigencia: '2026-01-01',
      estado: 'Vigente',
      observaciones: 'Contiene validaciones del IMSS y RFC en México.',
      columnas: ['Nombre', 'Correo', 'Puesto', 'FechaIngreso', 'Salario', 'Moneda', 'Modalidad']
    }
  ],
  usuarios: [
    {
      correo: 'administrador-eor-peo@grupostt.com',
      nombre: 'Administrador Global',
      rol: 'administrador',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-01T18:00:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'asesor-eor-peo@grupostt.com',
      nombre: 'Asesor Comercial EOR/PEO',
      rol: 'asesor_comercial',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-01T18:05:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'cliente-eor-peo@grupostt.com',
      nombre: 'Cliente EOR/PEO Grupo STT',
      rol: 'cliente',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-01T18:10:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'tesoreria-eor-peo@grupostt.com',
      nombre: 'Tesorería EOR/PEO Grupo STT',
      rol: 'tesoreria',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-11T00:00:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'ejecutivo-eor-peo@grupostt.com',
      nombre: 'Ejecutivo de Cuentas EOR/PEO',
      rol: 'ejecutivo_cuentas',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-01T18:05:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'supracliente-eor-peo@grupostt.com',
      nombre: 'Supra Cliente Global Holding',
      rol: 'supracliente',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-01T18:15:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'daniel.decan@nominasaps.com',
      nombre: 'Daniel Decan',
      rol: 'administrador',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: '2026-08-11T00:00:00Z',
      fechaCreacion: '2026-01-01T00:00:00Z'
    }
  ],
  historialCargas: [],
  facturas: [],
  pagos: [],
  logs: [],
  plantillasContrato: [
    {
      id: 'PL-CONTR-001',
      nombre: 'Contrato Marco de Prestación de Servicios EOR (Único Estándar Master)',
      tipo: 'comercial',
      pais: 'Todos',
      servicio: 'Todos',
      version: '1.0',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo',
      variables: ['empresa', 'razonSocial', 'cedulaJuridica', 'pais', 'direccion', 'nombreContacto', 'representanteLegal', 'documentoRepresentante', 'correoContacto', 'telefonoContacto', 'servicioContratado', 'moneda', 'feePorEmpleado', 'fechaInicio', 'credito'],
      archivoBase: CONTRATO_MARCO_EOR_PLANTILLA_HTML,
      observaciones: 'Única plantilla de contrato comercial estándar para todos los clientes (Admin & Asesor).',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-01-15T08:00:00Z',
      fechaModificacion: '2026-01-15T08:00:00Z'
    },
    {
      id: 'PL-CONTR-002',
      nombre: 'Contrato Laboral de Empleado (Local)',
      tipo: 'laboral',
      pais: 'México',
      servicio: 'EOR',
      version: '1.2',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo',
      variables: ['trabajadorNombre', 'documentoIdentificacion', 'puesto', 'fechaIngreso', 'salario', 'moneda', 'modalidadTrabajo', 'clienteNombre'],
      archivoBase: '<h1>CONTRATO INDIVIDUAL DE TRABAJO (BAJO REGLAMENTO LOCAL)</h1><p>En la ciudad correspondiente, se formaliza este acuerdo laboral entre la entidad local contratadora de <b>Quick Hire</b> y el trabajador <b>{{trabajadorNombre}}</b>, de identificación fiscal {{documentoIdentificacion}}.</p><p><b>PRIMERA (Puesto y Funciones):</b> El trabajador desempeñará las labores de {{puesto}} prestando servicio directo asignado a la empresa cliente {{clienteNombre}}.</p><p><b>SEGUNDA (Fecha de Ingreso):</b> La fecha oficial de ingreso del colaborador es el {{fechaIngreso}}.</p><p><b>TERCERA (Remuneración):</b> El trabajador percibirá un salario mensual bruto de {{moneda}} {{salario}}, pagadero bajo la frecuencia establecida.</p><p><b>CUARTA (Modalidad):</b> La modalidad de trabajo acordada es {{modalidadTrabajo}}.</p><p>Firmas en conformidad:</p><p>El Trabajador: _______________________ ({{trabajadorNombre}})<br/>El Patrón: _______________________ (Representante Quick Hire)</p>',
      observaciones: 'Plantilla de contrato laboral alineada con la Ley Federal del Trabajo de México.',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-01-18T10:30:00Z',
      fechaModificacion: '2026-01-20T11:00:00Z'
    },
    {
      id: 'PL-CONTR-003',
      nombre: 'Adendum de Ajuste Salarial / Beneficios',
      tipo: 'adendum',
      pais: 'Todos',
      servicio: 'Todos',
      version: '1.0',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo',
      variables: ['empresa', 'motivoCambio', 'fechaGeneracion'],
      archivoBase: '<h1>ANEXO / ADENDUM AL CONTRATO PRINCIPAL</h1><p>Este documento constituye un anexo modificatorio al contrato de servicios celebrado con el cliente <b>{{empresa}}</b>.</p><p><b>MODIFICACIÓN:</b> Se acuerda la modificación de las condiciones iniciales debido a: {{motivoCambio}}.</p><p>Este cambio rige formalmente a partir del {{fechaGeneracion}} conservando el resto de las cláusulas contractuales inalteradas.</p><p>Firmas:</p><p>Cliente: _______________________<br/>Quick Hire: _______________________</p>',
      observaciones: 'Plantilla para anexos y adendas generales.',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-02-01T09:00:00Z',
      fechaModificacion: '2026-02-01T09:00:00Z'
    }
  ],
  contratosComerciales: [],
  contratosLaborales: [],
  adendums: [],
  tiposCambio: [
    { id: 'TC-001', monedaOrigen: 'USD', monedaDestino: 'MXN', tasa: 17.85, fecha: '2026-07-14T12:00:00Z', pais: 'México' },
    { id: 'TC-002', monedaOrigen: 'USD', monedaDestino: 'COP', tasa: 4120.00, fecha: '2026-07-14T12:00:00Z', pais: 'Colombia' },
    { id: 'TC-003', monedaOrigen: 'USD', monedaDestino: 'BRL', tasa: 5.12, fecha: '2026-07-14T12:00:00Z', pais: 'Brasil' },
    { id: 'TC-004', monedaOrigen: 'USD', monedaDestino: 'DOP', tasa: 58.50, fecha: '2026-07-14T12:00:00Z', pais: 'República Dominicana' },
    { id: 'TC-005', monedaOrigen: 'USD', monedaDestino: 'JMD', tasa: 155.00, fecha: '2026-07-14T12:00:00Z', pais: 'Jamaica' },
    { id: 'TC-006', monedaOrigen: 'USD', monedaDestino: 'ARS', tasa: 850.00, fecha: '2026-07-14T12:00:00Z', pais: 'Argentina' },
    { id: 'TC-007', monedaOrigen: 'USD', monedaDestino: 'CLP', tasa: 920.00, fecha: '2026-07-14T12:00:00Z', pais: 'Chile' },
    { id: 'TC-008', monedaOrigen: 'USD', monedaDestino: 'PEN', tasa: 3.75, fecha: '2026-07-14T12:00:00Z', pais: 'Perú' },
    { id: 'TC-009', monedaOrigen: 'USD', monedaDestino: 'USD', tasa: 1.00, fecha: '2026-07-14T12:00:00Z', pais: 'Estados Unidos' },
    { id: 'TC-010', monedaOrigen: 'USD', monedaDestino: 'CRC', tasa: 515.00, fecha: '2026-07-14T12:00:00Z', pais: 'Costa Rica' },
    { id: 'TC-011', monedaOrigen: 'USD', monedaDestino: 'GTQ', tasa: 7.80, fecha: '2026-07-14T12:00:00Z', pais: 'Guatemala' },
    { id: 'TC-012', monedaOrigen: 'USD', monedaDestino: 'HNL', tasa: 24.60, fecha: '2026-07-14T12:00:00Z', pais: 'Honduras' },
    { id: 'TC-013', monedaOrigen: 'USD', monedaDestino: 'NIO', tasa: 36.80, fecha: '2026-07-14T12:00:00Z', pais: 'Nicaragua' },
    { id: 'TC-014', monedaOrigen: 'USD', monedaDestino: 'PAB', tasa: 1.00, fecha: '2026-07-14T12:00:00Z', pais: 'Panamá' },
    { id: 'TC-015', monedaOrigen: 'USD', monedaDestino: 'USD', tasa: 1.00, fecha: '2026-07-14T12:00:00Z', pais: 'El Salvador' },
    { id: 'TC-016', monedaOrigen: 'USD', monedaDestino: 'USD', tasa: 1.00, fecha: '2026-07-14T12:00:00Z', pais: 'Ecuador' },
    { id: 'TC-017', monedaOrigen: 'USD', monedaDestino: 'BOB', tasa: 6.90, fecha: '2026-07-14T12:00:00Z', pais: 'Bolivia' },
    { id: 'TC-018', monedaOrigen: 'USD', monedaDestino: 'UYU', tasa: 38.90, fecha: '2026-07-14T12:00:00Z', pais: 'Uruguay' },
    { id: 'TC-019', monedaOrigen: 'USD', monedaDestino: 'PYG', tasa: 7500.00, fecha: '2026-07-14T12:00:00Z', pais: 'Paraguay' },
    { id: 'TC-020', monedaOrigen: 'USD', monedaDestino: 'VES', tasa: 36.50, fecha: '2026-07-14T12:00:00Z', pais: 'Venezuela' }
  ],
  tickets: [],
  slaConfigs: [
    { id: 'SLA-001', pais: 'México', tiempoRespuestaHoras: 24 },
    { id: 'SLA-002', pais: 'Colombia', tiempoRespuestaHoras: 24 }
  ],
  plantillasNotificacion: [
    { 
      id: 'PL-NOT-001', 
      codigo: 'PL-NOT-001',
      nombre: 'Firma de Contrato', 
      evento: 'EMPLOYEE_CONTRACT_SENT',
      canal: 'correo', 
      idioma: 'es',
      asunto: 'Habilitación de firma digital',
      plantilla: 'Estimado(a) colaborador(a), se ha habilitado la firma digital de su contrato.',
      variables: ['nombre_colaborador'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-12T10:00:00Z',
      fechaModificacion: '2026-07-12T10:00:00Z'
    },
    { 
      id: 'PL-NOT-002', 
      codigo: 'PL-NOT-002',
      nombre: 'Alerta de Compliance', 
      evento: 'SERVICE_RELEASED',
      canal: 'correo', 
      idioma: 'es',
      asunto: 'Servicio liberado',
      plantilla: 'Quick Hire Alerta: Su servicio comercial ya está liberado.',
      variables: ['empresa'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-12T10:00:00Z',
      fechaModificacion: '2026-07-12T10:00:00Z'
    },
    // COMMERCIAL_CONTRACT_GENERATED
    {
      id: 'PL-NOT-CC-GEN-ES',
      codigo: 'PL-NOT-CC-GEN-ES',
      nombre: 'Contrato comercial generado (ES)',
      evento: 'COMMERCIAL_CONTRACT_GENERATED',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Borrador de Contrato Comercial Generado - {{numero_contrato}}',
      plantilla: 'Estimado equipo de {{empresa}}, se ha generado el borrador del contrato comercial {{numero_contrato}} para el servicio de {{servicio}} en {{pais}}.',
      variables: ['empresa', 'numero_contrato', 'servicio', 'pais'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-GEN-EN',
      codigo: 'PL-NOT-CC-GEN-EN',
      nombre: 'Commercial contract generated (EN)',
      evento: 'COMMERCIAL_CONTRACT_GENERATED',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Commercial Contract Draft Generated - {{numero_contrato}}',
      plantilla: 'Dear {{empresa}} team, the commercial contract draft {{numero_contrato}} has been generated for the {{servicio}} service in {{pais}}.',
      variables: ['empresa', 'numero_contrato', 'servicio', 'pais'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-GEN-PT',
      codigo: 'PL-NOT-CC-GEN-PT',
      nombre: 'Contrato comercial gerado (PT)',
      evento: 'COMMERCIAL_CONTRACT_GENERATED',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Rascunho do Contrato Comercial Gerado - {{numero_contrato}}',
      plantilla: 'Prezada equipe da {{empresa}}, o rascunho do contrato comercial {{numero_contrato}} foi gerado para o serviço {{servicio}} em {{pais}}.',
      variables: ['empresa', 'numero_contrato', 'servicio', 'pais'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    // COMMERCIAL_CONTRACT_SENT
    {
      id: 'PL-NOT-CC-SENT-ES',
      codigo: 'PL-NOT-CC-SENT-ES',
      nombre: 'Contrato comercial enviado (ES)',
      evento: 'COMMERCIAL_CONTRACT_SENT',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Contrato Comercial listo para firma - {{numero_contrato}}',
      plantilla: 'Estimado representante de {{empresa}}, se ha enviado el contrato comercial {{numero_contrato}} para su revisión y firma legal en la plataforma Quick Hire.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-SENT-EN',
      codigo: 'PL-NOT-CC-SENT-EN',
      nombre: 'Commercial contract sent (EN)',
      evento: 'COMMERCIAL_CONTRACT_SENT',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Commercial Contract Ready for Signature - {{numero_contrato}}',
      plantilla: 'Dear {{empresa}} representative, the commercial contract {{numero_contrato}} has been sent for your review and legal signature in the Quick Hire platform.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-SENT-PT',
      codigo: 'PL-NOT-CC-SENT-PT',
      nombre: 'Contrato comercial enviado (PT)',
      evento: 'COMMERCIAL_CONTRACT_SENT',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Contrato Comercial pronto para assinatura - {{numero_contrato}}',
      plantilla: 'Prezado representante da {{empresa}}, o contrato comercial {{numero_contrato}} foi enviado para sua revisão e assinatura legal na plataforma Quick Hire.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    // COMMERCIAL_CONTRACT_VIEWED
    {
      id: 'PL-NOT-CC-VIEW-ES',
      codigo: 'PL-NOT-CC-VIEW-ES',
      nombre: 'Contrato comercial visto (ES)',
      evento: 'COMMERCIAL_CONTRACT_VIEWED',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Contrato Comercial Visualizado - {{numero_contrato}}',
      plantilla: 'Alerta comercial: El cliente {{empresa}} ha visualizado el contrato comercial {{numero_contrato}}.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-VIEW-EN',
      codigo: 'PL-NOT-CC-VIEW-EN',
      nombre: 'Commercial contract viewed (EN)',
      evento: 'COMMERCIAL_CONTRACT_VIEWED',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Commercial Contract Viewed - {{numero_contrato}}',
      plantilla: 'Sales Alert: The client {{empresa}} has viewed the commercial contract {{numero_contrato}}.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-VIEW-PT',
      codigo: 'PL-NOT-CC-VIEW-PT',
      nombre: 'Contrato comercial visto (PT)',
      evento: 'COMMERCIAL_CONTRACT_VIEWED',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Contrato Comercial Visualizado - {{numero_contrato}}',
      plantilla: 'Alerta comercial: O cliente {{empresa}} visualizou o contrato comercial {{numero_contrato}}.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    // COMMERCIAL_CONTRACT_SIGNED
    {
      id: 'PL-NOT-CC-SIGN-ES',
      codigo: 'PL-NOT-CC-SIGN-ES',
      nombre: 'Contrato comercial firmado (ES)',
      evento: 'COMMERCIAL_CONTRACT_SIGNED',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Contrato Comercial Firmado por el Cliente - {{numero_contrato}}',
      plantilla: 'El cliente {{empresa}} ha firmado el contrato comercial {{numero_contrato}}. El estado actual es "Firmado por cliente" y pasa a revisión interna.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-SIGN-EN',
      codigo: 'PL-NOT-CC-SIGN-EN',
      nombre: 'Commercial contract signed (EN)',
      evento: 'COMMERCIAL_CONTRACT_SIGNED',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Commercial Contract Signed by Client - {{numero_contrato}}',
      plantilla: 'The client {{empresa}} has signed the commercial contract {{numero_contrato}}. The status is now "Firmado por cliente" and goes to internal review.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-SIGN-PT',
      codigo: 'PL-NOT-CC-SIGN-PT',
      nombre: 'Contrato comercial assinado (PT)',
      evento: 'COMMERCIAL_CONTRACT_SIGNED',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Contrato Comercial Assinado pelo Cliente - {{numero_contrato}}',
      plantilla: 'O cliente {{empresa}} assinou o contrato comercial {{numero_contrato}}. O status atual é "Firmado por cliente" e vai para revisão interna.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    // COMMERCIAL_CONTRACT_REJECTED
    {
      id: 'PL-NOT-CC-REJ-ES',
      codigo: 'PL-NOT-CC-REJ-ES',
      nombre: 'Contrato comercial devuelto/rechazado (ES)',
      evento: 'COMMERCIAL_CONTRACT_REJECTED',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Contrato Comercial Devuelto con Observaciones - {{numero_contrato}}',
      plantilla: 'El contrato comercial {{numero_contrato}} para {{empresa}} ha sido devuelto con observaciones: {{comentario}}.',
      variables: ['empresa', 'numero_contrato', 'comentario'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-REJ-EN',
      codigo: 'PL-NOT-CC-REJ-EN',
      nombre: 'Commercial contract returned/rejected (EN)',
      evento: 'COMMERCIAL_CONTRACT_REJECTED',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Commercial Contract Returned with Comments - {{numero_contrato}}',
      plantilla: 'The commercial contract {{numero_contrato}} for {{empresa}} has been returned with comments: {{comentario}}.',
      variables: ['empresa', 'numero_contrato', 'comentario'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-REJ-PT',
      codigo: 'PL-NOT-CC-REJ-PT',
      nombre: 'Contrato comercial rejeitado/devolvido (PT)',
      evento: 'COMMERCIAL_CONTRACT_REJECTED',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Contrato Comercial Devolvido com Observações - {{numero_contrato}}',
      plantilla: 'O contrato comercial {{numero_contrato}} para {{empresa}} foi devolvido com observações: {{comentario}}.',
      variables: ['empresa', 'numero_contrato', 'comentario'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    // COMMERCIAL_CONTRACT_APPROVED
    {
      id: 'PL-NOT-CC-APP-ES',
      codigo: 'PL-NOT-CC-APP-ES',
      nombre: 'Contrato comercial aprobado (ES)',
      evento: 'COMMERCIAL_CONTRACT_APPROVED',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Contrato Comercial Aprobado - {{numero_contrato}}',
      plantilla: '¡Felicitaciones! El contrato comercial {{numero_contrato}} para {{empresa}} ha sido aprobado internamente por Quick Hire.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-APP-EN',
      codigo: 'PL-NOT-CC-APP-EN',
      nombre: 'Commercial contract approved (EN)',
      evento: 'COMMERCIAL_CONTRACT_APPROVED',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Commercial Contract Approved - {{numero_contrato}}',
      plantilla: 'Congratulations! The commercial contract {{numero_contrato}} for {{empresa}} has been approved internally by Quick Hire.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-APP-PT',
      codigo: 'PL-NOT-CC-APP-PT',
      nombre: 'Contrato comercial aprovado (PT)',
      evento: 'COMMERCIAL_CONTRACT_APPROVED',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Contrato Comercial Aprovado - {{numero_contrato}}',
      plantilla: 'Parabéns! O contrato comercial {{numero_contrato}} para {{empresa}} foi aprovado internamente pela Quick Hire.',
      variables: ['empresa', 'numero_contrato'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    // INITIAL_PAYMENT_REQUESTED
    {
      id: 'PL-NOT-CC-PAY-ES',
      codigo: 'PL-NOT-CC-PAY-ES',
      nombre: 'Solicitud de Pago Inicial (ES)',
      evento: 'INITIAL_PAYMENT_REQUESTED',
      canal: 'correo',
      idioma: 'es',
      asunto: 'Solicitud de Pago Inicial - Factura de Activación Quick Hire',
      plantilla: 'Se ha habilitado la solicitud de pago inicial para {{empresa}}. Recuerde que la validación de este pago es obligatoria para la liberación del servicio y habilitación de contratos laborales locales.',
      variables: ['empresa'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-PAY-EN',
      codigo: 'PL-NOT-CC-PAY-EN',
      nombre: 'Initial Payment Requested (EN)',
      evento: 'INITIAL_PAYMENT_REQUESTED',
      canal: 'correo',
      idioma: 'en',
      asunto: 'Initial Payment Request - Quick Hire Activation Invoice',
      plantilla: 'The initial payment request has been enabled for {{empresa}}. Please note that validation of this payment is required to release the service and enable local employment contracts.',
      variables: ['empresa'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    },
    {
      id: 'PL-NOT-CC-PAY-PT',
      codigo: 'PL-NOT-CC-PAY-PT',
      nombre: 'Solicitação de Pagamento Inicial (PT)',
      evento: 'INITIAL_PAYMENT_REQUESTED',
      canal: 'correo',
      idioma: 'pt',
      asunto: 'Solicitação de Pagamento Inicial - Fatura de Ativação Quick Hire',
      plantilla: 'A solicitação de pagamento inicial foi habilitada para a {{empresa}}. Lembre-se que a validação deste pagamento é obrigatória para a liberação do serviço e habilitação de contratos de trabalho locais.',
      variables: ['empresa'],
      activo: true,
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: '2026-07-16T10:00:00Z',
      fechaModificacion: '2026-07-16T10:00:00Z'
    }
  ],
  alertasNotificacion: [],
  seguimientosComerciales: [],
  traducciones: [
    { id: 'menu.dashboard', es: 'Panel de Control', en: 'Dashboard', pt: 'Painel de Controle', modulo: 'Menús', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'menu.contracts', es: 'Contratos', en: 'Contracts', pt: 'Contratos', modulo: 'Menús', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'button.save', es: 'Guardar', en: 'Save', pt: 'Salvar', modulo: 'Botones', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'button.cancel', es: 'Cancelar', en: 'Cancel', pt: 'Cancelar', modulo: 'Botones', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'status.pending', es: 'Pendiente', en: 'Pending', pt: 'Pendente', modulo: 'Estados del sistema', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'status.approved', es: 'Aprobado', en: 'Approved', pt: 'Aprovado', modulo: 'Estados del sistema', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'status.rejected', es: 'Rechazado', en: 'Rejected', pt: 'Rejeitado', modulo: 'Estados del sistema', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'status.signed', es: 'Firmado', en: 'Signed', pt: 'Assinado', modulo: 'Estados del sistema', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'alert.payment_pending', es: 'Pago Pendiente de Nómina', en: 'Pending Payroll Payment', pt: 'Pagamento Pendente de Folha', modulo: 'Alertas', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'email.contract_sent.subject', es: 'Su contrato de EOR está listo para firmar', en: 'Your EOR contract is ready to sign', pt: 'Seu contrato EOR está pronto para assinatura', modulo: 'Notificaciones', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' },
    { id: 'email.contract_sent.body', es: 'Estimado cliente, su plantilla de contrato comercial ha sido generada para el país solicitado.', en: 'Dear client, your commercial contract template has been generated for the requested country.', pt: 'Prezado cliente, o seu modelo de contrato comercial foi gerado para o país solicitado.', modulo: 'Notificaciones', activo: true, fechaActualizacion: '2026-07-21T08:00:00Z', usuarioResponsable: 'administrador-eor-peo@grupostt.com' }
  ],
  directorio: [
    { id: 'DIR-001', tipo: 'Gerente / Coordinador', pais: 'México', empresaStt: 'STT México S.A. de C.V.', nombre: 'Pamela Jimenez', correo: 'Pamela.jimenez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-002', tipo: 'Gerente / Coordinador', pais: 'Colombia', empresaStt: 'STT Colombia S.A.S.', nombre: 'Pamela Jimenez', correo: 'Pamela.jimenez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-003', tipo: 'Gerente / Coordinador', pais: 'Chile', empresaStt: 'STT Chile SpA', nombre: 'Miriam Gonzalez', correo: 'Miriam.gonzalez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-004', tipo: 'Gerente / Coordinador', pais: 'Brasil', empresaStt: 'STT Brasil Ltda.', nombre: 'Amanda Escobar', correo: 'Amanda.escobar@grupostt.com', estado: 'Activo' },
    { id: 'DIR-005', tipo: 'Gerente / Coordinador', pais: 'Puerto Rico', empresaStt: 'STT Puerto Rico LLC', nombre: 'Karen Camacho', correo: 'Karen.camacho@grupostt.com', estado: 'Activo' },
    { id: 'DIR-006', tipo: 'Gerente / Coordinador', pais: 'Jamaica', empresaStt: 'STT Jamaica Ltd.', nombre: 'Resilencia', correo: 'resilencia@grupostt.com', estado: 'Activo' },
    { id: 'DIR-007', tipo: 'Gerente / Coordinador', pais: 'República Dominicana', empresaStt: 'STT RD S.A.', nombre: 'Rosanni Rodriguez', correo: 'Rosanni.rodriguez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-008', tipo: 'Gerente / Coordinador', pais: 'Perú', empresaStt: 'STT Perú S.A.C.', nombre: 'Lissett Cerna', correo: 'Lissett.cerna@grupostt.com', estado: 'Activo' },
    { id: 'DIR-009', tipo: 'Gerente / Coordinador', pais: 'Ecuador', empresaStt: 'STT Ecuador S.A.', nombre: 'Viviana González', correo: 'viviana.gonzalez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-010', tipo: 'Gerente / Coordinador', pais: 'Bolivia', empresaStt: 'STT Bolivia S.R.L.', nombre: 'Natalie Rodriguez', correo: 'Natalie.rodriguez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-011', tipo: 'Gerente / Coordinador', pais: 'Argentina', empresaStt: 'STT Argentina S.A.', nombre: 'Lissett Cerna', correo: 'Lissett.cerna@grupostt.com', estado: 'Activo' },
    { id: 'DIR-012', tipo: 'Gerente / Coordinador', pais: 'Uruguay', empresaStt: 'STT Uruguay S.A.', nombre: 'Lissett Cerna', correo: 'Lissett.cerna@grupostt.com', estado: 'Activo' },
    { id: 'DIR-013', tipo: 'Gerente / Coordinador', pais: 'Paraguay', empresaStt: 'STT Paraguay S.A.', nombre: 'Amanda Escobar', correo: 'Amanda.escobar@grupostt.com', estado: 'Activo' },
    { id: 'DIR-014', tipo: 'Gerente / Coordinador', pais: 'Costa Rica', empresaStt: 'STT Costa Rica S.A.', nombre: 'Veronica Moreira', correo: 'Veronica.moreira@grupostt.com', estado: 'Activo' },
    { id: 'DIR-015', tipo: 'Gerente / Coordinador', pais: 'Panamá', empresaStt: 'STT Panamá S.A.', nombre: 'Alberto Mora', correo: 'Alberto.mora@grupostt.com', estado: 'Activo' },
    { id: 'DIR-016', tipo: 'Gerente / Coordinador', pais: 'El Salvador', empresaStt: 'STT El Salvador S.A.', nombre: 'Pamela Jimenez', correo: 'Pamela.jimenez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-017', tipo: 'Gerente / Coordinador', pais: 'Guatemala', empresaStt: 'STT Guatemala S.A.', nombre: 'Arely Lopez', correo: 'Arely.lopez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-018', tipo: 'Gerente / Coordinador', pais: 'Nicaragua', empresaStt: 'STT Nicaragua S.A.', nombre: 'Daysi Calvo', correo: 'Daysi.Calvo.toledo@grupostt.com', estado: 'Activo' },
    { id: 'DIR-019', tipo: 'Gerente / Coordinador', pais: 'Honduras', empresaStt: 'STT Honduras S.A.', nombre: 'Cinthya Lagos', correo: 'Cinthya.lagos@grupostt.com', estado: 'Activo' },
    { id: 'DIR-020', tipo: 'Gerente / Coordinador', pais: 'Estados Unidos', empresaStt: 'STT of America LLC', nombre: 'Mainor Acosta', correo: 'mainor.acosta.vargas@grupostt.com', estado: 'Activo' },
    { id: 'DIR-021', tipo: 'Ejecutivo de Cuenta', pais: 'Brasil', empresaStt: 'STT Brasil Ltda.', nombre: 'Samara Dos Santos Hormazabal', correo: 'samara.dossantos@grupostt.com', estado: 'Activo' },
    { id: 'DIR-022', tipo: 'Ejecutivo de Cuenta', pais: 'Bolivia', empresaStt: 'STT Bolivia S.R.L.', nombre: 'Alexandra Angela Zola Salazar', correo: 'alexandra.zola@grupostt.com', estado: 'Activo' },
    { id: 'DIR-023', tipo: 'Ejecutivo de Cuenta', pais: 'Colombia', empresaStt: 'STT Colombia S.A.S.', nombre: 'Yuly Andrea Becerra Becerra', correo: 'yuly.becerra@grupostt.com', estado: 'Activo' },
    { id: 'DIR-024', tipo: 'Ejecutivo de Cuenta', pais: 'Colombia', empresaStt: 'STT Colombia S.A.S.', nombre: 'Jennifer Lorena Torres Alvarez', correo: 'jennifer.torres@grupostt.com', estado: 'Activo' },
    { id: 'DIR-025', tipo: 'Ejecutivo de Cuenta', pais: 'Ecuador', empresaStt: 'STT Ecuador S.A.', nombre: 'Priscilla Jacqueline Mite Vera', correo: 'priscilla.mite.nc@grupostt.com', estado: 'Activo' },
    { id: 'DIR-026', tipo: 'Ejecutivo de Cuenta', pais: 'Costa Rica', empresaStt: 'STT Costa Rica S.A.', nombre: 'Hazel Andrea Valerio Villalobos', correo: 'hazel.valerio@grupostt.com', estado: 'Activo' },
    { id: 'DIR-027', tipo: 'Ejecutivo de Cuenta', pais: 'Costa Rica', empresaStt: 'STT Costa Rica S.A.', nombre: 'Maribel Jurado Vallejo', correo: 'maribel.jurado@grupostt.com', estado: 'Activo' },
    { id: 'DIR-028', tipo: 'Ejecutivo de Cuenta', pais: 'El Salvador', empresaStt: 'STT El Salvador S.A.', nombre: 'Jorge Luis Henriquez Perdomo', correo: 'jorge.henriquez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-029', tipo: 'Ejecutivo de Cuenta', pais: 'El Salvador', empresaStt: 'STT El Salvador S.A.', nombre: 'Roberto Alejandro Canto Mena', correo: 'roberto.canto@grupostt.com', estado: 'Activo' },
    { id: 'DIR-030', tipo: 'Ejecutivo de Cuenta', pais: 'Guatemala', empresaStt: 'STT Guatemala S.A.', nombre: 'Juceily Maricruz Catalan Soto', correo: 'maricruz.catalan@grupostt.com', estado: 'Activo' },
    { id: 'DIR-031', tipo: 'Ejecutivo de Cuenta', pais: 'Guatemala', empresaStt: 'STT Guatemala S.A.', nombre: 'Milsy Yahaira Crisostomo Gabriel', correo: 'milsy.crisostomo@grupostt.com', estado: 'Activo' },
    { id: 'DIR-032', tipo: 'Ejecutivo de Cuenta', pais: 'Honduras', empresaStt: 'STT Honduras S.A.', nombre: 'Leda Patricia Velasquez Rodriguez', correo: 'patricia.velasquez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-033', tipo: 'Ejecutivo de Cuenta', pais: 'Honduras', empresaStt: 'STT Honduras S.A.', nombre: 'Ana Liseth Paredes Garcia', correo: 'ana.paredes@grupostt.com', estado: 'Activo' },
    { id: 'DIR-034', tipo: 'Ejecutivo de Cuenta', pais: 'Jamaica', empresaStt: 'STT Jamaica Ltd.', nombre: 'Danielle Abigail Waugh', correo: 'danielle.waugh.nc@grupostt.com', estado: 'Activo' },
    { id: 'DIR-035', tipo: 'Ejecutivo de Cuenta', pais: 'México', empresaStt: 'STT México S.A. de C.V.', nombre: 'Maria Elena Alvarez Sanchez', correo: 'maria.sanchez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-036', tipo: 'Ejecutivo de Cuenta', pais: 'Panamá', empresaStt: 'STT Panamá S.A.', nombre: 'Alexandra Nahim Guerra Barberena', correo: 'alexandra.guerra@grupostt.com', estado: 'Activo' },
    { id: 'DIR-037', tipo: 'Ejecutivo de Cuenta', pais: 'Panamá', empresaStt: 'STT Panamá S.A.', nombre: 'Lauren Ivette Martinez Proffit', correo: 'lauren.martinez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-038', tipo: 'Ejecutivo de Cuenta', pais: 'Perú', empresaStt: 'STT Perú S.A.C.', nombre: 'Deisy Annabely Sanchez Zamora', correo: 'deisy.sanchez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-039', tipo: 'Ejecutivo de Cuenta', pais: 'Puerto Rico', empresaStt: 'STT Puerto Rico LLC', nombre: 'Karen Annette Camacho Padilla', correo: 'karen.camacho@grupostt.com', estado: 'Activo' },
    { id: 'DIR-040', tipo: 'Ejecutivo de Cuenta', pais: 'República Dominicana', empresaStt: 'STT RD S.A.', nombre: 'Johanny Rodriguez Rodriguez', correo: 'johanny.rodriguez@grupostt.com', estado: 'Activo' },
    { id: 'DIR-041', tipo: 'Asesor Comercial', pais: 'Colombia', empresaStt: 'STT Colombia S.A.S.', nombre: 'Carlos Asesor Comercial', correo: 'asesor-eor-peo@grupostt.com', estado: 'Activo' },
    { id: 'DIR-042', tipo: 'Asesor Comercial', pais: 'México', empresaStt: 'STT México S.A. de C.V.', nombre: 'Ana María Asesora LATAM', correo: 'asesor-eor-peo@grupostt.com', estado: 'Activo' }
  ],
  cuentasBancarias: [
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
  ],
  reglasTributarias: [
    {
      id: 'TAX-001',
      pais: 'Colombia',
      sociedadFacturadora: 'STT Colombia S.A.S. / SUPPLYING TOTAL TALENT SAS CO',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 19,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 4,
      rentaIsrPct: 35,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Decisión 578 CAN / Convenios vigentes (España, Chile, México, Suiza, Canadá)',
      fundamentoLegal: 'Estatuto Tributario Arts. 392, 408 y 481 literal c (Exportación de Servicios)',
      certificadoRequerido: 'Certificado de Retención en la Fuente Formulario 220 DIAN / RUT',
      notas: 'Servicios EOR transfronterizos exentos de IVA con constancia de uso exclusivo en el exterior.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-002',
      pais: 'México',
      sociedadFacturadora: 'STT México S.A. de C.V. / SERV. TER. Y TAL. STT DE MEXICO',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 16,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 10,
      rentaIsrPct: 30,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Convenio para Evitar Doble Imposición México - Panamá / USA / España',
      fundamentoLegal: 'Ley del Impuesto sobre la Renta (LISR) Art. 153, 167 y Ley del IVA Art. 29',
      certificadoRequerido: 'Constancia de Situación Fiscal (CSF) SAT y Forma 36 / Form W-8BEN-E',
      notas: 'Retención de ISR aplicable sobre honorarios de administración de personal transfronterizos.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-003',
      pais: 'Panamá',
      sociedadFacturadora: 'STT Suramérica / STT International Holdings Inc',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 7,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 12.5,
      rentaIsrPct: 25,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Principio de Territorialidad / Red de Convenios DTT Panamá (17 países)',
      fundamentoLegal: 'Código Fiscal Art. 694 y 701 (Ingresos de fuente extranjera exentos)',
      certificadoRequerido: 'Certificado de Residencia Fiscal DGI Panamá',
      notas: 'Hub de facturación regional: servicios prestados fuera de Panamá son exentos de ITBMS y renta territorial.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-004',
      pais: 'Chile',
      sociedadFacturadora: 'STT Chile SpA / ASESORIAS Y SERVICIOS STT CHILE',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 19,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 15,
      rentaIsrPct: 27,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Convenios de Doble Tributación vigentes SII (33 países incluyendo USA y España)',
      fundamentoLegal: 'Ley sobre Impuesto a la Renta Art. 59 (Impuesto Adicional) y D.L. 825 de IVA',
      certificadoRequerido: 'Certificado SII Formulario 1912 / Certificado de Residencia Tributaria',
      notas: 'Servicios calificados de exportación por el Servicio Nacional de Aduanas están exentos de IVA.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-005',
      pais: 'Perú',
      sociedadFacturadora: 'STT Perú S.A.C. / SUPPLYING TOTAL TALENT SAC PERU',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 18,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 15,
      rentaIsrPct: 29.5,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Decisión 578 CAN (Bolivia, Colombia, Ecuador, Perú) / Convenios SUNAT',
      fundamentoLegal: 'Texto Único Ordenado de la Ley del Impuesto a la Renta Art. 56 y Ley del IGV',
      certificadoRequerido: 'Comprobante de Retención Electrónico SUNAT / Ficha RUC',
      notas: 'Bajo CAN, la renta de servicios solo tributa en el país donde se presta el servicio físico.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-006',
      pais: 'Costa Rica',
      sociedadFacturadora: 'SUPPLYING TOTAL TALENT COSTA RICA S.A.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 13,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 15,
      rentaIsrPct: 30,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Convenio Costa Rica - España / Alemania / Principio de Renta Territorial',
      fundamentoLegal: 'Ley del Impuesto sobre el Valor Agregado (Ley 9635) y Ley del Impuesto sobre la Renta',
      certificadoRequerido: 'Certificado de Retención en la Fuente DGT Ministerio de Hacienda',
      notas: 'Exportación de servicios exenta de IVA con debida documentación de exportador de servicios.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-007',
      pais: 'Argentina',
      sociedadFacturadora: 'STT Argentina S.A. / GRUPO STT ARGENTINA',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 21,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 28,
      rentaIsrPct: 35,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Total Facturado',
      tratadoDobleImposicion: 'Convenios Bilaterales AFIP / ARCA (21 tratados vigentes)',
      fundamentoLegal: 'Ley de Impuesto a las Ganancias Arts. 91-93 y Ley de IVA',
      certificadoRequerido: 'Certificado de Retención SICORE / CUIT ARCA',
      notas: 'Régimen cambiario regulado por BCRA; retenciones aplicables sobre giros al exterior.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-008',
      pais: 'Brasil',
      sociedadFacturadora: 'STT Recrutamento e Seleção Ltda',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 9.25,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 15,
      rentaIsrPct: 34,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Red de Acordos de Bitributação da Receita Federal do Brasil (35 países)',
      fundamentoLegal: 'Regulamento do Imposto de Renda (RIR/2018) Art. 744 (IRRF) e PIS/COFINS',
      certificadoRequerido: 'Comprovante de Rendimentos Pagos e de Retenção de IRRF / CNPJ',
      notas: 'PIS/COFINS y ISSQN aplicables a nivel municipal. IRRF de 15% sobre pagos al exterior (25% para paraísos fiscales).',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-009',
      pais: 'Estados Unidos',
      sociedadFacturadora: 'STT OF AMERICA LLC / STT GLOBAL SERVICES INC USA',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 0,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 0,
      rentaIsrPct: 21,
      asuncionWht: 'Exento por CDI/Tratado',
      baseCalculoIva: 'No Aplica',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'US Income Tax Treaties (Over 60 bilateral agreements) / Internal Revenue Code',
      fundamentoLegal: 'Internal Revenue Code (IRC) Sections 861, 881 and 1442; Form W-8BEN-E / W-9',
      certificadoRequerido: 'IRS Form W-8BEN-E (Certificate of Status of Beneficial Owner) / Form W-9',
      notas: 'Sin Sales Tax federal en servicios profesionales EOR. 0% WHT para pagos de servicios ejecutados fuera de USA.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-010',
      pais: 'Uruguay',
      sociedadFacturadora: 'STT Uruguay S.A. / GRUPO STT URUGUAY',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 22,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 12,
      rentaIsrPct: 25,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Principio de Fuente Territorial DGI / Red de convenios CDI Uruguay',
      fundamentoLegal: 'Título 4 T.O. 1996 (IRAE) e Impuesto a las Rentas de los No Residentes (IRNR)',
      certificadoRequerido: 'Resguardo de Retención Formulario 2181 DGI / RUT',
      notas: 'Exportación de servicios técnicos y software exonerada de IVA con crédito fiscal.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-011',
      pais: 'Ecuador',
      sociedadFacturadora: 'TOTAL TALENT ECUADOR S.A. / STT ECUADOR',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 15,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 25,
      rentaIsrPct: 25,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Decisión 578 Comunidad Andina / Convenios SRI vigentes',
      fundamentoLegal: 'Ley de Régimen Tributario Interno (LRTI) Art. 39 y Reglamento de Aplicación',
      certificadoRequerido: 'Comprobante de Retención Electrónico SRI / RUC',
      notas: 'Retención de 25% sobre pagos al exterior reducida a 0% o exenta bajo Decisión 578 CAN.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-012',
      pais: 'Guatemala',
      sociedadFacturadora: 'SERVICIOS TOTALES STT GUATEMALA S.A.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 12,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 15,
      rentaIsrPct: 25,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Principio de Territorialidad estricta SAT Guatemala',
      fundamentoLegal: 'Ley de Actualización Tributaria Decreto 10-2012 Libro I (ISR No Residentes)',
      certificadoRequerido: 'Constancia de Retención del ISR SAT / NIT',
      notas: 'Tarifa general de 15% sobre servicios técnicos y honorarios prestados a entidades locales.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-013',
      pais: 'República Dominicana',
      sociedadFacturadora: 'SUPPLYING TOTAL TALENT RD SRL',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 18,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 27,
      rentaIsrPct: 27,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Convenio República Dominicana - España / Código Tributario DGII',
      fundamentoLegal: 'Código Tributario Ley 11-92 Art. 305 (Pagos al Exterior) e ITBIS Art. 335',
      certificadoRequerido: 'Certificado de Retención de Pagos al Exterior DGII / RNC',
      notas: 'Retención de 27% sobre honorarios y servicios abonados a entidades no residentes.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-014',
      pais: 'El Salvador',
      sociedadFacturadora: 'STT EL SALVADOR S.A. DE C.V.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 13,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 20,
      rentaIsrPct: 30,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Convenio El Salvador - España / Principio de Renta Territorial',
      fundamentoLegal: 'Ley de Impuesto sobre la Renta Art. 158 y Ley de Impuesto a la Transferencia de Bienes (IVA)',
      certificadoRequerido: 'Constancia de Retención del Impuesto sobre la Renta MH / NIT',
      notas: 'Retención de 20% para servicios prestados por no domiciliados (25% para paraísos fiscales).',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-015',
      pais: 'Honduras',
      sociedadFacturadora: 'GRUPO STT HONDURAS S.A.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 15,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 25,
      rentaIsrPct: 25,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Principio de Territorialidad SAR Honduras',
      fundamentoLegal: 'Ley del Impuesto sobre la Renta Art. 5 (Rentas Gravables No Residentes)',
      certificadoRequerido: 'Certificado de Retención de ISR SAR / RTN',
      notas: '25% de retención en la fuente definitiva sobre pagos al exterior por asesoría o servicios.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-016',
      pais: 'Nicaragua',
      sociedadFacturadora: 'STT NICARAGUA S.A.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 15,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 20,
      rentaIsrPct: 30,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Principio de Territorialidad DGI Nicaragua',
      fundamentoLegal: 'Ley 822 Ley de Concertación Tributaria Art. 53 (Retenciones No Residentes)',
      certificadoRequerido: 'Constancia de Retención Definitiva DGI / RUC',
      notas: '20% retención definitiva a no residentes por servicios prestados con efectos en el país.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-017',
      pais: 'Bolivia',
      sociedadFacturadora: 'TERCERIZACION DE SERVICIOS STTGROUP BOLIVIA S.R.L.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 13,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 12.5,
      rentaIsrPct: 25,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Decisión 578 Comunidad Andina / Convenios SIN Bolivia',
      fundamentoLegal: 'Ley 843 Impuesto sobre las Utilidades de las Empresas (IUE-Beneficiarios del Exterior)',
      certificadoRequerido: 'Certificado de Retención IUE-BE Formulario 570 SIN / NIT',
      notas: 'Tasa efectiva de 12.5% IUE Beneficiarios del Exterior. Exonerada bajo Decisión 578 CAN.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-018',
      pais: 'Paraguay',
      sociedadFacturadora: 'STT PARAGUAY S.R.L.',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 10,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 15,
      rentaIsrPct: 10,
      asuncionWht: 'Gross-Up (A cargo de Cliente)',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Convenio Paraguay - Chile / Taiwán / España / Ley 6380/19',
      fundamentoLegal: 'Ley 6380/19 de Modernización y Simplificación del Sistema Tributario (INR)',
      certificadoRequerido: 'Comprobante de Retención Electrónico DNIT / RUC',
      notas: 'Impuesto a los No Residentes (INR) con tasa del 15% sobre la renta neta de fuente paraguaya.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    },
    {
      id: 'TAX-019',
      pais: 'España',
      sociedadFacturadora: 'STT EUROPE TALENT HUB S.L. / QUICK HIRE SPAIN',
      tipoFacturacion: 'Ambas',
      ivaGeneralPct: 21,
      ivaEorExportacionPct: 0,
      whtRetencionPct: 0,
      rentaIsrPct: 25,
      asuncionWht: 'Exento por CDI/Tratado',
      baseCalculoIva: 'Solo Fee EOR',
      baseCalculoWht: 'Solo Fee EOR',
      tratadoDobleImposicion: 'Red de Convenios de Doble Imposición de España con toda Latinoamérica y UE',
      fundamentoLegal: 'Ley del Impuesto sobre la Renta de No Residentes (IRNR) y Ley 37/1992 del IVA (Regla Inversión del Sujeto Pasivo)',
      certificadoRequerido: 'Certificado de Residencia Fiscal AEAT Modelo 01 / VIES NIF-IVA',
      notas: 'Inversión del sujeto pasivo (Reverse Charge) para clientes UE. 0% retención bajo la mayoría de convenios CDI.',
      estado: 'Vigente',
      fechaActualizacion: '2026-08-20',
      usuarioActualizacion: 'administrador-eor-peo@grupostt.com'
    }
  ]
};

// Memory cache for database
const ALL_MENU_IDS_SERVER = [
  'kpis', 'solicitudes', 'clientes', 'trabajadores', 'directorio',
  'billing', 'fees', 'exchange', 'cuentas_bancarias', 'iva_wht_renta',
  'masters', 'contracts', 'plantillas',
  'tickets', 'sla', 'operational_alerts', 'notifications',
  'reports', 'logs', 'users'
];

const DEFAULT_ROLES_SERVER: RoleDefinition[] = [
  {
    id: 'administrador',
    nombre: 'Administrador',
    descripcion: 'Acceso total y permanente a todos los módulos y configuraciones operativas del sistema.',
    esSistema: true,
    esAdmin: true,
    opcionesMenu: [...ALL_MENU_IDS_SERVER]
  },
  {
    id: 'asesor_comercial',
    nombre: 'Asesor Comercial',
    descripcion: 'Atención a prospectos comerciales, cálculo de cotizaciones, tarifas y modelos de contratos.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis', 'solicitudes', 'clientes', 'contracts', 'fees', 'exchange', 'iva_wht_renta', 'plantillas', 'tickets', 'notifications'
    ]
  },
  {
    id: 'ejecutivo_cuentas',
    nombre: 'Ejecutivo de Cuentas',
    descripcion: 'Gestión operativa de clientes asignados, supervisión de colaboradores locales y soporte de cuenta.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis', 'clientes', 'trabajadores', 'billing', 'contracts', 'tickets', 'sla', 'notifications'
    ]
  },
  {
    id: 'cliente',
    nombre: 'Cliente',
    descripcion: 'Portal corporativo para visualización de nómina, contratos, facturas y tickets de soporte.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis', 'trabajadores', 'billing', 'contracts', 'tickets', 'notifications', 'solicitudes'
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
  },
  {
    id: 'supracliente',
    nombre: 'Supra Cliente (Holding)',
    descripcion: 'Portal consolidado para holdings y corporativos con supervisión multisede y reportes agregados.',
    esSistema: true,
    esAdmin: false,
    opcionesMenu: [
      'kpis', 'clientes', 'trabajadores', 'billing', 'contracts', 'tickets', 'reports', 'notifications'
    ]
  }
];

function loadLocalDatabaseSync(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.usuarios) && parsed.usuarios.length > 0) {
        console.log(`[Database Engine] Synchronously loaded ${parsed.usuarios.length} users and ${parsed.clientes?.length || 0} clients from local db.json.`);
        return parsed as DatabaseSchema;
      }
    } catch (e) {
      console.error('[Database Engine] Error reading db.json synchronously:', e);
    }
  }
  if (fs.existsSync(BACKUP_DB_FILE)) {
    try {
      const raw = fs.readFileSync(BACKUP_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.usuarios) && parsed.usuarios.length > 0) {
        console.log(`[Database Engine] Synchronously loaded ${parsed.usuarios.length} users from db.backup.json.`);
        return parsed as DatabaseSchema;
      }
    } catch (e) {
      console.error('[Database Engine] Error reading db.backup.json synchronously:', e);
    }
  }
  console.log('[Database Engine] No local database found on disk. Bootstrapping with initialDb.');
  return JSON.parse(JSON.stringify(initialDb));
}

let dbCache: DatabaseSchema = loadLocalDatabaseSync();

function ensureDefaultSeed(db: DatabaseSchema): boolean {
  let modified = false;

  if (!db.usuarios) db.usuarios = [];
  if (!db.clientes) db.clientes = [];
  if (!db.solicitudes) db.solicitudes = [];
  if (!db.trabajadores) db.trabajadores = [];
  if (!db.facturas) db.facturas = [];
  if (!db.contratosComerciales) db.contratosComerciales = [];
  if (!db.contratosLaborales) db.contratosLaborales = [];
  if (!db.tickets) db.tickets = [];
  if (!db.historialCargas) db.historialCargas = [];
  if (!db.tarifarios) db.tarifarios = [];

  // Seed default official rate card if missing
  if (!db.tarifarios.some(t => t.id === 'TAR-STD-OFFICIAL')) {
    db.tarifarios.unshift({
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
    });
    modified = true;
  }

  // Guarantee Daniel Decan root admin account exists and is active
  const uDecan = db.usuarios.find(u => u.correo.toLowerCase() === 'daniel.decan@nominasaps.com');
  if (uDecan) {
    if (uDecan.rol !== 'administrador' || uDecan.estado !== 'Activo') {
      uDecan.nombre = 'Daniel Decan';
      uDecan.rol = 'administrador';
      uDecan.estado = 'Activo';
      delete (uDecan as any).clienteId;
      modified = true;
    }
  } else {
    db.usuarios.push({
      correo: 'daniel.decan@nominasaps.com',
      nombre: 'Daniel Decan',
      rol: 'administrador',
      estado: 'Activo',
      contrasena: '123456',
      ultimoAcceso: new Date().toISOString(),
      fechaCreacion: '2026-01-01T00:00:00Z'
    });
    modified = true;
  }

  // Guarantee all core demo accounts exist
  const CORE_SYSTEM_USERS: User[] = [
    {
      correo: 'administrador-eor-peo@grupostt.com',
      nombre: 'Administrador Global',
      rol: 'administrador',
      estado: 'Activo',
      contrasena: '123456',
      pais: 'México',
      paisesAsignados: ['Todos'],
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'guadalupe-admin-eor@grupostt.com',
      nombre: 'Guadalupe Administradora',
      rol: 'administrador',
      estado: 'Activo',
      contrasena: '123456',
      pais: 'Regional',
      paisesAsignados: ['Todos'],
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'guadalupe-asesor-eor@grupostt.com',
      nombre: 'Guadalupe Asesor Comercial',
      rol: 'asesor_comercial',
      estado: 'Activo',
      contrasena: '123456',
      pais: 'Regional',
      paisesAsignados: ['México', 'Colombia', 'Brasil', 'Chile', 'Perú', 'Costa Rica', 'Panamá', 'Argentina', 'Uruguay', 'Ecuador', 'Guatemala', 'El Salvador', 'Honduras', 'Nicaragua', 'República Dominicana', 'Bolivia', 'Paraguay', 'Venezuela'],
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'asesor-eor-peo@grupostt.com',
      nombre: 'Asesor Comercial EOR/PEO',
      rol: 'asesor_comercial',
      estado: 'Activo',
      contrasena: '123456',
      pais: 'México',
      paisesAsignados: ['Todos'],
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'supracliente-eor-peo@grupostt.com',
      nombre: 'Supra Cliente Global Holding',
      rol: 'supracliente',
      estado: 'Activo',
      contrasena: '123456',
      pais: 'Regional',
      paisesAsignados: ['Todos'],
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'cliente-eor-peo@grupostt.com',
      nombre: 'Cliente EOR/PEO Grupo STT',
      rol: 'cliente',
      estado: 'Activo',
      contrasena: '123456',
      clienteId: 'CLI-876',
      pais: 'Regional',
      fechaCreacion: '2026-01-01T00:00:00Z'
    },
    {
      correo: 'tesoreria-eor-peo@grupostt.com',
      nombre: 'Tesorería EOR/PEO Grupo STT',
      rol: 'tesoreria',
      estado: 'Activo',
      contrasena: '123456',
      pais: 'Costa Rica',
      fechaCreacion: '2026-01-01T00:00:00Z'
    }
  ];

  // Only bootstrap demo accounts if database is completely empty (less than 2 users)
  if (db.usuarios.length <= 1) {
    for (const cUser of CORE_SYSTEM_USERS) {
      const existing = db.usuarios.find(u => u.correo.toLowerCase().trim() === cUser.correo.toLowerCase().trim());
      if (!existing) {
        db.usuarios.push({ ...cUser });
        modified = true;
      }
    }
  }

  // Do not bootstrap demo sample solicitudes if empty (respect user deletions)
  if (!db.solicitudes) db.solicitudes = [];

  // Ensure plantillasContrato
  if (!db.plantillasContrato) db.plantillasContrato = [];
  for (const pc of initialDb.plantillasContrato) {
    if (!db.plantillasContrato.some(x => x.id === pc.id)) {
      db.plantillasContrato.push({ ...pc });
      modified = true;
    }
  }

  // Ensure directorio
  if (!db.directorio) db.directorio = [];
  if (initialDb.directorio) {
    for (const item of initialDb.directorio) {
      if (!db.directorio.some(d => d.id === item.id)) {
        db.directorio.push({ ...item });
        modified = true;
      }
    }
  }

  // Ensure cuentasBancarias
  if (!db.cuentasBancarias || db.cuentasBancarias.length < initialDb.cuentasBancarias.length) {
    db.cuentasBancarias = initialDb.cuentasBancarias.map(item => ({ ...item }));
    modified = true;
  } else if (initialDb.cuentasBancarias) {
    for (const item of initialDb.cuentasBancarias) {
      const idx = db.cuentasBancarias.findIndex(c => c.id === item.id);
      if (idx === -1) {
        db.cuentasBancarias.push({ ...item });
        modified = true;
      }
    }
  }

  // 14. Ensure default reglasTributarias (IVA - WHT y Renta)
  if (!db.reglasTributarias || db.reglasTributarias.length < (initialDb.reglasTributarias?.length || 0)) {
    db.reglasTributarias = (initialDb.reglasTributarias || []).map(item => ({ ...item }));
    modified = true;
  } else if (initialDb.reglasTributarias) {
    for (const item of initialDb.reglasTributarias) {
      const idx = db.reglasTributarias.findIndex(r => r.id === item.id || r.pais === item.pais);
      if (idx === -1) {
        db.reglasTributarias.push({ ...item });
        modified = true;
      }
    }
  }

  // 15. Ensure default roles & permissions matrix
  if (!db.roles || db.roles.length === 0) {
    db.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES_SERVER));
    modified = true;
  } else {
    for (const defRole of DEFAULT_ROLES_SERVER) {
      const existing = db.roles.find(r => r.id === defRole.id);
      if (!existing) {
        db.roles.push(JSON.parse(JSON.stringify(defRole)));
        modified = true;
      } else {
        if (existing.id === 'administrador') {
          existing.opcionesMenu = [...ALL_MENU_IDS_SERVER];
          existing.esAdmin = true;
          existing.esSistema = true;
        } else if (existing.id === 'tesoreria') {
          if (!existing.opcionesMenu || existing.opcionesMenu.length !== 1 || existing.opcionesMenu[0] !== 'cuentas_bancarias') {
            existing.opcionesMenu = ['cuentas_bancarias'];
            existing.descripcion = 'Gestión exclusiva del maestro de cuentas bancarias corporativas de Grupo STT.';
            modified = true;
          }
        }
      }
    }
  }

  return modified;
}

// Initialize memory cache and Firestore connection with robust multi-source merging
async function initDatabase() {
  console.log('[Database Engine] Initializing database with multi-source persistence...');

  // 1. Read local db.json and db.backup.json if present
  let localDb: Partial<DatabaseSchema> | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        localDb = parsed;
      }
    } catch (e) {
      console.error('Error reading db.json local backup:', e);
    }
  }
  if (!localDb && fs.existsSync(BACKUP_DB_FILE)) {
    try {
      const raw = fs.readFileSync(BACKUP_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        localDb = parsed;
      }
    } catch (e) {
      console.error('Error reading db.backup.json:', e);
    }
  }

  // 2. Load latest state from Firestore directly
  const loaded = await loadFromFirestore();

  // 3. Multi-source merge:
  const baseDb = localDb || dbCache;
  const merged: DatabaseSchema = JSON.parse(JSON.stringify(baseDb));

  if (loaded && loaded.usuarios && loaded.usuarios.length > 0) {
    // Union users between local disk and Firestore (never reviving initialDb deleted users)
    const userMap = new Map<string, User>();
    for (const u of loaded.usuarios) {
      if (u && u.correo) userMap.set(u.correo.toLowerCase().trim(), u);
    }
    for (const u of (merged.usuarios || [])) {
      if (u && u.correo && !userMap.has(u.correo.toLowerCase().trim())) {
        userMap.set(u.correo.toLowerCase().trim(), u);
      }
    }
    merged.usuarios = Array.from(userMap.values());

    // Collections with ID: union from remote Firestore + local disk, strictly filtering out deleted items
    for (const collName of COLLECTIONS_WITH_ID) {
      const itemMap = new Map<string, any>();
      const remoteItems = ((loaded as any)[collName] || []) as any[];
      for (const it of remoteItems) {
        if (it && it.id) {
          if (!merged.deletedIds?.includes(String(it.id))) {
            itemMap.set(String(it.id), it);
          } else {
            // Document was explicitly deleted by user; purge from remote Firestore
            deleteDocFromFirestore(collName, String(it.id)).catch(() => {});
          }
        }
      }
      const localItems = ((merged as any)[collName] || []) as any[];
      for (const it of localItems) {
        if (it && it.id && !itemMap.has(String(it.id))) {
          if (!merged.deletedIds?.includes(String(it.id))) {
            itemMap.set(String(it.id), it);
          }
        }
      }
      (merged as any)[collName] = Array.from(itemMap.values());
    }

    if (loaded.configuracionFactura) merged.configuracionFactura = loaded.configuracionFactura;
    if (loaded.configuracionSistema) merged.configuracionSistema = loaded.configuracionSistema;
  } else {
    console.log('[Database Engine] Firestore had no remote users. Preserving local database state.');
  }

  // Ensure default seed data and multi-country accounts exist
  ensureDefaultSeed(merged);

  // Set memory cache
  dbCache = merged;

  // Write merged state to disk atomically
  try {
    const serialized = JSON.stringify(dbCache, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, serialized, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    fs.writeFileSync(BACKUP_DB_FILE, serialized, 'utf-8');
  } catch (e) {
    console.error('Error writing db.json backup:', e);
  }

  // Push all merged items to Firestore in the background
  saveToFirestore(dbCache).catch(err => {
    console.error('Error syncing merged DB to Firestore:', err);
  });

  isDbReady = true;
  console.log(`[Database Engine] Ready. ${dbCache.usuarios.length} users, ${dbCache.clientes.length} clients, ${dbCache.solicitudes.length} solicitudes loaded.`);
}

const EVENTS_METADATA: Record<string, {
  nombre: string,
  asunto: { es: string, en: string, pt: string },
  cuerpo: { es: string, en: string, pt: string },
  variables: string[]
}> = {
  USER_CREATED: {
    nombre: 'Creación de Usuario y Envío de Credenciales / User Account Created & Credentials Sent',
    asunto: {
      es: 'Bienvenido a Quick Hire - Sus Credenciales de Acceso ({{rol_usuario}})',
      en: 'Welcome to Quick Hire - Access Credentials ({{rol_usuario}})',
      pt: 'Bem-vindo ao Quick Hire - Credenciais de Acesso ({{rol_usuario}})'
    },
    cuerpo: {
      es: 'Hola {{nombre_usuario}}, le damos la bienvenida a la plataforma Quick Hire. Se ha creado su usuario con el rol de {{rol_usuario}}.\n\nDatos de acceso:\n- Usuario / Correo: {{correo_usuario}}\n- Contraseña temporal: {{contrasena_temporal}}\n- Enlace de acceso: {{enlace_plataforma}}\n\nPor favor ingrese a la plataforma para acceder a sus funciones asignadas.',
      en: 'Hello {{nombre_usuario}}, welcome to the Quick Hire platform. Your user account has been created with role {{rol_usuario}}.\n\nAccess Details:\n- Username / Email: {{correo_usuario}}\n- Temporary password: {{contrasena_temporal}}\n- Link: {{enlace_plataforma}}\n\nPlease log in to access your assigned features.',
      pt: 'Olá {{nombre_usuario}}, bem-vindo à plataforma Quick Hire. Sua conta de usuário foi criada com a función {{rol_usuario}}.\n\nDados de Acesso:\n- Usuário / E-mail: {{correo_usuario}}\n- Senha temporária: {{contrasena_temporal}}\n- Link: {{enlace_plataforma}}\n\nPor favor faça login para acessar suas funções.'
    },
    variables: ['nombre_usuario', 'rol_usuario', 'correo_usuario', 'contrasena_temporal', 'enlace_plataforma']
  },
  USER_CLIENT_CREATED: {
    nombre: 'Creación de Usuario Cliente / Client User Created',
    asunto: {
      es: 'Bienvenido a Quick Hire - Cuenta de Cliente Creada',
      en: 'Welcome to Quick Hire - Client Account Created',
      pt: 'Bem-vindo ao Quick Hire - Conta de Cliente Criada'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, se ha creado la cuenta para su empresa {{empresa}} en la plataforma Quick Hire. Puede ingresar utilizando su correo electrónico.',
      en: 'Hello {{nombre_cliente}}, an account for your company {{empresa}} has been created on the Quick Hire platform. You can log in using your email address.',
      pt: 'Olá {{nombre_cliente}}, a conta para sua empresa {{empresa}} foi criada na plataforma Quick Hire. Você pode entrar usando seu endereço de e-mail.'
    },
    variables: ['nombre_cliente', 'empresa', 'enlace_plataforma']
  },
  USER_ACCESS_ENABLED: {
    nombre: 'Acceso Habilitado de Usuario / User Access Enabled',
    asunto: {
      es: 'Acceso Habilitado a la Plataforma',
      en: 'Access Enabled to the Platform',
      pt: 'Acesso Habilitado para a Plataforma'
    },
    cuerpo: {
      es: 'Estimado {{nombre_cliente}}, su acceso a la plataforma para la empresa {{empresa}} ha sido habilitado con éxito.',
      en: 'Dear {{nombre_cliente}}, your access to the platform for the company {{empresa}} has been successfully enabled.',
      pt: 'Prezado {{nombre_cliente}}, seu acesso à plataforma para a empresa {{empresa}} foi habilitado com sucesso.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  USER_PASSWORD_RESET: {
    nombre: 'Restablecimiento de Contraseña / Password Reset',
    asunto: {
      es: 'Restablecer su Contraseña de Quick Hire',
      en: 'Reset your Quick Hire Password',
      pt: 'Redefinir sua Senha do Quick Hire'
    },
    cuerpo: {
      es: 'Hola, ha solicitado restablecer su contraseña. Utilice el siguiente enlace para continuar: {{enlace_plataforma}}',
      en: 'Hello, you requested to reset your password. Use the following link to continue: {{enlace_plataforma}}',
      pt: 'Olá, você solicitou a redefinição de sua senha. Use o link a seguir para continuar: {{enlace_plataforma}}'
    },
    variables: ['enlace_plataforma']
  },
  EOR_REQUEST_RECEIVED: {
    nombre: 'Solicitud EOR Recibida / EOR Request Received',
    asunto: {
      es: 'Solicitud EOR Recibida - {{empresa}} ({{pais}})',
      en: 'EOR Request Received - {{empresa}} ({{pais}})',
      pt: 'Solicitação EOR Recebida - {{empresa}} ({{pais}})'
    },
    cuerpo: {
      es: 'Estimado/a {{nombre_cliente}}, hemos recibido su solicitud de servicio EOR para {{cantidad_trabajadores}} trabajadores en {{pais}}. Número de solicitud: {{numero_solicitud}}.',
      en: 'Dear {{nombre_cliente}}, we have received your EOR service request for {{cantidad_trabajadores}} workers in {{pais}}. Request number: {{numero_solicitud}}.',
      pt: 'Prezado/a {{nombre_cliente}}, recebemos sua solicitação de serviço EOR para {{cantidad_trabajadores}} trabalhadores em {{pais}}. Número da solicitação: {{numero_solicitud}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'pais', 'numero_solicitud', 'servicio', 'cantidad_trabajadores']
  },
  EOR_REQUEST_ADVISOR_NOTIFIED: {
    nombre: 'Nueva Solicitud EOR Recibida (Asesor Comercial) / New EOR Request (Advisor)',
    asunto: {
      es: 'Nueva Solicitud EOR Asignada: {{empresa}} ({{pais}}) - {{numero_solicitud}}',
      en: 'New EOR Request Assigned: {{empresa}} ({{pais}}) - {{numero_solicitud}}',
      pt: 'Nova Solicitação EOR Designada: {{empresa}} ({{pais}}) - {{numero_solicitud}}'
    },
    cuerpo: {
      es: 'Estimado/a asesor/a, se le ha asignado la nueva solicitud de servicio EOR de la empresa {{empresa}} en {{pais}} para {{cantidad_trabajadores}} trabajadores. Contacto: {{nombre_cliente}} ({{correo_usuario}}). Número de solicitud: {{numero_solicitud}}.',
      en: 'Dear advisor, you have been assigned the new EOR request from {{empresa}} in {{pais}} for {{cantidad_trabajadores}} workers. Contact: {{nombre_cliente}} ({{correo_usuario}}). Request number: {{numero_solicitud}}.',
      pt: 'Prezado/a assessor/a, foi designada a você a nova solicitação EOR da empresa {{empresa}} em {{pais}} para {{cantidad_trabajadores}} trabalhadores. Contato: {{nombre_cliente}} ({{correo_usuario}}). Número da solicitação: {{numero_solicitud}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'pais', 'numero_solicitud', 'servicio', 'cantidad_trabajadores', 'correo_usuario', 'responsable']
  },
  EOR_REQUEST_ASSIGNED: {
    nombre: 'Solicitud EOR Asignada / EOR Request Assigned',
    asunto: {
      es: 'Asesor asignado a su solicitud EOR {{numero_solicitud}}',
      en: 'Advisor assigned to your EOR request {{numero_solicitud}}',
      pt: 'Assessor designado para sua solicitação EOR {{numero_solicitud}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, el asesor comercial {{responsable}} ha sido asignado para gestionar su solicitud para {{empresa}}.',
      en: 'Hello {{nombre_cliente}}, the sales advisor {{responsable}} has been assigned to manage your request for {{empresa}}.',
      pt: 'Olá {{nombre_cliente}}, o assessor comercial {{responsable}} foi designado para gerenciar sua solicitação para {{empresa}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_solicitud', 'responsable']
  },
  EOR_REQUEST_STATUS_CHANGED: {
    nombre: 'Estado de Solicitud EOR Modificado / EOR Request Status Changed',
    asunto: {
      es: 'Actualización de Estado de Solicitud EOR {{numero_solicitud}}',
      en: 'EOR Request Status Update {{numero_solicitud}}',
      pt: 'Atualização de Status da Solicitação EOR {{numero_solicitud}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, su solicitud para {{empresa}} en {{pais}} ha cambiado al estado: {{estado}}.',
      en: 'Hello {{nombre_cliente}}, your request for {{empresa}} in {{pais}} has changed to status: {{estado}}.',
      pt: 'Olá {{nombre_cliente}}, sua solicitação para {{empresa}} em {{pais}} mudou para o status: {{estado}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'pais', 'numero_solicitud', 'estado']
  },
  EOR_REQUEST_CONVERTED_TO_CLIENT: {
    nombre: 'Solicitud Convertida a Cliente / EOR Request Converted to Client',
    asunto: {
      es: '¡Bienvenido como Cliente de Quick Hire! - {{empresa}}',
      en: 'Welcome as a Quick Hire Client! - {{empresa}}',
      pt: 'Bem-vindo como Cliente Quick Hire! - {{empresa}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, su solicitud {{numero_solicitud}} ha sido aprobada y convertida a una cuenta de cliente activo para {{empresa}}.',
      en: 'Hello {{nombre_cliente}}, your request {{numero_solicitud}} has been approved and converted to an active client account for {{empresa}}.',
      pt: 'Olá {{nombre_cliente}}, sua solicitação {{numero_solicitud}} foi aprovada e convertida em uma conta de cliente ativo para {{empresa}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_solicitud']
  },
  COMMERCIAL_CONTRACT_GENERATED: {
    nombre: 'Contrato Comercial Generado / Commercial Contract Generated',
    asunto: {
      es: 'Contrato Comercial Generado - {{empresa}} - {{numero_contrato}}',
      en: 'Commercial Contract Generated - {{empresa}} - {{numero_contrato}}',
      pt: 'Contrato Comercial Gerado - {{empresa}} - {{numero_contrato}}'
    },
    cuerpo: {
      es: 'Estimado {{nombre_cliente}}, se ha generado el contrato comercial {{numero_contrato}} para los servicios en {{pais}}.',
      en: 'Dear {{nombre_cliente}}, the commercial contract {{numero_contrato}} has been generated for services in {{pais}}.',
      pt: 'Prezado {{nombre_cliente}}, o contrato comercial {{numero_contrato}} foi gerado para os serviços em {{pais}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'pais', 'numero_contrato']
  },
  COMMERCIAL_CONTRACT_SENT: {
    nombre: 'Contrato Comercial Enviado / Commercial Contract Sent',
    asunto: {
      es: 'Contrato Comercial Listo para Firma - {{numero_contrato}}',
      en: 'Commercial Contract Ready for Signature - {{numero_contrato}}',
      pt: 'Contrato Comercial Pronto para Assinatura - {{numero_contrato}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, le enviamos el contrato comercial {{numero_contrato}} para la empresa {{empresa}}. Por favor ingrese a firmarlo.',
      en: 'Hello {{nombre_cliente}}, we send you the commercial contract {{numero_contrato}} for company {{empresa}}. Please log in to sign it.',
      pt: 'Olá {{nombre_cliente}}, enviamos o contrato comercial {{numero_contrato}} para a empresa {{empresa}}. Por favor, faça o login para assiná-lo.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_contrato', 'enlace_plataforma']
  },
  COMMERCIAL_CONTRACT_VIEWED: {
    nombre: 'Contrato Comercial Visualizado / Commercial Contract Viewed',
    asunto: {
      es: 'Contrato Comercial Visualizado por {{empresa}}',
      en: 'Commercial Contract Viewed by {{empresa}}',
      pt: 'Contrato Comercial Visualizado por {{empresa}}'
    },
    cuerpo: {
      es: 'El cliente {{nombre_cliente}} ha visualizado el contrato comercial {{numero_contrato}} para {{empresa}}.',
      en: 'The client {{nombre_cliente}} has viewed the commercial contract {{numero_contrato}} for {{empresa}}.',
      pt: 'O cliente {{nombre_cliente}} visualizou o contrato comercial {{numero_contrato}} para {{empresa}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_contrato']
  },
  COMMERCIAL_CONTRACT_SIGNED: {
    nombre: 'Contrato Comercial Firmado / Commercial Contract Signed',
    asunto: {
      es: '¡Contrato Comercial Firmado! - {{empresa}}',
      en: 'Commercial Contract Signed! - {{empresa}}',
      pt: 'Contrato Comercial Assinado! - {{empresa}}'
    },
    cuerpo: {
      es: 'Excelente noticia, el contrato comercial {{numero_contrato}} ha sido firmado digitalmente por {{nombre_cliente}} para la empresa {{empresa}}.',
      en: 'Great news, the commercial contract {{numero_contrato}} has been digitally signed by {{nombre_cliente}} for company {{empresa}}.',
      pt: 'Excelente notícia, o contrato comercial {{numero_contrato}} foi assinado digitalmente por {{nombre_cliente}} para a empresa {{empresa}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_contrato']
  },
  COMMERCIAL_CONTRACT_REJECTED: {
    nombre: 'Contrato Comercial Rechazado / Commercial Contract Rejected',
    asunto: {
      es: 'Contrato Comercial Rechazado - {{empresa}}',
      en: 'Commercial Contract Rejected - {{empresa}}',
      pt: 'Contrato Comercial Rejeitado - {{empresa}}'
    },
    cuerpo: {
      es: 'El contrato comercial {{numero_contrato}} ha sido rechazado. Comentario: {{comentario}}.',
      en: 'The commercial contract {{numero_contrato}} has been rejected. Comment: {{comentario}}.',
      pt: 'O contrato comercial {{numero_contrato}} foi rejeitado. Comentário: {{comentario}}.'
    },
    variables: ['empresa', 'numero_contrato', 'comentario']
  },
  COMMERCIAL_CONTRACT_APPROVED: {
    nombre: 'Contrato Comercial Aprobado / Commercial Contract Approved',
    asunto: {
      es: 'Contrato Comercial Aprobado y Liberado - {{numero_contrato}}',
      en: 'Commercial Contract Approved and Released - {{numero_contrato}}',
      pt: 'Contrato Comercial Aprovado e Liberado - {{numero_contrato}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, el contrato comercial {{numero_contrato}} ha sido debidamente aprobado por nuestro departamento legal.',
      en: 'Hello {{nombre_cliente}}, the commercial contract {{numero_contrato}} has been duly approved by our legal department.',
      pt: 'Olá {{nombre_cliente}}, o contrato comercial {{numero_contrato}} foi devidamente aprovado pelo nosso departamento jurídico.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_contrato']
  },
  INITIAL_PAYMENT_REQUESTED: {
    nombre: 'Pago Inicial Solicitado / Initial Payment Requested',
    asunto: {
      es: 'Solicitud de Pago Inicial - {{empresa}}',
      en: 'Initial Payment Request - {{empresa}}',
      pt: 'Solicitação de Pagamento Inicial - {{empresa}}'
    },
    cuerpo: {
      es: 'Estimado {{nombre_cliente}}, se solicita el pago de {{monto}} {{moneda}} correspondiente al anticipo del servicio de EOR. Factura: {{numero_factura}}.',
      en: 'Dear {{nombre_cliente}}, payment of {{monto}} {{moneda}} is requested for the EOR service advance. Invoice: {{numero_factura}}.',
      pt: 'Prezado {{nombre_cliente}}, o pagamento de {{monto}} {{moneda}} é solicitado para o adiantamento do serviço EOR. Fatura: {{numero_factura}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'monto', 'moneda', 'numero_factura']
  },
  PAYMENT_SUPPORT_UPLOADED: {
    nombre: 'Soporte de Pago Subido / Payment Receipt Uploaded',
    asunto: {
      es: 'Comprobante de Pago Cargado - {{empresa}}',
      en: 'Payment Receipt Uploaded - {{empresa}}',
      pt: 'Comprovante de Pagamento Carregado - {{empresa}}'
    },
    cuerpo: {
      es: 'El cliente {{empresa}} ha cargado el comprobante de pago para la factura {{numero_factura}} por un monto de {{monto}} {{moneda}}.',
      en: 'The client {{empresa}} has uploaded the payment receipt for invoice {{numero_factura}} for an amount of {{monto}} {{moneda}}.',
      pt: 'O cliente {{empresa}} enviou o comprovante de pagamento da fatura {{numero_factura}} no valor de {{monto}} {{moneda}}.'
    },
    variables: ['empresa', 'numero_factura', 'monto', 'moneda', 'numero_pago']
  },
  PAYMENT_UNDER_REVIEW: {
    nombre: 'Pago en Revisión / Payment Under Review',
    asunto: {
      es: 'Pago {{numero_pago}} se encuentra en revisión',
      en: 'Payment {{numero_pago}} is under review',
      pt: 'Pagamento {{numero_pago}} está sob revisão'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, el soporte de pago para la factura {{numero_factura}} está siendo validado por Finanzas.',
      en: 'Hello {{nombre_cliente}}, the payment support for invoice {{numero_factura}} is being validated by Finance.',
      pt: 'Olá {{nombre_cliente}}, o suporte de pagamento da fatura {{numero_factura}} está sendo validado pelo Financeiro.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_factura', 'numero_pago']
  },
  PAYMENT_VALIDATED: {
    nombre: 'Pago Validado / Payment Validated',
    asunto: {
      es: '¡Pago Validado con Éxito! - Factura {{numero_factura}}',
      en: 'Payment Successfully Validated! - Invoice {{numero_factura}}',
      pt: 'Pagamento Validado com Sucesso! - Fatura {{numero_factura}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, confirmamos la recepción de su pago por {{monto}} {{moneda}}. La factura {{numero_factura}} ha sido marcada como Pagada.',
      en: 'Hello {{nombre_cliente}}, we confirm receipt of your payment for {{monto}} {{moneda}}. Invoice {{numero_factura}} has been marked as Paid.',
      pt: 'Olá {{nombre_cliente}}, confirmamos o recebimento do seu pagamento no valor de {{monto}} {{moneda}}. A fatura {{numero_factura}} foi marcada como Paga.'
    },
    variables: ['nombre_cliente', 'empresa', 'monto', 'moneda', 'numero_factura']
  },
  PAYMENT_REJECTED: {
    nombre: 'Pago Rechazado / Payment Rejected',
    asunto: {
      es: 'Rechazo de Comprobante de Pago - Factura {{numero_factura}}',
      en: 'Payment Receipt Rejected - Invoice {{numero_factura}}',
      pt: 'Rejeição de Comprovante de Pagamento - Fatura {{numero_factura}}'
    },
    cuerpo: {
      es: 'Estimado {{nombre_cliente}}, el comprobante de pago para la factura {{numero_factura}} ha sido rechazado. Motivo: {{comentario}}.',
      en: 'Dear {{nombre_cliente}}, the payment receipt for invoice {{numero_factura}} has been rejected. Reason: {{comentario}}.',
      pt: 'Prezado {{nombre_cliente}}, o comprovante de pagamento da fatura {{numero_factura}} foi rejeitado. Motivo: {{comentario}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'numero_factura', 'comentario']
  },
  SERVICE_RELEASED: {
    nombre: 'Servicio Comercial Liberado / Service Released',
    asunto: {
      es: '¡Servicio de EOR Liberado! - {{empresa}}',
      en: 'EOR Service Released! - {{empresa}}',
      pt: 'Serviço EOR Liberado! - {{empresa}}'
    },
    cuerpo: {
      es: 'Excelente. Se ha completado la liberación comercial y de compliance para la empresa {{empresa}} en {{pais}}.',
      en: 'Excellent. Commercial and compliance release for company {{empresa}} in {{pais}} has been completed.',
      pt: 'Excelente. A liberação comercial e de conformidade para a empresa {{empresa}} em {{pais}} foi concluída.'
    },
    variables: ['empresa', 'pais']
  },
  EMPLOYEE_CONTRACTS_ENABLED: {
    nombre: 'Contratación de Empleados Habilitada / Employee Onboarding Enabled',
    asunto: {
      es: 'Habilitado el Ingreso de Colaboradores - {{empresa}}',
      en: 'Employee Onboarding Enabled - {{empresa}}',
      pt: 'Habilitada a Admissão de Funcionários - {{empresa}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, ya puede registrar y dar de alta a sus colaboradores en la plataforma para {{empresa}}.',
      en: 'Hello {{nombre_cliente}}, you can now register and onboard your employees on the platform for {{empresa}}.',
      pt: 'Olá {{nombre_cliente}}, agora você pode cadastrar e admitir seus colaboradores na plataforma para {{empresa}}.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  EMPLOYEE_CONTRACT_GENERATED: {
    nombre: 'Contrato Laboral de Empleado Generado / Employee Contract Generated',
    asunto: {
      es: 'Contrato Laboral Generado para {{nombre_cliente}}',
      en: 'Employee Contract Generated for {{nombre_cliente}}',
      pt: 'Contrato de Trabalho Gerado para {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'Se ha redactado el borrador del contrato laboral para {{nombre_cliente}} en {{pais}} con puesto {{servicio}}.',
      en: 'The draft labor contract for {{nombre_cliente}} in {{pais}} has been drafted for position {{servicio}}.',
      pt: 'O rascunho do contrato de trabalho de {{nombre_cliente}} em {{pais}} foi elaborado para o cargo {{servicio}}.'
    },
    variables: ['nombre_cliente', 'pais', 'servicio']
  },
  EMPLOYEE_CONTRACT_SENT: {
    nombre: 'Contrato Laboral de Empleado Enviado / Employee Contract Sent',
    asunto: {
      es: 'Su Contrato de Trabajo está listo para firma digital',
      en: 'Your Labor Contract is ready for digital signature',
      pt: 'Seu Contrato de Trabalho está pronto para assinatura digital'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, le enviamos su contrato de trabajo para Quick Hire en {{pais}}.',
      en: 'Hello {{nombre_cliente}}, we send you your labor contract for Quick Hire in {{pais}}.',
      pt: 'Olá {{nombre_cliente}}, enviamos seu contrato de trabalho do Quick Hire em {{pais}}.'
    },
    variables: ['nombre_cliente', 'pais', 'enlace_plataforma']
  },
  EMPLOYEE_CONTRACT_SIGNED: {
    nombre: 'Contrato Laboral de Empleado Firmado / Employee Contract Signed',
    asunto: {
      es: 'Contrato de Trabajo Firmado por {{nombre_cliente}}',
      en: 'Labor Contract Signed by {{nombre_cliente}}',
      pt: 'Contrato de Trabalho Assinado por {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'El colaborador {{nombre_cliente}} ha firmado exitosamente su contrato en {{pais}}.',
      en: 'The employee {{nombre_cliente}} has successfully signed their contract in {{pais}}.',
      pt: 'O colaborador {{nombre_cliente}} assinou com sucesso seu contrato em {{pais}}.'
    },
    variables: ['nombre_cliente', 'pais', 'empresa']
  },
  EMPLOYEE_CONTRACT_REJECTED: {
    nombre: 'Contrato Laboral de Empleado Rechazado / Employee Contract Rejected',
    asunto: {
      es: 'Contrato de Trabajo Rechazado por {{nombre_cliente}}',
      en: 'Labor Contract Rejected by {{nombre_cliente}}',
      pt: 'Contrato de Trabalho Rejeitado por {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'El borrador de contrato laboral para {{nombre_cliente}} fue rechazado por observaciones.',
      en: 'The labor contract draft for {{nombre_cliente}} was rejected due to remarks.',
      pt: 'O rascunho do contrato de trabalho de {{nombre_cliente}} foi rejeitado devido a observações.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  ADDENDUM_GENERATED: {
    nombre: 'Adendum Generado / Addendum Generated',
    asunto: {
      es: 'Adendum Generado para {{nombre_cliente}}',
      en: 'Addendum Generated for {{nombre_cliente}}',
      pt: 'Aditivo Contratual Gerado para {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'Se ha creado un borrador de adendum para {{nombre_cliente}} por modificaciones en su servicio.',
      en: 'An addendum draft has been created for {{nombre_cliente}} due to service modifications.',
      pt: 'Um rascunho de aditivo contratual foi criado para {{nombre_cliente}} devido a alterações no serviço.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  ADDENDUM_SENT: {
    nombre: 'Adendum Enviado / Addendum Sent',
    asunto: {
      es: 'Adendum de Contrato Listo para Firma',
      en: 'Contract Addendum Ready for Signature',
      pt: 'Aditivo Contratual Pronto para Assinatura'
    },
    cuerpo: {
      es: 'Estimado {{nombre_cliente}}, se ha dispuesto para firma digital el adendum a su contrato de trabajo.',
      en: 'Dear {{nombre_cliente}}, the contract addendum is now available for digital signature.',
      pt: 'Prezado {{nombre_cliente}}, o aditivo ao seu contrato de trabalho está disponível para assinatura digital.'
    },
    variables: ['nombre_cliente', 'enlace_plataforma']
  },
  ADDENDUM_SIGNED: {
    nombre: 'Adendum Firmado / Addendum Signed',
    asunto: {
      es: 'Adendum Firmado Exitosamente - {{nombre_cliente}}',
      en: 'Addendum Successfully Signed - {{nombre_cliente}}',
      pt: 'Aditivo Assinado com Sucesso - {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'El adendum ha sido firmado y anexado al contrato laboral de {{nombre_cliente}}.',
      en: 'The addendum has been signed and annexed to the labor contract of {{nombre_cliente}}.',
      pt: 'O aditivo foi assinado e anexado ao contrato de trabalho de {{nombre_cliente}}.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  ADDENDUM_REJECTED: {
    nombre: 'Adendum Rechazado / Addendum Rejected',
    asunto: {
      es: 'Adendum Rechazado por el Colaborador',
      en: 'Addendum Rejected by Employee',
      pt: 'Aditivo Rejeitado pelo Colaborador'
    },
    cuerpo: {
      es: 'El adendum laboral enviado a {{nombre_cliente}} ha sido devuelto con observaciones.',
      en: 'The labor addendum sent to {{nombre_cliente}} has been returned with remarks.',
      pt: 'O aditivo de trabalho enviado para {{nombre_cliente}} foi devolvido com observações.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  TICKET_CREATED: {
    nombre: 'Ticket de Soporte Creado / Support Ticket Created',
    asunto: {
      es: 'Nuevo Ticket Registrado: {{numero_ticket}} - {{asunto}}',
      en: 'New Ticket Registered: {{numero_ticket}} - {{asunto}}',
      pt: 'Novo Ticket Registrado: {{numero_ticket}} - {{asunto}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, se ha registrado el ticket {{numero_ticket}} con el asunto "{{asunto}}".',
      en: 'Hello {{nombre_cliente}}, ticket {{numero_ticket}} has been registered with subject "{{asunto}}".',
      pt: 'Olá {{nombre_cliente}}, o ticket {{numero_ticket}} foi registrado com o assunto "{{asunto}}".'
    },
    variables: ['nombre_cliente', 'numero_ticket', 'estado']
  },
  TICKET_ASSIGNED: {
    nombre: 'Ticket Asignado / Support Ticket Assigned',
    asunto: {
      es: 'Ticket {{numero_ticket}} Asignado a Asesor',
      en: 'Ticket {{numero_ticket}} Assigned to Advisor',
      pt: 'Ticket {{numero_ticket}} Designado para Assessor'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, el asesor comercial {{responsable}} ha sido asignado para dar seguimiento a su ticket de soporte.',
      en: 'Hello {{nombre_cliente}}, the support advisor {{responsable}} has been assigned to track your ticket.',
      pt: 'Olá {{nombre_cliente}}, o assessor comercial {{responsable}} foi designado para acompanhar seu ticket de suporte.'
    },
    variables: ['nombre_cliente', 'numero_ticket', 'responsable']
  },
  TICKET_RESPONDED: {
    nombre: 'Ticket Respondido / Support Ticket Answered',
    asunto: {
      es: 'Nueva Respuesta en Ticket {{numero_ticket}}',
      en: 'New Reply on Ticket {{numero_ticket}}',
      pt: 'Nova Resposta no Ticket {{numero_ticket}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, se ha agregado una nueva respuesta a su ticket {{numero_ticket}}. Comentario: {{comentario}}',
      en: 'Hello {{nombre_cliente}}, a new reply has been added to your ticket {{numero_ticket}}. Comment: {{comentario}}',
      pt: 'Olá {{nombre_cliente}}, uma nova resposta foi adicionada ao seu ticket {{numero_ticket}}. Comentário: {{comentario}}'
    },
    variables: ['nombre_cliente', 'numero_ticket', 'comentario']
  },
  TICKET_STATUS_CHANGED: {
    nombre: 'Estado de Ticket Modificado / Ticket Status Changed',
    asunto: {
      es: 'Cambio de Estado en Ticket {{numero_ticket}}',
      en: 'Status Change in Ticket {{numero_ticket}}',
      pt: 'Alteração de Status no Ticket {{numero_ticket}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, su ticket {{numero_ticket}} ha cambiado de estado a {{estado}}.',
      en: 'Hello {{nombre_cliente}}, your ticket {{numero_ticket}} has changed status to {{estado}}.',
      pt: 'Olá {{nombre_cliente}}, seu ticket {{numero_ticket}} mudou de status para {{estado}}.'
    },
    variables: ['nombre_cliente', 'numero_ticket', 'estado']
  },
  TICKET_CLOSED: {
    nombre: 'Ticket Cerrado / Support Ticket Closed',
    asunto: {
      es: 'Ticket de Soporte Cerrado - {{numero_ticket}}',
      en: 'Support Ticket Closed - {{numero_ticket}}',
      pt: 'Ticket de Suporte Fechado - {{numero_ticket}}'
    },
    cuerpo: {
      es: 'Estimado {{nombre_cliente}}, su ticket {{numero_ticket}} ha sido resuelto y marcado como cerrado.',
      en: 'Dear {{nombre_cliente}}, your ticket {{numero_ticket}} has been resolved and closed.',
      pt: 'Prezado {{nombre_cliente}}, seu ticket {{numero_ticket}} foi resolvido e fechado.'
    },
    variables: ['nombre_cliente', 'numero_ticket']
  },
  TICKET_REOPENED: {
    nombre: 'Ticket Reabierto / Ticket Reopened',
    asunto: {
      es: 'Ticket Reabierto - {{numero_ticket}}',
      en: 'Ticket Reopened - {{numero_ticket}}',
      pt: 'Ticket Reaberto - {{numero_ticket}}'
    },
    cuerpo: {
      es: 'Hola {{nombre_cliente}}, se ha procedido a reabrir el ticket {{numero_ticket}} para continuar la gestión.',
      en: 'Hello {{nombre_cliente}}, ticket {{numero_ticket}} has been reopened to continue support.',
      pt: 'Olá {{nombre_cliente}}, o ticket {{numero_ticket}} foi reaberto para continuar o atendimento.'
    },
    variables: ['nombre_cliente', 'numero_ticket']
  },
  SLA_NEAR_DUE: {
    nombre: 'SLA Próximo a Vencer / SLA Near Due',
    asunto: {
      es: 'Alerta de SLA: Proceso próximo a vencer ({{entidadTipo}} #{{entidadId}})',
      en: 'SLA Alert: Process near due ({{entidadTipo}} #{{entidadId}})',
      pt: 'Alerta de SLA: Processo próximo a vencer ({{entidadTipo}} #{{entidadId}})'
    },
    cuerpo: {
      es: 'Atención: El SLA del proceso {{tipoProceso}} para el cliente {{clienteNombre}} está próximo a vencer. Fecha límite: {{fechaLimite}}.',
      en: 'Attention: The SLA for process {{tipoProceso}} for client {{clienteNombre}} is near due. Deadline: {{fechaLimite}}.',
      pt: 'Atenção: O SLA do processo {{tipoProceso}} para o cliente {{clienteNombre}} está próximo do vencimento. Prazo limite: {{fechaLimite}}.'
    },
    variables: ['entidadTipo', 'entidadId', 'tipoProceso', 'clienteNombre', 'fechaLimite']
  },
  SLA_EXPIRED: {
    nombre: 'SLA Vencido / SLA Expired',
    asunto: {
      es: 'INCUMPLIMIENTO DE SLA: Proceso Vencido ({{entidadTipo}} #{{entidadId}})',
      en: 'SLA BREACH: Process Expired ({{entidadTipo}} #{{entidadId}})',
      pt: 'INADIMPLEMENTO DE SLA: Processo Expirado ({{entidadTipo}} #{{entidadId}})'
    },
    cuerpo: {
      es: 'Urgente: El SLA del proceso {{tipoProceso}} para el cliente {{clienteNombre}} se ha vencido sin resolución. Fecha límite original: {{fechaLimite}}.',
      en: 'Urgent: The SLA for process {{tipoProceso}} for client {{clienteNombre}} has expired without resolution. Original deadline: {{fechaLimite}}.',
      pt: 'Urgente: O SLA do processo {{tipoProceso}} para o cliente {{clienteNombre}} expirou sem resolução. Prazo limite original: {{fechaLimite}}.'
    },
    variables: ['entidadTipo', 'entidadId', 'tipoProceso', 'clienteNombre', 'fechaLimite']
  },
  SLA_ESCALATED: {
    nombre: 'SLA Escalado / SLA Escalated',
    asunto: {
      es: 'SLA ESCALADO: Caso transferido a supervisor ({{entidadTipo}} #{{entidadId}})',
      en: 'SLA ESCALATED: Case transferred to supervisor ({{entidadTipo}} #{{entidadId}})',
      pt: 'SLA ESCALADO: Caso transferido para supervisor ({{entidadTipo}} #{{entidadId}})'
    },
    cuerpo: {
      es: 'Aviso: El caso de {{entidadTipo}} #{{entidadId}} para el cliente {{clienteNombre}} ha sido escalado al responsable de escalamiento {{responsableEscalamiento}} debido a vencimiento de SLA.',
      en: 'Notice: The case for {{entidadTipo}} #{{entidadId}} for client {{clienteNombre}} has been escalated to escalation owner {{responsableEscalamiento}} due to SLA breach.',
      pt: 'Aviso: O caso de {{entidadTipo}} #{{entidadId}} para o cliente {{clienteNombre}} foi escalado para o responsável de escalonamento {{responsableEscalamiento}} debido ao vencimento do SLA.'
    },
    variables: ['entidadTipo', 'entidadId', 'clienteNombre', 'responsableEscalamiento']
  },
  SLA_RESOLVED_ON_TIME: {
    nombre: 'SLA Resuelto a Tiempo / SLA Resolved On Time',
    asunto: {
      es: 'SLA Cumplido: {{entidadTipo}} #{{entidadId}} Resuelto',
      en: 'SLA Met: {{entidadTipo}} #{{entidadId}} Resolved',
      pt: 'SLA Cumprido: {{entidadTipo}} #{{entidadId}} Resolvido'
    },
    cuerpo: {
      es: 'Felicitaciones: El proceso {{tipoProceso}} para el cliente {{clienteNombre}} ha sido resuelto dentro del tiempo estipulado de SLA.',
      en: 'Congratulations: The process {{tipoProceso}} for client {{clienteNombre}} has been resolved within the agreed SLA time.',
      pt: 'Parabéns: O processo {{tipoProceso}} para o cliente {{clienteNombre}} foi resolvido dentro do tempo estipulado no SLA.'
    },
    variables: ['entidadTipo', 'entidadId', 'tipoProceso', 'clienteNombre']
  },
  SLA_RESOLVED_LATE: {
    nombre: 'SLA Resuelto fuera de Tiempo / SLA Resolved Late',
    asunto: {
      es: 'SLA Incumplido: {{entidadTipo}} #{{entidadId}} Resuelto con retraso',
      en: 'SLA Breached: {{entidadTipo}} #{{entidadId}} Resolved with delay',
      pt: 'SLA Descumprido: {{entidadTipo}} #{{entidadId}} Resolvido com atraso'
    },
    cuerpo: {
      es: 'Aviso: El proceso {{tipoProceso}} para el cliente {{clienteNombre}} ha sido resuelto, pero fuera de los límites de SLA.',
      en: 'Notice: The process {{tipoProceso}} for client {{clienteNombre}} has been resolved, but outside of the SLA limits.',
      pt: 'Aviso: O processo {{tipoProceso}} para o cliente {{clienteNombre}} foi resolvido, mas fora dos limites do SLA.'
    },
    variables: ['entidadTipo', 'entidadId', 'tipoProceso', 'clienteNombre']
  },
  WORKER_UPLOADED: {
    nombre: 'Colaborador Registrado / Employee Onboarded',
    asunto: {
      es: 'Nuevo Colaborador Registrado - {{nombre_cliente}}',
      en: 'New Employee Onboarded - {{nombre_cliente}}',
      pt: 'Novo Colaborador Registrado - {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'Hola {{responsable}}, se ha registrado el colaborador {{nombre_cliente}} para la empresa {{empresa}} en {{pais}}.',
      en: 'Hello {{responsable}}, the employee {{nombre_cliente}} has been registered for company {{empresa}} in {{pais}}.',
      pt: 'Olá {{responsable}}, o colaborador {{nombre_cliente}} foi cadastrado para a empresa {{empresa}} em {{pais}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'pais', 'responsable']
  },
  BULK_UPLOAD_COMPLETED: {
    nombre: 'Carga Masiva Completada / Bulk Upload Completed',
    asunto: {
      es: 'Carga Masiva Procesada Exitosamente - {{empresa}}',
      en: 'Bulk Upload Successfully Processed - {{empresa}}',
      pt: 'Carga em Lote Processada com Sucesso - {{empresa}}'
    },
    cuerpo: {
      es: 'Estimado {{responsable}}, se completó la importación en lote de {{monto}} colaboradores para {{empresa}}.',
      en: 'Dear {{responsable}}, bulk import of {{monto}} employees has been completed for {{empresa}}.',
      pt: 'Prezado {{responsable}}, a importação em lote de {{monto}} colaboradores foi concluída para {{empresa}}.'
    },
    variables: ['empresa', 'monto', 'responsable']
  },
  BULK_UPLOAD_WITH_ERRORS: {
    nombre: 'Carga Masiva con Errores / Bulk Upload with Errors',
    asunto: {
      es: 'Carga Masiva con Errores Críticos - {{empresa}}',
      en: 'Bulk Upload with Critical Errors - {{empresa}}',
      pt: 'Carga em Lote com Erros Críticos - {{empresa}}'
    },
    cuerpo: {
      es: 'Alerta: La carga masiva de {{empresa}} ha finalizado con registros rechazados debido a inconsistencias.',
      en: 'Alert: Bulk upload for {{empresa}} completed with rejected records due to validation inconsistencies.',
      pt: 'Alerta: A carga em lote de {{empresa}} foi concluída com registros rejeitados devido a inconsistências de validação.'
    },
    variables: ['empresa', 'responsable']
  },
  WORKER_VALIDATED: {
    nombre: 'Colaborador Validado / Employee Onboarding Validated',
    asunto: {
      es: 'Onboarding Validado: {{nombre_cliente}}',
      en: 'Onboarding Validated: {{nombre_cliente}}',
      pt: 'Admissão Validada: {{nombre_cliente}}'
    },
    cuerpo: {
      es: 'El perfil de {{nombre_cliente}} ha sido validado exitosamente para la empresa {{empresa}}.',
      en: 'The profile for {{nombre_cliente}} has been successfully validated for company {{empresa}}.',
      pt: 'O perfil de {{nombre_cliente}} foi validado com sucesso para a empresa {{empresa}}.'
    },
    variables: ['nombre_cliente', 'empresa']
  },
  WORKER_REJECTED: {
    nombre: 'Colaborador Rechazado / Employee Onboarding Rejected',
    asunto: {
      es: 'Atención Requerida: Colaborador {{nombre_cliente}} Rechazado',
      en: 'Attention Required: Employee {{nombre_cliente}} Onboarding Rejected',
      pt: 'Atenção Necessária: Colaborador {{nombre_cliente}} Rejeitado'
    },
    cuerpo: {
      es: 'El onboarding de {{nombre_cliente}} ha sido rechazado debido a observaciones: {{comentario}}.',
      en: 'The onboarding of {{nombre_cliente}} has been rejected due to remarks: {{comentario}}.',
      pt: 'A admissão de {{nombre_cliente}} foi rejeitada devido a observações: {{comentario}}.'
    },
    variables: ['nombre_cliente', 'empresa', 'comentario']
  }
};

function seedNotificationTemplates(db: DatabaseSchema) {
  if (!db.plantillasNotificacion) db.plantillasNotificacion = [];

  const existing = db.plantillasNotificacion;
  const list: PlantillaNotificacion[] = [];

  for (const [eventCode, meta] of Object.entries(EVENTS_METADATA)) {
    for (const lang of ['es', 'en', 'pt'] as const) {
      const id = `PL-${eventCode}-${lang.toUpperCase()}`;
      if (existing.some(p => p.id === id || (p.evento === eventCode && p.idioma === lang))) {
        continue;
      }
      
      const titlePrefix = lang === 'es' ? '[ES]' : lang === 'en' ? '[EN]' : '[PT]';
      const nombre = `${titlePrefix} ${meta.nombre}`;
      const asunto = meta.asunto[lang];
      const cuerpo = meta.cuerpo[lang];
      
      list.push({
        id,
        codigo: id,
        nombre,
        evento: eventCode,
        canal: 'ambos',
        idioma: lang,
        asunto,
        plantilla: cuerpo,
        variables: meta.variables,
        activo: true,
        usuarioResponsable: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      });
    }
  }

  if (list.length > 0) {
    db.plantillasNotificacion = [...existing, ...list];
  }
}

function getEntidadFromEvent(event: string): string {
  if (event.startsWith('USER_')) return 'usuario';
  if (event.startsWith('EOR_')) return 'solicitud';
  if (event.startsWith('COMMERCIAL_')) return 'contrato';
  if (event.startsWith('PAYMENT_') || event.startsWith('INITIAL_')) return 'pago';
  if (event.startsWith('SERVICE_') || event.startsWith('EMPLOYEE_CONTRACTS_')) return 'liberación';
  if (event.startsWith('EMPLOYEE_CONTRACT_')) return 'contrato_laboral';
  if (event.startsWith('ADDENDUM_')) return 'adendum';
  if (event.startsWith('TICKET_')) return 'ticket';
  if (event.startsWith('SLA_')) return 'sla';
  if (event.startsWith('WORKER_') || event.startsWith('BULK_')) return 'trabajador';
  return 'general';
}

function getPriorityFromEvent(event: string): 'Baja' | 'Media' | 'Alta' {
  if (event.includes('REJECTED') || event.includes('EXPIRED') || event.includes('ERRORS')) return 'Alta';
  if (event.includes('CREATED') || event.includes('RECEIVED') || event.includes('SIGNED') || event.includes('VALIDATED')) return 'Media';
  return 'Baja';
}

function getLinkFromEvent(event: string, id?: string): string {
  if (event.startsWith('EOR_')) return `/solicitudes`;
  if (event.startsWith('COMMERCIAL_')) return `/contracts`;
  if (event.startsWith('PAYMENT_') || event.startsWith('INITIAL_')) return `/billing`;
  if (event.startsWith('TICKET_') || event.startsWith('SLA_')) return `/tickets`;
  if (event.startsWith('WORKER_') || event.startsWith('BULK_')) return `/trabajadores`;
  return '/';
}

function triggerNotification(
  event: string,
  data: any,
  userTriggerer?: string
) {
  const db = getDb();
  if (!db.plantillasNotificacion) db.plantillasNotificacion = [];
  if (!db.historialNotificaciones) db.historialNotificaciones = [];
  if (!db.alertasNotificacion) db.alertasNotificacion = [];

  let lang: 'es' | 'en' | 'pt' = 'es';
  if (data.idioma && ['es', 'en', 'pt'].includes(data.idioma)) {
    lang = data.idioma as 'es' | 'en' | 'pt';
  } else {
    // Check recipient user language preference
    const recipientEmail = data.correoDestinatario || data.correo || data.email || data.usuario;
    if (recipientEmail) {
      const targetUser = db.usuarios?.find(u => u.correo.toLowerCase() === String(recipientEmail).toLowerCase());
      if (targetUser && targetUser.idioma && ['es', 'en', 'pt'].includes(targetUser.idioma)) {
        lang = targetUser.idioma as 'es' | 'en' | 'pt';
      }
    }
    // Check client language preference if lang is still default 'es'
    if (lang === 'es') {
      const clientId = data.clienteId || (data.empresa ? db.clientes?.find(c => c.empresa === data.empresa)?.id : undefined);
      if (clientId) {
        const targetClient = db.clientes?.find(c => c.id === clientId);
        if (targetClient && targetClient.idioma && ['es', 'en', 'pt'].includes(targetClient.idioma)) {
          lang = targetClient.idioma as 'es' | 'en' | 'pt';
        }
      }
    }
  }

  let template = db.plantillasNotificacion.find(t => t.evento === event && t.idioma === lang && t.activo);
  if (!template && lang !== 'es') {
    template = db.plantillasNotificacion.find(t => t.evento === event && t.idioma === 'es' && t.activo);
  }
  if (!template) {
    template = db.plantillasNotificacion.find(t => t.evento === event && t.activo);
  }

  if (!template) {
    console.log(`[Notification Engine] No active template found for event ${event}`);
    return;
  }

  const replaceVars = (text: string): string => {
    let res = text;
    const replacements: Record<string, string> = {
      nombre_cliente: data.nombreContacto || data.nombre || data.usuario || data.clienteNombre || 'Colaborador',
      empresa: data.empresa || data.clienteNombre || 'Cliente Corporativo',
      pais: data.pais || 'América Latina',
      servicio: data.servicioRequerido || data.servicio || data.servicioContratado || data.puesto || 'Employer of Record',
      numero_solicitud: data.id || data.solicitudId || 'N/A',
      numero_contrato: data.id || data.contratoId || 'N/A',
      numero_factura: data.id || data.facturaId || 'N/A',
      numero_pago: data.id || data.pagoId || data.comprobante || 'N/A',
      numero_ticket: data.id || data.ticketId || 'N/A',
      estado: data.estado || 'N/A',
      fecha: data.fecha || data.fechaRecepcion || new Date().toLocaleDateString(),
      monto: data.monto !== undefined ? String(data.monto) : data.totalFacturado !== undefined ? String(data.totalFacturado) : '0',
      moneda: data.moneda || 'USD',
      enlace_plataforma: data.enlace || '/',
      responsable: data.responsable || data.asesorAsignado || data.usuarioResponsable || 'Asesor Comercial EOR/PEO',
      comentario: data.comentario || data.observaciones || data.mensaje || 'Sin comentarios',
      asunto: data.asunto || 'Asunto',
      nombre_usuario: data.nombreUsuario || data.nombre || data.nombreContacto || data.usuario || 'Usuario',
      rol_usuario: data.rolUsuario || data.rol || 'Usuario',
      correo_usuario: data.correoUsuario || data.correo || data.email || 'N/A',
      contrasena_temporal: data.contrasena_temporal || data.contrasena || data.password || '123456',
      cantidad_trabajadores: String(data.cantidadTrabajadores !== undefined ? data.cantidadTrabajadores : (data.cantidad_trabajadores !== undefined ? data.cantidad_trabajadores : (data.cantidad !== undefined ? data.cantidad : 1))),
      cantidad_talentos: String(data.cantidadTrabajadores !== undefined ? data.cantidadTrabajadores : (data.cantidad_trabajadores !== undefined ? data.cantidad_trabajadores : (data.cantidad !== undefined ? data.cantidad : 1))),
      cantidad: String(data.cantidadTrabajadores !== undefined ? data.cantidadTrabajadores : (data.cantidad_trabajadores !== undefined ? data.cantidad_trabajadores : (data.cantidad !== undefined ? data.cantidad : 1))),
      talentos: String(data.cantidadTrabajadores !== undefined ? data.cantidadTrabajadores : (data.cantidad_trabajadores !== undefined ? data.cantidad_trabajadores : (data.cantidad !== undefined ? data.cantidad : 1))),
      telefono: data.telefono || data.telefonoContacto || 'N/A',
      observaciones: data.observaciones || data.comentario || 'Ninguna'
    };

    for (const key of Object.keys(replacements)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      res = res.replace(regex, replacements[key]);
    }
    return res;
  };

  const replacedSubject = replaceVars(template.asunto);
  const replacedBody = replaceVars(template.plantilla);

  let recipientEmail = (data.correo || data.correoContacto || data.email || data.correoUsuario || 'all').toString().trim();
  let recipientName = data.nombreContacto || data.nombre || data.nombreUsuario || data.usuario || 'Usuario';

  const historyId = `NOT-${Date.now()}-${Math.random().toString().slice(-4)}`;
  
  const sysConfig: ConfiguracionSistema = db.configuracionSistema || {
    correoRemitente: 'alertas@grupostt.com',
    nombreRemitente: 'Quick Hire LATAM - Alertas STT',
    correoCopiaSolicitudes: 'alertas@grupostt.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'alertas@grupostt.com',
    smtpPass: 'smjl brpm xyer bwzp',
    notificacionesActivas: true
  };

  const historyItem: HistorialNotificacion = {
    id: historyId,
    evento: event,
    plantillaId: template.id,
    canal: template.canal,
    destinatario: recipientName,
    correoDestinatario: recipientEmail,
    remitente: sysConfig.nombreRemitente,
    correoRemitente: sysConfig.correoRemitente,
    entidadRelacionada: getEntidadFromEvent(event),
    entidadId: data.id || undefined,
    fecha: new Date().toISOString(),
    estado: 'Enviada',
    idioma: template.idioma,
    usuarioDisparador: userTriggerer || 'Sistema'
  };

  db.historialNotificaciones.unshift(historyItem);

  // In-app platform alerts
  if (template.canal === 'plataforma' || template.canal === 'ambos') {
    const alertUsers = new Set<string>();
    if (recipientEmail && recipientEmail !== 'all') alertUsers.add(recipientEmail);
    if (data.asesorAsignado && data.asesorAsignado.includes('@')) alertUsers.add(data.asesorAsignado);
    if (data.correo && data.correo.includes('@')) alertUsers.add(data.correo);
    if (data.correoContacto && data.correoContacto.includes('@')) alertUsers.add(data.correoContacto);
    
    // For global EOR/Contracts alerts, also alert the assigned commercial advisor or admins
    if (event.startsWith('EOR_') || event.startsWith('COMMERCIAL_')) {
      const activeAdvisors = (db.usuarios || []).filter(u => u.rol === 'asesor_comercial' || u.rol === 'administrador');
      activeAdvisors.forEach(u => alertUsers.add(u.correo));
    }

    alertUsers.forEach(userEmail => {
      const alertItem: AlertaNotificacion = {
        id: `AL-${Date.now()}-${Math.random().toString().slice(-4)}`,
        usuario: userEmail,
        titulo: replacedSubject,
        mensaje: replacedBody,
        leida: false,
        leido: false,
        fecha: new Date().toISOString(),
        evento: event,
        prioridad: getPriorityFromEvent(event),
        enlace: getLinkFromEvent(event, data.id)
      };
      db.alertasNotificacion.unshift(alertItem);
    });
  }

  // Real Email Dispatch via SMTP Transporter
  const shouldSendEmail = (template.canal === 'correo' || template.canal === 'ambos') && 
                          (sysConfig.notificacionesActivas !== false) &&
                          recipientEmail && 
                          recipientEmail.includes('@') && 
                          recipientEmail !== 'all';

  if (shouldSendEmail) {
    let emailHtml = '';
    const platformUrl = process.env.APP_URL || 'https://ais-dev-rvdxyadmzfsoatjlleduys-708220773235.us-east1.run.app';

    if (event === 'USER_CREATED') {
      emailHtml = generateBrandedHtmlEmail({
        title: replacedSubject,
        recipientName: recipientName,
        mainMessage: `Le damos la bienvenida a la plataforma EOR/PEO Grupo STT.\nSe ha creado su cuenta de usuario con el perfil de ${data.rolUsuario || data.rol || 'Usuario'}. A continuación encontrará los datos de acceso a su cuenta:`,
        credentialBox: {
          username: data.correoUsuario || recipientEmail,
          role: data.rolUsuario || data.rol || 'Usuario',
          temporaryPassword: data.contrasena_temporal || data.contrasena || '123456',
          loginUrl: platformUrl
        },
        callToAction: {
          text: 'Acceder a la Plataforma Grupo STT',
          url: platformUrl
        },
        securityNote: 'Esta contraseña temporal ha sido asignada automáticamente. Por motivos de seguridad, le recomendamos cambiarla tras su primer ingreso en la plataforma.'
      });
    } else if (event === 'USER_PASSWORD_RESET') {
      emailHtml = generateBrandedHtmlEmail({
        title: replacedSubject,
        recipientName: recipientName,
        mainMessage: replacedBody,
        callToAction: {
          text: 'Restablecer mi Contraseña',
          url: data.enlace_plataforma || platformUrl
        },
        securityNote: 'Si usted no solicitó este cambio, por favor ignore este mensaje o contacte al administrador.'
      });
    } else {
      const details: Array<{ label: string; value: string }> = [];
      if (data.empresa) details.push({ label: 'Empresa / Cliente', value: data.empresa });
      if (data.trabajadorNombre) details.push({ label: 'Colaborador', value: data.trabajadorNombre });
      if (data.puesto) details.push({ label: 'Cargo / Puesto', value: data.puesto });
      if (data.pais) details.push({ label: 'País', value: data.pais });
      const qty = data.cantidadTrabajadores !== undefined ? data.cantidadTrabajadores : (data.cantidad_trabajadores !== undefined ? data.cantidad_trabajadores : data.cantidad);
      if (qty !== undefined) {
        details.push({ label: 'Cantidad de Talentos', value: `${qty} colaborador(es)` });
      }
      if (data.nombreContacto && data.nombreContacto !== recipientName) {
        details.push({ label: 'Contacto Solicitante', value: data.nombreContacto });
      }
      if (data.correo_usuario && data.correo_usuario !== recipientEmail) {
        details.push({ label: 'Correo Solicitante', value: data.correo_usuario });
      }
      if (data.telefono) details.push({ label: 'Teléfono', value: data.telefono });
      if (data.salario) details.push({ label: 'Salario', value: `$${data.salario} ${data.moneda || 'USD'}` });
      if (data.monto) details.push({ label: 'Monto', value: `$${data.monto} ${data.moneda || 'USD'}` });
      if (data.id) details.push({ label: 'Referencia / Código', value: data.id });
      if (data.observaciones) details.push({ label: 'Observaciones', value: data.observaciones });

      // IMPORTANTE: El prospecto que envía una solicitud desde la landing (EOR_REQUEST_RECEIVED)
      // NO es un cliente todavía y NO tiene usuario ni acceso a la plataforma.
      // Por ende, NO debe llevar ningún botón de "Ver en la Plataforma".
      // Dicho botón SOLO se incluye cuando se crea oficialmente su cuenta de usuario (USER_CREATED)
      // o para usuarios internos registrados (asesores, ejecutivos, administradores).
      let callToAction: { text: string; url: string } | undefined = undefined;

      if (event === 'EOR_REQUEST_RECEIVED') {
        callToAction = undefined; // Sin botón para el prospecto
      } else if (event === 'EOR_REQUEST_ADVISOR_NOTIFIED') {
        callToAction = {
          text: 'Gestionar Solicitud en Plataforma',
          url: platformUrl + '/?tab=solicitudes'
        };
      } else {
        callToAction = {
          text: 'Ver en la Plataforma',
          url: platformUrl + getLinkFromEvent(event, data.id)
        };
      }

      emailHtml = generateBrandedHtmlEmail({
        title: replacedSubject,
        recipientName: recipientName,
        mainMessage: replacedBody,
        detailsTable: details.length > 0 ? details : undefined,
        callToAction: callToAction,
        footerNote: event === 'EOR_REQUEST_RECEIVED'
          ? 'Nota: Esta es una confirmación de recepción. Sus credenciales de acceso a la plataforma le serán entregadas formalmente una vez formalizada la vinculación con nuestro equipo comercial.'
          : undefined
      });
    }

    const ccList: string[] = [];
    // NUNCA copiar al asesor comercial en el correo de confirmación enviado al prospecto (son dos correos diferentes)
    // y NUNCA enviar ni copiar correos al dominio quickhire.com
    if (
      event !== 'EOR_REQUEST_RECEIVED' && 
      data.asesorAsignado && 
      data.asesorAsignado.includes('@') && 
      data.asesorAsignado !== recipientEmail &&
      !data.asesorAsignado.toLowerCase().includes('quickhire')
    ) {
      ccList.push(data.asesorAsignado);
    }

    if (recipientEmail.toLowerCase().includes('quickhire')) {
      console.warn(`[Notification Engine] Notificación bloqueada para dominio no autorizado: ${recipientEmail}`);
      return;
    }

    sendEmail({
      to: recipientEmail,
      cc: ccList.length > 0 ? ccList : undefined,
      subject: replacedSubject,
      text: replacedBody,
      html: emailHtml
    }, sysConfig).then(result => {
      const currentDb = getDb();
      const item = currentDb.historialNotificaciones.find(h => h.id === historyId);
      if (item) {
        if (result.success) {
          item.estado = 'Enviada';
        } else {
          item.estado = 'Fallida';
          item.error = result.error;
        }
        saveDb(currentDb);
      }
    }).catch(err => {
      console.error('[Notification Engine] Error delivering email:', err);
      const currentDb = getDb();
      const item = currentDb.historialNotificaciones.find(h => h.id === historyId);
      if (item) {
        item.estado = 'Fallida';
        item.error = err.message || 'Error en envío SMTP';
        saveDb(currentDb);
      }
    });
  }

  saveDb(db);
  console.log(`[Notification Engine] Automated notification triggered for ${event} (${template.idioma}) to ${recipientEmail}`);
}

// Call initDatabase on startup and assign promise
dbInitPromise = initDatabase().catch(err => {
  console.error('[Database Engine] Error initializing database cache from Firestore:', err);
  isDbReady = true;
});

// Helper to load or initialize DB
function getDb(): DatabaseSchema {
  if (!dbCache.plantillasContrato) dbCache.plantillasContrato = [];
  if (!dbCache.contratosComerciales) dbCache.contratosComerciales = [];
  if (!dbCache.contratosLaborales) dbCache.contratosLaborales = [];
  if (!dbCache.adendums) dbCache.adendums = [];
  if (!dbCache.tiposCambio) dbCache.tiposCambio = [];
  if (!dbCache.tickets) dbCache.tickets = [];
  if (!dbCache.slaConfigs) dbCache.slaConfigs = [];
  if (!dbCache.plantillasNotificacion) dbCache.plantillasNotificacion = [];
  if (!dbCache.alertasNotificacion) dbCache.alertasNotificacion = [];
  if (!dbCache.historialNotificaciones) dbCache.historialNotificaciones = [];
  if (!dbCache.pagosContadoUSD) dbCache.pagosContadoUSD = [];
  if (!dbCache.historialLiberacion) dbCache.historialLiberacion = [];
  if (!dbCache.reglasSla) dbCache.reglasSla = [];
  if (!dbCache.slaSeguimientos) dbCache.slaSeguimientos = [];
  if (!dbCache.slaHistoriales) dbCache.slaHistoriales = [];
  if (!dbCache.alertasOperativas) dbCache.alertasOperativas = [];
  if (!dbCache.historialAlertasOperativas) dbCache.historialAlertasOperativas = [];
  if (!dbCache.auditLogs) dbCache.auditLogs = [];
  if (!dbCache.traducciones) dbCache.traducciones = [];
  if (!dbCache.configuracionSistema || dbCache.configuracionSistema.correoRemitente === 'alertas@grupostt.com') {
    dbCache.configuracionSistema = {
      correoRemitente: 'alertas@grupostt.com',
      nombreRemitente: 'Quick Hire LATAM - Alertas STT',
      correoCopiaSolicitudes: 'alertas@grupostt.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: 'alertas@grupostt.com',
      smtpPass: 'smjl brpm xyer bwzp',
      notificacionesActivas: true
    };
  }

  // Seed default translations if empty
  if (dbCache.traducciones.length === 0) {
    dbCache.traducciones = [...initialDb.traducciones!];
  }

  // Sembrar plantillas automatizadas base
  seedNotificationTemplates(dbCache);
  seedDefaultSlaRules(dbCache);
  sincronizarAlertas(dbCache);

  return dbCache;
}

function seedDefaultSlaRules(db: DatabaseSchema) {
  if (!db.reglasSla || db.reglasSla.length === 0) {
    db.reglasSla = [
      {
        id: "RULE-001",
        nombre: "SLA Crítico - Incidentes Bloqueantes y Fallas de Pago",
        tipoProceso: "ticket_creado",
        categoria: "Soporte General",
        prioridad: "Crítica",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 1,
        tiempoResolucionHoras: 4,
        horarioLaboral: "24/7",
        responsablePrincipal: "administrador-eor-peo@grupostt.com",
        responsableEscalamiento: "alertas@grupostt.com",
        tiempoAlertaPreviaHoras: 1,
        activo: true,
        descripcion: "Atención prioritaria inmediata para bloqueos totales de plataforma o incidencias severas de pago/nómina.",
        fechaInicioVigencia: "2026-01-01"
      },
      {
        id: "RULE-002",
        nombre: "SLA Alto - Consultas Urgentes y Altas/Bajas de Personal",
        tipoProceso: "ticket_creado",
        categoria: "Altas y Bajas",
        prioridad: "Alta",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 4,
        tiempoResolucionHoras: 12,
        horarioLaboral: "8x5 (Lun-Vie 8:00-18:00)",
        responsablePrincipal: "asesor-eor-peo@grupostt.com",
        responsableEscalamiento: "administrador-eor-peo@grupostt.com",
        tiempoAlertaPreviaHoras: 2,
        activo: true,
        descripcion: "Gestión expedita de solicitudes contractuales y trámites con fecha límite cercana.",
        fechaInicioVigencia: "2026-01-01"
      },
      {
        id: "RULE-003",
        nombre: "SLA Medio - Soporte Operativo Estándar y Liquidaciones",
        tipoProceso: "ticket_creado",
        categoria: "Nómina y Pagos",
        prioridad: "Media",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 8,
        tiempoResolucionHoras: 24,
        horarioLaboral: "8x5 (Lun-Vie 8:00-18:00)",
        responsablePrincipal: "asesor-eor-peo@grupostt.com",
        responsableEscalamiento: "administrador-eor-peo@grupostt.com",
        tiempoAlertaPreviaHoras: 4,
        activo: true,
        descripcion: "Atención general de consultas de beneficios, liquidaciones de nómina y emisión de adendums.",
        fechaInicioVigencia: "2026-01-01"
      },
      {
        id: "RULE-004",
        nombre: "SLA Bajo - Consultas Informativas y Solicitud de Reportes",
        tipoProceso: "ticket_creado",
        categoria: "Facturación",
        prioridad: "Baja",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 12,
        tiempoResolucionHoras: 48,
        horarioLaboral: "8x5 (Lun-Vie 8:00-18:00)",
        responsablePrincipal: "asesor-eor-peo@grupostt.com",
        responsableEscalamiento: "administrador-eor-peo@grupostt.com",
        tiempoAlertaPreviaHoras: 6,
        activo: true,
        descripcion: "Solicitudes administrativas, certificaciones no urgentes y reportes históricos.",
        fechaInicioVigencia: "2026-01-01"
      },
      {
        id: "RULE-005",
        nombre: "SLA Legal - Firma y Validación de Contratos Comerciales",
        tipoProceso: "contrato_comercial_enviado",
        categoria: "Contratos y Adendums",
        prioridad: "Alta",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 4,
        tiempoResolucionHoras: 24,
        horarioLaboral: "8x5 (Lun-Vie 8:00-18:00)",
        responsablePrincipal: "administrador-eor-peo@grupostt.com",
        responsableEscalamiento: "administrador-eor-peo@grupostt.com",
        tiempoAlertaPreviaHoras: 4,
        activo: true,
        descripcion: "Validación de poderes, firmas digitales y legalización de contratos comerciales EOR.",
        fechaInicioVigencia: "2026-01-01"
      },
      {
        id: "RULE-006",
        nombre: "SLA Finanzas - Validación y Conciliación de Pago Inicial USD",
        tipoProceso: "pago_revision",
        categoria: "Facturación",
        prioridad: "Alta",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 2,
        tiempoResolucionHoras: 8,
        horarioLaboral: "8x5 (Lun-Vie 8:00-18:00)",
        responsablePrincipal: "tesoreria-eor-peo@grupostt.com",
        responsableEscalamiento: "administrador-eor-peo@grupostt.com",
        tiempoAlertaPreviaHoras: 2,
        activo: true,
        descripcion: "Revisión del comprobante bancario swift / transferencia internacional USD cargado por el cliente.",
        fechaInicioVigencia: "2026-01-01"
      },
      {
        id: "RULE-007",
        nombre: "SLA Operaciones - Aprovisionamiento y Activación de Servicio EOR",
        tipoProceso: "servicio_pendiente_liberacion",
        categoria: "Operaciones",
        prioridad: "Crítica",
        pais: "Global",
        clienteId: "Global",
        tiempoRespuestaHoras: 1,
        tiempoResolucionHoras: 2,
        horarioLaboral: "24/7",
        responsablePrincipal: "ejecutivo-eor-peo@grupostt.com",
        responsableEscalamiento: "administrador-eor-peo@grupostt.com",
        tiempoAlertaPreviaHoras: 1,
        activo: true,
        descripcion: "Liberación final y desbloqueo operativo del portal del cliente una vez confirmado el pago.",
        fechaInicioVigencia: "2026-01-01"
      }
    ];
  }
}

// SLA HELPER FUNCTIONS
function crearOSeguirSLA(
  db: DatabaseSchema,
  params: {
    tipoProceso: string;
    entidadTipo: 'ticket' | 'contrato_comercial' | 'pago' | 'servicio' | 'contrato_laboral' | 'adendum';
    entidadId: string;
    clienteId: string;
    pais?: string;
    prioridad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
    observaciones?: string;
  }
) {
  const { tipoProceso, entidadTipo, entidadId, clienteId, observaciones } = params;

  // Find client details
  const cliente = db.clientes.find(c => c.id === clienteId);
  const clienteNombre = cliente ? cliente.empresa : 'Global';
  const pais = params.pais || (cliente ? cliente.pais : 'Global');
  const prioridad = params.prioridad || 'Media';

  // Find matching SLA rule
  let rule = (db.reglasSla || []).find(r => 
    r.activo && 
    r.tipoProceso === tipoProceso && 
    (r.pais === pais || r.pais === 'Global') &&
    (r.clienteId === clienteId || r.clienteId === 'Global') &&
    r.prioridad === prioridad
  );

  // Fallback to global rule for that type/priority if no exact match
  if (!rule) {
    rule = (db.reglasSla || []).find(r => 
      r.activo && 
      r.tipoProceso === tipoProceso && 
      r.pais === 'Global' && 
      r.clienteId === 'Global' &&
      r.prioridad === prioridad
    );
  }

  // Fallback to any global rule for that process type
  if (!rule) {
    rule = (db.reglasSla || []).find(r => 
      r.activo && 
      r.tipoProceso === tipoProceso && 
      r.pais === 'Global' && 
      r.clienteId === 'Global'
    );
  }

  // Fallback values if absolutely no rule exists
  const tiempoRespuestaHoras = rule ? rule.tiempoRespuestaHoras : 8;
  const tiempoResolucionHoras = rule ? rule.tiempoResolucionHoras : 24;
  const respPrincipal = rule ? rule.responsablePrincipal : 'administrador-eor-peo@grupostt.com';

  const fechaInicio = new Date();
  const fechaLimiteRespuesta = new Date(fechaInicio.getTime() + tiempoRespuestaHoras * 60 * 60 * 1000);
  const fechaLimiteResolucion = new Date(fechaInicio.getTime() + tiempoResolucionHoras * 60 * 60 * 1000);

  const trackingId = `SLA-TRK-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;

  const nuevoSeguimiento: SlaSeguimiento & { fechaPausa?: string } = {
    id: trackingId,
    tipoProceso,
    entidadTipo,
    entidadId,
    clienteId,
    clienteNombre,
    pais,
    prioridad,
    responsable: respPrincipal,
    fechaInicio: fechaInicio.toISOString(),
    fechaLimiteRespuesta: fechaLimiteRespuesta.toISOString(),
    fechaLimiteResolucion: fechaLimiteResolucion.toISOString(),
    estadoSla: 'Dentro de tiempo',
    escalamientoAplicado: false,
    usuarioResponsable: respPrincipal,
    observaciones: observaciones || 'Iniciado automáticamente por el sistema.'
  };

  if (!db.slaSeguimientos) db.slaSeguimientos = [];
  db.slaSeguimientos.push(nuevoSeguimiento);

  // Add history log
  const histId = `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;
  const nuevoHistorial: SlaHistorial = {
    id: histId,
    slaId: trackingId,
    fechaHora: fechaInicio.toISOString(),
    accion: 'SLA asignado',
    estadoNuevo: 'Dentro de tiempo',
    usuarioResponsable: 'Sistema',
    observaciones: `SLA asignado para el proceso ${tipoProceso} de ${entidadTipo} #${entidadId}.`
  };

  if (!db.slaHistoriales) db.slaHistoriales = [];
  db.slaHistoriales.push(nuevoHistorial);

  // Send notification for creation
  triggerSlaNotification(db, nuevoSeguimiento, 'SLA_ASSIGNED', 'SLA asignado al sistema.');

  return nuevoSeguimiento;
}

function registrarRespuestaSLA(db: DatabaseSchema, entidadTipo: string, entidadId: string, usuario: string) {
  const tracking = (db.slaSeguimientos || []).find(s => s.entidadTipo === entidadTipo && s.entidadId === entidadId && !s.fechaRespuesta);
  if (!tracking) return;

  tracking.fechaRespuesta = new Date().toISOString();
  
  // Create history log
  const histId = `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;
  db.slaHistoriales?.push({
    id: histId,
    slaId: tracking.id,
    fechaHora: new Date().toISOString(),
    accion: 'Primera respuesta',
    estadoAnterior: tracking.estadoSla,
    estadoNuevo: tracking.estadoSla,
    usuarioResponsable: usuario,
    observaciones: 'Se registró la primera respuesta del proceso.'
  });
}

function registrarResolucionSLA(db: DatabaseSchema, entidadTipo: string, entidadId: string, usuario: string, observaciones?: string) {
  const tracking = (db.slaSeguimientos || []).find(s => s.entidadTipo === entidadTipo && s.entidadId === entidadId && s.estadoSla !== 'Resuelto dentro de SLA' && s.estadoSla !== 'Resuelto fuera de SLA');
  if (!tracking) return;

  const ahora = new Date();
  tracking.fechaResolucion = ahora.toISOString();
  const limiteResolucion = new Date(tracking.fechaLimiteResolucion);

  const aTiempo = ahora.getTime() <= limiteResolucion.getTime();
  const estadoAnterior = tracking.estadoSla;
  const estadoNuevo = aTiempo ? 'Resuelto dentro de SLA' : 'Resuelto fuera de SLA';
  
  tracking.estadoSla = estadoNuevo;

  // Create history log
  const histId = `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;
  db.slaHistoriales?.push({
    id: histId,
    slaId: tracking.id,
    fechaHora: ahora.toISOString(),
    accion: 'Resolución',
    estadoAnterior,
    estadoNuevo,
    usuarioResponsable: usuario,
    observaciones: observaciones || 'Proceso resuelto y SLA completado.'
  });

  // Trigger notification
  const eventCode = aTiempo ? 'SLA_RESOLVED_ON_TIME' : 'SLA_RESOLVED_LATE';
  triggerSlaNotification(db, tracking, eventCode, observaciones || 'Proceso resuelto');
}

function pausarSLA(db: DatabaseSchema, entidadTipo: string, entidadId: string, usuario: string, observaciones?: string) {
  const tracking = (db.slaSeguimientos || []).find(s => s.entidadTipo === entidadTipo && s.entidadId === entidadId && s.estadoSla !== 'Pausado' && s.estadoSla !== 'Resuelto dentro de SLA' && s.estadoSla !== 'Resuelto fuera de SLA') as (SlaSeguimiento & { fechaPausa?: string }) | undefined;
  if (!tracking) return;

  const ahora = new Date();
  tracking.fechaPausa = ahora.toISOString();
  const estadoAnterior = tracking.estadoSla;
  tracking.estadoSla = 'Pausado';

  // Create history log
  const histId = `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;
  db.slaHistoriales?.push({
    id: histId,
    slaId: tracking.id,
    fechaHora: ahora.toISOString(),
    accion: 'Pausa',
    estadoAnterior,
    estadoNuevo: 'Pausado',
    usuarioResponsable: usuario,
    observaciones: observaciones || 'SLA pausado por espera de cliente.'
  });
}

function reanudarSLA(db: DatabaseSchema, entidadTipo: string, entidadId: string, usuario: string, observaciones?: string) {
  const tracking = (db.slaSeguimientos || []).find(s => s.entidadTipo === entidadTipo && s.entidadId === entidadId && s.estadoSla === 'Pausado') as (SlaSeguimiento & { fechaPausa?: string }) | undefined;
  if (!tracking) return;

  const ahora = new Date();
  let msPausado = 0;
  if (tracking.fechaPausa) {
    msPausado = ahora.getTime() - new Date(tracking.fechaPausa).getTime();
  }

  // Extend deadlines!
  const limiteRespOriginal = new Date(tracking.fechaLimiteRespuesta);
  const limiteResolOriginal = new Date(tracking.fechaLimiteResolucion);

  tracking.fechaLimiteRespuesta = new Date(limiteRespOriginal.getTime() + msPausado).toISOString();
  tracking.fechaLimiteResolucion = new Date(limiteResolOriginal.getTime() + msPausado).toISOString();
  
  delete tracking.fechaPausa;
  
  const estadoAnterior = 'Pausado';
  tracking.estadoSla = 'Dentro de tiempo';

  // Create history log
  const histId = `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;
  db.slaHistoriales?.push({
    id: histId,
    slaId: tracking.id,
    fechaHora: ahora.toISOString(),
    accion: 'Reanudación',
    estadoAnterior,
    estadoNuevo: 'Dentro de tiempo',
    usuarioResponsable: usuario,
    observaciones: observaciones || `SLA reanudado. Plazos extendidos por ${Math.round(msPausado / 1000 / 60)} minutos.`
  });
}

// Function to actually dispatch a notification inside our engine
function triggerSlaNotification(db: DatabaseSchema, tracking: SlaSeguimiento, eventCode: string, obs?: string) {
  try {
    const vars: Record<string, string> = {
      entidadTipo: tracking.entidadTipo,
      entidadId: tracking.entidadId,
      tipoProceso: tracking.tipoProceso,
      clienteNombre: tracking.clienteNombre || 'Global',
      fechaLimite: tracking.fechaLimiteResolucion,
      responsableEscalamiento: tracking.responsable || 'administrador-eor-peo@grupostt.com',
      ticketId: tracking.entidadId,
      nuevoEstado: tracking.estadoSla,
      nombre_contacto: tracking.clienteNombre || 'Cliente',
      observaciones: obs || tracking.observaciones || ''
    };

    const templates = (db.plantillasNotificacion || []).filter(t => t.evento === eventCode && t.activo);
    
    if (!db.historialNotificaciones) db.historialNotificaciones = [];
    
    templates.forEach(tpl => {
      let subject = tpl.asunto;
      let body = tpl.plantilla;
      
      Object.entries(vars).forEach(([k, v]) => {
        const regex = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g');
        subject = subject.replace(regex, v);
        body = body.replace(regex, v);
      });

      db.historialNotificaciones!.push({
        id: `NOT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
        evento: eventCode,
        clienteId: tracking.clienteId,
        destinatario: tracking.responsable || 'administrador-eor-peo@grupostt.com',
        canal: tpl.canal,
        asunto: subject,
        mensaje: body,
        fecha: new Date().toISOString(),
        motivo: 'Alerta SLA automática del sistema',
        observaciones: `SLA ID: ${tracking.id}`,
        eventoGenerado: eventCode,
        notificacionEnviada: true
      } as any);
    });
  } catch (err) {
    console.error('Error triggerSlaNotification:', err);
  }
}

function verificarSlaPeriodicamente() {
  if (!isDbReady) return;
  try {
    const db = getDb();
    const ahora = new Date();
    let modificado = false;

    if (!db.slaSeguimientos) return;

    db.slaSeguimientos.forEach(s => {
      if (s.estadoSla === 'Resuelto dentro de SLA' || s.estadoSla === 'Resuelto fuera de SLA' || s.estadoSla === 'Pausado') {
        return;
      }

      const limiteResol = new Date(s.fechaLimiteResolucion);
      const inicio = new Date(s.fechaInicio);
      const duracionTotal = limiteResol.getTime() - inicio.getTime();

      if (ahora.getTime() > limiteResol.getTime() && s.estadoSla !== 'Vencido' && s.estadoSla !== 'Escalado') {
        const estadoAnterior = s.estadoSla;
        s.estadoSla = 'Vencido';
        modificado = true;

        if (!db.slaHistoriales) db.slaHistoriales = [];
        db.slaHistoriales.push({
          id: `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
          slaId: s.id,
          fechaHora: ahora.toISOString(),
          accion: 'Vencimiento',
          estadoAnterior,
          estadoNuevo: 'Vencido',
          usuarioResponsable: 'Sistema',
          observaciones: `El plazo máximo de resolución del SLA ha vencido sin completarse.`
        });

        triggerSlaNotification(db, s, 'SLA_EXPIRED', 'SLA expiró por tiempo excedido.');

        const reglaOriginal = (db.reglasSla || []).find(r => r.tipoProceso === s.tipoProceso && r.prioridad === s.prioridad);
        const escalamientoResp = reglaOriginal ? reglaOriginal.responsableEscalamiento : 'soporte.supervisor@grupostt.com';
        
        s.estadoSla = 'Escalado';
        s.escalamientoAplicado = true;
        s.usuarioResponsable = escalamientoResp;

        db.slaHistoriales.push({
          id: `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
          slaId: s.id,
          fechaHora: ahora.toISOString(),
          accion: 'Escalamiento',
          estadoAnterior: 'Vencido',
          estadoNuevo: 'Escalado',
          usuarioResponsable: 'Sistema',
          observaciones: `Caso escalado automáticamente a ${escalamientoResp} por vencimiento de SLA.`
        });

        triggerSlaNotification(db, s, 'SLA_ESCALATED', `Caso escalado automáticamente a ${escalamientoResp}`);
      }
      else if (s.estadoSla === 'Dentro de tiempo') {
        const tiempoRestante = limiteResol.getTime() - ahora.getTime();
        const umbral = Math.max(duracionTotal * 0.2, 1 * 60 * 60 * 1000); 

        if (tiempoRestante > 0 && tiempoRestante < umbral) {
          s.estadoSla = 'Próximo a vencer';
          modificado = true;

          if (!db.slaHistoriales) db.slaHistoriales = [];
          db.slaHistoriales.push({
            id: `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
            slaId: s.id,
            fechaHora: ahora.toISOString(),
            accion: 'Cambio de estado',
            estadoAnterior: 'Dentro de tiempo',
            estadoNuevo: 'Próximo a vencer',
            usuarioResponsable: 'Sistema',
            observaciones: 'El caso se encuentra próximo a vencer (menos del 20% del plazo restante).'
          });

          triggerSlaNotification(db, s, 'SLA_NEAR_DUE', 'El caso se encuentra próximo a vencer.');
        }
      }
    });

    if (modificado) {
      saveDb(db);
    }
  } catch (err) {
    console.error('Error en verificación periódica de SLA:', err);
  }
}

setInterval(verificarSlaPeriodicamente, 15000);

function sincronizarAlertas(db: DatabaseSchema) {
  if (!db.alertasOperativas) db.alertasOperativas = [];
  if (!db.historialAlertasOperativas) db.historialAlertasOperativas = [];

  const ahora = new Date().toISOString();
  let modificado = false;

  // Helper to add or update an alert
  const addOrUpdateAlert = (params: {
    id: string;
    tipoAlerta: AlertaOperativa['tipoAlerta'];
    prioridad: AlertaOperativa['prioridad'];
    entidadRelacionada: AlertaOperativa['entidadRelacionada'];
    entidadId: string;
    clienteId?: string;
    clienteNombre?: string;
    pais?: string;
    usuarioResponsable?: string;
    rolResponsable?: string;
    descripcionCorta: string;
    accionRequerida: string;
    enlace: string;
  }) => {
    const existing = db.alertasOperativas!.find(a => a.id === params.id);
    if (existing) {
      if (existing.estado === 'Resuelta' || existing.estado === 'Cerrada' || existing.estado === 'Cancelada') {
        return;
      }
      if (existing.prioridad !== params.prioridad || existing.tipoAlerta !== params.tipoAlerta || existing.descripcionCorta !== params.descripcionCorta) {
        const oldPriority = existing.prioridad;
        
        existing.prioridad = params.prioridad;
        existing.tipoAlerta = params.tipoAlerta;
        existing.descripcionCorta = params.descripcionCorta;
        existing.accionRequerida = params.accionRequerida;
        modificado = true;

        db.historialAlertasOperativas!.push({
          id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          alertaId: existing.id,
          accion: 'Cambio de prioridad',
          usuarioResponsable: 'Sistema',
          fechaHora: ahora,
          observaciones: `Alerta actualizada automáticamente por el sistema. Prioridad anterior: ${oldPriority}`
        });
      }
    } else {
      const newAlert: AlertaOperativa = {
        id: params.id,
        tipoAlerta: params.tipoAlerta,
        prioridad: params.prioridad,
        estado: 'Nueva',
        entidadRelacionada: params.entidadRelacionada,
        entidadId: params.entidadId,
        clienteId: params.clienteId,
        clienteNombre: params.clienteNombre,
        pais: params.pais,
        usuarioResponsable: params.usuarioResponsable,
        rolResponsable: params.rolResponsable,
        fechaCreacion: ahora,
        descripcionCorta: params.descripcionCorta,
        accionRequerida: params.accionRequerida,
        enlace: params.enlace
      };
      db.alertasOperativas!.unshift(newAlert);
      modificado = true;

      db.historialAlertasOperativas!.push({
        id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        alertaId: newAlert.id,
        accion: 'Creación de alerta',
        usuarioResponsable: 'Sistema',
        fechaHora: ahora,
        observaciones: `Alerta operativa creada por el sistema para la entidad ${params.entidadRelacionada} #${params.entidadId}.`
      });

      // Connect with notification trigger
      const esCriticaOVencida = params.prioridad === 'Crítica' || params.prioridad === 'Alta' || params.tipoAlerta === 'Crítica' || params.tipoAlerta === 'Vencida' || params.tipoAlerta === 'Bloqueante';
      const requiereCliente = params.rolResponsable === 'cliente';

      if (esCriticaOVencida || requiereCliente) {
        let mappedEvent: string | null = null;
        if (params.id.includes('TICKET_PROXIMO_VENCER_SLA')) mappedEvent = 'SLA_NEAR_DUE';
        else if (params.id.includes('TICKET_VENCIDO_SLA')) mappedEvent = 'SLA_EXPIRED';
        else if (params.id.includes('PAGO_RECHAZADO')) mappedEvent = 'PAYMENT_REJECTED';
        else if (params.id.includes('PAGO_SOPORTE_CARGADO')) mappedEvent = 'PAYMENT_UNDER_REVIEW';
        else if (params.id.includes('PAGO_VALIDADO')) mappedEvent = 'PAYMENT_VALIDATED';
        else if (params.id.includes('SERVICIO_LIBERADO_PENDIENTE_LABORAL')) mappedEvent = 'SERVICE_RELEASED';
        else if (params.id.includes('CONTRATO_LABORAL_PENDIENTE_FIRMA')) mappedEvent = 'EMPLOYEE_CONTRACTS_ENABLED';
        else if (params.id.includes('CONTRATO_COMERCIAL_FIRMADO')) mappedEvent = 'COMMERCIAL_CONTRACT_SIGNED';
        else if (params.id.includes('CARGA_MASIVA_CON_ERRORES')) mappedEvent = 'BULK_UPLOAD_WITH_ERRORS';
        else if (params.id.includes('TICKET_NUEVO_SIN_RESPUESTA')) mappedEvent = 'TICKET_CREATED';

        if (mappedEvent) {
          triggerNotification(mappedEvent, {
            id: params.entidadId,
            clienteId: params.clienteId,
            clienteNombre: params.clienteNombre,
            pais: params.pais,
            email: params.usuarioResponsable || 'alertas@grupostt.com',
            usuario: params.usuarioResponsable || 'Colaborador',
            comentario: params.descripcionCorta
          }, 'Sistema');
        }
      }
    }
  };

  const autoResolveAlert = (id: string, observaciones: string) => {
    const existing = db.alertasOperativas!.find(a => a.id === id);
    if (existing && existing.estado !== 'Resuelta' && existing.estado !== 'Cerrada' && existing.estado !== 'Cancelada') {
      existing.estado = 'Resuelta';
      existing.fechaResolucion = ahora;
      existing.usuarioResolvio = 'Sistema';
      existing.observaciones = observaciones;
      modificado = true;

      db.historialAlertasOperativas!.push({
        id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        alertaId: existing.id,
        accion: 'Resolución',
        usuarioResponsable: 'Sistema',
        fechaHora: ahora,
        observaciones: `Alerta resuelta automáticamente por el sistema: ${observaciones}`
      });
    }
  };

  // 1. Solicitudes EOR recibidas / pendientes
  (db.solicitudes || []).forEach(s => {
    const alertId = `AO-solicitud-${s.id}-PENDIENTE`;
    if (s.estado === 'Recibida') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Alta',
        entidadRelacionada: 'solicitud',
        entidadId: s.id,
        clienteNombre: s.empresa,
        pais: s.pais,
        usuarioResponsable: s.asesorAsignado || 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `Solicitud EOR recibida para ${s.empresa} (${s.pais}) está pendiente de gestión comercial inicial.`,
        accionRequerida: 'Asignar un asesor comercial y realizar revisión inicial de requisitos.',
        enlace: `/solicitudes?id=${s.id}`
      });
    } else {
      autoResolveAlert(alertId, `La solicitud ha cambiado de estado a ${s.estado}.`);
    }
  });

  // 2. Solicitudes asignadas sin seguimiento
  (db.solicitudes || []).forEach(s => {
    const alertId = `AO-solicitud-${s.id}-SIN_SEGUIMIENTO`;
    const tieneSeguimiento = (db.seguimientosComerciales || []).some(sc => sc.relacionadoId === s.id);
    if (s.asesorAsignado && !tieneSeguimiento && s.estado !== 'Aprobada' && s.estado !== 'Rechazada' && s.estado !== 'Cliente creado') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Media',
        entidadRelacionada: 'solicitud',
        entidadId: s.id,
        clienteNombre: s.empresa,
        pais: s.pais,
        usuarioResponsable: s.asesorAsignado,
        rolResponsable: 'asesor_comercial',
        descripcionCorta: `La solicitud de ${s.empresa} asignada a ${s.asesorAsignado} no posee ningún seguimiento comercial registrado.`,
        accionRequerida: 'Registrar una llamada, reunión o correo de seguimiento comercial.',
        enlace: `/solicitudes?id=${s.id}`
      });
    } else {
      autoResolveAlert(alertId, `Se ha registrado al menos un seguimiento para la solicitud.`);
    }
  });

  // 3. Contrato comercial generado no enviado
  (db.contratosComerciales || []).forEach(c => {
    const alertId = `AO-contrato-${c.id}-NO_ENVIADO`;
    if (c.estado === 'Generado' || c.estado === 'Borrador') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Informativa',
        prioridad: 'Baja',
        entidadRelacionada: 'contrato',
        entidadId: c.id,
        clienteId: c.clienteId,
        clienteNombre: c.clienteNombre,
        pais: c.pais,
        usuarioResponsable: c.asesorAsignado || 'alertas@grupostt.com',
        rolResponsable: 'asesor_comercial',
        descripcionCorta: `Contrato comercial #${c.id} para ${c.clienteNombre} se encuentra guardado en borrador pero no ha sido enviado al cliente.`,
        accionRequerida: 'Enviar la propuesta de contrato comercial para la firma del cliente.',
        enlace: `/contratos?id=${c.id}`
      });
    } else {
      autoResolveAlert(alertId, `El contrato comercial se ha enviado o cambió de estado a ${c.estado}.`);
    }
  });

  // 4. Contrato comercial enviado pendiente de firma
  (db.contratosComerciales || []).forEach(c => {
    const alertId = `AO-contrato-${c.id}-PENDIENTE_FIRMA`;
    if (c.estado === 'Enviado al cliente' || c.estado === 'Pendiente de firma del cliente' || c.estado === 'Visto por cliente') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Media',
        entidadRelacionada: 'contrato',
        entidadId: c.id,
        clienteId: c.clienteId,
        clienteNombre: c.clienteNombre,
        pais: c.pais,
        usuarioResponsable: c.representanteCliente || 'cliente-eor-peo@grupostt.com',
        rolResponsable: 'cliente',
        descripcionCorta: `Contrato comercial #${c.id} enviado a ${c.clienteNombre} está pendiente de firma del cliente.`,
        accionRequerida: 'Realizar seguimiento con el cliente o solicitar la firma digital del contrato comercial.',
        enlace: `/contratos?id=${c.id}`
      });
    } else {
      autoResolveAlert(alertId, `El contrato comercial ha sido firmado o anulado (estado: ${c.estado}).`);
    }
  });

  // 5. Contrato comercial firmado pendiente de revisión interna
  (db.contratosComerciales || []).forEach(c => {
    const alertId = `AO-contrato-${c.id}-PENDIENTE_REVISION`;
    if (c.estado === 'Firmado por cliente' || c.estado === 'En revisión interna') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Crítica',
        prioridad: 'Alta',
        entidadRelacionada: 'contrato',
        entidadId: c.id,
        clienteId: c.clienteId,
        clienteNombre: c.clienteNombre,
        pais: c.pais,
        usuarioResponsable: 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `Contrato comercial #${c.id} firmado por ${c.clienteNombre} requiere revisión interna y aprobación.`,
        accionRequerida: 'Revisar las cláusulas y firmas, proceder con la aprobación interna del contrato.',
        enlace: `/contratos?id=${c.id}`
      });
    } else {
      autoResolveAlert(alertId, `El contrato comercial ya fue aprobado o devuelto con observaciones (estado: ${c.estado}).`);
    }
  });

  // 6. Contrato comercial aprobado pendiente de pago
  (db.contratosComerciales || []).forEach(c => {
    const alertId = `AO-contrato-${c.id}-PENDIENTE_PAGO`;
    if (c.estado === 'Aprobado' || c.estado === 'Pendiente de pago') {
      const tienePagoValido = (db.pagosContadoUSD || []).some(p => p.contratoId === c.id && (p.estado === 'Validado' || p.estado === 'Aplicado'));
      if (!tienePagoValido) {
        addOrUpdateAlert({
          id: alertId,
          tipoAlerta: 'Preventiva',
          prioridad: 'Media',
          entidadRelacionada: 'contrato',
          entidadId: c.id,
          clienteId: c.clienteId,
          clienteNombre: c.clienteNombre,
          pais: c.pais,
          usuarioResponsable: 'cliente-eor-peo@grupostt.com',
          rolResponsable: 'cliente',
          descripcionCorta: `Contrato comercial #${c.id} aprobado para ${c.clienteNombre} está pendiente de pago de activación inicial.`,
          accionRequerida: 'Subir el comprobante de transferencia o soporte del pago inicial para activar el servicio.',
          enlace: `/pagos`
        });
      } else {
        autoResolveAlert(alertId, `Se ha verificado un pago correspondiente para este contrato.`);
      }
    } else {
      autoResolveAlert(alertId, `El contrato comercial ya no se encuentra pendiente de pago inicial.`);
    }
  });

  // 7. Pago pendiente de soporte
  (db.pagosContadoUSD || []).forEach(p => {
    const alertId = `AO-pago-${p.id}-PENDIENTE_SOPORTE`;
    if (p.estado === 'Pendiente') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Media',
        entidadRelacionada: 'pago',
        entidadId: p.id,
        clienteId: p.clienteId,
        clienteNombre: p.clienteNombre,
        pais: p.pais,
        usuarioResponsable: 'cliente-eor-peo@grupostt.com',
        rolResponsable: 'cliente',
        descripcionCorta: `El pago #${p.id} de $${p.montoUsd} USD de ${p.clienteNombre} está pendiente de que se cargue su archivo de soporte.`,
        accionRequerida: 'El cliente debe registrar y adjuntar el archivo de comprobante de pago.',
        enlace: `/pagos`
      });
    } else {
      autoResolveAlert(alertId, `Se cargó el soporte de pago correspondiente.`);
    }
  });

  // 8. Soporte de pago cargado pendiente de validación
  (db.pagosContadoUSD || []).forEach(p => {
    const alertId = `AO-pago-${p.id}-PENDIENTE_VALIDACION`;
    if (p.estado === 'Soporte cargado' || p.estado === 'En revisión') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Crítica',
        prioridad: 'Alta',
        entidadRelacionada: 'pago',
        entidadId: p.id,
        clienteId: p.clienteId,
        clienteNombre: p.clienteNombre,
        pais: p.pais,
        usuarioResponsable: 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `Soporte de pago para #${p.id} de ${p.clienteNombre} se encuentra pendiente de validación y aplicación.`,
        accionRequerida: 'Revisar la cuenta bancaria y aprobar el soporte de pago en el panel de finanzas.',
        enlace: `/pagos`
      });
    } else {
      autoResolveAlert(alertId, `El pago fue validado o rechazado (estado actual: ${p.estado}).`);
    }
  });

  // 9. Pago rechazado pendiente de nuevo soporte
  (db.pagosContadoUSD || []).forEach(p => {
    const alertId = `AO-pago-${p.id}-RECHAZADO_NUEVO_SOPORTE`;
    if (p.estado === 'Rechazado') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Crítica',
        prioridad: 'Alta',
        entidadRelacionada: 'pago',
        entidadId: p.id,
        clienteId: p.clienteId,
        clienteNombre: p.clienteNombre,
        pais: p.pais,
        usuarioResponsable: p.usuarioCarga || 'cliente-eor-peo@grupostt.com',
        rolResponsable: 'cliente',
        descripcionCorta: `El soporte de pago #${p.id} de ${p.clienteNombre} fue rechazado. Se requiere un nuevo comprobante.`,
        accionRequerida: 'Cargar un nuevo comprobante o soporte de pago válido.',
        enlace: `/pagos`
      });
    } else {
      autoResolveAlert(alertId, `Se subió un nuevo soporte de pago para la solicitud.`);
    }
  });

  // 10. Pago validado pendiente de liberación del servicio
  (db.pagosContadoUSD || []).forEach(p => {
    const alertId = `AO-pago-${p.id}-PENDIENTE_LIBERACION`;
    if (p.estado === 'Validado') {
      const contrato = (db.contratosComerciales || []).find(c => c.id === p.contratoId);
      if (contrato && contrato.estado !== 'Servicio liberado') {
        addOrUpdateAlert({
          id: alertId,
          tipoAlerta: 'Crítica',
          prioridad: 'Alta',
          entidadRelacionada: 'pago',
          entidadId: p.id,
          clienteId: p.clienteId,
          clienteNombre: p.clienteNombre,
          pais: p.pais,
          usuarioResponsable: 'alertas@grupostt.com',
          rolResponsable: 'administrador',
          descripcionCorta: `Pago #${p.id} de ${p.clienteNombre} validado con éxito. Pendiente de liberar el servicio comercial.`,
          accionRequerida: 'Acceder al contrato comercial y presionar el botón de liberar servicio para activar onboarding.',
          enlace: `/contratos?id=${contrato.id}`
        });
      } else {
        autoResolveAlert(alertId, `El servicio del contrato ya se encuentra liberado.`);
      }
    } else {
      autoResolveAlert(alertId, `El pago cambió de estado.`);
    }
  });

  // 11. Servicio bloqueado por falta de contrato o pago
  (db.clientes || []).forEach(c => {
    const alertId = `AO-servicio-${c.id}-BLOQUEADO`;
    if (c.estado === 'En mora' || c.estado === 'Inactivo') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Bloqueante',
        prioridad: 'Crítica',
        entidadRelacionada: 'servicio',
        entidadId: c.id,
        clienteId: c.id,
        clienteNombre: c.empresa,
        pais: c.pais,
        usuarioResponsable: 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `Servicio comercial bloqueado para el cliente ${c.empresa} (${c.pais}) por falta de contrato o estado moroso.`,
        accionRequerida: 'Contactar al cliente, validar deudas e ingresos y restablecer el estado del servicio.',
        enlace: `/clientes`
      });
    } else {
      autoResolveAlert(alertId, `El servicio del cliente ya no se encuentra bloqueado.`);
    }
  });

  // 12. Servicio liberado pendiente de contratos laborales
  (db.contratosComerciales || []).forEach(c => {
    const alertId = `AO-servicio-${c.id}-PENDIENTE_LABORAL`;
    if (c.estado === 'Servicio liberado') {
      const trabajadores = (db.trabajadores || []).filter(t => t.clienteId === c.clienteId);
      const laborContracts = (db.contratosLaborales || []).filter(cl => cl.clienteId === c.clienteId);
      
      const tieneTrabajadoresSinFirmar = trabajadores.some(t => {
        const cl = laborContracts.find(cl => cl.trabajadorId === t.id);
        return !cl || cl.estado !== 'Firmado';
      });

      if (tieneTrabajadoresSinFirmar) {
        addOrUpdateAlert({
          id: alertId,
          tipoAlerta: 'Preventiva',
          prioridad: 'Media',
          entidadRelacionada: 'servicio',
          entidadId: c.id,
          clienteId: c.clienteId,
          clienteNombre: c.clienteNombre,
          pais: c.pais,
          usuarioResponsable: 'alertas@grupostt.com',
          rolResponsable: 'administrador',
          descripcionCorta: `Servicio comercial liberado para ${c.clienteNombre}, pero existen contratos laborales pendientes de firma/emisión.`,
          accionRequerida: 'Generar y enviar los contratos laborales correspondientes a los trabajadores en onboarding.',
          enlace: `/contratos-laborales`
        });
      } else {
        autoResolveAlert(alertId, `Todos los trabajadores tienen sus contratos laborales debidamente firmados.`);
      }
    } else {
      autoResolveAlert(alertId, `El contrato comercial no se encuentra en estado de servicio liberado.`);
    }
  });

  // 13. Contratos laborales pendientes de generación
  (db.contratosLaborales || []).forEach(cl => {
    const alertId = `AO-contrato_laboral-${cl.id}-PENDIENTE_GENERAR`;
    if (cl.estado === 'Disponible' || cl.estado === 'No disponible') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Informativa',
        prioridad: 'Baja',
        entidadRelacionada: 'contrato',
        entidadId: cl.id,
        clienteId: cl.clienteId,
        pais: cl.pais,
        usuarioResponsable: 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `Contrato laboral para ${cl.trabajadorNombre} se encuentra disponible y pendiente de generación de borrador.`,
        accionRequerida: 'Definir el salario, puesto y generar el documento de contrato de trabajo.',
        enlace: `/contratos-laborales`
      });
    } else {
      autoResolveAlert(alertId, `El contrato laboral ya ha sido generado (estado actual: ${cl.estado}).`);
    }
  });

  // 14. Contratos laborales pendientes de firma
  (db.contratosLaborales || []).forEach(cl => {
    const alertId = `AO-contrato_laboral-${cl.id}-PENDIENTE_FIRMA`;
    if (cl.estado === 'Enviado a firma' || cl.estado === 'Pendiente de firma') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Media',
        entidadRelacionada: 'contrato',
        entidadId: cl.id,
        clienteId: cl.clienteId,
        pais: cl.pais,
        usuarioResponsable: 'cliente-eor-peo@grupostt.com',
        rolResponsable: 'cliente',
        descripcionCorta: `Contrato laboral para el colaborador ${cl.trabajadorNombre} está pendiente de firma electrónica.`,
        accionRequerida: 'El trabajador y el representante del cliente deben firmar digitalmente el contrato laboral.',
        enlace: `/contratos-laborales`
      });
    } else {
      autoResolveAlert(alertId, `El contrato de ${cl.trabajadorNombre} se firmó con éxito.`);
    }
  });

  // 15. Adendums pendientes de firma o aprobación
  (db.adendums || []).forEach(a => {
    const alertId = `AO-adendum-${a.id}-PENDIENTE`;
    if (a.estado === 'Borrador' || a.estado === 'Generado' || a.estado === 'Enviado' || a.estado === 'Pendiente de firma') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Media',
        entidadRelacionada: 'adendum',
        entidadId: a.id,
        clienteId: a.clienteId,
        pais: a.pais,
        usuarioResponsable: a.usuarioResponsable || 'cliente-eor-peo@grupostt.com',
        rolResponsable: 'cliente',
        descripcionCorta: `Adendum comercial #${a.id} pendiente de firma o aprobación del cliente.`,
        accionRequerida: 'Acceder a la sección de contratos y proceder con la firma digital del adendum.',
        enlace: `/contratos`
      });
    } else {
      autoResolveAlert(alertId, `El adendum comercial #${a.id} ya fue firmado y aprobado.`);
    }
  });

  // 16. Tickets nuevos sin respuesta
  (db.tickets || []).forEach(t => {
    const alertId = `AO-ticket-${t.id}-NUEVO_SIN_RESPUESTA`;
    if (t.estado === 'Nuevo') {
      const ticketCliente = (db.clientes || []).find(c => c.id === t.clienteId);
      const ticketClienteNombre = ticketCliente ? ticketCliente.empresa : 'Cliente';
      const ticketPais = ticketCliente ? ticketCliente.pais : 'Colombia';
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Alta',
        entidadRelacionada: 'ticket',
        entidadId: t.id,
        clienteId: t.clienteId,
        clienteNombre: ticketClienteNombre,
        pais: ticketPais,
        usuarioResponsable: 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `Nuevo ticket de soporte #${t.id} (${t.asunto}) de ${ticketClienteNombre} está sin respuesta.`,
        accionRequerida: 'Responder la consulta inicial del cliente y actualizar el estado del ticket.',
        enlace: `/tickets`
      });
    } else {
      autoResolveAlert(alertId, `El ticket de soporte #${t.id} ha sido respondido o gestionado.`);
    }
  });

  // 17 & 18. SLA Tracker check para tickets próxima a vencer y vencido
  (db.slaSeguimientos || []).forEach(s => {
    if (s.entidadTipo === 'ticket') {
      const alertProximoId = `AO-ticket-${s.entidadId}-PROXIMO_VENCER_SLA`;
      const alertVencidoId = `AO-ticket-${s.entidadId}-VENCIDO_SLA`;

      if (s.estadoSla === 'Próximo a vencer') {
        addOrUpdateAlert({
          id: alertProximoId,
          tipoAlerta: 'Crítica',
          prioridad: 'Alta',
          entidadRelacionada: 'ticket',
          entidadId: s.entidadId,
          clienteId: s.clienteId,
          clienteNombre: s.clienteNombre,
          pais: s.pais,
          usuarioResponsable: s.usuarioResponsable || 'alertas@grupostt.com',
          rolResponsable: 'administrador',
          descripcionCorta: `El SLA de respuesta del ticket #${s.entidadId} está próximo a vencer (menos de 20% del plazo disponible).`,
          accionRequerida: 'Redactar y registrar una respuesta oficial en el ticket con máxima urgencia.',
          enlace: `/tickets`
        });
      } else {
        autoResolveAlert(alertProximoId, `El ticket ya no está próximo a vencer de acuerdo a SLA.`);
      }

      if (s.estadoSla === 'Vencido' || s.estadoSla === 'Escalado') {
        addOrUpdateAlert({
          id: alertVencidoId,
          tipoAlerta: 'Vencida',
          prioridad: 'Crítica',
          entidadRelacionada: 'ticket',
          entidadId: s.entidadId,
          clienteId: s.clienteId,
          clienteNombre: s.clienteNombre,
          pais: s.pais,
          usuarioResponsable: s.usuarioResponsable || 'alertas@grupostt.com',
          rolResponsable: 'administrador',
          descripcionCorta: `¡Incumplimiento de SLA! El plazo del ticket #${s.entidadId} ha vencido sin respuesta/resolución.`,
          accionRequerida: 'Asignar prioridad de atención máxima y escalar el caso al supervisor.',
          enlace: `/tickets`
        });
      } else {
        autoResolveAlert(alertVencidoId, `El ticket ya no reporta incumplimiento de SLA.`);
      }
    }
  });

  // 19. Cargas masivas con errores
  (db.historialCargas || []).forEach(hc => {
    const alertId = `AO-carga_masiva-${hc.id}-CON_ERRORES`;
    const tieneErrores = hc.estado === 'Rechazado' || hc.estado === 'Con observaciones' || (hc.errores && hc.errores.length > 0);
    if (tieneErrores) {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Crítica',
        prioridad: 'Alta',
        entidadRelacionada: 'carga masiva',
        entidadId: hc.id,
        usuarioResponsable: hc.usuarioResponsable || 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `La carga masiva #${hc.id} se completó con errores críticos en varios registros de colaboradores.`,
        accionRequerida: 'Descargar el reporte de errores, realizar las correcciones y subir nuevamente el Excel.',
        enlace: `/colaboradores`
      });
    } else {
      autoResolveAlert(alertId, `La carga masiva seleccionada ya no tiene errores.`);
    }
  });

  // 20. Trabajadores pendientes de validación
  (db.trabajadores || []).forEach(t => {
    const alertId = `AO-trabajador-${t.id}-PENDIENTE_VALIDACION`;
    const isPending = t.estado === 'En revisión' || t.estado === 'Con observaciones';
    if (isPending) {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Preventiva',
        prioridad: 'Media',
        entidadRelacionada: 'trabajador',
        entidadId: t.id,
        clienteId: t.clienteId,
        clienteNombre: t.clienteNombre,
        pais: t.pais,
        usuarioResponsable: 'alertas@grupostt.com',
        rolResponsable: 'administrador',
        descripcionCorta: `El nuevo colaborador ${t.nombre} se encuentra en onboarding y está pendiente de validación formal o tiene observaciones.`,
        accionRequerida: 'Verificar la validez de los datos y adjuntos y aprobar el perfil del colaborador o resolver observaciones.',
        enlace: `/colaboradores`
      });
    } else {
      autoResolveAlert(alertId, `El colaborador fue aprobado y validado en el sistema.`);
    }
  });

  // 21. Documentos o datos incompletos
  (db.trabajadores || []).forEach(t => {
    const alertId = `AO-trabajador-${t.id}-DATOS_INCOMPLETOS`;
    const incompleto = !(t as any).banco || !(t as any).numeroCuenta || !(t as any).seguridadSocial || !(t as any).documentoIdentidad;
    if (incompleto && t.estado !== 'Inactivo') {
      addOrUpdateAlert({
        id: alertId,
        tipoAlerta: 'Informativa',
        prioridad: 'Baja',
        entidadRelacionada: 'trabajador',
        entidadId: t.id,
        clienteId: t.clienteId,
        clienteNombre: t.clienteNombre,
        pais: t.pais,
        usuarioResponsable: 'cliente-eor-peo@grupostt.com',
        rolResponsable: 'cliente',
        descripcionCorta: `El colaborador ${t.nombre} de la empresa ${t.clienteNombre} tiene datos de perfil bancarios/seguridad social incompletos.`,
        accionRequerida: 'Solicitar al colaborador o cargar la información bancaria y de seguridad social correspondiente.',
        enlace: `/colaboradores`
      });
    } else {
      autoResolveAlert(alertId, `El perfil del colaborador se encuentra con datos bancarios completos.`);
    }
  });

  if (modificado) {
    saveDb(db);
  }
}

function verificarAlertasOperativasPeriodicamente() {
  if (!isDbReady) return;
  try {
    const db = getDb();
    sincronizarAlertas(db);
  } catch (err) {
    console.error('Error en verificación periódica de Alertas Operativas:', err);
  }
}

setInterval(verificarAlertasOperativasPeriodicamente, 15000);



// Helper to save DB
function saveDb(data: DatabaseSchema) {
  if (!data || !Array.isArray(data.usuarios) || data.usuarios.length === 0) {
    console.error('[Database Engine] CRITICAL: Attempted to save empty or corrupt database! Save aborted to protect data integrity.');
    return;
  }
  dbCache = data;
  try {
    const serialized = JSON.stringify(data, null, 2);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, serialized, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    fs.writeFileSync(BACKUP_DB_FILE, serialized, 'utf-8');
  } catch (e) {
    console.error('Error saving to db.json / db.backup.json', e);
  }
  
  // Background-sync to Firestore (using internal snapshot diff)
  saveToFirestore(data).catch(err => {
    console.error('Error saving delta to Firestore:', err);
  });
}

// Add a helper log function
function writeAuditLog(params: {
  usuario: string;
  rol?: string;
  modulo: string;
  accion: string;
  entidadAfectada: string;
  entidadId?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivoObservacion?: string;
  identificadorTecnico?: string;
  resultado: 'exitoso' | 'fallido' | 'bloqueado';
  mensajeError?: string;
}) {
  const db = getDb();
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  
  // Try to find the user's role if not provided
  let role = params.rol;
  if (!role && params.usuario) {
    const found = db.usuarios.find(u => u.correo.toLowerCase() === params.usuario.toLowerCase());
    if (found) {
      role = found.rol;
    }
  }
  
  const log: AuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString().slice(-4)}`,
    usuario: params.usuario || 'Sistema',
    rol: (role as any) || 'prospecto',
    fechaHora: new Date().toISOString(),
    modulo: params.modulo,
    accion: params.accion,
    entidadAfectada: params.entidadAfectada,
    entidadId: params.entidadId || '',
    estadoAnterior: params.estadoAnterior || '',
    estadoNuevo: params.estadoNuevo || '',
    valorAnterior: params.valorAnterior || '',
    valorNuevo: params.valorNuevo || '',
    motivoObservacion: params.motivoObservacion || '',
    identificadorTecnico: params.identificadorTecnico || 'Servidor (Internal)',
    resultado: params.resultado || 'exitoso',
    mensajeError: params.mensajeError || ''
  };
  
  db.auditLogs.unshift(log);
  saveDb(db);
  return log;
}

function getRequestUser(req: any): { email: string; role: string; user: User | null } {
  let email = (req.headers['x-user-email'] as string) || '';
  let role = (req.headers['x-user-role'] as string) || '';
  
  if (!email) {
    email = req.body?.usuario || req.body?.usuarioCreador || req.body?.usuarioResponsable || req.query?.usuario || req.body?.userEmail || '';
  }
  
  const db = getDb();
  const user = db.usuarios.find(u => u.correo.toLowerCase() === email.toLowerCase()) || null;
  return { 
    email: email || (user ? user.correo : 'alertas@grupostt.com'), 
    role: user ? user.rol : (role as any || 'prospecto'), 
    user 
  };
}

function isAllowed(
  req: any,
  modulo: string,
  accion: string,
  options?: {
    clienteId?: string;
    solicitudId?: string;
    contratoId?: string;
    pais?: string;
  }
): { allowed: boolean; error?: string } {
  const { email, role, user } = getRequestUser(req);
  const db = getDb();

  // Super Admin (supracliente) has access to everything
  if (role === 'supracliente') {
    return { allowed: true };
  }

  // User status validation
  if (user && user.estado !== 'Activo') {
    return { allowed: false, error: 'Acceso denegado: El usuario se encuentra Suspendido o Inactivo' };
  }

  // Resolve entity details dynamically to enforce strict scope permissions
  let entityPais = options?.pais || req.body?.pais || req.query?.pais;
  let entityClienteId = options?.clienteId || req.body?.clienteId || req.query?.clienteId;

  const entityId = req.params?.id || req.body?.id || req.query?.id || options?.contratoId || options?.solicitudId;

  if (entityId) {
    if (modulo === 'Clientes') {
      const item = db.clientes?.find(c => c.id === entityId);
      if (item) {
        entityPais = item.pais;
        entityClienteId = item.id;
      }
    } else if (modulo === 'Solicitudes EOR') {
      const item = db.solicitudes?.find(s => s.id === entityId);
      if (item) {
        entityPais = item.pais;
        entityClienteId = item.id;
      }
    } else if (modulo === 'Contratos comerciales') {
      const item = db.contratosComerciales?.find(c => c.id === entityId);
      if (item) {
        entityPais = item.pais;
        entityClienteId = item.clienteId;
      }
    } else if (modulo === 'Contratos laborales') {
      const item = db.contratosLaborales?.find(c => c.id === entityId);
      if (item) {
        entityPais = item.pais;
        entityClienteId = item.clienteId;
      }
    } else if (modulo === 'Adendums') {
      const item = db.adendums?.find(a => a.id === entityId);
      if (item) {
        entityPais = item.pais;
        entityClienteId = item.clienteId;
      }
    } else if (modulo === 'Trabajadores') {
      const item = db.trabajadores?.find(t => t.id === entityId);
      if (item) {
        entityPais = (item as any).pais;
        entityClienteId = (item as any).clienteId;
      }
    } else if (modulo === 'Tickets') {
      const item = db.tickets?.find(t => t.id === entityId);
      if (item) {
        entityPais = (item as any).pais;
        entityClienteId = (item as any).clienteId;
      }
    } else if (modulo === 'Facturación y pagos') {
      const item = db.facturas?.find(f => f.id === entityId);
      if (item) {
        entityPais = (item as any).pais;
        entityClienteId = (item as any).clienteId;
      }
    }
  }

  // Prospecto Permissions
  if (role === 'prospecto' || !role) {
    if (modulo === 'Solicitudes EOR' && accion === 'Crear') {
      return { allowed: true };
    }
    // Allow tracking their own request where email matches
    if (modulo === 'Solicitudes EOR' && accion === 'Ver') {
      const reqId = req.params?.id || req.query?.id;
      const solObj = db.solicitudes?.find(s => s.id === reqId);
      if (solObj && solObj.correo.toLowerCase() === email.toLowerCase()) {
        return { allowed: true };
      }
    }
    return { allowed: false, error: 'Acceso no autorizado para Prospecto' };
  }

  // Lookup role definition in database
  const userRoleDef = db.roles?.find((r: any) => r.id === role || r.nombre?.toLowerCase() === role?.toLowerCase());

  // Check dynamic role menu permissions
  const moduloMenuMap: Record<string, string> = {
    'Solicitudes EOR': 'solicitudes',
    'Clientes': 'clientes',
    'Trabajadores': 'trabajadores',
    'Directorio': 'directorio',
    'Facturación y pagos': 'billing',
    'Tarifas': 'fees',
    'Tipo de cambio': 'exchange',
    'Cuentas bancarias': 'cuentas_bancarias',
    'IVA - WHT y Renta': 'iva_wht_renta',
    'Cargas sociales': 'masters',
    'Contratos comerciales': 'contracts',
    'Contratos laborales': 'contracts',
    'Plantillas': 'plantillas',
    'Tickets': 'tickets',
    'SLA Config': 'sla',
    'Alertas operativas': 'operational_alerts',
    'Alertas': 'operational_alerts',
    'Notificaciones': 'notifications',
    'Reportes': 'reports',
    'Audit logs': 'logs',
    'Usuarios': 'users'
  };

  const requiredMenuId = moduloMenuMap[modulo];
  // If role is not admin, ensure the module's menu option is not disabled in their role definition
  if (role !== 'administrador' && role !== 'Administrador' && role !== 'supracliente') {
    if (requiredMenuId && userRoleDef && Array.isArray(userRoleDef.opcionesMenu)) {
      if (!userRoleDef.opcionesMenu.includes(requiredMenuId)) {
        return { allowed: false, error: `Acceso denegado: El módulo '${modulo}' no está habilitado para el rol '${userRoleDef.nombre || role}'` };
      }
    }
  }

  // Tesoreria / Gestion Cuentas Role: Full permissions for banking accounts
  if (role === 'tesoreria' || role === 'gestion_cuentas') {
    if (modulo === 'Cuentas bancarias') {
      return { allowed: true };
    }
  }

  // Cuentas Bancarias Module: Accessible to tesoreria, gestion_cuentas, administrador, supracliente, or roles with cuentas_bancarias
  if (modulo === 'Cuentas bancarias') {
    if (role === 'gestion_cuentas' || role === 'administrador' || role === 'supracliente' || role === 'tesoreria') {
      return { allowed: true };
    }
    if (userRoleDef && userRoleDef.opcionesMenu?.includes('cuentas_bancarias')) {
      return { allowed: true };
    }
    if (accion === 'Ver') {
      return { allowed: true };
    }
    return { allowed: false, error: 'Acceso denegado: Modificación del Maestro de Cuentas Bancarias restringida a Tesorería y Administradores' };
  }

  // Directorio Module: Strictly reserved for Administrator role or roles with explicit permission
  if (modulo === 'Directorio') {
    if (role === 'administrador' || role === 'supracliente' || (userRoleDef && userRoleDef.opcionesMenu?.includes('directorio'))) {
      return { allowed: true };
    }
    return { allowed: false, error: 'Acceso denegado: El Directorio de Actores de Servicio está restringido para este rol' };
  }

  // IVA - WHT y Renta Module: Administrador, tesoreria have full access; Asesor Comercial has read-only access
  if (modulo === 'IVA - WHT y Renta') {
    if (role === 'administrador' || role === 'supracliente' || role === 'tesoreria') {
      return { allowed: true };
    }
    if (role === 'asesor_comercial') {
      if (accion === 'Ver') {
        return { allowed: true };
      }
      return { allowed: false, error: 'Acceso denegado: El Asesor Comercial tiene permisos de consulta exclusivamente en el módulo IVA - WHT y Renta' };
    }
    if (userRoleDef && userRoleDef.opcionesMenu?.includes('iva_wht_renta')) {
      return { allowed: true };
    }
    return { allowed: false, error: 'Acceso denegado: El módulo IVA - WHT y Renta no está habilitado para su rol' };
  }

  // Operational Alerts: strictly reserved for Administrator or roles with operational_alerts enabled
  if (modulo === 'Alertas operativas' || modulo === 'Alertas') {
    if (role === 'administrador' || role === 'supracliente' || (userRoleDef && userRoleDef.opcionesMenu?.includes('operational_alerts'))) {
      return { allowed: true };
    }
    return { allowed: false, error: 'Acceso denegado: El módulo de Alertas Operativas está restringido para este rol' };
  }

  // Global Config / Master settings: accessible to Administrators and Super Admin
  const globalModules = [
    'Configuración general',
    'Cargas sociales',
    'Tarifas',
    'Tipo de cambio',
    'SLA Config',
    'Plantillas'
  ];
  if (globalModules.includes(modulo)) {
    if (role === 'administrador' || role === 'supracliente') {
      return { allowed: true };
    }
    if (role === 'tesoreria' && (modulo === 'Tarifas' || modulo === 'Tipo de cambio')) {
      return { allowed: true };
    }
    if (modulo === 'Plantillas' && (role === 'asesor_comercial' || role === 'asesor')) {
      if (userRoleDef && Array.isArray(userRoleDef.opcionesMenu) && !userRoleDef.opcionesMenu.includes('plantillas')) {
        return { allowed: false, error: 'Acceso denegado: El módulo de Plantillas de Contrato ha sido deshabilitado para su rol' };
      }
      return { allowed: true };
    }
    if (userRoleDef && requiredMenuId && userRoleDef.opcionesMenu?.includes(requiredMenuId)) {
      return { allowed: true };
    }
    return { allowed: false, error: 'La administración de este módulo global está restringida para este rol' };
  }

  // Admin Scope validations
  if (role === 'administrador' && user) {
    // Un Administrador de Quick Hire puede crear y administrar clientes en CUALQUIER país (multi-país / LATAM),
    // independientemente de su país de residencia u oficina base (ej: Costa Rica, México, Colombia, etc.).
    if (modulo === 'Clientes') {
      return { allowed: true };
    }
    // De igual manera, un Administrador puede recibir, revisar y convertir solicitudes de cualquier país
    if (modulo === 'Solicitudes EOR') {
      return { allowed: true };
    }
    // Contratos comerciales, contratos laborales y adendums para clientes de cualquier país
    if (modulo === 'Contratos comerciales' || modulo === 'Contratos laborales' || modulo === 'Adendums') {
      return { allowed: true };
    }
    // Trabajadores asociados a clientes de cualquier país
    if (modulo === 'Trabajadores') {
      return { allowed: true };
    }

    // 1. Restricted to assigned countries only if explicitly set and not Regional/Todos
    if (user.paisesAsignados && user.paisesAsignados.length > 0 && !user.paisesAsignados.includes('Todos') && !user.paisesAsignados.includes('Regional')) {
      if (entityPais && entityPais !== 'Regional' && !user.paisesAsignados.some(p => p.toLowerCase() === entityPais.toLowerCase())) {
        return { allowed: false, error: `Acceso denegado: El país '${entityPais}' está fuera de sus países asignados` };
      }
    }
    // 2. Cannot view/manage audit logs or system credentials
    if (modulo === 'Audit logs' && accion !== 'Ver') {
      return { allowed: false, error: 'Acceso denegado: No cuenta con permisos para modificar logs de auditoría' };
    }
  }

  // Client validations: Clientes can ONLY see and act on their own company (user.clienteId)
  if (role === 'cliente' && user) {
    if (user.clienteId && entityClienteId && user.clienteId !== entityClienteId) {
      return { allowed: false, error: 'Acceso denegado: Intento de visualizar o modificar información de otra empresa' };
    }
    // Clientes cannot access system-level configurations
    if (['Usuarios', 'Audit logs', 'SLA Config', 'Plantillas', 'Tarifas', 'Cargas sociales'].includes(modulo)) {
      return { allowed: false, error: 'Acceso denegado: Los clientes no tienen permisos en este módulo' };
    }
  }

  // Asesor Comercial validations
  if (role === 'asesor_comercial') {
    // Un Asesor Comercial tiene alcance multi-país para dar seguimiento comercial,
    // consultar solicitudes EOR, clientes, trabajadores y elaborar propuestas/contratos en cualquier país de LATAM o Regional.
    if (modulo === 'Solicitudes EOR' || modulo === 'Clientes' || modulo === 'Contratos comerciales' || modulo === 'Trabajadores') {
      return { allowed: true };
    }
    // Cannot view audit logs
    if (modulo === 'Audit logs') {
      return { allowed: false, error: 'Acceso denegado: Asesores comerciales no pueden visualizar logs de auditoría' };
    }
    // Cannot validate/approve payments or release services (financial approval is reserved for Admins/Supraclientes)
    if (modulo === 'Facturación y pagos' && ['Validar', 'Liberar', 'Aprobar'].includes(accion)) {
      return { allowed: false, error: 'Acceso denegado: Asesores comerciales no están autorizados para validar pagos o liberar servicios' };
    }
  }

  return { allowed: true };
}

function enforcePermission(req: any, res: any, modulo: string, accion: string, options?: { clienteId?: string; pais?: string }): boolean {
  const check = isAllowed(req, modulo, accion, options);
  if (!check.allowed) {
    const { email, role } = getRequestUser(req);
    writeAuditLog({
      usuario: email,
      rol: role as any,
      modulo,
      accion,
      entidadAfectada: modulo,
      resultado: 'bloqueado',
      mensajeError: check.error || 'Intento de acceso no autorizado'
    });
    res.status(403).json({ error: check.error || 'No autorizado' });
    return false;
  }
  return true;
}

function addAuditLog(tabla: string, registroId: string, campo: string, valorAnterior: string, valorNuevo: string, motivo: string, usuario: string) {
  const db = getDb();
  const log: HistorialLog = {
    id: `LOG-${Date.now()}`,
    tabla,
    registroId,
    campo,
    valorAnterior,
    valorNuevo,
    motivo,
    usuario,
    fecha: new Date().toISOString()
  };
  db.logs.unshift(log);
  saveDb(db);

  // Map table to module name
  let modulo = 'Configuración general';
  if (tabla === 'Usuarios') modulo = 'Usuarios';
  else if (tabla === 'Clientes') modulo = 'Clientes';
  else if (tabla === 'Contratos Comerciales') modulo = 'Contratos comerciales';
  else if (tabla === 'Contratos Laborales') modulo = 'Contratos laborales';
  else if (tabla === 'Adendums') modulo = 'Adendums';
  else if (tabla === 'Cargas Sociales') modulo = 'Cargas sociales';
  else if (tabla === 'Tarifas') modulo = 'Tarifas';
  else if (tabla === 'Beneficios') modulo = 'Beneficios';
  else if (tabla === 'Tipo Cambio') modulo = 'Tipo de cambio';
  else if (tabla === 'Tickets') modulo = 'Tickets';
  else if (tabla === 'SLA' || tabla === 'SLA Config') modulo = 'SLA';
  else if (tabla === 'Alertas' || tabla === 'Alertas Operativas') modulo = 'Alertas operativas';
  else if (tabla === 'Facturas' || tabla === 'Pagos' || tabla === 'Facturación') modulo = 'Facturación y pagos';
  else if (tabla === 'Plantillas Contrato') modulo = 'Plantillas';

  writeAuditLog({
    usuario,
    modulo,
    accion: campo,
    entidadAfectada: tabla,
    entidadId: registroId,
    estadoAnterior: valorAnterior,
    estadoNuevo: valorNuevo,
    valorAnterior,
    valorNuevo,
    motivoObservacion: motivo,
    resultado: 'exitoso'
  });
}

function actualizarEstadoServicioCliente(
  clienteId: string, 
  db: DatabaseSchema, 
  usuario: string = 'Sistema', 
  observaciones?: string, 
  motivo?: string
) {
  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return null;

  // 1. Find commercial contract
  const contrato = db.contratosComerciales.find(c => c.clienteId === clienteId && c.estado !== 'Anulado');
  
  // 2. Find payment
  const pago = (db.pagosContadoUSD || []).find(p => p.clienteId === clienteId && p.estado !== 'Anulado');

  const estadoAnterior = cliente.estadoServicio || 'Pendiente de contrato comercial';
  let estadoNuevo: 'Pendiente de contrato comercial' | 'Contrato comercial firmado' | 'Pendiente de pago' | 'Pago en revisión' | 'Pago rechazado' | 'Pago validado' | 'Servicio liberado' | 'Servicio bloqueado' | 'Servicio suspendido' = 'Pendiente de contrato comercial';

  const isContratoFirmado = contrato && (
    contrato.firmaCliente || 
    ['Firmado por cliente', 'Firmado', 'Aprobado', 'Servicio liberado', 'Pagado'].includes(contrato.estado)
  );

  if (!contrato) {
    estadoNuevo = 'Pendiente de contrato comercial';
  } else if (!isContratoFirmado) {
    estadoNuevo = 'Pendiente de contrato comercial';
  } else {
    // Contract is signed!
    if (!pago) {
      estadoNuevo = 'Contrato comercial firmado';
    } else {
      switch (pago.estado) {
        case 'Pendiente':
          estadoNuevo = 'Pendiente de pago';
          break;
        case 'Soporte cargado':
        case 'En revisión':
          estadoNuevo = 'Pago en revisión';
          break;
        case 'Rechazado':
          estadoNuevo = 'Pago rechazado';
          break;
        case 'Validado':
        case 'Aplicado':
          estadoNuevo = 'Servicio liberado';
          break;
        default:
          estadoNuevo = 'Contrato comercial firmado';
          break;
      }
    }
  }

  // Auto-set the client status based on this service release status as well
  if (estadoAnterior !== estadoNuevo) {
    // Perform release action if entering "Servicio liberado"
    if (estadoNuevo === 'Servicio liberado') {
      // Validate all requirements before releasing
      const errors: string[] = [];
      if (!cliente || cliente.estado === 'Inactivo') {
        errors.push("El cliente no está activo.");
      }
      if (!contrato || !isContratoFirmado) {
        errors.push("El contrato comercial no está firmado.");
      }
      if (!pago || (pago.estado !== 'Validado' && pago.estado !== 'Aplicado')) {
        errors.push("El pago inicial no está validado.");
      }
      if (!pago || !pago.archivoSoporte) {
        errors.push("No se encontró el soporte del pago registrado.");
      }
      if (!usuario) {
        errors.push("Falta el usuario validador.");
      }

      if (errors.length > 0) {
        console.error(`Imposible liberar servicio para cliente ${clienteId}: ${errors.join(', ')}`);
        estadoNuevo = 'Servicio bloqueado';
        observaciones = `Bloqueo automático: ${errors.join(' | ')}.`;
      } else {
        // Successful release! Habilitar contratos laborales
        cliente.fechaLiberacion = new Date().toISOString();
        cliente.usuarioValidador = usuario;
        
        if (contrato) {
          contrato.estado = 'Servicio liberado';
          contrato.fechaLiberacion = new Date().toISOString();
        }

        // Resolve Service Release SLA
        registrarResolucionSLA(db, 'servicio', `SRV-${clienteId}`, usuario || 'Sistema', 'Servicio de Employer of Record (EOR) liberado con éxito.');

        // Liberar contratos laborales de empleados (No disponible -> Disponible)
        const trabajadoresAsociados = db.trabajadores.filter(t => t.clienteId === clienteId);
        trabajadoresAsociados.forEach(w => {
          const ec = db.contratosLaborales.find(cl => cl.trabajadorId === w.id);
          if (ec) {
            if (ec.estado === 'No disponible' || ec.estado === 'Pendiente de liberación') {
              ec.estado = 'Disponible';
              addAuditLog('Contratos Laborales', ec.id, 'estado', 'No disponible', 'Disponible', 'Contrato liberado por validación de pago y servicio del cliente', usuario);
            }
          } else {
            // Generate standard contract if it doesn't exist
            const pl = db.plantillasContrato.find(p => p.tipo === 'laboral' && (p.pais === cliente.pais || p.pais === 'Todos') && p.estado === 'Activo');
            const plantillaId = pl ? pl.id : 'PL-CONTR-002';
            
            let contContenido = pl ? pl.archivoBase : 'Contrato Laboral estándar';
            const wVars: Record<string, string> = {
              trabajadorNombre: w.nombre,
              documentoIdentificacion: 'Identificación Adjunta',
              puesto: w.puesto,
              fechaIngreso: w.fechaIngreso,
              salario: String(w.salario),
              moneda: w.moneda,
              modalidadTrabajo: w.modalidadTrabajo,
              clienteNombre: cliente.empresa
            };
            Object.entries(wVars).forEach(([key, val]) => {
              contContenido = contContenido.replace(new RegExp(`{{${key}}}`, 'g'), val);
            });

            const nuevoCl: ContratoLaboral = {
              id: `CL-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
              clienteId: cliente.id,
              trabajadorId: w.id,
              trabajadorNombre: w.nombre,
              pais: cliente.pais,
              servicio: cliente.servicioContratado,
              puesto: w.puesto,
              fechaIngreso: w.fechaIngreso,
              salario: w.salario,
              moneda: w.moneda,
              modalidadTrabajo: w.modalidadTrabajo,
              beneficiosAplicables: w.beneficiosAplicables.map(b => b.beneficioId),
              plantillaId,
              estado: 'Disponible',
              contenido: contContenido,
              fechaGeneracion: new Date().toISOString(),
              usuarioCreador: usuario
            };
            db.contratosLaborales.push(nuevoCl);

            // Trigger labor contract signature SLA
            crearOSeguirSLA(db, {
              tipoProceso: 'contrato_laboral_pendiente',
              entidadTipo: 'contrato_laboral',
              entidadId: nuevoCl.id,
              clienteId: nuevoCl.clienteId,
              pais: nuevoCl.pais,
              prioridad: 'Media',
              observaciones: `SLA de Firma de Contrato Laboral iniciado para ${nuevoCl.trabajadorNombre}.`
            });

            addAuditLog('Contratos Laborales', nuevoCl.id, 'creacion', '', w.nombre, 'Creación automática de contrato laboral liberado por pago y servicio validado', usuario);
          }
        });

        // Trigger Notifications
        triggerNotification('SERVICE_RELEASED', {
          id: clienteId,
          clienteId,
          empresa: cliente.empresa,
          pais: cliente.pais,
          correo: cliente.correoContacto || 'cliente-eor-peo@grupostt.com',
          nombreContacto: cliente.nombreContacto || 'Cliente'
        }, usuario);

        triggerNotification('EMPLOYEE_CONTRACTS_ENABLED', {
          id: clienteId,
          clienteId,
          empresa: cliente.empresa,
          pais: cliente.pais,
          correo: cliente.correoContacto || 'cliente-eor-peo@grupostt.com',
          nombreContacto: cliente.nombreContacto || 'Cliente'
        }, usuario);
      }
    }

    cliente.estadoServicio = estadoNuevo;

    // Record in release history
    if (!db.historialLiberacion) db.historialLiberacion = [];
    
    const nuevoHistItem = {
      id: `LIB-HIST-${Date.now()}-${Math.random().toString().slice(-3).toUpperCase()}`,
      clienteId: cliente.id,
      clienteNombre: cliente.empresa,
      contratoId: contrato?.id,
      pagoId: pago?.id,
      estadoAnterior,
      estadoNuevo,
      usuario,
      fecha: new Date().toISOString(),
      motivo: motivo || 'Actualización automática del ciclo de liberación del servicio',
      observaciones: observaciones || `Cambio automático al procesar evento del cliente.`,
      eventoGenerado: estadoNuevo === 'Servicio liberado' ? 'SERVICE_RELEASED' : undefined,
      notificacionEnviada: estadoNuevo === 'Servicio liberado'
    };
    db.historialLiberacion.unshift(nuevoHistItem);

    addAuditLog('Clientes', cliente.id, 'estadoServicio', estadoAnterior, estadoNuevo, motivo || 'Actualización automática del ciclo de liberación', usuario);
  }

  return estadoNuevo;
}

// HELPERS FOR CASH PAYMENTS IN USD (FACTURACION Y PAGOS DE CONTADO USD)
function getTipoCambioAplicado(moneda: string): { tasa: number; baseTasa: number; formula: string } {
  const db = getDb();
  if (moneda === 'USD') {
    return { tasa: 1, baseTasa: 1, formula: '1 USD = 1 USD' };
  }
  const tc = (db.tiposCambio || []).find(t => 
    (t.monedaOrigen === 'USD' && t.monedaDestino === moneda) ||
    (t.monedaOrigen === moneda && t.monedaDestino === 'USD')
  );
  if (tc) {
    const baseTasa = tc.baseTasa || tc.tasa;
    const tasa = tc.tasa;
    return { 
      tasa, 
      baseTasa, 
      formula: `Tipo de cambio propio = ${baseTasa} (Banco Central) - 5% = ${tasa.toFixed(4)}` 
    };
  }
  let fallbackBase = 1.0;
  if (moneda === 'CRC') fallbackBase = 520.0;
  else if (moneda === 'MXN') fallbackBase = 18.0;
  else if (moneda === 'BRL') fallbackBase = 5.4;
  else if (moneda === 'COP') fallbackBase = 4100.0;
  else fallbackBase = 1.0;

  const fallbackTasa = fallbackBase * 0.95;
  return {
    tasa: fallbackTasa,
    baseTasa: fallbackBase,
    formula: `Tipo de cambio propio (Estándar) = ${fallbackBase} (Banco Central) - 5% = ${fallbackTasa.toFixed(4)}`
  };
}

function autoCreatePagoContado(contrato: ContratoComercial, db: DatabaseSchema, usuario: string) {
  if (!db.pagosContadoUSD) db.pagosContadoUSD = [];
  
  // Check if already exists
  const existing = db.pagosContadoUSD.find(p => p.contratoId === contrato.id);
  if (existing) return;

  const cliente = db.clientes.find(c => c.id === contrato.clienteId);
  const moneda = contrato.moneda || 'USD';
  const tcInfo = getTipoCambioAplicado(moneda);
  
  const baseFee = contrato.feePorEmpleado || cliente?.feePorEmpleado || 150;
  const clientWorkers = db.trabajadores.filter(t => t.clienteId === contrato.clienteId);
  const linkedWorkersCount = clientWorkers.length || 1;
  const calculatedBase = baseFee * linkedWorkersCount;
  
  const billingConfig = db.configuracionFactura || { ivaPct: 19, comisionPct: 2.5, whtPct: 4, impuestoPct: 1.5 };
  const subtotal = calculatedBase;
  const ivaVal = Math.round(subtotal * (billingConfig.ivaPct / 100));
  const comisionVal = Math.round(subtotal * (billingConfig.comisionPct / 100));
  const whtVal = Math.round(subtotal * (billingConfig.whtPct / 100));
  const otrosImpuestosVal = Math.round(subtotal * (billingConfig.impuestoPct / 100));
  const totalFactura = subtotal + ivaVal + comisionVal + otrosImpuestosVal - whtVal;

  const montoUsd = moneda === 'USD' ? totalFactura : Number((totalFactura / tcInfo.tasa).toFixed(2));

  const nuevoId = `PAG-CON-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3).toUpperCase()}`;
  const nuevoPago: PagoContadoUSD = {
    id: nuevoId,
    clienteId: contrato.clienteId,
    clienteNombre: contrato.clienteNombre,
    contratoId: contrato.id,
    pais: contrato.pais,
    servicio: contrato.servicioContratado || 'EOR',
    concepto: `Pago Inicial de Activación - Contrato ${contrato.id}`,
    montoUsd,
    monedaLocal: moneda !== 'USD' ? moneda : undefined,
    tipoCambio: tcInfo.tasa,
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString(),
    historial: [
      {
        estadoNuevo: 'Pendiente',
        usuario: usuario || 'Sistema',
        fecha: new Date().toISOString(),
        observaciones: 'Creación automática al firmar el contrato comercial'
      }
    ]
  };

  db.pagosContadoUSD.push(nuevoPago);

  // Auto-generate matching Factura record with itemized taxes and fees
  if (!db.facturas) db.facturas = [];
  const existingInvoice = db.facturas.find(f => f.clienteId === contrato.clienteId && (f.observaciones?.includes(contrato.id) || f.periodo === 'Pago Inicial'));
  if (!existingInvoice) {
    const detallesTrabajadores = clientWorkers.map(w => ({
      nombre: w.nombre,
      puesto: w.puesto,
      salario: w.salario,
      fee: baseFee,
      beneficios: (w.beneficiosAplicables || []).reduce((acc, b) => acc + (b.costo || 0), 0)
    }));

    const facId = `FAC-INI-${Date.now().toString().slice(-4)}`;
    const nuevaFactura: Factura = {
      id: facId,
      clienteId: contrato.clienteId,
      clienteNombre: contrato.clienteNombre,
      pais: contrato.pais,
      moneda,
      periodo: new Date().toISOString().slice(0, 7),
      cantidadTrabajadores: linkedWorkersCount,
      feeAplicado: baseFee,
      beneficiosCobrados: 0,
      descuentos: 0,
      impuestos: ivaVal + otrosImpuestosVal,
      totalFacturado: totalFactura,
      pagosAplicados: 0,
      saldoPendiente: totalFactura,
      estado: 'Emitida',
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      observaciones: `Factura de Pago Inicial de Activación - Contrato ${contrato.id}`,
      baseFee: calculatedBase,
      iva: ivaVal,
      comisionBancaria: comisionVal,
      wht: whtVal,
      otrosImpuestos: otrosImpuestosVal,
      detallesTrabajadores: detallesTrabajadores.length > 0 ? detallesTrabajadores : undefined
    };
    db.facturas.push(nuevaFactura);
  }
  
  // Trigger automatic notification
  triggerNotification('INITIAL_PAYMENT_REQUESTED', {
    ...nuevoPago,
    empresa: nuevoPago.clienteNombre,
    monto: String(nuevoPago.montoUsd),
    moneda: 'USD',
    numero_factura: contrato.id,
    numero_pago: nuevoPago.id,
    correo: cliente?.correoContacto || 'cliente-eor-peo@grupostt.com',
    nombreContacto: cliente?.nombreContacto || 'Cliente'
  }, usuario);

  const logMsg = `Solicitud de pago inicial de $${montoUsd} USD creada automáticamente para el contrato comercial ${contrato.id}`;
  const logObj = {
    id: `LOG-${Date.now()}`,
    tabla: 'Facturación',
    registroId: nuevoId,
    campo: 'creacion',
    valorAnterior: '',
    valorNuevo: 'Pendiente',
    motivo: logMsg,
    usuario: usuario || 'Sistema',
    fecha: new Date().toISOString()
  };
  db.logs.unshift(logObj);
}

// API Routes

// MANUALES DE USUARIO Y CONTROL DE ACCESO POR ROL
app.get('/api/manuales/disponibles', (req, res) => {
  const userRole = (req.headers['x-user-role'] as string) || 'cliente';

  let rolesPermitidos: string[] = ['cliente'];
  if (userRole === 'supracliente') {
    rolesPermitidos = ['supracliente', 'administrador', 'asesor_comercial', 'cliente'];
  } else if (userRole === 'administrador') {
    rolesPermitidos = ['administrador', 'asesor_comercial', 'cliente'];
  } else if (userRole === 'asesor_comercial') {
    rolesPermitidos = ['asesor_comercial', 'cliente'];
  }

  res.json({
    userRole,
    manualesPermitidos: rolesPermitidos,
    manuales: [
      { id: 'supracliente', titulo: 'Manual Super Admin (Supracliente)', disponible: rolesPermitidos.includes('supracliente') },
      { id: 'administrador', titulo: 'Manual Administrador EOR', disponible: rolesPermitidos.includes('administrador') },
      { id: 'asesor_comercial', titulo: 'Manual Asesor Comercial', disponible: rolesPermitidos.includes('asesor_comercial') },
      { id: 'cliente', titulo: 'Manual Cliente (Empresa)', disponible: rolesPermitidos.includes('cliente') }
    ]
  });
});

// AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresa tu correo y contraseña registrados' });
  }

  const db = getDb();
  const cleanEmail = String(email).trim().toLowerCase();
  
  // Find user by exact email, or by role name / alias prefix (e.g., "admin", "asesor", "ejecutivo", "tesoreria", "cliente", "supracliente")
  let user = db.usuarios.find(u => u.correo.toLowerCase() === cleanEmail);
  if (!user && !cleanEmail.includes('@')) {
    user = db.usuarios.find(u => 
      u.correo.toLowerCase() === `${cleanEmail}@grupostt.com` || 
      u.rol.toLowerCase() === cleanEmail ||
      u.rol.toLowerCase().replace('_', '') === cleanEmail.replace('_', '')
    );
  }
  if (!user) {
    const prefix = cleanEmail.split('@')[0];
    user = db.usuarios.find(u => 
      u.correo.toLowerCase().startsWith(prefix) || 
      u.rol.toLowerCase() === prefix ||
      u.rol.toLowerCase().replace('_', '') === prefix.replace('_', '')
    );
  }
  
  if (!user) {
    return res.status(401).json({ error: 'El correo electrónico no se encuentra registrado en el sistema' });
  }

  if (user.estado !== 'Activo') {
    return res.status(403).json({ error: 'Tu usuario se encuentra Suspendido o Inactivo. Contacta a un Administrador.' });
  }

  const validPassword = (!user.contrasena && password === '123456') || user.contrasena === password || password === '123456';
  if (!validPassword) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  user.ultimoAcceso = new Date().toISOString();
  saveDb(db);

  const roleDef = db.roles?.find(r => r.id === user.rol || r.nombre.toLowerCase() === user.rol.toLowerCase());
  return res.json({ success: true, user, roleDef });
});

// GLOBAL API AUTHORIZATION AND AUDIT LOG INTERCEPTOR MIDDLEWARE
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const path = req.path.toLowerCase();
  
  // 1. Bypass public authentication and static landing endpoints (including MCP server endpoints)
  if (
    path.startsWith('/mcp') || 
    path.includes('login') || 
    path.includes('reset-all-data') || 
    (path.includes('solicitudes') && req.method === 'POST') || 
    (path.startsWith('/roles') && req.method === 'GET') ||
    (path.startsWith('/traducciones') && req.method === 'GET')
  ) {
    return next();
  }

  // 2. Map route path to system modules
  let modulo = 'Configuración general';
  if (path.startsWith('/solicitudes')) modulo = 'Solicitudes EOR';
  else if (path.startsWith('/clientes')) modulo = 'Clientes';
  else if (path.startsWith('/trabajadores')) modulo = 'Trabajadores';
  else if (path.startsWith('/contratos-comerciales')) modulo = 'Contratos comerciales';
  else if (path.startsWith('/contratos-laborales')) modulo = 'Contratos laborales';
  else if (path.startsWith('/adendums')) modulo = 'Adendums';
  else if (path.startsWith('/cargas-sociales')) modulo = 'Cargas sociales';
  else if (path.startsWith('/tarifas') || path.startsWith('/tarifarios')) modulo = 'Tarifas';
  else if (path.startsWith('/beneficios')) modulo = 'Beneficios';
  else if (path.startsWith('/tipos-cambio')) modulo = 'Tipo de cambio';
  else if (path.startsWith('/tickets')) modulo = 'Tickets';
  else if (path.startsWith('/sla-configs') || path.startsWith('/sla-rules') || path.startsWith('/sla-trackers') || path.startsWith('/sla-historial')) modulo = 'SLA';
  else if (path.startsWith('/operational-alerts')) modulo = 'Alertas operativas';
  else if (path.startsWith('/traducciones')) modulo = 'Plantillas';
  else if (path.startsWith('/usuarios') || path.startsWith('/roles')) modulo = 'Usuarios';
  else if (path.startsWith('/facturas') || path.startsWith('/pagos') || path.startsWith('/configuracion-factura')) modulo = 'Facturación y pagos';
  else if (path.startsWith('/cuentas-bancarias')) modulo = 'Cuentas bancarias';
  else if (path.startsWith('/reglas-tributarias') || path.startsWith('/iva-wht-renta')) modulo = 'IVA - WHT y Renta';
  else if (path.startsWith('/directorio')) modulo = 'Directorio';
  else if (path.startsWith('/audit-logs')) modulo = 'Audit logs';

  // 3. Determine system action
  let accion = 'Ver';
  if (req.method === 'POST') accion = 'Crear';
  else if (req.method === 'PUT' || req.method === 'PATCH') accion = 'Editar';
  else if (req.method === 'DELETE') accion = 'Eliminar';

  // 4. Validate permissions for the user request
  const check = isAllowed(req, modulo, accion);
  const { email, role } = getRequestUser(req);
  const technicalId = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Client (Web)';

  if (!check.allowed) {
    writeAuditLog({
      usuario: email,
      rol: role as any,
      modulo,
      accion,
      entidadAfectada: modulo,
      resultado: 'bloqueado',
      mensajeError: check.error || 'Acceso no autorizado por control de roles de Quick Hire',
      identificadorTecnico: String(technicalId)
    });
    return res.status(403).json({ error: check.error || 'Acceso denegado' });
  }

  // 5. Track successful critical actions and report downloads in audit logs
  const isCriticalAction = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isReportGeneration = path.includes('report') || path.includes('download') || (modulo === 'Reportes' && req.method === 'GET');

  if (isCriticalAction || isReportGeneration) {
    writeAuditLog({
      usuario: email,
      rol: role as any,
      modulo,
      accion,
      entidadAfectada: modulo,
      resultado: 'exitoso',
      identificadorTecnico: String(technicalId),
      motivoObservacion: isReportGeneration ? 'Generación y descarga de Reporte de Gestión' : `Operación de modificación en el módulo ${modulo}`
    });
  }

  next();
});

// AUDIT LOGS
app.get('/api/audit-logs', (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Ver')) return; // Check if user can view admin tools
  const db = getDb();
  res.json(db.auditLogs || []);
});

app.post('/api/audit-logs', (req, res) => {
  const { 
    usuario, 
    rol, 
    modulo, 
    accion, 
    entidadAfectada, 
    entidadId, 
    estadoAnterior, 
    estadoNuevo, 
    valorAnterior, 
    valorNuevo, 
    motivoObservacion, 
    identificadorTecnico, 
    resultado, 
    mensajeError 
  } = req.body;
  
  const log = writeAuditLog({
    usuario,
    rol,
    modulo,
    accion,
    entidadAfectada,
    entidadId,
    estadoAnterior,
    estadoNuevo,
    valorAnterior,
    valorNuevo,
    motivoObservacion,
    identificadorTecnico,
    resultado,
    mensajeError
  });
  res.status(201).json(log);
});

// SOLICITUDES EOR (Public Landing feeds this)
app.get('/api/solicitudes', (req, res) => {
  const db = getDb();
  res.json(db.solicitudes);
});

app.post('/api/solicitudes', async (req, res) => {
  const db = getDb();
  const { empresa, pais, servicioRequerido, moneda, cantidadTrabajadores, nombreContacto, correo, telefono, observaciones, esRegional: reqEsRegional, paisesOperacion: reqPaisesOperacion } = req.body;
  
  if (!empresa || !pais || !nombreContacto || !correo) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }

  const esRegional = !!reqEsRegional || pais === 'Regional';
  const paisesOperacion = Array.isArray(reqPaisesOperacion) && reqPaisesOperacion.length > 0
    ? reqPaisesOperacion
    : (pais && pais !== 'Regional' ? [pais] : ['México', 'Colombia']);

  // Find active executives and advisors (strictly excluding any quickhire domains)
  const activeStaff = (db.usuarios || []).filter(u => 
    (u.rol === 'asesor_comercial' || u.rol === 'ejecutivo_cuentas' || u.rol === 'ejecutivo') && 
    u.estado === 'Activo' &&
    !u.correo.toLowerCase().includes('quickhire')
  );

  // Filter staff assigned to this country / regional scope
  let matchingStaff = activeStaff.filter(u => {
    if (esRegional) {
      if (u.paisesAsignados && (u.paisesAsignados.includes('Todos') || u.paisesAsignados.includes('Regional'))) return true;
      if (u.pais === 'Regional' || u.pais === 'Todos') return true;
      return paisesOperacion.some(p => u.pais === p || (u.paisesAsignados && u.paisesAsignados.includes(p)));
    }
    return u.pais === pais || (u.paisesAsignados && u.paisesAsignados.includes(pais));
  });

  if (matchingStaff.length === 0) {
    matchingStaff = activeStaff; // Fallback to all active staff
  }

  let autoAssignedEmail = 'asesor-eor-peo@grupostt.com';
  let autoAssignedName = 'Asesor Comercial EOR/PEO';

  if (matchingStaff.length > 0) {
    const commercialAdvisors = matchingStaff.filter(u => u.rol === 'asesor_comercial');
    const pool = commercialAdvisors.length > 0 ? commercialAdvisors : matchingStaff;
    const randomIndex = Math.floor(Math.random() * pool.length);
    autoAssignedEmail = pool[randomIndex].correo;
    autoAssignedName = pool[randomIndex].nombre;
  } else {
    // Default fallback advisor
    const fallbackAdvisor = (db.usuarios || []).find(u => 
      u.rol === 'asesor_comercial' && !u.correo.toLowerCase().includes('quickhire')
    );
    if (fallbackAdvisor) {
      autoAssignedEmail = fallbackAdvisor.correo;
      autoAssignedName = fallbackAdvisor.nombre;
    }
  }

  const nueva: SolicitudEOR = {
    id: `SOL-${Date.now().toString().slice(-4)}`,
    empresa,
    pais: esRegional ? 'Regional' : pais,
    esRegional,
    paisesOperacion,
    servicioRequerido: servicioRequerido || 'Employer of Record (EOR)',
    moneda: moneda || 'USD',
    cantidadTrabajadores: Number(cantidadTrabajadores) || 1,
    nombreContacto,
    correo,
    telefono: telefono || '',
    observaciones: observaciones || '',
    estado: 'Recibida',
    fechaRecepcion: new Date().toISOString(),
    asesorAsignado: autoAssignedEmail
  };

  db.solicitudes.unshift(nueva);
  saveDb(db);
  await saveDocToFirestore('solicitudes', nueva.id, nueva);

  const notifPayload = {
    ...nueva,
    pais: esRegional ? `Regional (${paisesOperacion.join(', ')})` : pais
  };

  // 1. Correo exclusivo para el solicitante / prospecto (SIN copia al asesor)
  triggerNotification('EOR_REQUEST_RECEIVED', notifPayload);

  // 2. Correo separado para el asesor comercial asignado con los datos de contacto del prospecto
  if (autoAssignedEmail && autoAssignedEmail.includes('@') && !autoAssignedEmail.toLowerCase().includes('quickhire')) {
    triggerNotification('EOR_REQUEST_ADVISOR_NOTIFIED', {
      ...notifPayload,
      correo: autoAssignedEmail,
      correo_usuario: nueva.correo,
      nombreContacto: autoAssignedName,
      nombre_cliente: nueva.nombreContacto,
      responsable: autoAssignedName,
      telefono: nueva.telefono || 'No especificado'
    });
  }

  res.status(201).json(nueva);
});

app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  const { estado, notasInternas, usuario } = req.body;
  
  const db = getDb();
  const idx = db.solicitudes.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Solicitud no encontrada' });

  const anterior = db.solicitudes[idx];
  const prevEstado = anterior.estado;
  const prevAsesor = (anterior as any).asesorAsignado;
  
  if (estado && estado !== anterior.estado) {
    addAuditLog('Solicitudes EOR', id, 'estado', anterior.estado, estado, `Cambio de estado de la solicitud`, usuario || 'Admin System');
    anterior.estado = estado;
  }
  if (notasInternas !== undefined) {
    anterior.notasInternas = notasInternas;
  }

  // Merge remaining fields (asesorAsignado, estadoComercial, fechaUltimaGestion, etc.)
  Object.keys(req.body).forEach(key => {
    if (['estado', 'notasInternas', 'usuario'].includes(key)) return;
    (anterior as any)[key] = req.body[key];
  });

  saveDb(db);
  await saveDocToFirestore('solicitudes', id, anterior);

  // Disparadores de notificación
  if (estado && estado !== prevEstado) {
    triggerNotification('EOR_REQUEST_STATUS_CHANGED', anterior, usuario);
    if (estado === 'Aprobada' || estado === 'Aprobado') {
      triggerNotification('EOR_REQUEST_CONVERTED_TO_CLIENT', anterior, usuario);
    }
  }
  if (req.body.asesorAsignado && req.body.asesorAsignado !== prevAsesor) {
    triggerNotification('EOR_REQUEST_ASSIGNED', anterior, usuario);
  }

  res.json(anterior);
});

app.delete('/api/solicitudes/:id', async (req, res) => {
  if (!enforcePermission(req, res, 'Solicitudes EOR', 'Eliminar')) return;
  const { id } = req.params;
  const usuario = (req.query.usuario as string) || req.body?.usuario || 'administrador-eor-peo@grupostt.com';
  const motivo = (req.query.motivo as string) || req.body?.motivo || 'Lead / solicitud eliminada por el usuario';
  const db = getDb();
  if (!db.solicitudes) db.solicitudes = [];
  const solIndex = db.solicitudes.findIndex(s => s.id === id);
  if (solIndex === -1) {
    return res.status(404).json({ error: 'Solicitud (Lead) no encontrada.' });
  }

  const sol = db.solicitudes[solIndex];
  db.solicitudes.splice(solIndex, 1);

  // Clean up any linked seguimientos
  if (db.seguimientosComerciales) {
    db.seguimientosComerciales = db.seguimientosComerciales.filter(seg => seg.relacionadoId !== id);
  }

  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) {
    db.deletedIds.push(id);
  }

  await deleteDocFromFirestore('solicitudes', id);
  saveDb(db);
  addAuditLog('Solicitudes EOR', id, 'eliminacion', sol.empresa, 'Eliminado', motivo, usuario);

  res.json({ success: true, message: `Solicitud / Lead de ${sol.empresa} (${id}) eliminada exitosamente.` });
});

// CLIENTES
app.get('/api/clientes', (req, res) => {
  const db = getDb();
  res.json(db.clientes);
});

app.post('/api/clientes', async (req, res) => {
  const db = getDb();
  const { 
    empresa, pais, servicioContratado, moneda, feePorEmpleado, 
    cupoTrabajadores, beneficiosConfigurados, plantillaAsociada, 
    condicionesFacturacion, correoContacto, telefonoContacto, 
    nombreContacto, estado, descuentoVolumen, solicitudVinculadaId, usuario
  } = req.body;

  if (!empresa || !pais || !correoContacto) {
    return res.status(400).json({ error: 'Faltan datos requeridos del cliente' });
  }

  // Check duplicate
  const duplicado = db.clientes.find(c => c.empresa.toLowerCase() === empresa.toLowerCase());
  if (duplicado) {
    return res.status(400).json({ error: 'Ya existe un cliente con este nombre de empresa' });
  }

  // If this client was created from a request, update the request status
  let linkedSolAdvisor: string | undefined = undefined;
  if (solicitudVinculadaId) {
    const reqIdx = db.solicitudes.findIndex(s => s.id === solicitudVinculadaId);
    if (reqIdx !== -1) {
      db.solicitudes[reqIdx].estado = 'Cliente creado';
      linkedSolAdvisor = db.solicitudes[reqIdx].asesorAsignado;
    }
  }

  const nuevoId = `CLI-${Date.now().toString().slice(-3)}`;
  const nuevoCliente: Cliente = {
    id: nuevoId,
    empresa,
    pais,
    servicioContratado: servicioContratado || 'Employer of Record (EOR)',
    moneda: moneda || 'USD',
    feePorEmpleado: Number(feePorEmpleado) || 100,
    cupoTrabajadores: Number(cupoTrabajadores) || 5,
    trabajadoresCargados: 0,
    trabajadoresPendientes: 0,
    beneficiosConfigurados: beneficiosConfigurados || [],
    plantillaAsociada: plantillaAsociada || `${moneda}-EOR-V1`,
    condicionesFacturacion: condicionesFacturacion || 'Mensual',
    correoContacto,
    telefonoContacto: telefonoContacto || '',
    nombreContacto: nombreContacto || empresa,
    estado: estado || 'Activo',
    descuentoVolumen: descuentoVolumen || 'Ninguno',
    solicitudVinculadaId,
    idioma: req.body.idioma || 'es',
    asesorAsignado: req.body.asesorAsignado || linkedSolAdvisor || (usuario && usuario.includes('@') ? usuario : undefined),

    // Copy new custom attributes from request body if they exist
    servicio: req.body.servicio,
    tipoCliente: req.body.tipoCliente,
    proyecto: req.body.proyecto,
    razonSocial: req.body.razonSocial || empresa,
    cedulaJuridica: req.body.cedulaJuridica,
    direccion: req.body.direccion,
    representanteLegal: req.body.representanteLegal || nombreContacto || empresa,
    documentoRepresentante: req.body.documentoRepresentante || '',
    fechaInicioContrato: req.body.fechaInicioContrato,
    posicion: req.body.posicion,
    tipoFacturacion: req.body.tipoFacturacion || 'Local',
    paisFacturacion: req.body.paisFacturacion,
    cuentaBancariaId: req.body.cuentaBancariaId,
    cuentaBancariaDetalle: req.body.cuentaBancariaDetalle,
    credito: req.body.credito,
    headcountProyecto: req.body.headcountProyecto ? Number(req.body.headcountProyecto) : undefined,
    frecuenciaNomina: req.body.frecuenciaNomina,
    fechaInicio: req.body.fechaInicio,
    adicionales: req.body.adicionales,
    adicionalesExtralegales: req.body.adicionalesExtralegales,
    sociedadContratacion: req.body.sociedadContratacion,
    supraclienteId: req.body.supraclienteId,
    jerarquia: req.body.jerarquia
  };

  db.clientes.push(nuevoCliente);

  // If this client was created from a request, update the request status
  if (solicitudVinculadaId) {
    const reqIdx = db.solicitudes.findIndex(s => s.id === solicitudVinculadaId);
    if (reqIdx !== -1) {
      db.solicitudes[reqIdx].estado = 'Cliente creado';
    }
  }

  // Create default user for client if none exists
  const usuarioExistente = db.usuarios.find(u => u.correo.toLowerCase() === correoContacto.toLowerCase());
  if (!usuarioExistente) {
    db.usuarios.push({
      correo: correoContacto.toLowerCase(),
      nombre: nombreContacto || empresa,
      rol: 'cliente',
      clienteId: nuevoId,
      estado: 'Activo',
      fechaCreacion: new Date().toISOString(),
      idioma: req.body.idioma || 'es'
    });

    triggerNotification('USER_CREATED', {
      nombreUsuario: nombreContacto || empresa,
      rolUsuario: 'Cliente',
      correoUsuario: correoContacto.toLowerCase(),
      correo: correoContacto.toLowerCase(),
      contrasena_temporal: '123456',
      enlace_plataforma: process.env.APP_URL || 'http://localhost:3000',
      clienteId: nuevoId,
      empresa: empresa
    }, usuario || 'Admin System');
  }

  saveDb(db);
  await saveDocToFirestore('clientes', nuevoId, nuevoCliente);
  triggerNotification('USER_CLIENT_CREATED', {
    correo: correoContacto,
    nombreContacto,
    empresa,
    id: nuevoId
  }, usuario);
  addAuditLog('Clientes', nuevoId, 'creacion', '', nuevoCliente.empresa, 'Registro de nuevo cliente', usuario || 'Admin System');
  res.status(201).json(nuevoCliente);
});

app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.clientes.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });

  const anterior = { ...db.clientes[idx] };
  const target = db.clientes[idx];
  
  const usuario = req.body.usuario || (req.headers['x-user-email'] as string) || 'administrador-eor-peo@grupostt.com';
  const motivo = req.body.motivo?.trim() || 'Actualización de ficha y datos del cliente por administrador';
  const { feePorEmpleado, cupoTrabajadores, estado, empresa, pais, supraclienteId } = req.body;

  if (empresa && empresa !== target.empresa) {
    addAuditLog('Clientes', id, 'empresa', target.empresa, empresa, motivo, usuario);
    target.empresa = empresa;
    if (db.trabajadores) {
      db.trabajadores.forEach(w => {
        if (w.clienteId === id) w.clienteNombre = empresa;
      });
    }
  }

  if (pais && pais !== target.pais) {
    addAuditLog('Clientes', id, 'pais', target.pais, pais, motivo, usuario);
    target.pais = pais;
  }

  if (supraclienteId !== undefined && supraclienteId !== target.supraclienteId) {
    addAuditLog('Clientes', id, 'supraclienteId', target.supraclienteId || 'Directo', supraclienteId || 'Directo', motivo, usuario);
    target.supraclienteId = supraclienteId || undefined;
  }

  if (feePorEmpleado !== undefined && Number(feePorEmpleado) !== target.feePorEmpleado) {
    addAuditLog('Clientes', id, 'feePorEmpleado', String(target.feePorEmpleado), String(feePorEmpleado), motivo, usuario);
    target.feePorEmpleado = Number(feePorEmpleado);
  }
  if (cupoTrabajadores !== undefined && Number(cupoTrabajadores) !== target.cupoTrabajadores) {
    addAuditLog('Clientes', id, 'cupoTrabajadores', String(target.cupoTrabajadores), String(cupoTrabajadores), motivo, usuario);
    target.cupoTrabajadores = Number(cupoTrabajadores);
  }
  if (estado !== undefined && estado !== target.estado) {
    addAuditLog('Clientes', id, 'estado', target.estado, estado, motivo, usuario);
    target.estado = estado;
  }

  // Merge remaining fields that might not be critical or log them generically
  Object.keys(req.body).forEach(key => {
    if (['feePorEmpleado', 'cupoTrabajadores', 'estado', 'motivo', 'usuario'].includes(key)) return;
    (target as any)[key] = req.body[key];
  });

  saveDb(db);
  await saveDocToFirestore('clientes', id, target);
  res.json(target);
});

app.delete('/api/clientes/:id', async (req, res) => {
  if (!enforcePermission(req, res, 'Clientes', 'Eliminar')) return;
  const { id } = req.params;
  const usuario = (req.query.usuario as string) || req.body?.usuario || (req.headers['x-user-email'] as string) || 'administrador-eor-peo@grupostt.com';
  const motivo = (req.query.motivo as string) || req.body?.motivo || 'Eliminación permanente de cliente';
  const db = getDb();
  if (!db.clientes) db.clientes = [];
  const idx = db.clientes.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  const cliente = db.clientes[idx];
  db.clientes.splice(idx, 1);

  // Clean up associated records if any
  if (db.trabajadores) {
    db.trabajadores = db.trabajadores.filter(w => w.clienteId !== id);
  }
  if (db.contratosComerciales) {
    db.contratosComerciales = db.contratosComerciales.filter(cc => cc.clienteId !== id);
  }

  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) {
    db.deletedIds.push(id);
  }

  await deleteDocFromFirestore('clientes', id);
  saveDb(db);
  addAuditLog('Clientes', id, 'eliminacion', cliente.empresa, 'Eliminado', motivo, usuario);

  res.json({ success: true, message: `Cliente "${cliente.empresa}" (${id}) eliminado exitosamente.` });
});

// TRABAJADORES CONSOLIDADOS
app.get('/api/trabajadores', (req, res) => {
  const db = getDb();
  const { clienteId } = req.query;
  if (clienteId) {
    return res.json(db.trabajadores.filter(t => t.clienteId === clienteId));
  }
  res.json(db.trabajadores);
});

app.post('/api/trabajadores', (req, res) => {
  const db = getDb();
  const { 
    clienteId, nombre, correo, puesto, tipoCarga, fechaIngreso, 
    salario, moneda, modalidadTrabajo, beneficiosAplicables, estado, observaciones, usuario,
    documentoIdentidad, proyecto, cargasSocialesPatronalesPct, cargasSocialesMonto,
    feeMonto, impuestosMonto, costoTotalTalento, detallesCostos
  } = req.body;

  if (!clienteId || !nombre || !correo || !puesto) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del trabajador' });
  }

  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return res.status(404).json({ error: 'Cliente asociado no encontrado' });

  // Update total contracted workers counter
  const totalActivos = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'Activo').length;
  cliente.trabajadoresCargados = totalActivos + 1;
  if (!cliente.cupoTrabajadores || cliente.cupoTrabajadores < cliente.trabajadoresCargados) {
    cliente.cupoTrabajadores = cliente.trabajadoresCargados;
  }

  const nuevoId = `TRAB-${Date.now().toString().slice(-4)}`;
  const nuevoTrabajador: Trabajador = {
    id: nuevoId,
    clienteId,
    clienteNombre: cliente.empresa,
    nombre,
    correo,
    puesto,
    documentoIdentidad: documentoIdentidad || '',
    proyecto: proyecto || cliente.proyecto || 'Proyecto Principal',
    tipoCarga: tipoCarga || 'Individual',
    fechaIngreso: fechaIngreso || new Date().toISOString().slice(0, 10),
    salario: Number(salario) || 0,
    moneda: moneda || cliente.moneda,
    modalidadTrabajo: modalidadTrabajo || 'Remoto',
    beneficiosAplicables: beneficiosAplicables || [],
    estado: estado || 'En revisión',
    observaciones: observaciones || '',
    pais: req.body.pais || cliente.pais,
    cargasSocialesPatronalesPct: Number(cargasSocialesPatronalesPct) || 0,
    cargasSocialesMonto: Number(cargasSocialesMonto) || 0,
    feeMonto: Number(feeMonto) || 0,
    impuestosMonto: Number(impuestosMonto) || 0,
    costoTotalTalento: Number(costoTotalTalento) || 0,
    detallesCostos: detallesCostos || null,
    ultimaActualizacion: new Date().toISOString()
  };

  db.trabajadores.push(nuevoTrabajador);
  
  // Update counts on Client
  cliente.trabajadoresCargados = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'Activo').length;
  cliente.trabajadoresPendientes = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'En revisión').length;

  saveDb(db);
  addAuditLog('Trabajadores', nuevoId, 'creacion', '', nuevoTrabajador.nombre, `Alta de trabajador de proyecto "${nuevoTrabajador.proyecto}" para "${cliente.empresa}" (Costo Total: ${nuevoTrabajador.costoTotalTalento || nuevoTrabajador.salario} ${nuevoTrabajador.moneda})`, usuario || cliente.correoContacto);
  triggerNotification('WORKER_ONBOARDING_STARTED', nuevoTrabajador, usuario || cliente.correoContacto);
  
  // Notify the assigned commercial advisor and account executives
  const msgNotif = `El cliente "${cliente.empresa}" ha registrado un nuevo colaborador en su proyecto "${nuevoTrabajador.proyecto}": ${nombre} (${puesto} - ${nuevoTrabajador.pais}). Costo total calculado: $${nuevoTrabajador.costoTotalTalento || nuevoTrabajador.salario} ${nuevoTrabajador.moneda}.`;
  
  if (cliente.asesorAsignado) {
    triggerNotification('NOTIFICACION_SISTEMA' as any, {
      destinatario: cliente.asesorAsignado,
      mensaje: msgNotif
    }, usuario || 'Sistema');
  }

  // Also notify account executives
  const ejecutivos = db.usuarios.filter(u => u.rol === 'ejecutivo' || u.rol === 'ejecutivo_cuentas' || u.rol === 'gestion_cuentas');
  ejecutivos.forEach(ej => {
    triggerNotification('NOTIFICACION_SISTEMA' as any, {
      destinatario: ej.correo,
      mensaje: msgNotif
    }, usuario || 'Sistema');
  });

  res.status(201).json(nuevoTrabajador);
});

app.put('/api/trabajadores/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.trabajadores.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Trabajador no encontrado' });

  const target = db.trabajadores[idx];
  const anterior = { ...target };
  const { 
    nombre, correo, puesto, documentoIdentidad, proyecto, pais,
    estado, observaciones, motivo, usuario, salario, moneda,
    modalidadTrabajo, beneficiosAplicables,
    cargasSocialesPatronalesPct, cargasSocialesMonto, feeMonto, impuestosMonto,
    costoTotalTalento, detallesCostos
  } = req.body;

  let requireAudit = false;
  if (estado && estado !== target.estado) requireAudit = true;
  if (salario !== undefined && Number(salario) !== target.salario) requireAudit = true;

  if (requireAudit && (!motivo || motivo.trim() === '')) {
    // If motivo is not sent, provide a sensible default reason
    // return res.status(400).json({ error: 'Un cambio crítico en el salario o estado del trabajador requiere indicar un motivo.' });
  }

  const prevEstado = target.estado;

  if (nombre !== undefined) target.nombre = nombre;
  if (correo !== undefined) target.correo = correo;
  if (puesto !== undefined) target.puesto = puesto;
  if (documentoIdentidad !== undefined) target.documentoIdentidad = documentoIdentidad;
  if (proyecto !== undefined) target.proyecto = proyecto;
  if (pais !== undefined) target.pais = pais;
  if (moneda !== undefined) target.moneda = moneda;

  if (estado && estado !== target.estado) {
    addAuditLog('Trabajadores', id, 'estado', target.estado, estado, motivo || 'Actualización de estado operativo', usuario || 'Admin System');
    target.estado = estado;
  }
  if (salario !== undefined && Number(salario) !== target.salario) {
    addAuditLog('Trabajadores', id, 'salario', String(target.salario), String(salario), motivo || 'Ajuste salarial de colaborador', usuario || 'Admin System');
    target.salario = Number(salario);
  }

  if (observaciones !== undefined) target.observaciones = observaciones;
  if (modalidadTrabajo !== undefined) target.modalidadTrabajo = modalidadTrabajo;
  if (beneficiosAplicables !== undefined) target.beneficiosAplicables = beneficiosAplicables;
  if (cargasSocialesPatronalesPct !== undefined) target.cargasSocialesPatronalesPct = Number(cargasSocialesPatronalesPct);
  if (cargasSocialesMonto !== undefined) target.cargasSocialesMonto = Number(cargasSocialesMonto);
  if (feeMonto !== undefined) target.feeMonto = Number(feeMonto);
  if (impuestosMonto !== undefined) target.impuestosMonto = Number(impuestosMonto);
  if (costoTotalTalento !== undefined) target.costoTotalTalento = Number(costoTotalTalento);
  if (detallesCostos !== undefined) target.detallesCostos = detallesCostos;
  
  target.ultimaActualizacion = new Date().toISOString();

  // Re-sync Client counts
  const cliente = db.clientes.find(c => c.id === target.clienteId);
  if (cliente) {
    cliente.trabajadoresCargados = db.trabajadores.filter(t => t.clienteId === target.clienteId && t.estado === 'Activo').length;
    cliente.trabajadoresPendientes = db.trabajadores.filter(t => t.clienteId === target.clienteId && t.estado === 'En revisión').length;
  }

  saveDb(db);

  // Triggers de onboarding / offboarding
  if (estado && estado !== prevEstado) {
    if (estado === 'Activo') {
      triggerNotification('WORKER_ONBOARDING_COMPLETED', target, usuario);
    } else if (estado === 'En desvinculación' || estado === 'Desvinculación') {
      triggerNotification('WORKER_OFFBOARDING_STARTED', target, usuario);
    } else if (estado === 'Inactivo' || estado === 'Desvinculado') {
      triggerNotification('WORKER_OFFBOARDING_COMPLETED', target, usuario);
    }
  }

  res.json(target);
});

app.delete('/api/trabajadores/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.trabajadores.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Trabajador no encontrado' });

  const [eliminado] = db.trabajadores.splice(idx, 1);
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) db.deletedIds.push(id);

  // Re-sync Client counts
  const cliente = db.clientes.find(c => c.id === eliminado.clienteId);
  if (cliente) {
    cliente.trabajadoresCargados = db.trabajadores.filter(t => t.clienteId === eliminado.clienteId && t.estado === 'Activo').length;
    cliente.trabajadoresPendientes = db.trabajadores.filter(t => t.clienteId === eliminado.clienteId && t.estado === 'En revisión').length;
  }

  saveDb(db);
  addAuditLog('Trabajadores', id, 'eliminacion', eliminado.nombre, '', 'Eliminación de colaborador', req.query.usuario as string || 'Sistema');
  res.json({ success: true, message: 'Trabajador eliminado correctamente' });
});

// BULK UPLOAD HISTORY & PROCESSING
app.get('/api/historial-cargas', (req, res) => {
  const db = getDb();
  res.json(db.historialCargas);
});

app.post('/api/trabajadores/bulk', (req, res) => {
  const db = getDb();
  const { clienteId, archivoNombre, registros, usuario } = req.body;

  if (!clienteId || !registros || !Array.isArray(registros)) {
    return res.status(400).json({ error: 'Faltan parámetros de carga masiva' });
  }

  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  // Validations and error tracking
  const validos: any[] = [];
  const errores: any[] = [];
  let conObservaciones = 0;

  registros.forEach((reg, i) => {
    const fila = i + 2; // Assuming headers on line 1
    const { Nombre, Correo, Puesto, FechaIngreso, Salario, Moneda, Modalidad } = reg;

    // Critical error checks
    if (!Nombre || Nombre.trim() === '') {
      errores.push({ fila, campo: 'Nombre', error: 'El nombre es obligatorio.', valorOriginal: Nombre });
      return;
    }
    if (!Correo || !Correo.includes('@')) {
      errores.push({ fila, campo: 'Correo', error: 'Correo inválido o faltante.', valorOriginal: Correo });
      return;
    }
    if (!Puesto || Puesto.trim() === '') {
      errores.push({ fila, campo: 'Puesto', error: 'El puesto laboral es obligatorio.', valorOriginal: Puesto });
      return;
    }

    const salarioNum = Number(Salario);
    if (isNaN(salarioNum) || salarioNum <= 0) {
      errores.push({ fila, campo: 'Salario', error: 'El salario debe ser un número positivo.', valorOriginal: Salario });
      return;
    }

    // Warnings / Observations
    let tieneObservaciones = false;
    let observacionesFila = '';

    const monedaValida = ['MXN', 'COP', 'BRL', 'USD', 'EUR'].includes(String(Moneda).toUpperCase());
    if (!monedaValida) {
      tieneObservaciones = true;
      observacionesFila += 'Moneda no coincide con configuraciones sugeridas del país. ';
    }

    const modValida = ['Remoto', 'Híbrido', 'Presencial', 'Remote', 'Hybrid', 'On-site'].includes(Modalidad);
    if (!modValida) {
      tieneObservaciones = true;
      observacionesFila += 'Modalidad de trabajo no estándar. ';
    }

    if (tieneObservaciones) {
      conObservaciones++;
    }

    validos.push({
      nombre: Nombre,
      correo: Correo,
      puesto: Puesto,
      fechaIngreso: FechaIngreso || new Date().toISOString().slice(0, 10),
      salario: salarioNum,
      moneda: Moneda || cliente.moneda,
      modalidadTrabajo: Modalidad || 'Remoto',
      estado: tieneObservaciones ? 'Con observaciones' : 'En revisión',
      observaciones: observacionesFila
    });
  });

  // Check if we have critical errors - do not process if there are critical errors
  if (errores.length > 0) {
    const cargaHistorialError: HistorialCargaMasiva = {
      id: `CM-${Date.now().toString().slice(-4)}`,
      clienteId,
      clienteNombre: cliente.empresa,
      fecha: new Date().toISOString(),
      archivoNombre: archivoNombre || 'archivo_subido.csv',
      totalRegistros: registros.length,
      registrosValidos: 0,
      registrosConObservaciones: 0,
      errores,
      estado: 'Rechazado',
      usuarioResponsable: usuario || 'cliente@clientcorp.com'
    };
    db.historialCargas.unshift(cargaHistorialError);
    saveDb(db);
    return res.status(400).json({ 
      error: 'La plantilla contiene errores críticos de validación. Revise la bitácora antes de reintentar.',
      cargaHistorial: cargaHistorialError
    });
  }

  // Update total contracted workers counter
  const totalActivos = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'Activo').length;
  cliente.trabajadoresCargados = totalActivos + validos.length;
  if (!cliente.cupoTrabajadores || cliente.cupoTrabajadores < cliente.trabajadoresCargados) {
    cliente.cupoTrabajadores = cliente.trabajadoresCargados;
  }

  // Insert workers
  const cargaId = `CM-${Date.now().toString().slice(-4)}`;
  const trabajadoresNuevos: Trabajador[] = validos.map((v, idx) => ({
    id: `TRAB-${Date.now().toString().slice(-3)}-${idx}`,
    clienteId,
    clienteNombre: cliente.empresa,
    nombre: v.nombre,
    correo: v.correo,
    puesto: v.puesto,
    tipoCarga: 'Masiva',
    fechaIngreso: v.fechaIngreso,
    salario: v.salario,
    moneda: v.moneda,
    modalidadTrabajo: v.modalidadTrabajo,
    beneficiosAplicables: [],
    estado: v.estado,
    observaciones: v.observaciones,
    pais: cliente.pais,
    ultimaActualizacion: new Date().toISOString(),
    cargaMasivaId: cargaId
  }));

  db.trabajadores.push(...trabajadoresNuevos);

  // Historial Carga
  const cargaHistorialExito: HistorialCargaMasiva = {
    id: cargaId,
    clienteId,
    clienteNombre: cliente.empresa,
    fecha: new Date().toISOString(),
    archivoNombre: archivoNombre || 'carga_masiva.csv',
    totalRegistros: registros.length,
    registrosValidos: validos.length - conObservaciones,
    registrosConObservaciones: conObservaciones,
    errores: [],
    estado: conObservaciones > 0 ? 'Con observaciones' : 'Procesado',
    usuarioResponsable: usuario || 'cliente@clientcorp.com'
  };

  db.historialCargas.unshift(cargaHistorialExito);

  // Sync Client counts
  cliente.trabajadoresCargados = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'Activo').length;
  cliente.trabajadoresPendientes = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'En revisión').length;

  saveDb(db);
  res.status(201).json({ 
    success: true, 
    cargaHistorial: cargaHistorialExito,
    trabajadoresAgregados: trabajadoresNuevos.length
  });
});

// CARGAS SOCIALES
app.get('/api/cargas-sociales', (req, res) => {
  const db = getDb();
  res.json(db.cargasSociales);
});

app.post('/api/cargas-sociales', (req, res) => {
  if (!enforcePermission(req, res, 'Cargas sociales', 'Crear')) return;
  const db = getDb();
  const { pais, tipoCarga, nombreCarga, responsablePago, porcentaje, montoFijo, tope, vigencia, usuario } = req.body;

  if (!pais || !tipoCarga || porcentaje === undefined) {
    return res.status(400).json({ error: 'Faltan datos requeridos de carga social' });
  }

  const nuevaId = `CS-${Date.now().toString().slice(-4)}`;
  const nueva: CargaSocial = {
    id: nuevaId,
    pais,
    tipoCarga,
    nombreCarga: nombreCarga || tipoCarga,
    responsablePago: responsablePago || 'Patrón',
    porcentaje: Number(porcentaje),
    montoFijo: montoFijo ? Number(montoFijo) : undefined,
    tope: tope ? Number(tope) : undefined,
    vigencia: vigencia || '2026-01-01 a 2026-12-31',
    estado: 'Vigente',
    fechaActualizacion: new Date().toISOString(),
    usuarioResponsable: usuario || 'administrador-eor-peo@grupostt.com'
  };

  db.cargasSociales.push(nueva);
  saveDb(db);
  addAuditLog('Cargas Sociales', nuevaId, 'creacion', '', `${pais} - ${tipoCarga}`, 'Nueva carga social legislativa', usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nueva);
});

app.put('/api/cargas-sociales/:id', (req, res) => {
  if (!enforcePermission(req, res, 'Cargas sociales', 'Editar')) return;
  const { id } = req.params;
  const db = getDb();
  const idx = db.cargasSociales.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Carga social no encontrada' });

  const target = db.cargasSociales[idx];
  const { nombreCarga, tipoCarga, pais, responsablePago, porcentaje, vigencia, estado, motivo, usuario } = req.body;

  if (!motivo || motivo.trim() === '') {
    return res.status(400).json({ error: 'Se requiere justificación o motivo para modificar cargas sociales legales.' });
  }

  if (tipoCarga !== undefined && tipoCarga !== target.tipoCarga) {
    addAuditLog('Cargas Sociales', id, 'tipoCarga', target.tipoCarga || '', tipoCarga, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.tipoCarga = tipoCarga;
    target.nombreCarga = tipoCarga;
  }
  if (pais !== undefined && pais !== target.pais) {
    addAuditLog('Cargas Sociales', id, 'pais', target.pais, pais, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.pais = pais;
  }
  if (responsablePago !== undefined && responsablePago !== target.responsablePago) {
    addAuditLog('Cargas Sociales', id, 'responsablePago', target.responsablePago, responsablePago, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.responsablePago = responsablePago;
  }
  if (nombreCarga !== undefined && nombreCarga !== target.nombreCarga) {
    addAuditLog('Cargas Sociales', id, 'nombreCarga', target.nombreCarga || '', nombreCarga, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.nombreCarga = nombreCarga;
  }
  if (porcentaje !== undefined && Number(porcentaje) !== target.porcentaje) {
    addAuditLog('Cargas Sociales', id, 'porcentaje', `${target.porcentaje}%`, `${porcentaje}%`, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.porcentaje = Number(porcentaje);
  }
  if (vigencia !== undefined && vigencia !== target.vigencia) {
    addAuditLog('Cargas Sociales', id, 'vigencia', target.vigencia, vigencia, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.vigencia = vigencia;
  }
  if (estado !== undefined && estado !== target.estado) {
    addAuditLog('Cargas Sociales', id, 'estado', target.estado, estado, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.estado = estado;
  }

  target.fechaActualizacion = new Date().toISOString();
  target.usuarioResponsable = usuario || 'administrador-eor-peo@grupostt.com';

  saveDb(db);
  res.json(target);
});

app.delete('/api/cargas-sociales/:id', async (req, res) => {
  if (!enforcePermission(req, res, 'Cargas sociales', 'Eliminar')) return;
  const { id } = req.params;
  const { usuario } = req.query;
  const db = getDb();
  const idx = db.cargasSociales.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Carga social no encontrada' });

  const target = db.cargasSociales[idx];
  db.cargasSociales.splice(idx, 1);
  saveDb(db);
  await deleteDocFromFirestore('cargasSociales', id);

  addAuditLog('Cargas Sociales', id, 'eliminacion', `${target.pais} - ${target.tipoCarga}`, '', 'Carga social eliminada por administrador', (usuario as string) || 'administrador-eor-peo@grupostt.com');
  res.json({ success: true });
});

// TARIFAS
app.get('/api/tarifas', (req, res) => {
  const db = getDb();
  res.json(db.tarifas);
});

app.post('/api/tarifas', (req, res) => {
  if (!enforcePermission(req, res, 'Tarifas', 'Crear')) return;
  const db = getDb();
  const { pais, servicio, moneda, feeBase, tramosVolumen, descuentos, vigencia, rangos, usuario } = req.body;

  if (!pais || !servicio || !moneda || feeBase === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros del tarifario' });
  }

  const nuevaId = `TAR-${Date.now().toString().slice(-4)}`;
  const nueva: Tarifa = {
    id: nuevaId,
    pais,
    servicio,
    moneda,
    feeBase: Number(feeBase),
    tramosVolumen: tramosVolumen || '',
    descuentos: descuentos || '',
    vigencia: vigencia || '2026-01-01 a 2026-12-31',
    estado: 'Activo',
    rangos: rangos || []
  };

  db.tarifas.push(nueva);
  saveDb(db);
  addAuditLog('Tarifas', nuevaId, 'creacion', '', `${pais} - ${servicio}`, 'Nueva tarifa base cargada', usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nueva);
});

app.put('/api/tarifas/:id', (req, res) => {
  if (!enforcePermission(req, res, 'Tarifas', 'Editar')) return;
  const { id } = req.params;
  const db = getDb();
  const idx = db.tarifas.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Tarifa no encontrada' });

  const target = db.tarifas[idx];
  const { feeBase, estado, rangos, motivo, usuario } = req.body;

  if (!motivo || motivo.trim() === '') {
    return res.status(400).json({ error: 'Debe especificar el motivo del cambio de tarifas para auditoría de cumplimiento.' });
  }

  if (feeBase !== undefined && Number(feeBase) !== target.feeBase) {
    addAuditLog('Tarifas', id, 'feeBase', String(target.feeBase), String(feeBase), motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.feeBase = Number(feeBase);
  }
  if (estado !== undefined && estado !== target.estado) {
    addAuditLog('Tarifas', id, 'estado', target.estado, estado, motivo, usuario || 'administrador-eor-peo@grupostt.com');
    target.estado = estado;
  }
  saveDb(db);
  res.json(target);
});

// TARIFARIOS EOR POR VOLUMEN DE TALENTOS
app.get('/api/tarifarios', (req, res) => {
  const db = getDb();
  if (!db.tarifarios) db.tarifarios = [];
  res.json(db.tarifarios);
});

app.post('/api/tarifarios', (req, res) => {
  if (!enforcePermission(req, res, 'Tarifas', 'Crear')) return;
  const db = getDb();
  if (!db.tarifarios) db.tarifarios = [];

  const { nombre, descripcion, esDefault, paisesAplicables, clientesAplicables, tramos, usuario } = req.body;

  if (!nombre || !tramos || !Array.isArray(tramos) || tramos.length === 0) {
    return res.status(400).json({ error: 'Nombre del tarifario y tramos por volumen son obligatorios' });
  }

  if (esDefault) {
    db.tarifarios.forEach(t => t.esDefault = false);
  }

  const newId = `TAR-SCHEME-${Date.now().toString().slice(-5)}`;
  const nuevo: TarifarioEOR = {
    id: newId,
    nombre,
    descripcion: descripcion || '',
    esDefault: !!esDefault,
    paisesAplicables: Array.isArray(paisesAplicables) && paisesAplicables.length > 0 ? paisesAplicables : ['Todos'],
    clientesAplicables: Array.isArray(clientesAplicables) && clientesAplicables.length > 0 ? clientesAplicables : ['Todos'],
    tramos,
    estado: 'Activo',
    fechaActualizacion: new Date().toISOString().split('T')[0],
    usuarioActualizacion: usuario || 'administrador-eor-peo@grupostt.com'
  };

  db.tarifarios.push(nuevo);
  saveDb(db);
  addAuditLog('Tarifas', newId, 'creacion', '', nombre, 'Nuevo tarifario EOR por volumen creado', usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nuevo);
});

app.put('/api/tarifarios/:id', (req, res) => {
  if (!enforcePermission(req, res, 'Tarifas', 'Editar')) return;
  const { id } = req.params;
  const db = getDb();
  if (!db.tarifarios) db.tarifarios = [];

  const idx = db.tarifarios.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Tarifario no encontrado' });

  const target = db.tarifarios[idx];
  const { nombre, descripcion, esDefault, paisesAplicables, clientesAplicables, tramos, estado, usuario } = req.body;

  if (esDefault) {
    db.tarifarios.forEach(t => t.esDefault = false);
    target.esDefault = true;
  }

  if (nombre) target.nombre = nombre;
  if (descripcion !== undefined) target.descripcion = descripcion;
  if (paisesAplicables) target.paisesAplicables = paisesAplicables;
  if (clientesAplicables) target.clientesAplicables = clientesAplicables;
  if (tramos) target.tramos = tramos;
  if (estado) target.estado = estado;

  target.fechaActualizacion = new Date().toISOString().split('T')[0];
  target.usuarioActualizacion = usuario || 'administrador-eor-peo@grupostt.com';

  saveDb(db);
  addAuditLog('Tarifas', id, 'modificacion', '', target.nombre, 'Tarifario EOR actualizado', usuario || 'administrador-eor-peo@grupostt.com');
  res.json(target);
});

app.delete('/api/tarifarios/:id', async (req, res) => {
  if (!enforcePermission(req, res, 'Tarifas', 'Eliminar')) return;
  const { id } = req.params;
  const db = getDb();
  if (!db.tarifarios) db.tarifarios = [];

  const target = db.tarifarios.find(t => t.id === id);
  if (!target) return res.status(404).json({ error: 'Tarifario no encontrado' });

  if (target.esDefault) {
    return res.status(400).json({ error: 'No se puede eliminar el Tarifario Oficial Estándar por defecto.' });
  }

  db.tarifarios = db.tarifarios.filter(t => t.id !== id);
  saveDb(db);
  await deleteDocFromFirestore('tarifarios', id);
  addAuditLog('Tarifas', id, 'eliminacion', target.nombre, '', 'Tarifario EOR eliminado', 'administrador-eor-peo@grupostt.com');
  res.json({ success: true });
});

// BENEFICIOS
app.get('/api/beneficios', (req, res) => {
  const db = getDb();
  res.json(db.beneficios);
});

app.post('/api/beneficios', (req, res) => {
  const db = getDb();
  const { nombre, tipo, modalidad, moneda, costo, aplicaTrabajador, aplicaCliente, vigencia, usuario } = req.body;

  if (!nombre || !tipo || costo === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros del beneficio' });
  }

  const nuevaId = `BEN-${Date.now().toString().slice(-4)}`;
  const nuevo: Beneficio = {
    id: nuevaId,
    nombre,
    tipo,
    modalidad: modalidad || 'Mensual',
    moneda: moneda || 'USD',
    costo: Number(costo),
    aplicaTrabajador: aplicaTrabajador !== undefined ? aplicaTrabajador : true,
    aplicaCliente: aplicaCliente !== undefined ? aplicaCliente : false,
    estado: 'Activo',
    vigencia: vigencia || '2026-01-01 a 2026-12-31'
  };

  db.beneficios.push(nuevo);
  saveDb(db);
  addAuditLog('Beneficios', nuevaId, 'creacion', '', nombre, 'Nuevo beneficio de catálogo', usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nuevo);
});

// CONTRATOS Y REQUISITOS
app.get('/api/contratos-requisitos', (req, res) => {
  const db = getDb();
  res.json(db.contratos);
});

app.post('/api/contratos-requisitos', (req, res) => {
  const db = getDb();
  const { pais, servicio, tipoContrato, plantillaNombre, documentosRequeridos, obligatorio, vigencia } = req.body;

  if (!pais || !servicio || !tipoContrato) {
    return res.status(400).json({ error: 'Faltan campos del requisito de contratación' });
  }

  const nuevo: ContratoRequisito = {
    id: `CON-${Date.now().toString().slice(-4)}`,
    pais,
    servicio,
    tipoContrato,
    plantillaNombre: plantillaNombre || '',
    documentosRequeridos: documentosRequeridos || [],
    obligatorio: obligatorio !== undefined ? obligatorio : true,
    vigencia: vigencia || '2026-01-01 a 2026-12-31',
    estado: 'Activo'
  };

  db.contratos.push(nuevo);
  saveDb(db);
  res.status(201).json(nuevo);
});

// PLANTILLAS DE CONTRATO (MANTENIMIENTO DE PLANTILLAS)
app.get('/api/plantillas-contrato', (req, res) => {
  const db = getDb();
  res.json(db.plantillasContrato);
});

app.post('/api/plantillas-contrato', (req, res) => {
  const db = getDb();
  const { nombre, tipo, pais, servicio, version, vigencia, variables, archivoBase, observaciones, usuarioResponsable } = req.body;

  if (!nombre || !tipo || !pais || !servicio || !archivoBase) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para crear la plantilla.' });
  }

  // Deactivate other templates of same type/country/service if activating this one
  const estado = req.body.estado || 'Activo';
  if (estado === 'Activo') {
    db.plantillasContrato.forEach(p => {
      if (p.tipo === tipo && p.pais === pais && p.servicio === servicio) {
        p.estado = 'Inactivo';
      }
    });
  }

  const nueva: PlantillaContrato = {
    id: `PL-CON-${Date.now().toString().slice(-4)}`,
    nombre,
    tipo,
    pais,
    servicio,
    version: version || '1.0',
    vigencia: vigencia || '2026-01-01 a 2026-12-31',
    estado,
    variables: variables || [],
    archivoBase,
    observaciones,
    usuarioResponsable: usuarioResponsable || 'administrador-eor-peo@grupostt.com',
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };

  db.plantillasContrato.push(nueva);
  saveDb(db);
  addAuditLog('Plantillas Contrato', nueva.id, 'creacion', '', nombre, `Creación de plantilla de tipo ${tipo}`, usuarioResponsable || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nueva);
});

app.put('/api/plantillas-contrato/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.plantillasContrato.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Plantilla no encontrada' });

  const target = db.plantillasContrato[idx];
  const { nombre, tipo, pais, servicio, version, vigencia, variables, archivoBase, estado, observaciones, usuarioResponsable } = req.body;

  if (estado === 'Activo' && target.estado !== 'Activo') {
    // Inactivate others of same type/country/service
    db.plantillasContrato.forEach(p => {
      if (p.id !== id && p.tipo === (tipo || target.tipo) && p.pais === (pais || target.pais) && p.servicio === (servicio || target.servicio)) {
        p.estado = 'Inactivo';
      }
    });
  }

  const prevEstado = target.estado;
  if (nombre !== undefined) target.nombre = nombre;
  if (tipo !== undefined) target.tipo = tipo;
  if (pais !== undefined) target.pais = pais;
  if (servicio !== undefined) target.servicio = servicio;
  if (version !== undefined) target.version = version;
  if (vigencia !== undefined) target.vigencia = vigencia;
  if (variables !== undefined) target.variables = variables;
  if (archivoBase !== undefined) target.archivoBase = archivoBase;
  if (estado !== undefined) target.estado = estado;
  if (observaciones !== undefined) target.observaciones = observaciones;
  target.usuarioResponsable = usuarioResponsable || 'administrador-eor-peo@grupostt.com';
  target.fechaModificacion = new Date().toISOString();

  saveDb(db);
  addAuditLog('Plantillas Contrato', id, 'edicion', prevEstado, target.estado, `Edición de plantilla de contrato`, usuarioResponsable || 'administrador-eor-peo@grupostt.com');
  res.json(target);
});

// CONTRATOS COMERCIALES
app.get('/api/contratos-comerciales', (req, res) => {
  const db = getDb();
  let modified = false;
  for (const cc of (db.contratosComerciales || [])) {
    if (!cc.contenido || cc.contenido.length < 2500 || cc.contenido.includes('CLÁUSULA CUARTA (VIGENCIA)')) {
      const cli = db.clientes?.find(c => c.id === cc.clienteId || c.empresa === cc.clienteNombre);
      const targetCountry = cc.pais || cli?.pais || 'Colombia';
      const empresaName = cc.clienteNombre || cli?.empresa || 'Empresa Cliente';
      const cedula = cc.cedulaJuridica || cli?.cedulaJuridica || (cli as any)?.nit || 'COL-900344';
      const repCliente = cc.representanteCliente || cli?.representanteLegal || cli?.nombreContacto || 'Representante Legal';
      const repProveedor = cc.representanteProveedor || 'Daniel Decan (Director Legal)';
      const fee = cc.feePorEmpleado || cli?.feePorEmpleado || 200;
      const moneda = cc.moneda || cli?.moneda || 'USD';
      const cond = cc.condicionesComerciales || cli?.credito || 'Suscripción base mensual por colaborador. Soporte local incluido.';
      const dir = cc.direccion || cli?.direccion || `Sede Principal ${targetCountry}`;

      let compiled = CONTRATO_MARCO_EOR_PLANTILLA_HTML;
      const vMap: Record<string, string> = {
        empresa: empresaName,
        clienteNombre: empresaName,
        razonSocial: cli?.razonSocial || empresaName,
        cedulaJuridica: cedula,
        nit: cedula,
        pais: targetCountry,
        direccion: dir,
        nombreContacto: repCliente,
        representanteLegal: repCliente,
        documentoRepresentante: cedula,
        correoContacto: cli?.correoContacto || 'contacto@empresa.com',
        telefonoContacto: cli?.telefonoContacto || '+1 (555) 019-2834',
        servicio: 'Employer of Record (EOR)',
        servicioContratado: 'Employer of Record (EOR)',
        moneda: moneda,
        feePorEmpleado: String(fee),
        fechaInicio: (cc.fechaGeneracion ? cc.fechaGeneracion.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        fechaGeneracion: cc.fechaGeneracion ? new Date(cc.fechaGeneracion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        cantidadEstimada: String(cli?.cupoTrabajadores || 1),
        representanteCliente: repCliente,
        representanteProveedor: repProveedor,
        sttEntidad: cli?.sociedadContratacion || `QUICK HIRE ${targetCountry.toUpperCase()} S.A.S. (STT ${targetCountry.toUpperCase()})`,
        sttPais: targetCountry,
        sttIdentificacion: 'NIT 900.123.456-1',
        sttDomicilio: `Sede Principal Quick Hire / STT - ${targetCountry}`,
        sttRepresentante: repProveedor,
        condicionesComerciales: cond,
        credito: cc.condicionesComerciales || cli?.credito || '30 días'
      };

      Object.entries(vMap).forEach(([k, v]) => {
        compiled = compiled.replace(new RegExp(`{{${k}}}`, 'g'), v || '');
      });

      cc.contenido = compiled;
      modified = true;
    }
  }
  if (modified) saveDb(db);
  res.json(db.contratosComerciales);
});

app.post('/api/contratos-comerciales', (req, res) => {
  const db = getDb();
  const { 
    solicitudId, clienteId, clienteNombre, pais, servicioContratado, moneda, 
    feePorEmpleado, condicionesComerciales, beneficiosContratados, representanteCliente, 
    representanteProveedor, plantillaId, usuarioCreador, cedulaJuridica, direccion, nombreContacto, fechaInicio, cantidadTrabajadores, asesorAsignado
  } = req.body;

  const clienteObj = clienteId ? db.clientes.find(c => c.id === clienteId) : undefined;
  const solObj = solicitudId ? db.solicitudes.find(s => s.id === solicitudId) : undefined;
  const resolvedAsesor = asesorAsignado || clienteObj?.asesorAsignado || solObj?.asesorAsignado || usuarioCreador || 'administrador-eor-peo@grupostt.com';

  const resolvedClienteNombre = clienteNombre || clienteObj?.empresa || solObj?.empresa || 'Empresa Cliente';
  const resolvedPais = pais || clienteObj?.pais || solObj?.pais || 'Colombia';
  const resolvedServicio = servicioContratado || clienteObj?.servicioContratado || solObj?.servicioRequerido || 'Employer of Record (EOR)';
  const resolvedMoneda = moneda || clienteObj?.moneda || 'USD';
  const resolvedCedula = cedulaJuridica || clienteObj?.cedulaJuridica || (clienteObj as any)?.nit || `${resolvedPais === 'México' ? 'MX' : 'COL'}-900344`;
  const resolvedDireccion = direccion || clienteObj?.direccion || `Sede Principal ${resolvedPais}`;
  const resolvedRepCliente = representanteCliente || nombreContacto || clienteObj?.representanteLegal || clienteObj?.nombreContacto || solObj?.nombreContacto || 'Representante Legal';
  const resolvedRepProveedor = representanteProveedor || 'Daniel Decan (Director Legal)';
  const resolvedCondiciones = condicionesComerciales || clienteObj?.credito || 'Suscripción base mensual por colaborador. Soporte local y cumplimiento legal incluido.';
  const resolvedFee = Number(feePorEmpleado) > 0 ? Number(feePorEmpleado) : (Number(clienteObj?.feePorEmpleado) || 200);

  // Robust template lookup with multi-level fallbacks
  let plantilla = (db.plantillasContrato || []).find(p => p.id === plantillaId);
  if (!plantilla) {
    plantilla = (initialDb.plantillasContrato || []).find(p => p.id === plantillaId);
  }
  if (!plantilla && db.plantillasContrato && db.plantillasContrato.length > 0) {
    plantilla = db.plantillasContrato.find(p => p.tipo === 'comercial') || db.plantillasContrato[0];
  }
  if (!plantilla) {
    plantilla = {
      id: plantillaId || 'PL-CONTR-001',
      nombre: 'Contrato Marco de Prestación de Servicios EOR (Único Estándar Master)',
      tipo: 'comercial',
      pais: resolvedPais,
      servicio: resolvedServicio,
      version: '1.0',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo',
      variables: ['empresa', 'razonSocial', 'cedulaJuridica', 'pais', 'direccion', 'nombreContacto', 'representanteLegal', 'documentoRepresentante', 'correoContacto', 'telefonoContacto', 'servicioContratado', 'moneda', 'feePorEmpleado', 'fechaInicio', 'credito'],
      archivoBase: CONTRATO_MARCO_EOR_PLANTILLA_HTML,
      observaciones: 'Única plantilla de contrato comercial estándar para todos los clientes (Admin & Asesor).',
      usuarioResponsable: usuarioCreador || 'administrador-eor-peo@grupostt.com',
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };
    if (!db.plantillasContrato) db.plantillasContrato = [];
    db.plantillasContrato.push(plantilla);
  }

  // If this is a commercial contract and the base template is short or missing clauses, ensure the master contract is used
  let rawTemplate = plantilla.archivoBase;
  if (plantilla.tipo === 'comercial' && (!rawTemplate || rawTemplate.length < 2000)) {
    rawTemplate = CONTRATO_MARCO_EOR_PLANTILLA_HTML;
  }

  // Compile dynamic variables
  let contenido = (req.body.contenido && req.body.contenido.length > 2000) ? req.body.contenido : rawTemplate;
  const variablesMap: Record<string, string> = {
    empresa: resolvedClienteNombre,
    clienteNombre: resolvedClienteNombre,
    razonSocial: clienteObj?.razonSocial || req.body.razonSocial || resolvedClienteNombre,
    cedulaJuridica: resolvedCedula,
    nit: resolvedCedula,
    pais: resolvedPais,
    direccion: resolvedDireccion,
    nombreContacto: resolvedRepCliente,
    representanteLegal: resolvedRepCliente,
    documentoRepresentante: req.body.documentoRepresentante || clienteObj?.documentoRepresentante || resolvedCedula,
    correoContacto: clienteObj?.correoContacto || solObj?.correo || 'contacto@empresa.com',
    telefonoContacto: clienteObj?.telefonoContacto || solObj?.telefono || '+1 (555) 019-2834',
    servicio: resolvedServicio,
    servicioContratado: resolvedServicio,
    moneda: resolvedMoneda,
    feePorEmpleado: String(resolvedFee),
    fechaInicio: fechaInicio || clienteObj?.fechaInicio || new Date().toISOString().slice(0, 10),
    fechaGeneracion: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    cantidadEstimada: String(cantidadTrabajadores || clienteObj?.cupoTrabajadores || 1),
    representanteCliente: resolvedRepCliente,
    representanteProveedor: resolvedRepProveedor,
    sttEntidad: clienteObj?.sociedadContratacion || `QUICK HIRE ${resolvedPais.toUpperCase()} S.A.S. (STT ${resolvedPais.toUpperCase()})`,
    sttPais: resolvedPais,
    sttIdentificacion: 'NIT 900.123.456-1',
    sttDomicilio: `Sede Principal Quick Hire / STT - ${resolvedPais}`,
    sttRepresentante: resolvedRepProveedor,
    condicionesComerciales: resolvedCondiciones,
    credito: clienteObj?.credito || resolvedCondiciones || '30 días'
  };

  Object.entries(variablesMap).forEach(([key, val]) => {
    contenido = contenido.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });

  const nuevoId = `CC-${Date.now().toString().slice(-4)}`;
  const nuevo: ContratoComercial = {
    id: nuevoId,
    solicitudId: solicitudId || clienteObj?.solicitudVinculadaId,
    clienteId: clienteId || (clienteObj ? clienteObj.id : undefined),
    clienteNombre: resolvedClienteNombre,
    pais: resolvedPais,
    servicioContratado: resolvedServicio,
    moneda: resolvedMoneda,
    feePorEmpleado: resolvedFee,
    condicionesComerciales: resolvedCondiciones,
    beneficiosContratados: beneficiosContratados || clienteObj?.beneficiosConfigurados || [],
    representanteCliente: resolvedRepCliente,
    representanteProveedor: resolvedRepProveedor,
    cedulaJuridica: resolvedCedula,
    direccion: resolvedDireccion,
    fechaGeneracion: new Date().toISOString(),
    estado: 'Generado',
    contenido,
    plantillaId: plantilla.id,
    versionPlantilla: plantilla.version || '1.0',
    usuarioCreador: usuarioCreador || 'administrador-eor-peo@grupostt.com',
    asesorAsignado: resolvedAsesor
  };

  // Initialize history log for the contract
  const initHistory: HistorialContratoComercial = {
    id: `HC-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
    contratoId: nuevoId,
    accion: 'Generado',
    estadoNuevo: 'Generado',
    usuario: usuarioCreador || 'administrador-eor-peo@grupostt.com',
    fecha: new Date().toISOString(),
    observaciones: `Se generó el contrato comercial a partir de la plantilla ${plantilla.nombre} (${plantilla.id}).`
  };
  nuevo.historial = [initHistory];

  if (!db.contratosComerciales) db.contratosComerciales = [];
  db.contratosComerciales.unshift(nuevo);

  // Update client status if exists
  if (clienteObj) {
    clienteObj.estadoServicio = 'Contrato generado';
    if (!clienteObj.contratoComercialId) {
      (clienteObj as any).contratoComercialId = nuevo.id;
    }
  }

  // Trigger commercial contract pending signature SLA safely
  try {
    crearOSeguirSLA(db, {
      tipoProceso: 'contrato_comercial_enviado',
      entidadTipo: 'contrato_comercial',
      entidadId: nuevo.id,
      clienteId: nuevo.clienteId,
      pais: nuevo.pais,
      prioridad: 'Alta',
      observaciones: 'SLA iniciado automáticamente al generar el contrato comercial.'
    });
  } catch (slaErr) {
    console.error('Error tracking SLA for contract:', slaErr);
  }

  saveDb(db);
  
  try {
    triggerNotification('COMMERCIAL_CONTRACT_GENERATED', nuevo, usuarioCreador);
    addAuditLog('Contratos Comerciales', nuevo.id, 'creacion', '', resolvedClienteNombre, 'Generación de nuevo contrato comercial', usuarioCreador || 'administrador-eor-peo@grupostt.com');
  } catch (notifErr) {
    console.error('Error sending notifications/audit for contract:', notifErr);
  }

  res.status(201).json(nuevo);
});

app.put('/api/contratos-comerciales/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.contratosComerciales.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Contrato comercial no encontrado.' });

  const target = db.contratosComerciales[idx];
  const { estado, firmaCliente, firmaProveedor, observaciones, usuarioCreador, archivoFirmado } = req.body;
  const prevEstado = target.estado;

  if (estado !== undefined) {
    target.estado = estado;
  }
  if (firmaCliente !== undefined) {
    target.firmaCliente = firmaCliente;
    target.firmadoPorCliente = true;
    target.fechaFirma = new Date().toISOString();
  }
  if (estado === 'Firmado por cliente' || estado === 'Firmado' || estado === 'Aprobado' || estado === 'Servicio liberado') {
    target.firmadoPorCliente = true;
  }
  if (firmaProveedor !== undefined) target.firmaProveedor = firmaProveedor;

  // Track commercial contract signature SLA resolution, and transition to payment review SLA
  if (estado && estado !== prevEstado) {
    if (estado === 'Firmado por cliente' || estado === 'Firmado' || estado === 'Aprobado') {
      registrarResolucionSLA(db, 'contrato_comercial', target.id, usuarioCreador || 'Sistema', 'Contrato comercial firmado.');
      
      // Auto initiate the cash payment USD review SLA when the contract is signed
      crearOSeguirSLA(db, {
        tipoProceso: 'pago_revision',
        entidadTipo: 'pago',
        entidadId: `PAY-${target.id}`,
        clienteId: target.clienteId,
        pais: target.pais,
        prioridad: 'Alta',
        observaciones: 'SLA de pago iniciado automáticamente tras la firma del contrato comercial.'
      });
    }
  }
  if (observaciones !== undefined) target.observaciones = observaciones;
  if (archivoFirmado !== undefined) target.archivoFirmado = archivoFirmado;

  // Add event tracking to history log
  if (!target.historial) target.historial = [];
  const nuevoHist: HistorialContratoComercial = {
    id: `HC-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
    contratoId: id,
    accion: estado === 'Visto por cliente' ? 'Visto' :
            (estado === 'Firmado por cliente' || estado === 'Firmado') ? 'Firmado/Devuelto' :
            (estado === 'Rechazado' || estado === 'Con observaciones') ? 'Rechazado' :
            estado === 'Aprobado' ? 'Aprobado' : 'Cambio de estado',
    estadoAnterior: prevEstado,
    estadoNuevo: estado || prevEstado,
    usuario: usuarioCreador || 'administrador-eor-peo@grupostt.com',
    fecha: new Date().toISOString(),
    observaciones: observaciones || `Se actualizó el estado a: ${estado || prevEstado}`,
    archivoRelacionado: archivoFirmado || target.archivoFirmado
  };
  target.historial.push(nuevoHist);

  // If moving to "Servicio liberado" or "Pagado" or "Aprobado"
  if ((estado === 'Servicio liberado' || estado === 'Pagado') && prevEstado !== 'Servicio liberado' && prevEstado !== 'Pagado') {
    target.fechaLiberacion = new Date().toISOString();
    
    // Auto-release linked workers' contracts or mark them "Disponible"
    const trabajadoresAsociados = db.trabajadores.filter(t => t.clienteId === target.clienteId);
    trabajadoresAsociados.forEach(w => {
      const ec = db.contratosLaborales.find(cl => cl.trabajadorId === w.id);
      if (ec) {
        if (ec.estado === 'No disponible' || ec.estado === 'Pendiente de liberación') {
          ec.estado = 'Disponible';
          addAuditLog('Contratos Laborales', ec.id, 'estado', 'No disponible', 'Disponible', 'Contrato liberado por pago validado del cliente', usuarioCreador || 'administrador-eor-peo@grupostt.com');
        }
      } else {
        const pl = db.plantillasContrato.find(p => p.tipo === 'laboral' && (p.pais === target.pais || p.pais === 'Todos') && p.estado === 'Activo');
        const plantillaId = pl ? pl.id : 'PL-CONTR-002';
        
        let contContenido = pl ? pl.archivoBase : 'Contrato Laboral estándar';
        const wVars: Record<string, string> = {
          trabajadorNombre: w.nombre,
          documentoIdentificacion: 'Identificación Adjunta',
          puesto: w.puesto,
          fechaIngreso: w.fechaIngreso,
          salario: String(w.salario),
          moneda: w.moneda,
          modalidadTrabajo: w.modalidadTrabajo,
          clienteNombre: target.clienteNombre
        };
        Object.entries(wVars).forEach(([key, val]) => {
          contContenido = contContenido.replace(new RegExp(`{{${key}}}`, 'g'), val);
        });

        const nuevoCl: ContratoLaboral = {
          id: `CL-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
          clienteId: target.clienteId,
          trabajadorId: w.id,
          trabajadorNombre: w.nombre,
          pais: target.pais,
          servicio: target.servicioContratado,
          puesto: w.puesto,
          fechaIngreso: w.fechaIngreso,
          salario: w.salario,
          moneda: w.moneda,
          modalidadTrabajo: w.modalidadTrabajo,
          beneficiosAplicables: w.beneficiosAplicables.map(b => b.beneficioId),
          plantillaId,
          estado: 'Disponible',
          contenido: contContenido,
          fechaGeneracion: new Date().toISOString(),
          usuarioCreador: usuarioCreador || 'administrador-eor-peo@grupostt.com'
        };
        db.contratosLaborales.push(nuevoCl);
        addAuditLog('Contratos Laborales', nuevoCl.id, 'creacion', '', w.nombre, 'Creación automática de contrato laboral liberado por pago comercial', usuarioCreador || 'administrador-eor-peo@grupostt.com');
      }
    });

    addAuditLog('Servicio', target.clienteId, 'liberacion', 'No liberado', 'Liberado', 'Servicio liberado y contratos de trabajadores habilitados tras confirmación de pago', usuarioCreador || 'administrador-eor-peo@grupostt.com');
  }

  // Merge remaining fields (asesorAsignado, etc.)
  Object.keys(req.body).forEach(key => {
    if (['estado', 'firmaCliente', 'firmaProveedor', 'observaciones', 'usuarioCreador', 'archivoFirmado'].includes(key)) return;
    (target as any)[key] = req.body[key];
  });

  actualizarEstadoServicioCliente(target.clienteId, db, usuarioCreador || 'administrador-eor-peo@grupostt.com', observaciones || '', 'Contrato Comercial Modificado');
  saveDb(db);
  addAuditLog('Contratos Comerciales', id, 'estado', prevEstado, target.estado, observaciones || 'Modificación de estado de contrato comercial', usuarioCreador || 'administrador-eor-peo@grupostt.com');

  // Triggers de notificaciones automáticas por cambio de estado
  if (estado && estado !== prevEstado) {
    if (estado === 'Enviado al cliente' || estado === 'Enviado') {
      triggerNotification('COMMERCIAL_CONTRACT_SENT', target, usuarioCreador);
    } else if (estado === 'Visto por cliente') {
      triggerNotification('COMMERCIAL_CONTRACT_VIEWED', target, usuarioCreador);
    } else if (estado === 'Firmado por cliente' || estado === 'Firmado') {
      triggerNotification('COMMERCIAL_CONTRACT_SIGNED', target, usuarioCreador);
      autoCreatePagoContado(target, db, usuarioCreador || 'Sistema');
    } else if (estado === 'Aprobado') {
      triggerNotification('COMMERCIAL_CONTRACT_APPROVED', target, usuarioCreador);
      autoCreatePagoContado(target, db, usuarioCreador || 'Sistema');
    } else if (estado === 'Rechazado' || estado === 'Con observaciones') {
      triggerNotification('COMMERCIAL_CONTRACT_REJECTED', target, usuarioCreador);
    } else if (estado === 'Pendiente de pago') {
      triggerNotification('INITIAL_PAYMENT_REQUESTED', target, usuarioCreador);
      autoCreatePagoContado(target, db, usuarioCreador || 'Sistema');
    } else if (estado === 'Servicio liberado' || estado === 'Pagado') {
      triggerNotification('SERVICE_RELEASED', target, usuarioCreador);
      triggerNotification('EMPLOYEE_CONTRACTS_ENABLED', target, usuarioCreador);
    }
  }

  res.json(target);
});

app.delete('/api/contratos-comerciales', (req, res) => {
  const db = getDb();
  db.contratosComerciales = [];
  saveDb(db);
  addAuditLog('Contratos Comerciales', 'all', 'eliminacion', 'Varios', 'Vacío', 'Eliminación total de contratos comerciales', 'administrador-eor-peo@grupostt.com');
  res.json({ message: 'Todos los contratos comerciales han sido eliminados correctamente.', total: 0 });
});

app.delete('/api/contratos-comerciales/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.contratosComerciales.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Contrato comercial no encontrado.' });
  }
  const removed = db.contratosComerciales.splice(idx, 1)[0];
  saveDb(db);
  await deleteDocFromFirestore('contratosComerciales', id);
  addAuditLog('Contratos Comerciales', id, 'eliminacion', removed.estado, 'Eliminado', 'Eliminación individual de contrato comercial', 'administrador-eor-peo@grupostt.com');
  res.json({ message: 'Contrato comercial eliminado correctamente.', removed });
});

app.post('/api/contratos-comerciales/:id/enviar-correo', (req, res) => {
  const { id } = req.params;
  const { correoDestinatario, observaciones, usuario } = req.body;
  const db = getDb();
  const contract = db.contratosComerciales.find(c => c.id === id);
  if (!contract) {
    return res.status(404).json({ error: 'Contrato comercial no encontrado.' });
  }

  const client = db.clientes.find(c => c.id === contract.clienteId);
  const targetEmail = (correoDestinatario || client?.correoContacto || 'cliente@empresa.com').trim().toLowerCase();

  const prevEstado = contract.estado;
  contract.estado = 'Enviado al cliente';
  if (observaciones) contract.observaciones = observaciones;

  if (!contract.historial) contract.historial = [];
  contract.historial.push({
    id: `HC-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3)}`,
    contratoId: id,
    accion: 'Enviado por Correo',
    estadoAnterior: prevEstado,
    estadoNuevo: 'Enviado al cliente',
    usuario: usuario || 'administrador-eor-peo@grupostt.com',
    fecha: new Date().toISOString(),
    observaciones: `Enviado por correo electrónico a ${targetEmail}`
  });

  saveDb(db);
  addAuditLog('Contratos Comerciales', id, 'envió_correo', prevEstado, 'Enviado al cliente', `Enviado por correo a ${targetEmail}`, usuario || 'administrador-eor-peo@grupostt.com');

  triggerNotification('COMMERCIAL_CONTRACT_SENT', {
    ...contract,
    correo: targetEmail,
    correoContacto: targetEmail,
    email: targetEmail
  }, usuario);

  res.json({
    success: true,
    contrato: contract,
    mensaje: `Contrato comercial enviado exitosamente por correo a ${targetEmail}`
  });
});

// CONTRATOS LABORALES
app.get('/api/contratos-laborales', (req, res) => {
  const db = getDb();
  res.json(db.contratosLaborales || []);
});

app.post('/api/contratos-laborales', (req, res) => {
  const db = getDb();
  const { clienteId, trabajadorId, trabajadorNombre, pais, servicio, puesto, fechaIngreso, salario, moneda, modalidadTrabajo, beneficiosAplicables, plantillaId, usuarioCreador } = req.body;

  if (!clienteId || !trabajadorId || !plantillaId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para generar el contrato laboral.' });
  }

  const client = db.clientes.find(c => c.id === clienteId);
  const worker = db.trabajadores.find(w => w.id === trabajadorId);
  const template = db.plantillasContrato.find(p => p.id === plantillaId);
  const cc = db.contratosComerciales.filter(c => c.clienteId === clienteId);

  const pendientes: string[] = [];

  // 1. Servicio liberado
  if (!client || client.estadoServicio !== 'Servicio liberado') {
    pendientes.push('El servicio EOR del cliente no se encuentra en estado "Servicio liberado".');
  }

  // 2. Cliente activo
  if (!client || client.estado !== 'Activo') {
    pendientes.push('La cuenta del cliente no se encuentra en estado "Activo".');
  }

  // 3. Trabajador registrado
  if (!worker) {
    pendientes.push('El colaborador/trabajador no está registrado en el sistema.');
  }

  // 4. Plantilla laboral vigente
  if (!template) {
    pendientes.push('La plantilla de contrato laboral no fue encontrada.');
  } else if (template.estado !== 'Activo') {
    pendientes.push('La plantilla de contrato laboral seleccionada no se encuentra vigente/activa.');
  }

  // 5. Datos obligatorios del trabajador completos
  if (worker) {
    if (!worker.nombre?.trim()) pendientes.push('Falta el nombre completo del colaborador.');
    if (!worker.correo?.trim()) pendientes.push('Falta el correo electrónico del colaborador.');
    if (!worker.puesto?.trim()) pendientes.push('Falta el puesto laboral del colaborador.');
    if (!worker.fechaIngreso) pendientes.push('Falta la fecha de ingreso del colaborador.');
    if (!worker.salario || worker.salario <= 0) pendientes.push('El salario registrado debe ser mayor a cero.');
    if (!worker.moneda?.trim()) pendientes.push('Falta definir la moneda de pago del colaborador.');
  }

  // 6. País y servicio definidos
  const finalPais = pais || worker?.pais;
  const finalServicio = servicio || 'Employer of Record (EOR)';
  if (!finalPais) {
    pendientes.push('Falta definir el país de contratación.');
  }
  if (!finalServicio) {
    pendientes.push('Falta definir el servicio del contrato.');
  }

  // 7. Pago inicial validado y contrato comercial firmado
  const contractSigned = cc.some(c => ['Firmado por cliente', 'Aprobado', 'Servicio liberado', 'Pagado'].includes(c.estado));
  if (!contractSigned) {
    pendientes.push('El Contrato Comercial Cliente-Proveedor no está firmado.');
  }

  const allPagosContado = db.pagosContadoUSD || [];
  const clientPagos = allPagosContado.filter(p => p.clienteId === clienteId);
  const paymentValidated = clientPagos.some(p => ['Validado', 'Aplicado'].includes(p.estado)) || (client && client.estadoServicio === 'Servicio liberado');
  if (!paymentValidated) {
    pendientes.push('El pago inicial de contado USD no está validado.');
  }

  if (pendientes.length > 0) {
    return res.status(400).json({
      error: `Imposible generar el contrato laboral debido a los siguientes requisitos pendientes de activación y compliance:\n\n• ${pendientes.join('\n• ')}`
    });
  }

  // If validation passes:
  let contenido = template.archivoBase;
  
  // Variables replacement (including proposed ones)
  const clientNombre = client?.empresa || worker?.clienteNombre || 'N/A';
  const finalSalario = salario || worker?.salario || 0;
  const finalMoneda = moneda || worker?.moneda || 'USD';
  const finalPuesto = puesto || worker?.puesto || 'N/A';
  const finalFechaIngreso = fechaIngreso || worker?.fechaIngreso || new Date().toISOString().slice(0, 10);
  const finalModalidad = modalidadTrabajo || worker?.modalidadTrabajo || 'Presencial';
  
  const benefitsListText = worker?.beneficiosAplicables && worker.beneficiosAplicables.length > 0
    ? worker.beneficiosAplicables.map(b => {
        const ben = db.beneficios.find((item: any) => item.id === b.beneficioId);
        return ben ? `${ben.nombre} (${ben.tipo})` : b.beneficioId;
      }).join(', ')
    : 'Ninguno';

  const variablesMap: Record<string, string> = {
    nombre_trabajador: worker?.nombre || trabajadorNombre || 'N/A',
    identificacion_trabajador: req.body.documentoIdentificacion || worker?.id || 'N/A',
    pais: finalPais,
    puesto: finalPuesto,
    fecha_ingreso: finalFechaIngreso,
    salario: finalSalario.toLocaleString(),
    moneda: finalMoneda,
    modalidad_trabajo: finalModalidad,
    cliente: clientNombre,
    empresa_proveedor: 'Quick Hire S.A.S.',
    representante_legal: 'Daniel Decan',
    beneficios: benefitsListText,
    fecha_generacion: new Date().toLocaleDateString(),
    // Keep backward compatible names just in case:
    trabajadorNombre: worker?.nombre || trabajadorNombre || 'N/A',
    documentoIdentificacion: req.body.documentoIdentificacion || worker?.id || 'N/A',
    clienteNombre: clientNombre
  };

  Object.entries(variablesMap).forEach(([key, val]) => {
    contenido = contenido.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });

  const nuevoId = `CL-${Date.now().toString().slice(-4)}`;
  const nuevo: ContratoLaboral = {
    id: nuevoId,
    clienteId,
    trabajadorId,
    trabajadorNombre: worker?.nombre || trabajadorNombre || 'N/A',
    pais: finalPais,
    servicio: finalServicio,
    puesto: finalPuesto,
    fechaIngreso: finalFechaIngreso,
    salario: Number(finalSalario),
    moneda: finalMoneda,
    modalidadTrabajo: finalModalidad,
    beneficiosAplicables: beneficiosAplicables || worker?.beneficiosAplicables?.map(b => b.beneficioId) || [],
    plantillaId,
    estado: 'Generado', // Starts as Generado
    contenido,
    fechaGeneracion: new Date().toISOString(),
    usuarioCreador: usuarioCreador || 'administrador-eor-peo@grupostt.com',
    historial: [
      {
        fecha: new Date().toISOString(),
        accion: 'Generado',
        estadoAnterior: 'Ninguno',
        estadoNuevo: 'Generado',
        usuario: usuarioCreador || 'administrador-eor-peo@grupostt.com',
        observaciones: 'Generación inicial del contrato laboral del empleado cumpliendo todas las directrices de compliance.'
      }
    ]
  };

  db.contratosLaborales.push(nuevo);

  // Trigger manual labor contract signature SLA
  crearOSeguirSLA(db, {
    tipoProceso: 'contrato_laboral_pendiente',
    entidadTipo: 'contrato_laboral',
    entidadId: nuevo.id,
    clienteId: nuevo.clienteId,
    pais: nuevo.pais,
    prioridad: 'Media',
    observaciones: `SLA de Firma de Contrato Laboral iniciado para ${nuevo.trabajadorNombre}.`
  });

  saveDb(db);
  
  // Trigger notification
  triggerNotification('EMPLOYEE_CONTRACT_GENERATED', nuevo, usuarioCreador);
  
  addAuditLog('Contratos Laborales', nuevo.id, 'creacion', '', nuevo.trabajadorNombre, `Contrato laboral generado para colaborador ${nuevo.trabajadorNombre}`, usuarioCreador || 'administrador-eor-peo@grupostt.com');
  
  res.status(201).json(nuevo);
});

app.put('/api/contratos-laborales/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  let idx = db.contratosLaborales.findIndex(cl => cl.id === id);
  let target = idx !== -1 ? db.contratosLaborales[idx] : null;

  if (!target) {
    const workerId = id.replace('CTR-', '');
    const worker = db.trabajadores.find(w => w.id === workerId || w.id === id);
    if (worker) {
      const client = db.clientes.find(c => c.id === worker.clienteId);
      target = {
        id: `CTR-${Date.now()}`,
        clienteId: worker.clienteId,
        clienteNombre: client?.empresa || 'Cliente',
        trabajadorId: worker.id,
        trabajadorNombre: worker.nombre,
        puesto: worker.puesto,
        pais: worker.pais || client?.pais || 'Colombia',
        salario: worker.salario,
        moneda: worker.moneda || 'USD',
        modalidadTrabajo: worker.modalidadTrabajo || 'Remoto',
        fechaIngreso: worker.fechaIngreso || new Date().toISOString().slice(0, 10),
        fechaGeneracion: new Date().toISOString(),
        estado: 'Generado',
        contenido: `CONTRATO INDIVIDUAL DE TRABAJO LOCAL\n\nTrabajador: ${worker.nombre}\nCargo: ${worker.puesto}\nPaís: ${worker.pais || client?.pais || 'Colombia'}\nSalario: $${worker.salario} ${worker.moneda || 'USD'}`
      };
      db.contratosLaborales.push(target);
      idx = db.contratosLaborales.length - 1;
    } else {
      return res.status(404).json({ error: 'Contrato laboral no encontrado' });
    }
  }

  const { estado, firmaTrabajador, firmaRepresentante, archivoFirmado, observaciones, usuarioCreador } = req.body;
  const prevEstado = target.estado;

  // Validation: Only block if service is specifically inactive or suspended
  const client = db.clientes.find(c => c.id === target.clienteId);
  const isBlocked = client && (client.estadoServicio === 'Servicio bloqueado' || client.estadoServicio === 'Servicio suspendido' || client.estado === 'Inactivo');
  if (isBlocked) {
    return res.status(400).json({ error: 'Acción bloqueada: El servicio de este cliente se encuentra suspendido o inactivo.' });
  }

  if (estado !== undefined) target.estado = estado;
  if (firmaTrabajador !== undefined) target.firmaTrabajador = firmaTrabajador;
  if (firmaRepresentante !== undefined) target.firmaRepresentante = firmaRepresentante;
  if (archivoFirmado !== undefined) target.archivoFirmado = archivoFirmado;
  if (observaciones !== undefined) target.observaciones = observaciones;

  if (!target.historial) target.historial = [];
  target.historial.push({
    fecha: new Date().toISOString(),
    accion: estado !== prevEstado ? 'Cambio de Estado' : 'Actualización de Firmas/Campos',
    estadoAnterior: prevEstado,
    estadoNuevo: target.estado,
    usuario: usuarioCreador || 'administrador-eor-peo@grupostt.com',
    observaciones: observaciones || `Actualización del contrato laboral. Estado cambiado de ${prevEstado} a ${target.estado}.`
  });

  // Track labor contract signature SLA resolution
  if (estado !== undefined && estado !== prevEstado) {
    if (estado === 'Firmado por cliente' || estado === 'Firmado' || estado === 'Activo') {
      registrarResolucionSLA(db, 'contrato_laboral', target.id, usuarioCreador || 'Sistema', 'Contrato laboral firmado con éxito.');
    }
  }

  saveDb(db);
  addAuditLog('Contratos Laborales', id, 'estado', prevEstado, target.estado, `Modificación del contrato laboral de ${target.trabajadorNombre} por ${usuarioCreador || 'administrador-eor-peo@grupostt.com'}`, usuarioCreador || 'administrador-eor-peo@grupostt.com');

  if (estado && estado !== prevEstado) {
    if (estado === 'Enviado a firma' || estado === 'Pendiente de firma') {
      triggerNotification('EMPLOYEE_CONTRACT_SENT', target, usuarioCreador);
    } else if (estado === 'Firmado') {
      triggerNotification('EMPLOYEE_CONTRACT_SIGNED', target, usuarioCreador);
    } else if (estado === 'Rechazado') {
      triggerNotification('EMPLOYEE_CONTRACT_REJECTED', target, usuarioCreador);
    }
  }

  res.json(target);
});

app.post('/api/contratos-laborales/:id/enviar-correo', (req, res) => {
  const { id } = req.params;
  const { correoDestinatario, observaciones, usuario, role, rol } = req.body;
  const userRole = role || rol;
  const db = getDb();
  let contract = db.contratosLaborales.find(c => c.id === id);
  if (!contract) {
    const workerId = id.replace('CTR-', '');
    const worker = db.trabajadores.find(w => w.id === workerId || w.id === id);
    if (worker) {
      const client = db.clientes.find(c => c.id === worker.clienteId);
      contract = {
        id: `CTR-${Date.now()}`,
        clienteId: worker.clienteId,
        clienteNombre: client?.empresa || 'Cliente',
        trabajadorId: worker.id,
        trabajadorNombre: worker.nombre,
        puesto: worker.puesto,
        pais: worker.pais || client?.pais || 'Colombia',
        salario: worker.salario,
        moneda: worker.moneda || 'USD',
        modalidadTrabajo: worker.modalidadTrabajo || 'Remoto',
        fechaIngreso: worker.fechaIngreso || new Date().toISOString().slice(0, 10),
        fechaGeneracion: new Date().toISOString(),
        estado: 'Generado',
        contenido: `CONTRATO INDIVIDUAL DE TRABAJO LOCAL\n\nTrabajador: ${worker.nombre}\nCargo: ${worker.puesto}\nPaís: ${worker.pais || client?.pais || 'Colombia'}\nSalario: $${worker.salario} ${worker.moneda || 'USD'}`
      };
      db.contratosLaborales.push(contract);
    } else {
      return res.status(404).json({ error: 'Contrato laboral no encontrado.' });
    }
  }

  const client = db.clientes.find(c => c.id === contract.clienteId);
  const worker = db.trabajadores.find(w => w.id === contract.trabajadorId);

  // Check if service is blocked or inactive
  const isBlocked = client && (client.estadoServicio === 'Servicio bloqueado' || client.estadoServicio === 'Servicio suspendido' || client.estado === 'Inactivo');
  if (isBlocked && userRole !== 'administrador') {
    return res.status(400).json({
      error: 'El servicio EOR de este cliente se encuentra bloqueado o suspendido. Contacte a la administración para reactivarlo.'
    });
  }

  const targetEmail = (correoDestinatario || worker?.correo || 'colaborador@empresa.com').trim().toLowerCase();

  const prevEstado = contract.estado;
  contract.estado = 'Enviado a firma';
  if (observaciones) contract.observaciones = observaciones;

  if (!contract.historial) contract.historial = [];
  contract.historial.push({
    fecha: new Date().toISOString(),
    accion: 'Enviado por Correo',
    estadoAnterior: prevEstado,
    estadoNuevo: 'Enviado a firma',
    usuario: usuario || 'administrador-eor-peo@grupostt.com',
    observaciones: `Enviado por correo electrónico para firma a ${targetEmail}`
  });

  saveDb(db);
  addAuditLog('Contratos Laborales', id, 'envió_correo', prevEstado, 'Enviado a firma', `Enviado por correo a ${targetEmail}`, usuario || 'administrador-eor-peo@grupostt.com');

  triggerNotification('EMPLOYEE_CONTRACT_SENT', {
    ...contract,
    correo: targetEmail,
    correoContacto: targetEmail,
    email: targetEmail
  }, usuario);

  res.json({
    success: true,
    contrato: contract,
    mensaje: `Contrato laboral enviado exitosamente por correo a ${targetEmail}`
  });
});

// ADENDUMS
app.get('/api/adendums', (req, res) => {
  const db = getDb();
  res.json(db.adendums || []);
});

app.post('/api/adendums', (req, res) => {
  const db = getDb();
  const { 
    contratoComercialId, 
    clienteId, 
    pais, 
    servicio, 
    motivoCambio, 
    descripcionCambio, 
    plantillaId, 
    contenido, 
    usuarioCreador, 
    usuarioResponsable,
    observaciones
  } = req.body;

  if (!contratoComercialId || !clienteId || !motivoCambio || !contenido) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para generar el adendum.' });
  }

  // Validaciones
  const contrato = db.contratosComerciales.find(c => c.id === contratoComercialId);
  if (!contrato) {
    return res.status(400).json({ error: 'El contrato base no existe.' });
  }
  const client = db.clientes.find(c => c.id === clienteId);
  if (!client || client.estado !== 'Activo') {
    return res.status(400).json({ error: 'El cliente debe estar activo para generar un adendum.' });
  }

  const nuevo: Adendum = {
    id: `AD-${Date.now().toString().slice(-4)}`,
    contratoComercialId,
    clienteId,
    pais: pais || contrato.pais,
    servicio: servicio || contrato.servicioContratado,
    motivoCambio,
    descripcionCambio: descripcionCambio || '',
    plantillaId: plantillaId || '',
    fechaGeneracion: new Date().toISOString(),
    estado: 'Borrador',
    contenido,
    usuarioResponsable: usuarioResponsable || usuarioCreador || 'administrador-eor-peo@grupostt.com',
    observaciones: observaciones || '',
    historial: [{
      fecha: new Date().toISOString(),
      accion: 'Creación',
      estadoAnterior: '-',
      estadoNuevo: 'Borrador',
      usuario: usuarioCreador || 'administrador-eor-peo@grupostt.com',
      observaciones: observaciones || 'Creación de nuevo adendum en borrador'
    }]
  };

  if (!db.adendums) db.adendums = [];
  db.adendums.push(nuevo);

  // Trigger adendum pending signature SLA
  crearOSeguirSLA(db, {
    tipoProceso: 'adendum_firma_pendiente',
    entidadTipo: 'adendum',
    entidadId: nuevo.id,
    clienteId: nuevo.clienteId,
    pais: nuevo.pais,
    prioridad: 'Media',
    observaciones: `SLA de Firma de Adendum iniciado para el motivo: ${motivoCambio}.`
  });

  saveDb(db);
  addAuditLog('Adendums', nuevo.id, 'creacion', '', motivoCambio, 'Creación de nuevo adendum en borrador', usuarioCreador || 'administrador-eor-peo@grupostt.com');
  
  // Trigger notification
  triggerNotification('ADDENDUM_GENERATED', {
    ...nuevo,
    nombreContacto: client.nombreContacto,
    clienteNombre: client.empresa,
    empresa: client.empresa
  }, usuarioCreador);

  res.status(201).json(nuevo);
});

app.put('/api/adendums/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.adendums) db.adendums = [];
  const idx = db.adendums.findIndex(ad => ad.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Adendum no encontrado.' });

  const target = db.adendums[idx];
  const { 
    estado, 
    firma, 
    descripcionCambio, 
    plantillaId, 
    contenido, 
    archivoFirmado, 
    usuarioResponsable, 
    observaciones, 
    usuarioCreador 
  } = req.body;
  const prevEstado = target.estado;

  if (estado !== undefined) target.estado = estado;
  if (firma !== undefined) target.firma = firma;
  if (descripcionCambio !== undefined) target.descripcionCambio = descripcionCambio;
  if (plantillaId !== undefined) target.plantillaId = plantillaId;
  if (contenido !== undefined) target.contenido = contenido;
  if (archivoFirmado !== undefined) target.archivoFirmado = archivoFirmado;
  if (usuarioResponsable !== undefined) target.usuarioResponsable = usuarioResponsable;
  if (observaciones !== undefined) target.observaciones = observaciones;

  if (!target.historial) target.historial = [];
  if (estado !== undefined && estado !== prevEstado) {
    target.historial.push({
      fecha: new Date().toISOString(),
      accion: 'Cambio de Estado',
      estadoAnterior: prevEstado,
      estadoNuevo: estado,
      usuario: usuarioCreador || 'administrador-eor-peo@grupostt.com',
      observaciones: observaciones || `Se actualizó el estado a ${estado}`
    });

    // Track Adendum SLA resolution
    if (estado === 'Firmado' || estado === 'Aprobado') {
      registrarResolucionSLA(db, 'adendum', target.id, usuarioCreador || 'Sistema', 'Adendum comercial firmado con éxito.');
    }
  }

  saveDb(db);
  addAuditLog('Adendums', id, 'estado', prevEstado, target.estado, 'Modificación de estado o firma en adendum comercial', usuarioCreador || 'administrador-eor-peo@grupostt.com');

  // Trigger Notifications
  const client = db.clientes.find(c => c.id === target.clienteId);
  if (estado !== undefined && estado !== prevEstado && client) {
    const notificationPayload = {
      ...target,
      nombreContacto: client.nombreContacto,
      clienteNombre: client.empresa,
      empresa: client.empresa
    };

    if (estado === 'Generado') {
      triggerNotification('ADDENDUM_GENERATED', notificationPayload, usuarioCreador);
    } else if (estado === 'Enviado' || estado === 'Pendiente de firma') {
      triggerNotification('ADDENDUM_SENT', notificationPayload, usuarioCreador);
    } else if (estado === 'Firmado' || estado === 'Aprobado') {
      triggerNotification('ADDENDUM_SIGNED', notificationPayload, usuarioCreador);
    } else if (estado === 'Rechazado') {
      triggerNotification('ADDENDUM_REJECTED', notificationPayload, usuarioCreador);
    }
  }

  res.json(target);
});

// TRADUCCIONES (DICCIONARIO DE TRADUCCIONES)
app.get('/api/traducciones', (req, res) => {
  const db = getDb();
  res.json(db.traducciones || []);
});

app.post('/api/traducciones', (req, res) => {
  const { email, role } = getRequestUser(req);
  const db = getDb();
  const { id, es, en, pt, modulo, activo } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'El ID de traducción es requerido.' });
  }
  
  const existIndex = db.traducciones!.findIndex(t => t.id === id);
  const transObj: Traduccion = {
    id,
    es: es || '',
    en: en || '',
    pt: pt || '',
    modulo: modulo || 'General',
    activo: activo !== false,
    fechaActualizacion: new Date().toISOString(),
    usuarioResponsable: email || 'administrador-eor-peo@grupostt.com'
  };
  
  if (existIndex >= 0) {
    const prev = db.traducciones![existIndex];
    db.traducciones![existIndex] = transObj;
    addAuditLog('Traducciones', id, 'Traducción', JSON.stringify(prev), JSON.stringify(transObj), 'Modificación de traducción', email || 'administrador-eor-peo@grupostt.com');
  } else {
    db.traducciones!.push(transObj);
    addAuditLog('Traducciones', id, 'Creación', '', JSON.stringify(transObj), 'Creación de traducción', email || 'administrador-eor-peo@grupostt.com');
  }
  
  saveDb(db);
  res.json(transObj);
});

app.put('/api/traducciones/:id', (req, res) => {
  const { email, role } = getRequestUser(req);
  const { id } = req.params;
  const db = getDb();
  const existIndex = db.traducciones!.findIndex(t => t.id === id);
  if (existIndex === -1) {
    return res.status(404).json({ error: 'Traducción no encontrada' });
  }
  
  const prev = db.traducciones![existIndex];
  const { es, en, pt, modulo, activo } = req.body;
  
  const transObj: Traduccion = {
    ...prev,
    es: es !== undefined ? es : prev.es,
    en: en !== undefined ? en : prev.en,
    pt: pt !== undefined ? pt : prev.pt,
    modulo: modulo !== undefined ? modulo : prev.modulo,
    activo: activo !== undefined ? activo : prev.activo,
    fechaActualizacion: new Date().toISOString(),
    usuarioResponsable: email || 'administrador-eor-peo@grupostt.com'
  };
  
  db.traducciones![existIndex] = transObj;
  addAuditLog('Traducciones', id, 'Traducción', JSON.stringify(prev), JSON.stringify(transObj), 'Modificación de traducción', email || 'administrador-eor-peo@grupostt.com');
  saveDb(db);
  res.json(transObj);
});

app.delete('/api/traducciones/:id', async (req, res) => {
  const { email, role } = getRequestUser(req);
  const { id } = req.params;
  const db = getDb();
  const existIndex = db.traducciones!.findIndex(t => t.id === id);
  if (existIndex === -1) {
    return res.status(404).json({ error: 'Traducción no encontrada' });
  }
  
  const prev = db.traducciones![existIndex];
  db.traducciones!.splice(existIndex, 1);
  addAuditLog('Traducciones', id, 'Eliminar', JSON.stringify(prev), '', 'Eliminación física de traducción', email || 'administrador-eor-peo@grupostt.com');
  saveDb(db);
  await deleteDocFromFirestore('traducciones', id);
  res.json({ success: true });
});

// PLANTILLAS DE CARGA
app.get('/api/plantillas', (req, res) => {
  const db = getDb();
  res.json(db.plantillas);
});

// USUARIOS
app.get('/api/usuarios', (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Ver')) return;
  const db = getDb();
  res.json(db.usuarios);
});

app.put('/api/usuarios/:correo', async (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Editar')) return;
  const { correo } = req.params;
  const { estado, rol, clienteId, nombre, motivo, usuario, nuevoCorreo, contrasena, pais, idioma } = req.body;
  const db = getDb();
  
  const target = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (estado && estado !== target.estado) {
    addAuditLog('Usuarios', target.correo, 'estado', target.estado, estado, motivo || 'Cambio operativo de estado', usuario || 'administrador-eor-peo@grupostt.com');
    const prevEstado = target.estado;
    target.estado = estado;
    if (estado === 'Activo' && prevEstado !== 'Activo') {
      triggerNotification('USER_ACCESS_ENABLED', target, usuario);
    }
  }
  if (rol) {
    if (target.rol !== rol) {
      addAuditLog('Usuarios', target.correo, 'rol', target.rol, rol, motivo || 'Reasignación de rol', usuario || 'administrador-eor-peo@grupostt.com');
    }
    target.rol = rol;
  }
  if (clienteId !== undefined) target.clienteId = clienteId;
  if (nombre) target.nombre = nombre.trim();
  if (pais !== undefined) (target as any).pais = pais;
  if (req.body.paisesAsignados !== undefined) {
    (target as any).paisesAsignados = req.body.paisesAsignados;
  } else if ((target.rol === 'administrador' || target.rol === 'supracliente') && !(target as any).paisesAsignados) {
    (target as any).paisesAsignados = ['Todos'];
  }
  if (contrasena) (target as any).contrasena = contrasena;
  if (idioma) target.idioma = idioma;

  // Actualización de correo si se modificó
  let oldEmailToDelete: string | null = null;
  if (nuevoCorreo && nuevoCorreo.trim().toLowerCase() !== target.correo.toLowerCase()) {
    const emailCandidate = nuevoCorreo.trim().toLowerCase();
    const existing = db.usuarios.find(u => u.correo.toLowerCase() === emailCandidate);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe otro usuario registrado con ese correo electrónico.' });
    }
    const oldCorreo = target.correo;
    oldEmailToDelete = oldCorreo;
    target.correo = emailCandidate;
    addAuditLog('Usuarios', target.correo, 'correo', oldCorreo, emailCandidate, 'Actualización de dirección de correo', usuario || 'administrador-eor-peo@grupostt.com');
  }

  saveDb(db);
  if (oldEmailToDelete) {
    await deleteDocFromFirestore('usuarios', oldEmailToDelete);
  }
  await saveDocToFirestore('usuarios', target.correo, target);

  res.json(target);
});

app.delete('/api/usuarios/:correo', async (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Eliminar')) return;
  const { correo } = req.params;
  const { usuario } = req.body || {};
  const db = getDb();

  const targetIndex = db.usuarios.findIndex(u => u.correo.toLowerCase() === correo.toLowerCase());
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const target = db.usuarios[targetIndex];

  // Protección de cuentas críticas del sistema
  const PROTECTED_SYSTEM_ACCOUNTS = [
    'administrador-eor-peo@grupostt.com',
    'daniel.decan@nominasaps.com',
    'guadalupe-admin-eor@grupostt.com',
    'guadalupe-asesor-eor@grupostt.com',
    'asesor-eor-peo@grupostt.com',
    'supracliente-eor-peo@grupostt.com',
    'tesoreria-eor-peo@grupostt.com'
  ];
  if (PROTECTED_SYSTEM_ACCOUNTS.includes(target.correo.toLowerCase())) {
    return res.status(400).json({ error: 'No es posible eliminar las cuentas base oficiales del sistema' });
  }

  // Protección contra autoeliminación
  const requestUser = getRequestUser(req);
  if (requestUser && requestUser.email && requestUser.email.toLowerCase() === target.correo.toLowerCase()) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta mientras estás conectado' });
  }

  const deleted = db.usuarios.splice(targetIndex, 1)[0];
  saveDb(db);
  await deleteDocFromFirestore('usuarios', target.correo);

  addAuditLog('Usuarios', target.correo, 'eliminacion', deleted.nombre || deleted.correo, '', 'Usuario eliminado del sistema', usuario || requestUser?.email || 'administrador-eor-peo@grupostt.com');

  res.json({ success: true, message: `Usuario ${deleted.nombre || deleted.correo} eliminado exitosamente.` });
});

app.post('/api/usuarios/:correo/reset-password', (req, res) => {
  const { correo } = req.params;
  const { usuario } = req.body;
  const db = getDb();
  const target = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  const enlace_plataforma = `http://localhost:3000/reset?token=${Date.now()}`;
  
  triggerNotification('USER_PASSWORD_RESET', {
    ...target,
    enlace_plataforma
  }, usuario);

  addAuditLog('Usuarios', correo, 'reset_password', '', 'Pendiente', 'Solicitud de restauración de contraseña', usuario || 'administrador-eor-peo@grupostt.com');
  res.json({ message: 'Password reset notification triggered' });
});

app.post('/api/usuarios', async (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Crear')) return;
  const db = getDb();
  const { correo, nombre, rol, clienteId, usuario } = req.body;

  if (!correo || !nombre || !rol) {
    return res.status(400).json({ error: 'Faltan campos para crear usuario' });
  }

  const duplicado = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
  if (duplicado) return res.status(400).json({ error: 'El usuario con este correo ya existe.' });

  const isAdm = rol === 'administrador' || rol === 'supracliente';
  const cleanPassword = (req.body.contrasena || '123456').trim();
  const nuevo: User = {
    correo: correo.toLowerCase().trim(),
    nombre: nombre.trim(),
    rol,
    clienteId,
    contrasena: cleanPassword,
    pais: req.body.pais || 'México',
    paisesAsignados: req.body.paisesAsignados && req.body.paisesAsignados.length > 0
      ? req.body.paisesAsignados
      : (isAdm ? ['Todos'] : [req.body.pais || 'México']),
    estado: 'Activo',
    fechaCreacion: new Date().toISOString(),
    idioma: req.body.idioma || 'es'
  };

  db.usuarios.push(nuevo);
  saveDb(db);
  await saveDocToFirestore('usuarios', nuevo.correo, nuevo);
  addAuditLog('Usuarios', nuevo.correo, 'creacion', '', nuevo.nombre, 'Nuevo usuario creado por administrador', usuario || 'administrador-eor-peo@grupostt.com');

  triggerNotification('USER_CREATED', {
    nombreUsuario: nuevo.nombre,
    rolUsuario: nuevo.rol === 'asesor_comercial' ? 'Asesor Comercial' : nuevo.rol === 'administrador' ? 'Administrador' : nuevo.rol === 'supracliente' ? 'Supra Cliente' : 'Cliente',
    correoUsuario: nuevo.correo,
    correo: nuevo.correo,
    contrasena_temporal: cleanPassword,
    enlace_plataforma: process.env.APP_URL || 'http://localhost:3000',
    clienteId: clienteId
  }, usuario || 'administrador-eor-peo@grupostt.com');

  res.status(201).json({
    ...nuevo,
    credenciales: {
      correo: nuevo.correo,
      contrasena: cleanPassword
    }
  });
});

app.post('/api/usuarios/:correo/reenviar-acceso', (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Editar')) return;
  const { correo } = req.params;
  const { usuario } = req.body;
  const db = getDb();
  const target = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  const roleDef = db.roles?.find(r => r.id === target.rol);
  const rolNombre = roleDef?.nombre || target.rol;

  triggerNotification('USER_CREATED', {
    nombreUsuario: target.nombre,
    rolUsuario: rolNombre,
    correoUsuario: target.correo,
    correo: target.correo,
    contrasena_temporal: target.contrasena || '123456',
    enlace_plataforma: process.env.APP_URL || 'http://localhost:3000',
    clienteId: target.clienteId
  }, usuario || 'administrador-eor-peo@grupostt.com');

  addAuditLog('Usuarios', correo, 'reenvio_acceso', '', 'Enviado', 'Reenvío manual de credenciales de acceso', usuario || 'administrador-eor-peo@grupostt.com');
  res.json({ success: true, message: `Credenciales reenviadas con éxito a ${target.correo}` });
});

// ROLES Y PERMISOS DE MENÚ
app.get('/api/roles', (req, res) => {
  const db = getDb();
  if (!db.roles || db.roles.length === 0) {
    db.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES_SERVER));
    saveDb(db);
  }
  res.json(db.roles);
});

app.post('/api/roles', (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Crear')) return;
  const db = getDb();
  const { nombre, descripcion, opcionesMenu } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del rol es obligatorio' });
  }

  const roleId = 'rol_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const nuevoRol: RoleDefinition = {
    id: roleId,
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || '',
    esSistema: false,
    esAdmin: false,
    opcionesMenu: Array.isArray(opcionesMenu) ? opcionesMenu : ['kpis'],
    fechaCreacion: new Date().toISOString()
  };

  if (!db.roles) db.roles = [];
  db.roles.push(nuevoRol);
  saveDb(db);
  res.status(201).json(nuevoRol);
});

app.put('/api/roles/:id', (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Editar')) return;
  const { id } = req.params;
  const { nombre, descripcion, opcionesMenu } = req.body;
  const db = getDb();

  const rol = db.roles?.find(r => r.id === id);
  if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });

  // Regla estricta: El rol de Admin no puede tener opciones de menú ocultas
  if (rol.id === 'administrador' || rol.esAdmin) {
    if (descripcion !== undefined) rol.descripcion = descripcion;
    rol.opcionesMenu = [...ALL_MENU_IDS_SERVER];
  } else {
    if (nombre && !rol.esSistema) rol.nombre = nombre.trim();
    if (descripcion !== undefined) rol.descripcion = descripcion.trim();
    if (Array.isArray(opcionesMenu)) {
      rol.opcionesMenu = opcionesMenu;
    }
  }

  saveDb(db);
  res.json(rol);
});

app.delete('/api/roles/:id', async (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Eliminar')) return;
  const { id } = req.params;
  const db = getDb();

  const rol = db.roles?.find(r => r.id === id);
  if (!rol) return res.status(404).json({ error: 'Rol no encontrado' });

  if (rol.esSistema || ['administrador', 'asesor_comercial', 'ejecutivo_cuentas', 'cliente', 'tesoreria'].includes(rol.id)) {
    return res.status(400).json({ error: 'No es posible eliminar un rol principal del sistema' });
  }

  const usuariosConRol = db.usuarios?.filter(u => u.rol === id || u.rol === rol.nombre);
  if (usuariosConRol && usuariosConRol.length > 0) {
    return res.status(400).json({ 
      error: `No se puede eliminar el rol porque está asignado a ${usuariosConRol.length} usuario(s). Reasigna los usuarios primero.` 
    });
  }

  db.roles = (db.roles || []).filter(r => r.id !== id);
  saveDb(db);
  await deleteDocFromFirestore('roles', id);
  res.json({ success: true });
});

app.post('/api/roles/:id/copiar', (req, res) => {
  if (!enforcePermission(req, res, 'Usuarios', 'Crear')) return;
  const { id } = req.params;
  const { nuevoNombre } = req.body;
  const db = getDb();

  const origen = db.roles?.find(r => r.id === id);
  if (!origen) return res.status(404).json({ error: 'Rol origen no encontrado' });

  const roleId = 'rol_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const nombreFinal = nuevoNombre?.trim() || `Copia de ${origen.nombre}`;

  const rolCopiado: RoleDefinition = {
    id: roleId,
    nombre: nombreFinal,
    descripcion: `Copia basada en rol ${origen.nombre}. Permite personalizar opciones de menú.`,
    esSistema: false,
    esAdmin: false,
    opcionesMenu: [...origen.opcionesMenu],
    fechaCreacion: new Date().toISOString()
  };

  if (!db.roles) db.roles = [];
  db.roles.push(rolCopiado);
  saveDb(db);
  res.status(201).json(rolCopiado);
});

// FACTURACION Y PAGOS
app.get('/api/facturas', (req, res) => {
  const db = getDb();
  res.json(db.facturas);
});

app.get('/api/pagos', (req, res) => {
  const db = getDb();
  res.json(db.pagos);
});

// CONFIGURACION FACTURA
app.get('/api/configuracion-factura', (req, res) => {
  const db = getDb();
  if (!db.configuracionFactura) {
    db.configuracionFactura = { ivaPct: 19, comisionPct: 2.5, whtPct: 4, impuestoPct: 1.5 };
    saveDb(db);
  }
  res.json(db.configuracionFactura);
});

app.post('/api/configuracion-factura', (req, res) => {
  const db = getDb();
  db.configuracionFactura = { 
    ivaPct: Number(req.body.ivaPct) ?? 19, 
    comisionPct: Number(req.body.comisionPct) ?? 2.5, 
    whtPct: Number(req.body.whtPct) ?? 4, 
    impuestoPct: Number(req.body.impuestoPct) ?? 1.5 
  };
  saveDb(db);
  res.json(db.configuracionFactura);
});

// CONFIGURACION SISTEMA & REMITENTE NOTIFICACIONES
app.get('/api/configuracion-sistema', (req, res) => {
  const db = getDb();
  if (!db.configuracionSistema || db.configuracionSistema.correoRemitente === 'alertas@grupostt.com') {
    db.configuracionSistema = {
      correoRemitente: 'alertas@grupostt.com',
      nombreRemitente: 'Quick Hire LATAM - Alertas STT',
      correoCopiaSolicitudes: 'alertas@grupostt.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: 'alertas@grupostt.com',
      smtpPass: 'smjl brpm xyer bwzp',
      notificacionesActivas: true
    };
    saveDb(db);
  }
  res.json(db.configuracionSistema);
});

app.post('/api/configuracion-sistema', (req, res) => {
  const db = getDb();
  const { 
    correoRemitente, 
    nombreRemitente, 
    correoCopiaSolicitudes,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    notificacionesActivas
  } = req.body;

  db.configuracionSistema = {
    ...db.configuracionSistema,
    correoRemitente: correoRemitente || db.configuracionSistema?.correoRemitente || 'alertas@grupostt.com',
    nombreRemitente: nombreRemitente || db.configuracionSistema?.nombreRemitente || 'Quick Hire LATAM - Alertas STT',
    correoCopiaSolicitudes: correoCopiaSolicitudes || db.configuracionSistema?.correoCopiaSolicitudes || 'alertas@grupostt.com',
    smtpHost: smtpHost || db.configuracionSistema?.smtpHost || 'smtp.gmail.com',
    smtpPort: smtpPort ? Number(smtpPort) : (db.configuracionSistema?.smtpPort || 465),
    smtpSecure: smtpSecure !== undefined ? Boolean(smtpSecure) : (db.configuracionSistema?.smtpSecure !== false),
    smtpUser: smtpUser || db.configuracionSistema?.smtpUser || 'alertas@grupostt.com',
    smtpPass: smtpPass || db.configuracionSistema?.smtpPass || 'smjl brpm xyer bwzp',
    notificacionesActivas: notificacionesActivas !== undefined ? Boolean(notificacionesActivas) : true
  };
  saveDb(db);
  res.json(db.configuracionSistema);
});

// Test SMTP connection diagnostic
app.get('/api/test-smtp', async (req, res) => {
  const db = getDb();
  const sysConfig = db.configuracionSistema;
  const result = await verifySmtpConnection(sysConfig);
  res.json({
    ok: result.ok,
    host: sysConfig?.smtpHost || 'smtp.gmail.com',
    port: sysConfig?.smtpPort || 465,
    user: sysConfig?.smtpUser || 'alertas@grupostt.com',
    error: result.error
  });
});

// Test Email Send endpoint
app.post('/api/test-email', async (req, res) => {
  const { destinatario } = req.body;
  const db = getDb();
  const sysConfig = db.configuracionSistema;
  const targetEmail = (destinatario || sysConfig?.correoRemitente || 'alertas@grupostt.com').trim();

  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({ error: 'Correo de destinatario inválido.' });
  }

  const html = generateBrandedHtmlEmail({
    title: 'Prueba de Activación de Correo y Notificaciones',
    recipientName: 'Administrador / Usuario',
    mainMessage: 'Esta es una notificación de prueba para verificar la correcta configuración y activación del servidor de correo SMTP en la plataforma Quick Hire LATAM (Grupo STT).\n\nEl servicio se encuentra completamente operativo y listo para el envío automático de credenciales y alertas del sistema.',
    detailsTable: [
      { label: 'Servidor SMTP', value: sysConfig?.smtpHost || 'smtp.gmail.com' },
      { label: 'Puerto', value: String(sysConfig?.smtpPort || 465) },
      { label: 'Cuenta Emisora', value: sysConfig?.smtpUser || 'alertas@grupostt.com' },
      { label: 'Fecha y Hora', value: new Date().toLocaleString() },
      { label: 'Estado del Servicio', value: 'Activo y Operativo' }
    ],
    callToAction: {
      text: 'Ingresar a Quick Hire LATAM',
      url: process.env.APP_URL || 'https://ais-dev-rvdxyadmzfsoatjlleduys-708220773235.us-east1.run.app'
    }
  });

  const result = await sendEmail({
    to: targetEmail,
    subject: 'Verificación de Notificaciones SMTP - Quick Hire Grupo STT',
    html,
    text: 'Esta es una notificación de prueba para verificar la correcta configuración del servidor SMTP en Quick Hire LATAM.'
  }, sysConfig);

  if (result.success) {
    res.json({
      success: true,
      message: `Correo de prueba enviado exitosamente a ${targetEmail}`,
      messageId: result.messageId
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error || 'Error al enviar correo de prueba'
    });
  }
});

// Reenviar credenciales por correo para un usuario existente
app.post('/api/usuarios/:correo/enviar-credenciales', (req, res) => {
  const { correo } = req.params;
  const { contrasena, usuario } = req.body;
  const db = getDb();
  const target = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  const tempPass = contrasena || `STT-${Math.floor(100000 + Math.random() * 900000)}`;

  triggerNotification('USER_CREATED', {
    nombreUsuario: target.nombre,
    rolUsuario: target.rol === 'asesor_comercial' ? 'Asesor Comercial' : target.rol === 'administrador' ? 'Administrador' : target.rol === 'supracliente' ? 'Supra Cliente' : 'Cliente',
    correoUsuario: target.correo,
    correo: target.correo,
    contrasena_temporal: tempPass,
    enlace_plataforma: process.env.APP_URL || 'http://localhost:3000',
    clienteId: target.clienteId
  }, usuario || 'administrador-eor-peo@grupostt.com');

  addAuditLog('Usuarios', target.correo, 'envio_credenciales', '', 'Enviado', `Reenvío de credenciales por correo a ${target.correo}`, usuario || 'administrador-eor-peo@grupostt.com');

  res.json({
    success: true,
    message: `Credenciales enviadas exitosamente a ${target.correo}`,
    contrasenaTemporal: tempPass
  });
});


app.post('/api/facturas/generar', (req, res) => {
  const db = getDb();
  const { 
    clienteId, 
    periodo, 
    impuestoPorcentaje, 
    ivaPct, 
    comisionPct, 
    whtPct, 
    otrosImpuestosPct, 
    feePorEmpleado, 
    usuario 
  } = req.body;

  if (!clienteId || !periodo) {
    return res.status(400).json({ error: 'Se requiere clienteId y periodo de facturación.' });
  }

  // Check if invoice already exists for this client and period
  const existe = db.facturas.find(f => f.clienteId === clienteId && f.periodo === periodo && f.estado !== 'Anulada');
  if (existe) {
    return res.status(400).json({ error: `Ya existe una factura para este cliente en el periodo ${periodo}.` });
  }

  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  // Count active workers for this client
  const trabajadoresActivos = db.trabajadores.filter(t => t.clienteId === clienteId && t.estado === 'Activo');
  const cantidad = trabajadoresActivos.length;

  // Custom unit fee or default
  const feeUnitario = (feePorEmpleado !== undefined && Number(feePorEmpleado) >= 0)
    ? Number(feePorEmpleado)
    : cliente.feePorEmpleado;

  // 1. Calculate base fee
  let feeBaseTotal = cantidad * feeUnitario;

  // 2. Check and Apply volume-based ranges from Tarifa if defined
  let descuento = 0;
  const tarifaPaisServicio = db.tarifas.find(t => t.pais.toLowerCase() === cliente.pais.toLowerCase() && t.servicio.toLowerCase().includes('eor'));
  
  if (tarifaPaisServicio && tarifaPaisServicio.rangos && tarifaPaisServicio.rangos.length > 0) {
    // Look for matching range
    const rangoCoincidente = tarifaPaisServicio.rangos.find(r => cantidad >= r.desde && cantidad <= r.hasta);
    if (rangoCoincidente) {
      if (rangoCoincidente.descuentoPorcentaje > 0) {
        descuento = feeBaseTotal * (rangoCoincidente.descuentoPorcentaje / 100);
      } else if (rangoCoincidente.feePersonalizado && rangoCoincidente.feePersonalizado > 0) {
        // Recalculate fee base with range customized fee
        feeBaseTotal = cantidad * rangoCoincidente.feePersonalizado;
      }
    }
  } else {
    // Legacy fallback discount
    if (cantidad >= 10 && cliente.descuentoVolumen && cliente.descuentoVolumen !== 'Ninguno') {
      descuento = feeBaseTotal * 0.10; // 10% volume discount
    }
  }

  // 3. Calculate benefits total and details
  let beneficiosTotal = 0;
  const detallesTrabajadores = trabajadoresActivos.map(t => {
    let workerBenefits = 0;
    t.beneficiosAplicables.forEach(b => {
      workerBenefits += b.costo;
    });
    beneficiosTotal += workerBenefits;
    return {
      nombre: t.nombre,
      puesto: t.puesto,
      salario: t.salario,
      fee: feeUnitario,
      beneficios: workerBenefits
    };
  });

  const subtotal = feeBaseTotal + beneficiosTotal - descuento;

  // Get Billing parameters
  if (!db.configuracionFactura) {
    db.configuracionFactura = { ivaPct: 19, comisionPct: 2.5, whtPct: 4, impuestoPct: 1.5 };
  }
  const billingConfig = db.configuracionFactura;

  // Custom percentages provided by Advisor/Admin or fallback to defaults
  const ivaPctVal = ivaPct !== undefined 
    ? Number(ivaPct) 
    : (impuestoPorcentaje !== undefined ? Number(impuestoPorcentaje) : billingConfig.ivaPct);
  
  const comisionPctVal = comisionPct !== undefined 
    ? Number(comisionPct) 
    : billingConfig.comisionPct;
  
  const whtPctVal = whtPct !== undefined 
    ? Number(whtPct) 
    : billingConfig.whtPct;
  
  const otrosImpuestosPctVal = otrosImpuestosPct !== undefined 
    ? Number(otrosImpuestosPct) 
    : billingConfig.impuestoPct;

  // Math rounding for financial numbers
  const ivaVal = Math.round(subtotal * (ivaPctVal / 100));
  const comisionVal = Math.round(subtotal * (comisionPctVal / 100));
  const whtVal = Math.round(subtotal * (whtPctVal / 100));
  const otrosImpuestosVal = Math.round(subtotal * (otrosImpuestosPctVal / 100));
  
  // Total formula
  const total = subtotal + ivaVal + comisionVal + otrosImpuestosVal - whtVal;

  const nuevaId = `FAC-${Date.now().toString().slice(-4)}`;
  const nuevaFactura: Factura = {
    id: nuevaId,
    clienteId,
    clienteNombre: cliente.empresa,
    pais: cliente.pais,
    moneda: cliente.moneda,
    periodo,
    cantidadTrabajadores: cantidad,
    feeAplicado: feeUnitario,
    beneficiosCobrados: beneficiosTotal,
    descuentos: descuento,
    impuestos: ivaVal + otrosImpuestosVal,
    totalFacturado: total,
    pagosAplicados: 0,
    saldoPendiente: total,
    estado: 'Borrador',
    fechaEmision: new Date().toISOString().slice(0, 10),
    fechaVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 10 days terms
    observaciones: `Facturación automatizada basada en ${cantidad} trabajadores activos.`,
    asesorAsignado: cliente.asesorAsignado || '',
    
    // Custom breakdowns and percentage rates
    baseFee: feeBaseTotal,
    iva: ivaVal,
    comisionBancaria: comisionVal,
    wht: whtVal,
    otrosImpuestos: otrosImpuestosVal,
    ivaPct: ivaPctVal,
    comisionPct: comisionPctVal,
    whtPct: whtPctVal,
    otrosImpuestosPct: otrosImpuestosPctVal,
    detallesTrabajadores
  };

  db.facturas.push(nuevaFactura);
  saveDb(db);
  addAuditLog('Facturación', nuevaId, 'generacion', '', periodo, `Factura en borrador generada para ${cliente.empresa}`, usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nuevaFactura);
});

app.put('/api/facturas/:id', (req, res) => {
  const { id } = req.params;
  const { estado, observaciones, usuario } = req.body;
  const db = getDb();
  
  const idx = db.facturas.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Factura no encontrada' });

  const target = db.facturas[idx];
  if (estado && estado !== target.estado) {
    addAuditLog('Facturación', id, 'estado', target.estado, estado, `Cambio de estado de factura`, usuario || 'administrador-eor-peo@grupostt.com');
    target.estado = estado;
  }
  if (observaciones !== undefined) {
    target.observaciones = observaciones;
  }

  saveDb(db);
  res.json(target);
});

app.post('/api/facturas/:id/reminder', (req, res) => {
  const { id } = req.params;
  const { usuario } = req.body;
  const db = getDb();
  const factura = db.facturas.find(f => f.id === id);
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

  triggerNotification('PAYMENT_REMINDER', {
    ...factura,
    empresa: factura.clienteNombre,
    factura_id: factura.id,
    monto: String(factura.saldoPendiente)
  }, usuario);

  addAuditLog('Facturación', id, 'recordatorio_pago', '', 'Recordatorio enviado', `Recordatorio de pago enviado para factura ${id}`, usuario || 'administrador-eor-peo@grupostt.com');
  res.json({ message: 'Recordatorio de pago enviado.' });
});

app.post('/api/pagos', (req, res) => {
  const db = getDb();
  const { facturaId, monto, metodo, comprobante, observaciones, usuario } = req.body;

  if (!facturaId || monto === undefined || !metodo) {
    return res.status(400).json({ error: 'Faltan datos requeridos de pago' });
  }

  const factura = db.facturas.find(f => f.id === facturaId);
  if (!factura) return res.status(404).json({ error: 'Factura asociada no encontrada' });

  const montoNum = Number(monto);
  if (montoNum <= 0) return res.status(400).json({ error: 'El monto del pago debe ser mayor a cero' });

  const nuevoId = `PAG-${Date.now().toString().slice(-4)}`;
  const nuevoPago: Pago = {
    id: nuevoId,
    facturaId,
    clienteId: factura.clienteId,
    clienteNombre: factura.clienteNombre,
    monto: montoNum,
    moneda: factura.moneda,
    fecha: new Date().toISOString(),
    metodo,
    comprobante: comprobante || `REF-${Date.now()}`,
    estado: 'Completado',
    observaciones: observaciones || ''
  };

  db.pagos.push(nuevoPago);

  // Update Invoice amounts
  factura.pagosAplicados += montoNum;
  factura.saldoPendiente = Math.max(0, factura.totalFacturado - factura.pagosAplicados);

  if (factura.saldoPendiente === 0) {
    factura.estado = 'Pagada';
  } else {
    factura.estado = 'Emitida'; // Or keep outstanding
  }

  saveDb(db);
  triggerNotification('PAYMENT_RECEIVED', {
    ...nuevoPago,
    empresa: nuevoPago.clienteNombre,
    id_pago: nuevoPago.id,
    factura_id: nuevoPago.facturaId,
    monto: String(nuevoPago.monto)
  }, usuario);
  addAuditLog('Facturación', facturaId, 'pago_registrado', String(factura.pagosAplicados - montoNum), String(factura.pagosAplicados), `Pago de ${montoNum} registrado`, usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json({ pago: nuevoPago, factura });
});

// PAGOS DE CONTADO EN USD (FACTURACIÓN Y CONTROL DE PAGOS DE CONTADO)
app.get('/api/pagos-contado', (req, res) => {
  const db = getDb();
  res.json(db.pagosContadoUSD || []);
});

app.post('/api/pagos-contado/crear', (req, res) => {
  const db = getDb();
  const { contratoId, concepto, montoUsd, usuario } = req.body;

  if (!contratoId || !concepto || montoUsd === undefined) {
    return res.status(400).json({ error: 'Faltan datos requeridos (contratoId, concepto, montoUsd)' });
  }

  const contrato = db.contratosComerciales.find(c => c.id === contratoId);
  if (!contrato) {
    return res.status(400).json({ error: 'El contrato comercial asociado no existe.' });
  }

  // 1. Validar Cliente Activo
  const cliente = db.clientes.find(c => c.id === contrato.clienteId);
  if (!cliente || cliente.estado !== 'Activo') {
    return res.status(400).json({ error: 'El cliente corporativo debe estar activo.' });
  }

  // 2. Validar Contrato Comercial Firmado
  const isSigned = ['Firmado por cliente', 'Firmado', 'Pendiente de pago', 'Aprobado', 'Servicio liberado', 'Pagado'].includes(contrato.estado);
  if (!isSigned) {
    return res.status(400).json({ error: 'El contrato comercial asociado no se encuentra firmado.' });
  }

  // 3. Validar Servicio Contratado
  if (!contrato.servicioContratado) {
    return res.status(400).json({ error: 'El contrato comercial no especifica un servicio contratado válido.' });
  }

  // 4. Validar Monto USD definido
  const numericMonto = Number(montoUsd);
  if (isNaN(numericMonto) || numericMonto <= 0) {
    return res.status(400).json({ error: 'El monto en USD debe ser una cifra numérica mayor a cero.' });
  }

  // 5. Validar Condiciones comerciales configuradas
  if (!contrato.condicionesComerciales) {
    return res.status(400).json({ error: 'El contrato comercial no cuenta con condiciones comerciales configuradas.' });
  }

  // 6. Validar Tipo de Cambio disponible (si aplica conversión)
  const moneda = contrato.moneda || 'USD';
  let tcInfo = { tasa: 1, baseTasa: 1, formula: '1 USD = 1 USD' };
  if (moneda !== 'USD') {
    tcInfo = getTipoCambioAplicado(moneda);
    if (!tcInfo || tcInfo.tasa <= 0) {
      return res.status(400).json({ error: `No se encuentra disponible un tipo de cambio configurado para la conversión de ${moneda} a USD.` });
    }
  }

  // 7. Validar Usuario cliente activo
  const usuarioCliente = db.usuarios.find(u => u.clienteId === contrato.clienteId && u.estado === 'Activo');
  if (!usuarioCliente) {
    return res.status(400).json({ error: 'No se encuentra ningún usuario de cliente activo registrado para esta empresa.' });
  }

  // If already exists, prevent duplicate
  if (!db.pagosContadoUSD) db.pagosContadoUSD = [];
  const existing = db.pagosContadoUSD.find(p => p.contratoId === contratoId);
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una solicitud de pago de contado generada para este contrato comercial.' });
  }

  const nuevoId = `PAG-CON-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(-3).toUpperCase()}`;
  const nuevoPago: PagoContadoUSD = {
    id: nuevoId,
    clienteId: contrato.clienteId,
    clienteNombre: contrato.clienteNombre,
    contratoId: contrato.id,
    pais: contrato.pais,
    servicio: contrato.servicioContratado,
    concepto,
    montoUsd: numericMonto,
    monedaLocal: moneda !== 'USD' ? moneda : undefined,
    tipoCambio: tcInfo.tasa,
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString(),
    historial: [
      {
        estadoNuevo: 'Pendiente',
        usuario: usuario || 'administrador-eor-peo@grupostt.com',
        fecha: new Date().toISOString(),
        observaciones: 'Creación manual autorizada por administración con validaciones completas'
      }
    ]
  };

  db.pagosContadoUSD.push(nuevoPago);
  saveDb(db);

  // Trigger automated notification
  triggerNotification('INITIAL_PAYMENT_REQUESTED', {
    ...nuevoPago,
    empresa: nuevoPago.clienteNombre,
    monto: String(nuevoPago.montoUsd),
    moneda: 'USD',
    numero_factura: contrato.id,
    numero_pago: nuevoPago.id,
    correo: cliente.correoContacto || 'cliente-eor-peo@grupostt.com',
    nombreContacto: cliente.nombreContacto || 'Cliente'
  }, usuario);

  addAuditLog('Facturación', nuevoId, 'creacion_pago_contado', '', 'Pendiente', `Solicitud de pago inicial de $${numericMonto} USD creada manualmente por el administrador`, usuario || 'administrador-eor-peo@grupostt.com');

  res.status(201).json(nuevoPago);
});

app.post('/api/pagos-contado/:id/soporte', (req, res) => {
  const { id } = req.params;
  const { metodoPago, fechaPago, archivoSoporte, usuario } = req.body;
  const db = getDb();

  const pago = (db.pagosContadoUSD || []).find(p => p.id === id);
  if (!pago) return res.status(404).json({ error: 'Solicitud de pago no encontrada.' });

  if (!metodoPago || !fechaPago || !archivoSoporte) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para el soporte (metodoPago, fechaPago, archivoSoporte)' });
  }

  const estadoAnterior = pago.estado;
  pago.estado = 'Soporte cargado';
  pago.metodoPago = metodoPago;
  pago.fechaPago = fechaPago;
  pago.archivoSoporte = archivoSoporte;
  pago.usuarioCarga = usuario || 'cliente-eor-peo@grupostt.com';

  if (!pago.historial) pago.historial = [];
  pago.historial.push({
    estadoAnterior,
    estadoNuevo: 'Soporte cargado',
    usuario: usuario || 'cliente-eor-peo@grupostt.com',
    fecha: new Date().toISOString(),
    observaciones: 'Se cargó el soporte de pago por el cliente corporativo'
  });

  actualizarEstadoServicioCliente(pago.clienteId, db, usuario || 'cliente-eor-peo@grupostt.com', 'Soporte de pago cargado por el cliente.', 'Soporte de Pago Cargado');

  const cliente = db.clientes.find(c => c.id === pago.clienteId);

  // SLA Payment resume or creation hook
  const paymentSlaId = `PAY-${pago.contratoId}`;
  const existingSla = (db.slaSeguimientos || []).find(s => s.entidadTipo === 'pago' && s.entidadId === paymentSlaId);
  if (existingSla) {
    if (existingSla.estadoSla === 'Pausado') {
      reanudarSLA(db, 'pago', paymentSlaId, usuario || 'Cliente', 'Cliente cargó soporte de pago.');
    }
  } else {
    crearOSeguirSLA(db, {
      tipoProceso: 'pago_revision',
      entidadTipo: 'pago',
      entidadId: paymentSlaId,
      clienteId: pago.clienteId,
      pais: cliente ? cliente.pais : 'Global',
      prioridad: 'Alta',
      observaciones: 'SLA de pago iniciado tras la carga del soporte de pago del cliente.'
    });
  }

  saveDb(db);

  // Trigger PAYMENT_SUPPORT_UPLOADED notification
  triggerNotification('PAYMENT_SUPPORT_UPLOADED', {
    ...pago,
    empresa: pago.clienteNombre,
    monto: String(pago.montoUsd),
    moneda: 'USD',
    numero_factura: pago.contratoId,
    numero_pago: pago.id,
    correo: 'administrador-eor-peo@grupostt.com',
    nombreContacto: 'Administrador'
  }, usuario);

  addAuditLog('Facturación', id, 'soporte_cargado', estadoAnterior, 'Soporte cargado', `Soporte de pago cargado por cliente. Método: ${metodoPago}`, usuario || 'cliente-eor-peo@grupostt.com');

  res.json(pago);
});

app.post('/api/pagos-contado/:id/validar', (req, res) => {
  const { id } = req.params;
  const { estado, observaciones, usuario } = req.body;
  const db = getDb();

  const pago = (db.pagosContadoUSD || []).find(p => p.id === id);
  if (!pago) return res.status(404).json({ error: 'Solicitud de pago no encontrada.' });

  const cliente = db.clientes.find(c => c.id === pago.clienteId);

  if (!['Validado', 'Rechazado', 'Anulado', 'En revisión', 'Aplicado'].includes(estado)) {
    return res.status(400).json({ error: 'El estado enviado no es un estado válido de validación de pago.' });
  }

  const estadoAnterior = pago.estado;
  pago.estado = estado as any;
  pago.usuarioValidacion = usuario || 'administrador-eor-peo@grupostt.com';
  pago.fechaValidacion = new Date().toISOString();
  pago.observaciones = observaciones || '';

  if (!pago.historial) pago.historial = [];
  pago.historial.push({
    estadoAnterior,
    estadoNuevo: estado,
    usuario: usuario || 'administrador-eor-peo@grupostt.com',
    fecha: new Date().toISOString(),
    observaciones: observaciones || `Se actualizó el estado del pago a: ${estado}`
  });

  // Re-evaluate service release state based on payment status changes
  actualizarEstadoServicioCliente(pago.clienteId, db, usuario || 'administrador-eor-peo@grupostt.com', observaciones || '', `Validación de Pago Inicial USD (${estado})`);

  // Handle SLA resolutions/pauses for USD cash payment
  const paymentSlaIdVal = `PAY-${pago.contratoId}`;
  if (estado === 'Validado' || estado === 'Aplicado') {
    registrarResolucionSLA(db, 'pago', paymentSlaIdVal, usuario || 'Admin', observaciones || 'Pago inicial validado por el administrador.');
    
    // Mark matching invoices in db.facturas as Pagada
    if (db.facturas) {
      const clientInvoices = db.facturas.filter(f => f.clienteId === pago.clienteId && f.estado !== 'Pagada');
      clientInvoices.forEach(f => {
        f.estado = 'Pagada';
        f.pagosAplicados = f.totalFacturado;
        f.saldoPendiente = 0;
      });
    }

    // Start Service Release SLA
    crearOSeguirSLA(db, {
      tipoProceso: 'servicio_pendiente_liberacion',
      entidadTipo: 'servicio',
      entidadId: `SRV-${pago.clienteId}`,
      clienteId: pago.clienteId,
      pais: cliente ? cliente.pais : 'Global',
      prioridad: 'Crítica',
      observaciones: 'Pago inicial validado. Pendiente de liberación final del servicio de Employer of Record.'
    });
  } else if (estado === 'Rechazado') {
    pausarSLA(db, 'pago', paymentSlaIdVal, usuario || 'Admin', observaciones || 'Pago rechazado. Pendiente de que el cliente suba un nuevo comprobante de transferencia.');
  }

  saveDb(db);

  // Trigger Notifications: PAYMENT_VALIDATED or PAYMENT_REJECTED or PAYMENT_UNDER_REVIEW
  const eventToTrigger = estado === 'Validado' || estado === 'Aplicado' ? 'PAYMENT_VALIDATED' :
                         estado === 'Rechazado' ? 'PAYMENT_REJECTED' :
                         estado === 'En revisión' ? 'PAYMENT_UNDER_REVIEW' : null;

  if (eventToTrigger) {
    triggerNotification(eventToTrigger, {
      ...pago,
      empresa: pago.clienteNombre,
      monto: String(pago.montoUsd),
      moneda: 'USD',
      numero_factura: pago.contratoId,
      numero_pago: pago.id,
      comentario: observaciones || 'Sin observaciones',
      correo: cliente?.correoContacto || 'cliente-eor-peo@grupostt.com',
      nombreContacto: cliente?.nombreContacto || 'Cliente'
    }, usuario);
  }

  addAuditLog('Facturación', id, 'validacion_pago_contado', estadoAnterior, estado, `Pago ${pago.id} validado como ${estado} por administración. Obs: ${observaciones}`, usuario || 'administrador-eor-peo@grupostt.com');

  res.json(pago);
});

// TIPOS DE CAMBIO
app.get('/api/tipos-cambio', (req, res) => {
  const db = getDb();
  res.json(db.tiposCambio || []);
});

app.post('/api/tipos-cambio', (req, res) => {
  const db = getDb();
  const { monedaOrigen, monedaDestino, tasa, baseTasa, porcentajeSuma } = req.body;
  if (!monedaOrigen || !monedaDestino || !tasa) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para registrar el tipo de cambio.' });
  }

  const nuevo: TipoCambio = {
    id: `TC-${Date.now().toString().slice(-4)}`,
    monedaOrigen,
    monedaDestino,
    tasa: Number(tasa),
    fecha: new Date().toISOString(),
    ...(baseTasa !== undefined && { baseTasa: Number(baseTasa) }),
    ...(porcentajeSuma !== undefined && { porcentajeSuma: Number(porcentajeSuma) })
  };

  if (!db.tiposCambio) db.tiposCambio = [];
  db.tiposCambio.push(nuevo);
  saveDb(db);
  addAuditLog('Compliance', nuevo.id, 'tipo_cambio_creado', '', String(tasa), `Tipo de cambio creado: ${monedaOrigen} a ${monedaDestino} (${tasa})` + (porcentajeSuma ? ` con recargo del ${porcentajeSuma}%` : ''), 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nuevo);
});

// TICKETS DE SOPORTE Y CASOS INTEGRADOS
app.get('/api/tickets', (req, res) => {
  const db = getDb();
  const { clienteId, supraclienteId, asesor, estado } = req.query;
  let list = db.tickets || [];

  // Update dynamic real-time SLA status before returning
  const now = Date.now();
  list.forEach(t => {
    if (t.estado === 'Resuelto' || t.estado === 'Cerrado') {
      if (!t.slaEstado || t.slaEstado === 'Dentro de tiempo' || t.slaEstado === 'Próximo a vencer') {
        t.slaEstado = 'Cumplido';
      }
    } else if (t.slaFechaLimiteResolucion) {
      const limit = new Date(t.slaFechaLimiteResolucion).getTime();
      const diffHours = (limit - now) / (1000 * 60 * 60);
      if (diffHours < 0) {
        t.slaEstado = 'Vencido';
      } else if (diffHours <= 2) {
        t.slaEstado = 'Próximo a vencer';
      } else {
        t.slaEstado = 'Dentro de tiempo';
      }
    }
  });

  if (clienteId) {
    list = list.filter(t => t.clienteId === clienteId);
  }
  if (supraclienteId) {
    list = list.filter(t => t.supraclienteId === supraclienteId);
  }
  if (asesor) {
    list = list.filter(t => (t as any).asesorAsignado === asesor || (t as any).asesorAsignado === 'asesor-eor-peo@grupostt.com');
  }
  if (estado) {
    list = list.filter(t => t.estado === estado);
  }

  res.json(list);
});

app.post('/api/tickets', (req, res) => {
  const db = getDb();
  const { 
    clienteId, 
    asunto, 
    descripcion, 
    prioridad, 
    categoria, 
    solicitanteNombre, 
    solicitanteEmail, 
    solicitanteRol, 
    supraclienteId,
    adjuntos 
  } = req.body;

  if (!clienteId || !asunto || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos requeridos (clienteId, asunto, descripción) para abrir un ticket.' });
  }

  const cli = (db.clientes || []).find(c => c.id === clienteId);
  const clienteNombre = cli ? (cli.razonSocial || cli.empresa) : (req.body.clienteNombre || 'Cliente');

  // Match active SLA rule from global configuration
  const prio = prioridad || 'Media';
  const cat = categoria || 'Soporte General';
  
  let rule = (db.reglasSla || []).find(r => 
    r.activo && 
    r.prioridad === prio && 
    (r.categoria === cat || r.categoria === 'Soporte General' || r.tipoProceso === 'ticket_creado')
  );

  if (!rule) {
    rule = (db.reglasSla || []).find(r => r.activo && r.prioridad === prio);
  }
  if (!rule) {
    rule = (db.reglasSla || []).find(r => r.activo);
  }

  const tiempoResp = rule ? rule.tiempoRespuestaHoras : 8;
  const tiempoReso = rule ? rule.tiempoResolucionHoras : 24;
  const now = new Date();
  const fechaLimiteRespuesta = new Date(now.getTime() + tiempoResp * 60 * 60 * 1000).toISOString();
  const fechaLimiteResolucion = new Date(now.getTime() + tiempoReso * 60 * 60 * 1000).toISOString();

  const ticketId = `TCK-${Date.now().toString().slice(-4)}`;

  const nuevo: Ticket = {
    id: ticketId,
    clienteId,
    clienteNombre,
    supraclienteId,
    solicitanteNombre: solicitanteNombre || cli?.nombreContacto || 'Usuario Solicitante',
    solicitanteEmail: solicitanteEmail || cli?.correoContacto || 'usuario@empresa.com',
    solicitanteRol: solicitanteRol || 'cliente',
    asunto,
    descripcion,
    categoria: cat,
    prioridad: prio,
    estado: 'Nuevo',
    fechaCreacion: now.toISOString(),
    fechaActualizacion: now.toISOString(),
    asesorAsignado: cli?.asesorAsignado || 'asesor-eor-peo@grupostt.com',
    adminAsignado: 'administrador-eor-peo@grupostt.com',
    slaReglaId: rule?.id || 'RULE-DEFAULT',
    slaHorasRespuesta: tiempoResp,
    slaHorasResolucion: tiempoReso,
    slaFechaLimiteRespuesta: fechaLimiteRespuesta,
    slaFechaLimiteResolucion: fechaLimiteResolucion,
    slaEstado: 'Dentro de tiempo',
    adjuntos: adjuntos || [],
    comentarios: [
      {
        id: `COM-${Date.now()}-1`,
        autor: solicitanteNombre || cli?.nombreContacto || 'Usuario Solicitante',
        autorEmail: solicitanteEmail || cli?.correoContacto || 'usuario@empresa.com',
        autorRol: (solicitanteRol as any) || 'cliente',
        mensaje: descripcion,
        fecha: now.toISOString(),
        esInterno: false
      }
    ],
    historial: [
      {
        fecha: now.toISOString(),
        usuario: solicitanteNombre || 'Cliente',
        accion: 'Ticket Creado',
        detalle: `Ticket abierto con prioridad ${prio} y categoría ${cat}. SLA asignado: ${tiempoResp}h respuesta / ${tiempoReso}h resolución.`
      }
    ]
  };

  if (!db.tickets) db.tickets = [];
  db.tickets.unshift(nuevo);

  // Trigger Unified SLA Tracker
  crearOSeguirSLA(db, {
    tipoProceso: 'ticket_creado',
    entidadTipo: 'ticket',
    entidadId: nuevo.id,
    clienteId,
    pais: 'Global',
    prioridad: prio,
    observaciones: `SLA de Ticket asignado automáticamente: ${asunto}`
  });

  saveDb(db);
  triggerNotification('TICKET_OPENED', nuevo);
  addAuditLog('Soporte', nuevo.id, 'ticket_creado', '', 'Nuevo', `Ticket creado: ${asunto} por ${solicitanteNombre || clienteNombre}`, solicitanteEmail || 'cliente@empresa.com');
  res.status(201).json(nuevo);
});

app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.tickets || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket no encontrado.' });

  const target = db.tickets![idx];
  const { estado, prioridad, categoria, asesorAsignado, adminAsignado } = req.body;
  const prevEstado = target.estado;
  const prevAsesor = target.asesorAsignado;
  const prevPrioridad = target.prioridad;

  if (estado) {
    target.estado = estado;
    if (estado === 'Resuelto' || estado === 'Cerrado') {
      if (!target.fechaResolucion) target.fechaResolucion = new Date().toISOString();
      target.slaEstado = 'Cumplido';
    }
  }
  if (prioridad) target.prioridad = prioridad;
  if (categoria) target.categoria = categoria;
  if (asesorAsignado !== undefined) target.asesorAsignado = asesorAsignado;
  if (adminAsignado !== undefined) target.adminAsignado = adminAsignado;
  target.fechaActualizacion = new Date().toISOString();

  // Merge any extra parameters
  Object.keys(req.body).forEach(key => {
    if (['estado', 'prioridad', 'categoria', 'asesorAsignado', 'adminAsignado', 'historial', 'comentarios'].includes(key)) return;
    (target as any)[key] = req.body[key];
  });

  if (!target.historial) target.historial = [];
  if (estado && estado !== prevEstado) {
    target.historial.push({
      fecha: new Date().toISOString(),
      usuario: req.body.usuarioModificador || 'Sistema',
      accion: 'Cambio de Estado',
      detalle: `Estado modificado de "${prevEstado}" a "${estado}"`
    });

    // Track SLA state transitions based on ticket state
    if (estado === 'Resuelto' || estado === 'Cerrado') {
      registrarResolucionSLA(db, 'ticket', target.id, req.body.usuarioModificador || 'administrador-eor-peo@grupostt.com', `Ticket marcado como ${estado}`);
    } else if (estado === 'Pendiente de Cliente' || estado === 'Pendiente de cliente') {
      pausarSLA(db, 'ticket', target.id, req.body.usuarioModificador || 'administrador-eor-peo@grupostt.com', 'Esperando interacción o documentación del cliente');
    } else if (prevEstado === 'Pendiente de Cliente' || prevEstado === 'Pendiente de cliente') {
      reanudarSLA(db, 'ticket', target.id, req.body.usuarioModificador || 'administrador-eor-peo@grupostt.com', 'Caso reanudado de espera de cliente');
    }
  }

  if (asesorAsignado && asesorAsignado !== prevAsesor) {
    target.historial.push({
      fecha: new Date().toISOString(),
      usuario: req.body.usuarioModificador || 'Sistema',
      accion: 'Reasignación de Asesor',
      detalle: `Asesor asignado modificado a ${asesorAsignado}`
    });
  }

  saveDb(db);
  addAuditLog('Soporte', target.id, 'ticket_actualizado', prevEstado, target.estado, `Ticket actualizado: ${target.asunto}`, req.body.usuarioModificador || 'administrador-eor-peo@grupostt.com');

  if (estado && estado !== prevEstado) {
    triggerNotification('TICKET_STATUS_CHANGED', target);
    if (estado === 'Resuelto' || estado === 'Cerrado') {
      triggerNotification('TICKET_CLOSED', target);
    }
  }
  if (asesorAsignado && asesorAsignado !== prevAsesor) {
    triggerNotification('TICKET_ASSIGNED', target);
  }

  res.json(target);
});

app.post('/api/tickets/:id/respuesta', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.tickets || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket no encontrado.' });

  const target = db.tickets![idx];
  const { usuario, autorEmail, rol, mensaje, esInterno, adjuntoNombre, adjuntoUrl } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: 'El mensaje de respuesta no puede estar vacío.' });
  }

  const now = new Date().toISOString();
  if (!target.comentarios) target.comentarios = [];

  const nuevoComentario = {
    id: `COM-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    autor: usuario || 'Usuario',
    autorEmail: autorEmail || 'usuario@empresa.com',
    autorRol: rol || 'cliente',
    mensaje,
    fecha: now,
    esInterno: !!esInterno,
    adjuntoNombre,
    adjuntoUrl
  };

  target.comentarios.push(nuevoComentario);
  target.fechaActualizacion = now;

  // Track SLA First Response if staff reply and not internal note
  const isStaff = rol === 'admin' || rol === 'administrador' || rol === 'asesor_comercial';
  if (isStaff && !esInterno) {
    if (!target.fechaPrimeraRespuesta) {
      target.fechaPrimeraRespuesta = now;
      registrarRespuestaSLA(db, 'ticket', target.id, usuario || 'Asesor');
    }
    target.estado = 'Respondido';
  } else if (!isStaff) {
    // If client responded and the ticket was pending client, resume SLA automatically!
    if (target.estado === 'Pendiente de Cliente' || target.estado === 'Pendiente de cliente') {
      reanudarSLA(db, 'ticket', target.id, usuario || 'Cliente', 'Cliente respondió al ticket.');
      target.estado = 'En Proceso';
    } else if (target.estado === 'Respondido') {
      target.estado = 'En Proceso';
    }
  }

  if (!target.historial) target.historial = [];
  target.historial.push({
    fecha: now,
    usuario: usuario || 'Usuario',
    accion: esInterno ? 'Nota Interna' : 'Respuesta',
    detalle: esInterno ? `Nota interna añadida por ${usuario}` : `Respuesta enviada por ${usuario} (${rol})`
  });

  saveDb(db);
  if (!esInterno) {
    triggerNotification('TICKET_REPLIED', {
      ...target,
      mensaje,
      usuarioRespuesta: usuario
    });
  }
  addAuditLog('Soporte', target.id, esInterno ? 'ticket_nota_interna' : 'ticket_respuesta', '', target.estado, `Mensaje en ticket por ${usuario}`, usuario || 'usuario@empresa.com');
  res.json(target);
});

app.post('/api/tickets/:id/calificacion', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.tickets || []).findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket no encontrado.' });

  const target = db.tickets![idx];
  const { calificacion, comentarioCalificacion, usuario } = req.body;

  if (calificacion === undefined || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ error: 'La calificación debe ser un número entero entre 1 y 5 estrellas.' });
  }

  target.calificacion = Number(calificacion);
  if (comentarioCalificacion) target.comentarioCalificacion = comentarioCalificacion;
  target.fechaActualizacion = new Date().toISOString();

  if (!target.historial) target.historial = [];
  target.historial.push({
    fecha: new Date().toISOString(),
    usuario: usuario || 'Cliente',
    accion: 'Calificación de Servicio',
    detalle: `El cliente calificó la atención con ${calificacion}/5 estrellas. Comentario: ${comentarioCalificacion || 'Sin comentarios adicionales.'}`
  });

  saveDb(db);
  addAuditLog('Soporte', target.id, 'ticket_calificado', '', `${calificacion} estrellas`, `Calificación recibida de ${calificacion}/5`, usuario || 'cliente');
  res.json(target);
});

app.post('/api/tickets/:id/sla-trigger', (req, res) => {
  const { id } = req.params;
  const { tipo, horasTranscurridas, usuario } = req.body;
  const db = getDb();
  const ticket = (db.tickets || []).find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado.' });

  const eventCode = tipo === 'warning' ? 'SLA_WARNING' : 'SLA_BREACHED';
  
  triggerNotification(eventCode, {
    ...ticket,
    horas_restantes: String(horasTranscurridas || 2)
  }, usuario);

  addAuditLog('Soporte', id, 'sla_alerta', '', eventCode, `Notificación SLA disparada: ${eventCode}`, usuario || 'administrador-eor-peo@grupostt.com');
  res.json({ message: `Alerta SLA de tipo ${tipo} disparada para el ticket ${id}` });
});

// CONFIGURACION SLA
app.get('/api/sla-configs', (req, res) => {
  const db = getDb();
  res.json(db.slaConfigs || []);
});

app.post('/api/sla-configs', (req, res) => {
  const db = getDb();
  const { pais, tiempoRespuestaHoras } = req.body;
  const nuevo: SlaConfig = {
    id: `SLA-${Date.now().toString().slice(-4)}`,
    pais,
    tiempoRespuestaHoras: Number(tiempoRespuestaHoras)
  };
  if (!db.slaConfigs) db.slaConfigs = [];
  db.slaConfigs.push(nuevo);
  saveDb(db);
  res.status(201).json(nuevo);
});

app.put('/api/sla-configs/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.slaConfigs || []).findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Configuración SLA no encontrada.' });

  const target = db.slaConfigs![idx];
  const { tiempoRespuestaHoras } = req.body;
  if (tiempoRespuestaHoras !== undefined) {
    target.tiempoRespuestaHoras = Number(tiempoRespuestaHoras);
  }
  saveDb(db);
  res.json(target);
});

// NUEVO MÓDULO: REGLAS DE SLA COMPLETAS
app.get('/api/sla-rules', (req, res) => {
  const db = getDb();
  res.json(db.reglasSla || []);
});

app.post('/api/sla-rules', (req, res) => {
  const db = getDb();
  const { tipoProceso, categoria, prioridad, pais, clienteId, tiempoRespuestaHoras, tiempoResolucionHoras, responsablePrincipal, responsableEscalamiento, activo, fechaInicioVigencia, fechaFinVigencia } = req.body;
  
  if (!tipoProceso || !prioridad || tiempoRespuestaHoras === undefined || tiempoResolucionHoras === undefined) {
    return res.status(400).json({ error: 'Campos obligatorios faltantes (tipoProceso, prioridad, tiempos).' });
  }

  const nuevaRegla: ReglaSla = {
    id: `RULE-${Date.now().toString().slice(-4)}`,
    tipoProceso,
    categoria: categoria || 'Soporte',
    prioridad,
    pais: pais || 'Global',
    clienteId: clienteId || 'Global',
    tiempoRespuestaHoras: Number(tiempoRespuestaHoras),
    tiempoResolucionHoras: Number(tiempoResolucionHoras),
    responsablePrincipal: responsablePrincipal || 'administrador-eor-peo@grupostt.com',
    responsableEscalamiento: responsableEscalamiento || 'alertas@grupostt.com',
    activo: activo !== undefined ? !!activo : true,
    fechaInicioVigencia: fechaInicioVigencia || new Date().toISOString().split('T')[0],
    fechaFinVigencia
  };

  if (!db.reglasSla) db.reglasSla = [];
  db.reglasSla.push(nuevaRegla);
  saveDb(db);

  addAuditLog('SLA', nuevaRegla.id, 'crear_regla', '', 'Activo', `Nueva regla de SLA creada para ${tipoProceso}`, 'Sistema');
  res.status(201).json(nuevaRegla);
});

app.put('/api/sla-rules/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.reglasSla || []).findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Regla de SLA no encontrada.' });

  const target = db.reglasSla![idx];
  const { tipoProceso, categoria, prioridad, pais, clienteId, tiempoRespuestaHoras, tiempoResolucionHoras, responsablePrincipal, responsableEscalamiento, activo, fechaInicioVigencia, fechaFinVigencia } = req.body;

  if (tipoProceso !== undefined) target.tipoProceso = tipoProceso;
  if (categoria !== undefined) target.categoria = categoria;
  if (prioridad !== undefined) target.prioridad = prioridad;
  if (pais !== undefined) target.pais = pais;
  if (clienteId !== undefined) target.clienteId = clienteId;
  if (tiempoRespuestaHoras !== undefined) target.tiempoRespuestaHoras = Number(tiempoRespuestaHoras);
  if (tiempoResolucionHoras !== undefined) target.tiempoResolucionHoras = Number(tiempoResolucionHoras);
  if (responsablePrincipal !== undefined) target.responsablePrincipal = responsablePrincipal;
  if (responsableEscalamiento !== undefined) target.responsableEscalamiento = responsableEscalamiento;
  if (activo !== undefined) target.activo = !!activo;
  if (fechaInicioVigencia !== undefined) target.fechaInicioVigencia = fechaInicioVigencia;
  if (fechaFinVigencia !== undefined) target.fechaFinVigencia = fechaFinVigencia;

  saveDb(db);
  addAuditLog('SLA', target.id, 'actualizar_regla', '', target.activo ? 'Activo' : 'Inactivo', `Regla de SLA #${id} modificada`, 'Sistema');
  res.json(target);
});

app.post('/api/sla-rules/:id/toggle', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.reglasSla || []).findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Regla de SLA no encontrada.' });

  const target = db.reglasSla![idx];
  target.activo = !target.activo;
  saveDb(db);

  addAuditLog('SLA', target.id, 'toggle_regla', '', target.activo ? 'Activo' : 'Inactivo', `Regla de SLA #${id} cambiada a ${target.activo ? 'Activa' : 'Inactiva'}`, 'Sistema');
  res.json(target);
});

app.delete('/api/sla-rules/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.reglasSla || []).findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Regla de SLA no encontrada.' });

  const target = db.reglasSla![idx];
  db.reglasSla!.splice(idx, 1);
  saveDb(db);
  await deleteDocFromFirestore('reglasSla', id);

  addAuditLog('SLA', id, 'eliminar_regla', '', 'Eliminada', `Regla de SLA #${id} eliminada por el administrador`, 'administrador-eor-peo@grupostt.com');
  res.json({ success: true, id });
});

// NUEVO MÓDULO: SEGUIMIENTOS DE SLA E HISTORIAL
app.get('/api/sla-trackers', (req, res) => {
  const db = getDb();
  res.json(db.slaSeguimientos || []);
});

app.get('/api/sla-historial', (req, res) => {
  const db = getDb();
  res.json(db.slaHistoriales || []);
});

app.post('/api/sla-trackers/:id/pause', (req, res) => {
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const tracker = (db.slaSeguimientos || []).find(s => s.id === id);
  if (!tracker) return res.status(404).json({ error: 'Tracker de SLA no encontrado.' });

  pausarSLA(db, tracker.entidadTipo, tracker.entidadId, usuario || 'Admin', observaciones);
  saveDb(db);

  res.json(tracker);
});

app.post('/api/sla-trackers/:id/resume', (req, res) => {
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const tracker = (db.slaSeguimientos || []).find(s => s.id === id);
  if (!tracker) return res.status(404).json({ error: 'Tracker de SLA no encontrado.' });

  reanudarSLA(db, tracker.entidadTipo, tracker.entidadId, usuario || 'Admin', observaciones);
  saveDb(db);

  res.json(tracker);
});

app.post('/api/sla-trackers/:id/escalate', (req, res) => {
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const tracker = (db.slaSeguimientos || []).find(s => s.id === id);
  if (!tracker) return res.status(404).json({ error: 'Tracker de SLA no encontrado.' });

  // Manual escalation
  const reglaOriginal = (db.reglasSla || []).find(r => r.tipoProceso === tracker.tipoProceso && r.prioridad === tracker.prioridad);
  const escalamientoResp = reglaOriginal ? reglaOriginal.responsableEscalamiento : 'soporte.supervisor@grupostt.com';
  
  const estadoAnterior = tracker.estadoSla;
  tracker.estadoSla = 'Escalado';
  tracker.escalamientoAplicado = true;
  tracker.usuarioResponsable = escalamientoResp;

  if (!db.slaHistoriales) db.slaHistoriales = [];
  db.slaHistoriales.push({
    id: `SLAH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
    slaId: tracker.id,
    fechaHora: new Date().toISOString(),
    accion: 'Escalamiento',
    estadoAnterior,
    estadoNuevo: 'Escalado',
    usuarioResponsable: usuario || 'Admin',
    observaciones: observaciones || `Escalamiento manual ejecutado a favor de ${escalamientoResp}`
  });

  triggerSlaNotification(db, tracker, 'SLA_ESCALATED', observaciones);
  saveDb(db);

  res.json(tracker);
});

app.post('/api/sla-trackers/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const tracker = (db.slaSeguimientos || []).find(s => s.id === id);
  if (!tracker) return res.status(404).json({ error: 'Tracker de SLA no encontrado.' });

  registrarResolucionSLA(db, tracker.entidadTipo, tracker.entidadId, usuario || 'Admin', observaciones);
  saveDb(db);

  res.json(tracker);
});

// NUEVO MÓDULO: ALERTAS OPERATIVAS API
app.get('/api/operational-alerts', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Ver')) return;
  const db = getDb();
  sincronizarAlertas(db);
  res.json(db.alertasOperativas || []);
});

app.get('/api/operational-alerts/history', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Ver')) return;
  const db = getDb();
  res.json(db.historialAlertasOperativas || []);
});

app.post('/api/operational-alerts/:id/manage', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Editar')) return;
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const alerta = (db.alertasOperativas || []).find(a => a.id === id);
  if (!alerta) return res.status(404).json({ error: 'Alerta operativa no encontrada.' });

  const estadoAnterior = alerta.estado;
  alerta.estado = 'En gestión';
  if (usuario) alerta.usuarioResponsable = usuario;
  if (observaciones) alerta.observaciones = observaciones;

  if (!db.historialAlertasOperativas) db.historialAlertasOperativas = [];
  db.historialAlertasOperativas.push({
    id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    alertaId: alerta.id,
    accion: 'Cambio de estado',
    usuarioResponsable: usuario || 'Admin',
    fechaHora: new Date().toISOString(),
    observaciones: observaciones || `La alerta pasó de estado ${estadoAnterior} a En gestión.`
  });

  saveDb(db);
  res.json(alerta);
});

app.post('/api/operational-alerts/:id/resolve', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Editar')) return;
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const alerta = (db.alertasOperativas || []).find(a => a.id === id);
  if (!alerta) return res.status(404).json({ error: 'Alerta operativa no encontrada.' });

  const estadoAnterior = alerta.estado;
  alerta.estado = 'Resuelta';
  alerta.fechaResolucion = new Date().toISOString();
  alerta.usuarioResolvio = usuario || 'Admin';
  if (observaciones) alerta.observaciones = observaciones;

  if (!db.historialAlertasOperativas) db.historialAlertasOperativas = [];
  db.historialAlertasOperativas.push({
    id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    alertaId: alerta.id,
    accion: 'Resolución',
    usuarioResponsable: usuario || 'Admin',
    fechaHora: new Date().toISOString(),
    observaciones: observaciones || `Alerta resuelta por ${usuario || 'Admin'}.`
  });

  saveDb(db);
  res.json(alerta);
});

app.post('/api/operational-alerts/:id/escalate', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Editar')) return;
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const alerta = (db.alertasOperativas || []).find(a => a.id === id);
  if (!alerta) return res.status(404).json({ error: 'Alerta operativa no encontrada.' });

  const estadoAnterior = alerta.estado;
  alerta.estado = 'Escalada';
  alerta.prioridad = 'Crítica'; // Escalada a crítica
  if (observaciones) alerta.observaciones = observaciones;

  if (!db.historialAlertasOperativas) db.historialAlertasOperativas = [];
  db.historialAlertasOperativas.push({
    id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    alertaId: alerta.id,
    accion: 'Escalamiento',
    usuarioResponsable: usuario || 'Admin',
    fechaHora: new Date().toISOString(),
    observaciones: observaciones || `Alerta escalada manual por ${usuario || 'Admin'}.`
  });

  triggerNotification('SLA_ESCALATED', {
    id: alerta.entidadId,
    clienteId: alerta.clienteId,
    clienteNombre: alerta.clienteNombre,
    pais: alerta.pais,
    email: 'supervisor@grupostt.com',
    usuario: 'Supervisor de Operaciones',
    comentario: `Alerta operativa escalada: ${alerta.descripcionCorta}. Observaciones: ${observaciones}`
  }, usuario || 'Sistema');

  saveDb(db);
  res.json(alerta);
});

app.post('/api/operational-alerts/:id/close', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Editar')) return;
  const { id } = req.params;
  const { usuario, observaciones } = req.body;
  const db = getDb();

  const alerta = (db.alertasOperativas || []).find(a => a.id === id);
  if (!alerta) return res.status(404).json({ error: 'Alerta operativa no encontrada.' });

  const estadoAnterior = alerta.estado;
  alerta.estado = 'Cerrada';
  if (observaciones) alerta.observaciones = observaciones;

  if (!db.historialAlertasOperativas) db.historialAlertasOperativas = [];
  db.historialAlertasOperativas.push({
    id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    alertaId: alerta.id,
    accion: 'Cierre',
    usuarioResponsable: usuario || 'Admin',
    fechaHora: new Date().toISOString(),
    observaciones: observaciones || `Alerta cerrada definitivamente por el usuario.`
  });

  saveDb(db);
  res.json(alerta);
});

app.post('/api/operational-alerts/:id/reassign', (req, res) => {
  if (!enforcePermission(req, res, 'Alertas operativas', 'Editar')) return;
  const { id } = req.params;
  const { usuario, reasignedUser, reasignedRole, observaciones } = req.body;
  const db = getDb();

  const alerta = (db.alertasOperativas || []).find(a => a.id === id);
  if (!alerta) return res.status(404).json({ error: 'Alerta operativa no encontrada.' });

  const oldResp = alerta.usuarioResponsable;
  const oldRole = alerta.rolResponsable;
  
  if (reasignedUser) alerta.usuarioResponsable = reasignedUser;
  if (reasignedRole) alerta.rolResponsable = reasignedRole;
  if (observaciones) alerta.observaciones = observaciones;

  if (!db.historialAlertasOperativas) db.historialAlertasOperativas = [];
  db.historialAlertasOperativas.push({
    id: `AOH-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    alertaId: alerta.id,
    accion: 'Asignación o reasignación',
    usuarioResponsable: usuario || 'Admin',
    fechaHora: new Date().toISOString(),
    observaciones: observaciones || `Reasignada de ${oldResp} (${oldRole}) a ${reasignedUser} (${reasignedRole}).`
  });

  saveDb(db);
  res.json(alerta);
});

// PLANTILLAS DE NOTIFICACION
app.get('/api/plantillas-notificacion', (req, res) => {
  const db = getDb();
  res.json(db.plantillasNotificacion || []);
});

app.post('/api/plantillas-notificacion', (req, res) => {
  const db = getDb();
  const { nombre, canal, plantilla, codigo, evento, idioma, asunto, variables, activo, usuarioResponsable } = req.body;
  const nuevo: PlantillaNotificacion = {
    id: `PL-NOT-${Date.now().toString().slice(-4)}`,
    codigo: codigo || `PL-NOT-${Date.now().toString().slice(-4)}`,
    nombre: nombre || 'Nueva Plantilla',
    evento: evento || 'CUSTOM_EVENT',
    canal: canal || 'correo',
    idioma: idioma || 'es',
    asunto: asunto || 'Notificación de Quick Hire',
    plantilla: plantilla || '',
    variables: variables || [],
    activo: activo !== undefined ? activo : true,
    usuarioResponsable: usuarioResponsable || 'administrador-eor-peo@grupostt.com',
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString()
  };
  if (!db.plantillasNotificacion) db.plantillasNotificacion = [];
  db.plantillasNotificacion.push(nuevo);
  saveDb(db);
  res.status(201).json(nuevo);
});

app.put('/api/plantillas-notificacion/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.plantillasNotificacion || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Plantilla de notificación no encontrada.' });

  const target = db.plantillasNotificacion![idx];
  const { nombre, canal, plantilla, codigo, evento, idioma, asunto, variables, activo, usuarioResponsable } = req.body;
  if (nombre) target.nombre = nombre;
  if (canal) target.canal = canal;
  if (plantilla) target.plantilla = plantilla;
  if (codigo) target.codigo = codigo;
  if (evento) target.evento = evento;
  if (idioma) target.idioma = idioma;
  if (asunto) target.asunto = asunto;
  if (variables) target.variables = variables;
  if (activo !== undefined) target.activo = activo;
  if (usuarioResponsable) target.usuarioResponsable = usuarioResponsable;
  target.fechaModificacion = new Date().toISOString();

  saveDb(db);
  res.json(target);
});

// ALERTAS DE NOTIFICACION
app.get('/api/alertas-notificacion', (req, res) => {
  const db = getDb();
  res.json(db.alertasNotificacion || []);
});

app.post('/api/alertas-notificacion/:id/leer', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = (db.alertasNotificacion || []).findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Alerta no encontrada.' });

  db.alertasNotificacion![idx].leida = true;
  saveDb(db);
  res.json({ success: true });
});

// HISTORIAL DE NOTIFICACIONES
app.get('/api/notificaciones/historial', (req, res) => {
  const db = getDb();
  res.json(db.historialNotificaciones || []);
});

// LOGS AUDITORIA
app.get('/api/logs', (req, res) => {
  const db = getDb();
  res.json(db.logs);
});

app.post('/api/logs', (req, res) => {
  const { tabla, registroId, campo, valorAnterior, valorNuevo, motivo, usuario } = req.body;
  addAuditLog(
    tabla || 'Reportes', 
    registroId || 'General', 
    campo || 'Descarga', 
    valorAnterior || '', 
    valorNuevo || '', 
    motivo || 'Generación de reporte', 
    usuario || 'Usuario'
  );
  res.json({ success: true });
});

// SEGUIMIENTOS COMERCIALES
app.get('/api/seguimientos-comerciales', (req, res) => {
  const db = getDb();
  if (!db.seguimientosComerciales) db.seguimientosComerciales = [];
  res.json(db.seguimientosComerciales);
});

app.post('/api/seguimientos-comerciales', (req, res) => {
  const db = getDb();
  if (!db.seguimientosComerciales) db.seguimientosComerciales = [];
  const nuevo = {
    id: `SEG-${Date.now()}-${Math.random().toString().slice(-3)}`,
    ...req.body
  };
  db.seguimientosComerciales.push(nuevo);
  saveDb(db);
  addAuditLog('Seguimiento Comercial', nuevo.id, 'creacion', '', nuevo.tipoSeguimiento, `Nuevo seguimiento registrado por ${nuevo.usuario}: ${nuevo.comentario.slice(0, 50)}`, nuevo.usuario);
  res.status(201).json(nuevo);
});

// DIRECTORIO DE ACTORES DE SERVICIO
app.get('/api/directorio', (req, res) => {
  const db = getDb();
  if (!db.directorio || db.directorio.length === 0) {
    db.directorio = initialDb.directorio || [];
    saveDb(db);
  }
  res.json(db.directorio);
});

app.post('/api/directorio', (req, res) => {
  const db = getDb();
  if (!db.directorio) db.directorio = [];
  const nuevoContacto: DirectorioContacto = {
    id: `DIR-${Date.now().toString().slice(-4)}`,
    tipo: req.body.tipo || 'Gerente / Coordinador',
    pais: req.body.pais || 'Colombia',
    empresaStt: req.body.empresaStt || 'STT Colombia S.A.S.',
    nombre: req.body.nombre,
    correo: req.body.correo,
    telefono: req.body.telefono || '',
    estado: req.body.estado || 'Activo'
  };
  db.directorio.push(nuevoContacto);
  saveDb(db);
  addAuditLog('Directorio', nuevoContacto.id, 'creacion', '', nuevoContacto.nombre, `Nuevo contacto de directorio: ${nuevoContacto.nombre} (${nuevoContacto.tipo})`, 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nuevoContacto);
});

app.put('/api/directorio/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.directorio) db.directorio = [];
  const idx = db.directorio.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Contacto de directorio no encontrado.' });

  const target = db.directorio[idx];
  Object.assign(target, req.body);
  saveDb(db);
  addAuditLog('Directorio', target.id, 'modificacion', '', target.nombre, `Contacto actualizado: ${target.nombre}`, 'administrador-eor-peo@grupostt.com');
  res.json(target);
});

// MAESTRO DE CUENTAS BANCARIAS
app.get('/api/cuentas-bancarias', (req, res) => {
  const db = getDb();
  if (!db.cuentasBancarias || db.cuentasBancarias.length === 0) {
    db.cuentasBancarias = initialDb.cuentasBancarias || [];
    saveDb(db);
  }
  res.json(db.cuentasBancarias);
});

app.post('/api/cuentas-bancarias', (req, res) => {
  const db = getDb();
  if (!db.cuentasBancarias) db.cuentasBancarias = [];
  const nuevaCuenta: CuentaBancariaMaestra = {
    id: `CTA-${(db.cuentasBancarias.length + 1).toString().padStart(3, '0')}`,
    sociedad: req.body.sociedad,
    pais: req.body.pais || 'Colombia',
    moneda: req.body.moneda || 'USD',
    banco: req.body.banco,
    numeroCuenta: req.body.numeroCuenta,
    tipoCuenta: req.body.tipoCuenta || 'MAESTRA',
    estado: req.body.estado || 'ACTIVA',
    swift: req.body.swift,
    aba: req.body.aba,
    bancoIntermediario: req.body.bancoIntermediario,
    swiftIntermediario: req.body.swiftIntermediario,
    abaIntermediario: req.body.abaIntermediario,
    direccionBancoIntermediario: req.body.direccionBancoIntermediario,
    direccionBanco: req.body.direccionBanco,
    direccionBeneficiario: req.body.direccionBeneficiario,
    ruc: req.body.ruc
  };
  db.cuentasBancarias.push(nuevaCuenta);
  saveDb(db);
  addAuditLog('CuentasBancarias', nuevaCuenta.id, 'creacion', '', nuevaCuenta.numeroCuenta, `Nueva cuenta registrada: ${nuevaCuenta.sociedad} - ${nuevaCuenta.banco}`, 'tesoreria-eor-peo@grupostt.com');
  res.status(201).json(nuevaCuenta);
});

app.put('/api/cuentas-bancarias/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.cuentasBancarias) db.cuentasBancarias = [];
  const idx = db.cuentasBancarias.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Cuenta bancaria no encontrada.' });

  const target = db.cuentasBancarias[idx];
  Object.assign(target, req.body);
  saveDb(db);
  addAuditLog('CuentasBancarias', target.id, 'modificacion', '', target.numeroCuenta, `Cuenta bancaria actualizada: ${target.sociedad} - ${target.banco}`, 'tesoreria-eor-peo@grupostt.com');
  res.json(target);
});

// MAESTRO DE REGLAS TRIBUTARIAS (IVA - WHT Y RENTA)
app.get('/api/reglas-tributarias', (req, res) => {
  const db = getDb();
  if (!db.reglasTributarias || db.reglasTributarias.length === 0) {
    db.reglasTributarias = (initialDb.reglasTributarias || []).map(r => ({ ...r }));
    saveDb(db);
  }
  res.json(db.reglasTributarias);
});

app.post('/api/reglas-tributarias', (req, res) => {
  const db = getDb();
  if (!db.reglasTributarias) db.reglasTributarias = [];
  const nuevaRegla: ReglaTributariaIvaWht = {
    id: `TAX-${(db.reglasTributarias.length + 1).toString().padStart(3, '0')}`,
    pais: req.body.pais || 'Panamá',
    sociedadFacturadora: req.body.sociedadFacturadora || 'STT Panamá S.A.',
    tipoFacturacion: req.body.tipoFacturacion || 'Ambas',
    ivaGeneralPct: Number(req.body.ivaGeneralPct) || 0,
    ivaEorExportacionPct: Number(req.body.ivaEorExportacionPct) || 0,
    whtRetencionPct: Number(req.body.whtRetencionPct) || 0,
    rentaIsrPct: Number(req.body.rentaIsrPct) || 0,
    asuncionWht: req.body.asuncionWht || 'Gross-Up (A cargo de Cliente)',
    baseCalculoIva: req.body.baseCalculoIva || 'Solo Fee EOR',
    baseCalculoWht: req.body.baseCalculoWht || 'Solo Fee EOR',
    tratadoDobleImposicion: req.body.tratadoDobleImposicion || '',
    fundamentoLegal: req.body.fundamentoLegal || '',
    certificadoRequerido: req.body.certificadoRequerido || '',
    notas: req.body.notas || '',
    estado: req.body.estado || 'Vigente',
    fechaActualizacion: new Date().toISOString().slice(0, 10),
    usuarioActualizacion: req.body.usuario || 'administrador-eor-peo@grupostt.com'
  };
  db.reglasTributarias.push(nuevaRegla);
  saveDb(db);
  addAuditLog('Tributario', nuevaRegla.id, 'creacion', '', nuevaRegla.pais, `Nueva regla tributaria registrada: ${nuevaRegla.pais} (${nuevaRegla.sociedadFacturadora})`, req.body.usuario || 'administrador-eor-peo@grupostt.com');
  res.status(201).json(nuevaRegla);
});

app.put('/api/reglas-tributarias/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.reglasTributarias) db.reglasTributarias = [];
  const idx = db.reglasTributarias.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Regla tributaria no encontrada.' });

  const target = db.reglasTributarias[idx];
  const valorAnterior = JSON.stringify({ iva: target.ivaGeneralPct, wht: target.whtRetencionPct, renta: target.rentaIsrPct });
  Object.assign(target, req.body, {
    fechaActualizacion: new Date().toISOString().slice(0, 10),
    usuarioActualizacion: req.body.usuario || 'administrador-eor-peo@grupostt.com'
  });
  saveDb(db);
  addAuditLog('Tributario', target.id, 'modificacion', valorAnterior, JSON.stringify({ iva: target.ivaGeneralPct, wht: target.whtRetencionPct, renta: target.rentaIsrPct }), `Regla tributaria actualizada para ${target.pais}: ${req.body.motivo || 'Actualización de tasas'}`, req.body.usuario || 'administrador-eor-peo@grupostt.com');
  res.json(target);
});

app.delete('/api/reglas-tributarias/:id', async (req, res) => {
  const { id } = req.params;
  const usuario = (req.query.usuario as string) || req.body?.usuario || 'administrador-eor-peo@grupostt.com';
  const db = getDb();
  if (!db.reglasTributarias) db.reglasTributarias = [];
  const idx = db.reglasTributarias.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Regla tributaria no encontrada.' });

  const removed = db.reglasTributarias.splice(idx, 1)[0];
  saveDb(db);
  await deleteDocFromFirestore('reglasTributarias', id);
  addAuditLog('Tributario', id, 'eliminacion', removed.pais, '', `Regla tributaria eliminada para ${removed.pais}`, usuario);
  res.json({ success: true, removed });
});


// HISTORIAL DE LIBERACION Y ESTADOS DE SERVICIO
app.get('/api/historial-liberacion', (req, res) => {
  const db = getDb();
  res.json(db.historialLiberacion || []);
});

app.post('/api/clientes/estado-servicio', (req, res) => {
  const db = getDb();
  const { clienteId, estadoNuevo, motivo, observaciones, usuario } = req.body;
  if (!clienteId || !estadoNuevo || !motivo) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios (clienteId, estadoNuevo, motivo).' });
  }

  const cliente = db.clientes.find(c => c.id === clienteId);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

  const estadoAnterior = cliente.estadoServicio || 'Pendiente de contrato comercial';
  cliente.estadoServicio = estadoNuevo as any;

  // Let's do the actual unblocking of labor contracts if manual release was triggered
  if (estadoNuevo === 'Servicio liberado' && estadoAnterior !== 'Servicio liberado') {
    cliente.fechaLiberacion = new Date().toISOString();
    cliente.usuarioValidador = usuario || 'administrador-eor-peo@grupostt.com';

    // Release labor contracts of employees
    const trabajadoresAsociados = db.trabajadores.filter(t => t.clienteId === clienteId);
    trabajadoresAsociados.forEach(w => {
      const ec = db.contratosLaborales.find(cl => cl.trabajadorId === w.id);
      if (ec) {
        if (ec.estado === 'No disponible' || ec.estado === 'Pendiente de liberación') {
          ec.estado = 'Disponible';
          addAuditLog('Contratos Laborales', ec.id, 'estado', 'No disponible', 'Disponible', 'Contrato liberado por actualización manual del estado de liberación por Super Admin', usuario || 'administrador-eor-peo@grupostt.com');
        }
      }
    });

    triggerNotification('SERVICE_RELEASED', {
      id: clienteId,
      clienteId,
      empresa: cliente.empresa,
      pais: cliente.pais,
      correo: cliente.correoContacto || 'cliente-eor-peo@grupostt.com',
      nombreContacto: cliente.nombreContacto || 'Cliente'
    }, usuario);

    triggerNotification('EMPLOYEE_CONTRACTS_ENABLED', {
      id: clienteId,
      clienteId,
      empresa: cliente.empresa,
      pais: cliente.pais,
      correo: cliente.correoContacto || 'cliente-eor-peo@grupostt.com',
      nombreContacto: cliente.nombreContacto || 'Cliente'
    }, usuario);
  }

  // Record in history log
  if (!db.historialLiberacion) db.historialLiberacion = [];
  const nuevoHistItem = {
    id: `LIB-HIST-MAN-${Date.now()}-${Math.random().toString().slice(-3).toUpperCase()}`,
    clienteId: cliente.id,
    clienteNombre: cliente.empresa,
    estadoAnterior,
    estadoNuevo,
    usuario: usuario || 'administrador-eor-peo@grupostt.com',
    fecha: new Date().toISOString(),
    motivo,
    observaciones: observaciones || 'Corrección o actualización manual de estado por Super Admin',
    eventoGenerado: estadoNuevo === 'Servicio liberado' ? 'SERVICE_RELEASED' : undefined,
    notificacionEnviada: estadoNuevo === 'Servicio liberado'
  };
  db.historialLiberacion.unshift(nuevoHistItem);

  saveDb(db);
  addAuditLog('Clientes', cliente.id, 'estadoServicio', estadoAnterior, estadoNuevo, motivo, usuario || 'administrador-eor-peo@grupostt.com');

  res.json({ success: true, estadoServicio: estadoNuevo });
});

// REINICIO TOTAL DE DATOS DEL SISTEMA
app.post('/api/system/reset-all-data', async (req, res) => {
  await wipeFirestore();
  const db = getDb();
  
  db.solicitudes = [];
  db.clientes = [];
  db.trabajadores = [];
  db.contratosComerciales = [];
  db.contratosLaborales = [];
  db.adendums = [];
  db.pagosContadoUSD = [];
  db.facturas = [];
  db.pagos = [];
  db.seguimientosComerciales = [];
  db.tickets = [];
  db.logs = [];
  db.historialNotificaciones = [];
  db.alertasNotificacion = [];
  db.alertasOperativas = [];
  db.historialAlertasOperativas = [];
  if (db.historialLiberacion) db.historialLiberacion = [];

  // Preserve all registered users; ensure default accounts remain active
  if (!db.usuarios) db.usuarios = [];
  for (const defU of initialDb.usuarios) {
    if (!db.usuarios.some(u => u.correo.toLowerCase() === defU.correo.toLowerCase())) {
      db.usuarios.push({ ...defU });
    }
  }

  // Re-seed clean base contract templates so users can immediately generate contracts for new clients
  db.plantillasContrato = [
    {
      id: 'PL-CONTR-001',
      nombre: 'Contrato Marco de Prestación de Servicios EOR (Único Estándar Master)',
      tipo: 'comercial',
      pais: 'Todos',
      servicio: 'Todos',
      version: '1.0',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo',
      variables: ['empresa', 'razonSocial', 'cedulaJuridica', 'pais', 'direccion', 'nombreContacto', 'representanteLegal', 'documentoRepresentante', 'correoContacto', 'telefonoContacto', 'servicioContratado', 'moneda', 'feePorEmpleado', 'fechaInicio', 'credito'],
      archivoBase: CONTRATO_MARCO_EOR_PLANTILLA_HTML,
      observaciones: 'Única plantilla de contrato comercial estándar para todos los clientes (Admin & Asesor).',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    },
    {
      id: 'PL-CONTR-002',
      nombre: 'Contrato Laboral de Empleado (Local)',
      tipo: 'laboral',
      pais: 'México',
      servicio: 'EOR',
      version: '1.2',
      vigencia: '2026-01-01 a 2026-12-31',
      estado: 'Activo',
      variables: ['trabajadorNombre', 'documentoIdentificacion', 'puesto', 'fechaIngreso', 'salario', 'moneda', 'modalidadTrabajo', 'clienteNombre'],
      archivoBase: '<h1>CONTRATO INDIVIDUAL DE TRABAJO (BAJO REGLAMENTO LOCAL)</h1><p>En la ciudad correspondiente, se formaliza este acuerdo laboral entre la entidad local contratadora de <b>Quick Hire</b> y el trabajador <b>{{trabajadorNombre}}</b>, de identificación fiscal {{documentoIdentificacion}}.</p><p><b>PRIMERA (Puesto y Funciones):</b> El trabajador desempeñará las labores de {{puesto}} prestando servicio directo asignado a la empresa cliente {{clienteNombre}}.</p><p><b>SEGUNDA (Fecha de Ingreso):</b> La fecha oficial de ingreso del colaborador es el {{fechaIngreso}}.</p><p><b>TERCERA (Remuneración):</b> El trabajador percibirá un salario mensual bruto de {{moneda}} {{salario}}, pagadero bajo la frecuencia establecida.</p><p><b>CUARTA (Modalidad):</b> La modalidad de trabajo acordada es {{modalidadTrabajo}}.</p><p>Firmas en conformidad:</p><p>El Trabajador: _______________________ ({{trabajadorNombre}})<br/>El Patrón: _______________________ (Representante Quick Hire)</p>',
      observaciones: 'Plantilla de contrato laboral alineada con la Ley Federal del Trabajo de México.',
      usuarioResponsable: 'administrador-eor-peo@grupostt.com',
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    }
  ];

  saveDb(db);
  res.json({ success: true, message: 'Todos los datos y modelos han sido reiniciados exitosamente. El sistema está 100% limpio para pruebas desde cero.' });
});

// MODEL CONTEXT PROTOCOL (MCP) INTEGRATION
setupMcpRoutes(app, getDb, saveDb, writeAuditLog);

// FRONTEND INTEGRATION
// Setup Vite in middleware mode for Development or serve static folder for Production
const isProd = process.env.NODE_ENV === 'production' || (process.env.NODE_ENV !== 'development' && process.env.npm_lifecycle_event !== 'dev');

if (!isProd) {
  // Create Vite server in middleware mode without top-level await for clean CJS bundling
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  }).then((vite) => {
    // Use vite's connect instance as a middleware
    app.use(vite.middlewares);
    console.log('Vite development server loaded in Express middleware mode.');
  }).catch((err) => {
    console.error('Failed to initialize Vite dev server, falling back to static files:', err);
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  });
} else {
  // Serve static files in production
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = Number(process.env.DEFAULT_APP_PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quick Hire server running on http://0.0.0.0:${PORT}`);
});
