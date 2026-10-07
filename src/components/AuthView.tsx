import React, { useState } from 'react';
import { api } from '../api';
import { i18n, Language, User } from '../types';
import { Mail, AlertCircle, ShieldCheck, ArrowLeft, LogIn, Lock, Eye, EyeOff } from 'lucide-react';

interface Props {
  lang: Language;
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

export default function AuthView({ lang, onLoginSuccess, onBackToLanding }: Props) {
  const t = i18n[lang].auth;
  const commonT = i18n[lang].common;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(
        lang === 'es' 
          ? 'Por favor ingresa tu correo y contraseña' 
          : lang === 'en' 
          ? 'Please enter your email and password' 
          : 'Por favor, insira seu e-mail e senha'
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.login(email.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError((res as any).error || t.invalidCreds);
      }
    } catch (err: any) {
      setError(err?.message || t.invalidCreds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-view-root" className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Navbar Header */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pb-4">
        <button
          id="auth-back-button"
          onClick={onBackToLanding}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition-all hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Volver al Inicio' : lang === 'en' ? 'Back to Landing' : 'Voltar ao Início'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs">
            STT
          </div>
          <span className="font-extrabold text-slate-900 text-xs">Quick Hire</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {t.loginTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            {lang === 'es'
              ? 'Ingresa tu correo y contraseña para acceder a la plataforma.'
              : lang === 'en'
              ? 'Enter your email and password to access the platform.'
              : 'Insira seu e-mail e senha para acessar a plataforma.'}
          </p>
        </div>

        {error && (
          <div id="auth-error-banner" className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Single Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-email-input"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'es' ? 'tu.correo@empresa.com' : lang === 'en' ? 'your.email@company.com' : 'seu.email@empresa.com'}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98 disabled:opacity-50 mt-3 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? commonT.loading : t.enter}</span>
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 font-medium max-w-md w-full mx-auto">
        <p>© 2026 Quick Hire / Grupo STT — Plataforma Unificada EOR</p>
      </div>
    </div>
  );
}
