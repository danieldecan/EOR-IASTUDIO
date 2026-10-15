import React, { useState, useMemo } from 'react';
import { Cliente, Trabajador, Language, COUNTRY_FLAGS } from '../types';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Users, 
  Globe, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers, 
  CornerDownRight, 
  ShieldCheck, 
  DollarSign,
  List,
  GitFork,
  Check
} from 'lucide-react';

export interface ClientHierarchyTreeProps {
  clientes: Cliente[];
  allClientes?: Cliente[];
  workers?: Trabajador[];
  contratos?: any[];
  lang: Language;
  onEditClient?: (client: Cliente) => void;
  onViewClient?: (client: Cliente) => void;
  onDeleteClient?: (client: Cliente) => void;
  onManageUsers?: (client: Cliente) => void;
  onNewClient?: (defaultJerarquia?: 'Directo' | 'Supra' | 'Filial', defaultSupraId?: string) => void;
  onSelectClient?: (client: Cliente) => void;
  selectedClientId?: string;
  isAsesor?: boolean;
}

export const isSupraMatriz = (c: Cliente, all: Cliente[]): boolean => {
  if (c.jerarquia === 'Supra' || c.tipoCliente === 'Holding' || c.tipoCliente === 'Supra' || c.id === 'CLI-876') return true;
  if (c.empresa && c.empresa.toLowerCase().includes('pagus') && (!c.supraclienteId || c.supraclienteId === 'supracliente-eor-peo@grupostt.com')) return true;
  // If other clients point to this client as their supraclienteId
  return all.some(other => other.id !== c.id && (other.supraclienteId === c.id || other.supraclienteId === c.correoContacto));
};

export const getFilialesForSupra = (supra: Cliente, all: Cliente[]): Cliente[] => {
  return all.filter(f => {
    if (f.id === supra.id) return false;
    if (f.supraclienteId && f.supraclienteId === supra.id) return true;
    if (supra.correoContacto && f.supraclienteId?.toLowerCase() === supra.correoContacto.toLowerCase()) return true;
    if (supra.empresa && f.supraclienteId?.toLowerCase() === supra.empresa.toLowerCase()) return true;
    if (supra.id === 'CLI-876' || supra.empresa.toLowerCase().includes('pagus')) {
      if (f.supraclienteId === 'CLI-876' || f.supraclienteId === 'guadalupe.gonzalez@grupostt.com') return true;
      if (f.supraclienteId && f.supraclienteId.toLowerCase().includes('pagus')) return true;
      if (f.proyecto && f.proyecto.toLowerCase().includes('pagus')) return true;
    }
    return false;
  });
};

