import React from 'react';
import { Flame, Sparkles, Heart } from 'lucide-react';

/**
 * Dashboard-Komponente: Die Startseite der App nach dem Login.
 * Zeigt Partner-Status, Flammen, Match-Score und die aktuelle Frage.
 */
export default function Dashboard() {
  // HIER: In einer echten App würden diese Daten aus einem globalen State oder Supabase kommen
  const userName = "Lana";
  const partnerName = "Ben";
  const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  return (
    <div className="flex-1 flex flex-col view-enter">
      {/* Header mit Begrüßung und Partner-Status */}
      <header className="py-8 flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#1E1B4B]">Hallo {userName}</h2>
          <div className="flex items-center gap-2">
            {/* Pulsierender grüner Punkt für den Online-Status */}
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
              {partnerName} ist online
            </span>
          </div>
        </div>
        {/* Profilbild-Vorschau in einer Glaskarte - wird aus Profile.tsx synchronisiert */}
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
        {/* Flammen-Karte (Streaks) */}
        <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-purple-50 bg-white/40">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <Flame className="w-6 h-6 text-orange-500 fill-current" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#1E1B4B]">12</p>
            <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Flammen</p>
          </div>
        </div>
        {/* Match-Score Karte */}
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

      {/* Bereich für die tägliche Frage */}
      <div className="flex-1 space-y-4">
        <div className="glass-card p-8 bg-gradient-to-br from-[#A855F7]/10 to-transparent border-[#A855F7]/20 relative overflow-hidden group">
          {/* Dekorative Herz-Icons im Hintergrund der Karte */}
          <Heart className="absolute -right-4 -bottom-4 w-24 h-24 text-[#A855F7]/5 -rotate-12 transition-transform group-hover:scale-110" />
          
          <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">Heutige Frage</p>
          <h3 className="text-xl font-bold leading-snug text-[#1E1B4B] mb-8">
            Was war der schönste Moment, den wir heute mit {partnerName} geteilt haben?
          </h3>
          <button className="btn-pill btn-primary w-full text-sm">
            Jetzt beantworten
          </button>
        </div>
      </div>
    </div>
  );
}
