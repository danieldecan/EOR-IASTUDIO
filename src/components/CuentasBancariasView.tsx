import React, { useState, useEffect } from 'react';
import { CuentaBancariaMaestra, User, Language, ALL_COUNTRIES } from '../types';
import { api } from '../api';
import { tr, tText, translateRole, translateStatus } from '../utils/i18n';
import { 
  Building2, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Edit, 
  Copy, 
  Check, 
  CreditCard, 
  Globe, 
  DollarSign, 
  Lock, 
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Info,
  ExternalLink,
  MapPin,
  FileText,
  X
} from 'lucide-react';

interface Props {
  user: User;
  lang?: Language;
}

export default function CuentasBancariasView({ user, lang = 'es' }: Props) {
  const [cuentas, setCuentas] = useState<CuentaBancariaMaestra[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedPais, setSelectedPais] = useState<string>('Todos');
  const [selectedMoneda, setSelectedMoneda] = useState<string>('Todas');
  const [selectedSociedad, setSelectedSociedad] = useState<string>('Todas');
  const [selectedBanco, setSelectedBanco] = useState<string>('Todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('Todos');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Modal State for Edit / Create
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editCuenta, setEditCuenta] = useState<CuentaBancariaMaestra | null>(null);
  const [formSociedad, setFormSociedad] = useState<string>('');
  const [formPais, setFormPais] = useState<string>('Colombia');
  const [formMoneda, setFormMoneda] = useState<string>('USD');
  const [formBanco, setFormBanco] = useState<string>('');
  const [formNumero, setFormNumero] = useState<string>('');
  const [formTipo, setFormTipo] = useState<string>('MAESTRA');
  const [formEstado, setFormEstado] = useState<'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA'>('ACTIVA');
  const [formSwift, setFormSwift] = useState<string>('');
  const [formAba, setFormAba] = useState<string>('');
  const [formBancoIntermediario, setFormBancoIntermediario] = useState<string>('');
  const [formSwiftIntermediario, setFormSwiftIntermediario] = useState<string>('');
  const [formAbaIntermediario, setFormAbaIntermediario] = useState<string>('');
  const [formDireccionBancoIntermediario, setFormDireccionBancoIntermediario] = useState<string>('');
  const [formDireccionBanco, setFormDireccionBanco] = useState<string>('');
  const [formDireccionBeneficiario, setFormDireccionBeneficiario] = useState<string>('');
  const [formRuc, setFormRuc] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modal State for Full International Wire Transfer Card
  const [detailModalCuenta, setDetailModalCuenta] = useState<CuentaBancariaMaestra | null>(null);

  // Role Check: 'tesoreria', 'gestion_cuentas', 'administrador', 'supracliente'
  const isAuthorized = 
    user.rol === 'tesoreria' || 
    user.rol === 'gestion_cuentas' || 
    user.rol === 'administrador' || 
    user.rol === 'supracliente' ||
    user.rol?.toLowerCase().includes('tesorer') ||
    user.rol?.toLowerCase().includes('cuenta');

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user.rol]);

  const fetchData = async () => {
    setLoading(true);
    setAccessError(null);
    try {
      const data = await api.getCuentasBancarias();
      setCuentas(data);
    } catch (err: any) {
      setAccessError(err.message || tr('Error de permisos o comunicación con el servidor.', 'Permission or server communication error.', 'Erro de permissão ou comunicação com o servidor.', lang));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleOpenModal = (account?: CuentaBancariaMaestra) => {
    setErrorMsg('');
    if (account) {
      setEditCuenta(account);
      setFormSociedad(account.sociedad || '');
      setFormPais(account.pais || 'Colombia');
      setFormMoneda(account.moneda || 'USD');
      setFormBanco(account.banco || '');
      setFormNumero(account.numeroCuenta || '');
      setFormTipo(account.tipoCuenta || 'MAESTRA');
      setFormEstado(account.estado || 'ACTIVA');
      setFormSwift(account.swift || '');
      setFormAba(account.aba || '');
      setFormBancoIntermediario(account.bancoIntermediario || '');
      setFormSwiftIntermediario(account.swiftIntermediario || '');
      setFormAbaIntermediario(account.abaIntermediario || '');
      setFormDireccionBancoIntermediario(account.direccionBancoIntermediario || '');
      setFormDireccionBanco(account.direccionBanco || '');
      setFormDireccionBeneficiario(account.direccionBeneficiario || '');
      setFormRuc(account.ruc || '');
    } else {
      setEditCuenta(null);
      setFormSociedad('');
      setFormPais('Colombia');
      setFormMoneda('USD');
      setFormBanco('');
      setFormNumero('');
      setFormTipo('MAESTRA');
      setFormEstado('ACTIVA');
      setFormSwift('');
      setFormAba('');
      setFormBancoIntermediario('');
      setFormSwiftIntermediario('');
      setFormAbaIntermediario('');
      setFormDireccionBancoIntermediario('');
      setFormDireccionBanco('');
      setFormDireccionBeneficiario('');
      setFormRuc('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSociedad || !formBanco || !formNumero) {
      setErrorMsg(tr('Sociedad, Banco y Número de cuenta son obligatorios.', 'Company, Bank, and Account Number are required.', 'Empresa, Banco e Número da Conta são obrigatórios.', lang));
      return;
    }

    try {
      const payload: Partial<CuentaBancariaMaestra> = {
        sociedad: formSociedad,
        pais: formPais,
        moneda: formMoneda,
        banco: formBanco,
        numeroCuenta: formNumero,
        tipoCuenta: formTipo,
        estado: formEstado,
        swift: formSwift,
        aba: formAba,
        bancoIntermediario: formBancoIntermediario,
        swiftIntermediario: formSwiftIntermediario,
        abaIntermediario: formAbaIntermediario,
        direccionBancoIntermediario: formDireccionBancoIntermediario,
        direccionBanco: formDireccionBanco,
        direccionBeneficiario: formDireccionBeneficiario,
        ruc: formRuc
      };

      if (editCuenta) {
        await api.updateCuentaBancaria(editCuenta.id, payload);
      } else {
        await api.createCuentaBancaria(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || tr('Error al guardar la cuenta bancaria.', 'Error saving bank account.', 'Erro ao salvar a conta bancária.', lang));
    }
  };

  // If role is NOT authorized, display strict Access Denied screen
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto my-12 bg-white rounded-3xl border border-rose-200/80 p-8 text-center shadow-xl font-sans">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-center mx-auto mb-4 text-rose-600">
          <LockKeyhole className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-2">
          {tr('Acceso Restringido — Rol de Gestión de Cuentas', 'Restricted Access — Bank Account Management Role', 'Acesso Restrito — Função de Gestão de Contas', lang)}
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {tr('Maestro de Cuentas Bancarias', 'Master Bank Accounts Directory', 'Cadastro Geral de Contas Bancárias', lang)}
        </h2>
        <p className="text-xs text-slate-600 mt-2 max-w-lg mx-auto font-medium leading-relaxed">
          {tr('Esta sección contiene los datos bancarios maestros de las sociedades STT y está reservada para los roles de', 'This section contains master banking details of STT companies and is reserved for the roles of', 'Esta seção contém os dados bancários mestres das empresas STT e é reservada para as funções de', lang)} <strong className="text-slate-900">{tr('Tesorería y Gestión de Cuentas Bancarias', 'Treasury and Bank Account Management', 'Tesouraria e Gestão de Contas Bancárias', lang)}</strong>.
        </p>

        <div className="mt-6 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left max-w-md mx-auto text-xs space-y-1">
          <div className="flex justify-between text-slate-600 font-medium">
            <span>{tr('Tu usuario:', 'Your user:', 'Seu usuário:', lang)}</span>
            <span className="font-bold text-slate-900">{user.correo}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-medium">
            <span>{tr('Tu rol actual:', 'Your current role:', 'Seu papel atual:', lang)}</span>
            <span className="font-bold text-rose-600 uppercase">{user.rol}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-medium pt-1 border-t border-slate-200">
            <span>{tr('Rol requerido:', 'Required role:', 'Papel necessário:', lang)}</span>
            <span className="font-bold text-emerald-700 uppercase">tesoreria / gestion_cuentas</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-6 italic">
          {tr('Si necesitas consultar cuentas o gestionar tesorería, contacta al Administrador para solicitar asignación de rol.', 'If you need to query bank accounts or manage treasury, contact the Administrator to request role assignment.', 'Se precisar consultar contas ou gerenciar tesouraria, entre em contato com o Administrador para solicitar o papel.', lang)}
        </p>
      </div>
    );
  }

  // Unique options derived from current bank accounts list
  const paisesList = Array.from(new Set(cuentas.map(c => c.pais).filter(Boolean))).sort();
  const monedasList = Array.from(new Set(cuentas.map(c => c.moneda).filter(Boolean))).sort();
  const sociedadesList = Array.from(new Set(cuentas.map(c => c.sociedad).filter(Boolean))).sort();
  const bancosList = Array.from(new Set(cuentas.map(c => c.banco).filter(Boolean))).sort();
  const tiposList = Array.from(new Set(cuentas.map(c => c.tipoCuenta).filter(Boolean))).sort();

  const isFiltered = search !== '' || selectedPais !== 'Todos' || selectedMoneda !== 'Todas' || selectedSociedad !== 'Todas' || selectedBanco !== 'Todos' || selectedTipo !== 'Todos';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedPais('Todos');
    setSelectedMoneda('Todas');
    setSelectedSociedad('Todas');
    setSelectedBanco('Todos');
    setSelectedTipo('Todos');
  };

  // Filter accounts
  const filtered = cuentas.filter(item => {
    const matchesSearch = 
      !search ||
      item.sociedad.toLowerCase().includes(search.toLowerCase()) ||
      item.banco.toLowerCase().includes(search.toLowerCase()) ||
      item.numeroCuenta.toLowerCase().includes(search.toLowerCase()) ||
      item.pais.toLowerCase().includes(search.toLowerCase()) ||
      item.moneda.toLowerCase().includes(search.toLowerCase()) ||
      (item.tipoCuenta && item.tipoCuenta.toLowerCase().includes(search.toLowerCase())) ||
      (item.swift && item.swift.toLowerCase().includes(search.toLowerCase())) ||
      (item.aba && item.aba.toLowerCase().includes(search.toLowerCase()));

    const matchesPais = selectedPais === 'Todos' || item.pais === selectedPais;
    const matchesMoneda = selectedMoneda === 'Todas' || item.moneda === selectedMoneda;
    const matchesSociedad = selectedSociedad === 'Todas' || item.sociedad === selectedSociedad;
    const matchesBanco = selectedBanco === 'Todos' || item.banco === selectedBanco;
    const matchesTipo = selectedTipo === 'Todos' || item.tipoCuenta === selectedTipo;

    return matchesSearch && matchesPais && matchesMoneda && matchesSociedad && matchesBanco && matchesTipo;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold tracking-widest uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{tr('Acceso Exclusivo — Gestión de Cuentas Bancarias', 'Exclusive Access — Bank Account Management', 'Acesso Exclusivo — Gestão de Contas Bancárias', lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {tr('Maestro de Cuentas Bancarias', 'Master Bank Accounts Directory', 'Cadastro Geral de Contas Bancárias', lang)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              {tr('Catálogo oficial de cuentas bancarias maestras y operativas de las sociedades STT en América Latina y Estados Unidos.', 'Official catalog of master and operative bank accounts of STT legal entities across Latin America and the United States.', 'Catálogo oficial de contas bancárias mestres e operacionais das entidades STT na América Latina e Estados Unidos.', lang)}
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Agregar Cuenta Bancaria', 'Add Bank Account', 'Adicionar Conta Bancária', lang)}</span>
          </button>
        </div>

        {/* Total Accounts Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-800/60">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">{tr('Cuentas Registradas', 'Registered Accounts', 'Contas Registradas', lang)}</span>
            <span className="text-xl font-black text-white font-mono">{cuentas.length}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{tr('Cuentas Activas', 'Active Accounts', 'Contas Ativas', lang)}</span>
            <span className="text-xl font-black text-white font-mono">
              {cuentas.filter(c => c.estado === 'ACTIVA').length}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-teal-300 font-bold uppercase tracking-wider">{tr('Países Cobertura', 'Covered Countries', 'Países Atendidos', lang)}</span>
            <span className="text-xl font-black text-white font-mono">
              {Array.from(new Set(cuentas.map(c => c.pais))).length}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">{tr('Sociedades STT', 'STT Entities', 'Entidades STT', lang)}</span>
            <span className="text-xl font-black text-white font-mono">
              {Array.from(new Set(cuentas.map(c => c.sociedad))).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr('Buscar por sociedad, banco, número de cuenta, país...', 'Search by company, bank, account number, country...', 'Buscar por empresa, banco, número da conta, país...', lang)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] text-slate-500 font-bold">
              {tr('Mostrando', 'Showing', 'Exibindo', lang)} <strong className="text-emerald-700 font-mono">{filtered.length}</strong> {tr('de', 'of', 'de', lang)} <strong className="text-slate-700 font-mono">{cuentas.length}</strong> {tr('cuentas', 'accounts', 'contas', lang)}
            </span>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer"
              >
                {tr('Limpiar Filtros', 'Clear Filters', 'Limpar Filtros', lang)}
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          {/* País Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {tr('País', 'Country', 'País', lang)}
            </label>
            <select
              value={selectedPais}
              onChange={(e) => setSelectedPais(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todos">{tr('Todos los países', 'All countries', 'Todos os países', lang)} ({paisesList.length})</option>
              {paisesList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Moneda Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {tr('Moneda', 'Currency', 'Moeda', lang)}
            </label>
            <select
              value={selectedMoneda}
              onChange={(e) => setSelectedMoneda(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todas">{tr('Todas las monedas', 'All currencies', 'Todas as moedas', lang)} ({monedasList.length})</option>
              {monedasList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Sociedad Titular Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {tr('Sociedad Titular', 'Holding Company', 'Empresa Titular', lang)}
            </label>
            <select
              value={selectedSociedad}
              onChange={(e) => setSelectedSociedad(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todas">{tr('Todas las sociedades', 'All companies', 'Todas as empresas', lang)} ({sociedadesList.length})</option>
              {sociedadesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Entidad Bancaria Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {tr('Entidad Bancaria', 'Banking Entity', 'Entidade Bancária', lang)}
            </label>
            <select
              value={selectedBanco}
              onChange={(e) => setSelectedBanco(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todos">{tr('Todos los bancos', 'All banks', 'Todos os bancos', lang)} ({bancosList.length})</option>
              {bancosList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Cuenta Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {tr('Tipo de Cuenta', 'Account Type', 'Tipo de Conta', lang)}
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todos">{tr('Todos los tipos', 'All types', 'Todos os tipos', lang)} ({tiposList.length})</option>
              {tiposList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-bold text-xs">
            {tr('Cargando Maestro de Cuentas Bancarias...', 'Loading Master Bank Accounts...', 'Carregando Cadastro de Contas Bancárias...', lang)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">{tr('No se encontraron cuentas bancarias', 'No bank accounts found', 'Nenhuma conta bancária encontrada', lang)}</h3>
            <p className="text-xs text-slate-400 mt-1">{tr('Intenta ajustar los filtros de búsqueda o país.', 'Try adjusting search or country filters.', 'Tente ajustar os filtros de busca ou país.', lang)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{tr('Sociedad Titular', 'Holding Entity', 'Entidade Titular', lang)}</th>
                  <th className="py-3.5 px-4">{tr('País', 'Country', 'País', lang)}</th>
                  <th className="py-3.5 px-4">{tr('Moneda', 'Currency', 'Moeda', lang)}</th>
                  <th className="py-3.5 px-4">{tr('Entidad Bancaria', 'Bank Entity', 'Entidade Bancária', lang)}</th>
                  <th className="py-3.5 px-4">{tr('Número de Cuenta', 'Account Number', 'Número da Conta', lang)}</th>
                  <th className="py-3.5 px-4">{tr('Tipo de Cuenta', 'Account Type', 'Tipo de Conta', lang)}</th>
                  <th className="py-3.5 px-4 text-center">{tr('Estado', 'Status', 'Status', lang)}</th>
                  <th className="py-3.5 px-4 text-right">{tr('Acciones', 'Actions', 'Ações', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((item) => {
                  const hasInternationalDetails = !!(item.swift || item.aba || item.bancoIntermediario || item.ruc || item.direccionBanco);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                        <div>{item.sociedad}</div>
                        {item.ruc && (
                          <div className="text-[10px] text-slate-400 font-normal">RUC/Tax ID: {item.ruc}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.pais}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-extrabold text-[10.5px] ${
                          item.moneda === 'USD' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.moneda}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-indigo-900">
                        <div>{item.banco}</div>
                        {item.swift && <span className="text-[9.5px] font-mono text-emerald-700 block">SWIFT: {item.swift}</span>}
                        {item.aba && <span className="text-[9.5px] font-mono text-indigo-700 block">ABA: {item.aba}</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                            {item.numeroCuenta}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.numeroCuenta)}
                            title={tr('Copiar número de cuenta', 'Copy account number', 'Copiar número da conta', lang)}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedAccount === item.numeroCuenta ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        <div className="flex flex-col items-start gap-1">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] uppercase font-bold">
                            {item.tipoCuenta}
                          </span>
                          {hasInternationalDetails && (
                            <button
                              onClick={() => setDetailModalCuenta(item)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[9.5px] font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Info className="w-3 h-3 text-amber-600" />
                              <span>{tr('Ficha Transferencia Wire', 'Wire Transfer Sheet', 'Ficha Transferência Wire', lang)}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-block ${
                          item.estado === 'ACTIVA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {item.estado === 'ACTIVA' ? tr('ACTIVA', 'ACTIVE', 'ATIVA', lang) : item.estado === 'INACTIVA' ? tr('INACTIVA', 'INACTIVE', 'INATIVA', lang) : tr('SUSPENDIDA', 'SUSPENDED', 'SUSPENSA', lang)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasInternationalDetails && (
                            <button
                              onClick={() => setDetailModalCuenta(item)}
                              className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg font-bold transition-colors cursor-pointer"
                              title={tr('Ver Instrucciones Completas de Transferencia Internacional', 'View Complete International Wire Instructions', 'Ver Instruções Completas de Transferência Internacional', lang)}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{tText('Editar', lang)}</span>
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
      </div>

      {/* DETAIL MODAL: FICHA DE INSTRUCCIONES BANCARIAS INTERNACIONALES */}
      {detailModalCuenta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden font-sans">
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {tr('Instrucciones de Transferencia Internacional (Wire)', 'International Wire Transfer Instructions', 'Instruções de Transferência Internacional (Wire)', lang)}
                  </h3>
                  <p className="text-[10px] text-emerald-300 font-medium">
                    {detailModalCuenta.sociedad} ({detailModalCuenta.pais})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailModalCuenta(null)} 
                className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Beneficiary Header Box */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center justify-between">
                  <span>{tr('Beneficiario de la Cuenta', 'Account Beneficiary', 'Beneficiário da Conta', lang)}</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-mono rounded font-extrabold">
                    {detailModalCuenta.moneda}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800 font-bold">
                  <div>
                    <span className="block text-[9.5px] font-semibold text-slate-500">{tr('Razón Social:', 'Company Name:', 'Razão Social:', lang)}</span>
                    <span className="text-xs font-black text-slate-900">{detailModalCuenta.sociedad}</span>
                  </div>
                  {detailModalCuenta.ruc && (
                    <div>
                      <span className="block text-[9.5px] font-semibold text-slate-500">{tr('RUC / Tax ID:', 'RUC / Tax ID:', 'CNPJ / Tax ID:', lang)}</span>
                      <span className="font-mono text-slate-900">{detailModalCuenta.ruc}</span>
                    </div>
                  )}
                  {detailModalCuenta.direccionBeneficiario && (
                    <div className="sm:col-span-2">
                      <span className="block text-[9.5px] font-semibold text-slate-500">{tr('Dirección Beneficiario:', 'Beneficiary Address:', 'Endereço do Beneficiário:', lang)}</span>
                      <span className="text-slate-700 text-[11px] font-medium">{detailModalCuenta.direccionBeneficiario}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Beneficiary Bank Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center justify-between">
                  <span>{tr('Banco Beneficiario', 'Beneficiary Bank', 'Banco Beneficiário', lang)}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{tr('Cuenta de Destino', 'Destination Account', 'Conta de Destino', lang)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                  <div>
                    <span className="block text-[9.5px] font-semibold text-slate-500">{tr('Nombre del Banco:', 'Bank Name:', 'Nome do Banco:', lang)}</span>
                    <span className="font-extrabold text-indigo-900">{detailModalCuenta.banco}</span>
                  </div>
                  <div>
                    <span className="block text-[9.5px] font-semibold text-slate-500">{tr('N° Cuenta Beneficiario:', 'Beneficiary Account No.:', 'Nº Conta do Beneficiário:', lang)}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {detailModalCuenta.numeroCuenta}
                      </span>
                      <button
                        onClick={() => handleCopy(detailModalCuenta.numeroCuenta)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                        title={tr('Copiar número de cuenta', 'Copy account number', 'Copiar número da conta', lang)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {detailModalCuenta.swift && (
                    <div>
                      <span className="block text-[9.5px] font-semibold text-slate-500">{tr('Código SWIFT:', 'SWIFT Code:', 'Código SWIFT:', lang)}</span>
                      <span className="font-mono font-bold text-emerald-800">{detailModalCuenta.swift}</span>
                    </div>
                  )}

                  {detailModalCuenta.aba && (
                    <div>
                      <span className="block text-[9.5px] font-semibold text-slate-500">{tr('Código Routing ABA:', 'ABA Routing Code:', 'Código Routing ABA:', lang)}</span>
                      <span className="font-mono font-bold text-indigo-800">{detailModalCuenta.aba}</span>
                    </div>
                  )}

                  {detailModalCuenta.direccionBanco && (
                    <div className="sm:col-span-2">
                      <span className="block text-[9.5px] font-semibold text-slate-500">{tr('Dirección del Banco Beneficiario:', 'Beneficiary Bank Address:', 'Endereço do Banco Beneficiário:', lang)}</span>
                      <span className="text-slate-700 text-[11px] font-medium">{detailModalCuenta.direccionBanco}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Intermediary Bank Box if present */}
              {detailModalCuenta.bancoIntermediario && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    {tr('Banco Intermediario', 'Intermediary Bank', 'Banco Intermediário', lang)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                    <div>
                      <span className="block text-[9.5px] font-semibold text-amber-800/80">{tr('Nombre Banco Intermediario:', 'Intermediary Bank Name:', 'Nome do Banco Intermediário:', lang)}</span>
                      <span className="font-extrabold text-slate-900">{detailModalCuenta.bancoIntermediario}</span>
                    </div>

                    {detailModalCuenta.swiftIntermediario && (
                      <div>
                        <span className="block text-[9.5px] font-semibold text-amber-800/80">{tr('SWIFT Intermediario:', 'Intermediary SWIFT:', 'SWIFT Intermediário:', lang)}</span>
                        <span className="font-mono font-bold text-slate-900">{detailModalCuenta.swiftIntermediario}</span>
                      </div>
                    )}

                    {detailModalCuenta.abaIntermediario && (
                      <div>
                        <span className="block text-[9.5px] font-semibold text-amber-800/80">{tr('ABA Intermediario:', 'Intermediary ABA:', 'ABA Intermediário:', lang)}</span>
                        <span className="font-mono font-bold text-slate-900">{detailModalCuenta.abaIntermediario}</span>
                      </div>
                    )}

                    {detailModalCuenta.direccionBancoIntermediario && (
                      <div className="sm:col-span-2">
                        <span className="block text-[9.5px] font-semibold text-amber-800/80">{tr('Dirección Banco Intermediario:', 'Intermediary Bank Address:', 'Endereço do Banco Intermediário:', lang)}</span>
                        <span className="text-slate-800 text-[11px] font-medium">{detailModalCuenta.direccionBancoIntermediario}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-medium italic">
                {tr('Información certificada de Tesorería.', 'Treasury certified information.', 'Informações certificadas de Tesouraria.', lang)}
              </span>
              <button
                onClick={() => setDetailModalCuenta(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {tr('Cerrar Ficha', 'Close Sheet', 'Fechar Ficha', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden font-sans max-h-[90vh] flex flex-col">
            <div className="bg-emerald-950 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-extrabold">
                  {editCuenta ? tr('Editar Cuenta Bancaria', 'Edit Bank Account', 'Editar Conta Bancária', lang) : tr('Nueva Cuenta Bancaria Maestra', 'New Master Bank Account', 'Nova Conta Bancária Mestra', lang)}
                </h3>
                <p className="text-[10px] text-emerald-200 mt-0.5">{tr('Maestro de Cuentas - Tesorería', 'Master Accounts - Treasury', 'Cadastro de Contas - Tesouraria', lang)}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                  {tr('Información Básica de la Cuenta', 'Basic Account Information', 'Informações Básicas da Conta', lang)}
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Sociedad Titular *', 'Holding Entity *', 'Empresa Titular *', lang)}</label>
                  <input
                    type="text"
                    required
                    value={formSociedad}
                    onChange={(e) => setFormSociedad(e.target.value)}
                    placeholder="Ej. GRUPO STT PANAMA, S.A."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('País *', 'Country *', 'País *', lang)}</label>
                    <select
                      value={formPais}
                      onChange={(e) => setFormPais(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      {ALL_COUNTRIES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Moneda *', 'Currency *', 'Moeda *', lang)}</label>
                    <input
                      type="text"
                      required
                      value={formMoneda}
                      onChange={(e) => setFormMoneda(e.target.value.toUpperCase())}
                      placeholder="USD, COP, BRL..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Entidad Bancaria *', 'Bank Entity *', 'Entidade Bancária *', lang)}</label>
                    <input
                      type="text"
                      required
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      placeholder="Ej. BAC, BBVA, Terrabank NA..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Tipo de Cuenta', 'Account Type', 'Tipo de Conta', lang)}</label>
                    <input
                      type="text"
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      placeholder="MAESTRA INTERNACIONAL"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Número de Cuenta / IBAN / CLABE *', 'Account Number / IBAN / CLABE *', 'Número da Conta / IBAN / CLABE *', lang)}</label>
                  <input
                    type="text"
                    required
                    value={formNumero}
                    onChange={(e) => setFormNumero(e.target.value)}
                    placeholder="Ej. 100305077"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Estado', 'Status', 'Status', lang)}</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="ACTIVA">{tr('ACTIVA', 'ACTIVE', 'ATIVA', lang)}</option>
                    <option value="INACTIVA">{tr('INACTIVA', 'INACTIVE', 'INATIVA', lang)}</option>
                    <option value="SUSPENDIDA">{tr('SUSPENDIDA', 'SUSPENDED', 'SUSPENSA', lang)}</option>
                  </select>
                </div>
              </div>

              {/* International Routing Details (Optional) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 pb-1 border-b border-indigo-100 flex items-center justify-between">
                  <span>{tr('Detalles de Transferencia Internacional (Opcional)', 'International Wire Transfer Details (Optional)', 'Detalhes de Transferência Internacional (Opcional)', lang)}</span>
                  <span className="text-[9px] text-slate-400 font-normal">SWIFT / ABA / Intermediario</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('RUC / Tax ID', 'Tax ID / RUC', 'CNPJ / Tax ID', lang)}</label>
                    <input
                      type="text"
                      value={formRuc}
                      onChange={(e) => setFormRuc(e.target.value)}
                      placeholder="Ej. 976655-1-531001"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('SWIFT Banco Beneficiario', 'Beneficiary Bank SWIFT', 'SWIFT Banco Beneficiário', lang)}</label>
                    <input
                      type="text"
                      value={formSwift}
                      onChange={(e) => setFormSwift(e.target.value.toUpperCase())}
                      placeholder="Ej. BCINPAPA"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('ABA Code / Routing', 'ABA Routing Code', 'Código ABA / Routing', lang)}</label>
                    <input
                      type="text"
                      value={formAba}
                      onChange={(e) => setFormAba(e.target.value)}
                      placeholder="Ej. 066012333"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('Banco Intermediario', 'Intermediary Bank', 'Banco Intermediário', lang)}</label>
                    <input
                      type="text"
                      value={formBancoIntermediario}
                      onChange={(e) => setFormBancoIntermediario(e.target.value)}
                      placeholder="Ej. DEUTSCHE BANK TRUST"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('SWIFT Intermediario', 'Intermediary SWIFT', 'SWIFT Intermediário', lang)}</label>
                    <input
                      type="text"
                      value={formSwiftIntermediario}
                      onChange={(e) => setFormSwiftIntermediario(e.target.value.toUpperCase())}
                      placeholder="Ej. BKTRUS33"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('ABA Intermediario', 'Intermediary ABA', 'ABA Intermediário', lang)}</label>
                    <input
                      type="text"
                      value={formAbaIntermediario}
                      onChange={(e) => setFormAbaIntermediario(e.target.value)}
                      placeholder="Ej. 021001033"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('Dirección del Banco Beneficiario', 'Beneficiary Bank Address', 'Endereço do Banco Beneficiário', lang)}</label>
                  <input
                    type="text"
                    value={formDireccionBanco}
                    onChange={(e) => setFormDireccionBanco(e.target.value)}
                    placeholder="Ej. AQUILINO DE GUARDIA STREET, URB. MARBELLA, PANAMÁ"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">{tr('Dirección del Beneficiario', 'Beneficiary Address', 'Endereço do Beneficiário', lang)}</label>
                  <input
                    type="text"
                    value={formDireccionBeneficiario}
                    onChange={(e) => setFormDireccionBeneficiario(e.target.value)}
                    placeholder="Ej. Panamá Pacifico, Centro de Negocios. Edificio 3835"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  {tText('Cancelar', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl cursor-pointer shadow-md"
                >
                  {editCuenta ? tr('Guardar Cambios', 'Save Changes', 'Salvar Alterações', lang) : tr('Registrar Cuenta', 'Register Account', 'Registrar Conta', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
