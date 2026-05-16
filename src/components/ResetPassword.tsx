import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">Neues Passwort</h2>
        <p className="text-[var(--text)]">Wähle jetzt dein neues, sicheres Passwort.</p>
      </div>

      <form onSubmit={handleReset} className="w-full max-w-sm space-y-4">
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <input
          type="password"
          className="w-full p-5 rounded-[22px] border-2 border-purple-100 bg-white text-[var(--text-main)] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all"
          placeholder="Neues Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button type="submit" disabled={loading} className="btn-action w-full mt-4">
          {loading ? 'Speichere...' : 'Passwort speichern ✨'}
        </button>
      </form>
    </div>
  );
}
