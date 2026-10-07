import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import OperationalAlertsPanel from './OperationalAlertsPanel';
import { 
  User, 
  Cliente, 
  Trabajador, 
  CargaSocial, 
  Factura, 
  Pago, 
  HistorialCargaMasiva, 
  i18n, 
  Language,
  Beneficio,
  PagoContadoUSD,
  ContratoLaboral,
  Adendum,
  LATAM_COUNTRIES,
  COUNTRY_FLAGS
} from '../types';
import { calcularCostoTalento } from '../utils/laborCalculator';
import { renderCommercialContractHtml } from '../data/contractTemplates';
import { 
  Users, 
  Download, 
  Upload,
  UploadCloud, 
  Plus, 
  Search, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Eye, 
  BadgeHelp,
  Building2,
  Bell,
  FileSpreadsheet,
  Globe,
  DollarSign,
  LogOut,
  Shield,
  Lock,
  ArrowRight,
  Printer,
  FileSignature,
  CheckSquare,
  Star,
  Mail,
  Send,
  Filter,
  Briefcase,
  Layers,
  FileDown,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import UserManualModal from './UserManualModal';
import { PWAInstallButton } from './PWAInstallButton';
import { BookOpen } from 'lucide-react';
import { tText, translateStatus, tr, translateRole } from '../utils/i18n';

interface Props {
  user: User;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

export default function ClientDashboard({ user, lang, onLanguageChange, onLogout }: Props) {
  const t = i18n[lang].clientDashboard;
  const workersT = i18n[lang].workers;
  const bulkT = i18n[lang].bulk;
  const billingT = i18n[lang].billing;
  const commonT = i18n[lang].common;

  // Client and operational states
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [allClientes, setAllClientes] = useState<Cliente[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(user.clienteId || '');
  const [workers, setWorkers] = useState<Trabajador[]>([]);
  const [cargasSociales, setCargasSociales] = useState<CargaSocial[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagosContado, setPagosContado] = useState<PagoContadoUSD[]>([]);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [historialCargas, setHistorialCargas] = useState<HistorialCargaMasiva[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  
  // Soporte upload states
  const [showSoporteModal, setShowSoporteModal] = useState<PagoContadoUSD | Factura | any | null>(null);
  const [soporteMetodo, setSoporteMetodo] = useState('Transferencia Bancaria');
  const [soporteFecha, setSoporteFecha] = useState(new Date().toISOString().split('T')[0]);
  const [soporteArchivo, setSoporteArchivo] = useState('');
  const [soporteArchivoNombre, setSoporteArchivoNombre] = useState('');
  const [soporteError, setSoporteError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'trabajadores' | 'bulk' | 'billing' | 'tickets' | 'contratos'>('resumen');
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Contract management states
  const [contratosComerciales, setContratosComerciales] = useState<any[]>([]);
  const [contratosLaborales, setContratosLaborales] = useState<ContratoLaboral[]>([]);
  const [contratoTab, setContratoTab] = useState<'laborales' | 'comerciales' | 'adendums'>('laborales');
  const [adendums, setAdendums] = useState<Adendum[]>([]);
  const [selectedAdendum, setSelectedAdendum] = useState<Adendum | null>(null);
  const [adendumFirmanteNombre, setAdendumFirmanteNombre] = useState('');
  const [adendumObservaciones, setAdendumObservaciones] = useState('');
  const [adendumArchivoNombre, setAdendumArchivoNombre] = useState('');
  const [adendumFirmaImagen, setAdendumFirmaImagen] = useState('');
  const [adendumFirmaAceptada, setAdendumFirmaAceptada] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any | null>(null);
  const [selectedLaboral, setSelectedLaboral] = useState<ContratoLaboral | null>(null);
  const [showFirmaLaboralModal, setShowFirmaLaboralModal] = useState(false);
  const [showLaboralDetailModal, setShowLaboralDetailModal] = useState(false);
  const [laboralFirmanteNombre, setLaboralFirmanteNombre] = useState('');
  const [laboralObservaciones, setLaboralObservaciones] = useState('');
  const [laboralArchivoCargado, setLaboralArchivoCargado] = useState('');
  const [laboralArchivoNombre, setLaboralArchivoNombre] = useState('');
  const [firmanteNombre, setFirmanteNombre] = useState('');
  const [firmanteCargo, setFirmanteCargo] = useState('');
  const [firmaAceptada, setFirmaAceptada] = useState(false);
  const [firmaImagenUploaded, setFirmaImagenUploaded] = useState('');
  const [comentariosRechazo, setComentariosRechazo] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [firmaRelacionadaStr, setFirmaRelacionadaStr] = useState('');
  const [selectedLaboralIds, setSelectedLaboralIds] = useState<string[]>([]);

  // Synchronized labor contracts ensuring every worker has an active contract record ready to download, sign or email
  const effectiveLaborContracts: ContratoLaboral[] = useMemo(() => {
    const list = [...contratosLaborales];
    workers.forEach(w => {
      const exists = list.some(cl => cl.trabajadorId === w.id || (cl.trabajadorNombre && cl.trabajadorNombre.toLowerCase() === w.nombre.toLowerCase()));
      if (!exists) {
        list.push({
          id: `CTR-${w.id}`,
          clienteId: w.clienteId || cliente?.id || '',
          clienteNombre: cliente?.empresa || '',
          trabajadorId: w.id,
          trabajadorNombre: w.nombre,
          trabajadorCorreo: w.correo,
          puesto: w.puesto,
          pais: w.pais || cliente?.pais || 'Colombia',
          salario: w.salario,
          moneda: w.moneda || cliente?.moneda || 'USD',
          modalidadTrabajo: w.modalidadTrabajo || 'Remoto',
          fechaIngreso: w.fechaIngreso || new Date().toISOString().slice(0, 10),
          fechaGeneracion: new Date().toISOString(),
          estado: w.estado === 'Activo' ? 'Disponible' : 'Generado',
          contenido: `CONTRATO INDIVIDUAL DE TRABAJO LOCAL\n\nTrabajador: ${w.nombre}\nCargo: ${w.puesto}\nPaís: ${w.pais || cliente?.pais || 'Colombia'}\nSalario: $${w.salario} ${w.moneda || 'USD'}`
        } as any);
      }
    });
    return list;
  }, [contratosLaborales, workers, cliente]);

  const getLaboralContractContent = (cl: ContratoLaboral) => {
    if (cl.contenido && cl.contenido.length > 50) return cl.contenido;
    return `CONTRATO INDIVIDUAL DE TRABAJO LOCAL A TÉRMINO INDEFINIDO

ENTRE LAS PARTES:
De una parte, QUICK HIRE LATAM S.A.S. (en adelante el "EMPLEADOR EOR"), y de otra parte, el/la C. ${cl.trabajadorNombre || 'TRABAJADOR'}, domiciliado/a en ${cl.pais || 'América Latina'} (en adelante el "TRABAJADOR").

CLÁUSULAS DEL CONTRATO:

PRIMERA - PUESTO Y FUNCIONES: El TRABAJADOR desempeñará las labores del cargo de "${cl.puesto || 'Especialista'}", sujetándose a las instrucciones del Empleador y la normativa laboral vigente de ${cl.pais || 'América Latina'}.

SEGUNDA - REMUNERACIÓN: El EMPLEADOR abonará al TRABAJADOR una remuneración mensual de $${cl.salario?.toLocaleString() || '0'} ${cl.moneda || 'USD'}, mediante transferencia bancaria.

TERCERA - JORNADA Y MODALIDAD: La prestación de servicios se desarrollará bajo la modalidad ${cl.modalidadTrabajo || 'Teletrabajo / Remoto'} con fecha de inicio el ${cl.fechaIngreso || 'de acuerdo al requerimiento'}.

CUARTA - CONFIDENCIALIDAD: El TRABAJADOR mantendrá estricta confidencialidad sobre la información técnica y comercial de la empresa.

En fe de lo cual, firman las partes interesadas de conformidad.`;
  };

  const downloadContractAsHtmlFile = (
    contractId: string, 
    title: string, 
    content: string, 
    clientName: string, 
    representativeName: string,
    clientSignatureImg?: string
  ) => {
    const logoBase64 = localStorage.getItem('qh_contract_logo') || '';
    const signatureBase64 = localStorage.getItem('qh_contract_sig') || '';
    const signatureRepBase64 = localStorage.getItem('qh_contract_sig_rep') || '';
    
    const logoHtml = logoBase64 ? `<img src="${logoBase64}" style="max-height: 70px; display: block; margin-bottom: 20px;" />` : '';
    const sigClienteImgSrc = clientSignatureImg || signatureRepBase64;
    const sigClienteHtml = sigClienteImgSrc 
      ? `<img src="${sigClienteImgSrc}" style="max-height: 60px; max-width: 220px; object-fit: contain; display: block; margin-top: 10px; border-bottom: 1px solid #333;" />` 
      : '';
    const sigProvHtml = signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 60px; display: block; margin-top: 10px;" />` : '';
    const isHtmlContent = content && (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>') || content.includes('<br'));
    const contentBody = isHtmlContent ? content : `<div style="white-space: pre-wrap;">${content}</div>`;
    const fullHtml = `
      <html>
        <head>
          <title>${title} - ${contractId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; font-size: 13px; max-width: 850px; margin: 0 auto; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
            .sig-box { border-top: 1px solid #94a3b8; padding-top: 12px; }
            h1 { font-size: 18px; color: #0f172a; margin-top: 24px; margin-bottom: 12px; }
            h2 { font-size: 15px; color: #1e293b; margin-top: 20px; margin-bottom: 10px; }
            h3 { font-size: 13px; color: #334155; margin-top: 16px; margin-bottom: 8px; }
            p { margin-bottom: 12px; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #0f172a;">${title}</h1>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">ID Contrato: ${contractId}</p>
          </div>
          <div style="color: #334155;">${contentBody}</div>
          <div class="signatures">
            <div class="sig-box">
              <strong>POR EL CLIENTE / REPRES. LEGAL:</strong><br/>
              ${clientName}<br/>
              ${sigClienteHtml}
            </div>
            <div class="sig-box">
              <strong>POR EL PROVEEDOR (Quick Hire EOR):</strong><br/>
              ${representativeName}<br/>
              ${sigProvHtml}
            </div>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Contrato_${contractId}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Support Ticket Form/Modal states
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketAsunto, setTicketAsunto] = useState('');
  const [ticketDescripcion, setTicketDescripcion] = useState('');
  const [ticketCategoria, setTicketCategoria] = useState('Soporte General');
  const [ticketPrioridad, setTicketPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
  const [ticketReply, setTicketReply] = useState('');
  const [ticketRating, setTicketRating] = useState(5);
  const [ticketRatingComment, setTicketRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Trabajador | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Factura | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState<Factura | null>(null);

  // Individual Form Fields
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [puesto, setPuesto] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [workerPais, setWorkerPais] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [salario, setSalario] = useState('');
  const [modalidad, setModalidad] = useState<'Remoto' | 'Híbrido' | 'Presencial'>('Remoto');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Live talent cost calculation
  const talentCostEstimate = useMemo(() => {
    const selectedCountry = workerPais || cliente?.pais || 'Costa Rica';
    const amount = Number(salario) || 0;
    return calcularCostoTalento(
      amount,
      selectedCountry,
      cliente?.moneda || 'USD',
      cliente?.feePorEmpleado || 150
    );
  }, [salario, workerPais, cliente]);

  // Bulk Load Sandbox fields
  const [rawCsvText, setRawCsvText] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('onboarding_empleados.csv');
  const [bulkPreview, setBulkPreview] = useState<{
    valid: any[];
    observaciones: any[];
    errores: any[];
  } | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Payment Form Fields
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('Transferencia Bancaria');
  const [pagoComprobante, setPagoComprobante] = useState('');

  // Drag and Drop & Cash Support Helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSoporteError('El archivo excede el límite de 2MB.');
        return;
      }
      setSoporteArchivoNombre(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setSoporteArchivo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSoporteError('El archivo excede el límite de 2MB.');
        return;
      }
      setSoporteArchivoNombre(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setSoporteArchivo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirSoporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSoporteModal) return;
    if (!soporteArchivo) {
      setSoporteError('Por favor cargue un archivo de soporte (PDF, JPG, PNG).');
      return;
    }
    try {
      if ('totalFacturado' in showSoporteModal) {
        await api.registrarPago({
          facturaId: showSoporteModal.id,
          monto: showSoporteModal.saldoPendiente || showSoporteModal.totalFacturado,
          metodo: soporteMetodo,
          comprobante: `COMP-${Date.now().toString().slice(-6)}`,
          observaciones: `Soporte de pago cargado por cliente el ${soporteFecha}`,
          usuario: user.correo
        });
        await api.updateFactura(showSoporteModal.id, {
          estado: 'Pagada',
          observaciones: `Soporte de pago cargado el ${soporteFecha}`,
          usuario: user.correo
        });
      } else {
        await api.subirSoportePagoContado(showSoporteModal.id, {
          metodoPago: soporteMetodo,
          fechaPago: soporteFecha,
          archivoSoporte: soporteArchivo,
          usuario: user.correo
        });
      }
      setShowSoporteModal(null);
      setSoporteArchivo('');
      setSoporteArchivoNombre('');
      setSoporteError('');
      loadData();
      alert('¡Soporte de pago registrado y cargado con éxito!');
    } catch (err: any) {
      setSoporteError(err.message || 'Error al subir el soporte.');
    }
  };
  const [pagoError, setPagoError] = useState('');

  // Search and Advanced Filters for Workers
  const [workerTab, setWorkerTab] = useState<'listado' | 'carga-masiva' | 'plantilla'>('listado');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPuesto, setFilterPuesto] = useState('All');
  const [filterModalidad, setFilterModalidad] = useState('All');
  const [filterSalario, setFilterSalario] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Contract Email modal state
  const [showEmailModal, setShowEmailModal] = useState<{
    mode: 'single' | 'bulk';
    targets: { cl: ContratoLaboral; workerEmail: string; workerName: string; workerPuesto?: string }[];
    asunto: string;
    mensaje: string;
    sending: boolean;
    result?: string;
  } | null>(null);

  // Helper to safely filter collections by active client ID or company name
  const filterByActiveClient = <T extends Record<string, any>>(list: T[], idKey = 'clienteId', nameKey = 'clienteNombre'): T[] => {
    const cid = cliente?.id || selectedClientId || user.clienteId || '';
    const cname = cliente?.empresa?.toLowerCase() || '';
    if (!cid && !cname) return [];
    return list.filter(item => 
      (cid && item[idKey] === cid) ||
      (cname && item[nameKey]?.toLowerCase() === cname) ||
      (cname && item[nameKey]?.toLowerCase().includes(cname))
    );
  };

  // Load Client details and resources
  const loadData = async (overrideClientId?: string) => {
    setLoading(true);
    try {
      // Fetch Clients
      const clientsList = await api.getClientes();
      setAllClientes(clientsList);

      let activeClientId = overrideClientId || selectedClientId || user.clienteId || '';
      let currentClient = clientsList.find(c => c.id === activeClientId) || null;

      if (!currentClient) {
        currentClient = clientsList.find(c => 
          (c.correoContacto && user.correo && c.correoContacto.toLowerCase() === user.correo.toLowerCase()) ||
          (c.empresa && user.correo && user.correo.toLowerCase().split('@')[0].length > 2 && c.empresa.toLowerCase().includes(user.correo.toLowerCase().split('@')[0])) ||
          (c.empresa && user.nombre && user.nombre.length > 2 && c.empresa.toLowerCase().includes(user.nombre.toLowerCase().split(' ')[0]))
        ) || (user.rol === 'supracliente' || user.rol === 'administrador' ? (clientsList[0] || null) : null);

        if (currentClient) {
          activeClientId = currentClient.id;
          setSelectedClientId(currentClient.id);
        }
      } else {
        setSelectedClientId(currentClient.id);
      }

      if (currentClient) {
        if (!user.clienteId) {
          user.clienteId = currentClient.id;
        }
        try {
          const sessionStr = localStorage.getItem('qh_session');
          if (sessionStr) {
            const sess = JSON.parse(sessionStr);
            if (!sess.clienteId) {
              sess.clienteId = currentClient.id;
              localStorage.setItem('qh_session', JSON.stringify(sess));
            }
          }
        } catch (e) {}
      }

      setCliente(currentClient);

      const targetId = currentClient?.id || activeClientId;
      const targetEmpresa = currentClient?.empresa?.toLowerCase() || '';

      if (targetId || targetEmpresa) {
        // Fetch active workers for this client
        const workersList = await api.getTrabajadores(targetId);
        setWorkers(workersList);

        // Fetch master lists
        const socialList = await api.getCargasSociales();
        setCargasSociales(socialList);

        const billsList = await api.getFacturas();
        const clientInvoices = billsList.filter(f => 
          (targetId && f.clienteId === targetId) ||
          (targetEmpresa && f.clienteNombre?.toLowerCase().includes(targetEmpresa)) ||
          (targetEmpresa && targetEmpresa.includes(f.clienteNombre?.toLowerCase() || '___'))
        );
        setFacturas(clientInvoices);

        const benefitsList = await api.getBeneficios();
        setBeneficios(benefitsList.filter(b => b.estado === 'Activo'));

        const historyList = await api.getHistorialCargas();
        setHistorialCargas(historyList.filter(h => (targetId && h.clienteId === targetId) || (targetEmpresa && h.clienteNombre?.toLowerCase().includes(targetEmpresa))));

        const ticketsList = await api.getTickets().catch(() => []);
        const clientTickets = ticketsList.filter(t => 
          (targetId && t.clienteId === targetId) ||
          (targetEmpresa && (t as any).clienteNombre?.toLowerCase().includes(targetEmpresa)) ||
          (user.correo && t.solicitanteEmail?.toLowerCase() === user.correo.toLowerCase()) ||
          (user.clienteId && t.clienteId === user.clienteId)
        );
        setTickets(clientTickets);
        
        const contractsList = await api.getContratosComerciales().catch(() => []);
        const clientContracts = contractsList.filter(cc => 
          (targetId && cc.clienteId === targetId) ||
          (targetEmpresa && cc.clienteNombre?.toLowerCase().includes(targetEmpresa)) ||
          (targetEmpresa && targetEmpresa.includes(cc.clienteNombre?.toLowerCase() || '___'))
        );
        setContratosComerciales(clientContracts);

        const laborContractsList = await api.getContratosLaborales().catch(() => []);
        const clientLaborContracts = laborContractsList.filter(cl => 
          (targetId && cl.clienteId === targetId) ||
          (targetEmpresa && cl.clienteNombre?.toLowerCase().includes(targetEmpresa))
        );
        setContratosLaborales(clientLaborContracts);

        const adendumsList = await api.getAdendums().catch(() => []);
        setAdendums(adendumsList.filter(ad => 
          (targetId && ad.clienteId === targetId) ||
          (targetEmpresa && ad.clienteNombre?.toLowerCase().includes(targetEmpresa))
        ));

        const pagosContadoList = await api.getPagosContado().catch(() => []);
        setPagosContado(pagosContadoList.filter(pc => (targetId && pc.clienteId === targetId)));

        // Keep active ticket updated if open
        if (activeTicket) {
          const fresh = ticketsList.find(tk => tk.id === activeTicket.id);
          if (fresh) setActiveTicket(fresh);
        }
      }
    } catch (e) {
      console.error('Error loading client workspace details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.clienteId]);

  // Handle individual worker creation
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!nombre || !correo || !puesto || !salario) {
      setFormError('Completa todos los campos requeridos (*).');
      return;
    }

    if (!cliente) return;

    try {
      // Map benefit costs
      const mappedBenefits = selectedBenefits.map(bId => {
        const benefitObj = beneficios.find(b => b.id === bId);
        return { beneficioId: bId, costo: benefitObj ? benefitObj.costo : 0 };
      });

      const selectedWorkerPais = workerPais || cliente.pais || 'Costa Rica';
      const selectedWorkerProyecto = proyecto.trim() || cliente.proyecto || 'Proyecto Principal';

      await api.createTrabajador({
        clienteId: cliente.id,
        nombre: nombre.trim(),
        correo: correo.trim(),
        documentoIdentidad: documentoIdentidad.trim(),
        proyecto: selectedWorkerProyecto,
        puesto: puesto.trim(),
        tipoCarga: 'Individual',
        fechaIngreso: fechaIngreso || new Date().toISOString().slice(0, 10),
        salario: Number(salario),
        moneda: cliente.moneda,
        modalidadTrabajo: modalidad,
        beneficiosAplicables: mappedBenefits,
        estado: 'En revisión',
        observaciones: `Pre-cargado desde portal cliente. Proyecto: ${selectedWorkerProyecto}. Costo total talento: $${talentCostEstimate.costoTotalTalento} ${cliente.moneda}.`,
        usuario: user.correo,
        pais: selectedWorkerPais,
        cargasSocialesPatronalesPct: talentCostEstimate.cargasSocialesPatronalesPct,
        cargasSocialesMonto: talentCostEstimate.cargasSocialesMonto,
        feeMonto: talentCostEstimate.feeServicioMonto,
        impuestosMonto: talentCostEstimate.impuestosMonto,
        costoTotalTalento: talentCostEstimate.costoTotalTalento,
        detallesCostos: {
          cargasSocialesPatronalesPct: talentCostEstimate.cargasSocialesPatronalesPct,
          cargasSocialesMonto: talentCostEstimate.cargasSocialesMonto,
          feeServicioMonto: talentCostEstimate.feeServicioMonto,
          impuestosMonto: talentCostEstimate.impuestosMonto,
          costoTotal: talentCostEstimate.costoTotalTalento,
          desglose: talentCostEstimate.desglose,
          impuestosDetalle: talentCostEstimate.impuestosDetalle
        }
      });

      setFormSuccess(workersT.registerSuccess || 'Colaborador registrado exitosamente en su proyecto.');
      // Reset
      setNombre('');
      setCorreo('');
      setDocumentoIdentidad('');
      setPuesto('');
      setProyecto('');
      setSalario('');
      setWorkerPais('');
      setSelectedBenefits([]);
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar trabajador.');
    }
  };

  // Download all client workers with full cost details
  const handleDownloadWorkersReport = () => {
    if (!workers || workers.length === 0) {
      alert('No hay trabajadores para exportar en este momento.');
      return;
    }
    const headers = [
      'ID Colaborador',
      'Empresa Cliente',
      'Proyecto',
      'Nombre Completo',
      'Correo Electrónico',
      'Documento de Identidad',
      'País',
      'Puesto / Cargo',
      'Modalidad',
      'Fecha Ingreso',
      'Salario Bruto',
      'Moneda',
      'Cargas Sociales Patronales (%)',
      'Monto Cargas Sociales ($)',
      'Fee de Servicio EOR ($)',
      'Impuestos Locales ($)',
      'Costo Total del Talento ($)',
      'Estado'
    ];
    const rows = workers.map(w => {
      const calc = w.detallesCostos || calcularCostoTalento(w.salario, w.pais, w.moneda, cliente?.feePorEmpleado || 150);
      return [
        `"${w.id}"`,
        `"${w.clienteNombre || cliente?.empresa || ''}"`,
        `"${w.proyecto || cliente?.proyecto || 'General'}"`,
        `"${w.nombre}"`,
        `"${w.correo}"`,
        `"${w.documentoIdentidad || 'N/A'}"`,
        `"${w.pais}"`,
        `"${w.puesto}"`,
        `"${w.modalidadTrabajo || 'Remoto'}"`,
        `"${w.fechaIngreso || ''}"`,
        w.salario || 0,
        `"${w.moneda || 'USD'}"`,
        w.cargasSocialesPatronalesPct || calc.cargasSocialesPatronalesPct || 0,
        w.cargasSocialesMonto || calc.cargasSocialesMonto || 0,
        w.feeMonto || (calc as any).feeServicioMonto || 0,
        w.impuestosMonto || (calc as any).impuestosMonto || 0,
        w.costoTotalTalento || (calc as any).costoTotal || (calc as any).costoTotalTalento || 0,
        `"${w.estado}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Colaboradores_${cliente?.empresa.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run validation on typed/dropped CSV values
  const handleValidateCsv = () => {
    setBulkError('');
    setBulkSuccess('');
    if (!rawCsvText.trim()) {
      setBulkError('Ingresa o pega datos de plantilla para validar.');
      return;
    }

    const lines = rawCsvText.split('\n');
    if (lines.length < 2) {
      setBulkError('El archivo debe tener al menos una línea de encabezados y una línea de datos.');
      return;
    }

    // Official Columns check
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['Nombre', 'Correo', 'Puesto', 'FechaIngreso', 'Salario', 'Moneda', 'Modalidad'];
    const missing = requiredHeaders.filter(req => !headers.includes(req));

    if (missing.length > 0) {
      setBulkError(`Encabezados faltantes o incorrectos: [${missing.join(', ')}]. Asegúrate de usar comas para separar los campos.`);
      return;
    }

    const detectedValid: any[] = [];
    const detectedObs: any[] = [];
    const detectedErr: any[] = [];

    // Parse lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const rowNum = i + 1;

      // Extract by index matching header positions
      const rowData: any = {};
      headers.forEach((h, idx) => {
        rowData[h] = cols[idx] ? cols[idx].trim() : '';
      });

      const errorsInRow: string[] = [];
      const obsInRow: string[] = [];

      if (!rowData.Nombre) {
        errorsInRow.push('El Nombre es obligatorio.');
      }
      if (!rowData.Correo || !rowData.Correo.includes('@')) {
        errorsInRow.push('El Correo electrónico no es válido.');
      }
      if (!rowData.Puesto) {
        errorsInRow.push('El Puesto laboral es obligatorio.');
      }

      const salarioNum = Number(rowData.Salario);
      if (isNaN(salarioNum) || salarioNum <= 0) {
        errorsInRow.push('El Salario debe ser un número positivo.');
      }

      // Warnings
      const modStd = ['Remoto', 'Híbrido', 'Presencial', 'Remote', 'Hybrid', 'On-site'].includes(rowData.Modalidad);
      if (rowData.Modalidad && !modStd) {
        obsInRow.push('Modalidad no es estándar (Remoto/Híbrido/Presencial).');
      }
      const monStd = ['MXN', 'COP', 'BRL', 'USD', 'EUR'].includes(String(rowData.Moneda).toUpperCase());
      if (rowData.Moneda && !monStd) {
        obsInRow.push('Moneda difiere del catálogo de servicios locales.');
      }

      const finalRowItem = {
        fila: rowNum,
        ...rowData,
        salario: salarioNum || 0,
      };

      if (errorsInRow.length > 0) {
        detectedErr.push({
          fila: rowNum,
          nombre: rowData.Nombre || `Fila ${rowNum}`,
          campo: 'Múltiples',
          error: errorsInRow.join(' | '),
          valorOriginal: line
        });
      } else if (obsInRow.length > 0) {
        detectedObs.push({
          ...finalRowItem,
          observaciones: obsInRow.join(' ')
        });
      } else {
        detectedValid.push(finalRowItem);
      }
    }

    setBulkPreview({
      valid: detectedValid,
      observaciones: detectedObs,
      errores: detectedErr
    });
  };

  // Submit bulk array after preview validations are green
  const handleProcessBulk = async () => {
    if (!bulkPreview || !cliente) return;
    setBulkError('');
    setBulkSuccess('');

    if (bulkPreview.errores.length > 0) {
      setBulkError('Corrige las filas con errores críticos antes de procesar.');
      return;
    }

    const totalToUpload = [...bulkPreview.valid, ...bulkPreview.observaciones];
    if (totalToUpload.length === 0) {
      setBulkError('No hay registros válidos para subir.');
      return;
    }

    try {
      const res = await api.bulkUploadTrabajadores({
        clienteId: cliente.id,
        archivoNombre,
        registros: totalToUpload,
        usuario: user.correo
      });

      if (res.success) {
        setBulkSuccess(`Carga masiva procesada con éxito. ${res.trabajadoresAgregados} colaboradores agregados en revisión.`);
        setRawCsvText('');
        setBulkPreview(null);
        loadData();
      }
    } catch (err: any) {
      setBulkError(err.message || 'Error procesando carga masiva.');
    }
  };

  // Submit payment record
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPagoError('');
    if (!showPaymentModal) return;

    const montoNum = Number(pagoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setPagoError('Monto de pago inválido.');
      return;
    }

    try {
      await api.registrarPago({
        facturaId: showPaymentModal.id,
        monto: montoNum,
        metodo: pagoMetodo,
        comprobante: pagoComprobante,
        observaciones: `Pago registrado desde portal cliente por ${user.nombre}`,
        usuario: user.correo
      });

      setShowPaymentModal(null);
      setPagoMonto('');
      setPagoComprobante('');
      loadData();
    } catch (err: any) {
      setPagoError(err.message || 'Error registrando pago.');
    }
  };

  const loadDemoCsv = () => {
    const csvContent = `Nombre,Correo,Puesto,FechaIngreso,Salario,Moneda,Modalidad
Elena Vázquez,elena.vazquez@test.com,DevOps Lead,2026-07-01,48000,MXN,Remoto
Mateo Restrepo,mateo.restrepo@test.co,Data Analyst,2026-07-06,5500000,COP,Híbrido
Camila Martins,camila.martins@test.br,HR Specialist,2026-07-01,7200,BRL,Presencial
Sonia Ortiz,sonia.ortiz@test.com,Project Manager,2026-07-10,35000,EUR,IncorrectoMode`;
    setRawCsvText(csvContent);
  };

  const downloadPlantillaOficial = () => {
    const headers = ['Nombre', 'Correo', 'Puesto', 'FechaIngreso', 'Salario', 'Moneda', 'Modalidad'];
    const sampleRows = [
      ['Elena Vázquez', 'elena.vazquez@empresa.com', 'Senior Fullstack Engineer', '2026-09-01', '4500', cliente?.moneda || 'USD', 'Remoto'],
      ['Carlos Mendoza', 'carlos.mendoza@empresa.com', 'Product Designer', '2026-09-01', '3800', cliente?.moneda || 'USD', 'Híbrido'],
      ['Mariana Silva', 'mariana.silva@empresa.com', 'QA Lead', '2026-09-15', '3200', cliente?.moneda || 'USD', 'Presencial']
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Plantilla_Carga_Trabajadores_${cliente?.pais || 'EOR'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSingleEmailModal = (cl: ContratoLaboral) => {
    const matchedWorker = workers.find(w => w.id === cl.trabajadorId || w.nombre.toLowerCase() === cl.trabajadorNombre?.toLowerCase());
    const workerEmail = (cl as any).trabajadorCorreo || matchedWorker?.correo || 'colaborador@empresa.com';
    
    setShowEmailModal({
      mode: 'single',
      targets: [{
        cl,
        workerEmail,
        workerName: cl.trabajadorNombre,
        workerPuesto: cl.puesto
      }],
      asunto: `Contrato Individual de Trabajo - ${cl.trabajadorNombre}`,
      mensaje: `Estimado(a) ${cl.trabajadorNombre},\n\nLe hacemos entrega formal de su contrato individual de trabajo bajo legislación de ${cl.pais}. Por favor revíselo y proceda con su firma digital.\n\nAtentamente,\nEquipo de Gestión EOR - Quick Hire Latam`,
      sending: false,
      result: ''
    });
  };

  const handleOpenBulkEmailModal = () => {
    const targets = selectedLaboralIds.length > 0
      ? effectiveLaborContracts.filter(cl => selectedLaboralIds.includes(cl.id))
      : effectiveLaborContracts;

    if (targets.length === 0) {
      alert("No hay contratos laborales disponibles para enviar.");
      return;
    }

    const mappedTargets = targets.map(cl => {
      const matchedWorker = workers.find(w => w.id === cl.trabajadorId || w.nombre.toLowerCase() === cl.trabajadorNombre?.toLowerCase());
      return {
        cl,
        workerEmail: (cl as any).trabajadorCorreo || matchedWorker?.correo || 'colaborador@empresa.com',
        workerName: cl.trabajadorNombre,
        workerPuesto: cl.puesto
      };
    });

    setShowEmailModal({
      mode: 'bulk',
      targets: mappedTargets,
      asunto: 'Envío Masivo de Contratos Laborales - Quick Hire Latam EOR',
      mensaje: 'Estimado(a) colaborador(a),\n\nLe enviamos su contrato de trabajo individual formal para su revisión y firma digital.\n\nAtentamente,\nEquipo de Gestión EOR - Quick Hire Latam',
      sending: false,
      result: ''
    });
  };

  const handleOpenMassEmailModal = handleOpenBulkEmailModal;

  const handleExecuteSendEmails = async () => {
    if (!showEmailModal || showEmailModal.targets.length === 0) return;
    setShowEmailModal(prev => prev ? { ...prev, sending: true, result: '' } : null);

    let sentCount = 0;
    let errors: string[] = [];

    for (const target of showEmailModal.targets) {
      try {
        await api.enviarCorreoContratoLaboral(target.cl.id, {
          correoDestinatario: target.workerEmail,
          observaciones: showEmailModal.mensaje,
          usuario: user.correo
        });
        sentCount++;
      } catch (err: any) {
        errors.push(`${target.workerName}: ${err.message || 'Error al enviar'}`);
      }
    }

    // Refresh contracts
    const updated = await api.getContratosLaborales().catch(() => []);
    setContratosLaborales(filterByActiveClient(updated));

    if (errors.length === 0) {
      setShowEmailModal(prev => prev ? {
        ...prev,
        sending: false,
        result: `¡Éxito! Se enviaron correctamente ${sentCount} contrato(s) por correo electrónico a la casilla registrada en la ficha de cada trabajador.`
      } : null);
    } else {
      setShowEmailModal(prev => prev ? {
        ...prev,
        sending: false,
        result: `Enviados ${sentCount} de ${showEmailModal.targets.length}. Observaciones: ${errors.join(', ')}`
      } : null);
    }
  };

  // Filter workers based on search query and advanced filters (puesto, modalidad, salario, estado)
  const uniquePuestos = Array.from(new Set(workers.map(w => w.puesto).filter(Boolean))).sort();

  const filteredWorkers = workers.filter(w => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      w.nombre.toLowerCase().includes(q) || 
      w.correo.toLowerCase().includes(q) ||
      w.puesto.toLowerCase().includes(q) ||
      (w.id && w.id.toLowerCase().includes(q));

    const matchesPuesto = filterPuesto === 'All' || w.puesto === filterPuesto;
    const matchesModalidad = filterModalidad === 'All' || w.modalidadTrabajo === filterModalidad;
    const matchesStatus = filterStatus === 'All' || w.estado === filterStatus;
    
    let matchesSalario = true;
    if (filterSalario === '<1000') {
      matchesSalario = w.salario < 1000;
    } else if (filterSalario === '1000-2500') {
      matchesSalario = w.salario >= 1000 && w.salario <= 2500;
    } else if (filterSalario === '2500-5000') {
      matchesSalario = w.salario > 2500 && w.salario <= 5000;
    } else if (filterSalario === '>5000') {
      matchesSalario = w.salario > 5000;
    }

    return matchesSearch && matchesPuesto && matchesModalidad && matchesStatus && matchesSalario;
  });

  if (loading) {
    return (
      <div id="loading-spinner" className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm font-semibold">{commonT.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="client-dashboard-root" className="flex h-screen bg-slate-100 font-sans overflow-hidden text-slate-900">
      {/* USER MANUAL MODAL */}
      <UserManualModal 
        user={user} 
        lang={lang} 
        isOpen={isManualOpen} 
        onClose={() => setIsManualOpen(false)} 
      />

      {/* LEFT DARK SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-white">Quick Hire EOR</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              Portal Cliente
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto text-xs">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 ${
              activeTab === 'resumen' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>{i18n[lang].menu.dashboard}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trabajadores');
              setWorkerTab('listado');
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-between ${
              activeTab === 'trabajadores' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>{i18n[lang].menu.workers}</span>
            </div>
            {workers.length > 0 && (
              <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {workers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 ${
              activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>{i18n[lang].menu.billing}</span>
          </button>

          <button
            onClick={() => setActiveTab('contratos')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 ${
              activeTab === 'contratos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{lang === 'es' ? 'Contratos' : lang === 'en' ? 'Contracts' : 'Contratos'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 ${
              activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BadgeHelp className="w-4 h-4 shrink-0" />
            <span>{lang === 'es' ? 'Soporte y Tickets' : lang === 'en' ? 'Support & Tickets' : 'Suporte e Tickets'}</span>
          </button>
        </nav>

        {/* Sidebar Footer Client Details */}
        {cliente && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">{t.serviceType}:</span>
              <strong className="text-white truncate max-w-[110px]">{cliente.servicioContratado}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">{tr('Colaboradores Contratados:', 'Contracted Staff:', 'Colaboradores Contratados:', lang)}</span>
              <strong className="text-indigo-300 font-mono">{workers.filter(w => w.estado === 'Activo').length} {tr('activos', 'active', 'ativos', lang)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">{tr('País Operativo:', 'Operating Country:', 'País Operacional:', lang)}</span>
              <strong className="text-emerald-400 font-medium">{cliente.pais}</strong>
            </div>
          </div>
        )}

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 text-xs">
          <div className="truncate">
            <p className="font-bold text-slate-200 text-[11px] truncate">{user.nombre}</p>
            <p className="text-[10px] text-slate-500 truncate">{cliente?.empresa || user.correo}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all shrink-0 cursor-pointer"
            title={i18n[lang].auth.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-xs sticky top-0 z-30">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              {activeTab === 'resumen' && (i18n[lang].menu.dashboard || 'Dashboard Central')}
              {activeTab === 'trabajadores' && (i18n[lang].menu.workers || 'Nómina y Colaboradores')}
              {activeTab === 'bulk' && (i18n[lang].menu.templates || 'Carga Masiva de Empleados')}
              {activeTab === 'billing' && (i18n[lang].menu.billing || 'Facturación y Control de Pagos')}
              {activeTab === 'tickets' && (lang === 'es' ? 'Soporte y Tickets' : lang === 'en' ? 'Support & Tickets' : 'Suporte e Tickets')}
              {activeTab === 'contratos' && (lang === 'es' ? 'Contratos Comerciales y Laborales' : lang === 'en' ? 'Commercial & Labor Contracts' : 'Contratos Comerciais e Trabalhistas')}
            </h2>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>{tText('Cliente Activo:', lang)}</span>
              {allClientes.length > 0 ? (
                <select
                  value={selectedClientId || cliente?.id || ''}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setSelectedClientId(chosenId);
                    loadData(chosenId);
                  }}
                  className="bg-indigo-50/90 border border-indigo-200 text-indigo-950 font-bold text-xs px-2.5 py-1 rounded-xl cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 shadow-3xs"
                >
                  {allClientes.map(c => (
                    <option key={c.id} value={c.id}>{c.empresa} ({c.pais})</option>
                  ))}
                </select>
              ) : (
                <strong className="text-slate-800 font-bold">{cliente?.empresa || user.nombre}</strong>
              )}
              <span className="ml-1">({cliente?.pais || 'Global'}) &bull; {tText('Estado del Servicio:', lang)}</span>
              <strong className="text-emerald-600 font-bold">{translateStatus(cliente?.estadoServicio || cliente?.estado || 'Activo', lang)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <button
              onClick={() => setIsManualOpen(true)}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl transition-all border border-indigo-100 font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              title={tText('Centro de Manuales de Usuario', lang)}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{tText('Manual de Usuario', lang)}</span>
            </button>
            <LanguageSelector currentLanguage={lang} onLanguageChange={onLanguageChange} />
            <button
              onClick={onLogout}
              className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3.5 py-2 rounded-xl transition-all border border-slate-200 font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{i18n[lang].auth.logout}</span>
            </button>
          </div>
        </header>

        {/* Content Body Container */}
        <main className="p-6 flex-1 space-y-6">
          {/* TAB 1: RESUMEN / DASHBOARD (DATA & KPIS ONLY) */}
          {activeTab === 'resumen' && cliente && (
            <div id="tab-resumen-panel" className="space-y-6">
              {/* Header card welcome with quick navigation */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900">{t.welcome} {cliente.empresa}</h2>
                  <p className="text-slate-500 text-sm">
                    {lang === 'es' 
                      ? 'Panel ejecutivo de métricas operativas, distribución de nómina y estado legal de contratación.' 
                      : lang === 'en' 
                      ? 'Executive metrics dashboard, payroll distribution, and hiring compliance status.' 
                      : 'Painel executivo de métricas operacionais, distribuição de folha e status legal de contratação.'}
                  </p>
                </div>
                <div className="flex space-x-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('trabajadores');
                      setWorkerTab('listado');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver Trabajadores ({workers.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('contratos');
                      setContratoTab('laborales');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Gestionar Contratos</span>
                  </button>
                </div>
              </div>

              {(() => {
                const isContractSigned = contratosComerciales.some(cc => ['Firmado por cliente', 'Firmado por proveedor', 'Firmado por ambas partes', 'Aprobado', 'Servicio liberado', 'Pagado', 'Firmado'].includes(cc.estado) || cc.firmadoPorCliente);
                const isPaymentValidated = pagosContado.some(p => ['Validado', 'Aplicado'].includes(p.estado)) || facturas.some(f => f.estado === 'Pagada' || f.pagosAplicados > 0);
                const isServiceReleased = cliente.estadoServicio === 'Servicio liberado';

                return (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${isServiceReleased ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{tText('Estado de Activación de Servicios EOR', lang)}</h3>
                          <p className="text-slate-500 text-[11px]">{tText('De acuerdo con las políticas corporativas, los servicios de nómina y contratos locales requieren validación previa.', lang)}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                        isServiceReleased 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {translateStatus(cliente.estadoServicio || 'Pendiente de contrato comercial', lang)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Step 1: Commercial Contract */}
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${isContractSigned ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="mt-0.5">
                          {isContractSigned ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">1</div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900">{tText('1. Firma del Contrato Comercial Cliente-Proveedor', lang)}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{tText('Debe revisar y firmar digitalmente el acuerdo general de servicios EOR con su asesor comercial.', lang)}</p>
                          {!isContractSigned && (
                            <button
                              onClick={() => {
                                setActiveTab('contratos');
                                setContratoTab('comerciales');
                                const pending = contratosComerciales.find(cc => !cc.firmadoPorCliente || cc.estado !== 'Servicio liberado') || contratosComerciales[0];
                                if (pending) {
                                  setSelectedContrato(pending);
                                  setFirmanteNombre(pending.representanteCliente || cliente?.nombreContacto || user.nombre || '');
                                  setFirmanteCargo('');
                                  setFirmaAceptada(false);
                                }
                              }}
                              className="mt-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-500 flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{tText('Ir a firmar contrato', lang)}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Initial Payment */}
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${isPaymentValidated ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="mt-0.5">
                          {isPaymentValidated ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">2</div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900">{tText('2. Pago Inicial de Contado USD Validado', lang)}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{tText('El pago inicial de contado en USD del servicio debe ser transferido y verificado por la administración.', lang)}</p>
                          {!isPaymentValidated && (
                            <button
                              onClick={() => {
                                setActiveTab('billing');
                                const pendingFac = facturas.find(f => f.saldoPendiente > 0 || f.estado !== 'Pagada') || facturas[0];
                                if (pendingFac) {
                                  setShowSoporteModal(pendingFac);
                                  setSoporteError('');
                                }
                              }}
                              className="mt-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-500 flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{tText('Subir comprobante de pago', lang)}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isServiceReleased && (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-800 leading-relaxed flex items-start space-x-2">
                        <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">{tText('Servicio Bloqueado Temporalmente:', lang)} </strong> 
                          {tText('Mientras el servicio permanezca bloqueado, no podrá acceder a contratos laborales firmados de sus empleados, emitir nuevos contratos legales, ni completar el inicio operativo de personal. El registro de colaboradores y cargas masivas permanecerá en modo de pre-registro hasta su liberación oficial.', lang)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Stat Boxes: Executive Data & KPIs (Total contratados, activos, nómina, contratos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Contratados</span>
                    <span className="text-2xl font-black text-slate-900">
                      {workers.length}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Colaboradores Registrados</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Colaboradores Activos</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {workers.filter(w => w.estado === 'Activo').length}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                      {workers.length > 0 ? `${Math.round((workers.filter(w => w.estado === 'Activo').length / workers.length) * 100)}% del total` : '0%'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Nómina Mensual Bruta</span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      ${workers.reduce((sum, w) => sum + (Number(w.salario) || 0), 0).toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                      {cliente.moneda} / mes
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Contratos Laborales</span>
                    <span className="text-2xl font-black text-purple-700">
                      {contratosLaborales.length}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                      {contratosLaborales.filter(c => c.estado === 'Firmado').length} Firmados
                    </span>
                  </div>
                </div>
              </div>

              {/* Data & Distribution Panels (Pure Data Dashboard) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Modalidad de Trabajo Breakdown */}
                <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Distribución por Modalidad de Trabajo</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{workers.length} Colaboradores</span>
                  </div>

                  {workers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No hay colaboradores registrados para calcular distribución.
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {(() => {
                        const modalidades = ['Remoto', 'Híbrido', 'Presencial'];
                        return modalidades.map(mod => {
                          const count = workers.filter(w => (w.modalidadTrabajo || '').toLowerCase() === mod.toLowerCase()).length;
                          const pct = workers.length > 0 ? Math.round((count / workers.length) * 100) : 0;
                          return (
                            <div key={mod} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-700">{mod}</span>
                                <span className="text-slate-900 font-mono">{count} ({pct}%)</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    mod === 'Remoto' ? 'bg-indigo-600' : mod === 'Híbrido' ? 'bg-blue-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Resumen por Puestos Principales */}
                <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Concentración por Puestos</h3>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('trabajadores');
                        setWorkerTab('listado');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Ver Todos →
                    </button>
                  </div>

                  {workers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No hay datos de puestos registrados.
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {(() => {
                        const puestosMap: { [key: string]: number } = {};
                        workers.forEach(w => {
                          const p = w.puesto || 'Sin puesto asignado';
                          puestosMap[p] = (puestosMap[p] || 0) + 1;
                        });
                        const sortedPuestos = Object.entries(puestosMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

                        return sortedPuestos.map(([puesto, count]) => (
                          <div key={puesto} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl transition-all">
                            <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{puesto}</span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 text-indigo-700 rounded-lg text-[10px] font-mono font-bold">
                              {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GESTION DE TRABAJADORES (CON FILTROS, CARGA MASIVA Y PLANTILLA) */}
          {activeTab === 'trabajadores' && (
            <div id="tab-trabajadores-panel" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6 animate-fade-in">
              {/* Header & Sub-Tabs Navigation */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Gestión de Trabajadores</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Consulte la nómina, aplique filtros detallados, cargue colaboradores masivamente o descargue la plantilla oficial.
                  </p>
                </div>

                {/* Sub-tabs selector */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 max-w-full flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setWorkerTab('listado')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      workerTab === 'listado' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-indigo-950'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Listado de Trabajadores ({filteredWorkers.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerTab('carga-masiva')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      workerTab === 'carga-masiva' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-indigo-950'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Carga Masiva</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkerTab('plantilla')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      workerTab === 'plantilla' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-indigo-950'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Plantilla de Carga</span>
                  </button>
                </div>
              </div>

              {/* SUB-VIEW 1: LISTADO DE TRABAJADORES WITH ADVANCED FILTERS */}
              {workerTab === 'listado' && (
                <div className="space-y-5">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                      Mostrando <strong className="text-slate-900 font-bold">{filteredWorkers.length}</strong> de <strong className="text-slate-900 font-bold">{workers.length}</strong> colaboradores registrados
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDownloadWorkersReport}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                        title="Exportar listado completo de colaboradores y desglose de costos a CSV"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Exportar Nómina / Costos</span>
                      </button>

                      <button
                        type="button"
                        onClick={downloadPlantillaOficial}
                        className="bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                        title="Descargar plantilla oficial CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Plantilla</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWorkerTab('carga-masiva')}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Carga Masiva</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Alta Individual</span>
                      </button>
                    </div>
                  </div>

                  {/* Comprehensive Filtering Section */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="uppercase tracking-wider text-[10px] text-slate-500">Filtros de Búsqueda</span>
                      {(searchQuery || filterPuesto !== 'All' || filterModalidad !== 'All' || filterSalario !== 'All' || filterStatus !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterPuesto('All');
                            setFilterModalidad('All');
                            setFilterSalario('All');
                            setFilterStatus('All');
                          }}
                          className="text-rose-600 hover:text-rose-700 text-[11px] font-bold underline cursor-pointer"
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Search by Name / Email */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por nombre o correo..."
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-950"
                        />
                      </div>

                      {/* Filter by Puesto */}
                      <div>
                        <select
                          value={filterPuesto}
                          onChange={(e) => setFilterPuesto(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-950 font-medium"
                        >
                          <option value="All">Puesto: Todos</option>
                          {Array.from(new Set(workers.map(w => w.puesto).filter(Boolean))).map(puesto => (
                            <option key={puesto} value={puesto}>{puesto}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Modalidad */}
                      <div>
                        <select
                          value={filterModalidad}
                          onChange={(e) => setFilterModalidad(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-950 font-medium"
                        >
                          <option value="All">Modalidad: Todas</option>
                          <option value="Remoto">Remoto</option>
                          <option value="Híbrido">Híbrido</option>
                          <option value="Presencial">Presencial</option>
                        </select>
                      </div>

                      {/* Filter by Salario */}
                      <div>
                        <select
                          value={filterSalario}
                          onChange={(e) => setFilterSalario(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-950 font-medium"
                        >
                          <option value="All">Salario: Todos</option>
                          <option value="under1k">Menos de $1,000</option>
                          <option value="1k-3k">$1,000 a $3,000</option>
                          <option value="3k-5k">$3,000 a $5,000</option>
                          <option value="above5k">Más de $5,000</option>
                        </select>
                      </div>

                      {/* Filter by Estado */}
                      <div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-950 font-medium"
                        >
                          <option value="All">Estado: Todos</option>
                          <option value="Activo">Activo</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Con observaciones">Con observaciones</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table list */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-4 py-3.5">Colaborador / Documento</th>
                          <th className="px-4 py-3.5">Puesto & Proyecto</th>
                          <th className="px-4 py-3.5">País & Modalidad</th>
                          <th className="px-4 py-3.5">Salario Bruto</th>
                          <th className="px-4 py-3.5">Cargas Sociales</th>
                          <th className="px-4 py-3.5">Costo Total Talento</th>
                          <th className="px-4 py-3.5">Estado</th>
                          <th className="px-4 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredWorkers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-medium">
                              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="font-bold text-slate-700">No se encontraron colaboradores registrados con estos filtros.</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Pruebe ajustando los filtros o agregue un nuevo colaborador.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredWorkers.map((w) => {
                            const costInfo = w.detallesCostos || calcularCostoTalento(w.salario, w.pais, w.moneda, cliente?.feePorEmpleado || 150);
                            return (
                            <tr key={w.id} className="hover:bg-slate-50/70 transition-all">
                              <td className="px-4 py-3.5">
                                <div>
                                  <div className="font-bold text-slate-900">{w.nombre}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{w.correo}</div>
                                  {w.documentoIdentidad && (
                                    <span className="text-[9.5px] font-mono text-indigo-700 bg-indigo-50/60 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                      ID: {w.documentoIdentidad}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-slate-800">{w.puesto}</div>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Briefcase className="w-3 h-3 text-slate-400" />
                                  <span>{w.proyecto || cliente?.proyecto || 'General'}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1 font-semibold text-slate-800">
                                  <span>{COUNTRY_FLAGS[w.pais] || '🌎'}</span>
                                  <span>{w.pais || cliente?.pais}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] mt-1 inline-block ${
                                  (w.modalidadTrabajo || '').toLowerCase().includes('remoto')
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : (w.modalidadTrabajo || '').toLowerCase().includes('híbrido')
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {w.modalidadTrabajo || 'Remoto'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                                {w.salario.toLocaleString()} {w.moneda}
                              </td>
                              <td className="px-4 py-3.5 font-mono">
                                <span className="text-amber-700 font-bold">
                                  +${(w.cargasSocialesMonto || costInfo.cargasSocialesMonto || 0).toLocaleString()} {w.moneda}
                                </span>
                                <span className="block text-[9.5px] text-slate-400 font-sans">
                                  ({w.cargasSocialesPatronalesPct || costInfo.cargasSocialesPatronalesPct || 0}% patronal)
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono">
                                <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-block">
                                  ${(w.costoTotalTalento || (costInfo as any).costoTotal || (costInfo as any).costoTotalTalento || (w.salario * 1.3)).toLocaleString()} {w.moneda}
                                </span>
                                <span className="block text-[9.5px] text-slate-400 font-sans mt-0.5">
                                  Costo final / mes
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  w.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  w.estado === 'En revisión' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {w.estado}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cl = contratosLaborales.find(c => c.trabajadorId === w.id || c.trabajadorNombre === w.nombre) || contratosLaborales[0];
                                      if (cl) {
                                        downloadContractAsHtmlFile(
                                          cl.id,
                                          'CONTRATO INDIVIDUAL DE TRABAJO',
                                          cl.contenido || `CONTRATO INDIVIDUAL DE TRABAJO\n\nTrabajador: ${w.nombre}\nCargo: ${w.puesto}\nPaís: ${w.pais}\nSalario: $${w.salario} ${w.moneda}`,
                                          w.nombre,
                                          'Daniel Decan (Quick Hire)',
                                          cl.firmaTrabajador?.imagen
                                        );
                                      } else {
                                        downloadContractAsHtmlFile(
                                          `CTR-LAB-${w.id}`,
                                          'CONTRATO INDIVIDUAL DE TRABAJO',
                                          `CONTRATO INDIVIDUAL DE TRABAJO\n\nTrabajador: ${w.nombre}\nCargo: ${w.puesto}\nPaís: ${w.pais}\nSalario: $${w.salario} ${w.moneda}\nFecha Ingreso: ${w.fechaIngreso}`,
                                          w.nombre,
                                          'Daniel Decan (Quick Hire)'
                                        );
                                      }
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 hover:border-indigo-200 bg-white text-indigo-700 rounded-lg hover:bg-slate-50 transition-all text-[11px] font-bold cursor-pointer shadow-3xs"
                                    title="Descargar contrato del trabajador"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Contrato</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cl = contratosLaborales.find(c => c.trabajadorId === w.id || c.trabajadorNombre === w.nombre);
                                      if (cl) {
                                        handleOpenSingleEmailModal(cl);
                                      } else {
                                        // Create a transient contract representation to send via email
                                        handleOpenSingleEmailModal({
                                          id: `CTR-LAB-${w.id}`,
                                          clienteId: cliente.id,
                                          trabajadorId: w.id,
                                          trabajadorNombre: w.nombre,
                                          puesto: w.puesto,
                                          pais: w.pais || cliente.pais,
                                          salario: w.salario,
                                          moneda: w.moneda,
                                          modalidadTrabajo: w.modalidadTrabajo,
                                          fechaIngreso: w.fechaIngreso || new Date().toISOString().slice(0, 10),
                                          fechaGeneracion: new Date().toISOString(),
                                          estado: 'Generado',
                                          contenido: `CONTRATO INDIVIDUAL DE TRABAJO\n\nTrabajador: ${w.nombre}\nCargo: ${w.puesto}\nPaís: ${w.pais}\nSalario: $${w.salario} ${w.moneda}`
                                        });
                                      }
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 hover:border-indigo-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-[11px] font-bold cursor-pointer shadow-3xs"
                                    title={`Enviar contrato por correo a ${w.correo}`}
                                  >
                                    <Mail className="w-3 h-3 text-indigo-600" />
                                    <span>Enviar Correo</span>
                                  </button>

                                  <button
                                    onClick={() => setShowDetailModal(w)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 hover:border-indigo-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-[11px] font-bold cursor-pointer shadow-3xs"
                                  >
                                    <Eye className="w-3 h-3 text-slate-500" />
                                    <span>Ficha</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: CARGA MASIVA DE TRABAJADORES (CSV / TSV) */}
              {workerTab === 'carga-masiva' && (
                <div className="space-y-6">
                  {/* Template download & instructions info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-indigo-900/5 p-5 rounded-2xl border border-indigo-100">
                    <div className="md:col-span-8 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-800">
                        {tr('Estructura Requerida de la Plantilla', 'Required Template Structure', 'Estrutura Exigida do Modelo', lang)}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {tr(
                          'Las cabeceras del CSV/TSV deben coincidir exactamente con los parámetros del servicio país. Usa comas para separar los valores. Ej:',
                          'CSV/TSV headers must strictly match country service parameters. Use commas to separate values. Ex:',
                          'Os cabeçalhos do CSV/TSV devem coincidir exactamente com os parâmetros do serviço do país. Use vírgulas para separar os valores. Ex:',
                          lang
                        )} <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">Nombre,Correo,Puesto,FechaIngreso,Salario,Moneda,Modalidad</code>
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-md text-[10px]">
                          {tr('Nombre (Requerido)', 'Name (Required)', 'Nome (Obrigatório)', lang)}
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-md text-[10px]">
                          {tr('Correo (Requerido)', 'Email (Required)', 'E-mail (Obrigatório)', lang)}
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-md text-[10px]">
                          {tr('Puesto (Requerido)', 'Position (Required)', 'Cargo (Obrigatório)', lang)}
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-md text-[10px]">
                          {tr('Salario (Positivo)', 'Salary (Positive)', 'Salário (Positivo)', lang)}
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-md text-[10px]">
                          {tr('Moneda', 'Currency', 'Moeda', lang)} ({cliente.moneda})
                        </span>
                        <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-1 rounded-md text-[10px]">
                          {tr('Modalidad (Remoto)', 'Work Mode (Remote)', 'Modalidade (Remoto)', lang)}
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-4 flex flex-col justify-center items-center md:items-end gap-3">
                      <button 
                        onClick={loadDemoCsv}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>{tr('Cargar Datos Demo CSV', 'Load Demo CSV Data', 'Carregar Dados Demo CSV', lang)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={downloadPlantillaOficial}
                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                      >
                        Descargar Plantilla Oficial CSV
                      </button>
                    </div>
                  </div>

                  {/* Pasting area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {tr('Contenido del Archivo CSV / TSV', 'CSV / TSV File Content', 'Conteúdo do Arquivo CSV / TSV', lang)}
                    </label>
                    <textarea
                      rows={8}
                      value={rawCsvText}
                      onChange={(e) => setRawCsvText(e.target.value)}
                      placeholder={tr('Pega las líneas del archivo CSV aquí...', 'Paste CSV file lines here...', 'Cole as linhas do arquivo CSV aqui...', lang)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950 resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleValidateCsv}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      {tr('Validar Formato', 'Validate Format', 'Validar Formato', lang)}
                    </button>
                  </div>

                  {bulkError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                      {bulkError}
                    </div>
                  )}

                  {bulkSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
                      {bulkSuccess}
                    </div>
                  )}

                  {/* Live Preview of CSV items */}
                  {bulkPreview && (
                    <div className="space-y-4 border-t border-slate-100 pt-6">
                      <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">
                        {tr('Resultado del Análisis de Plantilla', 'Template Analysis Results', 'Resultado da Análise do Modelo', lang)}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold uppercase tracking-wider">
                        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex items-center justify-between">
                          <span>{bulkT.validRecords}:</span>
                          <span className="text-lg font-black">{bulkPreview.valid.length}</span>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl flex items-center justify-between">
                          <span>{bulkT.obsRecords}:</span>
                          <span className="text-lg font-black">{bulkPreview.observaciones.length}</span>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl flex items-center justify-between">
                          <span>{bulkT.errorRecords}:</span>
                          <span className="text-lg font-black">{bulkPreview.errores.length}</span>
                        </div>
                      </div>

                      {/* Errors log */}
                      {bulkPreview.errores.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 space-y-2">
                          <div className="font-bold flex items-center space-x-1.5">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>{bulkT.errorRecords} ({bulkPreview.errores.length})</span>
                          </div>
                          <div className="divide-y divide-rose-100/50">
                            {bulkPreview.errores.map((err, idx) => (
                              <div key={idx} className="py-1.5 flex justify-between">
                                <span>{tr('Fila', 'Row', 'Linha', lang)} {err.fila} - <strong className="font-bold text-rose-950">{err.campo}</strong>: {err.error}</span>
                                <span className="font-mono text-[10px] text-slate-500">[{err.valorOriginal}]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observation Warnings */}
                      {bulkPreview.observaciones.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-2">
                          <div className="font-bold flex items-center space-x-1.5">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{bulkT.obsRecords} ({bulkPreview.observaciones.length})</span>
                          </div>
                          <div className="divide-y divide-amber-100/50">
                            {bulkPreview.observaciones.map((obs, idx) => (
                              <div key={idx} className="py-1.5 flex justify-between">
                                <span>{tr('Fila', 'Row', 'Linha', lang)} {obs.fila} - <strong className="font-bold text-amber-950">{obs.Nombre}</strong>: {obs.observaciones}</span>
                                <span className="font-mono text-[10px] text-slate-500">[{obs.Modalidad} - {obs.Moneda}]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Success Processing Button */}
                      {(bulkPreview.valid.length > 0 || bulkPreview.observaciones.length > 0) && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleProcessBulk}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{bulkT.processBtn} ({bulkPreview.valid.length + bulkPreview.observaciones.length})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload History list */}
                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      {bulkT.historyTitle}
                    </h3>
                    {historialCargas.length === 0 ? (
                      <p className="text-xs text-slate-500">{tr('No hay registros de cargas masivas previas.', 'No previous bulk upload records.', 'Não há registros de envios em massa anteriores.', lang)}</p>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 text-xs">
                        {historialCargas.map((hc) => (
                          <div key={hc.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">{hc.archivoNombre}</span>
                                <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{hc.id}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-[10px] text-slate-400 font-semibold">
                                <span>{new Date(hc.fecha).toLocaleString()}</span>
                                <span>• {tr('Por', 'By', 'Por', lang)}: {hc.usuarioResponsable || hc.usuarioCreador || 'Cliente'}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                                {hc.registrosProcesados || hc.registrosValidos} {tr('procesados', 'processed', 'processados', lang)}
                              </span>
                              {((hc.errores || 0) > 0) && (
                                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold">
                                  {hc.errores} {tr('errores', 'errors', 'erros', lang)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: PLANTILLA OFICIAL DE CARGA */}
              {workerTab === 'plantilla' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-indigo-950">Plantilla Oficial de Carga Masiva (CSV)</h3>
                        <p className="text-xs text-indigo-700">Utilice esta plantilla estándar para registrar rápidamente múltiples trabajadores en su nómina.</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-indigo-100 space-y-3 text-xs">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Columnas y Reglas del Archivo</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 text-[10px] uppercase">
                            <tr>
                              <th className="p-2.5">Columna</th>
                              <th className="p-2.5">Tipo</th>
                              <th className="p-2.5">Obligatorio</th>
                              <th className="p-2.5">Ejemplo</th>
                              <th className="p-2.5">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">Nombre</td>
                              <td className="p-2.5">Texto</td>
                              <td className="p-2.5"><span className="text-rose-600 font-bold">Sí</span></td>
                              <td className="p-2.5 font-mono">Carlos Andrés Mendoza</td>
                              <td className="p-2.5">Nombre y apellido completo del colaborador.</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">Correo</td>
                              <td className="p-2.5">Email</td>
                              <td className="p-2.5"><span className="text-rose-600 font-bold">Sí</span></td>
                              <td className="p-2.5 font-mono">carlos.mendoza@empresa.com</td>
                              <td className="p-2.5">Correo electrónico donde recibirá contratos y notificaciones.</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">Puesto</td>
                              <td className="p-2.5">Texto</td>
                              <td className="p-2.5"><span className="text-rose-600 font-bold">Sí</span></td>
                              <td className="p-2.5 font-mono">Senior Backend Engineer</td>
                              <td className="p-2.5">Cargo u ocupación contractual.</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">FechaIngreso</td>
                              <td className="p-2.5">Fecha (YYYY-MM-DD)</td>
                              <td className="p-2.5"><span className="text-slate-500">Opcional</span></td>
                              <td className="p-2.5 font-mono">2025-03-01</td>
                              <td className="p-2.5">Fecha prevista de inicio de labores.</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">Salario</td>
                              <td className="p-2.5">Número</td>
                              <td className="p-2.5"><span className="text-rose-600 font-bold">Sí</span></td>
                              <td className="p-2.5 font-mono">3500</td>
                              <td className="p-2.5">Monto mensual bruto pactado.</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">Moneda</td>
                              <td className="p-2.5">Texto (3 letras)</td>
                              <td className="p-2.5"><span className="text-slate-500">Opcional</span></td>
                              <td className="p-2.5 font-mono">{cliente.moneda || 'USD'}</td>
                              <td className="p-2.5">Moneda del salario.</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">Modalidad</td>
                              <td className="p-2.5">Texto</td>
                              <td className="p-2.5"><span className="text-slate-500">Opcional</span></td>
                              <td className="p-2.5 font-mono">Remoto</td>
                              <td className="p-2.5">Remoto, Híbrido o Presencial.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={downloadPlantillaOficial}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Plantilla Oficial (.CSV)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FACTURAS Y PAGOS */}
          {activeTab === 'billing' && cliente && (
            <div id="tab-billing-panel" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{billingT.title}</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{billingT.subtitle}</p>
                </div>

                <button
                  onClick={() => {
                    const targetFac = facturas.find(f => f.saldoPendiente > 0 || f.estado !== 'Pagada') || facturas[0];
                    if (targetFac) {
                      setShowSoporteModal(targetFac);
                      setSoporteError('');
                    } else {
                      alert(tr('No hay facturas registradas para cargar soporte.', 'No invoices registered to upload proof.', 'Não há faturas registradas para enviar comprovante.', lang));
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-md transition-all cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{tText('Subir Comprobante / Soporte de Pago', lang)}</span>
                </button>
              </div>

              {facturas.some(f => f.saldoPendiente > 0 || f.estado !== 'Pagada') && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-xl font-bold shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase">{tText('Factura Pendiente de Pago Registrada', lang)}</h4>
                      <p className="text-[11px] text-amber-800">{tr('Cargue el comprobante de transferencia bancaria para validar su pago y activar el servicio EOR.', 'Upload your bank transfer proof to validate payment and activate EOR service.', 'Envie o comprovante de transferência bancária para validar seu pagamento e ativar o serviço EOR.', lang)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const targetFac = facturas.find(f => f.saldoPendiente > 0 || f.estado !== 'Pagada') || facturas[0];
                      if (targetFac) {
                        setShowSoporteModal(targetFac);
                        setSoporteError('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{tText('Subir Soporte Ahora', lang)}</span>
                  </button>
                </div>
              )}

              {/* List invoices */}
              {facturas.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {tr('No hay facturas registradas para tu empresa en el sistema.', 'No registered invoices found for your company.', 'Não há faturas registradas para sua empresa no sistema.', lang)}
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">{billingT.invoiceId}</th>
                        <th className="px-4 py-3">{billingT.period}</th>
                        <th className="px-4 py-3">{billingT.quantity}</th>
                        <th className="px-4 py-3">{billingT.total}</th>
                        <th className="px-4 py-3">{billingT.pending}</th>
                        <th className="px-4 py-3">{billingT.status}</th>
                        <th className="px-4 py-3 text-right">{billingT.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {facturas.map((fac) => (
                        <tr key={fac.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-4 py-4 font-mono font-bold text-indigo-600">{fac.id}</td>
                          <td className="px-4 py-4 font-medium text-slate-700">{fac.periodo}</td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{fac.cantidadTrabajadores}</td>
                          <td className="px-4 py-4 font-mono font-bold text-slate-900">
                            {fac.totalFacturado.toLocaleString()} {fac.moneda}
                          </td>
                          <td className="px-4 py-4 font-mono font-bold text-rose-600">
                            {fac.saldoPendiente.toLocaleString()} {fac.moneda}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              fac.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              fac.estado === 'Enviada' || fac.estado === 'Emitida' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {translateStatus(fac.estado, lang)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right space-x-1.5">
                            <button
                              onClick={() => setShowInvoiceDetail(fac)}
                              className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all border border-slate-200 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>{tText('Ver Detalle', lang)}</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowSoporteModal(fac);
                                setSoporteError('');
                              }}
                              className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>{tText('Subir Soporte', lang)}</span>
                            </button>
                            {fac.saldoPendiente > 0 && (
                              <button
                                onClick={() => setShowPaymentModal(fac)}
                                className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>{billingT.recordPaymentBtn}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SECCIÓN: PAGOS DE CONTADO USD (ACTIVACIÓN DE SERVICIOS) */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-sans">{tText('Pagos de Contado USD (Activación de Servicio)', lang)}</h3>
                    <p className="text-xs text-slate-500">{tr('Módulo de activación inicial para la liberación de servicios EOR y contratos locales.', 'Initial activation module for releasing EOR services and local contracts.', 'Módulo de ativação inicial para liberação de serviços EOR e contratos locais.', lang)}</p>
                  </div>
                </div>

                {pagosContado.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 text-xs border border-slate-100">
                    {tr('No tienes solicitudes de pago de contado pendientes de activación en el sistema. Éstas se generan automáticamente al firmar tu Contrato Comercial.', 'No cash payment requests pending activation found. These are generated automatically upon signing your Commercial Contract.', 'Você não possui solicitações de pagamento à vista pendentes de ativação no sistema. Elas são geradas automaticamente ao assinar seu Contrato Comercial.', lang)}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="px-4 py-3">{tText('ID Pago', lang)}</th>
                          <th className="px-4 py-3">{tText('Concepto/Servicio', lang)}</th>
                          <th className="px-4 py-3">{tText('Tipo Cambio (Histórico)', lang)}</th>
                          <th className="px-4 py-3">{tText('Monto Total USD', lang)}</th>
                          <th className="px-4 py-3">{tText('Estado', lang)}</th>
                          <th className="px-4 py-3 text-right">{tText('Acción', lang)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagosContado.map((pago) => (
                          <tr key={pago.id} className="hover:bg-slate-50 transition-all">
                            <td className="px-4 py-4 font-mono font-bold text-slate-900">{pago.id}</td>
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-800">{pago.concepto}</div>
                              <div className="text-[10px] text-slate-400">{tr('Servicio:', 'Service:', 'Serviço:', lang)} {pago.servicio} | {tr('País:', 'Country:', 'País:', lang)} {pago.pais}</div>
                            </td>
                            <td className="px-4 py-4 font-mono">
                              {pago.monedaLocal ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-700">1 USD = {pago.tipoCambio} {pago.monedaLocal}</div>
                                  <div className="text-[9px] text-slate-400">{tr('Tipo Cambio BC - 5% (Fijado)', 'Central Bank FX Rate - 5% (Locked)', 'Taxa de Câmbio BC - 5% (Fixada)', lang)}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">{tr('No aplica (USD nativo)', 'Not applicable (Native USD)', 'Não se aplica (USD nativo)', lang)}</span>
                              )}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-indigo-700 text-sm">
                              ${pago.montoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                pago.estado === 'Validado' || pago.estado === 'Aplicado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                pago.estado === 'Soporte cargado' || pago.estado === 'En revisión' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                                pago.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {pago.estado === 'Validado' ? tr('Validado (Liberado)', 'Validated (Released)', 'Validado (Liberado)', lang) : translateStatus(pago.estado, lang)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {(pago.estado === 'Pendiente' || pago.estado === 'Rechazado') ? (
                                <button
                                  onClick={() => {
                                    setShowSoporteModal(pago);
                                    setSoporteMetodo('Transferencia Bancaria');
                                    setSoporteFecha(new Date().toISOString().split('T')[0]);
                                    setSoporteArchivo('');
                                    setSoporteArchivoNombre('');
                                    setSoporteError('');
                                  }}
                                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>{tText('Subir Soporte', lang)}</span>
                                </button>
                              ) : pago.archivoSoporte ? (
                                <button
                                  onClick={() => {
                                    const win = window.open();
                                    if (win) {
                                      const iframe = win.document.createElement('iframe');
                                      iframe.src = pago.archivoSoporte || '';
                                      iframe.style.width = '100%';
                                      iframe.style.height = '100%';
                                      iframe.style.border = '0';
                                      win.document.body.style.margin = '0';
                                      win.document.body.appendChild(iframe);
                                    } else {
                                      alert(tr('Por favor habilite las ventanas emergentes para ver el soporte.', 'Please enable popup windows to view the proof document.', 'Por favor, habilite janelas pop-up para ver o comprovante.', lang));
                                    }
                                  }}
                                  className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-500 font-bold text-xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{tText('Ver Soporte', lang)}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">{tr('Sin soporte', 'No proof', 'Sem comprovante', lang)}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SOPORTE Y TICKETS */}
          {activeTab === 'tickets' && (
            <div id="tab-tickets-panel" className="space-y-6 lg:col-span-9 animate-fade-in">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <BadgeHelp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-sans">{tText('Soporte y Tickets', lang)}</h2>
                    <p className="text-xs text-slate-500 font-sans">{tr('Consulta el estado de tus solicitudes de soporte o inicia un nuevo ticket de ayuda.', 'Check the status of your support requests or create a new support ticket.', 'Consulte o status de suas solicitações de suporte ou abra um novo chamado de ajuda.', lang)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTicketAsunto('');
                    setTicketDescripcion('');
                    setTicketCategoria('Soporte General');
                    setTicketPrioridad('Media');
                    setShowCreateTicket(true);
                  }}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{tText('Abrir Ticket de Soporte', lang)}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tickets list */}
                <div className={`bg-white rounded-3xl border border-slate-100 p-6 space-y-4 ${activeTicket ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{tText('Historial de Tickets de Soporte', lang)}</h3>
                      <p className="text-[10px] text-slate-400">{tr('Selecciona un ticket para ver los comentarios, respuestas de tu asesor y enviar réplicas.', 'Select a ticket to view comments, responses from your advisor, and send replies.', 'Selecione um chamado para ver os comentários, respostas do seu consultor e enviar réplicas.', lang)}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{tickets.length} {tr('tickets registrados', 'tickets registered', 'chamados registrados', lang)}</span>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <BadgeHelp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500">{tr('No tienes ningún ticket de soporte registrado.', 'You do not have any registered support tickets.', 'Você não possui nenhum chamado de suporte registrado.', lang)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tr('Si necesitas ayuda con tu nómina, contratos o cargas sociales, abre un ticket.', 'If you need help with payroll, contracts, or social charges, open a ticket.', 'Se precisar de ajuda com sua folha, contratos ou encargos sociais, abra um chamado.', lang)}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                            <th className="p-3.5">Ticket ID / Categoría</th>
                            <th className="p-3.5">{tr('Asunto', 'Subject', 'Assunto', lang)}</th>
                            <th className="p-3.5">Prioridad</th>
                            <th className="p-3.5">{tText('Fecha', lang)}</th>
                            <th className="p-3.5">{tText('Estado', lang)}</th>
                            <th className="p-3.5 text-right">{tText('Acción', lang)}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tickets.map((tk) => {
                            const isSelected = activeTicket?.id === tk.id;
                            const priority = tk.prioridad || 'Media';
                            const category = tk.categoria || 'Soporte General';

                            return (
                              <tr key={tk.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50/55'}`}>
                                <td className="p-3.5">
                                  <span className="font-bold text-indigo-900 font-mono text-[11px] block">{tk.id}</span>
                                  <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                                    {category}
                                  </span>
                                </td>
                                <td className="p-3.5 font-bold text-slate-800 max-w-xs truncate">{tk.asunto}</td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    priority === 'Crítica' ? 'bg-rose-100 text-rose-700' :
                                    priority === 'Alta' ? 'bg-amber-100 text-amber-700' :
                                    priority === 'Media' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {priority}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-400 font-mono text-[11px]">{new Date(tk.fechaCreacion).toLocaleDateString()}</td>
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    tk.estado === 'Nuevo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                    tk.estado === 'Respondido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    tk.estado === 'En revisión' || tk.estado === 'En Proceso' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    tk.estado === 'Resuelto' || tk.estado === 'Cerrado' ? 'bg-slate-100 text-slate-600' :
                                    'bg-purple-50 text-purple-700'
                                  }`}>
                                    {translateStatus(tk.estado, lang)}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => {
                                      setActiveTicket(tk);
                                      setTicketReply('');
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border shadow-3xs cursor-pointer ${
                                      isSelected 
                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                        : 'bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-200/50'
                                    }`}
                                  >
                                    {tr('Ver Detalle / Respuestas', 'View Details / Replies', 'Ver Detalhes / Respostas', lang)}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Ticket detailed history and reply thread */}
                {activeTicket && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 xl:col-span-1 h-fit shadow-3xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{activeTicket.id}</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{activeTicket.categoria || 'Soporte General'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            activeTicket.prioridad === 'Crítica' ? 'bg-rose-100 text-rose-700' :
                            activeTicket.prioridad === 'Alta' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {activeTicket.prioridad || 'Media'}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{activeTicket.asunto}</h3>
                        <p className="text-[9px] text-slate-400 mt-0.5">{tText('Estado:', lang)} <strong className="text-indigo-600 font-bold uppercase">{translateStatus(activeTicket.estado, lang)}</strong></p>
                        {activeTicket.asesorAsignado && (
                          <p className="text-[9px] text-slate-400 mt-0.5">Asesor: <strong className="text-slate-700 font-semibold">{activeTicket.asesorAsignado}</strong></p>
                        )}
                      </div>
                      <button
                        onClick={() => setActiveTicket(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none p-1 cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Dialogue thread log */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-72 overflow-y-auto space-y-3 font-sans">
                        {/* Initial Description */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                            <span className="font-bold text-slate-600">Descripción Inicial</span>
                            <span>{new Date(activeTicket.fechaCreacion).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed font-semibold bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                            {activeTicket.descripcion.split('\n\n[Respuesta')[0]}
                          </p>
                        </div>

                        {/* Structured comments (filtering out internal notes for client view) */}
                        {activeTicket.comentarios && activeTicket.comentarios.filter((c: any) => !c.esInterno).length > 0 ? (
                          <div className="space-y-2.5 border-t border-slate-200/60 pt-2.5">
                            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Historial de Conversación:</div>
                            {activeTicket.comentarios
                              .filter((c: any) => !c.esInterno)
                              .map((c: any) => {
                                const isStaff = c.autorRol === 'administrador' || c.autorRol === 'asesor_comercial' || c.autorRol === 'admin';
                                return (
                                  <div 
                                    key={c.id} 
                                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                                      isStaff 
                                        ? 'bg-indigo-50/70 border-indigo-100 text-indigo-950 shadow-3xs' 
                                        : 'bg-white border-slate-200/80 text-slate-800'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center text-[9px]">
                                      <div className="flex items-center gap-1.5">
                                        <strong className="font-bold">{c.autor}</strong>
                                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                          isStaff ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-200 text-slate-800'
                                        }`}>
                                          {isStaff ? 'Asesor / EOR Support' : 'Tú'}
                                        </span>
                                      </div>
                                      <span className="text-slate-400 font-mono">{new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[10.5px] leading-relaxed font-semibold whitespace-pre-wrap">{c.mensaje}</p>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          /* Legacy format fallback */
                          activeTicket.descripcion.includes('\n\n[Respuesta') && (
                            <div className="space-y-3 border-t border-slate-100 pt-3">
                              <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Historial de Conversación:</div>
                              {activeTicket.descripcion.split('\n\n[Respuesta').slice(1).map((resp: string, i: number) => {
                                const cleaned = '[Respuesta' + resp;
                                const header = cleaned.split(']:')[0] + ']';
                                const msg = cleaned.split(']:')[1] || '';
                                const isAdminOrAdvisor = header.toLowerCase().includes('admin') || header.toLowerCase().includes('asesor') || header.toLowerCase().includes('global');
                                return (
                                  <div key={i} className={`p-2.5 rounded-xl border ${isAdminOrAdvisor ? 'bg-indigo-50/50 border-indigo-100/70 text-indigo-950' : 'bg-slate-100/60 border-slate-200/50 text-slate-800'}`}>
                                    <span className="block text-[8px] font-mono text-slate-400 font-bold mb-1">{header.replace('[', '').replace(']', '')}</span>
                                    <p className="text-[10px] leading-relaxed font-bold">{msg.trim()}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )
                        )}
                      </div>

                      {/* Customer Satisfaction Rating for Resolved / Closed tickets */}
                      {(activeTicket.estado === 'Resuelto' || activeTicket.estado === 'Cerrado') && (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950 text-[10px] uppercase tracking-wider">Calificación de la Atención</span>
                            <div className="flex gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  disabled={!!activeTicket.calificacion}
                                  onClick={() => setTicketRating(star)}
                                  className={`cursor-pointer ${!activeTicket.calificacion ? 'hover:scale-110' : 'cursor-default'} transition-transform`}
                                >
                                  <Star
                                    className={`w-4 h-4 ${star <= (activeTicket.calificacion || ticketRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {activeTicket.calificacion ? (
                            <p className="text-[10.5px] text-amber-900 font-medium">
                              Gracias por tu calificación de <strong>{activeTicket.calificacion}/5 estrellas</strong>.
                              {activeTicket.comentarioCalificacion && <span className="block italic mt-0.5">"{activeTicket.comentarioCalificacion}"</span>}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Comentario opcional sobre la atención recibida..."
                                value={ticketRatingComment}
                                onChange={(e) => setTicketRatingComment(e.target.value)}
                                className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-amber-950 outline-none"
                              />
                              <button
                                type="button"
                                disabled={submittingRating}
                                onClick={async () => {
                                  setSubmittingRating(true);
                                  try {
                                    const updated = await api.calificarTicket(activeTicket.id, {
                                      calificacion: ticketRating,
                                      comentarioCalificacion: ticketRatingComment,
                                      usuario: user.nombre || user.correo
                                    });
                                    setActiveTicket(updated);
                                    const ticketsList = await api.getTickets().catch(() => []);
                                    setTickets(filterByActiveClient(ticketsList));
                                    alert('¡Muchas gracias por calificar nuestro servicio!');
                                  } catch (err: any) {
                                    alert(err.message || 'Error al calificar ticket');
                                  } finally {
                                    setSubmittingRating(false);
                                  }
                                }}
                                className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-3xs cursor-pointer"
                              >
                                {submittingRating ? 'Guardando...' : 'Enviar Calificación'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reply form */}
                      {activeTicket.estado !== 'Cerrado' && activeTicket.estado !== 'Resuelto' ? (
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!ticketReply.trim()) return;
                          setSubmittingReply(true);
                          try {
                            const updated = await api.responderTicket(activeTicket.id, {
                              usuario: user.nombre,
                              autorEmail: user.correo,
                              rol: user.rol || 'cliente',
                              mensaje: ticketReply
                            });
                            setActiveTicket(updated);
                            setTicketReply('');
                            // Refresh main list
                            const ticketsList = await api.getTickets().catch(() => []);
                            setTickets(filterByActiveClient(ticketsList));
                          } catch (err) {
                            alert('No se pudo enviar la respuesta');
                          } finally {
                            setSubmittingReply(false);
                          }
                        }} className="space-y-2">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Escribir Respuesta</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Añada detalles o responda a los asesores..."
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-semibold text-slate-900 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={submittingReply}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                          >
                            <span>{submittingReply ? 'Enviando...' : 'Enviar Mensaje'}</span>
                          </button>
                        </form>
                      ) : (
                        <div className="p-3 bg-slate-100 text-center rounded-xl text-[10px] text-slate-500 font-bold border border-slate-200/50">
                          Este ticket está {activeTicket.estado.toLowerCase()} y no admite más comentarios.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CONTRATOS Y ACUERDOS */}
          {activeTab === 'contratos' && (
            <div id="tab-contratos-panel" className="space-y-6 lg:col-span-9 animate-fade-in">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-sans">
                      {contratoTab === 'laborales' ? 'Contratos Laborales de Colaboradores' : contratoTab === 'comerciales' ? 'Contrato Comercial EOR' : 'Adendums y Anexos'}
                    </h2>
                    <p className="text-xs text-slate-500 font-sans">
                      {contratoTab === 'laborales'
                        ? 'Gestione, descargue, envíe por correo o cargue los contratos laborales individuales de sus colaboradores.'
                        : contratoTab === 'comerciales' 
                        ? 'Acuerdo bilateral marco de servicios Employer of Record celebrado entre su empresa y Quick Hire LATAM.'
                        : 'Revise, firme y controle adendums y anexos modificatorios asociados a sus acuerdos vigentes.'}
                    </p>
                  </div>
                </div>

                {/* Sub-tabs selector */}
                <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setContratoTab('laborales')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                      contratoTab === 'laborales' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-indigo-950'
                    }`}
                  >
                    <span>Laborales</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                      {effectiveLaborContracts.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContratoTab('comerciales')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                      contratoTab === 'comerciales' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-indigo-950'
                    }`}
                  >
                    <span>Comercial EOR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContratoTab('adendums')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                      contratoTab === 'adendums' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-indigo-950'
                    }`}
                  >
                    <span>Adendums</span>
                  </button>
                </div>
              </div>

              {/* Main List */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                {contratoTab === 'comerciales' ? (
                  <>
                    <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Acuerdos y Contratos de Servicio</h3>
                        <p className="text-[10px] text-slate-400">Verifique el estado legal de su relación contractual con Quick Hire. Debe contar con el contrato comercial firmado y pago validado para activar la contratación.</p>
                      </div>

                      {/* Quick Action Buttons for Commercial Contracts */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  try {
                                    const base64Data = event.target?.result as string;
                                    const targetCc = contratosComerciales[0];
                                    if (targetCc) {
                                      await api.updateContratoComercial(targetCc.id, {
                                        estado: 'Firmado por cliente',
                                        archivoFirmado: base64Data,
                                        firmaCliente: {
                                          nombre: `${user.nombre || 'Cliente'} (Firma Escaneada Cargada)`,
                                          fecha: new Date().toISOString(),
                                          ip: 'Cargado Offline'
                                        }
                                      });
                                    } else {
                                      await api.createContratoComercial({
                                        clienteId: cliente?.id || user.clienteId || '',
                                        clienteNombre: cliente?.empresa || user.nombre || 'Empresa Cliente',
                                        pais: cliente?.pais || 'Colombia',
                                        servicioContratado: 'Employer of Record (EOR)',
                                        moneda: 'USD',
                                        feePorEmpleado: 200,
                                        usuarioCreador: user.correo,
                                        representanteProveedor: 'Daniel Decan',
                                        representanteCliente: user.nombre || 'Representante Legal',
                                        estado: 'Firmado por cliente',
                                        archivoFirmado: base64Data,
                                        contenido: `CONTRATO MARCO COMERCIAL DE SERVICIOS EMPLOYER OF RECORD (EOR)\n\nEntre Quick Hire LATAM LLC y ${cliente?.empresa || 'Cliente'}.\n\nContrato comercial firmado y cargado por el cliente.`,
                                        firmaCliente: {
                                          nombre: `${user.nombre || 'Cliente'} (Firma Escaneada Cargada)`,
                                          fecha: new Date().toISOString(),
                                          ip: 'Cargado Offline'
                                        }
                                      });
                                    }
                                    const contractsList = await api.getContratosComerciales().catch(() => []);
                                    setContratosComerciales(filterByActiveClient(contractsList));
                                    alert('¡Contrato comercial firmado cargado correctamente!');
                                  } catch (err: any) {
                                    alert(`Error al guardar archivo firmado: ${err.message}`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Contrato Firmado</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const pending = contratosComerciales.find(cc => !cc.firmadoPorCliente) || contratosComerciales[0];
                            if (pending) {
                              setSelectedContrato(pending);
                              setFirmanteNombre(pending.representanteCliente || cliente?.nombreContacto || user.nombre || '');
                              setFirmanteCargo('Representante Legal');
                              setFirmaAceptada(false);
                              setFirmaImagenUploaded('');
                            } else {
                              alert("No hay contratos comerciales pendientes.");
                            }
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          <span>Insertar / Agregar Firma</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const targetCc = contratosComerciales[0];
                            if (targetCc) {
                              downloadContractAsHtmlFile(
                                targetCc.id,
                                'CONTRATO MARCO COMERCIAL DE SERVICIOS EOR',
                                targetCc.contenido || '',
                                targetCc.clienteNombre || 'Cliente',
                                targetCc.representanteProveedor || 'Daniel Decan',
                                targetCc.firmaCliente?.imagen
                              );
                            } else {
                              alert("No hay contratos para descargar.");
                            }
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Contrato</span>
                        </button>
                      </div>
                    </div>

                    {contratosComerciales.some(cc => !cc.firmadoPorCliente) && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl font-bold shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Acción Requerida: Firma de Contrato Comercial</h4>
                            <p className="text-[11px] text-amber-800">Tiene un contrato comercial de servicios pendiente de revisión y firma digital.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const pending = contratosComerciales.find(cc => !cc.firmadoPorCliente) || contratosComerciales[0];
                            if (pending) {
                              setSelectedContrato(pending);
                              setFirmanteNombre(pending.representanteCliente || cliente?.nombreContacto || user.nombre || '');
                              setFirmanteCargo('');
                              setFirmaAceptada(false);
                            }
                          }}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center space-x-2 cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Ver y Firmar Contrato Ahora</span>
                        </button>
                      </div>
                    )}

                {contratosComerciales.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">No se encontraron contratos comerciales registrados para su empresa.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Su asesor asignado le enviará el acuerdo comercial para su revisión y firma. Si ya lo tiene firmado en físico o digital, puede subirlo directamente con el botón superior.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                          <th className="p-4">Contrato ID</th>
                          <th className="p-4">Servicio</th>
                          <th className="p-4">F. Generación</th>
                          <th className="p-4">Representante Legal</th>
                          <th className="p-4">Tarifa / Fee</th>
                          <th className="p-4">Estado Legal</th>
                          <th className="p-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {contratosComerciales.map((cc) => {
                          const isPendingSignature = !cc.firmadoPorCliente || ['Enviado', 'Enviado al cliente', 'Visto por cliente', 'Pendiente de firma del cliente', 'Con observaciones', 'Pendiente de firma', 'En revisión interna'].includes(cc.estado);
                          return (
                            <tr key={cc.id} className="hover:bg-slate-50/55 transition-colors font-sans">
                              <td className="p-4 font-mono font-bold text-indigo-950">{cc.id}</td>
                              <td className="p-4 font-bold text-slate-800">{cc.servicioContratado} <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 ml-1 font-normal">{cc.pais}</span></td>
                              <td className="p-4 text-slate-400 font-mono">{new Date(cc.fechaGeneracion).toLocaleDateString()}</td>
                              <td className="p-4 font-semibold text-slate-600">{cc.representanteCliente || 'Pendiente'}</td>
                              <td className="p-4 font-mono font-bold text-indigo-900">{cc.feePorEmpleado?.toLocaleString()} {cc.moneda}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  cc.estado === 'Servicio liberado' || cc.estado === 'Pagado' || cc.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  cc.estado === 'Con observaciones' || cc.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  isPendingSignature ? 'bg-amber-50 text-amber-700 border border-amber-200 font-black animate-pulse' :
                                  'bg-slate-50 text-slate-600 border border-slate-200'
                                }`}>
                                  {cc.estado}
                                </span>
                              </td>
                               <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => downloadContractAsHtmlFile(
                                      cc.id,
                                      'CONTRATO MARCO COMERCIAL DE SERVICIOS EOR',
                                      cc.contenido || '',
                                      cc.clienteNombre || 'Cliente',
                                      cc.representanteProveedor || 'Daniel Decan'
                                    )}
                                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                                    title="Descargar Contrato"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Descargar Contrato</span>
                                  </button>

                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = async (event) => {
                                            try {
                                              const base64Data = event.target?.result as string;
                                              const updated = await api.updateContratoComercial(cc.id, {
                                                estado: 'Firmado por cliente',
                                                archivoFirmado: base64Data,
                                                firmaCliente: {
                                                  nombre: `${user.nombre || 'Cliente'} (Firma Escaneada Cargada)`,
                                                  fecha: new Date().toISOString(),
                                                  ip: 'Cargado Offline'
                                                }
                                              });
                                              const contractsList = await api.getContratosComerciales().catch(() => []);
                                              setContratosComerciales(filterByActiveClient(contractsList));
                                              alert('¡Contrato comercial firmado cargado correctamente!');
                                            } catch (err: any) {
                                              alert(`Error al guardar archivo firmado: ${err.message}`);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <button
                                      type="button"
                                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
                                      title="Cargar o Subir Contrato Firmado"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>Subir Firmado</span>
                                    </button>
                                  </div>

                                  <button
                                    onClick={async () => {
                                      setSelectedContrato(cc);
                                      setFirmanteNombre(cc.representanteCliente || '');
                                      setFirmanteCargo('');
                                      setFirmaAceptada(false);
                                      setComentariosRechazo('');
                                      setShowRejectModal(false);

                                      // Auto-mark as viewed if received
                                      if (cc.estado === 'Enviado al cliente' || cc.estado === 'Pendiente de firma del cliente') {
                                        try {
                                          const updated = await api.updateContratoComercial(cc.id, { estado: 'Visto por cliente' });
                                          setSelectedContrato(updated);
                                          // Refresh main list
                                          const contractsList = await api.getContratosComerciales().catch(() => []);
                                          setContratosComerciales(filterByActiveClient(contractsList));
                                        } catch (err) {
                                          console.error('Error transitioning to Visto por cliente', err);
                                        }
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
                                      isPendingSignature 
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-600 shadow-sm' 
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isPendingSignature ? 'Ver y Firmar' : 'Ver Detalles'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : contratoTab === 'laborales' ? (
              <>
                <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Listado de Colaboradores y Contratos Laborales</h3>
                    <p className="text-[10px] text-slate-400 font-sans">Administre, descargue individual o masivamente, envíe por correo o cargue los contratos de sus colaboradores.</p>
                  </div>

                  {/* Batch Selection & Multi-Download & Mass Email Actions */}
                  {effectiveLaborContracts.length > 0 && cliente?.estadoServicio !== 'Inactivo' && cliente?.estadoServicio !== 'Bloqueado' && (
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedLaboralIds.length === effectiveLaborContracts.length) {
                            setSelectedLaboralIds([]);
                          } else {
                            setSelectedLaboralIds(effectiveLaborContracts.map(cl => cl.id));
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{selectedLaboralIds.length === effectiveLaborContracts.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenMassEmailModal}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-200 cursor-pointer shadow-3xs"
                        title="Enviar contratos seleccionados o todos por correo electrónico a sus respectivos colaboradores"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {selectedLaboralIds.length > 0
                            ? `Enviar por Correo Masivo (${selectedLaboralIds.length})`
                            : `Enviar por Correo Masivo (${effectiveLaborContracts.length})`}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const targets = selectedLaboralIds.length > 0 
                            ? effectiveLaborContracts.filter(cl => selectedLaboralIds.includes(cl.id))
                            : effectiveLaborContracts;
                          if (targets.length === 0) {
                            alert("Seleccione al menos un contrato laboral para descargar.");
                            return;
                          }
                          targets.forEach((cl, index) => {
                            setTimeout(() => {
                              downloadContractAsHtmlFile(
                                cl.id,
                                'CONTRATO INDIVIDUAL DE TRABAJO LOCAL',
                                getLaboralContractContent(cl),
                                cl.trabajadorNombre || 'Trabajador',
                                'Daniel Decan',
                                cl.firmaTrabajador?.imagen || cl.firmaRepresentante?.imagen
                              );
                            }, index * 300);
                          });
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {selectedLaboralIds.length > 0 
                            ? `Descargar Seleccionados (${selectedLaboralIds.length})` 
                            : `Descargar Todos (${effectiveLaborContracts.length})`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {cliente?.estadoServicio === 'Inactivo' || cliente?.estadoServicio === 'Bloqueado' ? (
                  <div className="p-8 text-center bg-rose-50/40 rounded-2xl border border-rose-100 mt-4 space-y-4 max-w-xl mx-auto">
                    <div className="p-3 bg-rose-100 text-rose-700 rounded-full w-fit mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">Acceso Bloqueado</h4>
                    <p className="text-[10px] text-slate-600 font-sans leading-relaxed">
                      El acceso a los contratos laborales de sus colaboradores se encuentra temporalmente <strong>bloqueado</strong> hasta que se complete la activación operativa de su servicio.
                    </p>
                    <div className="bg-white p-3.5 rounded-xl border border-rose-100 text-[9.5px] text-left text-slate-500 font-sans space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        <span><strong>Estado del servicio:</strong> <span className="font-bold text-rose-700">{cliente?.estadoServicio || 'Pendiente de contrato comercial'}</span></span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0"></span>
                        <span><strong>Requisitos pendientes:</strong> Para liberar el servicio, debe firmar el <strong>Contrato Comercial</strong> de EOR y registrar la validación de su <strong>Pago Inicial en USD</strong> (contado) en el módulo de Facturación.</span>
                      </div>
                    </div>
                  </div>
                ) : effectiveLaborContracts.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-700 font-sans">No se encontraron colaboradores ni contratos laborales registrados.</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">Los contratos laborales se generan automáticamente para cada colaborador registrado en el módulo de Nómina y Colaboradores.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                          <th className="p-4 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLaboralIds.length === effectiveLaborContracts.length && effectiveLaborContracts.length > 0}
                              onChange={() => {
                                if (selectedLaboralIds.length === effectiveLaborContracts.length) {
                                  setSelectedLaboralIds([]);
                                } else {
                                  setSelectedLaboralIds(effectiveLaborContracts.map(cl => cl.id));
                                }
                              }}
                              className="h-3.5 w-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              title="Seleccionar / Deseleccionar todos"
                            />
                          </th>
                          <th className="p-4">Contrato ID</th>
                          <th className="p-4">Colaborador</th>
                          <th className="p-4">Puesto</th>
                          <th className="p-4">Salario</th>
                          <th className="p-4">F. Generación</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {effectiveLaborContracts.map((cl) => {
                          const isPendingEmployerSig = ['Enviado a firma', 'Pendiente de firma'].includes(cl.estado) && !cl.firmaRepresentante;
                          const isSelected = selectedLaboralIds.includes(cl.id);
                          return (
                            <tr key={cl.id} className={`hover:bg-slate-50/55 transition-colors font-sans ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                              <td className="p-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedLaboralIds(selectedLaboralIds.filter(id => id !== cl.id));
                                    } else {
                                      setSelectedLaboralIds([...selectedLaboralIds, cl.id]);
                                    }
                                  }}
                                  className="h-3.5 w-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-4 font-mono font-bold text-indigo-950">{cl.id}</td>
                              <td className="p-4 font-bold text-slate-800">
                                {cl.trabajadorNombre}
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 ml-1 font-normal">{cl.pais}</span>
                                {cl.trabajadorCorreo && (
                                  <div className="text-[9.5px] text-slate-400 font-normal font-sans">{cl.trabajadorCorreo}</div>
                                )}
                              </td>
                              <td className="p-4 text-slate-600 font-semibold">{cl.puesto}</td>
                              <td className="p-4 font-mono font-bold text-indigo-900">{cl.salario?.toLocaleString()} {cl.moneda} <span className="text-[9px] text-slate-400 font-normal">/{cl.modalidadTrabajo}</span></td>
                              <td className="p-4 text-slate-400 font-mono">{cl.fechaGeneracion ? new Date(cl.fechaGeneracion).toLocaleDateString() : 'Pendiente'}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  cl.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  cl.estado === 'Rechazado' || cl.estado === 'Anulado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  cl.estado === 'Enviado a firma' || cl.estado === 'Pendiente de firma' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-black' :
                                  cl.estado === 'Disponible' || cl.estado === 'Generado' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                  'bg-slate-50 text-slate-600 border border-slate-200'
                                }`}>
                                  {cl.estado}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => downloadContractAsHtmlFile(
                                      cl.id,
                                      'CONTRATO INDIVIDUAL DE TRABAJO LOCAL',
                                      getLaboralContractContent(cl),
                                      cl.trabajadorNombre || 'Trabajador',
                                      'Daniel Decan',
                                      cl.firmaTrabajador?.imagen || cl.firmaRepresentante?.imagen
                                    )}
                                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                                    title="Descargar Contrato"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Descargar Contrato</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenSingleEmailModal(cl)}
                                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                    title={`Enviar contrato por correo a ${cl.trabajadorNombre}`}
                                  >
                                    <Mail className="w-3 h-3 text-indigo-600" />
                                    <span>Enviar Correo</span>
                                  </button>

                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = async (event) => {
                                            try {
                                              const base64Data = event.target?.result as string;
                                              await api.updateContratoLaboral(cl.id, {
                                                estado: 'Firmado',
                                                archivoFirmado: base64Data,
                                                firmaTrabajador: {
                                                  nombre: `${cl.trabajadorNombre} (Firma Manuscrita Cargada)`,
                                                  fecha: new Date().toISOString(),
                                                  ip: 'Cargado Offline'
                                                },
                                                firmaRepresentante: {
                                                  nombre: 'Daniel Decan (Apoderado Quick Hire - Cargado Offline)',
                                                  fecha: new Date().toISOString(),
                                                  ip: 'Cargado Offline'
                                                },
                                                usuarioCreador: user.correo
                                              });
                                              const laborContractsList = await api.getContratosLaborales().catch(() => []);
                                              setContratosLaborales(filterByActiveClient(laborContractsList));
                                              alert('¡Contrato laboral firmado cargado con éxito!');
                                            } catch (err: any) {
                                              alert(`Error al guardar archivo firmado: ${err.message}`);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <button
                                      type="button"
                                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
                                      title="Cargar o Subir Contrato Firmado"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>Subir Firmado</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLaboral(cl);
                                      setLaboralFirmanteNombre(user.nombre || '');
                                      setLaboralObservaciones(cl.observaciones || '');
                                      setLaboralArchivoCargado(cl.archivoFirmado || '');
                                      setLaboralArchivoNombre('');
                                      setFirmaAceptada(false);
                                      setShowRejectModal(false);
                                      setComentariosRechazo('');
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
                                      isPendingEmployerSig 
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-600 shadow-sm' 
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isPendingEmployerSig ? 'Firmar Patrono' : 'Ver Detalles'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-sans">Adendums y Anexos Asociados</h3>
                    <p className="text-[10px] text-slate-400 font-sans">Visualice, firme y controle los adendums contractuales que modifican sus acuerdos comerciales.</p>
                  </div>

                  {/* Header Actions for Adendums */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              try {
                                const base64Data = event.target?.result as string;
                                const targetAd = adendums[0];
                                if (targetAd) {
                                  await api.updateAdendum(targetAd.id, {
                                    estado: 'Firmado',
                                    firma: {
                                      nombre: `${user.nombre || 'Cliente'} (Adendum Escaneado Cargado)`,
                                      fecha: new Date().toISOString(),
                                      imagen: base64Data
                                    }
                                  });
                                } else {
                                  await api.createAdendum({
                                    contratoComercialId: contratosComerciales[0]?.id || '',
                                    clienteId: cliente?.id || user.clienteId || '',
                                    clienteNombre: cliente?.empresa || user.nombre || 'Empresa Cliente',
                                    pais: cliente?.pais || 'Colombia',
                                    servicio: 'Employer of Record (EOR)',
                                    motivoCambio: 'Anexo Modificatorio Cargado',
                                    descripcionCambio: 'Adendum subido firmado en físico o escaneado.',
                                    fechaGeneracion: new Date().toISOString(),
                                    estado: 'Firmado',
                                    firma: {
                                      nombre: `${user.nombre || 'Cliente'} (Adendum Escaneado Cargado)`,
                                      fecha: new Date().toISOString(),
                                      imagen: base64Data
                                    }
                                  });
                                }
                                const freshList = await api.getAdendums().catch(() => []);
                                setAdendums(filterByActiveClient(freshList));
                                alert('¡Adendum firmado cargado correctamente!');
                              } catch (err: any) {
                                alert(`Error al cargar adendum: ${err.message}`);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Adendum Firmado</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetAd = adendums.find(a => ['Enviado', 'Pendiente de firma'].includes(a.estado)) || adendums[0];
                        if (targetAd) {
                          setSelectedAdendum(targetAd);
                          setAdendumFirmanteNombre(user.nombre || '');
                          setAdendumObservaciones('');
                          setAdendumFirmaImagen('');
                          setAdendumFirmaAceptada(false);
                        } else {
                          alert("No hay adendums disponibles.");
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Insertar / Agregar Firma</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetAd = adendums[0];
                        if (targetAd) {
                          downloadContractAsHtmlFile(
                            targetAd.id,
                            'ADENDUM Y ANEXO MODIFICATORIO AL CONTRATO MARCO',
                            `MOTIVO DE LA MODIFICACIÓN: ${targetAd.motivoCambio}\nPAÍS APLICABLE: ${targetAd.pais}\nSERVICIO CONTRATADO: ${targetAd.servicio}\nDESCRIPCIÓN DEL CAMBIO: ${targetAd.descripcionCambio || 'Sin detalles adicionales'}`,
                            cliente?.empresa || 'Cliente LATAM',
                            'Daniel Decan',
                            targetAd.firma?.imagen
                          );
                        } else {
                          alert("No hay adendums para descargar.");
                        }
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Adendum</span>
                    </button>
                  </div>
                </div>

                {adendums.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-4">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-500 font-sans">No se encontraron adendums comerciales para su empresa.</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">Cualquier ajuste legal o anexo modificatorio generado se reflejará de inmediato en este listado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 mt-4 font-sans">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                          <th className="p-4">Adendum ID</th>
                          <th className="p-4">Contrato Base</th>
                          <th className="p-4">Motivo</th>
                          <th className="p-4">F. Generación</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {adendums.map((ad) => {
                          const isPendingSignature = ['Enviado', 'Pendiente de firma'].includes(ad.estado);
                          return (
                            <tr key={ad.id} className="hover:bg-slate-50/55 transition-colors">
                              <td className="p-4 font-mono font-bold text-indigo-950">{ad.id}</td>
                              <td className="p-4 text-slate-600 font-mono">{ad.contratoComercialId}</td>
                              <td className="p-4 text-slate-700 font-semibold">{ad.motivoCambio}</td>
                              <td className="p-4 text-slate-400 font-mono">{new Date(ad.fechaGeneracion).toLocaleDateString()}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  ad.estado === 'Firmado' || ad.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  ad.estado === 'Anulado' || ad.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  isPendingSignature ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                                  'bg-slate-50 text-slate-600 border border-slate-200'
                                }`}>
                                  {ad.estado}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => downloadContractAsHtmlFile(
                                      ad.id,
                                      'ADENDUM Y ANEXO MODIFICATORIO AL CONTRATO MARCO',
                                      `MOTIVO DE LA MODIFICACIÓN: ${ad.motivoCambio}\nPAÍS APLICABLE: ${ad.pais}\nSERVICIO CONTRATADO: ${ad.servicio}\nDESCRIPCIÓN DEL CAMBIO: ${ad.descripcionCambio || 'Sin detalles adicionales'}`,
                                      cliente?.empresa || 'Cliente LATAM',
                                      'Daniel Decan',
                                      ad.firma?.imagen
                                    )}
                                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                                    title="Descargar Adendum"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Descargar Adendum</span>
                                  </button>

                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = async (event) => {
                                            try {
                                              const base64Data = event.target?.result as string;
                                              await api.updateAdendum(ad.id, {
                                                estado: 'Firmado',
                                                firma: {
                                                  nombre: `${user.nombre || 'Cliente'} (Adendum Escaneado Cargado)`,
                                                  fecha: new Date().toISOString(),
                                                  imagen: base64Data
                                                }
                                              });
                                              const freshList = await api.getAdendums().catch(() => []);
                                              setAdendums(filterByActiveClient(freshList));
                                              alert('¡Adendum firmado cargado correctamente!');
                                            } catch (err: any) {
                                              alert(`Error al cargar adendum: ${err.message}`);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <button
                                      type="button"
                                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
                                      title="Cargar o Subir Adendum Firmado"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>Subir Firmado</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAdendum(ad);
                                      setAdendumFirmanteNombre(user.nombre || '');
                                      setAdendumObservaciones('');
                                      setAdendumFirmaImagen(ad.firma?.imagen || '');
                                      setAdendumFirmaAceptada(false);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
                                      isPendingSignature 
                                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-600 shadow-sm' 
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isPendingSignature ? 'Ver y Firmar' : 'Ver Detalles'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ACTIVE WORKER CONTRACT OVERLAY DETAIL MODAL */}
          {selectedLaboral && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden border border-slate-100 flex flex-col text-xs font-sans">
                {/* Header */}
                <div className="bg-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-[9px] font-black font-mono tracking-widest bg-indigo-900/75 text-indigo-300 px-2.5 py-1 rounded-full uppercase">Contrato Laboral del Empleado (EOR)</span>
                    <h3 className="text-sm font-bold mt-2 flex items-center gap-2">
                      <span>{selectedLaboral.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                        selectedLaboral.estado === 'Firmado' ? 'bg-emerald-500 text-white' :
                        ['Enviado a firma', 'Pendiente de firma'].includes(selectedLaboral.estado) ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                      }`}>{selectedLaboral.estado}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => downloadContractAsHtmlFile(
                        selectedLaboral.id,
                        'CONTRATO INDIVIDUAL DE TRABAJO LOCAL',
                        getLaboralContractContent(selectedLaboral),
                        selectedLaboral.trabajadorNombre || 'Trabajador',
                        'Daniel Decan',
                        selectedLaboral.firmaTrabajador?.imagen || selectedLaboral.firmaRepresentante?.imagen
                      )}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Contrato</span>
                    </button>
                    <button onClick={() => setSelectedLaboral(null)} className="text-indigo-200 hover:text-white font-bold text-2xl leading-none">&times;</button>
                  </div>
                </div>

                {/* Split Content */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                  
                  {/* Left Side: Paper Document Viewer */}
                  <div className="lg:col-span-7 flex flex-col space-y-3 min-h-0">
                    <div className="flex items-center justify-between">
                      <label className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Vista previa del documento legal</label>
                      <button
                        type="button"
                        onClick={() => downloadContractAsHtmlFile(
                          selectedLaboral.id,
                          'CONTRATO INDIVIDUAL DE TRABAJO LOCAL',
                          getLaboralContractContent(selectedLaboral),
                          selectedLaboral.trabajadorNombre || 'Trabajador',
                          'Daniel Decan',
                          selectedLaboral.firmaTrabajador?.imagen || selectedLaboral.firmaRepresentante?.imagen
                        )}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar Documento</span>
                      </button>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 p-5 overflow-y-auto max-h-[460px] shadow-inner font-serif text-[11px] leading-relaxed text-slate-800 space-y-4 select-text bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                      <div className="bg-white border border-slate-200 shadow-md p-8 rounded-md space-y-6 min-h-[500px]">
                        <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">CONTRATO INDIVIDUAL DE TRABAJO EOR</h4>
                          <p className="text-[9px] text-slate-400 font-sans">{selectedLaboral.trabajadorNombre} & QUICK HIRE S.A.S.</p>
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {selectedLaboral.contenido || 'Contenido del contrato no generado o no disponible.'}
                        </div>
                        {(selectedLaboral.firmaRepresentante || selectedLaboral.firmaTrabajador) && (
                          <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4 text-[10px] font-sans">
                            <div className="p-3 bg-slate-50 rounded-xl">
                              <p className="text-slate-400 font-bold uppercase text-[8px]">Firma de Representante (Quick Hire / Patrono):</p>
                              {selectedLaboral.firmaRepresentante ? (
                                <>
                                  <p className="font-mono font-black text-indigo-900 italic mt-1.5 text-xs">/ {selectedLaboral.firmaRepresentante.nombre} /</p>
                                  <p className="text-[9px] text-slate-500 mt-1">Fecha: {new Date(selectedLaboral.firmaRepresentante.fecha).toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-500">IP: {selectedLaboral.firmaRepresentante.ip || '192.168.10.1'}</p>
                                </>
                              ) : (
                                <p className="text-slate-400 font-bold italic mt-2">Pendiente de firma patronal</p>
                              )}
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                              <p className="text-slate-400 font-bold uppercase text-[8px]">Firma del Colaborador:</p>
                              {selectedLaboral.firmaTrabajador ? (
                                <>
                                  <p className="font-mono font-black text-slate-700 italic mt-1.5 text-xs">/ {selectedLaboral.firmaTrabajador.nombre} /</p>
                                  <p className="text-[9px] text-slate-500 mt-1">Fecha: {new Date(selectedLaboral.firmaTrabajador.fecha).toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-500">IP: {selectedLaboral.firmaTrabajador.ip || '192.168.10.1'}</p>
                                </>
                              ) : (
                                <p className="text-slate-400 font-bold italic mt-2">Pendiente de firma del colaborador</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Metadata, Logs and Sign action */}
                  <div className="lg:col-span-5 space-y-4 overflow-y-auto pr-1">
                    
                    {/* Section 1: Conditions Summary */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                        <span>Resumen del Contrato</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5 text-[10px] text-slate-600 font-sans">
                        <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">Colaborador</span>
                          <strong className="text-slate-800 truncate block">{selectedLaboral.trabajadorNombre}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">Puesto</span>
                          <strong className="text-slate-800 truncate block">{selectedLaboral.puesto}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">País de Empleo</span>
                          <strong className="text-slate-800 block">{selectedLaboral.pais}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">Fecha de Ingreso</span>
                          <strong className="text-slate-800 block">{selectedLaboral.fechaIngreso}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">Salario Mensual</span>
                          <strong className="text-indigo-900 block font-bold font-mono">{selectedLaboral.salario?.toLocaleString()} {selectedLaboral.moneda}</strong>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                          <span className="block text-slate-400 text-[8px] uppercase font-bold">Modalidad de Trabajo</span>
                          <strong className="text-slate-800 block">{selectedLaboral.modalidadTrabajo}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Interactive Actions for representative */}
                    {['Enviado a firma', 'Pendiente de firma', 'Con observaciones', 'Generado'].includes(selectedLaboral.estado) && !selectedLaboral.firmaRepresentante && (
                      <div className="bg-white rounded-2xl border-2 border-indigo-100 p-4 space-y-3 shadow-md">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-indigo-950">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Firma Digital del Patrono / Representante</span>
                        </h4>

                        {!showRejectModal ? (
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!laboralFirmanteNombre.trim() || !firmaAceptada) {
                              alert("Complete los campos de firma y acepte los términos de representación.");
                              return;
                            }
                            try {
                              const payload: any = {
                                firmaRepresentante: {
                                  nombre: `${laboralFirmanteNombre} (Representante Autorizado)`,
                                  fecha: new Date().toISOString(),
                                  ip: '186.24.112.98'
                                },
                                usuarioCreador: user.correo
                              };
                              if (selectedLaboral.firmaTrabajador) {
                                payload.estado = 'Firmado';
                              } else {
                                payload.estado = 'Pendiente de firma';
                              }

                              const updated = await api.updateContratoLaboral(selectedLaboral.id, payload);
                              setSelectedLaboral(updated);
                              
                              const laborContractsList = await api.getContratosLaborales().catch(() => []);
                              setContratosLaborales(filterByActiveClient(laborContractsList));
                              alert("¡Contrato laboral firmado correctamente como Patrono representante!");
                            } catch (err: any) {
                              alert(err.message || 'Error al guardar la firma del contrato laboral.');
                            }
                          }} className="space-y-3 text-[10px]">
                            <div>
                              <label className="block text-slate-400 font-bold mb-1">Nombre Completo del Firmante (Representante de Quick Hire)</label>
                              <input 
                                type="text" 
                                required 
                                placeholder="Ej. Daniel Decan"
                                value={laboralFirmanteNombre} 
                                onChange={e => setLaboralFirmanteNombre(e.target.value)} 
                                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 font-bold focus:bg-white outline-none"
                              />
                            </div>

                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                              <span className="text-[8px] text-slate-400 font-bold uppercase block">Representación de firma digital</span>
                              <p className="font-serif italic font-extrabold text-indigo-900 text-sm tracking-wider text-center py-2 bg-white rounded-lg border border-slate-100 shadow-3xs select-none">
                                {laboralFirmanteNombre ? `/ ${laboralFirmanteNombre} /` : '[Escriba su nombre arriba]'}
                              </p>
                            </div>

                            <label className="flex items-start gap-2 text-slate-500 font-semibold cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={firmaAceptada} 
                                onChange={e => setFirmaAceptada(e.target.checked)} 
                                className="mt-0.5 h-3.5 w-3.5 text-indigo-600 border-slate-200 rounded" 
                              />
                              <span>Declaro que tengo el poder legal de representación patronal y acepto los términos de esta firma digital vinculante.</span>
                            </label>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowRejectModal(true)}
                                className="w-full py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl transition"
                              >
                                Devolver con Observaciones
                              </button>
                              <button
                                type="submit"
                                disabled={!firmaAceptada || !laboralFirmanteNombre}
                                className={`w-full py-2 text-white font-bold rounded-xl transition shadow-xs ${
                                  (!firmaAceptada || !laboralFirmanteNombre)
                                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                }`}
                              >
                                Firmar Contrato Patrono
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!comentariosRechazo.trim()) {
                              alert("Por favor describa el motivo de la devolución.");
                              return;
                            }
                            try {
                              const updated = await api.updateContratoLaboral(selectedLaboral.id, {
                                estado: 'Con observaciones' as any,
                                observaciones: comentariosRechazo,
                                usuarioCreador: user.correo
                              });
                              setSelectedLaboral(updated);
                              
                              const laborContractsList = await api.getContratosLaborales().catch(() => []);
                              setContratosLaborales(filterByActiveClient(laborContractsList));
                              setShowRejectModal(false);
                              alert("Contrato laboral devuelto con observaciones con éxito.");
                            } catch (err: any) {
                              alert(err.message || 'Error al registrar observaciones.');
                            }
                          }} className="space-y-3 text-[10px]">
                            <div>
                              <label className="block text-rose-800 font-black mb-1 uppercase tracking-wider">Describa las observaciones / Correcciones de datos necesarias</label>
                              <textarea
                                rows={4}
                                required
                                placeholder="Indique si hay errores en el salario, puesto, fecha de ingreso u otros términos del contrato..."
                                value={comentariosRechazo}
                                onChange={e => setComentariosRechazo(e.target.value)}
                                className="w-full bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-slate-900 font-bold focus:bg-white outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-xs"
                              >
                                Enviar Devuelto
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Section 3: Audit Trail Log */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs">Historial de Trazabilidad y Compliance</h4>
                      {(!selectedLaboral.historial || selectedLaboral.historial.length === 0) ? (
                        <p className="text-[10px] text-slate-400 font-semibold italic">No hay registros de trazabilidad.</p>
                      ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {selectedLaboral.historial.map((log: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200/50 space-y-1 relative pl-6">
                              <span className="absolute left-2.5 top-3.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-extrabold text-indigo-950 uppercase">{log.accion}</span>
                                <span className="text-slate-400 font-mono">{new Date(log.fecha).toLocaleString()}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 font-semibold">{log.observaciones || `Estado cambiado a ${log.estadoNuevo}`}</p>
                              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                <span>Por: <strong>{log.usuario}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end shrink-0">
                  <button 
                    onClick={() => setSelectedLaboral(null)} 
                    className="px-5 py-2 bg-indigo-950 text-white font-bold rounded-xl hover:bg-indigo-900 transition"
                  >
                    Cerrar Vista
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CONTRACT WORKFLOW OVERLAY DETAIL MODAL */}
              {selectedContrato && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden border border-slate-100 flex flex-col text-xs">
                    {/* Header */}
                    <div className="bg-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
                      <div>
                        <span className="text-[9px] font-black font-mono tracking-widest bg-indigo-900/75 text-indigo-300 px-2.5 py-1 rounded-full uppercase">Contrato Comercial de Servicios</span>
                        <h3 className="text-sm font-bold mt-2 flex items-center gap-2">
                          <span>{selectedContrato.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                            selectedContrato.estado === 'Servicio liberado' || selectedContrato.estado === 'Pagado' ? 'bg-emerald-500 text-white' :
                            ['Enviado al cliente', 'Visto por cliente'].includes(selectedContrato.estado) ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                          }`}>{selectedContrato.estado}</span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => downloadContractAsHtmlFile(
                            selectedContrato.id,
                            'CONTRATO MARCO COMERCIAL DE SERVICIOS EOR',
                            selectedContrato.contenido || '',
                            selectedContrato.clienteNombre || 'Cliente',
                            selectedContrato.representanteProveedor || 'Daniel Decan',
                            selectedContrato.firmaCliente?.imagen
                          )}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Contrato</span>
                        </button>
                        <button onClick={() => setSelectedContrato(null)} className="text-indigo-200 hover:text-white font-bold text-2xl leading-none">&times;</button>
                      </div>
                    </div>

                    {/* Split Content */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                      
                      {/* Left Side: Paper Document Viewer */}
                      <div className="lg:col-span-7 flex flex-col space-y-3 min-h-0">
                        <div className="flex items-center justify-between">
                          <label className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Vista previa del documento legal</label>
                          <button
                            type="button"
                            onClick={() => {
                              const rendered = renderCommercialContractHtml(selectedContrato, cliente);
                              downloadContractAsHtmlFile(
                                selectedContrato.id,
                                'CONTRATO MARCO COMERCIAL DE SERVICIOS EOR',
                                rendered,
                                selectedContrato.clienteNombre || 'Cliente',
                                selectedContrato.representanteProveedor || 'Daniel Decan',
                                selectedContrato.firmaCliente?.imagen
                              );
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar Documento</span>
                          </button>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 p-5 overflow-y-auto max-h-[460px] shadow-inner font-sans text-[11px] leading-relaxed text-slate-800 space-y-4 select-text bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                          <div className="bg-white border border-slate-200 shadow-md p-8 rounded-md space-y-6 min-h-[500px]">
                            <div dangerouslySetInnerHTML={{ __html: renderCommercialContractHtml(selectedContrato, cliente) }} />
                            {(selectedContrato.firmaCliente || firmaImagenUploaded) && (
                              <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4 text-[10px] font-sans">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                  <p className="text-slate-400 font-bold uppercase text-[8px]">Firma de Aceptación Cliente:</p>
                                  {(firmaImagenUploaded || selectedContrato.firmaCliente?.imagen) && (
                                    <img 
                                      src={firmaImagenUploaded || selectedContrato.firmaCliente?.imagen} 
                                      alt="Firma Digital" 
                                      className="max-h-12 object-contain my-1.5 border-b border-slate-200 pb-1"
                                    />
                                  )}
                                  <p className="font-mono font-black text-indigo-900 italic mt-1 text-xs">/ {selectedContrato.firmaCliente?.nombre || firmanteNombre || 'Representante Legal'} /</p>
                                  <p className="text-[9px] text-slate-500 mt-1">Fecha: {selectedContrato.firmaCliente?.fecha ? new Date(selectedContrato.firmaCliente.fecha).toLocaleString() : new Date().toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-500">IP: {selectedContrato.firmaCliente?.ip || '186.24.112.98'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                  <p className="text-slate-400 font-bold uppercase text-[8px]">Representante Proveedor:</p>
                                  <p className="font-mono font-black text-slate-700 italic mt-1.5 text-xs">/ {selectedContrato.representanteProveedor} /</p>
                                  <p className="text-[9px] text-slate-500 mt-1">Quick Hire Legal Department</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Metadata, Logs and Sign action */}
                      <div className="lg:col-span-5 space-y-4 overflow-y-auto pr-1">
                        
                        {/* Section 1: Conditions Summary */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <span>Resumen del Acuerdo</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2.5 text-[10px] text-slate-600 font-sans">
                            <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                              <span className="block text-slate-400 text-[8px] uppercase font-bold">Cliente</span>
                              <strong className="text-slate-800 truncate block">{selectedContrato.clienteNombre}</strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                              <span className="block text-slate-400 text-[8px] uppercase font-bold">Cédula Jurídica</span>
                              <strong className="text-slate-800 block">{selectedContrato.cedulaJuridica || 'No provista'}</strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                              <span className="block text-slate-400 text-[8px] uppercase font-bold">Dirección</span>
                              <strong className="text-slate-800 block truncate">{selectedContrato.direccion || 'No provista'}</strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                              <span className="block text-slate-400 text-[8px] uppercase font-bold">Servicio Contratado</span>
                              <strong className="text-slate-800 block">{selectedContrato.servicioContratado}</strong>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-200/50">
                              <span className="block text-slate-400 text-[8px] uppercase font-bold">Fee Mensual por Colaborador</span>
                              <strong className="text-indigo-900 block font-bold font-mono">{selectedContrato.feePorEmpleado?.toLocaleString()} {selectedContrato.moneda}</strong>
                            </div>
                            <div className="col-span-2 bg-white p-2.5 rounded-xl border border-slate-200/50">
                              <span className="block text-slate-400 text-[8px] uppercase font-bold">Condiciones de Cobro</span>
                              <p className="text-slate-700 font-semibold mt-0.5">{selectedContrato.condicionesComerciales}</p>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Interactive Actions */}
                        {(!selectedContrato.firmadoPorCliente || ['Enviado', 'Enviado al cliente', 'Visto por cliente', 'Pendiente de firma del cliente', 'Con observaciones', 'Pendiente de firma', 'En revisión interna'].includes(selectedContrato.estado)) && (
                          <div className="bg-white rounded-2xl border-2 border-indigo-100 p-4 space-y-3 shadow-md">
                            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-indigo-950">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <span>Firma Electrónica Requerida</span>
                            </h4>

                            {!showRejectModal ? (
                              <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!firmanteNombre.trim() || !firmanteCargo.trim() || !firmaAceptada) {
                                  alert("Complete todos los campos de firma y acepte los términos jurídicos.");
                                  return;
                                }
                                try {
                                  const payload = {
                                    estado: 'Firmado por cliente' as const,
                                    firmaCliente: {
                                      nombre: `${firmanteNombre} (${firmanteCargo})`,
                                      fecha: new Date().toISOString(),
                                      ip: '186.24.112.98',
                                      imagen: firmaImagenUploaded || undefined
                                    },
                                    archivoFirmado: `https://storage.grupostt.com/contracts/cc-${selectedContrato.id}-signed.pdf`
                                  };
                                  const updated = await api.updateContratoComercial(selectedContrato.id, payload);
                                  setSelectedContrato(updated);
                                  // Refresh list
                                  const contractsList = await api.getContratosComerciales().catch(() => []);
                                  setContratosComerciales(filterByActiveClient(contractsList));
                                  alert("¡Contrato firmado y devuelto correctamente con su firma agregada!");
                                } catch (err: any) {
                                  alert(err.message || 'Error al guardar firma.');
                                }
                              }} className="space-y-3 text-[10px]">
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Nombre Completo del Firmante (Representante)</label>
                                  <input 
                                    type="text" 
                                    required 
                                    placeholder="Ej. John Doe"
                                    value={firmanteNombre} 
                                    onChange={e => setFirmanteNombre(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 font-bold focus:bg-white outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Cargo / Posición Legal</label>
                                  <input 
                                    type="text" 
                                    required 
                                    placeholder="Ej. CEO / Representante Legal" 
                                    value={firmanteCargo} 
                                    onChange={e => setFirmanteCargo(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 font-bold focus:bg-white outline-none"
                                  />
                                </div>

                                {/* Dynamic Signature Image Upload Option */}
                                <div>
                                  <label className="block text-slate-400 font-bold mb-1">Agregar Imagen de Firma al Contrato (PNG / JPG / WEBP)</label>
                                  <input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          setFirmaImagenUploaded(ev.target?.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold hover:file:bg-indigo-100 cursor-pointer"
                                  />
                                  {firmaImagenUploaded && (
                                    <div className="mt-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <img src={firmaImagenUploaded} alt="Firma vista previa" className="h-8 max-w-[120px] object-contain border border-slate-200 rounded bg-white p-1" />
                                        <span className="text-[9px] font-bold text-indigo-900">✓ Imagen de firma lista</span>
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => setFirmaImagenUploaded('')}
                                        className="text-rose-600 hover:text-rose-700 font-bold text-[9px]"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Representación de firma digital</span>
                                  {firmaImagenUploaded ? (
                                    <div className="flex justify-center py-2 bg-white rounded-lg border border-slate-100 shadow-3xs">
                                      <img src={firmaImagenUploaded} alt="Firma" className="max-h-12 object-contain" />
                                    </div>
                                  ) : (
                                    <p className="font-serif italic font-extrabold text-indigo-900 text-sm tracking-wider text-center py-2 bg-white rounded-lg border border-slate-100 shadow-3xs select-none">
                                      {firmanteNombre ? `/ ${firmanteNombre} /` : '[Escriba su nombre arriba o cargue su imagen]'}
                                    </p>
                                  )}
                                </div>

                                <label className="flex items-start gap-2 text-slate-500 font-semibold cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={firmaAceptada} 
                                    onChange={e => setFirmaAceptada(e.target.checked)} 
                                    className="mt-0.5 h-3.5 w-3.5 text-indigo-600 border-slate-200 rounded" 
                                  />
                                  <span>Declaro que tengo la representación legal vigente y acepto que el presente documento digital constituye un acuerdo vinculante según ley.</span>
                                </label>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setShowRejectModal(true)}
                                    className="w-full py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl transition"
                                  >
                                    Devolver con Observaciones
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={!firmaAceptada || !firmanteNombre || !firmanteCargo}
                                    className={`w-full py-2 text-white font-bold rounded-xl transition shadow-xs ${
                                      (!firmaAceptada || !firmanteNombre || !firmanteCargo)
                                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                        : 'bg-indigo-600 hover:bg-indigo-500'
                                    }`}
                                  >
                                    Firmar Contrato
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!comentariosRechazo.trim()) {
                                  alert("Por favor describa el motivo de la devolución.");
                                  return;
                                }
                                try {
                                  const updated = await api.updateContratoComercial(selectedContrato.id, {
                                    estado: 'Con observaciones' as const,
                                    observaciones: comentariosRechazo
                                  });
                                  setSelectedContrato(updated);
                                  // Refresh list
                                  const contractsList = await api.getContratosComerciales().catch(() => []);
                                  setContratosComerciales(filterByActiveClient(contractsList));
                                  setShowRejectModal(false);
                                  alert("Contrato comercial devuelto con éxito. El asesor será notificado para realizar los ajustes correspondientes.");
                                } catch (err: any) {
                                  alert(err.message || 'Error al devolver el contrato.');
                                }
                              }} className="space-y-3 text-[10px]">
                                <div>
                                  <label className="block text-rose-800 font-black mb-1 uppercase tracking-wider">Describa las observaciones / Modificaciones requeridas</label>
                                  <textarea
                                    rows={4}
                                    required
                                    placeholder="Indique los términos, tarifas o cláusulas específicas que desea ajustar para que el asesor comercial realice los cambios..."
                                    value={comentariosRechazo}
                                    onChange={e => setComentariosRechazo(e.target.value)}
                                    className="w-full bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-slate-900 font-bold focus:bg-white outline-none"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-xs"
                                  >
                                    Enviar Devuelto
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}

                        {/* Section 3: Audit Trail Log */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs">Historial de Trazabilidad y Auditoría</h4>
                          {(!selectedContrato.historial || selectedContrato.historial.length === 0) ? (
                            <p className="text-[10px] text-slate-400 font-semibold italic">No hay registros de auditoría registrados.</p>
                          ) : (
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                              {selectedContrato.historial.map((log: any, idx: number) => (
                                <div key={log.id || idx} className="p-2.5 bg-white rounded-xl border border-slate-200/50 space-y-1 relative pl-6">
                                  <span className="absolute left-2.5 top-3.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                  <div className="flex justify-between items-center text-[9px]">
                                    <span className="font-extrabold text-indigo-950 uppercase">{log.accion}</span>
                                    <span className="text-slate-400 font-mono">{new Date(log.fecha).toLocaleString()}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 font-semibold">{log.observaciones || `Estado cambiado a ${log.estadoNuevo}`}</p>
                                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                    <span>Por: <strong>{log.usuario}</strong></span>
                                    {log.archivoRelacionado && <span className="text-indigo-600 underline truncate max-w-[120px]">{log.archivoRelacionado}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end shrink-0">
                      <button 
                        onClick={() => setSelectedContrato(null)} 
                        className="px-5 py-2 bg-indigo-950 text-white font-bold rounded-xl hover:bg-indigo-900 transition"
                      >
                        Cerrar Vista
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVE ADENDUM WORKFLOW OVERLAY DETAIL MODAL */}
              {selectedAdendum && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden border border-slate-100 flex flex-col text-xs font-sans">
                    {/* Header */}
                    <div className="bg-indigo-950 text-white p-5 flex justify-between items-center shrink-0">
                      <div>
                        <span className="text-[9px] font-black font-mono tracking-widest bg-indigo-900/75 text-indigo-300 px-2.5 py-1 rounded-full uppercase">Anexo Modificatorio / Adendum</span>
                        <h3 className="text-sm font-bold mt-2 flex items-center gap-2">
                          <span>{selectedAdendum.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold ${
                            selectedAdendum.estado === 'Firmado' || selectedAdendum.estado === 'Aprobado' ? 'bg-emerald-500 text-white' :
                            ['Enviado', 'Pendiente de firma'].includes(selectedAdendum.estado) ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
                          }`}>{selectedAdendum.estado}</span>
                        </h3>
                      </div>
                      <button onClick={() => setSelectedAdendum(null)} className="text-indigo-200 hover:text-white font-bold text-xl">&times;</button>
                    </div>

                    {/* Split Content */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                      
                      {/* Left Side: Document Preview */}
                      <div className="lg:col-span-7 flex flex-col space-y-3 min-h-0">
                        <label className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Vista previa del documento legal</label>
                        <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 p-5 overflow-y-auto max-h-[460px] shadow-inner font-serif text-[11px] leading-relaxed text-slate-800 space-y-4 select-text bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                          <div className="bg-white border border-slate-200 shadow-md p-8 rounded-md space-y-6 min-h-[500px]">
                            <div className="text-center space-y-1.5 border-b border-slate-100 pb-4 font-sans">
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">ADENDUM MODIFICATORIO CONTRACTUAL</h4>
                              <p className="text-[9px] text-slate-400">Contrato de Referencia: {selectedAdendum.contratoComercialId}</p>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed">
                              {selectedAdendum.contenido}
                            </div>
                            {(selectedAdendum.firma || adendumFirmaImagen) && (
                              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 gap-4 text-[10px] font-sans">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                  <p className="text-slate-400 font-bold uppercase text-[8px]">Firma de Aceptación Cliente:</p>
                                  {(adendumFirmaImagen || selectedAdendum.firma?.imagen) && (
                                    <img 
                                      src={adendumFirmaImagen || selectedAdendum.firma?.imagen} 
                                      alt="Firma Adendum" 
                                      className="max-h-12 object-contain my-1.5 border-b border-slate-200 pb-1"
                                    />
                                  )}
                                  <p className="font-mono font-black text-indigo-900 italic mt-1.5 text-xs">/ {selectedAdendum.firma?.nombre || adendumFirmanteNombre || 'Representante Legal'} /</p>
                                  <p className="text-[9px] text-slate-500 mt-1">Fecha de firma: {selectedAdendum.firma?.fecha ? new Date(selectedAdendum.firma.fecha).toLocaleString() : new Date().toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-500">Representante de Quick Hire Partner Client</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Metadata and Actions */}
                      <div className="lg:col-span-5 space-y-5 flex flex-col">
                        
                        {/* Summary Details */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 shrink-0">
                          <h4 className="font-bold text-slate-900 text-xs">Detalles del Cambio</h4>
                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[8px]">Motivo del Cambio</span>
                              <strong className="text-slate-800 block mt-0.5">{selectedAdendum.motivoCambio}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[8px]">Responsable Quick Hire</span>
                              <strong className="text-slate-800 block mt-0.5">{selectedAdendum.usuarioResponsable || 'Admin Legal'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[8px]">País Aplicable</span>
                              <strong className="text-slate-800 block mt-0.5">{selectedAdendum.pais}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[8px]">Servicio Modificado</span>
                              <strong className="text-slate-800 block mt-0.5">{selectedAdendum.servicio}</strong>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 block font-semibold uppercase text-[8px]">Descripción Detallada</span>
                              <p className="text-slate-600 mt-0.5">{selectedAdendum.descripcionCambio || 'No provista'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Signature Area */}
                        {['Enviado', 'Pendiente de firma'].includes(selectedAdendum.estado) && (
                          <div className="bg-amber-50/40 rounded-2xl border border-amber-200/60 p-4 space-y-3 shrink-0">
                            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span>Firma Digital del Adendum</span>
                            </h4>
                            <p className="text-[10px] text-slate-600">Al firmar digitalmente, usted acepta las modificaciones estipuladas en el anexo.</p>

                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              if (!adendumFirmanteNombre.trim() || !adendumFirmaAceptada) {
                                alert("Por favor complete su nombre completo y acepte los términos de firma.");
                                return;
                              }
                              try {
                                const updated = await api.updateAdendum(selectedAdendum.id, {
                                  estado: 'Firmado',
                                  firma: {
                                    nombre: adendumFirmanteNombre,
                                    fecha: new Date().toISOString(),
                                    imagen: adendumFirmaImagen || undefined
                                  },
                                  usuarioCreador: user.correo,
                                  observaciones: adendumObservaciones || `Adendum firmado digitalmente por el cliente representative (${adendumFirmanteNombre})`
                                });
                                setSelectedAdendum(updated);
                                
                                // Refresh adendums list
                                const freshList = await api.getAdendums().catch(() => []);
                                setAdendums(filterByActiveClient(freshList));
                                alert("¡Adendum firmado digitalmente con su firma agregada!");
                              } catch (err: any) {
                                alert(err.message || 'Error firmando el adendum.');
                              }
                            }} className="space-y-3 text-[10px]">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Nombre Completo de Firma</label>
                                <input 
                                  type="text" 
                                  required 
                                  value={adendumFirmanteNombre}
                                  onChange={(e) => setAdendumFirmanteNombre(e.target.value)}
                                  placeholder="Ej. Juan Pérez"
                                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold text-slate-800"
                                />
                              </div>

                              {/* Signature Image Upload for Adendums */}
                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Agregar Imagen de Firma al Adendum (PNG / JPG / WEBP)</label>
                                <input 
                                  type="file" 
                                  accept="image/png, image/jpeg, image/webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        setAdendumFirmaImagen(ev.target?.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full text-[10px] bg-white border border-slate-200 rounded-lg p-1.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-800 file:font-bold hover:file:bg-amber-200 cursor-pointer"
                                />
                                {adendumFirmaImagen && (
                                  <div className="mt-2 p-2 bg-white border border-amber-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <img src={adendumFirmaImagen} alt="Firma vista previa" className="h-8 max-w-[120px] object-contain border border-slate-200 rounded bg-slate-50 p-1" />
                                      <span className="text-[9px] font-bold text-amber-900">✓ Imagen de firma lista</span>
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => setAdendumFirmaImagen('')}
                                      className="text-rose-600 hover:text-rose-700 font-bold text-[9px]"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Observaciones / Comentarios (Opcional)</label>
                                <textarea 
                                  value={adendumObservaciones}
                                  onChange={(e) => setAdendumObservaciones(e.target.value)}
                                  placeholder="Escriba comentarios o dudas si lo requiere..."
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 text-slate-800"
                                />
                              </div>

                              <label className="flex items-start gap-2 text-slate-600 font-semibold cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={adendumFirmaAceptada} 
                                  onChange={e => setAdendumFirmaAceptada(e.target.checked)} 
                                  className="mt-0.5 h-3.5 w-3.5 text-amber-600 border-slate-200 rounded" 
                                />
                                <span>Acepto que esta firma se incorpore en el adendum y reconozco su validez jurídica.</span>
                              </label>

                              <button 
                                type="submit" 
                                disabled={!adendumFirmaAceptada || !adendumFirmanteNombre}
                                className={`w-full py-2 font-extrabold rounded-xl transition shadow-xs cursor-pointer text-[10px] ${
                                  (!adendumFirmaAceptada || !adendumFirmanteNombre)
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                                }`}
                              >
                                Aplicar Firma e Insertar en Adendum
                              </button>
                            </form>
                          </div>
                        )}



                        {/* Audit Trail Log for Adendum */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 flex-1 overflow-hidden flex flex-col">
                          <h4 className="font-bold text-slate-900 text-xs shrink-0 font-sans">Historial de Trazabilidad y Compliance</h4>
                          {(!selectedAdendum.historial || selectedAdendum.historial.length === 0) ? (
                            <p className="text-[10px] text-slate-400 font-semibold italic shrink-0">No hay registros de trazabilidad.</p>
                          ) : (
                            <div className="space-y-3 overflow-y-auto flex-1 pr-1 font-sans">
                              {selectedAdendum.historial.map((log: any, idx: number) => (
                                <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200/50 space-y-1 relative pl-6">
                                  <span className="absolute left-2.5 top-3.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                  <div className="flex justify-between items-center text-[9px]">
                                    <span className="font-extrabold text-indigo-950 uppercase">{log.accion}</span>
                                    <span className="text-slate-400 font-mono">{new Date(log.fecha).toLocaleString()}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 font-semibold">{log.observaciones || `Estado cambiado a ${log.estadoNuevo}`}</p>
                                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                    <span>Por: <strong>{log.usuario}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end shrink-0">
                      <button 
                        onClick={() => setSelectedAdendum(null)} 
                        className="px-5 py-2 bg-indigo-950 text-white font-bold rounded-xl hover:bg-indigo-900 transition text-[10px]"
                      >
                        Cerrar Vista
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* INDIVIDUAL WORKER ADD MODAL */}
      {showAddModal && cliente && (
        <div id="add-worker-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="bg-indigo-900 text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{workersT.addIndividual}</h3>
                <p className="text-xs text-indigo-200 mt-0.5">Agrega un nuevo colaborador bajo legislación de {cliente.pais}.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleAddWorker} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {workersT.name} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Documento de Identidad / Cédula / DNI
                  </label>
                  <input
                    type="text"
                    value={documentoIdentidad}
                    onChange={(e) => setDocumentoIdentidad(e.target.value)}
                    placeholder="Ej. 1-1456-0789 o 12345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {workersT.email} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="juan.perez@empresa.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {workersT.position} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    placeholder="Ej. Senior Software Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950 font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Proyecto del Cliente
                  </label>
                  <input
                    type="text"
                    value={proyecto}
                    onChange={(e) => setProyecto(e.target.value)}
                    placeholder={cliente.proyecto || "Ej: Proyecto Alpha 2026"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    País de Radicación / Contratación <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={workerPais || cliente.pais}
                    onChange={(e) => setWorkerPais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-bold"
                  >
                    {LATAM_COUNTRIES.map((p) => (
                      <option key={p} value={p}>
                        {COUNTRY_FLAGS[p] || '🌎'} {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {workersT.startDate}
                  </label>
                  <input
                    type="date"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {workersT.workMode}
                  </label>
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950"
                  >
                    <option value="Remoto">Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {workersT.salary} ({cliente.moneda}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={salario}
                      onChange={(e) => setSalario(e.target.value)}
                      placeholder="Ej. 3500"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-slate-950"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE TALENT COST CALCULATOR CARD */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-4.5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">
                        Calculadora Legal & Costo del Talento: {talentCostEstimate.pais} {COUNTRY_FLAGS[talentCostEstimate.pais] || '🌎'}
                      </h4>
                      <p className="text-[10px] text-indigo-700">
                        Cálculo automático de cargas patronales según normativa laboral de {talentCostEstimate.pais}, fee de servicio e impuestos.
                      </p>
                    </div>
                  </div>
                  <span className="bg-indigo-100 text-indigo-900 font-bold font-mono text-[10px] px-2.5 py-1 rounded-full">
                    {cliente.moneda}
                  </span>
                </div>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">1. Salario Bruto</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${talentCostEstimate.salarioBruto.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="block text-[10px] font-bold text-amber-700 uppercase">
                      2. Cargas Sociales ({talentCostEstimate.cargasSocialesPatronalesPct}%)
                    </span>
                    <span className="font-mono font-bold text-amber-700 text-sm">
                      +${talentCostEstimate.cargasSocialesMonto.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-indigo-200">
                    <span className="block text-[10px] font-bold text-indigo-700 uppercase">3. Fee EOR</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      +${talentCostEstimate.feeServicioMonto.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">4. Impuestos</span>
                    <span className="font-mono font-bold text-slate-700 text-sm">
                      +${talentCostEstimate.impuestosMonto.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Costo Total Talento Highlight Banner */}
                <div className="bg-indigo-950 text-white p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                      Costo Total Mensual del Talento para su Empresa
                    </span>
                    <span className="text-[10px] text-indigo-200">
                      Incluye nómina directa + seguridad social patronal + gestión integral EOR
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-emerald-300 tracking-tight">
                      ${talentCostEstimate.costoTotalTalento.toLocaleString()} {cliente.moneda}
                    </span>
                    <span className="block text-[9.5px] text-indigo-300 font-medium">Facturado mensualmente</span>
                  </div>
                </div>

                {/* Breakdown of contributions for transparency */}
                {talentCostEstimate.desglose && talentCostEstimate.desglose.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Aportes Patronales Obligatorios en {talentCostEstimate.pais}:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                      {talentCostEstimate.desglose.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pr-1 font-medium">
                          <span className="truncate max-w-[190px]">&bull; {item.concepto}:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {item.porcentaje}% (${item.monto.toLocaleString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Benefits catalogs checkboxes */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {workersT.benefitsTitle} (Opcionales)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {beneficios.map((b) => (
                    <label key={b.id} className="flex items-start space-x-2.5 p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBenefits.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBenefits([...selectedBenefits, b.id]);
                          } else {
                            setSelectedBenefits(selectedBenefits.filter(id => id !== b.id));
                          }
                        }}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-xs text-slate-700 font-medium leading-tight">
                        <div className="font-bold text-slate-900">{b.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Cost: {b.costo.toLocaleString()} {b.moneda} / {b.modalidad}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all text-slate-700"
                >
                  {commonT.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Colaborador en Proyecto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW / AUDIT OBSERVATIONS MODAL */}
      {showDetailModal && (
        <div id="worker-detail-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{workersT.details}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Información laboral y aportes asociados.</p>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 border-b border-slate-100 pb-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">ID</span>
                  <span className="font-mono font-bold text-slate-900">{showDetailModal.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado</span>
                  <span className="font-bold text-indigo-700">{showDetailModal.estado}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Documento Identidad</span>
                  <span className="font-mono font-bold text-slate-900">{showDetailModal.documentoIdentidad || 'No registrado'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Colaborador</span>
                  <span className="font-bold text-slate-900">{showDetailModal.nombre}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Correo</span>
                  <span className="text-slate-600 font-medium">{showDetailModal.correo}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Puesto / Cargo</span>
                  <span className="text-slate-800 font-bold">{showDetailModal.puesto}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Proyecto Asignado</span>
                  <span className="text-indigo-950 font-bold">{showDetailModal.proyecto || cliente.proyecto || 'Proyecto Principal'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">País de Radicación</span>
                  <span className="font-bold text-slate-900">{COUNTRY_FLAGS[showDetailModal.pais] || '🌎'} {showDetailModal.pais}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salario Bruto</span>
                  <span className="font-mono font-bold text-slate-900">${showDetailModal.salario.toLocaleString()} {showDetailModal.moneda}</span>
                </div>
              </div>

              {/* Talent Cost Summary Card */}
              {(() => {
                const costCalc = showDetailModal.detallesCostos || calcularCostoTalento(showDetailModal.salario, showDetailModal.pais, showDetailModal.moneda, cliente?.feePorEmpleado || 150);
                return (
                  <div className="bg-indigo-950 text-white p-3.5 rounded-2xl space-y-2 shadow-xs">
                    <div className="flex justify-between items-center border-b border-indigo-800/80 pb-2">
                      <span className="text-xs font-bold text-indigo-200">Costo Total Mensual del Talento:</span>
                      <span className="text-base font-mono font-black text-emerald-300">
                        ${(showDetailModal.costoTotalTalento || (costCalc as any).costoTotal || (costCalc as any).costoTotalTalento || (showDetailModal.salario * 1.3)).toLocaleString()} {showDetailModal.moneda}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                      <div className="bg-indigo-900/60 p-2 rounded-xl">
                        <span className="block text-[9.5px] text-indigo-300">Cargas Sociales:</span>
                        <strong className="font-mono text-amber-300">
                          +${(showDetailModal.cargasSocialesMonto || costCalc.cargasSocialesMonto || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div className="bg-indigo-900/60 p-2 rounded-xl">
                        <span className="block text-[9.5px] text-indigo-300">Fee EOR:</span>
                        <strong className="font-mono text-indigo-200">
                          +${(showDetailModal.feeMonto || (costCalc as any).feeServicioMonto || 150).toLocaleString()}
                        </strong>
                      </div>
                      <div className="bg-indigo-900/60 p-2 rounded-xl">
                        <span className="block text-[9.5px] text-indigo-300">Impuestos Locales:</span>
                        <strong className="font-mono text-slate-200">
                          +${(showDetailModal.impuestosMonto || (costCalc as any).impuestosMonto || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Local Social Charges estimate list */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-[10px] text-indigo-700 tracking-wider">
                  {workersT.socialChargesTitle.replace('{country}', showDetailModal.pais)}
                </h4>
                <div className="divide-y divide-slate-100 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 max-h-[140px] overflow-y-auto font-medium">
                  {cargasSociales.filter(cs => cs.pais === showDetailModal.pais && cs.estado === 'Vigente').length === 0 ? (
                    <p className="text-[10px] text-slate-500">No hay cargas sociales configuradas para {showDetailModal.pais}.</p>
                  ) : (
                    cargasSociales.filter(cs => cs.pais === showDetailModal.pais && cs.estado === 'Vigente').map(cs => {
                      const calculatedCost = Math.round(showDetailModal.salario * (cs.porcentaje / 100));
                      return (
                        <div key={cs.id} className="flex justify-between text-[11px] py-1">
                          <span className="text-slate-600">{cs.tipoCarga} ({cs.porcentaje}%)</span>
                          <span className="font-mono text-slate-900 font-bold">
                            + {calculatedCost.toLocaleString()} {showDetailModal.moneda}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">
                  * Aportes estimados con base en la regulación de {showDetailModal.pais}. Sujeto a topes de ley vigentes.
                </p>
              </div>

              {showDetailModal.observaciones && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px]">
                  <strong className="font-bold block mb-0.5">Observaciones de Auditoría:</strong>
                  {showDetailModal.observaciones}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cl = contratosLaborales.find(c => c.trabajadorId === showDetailModal.id || c.trabajadorNombre === showDetailModal.nombre) || contratosLaborales[0];
                    if (cl) {
                      downloadContractAsHtmlFile(
                        cl.id,
                        'CONTRATO INDIVIDUAL DE TRABAJO',
                        cl.contenido || `CONTRATO INDIVIDUAL DE TRABAJO\n\nTrabajador: ${showDetailModal.nombre}\nCargo: ${showDetailModal.puesto}\nPaís: ${showDetailModal.pais}\nSalario: $${showDetailModal.salario} ${showDetailModal.moneda}`,
                        showDetailModal.nombre,
                        'Daniel Decan (Quick Hire)',
                        cl.firmaTrabajador?.imagen
                      );
                    } else {
                      downloadContractAsHtmlFile(
                        `CTR-LAB-${showDetailModal.id}`,
                        'CONTRATO INDIVIDUAL DE TRABAJO',
                        `CONTRATO INDIVIDUAL DE TRABAJO\n\nTrabajador: ${showDetailModal.nombre}\nCargo: ${showDetailModal.puesto}\nPaís: ${showDetailModal.pais}\nSalario: $${showDetailModal.salario} ${showDetailModal.moneda}\nFecha Ingreso: ${showDetailModal.fechaIngreso}`,
                        showDetailModal.nombre,
                        'Daniel Decan (Quick Hire)'
                      );
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Contrato Laboral</span>
                </button>

                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  {commonT.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT REGISTRATION MODAL */}
      {showPaymentModal && (
        <div id="payment-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">{billingT.recordPaymentBtn}</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Sube el comprobante de transferencia para actualizar tu saldo.</p>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              {pagoError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {pagoError}
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Factura:</span>
                  <span className="font-mono font-bold text-slate-900">{showPaymentModal.id}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Periodo:</span>
                  <span className="font-medium text-slate-800">{showPaymentModal.periodo}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Saldo Pendiente:</span>
                  <span className="font-mono font-bold text-rose-600">{showPaymentModal.saldoPendiente.toLocaleString()} {showPaymentModal.moneda}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {billingT.paymentAmount} ({showPaymentModal.moneda}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                  placeholder={String(showPaymentModal.saldoPendiente)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {billingT.paymentMethod} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pagoMetodo}
                  onChange={(e) => setPagoMetodo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Tarjeta de Crédito Corporativa">Tarjeta de Crédito Corporativa</option>
                  <option value="Pago Digital / ACH">Pago Digital / ACH</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {billingT.receiptNo}
                </label>
                <input
                  type="text"
                  value={pagoComprobante}
                  onChange={(e) => setPagoComprobante(e.target.value)}
                  placeholder="Ej. TXN-991823"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  {commonT.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Registrar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE DETAIL MODAL FOR CLIENT */}
      {showInvoiceDetail && (
        <div id="client-invoice-detail-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[85vh]">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold">Comprobante Fiscal / Detalle Liquidación</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">ID Factura: {showInvoiceDetail.id} | Periodo: {showInvoiceDetail.periodo}</p>
              </div>
              <button onClick={() => setShowInvoiceDetail(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 printable-invoice">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h4 className="text-lg font-black text-indigo-900">QUICK HIRE</h4>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Employer of Record Service</span>
                  <p className="text-slate-600 mt-2 font-semibold">Quick Hire Latam S.R.L.</p>
                  <p className="text-slate-400">Dirección Fiscal: San José, Costa Rica</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block mb-2 ${
                    showInvoiceDetail.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {showInvoiceDetail.estado}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Emisión:</p>
                  <p className="font-bold text-slate-800 font-mono">{showInvoiceDetail.fechaEmision}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Vencimiento:</p>
                  <p className="font-bold text-slate-800 font-mono">{showInvoiceDetail.fechaVencimiento}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Facturado a:</span>
                  <h5 className="font-bold text-slate-900 mt-0.5 text-sm">{showInvoiceDetail.clienteNombre}</h5>
                  <p className="text-slate-600 mt-1">País: {showInvoiceDetail.pais}</p>
                  <p className="text-slate-500">Moneda de Pago: {showInvoiceDetail.moneda}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Detalles Operativos:</span>
                  <p className="text-slate-600 mt-1 font-semibold">Headcount Contratado: {showInvoiceDetail.cantidadTrabajadores} Empleados</p>
                  <p className="text-slate-500">Periodo de Servicio: {showInvoiceDetail.periodo}</p>
                </div>
              </div>

              {(() => {
                const baseFeeVal = showInvoiceDetail.baseFee ?? (showInvoiceDetail.feeAplicado * (showInvoiceDetail.cantidadTrabajadores || 1));
                const beneficiosVal = showInvoiceDetail.beneficiosCobrados ?? 0;
                const descuentosVal = showInvoiceDetail.descuentos ?? 0;
                const subtotalNeto = baseFeeVal + beneficiosVal - descuentosVal;
                const comisionVal = showInvoiceDetail.comisionBancaria ?? Math.round(subtotalNeto * 0.025);
                const whtVal = showInvoiceDetail.wht ?? Math.round(subtotalNeto * 0.04);
                const ivaVal = showInvoiceDetail.iva ?? Math.round(subtotalNeto * 0.19);
                const otrosImpuestosVal = showInvoiceDetail.otrosImpuestos ?? Math.round(subtotalNeto * 0.015);

                return (
                  <div className="space-y-4">
                    {showInvoiceDetail.detallesTrabajadores && showInvoiceDetail.detallesTrabajadores.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-indigo-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">Nomina e Imputación por Colaborador</h5>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden text-[10.5px]">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[8.5px]">
                              <tr>
                                <th className="px-3 py-2">Colaborador</th>
                                <th className="px-3 py-2">Puesto</th>
                                <th className="px-3 py-2 text-right">Salario Base</th>
                                <th className="px-3 py-2 text-right">EOR Fee</th>
                                <th className="px-3 py-2 text-right">Beneficios</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {showInvoiceDetail.detallesTrabajadores.map((d: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="px-3 py-2 font-bold text-slate-900">{d.nombre}</td>
                                  <td className="px-3 py-2 text-slate-500">{d.puesto}</td>
                                  <td className="px-3 py-2 text-right font-mono">{d.salario?.toLocaleString() || '0'} {showInvoiceDetail.moneda}</td>
                                  <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-700">{d.fee?.toLocaleString() || baseFeeVal} {showInvoiceDetail.moneda}</td>
                                  <td className="px-3 py-2 text-right font-mono text-slate-600">{d.beneficios?.toLocaleString() || '0'} {showInvoiceDetail.moneda}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <h5 className="text-indigo-900 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 pb-1">Desglose Paramétrico de Fee e Impuestos</h5>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[9px]">
                            <tr>
                              <th className="px-3 py-2">Concepto Liquidado</th>
                              <th className="px-3 py-2 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            <tr>
                              <td className="px-3 py-2">Base EOR Management Fee (Costo Operación)</td>
                              <td className="px-3 py-2 text-right font-mono font-bold">{baseFeeVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Beneficios Adicionales Habilitados y Reembolsos</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">{beneficiosVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                            </tr>
                            {descuentosVal > 0 && (
                              <tr>
                                <td className="px-3 py-2 text-rose-600">Descuento de Volumen Comercial (-)</td>
                                <td className="px-3 py-2 text-right font-mono text-rose-600">- {descuentosVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="px-3 py-2">Comisión por Gestión Bancaria e Ingress</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">+{comisionVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Impuesto de Retención en la Fuente (WHT)</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">-{whtVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Impuesto sobre Valor Agregado (IVA / VAT)</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">+{ivaVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2">Otros Impuestos Regulatorios Locales</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">+{otrosImpuestosVal.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <div className="w-1/2 text-right space-y-1">
                        <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                          <span>Subtotal Neto Fee:</span>
                          <span className="font-mono">{subtotalNeto.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</span>
                        </div>
                        <div className="flex justify-between font-bold text-indigo-900 text-sm border-t border-indigo-100 pt-2">
                          <span>Monto Total Cobrado:</span>
                          <span className="font-mono text-lg font-black">{showInvoiceDetail.totalFacturado.toLocaleString(undefined, {minimumFractionDigits: 2})} {showInvoiceDetail.moneda}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-indigo-50/50 rounded-2xl text-[9px] text-slate-500 text-center leading-relaxed">
                Este comprobante de cobro detalla los servicios de Employer of Record prestados por Quick Hire Latam S.R.L. de acuerdo con el contrato mercantil comercial firmado.
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowInvoiceDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateTicket && (
        <div id="create-ticket-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Abrir Ticket de Soporte</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Cuéntanos en qué podemos ayudarte hoy.</p>
              </div>
              <button onClick={() => setShowCreateTicket(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!ticketAsunto.trim() || !ticketDescripcion.trim()) return;
              setSubmittingTicket(true);
              try {
                const targetCid = cliente?.id || selectedClientId || user.clienteId || '';
                const targetCname = cliente?.empresa || 'Empresa Cliente';
                await api.createTicket({
                  clienteId: targetCid,
                  clienteNombre: targetCname,
                  solicitanteNombre: user.nombre || 'Usuario Cliente',
                  solicitanteEmail: user.correo || 'cliente@empresa.com',
                  solicitanteRol: 'cliente',
                  asunto: ticketAsunto,
                  descripcion: ticketDescripcion,
                  categoria: ticketCategoria,
                  prioridad: ticketPrioridad,
                });
                setShowCreateTicket(false);
                setTicketAsunto('');
                setTicketDescripcion('');
                setTicketCategoria('Soporte General');
                setTicketPrioridad('Media');
                // Refresh tickets
                const ticketsList = await api.getTickets().catch(() => []);
                const clientTickets = ticketsList.filter(t => 
                  (targetCid && t.clienteId === targetCid) ||
                  (targetCname && t.clienteNombre?.toLowerCase().includes(targetCname.toLowerCase())) ||
                  (user.correo && t.solicitanteEmail?.toLowerCase() === user.correo.toLowerCase()) ||
                  (user.clienteId && t.clienteId === user.clienteId)
                );
                setTickets(clientTickets.length > 0 ? clientTickets : ticketsList);
              } catch (err) {
                alert('No se pudo abrir el ticket de soporte.');
              } finally {
                setSubmittingTicket(false);
              }
            }} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Categoría</label>
                  <select
                    value={ticketCategoria}
                    onChange={(e) => setTicketCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Soporte General">Soporte General</option>
                    <option value="Nómina y Pagos">Nómina y Pagos</option>
                    <option value="Contratos y Adendums">Contratos y Adendums</option>
                    <option value="Facturación">Facturación</option>
                    <option value="Altas y Bajas">Altas y Bajas</option>
                    <option value="Consultas Laborales">Consultas Laborales</option>
                    <option value="Beneficios">Beneficios</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Prioridad</label>
                  <select
                    value={ticketPrioridad}
                    onChange={(e) => setTicketPrioridad(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Baja">Baja (48h resolución)</option>
                    <option value="Media">Media (24h resolución)</option>
                    <option value="Alta">Alta (12h resolución)</option>
                    <option value="Crítica">Crítica (4h resolución)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Asunto / Tema <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Error en dispersión de aguinaldo o Dudas de retención"
                  value={ticketAsunto}
                  onChange={(e) => setTicketAsunto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Descripción Detallada <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe detalladamente el problema, incluyendo nombres de colaboradores, montos o periodos involucrados..."
                  value={ticketDescripcion}
                  onChange={(e) => setTicketDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTicket(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  {submittingTicket ? 'Creando...' : 'Crear Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CASH PAYMENT SUPPORT UPLOAD MODAL */}
      {showSoporteModal && (
        <div id="soporte-pago-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Cargar Soporte de Pago</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Sube el comprobante de pago de contado en USD para activar tu servicio.</p>
              </div>
              <button onClick={() => setShowSoporteModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSubirSoporte} className="p-5 space-y-4">
              {soporteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {soporteError}
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>ID Documento / Pago:</span>
                  <span className="font-mono font-bold text-slate-900">{showSoporteModal.id}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Concepto:</span>
                  <span className="font-medium text-slate-800">
                    {'concepto' in showSoporteModal ? showSoporteModal.concepto : `Factura ${showSoporteModal.periodo || ''}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Monto / Saldo:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {'montoUsd' in showSoporteModal 
                      ? `$${showSoporteModal.montoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                      : `${(showSoporteModal.saldoPendiente || showSoporteModal.totalFacturado).toLocaleString()} ${showSoporteModal.moneda || 'USD'}`
                    }
                  </span>
                </div>
                {'monedaLocal' in showSoporteModal && showSoporteModal.monedaLocal && (
                  <div className="flex justify-between text-slate-500 font-semibold text-[10px] border-t border-slate-100 pt-1 mt-1">
                    <span>Equivalente Aplicado:</span>
                    <span className="font-mono font-bold text-slate-600">
                      {(showSoporteModal.montoUsd * showSoporteModal.tipoCambio).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {showSoporteModal.monedaLocal}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Método de Pago Utilizado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={soporteMetodo}
                  onChange={(e) => setSoporteMetodo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Transferencia Bancaria Internacional (WIRE/SWIFT)">Transferencia Bancaria Internacional (WIRE/SWIFT)</option>
                  <option value="Transferencia ACH Local USD">Transferencia ACH Local USD</option>
                  <option value="Depósito Bancario Directo">Depósito Bancario Directo</option>
                  <option value="Pago por Tarjeta de Crédito Corporativa">Pago por Tarjeta de Crédito Corporativa</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fecha de Ejecución del Pago <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={soporteFecha}
                  onChange={(e) => setSoporteFecha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Drag and Drop File Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Comprobante de Pago (PDF, JPG, PNG - Máx 2MB) <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : soporteArchivo 
                        ? 'border-emerald-400 bg-emerald-50/20' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="file"
                    id="file-soporte"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file-soporte" className="cursor-pointer block space-y-1.5">
                    <UploadCloud className={`w-8 h-8 mx-auto ${soporteArchivo ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {soporteArchivoNombre ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">{soporteArchivoNombre}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">¡Archivo cargado con éxito!</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">Arrastra tu comprobante aquí</p>
                        <p className="text-[10px] text-slate-400">o haz clic para explorar en tu equipo</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSoporteModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1"
                >
                  <span>Enviar Soporte para Validación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRACT EMAIL DISPATCH MODAL (INDIVIDUAL & MASS DISPATCH) */}
      {showEmailModal && (
        <div id="email-contrato-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-700/60 rounded-2xl">
                  <Mail className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {showEmailModal.mode === 'bulk' ? 'Envío Masivo de Contratos Laborales' : 'Envío de Contrato Laboral por Correo'}
                  </h3>
                  <p className="text-[10px] text-indigo-200 mt-0.5">
                    {showEmailModal.mode === 'bulk'
                      ? `Se despachará a ${showEmailModal.targets.length} colaborador(es) según el correo de su ficha.`
                      : `Destinatario: ${showEmailModal.targets[0]?.workerName} (${showEmailModal.targets[0]?.workerEmail})`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEmailModal(null)} 
                className="text-indigo-200 hover:text-white font-bold text-xl px-2 py-1 rounded-lg transition hover:bg-white/10"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {showEmailModal.result && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
                  showEmailModal.result.startsWith('¡Éxito') 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {showEmailModal.result}
                </div>
              )}

              {/* Recipient list summary */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Destinatarios ({showEmailModal.targets.length})
                </label>
                <div className="border border-slate-200/80 rounded-2xl max-h-36 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 p-1">
                  {showEmailModal.targets.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 text-[10.5px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[9px]">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-slate-900">{t.workerName}</strong>
                          <span className="text-slate-400 ml-1.5 font-normal">({t.workerPuesto || 'Colaborador'})</span>
                        </div>
                      </div>
                      <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg text-[9.5px]">
                        {t.workerEmail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Asunto del Correo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={showEmailModal.asunto}
                  onChange={(e) => setShowEmailModal(prev => prev ? { ...prev, asunto: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cuerpo del Mensaje / Instrucciones de Firma <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={showEmailModal.mensaje}
                  onChange={(e) => setShowEmailModal(prev => prev ? { ...prev, mensaje: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Note */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[10px] text-indigo-900 flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Cada correo adjuntará automáticamente el <strong>Contrato Individual de Trabajo formal en formato digital</strong> correspondiente al colaborador, listo para ser revisado y firmado.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={showEmailModal.sending || !showEmailModal.asunto.trim()}
                onClick={handleExecuteSendEmails}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>
                  {showEmailModal.sending 
                    ? 'Despachando Correos...' 
                    : showEmailModal.mode === 'bulk' 
                      ? `Despachar a Todos (${showEmailModal.targets.length})` 
                      : 'Enviar Correo Ahora'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER MANUAL MODAL */}
      <UserManualModal
        user={user}
        lang={lang}
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
    </div>
  );
}
