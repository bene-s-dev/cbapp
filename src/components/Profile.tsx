import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, Heart, LogOut, Download, Check, AlertCircle, Pencil } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ProfileProps {
  profile: any;
  partnerProfile: any;
  onLogout: () => void;
}

export default function Profile({ profile: initialProfile, partnerProfile, onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<any>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(initialProfile?.display_name || '');
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
    setNewName(initialProfile?.display_name || '');
  }, [initialProfile]);

  useEffect(() => {
    const checkStandalone = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.matchMedia('(display-mode: minimal-ui)').matches || 
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (navigator as any).standalone || 
             document.referrer.includes('android-app://') ||
             urlParams.get('mode') === 'standalone';
    };

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    setIsAndroid(/Android/.test(ua));
    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (!deferredPrompt) {
      if (isAndroid) alert("Bitte nutze das Chrome-Menü (⋮) und wähle 'App installieren'.");
      return;
    }
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
      const { error } = await supabase.from('profiles').update({ display_name: newName.trim() }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, display_name: newName.trim() });
      setIsEditingName(false);
    } catch (err: any) {
      alert("Fehler!");
    }
  };

  const handleUnlinkPartner = async () => {
    if (!profile?.partner_id) return;
    if (!window.confirm("Möchtest du die Verknüpfung mit deinem Partner wirklich aufheben?")) return;
    setIsLinking(true);
    try {
      const partnerId = profile.partner_id;
      await supabase.from('profiles').update({ partner_id: null }).eq('id', profile.id);
      await supabase.from('profiles').update({ partner_id: null }).eq('id', partnerId);
      window.location.reload();
    } catch (err) {
      alert("Fehler!");
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!partnerCodeInput) return;
    setIsLinking(true);
    try {
      const { data: partnerP, error: findError } = await supabase.from('profiles').select('id').eq('partner_code', partnerCodeInput.trim().toUpperCase()).single();
      if (findError || !partnerP) {
        alert("Code nicht gefunden!");
        return;
      }
      if (partnerP.id === profile.id) {
        alert("Du kannst dich nicht mit dir selbst verknüpfen! ✨");
        return;
      }
      await supabase.from('profiles').update({ partner_id: partnerP.id }).eq('id', profile.id);
      await supabase.from('profiles').update({ partner_id: profile.id }).eq('id', partnerP.id);
      window.location.reload();
    } catch (err: any) {
      alert("Fehler!");
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
      const fileName = `${profile.id}/${Date.now()}.jpg`;
      await supabase.storage.from('avatars').upload(fileName, croppedBlob, { contentType: 'image/jpeg', upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      window.location.reload();
    } catch (err: any) {
      alert("Fehler!");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;
  const isDesktop = !isIOS && !isAndroid;

  return (
    <div className="flex flex-col h-full animate-entrance overflow-visible">
      {selectedImage && (
        <ImageCropper image={selectedImage} onCropComplete={handleCropComplete} onCancel={() => setSelectedImage(null)} />
      )}

      <div className="flex-1 flex flex-col w-full overflow-visible">
        {/* Profile Header: Avatar centered at the same height as the persistent layout branding */}
        <header className="flex flex-col items-center mb-8 relative pt-1">
          <div className="flex flex-col items-center">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-purple-100 flex items-center justify-center overflow-hidden transition-all relative shadow-sm">
                {profile?.avatar_url ? (<img src={profile.avatar_url} alt="P" className="w-full h-full object-cover" />) : (<Camera className="w-8 h-8 text-purple-300" />)}
                {loading && (<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10"><div className="w-4 h-4 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin"></div></div>)}
                <div className="absolute bottom-0 right-0 bg-[var(--secondary)] p-1.5 rounded-tl-xl z-20"><Pencil className="w-3.5 h-3.5 text-white" /></div>
              </div>
            </label>
            
            <div className="mt-2 flex items-center justify-center">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-xs font-bold text-[var(--text-main)] bg-purple-50 border-b border-[var(--secondary)] outline-none text-center py-0.5 w-[80px]" autoFocus onBlur={handleUpdateName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()} />
                  <button onClick={handleUpdateName} className="text-[var(--accent-green)]"><Check className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <span className="text-[10px] font-bold text-[var(--text-main)] uppercase tracking-[0.15em]">{profile?.display_name || 'User'}</span>
                  <Pencil className="w-2.5 h-2.5 text-purple-300 group-hover:text-[var(--secondary)] transition-colors" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-2.5 w-full overflow-hidden">
          <div className="status-box p-3.5">
            <h3 className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 px-1">Mein Partner-Code</h3>
            <div className="flex items-center justify-between bg-purple-50/50 p-2 rounded-xl border border-dashed border-[var(--card-border)]">
              <span className="font-mono font-bold text-[var(--text-main)] tracking-widest text-sm pl-2">{profile?.partner_code || '...'}</span>
              <button onClick={() => { if (profile?.partner_code) navigator.clipboard.writeText(profile.partner_code); }} className="p-2 bg-white border border-[var(--card-border)] rounded-lg text-[var(--secondary)] active:scale-90 transition-all shadow-sm"><Copy className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="status-box p-3.5">
            <h3 className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] mb-2 px-1">Verknüpfung</h3>
            {profile?.partner_id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[var(--accent-green)] bg-green-50 p-3 rounded-xl border border-green-100">
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="font-bold text-sm text-green-800">{profile.display_name} & {partnerProfile?.display_name || 'Partner'}</span>
                </div>
                <button onClick={handleUnlinkPartner} disabled={isLinking} className="w-full text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors py-1 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> Partner entfernen</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] bg-red-50 p-2 rounded-xl border border-red-100 px-3"><AlertCircle className="w-3.5 h-3.5" /><span className="font-bold text-[11px] text-red-800">Nicht verknüpft</span></div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Code" className="flex-1 p-3 rounded-xl border-2 border-[var(--card-border)] bg-white font-mono uppercase text-center outline-none focus:border-[var(--secondary)] text-sm text-[var(--text-main)] font-bold" value={partnerCodeInput} onChange={(e) => setPartnerCodeInput(e.target.value)} />
                  <button onClick={handleLinkPartner} disabled={!partnerCodeInput || isLinking} className="bg-[var(--secondary)] text-white px-5 rounded-xl font-bold disabled:opacity-50 text-xs shadow-md active:scale-95 transition-all">OK</button>
                </div>
              </div>
            )}
          </div>

          <div className="status-box p-3.5">
            <h3 className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] mb-3 px-1">App Nutzung ✨</h3>
            {isStandalone ? (
              <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 w-full justify-center"><Check className="w-4 h-4" /> Installiert & Startbereit</div>
            ) : isDesktop ? (
              <p className="text-[10px] font-bold text-[var(--muted)] text-center py-2 bg-gray-50 rounded-xl border border-gray-100">Installation nur mobil möglich.</p>
            ) : (
              <button onClick={handleInstallClick} className="btn-action py-3 text-xs shadow-md">App installieren</button>
            )}
          </div>
        </div>

        <div className="mt-auto pb-6 pt-2 w-full relative z-20">
          <button onClick={onLogout} className="w-full p-4 rounded-[22px] border-2 border-red-100 text-red-600 font-bold flex items-center justify-center gap-2 bg-white text-xs transition-all active:scale-95 hover:border-red-200 shadow-sm"><LogOut className="w-3.5 h-3.5" />Abmelden</button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#2D264B]/60 backdrop-blur-md" onClick={() => setShowIOSModal(false)} />
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md relative z-10 animate-entrance border-2 border-purple-100 shadow-2xl text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Download className="w-6 h-6 text-[var(--secondary)]" /></div>
            <h3 className="text-lg font-bold text-[#1F1939] mb-4">Installieren</h3>
            <div className="space-y-4 mb-6 text-left">
              <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center font-bold text-[var(--secondary)] text-sm">1</div><p className="text-sm text-[#4A4468] font-medium">Tippe auf **Teilen**.</p></div>
              <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center font-bold text-[var(--secondary)] text-sm">2</div><p className="text-sm text-[#4A4468] font-medium">Wähle **"Zum Home-Bildschirm"**.</p></div>
            </div>
            <button onClick={() => setShowIOSModal(false)} className="btn-action py-3 text-sm font-bold">Alles klar! ✨</button>
          </div>
        </div>
      )}
    </div>
  );
}
