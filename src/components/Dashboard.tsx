import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Heart, Play } from 'lucide-react';

/**
 * Dashboard-Komponente: Die Startseite der App nach dem Login.
 * Zeigt Partner-Status, Flammen, Match-Score und den zentralen Fragen-CTA.
 */
export default function Dashboard({ onStartQuestions }: { onStartQuestions: () => void }) {
  // HIER: In einer echten App würden diese Daten aus einem globalen State oder Supabase kommen
  const userName = "Lana";
  const partnerName = "Ben";
  const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  // Countdown-Timer Logik
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Nächste Mitternacht
      
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      return [hours, minutes, seconds]
        .map(v => v < 10 ? '0' + v : v)
        .join(':');
    };

    // Initial setzen
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col view-enter">
      {/* Header mit Begrüßung und Partner-Status */}
      <header className="py-8 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#1E1B4B]">Hallo {userName}</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
              {partnerName} ist online
            </span>
          </div>
        </div>
        <div className="w-14 h-14 glass-card p-1 rounded-2xl overflow-hidden border-purple-100 shadow-lg">
          <img 
            src={profileImage} 
            className="w-full h-full rounded-xl bg-purple-50 object-cover"
            alt="Mein Profil"
          />
        </div>
      </header>

      {/* Statistik-Karten (Flammen & Match-Score) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-purple-50 bg-white/40">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Flame className="w-6 h-6 text-orange-500 fill-current" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#1E1B4B]">12</p>
            <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Flammen</p>
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-purple-50 bg-white/40">
          <div className="p-3 bg-purple-50 rounded-2xl">
            <Sparkles className="w-6 h-6 text-[#A855F7] fill-current" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#1E1B4B]">98%</p>
            <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Match-Score</p>
          </div>
        </div>
      </div>

      {/* Zentraler CTA Bereich */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-8">
        <div className="relative group">
          {/* Pulsierender Hintergrund-Effekt für den Button */}
          <div className="absolute inset-0 bg-[#A855F7] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity animate-pulse" />
          
          <button 
            onClick={onStartQuestions}
            className="relative w-48 h-48 rounded-[3.5rem] bg-gradient-to-br from-[#A855F7] to-[#8B5CF6] text-white shadow-2xl shadow-purple-500/40 flex flex-col items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <div className="p-4 bg-white/20 rounded-2xl">
              <Play className="w-8 h-8 fill-current" />
            </div>
            <span className="font-black text-lg tracking-tight">Jetzt starten</span>
          </button>
        </div>

        {/* Timer-Anzeige */}
        <div className="text-center space-y-2">
          <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">
            Heutige Fragen beantworten
          </p>
          <div className="glass-card px-6 py-3 bg-white/40 border-purple-100 inline-block">
            <p className="text-[#1E1B4B] font-mono text-sm font-bold">
              Du hast noch <span className="text-[#A855F7]">{timeLeft}</span> Zeit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
