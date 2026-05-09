import { useState, useEffect } from 'react';
import { Heart, ShieldAlert, Download, User, Camera, Copy, Home, MessageCircle, LayoutGrid, Settings, Stars } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<'login' | 'onboarding' | 'main'>('login');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [view, setView] = useState('home');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [user, setUser] = useState({
    name: '',
    image: null as string | null,
    code: 'DUO-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  });

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert("Nutze das Browser-Menü -> 'Zum Home-Bildschirm hinzufügen'");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUser({ ...user, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  // 1. LOGIN SCREEN
  if (appState === 'login') {
    return (
      <div className="max-w-md mx-auto h-screen flex flex-col items-center justify-center p-8 relative">
        <div className="w-20 h-20 bg-duo-card rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <Heart className="text-[#ec4899]" size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">DuoSync</h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-12 font-bold">Private Hobby Project</p>

        <div className="w-full space-y-4">
          <input type="email" placeholder="E-Mail" className="w-full p-4 bg-duo-card border border-white/5 rounded-2xl outline-none" />
          <input type="password" placeholder="Passwort" className="w-full p-4 bg-duo-card border border-white/5 rounded-2xl outline-none" />
          <button onClick={() => setShowDisclaimer(true)} className="w-full bg-[#ec4899] py-4 rounded-2xl font-bold shadow-lg shadow-pink-900/40">Einloggen</button>
        </div>

        {showDisclaimer && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all">
            <div className="bg-duo-card p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center fade-in w-full max-w-sm">
              <ShieldAlert className="text-[#eab308] mx-auto mb-4" size={32} />
              <h3 className="text-xl font-bold mb-4">Privat-Projekt</h3>
              <p className="text-sm text-slate-400 mb-8 italic">Keine öffentliche App. Keine Datensicherheit. Nur für private Zwecke.</p>

              <label className="flex items-center gap-3 mb-8 justify-center cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-pink-500 rounded" onChange={(e) => setAccepted(e.target.checked)} />
                <span className="text-xs text-slate-300">Ich akzeptiere die Bedingungen</span>
              </label>

              <div className="space-y-3">
                <button
                  disabled={!accepted}
                  onClick={() => setAppState('onboarding')}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${accepted ? 'bg-[#ec4899] text-white shadow-lg' : 'bg-white/5 text-slate-600'}`}
                >
                  Bestätigen & Weiter
                </button>

                {accepted && (
                  <button onClick={installApp} className="w-full py-4 rounded-2xl font-bold border border-white/10 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Download size={14} /> App Installieren
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ONBOARDING
  if (appState === 'onboarding') {
    return (
      <div className="max-w-md mx-auto h-screen p-8 flex flex-col justify-center fade-in">
        {onboardingStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold italic">Dein Name?</h2>
            <input type="text" placeholder="Vorname" className="w-full p-5 bg-duo-card rounded-2xl border border-white/5 outline-none" onChange={(e) => setUser({ ...user, name: e.target.value })} />
            <button onClick={() => setOnboardingStep(2)} className="w-full bg-[#ec4899] py-4 rounded-2xl font-bold">Weiter</button>
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="space-y-8 text-center">
            <h2 className="text-2xl font-bold italic text-left">Dein Profilbild</h2>
            <div className="relative mx-auto w-40 h-40">
              <div className="w-full h-full bg-duo-card rounded-[3rem] border-4 border-white/5 overflow-hidden flex items-center justify-center shadow-2xl">
                {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <User size={60} className="text-slate-600" />}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-[#ec4899] p-4 rounded-2xl shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                <Camera size={24} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <button onClick={() => setOnboardingStep(3)} className="w-full bg-[#ec4899] py-4 rounded-2xl font-bold">Code erhalten</button>
          </div>
        )}
        {onboardingStep === 3 && (
          <div className="space-y-8 text-center">
            <div className="p-8 bg-duo-card rounded-[2.5rem] border border-white/5 space-y-4">
              <h2 className="text-xl font-bold italic">Partner-Code</h2>
              <div className="bg-[#1a0f2b] p-5 rounded-2xl font-mono text-2xl text-[#ec4899] tracking-widest border border-white/5">{user.code}</div>
              <button onClick={() => { navigator.clipboard.writeText(user.code); alert('Kopiert!'); }} className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2 mx-auto mt-2">
                <Copy size={14} /> Kopieren
              </button>
            </div>
            <button onClick={() => setAppState('main')} className="w-full bg-[#ec4899] py-4 rounded-2xl font-bold shadow-lg shadow-pink-900/40">App starten 🚀</button>
          </div>
        )}
      </div>
    );
  }

  // 3. MAIN DASHBOARD
  return (
    <div className="max-w-md mx-auto h-screen bg-[#1a0f2b] flex flex-col relative overflow-hidden">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="pt-12 space-y-12 fade-in">
          <div className="text-center space-y-4">
            <div className="w-28 h-28 rounded-[2.5rem] border-4 border-[#271a3c] mx-auto overflow-hidden shadow-2xl bg-duo-card">
              {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="mt-8 opacity-20"><User size={48} /></div>}
            </div>
            <h1 className="text-2xl font-bold italic">Hi, {user.name || 'User'}!</h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-duo-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-2 shadow-lg">
              <p className="text-2xl font-black text-[#ec4899]">14</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Streak</p>
            </div>
            <div className="bg-duo-card p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-2 shadow-lg">
              <Heart className="text-[#ec4899]" size={24} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verbunden</p>
            </div>
          </div>

          <button className="w-full bg-pink-500/5 py-12 rounded-[3rem] border-2 border-dashed border-pink-500/20 flex flex-col items-center gap-3 active:scale-95 transition-transform">
            <div className="bg-[#ec4899] p-4 rounded-full shadow-lg shadow-pink-900/40">
              <Stars className="text-white" size={32} />
            </div>
            <span className="font-bold text-[#ec4899] uppercase tracking-[0.2em] text-xs font-bold">Daily Challenge</span>
          </button>
        </div>
      </main>

      <nav className="bg-[#271a3c]/80 backdrop-blur-2xl border-t border-white/5 p-4 pb-10 flex justify-around items-center">
        <button onClick={() => setView('home')}><Home className={view === 'home' ? 'text-[#ec4899]' : 'text-slate-600'} size={24} /></button>
        <button><MessageCircle className="text-slate-600" size={24} /></button>
        <button><LayoutGrid className="text-slate-600" size={24} /></button>
        <button onClick={() => setAppState('login')}><Settings className="text-slate-600" size={24} /></button>
      </nav>
    </div>
  );
}

export default App;

