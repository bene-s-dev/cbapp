import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else if (mode === 'register') {
        // 1. Registrierung
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Zufälligen Partner-Code generieren (z.B. DUO-1234)
          const randomCode = 'CB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

          // 2. Profil erstellen
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                display_name: displayName, 
                partner_name: partnerName,
                partner_code: randomCode
              }
            ]);
          if (profileError) throw profileError;
        }
        
        setMessage({ type: 'success', text: 'Registrierung erfolgreich! Bitte prüfe deine E-Mails zur Bestätigung.' });
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Reset-Link wurde gesendet!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ein Fehler ist aufgetreten.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <h2 className="mt-5 text-4xl font-bold">CB-App</h2>
      <p className="text-[var(--muted)] mb-9">
        {mode === 'login' ? 'Willkommen zurück ❤️' : mode === 'register' ? 'Erstelle euer Konto ❤️' : 'Passwort zurücksetzen'}
      </p>
      
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <input
          type="email"
          className="w-full p-5 rounded-[20px] border-2 border-[#eee] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        {mode !== 'forgot' && (
          <input
            type="password"
            className="w-full p-5 rounded-[20px] border-2 border-[#eee] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        )}

        {mode === 'register' && (
          <>
            <input
              type="text"
              className="w-full p-5 rounded-[20px] border-2 border-[#eee] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all"
              placeholder="Dein Vorname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <input
              type="text"
              className="w-full p-5 rounded-[20px] border-2 border-[#eee] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all"
              placeholder="Vorname deines Partners"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              required
            />
          </>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-action">
            {loading ? 'Lädt...' : mode === 'login' ? 'Einloggen ✨' : mode === 'register' ? 'Registrieren ✨' : 'Senden ✨'}
          </button>
          
          <div className="flex justify-between px-2 text-sm font-medium text-[var(--muted)]">
            {mode === 'login' ? (
              <>
                <button type="button" onClick={() => setMode('register')} className="hover:text-[var(--secondary)]">Neu hier? Registrieren</button>
                <button type="button" onClick={() => setMode('forgot')} className="hover:text-[var(--secondary)]">Passwort vergessen?</button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="w-full text-center hover:text-[var(--secondary)]">Zurück zum Login</button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
