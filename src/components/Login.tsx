import React, { useState, useEffect } from 'react';
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
  
  const [sloganWord, setSloganWord] = useState('bisschen');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSloganWord('Küsschen');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          const randomCode = 'CB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
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
        
        setMessage({ type: 'success', text: 'Registrierung erfolgreich! Bitte prüfe deine E-Mails.' });
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
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 animate-in fade-in duration-700">
      
      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Bisou
        </h1>
        <p className="text-white/80 text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Jeden Tag ein <span key={sloganWord} className="animate-word text-[var(--primary)]">{sloganWord}</span> näher.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            className="w-full p-5 rounded-[22px] border-2 border-white/10 bg-white/5 text-white text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-white/30"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {mode !== 'forgot' && (
            <input
              type="password"
              className="w-full p-5 rounded-[22px] border-2 border-white/10 bg-white/5 text-white text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-white/30"
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
                className="w-full p-5 rounded-[22px] border-2 border-white/10 bg-white/5 text-white text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-white/30"
                placeholder="Dein Vorname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full p-5 rounded-[22px] border-2 border-white/10 bg-white/5 text-white text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-white/30"
                placeholder="Vorname deines Partners"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
              />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-action">
            {loading ? 'Lädt...' : mode === 'login' ? 'Einloggen ✨' : mode === 'register' ? 'Konto erstellen ✨' : 'Link senden ✨'}
          </button>
          
          {mode === 'login' && (
            <button 
              type="button" 
              onClick={() => setMode('register')} 
              className="btn-secondary"
            >
              Neu hier? Registrieren
            </button>
          )}

          <div className="text-center pt-2">
            {mode !== 'login' ? (
              <button 
                type="button" 
                onClick={() => setMode('login')} 
                className="text-white/60 text-sm font-medium hover:text-white underline underline-offset-4"
              >
                Zurück zum Login
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setMode('forgot')} 
                className="text-white/40 text-sm font-medium hover:text-white underline underline-offset-4"
              >
                Passwort vergessen?
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
