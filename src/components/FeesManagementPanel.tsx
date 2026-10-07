import React, { useState, useEffect } from 'react';
import { TarifarioEOR, TramoTalentos, User, Cliente, ALL_COUNTRIES, Language } from '../types';
import { api } from '../api';
import { calculateFeeForTalents, OFFICIAL_DEFAULT_TARIFARIO } from '../utils/feeCalculator';
import { tr, tText } from '../utils/i18n';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Globe, 
  Users, 
  Building2, 
  Sparkles, 
  Calculator, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  Layers, 
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

interface Props {
  user: User;
  lang?: Language;
}

export default function FeesManagementPanel({ user, lang = 'es' }: Props) {
  const [tarifarios, setTarifarios] = useState<TarifarioEOR[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Simulator test widget state
  const [simPais, setSimPais] = useState<string>('Colombia');
  const [simCliente, setSimCliente] = useState<string>('Todos');
  const [simTalentos, setSimTalentos] = useState<number>(10);

  // Modal State for create/edit rate card
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editTarifario, setEditTarifario] = useState<TarifarioEOR | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState<string>('');
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formEsDefault, setFormEsDefault] = useState<boolean>(false);
  const [formPaises, setFormPaises] = useState<string[]>(['Todos']);
  const [formClientes, setFormClientes] = useState<string[]>(['Todos']);
  const [formEstado, setFormEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [formTramos, setFormTramos] = useState<TramoTalentos[]>([
    { id: 'T1', minTalentos: 1, maxTalentos: 50, etiqueta: '1 – 50 Talents', feeUsd: 350.00 },
    { id: 'T2', minTalentos: 51, maxTalentos: 80, etiqueta: '80 Talents', feeUsd: 300.00 },
    { id: 'T3', minTalentos: 81, maxTalentos: 150, etiqueta: '150 Talents', feeUsd: 280.00 },
    { id: 'T4', minTalentos: 151, maxTalentos: 320, etiqueta: '320 Talents (Cell Cap)', feeUsd: 250.00 },
    { id: 'T5', minTalentos: 321, maxTalentos: 99999, etiqueta: '500+ Talents', feeUsd: 230.00 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listTarifarios, listClientes] = await Promise.all([
        api.getTarifarios().catch(() => [OFFICIAL_DEFAULT_TARIFARIO]),
        api.getClientes().catch(() => [])
      ]);

      if (Array.isArray(listTarifarios) && listTarifarios.length > 0) {
        setTarifarios(listTarifarios);
      } else {
        setTarifarios([OFFICIAL_DEFAULT_TARIFARIO]);
      }

      setClientes(listClientes || []);
    } catch (e: any) {
      setErrorMsg(tr('Error al cargar la matriz de tarifarios.', 'Error loading rate card matrix.', 'Erro ao carregar matriz de tarifas.', lang));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tarifario?: TarifarioEOR) => {
    setErrorMsg('');
    if (tarifario) {
      setEditTarifario(tarifario);
      setFormNombre(tarifario.nombre);
      setFormDescripcion(tarifario.descripcion || '');
      setFormEsDefault(tarifario.esDefault);
      setFormPaises(tarifario.paisesAplicables || ['Todos']);
      setFormClientes(tarifario.clientesAplicables || ['Todos']);
      setFormEstado(tarifario.estado);
      setFormTramos(tarifario.tramos && tarifario.tramos.length > 0 ? [...tarifario.tramos] : []);
    } else {
      setEditTarifario(null);
      setFormNombre('');
      setFormDescripcion('');
      setFormEsDefault(false);
      setFormPaises(['Todos']);
      setFormClientes(['Todos']);
      setFormEstado('Activo');
      setFormTramos([
        { id: `T-${Date.now()}-1`, minTalentos: 1, maxTalentos: 50, etiqueta: '1 – 50 Talents', feeUsd: 350.00 },
        { id: `T-${Date.now()}-2`, minTalentos: 51, maxTalentos: 80, etiqueta: '80 Talents', feeUsd: 300.00 },
        { id: `T-${Date.now()}-3`, minTalentos: 81, maxTalentos: 150, etiqueta: '150 Talents', feeUsd: 280.00 },
        { id: `T-${Date.now()}-4`, minTalentos: 151, maxTalentos: 320, etiqueta: '320 Talents (Cell Cap)', feeUsd: 250.00 },
        { id: `T-${Date.now()}-5`, minTalentos: 321, maxTalentos: 99999, etiqueta: '500+ Talents', feeUsd: 230.00 }
      ]);
    }
    setShowModal(true);
  };

  const handleAddTramo = () => {
    const lastMax = formTramos.length > 0 ? formTramos[formTramos.length - 1].maxTalentos : 0;
    const newMin = lastMax + 1;
    const newMax = newMin + 50;

    setFormTramos([
      ...formTramos,
      {
        id: `TRM-${Date.now()}-${formTramos.length + 1}`,
        minTalentos: newMin,
        maxTalentos: newMax,
        etiqueta: `${newMin} – ${newMax} Talents`,
        feeUsd: 200.00
      }
    ]);
  };

  const handleRemoveTramo = (index: number) => {
    if (formTramos.length <= 1) {
      alert(tr('Debe conservar al menos un tramo tarifario.', 'You must keep at least one fee tier.', 'Você deve manter pelo menos uma faixa de tarifa.', lang));
      return;
    }
    setFormTramos(formTramos.filter((_, i) => i !== index));
  };

  const handleUpdateTramo = (index: number, field: keyof TramoTalentos, val: any) => {
    const updated = [...formTramos];
    updated[index] = { ...updated[index], [field]: val };
    setFormTramos(updated);
  };

  const handleToggleCountry = (country: string) => {
    if (country === 'Todos') {
      setFormPaises(['Todos']);
      return;
    }
    let current = formPaises.filter(p => p !== 'Todos');
    if (current.includes(country)) {
      current = current.filter(p => p !== country);
      if (current.length === 0) current = ['Todos'];
    } else {
      current.push(country);
    }
    setFormPaises(current);
  };

  const handleToggleClient = (clientId: string) => {
    if (clientId === 'Todos') {
      setFormClientes(['Todos']);
      return;
    }
    let current = formClientes.filter(c => c !== 'Todos');
    if (current.includes(clientId)) {
      current = current.filter(c => c !== clientId);
      if (current.length === 0) current = ['Todos'];
    } else {
      current.push(clientId);
    }
    setFormClientes(current);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre) {
      setErrorMsg(tr('El nombre del tarifario es obligatorio.', 'The rate card name is required.', 'O nome da tabela de tarifas é obrigatório.', lang));
      return;
    }
    if (formTramos.length === 0) {
      setErrorMsg(tr('Debe definir al menos un tramo tarifario por volumen.', 'You must define at least one volume fee tier.', 'Você deve definir pelo menos uma faixa de tarifa por volume.', lang));
      return;
    }

    try {
      const payload = {
        nombre: formNombre,
        descripcion: formDescripcion,
        esDefault: formEsDefault,
        paisesAplicables: formPaises,
        clientesAplicables: formClientes,
        tramos: formTramos,
        estado: formEstado,
        usuario: user.correo
      };

      if (editTarifario) {
        await api.updateTarifario(editTarifario.id, payload);
      } else {
        await api.createTarifario(payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || tr('Error al guardar el tarifario.', 'Error saving rate card.', 'Erro ao salvar tabela de tarifas.', lang));
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(tr(`¿Está seguro de eliminar el tarifario "${nombre}"?`, `Are you sure you want to delete rate card "${nombre}"?`, `Tem certeza de que deseja excluir a tabela "${nombre}"?`, lang))) return;
    try {
      await api.deleteTarifario(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || tr('Error al eliminar el tarifario.', 'Error deleting rate card.', 'Erro ao excluir tabela de tarifas.', lang));
    }
  };

  // Find official rate card
  const oficialTarifario = tarifarios.find(t => t.esDefault) || OFFICIAL_DEFAULT_TARIFARIO;
  const customTarifarios = tarifarios.filter(t => !t.esDefault);

  // Calculation result for test widget
  const simResult = calculateFeeForTalents(tarifarios, simPais, simTalentos, simCliente === 'Todos' ? undefined : simCliente);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>{tr('Gobernanza Tarifaria EOR Quick Hire', 'EOR Quick Hire Fee Governance', 'Governança de Tarifas EOR Quick Hire', lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {tr('Estructura & Matriz de Fees EOR', 'EOR Fee Structure & Matrix', 'Estrutura & Matriz de Taxas EOR', lang)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              {tr('Gestione el Tarifario Oficial Estándar por volumen de talentos y cree esquemas de precios personalizados asignados a países o clientes específicos.', 'Manage the Official Standard Rate Card by talent volume and create customized pricing schemes assigned to specific countries or clients.', 'Gerencie a Tabela Oficial Padrão por volume de talentos e crie esquemas de preços personalizados atribuídos a países ou clientes específicos.', lang)}
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Crear Nuevo Tarifario', 'Create New Rate Card', 'Criar Nova Tabela', lang)}</span>
          </button>
        </div>
      </div>

      {/* 1. TARIFARIO OFICIAL ESTÁNDAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  {oficialTarifario.nombre}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase border border-emerald-500/30">
                  {tr('Tarifario Oficial Estándar', 'Official Standard Rate Card', 'Tabela Oficial Padrão', lang)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {oficialTarifario.descripcion || tr('Aplicable automáticamente para todos los países y clientes por defecto.', 'Automatically applicable to all countries and clients by default.', 'Aplicável automaticamente para todos os países e clientes por padrão.', lang)}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal(oficialTarifario)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer border border-slate-700"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{tr('Editar Tarifario Oficial', 'Edit Official Rate Card', 'Editar Tabela Oficial', lang)}</span>
          </button>
        </div>

        {/* Clean Official Table */}
        <div className="p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold font-sans">
                  <th className="py-3.5 px-6 border-r border-slate-800 w-1/2">
                    {tr('Número de Talentos', 'Number of Talents', 'Número de Talentos', lang)}
                  </th>
                  <th className="py-3.5 px-6 border-r border-slate-800 w-1/3">
                    {tr('Fee EOR / Cabeza (USD)', 'EOR Fee / Head (USD)', 'Taxa EOR / Cabeça (USD)', lang)}
                  </th>
                  <th className="py-3.5 px-6 text-center">
                    {tr('Estado & Rango', 'Status & Range', 'Status & Faixa', lang)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-slate-50/50 font-medium text-xs text-slate-800">
                {oficialTarifario.tramos.map((tramo) => (
                  <tr key={tramo.id} className="hover:bg-white transition-colors">
                    <td className="py-4 px-6 border-r border-slate-200/80 font-bold text-slate-900 text-sm">
                      {tramo.etiqueta}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200/80 font-mono font-black text-rose-600 text-base">
                      ${tramo.feeUsd.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 font-semibold text-[11px]">
                      <span>{tr('Talentos', 'Talents', 'Talentos', lang)} {tramo.minTalentos} {tr('a', 'to', 'a', lang)} {tramo.maxTalentos >= 99999 ? '∞' : tramo.maxTalentos}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span><strong>{tr('Países aplicables:', 'Applicable countries:', 'Países aplicáveis:', lang)}</strong> {tr('Todos los Países', 'All Countries', 'Todos os Países', lang)} ({ALL_COUNTRIES.length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span><strong>{tr('Clientes aplicables:', 'Applicable clients:', 'Clientes aplicáveis:', lang)}</strong> {tr('Todos los Clientes', 'All Clients', 'Todos os Clientes', lang)}</span>
            </div>
            <div>
              <span>{tr('Última actualización:', 'Last update:', 'Última atualização:', lang)} <strong>{oficialTarifario.fechaActualizacion}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TEST & SIMULATION WIDGET */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-6 rounded-3xl border border-indigo-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-indigo-900 font-extrabold text-sm">
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span>{tr('Simulador Interno de Aplicación de Fee', 'Internal Fee Application Simulator', 'Simulador Interno de Aplicação de Taxa', lang)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{tr('País Seleccionado', 'Selected Country', 'País Selecionado', lang)}</label>
            <select
              value={simPais}
              onChange={(e) => setSimPais(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              {ALL_COUNTRIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{tr('Cliente Corporativo', 'Corporate Client', 'Cliente Corporativo', lang)}</label>
            <select
              value={simCliente}
              onChange={(e) => setSimCliente(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option value="Todos">{tr('General (Sin Tarifario Especial)', 'General (No Special Rate Card)', 'Geral (Sem Tabela Especial)', lang)}</option>
              {clientes.map(c => (
                <option key={c.id} value={c.nombreEmpresa}>{c.nombreEmpresa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{tr('Cantidad de Talentos', 'Talent Count', 'Quantidade de Talentos', lang)}</label>
            <input
              type="number"
              min={1}
              value={simTalentos}
              onChange={(e) => setSimTalentos(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr('Tarifario EOR Resultante', 'Resulting EOR Rate Card', 'Tabela EOR Resultante', lang)}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-extrabold text-slate-900">{simResult.tarifarioAplicado.nombre}</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold border border-indigo-100">
                {simResult.origen}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {tr('Tramo detectado:', 'Detected Tier:', 'Faixa detectada:', lang)} <strong>{simResult.tramoAplicado?.etiqueta}</strong> ({tr('Talentos', 'Talents', 'Talentos', lang)} {simResult.tramoAplicado?.minTalentos} - {simResult.tramoAplicado?.maxTalentos})
            </p>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr('Fee Unitario / Cabeza', 'Unit Fee / Head', 'Taxa Unitária / Cabeça', lang)}</span>
              <span className="text-xl font-black font-mono text-rose-600">${simResult.feePorCabezaUsd.toFixed(2)} USD</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{tr('Total Mensual', 'Monthly Total', 'Total Mensal', lang)} ({simTalentos} {tr('Talentos', 'Talents', 'Talentos', lang)})</span>
              <span className="text-xl font-black font-mono text-indigo-900">${simResult.feeTotalMensualUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CUSTOM RATE CARDS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {tr('Tarifarios Personalizados por País o Cliente', 'Custom Rate Cards by Country or Client', 'Tabelas Personalizadas por País ou Cliente', lang)} ({customTarifarios.length})
            </h3>
            <p className="text-xs text-slate-500">
              {tr('Esquemas tarifarios especiales creados para negociaciones específicas.', 'Special pricing schemes created for specific negotiations.', 'Esquemas tarifários especiais criados para negociações específicas.', lang)}
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Agregar Tarifario', 'Add Rate Card', 'Adicionar Tabela', lang)}</span>
          </button>
        </div>

        {customTarifarios.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center shadow-xs">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">{tr('No hay tarifarios personalizados creados', 'No custom rate cards created', 'Nenhuma tabela personalizada criada', lang)}</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              {tr('Actualmente todos los países y clientes operan bajo el Tarifario Oficial Estándar STT. Puede crear un nuevo tarifario para asignar precios especiales a países o clientes específicos.', 'Currently all countries and clients operate under the Official Standard STT Rate Card. You can create a new rate card to assign special prices to specific countries or clients.', 'Atualmente todos os países e clientes operam sob a Tabela Oficial Padrão STT. Você pode criar uma nova tabela para atribuir preços especiais a países ou clientes específicos.', lang)}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {customTarifarios.map(tf => (
              <div 
                key={tf.id} 
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      tf.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tf.estado === 'Activo' ? tr('Activo', 'Active', 'Ativo', lang) : tr('Inactivo', 'Inactive', 'Inativo', lang)}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenModal(tf)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title={tText('Editar', lang)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tf.id, tf.nombre)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title={tr('Eliminar', 'Delete', 'Excluir', lang)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm">{tf.nombre}</h4>
                  {tf.descripcion && (
                    <p className="text-xs text-slate-500 mt-0.5">{tf.descripcion}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100">
                      <Globe className="w-3 h-3 text-indigo-500" />
                      <span>{tr('Países:', 'Countries:', 'Países:', lang)} {tf.paisesAplicables.join(', ')}</span>
                    </span>

                    <span className="text-[10px] bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span>{tr('Clientes:', 'Clients:', 'Clientes:', lang)} {tf.clientesAplicables?.join(', ') || tr('Todos', 'All', 'Todos', lang)}</span>
                    </span>
                  </div>
                </div>

                {/* Table of Tiers */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">{tr('Rango Talentos', 'Talents Range', 'Faixa de Talentos', lang)}</th>
                        <th className="py-2 px-3 text-right">{tr('Fee / Head (USD)', 'Fee / Head (USD)', 'Taxa / Cabeça (USD)', lang)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {tf.tramos.map(tr => (
                        <tr key={tr.id}>
                          <td className="py-2 px-3 font-semibold">{tr.etiqueta}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">${tr.feeUsd.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden font-sans my-8">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold">
                  {editTarifario ? tr('Editar Tarifario EOR', 'Edit EOR Rate Card', 'Editar Tabela EOR', lang) : tr('Nuevo Tarifario por Volumen', 'New Volume Rate Card', 'Nova Tabela por Volume', lang)}
                </h3>
                <p className="text-[10px] text-slate-300 mt-0.5">{tr('Matriz de Precios EOR por Talentos', 'EOR Pricing Matrix by Talents', 'Matriz de Preços EOR por Talentos', lang)}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Nombre del Tarifario *', 'Rate Card Name *', 'Nome da Tabela *', lang)}</label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Tarifario Clientes VIP Corporativo 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Descripción / Observaciones', 'Description / Notes', 'Descrição / Observações', lang)}</label>
                  <input
                    type="text"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder={tr('Ej. Tarifario preferencial con descuento de volumen aplicable a Colombia y México.', 'e.g. Preferential rate card with volume discount applicable to Colombia and Mexico.', 'Ex. Tabela preferencial com desconto por volume aplicável à Colômbia e México.', lang)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Estado', 'Status', 'Status', lang)}</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Activo">{tr('Activo', 'Active', 'Ativo', lang)}</option>
                    <option value="Inactivo">{tr('Inactivo', 'Inactive', 'Inativo', lang)}</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formEsDefault}
                      onChange={(e) => setFormEsDefault(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>{tr('Establecer como Tarifario Oficial por Defecto', 'Set as Default Official Rate Card', 'Definir como Tabela Oficial Padrão', lang)}</span>
                  </label>
                </div>
              </div>

              {/* Países y Clientes Multi-select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Países donde Aplica', 'Applicable Countries', 'Países Onde se Aplica', lang)}</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1 text-[11px]">
                    <label className="flex items-center space-x-2 font-bold text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formPaises.includes('Todos')}
                        onChange={() => handleToggleCountry('Todos')}
                      />
                      <span>{tr('Todos los Países', 'All Countries', 'Todos os Países', lang)}</span>
                    </label>
                    {ALL_COUNTRIES.map(p => (
                      <label key={p} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPaises.includes(p)}
                          onChange={() => handleToggleCountry(p)}
                        />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">{tr('Clientes donde Aplica', 'Applicable Clients', 'Clientes Onde se Aplica', lang)}</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1 text-[11px]">
                    <label className="flex items-center space-x-2 font-bold text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formClientes.includes('Todos')}
                        onChange={() => handleToggleClient('Todos')}
                      />
                      <span>{tr('Todos los Clientes', 'All Clients', 'Todos os Clientes', lang)}</span>
                    </label>
                    {clientes.map(c => (
                      <label key={c.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formClientes.includes(c.nombreEmpresa)}
                          onChange={() => handleToggleClient(c.nombreEmpresa)}
                        />
                        <span>{c.nombreEmpresa}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tramos Table Configurator */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    {tr('Configuración de Tramos por Volumen de Talentos', 'Volume Fee Tiers Configuration', 'Configuração de Faixas por Volume de Talentos', lang)}
                  </label>

                  <button
                    type="button"
                    onClick={handleAddTramo}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{tr('Agregar Tramo', 'Add Tier', 'Adicionar Faixa', lang)}</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">{tr('Etiqueta Tramo', 'Tier Label', 'Rótulo da Faixa', lang)}</th>
                        <th className="p-2.5">{tr('Mín Talentos', 'Min Talents', 'Mín Talentos', lang)}</th>
                        <th className="p-2.5">{tr('Máx Talentos', 'Max Talents', 'Máx Talentos', lang)}</th>
                        <th className="p-2.5">{tr('Fee USD / Head', 'Fee USD / Head', 'Taxa USD / Cabeça', lang)}</th>
                        <th className="p-2.5 text-center">{tr('Acción', 'Action', 'Ação', lang)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {formTramos.map((trItem, idx) => (
                        <tr key={trItem.id || idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={trItem.etiqueta}
                              onChange={(e) => handleUpdateTramo(idx, 'etiqueta', e.target.value)}
                              placeholder="Ej. 1 – 50 Talents"
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={1}
                              value={trItem.minTalentos}
                              onChange={(e) => handleUpdateTramo(idx, 'minTalentos', parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={trItem.minTalentos}
                              value={trItem.maxTalentos}
                              onChange={(e) => handleUpdateTramo(idx, 'maxTalentos', parseInt(e.target.value) || trItem.minTalentos)}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={trItem.feeUsd}
                              onChange={(e) => handleUpdateTramo(idx, 'feeUsd', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-rose-600 font-mono text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTramo(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={tr('Eliminar tramo', 'Delete tier', 'Excluir faixa', lang)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  {tText('Cancelar', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl cursor-pointer shadow-md"
                >
                  {editTarifario ? tr('Guardar Cambios', 'Save Changes', 'Salvar Alterações', lang) : tr('Registrar Tarifario', 'Register Rate Card', 'Registrar Tabela', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
