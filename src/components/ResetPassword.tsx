import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Passwort erfolgreich aktualisiert! ✨' });
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-6 animate-entrance">
      <div className="w-20 h-20 bg-purple-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm">
        <KeyRound className="w-10 h-10 text-[var(--secondary)]" />
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#2D264B] mb-3">Neues Passwort</h2>
        <p className="text-[var(--text)] text-sm opacity-70 leading-relaxed">
          Wähle ein neues, sicheres Passwort für dein Konto.
        </p>
      </div>

      <form onSubmit={handleReset} className="w-full max-w-sm space-y-6">
        {message && (
          <div className={`p-5 rounded-[22px] text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <p>{message.text}</p>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            className="input-base"
            placeholder="Neues Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoFocus
          />
        </div>

        <button type="submit" disabled={loading} className="btn-action w-full">
          {loading ? 'Speichere...' : 'Passwort speichern ✨'}
        </button>
      </form>
    </div>
  );
}
