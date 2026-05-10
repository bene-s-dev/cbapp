import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldAlert, User, Camera, 
  Copy, Home, MessageCircle, LayoutGrid, Stars,
  ChevronRight, CheckCircle2, Settings, LogOut,
  Zap, Sparkles, Flame
} from 'lucide-react';

type View = 'login' | 'onboarding' | 'dashboard' | 'questions' | 'results' | 'profile';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [userName, setUserName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  // Einfacher Page-Transition-Effekt
  useEffect(() => {
    setIsChanging(true);
    const timer = setTimeout(() => setIsChanging(false), 400);
    return () => clearTimeout(timer);
  }, [view]);

  const questions = [
    "Wie wichtig ist dir gemeinsame Zeit?",
    "Was ist deine bevorzugte Love Language?",
    "Wie stellst du dir ein perfektes Date vor?"
  ];

  // --- VIEWS ---

  const LoginView = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] space-y-12">
      <div className="relative group cursor-pointer">
        <div className="absolute inset-0 bg-cyan-500 blur-[60px] opacity-25 group-hover:opacity-50 transition-opacity duration-700" />
        <div className="relative w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
          <Heart className="text-[#1a0f2b] w-16 h-16 fill-current" />
        </div>
      </div>
      
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black tracking-tighter italic">DuoSync</h1>
        <p className="text-white/40 font-medium tracking-[0.2em] uppercase text-xs">Deep Connection • High Style</p>
      </div>

      <button 
        onClick={() => setView('onboarding')}
        className="group relative w-72"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-100 transition-opacity" />
        <div className="relative py-6 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-3 tracking-widest text-sm">
          STARTEN <Zap className="w-4 h-4 fill-current" />
        </div>
      </button>
    </div>
  );

  const OnboardingView = () => (
    <div className="space-y-10 py-6">
      <div className="space-y-2">
        <h2 className="text-4xl font-black italic">Identity</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-transparent rounded-full" />
      </div>

      <div className="glass-panel p-8 rounded-[3rem] space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center group cursor-pointer">
            <Camera className="w-8 h-8 text-white/20 group-hover:text-white/60 transition-colors" />
            <div className="absolute bottom-1 right-1 bg-cyan-500 p-2 rounded-full shadow-lg shadow-cyan-500/40">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Avatar wählen</span>
        </div>

        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Dein Name" 
            className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 transition-all"
            onChange={(e) => setUserName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Partner-Code" 
            className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl outline-none text-center font-mono tracking-[0.5em] uppercase text-cyan-400"
          />
        </div>
      </div>

      <button 
        onClick={() => setView('dashboard')}
        className="w-full py-6 bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-black rounded-3xl shadow-2xl shadow-cyan-500/20 active:scale-95 transition-all"
      >
        PROFIL SPEICHERN
      </button>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic">Hi, {userName || 'Explorer'}</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Digital Love Sync</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#0d0716] rounded-2xl overflow-hidden p-1">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'seed'}`} alt="Avatar" />
          </div>
        </div>
      </div>

      <div className="glass-panel p-10 relative group cursor-pointer" onClick={() => setView('questions')}>
        <div className="absolute top-6 right-6 px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/40">
          <span className="text-[10px] font-black text-cyan-400 animate-pulse tracking-tighter">SYNC LIVE</span>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
           <Stars className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </div>
        <h3 className="text-2xl font-black mb-2">Daily Quiz</h3>
        <p className="text-white/40 text-sm leading-relaxed mb-8">Eure tägliche Dosis Verbindung ist bereit. Jetzt 3 Fragen beantworten.</p>
        <div className="w-full py-5 bg-white text-black font-black rounded-2xl text-center shadow-xl shadow-white/5">
            STARTEN
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-6 flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-white/30 tracking-widest">STREAK</span>
            <div className="flex items-center gap-2">
                <span className="text-2xl font-black">12</span>
                <Flame className="w-5 h-5 text-orange-500 fill-current" />
            </div>
        </div>
        <div className="glass-panel p-6 flex flex-col items-center gap-2">
            <span className="text-[10px] font-black text-white/30 tracking-widest">MATCH</span>
            <div className="flex items-center gap-2">
                <span className="text-2xl font-black">94%</span>
                <Heart className="w-5 h-5 text-pink-500 fill-current" />
            </div>
        </div>
      </div>
    </div>
  );

  const QuestionsView = () => (
    <div className="flex flex-col min-h-[80vh] justify-between py-10">
      <div className="space-y-16">
        <div className="flex justify-center gap-3">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentQuestion ? 'w-16 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'w-4 bg-white/10'}`} />
          ))}
        </div>
        <h2 className="text-4xl font-black text-center leading-[1.1] italic px-2">
            {questions[currentQuestion]}
        </h2>
      </div>
      
      <div className="space-y-4">
        {['Sehr wichtig', 'Eher wichtig', 'Neutral', 'Absolut nicht'].map((option, idx) => (
          <button 
            key={option}
            onClick={() => {
              if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(curr => curr + 1);
              } else {
                setView('results');
                setCurrentQuestion(0);
              }
            }}
            className="w-full p-6 glass-panel flex justify-between items-center hover:bg-white hover:text-black transition-all group active:scale-95"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <span className="font-bold text-lg">{option}</span>
            <ChevronRight className="w-6 h-6 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative p-6 pb-32">
      {/* Animierte Lichter im Hintergrund */}
      <div className="glow-bg">
        <div className="glow-circle w-[500px] h-[500px] bg-cyan-600 top-[-10%] left-[-15%]" />
        <div className="glow-circle w-[400px] h-[400px] bg-pink-600 bottom-[-5%] right-[-10%]" style={{ animationDelay: '-7s' }} />
      </div>

      <main className={`max-w-md mx-auto transition-all duration-400 ${isChanging ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
        {view === 'login' && <LoginView />}
        {view === 'onboarding' && <OnboardingView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'questions' && <QuestionsView />}
        {view === 'results' && (
            <div className="text-center py-20 space-y-10">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-4xl font-black italic">Done!</h2>
                <button onClick={() => setView('dashboard')} className="w-full py-6 glass-panel font-black uppercase tracking-widest">Zurück</button>
            </div>
        )}
        {view === 'profile' && (
            <div className="space-y-10">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 rounded-[3rem] bg-gradient-to-tr from-cyan-500 to-pink-500 p-1 shadow-2xl">
                        <div className="w-full h-full bg-[#0d0716] rounded-[2.8rem] overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Profile" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-black italic">{userName || 'Explorer'}</h2>
                </div>
                <div className="space-y-3">
                    <button className="w-full p-6 glass-panel flex justify-between items-center font-bold">
                        <span>Einstellungen</span>
                        <Settings className="w-5 h-5 text-white/30" />
                    </button>
                    <button onClick={() => setView('login')} className="w-full p-6 glass-panel flex justify-between items-center font-bold text-red-400">
                        <span>Abmelden</span>
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}
      </main>

      {/* Die schwebende Glas-Navigation */}
      {view !== 'login' && view !== 'onboarding' && (
        <div className="fixed bottom-8 left-0 right-0 px-6">
          <nav className="max-w-md mx-auto glass-nav rounded-[2.5rem] p-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <button onClick={() => setView('dashboard')} className={`p-4 rounded-[2rem] transition-all ${view === 'dashboard' ? 'bg-white text-black' : 'text-white/30'}`}>
              <Home className="w-6 h-6" />
            </button>
            <button onClick={() => setView('questions')} className={`p-4 rounded-[2rem] transition-all ${view === 'questions' ? 'bg-white text-black' : 'text-white/30'}`}>
              <MessageCircle className="w-6 h-6" />
            </button>
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <button onClick={() => setView('results')} className={`p-4 rounded-[2rem] transition-all ${view === 'results' ? 'bg-white text-black' : 'text-white/30'}`}>
              <Stars className="w-6 h-6" />
            </button>
            <button onClick={() => setView('profile')} className={`p-4 rounded-[2rem] transition-all ${view === 'profile' ? 'bg-white text-black' : 'text-white/30'}`}>
              <User className="w-6 h-6" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
