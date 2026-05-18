import Rendroidct, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, LogOut, Download, Check, AlertCircle, Pencil, Trash2, XCircle, Heart } from 'lucide-react';
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
    <div className="flex flex-col h-full animate-entrance overflow-visible">
      {selectedImage && (
        <ImageCropper image={selectedImage} onCropComplete={handleCropComplete} onCancel={() => setSelectedImage(null)} />
      )}

      <div className="flex-1 flex flex-col w-full overflow-visible">
        <header className="flex flex-col items-center mb-8 relative pt-1">
          <button 
            onClick={onLogout} 
            className="absolute top-0 right-0 p-2.5 rounded-full bg-white border border-red-100 text-red-400 shadow-sm hover:bg-red-50 hover:text-red-600 transition-all active:scale-90 z-20"
            title="Abmelden"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <div className="relative flex items-center">
              <div className="relative group cursor-pointer" onClick={() => profile?.avatar_url ? setShowAvatarMenu(true) : document.getElementById('avatar-upload')?.click()}>
                <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-blue-100 flex items-center justify-center overflow-hidden transition-all relative shadow-sm hover:border-blue-300">
                  {profile?.avatar_url ? (<img src={profile.avatar_url} alt="P" className="w-full h-full object-cover" />) : (<Camera className="w-8 h-8 text-blue-200" />)}
                  {loading && (<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10"><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div></div>)}
                </div>
              </div>
              <button 
                onClick={() => profile?.avatar_url ? setShowAvatarMenu(true) : document.getElementById('avatar-upload')?.click()}
                className="absolute -right-1 bottom-0.5 p-1.5 rounded-full bg-white border-2 border-blue-50 text-blue-400 shadow-md active:scale-90 hover:border-blue-100 transition-all z-30"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
            
            <div className="mt-3 flex flex-col items-center gap-0.5">
              <span className="text-[7px] font-black text-blue-300 uppercase tracking-[0.2em] mb-0.5">Name ✨</span>
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-sm font-black text-[var(--text-main)] bg-blue-50 border-b-2 border-blue-400 outline-none text-center py-1 w-[120px]" autoFocus onBlur={handleUpdateName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()} />
                  <button onClick={handleUpdateName} className="text-[var(--accent-green)] p-1"><Check className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer bg-white/50 px-4 py-1.5 rounded-full border border-transparent hover:border-blue-100 transition-all" onClick={() => setIsEditingName(true)}>
                  <span className="text-[15px] font-black text-[var(--text-main)] uppercase tracking-[0.1em]">{profile?.display_name || 'User'}</span>
                  <Pencil className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-4 w-full overflow-hidden">
          
          {/* Kombiniertes Modul: Mein Code & Partner */}
          <div className="bg-white rounded-[2rem] border border-blue-100 shadow-sm overflow-hidden flex flex-col">
            
            {/* Obere Hälfte: Mein Code */}
            <div className="bg-blue-50/50 p-4 px-5 flex items-center justify-between border-b border-blue-100/60">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Mein Partner-Code</span>
                <div className="bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm inline-flex items-center w-fit">
                  <span className="font-mono font-black text-[14px] text-blue-900 tracking-widest">{profile?.partner_code || '...'}</span>
                </div>
              </div>
              <button 
                onClick={() => { if (profile?.partner_code) { navigator.clipboard.writeText(profile.partner_code); showAlert("Code kopiert! ✨", "success"); } }} 
                className="p-2.5 bg-white border border-blue-100 rounded-xl text-blue-400 active:scale-90 transition-all shadow-sm hover:border-blue-200"
              >
                <Copy className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Untere Hälfte: Partner Status */}
            <div className="p-5">
              {profile?.partner_id ? (
                <div className="flex flex-col items-center justify-center pt-1 pb-2">
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-3">Verbunden mit</span>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-black text-[16px] text-blue-900 tracking-tight">{profile.display_name}</span>
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                    <span className="font-black text-[16px] text-blue-900 tracking-tight">{partnerProfile?.display_name || 'Partner'}</span>
                  </div>
                  <button 
                    onClick={handleUnlinkPartner} 
                    disabled={isLinking}
                    className="text-[10px] font-bold text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1.5 active:scale-95 bg-red-50 px-4 py-2 rounded-full border border-red-100"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Trennen
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Partner verknüpfen</span>
                    <div className="flex items-center gap-1 text-[var(--primary)] bg-red-50/50 p-1.5 rounded-lg border border-red-100 px-2.5">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="font-bold text-[8px] text-red-800 uppercase tracking-wider">Fehlt</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Code hier eingeben" 
                      className="flex-1 p-3.5 rounded-xl border border-blue-100 bg-gray-50 font-mono uppercase text-center outline-none focus:border-blue-400 focus:bg-white transition-colors text-sm text-[var(--text-main)] font-bold placeholder:text-blue-200 placeholder:font-sans placeholder:text-[11px] placeholder:tracking-normal" 
                      value={partnerCodeInput} 
                      onChange={(e) => setPartnerCodeInput(e.target.value)} 
                    />
                    <button 
                      onClick={handleLinkPartner} 
                      disabled={!partnerCodeInput || isLinking} 
                      className="bg-blue-500 text-white px-5 rounded-xl font-bold disabled:opacity-50 text-xs shadow-md active:scale-95 transition-all hover:bg-blue-600"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* App Nutzung Box (Unverändert) */}
          <div className="bg-blue-50/50 p-4 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">App Nutzung:</span>
            {isDesktop ? (
              <span className="font-bold text-[10px] text-blue-500 uppercase tracking-wider mt-1 text-center">
                Installation nur auf Mobilgeräten
              </span>
            ) : isStandalone ? (
              <span className="font-black text-[15px] text-blue-900 tracking-tight flex items-center gap-2">✨ Installiert</span>
            ) : (
              <button onClick={() => setShowInstallModal(true)} className="w-full mt-1 bg-white border border-blue-100 py-3 rounded-xl text-blue-600 font-bold text-xs shadow-sm active:scale-95 transition-all hover:bg-blue-50">App jetzt installieren</button>
            )}
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
                  Ich sehe, du nutzt ein <b className="text-[#1F1939]">Android-Gerät</b>.
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
                  Ich sehe, du nutzt ein <b className="text-[#1F1939]">iPhone oder iPad</b>.
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