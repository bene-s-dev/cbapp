import React, { useState, useEffect } from 'react';
import { 
  Heart, LogOut, ChevronRight, Bell, Unlink, ExternalLink, Copy, Download, Share, PlusSquare, Camera
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  onLogout: () => void;
  partnerName: string | null;
}

export default function Profile({ onLogout, partnerName }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);

  useEffect(() => {
    fetchProfile();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
    }
    setLoading(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSOverlay(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Das Bild ist zu groß. Bitte wähle ein Bild unter 5 MB aus.");
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      fetchProfile();
      alert("Foto erfolgreich aktualisiert! ✨");
    } catch (err: any) {
      alert("Fehler beim Upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-pulse text-[var(--text-main)] font-bold">
      Lädt...
    </div>
  );

  return (
    <div className="flex-1 flex flex-col animate-entrance h-full overflow-hidden">
      {showIOSOverlay && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-md animate-entrance px-4 pb-8"
          onClick={() => setShowIOSOverlay(false)}
        >
          <div className="w-full max-w-md bg-white rounded-[3rem] p-6 space-y-6 shadow-2xl relative">
            <div className="w-12 h-1.5 bg-[#f1f2f6] rounded-full mx-auto mb-2" />
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold text-[var(--text)]">App installieren</h3>
              <p className="text-[var(--muted)] text-xs">Folge diesen Schritten in deinem Safari-Browser:</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--light-bg)] border border-[#eee]">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Share className="w-5 h-5 text-[var(--secondary)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)] text-xs">1. Tippe auf 'Teilen'</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--light-bg)] border border-[#eee]">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <PlusSquare className="w-5 h-5 text-[var(--secondary)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)] text-xs">2. 'Zum Home-Bildschirm'</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowIOSOverlay(false)} className="btn-action !p-4 !text-sm">Verstanden</button>
          </div>
        </div>
      )}
      
      {/* Header Bereich - Verkleinert */}
      <div className="flex flex-col items-center mb-4 text-[var(--text-main)] shrink-0 pt-4">
        <div className="relative flex flex-col items-center">
          <label className="cursor-pointer block relative mb-2 group">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            <div className={`w-20 h-28 rounded-[2rem] bg-white p-1 border-2 border-purple-50 overflow-hidden shadow-sm transition-all group-hover:border-[var(--secondary)] ${uploading ? 'opacity-50' : ''}`}>
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  className="w-full h-full object-cover rounded-[1.8rem]"
                  alt="Profilfoto"
                />
              ) : (
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.display_name || 'User'}`} 
                  className="w-full h-full object-cover rounded-[1.8rem]"
                  alt="Profilfoto Placeholder"
                />
              )}
            </div>
          </label>
          <button 
            onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
            disabled={uploading}
            className="bg-white border border-purple-50 px-3 py-1.5 rounded-lg text-[9px] font-bold text-[var(--secondary)] shadow-sm hover:bg-purple-50 transition-colors flex items-center gap-1"
          >
            <Camera className="w-2.5 h-2.5" />
            Foto ändern
          </button>
          <p className="text-[8px] text-[var(--muted)] font-medium mt-2">max. 5 MB</p>
        </div>
        <div className="mt-2 text-center">
          <h2 className="text-xl font-bold">{profile?.display_name}</h2>
          <p className={`${profile?.partner_id ? 'text-[var(--secondary)]' : 'text-red-400'} text-[11px] font-medium flex items-center justify-center gap-1.5`}>
            <Heart className={`w-2.5 h-2.5 ${profile?.partner_id ? 'fill-current' : ''}`} /> 
            {profile?.partner_id ? `Verbunden mit ${partnerName || 'Partner'}` : 'Nicht verknüpft'}
          </p>
        </div>
      </div>

      {/* Partner Code - Kompakter */}
      <div className="px-4 shrink-0 mb-4">
        <div className="glass-card p-4 border-[#edf2f7] bg-white rounded-[22px] border-2 text-[var(--text)] shadow-sm">
          <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-2">Partner-Code</p>
          <div className="flex items-center justify-between bg-[var(--bg)] p-2.5 rounded-xl border-2 border-dashed border-purple-100">
            <span className="font-mono font-bold text-[var(--secondary)] text-sm tracking-widest">{profile?.partner_code}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(profile?.partner_code);
                alert("Code kopiert!");
              }}
              className="p-1.5 hover:bg-white rounded-lg transition-colors shadow-sm"
            >
              <Copy className="w-4 h-4 text-[var(--secondary)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings List - Flex-Grow zum Ausfüllen des Platzes */}
      <div className="space-y-2.5 px-4 overflow-y-auto shrink min-h-0 flex-1 scrollbar-hide">
        {((deferredPrompt || isIOS) && !isStandalone) && (
          <button onClick={handleInstall} className="w-full bg-white border-2 border-purple-100 p-3.5 rounded-[18px] flex items-center justify-between hover:bg-purple-50 transition-all text-[var(--text)] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <Download className="w-4 h-4 text-[var(--secondary)]" />
              </div>
              <span className="font-bold text-xs text-[var(--secondary)]">App installieren ✨</span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-200" />
          </button>
        )}

        <button className="w-full bg-white border-2 border-[#edf2f7] p-3.5 rounded-[18px] flex items-center justify-between hover:bg-purple-50 transition-all text-[var(--text)] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-bold text-xs">Benachrichtigungen</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>

        {profile?.partner_id && (
          <button onClick={handleUnlink} className="w-full bg-white border-2 border-[#edf2f7] p-3.5 rounded-[18px] flex items-center justify-between hover:bg-red-50 transition-all text-red-400 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <Unlink className="w-4 h-4 text-red-400" />
              </div>
              <span className="font-bold text-xs">Partner trennen</span>
            </div>
          </button>
        )}

        <button onClick={onLogout} className="w-full bg-white border-2 border-[#edf2f7] p-3.5 rounded-[18px] flex items-center justify-between hover:bg-red-50/30 transition-all text-red-500 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-red-50 rounded-lg">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-bold text-xs">Abmelden</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-200" />
        </button>
      </div>

      {/* Footer - Ganz unten fixiert */}
      <div className="mt-auto pt-4 pb-28 space-y-4 text-center text-[var(--text)] shrink-0 px-4">
        <button className="btn-action !p-3.5 !text-sm flex items-center justify-center gap-2 w-full">
          <Heart className="w-4 h-4 fill-current" />
          Jetzt spenden
          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
        </button>

        <div className="space-y-0.5">
          <p className="text-[var(--muted)] text-[10px] font-bold">
            App programmiert von bene it 2026
          </p>
          <p className="text-[var(--secondary)] text-[8px] font-bold uppercase tracking-[0.2em]">
            Version 1 LG 2026
          </p>
        </div>
      </div>
    </div>
  );
}
