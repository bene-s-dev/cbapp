import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, Heart, LogOut, Download, Check, AlertCircle, Pencil } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ProfileProps {
  partnerName: string | null;
  onLogout: () => void;
}

export default function Profile({ partnerName, onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showIOSModal, setShowIOSModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) throw error;
      setProfile(data);
      setNewName(data?.display_name || '');
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Enhanced Device & State Detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/.test(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    setIsIOS(ios);
    setIsAndroid(android);
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [fetchProfile]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === profile?.display_name) {
      setIsEditingName(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: newName.trim() })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setProfile({ ...profile, display_name: newName.trim() });
      setIsEditingName(false);
      // Optional: window.location.reload() to sync App.tsx state if needed, 
      // but the local state update is usually enough for immediate feedback.
    } catch (err: any) {
      alert("Fehler beim Aktualisieren des Namens: " + err.message);
    }
  };

  const handleLinkPartner = async () => {
    if (!partnerCodeInput) return;
    setIsLinking(true);

    try {
      const { data: partnerProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('partner_code', partnerCodeInput.trim().toUpperCase())
        .single();

      if (findError || !partnerProfile) {
        alert("Code nicht gefunden! ❌");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Bidirectional linking
      const { error: linkError1 } = await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', session.user.id);
      const { error: linkError2 } = await supabase.from('profiles').update({ partner_id: session.user.id }).eq('id', partnerProfile.id);

      if (linkError1 || linkError2) throw new Error("Verknüpfung fehlgeschlagen.");

      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImage(null);
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileName = `${session.user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;
      await fetchProfile();
    } catch (err: any) {
      alert("Upload fehlgeschlagen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return (
    <div className="flex-1 flex flex-col animate-entrance">
      {/* Header Centered Skeleton */}
      <header className="flex flex-col items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-[2rem] skeleton" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-32 h-6 rounded-xl skeleton" />
          <div className="w-16 h-3 rounded-lg skeleton" />
        </div>
      </header>

      {/* Cards Skeleton */}
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        <div className="h-24 rounded-[28px] skeleton" />
        <div className="h-24 rounded-[28px] skeleton" />
        <div className="h-24 rounded-[28px] skeleton" />
      </div>

      {/* Logout Skeleton */}
      <div className="mt-4">
        <div className="h-14 rounded-[22px] skeleton opacity-50" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full animate-entrance">
      {selectedImage && (
        <ImageCropper 
          image={selectedImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setSelectedImage(null)} 
        />
      )}

      <div className="flex-1 flex flex-col pt-4 w-full">
        <header className="flex flex-col items-center gap-3 mb-6">
          <label className="relative cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-purple-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-[var(--secondary)] relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-purple-200" />
              )}
              {loading && profile && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 z-10">
                  <div className="w-4 h-4 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {/* Permanent Pencil Overlay */}
              <div className="absolute bottom-0 right-0 bg-[var(--secondary)] p-1.5 rounded-tl-xl z-20">
                <Pencil className="w-3 h-3 text-white" />
              </div>
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
          </label>
          <div className="text-center w-full px-4">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xl font-bold text-[#1F1939] bg-purple-50 border-b-2 border-[var(--secondary)] outline-none text-center py-1 w-full max-w-[200px]"
                  autoFocus
                  onBlur={handleUpdateName}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                />
                <button onClick={handleUpdateName} className="text-[var(--accent-green)]">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h2 className="text-2xl font-bold text-[#1F1939] leading-tight">{profile?.display_name || 'User'}</h2>
                <Pencil className="w-4 h-4 text-purple-200 group-hover:text-[var(--secondary)] transition-colors" />
              </div>
            )}
            <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-[0.2em] mt-1">Mein Profil</p>
          </div>
        </header>

        <div className="space-y-3 w-full">
          <div className="status-box p-4">
            <h3 className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mb-2">Mein Partner-Code</h3>
            <div className="flex items-center justify-between bg-purple-50/50 p-2.5 rounded-xl border border-dashed border-purple-100">
              <span className="font-mono font-bold text-[var(--secondary)] tracking-widest text-sm">{profile?.partner_code || '...'}</span>
              <button 
                onClick={() => { 
                  if (profile?.partner_code) {
                    navigator.clipboard.writeText(profile.partner_code);
                  }
                }}
                className="p-1.5 bg-white rounded-lg text-[var(--secondary)] active:scale-90 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="status-box p-4">
            <h3 className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mb-2">Verknüpfung</h3>
            {profile?.partner_id ? (
              <div className="flex items-center gap-3 text-[var(--accent-green)] bg-green-50 p-2.5 rounded-xl border border-green-100">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="font-bold text-xs text-green-700/80">{profile.display_name} & {partnerName}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[var(--primary)] bg-red-50 p-2.5 rounded-xl border border-red-100">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">Nicht verknüpft</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Code"
                    className="flex-1 p-2.5 rounded-xl border border-purple-100 bg-white font-mono uppercase text-center outline-none focus:border-[var(--secondary)] text-xs"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value)}
                  />
                  <button 
                    onClick={handleLinkPartner}
                    disabled={!partnerCodeInput || isLinking}
                    className="bg-[var(--secondary)] text-white px-4 rounded-xl font-bold disabled:opacity-50 text-xs"
                  >
                    {isLinking ? '...' : 'OK'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-[22px] relative overflow-hidden transition-all ${
            (deferredPrompt || isIOS || isAndroid) && !isStandalone
              ? 'bg-gradient-to-br from-[var(--secondary)] to-indigo-500 text-white' 
              : 'bg-gray-100 text-gray-400 opacity-60 grayscale'
          }`}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-1.5">
                <Download className="w-3.5 h-3.5" />
                <h3 className="font-bold text-xs">App installieren ✨</h3>
              </div>
              
              {isStandalone ? (
                <div className="flex items-center gap-2 text-[9px] font-bold text-green-600 bg-green-50/50 px-2 py-1 rounded-lg w-fit mt-1">
                  <Check className="w-3 h-3" /> Installiert
                </div>
              ) : isIOS ? (
                <button 
                  onClick={() => setShowIOSModal(true)}
                  className="bg-white text-[var(--secondary)] px-3 py-1 rounded-xl font-bold text-[9px] mt-1 active:scale-95 transition-all"
                >
                  Installieren
                </button>
              ) : deferredPrompt ? (
                <button 
                  onClick={handleInstallClick}
                  className="bg-white text-[var(--secondary)] px-3 py-1 rounded-xl font-bold text-[9px] mt-1 active:scale-95 transition-all"
                >
                  Installieren
                </button>
              ) : isAndroid ? (
                <div className="space-y-1">
                  <p className="text-[8px] leading-tight opacity-90 mb-1">Automatische Installation nicht bereit.</p>
                  <button 
                    onClick={() => alert("Tippe oben rechts im Chrome-Menü (⋮) auf 'App installieren'.")}
                    className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded-xl font-bold text-[9px] active:scale-95 transition-all"
                  >
                    Anleitung
                  </button>
                </div>
              ) : (
                <p className="text-[9px] leading-tight">
                  Nur auf Mobilgeräten verfügbar.
                </p>
              )}
            </div>
            <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full blur-2xl ${
              (deferredPrompt || isIOS || isAndroid) && !isStandalone ? 'bg-white/10' : 'bg-gray-200/20'
            }`} />
          </div>
        </div>

        {/* iOS Install Modal */}
        {showIOSModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm" onClick={() => setShowIOSModal(false)} />
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 animate-entrance border border-purple-100">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Download className="w-8 h-8 text-[var(--secondary)]" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#1F1939] mb-4">Auf iPhone installieren</h3>
              <div className="space-y-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center font-bold text-[var(--secondary)] text-sm shrink-0">1</div>
                  <p className="text-sm text-[#4A4468] leading-relaxed">
                    Tippe unten in Safari auf das <span className="inline-flex items-center px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-200"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/IOS_Share_Icon.svg/1200px-IOS_Share_Icon.svg.png" className="w-3 h-3" alt="Share" /></span> **Teilen-Icon**.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center font-bold text-[var(--secondary)] text-sm shrink-0">2</div>
                  <p className="text-sm text-[#4A4468] leading-relaxed">
                    Wähle im Menü den Punkt <br/>**"Zum Home-Bildschirm"**.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="btn-action"
              >
                Alles klar! ✨
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 pb-3 w-full relative z-20">
          <button 
            onClick={onLogout}
            className="w-full p-4 rounded-[22px] border-2 border-red-50 text-red-400 font-bold flex items-center justify-center gap-3 bg-white text-xs transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
