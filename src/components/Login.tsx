import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (isNew?: boolean) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [isKuss, setIsKuss] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsKuss(true);
    }, 2000);
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
        onLogin(false);
      } else if (mode === 'register') {
        // Sign up with user metadata so the database trigger can catch it
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              display_name: displayName
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.session) {
          // User is logged in immediately (Confirm Email is OFF)
          onLogin(true);
        } else {
          // Email confirmation is required (Confirm Email is ON)
          setMessage({ 
            type: 'success', 
            text: 'Registrierung fast fertig! ✨ Bitte klicke auf den Bestätigungslink in deiner E-Mail.' 
          });
        }
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

  const word1 = "Bisschen";
  const word2 = "Küsschen";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 animate-in fade-in duration-700">
      
      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold text-[var(--text-main)] mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Bisou
        </h1>
        <p className="text-[var(--text)] text-lg font-bold flex items-center justify-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <span>Jeden Tag ein&nbsp;</span>
          <span className="text-[var(--primary)] inline-flex">
            {word2.split('').map((char, i) => (
              <span key={i} className="grid grid-cols-1 grid-rows-1 place-items-center overflow-hidden">
                <span 
                  className={`col-start-1 row-start-1 transition-all duration-700 ease-in-out ${isKuss ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`} 
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {word1[i] || '\u00A0'}
                </span>
                <span 
                  className={`col-start-1 row-start-1 transition-all duration-700 ease-in-out ${isKuss ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {char}
                </span>
              </span>
            ))}
          </span>
          <span>&nbsp;näher.</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            className="w-full p-5 rounded-[22px] border-2 border-purple-100 bg-white text-[var(--text-main)] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-[var(--muted)]/50"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {mode !== 'forgot' && (
            <input
              type="password"
              className="w-full p-5 rounded-[22px] border-2 border-purple-100 bg-white text-[var(--text-main)] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-[var(--muted)]/50"
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
                className="w-full p-5 rounded-[22px] border-2 border-purple-100 bg-white text-[var(--text-main)] text-[1.1rem] outline-none focus:border-[var(--secondary)] transition-all placeholder:text-[var(--muted)]/50"
                placeholder="Dein Vorname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
              className="w-full p-5 rounded-[22px] border-2 border-[var(--secondary)] text-[var(--secondary)] font-bold text-lg cursor-pointer transition-all duration-300 bg-white hover:bg-purple-50"
            >
              Neu hier? Registrieren
            </button>
          )}

          <div className="text-center pt-2">
            {mode !== 'login' ? (
              <button 
                type="button" 
                onClick={() => setMode('login')} 
                className="text-[var(--muted)] text-sm font-medium hover:text-[var(--text-main)] underline underline-offset-4"
              >
                Zurück zum Login
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setMode('forgot')} 
                className="text-[var(--muted)] text-sm font-medium hover:text-[var(--text-main)] underline underline-offset-4"
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
