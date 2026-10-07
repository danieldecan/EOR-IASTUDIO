import { PlantillaContrato } from '../types';

export const CONTRATO_MARCO_EOR_PLANTILLA_HTML = `<div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 24px; background-color: #ffffff;">
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

export const DEFAULT_PLANTILLAS_FALLBACK: PlantillaContrato[] = [
  {
    id: 'PL-CONTR-001',
    nombre: 'Contrato Marco de Prestación de Servicios EOR (Único Estándar Master)',
    tipo: 'comercial',
    pais: 'Todos',
    servicio: 'Todos',
    version: '1.0',
    vigencia: '2026-01-01 a 2026-12-31',
    estado: 'Activo',
    variables: [
      'empresa', 'razonSocial', 'cedulaJuridica', 'pais', 'direccion',
      'nombreContacto', 'representanteLegal', 'documentoRepresentante',
      'correoContacto', 'telefonoContacto', 'servicioContratado',
      'moneda', 'feePorEmpleado', 'fechaInicio', 'credito'
    ],
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
    nombre: 'Adendum Modificatorio de Condiciones',
    tipo: 'adendum',
    pais: 'Colombia',
    servicio: 'EOR',
    version: '1.0',
    vigencia: '2026-01-01 a 2026-12-31',
    estado: 'Activo',
    variables: ['clienteNombre', 'contratoId', 'fechaGeneracion', 'motivoCambio', 'contenido'],
    archivoBase: '<h1>ADENDUM Y ANEXO AL CONTRATO MARCO COMERCIAL</h1><p>En la ciudad correspondiente, se formaliza la modificación al contrato comercial número <b>{{contratoId}}</b> suscrito con la empresa <b>{{clienteNombre}}</b> con fecha de emisión {{fechaGeneracion}}.</p><p><b>MOTIVO DE LA MODIFICACIÓN:</b> {{motivoCambio}}</p><p><b>ACUERDOS:</b> {{contenido}}</p><p>Las demás cláusulas del contrato marco principal continúan con plena vigencia y vigor legal.</p><p>Firmas en señal de aceptación mutua:</p><p>Por el Cliente: _______________________<br/>Por Quick Hire: _______________________</p>',
    observaciones: 'Modelo para generar anexos y ampliaciones de contrato.',
    usuarioResponsable: 'administrador-eor-peo@grupostt.com',
    fechaCreacion: '2026-02-01T09:00:00Z',
    fechaModificacion: '2026-02-01T09:00:00Z'
  }
];

export function compileContractVariables(templateHtml: string, vars: Record<string, string>): string {
  let compiled = templateHtml;
  Object.entries(vars).forEach(([k, v]) => {
    compiled = compiled.replace(new RegExp(`{{${k}}}`, 'g'), v || '');
  });
  return compiled;
}

export function renderCommercialContractHtml(contrato: {
  id?: string;
  clienteNombre?: string;
  razonSocial?: string;
  cedulaJuridica?: string;
  pais?: string;
  direccion?: string;
  representanteCliente?: string;
  representanteProveedor?: string;
  moneda?: string;
  feePorEmpleado?: number | string;
  condicionesComerciales?: string;
  fechaGeneracion?: string;
  fechaInicio?: string;
  credito?: string;
  sociedadContratacion?: string;
  contenido?: string;
}, cliente?: any): string {
  // If the stored content is already the complete master legal document (>2500 chars and not the short 4-clause summary), use it
  if (contrato.contenido && contrato.contenido.length >= 2500 && !contrato.contenido.includes('CLÁUSULA CUARTA (VIGENCIA)')) {
    return contrato.contenido;
  }

  const targetCountry = contrato.pais || cliente?.pais || 'Colombia';
  const empresaName = contrato.clienteNombre || cliente?.empresa || 'Empresa Cliente';
  const cedula = contrato.cedulaJuridica || cliente?.cedulaJuridica || (cliente as any)?.nit || 'COL-900344';
  const repCliente = contrato.representanteCliente || cliente?.representanteLegal || cliente?.nombreContacto || 'Representante Legal';
  const repProveedor = contrato.representanteProveedor || 'Daniel Decan (Director Legal)';
  const fee = contrato.feePorEmpleado || cliente?.feePorEmpleado || 200;
  const moneda = contrato.moneda || cliente?.moneda || 'USD';
  const cond = contrato.condicionesComerciales || cliente?.credito || 'Suscripción base mensual por colaborador. Soporte local incluido.';
  const dir = contrato.direccion || cliente?.direccion || `Sede Principal ${targetCountry}`;

  const vars: Record<string, string> = {
    empresa: empresaName,
    clienteNombre: empresaName,
    razonSocial: contrato.razonSocial || cliente?.razonSocial || empresaName,
    cedulaJuridica: cedula,
    nit: cedula,
    pais: targetCountry,
    direccion: dir,
    nombreContacto: repCliente,
    representanteLegal: repCliente,
    documentoRepresentante: cedula,
    correoContacto: cliente?.correoContacto || 'contacto@empresa.com',
    telefonoContacto: cliente?.telefonoContacto || '+1 (555) 019-2834',
    servicio: 'Employer of Record (EOR)',
    servicioContratado: 'Employer of Record (EOR)',
    moneda: moneda,
    feePorEmpleado: String(fee),
    fechaInicio: contrato.fechaInicio || (contrato.fechaGeneracion ? contrato.fechaGeneracion.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    fechaGeneracion: contrato.fechaGeneracion ? new Date(contrato.fechaGeneracion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    cantidadEstimada: String(cliente?.cupoTrabajadores || 1),
    representanteCliente: repCliente,
    representanteProveedor: repProveedor,
    sttEntidad: contrato.sociedadContratacion || cliente?.sociedadContratacion || `QUICK HIRE ${targetCountry.toUpperCase()} S.A.S. (STT ${targetCountry.toUpperCase()})`,
    sttPais: targetCountry,
    sttIdentificacion: 'NIT 900.123.456-1',
    sttDomicilio: `Sede Principal Quick Hire / STT - ${targetCountry}`,
    sttRepresentante: repProveedor,
    condicionesComerciales: cond,
    credito: contrato.credito || cliente?.credito || cond || '30 días'
  };

  return compileContractVariables(CONTRATO_MARCO_EOR_PLANTILLA_HTML, vars);
}
