import React, { useState } from 'react';
import { api } from '../api';
import { i18n, Language, SolicitudEOR, LATAM_COUNTRIES, COUNTRY_FLAGS } from '../types';
import { Globe, Users, Coins, CheckCircle, ArrowRight, ShieldCheck, PlusCircle, Home, Check, MapPin } from 'lucide-react';

interface Props {
  lang: Language;
  onNavigateToLogin: () => void;
}

export default function LandingView({ lang, onNavigateToLogin }: Props) {
  const t = i18n[lang].landing;
  const commonT = i18n[lang].common;

  // Form states
  const [empresa, setEmpresa] = useState('');
  const [pais, setPais] = useState('México');
  const [paisesSeleccionados, setPaisesSeleccionados] = useState<string[]>(['México', 'Colombia']);
  const [servicioRequerido, setServicioRequerido] = useState('Employer of Record (EOR)');
  const [moneda, setMoneda] = useState('USD');
  const [cantidadTrabajadores, setCantidadTrabajadores] = useState(5);
  const [nombreContacto, setNombreContacto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdRequest, setCreatedRequest] = useState<SolicitudEOR | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa || !nombreContacto || !correo) {
      setError(lang === 'es' ? 'Por favor completa todos los campos requeridos.' : lang === 'en' ? 'Please fill in all required fields.' : 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (pais === 'Regional' && paisesSeleccionados.length === 0) {
      setError(lang === 'es' ? 'Por favor selecciona al menos un país para la operación regional.' : 'Please select at least one country for regional operation.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = {
        empresa,
        pais: pais === 'Regional' ? 'Regional' : pais,
        esRegional: pais === 'Regional',
        paisesOperacion: pais === 'Regional' ? paisesSeleccionados : [pais],
        servicioRequerido,
        moneda,
        cantidadTrabajadores,
        nombreContacto,
        correo,
        telefono,
        observaciones,
      };
      const res = await api.createSolicitud(data);
      setCreatedRequest(res);
      setSuccess(true);
      // Reset form
      setEmpresa('');
      setNombreContacto('');
      setCorreo('');
      setTelefono('');
      setObservaciones('');
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="landing-view-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Hero Section */}
      <div id="hero-banner" className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white py-16 md:py-24 px-4 md:px-8 border-b border-indigo-950">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Global Compliant Employer of Record</span>
            </div>
            <h1 id="landing-title" className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {t.title}
            </h1>
            <p id="landing-subtitle" className="text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a href="#solicitud-form-section" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg hover:shadow-indigo-500/20 transition-all">
                <span>{lang === 'es' ? 'Iniciar Solicitud' : lang === 'en' ? 'Start Application' : 'Iniciar Solicitação'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button onClick={onNavigateToLogin} className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-lg border border-slate-700 transition-all">
                {t.accessSystem}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="text-sm font-semibold text-indigo-400 uppercase tracking-widest">
              {lang === 'es' ? 'Servicios Destacados' : lang === 'en' ? 'Featured Services' : 'Serviços em Destaque'}
            </div>
            <div className="space-y-4 text-slate-300">
              <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Employer of Record (EOR)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Contratación 100% legal, nómina local, aportes y seguro social en América Latina.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Soporte Multimoneda LATAM</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Gestión de nóminas en MXN, COP, BRL, CLP, PEN, USD y monedas locales con máxima flexibilidad.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">{t.featuresTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t.feat1Title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{t.feat1Desc}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t.feat2Title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{t.feat2Desc}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t.feat3Title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{t.feat3Desc}</p>
          </div>
        </div>
      </div>

      {/* Interactive Form Section */}
      <div id="solicitud-form-section" className="max-w-4xl mx-auto py-8 px-4 pb-24">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-900 text-white p-8 md:p-10 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">{t.formTitle}</h2>
            <p className="text-indigo-200 text-sm">{t.formSubtitle}</p>
          </div>

          <div className="p-8 md:p-10">
            {success ? (
              <div id="landing-success-card" className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">{t.successTitle}</h3>
                  <p className="text-slate-600 text-sm max-w-lg mx-auto">{t.successDesc}</p>
                  <p className="text-emerald-800 font-medium text-xs bg-emerald-100/70 inline-block px-3.5 py-1.5 rounded-full border border-emerald-200 mt-2">
                    {lang === 'es' 
                      ? `Se ha enviado un correo de confirmación a ${createdRequest?.correo || 'tu correo electrónico'}. Un asesor comercial te contactará a la brevedad.` 
                      : lang === 'en'
                      ? `A confirmation email has been sent to ${createdRequest?.correo || 'your email'}. An advisor will reach out shortly.`
                      : `Um e-mail de confirmação foi enviado para ${createdRequest?.correo || 'seu e-mail'}. Um consultor entrará em contato em breve.`}
                  </p>
                </div>
                {createdRequest && (
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 text-left max-w-md mx-auto text-xs space-y-2 text-slate-700 shadow-sm">
                    <p className="font-bold text-slate-900 border-b pb-1.5 uppercase text-slate-500 tracking-wider">
                      {lang === 'es' ? 'Ticket de Solicitud Generado' : 'Request Ticket Generated'}
                    </p>
                    <div className="grid grid-cols-2 gap-y-1">
                      <span className="font-semibold text-slate-500">ID:</span>
                      <span className="font-mono font-bold text-indigo-600 text-right">{createdRequest.id}</span>
                      <span className="font-semibold text-slate-500">Empresa:</span>
                      <span className="text-right font-medium">{createdRequest.empresa}</span>
                      <span className="font-semibold text-slate-500">País / Alcance:</span>
                      <span className="text-right font-medium">
                        {createdRequest.esRegional || createdRequest.pais === 'Regional' ? (
                          <span className="inline-flex flex-col items-end">
                            <span className="font-bold text-indigo-700">🌎 Regional</span>
                            {createdRequest.paisesOperacion && createdRequest.paisesOperacion.length > 0 && (
                              <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                                ({createdRequest.paisesOperacion.length} países: {createdRequest.paisesOperacion.join(', ')})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>{COUNTRY_FLAGS[createdRequest.pais] ? `${COUNTRY_FLAGS[createdRequest.pais]} ` : ''}{createdRequest.pais}</span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-500">Servicio:</span>
                      <span className="text-right truncate">{createdRequest.servicioRequired || createdRequest.servicioRequerido}</span>
                      <span className="font-semibold text-slate-500">Correo Notificado:</span>
                      <span className="text-right truncate text-indigo-700 font-medium">{createdRequest.correo}</span>
                      <span className="font-semibold text-slate-500">Estado Inicial:</span>
                      <span className="text-right text-amber-600 font-bold">{createdRequest.estado}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm shadow-sm flex items-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'es' ? 'Realizar Otra Solicitud' : lang === 'en' ? 'Submit Another Request' : 'Enviar Outra Solicitação'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSuccess(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm shadow-sm flex items-center space-x-2 border border-slate-700"
                  >
                    <Home className="w-4 h-4" />
                    <span>{lang === 'es' ? 'Volver a la Página Principal' : lang === 'en' ? 'Back to Main Page' : 'Voltar à Página Principal'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Empresa */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.companyName} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        placeholder="Ej. Acme Latin Corp"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Pais */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.country} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={pais}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPais(val);
                        if (val === 'Regional' && paisesSeleccionados.length === 0) {
                          setPaisesSeleccionados(['México', 'Colombia']);
                        }
                      }}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold ${
                        pais === 'Regional'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-200 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'
                      }`}
                    >
                      <option value="Regional" className="font-bold text-indigo-700 py-1">
                        🌎 Regional (Multi-país LATAM)
                      </option>
                      <optgroup label="Países Individuales">
                        {LATAM_COUNTRIES.map(c => (
                          <option key={c} value={c}>
                            {COUNTRY_FLAGS[c] ? `${COUNTRY_FLAGS[c]} ` : ''}{c}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Despliegue de selección de países regionales cuando se elige 'Regional' */}
                  {pais === 'Regional' && (
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/40 border-2 border-indigo-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-100 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>{lang === 'es' ? 'Despliegue de Países para Operación Regional' : 'Regional Countries Deployment'}</span>
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                                {paisesSeleccionados.length} {lang === 'es' ? 'seleccionados' : 'selected'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-600">
                              {lang === 'es' 
                                ? 'Haz clic para seleccionar o desmarcar cada país donde tu empresa contratará o gestionará personal:' 
                                : 'Click to select or deselect each country where your company will hire or operate:'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setPaisesSeleccionados([...LATAM_COUNTRIES])}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span>✓ {lang === 'es' ? 'Seleccionar Todos (18)' : 'Select All (18)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaisesSeleccionados([])}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <span>{lang === 'es' ? 'Limpiar' : 'Clear'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Grid interactivo de países */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {LATAM_COUNTRIES.map((c) => {
                          const isSelected = paisesSeleccionados.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setPaisesSeleccionados(paisesSeleccionados.filter(p => p !== c));
                                } else {
                                  setPaisesSeleccionados([...paisesSeleccionados, c]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold ring-2 ring-indigo-300'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 font-medium'
                              }`}
                            >
                              <span className="flex items-center space-x-1.5 truncate">
                                <span className="text-sm leading-none shrink-0">{COUNTRY_FLAGS[c] || '🌎'}</span>
                                <span className="truncate">{c}</span>
                              </span>
                              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ml-1 text-[9px] ${
                                isSelected ? 'bg-white text-indigo-700 font-black' : 'border border-slate-300'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Resumen de selección actual */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-100/80 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-600 text-[11px]">
                            {lang === 'es' ? 'Países incluidos:' : 'Included countries:'}
                          </span>
                          {paisesSeleccionados.length === 0 ? (
                            <span className="text-rose-600 font-bold text-[11px] animate-pulse">
                              ⚠️ {lang === 'es' ? 'Por favor marca al menos un país para la operación regional' : 'Please select at least one country'}
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {paisesSeleccionados.map(c => (
                                <span key={c} className="inline-flex items-center space-x-1 bg-white border border-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                                  <span>{COUNTRY_FLAGS[c] || ''}</span>
                                  <span>{c}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Servicio Requerido */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.serviceRequired}
                    </label>
                    <select
                      value={servicioRequerido}
                      onChange={(e) => setServicioRequerido(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="Employer of Record (EOR)">Employer of Record (EOR)</option>
                    </select>
                  </div>

                  {/* Moneda Preferida */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.currency}
                    </label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="MXN">MXN ($)</option>
                      <option value="COP">COP ($)</option>
                      <option value="BRL">BRL (R$)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  {/* Cantidad Estimada Trabajadores */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.employeesEst}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadTrabajadores}
                      onChange={(e) => setCantidadTrabajadores(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Nombre Contacto (Quien envía la solicitud) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.contactName} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreContacto}
                      onChange={(e) => setNombreContacto(e.target.value)}
                      placeholder="Ej. Sofía Martínez (Persona que solicita)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Correo Electrónico del Solicitante (Donde se enviará la notificación) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.email} (Notificación de Confirmación) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="ejemplo@empresa.com (recibirá el comprobante)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Telefono */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.notes}
                  </label>
                  <textarea
                    rows={4}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Describe tus necesidades de contratación, perfiles requeridos o plazos estimativos..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {loading ? commonT.loading : t.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-white font-bold text-lg tracking-wider">QUICK HIRE</span>
            <p className="text-xs text-slate-500">Employer of Record System. MVP v1.0.0 © 2026</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400">
            <span className="hover:text-indigo-400 cursor-pointer">México</span>
            <span className="hover:text-indigo-400 cursor-pointer">Colombia</span>
            <span className="hover:text-indigo-400 cursor-pointer">Brasil</span>
            <span className="hover:text-indigo-400 cursor-pointer">Chile</span>
            <span className="hover:text-indigo-400 cursor-pointer">Perú</span>
            <span className="hover:text-indigo-400 cursor-pointer">Argentina</span>
            <span className="hover:text-indigo-400 cursor-pointer">Ecuador</span>
            <span className="hover:text-indigo-400 cursor-pointer">Uruguay</span>
            <span className="hover:text-indigo-400 cursor-pointer">Costa Rica</span>
            <span className="hover:text-indigo-400 cursor-pointer">Panamá</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
