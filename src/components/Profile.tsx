import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, LogOut, Download, Check, AlertCircle, Pencil, Trash2, XCircle, Heart, Share2 } from 'lucide-react';
import ImageCropper from './ImageCropper';
import { useDialog } from './DialogProvider';

// --- Globaler Catcher für das Installations-Event ---
let globalDeferredPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

interface ProfileProps {
  profile: any;
  partnerProfile: any;
  onLogout: () => void;
}

export default function Profile({ profile: initialProfile, partnerProfile, onLogout }: ProfileProps) {
  const { showAlert, showConfirm } = useDialog();
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
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

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

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      globalDeferredPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isDesktop = !isIOS && !isAndroid;

  const triggerAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        setShowInstallModal(false);
      }
    }
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
      showAlert("Fehler!", "error");
    }
  };

  const handleUnlinkPartner = async () => {
    if (!profile?.partner_id) return;
    showConfirm(
      "Möchtest du die Verknüpfung mit deinem Partner wirklich aufheben?",
      async () => {
        setIsLinking(true);
        try {
          const { error } = await supabase.rpc('unlink_partners');
          if (error) throw error;
          window.location.reload();
        } catch (err) {
          showAlert("Fehler!", "error");
        } finally {
          setIsLinking(false);
        }
      },
      { title: "Partner trennen", confirmLabel: "Jetzt trennen", cancelLabel: "Abbrechen" }
    );
  };

  const handleLinkPartner = async () => {
    if (!partnerCodeInput) return;
    setIsLinking(true);
    try {
      const { error } = await supabase.rpc('link_partners', { 
        partner_code_to_link: partnerCodeInput.trim().toUpperCase() 
      });
      if (error) {
        showAlert(error.message || "Code nicht gefunden!", "error");
        return;
      }
      window.location.reload();
    } catch (err: any) {
      showAlert("Fehler!", "error");
    } finally {
      setIsLinking(false);
    }
  };

  const handleShareCode = async () => {
    if (!profile?.partner_code) return;
    
    const shareData = {
      title: 'Bisou Partner-Code',
      text: `Verknüpfe dich mit mir auf Bisou! Mein Code ist: ${profile.partner_code}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Teilen abgebrochen oder fehlgeschlagen', err);
      }
    } else {
      // Fallback, falls die Web Share API nicht unterstützt wird
      navigator.clipboard.writeText(profile.partner_code);
      showAlert("Code kopiert! ✨", "success");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async () => {
    if (!profile.avatar_url) return;
    showConfirm(
      "Bild wirklich löschen?",
      async () => {
        setLoading(true);
        try {
          const oldPath = profile.avatar_url.split('/avatars/')[1];
          if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
          await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
          window.location.reload();
        } catch (err) {
          showAlert("Fehler beim Löschen!", "error");
        } finally {
          setLoading(false);
        }
      },
      { title: "Bild löschen", confirmLabel: "Jetzt löschen", cancelLabel: "Abbrechen" }
    );
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImage(null);
    setLoading(true);
    try {
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
      }

      const fileName = `${profile.id}/${Date.now()}.jpg`;
      await supabase.storage.from('avatars').upload(fileName, croppedBlob, { contentType: 'image/jpeg', upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      window.location.reload();
    } catch (err: any) {
      showAlert("Fehler!", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full animate-entrance overflow-hidden">
      {selectedImage && (
        <ImageCropper image={selectedImage} onCropComplete={handleCropComplete} onCancel={() => setSelectedImage(null)} />
      )}

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <header className="flex flex-col items-center mb-6 relative pt-14 shrink-0">
          <button 
            onClick={onLogout} 
            className="absolute top-0 right-0 p-2.5 rounded-full bg-white border border-red-100 text-[var(--primary)] shadow-sm hover:bg-red-50 hover:text-red-600 transition-all active:scale-90 z-20"
            title="Abmelden"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <div className="relative flex items-center">
              <div className="relative group cursor-pointer" onClick={() => profile?.avatar_url ? setShowAvatarMenu(true) : document.getElementById('avatar-upload')?.click()}>
                <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <div className="w-24 h-24 rounded-[2.5rem] bg-white border-2 border-white flex items-center justify-center overflow-hidden transition-all relative shadow-md hover:scale-105 active:scale-95">
                  {profile?.avatar_url ? (<img src={profile.avatar_url} alt="P" className="w-full h-full object-cover" />) : (<Camera className="w-8 h-8 text-purple-200" />)}
                  {loading && (<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10"><div className="w-4 h-4 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin"></div></div>)}
                </div>
              </div>
              <button 
                onClick={() => profile?.avatar_url ? setShowAvatarMenu(true) : document.getElementById('avatar-upload')?.click()}
                className="absolute -right-1 bottom-0.5 p-2 rounded-full bg-white border-2 border-white text-[var(--secondary)] shadow-md active:scale-90 hover:text-purple-600 transition-all z-30"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="mt-4 flex flex-col items-center gap-0.5">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-base font-black text-[var(--text-main)] bg-purple-50/50 border-b-2 border-[var(--secondary)] outline-none text-center py-1 w-[140px]" autoFocus onBlur={handleUpdateName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()} />
                  <button onClick={handleUpdateName} className="text-[var(--accent-green)] p-1"><Check className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer px-4 py-1.5 rounded-full hover:bg-purple-50/50 transition-all" onClick={() => setIsEditingName(true)}>
                  <span className="text-lg font-black text-[var(--text-main)] uppercase tracking-[0.1em]">{profile?.display_name || 'User'}</span>
                  <Pencil className="w-4 h-4 text-purple-300 group-hover:text-[var(--secondary)] transition-colors" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-3 w-full overflow-hidden flex-1 flex flex-col">
          
          {/* Kombiniertes Modul: Mein Code & Partner */}
          {profile?.partner_id ? (
            <div className="status-box p-5 flex flex-col items-center justify-center gap-3 text-center shrink-0">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-[var(--secondary)] uppercase tracking-[0.2em]">Mein Bisou-Partner:</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-black text-xl text-[var(--text-main)] tracking-tight">{partnerProfile?.display_name || 'Partner'}</span>
                  <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shadow-sm">
                    <Heart className="w-3.5 h-3.5 text-[var(--primary)] fill-current" />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleUnlinkPartner} 
                disabled={isLinking}
                className="text-[10px] font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer active:scale-95 uppercase tracking-widest"
              >
                Verknüpfung aufheben
              </button>
            </div>
          ) : (
            <div className="status-box p-5 flex flex-col gap-5 shrink-0">
              <div className="text-center">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Kein Partner verknüpft</span>
              </div>
              
              {/* Oberer Teil: Mein Code */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] ml-1">Mein Bisou-Code</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative group overflow-hidden rounded-2xl">
                    <div className="bg-purple-50/30 border-2 border-[var(--card-border)] h-12 flex items-center justify-center font-mono font-black text-base text-[var(--text-main)] tracking-[0.2em] shadow-sm">
                      {profile?.partner_code || '...'}
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(profile?.partner_code); showAlert("Code kopiert! ✨", "success"); }}
                      className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center bg-white/50 hover:bg-white rounded-xl text-[var(--secondary)] active:scale-95 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button 
                    onClick={handleShareCode}
                    className="w-12 h-12 shrink-0 flex items-center justify-center bg-white border-2 border-[var(--card-border)] rounded-2xl text-[var(--secondary)] active:scale-95 transition-all shadow-sm hover:border-[var(--secondary)] hover:bg-purple-50"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Unterer Teil: Partnercode eintragen */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] ml-1">Partnercode eintragen:</span>
                <div className="flex items-center gap-2.5">
                  <input 
                    type="text" 
                    placeholder="CODE EINGEBEN" 
                    value={partnerCodeInput} 
                    onChange={(e) => setPartnerCodeInput(e.target.value)} 
                    className="flex-1 bg-white border-2 border-[var(--card-border)] rounded-2xl h-12 text-center font-mono font-black text-base text-[var(--text-main)] outline-none focus:border-[var(--secondary)] transition-colors placeholder:text-purple-200 placeholder:font-sans placeholder:text-[9px] placeholder:tracking-widest uppercase shadow-sm"
                  />
                  <button 
                    onClick={handleLinkPartner} 
                    disabled={!partnerCodeInput || isLinking} 
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-[var(--secondary)] text-white rounded-2xl shadow-md active:scale-95 transition-all hover:bg-purple-500 disabled:opacity-30 disabled:grayscale"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* App Nutzung */}
          {!isStandalone && (
            <div className="flex justify-center pt-2 shrink-0">
              {isDesktop ? (
                <div className="status-box p-3.5 text-center">
                  <p className="text-[11px] font-bold text-[var(--muted)] leading-tight">
                    Mobil-Installation empfohlen.
                  </p>
                </div>
              ) : (
                <button 
                  onClick={() => setShowInstallModal(true)} 
                  className="btn-secondary py-2.5 px-6 text-[10px] font-black uppercase tracking-widest w-auto shadow-sm border-2"
                >
                  Bisou-App installieren
                </button>
              )}
            </div>
          )}

          <div className="mt-auto pb-4 flex justify-center shrink-0">
            <button 
              onClick={() => {
                showConfirm(
                  "Möchtest du deinen Bisou-Account wirklich unwiderruflich löschen? Alle deine Daten und Antworten werden dabei für immer entfernt.",
                  async () => {
                    try {
                      setLoading(true);
                      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
                      if (error) throw error;
                      onLogout();
                    } catch (err) {
                      showAlert("Fehler beim Löschen des Accounts.", "error");
                    } finally {
                      setLoading(false);
                    }
                  },
                  { 
                    title: "Account löschen?", 
                    confirmLabel: "Ja, Account löschen", 
                    cancelLabel: "Abbrechen",
                    type: 'error'
                  }
                );
              }}
              className="text-[10px] font-black text-red-300 uppercase tracking-[0.2em] hover:text-red-500 transition-colors py-2 underline"
            >
              Account löschen
            </button>
          </div>
        </div>
      </div>

      {showAvatarMenu && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0" onClick={() => setShowAvatarMenu(false)} />
          <div className="bg-white rounded-[2.5rem] p-5 w-full max-w-[300px] relative z-10 animate-entrance border-2 border-purple-100 shadow-2xl overflow-hidden text-center">
            <h4 className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] mb-4">Profilbild</h4>
            <div className="flex flex-col gap-2.5">
               <button onClick={() => { setShowAvatarMenu(false); document.getElementById('avatar-upload')?.click(); }} className="w-full p-4 rounded-2xl bg-purple-50 text-[var(--secondary)] font-bold text-sm flex items-center justify-center gap-2.5 active:scale-95 transition-all border border-purple-100"><Camera className="w-4.5 h-4.5" /> Bild ändern</button>
               <button onClick={() => { setShowAvatarMenu(false); handleDeleteImage(); }} className="w-full p-4 rounded-2xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2.5 active:scale-95 transition-all border border-red-100"><Trash2 className="w-4.5 h-4.5" /> Bild löschen</button>
               <button onClick={() => setShowAvatarMenu(false)} className="w-full p-3 text-[var(--muted)] font-bold text-[10px] uppercase tracking-widest mt-2 hover:text-[var(--text-main)] transition-colors">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0" onClick={() => setShowInstallModal(false)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 animate-entrance border-2 border-purple-100 shadow-2xl text-center">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
              <Download className="w-7 h-7 text-[var(--secondary)]" />
            </div>
            <h3 className="text-xl font-bold text-[#1F1939] mb-4 tracking-tight">App installieren</h3>

            {isAndroid && (
              <>
                <p className="text-sm text-[#4A4468] font-medium leading-relaxed mb-6">
                  Ich sehe du hast ein <b className="text-[#1F1939]">Android-Gerät</b>, hier kannst du die App besonders einfach installieren:
                </p>
                {deferredPrompt ? (
                  <button onClick={triggerAndroidInstall} className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold shadow-md active:scale-95 transition-all hover:bg-blue-600">
                    Jetzt installieren
                  </button>
                ) : (
                  <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    Bitte lade die Seite neu oder nutze das Browser-Menü (⋮) und wähle "App installieren".
                  </p>
                )}
              </>
            )}

            {isIOS && (
              <>
                <p className="text-sm text-[#4A4468] font-medium leading-relaxed mb-6">
                  Ich sehe du hast ein <b className="text-[#1F1939]">iPhone</b>, hier ist die installation etwas komplizierter:
                </p>
                <div className="space-y-5 mb-8 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-[var(--secondary)] text-sm">1</div>
                    <p className="text-sm text-[#4A4468] font-medium leading-relaxed">Tippe unten in deinem Browser auf <b className="text-[#1F1939]">Teilen</b>.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-[var(--secondary)] text-sm">2</div>
                    <p className="text-sm text-[#4A4468] font-medium leading-relaxed">Wähle <b className="text-[#1F1939]">"Zum Home-Bildschirm"</b> aus dem Menü.</p>
                  </div>
                </div>
              </>
            )}

            {isDesktop && (
              <>
                <p className="text-sm text-[#4A4468] font-medium leading-relaxed mb-6">
                  Ich sehe, du nutzt ein <b className="text-[#1F1939]">Desktop-Gerät</b>.
                </p>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-[#4A4468] font-medium">Die App-Installation ist für Mobilgeräte optimiert. Bitte öffne diese Seite auf deinem Smartphone.</p>
                </div>
              </>
            )}

            <button onClick={() => setShowInstallModal(false)} className="w-full mt-6 p-3 text-[var(--muted)] font-bold text-[10px] uppercase tracking-widest hover:text-[var(--text-main)] transition-colors">
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}