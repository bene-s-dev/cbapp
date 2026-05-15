import React, { useState } from 'react';
import { Home, MessageCircle, User } from 'lucide-react';

// Importiere die modularen Komponenten
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Questions from './components/Questions';
import Profile from './components/Profile';

// Definiere die möglichen Haupt-Ansichten der App
type View = 'login' | 'onboarding' | 'main';
// Definiere die Tabs innerhalb der Haupt-Ansicht
type Tab = 'dashboard' | 'questions' | 'profile';

/**
 * App-Komponente: Der zentrale Controller der Anwendung.
 * Steuert das Routing zwischen Login, Onboarding und den Haupt-Tabs.
 */
export default function App() {
  // State für die aktuelle Haupt-Ansicht
  const [view, setView] = useState<View>('login');
  // State für den aktuell aktiven Tab in der Haupt-Ansicht
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  /**
   * Hilfsfunktion zum Rendern des Inhalts basierend auf der aktuellen Ansicht/Tab.
   */
  const renderContent = () => {
    if (view === 'login') {
      return <Login onLogin={() => setView('onboarding')} />;
    }
    
    if (view === 'onboarding') {
      return <Onboarding onComplete={() => setView('main')} />;
    }

    if (view === 'main') {
      // Innerhalb der Haupt-Ansicht steuern wir über Tabs
      switch (activeTab) {
        case 'dashboard': return <Dashboard />;
        case 'questions': return <Questions />;
        case 'profile': return <Profile onLogout={() => setView('login')} />;
      }
    }
  };

  return (
    // Haupt-Container mit fixierter Größe für PWA-Feeling und dem Aura-Hintergrund
    <div className="h-screen w-screen overflow-hidden relative text-[#1E1B4B] select-none bg-[#F5F3FF]">
      {/* Die animierte Aura (definiert in index.css) */}
      <div className="bg-aura" />
      
      {/* Haupt-Inhaltsbereich mit Berücksichtigung der Notch (safe-top) */}
      <main className="h-full flex flex-col safe-top px-8 max-w-md mx-auto relative z-10">
        {renderContent()}
      </main>

      {/* Die Navigationsleiste (Dock) - Nur sichtbar, wenn der Nutzer eingeloggt ist */}
      {view === 'main' && (
        <nav className="nav-dock animate-in fade-in slide-in-from-bottom-10 duration-700">
          {/* Dashboard Tab */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}
          >
            <Home className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Fragen Tab */}
          <button 
            onClick={() => setActiveTab('questions')}
            className={`nav-item ${activeTab === 'questions' ? 'nav-item-active' : ''}`}
          >
            <MessageCircle className={`w-6 h-6 ${activeTab === 'questions' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Fragen</span>
          </button>

          {/* Profil Tab */}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}
          >
            <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Profil</span>
          </button>
        </nav>
      )}
    </div>
  );
}
