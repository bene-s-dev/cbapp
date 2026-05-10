import React, { useState } from 'react';
import { 
  Heart, User, Camera, MessageCircle, Home, Stars,
  ChevronRight, Settings, LogOut, Sparkles, Send
} from 'lucide-react';

type View = 'login' | 'onboarding' | 'dashboard' | 'questions' | 'profile';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState(0);

  const questions = [
    "Wie fühlst du dich heute mit uns?",
    "Wofür bist du heute dankbar?",
    "Welches Date war bisher dein liebstes?"
  ];

  return (
    <div className="min-h-screen relative p-6 pb-32 overflow-hidden">
      <div className="bg-aura" />

      <main className="max-w-md mx-auto relative z-10">
        
        {/* LOGIN: Modern & Clean */}
        {view === 'login' && (
          <div className="flex flex-col items-center justify-center min-h-[85vh] space-y-12">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-30 animate-pulse" />
              <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                <Heart className="text-purple-500 w-12 h-12 fill-current" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-5xl font-extrabold tracking-tight">DuoSync</h1>
              <p className="text-purple-300/60 font-medium">Your love, in sync.</p>
            </div>
            <button onClick={() => setView('onboarding')} className="btn-pill w-64">
              REISE STARTEN
            </button>
          </div>
        )}

        {/* ONBOARDING: Weich & Einladend */}
        {view === 'onboarding' && (
          <div className="space-y-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-purple-100">Profil erstellen</h2>
            <div className="couple-card p-10 flex flex-col items-center space-y-8">
              <div className="relative w-32 h-32 rounded-full bg-purple-500/10 border-2 border-dashed border-purple-400/30 flex items-center justify-center">
                <Camera className="text-purple-300 w-8 h-8" />
              </div>
              <input 
                type="text" 
                placeholder="Wie heißt du?" 
                className="w-full p-5 bg-purple-900/20 border border-purple-400/20 rounded-3xl outline-none focus:border-purple-400/50 text-white placeholder:text-purple-200/20"
                onChange={(e) => setUserName(e.target.value)}
              />
              <button onClick={() => setView('dashboard')} className="btn-pill w-full">
                FERTIG
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD: Das Herz der App */}
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-3xl font-bold text-white">Hey {userName || 'Love'}!</h2>
                <p className="text-purple-300/50 text-sm">Heute schon gesynct?</p>
              </div>
              <div className="w-14 h-14 rounded-3xl border-2 border-purple-500/30 p-1">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="rounded-2xl" />
              </div>
            </header>

            <div className="couple-card p-8 bg-gradient-to-br from-purple-500/20 to-transparent" onClick={() => setView('questions')}>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <Sparkles className="text-purple-500 w-6 h-6" />
                </div>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/30">NEU</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Daily Moments</h3>
              <p className="text-purple-200/40 text-sm mb-6">Teilt eure Gedanken in 3 schnellen Fragen.</p>
              <div className="w-full py-4 bg-white/10 rounded-2xl text-center font-bold text-white border border-white/10">ÖFFNEN</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="couple-card p-6 text-center">
                <p className="text-[10px] font-bold text-purple-300/40 uppercase mb-1">Streak</p>
                <p className="text-2xl font-bold">12 Tage ✨</p>
              </div>
              <div className="couple-card p-6 text-center">
                <p className="text-[10px] font-bold text-purple-300/40 uppercase mb-1">Mood</p>
                <p className="text-2xl font-bold">98% 💜</p>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS: Fokus & Interaktion */}
        {view === 'questions' && (
          <div className="min-h-[70vh] flex flex-col justify-between py-10 animate-in slide-in-from-right duration-500">
            <div className="space-y-12">
               <div className="flex justify-center gap-2">
                 {questions.map((_, i) => (
                   <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-10 bg-purple-400' : 'w-4 bg-white/10'}`} />
                 ))}
               </div>
               <h2 className="text-4xl font-bold text-center leading-tight px-4">{questions[step]}</h2>
            </div>
            <div className="space-y-4">
              {['Sehr gut', 'Gut', 'Geht so'].map((ans) => (
                <button 
                  key={ans} 
                  onClick={() => step < 2 ? setStep(s => s + 1) : setView('dashboard')}
                  className="couple-card w-full p-6 flex justify-between items-center group hover:bg-white hover:text-purple-900 transition-all"
                >
                  <span className="font-bold text-lg">{ans}</span>
                  <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {view === 'profile' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex flex-col items-center space-y-4 pt-10">
                <div className="w-32 h-32 rounded-[3rem] bg-purple-500/20 p-2 border border-purple-500/30 shadow-2xl">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="rounded-[2.5rem]" />
                </div>
                <h2 className="text-3xl font-bold">{userName}</h2>
                <div className="bg-purple-500/20 px-4 py-1 rounded-full text-xs font-bold text-purple-300 border border-purple-500/30">VERBUNDEN MIT ANNA</div>
             </div>
             <div className="space-y-3">
                <button className="couple-card w-full p-6 flex justify-between items-center font-bold">Account <Settings className="w-5 h-5 opacity-40" /></button>
                <button onClick={() => setView('login')} className="couple-card w-full p-6 flex justify-between items-center font-bold text-red-400">Abmelden <LogOut className="w-5 h-5" /></button>
             </div>
          </div>
        )}

      </main>

      {/* DOCK NAVIGATION */}
      {['dashboard', 'questions', 'profile'].includes(view) && (
        <div className="fixed bottom-8 left-0 right-0 px-6">
          <nav className="nav-dock max-w-md mx-auto p-2 flex justify-between items-center">
            <button onClick={() => setView('dashboard')} className={`p-4 rounded-[2.2rem] transition-all ${view === 'dashboard' ? 'nav-item-active' : 'text-white/30'}`}><Home className="w-6 h-6" /></button>
            <button onClick={() => setView('questions')} className={`p-4 rounded-[2.2rem] transition-all ${view === 'questions' ? 'nav-item-active' : 'text-white/30'}`}><MessageCircle className="w-6 h-6" /></button>
            
            <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40">
              <Send className="w-6 h-6 text-white" />
            </div>

            <button className="p-4 text-white/30"><Stars className="w-6 h-6" /></button>
            <button onClick={() => setView('profile')} className={`p-4 rounded-[2.2rem] transition-all ${view === 'profile' ? 'nav-item-active' : 'text-white/30'}`}><User className="w-6 h-6" /></button>
          </nav>
        </div>
      )}
    </div>
  );
}
