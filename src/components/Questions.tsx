import React from 'react';
import { MessageCircle, Send } from 'lucide-react';

/**
 * Questions-Komponente: Der Ort für die täglichen Beziehungsfragen.
 * Hier können Partner ihre Antworten eingeben und die des anderen sehen.
 */
export default function Questions() {
  return (
    <div className="flex-1 flex flex-col py-8 view-enter">
      {/* Titel-Bereich */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#1E1B4B]">Tägliche Frage</h2>
        <p className="text-purple-400">Teilt eure Gedanken miteinander.</p>
      </div>

      {/* Die aktuelle Frage in einer großen Karte */}
      <div className="glass-card p-8 bg-white/40 border-purple-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-5 h-5 text-[#A855F7]" />
          <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">15. Mai 2026</span>
        </div>
        <h3 className="text-2xl font-bold leading-tight text-[#1E1B4B]">
          Wenn wir heute an einen beliebigen Ort reisen könnten, wo würdest du gerne mit mir sein?
        </h3>
      </div>

      {/* Eingabebereich für die Antwort */}
      <div className="space-y-4">
        <textarea 
          placeholder="Schreibe deine Antwort hier..."
          className="w-full h-40 p-6 glass-card bg-white border-purple-100 outline-none focus:border-[#A855F7] transition-all resize-none text-[#1E1B4B] placeholder:text-purple-200"
        />
        {/* Absenden Button */}
        <button className="btn-pill btn-primary w-full gap-2">
          Antwort senden
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Hinweis-Bereich */}
      <p className="mt-6 text-center text-xs text-purple-300 font-medium italic">
        Deine Antwort wird erst sichtbar, wenn dein Partner auch geantwortet hat.
      </p>
    </div>
  );
}
