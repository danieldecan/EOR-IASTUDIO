import React, { useState, useEffect } from 'react';
import { Language, User, i18n } from './types';
import { api } from './api';
import LanguageSelector from './components/LanguageSelector';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import SupraDashboard from './components/SupraDashboard';
import AsesorDashboard from './components/AsesorDashboard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'portal'>('landing');
  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Attempt to restore session on boot
  useEffect(() => {
    const cachedUser = localStorage.getItem('qh_session');
    const cachedLang = localStorage.getItem('qh_lang');
    if (cachedUser) {
      try {
        const uObj = JSON.parse(cachedUser);
        setCurrentUser(uObj);
        setView('portal');
      } catch (e) {
        localStorage.removeItem('qh_session');
      }
    }
    if (cachedLang) {
      setLang(cachedLang as Language);
    }

    // Load and apply dynamic translations overlay
    const loadDynamicTranslations = async () => {
      try {
        const transList = await api.getTraducciones();
        if (Array.isArray(transList)) {
          const activeTrans = transList.filter(t => t && t.activo);
          activeTrans.forEach(t => {
            if (!t.id) return;
            const parts = t.id.split('.');
            let es = i18n.es as any;
            let en = i18n.en as any;
            let pt = i18n.pt as any;
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!es[part]) es[part] = {};
              if (!en[part]) en[part] = {};
              if (!pt[part]) pt[part] = {};
              es = es[part];
              en = en[part];
              pt = pt[part];
            }
            const lastPart = parts[parts.length - 1];
            if (t.es) es[lastPart] = t.es;
            if (t.en) en[lastPart] = t.en;
            if (t.pt) pt[lastPart] = t.pt;
          });
        }
      } catch (e) {
        console.warn('Dynamic translations overlay could not be loaded, using built-in dictionary:', e);
      } finally {
        setTranslationsLoaded(true);
      }
    };
    loadDynamicTranslations();
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('qh_lang', newLang);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('qh_session', JSON.stringify(user));
    setView('portal');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('qh_session');
    setView('login');
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 relative">
      {/* Global Offline indicator */}
      <OfflineIndicator />

      {/* Absolute Multilingual float trigger & Install button - Hidden in portal view to avoid overlapping header controls */}
      {view !== 'portal' && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2.5">
          <PWAInstallButton />
          <LanguageSelector 
            currentLanguage={lang} 
            onLanguageChange={handleLanguageChange} 
          />
        </div>
      )}

      {view === 'landing' && (
        <LandingView 
          lang={lang} 
          onNavigateToLogin={() => setView('login')} 
        />
      )}

      {view === 'login' && (
        <AuthView 
          lang={lang} 
          onLoginSuccess={handleLoginSuccess} 
          onBackToLanding={() => setView('landing')} 
        />
      )}

      {view === 'portal' && currentUser && (
        currentUser.rol === 'cliente' ? (
          <ClientDashboard 
            user={currentUser} 
            lang={lang} 
            onLanguageChange={handleLanguageChange}
            onLogout={handleLogout} 
          />
        ) : currentUser.rol === 'supracliente' ? (
          <SupraDashboard 
            user={currentUser} 
            lang={lang} 
            onLanguageChange={handleLanguageChange}
            onLogout={handleLogout} 
          />
        ) : (currentUser.rol === 'asesor_comercial' || currentUser.rol === 'asesor') ? (
          <AsesorDashboard 
            user={currentUser} 
            lang={lang} 
            onLanguageChange={handleLanguageChange}
            onLogout={handleLogout} 
          />
        ) : (
          <AdminDashboard 
            user={currentUser} 
            lang={lang} 
            onLanguageChange={handleLanguageChange}
            onLogout={handleLogout} 
          />
        )
      )}
    </div>
  );
}
