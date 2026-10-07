import React, { useState } from 'react';
import { Role, User, Language, i18n } from '../types';
import { 
  MANUALS_DATA, 
  isRoleAllowedForManual, 
  downloadUserManualPDF 
} from '../utils/userManualGenerator';
import { api } from '../api';
import { 
  BookOpen, Download, Lock, CheckCircle2, ShieldAlert, 
  FileText, Users, HelpCircle, X, ChevronRight, Monitor, 
  Sparkles, Layers, ArrowRight, ExternalLink, Calculator 
} from 'lucide-react';
import { tr, translateRole } from '../utils/i18n';

interface UserManualModalProps {
  user: User;
  lang?: Language;
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: () => void;
}

export default function UserManualModal({ user, lang = 'es', isOpen, onClose, onOpenSimulator }: UserManualModalProps) {
  const [selectedRoleManual, setSelectedRoleManual] = useState<Role>(user.rol || 'cliente');
  const [downloading, setDownloading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const ALL_ROLES: { id: Role; label: string; icon: string; bg: string }[] = [
    { id: 'supracliente', label: tr('Super Admin', 'Super Admin', 'Super Admin', lang), icon: 'ShieldCheck', bg: 'bg-indigo-600' },
    { id: 'administrador', label: tr('Administrador EOR', 'EOR Administrator', 'Administrador EOR', lang), icon: 'Briefcase', bg: 'bg-slate-700' },
    { id: 'asesor_comercial', label: tr('Asesor Comercial', 'Commercial Advisor', 'Consultor Comercial', lang), icon: 'TrendingUp', bg: 'bg-emerald-600' },
    { id: 'cliente', label: tr('Cliente (Empresa)', 'Client (Company)', 'Cliente (Empresa)', lang), icon: 'Building2', bg: 'bg-sky-600' }
  ];

  if (!isOpen) return null;

  const currentManual = MANUALS_DATA[selectedRoleManual] || MANUALS_DATA['cliente'];
  const isAllowed = isRoleAllowedForManual(user.rol, selectedRoleManual);

  const handleDownloadPDF = async (targetRole: Role) => {
    if (!isRoleAllowedForManual(user.rol, targetRole)) {
      setNotification(tr(
        `Acceso Denegado: Tu rol (${translateRole(user.rol, lang)}) no tiene permisos para descargar el manual de ${translateRole(targetRole, lang)}`,
        `Access Denied: Your role (${translateRole(user.rol, lang)}) does not have permission to download the manual for ${translateRole(targetRole, lang)}`,
        `Acesso Negado: Sua função (${translateRole(user.rol, lang)}) não tem permissão para baixar o manual de ${translateRole(targetRole, lang)}`,
        lang
      ));
      return;
    }

    setDownloading(true);
    try {
      downloadUserManualPDF(targetRole, user.rol, lang as 'es' | 'en' | 'pt');
      
      // Register audit log
      try {
        await api.createAuditLog({
          tabla: 'ManualesUsuario',
          registroId: targetRole,
          campo: 'DescargaPDF',
          valorAnterior: '',
          valorNuevo: `Manual PDF ${targetRole.toUpperCase()}`,
          motivo: 'Descarga de Manual de Usuario por Rol',
          usuario: user.correo
        });
      } catch (e) {}

      setNotification(tr(
        `¡Manual PDF de ${translateRole(targetRole, lang).toUpperCase()} generado y descargado exitosamente!`,
        `PDF Manual for ${translateRole(targetRole, lang).toUpperCase()} generated and downloaded successfully!`,
        `Manual em PDF de ${translateRole(targetRole, lang).toUpperCase()} gerado e baixado com sucesso!`,
        lang
      ));
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification(err.message || tr('Error al generar el manual PDF', 'Error generating PDF manual', 'Erro ao gerar o manual em PDF', lang));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {tr('Centro de Manuales de Usuario', 'User Manuals Center', 'Centro de Manuais do Usuário', lang)}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {tr('PDF & Pantallas', 'PDF & Screens', 'PDF & Telas', lang)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr(
                  'Documentación oficial, guías de uso, pantallas y matriz de permisos por rol',
                  'Official documentation, user guides, screen flows, and permissions matrix by role',
                  'Documentação oficial, guias de uso, telas e matriz de permissões por função',
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

        {/* Notification Alert */}
        {notification && (
          <div className={`p-3 text-xs font-medium text-center transition-all ${
            notification.includes('Denegado') || notification.includes('Denied') || notification.includes('Negado') || notification.includes('Error') || notification.includes('Erro')
              ? 'bg-rose-50 text-rose-700 border-b border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
          }`}>
            {notification}
          </div>
        )}

        {/* Role Manual Selector Tabs */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {ALL_ROLES.map((r) => {
            const hasPermission = isRoleAllowedForManual(user.rol, r.id);
            const isSelected = selectedRoleManual === r.id;

            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleManual(r.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                  isSelected 
                    ? 'bg-white text-indigo-900 border-indigo-200 shadow-sm ring-2 ring-indigo-500/20' 
                    : hasPermission 
                      ? 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900' 
                      : 'bg-slate-100/50 text-slate-400 border-slate-200/60 opacity-70 cursor-not-allowed'
                }`}
              >
                {!hasPermission ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{r.label}</span>

                {!hasPermission && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-bold">
                    {tr('Restringido', 'Restricted', 'Restrito', lang)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Banner & Action Bar */}
          <div className={`p-6 rounded-2xl border transition-all ${
            isAllowed 
              ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white border-slate-800 shadow-xl' 
              : 'bg-rose-950/40 border-rose-900/50 text-rose-100'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                    {tr('Manual Oficial PDF', 'Official PDF Manual', 'Manual Oficial em PDF', lang)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {tr('Versión', 'Version', 'Versão', lang)} {currentManual.version} • {tr('Actualizado', 'Updated', 'Atualizado', lang)} {currentManual.lastUpdated}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {currentManual.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentManual.subtitle}
                </p>
                <p className="text-xs text-slate-400">
                  <strong className="text-indigo-300">{tr('Público', 'Audience', 'Público', lang)}:</strong> {currentManual.targetAudience}
                </p>
              </div>

              {/* Download PDF CTA Button */}
              <div className="flex flex-col items-stretch md:items-end space-y-2 min-w-[220px]">
                {isAllowed ? (
                  <button
                    onClick={() => handleDownloadPDF(selectedRoleManual)}
                    disabled={downloading}
                    className="flex items-center justify-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloading ? tr('Generando PDF...', 'Generating PDF...', 'Gerando PDF...', lang) : tr('Descargar Manual PDF', 'Download PDF Manual', 'Baixar Manual em PDF', lang)}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-rose-900/50 border border-rose-700/50 rounded-xl text-center">
                    <ShieldAlert className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-rose-200">{tr('Acceso Restringido', 'Restricted Access', 'Acesso Restrito', lang)}</p>
                    <p className="text-[10px] text-rose-300/80">{tr('Tu rol actual no posee nivel para este manual.', 'Your current role does not have permission for this manual.', 'Sua função atual não tem permissão para este manual.', lang)}</p>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 text-center md:text-right">
                  {tr('Formato A4 oficial listo para impresión y auditoría', 'Official A4 format ready for printing and audit', 'Formato A4 oficial pronto para impressão e auditoria', lang)}
                </p>
              </div>
            </div>
          </div>

          {/* Access Warning if Blocked */}
          {!isAllowed && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-900 text-xs">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{tr('Política de Seguridad y Control de Acceso por Rol', 'Security Policy & Access Control by Role', 'Política de Segurança e Controle de Acesso por Função', lang)}</p>
                <p className="text-amber-800/90 mt-0.5">
                  {tr(
                    `Los manuales de operativas avanzadas contienen procedimientos restringidos. Los usuarios con rol ${translateRole(user.rol, lang)} solo pueden acceder a sus manuales correspondientes.`,
                    `Advanced operational manuals contain restricted procedures. Users with the role ${translateRole(user.rol, lang)} can only access their corresponding manuals.`,
                    `Os manuais de operações avançadas contêm procedimentos restritos. Usuários com a função ${translateRole(user.rol, lang)} só podem acessar seus manuais correspondentes.`,
                    lang
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Matrix of Permissions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {tr('Matriz de Permisos & Alcance por Módulo', 'Permissions Matrix & Scope by Module', 'Matriz de Permissões & Escopo por Módulo', lang)}
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {currentManual.permissionsMatrix.length} {tr('Módulos configurados', 'Configured modules', 'Módulos configurados', lang)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">{tr('Módulo', 'Module', 'Módulo', lang)}</th>
                    <th className="p-3">{tr('Nivel de Acceso', 'Access Level', 'Nível de Acesso', lang)}</th>
                    <th className="p-3">{tr('Observaciones y Alcance', 'Notes & Scope', 'Observações e Escopo', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentManual.permissionsMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{item.module}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.accessLevel}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Screen Descriptions & Step-by-Step Sections */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {tr('Pantallas del Sistema y Guía Paso a Paso', 'System Screens & Step-by-Step Guide', 'Telas do Sistema e Guia Passo a Passo', lang)}
              </h4>
            </div>

            {currentManual.sections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                
                {/* Section Header */}
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {idx + 1}
                  </span>
                  <h5 className="text-base font-bold text-slate-800">
                    {section.title}
                  </h5>
                </div>

                {/* Simulated Screen Mockup Card */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 text-slate-200 text-xs shadow-inner space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="ml-2 font-mono text-slate-400">Quick Hire Platform v2.5 • {section.title}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-semibold">
                      {tr('Vista Interactiva', 'Interactive View', 'Visão Interativa', lang)}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans pt-1">
                    <strong className="text-indigo-400">{tr('Anotación de Pantalla', 'Screen Note', 'Nota da Tela', lang)}:</strong> {section.screenDescription}
                  </p>
                </div>

                {/* Step List */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {tr('Modo de Uso y Secuencia de Pasos:', 'Usage Mode & Sequence of Steps:', 'Modo de Uso e Sequência de Passos:', lang)}
                  </p>
                  
                  <div className="space-y-2">
                    {section.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                          {stepIdx + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Status Table inside Section */}
                {section.tableData && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {tr('Tabla de Referencia de Estados:', 'Status Reference Table:', 'Tabela de Referência de Status:', lang)}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            {section.tableData.headers.map((h, i) => (
                              <th key={i} className="p-2 border-b border-slate-200">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {section.tableData.rows.map((row, rI) => (
                            <tr key={rI} className="hover:bg-slate-50">
                              {row.map((cell, cI) => (
                                <td key={cI} className="p-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {tr('Preguntas Frecuentes y Solución de Incidencias', 'FAQ & Issue Resolution', 'Perguntas Frequentes e Resolução de Problemas', lang)}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentManual.faq.map((item, fIdx) => (
                <div key={fIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <p className="text-xs font-bold text-indigo-900 flex items-start space-x-1.5">
                    <span className="text-indigo-600">Q:</span>
                    <span>{item.question}</span>
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4 border-l-2 border-indigo-200">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{tr('Documento Validado e Integrado en Quick Hire EOR System', 'Validated Document Integrated in Quick Hire EOR System', 'Documento Validado e Integrado no Quick Hire EOR System', lang)}</span>
          </div>

          <div className="flex items-center space-x-3">
            {onOpenSimulator && (user.rol === 'asesor_comercial' || user.rol === 'supracliente') && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSimulator();
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-sm"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{tr('Abrir Simulador de Cotizaciones', 'Open Quote Simulator', 'Abrir Simulador de Cotações', lang)}</span>
              </button>
            )}

            {isAllowed && (
              <button
                onClick={() => handleDownloadPDF(selectedRoleManual)}
                disabled={downloading}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? tr('Descargando...', 'Downloading...', 'Baixando...', lang) : tr('Descargar PDF', 'Download PDF', 'Baixar PDF', lang)}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl transition-all"
            >
              {tr('Cerrar', 'Close', 'Fechar', lang)}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
