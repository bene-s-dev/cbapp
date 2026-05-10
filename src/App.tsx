import React, { useState } from 'react';
import { 
  Heart, ShieldAlert, Download, User, Camera, 
  Copy, Home, MessageCircle, LayoutGrid, Stars,
  ChevronRight, CheckCircle2, Settings, LogOut
} from 'lucide-react';

// --- TYPEN ---
type View = 'login' | 'onboarding' | 'dashboard' | 'questions' | 'results' | 'profile';

function App() {
  const [view, setView] = useState<View>('login');
  const [userName, setUserName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    "Wie wichtig ist dir gemeinsame Zeit?",
    "Was ist deine bevorzugte Love Language?",
    "Wie stellst du dir ein perfektes Date vor?"
  ];

  // --- KOMPONENTEN FÜR DIE ANSICHTEN ---

  const LoginView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-white/10 rotate-12">
        <Heart className="text-[#1a0f2b] w-12 h-12 fill-current" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">DuoSync</h1>
        <p className="text-white/50">Verbinde dich tiefer mit deinem Partner.</p>
      </div>
      <button 
        onClick={() => setView('onboarding')}
        className="w-full max-w-xs py-4 bg-white text-[#1a0f2b] font-bold rounded-2xl shadow-xl active:scale-95 transition-transform"
      >
        Loslegen
      </button>
    </div>
  );

  const OnboardingView = () => (
    <div className="space-y-8 py-4 animate-in slide-in-from-right duration-300">
      <h2 className="text-2xl font-bold">Profil erstellen</h2>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-32 h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-full flex flex-col items-center justify-center relative">
          <Camera className="w-8 h-8 text-white/40" />
          <span className="text-[10px] text-white/40 mt-1">Bild wählen</span>
        </div>
      </div>
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Dein Name" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white/30"
          onChange={(e) => setUserName(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Partner-Code eingeben" 
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white/30 text-center font-mono uppercase tracking-widest"
        />
      </div>
      <button 
        onClick={() => setView('dashboard')}
        className="w-full py-4 bg-white text-[#1a0f2b] font-bold rounded-2xl shadow-xl"
      >
        Profil speichern
      </button>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hi, {userName || 'User'}!</h2>
          <p className="text-white/50 text-sm">Bereit für eure täglichen Fragen?</p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Avatar" />
        </div>
      </div>

      <div className="bg-[#271a3c] p-6 rounded-[2rem] border border-white/10 space-y-4 shadow-xl">
        <div className="flex justify-between items-start">
          <div className="bg-white/10 p-3 rounded-2xl">
            <Stars className="text-yellow-400 w-6 h-6" />
          </div>
          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">Heute aktiv</span>
        </div>
        <h3 className="text-xl font-semibold">Tägliches Quiz</h3>
        <p className="text-white/60 text-sm">3 neue Fragen warten auf euch beide.</p>
        <button 
          onClick={() => setView('questions')}
          className="w-full py-3 bg-white text-[#1a0f2b] font-bold rounded-xl"
        >
          Jetzt starten
        </button>
      </div>
    </div>
  );

  const QuestionsView = () => (
    <div className="flex flex-col min-h-[70vh] justify-between py-8 animate-in slide-in-from-bottom duration-400">
      <div className="space-y-8 text-center">
        <div className="flex justify-center gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 w-8 rounded-full transition-all ${i === currentQuestion ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>
        <h2 className="text-3xl font-bold px-4 leading-tight">{questions[currentQuestion]}</h2>
      </div>
      
      <div className="space-y-3">
        {['Sehr wichtig', 'Eher wichtig', 'Neutral', 'Nicht so wichtig'].map((option) => (
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
            className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors flex justify-between items-center group"
          >
            {option}
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white" />
          </button>
        ))}
      </div>
    </div>
  );

  const ResultsView = () => (
    <div className="space-y-8 py-4 text-center animate-in zoom-in duration-300">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Ergebnisse sind da!</h2>
        <p className="text-white/50 mt-2">Du und dein Partner habt 85% Übereinstimmung.</p>
      </div>
      <div className="bg-[#271a3c] p-6 rounded-3xl border border-white/10 text-left">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-[#271a3c]" />
            <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-[#271a3c]" />
          </div>
          <span className="font-semibold italic">"Ein perfektes Date"</span>
        </div>
        <p className="text-sm text-white/70 italic">Beide haben "Abendessen & Kino" gewählt!</p>
      </div>
      <button onClick={() => setView('dashboard')} className="w-full py-4 border border-white/20 rounded-2xl font-bold hover:bg-white/5">
        Zurück zum Home
      </button>
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6 animate-in slide-in-from-left duration-300">
      <div className="flex flex-col items-center py-6">
        <div className="w-24 h-24 rounded-full border-2 border-white/20 p-1 mb-4">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="rounded-full" alt="Profile" />
        </div>
        <h2 className="text-xl font-bold">{userName || 'User Name'}</h2>
        <p className="text-white/40 text-sm">Seit Mai 2024 dabei</p>
      </div>
      <div className="bg-[#271a3c] rounded-3xl border border-white/10 overflow-hidden">
        {[
          { icon: Settings, text: 'Einstellungen' },
          { icon: Copy, text: 'Partner-Code kopieren' },
          { icon: ShieldAlert, text: 'Privatsphäre' }
        ].map((item, i) => (
          <button key={i} className="w-full p-5 flex items-center gap-4 border-b border-white/5 last:border-none hover:bg-white/5">
            <item.icon className="w-5 h-5 text-white/60" />
            <span>{item.text}</span>
          </button>
        ))}
      </div>
      <button onClick={() => setView('login')} className="w-full p-5 flex items-center gap-4 text-red-400 bg-red-400/5 rounded-3xl">
        <LogOut className="w-5 h-5" />
        <span className="font-bold">Abmelden</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a0f2b] text-white p-4 pb-24 font-['Poppins'] selection:bg-white selection:text-[#1a0f2b]">
      
      {/* Dynamic Content */}
      <main className="max-w-md mx-auto">
        {view === 'login' && <LoginView />}
        {view === 'onboarding' && <OnboardingView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'questions' && <QuestionsView />}
        {view === 'results' && <ResultsView />}
        {view === 'profile' && <ProfileView />}
      </main>

      {/* Navigation - Nur sichtbar ab Dashboard */}
      {['dashboard', 'results', 'profile', 'questions'].includes(view) && (
        <nav className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-[#271a3c]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 flex justify-between items-center shadow-2xl z-50">
          <button 
            onClick={() => setView('dashboard')} 
            className={`p-4 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}
          >
            <Home className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView('questions')} 
            className={`p-4 rounded-2xl transition-all ${view === 'questions' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
            <LayoutGrid className="w-6 h-6 text-white/60" />
          </div>
          <button 
            onClick={() => setView('results')} 
            className={`p-4 rounded-2xl transition-all ${view === 'results' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}
          >
            <Stars className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView('profile')} 
            className={`p-4 rounded-2xl transition-all ${view === 'profile' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}
          >
            <User className="w-6 h-6" />
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
