import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Cliente, Language, COUNTRY_FLAGS } from '../types';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Check, 
  Search, 
  Layers, 
  CornerDownRight, 
  Globe 
} from 'lucide-react';
import { isSupraMatriz, getFilialesForSupra } from './ClientHierarchyTree';

interface ClientFolderSelectorProps {
  clientes: Cliente[];
  selectedClientId: string;
  onSelectClient: (cliente: Cliente) => void;
  lang: Language;
}

export default function ClientFolderSelector({
  clientes,
  selectedClientId,
  onSelectClient,
  lang
}: ClientFolderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group into Supras and Directs
  const { supras, filialesMap, directClients } = useMemo(() => {
    const identifiedSupras = clientes.filter(c => isSupraMatriz(c, clientes));
    const filMap: Record<string, Cliente[]> = {};
    const allFilialIds = new Set<string>();

    identifiedSupras.forEach(supra => {
      const filiales = getFilialesForSupra(supra, clientes);
      filMap[supra.id] = filiales;
      filiales.forEach(f => allFilialIds.add(f.id));
    });

    const supraIds = new Set(identifiedSupras.map(s => s.id));
    const directs = clientes.filter(c => !supraIds.has(c.id) && !allFilialIds.has(c.id));

    return {
      supras: identifiedSupras,
      filialesMap: filMap,
      directClients: directs
    };
  }, [clientes]);

  // Find currently active client
  const activeClient = useMemo(() => {
    return clientes.find(c => c.id === selectedClientId) || null;
  }, [clientes, selectedClientId]);

  // Find parent supra if active client is a filial
  const parentSupra = useMemo(() => {
    if (!activeClient) return null;
    return supras.find(s => {
      const filiales = filialesMap[s.id] || [];
      return filiales.some(f => f.id === activeClient.id);
    }) || null;
  }, [activeClient, supras, filialesMap]);

  // Track folder open states
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'CLI-876': true,
    'directos': true
  });

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const query = search.trim().toLowerCase();
  const matchesSearch = (c: Cliente) => {
    if (!query) return true;
    return (
      c.empresa.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      (c.pais && c.pais.toLowerCase().includes(query))
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* TRIGGER BUTTON (SHOWS HIERARCHICAL TREE PATH) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all font-bold text-xs shadow-3xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Cambiar cliente o ver árbol de jerarquía corporativa"
      >
        {parentSupra ? (
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/80">
              <Folder className="w-3.5 h-3.5 text-amber-600" />
              <span>{parentSupra.empresa}</span>
            </span>
            <span className="text-slate-400 text-[10px]">&gt;</span>
            <span className="flex items-center gap-1 text-indigo-950 font-black">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{activeClient?.empresa || 'Seleccionar Filial'}</span>
              <span className="text-[11px]">{COUNTRY_FLAGS[activeClient?.pais || ''] || '📍'}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold text-indigo-950">{activeClient?.empresa || 'Seleccionar Cliente'}</span>
            <span className="text-[11px]">{COUNTRY_FLAGS[activeClient?.pais || ''] || '📍'}</span>
            <span className="text-[10px] text-slate-500 font-mono">({activeClient?.pais || 'Global'})</span>
          </div>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-indigo-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN POPUP: HIERARCHICAL FOLDER TREE */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Estructura Corporativa</span>
              </div>
              <span className="text-[10px] bg-indigo-800/80 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                {clientes.length} empresas
              </span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por filial, holding o país..."
                className="w-full h-8 pl-8 pr-2.5 bg-slate-800/90 border border-indigo-700/60 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Tree list container */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-3">
            {/* 1. SUPRA HOLDING FOLDERS (e.g. PAGUS LLC) */}
            {supras.map(supra => {
              const allFiliales = filialesMap[supra.id] || [];
              const filiales = query ? allFiliales.filter(matchesSearch) : allFiliales;
              const isFolderOpen = query ? true : !!openFolders[supra.id];
              const isSupraMatch = matchesSearch(supra);

              if (query && !isSupraMatch && filiales.length === 0) return null;

              return (
                <div key={supra.id} className="border border-indigo-100 rounded-xl overflow-hidden bg-indigo-50/20">
                  {/* Folder Header */}
                  <div
                    onClick={(e) => toggleFolder(supra.id, e)}
                    className="p-2.5 bg-gradient-to-r from-indigo-900/90 to-indigo-950 text-white flex items-center justify-between cursor-pointer hover:bg-indigo-900 transition-all"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="p-1 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
                        {isFolderOpen ? <FolderOpen className="w-4 h-4 text-amber-300" /> : <Folder className="w-4 h-4 text-amber-300" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-white truncate">{supra.empresa}</span>
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                            Supra Matriz
                          </span>
                        </div>
                        <span className="text-[10px] text-indigo-200 block truncate">
                          {allFiliales.length} {allFiliales.length === 1 ? 'filial asociada' : 'filiales asociadas'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-indigo-300 shrink-0">
                      <span className="text-[10px] font-semibold">{isFolderOpen ? 'Cerrar' : 'Abrir'}</span>
                      {isFolderOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Folder Contents: Filial Clients Tree */}
                  {isFolderOpen && (
                    <div className="p-2 space-y-1.5 bg-white border-t border-indigo-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-indigo-600" />
                        <span>Clientes de este Supra (Filiales):</span>
                      </div>

                      {filiales.length === 0 ? (
                        <div className="p-3 text-center text-[11px] text-slate-400 italic">
                          No hay filiales coincidentes
                        </div>
                      ) : (
                        filiales.map(filial => {
                          const isSelected = selectedClientId === filial.id;
                          return (
                            <button
                              key={filial.id}
                              type="button"
                              onClick={() => {
                                onSelectClient(filial);
                                setIsOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-300 shadow-2xs text-indigo-950'
                                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <Building2 className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs truncate flex items-center gap-1.5">
                                    <span>{filial.empresa}</span>
                                    {isSelected && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                        Activo
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                    <span>{COUNTRY_FLAGS[filial.pais] || '📍'} {filial.pais}</span>
                                    <span>&bull;</span>
                                    <span className="font-mono text-slate-400">ID: {filial.id}</span>
                                  </div>
                                </div>
                              </div>

                              {isSelected ? (
                                <div className="p-1 bg-emerald-500 text-white rounded-full shrink-0">
                                  <Check className="w-3 h-3" />
                                </div>
                              ) : (
                                <span className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0">
                                  Seleccionar
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. DIRECT CLIENTS (INDEPENDENT) */}
            {directClients.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div
                  onClick={(e) => toggleFolder('directos', e)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 bg-slate-700 text-white rounded-lg">
                      {openFolders['directos'] ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900">Clientes Directos / Independientes</span>
                      <span className="text-[10px] text-slate-500 block">
                        {directClients.length} empresas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-slate-600 shrink-0">
                    <span className="text-[10px] font-semibold">{openFolders['directos'] ? 'Cerrar' : 'Abrir'}</span>
                    {openFolders['directos'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {openFolders['directos'] && (
                  <div className="p-2 space-y-1.5 bg-white border-t border-slate-200">
                    {directClients.filter(matchesSearch).map(client => {
                      const isSelected = selectedClientId === client.id;
                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            onSelectClient(client);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 shadow-2xs text-indigo-950'
                              : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate flex items-center gap-1.5">
                                <span>{client.empresa}</span>
                                {isSelected && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                    Activo
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                <span>{COUNTRY_FLAGS[client.pais] || '📍'} {client.pais}</span>
                                <span>&bull;</span>
                                <span className="font-mono text-slate-400">ID: {client.id}</span>
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="p-1 bg-emerald-500 text-white rounded-full shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-indigo-600 font-bold hover:underline shrink-0">
                              Seleccionar
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Haz clic en una filial para cambiar de cliente</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
