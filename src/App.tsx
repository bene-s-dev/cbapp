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
    "Welches Date war dein liebstes?"
  ];

  return (
    // h-screen und overflow-hidden garantieren Null-Scroll
    <div className="h-screen w-screen overflow-hidden relative text-white select-none">
      <div className="bg-aura" />

      {/* Padding-Top für die Statusleiste (viewport-fit=cover) */}
      <main className="h-full flex flex-col pt-12 pb-32 px-6 max-w-md mx-auto relative z-10">
        
        {view === 'login' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12">
              <Heart className="text-purple-500 w-12 h-12 fill-current" />
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-black tracking-tight mb-2">DuoSync</h1>
              <p className="text-purple-300/50">Modern Couple Sync</p>
            </div>
            <button onClick={() => setView('onboarding')} className="btn-pill w-full">STARTEN</button>
          </div>
        )}

        {view === 'onboarding' && (
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <h2 className="text-3xl font-bold">Identity</h2>
            <div className="couple-card p-10 flex flex-col items-center space-y-8">
              <div className="w-24 h-24 rounded-full bg-purple-500/10 border-2 border-dashed border-purple-400/30 flex items-center justify-center">
                <Camera className="text-purple-300 w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Name" 
                className="w-full p-5 bg-purple-900/20 border border-purple-400/20 rounded-3xl outline-none"
                onChange={(e) => setUserName(e.target.value)}
              />
              <button onClick={() => setView('dashboard')} className="btn-pill w-full">SPEICHERN</button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold italic">Hey {userName || 'Love'}</h2>
              <div className="w-12 h-12 rounded-2xl border border-purple-500/30 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
              </div>
            </div>

            <div className="couple-card p-8 bg-gradient-to-br from-purple-500/20 to-transparent" onClick={() => setView('questions')}>
              <Sparkles className="text-purple-400 w-6 h-6 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Daily Quiz</h3>
              <p className="text-purple-200/40 text-sm mb-6">3 Fragen für euch.</p>
              <div className="w-full py-4 bg-white/10 rounded-2xl text-center font-bold">ÖFFNEN</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="couple-card p-6 text-center">
                <p className="text-2xl font-bold">12 ✨</p>
                <p className="text-[10px] text-purple-300/40 uppercase">Streak</p>
              </div>
              <div className="couple-card p-6 text-center">
                <p className="text-2xl font-bold">98% 💜</p>
                <p className="text-[10px] text-purple-300/40 uppercase">Mood</p>
              </div>
            </div>
          </div>
        )}

        {view === 'questions' && (
          <div className="flex-1 flex flex-col justify-between py-10">
            <h2 className="text-4xl font-bold text-center leading-tight">{questions[step]}</h2>
            <div className="space-y-4">
              {['Sehr gut', 'Gut', 'Neutral'].map((ans) => (
                <button 
                  key={ans} 
                  onClick={() => step < 2 ? setStep(s => s + 1) : setView('dashboard')}
                  className="couple-card w-full p-6 flex justify-between items-center active:bg-white active:text-purple-900 transition-all"
                >
                  <span className="font-bold text-lg">{ans}</span>
                  <ChevronRight className="w-5 h-5 opacity-30" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-purple-500/20 p-2 border border-purple-500/30">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="rounded-[2.2rem]" />
            </div>
            <h2 className="text-3xl font-bold">{userName}</h2>
            <div className="w-full space-y-3 pt-6">
              <button className="couple-card w-full p-6 flex justify-between items-center font-bold">Account <Settings className="w-5 h-5 opacity-40" /></button>
              <button onClick={() => setView('login')} className="couple-card w-full p-6 flex justify-between items-center font-bold text-red-400">Abmelden <LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </main>

      {/* Dock Navigation */}
      {['dashboard', 'questions', 'profile'].includes(view) && (
        <div className="fixed bottom-8 left-6 right-6 z-50">
          <nav className="nav-dock max-w-md mx-auto p-2 flex justify-between items-center">
            <button onClick={() => setView('dashboard')} className={`p-4 rounded-[2.2rem] ${view === 'dashboard' ? 'nav-item-active' : 'text-white/30'}`}><Home /></button>
            <button onClick={() => setView('questions')} className={`p-4 rounded-[2.2rem] ${view === 'questions' ? 'nav-item-active' : 'text-white/30'}`}><MessageCircle /></button>
            <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"><Send className="w-6 h-6 text-white" /></div>
            <button className="p-4 text-white/30"><Stars /></button>
            <button onClick={() => setView('profile')} className={`p-4 rounded-[2.2rem] ${view === 'profile' ? 'nav-item-active' : 'text-white/30'}`}><User /></button>
          </nav>
        </div>
      )}
    </div>
  );
}