export default function ClientHierarchyTree({
  clientes,
  allClientes,
  workers = [],
  contratos = [],
  lang,
  onEditClient,
  onViewClient,
  onDeleteClient,
  onManageUsers,
  onNewClient,
  onSelectClient,
  selectedClientId,
  isAsesor = false
}: ClientHierarchyTreeProps) {
  const masterList = allClientes && allClientes.length > 0 ? allClientes : clientes;
  
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'CLI-876': true, // Default PAGUS LLC folder open
    'directos': true
  });

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Check if a parent filter (e.g. country filter) is active
  const isParentFilterActive = allClientes && allClientes.length > 0 && clientes.length < allClientes.length;
  const parentAllowedIds = useMemo(() => new Set(clientes.map(c => c.id)), [clientes]);

  // 1. Group clients into Supras (Holdings) and Directs
  const { supras, filialesMap, directClients } = useMemo(() => {
    const identifiedSupras = masterList.filter(c => isSupraMatriz(c, masterList));
    const filMap: Record<string, Cliente[]> = {};
    const allFilialIds = new Set<string>();

    identifiedSupras.forEach(supra => {
      const filiales = getFilialesForSupra(supra, masterList);
      filMap[supra.id] = filiales;
      filiales.forEach(f => allFilialIds.add(f.id));
    });

    const supraIds = new Set(identifiedSupras.map(s => s.id));
    const directs = masterList.filter(c => !supraIds.has(c.id) && !allFilialIds.has(c.id));

    return {
      supras: identifiedSupras,
      filialesMap: filMap,
      directClients: directs
    };
  }, [masterList]);

  // Filter based on search query
  const query = search.trim().toLowerCase();

  const clientMatchesSearch = (c: Cliente): boolean => {
    if (!query) return true;
    return (
      c.empresa.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      (c.pais && c.pais.toLowerCase().includes(query)) ||
      (c.nombreContacto && c.nombreContacto.toLowerCase().includes(query)) ||
      (c.correoContacto && c.correoContacto.toLowerCase().includes(query)) ||
      (c.razonSocial && c.razonSocial.toLowerCase().includes(query)) ||
      (c.proyecto && c.proyecto.toLowerCase().includes(query))
    );
  };

  // Supras filtered by search AND parent country filter
  // CRITICAL REQUIREMENT: If a country is selected and a Supra has NO filiales in that country,
  // the Supra MUST NOT appear in that country! (It only appears where its filiales exist)
  const filteredSupras = useMemo(() => {
    return supras.filter(s => {
      const allFiliales = filialesMap[s.id] || [];
      const validFiliales = isParentFilterActive 
        ? allFiliales.filter(f => parentAllowedIds.has(f.id))
        : allFiliales;

      // If parent filter is active and this Supra has NO filiales in the country, hide it
      if (isParentFilterActive && validFiliales.length === 0 && !query) {
        return false;
      }

      if (!query) return isParentFilterActive ? validFiliales.length > 0 : true;

      const supraMatch = clientMatchesSearch(s);
      const childMatch = validFiliales.some(clientMatchesSearch);
      return supraMatch || childMatch;
    });
  }, [supras, filialesMap, query, isParentFilterActive, parentAllowedIds]);

  const filteredDirects = useMemo(() => {
    const baseDirects = isParentFilterActive 
      ? directClients.filter(d => parentAllowedIds.has(d.id))
      : directClients;
    return baseDirects.filter(clientMatchesSearch);
  }, [directClients, query, isParentFilterActive, parentAllowedIds]);

  // Total stats
  const totalFilialesCount = useMemo(() => {
    return (Object.values(filialesMap) as Cliente[][]).reduce((sum, list) => sum + list.length, 0);
  }, [filialesMap]);

  return (
    <div className="space-y-4">
      {/* HEADER CONTROLS BAR: SEARCH, STATS & VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Holding, Filial, País, Cédula o Contacto..."
              className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 transition-all"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Árbol / Carpetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista Plana</span>
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY COUNTERS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">Holdings / Supras</span>
            <strong className="text-slate-900 font-extrabold text-base">{supras.length}</strong>
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-center space-x-3">
          <div className="p-2 bg-amber-600 text-white rounded-xl shadow-2xs">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Filiales Vinculadas</span>
            <strong className="text-slate-900 font-extrabold text-base">{totalFilialesCount}</strong>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center space-x-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Clientes Directos</span>
            <strong className="text-slate-900 font-extrabold text-base">{directClients.length}</strong>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3">
          <div className="p-2 bg-slate-700 text-white rounded-xl shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Clientes Base</span>
            <strong className="text-slate-900 font-extrabold text-base">{masterList.length}</strong>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: HIERARCHICAL TREE / FOLDERS VIEW (DEFAULT & REQUESTED) */}
      {viewMode === 'tree' ? (
        <div className="space-y-6 animate-fade-in">
          {/* SECTION A: SUPRA CLIENTES / HOLDINGS CON SUS FILIALES EN CARPETA */}
          {filteredSupras.length === 0 && filteredDirects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-semibold">
              No se encontraron clientes coincidentes con "{search}".
            </div>
          ) : (
            filteredSupras.map((supra) => {
              const allFiliales = filialesMap[supra.id] || [];
              const validFiliales = isParentFilterActive 
                ? allFiliales.filter(f => parentAllowedIds.has(f.id))
                : allFiliales;
              const filiales = query ? validFiliales.filter(clientMatchesSearch) : validFiliales;
              const isOpen = query ? true : !!openFolders[supra.id];

              // Aggregate filial countries & headcount strictly for active filiales
              const filialCountries = Array.from(new Set(validFiliales.map(f => f.pais).filter(Boolean)));
              const totalWorkersInHolding = validFiliales.reduce((sum, f) => {
                return sum + workers.filter(w => w.clienteId === f.id).length;
              }, workers.filter(w => w.clienteId === supra.id).length);

              return (
                <div
                  key={supra.id}
                  className="bg-white rounded-3xl border-2 border-indigo-200 shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* FOLDER TOP HEADER: SUPRA MATRIZ CARD */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start space-x-3.5">
                      <button
                        type="button"
                        onClick={() => toggleFolder(supra.id)}
                        className="mt-0.5 p-2.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-2xl border border-amber-300/30 transition-all cursor-pointer shadow-inner shrink-0"
                        title={isOpen ? 'Colapsar carpeta' : 'Abrir carpeta y ver clientes de este Supra'}
                      >
                        {isOpen ? <FolderOpen className="w-6 h-6 text-amber-300" /> : <Folder className="w-6 h-6 text-amber-300" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                            <span>{supra.empresa}</span>
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
                            🏢 Supra Matriz / Holding
                          </span>
                          <span className="font-mono text-xs text-indigo-200 font-bold">
                            ID: {supra.id}
                          </span>
                          <span className="text-[11px] bg-indigo-800/80 text-indigo-100 font-bold px-2 py-0.5 rounded-md border border-indigo-600/40">
                            Rol: {supra.tipoCliente || 'Partners'}
                          </span>
                        </div>

                        {/* Summary details strip */}
                        <div className="text-xs text-indigo-200/90 mt-1.5 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 font-semibold">
                            <Layers className="w-3.5 h-3.5 text-amber-300" />
                            <strong>{allFiliales.length}</strong> {allFiliales.length === 1 ? 'Filial Asociada' : 'Filiales Asociadas'}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-indigo-300" />
                            <span>Presencia:</span>
                            <strong className="text-white">
                              {filialCountries.length > 0 
                                ? (filialCountries as string[]).map((p: string) => `${COUNTRY_FLAGS[p] || '📍'} ${p}`).join(', ') 
                                : `${COUNTRY_FLAGS[supra.pais] || '🌎'} ${supra.pais}`}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Colaboradores totales:</span>
                            <strong className="text-white font-mono">{totalWorkersInHolding}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FOLDER ACTIONS */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-indigo-800/60 md:border-t-0 pt-3 md:pt-0 shrink-0">
                      {onNewClient && (
                        <button
                          type="button"
                          onClick={() => onNewClient('Filial', supra.id)}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                          title={`Registrar nueva filial asociada bajo la cuenta de ${supra.empresa}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Filial</span>
                        </button>
                      )}

                      {onEditClient && (
                        <button
                          type="button"
                          onClick={() => onEditClient(supra)}
                          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all border border-white/20 cursor-pointer"
                          title="Editar datos de la empresa matriz"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Editar Matriz</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleFolder(supra.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <span>{isOpen ? 'Cerrar Carpeta' : `Ver Filiales (${allFiliales.length})`}</span>
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* FOLDER INNER CONTENT: TREE BRANCH CONTAINER FOR SUBSIDIARIES */}
                  {isOpen && (
                    <div className="p-5 bg-gradient-to-b from-indigo-50/60 to-slate-50/30 border-t border-indigo-100 space-y-4">
                      {/* Tree Branch Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-950">
                          <GitFork className="w-4 h-4 text-indigo-600" />
                          <span>Estructura de Filiales de {supra.empresa}</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                            {allFiliales.length} {allFiliales.length === 1 ? 'cliente filial' : 'clientes filiales'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Consolidadas bajo la cuenta matriz {supra.empresa}
                        </span>
                      </div>

                      {/* Subsidiaries List / Tree */}
                      {filiales.length === 0 ? (
                        <div className="p-6 text-center bg-white rounded-2xl border border-indigo-100 text-slate-400 font-semibold text-xs">
                          {allFiliales.length === 0 
                            ? `Esta empresa Supra (${supra.empresa}) aún no tiene filiales asociadas.`
                            : `Ninguna filial de ${supra.empresa} coincide con la búsqueda actual.`}
                          {onNewClient && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => onNewClient('Filial', supra.id)}
                                className="text-indigo-600 hover:underline font-bold text-xs"
                              >
                                + Registrar la primera filial ahora
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filiales.map((filial) => {
                            const filialWorkers = workers.filter(w => w.clienteId === filial.id);
                            const linkedContract = contratos.find(c => c.clienteId === filial.id);

                            return (
                              <div
                                key={filial.id}
                                className="relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 shadow-3xs hover:shadow-sm transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ml-2 sm:ml-6"
                              >
                                {/* Left visual connector icon */}
                                <div className="flex items-start space-x-3">
                                  <div className="mt-1 p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                                    <CornerDownRight className="w-4 h-4" />
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-slate-900 text-sm">
                                        {filial.empresa}
                                      </h4>
                                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        Filial de {supra.empresa}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                                        ID: {filial.id}
                                      </span>
                                    </div>

                                    {/* Operational Details Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-medium">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">País Operativo</span>
                                        <span className="font-bold text-slate-900 flex items-center gap-1">
                                          <span>{COUNTRY_FLAGS[filial.pais] || '📍'}</span>
                                          <span>{filial.pais}</span>
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Servicio / Fee</span>
                                        <span className="font-bold text-indigo-900 font-mono">
                                          ${filial.feePorEmpleado} {filial.moneda}/mes
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Colaboradores</span>
                                        <span className="font-bold text-slate-900">
                                          {filialWorkers.length} en nómina
                                          <span className="text-[10px] text-slate-400 block font-normal">
                                            ({filialWorkers.filter(w => w.estado === 'Activo').length} activos)
                                          </span>
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Estatus</span>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          filial.estado === 'Activo' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                          {filial.estado}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Legal and Commercial Extra info */}
                                    <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                                      {filial.razonSocial && (
                                        <span>Razón Social: <strong className="text-slate-800">{filial.razonSocial}</strong></span>
                                      )}
                                      {filial.nombreContacto && (
                                        <span>&bull; Contacto: <strong className="text-slate-800">{filial.nombreContacto}</strong> ({filial.correoContacto})</span>
                                      )}
                                      {linkedContract && (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                          Contrato: {linkedContract.estado}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Filial Action Buttons */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                                  {onSelectClient && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectClient(filial)}
                                      className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-3xs ${
                                        selectedClientId === filial.id
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{selectedClientId === filial.id ? 'Seleccionado' : 'Seleccionar'}</span>
                                    </button>
                                  )}

                                  {onEditClient && (
                                    <button
                                      type="button"
                                      onClick={() => onEditClient(filial)}
                                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center space-x-1 cursor-pointer shadow-3xs"
                                      title="Editar datos de esta filial"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Editar</span>
                                    </button>
                                  )}

                                  {onViewClient && (
                                    <button
                                      type="button"
                                      onClick={() => onViewClient(filial)}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                      title="Ver ficha completa"
                                    >
                                      <span>Ficha</span>
                                      <ChevronRight className="w-3 h-3 inline ml-0.5" />
                                    </button>
                                  )}

                                  {onManageUsers && (
                                    <button
                                      type="button"
                                      onClick={() => onManageUsers(filial)}
                                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-3xs"
                                      title="Gestionar usuarios de acceso"
                                    >
                                      <span>Usuarios</span>
                                    </button>
                                  )}

                                  {onDeleteClient && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteClient(filial)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-3xs"
                                      title="Eliminar filial"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* SECTION B: CLIENTES DIRECTOS E INDEPENDIENTES (CARPETA SEPARADA) */}
          {filteredDirects.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div 
                onClick={() => toggleFolder('directos')}
                className="p-4 bg-slate-100/80 hover:bg-slate-100 transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-700 text-white rounded-xl">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>Clientes Directos e Independientes</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                        {filteredDirects.length} empresas
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Clientes contratados directamente sin vinculación a holdings o supra clientes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                  <span>{openFolders['directos'] ? 'Ocultar' : 'Ver Clientes'}</span>
                  {openFolders['directos'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {openFolders['directos'] && (
                <div className="p-5 divide-y divide-slate-100 space-y-3">
                  {filteredDirects.map(c => {
                    const cWorkers = workers.filter(w => w.clienteId === c.id);
                    return (
                      <div key={c.id} className="pt-3 first:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{c.empresa}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {c.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              c.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.estado}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>País: <strong>{COUNTRY_FLAGS[c.pais] || '📍'} {c.pais}</strong></span>
                            <span>&bull;</span>
                            <span>Fee: <strong>${c.feePorEmpleado} {c.moneda}/mes</strong></span>
                            <span>&bull;</span>
                            <span>Colaboradores: <strong>{cWorkers.length}</strong></span>
                            {c.nombreContacto && (
                              <>
                                <span>&bull;</span>
                                <span>Contacto: <strong>{c.nombreContacto}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          {onSelectClient && (
                            <button
                              type="button"
                              onClick={() => onSelectClient(c)}
                              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-3xs ${
                                selectedClientId === c.id
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{selectedClientId === c.id ? 'Seleccionado' : 'Seleccionar'}</span>
                            </button>
                          )}

                          {onEditClient && (
                            <button
                              type="button"
                              onClick={() => onEditClient(c)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                            >
                              <Edit2 className="w-3 h-3 inline mr-1" />
                              <span>Editar</span>
                            </button>
                          )}
                          {onViewClient && (
                            <button
                              type="button"
                              onClick={() => onViewClient(c)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              <span>Ficha</span>
                            </button>
                          )}
                          {onManageUsers && (
                            <button
                              type="button"
                              onClick={() => onManageUsers(c)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-3xs"
                            >
                              <span>Usuarios</span>
                            </button>
                          )}
                          {onDeleteClient && (
                            <button
                              type="button"
                              onClick={() => onDeleteClient(c)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: FLAT TABLE VIEW (ALTERNATIVE FOR COMPREHENSIVE SCANNING) */
        <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">Empresa / Holding</th>
                <th className="px-4 py-3">País de Operación</th>
                <th className="px-4 py-3">EOR Fee Base</th>
                <th className="px-4 py-3">Colaboradores</th>
                <th className="px-4 py-3">Jerarquía</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {masterList.filter(clientMatchesSearch).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-semibold">
                    No hay clientes coincidentes.
                  </td>
                </tr>
              ) : (
                masterList.filter(clientMatchesSearch).map((c) => {
                  const isSupra = isSupraMatriz(c, masterList);
                  const supraParent = !isSupra && c.supraclienteId ? masterList.find(s => s.id === c.supraclienteId) : null;
                  const cWorkers = workers.filter(w => w.clienteId === c.id);

                  return (
                    <tr key={c.id} className="hover:bg-slate-55 transition-all">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {isSupra && <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            <span>{c.empresa}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">ID: {c.id} | {c.nombreContacto}</div>
                          {supraParent && (
                            <span className="inline-block mt-0.5 text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                              Filial de {supraParent.empresa}
                            </span>
                          )}
                          {isSupra && (
                            <span className="inline-block mt-0.5 text-[9px] bg-amber-50 text-amber-800 font-black px-1.5 py-0.5 rounded border border-amber-200">
                              🏢 Matriz Supra
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <span>{COUNTRY_FLAGS[c.pais] || '📍'}</span>
                          <span>{c.pais}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-900">
                        {c.feePorEmpleado.toLocaleString()} {c.moneda}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        <span className="font-bold text-slate-900">{cWorkers.length}</span>
                        <span className="text-[10px] text-slate-500 block">
                          ({cWorkers.filter(w => w.estado === 'Activo').length} activos)
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSupra ? 'bg-amber-100 text-amber-900 font-black' :
                          c.supraclienteId ? 'bg-indigo-50 text-indigo-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {isSupra ? 'Supra (Holding)' : (c.supraclienteId ? 'Filial' : 'Directo')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          c.estado === 'En mora' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => onEditClient(c)}
                            className="border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shadow-3xs cursor-pointer"
                          >
                            Editar
                          </button>
                          {onViewClient && (
                            <button
                              type="button"
                              onClick={() => onViewClient(c)}
                              className="border border-slate-200 bg-slate-50 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Ficha
                            </button>
                          )}
                          {onManageUsers && (
                            <button
                              type="button"
                              onClick={() => onManageUsers(c)}
                              className="border border-slate-200 bg-slate-50 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Usuarios
                            </button>
                          )}
                          {onDeleteClient && (
                            <button
                              type="button"
                              onClick={() => onDeleteClient(c)}
                              className="p-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
