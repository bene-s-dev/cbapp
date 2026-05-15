import React from 'react';
import { Heart } from 'lucide-react';

/**
 * Login-Komponente: Zuständig für Authentifizierung (Login & Registrierung).
 * @param onLogin - Callback-Funktion, die aufgerufen wird, wenn der Login erfolgreich war.
 */
export default function Login({ onLogin }: { onLogin: () => void }) {
  return (
    // Hauptcontainer mit sanfter Einblend-Animation (view-enter aus index.css)
    <div className="flex-1 flex flex-col justify-between py-12 view-enter">
      
      {/* Header-Bereich mit Logo und Titel */}
      <div className="mt-8 space-y-4 text-center">
        {/* Das Herz-Icon in einer weichen lila Blase */}
        <div className="inline-flex p-5 rounded-[2.5rem] bg-purple-100 mb-2">
          <Heart className="w-12 h-12 text-[#A855F7] fill-current" />
        </div>
        {/* App-Name mit engem Buchstabenabstand für modernen Look */}
        <h1 className="text-4xl font-black tracking-tighter text-[#1E1B4B]">DuoSync</h1>
        {/* Kurze, dezente Tagline */}
        <p className="text-purple-400 font-medium">Connect. Sync. Love.</p>
      </div>

      {/* Formular-Bereich für E-Mail und Passwort */}
      <div className="space-y-4">
        <div className="space-y-3">
          {/* Eingabefelder nutzen die in index.css definierten .input-field Klassen */}
          <input 
            type="email" 
            placeholder="E-Mail Adresse" 
            className="input-field" 
          />
          <input 
            type="password" 
            placeholder="Passwort" 
            className="input-field" 
          />
        </div>
        
        {/* Haupt-Login Button */}
        <button 
          onClick={onLogin} 
          className="btn-pill btn-primary w-full"
        >
          Anmelden
        </button>
        
        {/* Registrierungs-Button (Sekundär-Stil) */}
        <button className="btn-pill btn-secondary w-full">
          Neues Konto erstellen
        </button>

        {/* Text-Link für vergessene Passwörter */}
        <button className="text-purple-400 text-sm font-semibold w-full py-2">
          Passwort vergessen?
        </button>
      </div>

      {/* Unterer Bereich (Platzhalter für Konsistenz) */}
      <div className="pb-12" />
    </div>
  );
}
