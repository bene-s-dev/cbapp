import React, { useState } from 'react';
import { 
  Heart, Home, MessageCircle, User, LogIn, 
  ShieldCheck, Camera, Link2, Sparkles, Flame,
  Download, ArrowRight, Chrome
} from 'lucide-react';

type View = 'login' | 'onboarding' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerCode, setPartnerCode] = useState('');

  const renderLogin = () => (
    <div className="flex-1 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mt-12 space-y-2 text-center">
        <div className="inline-flex p-4 rounded-[2.5rem] bg-purple-600/20 mb-4">
          <Heart className="w-10 h-10 text-purple-400 fill-current" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">DuoSync</h1>
        <p className="text-white/40 font-medium">Connect. Sync. Love.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <input type="text" placeholder="Benutzername" className="input-field" />
          <input type="password" placeholder="Passwort" className="input-field" />
        </div>
        
        <button onClick={() => setView('onboarding')} className="btn-pill btn-primary w-full">
          Login
        </button>
        
        <button className="btn-pill btn-secondary w-full">
          Registrieren
        </button>

        <button className="text-white/30 text-sm font-semibold w-full py-2">
          Passwort vergessen?
        </button>
      </div>

      <div className="pb-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Oder</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button className="btn-pill btn-google w-full gap-3">
          <Chrome className="w-5 h-5" />
          Google Login
        </button>

        <button className="flex items-center justify-center gap-2 w-full text-purple-400 font-bold text-sm">
          <Download className="w-4 h-4" />
          App installieren
        </button>
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="flex-1 flex flex-col justify-between py-12 animate-in fade-in slide-in-from-right-8 duration-500">
      <header>
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= onboardingStep ? 'bg-purple-500' : 'bg-white/10'}`} 
            />
          ))}
        </div>
      </header>

      {onboardingStep === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 rounded-[2.5rem] bg-purple-500/10 border border-purple-500/20 inline-block">
            <ShieldCheck className="w-12 h-12 text-purple-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black">Datenschutz</h2>
            <p className="text-white/50 leading-relaxed">
              Deine Privatsphäre ist uns wichtig. Alle Daten werden Ende-zu-Ende verschlüsselt und nur für euch beide synchronisiert.
            </p>
          </div>
          <label className="flex items-center gap-4 p-6 glass-card border-none">
            <input 
              type="checkbox" 
              className="w-6 h-6 rounded-lg bg-white/10 border-white/20 checked:bg-purple-500 accent-purple-500"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />
            <span className="text-sm font-medium text-white/70">Ich akzeptiere die Datenschutzbestimmungen</span>
          </label>
        </div>
      )}

      {onboardingStep === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative group mx-auto w-32 h-32">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white/20" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-purple-600 rounded-2xl shadow-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black">Dein Profil</h2>
            <p className="text-white/50">Wie soll dein Partner dich nennen?</p>
            <input 
              type="text" 
              placeholder="Dein Name" 
              className="input-field"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>
      )}

      {onboardingStep === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 rounded-[2.5rem] bg-purple-500/10 border border-purple-500/20 inline-block">
            <Link2 className="w-12 h-12 text-purple-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black">Partner Link</h2>
            <p className="text-white/50">Gib den Code deines Partners ein, um eure Profile zu verknüpfen.</p>
            <input 
              type="text" 
              placeholder="X7-Q9-Z2" 
              className="input-field text-center font-mono tracking-widest uppercase"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
            />
          </div>
        </div>
      )}

      <button 
        disabled={onboardingStep === 1 && !privacyAccepted}
        onClick={() => {
          if (onboardingStep < 3) setOnboardingStep(onboardingStep + 1);
          else setView('dashboard');
        }}
        className="btn-pill btn-primary w-full gap-2"
      >
        {onboardingStep === 3 ? 'Fertig' : 'Weiter'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col animate-in fade-in duration-700">
      <header className="py-8 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black">Hallo {userName || 'Lana'}</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Partner online</span>
          </div>
        </div>
        <div className="w-14 h-14 glass-card p-1 rounded-2xl overflow-hidden">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'Lana'}`} 
            className="w-full h-full rounded-xl"
            alt="Profile"
          />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-orange-500/20 rounded-2xl">
            <Flame className="w-6 h-6 text-orange-500 fill-current" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">12</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Flammen</p>
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl">
            <Sparkles className="w-6 h-6 text-purple-500 fill-current" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">98%</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Match-Score</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="glass-card p-8 bg-gradient-to-br from-purple-600/20 to-transparent">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Heutige Frage</p>
          <h3 className="text-xl font-bold leading-snug mb-6">Was war der schönste Moment, den wir diese Woche geteilt haben?</h3>
          <button className="btn-pill btn-primary w-full text-sm">Beantworten</button>
        </div>
      </div>

      <div className="nav-dock">
        <button className="nav-item nav-item-active">
          <Home className="w-7 h-7" />
        </button>
        <button className="nav-item">
          <MessageCircle className="w-7 h-7" />
        </button>
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(147,51,234,0.4)] -mt-12 border-4 border-[#0f0a1a]">
          <Heart className="w-8 h-8 text-white fill-current" />
        </div>
        <button className="nav-item">
          <Sparkles className="w-7 h-7" />
        </button>
        <button className="nav-item">
          <User className="w-7 h-7" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden relative text-white select-none bg-[#0f0a1a]">
      <div className="bg-aura" />
      
      <main className="h-full flex flex-col safe-top px-8 max-w-md mx-auto relative z-10">
        {view === 'login' && renderLogin()}
        {view === 'onboarding' && renderOnboarding()}
        {view === 'dashboard' && renderDashboard()}
      </main>
    </div>
  );
}
