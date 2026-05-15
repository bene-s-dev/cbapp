import React, { useState, useEffect } from 'react';
import { 
  Heart, LogOut, ChevronRight, Bell, Unlink, ExternalLink, Copy, Link
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  onLogout: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
    }
    setLoading(false);
  };

  const handleUnlink = async () => {
    if (window.confirm("Möchtest du die Verknüpfung wirklich löschen?")) {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', session?.user.id);
      window.location.reload();
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Lädt...</div>;

  return (
    <div className="flex-1 flex flex-col py-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-28 h-28 rounded-[2.5rem] bg-[var(--light-bg)] p-1 border-2 border-[#eee] overflow-hidden shadow-sm">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.display_name || 'User'}`} 
            className="w-full h-full object-cover rounded-[2rem]"
            alt="Profilfoto"
          />
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-[var(--text)]">{profile?.display_name}</h2>
          <p className={`${profile?.partner_id ? 'text-[var(--secondary)]' : 'text-red-400'} text-sm font-medium flex items-center justify-center gap-2 mt-1`}>
            <Heart className={`w-3 h-3 ${profile?.partner_id ? 'fill-current' : ''}`} /> 
            {profile?.partner_id ? `Verbunden mit ${profile.partner_name}` : 'Nicht verknüpft'}
          </p>
        </div>
      </div>

      <div className="glass-card p-6 border-[#eee] bg-[var(--light-bg)] mb-6 rounded-[28px] border-2">
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Dein Partner-Code</p>
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-dashed border-[var(--secondary)]">
          <span className="font-mono font-bold text-[var(--secondary)] tracking-widest">{profile?.partner_code}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(profile?.partner_code);
              alert("Code kopiert!");
            }}
            className="p-2 hover:bg-[var(--light-bg)] rounded-xl transition-colors"
          >
            <Copy className="w-5 h-5 text-[var(--secondary)]" />
          </button>
        </div>
        <p className="mt-3 text-[11px] text-[var(--muted)]">Teile diesen Code mit deinem Partner, um eure Profile zu synchronisieren.</p>
      </div>

      <div className="space-y-4">
        <button className="w-full bg-white border-2 border-[#eee] p-5 rounded-[22px] flex items-center justify-between hover:bg-[var(--light-bg)] transition-all">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-bold text-[var(--text)]">Benachrichtigungen</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#ccc]" />
        </button>

        {profile?.partner_id && (
          <button onClick={handleUnlink} className="w-full bg-white border-2 border-[#eee] p-5 rounded-[22px] flex items-center justify-between hover:bg-red-50/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <Unlink className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-bold text-red-500">Partner trennen</span>
            </div>
          </button>
        )}
      </div>

      <div className="mt-auto pt-10 pb-4 space-y-6 text-center">
        <button className="btn-action flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 fill-current" />
          Jetzt spenden
          <ExternalLink className="w-4 h-4 opacity-50" />
        </button>

        <div className="space-y-1">
          <p className="text-[var(--muted)] text-xs font-bold">
            App programmiert von bene it 2026
          </p>
          <p className="text-[var(--secondary)] text-[10px] font-bold uppercase tracking-[0.2em]">
            Version 1 LG 2026
          </p>
        </div>

        <button 
          onClick={onLogout}
          className="inline-flex items-center gap-2 text-[var(--primary)] font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
