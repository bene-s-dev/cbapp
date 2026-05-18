import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, Download, Check, AlertCircle, Pencil, Trash2, XCircle, Heart, Share2, LogOut, Bell, BellOff, User as UserIcon, Info } from 'lucide-react';
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
  const [partnerCodeInput, setPartnerCodeInput] = useState('CB-');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(initialProfile?.display_name || '');
  const [isLinking, setIsLinking] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
    setNewName(initialProfile?.display_name || '');
    
    const checkPush = async () => {
      if (isPushLoading) return;
      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      }
    };
    checkPush();
  }, [initialProfile, isPushLoading]);

  const handleTogglePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      showAlert("Browser unterstützt keine Benachrichtigungen.", "error");
      return;
    }

    if (!pushEnabled && pushPermission === 'default') {
      setIsPushLoading(true);
      try {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission !== 'granted') {
          showAlert("Berechtigung verweigert. Bitte in den Browsereinstellungen aktivieren.", "error");
        } else {
          showAlert("Berechtigung erteilt! Klicke jetzt auf den Schalter.", "info");
        }
      } catch (err) {
        showAlert("Fehler bei der Berechtigungsanfrage.", "error");
      } finally {
        setIsPushLoading(false);
      }
      return;
    }

    setIsPushLoading(true);
    const previousState = pushEnabled;
    setPushEnabled(!previousState);

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('user_id', profile.id);
        showAlert("Benachrichtigungen deaktiviert.", "info");
      } else {
        if (pushPermission !== 'granted') {
           setPushEnabled(false);
           showAlert("Berechtigung fehlt. Bitte in den Browsereinstellungen aktivieren.", "error");
           setIsPushLoading(false);
           return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BM8FOwuRD2p8N7BtyT_a2CC1h9rdEcacNBfuMSS2BfxMlWDYQPKl1lriUMf_cV3k3Cq2ToxbHaFHPslUtQ074GI'
        });
        await supabase.from('push_subscriptions').upsert({ user_id: profile.id, subscription: subscription.toJSON() });
        showAlert("Benachrichtigungen aktiviert! ✨", "success");
      }
    } catch (err) {
      setPushEnabled(previousState);
      showAlert("Fehler bei den Benachrichtigungen.", "error");
    } finally {
      setTimeout(() => setIsPushLoading(false), 500);
    }
  };

  useEffect(() => {
    const checkStandalone = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone || 
             urlParams.get('source') === 'pwa';
    };
    setIsStandalone(checkStandalone());
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));
    setIsDesktop(!/iphone|ipad|ipod|android|mobile/.test(ua));

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      globalDeferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === profile.display_name) {
      setIsEditingName(false);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: newName.trim() }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, display_name: newName.trim() });
      showAlert("Name aktualisiert! ✨", "success");
    } catch (err) {
      showAlert("Fehler beim Aktualisieren.", "error");
    } finally {
      setLoading(false);
      setIsEditingName(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!partnerCodeInput.trim() || partnerCodeInput === 'CB-') return;
    setIsLinking(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id').eq('partner_code', partnerCodeInput.toUpperCase()).single();
      if (error || !data) {
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
        showAlert("Code nicht gefunden.", "error");
        return;
      }
      if (data.id === profile.id) {
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
        showAlert("Du kannst dich nicht mit dir selbst verknüpfen.", "error");
        return;
      }
      const { error: updateError } = await supabase.from('profiles').update({ partner_id: data.id }).eq('id', profile.id);
      if (updateError) throw updateError;
      window.location.reload();
    } catch (err) {
      showAlert("Fehler beim Verknüpfen.", "error");
    } finally {
      setIsLinking(false);
      setPartnerCodeInput('CB-');
    }
  };

  const handleUnlinkPartner = async () => {
    showConfirm(
      "Möchtest du die Verknüpfung mit deinem Partner wirklich aufheben?",
      async () => {
        setIsLinking(true);
        try {
          const { error } = await supabase.from('profiles').update({ partner_id: null }).eq('id', profile.id);
          if (error) throw error;
          window.location.reload();
        } catch (err) {
          showAlert("Fehler beim Trennen.", "error");
        } finally {
          setIsLinking(false);
        }
      },
      { title: "Verknüpfung lösen", confirmLabel: "Ja, trennen", cancelLabel: "Abbrechen" }
    );
  };

  const copyToClipboard = (text: string) => {
    const cleanText = text.replace(/^CB-/, '');
    const textArea = document.createElement("textarea");
    textArea.value = cleanText;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showAlert("Code kopiert! ✨", "success");
    } catch (err) {
      showAlert("Fehler beim Kopieren", "error");
    }
    document.body.removeChild(textArea);
  };

  const handleShareCode = async () => {
    if (!profile?.partner_code) return;
    const cleanCode = profile.partner_code.replace(/^CB-/, '');
    const shareData = { title: 'Bisou Partner-Code', text: `Verknüpfe dich mit mir auf Bisou! Mein Code ist: ${cleanCode}` };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Teilen abgebrochen'); }
    } else { copyToClipboard(profile.partner_code); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = async () => {
    if (!profile.avatar_url) return;
    showConfirm(
      "Möchtest du dein Profilbild wirklich löschen?",
      async () => {
        setLoading(true);
        try {
          const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
          if (error) throw error;
          setProfile({ ...profile, avatar_url: null });
          showAlert("Bild gelöscht.", "info");
          setShowAvatarMenu(false);
        } catch (err) {
          showAlert("Fehler beim Löschen.", "error");
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
      const fileName = `${profile.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedBlob);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;
      setProfile({ ...profile, avatar_url: publicUrl });
      showAlert("Profilbild aktualisiert! ✨", "success");
    } catch (err) {
      showAlert("Fehler beim Hochladen.", "error");
    } finally {
      setLoading(false);
      setShowAvatarMenu(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-entrance overflow-hidden">
      {selectedImage && (
        <ImageCropper image={selectedImage} onCropComplete={handleCropComplete} onCancel={() => setSelectedImage(null)} />
      )}

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <header className="flex flex-col items-center mb-2 relative pt-6 shrink-0">
          <h2 className="text-[9px] font-black text-[#1F1939] uppercase tracking-[0.2em] mb-2">Mein Bisou-Profil</h2>
          <div className="flex flex-col items-center">
            <div className="relative flex items-center">
              <div className="relative group cursor-pointer" onClick={() => profile?.avatar_url ? setShowAvatarMenu(true) : document.getElementById('avatar-upload')?.click()}>
                <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <div className="w-16 h-16 rounded-3xl bg-white border-2 border-white flex items-center justify-center overflow-hidden transition-all relative shadow-sm hover:scale-105 active:scale-95">
                  {profile?.avatar_url ? (<img src={profile.avatar_url} alt="P" className="w-full h-full object-cover" />) : (<UserIcon className="w-8 h-8 text-purple-200" />)}
                  {loading && (<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10"><div className="w-4 h-4 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin"></div></div>)}
                </div>
              </div>
              <button 
                onClick={() => profile?.avatar_url ? setShowAvatarMenu(true) : document.getElementById('avatar-upload')?.click()}
                className="absolute -right-1 bottom-0 w-7 h-7 rounded-full bg-white border border-[var(--card-border)] text-[var(--secondary)] flex items-center justify-center shadow-sm active:scale-90 hover:border-[var(--secondary)] transition-all z-30"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="mt-1 flex flex-col items-center gap-0.5">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-sm font-black text-[var(--text-main)] bg-purple-50/50 border-b-2 border-[var(--secondary)] outline-none text-center py-1 w-[120px]" autoFocus onBlur={handleUpdateName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()} />
                  <button onClick={handleUpdateName} className="w-8 h-8 rounded-xl bg-white border border-[var(--card-border)] text-[var(--accent-green)] flex items-center justify-center shadow-sm active:scale-90 hover:border-[var(--accent-green)] transition-all"><Check className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group cursor-pointer px-3 py-1 rounded-full hover:bg-purple-50/50 transition-all" onClick={() => setIsEditingName(true)}>
                  <span className="text-base font-black text-[var(--text-main)] uppercase tracking-[0.1em]">{profile?.display_name || 'User'}</span>
                  <Pencil className="w-3 h-3 text-purple-300 group-hover:text-[var(--secondary)] transition-colors" />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-3 w-full overflow-hidden flex-1 flex flex-col px-1">
          <div className="flex flex-col gap-1 shrink-0">
            <h3 className="text-[8px] font-black text-[#1F1939] uppercase tracking-[0.2em] ml-2">Bisou-Verknüpfung</h3>
            {profile?.partner_id ? (
              <div className="status-box pt-3 pb-8 flex flex-col items-center justify-center gap-2 text-center shrink-0 min-h-[90px] relative">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.2em]">Mein Bisou-Partner:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-black text-lg text-[var(--text-main)] tracking-tight">{partnerProfile?.display_name || 'Partner'}</span>
                  </div>
                </div>
                <button onClick={handleUnlinkPartner} disabled={isLinking} className="absolute bottom-2 text-[8px] font-black text-red-400 hover:text-red-500 transition-colors cursor-pointer active:scale-95 uppercase tracking-[0.2em] flex items-center gap-1">Verknüpfung aufheben <XCircle className="w-2.5 h-2.5" /></button>
              </div>
            ) : (
              <div className="status-box p-3 flex flex-col gap-2 shrink-0">
                <div className="text-center"><span className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-wider">Kein Partner verknüpft</span></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] ml-1">Mein Bisou-Code</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative group rounded-xl border-2 border-[var(--card-border)] bg-purple-50/30 overflow-hidden shadow-sm h-10 flex items-center justify-center pr-10">
                      <div className="flex items-center font-mono font-black text-sm text-[var(--text-main)]">
                        <div className="flex items-center gap-1 mr-1.5">{['C','B','-'].map((char, i) => (<div key={`pre-${i}`} className="w-4 h-7 flex items-center justify-center">{char}</div>))}</div>
                        <div className="flex items-center gap-1">{(profile?.partner_code || '').replace('CB-', '').padEnd(6, ' ').split('').map((char, i) => (<div key={i} className={`w-5 h-7 rounded-md flex items-center justify-center text-[11px] font-black border transition-all ${char !== ' ' ? 'bg-white border-purple-200' : 'bg-white border-purple-50'}`}>{char !== ' ' ? char : <div className="w-2.5 h-0.5 bg-purple-200/20 rounded-full" />}</div>))}</div>
                      </div>
                      <button onClick={() => copyToClipboard(profile?.partner_code)} className="absolute right-0 top-0 bottom-0 w-10 bg-white border-l border-[var(--card-border)] text-[var(--secondary)] flex items-center justify-center active:scale-95 transition-all"><Copy className="w-4.5 h-4.5" /></button>
                    </div>
                    <button onClick={handleShareCode} className="w-10 h-10 flex shrink-0 items-center justify-center bg-white border border-[var(--card-border)] rounded-xl text-[var(--secondary)] active:scale-95 transition-all shadow-sm hover:border-[var(--secondary)]"><Share2 className="w-4.5 h-4.5" /></button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] ml-1">Partnercode eintragen:</span>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 relative group rounded-xl border-2 bg-purple-50/30 overflow-hidden shadow-sm h-10 flex items-center justify-center pr-10 transition-all ${shouldShake ? 'animate-shake border-red-400 bg-red-50/30' : 'border-[var(--card-border)]'}`}>
                      <div className="flex items-center font-mono font-black text-sm text-[var(--text-main)]">
                        <div className="flex items-center gap-1 mr-1.5">{['C','B','-'].map((char, i) => (<div key={`pre-in-${i}`} className="w-4 h-7 flex items-center justify-center">{char}</div>))}</div>
                        <div className="flex items-center gap-1">{[0, 1, 2, 3, 4, 5].map((i) => { const char = partnerCodeInput.replace('CB-', '')[i]; return (<div key={i} className={`w-5 h-7 rounded-md flex items-center justify-center text-[11px] font-black transition-all border ${char ? 'bg-white border-[var(--secondary)] shadow-sm' : 'bg-white border-[var(--card-border)]'}`}>{char ? (<span className="animate-in zoom-in-75 duration-200">{char}</span>) : (<span className="opacity-0">0</span>)}</div>); })}</div>
                      </div>
                      <input type="text" value={partnerCodeInput} onChange={(e) => { const val = e.target.value.toUpperCase(); if (val.startsWith('CB-')) { if (val.length <= 9) setPartnerCodeInput(val); } else if ('CB-'.startsWith(val)) { setPartnerCodeInput('CB-'); } }} className="absolute inset-0 opacity-0 cursor-text w-full h-full" />
                    </div>
                    <button onClick={handleLinkPartner} disabled={partnerCodeInput.length < 9 || isLinking} className="w-10 h-10 flex shrink-0 items-center justify-center bg-white border border-[var(--card-border)] text-[var(--secondary)] rounded-xl shadow-sm active:scale-95 transition-all hover:border-[var(--secondary)] disabled:opacity-30 disabled:grayscale"><Check className="w-4.5 h-4.5" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <h3 className="text-[8px] font-black text-[#1F1939] uppercase tracking-[0.2em] ml-2">Benachrichtigungen</h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col items-center gap-1">
                {pushPermission === 'default' && !pushEnabled ? (
                  <button 
                    onClick={() => !isPushLoading && handleTogglePush()} 
                    className={`w-full flex items-center justify-between p-2 rounded-[20px] border-2 cursor-pointer transition-all active:scale-95 shadow-sm outline-none bg-white border-[var(--card-border)] hover:bg-purple-50/30 ${isPushLoading ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[var(--card-border)] text-[var(--secondary)] flex items-center justify-center shrink-0 relative">
                        {isPushLoading ? (<div className="w-4 h-4 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin" />) : (<Bell className="w-4.5 h-4.5" />)}
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-black text-[9px] uppercase tracking-widest text-left leading-tight text-[var(--text-main)]">
                          Benachrichtigungen erlauben
                        </span>
                        <span className="text-[7px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Info className="w-2 h-2" /> Beta-Funktion
                        </span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className={`w-full flex items-center justify-between p-2 rounded-[20px] border-2 shadow-sm border-[var(--card-border)] ${pushEnabled ? 'bg-green-50/50' : 'bg-white'} ${isPushLoading ? 'pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <div className={`w-10 h-10 rounded-xl bg-white border border-[var(--card-border)] flex items-center justify-center shrink-0 relative ${pushEnabled ? 'text-[var(--accent-green)]' : 'text-red-400'}`}>
                        {isPushLoading ? (
                          <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${pushEnabled ? 'border-[var(--accent-green)]' : 'border-red-400'}`} />
                        ) : (
                          pushEnabled ? <Bell className="w-4.5 h-4.5" /> : <BellOff className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={`font-black text-[9px] uppercase tracking-widest text-left leading-tight ${pushEnabled ? 'text-[var(--accent-green)]' : 'text-[var(--text-main)]'}`}>
                          {pushEnabled ? 'Benachrichtigungen erhalten' : 'Keine Benachrichtigungen erhalten'}
                        </span>
                        <span className="text-[7px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Info className="w-2 h-2" /> Beta-Funktion
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => !isPushLoading && handleTogglePush()}
                      className={`w-14 h-8 rounded-full transition-colors relative shrink-0 border-2 border-[var(--card-border)] cursor-pointer outline-none ${pushEnabled ? 'bg-[var(--accent-green)]' : 'bg-red-400'}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
                        <span className={`text-[9px] font-black transition-opacity ${pushEnabled ? 'text-white opacity-100' : 'opacity-0'}`}>I</span>
                        <span className={`text-[9px] font-black transition-opacity ${!pushEnabled ? 'text-white opacity-100' : 'opacity-0'}`}>O</span>
                      </div>
                      <div className={`absolute top-[2px] w-6 h-6 bg-white rounded-full shadow-sm transition-all z-10 ${pushEnabled ? 'left-[calc(100%-1.625rem)]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                )}
              </div>
              {!isStandalone && (
                <div className="flex justify-center">
                  {isDesktop ? (<div className="status-box p-3 text-center w-full min-w-[200px]"><p className="text-[9px] font-bold text-[var(--muted)] leading-tight uppercase tracking-wider">App-Installation nur auf Mobilgeräten möglich</p></div>) : (<button onClick={() => setShowInstallModal(true)} className="btn-secondary py-2.5 px-5 text-[9px] font-black uppercase tracking-widest w-full shadow-sm border-2">Bisou-App installieren</button>)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-2 pb-2 flex justify-center shrink-0">
            <button onClick={() => { showConfirm("Möchtest du deinen Bisou-Account wirklich unwiderruflich löschen? Alle deine Daten und Antworten werden dabei für immer entfernt.", async () => { try { setLoading(true); const { error } = await supabase.from('profiles').delete().eq('id', profile.id); if (error) throw error; onLogout(); } catch (err) { showAlert("Fehler beim Löschen des Accounts.", "error"); } finally { setLoading(false); } }, { title: "Account löschen?", confirmLabel: "Ja, Account löschen", cancelLabel: "Abbrechen", type: 'error' }); }} className="text-[10px] font-black text-red-300 tracking-[0.2em] hover:text-red-500 transition-colors py-2 underline">Account löschen</button>
          </div>
        </div>
      </div>

      {showAvatarMenu && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAvatarMenu(false)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-entrance" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              <button onClick={() => { setShowAvatarMenu(false); document.getElementById('avatar-upload')?.click(); }} className="w-full py-4 rounded-2xl bg-purple-50 text-[var(--secondary)] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-purple-100 transition-all active:scale-95"><Camera className="w-5 h-5" /> Neues Bild wählen</button>
              <button onClick={handleDeleteImage} className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95"><Trash2 className="w-5 h-5" /> Bild löschen</button>
              <button onClick={() => setShowAvatarMenu(false)} className="w-full py-4 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] hover:text-[var(--text-main)] transition-colors mt-2">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {showInstallModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowInstallModal(false)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 animate-entrance border-2 border-purple-100 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 mx-auto"><Download className="w-8 h-8 text-[var(--secondary)]" /></div>
            <h3 className="text-xl font-black text-[#1F1939] mb-4 uppercase tracking-tight leading-tight">App installieren</h3>
            {isIOS && (<p className="text-sm text-[#4A4468] font-bold leading-relaxed mb-8 px-2 text-left">1. Tippe unten auf das <Share2 className="w-4 h-4 inline mx-1" /> Symbol.<br />2. Scrolle nach unten.<br />3. Wähle <b className="text-[#1F1939]">"Zum Home-Bildschirm"</b>.</p>)}
            {isAndroid && (<><p className="text-sm text-[#4A4468] font-bold leading-relaxed mb-8 px-2">Tippe auf den Button unten, um Bisou als App auf deinem Homescreen zu speichern.</p><button onClick={() => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((choice: any) => { if (choice.outcome === 'accepted') setShowInstallModal(false); }); } else { showAlert("Bitte nutze das Browser-Menü zum Installieren.", "info"); } }} className="w-full py-4 rounded-2xl bg-[var(--secondary)] text-white font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all hover:bg-purple-500">Jetzt installieren</button></>)}
            {isDesktop && (<><p className="text-sm text-[#4A4468] font-medium leading-relaxed mb-6">Ich sehe, du nutzt ein <b className="text-[#1F1939]">Desktop-Gerät</b>.</p><div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><p className="text-sm text-[#4A4468] font-medium">Die App-Installation ist für Mobilgeräte optimiert. Bitte öffne diese Seite auf deinem Smartphone.</p></div></>)}
            <button onClick={() => setShowInstallModal(false)} className="w-full mt-6 p-3 text-[var(--muted)] font-bold text-[10px] uppercase tracking-widest hover:text-[var(--text-main)] transition-colors">Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
}
