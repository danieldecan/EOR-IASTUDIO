import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api';
import { Cliente, Factura, User, Pago, PagoContadoUSD, HistorialLiberacion, Language, i18n, LATAM_COUNTRIES, COUNTRY_FLAGS } from '../types';
import OperationalAlertsPanel from './OperationalAlertsPanel';
import ManagementReportsPanel from './ManagementReportsPanel';
import LanguageSelector from './LanguageSelector';
import UserManualModal from './UserManualModal';
import { PWAInstallButton } from './PWAInstallButton';
import { tText, translateStatus, tr, translateRole } from '../utils/i18n';
import { 
  Building2, Users, Receipt, Calendar, CreditCard, 
  Wallet, Printer, CheckCircle, ArrowRight, Info, HelpCircle, BookOpen,
  FileText, ShieldAlert, ShieldCheck, BarChart3, TrendingUp, Globe, Gift, Plus, AlertCircle, BadgeHelp,
  Coins, Eye, LogOut
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface SupraDashboardProps {
  user: User;
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
  onLogout: () => void;
}

export default function SupraDashboard({ user, lang, onLanguageChange, onLogout }: SupraDashboardProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [beneficios, setBeneficios] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagosContado, setPagosContado] = useState<PagoContadoUSD[]>([]);
  const [historialLiberacion, setHistorialLiberacion] = useState<HistorialLiberacion[]>([]);
  
  // Manual release correction states
  const [showManualReleaseModal, setShowManualReleaseModal] = useState<Cliente | null>(null);
  const [manualReleaseEstado, setManualReleaseEstado] = useState('Servicio liberado');
  const [manualReleaseMotivo, setManualReleaseMotivo] = useState('');
  const [manualReleaseObs, setManualReleaseObs] = useState('');
  const [manualReleaseError, setManualReleaseError] = useState('');
  
  // Cash Payment Review states
  const [reviewPagoContado, setReviewPagoContado] = useState<PagoContadoUSD | null>(null);
  const [rechazoComentarios, setRechazoComentarios] = useState('');
  const [pagoReviewError, setPagoReviewError] = useState('');

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'billing' | 'benefits' | 'tickets' | 'operational_alerts' | 'reports'>('overview');
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Support Ticket Form/Modal states
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketAsunto, setTicketAsunto] = useState('');
  const [ticketDescripcion, setTicketDescripcion] = useState('');
  const [ticketReply, setTicketReply] = useState('');
  const [ticketClienteId, setTicketClienteId] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Benefits Form Fields
  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [benefitNombre, setBenefitNombre] = useState('');
  const [benefitTipo, setBenefitTipo] = useState<'Salud' | 'Seguro Vida' | 'Equipos' | 'Viáticos' | 'Otros'>('Salud');
  const [benefitModalidad, setBenefitModalidad] = useState<'Mensual' | 'Único' | 'Anual'>('Mensual');
  const [benefitMoneda, setBenefitMoneda] = useState('USD');
  const [benefitCosto, setBenefitCosto] = useState(50);
  const [benefitAplicaTrabajador, setBenefitAplicaTrabajador] = useState(true);
  const [benefitAplicaCliente, setBenefitAplicaCliente] = useState(true);
  const [benefitEstado, setBenefitEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [benefitVigencia, setBenefitVigencia] = useState('2026-12-31');
  const [benefitError, setBenefitError] = useState('');
  
  // Payment Modal States
  const [payingInvoice, setPayingInvoice] = useState<Factura | null>(null);
  const [isUnifiedPayment, setIsUnifiedPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'transfer'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [payingInProcess, setPayingInProcess] = useState(false);

  // PDF Preview State
  const [previewInvoice, setPreviewInvoice] = useState<Factura | null>(null);
  const [isUnifiedPreview, setIsUnifiedPreview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allClientes, allFacturas, allBeneficios, allPagosContado, allHistorialLiberacion] = await Promise.all([
        api.getClientes(),
        api.getFacturas(),
        api.getBeneficios(),
        api.getPagosContado().catch(() => []),
        api.getHistorialLiberacion().catch(() => [])
      ]);
      
      // Filter clients that belong to this supracliente
      const userEmailLower = (user.correo || '').toLowerCase().trim();
      const userClientId = (user.clienteId || '').trim();
      
      // If user has no explicit clienteId, try resolving by matching contact email or company association
      const parentClient = userClientId 
        ? allClientes.find(c => c.id === userClientId) 
        : allClientes.find(c => c.correoContacto?.toLowerCase().trim() === userEmailLower && (c.id === 'CLI-876' || c.empresa.toLowerCase().includes('pagus')));
        
      const effectiveParentId = userClientId || parentClient?.id || '';
      const parentEmpresaLower = parentClient?.empresa?.toLowerCase()?.trim() || (userEmailLower.includes('pagus') ? 'pagus llc' : '');

      const isGlobalHoldingAdmin = userEmailLower === 'supracliente-eor-peo@grupostt.com';

      const managedClientes = allClientes.filter(c => {
        // Direct assignment to this user's email
        if (c.supraclienteId && c.supraclienteId.toLowerCase().trim() === userEmailLower) return true;
        // The holding client itself (e.g. PAGUS LLC CLI-876)
        if (effectiveParentId && c.id === effectiveParentId) return true;
        // Subsidiary whose supraclienteId is the holding client ID
        if (effectiveParentId && c.supraclienteId && c.supraclienteId.trim() === effectiveParentId) return true;
        // Subsidiary whose supraclienteId is any PAGUS ID if parent is PAGUS
        if (parentEmpresaLower.includes('pagus') || (userEmailLower === 'guadalupe.gonzalez@grupostt.com')) {
          if (c.id === 'CLI-876') return true;
          if (c.supraclienteId === 'CLI-876' || c.supraclienteId === 'guadalupe.gonzalez@grupostt.com') return true;
          if (c.supraclienteId && c.supraclienteId.toLowerCase().includes('pagus')) return true;
          if (c.proyecto && c.proyecto.toLowerCase().includes('pagus')) return true;
        }
        // Subsidiary whose supraclienteId is the parent company name
        if (parentEmpresaLower && c.supraclienteId && c.supraclienteId.toLowerCase().trim() === parentEmpresaLower) return true;
        // Match user's explicit ID
        if ((user as any).id && c.supraclienteId === (user as any).id) return true;
        return false;
      });

      // If demo supra account or global holding, show all clients; otherwise show strictly managed clients
      const effectiveClientes = isGlobalHoldingAdmin 
        ? allClientes 
        : (managedClientes.length > 0 ? managedClientes : (userEmailLower === 'supracliente-eor-peo@grupostt.com' ? allClientes : []));
      setClientes(effectiveClientes);

      // Filter invoices for these clients
      const managedIds = effectiveClientes.map(c => c.id);
      const filteredFacturas = allFacturas.filter(f => managedIds.includes(f.clienteId));
      setFacturas(filteredFacturas);

      // Filter payments for these clients
      const filteredPagos = allPagosContado.filter(p => managedIds.includes(p.clienteId));
      setPagosContado(filteredPagos);

      // Set benefits
      setBeneficios(allBeneficios);

      // Set liberation history
      setHistorialLiberacion(allHistorialLiberacion || []);

      // Fetch and filter support tickets (either created for their clients, or directly by supracliente)
      const allTickets = await api.getTickets().catch(() => []);
      const managedTickets = allTickets.filter(t => 
        managedIds.includes(t.clienteId) || 
        t.clienteId === user.correo
      );
      setTickets(managedTickets);

      if (activeTicket) {
        const fresh = allTickets.find(tk => tk.id === activeTicket.id);
        if (fresh) setActiveTicket(fresh);
      }
    } catch (err) {
      console.error('Error cargando datos para supracliente:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process USD Cash Payment activation validation
  const handleValidarPagoContado = async (pagoId: string, aprobado: boolean) => {
    try {
      setPagoReviewError('');
      if (!aprobado && !rechazoComentarios.trim()) {
        setPagoReviewError('Debe especificar un comentario o motivo de rechazo.');
        return;
      }
      await api.validarPagoContado(pagoId, {
        estado: aprobado ? 'Validado' : 'Rechazado',
        observaciones: aprobado ? 'Pago validado y verificado correctamente.' : rechazoComentarios,
        usuario: user.correo
      });
      setReviewPagoContado(null);
      setRechazoComentarios('');
      loadData();
    } catch (err: any) {
      setPagoReviewError(err.message || 'Error al procesar la validación.');
    }
  };

  const handleActualizarEstadoServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManualReleaseModal) return;
    if (!manualReleaseMotivo.trim()) {
      setManualReleaseError('Debe ingresar un motivo para realizar la corrección del estado.');
      return;
    }
    try {
      setManualReleaseError('');
      await api.actualizarEstadoServicio({
        clienteId: showManualReleaseModal.id,
        estadoNuevo: manualReleaseEstado,
        motivo: manualReleaseMotivo,
        observaciones: manualReleaseObs,
        usuario: user.correo
      });
      setShowManualReleaseModal(null);
      setManualReleaseMotivo('');
      setManualReleaseObs('');
      loadData();
    } catch (err: any) {
      setManualReleaseError(err.message || 'Error al actualizar el estado de liberación.');
    }
  };

  const handleCreateBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBenefitError('');
    if (!benefitNombre.trim()) {
      setBenefitError('El nombre del beneficio es obligatorio.');
      return;
    }
    try {
      await api.createBeneficio({
        nombre: benefitNombre,
        tipo: benefitTipo,
        modalidad: benefitModalidad,
        moneda: benefitMoneda,
        costo: Number(benefitCosto),
        aplicaTrabajador: benefitAplicaTrabajador,
        aplicaCliente: benefitAplicaCliente,
        estado: benefitEstado,
        vigencia: benefitVigencia,
        usuario: user.correo
      });

      setShowAddBenefitModal(false);
      // Reset fields
      setBenefitNombre('');
      setBenefitTipo('Salud');
      setBenefitModalidad('Mensual');
      setBenefitMoneda('USD');
      setBenefitCosto(50);
      setBenefitAplicaTrabajador(true);
      setBenefitAplicaCliente(true);
      setBenefitEstado('Activo');
      setBenefitVigencia('2026-12-31');

      loadData();
    } catch (err: any) {
      setBenefitError('Error al crear beneficio: ' + (err.message || err));
    }
  };

  useEffect(() => {
    loadData();
  }, [user.correo]);

  // Distinct countries represented across all holding subsidiaries
  const holdingCountries = useMemo(() => {
    const list = new Set<string>();
    clientes.forEach(c => {
      if (c.pais && c.pais !== 'Regional') list.add(c.pais);
      if (c.paisesOperacion && Array.isArray(c.paisesOperacion)) {
        c.paisesOperacion.forEach(p => list.add(p));
      }
    });
    return Array.from(list);
  }, [clientes]);

  const [countryFilter, setCountryFilter] = useState<string>('All');

  const checkCountryMatch = (itemPais?: string, isRegional?: boolean, opCountries?: string[]) => {
    if (countryFilter === 'All') return true;
    if (countryFilter === 'Regional') {
      return isRegional || itemPais === 'Regional';
    }
    if (itemPais === countryFilter) return true;
    if ((isRegional || itemPais === 'Regional') && opCountries && opCountries.includes(countryFilter)) return true;
    return false;
  };

  const filteredClientes = clientes.filter(c => checkCountryMatch(c.pais, c.esRegional, c.paisesOperacion));

  const filteredFacturas = facturas.filter(f => {
    if (countryFilter === 'All') return true;
    const client = clientes.find(c => c.id === f.clienteId);
    if (!client) return true;
    return checkCountryMatch(client.pais, client.esRegional, client.paisesOperacion);
  });

  // Compute stats
  const totalClients = clientes.length;
  const totalEmployees = filteredClientes.reduce((acc, c) => acc + (c.trabajadoresCargados || 0), 0);
  
  const pendingInvoices = filteredFacturas.filter(f => f.estado !== 'Pagada' && f.estado !== 'Anulada');
  const totalPendingAmount = pendingInvoices.reduce((acc, f) => acc + f.saldoPendiente, 0);
  
  const paidInvoices = filteredFacturas.filter(f => f.estado === 'Pagada');
  const totalPaidAmount = paidInvoices.reduce((acc, f) => acc + f.totalFacturado, 0);

  // Mock Pay Action
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayingInProcess(true);

    try {
      if (isUnifiedPayment) {
        // Pay all pending invoices in one go
        await Promise.all(
          pendingInvoices.map(f => 
            api.updateFactura(f.id, { 
              estado: 'Pagada', 
              observaciones: `Pago unificado por Supra Cliente. Método: ${paymentMethod.toUpperCase()}`,
              usuario: user.correo 
            })
          )
        );
      } else if (payingInvoice) {
        await api.updateFactura(payingInvoice.id, {
          estado: 'Pagada',
          observaciones: `Pago individual por Supra Cliente. Método: ${paymentMethod.toUpperCase()}`,
          usuario: user.correo
        });
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setPayingInvoice(null);
        setIsUnifiedPayment(false);
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCvv('');
        loadData();
      }, 2500);
    } catch (err) {
      alert('Error al procesar el pago ficticio.');
    } finally {
      setPayingInProcess(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare unified invoice data for preview/payment
  const getUnifiedInvoiceDetails = (): Factura => {
    const totalBaseFee = pendingInvoices.reduce((acc, f) => acc + (f.baseFee || f.totalFacturado * 0.7), 0);
    const totalIva = pendingInvoices.reduce((acc, f) => acc + (f.iva || f.totalFacturado * 0.15), 0);
    const totalComision = pendingInvoices.reduce((acc, f) => acc + (f.comisionBancaria || 0), 0);
    const totalWht = pendingInvoices.reduce((acc, f) => acc + (f.wht || 0), 0);
    const totalOtrosImpuestos = pendingInvoices.reduce((acc, f) => acc + (f.otrosImpuestos || 0), 0);
    const totalBeneficios = pendingInvoices.reduce((acc, f) => acc + (f.beneficiosCobrados || 0), 0);
    const totalDescuentos = pendingInvoices.reduce((acc, f) => acc + (f.descuentos || 0), 0);
    const totalTrabajadores = pendingInvoices.reduce((acc, f) => acc + f.cantidadTrabajadores, 0);

    // Collect all employee details
    const allDetalles: any[] = [];
    pendingInvoices.forEach(f => {
      if (f.detallesTrabajadores) {
        f.detallesTrabajadores.forEach(d => {
          allDetalles.push({
            ...d,
            clienteNombre: f.clienteNombre
          });
        });
      }
    });

    return {
      id: 'FAC-UNIF-HOLDING',
      clienteId: 'SUPRA-HOLDING',
      clienteNombre: 'Holding Corporativo - Unificado',
      pais: 'Multinacional',
      moneda: 'USD',
      periodo: pendingInvoices.length > 0 ? pendingInvoices[0].periodo : 'N/A',
      cantidadTrabajadores: totalTrabajadores,
      feeAplicado: 0,
      beneficiosCobrados: totalBeneficios,
      descuentos: totalDescuentos,
      impuestos: totalIva + totalOtrosImpuestos,
      totalFacturado: totalPendingAmount,
      pagosAplicados: 0,
      saldoPendiente: totalPendingAmount,
      estado: 'Emitida',
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      baseFee: totalBaseFee,
      iva: totalIva,
      comisionBancaria: totalComision,
      wht: totalWht,
      otrosImpuestos: totalOtrosImpuestos,
      detallesTrabajadores: allDetalles
    };
  };

  const unifiedInvoice = getUnifiedInvoiceDetails();

  // Charts
  const chartData = clientes.map(c => {
    const clientPending = facturas
      .filter(f => f.clienteId === c.id && f.estado !== 'Pagada')
      .reduce((sum, f) => sum + f.saldoPendiente, 0);
    const clientPaid = facturas
      .filter(f => f.clienteId === c.id && f.estado === 'Pagada')
      .reduce((sum, f) => sum + f.totalFacturado, 0);
    return {
      name: c.empresa,
      'Pendiente': clientPending,
      'Pagado': clientPaid,
      'Empleados': c.trabajadoresCargados || 0
    };
  });

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden text-slate-900">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 print:hidden">
        {/* Sidebar Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-2xl shadow-inner">
            <Building2 className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              Quick Hire
            </h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Supra Cliente</p>
          </div>
        </div>

        {/* User Badge Info */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Holding Corporativo</p>
          <p className="text-xs font-extrabold text-white truncate mt-0.5">{user.nombre}</p>
          <p className="text-[10px] text-slate-400 truncate">{user.correo}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>{tText('Indicadores Operativos', lang)}</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{tText('Directorio de Clientes Activos', lang)}</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>{tText('Facturación y Control de Pagos', lang)}</span>
          </button>

          <button
            onClick={() => setActiveTab('benefits')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              activeTab === 'benefits' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>{tText('Beneficios', lang)}</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BadgeHelp className="w-4 h-4 shrink-0" />
            <span>{tText('Módulo de Soporte y Tickets', lang)}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>{tText('Reportes de Gestión Comercial', lang)}</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold bg-slate-950/20 text-center">
          Quick Hire &bull; Portal Supra Cliente
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-xs print:hidden">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === 'overview' && tText('Panel de Control Corporativo • Indicadores', lang)}
              {activeTab === 'clients' && tText('Directorio de Empresas Clientes Holding', lang)}
              {activeTab === 'billing' && tText('Facturación Consolidada y Pagos Unificados', lang)}
              {activeTab === 'benefits' && tText('Módulo de Beneficios Globales', lang)}
              {activeTab === 'tickets' && tText('Centro de Soporte y Casos', lang)}
              {activeTab === 'reports' && tText('Reportes de Gestión Corporativa', lang)}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold">
              {tText('Titular:', lang)} <strong className="text-slate-700">{user.nombre}</strong> ({user.correo})
            </p>
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
            {onLanguageChange && (
              <LanguageSelector currentLanguage={lang} onLanguageChange={onLanguageChange} />
            )}
            <button 
              onClick={onLogout}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl transition-all border border-rose-100 font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{i18n[lang].auth.logout}</span>
            </button>
          </div>
        </header>

        {/* MULTI-COUNTRY HOLDING SUBSIDIARIES BAR */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              Filiales por País:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCountryFilter('All')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  countryFilter === 'All'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌎 Todas las Filiales ({clientes.length})
              </button>

              {clientes.some(c => c.pais === 'Regional' || c.esRegional) && (
                <button
                  type="button"
                  onClick={() => setCountryFilter('Regional')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    countryFilter === 'Regional'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <span>🌎 Regional LATAM</span>
                  <span className="text-[9px] bg-indigo-200/60 px-1.5 py-0.5 rounded-full font-bold">
                    {clientes.filter(c => c.pais === 'Regional' || c.esRegional).length}
                  </span>
                </button>
              )}

              {holdingCountries.map(country => {
                const count = clientes.filter(c => c.pais === country || (c.paisesOperacion && c.paisesOperacion.includes(country))).length;
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => setCountryFilter(country)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      countryFilter === country
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{COUNTRY_FLAGS[country] || '📍'}</span>
                    <span>{country}</span>
                    <span className="text-[9px] bg-slate-200/80 px-1.5 py-0.5 rounded-full font-bold text-slate-700">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-semibold">
              Holding: <strong className="text-slate-800">{user.nombre || user.correo}</strong> ({holdingCountries.length} {holdingCountries.length === 1 ? 'país' : 'países'} de presencia)
            </span>
          </div>
        </div>

        {/* USER MANUAL MODAL */}
        <UserManualModal 
          user={user} 
          lang={lang} 
          isOpen={isManualOpen} 
          onClose={() => setIsManualOpen(false)} 
        />

        <div className="flex-1 p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              {/* STATS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filiales / Empresas</span>
                    <span className="text-2xl font-black text-slate-900">{filteredClientes.length} <span className="text-xs text-slate-400 font-normal">/ {clientes.length}</span></span>
                    <span className="text-[10px] text-emerald-600 font-bold block">↑ Operación Multi-País</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Presencia Territorial</span>
                    <span className="text-2xl font-black text-purple-700">{holdingCountries.length} Países</span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate max-w-[170px]" title={holdingCountries.join(', ')}>
                      {holdingCountries.join(', ') || 'Red LATAM'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Headcount Total</span>
                    <span className="text-2xl font-black text-slate-900">{totalEmployees}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Trabajadores activos en EOR</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center space-x-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pendiente de Pago</span>
                    <span className="text-2xl font-black text-rose-600">{totalPendingAmount.toLocaleString()} USD</span>
                    <span className="text-[10px] text-rose-500 font-bold block">{pendingInvoices.length} facturas emitidas</span>
                  </div>
                </div>
              </div>

              {/* UNIFIED PAYMENT CALLOUT */}
              {totalPendingAmount > 0 && (
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <span className="bg-indigo-600 text-[9px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider inline-block">Factura Unificada Disponible</span>
                    <h3 className="text-lg font-black">¿Deseas pagar todas las facturas de tus clientes juntas?</h3>
                    <p className="text-xs text-indigo-200 max-w-2xl">
                      Al consolidar tus cobros, puedes realizar una sola transferencia o cargo con tarjeta. Ahorra comisiones bancarias y simplifica el cierre contable de {totalClients} empresas.
                    </p>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setPreviewInvoice(unifiedInvoice);
                        setIsUnifiedPreview(true);
                      }}
                      className="px-4 py-2.5 bg-indigo-800/80 hover:bg-indigo-800 text-indigo-100 text-xs font-bold rounded-xl transition-all border border-indigo-700/50"
                    >
                      Previsualizar Factura Unificada
                    </button>
                    <button
                      onClick={() => {
                        setPayingInvoice(unifiedInvoice);
                        setIsUnifiedPayment(true);
                        setPaymentMethod('card');
                      }}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1"
                    >
                      <span>Pagar Todo Consolidado</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Pending vs Paid Chart */}
                <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span>Volumen de Cobro y Estado Financiero por Cliente</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Cifras expresadas en USD</span>
                  </div>
                  
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} USD`} />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                        <Bar dataKey="Pagado" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Pendiente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Headcount Distribution Chart */}
                <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Headcount por Cliente</span>
                  </h3>

                  <div className="h-44 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="Empleados"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-50 pt-3">
                    {clientes.map((c, idx) => (
                      <div key={c.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="font-semibold text-slate-700">{c.empresa}</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">{c.trabajadoresCargados || 0} emp.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DETAILED PENDING TABLE */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Resumen Detallado de Clientes y Saldos</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Servicio</th>
                        <th className="px-4 py-3">País de Operación</th>
                        <th className="px-4 py-3 text-center">Talento Activo</th>
                        <th className="px-4 py-3">Último Periodo</th>
                        <th className="px-4 py-3 text-right">Saldo Pendiente</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No hay filiales asociadas para el país seleccionado ({countryFilter}).
                          </td>
                        </tr>
                      ) : (
                        filteredClientes.map(c => {
                          const clientInvoices = facturas.filter(f => f.clienteId === c.id);
                          const lastInvoice = clientInvoices[clientInvoices.length - 1];
                          const pendingBalance = clientInvoices
                            .filter(f => f.estado !== 'Pagada')
                            .reduce((sum, f) => sum + f.saldoPendiente, 0);

                          return (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="px-4 py-4 font-bold text-slate-900">{c.empresa}</td>
                              <td className="px-4 py-4 font-medium text-indigo-700">{c.servicioContratado}</td>
                              <td className="px-4 py-4">
                                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                  <span>{COUNTRY_FLAGS[c.pais] || '🌎'}</span>
                                  <span>{c.pais}</span>
                                </span>
                                {c.esRegional && c.paisesOperacion && c.paisesOperacion.length > 0 && (
                                  <span className="text-[9px] text-slate-400 block truncate max-w-[130px]" title={c.paisesOperacion.join(', ')}>
                                    {c.paisesOperacion.join(', ')}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center font-bold font-mono">{c.trabajadoresCargados}</td>
                              <td className="px-4 py-4 font-semibold text-slate-500">{lastInvoice ? lastInvoice.periodo : 'N/A'}</td>
                              <td className="px-4 py-4 text-right font-black font-mono text-rose-600">{pendingBalance.toLocaleString()} {c.moneda}</td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => setActiveTab('billing')}
                                  className="text-indigo-600 hover:text-indigo-500 font-bold text-[11px]"
                                >
                                  Administrar Facturas →
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in print:hidden">
              <div>
                <h2 className="text-lg font-black text-slate-900">Consulta de Clientes de la Corporación</h2>
                <p className="text-slate-500 text-xs">Información comercial, contratos activos, y sociedades vinculadas para la facturación.</p>
              </div>

              {filteredClientes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 font-semibold">
                  No hay filiales asociadas para el país seleccionado ({countryFilter}).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredClientes.map(c => (
                    <div key={c.id} className="border border-slate-100 rounded-3xl p-5 hover:shadow-md transition-all space-y-4 bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{c.empresa}</h3>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {c.estado}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 py-3 font-semibold text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">Servicio Contratado:</span>
                          <span className="text-slate-900">{c.servicioContratado}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">País de Operación:</span>
                          <span className="text-slate-900 font-bold flex items-center gap-1.5">
                            <span>{COUNTRY_FLAGS[c.pais] || '🌎'}</span>
                            <span>{c.pais}</span>
                          </span>
                          {c.esRegional && c.paisesOperacion && c.paisesOperacion.length > 0 && (
                            <span className="text-[9px] text-slate-400 block truncate max-w-[160px]" title={c.paisesOperacion.join(', ')}>
                              {c.paisesOperacion.join(', ')}
                            </span>
                          )}
                        </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Razón Social:</span>
                        <span className="text-slate-900">{c.razonSocial || 'Tech Solutions S.A.'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Cédula Jurídica / ID Legal:</span>
                        <span className="text-slate-900 font-mono">{c.cedulaJuridica || '3-101-29472'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Frecuencia Nómina:</span>
                        <span className="text-slate-900">{c.frecuenciaNomina || 'Mensual'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Fecha Inicio Contrato:</span>
                        <span className="text-slate-900 font-mono">{c.fechaInicioContrato || '2026-01-15'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-400 block">Contacto Comercial del Cliente:</span>
                      <div className="flex justify-between text-slate-800 font-semibold">
                        <span>{c.nombreContacto} ({c.posicion || 'Director Financiero'})</span>
                        <span className="text-indigo-600 font-mono">{c.telefonoContacto}</span>
                      </div>
                      <span className="text-slate-500 font-mono block">{c.correoContacto}</span>
                    </div>

                    {c.sociedadContratacion && (
                      <div className="bg-indigo-50 p-3 rounded-xl text-xs font-semibold text-indigo-900">
                        <span className="text-[9px] text-indigo-600 block uppercase font-black">Sociedad Contratación y Facturación:</span>
                        {c.sociedadContratacion}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Estado EOR:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.estadoServicio === 'Servicio liberado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          c.estadoServicio === 'Pago en revisión' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                          ['Pago rechazado', 'Servicio bloqueado', 'Servicio suspendido'].includes(c.estadoServicio || '') ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.estadoServicio || 'Pendiente de contrato'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowManualReleaseModal(c);
                          setManualReleaseEstado(c.estadoServicio || 'Servicio liberado');
                          setManualReleaseMotivo('');
                          setManualReleaseObs('');
                        }}
                        className="w-full text-center py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-[10px]"
                      >
                        Corregir Estado de Liberación
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

              {/* HISTORIAL / LOG DE TRAZABILIDAD */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 pt-6 mt-6">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Bitácora de Trazabilidad: Regla de Liberación EOR</h3>
                    <p className="text-slate-500 text-[11px]">Log de auditoría de todos los cambios de estado manuales y automáticos con justificación.</p>
                  </div>
                </div>

                {historialLiberacion.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 font-semibold text-xs">No hay registros de liberación en la bitácora histórica.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-bold">
                        <tr>
                          <th className="px-4 py-3">Fecha y Hora</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Estado Anterior</th>
                          <th className="px-4 py-3">Estado Nuevo</th>
                          <th className="px-4 py-3">Usuario Autorizador</th>
                          <th className="px-4 py-3">Motivo / Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {historialLiberacion
                          .filter(h => clientes.some(cl => cl.id === h.clienteId)) // Only show for managed clients
                          .map((log) => {
                            const cl = clientes.find(cl => cl.id === log.clienteId);
                            return (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 font-mono text-[10px] text-slate-500">
                                  {new Date(log.fecha).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 font-semibold">
                                  <div className="text-slate-900">{cl?.empresa || 'Cliente Desconocido'}</div>
                                  <div className="text-[9px] text-slate-400">ID: {log.clienteId}</div>
                                </td>
                                <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                                  {log.estadoAnterior || '---'}
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    log.estadoNuevo === 'Servicio liberado' ? 'bg-emerald-50 text-emerald-700' :
                                    log.estadoNuevo === 'Pago en revisión' ? 'bg-indigo-50 text-indigo-700 animate-pulse' :
                                    ['Pago rechazado', 'Servicio bloqueado', 'Servicio suspendido'].includes(log.estadoNuevo) ? 'bg-rose-50 text-rose-700' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {log.estadoNuevo}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-slate-600 text-[10px] font-mono">
                                  {log.usuario}
                                </td>
                                <td className="px-4 py-4 text-slate-600 font-medium">
                                  <div className="text-slate-800 font-bold">{log.motivo}</div>
                                  {log.observaciones && <div className="text-[10px] text-slate-400 mt-0.5">{log.observaciones}</div>}
                                </td>
                              </tr>
                            );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Control de Facturación e Invoices</h2>
                    <p className="text-slate-500 text-xs">Emisión de cobros individuales o generación de factura unificada corporativa.</p>
                  </div>

                  <button
                    onClick={() => {
                      setPreviewInvoice(unifiedInvoice);
                      setIsUnifiedPreview(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Factura Unificada</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">ID Factura</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Periodo</th>
                        <th className="px-4 py-3 text-center">Empleados</th>
                        <th className="px-4 py-3 text-right">Fee Base</th>
                        <th className="px-4 py-3 text-right">Impuestos / IVA</th>
                        <th className="px-4 py-3 text-right">Total Facturado</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFacturas.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-semibold">
                            No hay facturas registradas para el país seleccionado ({countryFilter}).
                          </td>
                        </tr>
                      ) : (
                        filteredFacturas.map(fac => {
                          const cl = clientes.find(c => c.id === fac.clienteId);
                          return (
                            <tr key={fac.id} className="hover:bg-slate-50 font-semibold text-slate-800">
                              <td className="px-4 py-4 font-mono font-bold text-indigo-600">{fac.id}</td>
                              <td className="px-4 py-4">
                                <div className="font-black text-slate-900">{fac.clienteNombre}</div>
                                {cl && (
                                  <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                    <span>{COUNTRY_FLAGS[cl.pais] || '📍'}</span>
                                    <span>{cl.pais}</span>
                                    {cl.esRegional && cl.paisesOperacion && cl.paisesOperacion.length > 0 && (
                                      <span className="text-[9px] text-slate-400 font-normal">
                                        ({cl.paisesOperacion.join(', ')})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 font-mono">{fac.periodo}</td>
                              <td className="px-4 py-4 text-center font-mono font-bold">{fac.cantidadTrabajadores}</td>
                              <td className="px-4 py-4 text-right font-mono">{(fac.baseFee || fac.totalFacturado * 0.8).toLocaleString()} {fac.moneda}</td>
                              <td className="px-4 py-4 text-right font-mono">{(fac.iva || fac.impuestos || 0).toLocaleString()} {fac.moneda}</td>
                              <td className="px-4 py-4 text-right font-black font-mono text-slate-950">{fac.totalFacturado.toLocaleString()} {fac.moneda}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  fac.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {fac.estado}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setPreviewInvoice(fac);
                                    setIsUnifiedPreview(false);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] transition-all font-bold cursor-pointer"
                                >
                                  Ver PDF
                                </button>
                                {fac.estado !== 'Pagada' && (
                                  <button
                                    onClick={() => {
                                      setPayingInvoice(fac);
                                      setIsUnifiedPayment(false);
                                      setPaymentMethod('card');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] transition-all font-bold cursor-pointer"
                                  >
                                    Pagar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECCIÓN COMPLEMENTARIA: VALIDACIÓN DE PAGOS DE CONTADO USD */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Validación de Pagos de Contado USD (Activación de Servicio)</h3>
                    <p className="text-slate-500 text-[11px]">Control de pagos iniciales de tus clientes para habilitación de servicios de nómina y EOR.</p>
                  </div>
                </div>

                {pagosContado.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 font-semibold text-xs">No hay solicitudes de pago de contado USD para tus clientes asignados.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-bold">
                        <tr>
                          <th className="px-4 py-3">ID Pago</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Concepto / Servicio</th>
                          <th className="px-4 py-3">Monto USD</th>
                          <th className="px-4 py-3">Moneda Local (Histórico)</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Soporte</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800 font-sans">
                        {pagosContado.map(pago => {
                          const cl = clientes.find(c => c.id === pago.clienteId);
                          return (
                            <tr key={pago.id} className="hover:bg-slate-50">
                              <td className="px-4 py-4 font-mono font-bold text-slate-900">{pago.id}</td>
                              <td className="px-4 py-4">
                                <div className="text-slate-900 font-bold">{cl?.empresa || 'Cliente Desconocido'}</div>
                                {cl && (
                                  <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                    <span>{COUNTRY_FLAGS[cl.pais] || '📍'}</span>
                                    <span>{cl.pais}</span>
                                  </div>
                                )}
                                <div className="text-[9px] text-slate-400 font-mono">ID: {pago.clienteId}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-slate-800">{pago.concepto}</div>
                                <div className="text-[10px] text-slate-400">Servicio: {pago.servicio}</div>
                              </td>
                              <td className="px-4 py-4 font-mono text-indigo-700 font-bold">
                                ${pago.montoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                              </td>
                              <td className="px-4 py-4 font-mono text-slate-600">
                                {pago.monedaLocal ? (
                                  <div className="space-y-0.5">
                                    <div>1 USD = {pago.tipoCambio} {pago.monedaLocal}</div>
                                    <div className="text-[9px] text-slate-400">Total: {(pago.montoUsd * pago.tipoCambio).toLocaleString()} {pago.monedaLocal}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-medium text-[10px]">No aplica (USD nativo)</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pago.estado === 'Validado' || pago.estado === 'Aplicado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  pago.estado === 'Soporte cargado' || pago.estado === 'En revisión' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                                  pago.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {pago.estado}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                {pago.archivoSoporte ? (
                                  <div className="space-y-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const win = window.open();
                                        if (win) {
                                          win.document.write(`<iframe src="${pago.archivoSoporte}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                        } else {
                                          alert("Habilite las ventanas emergentes.");
                                        }
                                      }}
                                      className="text-indigo-600 hover:text-indigo-500 font-bold flex items-center space-x-1"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Ver Soporte</span>
                                    </button>
                                    {pago.fechaPago && (
                                      <div className="text-[10px] text-slate-400">Fecha: {pago.fechaPago}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-medium">Sin soporte</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right">
                                {(pago.estado === 'Soporte cargado' || pago.estado === 'En revisión' || pago.estado === 'Pendiente' || pago.estado === 'Rechazado') ? (
                                  <button
                                    onClick={() => {
                                      setReviewPagoContado(pago);
                                      setRechazoComentarios('');
                                      setPagoReviewError('');
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] px-3 py-1.5 rounded-xl transition-all shadow-sm inline-block"
                                  >
                                    Revisar / Validar
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Validado por {pago.usuarioValidador || 'Admin'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BENEFITS TAB */}
          {activeTab === 'benefits' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Configuración de Beneficios Corporativos</h2>
                    <p className="text-slate-500 text-xs">Define y gestiona los planes de salud, seguros y otros beneficios extralegales aplicables a tus clientes asociados.</p>
                  </div>
                  <button
                    onClick={() => {
                      setBenefitError('');
                      setShowAddBenefitModal(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Configurar Nuevo Beneficio</span>
                  </button>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Beneficios Registrados</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{beneficios.length}</span>
                    <span className="text-[10px] text-indigo-600 font-semibold block">Disponibles para asignación</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Beneficios Activos</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1 block">
                      {beneficios.filter(b => b.estado === 'Activo').length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">En vigencia corriente</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Costo Promedio Mensual</span>
                    <span className="text-2xl font-black text-indigo-600 mt-1 block">
                      $ {Math.round(beneficios.reduce((acc, b) => acc + (b.costo || 0), 0) / (beneficios.length || 1))} USD
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Por colaborador elegible</span>
                  </div>
                </div>

                {/* Grid of Benefits Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
                  {beneficios.map((b) => (
                    <div key={b.id} className="border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Gift className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{b.nombre}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold capitalize bg-slate-100 px-2 py-0.5 rounded-full">{b.tipo}</span>
                          </div>
                        </div>
                        <span className={`h-2.5 w-2.5 rounded-full ${b.estado === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} title={b.estado}></span>
                      </div>

                      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-normal">Costo / Tarifa:</span>
                          <span className="text-slate-900 font-mono font-bold">$ {b.costo?.toLocaleString() || 0} {b.moneda || 'USD'} / {b.modalidad}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-normal">Vigencia:</span>
                          <span className="text-slate-700 font-mono">{b.vigencia || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${b.aplicaTrabajador ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                          Aplica Trabajador
                        </span>
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${b.aplicaCliente ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                          Aplica Factura Cliente
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table View of Benefits */}
                <div className="pt-4 space-y-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Historial y Detalles de Beneficios</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Nombre del Beneficio</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Modalidad</th>
                          <th className="px-4 py-3 text-right">Costo / Tarifa</th>
                          <th className="px-4 py-3 text-center">Para Trabajador</th>
                          <th className="px-4 py-3 text-center">Para Cliente</th>
                          <th className="px-4 py-3">Fin Vigencia</th>
                          <th className="px-4 py-3">Creador / Usuario</th>
                          <th className="px-4 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {beneficios.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 font-bold text-slate-900">{b.nombre}</td>
                            <td className="px-4 py-4 text-indigo-700">{b.tipo}</td>
                            <td className="px-4 py-4">{b.modalidad}</td>
                            <td className="px-4 py-4 text-right font-mono font-bold">${b.costo?.toLocaleString()} {b.moneda}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${b.aplicaTrabajador ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                {b.aplicaTrabajador ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${b.aplicaCliente ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                {b.aplicaCliente ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-mono text-slate-500">{b.vigencia || 'Sin límite'}</td>
                            <td className="px-4 py-4 text-slate-400 font-mono truncate max-w-[120px]" title={b.usuario}>{b.usuario || 'Sistema'}</td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {b.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOPORTE Y TICKETS (SUPRA CLIENTE) */}
          {activeTab === 'tickets' && (
            <div id="tab-tickets-panel" className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <BadgeHelp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-sans">Soporte Corporativo y Tickets</h2>
                    <p className="text-xs text-slate-500 font-sans">Monitorea y responde a tickets de soporte de tus marcas asociadas, o abre un ticket de asistencia global.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTicketAsunto('');
                    setTicketDescripcion('');
                    setTicketClienteId(clientes[0]?.id || user.correo); // Default to first client or email
                    setShowCreateTicket(true);
                  }}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Abrir Ticket de Soporte</span>
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tickets list */}
                <div className={`bg-white rounded-3xl border border-slate-100 p-6 space-y-4 ${activeTicket ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Historial de Tickets Asociados</h3>
                      <p className="text-[10px] text-slate-400">Tickets abiertos por ti o por los clientes bajo tu administración.</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
                      {tickets.length} registrados
                    </span>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <BadgeHelp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No hay tickets de soporte registrados.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Utiliza el botón superior para crear un ticket de soporte global si lo necesitas.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                            <th className="p-3.5">Ticket ID</th>
                            <th className="p-3.5">Asunto</th>
                            <th className="p-3.5">Origen / Cliente</th>
                            <th className="p-3.5">Fecha</th>
                            <th className="p-3.5">Estado</th>
                            <th className="p-3.5 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tickets.map((tk) => {
                            const originClient = clientes.find(c => c.id === tk.clienteId);
                            const originLabel = originClient 
                              ? `${COUNTRY_FLAGS[originClient.pais] || '📍'} ${originClient.empresa || originClient.nombre} (${originClient.pais || 'Local'})`
                              : tk.clienteId === user.correo ? '🌎 Soporte Supra (Global Holding)' : tk.clienteId;

                            return (
                              <tr key={tk.id} className="hover:bg-slate-50/55 transition-colors">
                                <td className="p-3.5 font-bold text-indigo-900 font-mono text-[11px]">{tk.id}</td>
                                <td className="p-3.5 font-bold text-slate-800">{tk.asunto}</td>
                                <td className="p-3.5 text-slate-700 font-semibold">{originLabel}</td>
                                <td className="p-3.5 text-slate-400 font-mono text-[11px]">{new Date(tk.fechaCreacion).toLocaleDateString()}</td>
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    tk.estado === 'Nuevo' ? 'bg-indigo-50 text-indigo-700' :
                                    tk.estado === 'Respondido' ? 'bg-emerald-50 text-emerald-700' :
                                    tk.estado === 'En revisión' || tk.estado === 'En Proceso' ? 'bg-amber-50 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {tk.estado}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => {
                                      setActiveTicket(tk);
                                      setTicketReply('');
                                    }}
                                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-bold transition-all text-slate-700 border border-slate-200/50 shadow-3xs"
                                  >
                                    Ver Respuestas
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

                {/* Detailed Ticket Conversation and Reply */}
                {activeTicket && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 xl:col-span-1 h-fit shadow-3xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[9px] font-black font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{activeTicket.id}</span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1.5">{activeTicket.asunto}</h3>
                        <p className="text-[9px] text-slate-400 mt-0.5">Cliente: <strong className="text-slate-700 font-bold">
                          {clientes.find(c => c.id === activeTicket.clienteId)?.nombre || (activeTicket.clienteId === user.correo ? 'Soporte Supra (Global)' : activeTicket.clienteId)}
                        </strong></p>
                        <p className="text-[9px] text-slate-400">Estado: <strong className="text-indigo-600 font-bold uppercase">{activeTicket.estado}</strong></p>
                      </div>
                      <button
                        onClick={() => setActiveTicket(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none p-1"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Dialogue thread log */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-3 font-sans">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span className="font-bold">Descripción Inicial</span>
                            <span>{new Date(activeTicket.fechaCreacion).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed font-semibold bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">{activeTicket.descripcion.split('\n\n[Respuesta')[0]}</p>
                        </div>

                        {/* Show replies */}
                        {activeTicket.comentarios && activeTicket.comentarios.length > 0 ? (
                          <div className="space-y-2.5 border-t border-slate-100 pt-3">
                            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">Historial de Conversación:</div>
                            {activeTicket.comentarios
                              .filter((c: any) => !c.esInterno)
                              .map((c: any) => {
                                const isStaff = c.autorRol === 'administrador' || c.autorRol === 'asesor_comercial';
                                return (
                                  <div 
                                    key={c.id} 
                                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                                      isStaff ? 'bg-indigo-50/70 border-indigo-100 text-indigo-950' : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center text-[9px]">
                                      <div className="flex items-center gap-1.5">
                                        <strong className="font-bold">{c.autor}</strong>
                                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                                          isStaff ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-200 text-slate-800'
                                        }`}>
                                          {isStaff ? 'EOR Support / Asesor' : 'Solicitante'}
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

                      {/* Reply form */}
                      {activeTicket.estado !== 'Cerrado' && activeTicket.estado !== 'Resuelto' ? (
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!ticketReply.trim()) return;
                          setSubmittingReply(true);
                          try {
                            const updated = await api.responderTicket(activeTicket.id, {
                              usuario: user.nombre,
                              rol: user.rol,
                              mensaje: ticketReply
                            });
                            setActiveTicket(updated);
                            setTicketReply('');
                            // Refresh main list
                            const allTickets = await api.getTickets().catch(() => []);
                            const managedIds = clientes.map(c => c.id);
                            const managedTickets = allTickets.filter(t => 
                              managedIds.includes(t.clienteId) || 
                              t.clienteId === user.correo
                            );
                            setTickets(managedTickets);
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
                            placeholder="Escribe tu mensaje aquí..."
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-semibold text-slate-900 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={submittingReply}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm"
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

          {/* TAB: ALERTAS OPERACIONALES */}
          {activeTab === 'operational_alerts' && (
            <div className="space-y-6 animate-fade-in">
              <OperationalAlertsPanel user={user} lang={lang} />
            </div>
          )}

          {/* TAB 7: REPORTES DE GESTION */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <ManagementReportsPanel user={user} lang={lang} />
            </div>
          )}

            </>
          )}
        </div>
      </div>

      {/* CREATE BENEFIT MODAL */}
      {showAddBenefitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black">Configurar Nuevo Beneficio Corporativo</h3>
                <p className="text-[10px] text-indigo-200">Asigna prestaciones, seguros o equipos complementarios para tu holding.</p>
              </div>
              <button
                onClick={() => setShowAddBenefitModal(false)}
                className="text-indigo-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBenefit} className="p-6 space-y-4">
              {benefitError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center space-x-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{benefitError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Nombre del Beneficio *</label>
                <input
                  type="text"
                  placeholder="Ej. Seguro de Gastos Médicos Mayores Sura"
                  value={benefitNombre}
                  onChange={(e) => setBenefitNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Tipo de Beneficio</label>
                  <select
                    value={benefitTipo}
                    onChange={(e) => setBenefitTipo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold"
                  >
                    <option value="Salud">Salud / Médico</option>
                    <option value="Seguro Vida">Seguro de Vida</option>
                    <option value="Equipos">Equipos / Oficina</option>
                    <option value="Viáticos">Viáticos / Transporte</option>
                    <option value="Otros">Otros Beneficios</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Modalidad de Cobro</label>
                  <select
                    value={benefitModalidad}
                    onChange={(e) => setBenefitModalidad(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold"
                  >
                    <option value="Mensual">Mensual (Recurrente)</option>
                    <option value="Único">Único (Pago único)</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Costo o Tarifa</label>
                  <input
                    type="number"
                    value={benefitCosto}
                    onChange={(e) => setBenefitCosto(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">Moneda</label>
                  <select
                    value={benefitMoneda}
                    onChange={(e) => setBenefitMoneda(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold"
                  >
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Fecha Límite Vigencia</label>
                <input
                  type="date"
                  value={benefitVigencia}
                  onChange={(e) => setBenefitVigencia(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-semibold font-mono"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-slate-700 font-bold">Asignar a Colaborador</span>
                    <span className="text-[10px] text-slate-400">¿Se detalla en la nómina del trabajador?</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={benefitAplicaTrabajador}
                    onChange={(e) => setBenefitAplicaTrabajador(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-slate-700 font-bold">Cobrar en Factura Cliente</span>
                    <span className="text-[10px] text-slate-400">¿Se carga en la factura mensual de la empresa?</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={benefitAplicaCliente}
                    onChange={(e) => setBenefitAplicaCliente(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBenefitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-md transition-all"
                >
                  Guardar Beneficio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PDF INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden text-xs">
            
            {/* Control Bar */}
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-sm font-bold">Generación de Formato de Factura</h3>
                <p className="text-[10px] text-indigo-200">Formato formal de factura descargable en PDF o para impresión directa.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewInvoice(null);
                    setIsUnifiedPreview(false);
                  }}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-10 space-y-6 bg-white text-slate-900" id="print-area">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-indigo-950">QUICK HIRE EOR SERVICES</h2>
                  <p className="text-slate-500 text-[10px] font-semibold">Servicios Globales de Nómina y Empleador de Registro</p>
                  <p className="text-slate-400 text-[10px]">Cédula Jurídica: 3-101-928471 • San José, Costa Rica</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="bg-indigo-50 text-indigo-800 text-[9px] uppercase px-2 py-0.5 rounded-full font-black tracking-wider">Factura Comercial</span>
                  <p className="text-lg font-mono font-bold text-indigo-600 mt-1">{previewInvoice.id}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Periodo: {previewInvoice.periodo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Facturado a (Cliente):</span>
                  <p className="font-bold text-slate-900 text-sm">{previewInvoice.clienteNombre}</p>
                  <p className="text-slate-500">Dirección de Facturación: {previewInvoice.pais === 'Multinacional' ? 'Oficinas Centrales Multinacionales' : `${previewInvoice.pais}, Zona Centro`}</p>
                  <p className="text-slate-400">Contacto: operations@corporative.com</p>
                </div>

                <div className="space-y-1 text-right">
                  <p className="text-slate-500 font-semibold"><span className="text-slate-400 font-normal">Fecha de Emisión:</span> {previewInvoice.fechaEmision}</p>
                  <p className="text-slate-500 font-semibold"><span className="text-slate-400 font-normal">Fecha de Vencimiento:</span> {previewInvoice.fechaVencimiento}</p>
                  <p className="text-slate-500 font-semibold"><span className="text-slate-400 font-normal">Moneda:</span> {previewInvoice.moneda}</p>
                  <p className="text-slate-500 font-semibold"><span className="text-slate-400 font-normal">Condición de Pago:</span> Crédito Comercial 10 días</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Desglose de Conceptos Facturados</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Concepto / Servicio</th>
                        <th className="px-4 py-2.5 text-center">Cantidad</th>
                        <th className="px-4 py-2.5 text-right">Costo / Base</th>
                        <th className="px-4 py-2.5 text-right">Importe ({previewInvoice.moneda})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">Honorarios de Administración EOR (Fee Base)</p>
                          <p className="text-[10px] text-slate-500">Administración de headcount y cumplimiento normativo.</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{previewInvoice.cantidadTrabajadores}</td>
                        <td className="px-4 py-3 text-right font-mono">{(previewInvoice.feeAplicado || (previewInvoice.baseFee ? Math.round(previewInvoice.baseFee / previewInvoice.cantidadTrabajadores) : 250)).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">{(previewInvoice.baseFee || previewInvoice.totalFacturado * 0.7).toLocaleString()}</td>
                      </tr>
                      {previewInvoice.beneficiosCobrados > 0 && (
                        <tr>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">Beneficios Adicionales Reembolsables</p>
                            <p className="text-[10px] text-slate-500">Seguros de salud, equipos de trabajo, bonos extralegales.</p>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">{previewInvoice.beneficiosCobrados.toLocaleString()}</td>
                        </tr>
                      )}
                      {previewInvoice.descuentos > 0 && (
                        <tr className="text-emerald-700 bg-emerald-50/50">
                          <td className="px-4 py-3">
                            <p className="font-bold">Descuento de Volumen por Escala</p>
                            <p className="text-[10px] text-emerald-600">Descuento aplicado por número de talento gestionado.</p>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">-{previewInvoice.descuentos.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workers Detail Breakdown */}
              {previewInvoice.detallesTrabajadores && previewInvoice.detallesTrabajadores.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Itemización Detallada por Colaborador</span>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 text-[10px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="px-3 py-1.5">Colaborador / Puesto</th>
                          {isUnifiedPreview && <th className="px-3 py-1.5">Cliente Origen</th>}
                          <th className="px-3 py-1.5 text-right">Salario Imponible</th>
                          <th className="px-3 py-1.5 text-right">Fee Gestión</th>
                          <th className="px-3 py-1.5 text-right">Costo Beneficios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 font-semibold text-slate-700">
                        {previewInvoice.detallesTrabajadores.map((d, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <p className="font-bold text-slate-900">{d.nombre}</p>
                              <p className="text-[9px] text-slate-400">{d.puesto}</p>
                            </td>
                            {isUnifiedPreview && <td className="px-3 py-2 text-indigo-700">{(d as any).clienteNombre}</td>}
                            <td className="px-3 py-2 text-right font-mono">{d.salario.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-mono">{d.fee.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-mono">{d.beneficios.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tax & Total Math */}
              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <div className="w-80 space-y-2 text-right font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal de Conceptos:</span>
                    <span className="text-slate-950 font-mono">
                      {Math.round(
                        (previewInvoice.baseFee || previewInvoice.totalFacturado * 0.7) +
                        previewInvoice.beneficiosCobrados -
                        previewInvoice.descuentos
                      ).toLocaleString()} {previewInvoice.moneda}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-normal">
                    <span>Impuestos Generales / IVA (19%):</span>
                    <span className="text-slate-950 font-mono">+{previewInvoice.iva?.toLocaleString() || '0'} {previewInvoice.moneda}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-normal">
                    <span>Comisión Bancaria / Pasarela (2.5%):</span>
                    <span className="text-slate-950 font-mono">+{previewInvoice.comisionBancaria?.toLocaleString() || '0'} {previewInvoice.moneda}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-normal">
                    <span>Otros Impuestos de Nómina (1.5%):</span>
                    <span className="text-slate-950 font-mono">+{previewInvoice.otrosImpuestos?.toLocaleString() || '0'} {previewInvoice.moneda}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-normal">
                    <span>Retención en la Fuente WHT (4.0%):</span>
                    <span className="font-mono">-{previewInvoice.wht?.toLocaleString() || '0'} {previewInvoice.moneda}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm text-indigo-950 font-black">
                    <span>Total de la Factura:</span>
                    <span className="text-lg text-indigo-600 font-mono">{previewInvoice.totalFacturado.toLocaleString()} {previewInvoice.moneda}</span>
                  </div>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="border-t border-slate-100 pt-6 text-[9px] text-slate-400 space-y-1 font-semibold">
                <p>Esta es una representación impresa de la factura comercial de servicios emitida en cumplimiento de regulaciones locales de EOR.</p>
                <p>Las tasas de impuestos, comisiones y retención WHT han sido parametrizadas de conformidad con el contrato maestro vigente.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STRIPE PAYMENT MODAL WITH TDC AND CRYPTO (POINT 6) */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            
            {/* Header */}
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold">Pasarela de Pago QuickHire</h3>
                  <p className="text-[10px] text-indigo-200">Pago seguro con encriptación SSL militar</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setPayingInvoice(null);
                  setIsUnifiedPayment(false);
                }} 
                className="text-indigo-200 hover:text-white font-black text-lg"
              >
                &times;
              </button>
            </div>

            {paymentSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-lg font-black text-slate-900">¡Pago Procesado Exitosamente!</h3>
                <p className="text-slate-500 text-xs">
                  La factura ha sido marcada como <strong>PAGADA</strong> en el sistema de manera segura. Se ha enviado el comprobante a tu correo corporativo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="p-6 space-y-6">
                
                {/* Invoice Brief */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Pagar a QuickHire:</span>
                    <span className="font-bold text-slate-900 text-sm">{payingInvoice.clienteNombre}</span>
                    <span className="text-slate-400 text-[10px] block mt-0.5">ID Factura: {payingInvoice.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Monto a pagar:</span>
                    <span className="text-lg font-black text-indigo-600 font-mono">{payingInvoice.totalFacturado.toLocaleString()} {payingInvoice.moneda}</span>
                  </div>
                </div>

                {/* Tab selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-center border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center space-x-1 ${
                      paymentMethod === 'card' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Tarjeta Crédito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center space-x-1 ${
                      paymentMethod === 'crypto' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Criptomonedas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center space-x-1 ${
                      paymentMethod === 'transfer' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Transferencia</span>
                  </button>
                </div>

                {/* Card payment layout (TDC) */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    {/* Visual Credit Card Preview */}
                    <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-6 relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 font-bold text-5xl">VISA</div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] tracking-widest font-bold">PREMIUM CORPORATE CARD</span>
                        <div className="w-8 h-6 bg-amber-400 rounded-md opacity-80"></div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-indigo-200 block font-normal">Número de Tarjeta</span>
                        <p className="text-base font-mono tracking-widest font-bold">
                          {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[8px] text-indigo-200 block font-normal">Titular</span>
                          <span className="font-bold tracking-wider font-mono uppercase">{cardName || 'TITULAR DE CUENTA'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-indigo-200 block font-normal">Vence</span>
                          <span className="font-bold font-mono">{cardExpiry || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Nombre Completo del Titular</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Juan Pérez"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Número de Tarjeta (TDC)</label>
                        <input
                          type="text"
                          required
                          maxLength={16}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="4000123456789010"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase">Vencimiento</label>
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono font-semibold text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase">CVV / Cód. Seguridad</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            placeholder="***"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Crypto payment layout */}
                {paymentMethod === 'crypto' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase">Selecciona Moneda Cripto</label>
                      <select
                        value={cryptoCurrency}
                        onChange={(e) => setCryptoCurrency(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-bold"
                      >
                        <option value="USDT">Tether (USDT - Tron TRC20)</option>
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH - ERC20)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col items-center text-center space-y-3">
                      {/* Simulated QR Code */}
                      <div className="w-28 h-28 bg-white border border-slate-200 p-2 flex items-center justify-center rounded-xl shadow-inner relative">
                        <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 0 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white px-2 py-0.5 rounded-full border border-slate-100 text-[8px] font-black tracking-widest text-indigo-600 shadow-sm uppercase">{cryptoCurrency}</span>
                        </div>
                      </div>

                      <div className="space-y-1 w-full text-xs">
                        <span className="text-[10px] text-slate-400 font-bold block">Dirección de Billetera Oficial:</span>
                        <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-[10px] select-all font-bold justify-between">
                          <span className="text-slate-800 break-all text-left">
                            {cryptoCurrency === 'USDT' ? 'TYaKdf83n7C9msKj9w83KsdmNsKsd93j2N' :
                             cryptoCurrency === 'BTC' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' :
                             '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-1">Transfiere exactamente {payingInvoice.totalFacturado.toLocaleString()} {cryptoCurrency === 'USDT' ? 'USDT' : cryptoCurrency === 'BTC' ? 'mBTC' : 'Gwei'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wire Transfer Layout */}
                {paymentMethod === 'transfer' && (
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 text-xs">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Instrucciones de Transferencia Internacional</span>
                    <div className="space-y-2 font-semibold text-slate-700">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="font-normal text-slate-400">Banco Receptor:</span>
                        <span className="text-slate-900">CITIBANK NY</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="font-normal text-slate-400">Nombre de Cuenta:</span>
                        <span className="text-slate-900">QUICK HIRE EOR LATAM S.A.</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="font-normal text-slate-400">Número de Cuenta:</span>
                        <span className="text-slate-900 font-mono">0294-8274-12948271</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="font-normal text-slate-400">Swift Code:</span>
                        <span className="text-slate-900 font-mono">CITIUS33XXX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-normal text-slate-400">Referencia de Pago:</span>
                        <span className="text-indigo-600 font-mono font-bold">{payingInvoice.id}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPayingInvoice(null);
                      setIsUnifiedPayment(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={payingInProcess}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/10"
                  >
                    {payingInProcess ? 'Procesando...' : 'Confirmar Pago Seguro'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateTicket && (
        <div id="create-ticket-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Abrir Ticket de Soporte</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Cuéntanos en qué podemos ayudarte hoy.</p>
              </div>
              <button onClick={() => setShowCreateTicket(false)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!ticketAsunto.trim() || !ticketDescripcion.trim() || !ticketClienteId) return;
              setSubmittingTicket(true);
              try {
                await api.createTicket({
                  clienteId: ticketClienteId,
                  asunto: ticketAsunto,
                  descripcion: ticketDescripcion,
                });
                setShowCreateTicket(false);
                setTicketAsunto('');
                setTicketDescripcion('');
                // Refresh tickets
                const allTickets = await api.getTickets().catch(() => []);
                const managedIds = clientes.map(c => c.id);
                const managedTickets = allTickets.filter(t => 
                  managedIds.includes(t.clienteId) || 
                  t.clienteId === user.correo
                );
                setTickets(managedTickets);
              } catch (err) {
                alert('No se pudo abrir el ticket de soporte.');
              } finally {
                setSubmittingTicket(false);
              }
            }} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Cliente / Marca Asociada <span className="text-rose-500">*</span></label>
                <select
                  value={ticketClienteId}
                  onChange={(e) => setTicketClienteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={user.correo}>🌎 Soporte Corporativo (Global / Supra Cliente Holding)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {COUNTRY_FLAGS[c.pais] || '📍'} {c.empresa || c.nombre} ({c.pais || 'Local'}) - ID: {c.id}
                    </option>
                  ))}
                </select>
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

      {/* REVIEW USD CASH PAYMENT MODAL */}
      {reviewPagoContado && (
        <div id="review-cash-payment-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Validación de Pago de Contado USD</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Valida el soporte cargado por tu cliente para activar el servicio de EOR.</p>
              </div>
              <button onClick={() => setReviewPagoContado(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {pagoReviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {pagoReviewError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {clientes.find(c => c.id === reviewPagoContado.clienteId)?.empresa || 'Cargando...'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Concepto</span>
                  <span className="font-bold text-slate-800 text-xs">{reviewPagoContado.concepto}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monto USD</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    ${reviewPagoContado.montoUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Equivalente de Cambio</span>
                  <span className="font-mono font-semibold text-slate-600 text-xs">
                    {reviewPagoContado.monedaLocal 
                      ? `${(reviewPagoContado.montoUsd * reviewPagoContado.tipoCambio).toLocaleString()} ${reviewPagoContado.monedaLocal} (Tasa: ${reviewPagoContado.tipoCambio})`
                      : 'No aplica (USD Directo)'}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2 mt-1 flex justify-between items-center text-[10.5px]">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider mr-1">Método de pago:</span>
                    <span className="font-bold text-slate-700">{reviewPagoContado.metodoPago || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider mr-1">Fecha de Pago:</span>
                    <span className="font-mono font-bold text-slate-700">{reviewPagoContado.fechaPago || 'No registrada'}</span>
                  </div>
                </div>
              </div>

              {/* Support Document View Container */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Documento Soporte de Pago Cargado</span>
                {reviewPagoContado.archivoSoporte ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-4">
                    <iframe 
                      src={reviewPagoContado.archivoSoporte} 
                      className="w-full h-48 rounded-xl border border-slate-200 bg-white"
                      title="Soporte de pago"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`<iframe src="${reviewPagoContado.archivoSoporte}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }
                      }}
                      className="mt-3 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-100 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver en pantalla completa</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-semibold">
                    El cliente no ha cargado ningún comprobante de pago aún.
                  </div>
                )}
              </div>

              {/* Reject Observation Input Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Comentarios de Validación / Motivo de Rechazo <span className="text-rose-500 font-normal">(Requerido para rechazar)</span>
                </label>
                <textarea
                  rows={2}
                  value={rechazoComentarios}
                  onChange={(e) => setRechazoComentarios(e.target.value)}
                  placeholder="Por favor, especifique el motivo del rechazo del comprobante o comentarios internos de la conciliación bancaria..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewPagoContado(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleValidarPagoContado(reviewPagoContado.id, false)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Rechazar Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidarPagoContado(reviewPagoContado.id, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Validar y Liberar Servicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL RELEASE OVERRIDE MODAL (SUPER ADMIN TRACEABILITY) */}
      {showManualReleaseModal && (
        <div id="manual-release-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
            <div className="bg-indigo-950 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black font-mono tracking-widest bg-indigo-900/75 text-indigo-300 px-2.5 py-1 rounded-full uppercase">Super Admin Audit Tool</span>
                <h3 className="text-sm font-bold mt-2">Corregir Estado de Liberación EOR</h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">Permite forzar o revertir estados de activación del cliente de forma auditable.</p>
              </div>
              <button onClick={() => setShowManualReleaseModal(null)} className="text-indigo-200 hover:text-white font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleActualizarEstadoServicio} className="p-5 space-y-4">
              {manualReleaseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {manualReleaseError}
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Cliente:</span>
                  <span className="font-bold text-slate-900">{showManualReleaseModal.empresa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">ID Cliente:</span>
                  <span className="font-mono font-bold text-slate-700">{showManualReleaseModal.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Estado Actual:</span>
                  <span className="font-bold text-indigo-700">{showManualReleaseModal.estadoServicio || 'Pendiente de contrato'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nuevo Estado de Servicio <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualReleaseEstado}
                  onChange={(e) => setManualReleaseEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-bold"
                >
                  <option value="Pendiente de contrato comercial">Pendiente de contrato comercial</option>
                  <option value="Contrato comercial firmado">Contrato comercial firmado</option>
                  <option value="Pendiente de pago">Pendiente de pago</option>
                  <option value="Pago en revisión">Pago en revisión</option>
                  <option value="Pago rechazado">Pago rechazado</option>
                  <option value="Pago validado">Pago validado</option>
                  <option value="Servicio liberado">Servicio liberado</option>
                  <option value="Servicio bloqueado">Servicio bloqueado</option>
                  <option value="Servicio suspendido">Servicio suspendido</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Justificación / Motivo de la Corrección <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualReleaseMotivo}
                  onChange={(e) => setManualReleaseMotivo(e.target.value)}
                  placeholder="Ej: Conciliación manual de depósito bancario offline"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-950 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Observaciones Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={manualReleaseObs}
                  onChange={(e) => setManualReleaseObs(e.target.value)}
                  placeholder="Anotaciones de auditoría o soporte técnico..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-950 font-semibold resize-none text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualReleaseModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  Aplicar Corrección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
