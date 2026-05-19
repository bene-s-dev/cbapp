import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Pencil, Check, Bell, BellOff, Info, X, User as UserIcon, ChevronRight, ArrowLeft, Trash2, Share2, Copy, Download } from 'lucide-react';
import ImageCropper from './ImageCropper';
import { useDialog } from './DialogProvider';
import DeleteAccountModal from './DeleteAccountModal';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  profile: any;
  partnerProfile: any;
  onLogout: () => void;
}

export default function Profile({ profile: initialProfile, partnerProfile, onLogout }: ProfileProps) {
  const { showAlert, showConfirm } = useDialog();
  const [profile, setProfile] = useState<any>(initialProfile);
  const [activeTab, setActiveTab] = useState<'main' | 'partner' | 'notifications' | 'install'>('main');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(initialProfile?.display_name || '');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [partnerCodeInput, setPartnerCodeInput] = useState('CB-');
  const [isLinking, setIsLinking] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // --- Logic ---
  const handleUpdateName = async () => {
    if (!newName.trim() || newName === profile.display_name) { setIsEditingName(false); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: newName.trim() }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, display_name: newName.trim() });
      showAlert("Name aktualisiert! ✨", "success");
    } catch (err) { showAlert("Fehler beim Aktualisieren.", "error"); } finally { setLoading(false); setIsEditingName(false); }
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
    } catch (err) { showAlert("Fehler beim Verknüpfen.", "error"); } finally { setIsLinking(false); setPartnerCodeInput('CB-'); }
  };

  const handleUnlinkPartner = async () => {
    showConfirm("Möchtest du die Verknüpfung wirklich aufheben?", async () => {
        setIsLinking(true);
        try {
          const { error } = await supabase.from('profiles').update({ partner_id: null }).eq('id', profile.id);
          if (error) throw error;
          window.location.reload();
        } catch (err) { showAlert("Fehler beim Trennen.", "error"); } finally { setIsLinking(false); }
      }, { title: "Verknüpfung lösen", confirmLabel: "Ja, trennen", cancelLabel: "Abbrechen" }
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
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showAlert("Code kopiert! ✨", "success");
  };

  const handleShareCode = async () => {
    if (!profile?.partner_code) return;
    const cleanCode = profile.partner_code.replace(/^CB-/, '');
    const shareData = { title: 'Bisou Partner-Code', text: `Verknüpfe dich mit mir auf Bisou! Mein Code ist: ${cleanCode}` };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Teilen abgebrochen'); }
    } else { copyToClipboard(profile.partner_code); }
  };

  const handleTogglePush = async () => {
    setIsPushLoading(true);
    
    try {
      if (pushPermission === 'default') {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission !== 'granted') {
          showAlert("Benachrichtigungen wurden blockiert.", "error");
          setIsPushLoading(false);
          return;
        }
      }
      
      // Toggle logic here (assuming existing logic will interact with service worker)
      setPushEnabled(!pushEnabled);
      showAlert(pushEnabled ? "Benachrichtigungen deaktiviert" : "Benachrichtigungen aktiviert", "success");
    } catch (error) {
      console.error("Error toggling push:", error);
      showAlert("Fehler bei Benachrichtigungen.", "error");
    } finally {
      setIsPushLoading(false);
    }
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

  const getDaysConnected = () => {
    if (!profile?.partner_id || !profile?.partner_since) return 0;
    const start = new Date(profile.partner_since);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'partner': 
        return (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300 px-4">
            <h2 className="text-[10px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] w-full text-center">BISOU-PARTNER VERBINDEN</h2>
            {profile?.partner_id ? (
              <div className="w-full flex flex-col gap-2">
                <div className="status-box pt-3 pb-8 flex flex-col items-center justify-center gap-2 text-center shrink-0 min-h-[90px] relative w-full">
                  <span className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.2em]">Mein Bisou-Partner:</span>
                  <span className="font-black text-lg">{partnerProfile?.display_name || 'Partner'}</span>
                  <button onClick={handleUnlinkPartner} disabled={isLinking} className="absolute bottom-2 text-[8px] font-black text-red-400 hover:text-red-500 underline uppercase tracking-[0.2em]">Verknüpfung aufheben</button>
                </div>
                <div className="text-center text-[10px] font-bold text-[var(--muted)]">Seit {getDaysConnected()} Tagen verknüpft</div>
              </div>
            ) : (
              <div className="status-box p-3 flex flex-col gap-4 shrink-0 w-full">
                <div className="text-center"><span className="text-[8px] font-bold text-[var(--muted)] uppercase tracking-wider">Kein Partner verknüpft</span></div>
                {/* Code UI */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] ml-1">Mein Bisou-Code</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative rounded-xl border-2 border-[var(--card-border)] bg-purple-50/30 h-10 flex items-center justify-center pr-10">
                      <div className="flex items-center font-mono font-black text-sm text-[var(--text-main)]">
                        <div className="flex items-center gap-0.5 mr-1.5">{['C','B','-'].map((char, i) => (<div key={`pre-${i}`} className="w-4 h-7 flex items-center justify-center">{char}</div>))}</div>
                        <div className="flex items-center gap-1">{(profile?.partner_code || '').replace('CB-', '').padEnd(6, ' ').split('').map((char, i) => (<div key={i} className={`w-5 h-7 rounded-md flex items-center justify-center text-[11px] font-black border transition-all ${char !== ' ' ? 'bg-white border-purple-200' : 'bg-white border-purple-50'}`}>{char !== ' ' ? char : <div className="w-2.5 h-0.5 bg-purple-200/20 rounded-full" />}</div>))}</div>
                      </div>
                      <button onClick={() => copyToClipboard(profile?.partner_code)} className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-[var(--secondary)]"><Copy className="w-4.5 h-4.5" /></button>
                    </div>
                    <button onClick={handleShareCode} className="w-10 h-10 flex shrink-0 items-center justify-center bg-white border border-[var(--card-border)] rounded-xl text-[var(--secondary)]"><Share2 className="w-4.5 h-4.5" /></button>
                  </div>
                </div>
                {/* Input UI */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] ml-1">Partnercode eintragen:</span>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 relative rounded-xl border-2 bg-purple-50/30 h-10 flex items-center justify-center pr-10 transition-all ${shouldShake ? 'animate-shake border-red-400 bg-red-50/30' : 'border-[var(--card-border)]'}`}>
                      <div className="flex items-center font-mono font-black text-sm text-[var(--text-main)]">
                        <div className="flex items-center gap-0.5 mr-1.5">{['C','B','-'].map((char, i) => (<div key={`pre-in-${i}`} className="w-4 h-7 flex items-center justify-center">{char}</div>))}</div>
                        <div className="flex items-center gap-1">{[0, 1, 2, 3, 4, 5].map((i) => { const char = partnerCodeInput.replace('CB-', '')[i]; return (<div key={i} className={`w-5 h-7 rounded-md flex items-center justify-center text-[11px] font-black transition-all border ${char ? 'bg-white border-[var(--secondary)] shadow-sm' : 'bg-white border-[var(--card-border)]'}`}>{char ? (<span className="animate-in zoom-in-75 duration-200">{char}</span>) : (<span className="opacity-0">0</span>)}</div>); })}</div>
                      </div>
                      <input type="text" value={partnerCodeInput} onChange={(e) => { const val = e.target.value.toUpperCase(); if (val.startsWith('CB-')) { if (val.length <= 9) setPartnerCodeInput(val); } else if ('CB-'.startsWith(val)) { setPartnerCodeInput('CB-'); } }} className="absolute inset-0 opacity-0 cursor-text w-full h-full" />
                    </div>
                    <button onClick={handleLinkPartner} disabled={partnerCodeInput.length < 9 || isLinking} className="w-10 h-10 flex shrink-0 items-center justify-center bg-white border border-[var(--card-border)] text-[var(--secondary)] rounded-xl shadow-sm"><Check className="w-4.5 h-4.5" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'notifications': 
        return (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300 px-4">
             <h2 className="text-[10px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] w-full text-center">BENACHRICHTIGUNGEN</h2>
             <div className="w-full flex flex-col items-center gap-1">
                {pushPermission === 'default' ? (
                  <button 
                    onClick={() => !isPushLoading && handleTogglePush()} 
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 shadow-sm outline-none bg-white border-[var(--card-border)] hover:bg-purple-50/30 ${isPushLoading ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[var(--card-border)] text-[var(--secondary)] flex items-center justify-center shrink-0">
                        {isPushLoading ? (<div className="w-4 h-4 border-2 border-[var(--secondary)] border-t-transparent rounded-full animate-spin" />) : (<Bell className="w-4.5 h-4.5" />)}
                      </div>
                      <span className="font-black text-[9px] uppercase tracking-widest text-left leading-tight text-[var(--text-main)]">Benachrichtigungen erlauben</span>
                    </div>
                  </button>
                ) : (
                  <div className={`w-full flex items-center justify-between p-2 rounded-[20px] border-2 shadow-sm border-[var(--card-border)] ${pushEnabled ? 'bg-green-50/50' : 'bg-white'} ${isPushLoading ? 'pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-3 flex-1 pr-2">
                      <div className={`w-10 h-10 rounded-xl bg-white border border-[var(--card-border)] flex items-center justify-center shrink-0 ${pushEnabled ? 'text-[var(--accent-green)]' : 'text-red-400'}`}>
                        {isPushLoading ? (
                          <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${pushEnabled ? 'border-[var(--accent-green)]' : 'border-red-400'}`} />
                        ) : (
                          pushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`font-black text-[9px] uppercase tracking-widest text-left leading-tight ${pushEnabled ? 'text-[var(--accent-green)]' : 'text-[var(--text-main)]'}`}>
                        {pushEnabled ? 'Benachrichtigungen erhalten' : 'Keine Benachrichtigungen erhalten'}
                      </span>
                    </div>                    <button 
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
                <p className="text-[8px] text-[var(--muted)] font-medium text-center flex items-center justify-center gap-1 mt-2"><Info className="w-2.5 h-2.5" /> Benachrichtigungen sind eine Beta-Funktion</p>
              </div>
          </div>
        );
      case 'install':
        return (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300 px-4">
            <h2 className="text-[10px] font-black text-[var(--secondary)] uppercase tracking-[0.2em]">INSTALLATION</h2>
            <div className="status-box p-4 flex flex-col items-center justify-center gap-4 text-center w-full">
               <div className="p-3 text-center w-full min-w-[200px]"><p className="text-[9px] font-bold text-[var(--muted)] leading-tight uppercase tracking-wider">App-Installation nur auf Mobilgeräten möglich</p></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-2 px-4">
            {[
              { id: 'partner', label: '🤝 Bisou-Partner verbinden' },
              { id: 'notifications', label: '🔔 Benachrichtigungen' },
              { id: 'install', label: '📲 App-Installation' },
              { id: 'delete', label: '⚠️ Account löschen', isDanger: true }
            ].map(item => (
              <button 
                key={item.id} 
                onClick={() => {
                  if (item.id === 'delete') setShowDeleteModal(true);
                  else setActiveTab(item.id as any);
                }} 
                className={`w-full flex items-center justify-between p-4 bg-white rounded-2xl border-2 shadow-sm transition-all ${
                  item.isDanger ? 'border-red-50 hover:border-red-200' : 'border-purple-50 hover:border-purple-200'
                }`}
              >
                <span className={`font-black text-xs uppercase tracking-widest ${item.isDanger ? 'text-red-400' : 'text-[#1F1939]'}`}>
                  {item.label}
                </span>
                <ChevronRight className={`w-4 h-4 ${item.isDanger ? 'text-red-300' : 'text-purple-300'}`} />
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full animate-entrance">
      {selectedImage && (
        <ImageCropper image={selectedImage} onCropComplete={handleCropComplete} onCancel={() => setSelectedImage(null)} />
      )}
      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={async () => { 
          try { 
            setLoading(true); 
            console.log("Löschvorgang gestartet für User:", profile.id);
            
            // 1. Unlink partners securely
            const { error: unlinkError } = await supabase.rpc('unlink_partners');
            
            if (unlinkError) {
                console.error("Fehler beim Entkoppeln der Partner:", unlinkError);
                throw unlinkError;
            }

            // 2. Delete the user profile
            const { error } = await supabase.from('profiles').delete().eq('id', profile.id); 
            if (error) {
              console.error("Supabase Löschfehler:", error);
              throw error;
            }
            console.log("Löschung erfolgreich, Logout folgt.");
            onLogout(); 
          } catch (err: any) { 
            console.error("Löschfehler (catch):", err); 
            showAlert("Fehler: " + (err.message || String(err)), "error"); 
          } finally { 
            setLoading(false); 
          } 
      }} />
      
      <header className="flex flex-col items-center pt-24 pb-2 shrink-0 relative">
        {activeTab !== 'main' && (
          <button onClick={() => setActiveTab('main')} className="absolute left-4 top-10 p-2 rounded-full bg-white border border-purple-100 shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4 text-[var(--secondary)]" />
          </button>
        )}
        <h2 className="text-[9px] font-black text-[#1F1939] uppercase tracking-[0.2em]">Mein Bisou-Profil</h2>
        
        <div className="relative flex items-center mb-3 mt-4">
          <div className="w-20 h-20 rounded-[2.2rem] bg-white shadow-md flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-purple-200" />}
          </div>
          <button 
            onClick={() => document.getElementById('avatar-upload')?.click()}
            className="absolute -right-2 bottom-0 w-8 h-8 rounded-full bg-white border border-[var(--card-border)] text-[var(--secondary)] flex items-center justify-center shadow-sm active:scale-90 hover:border-[var(--secondary)] transition-all z-30"
          >
            <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex flex-col items-center justify-center w-full mt-1 mb-6">
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-lg font-black text-[var(--text-main)] bg-purple-50/50 border-b-2 border-[var(--secondary)] outline-none text-center py-1 w-[140px]" autoFocus onBlur={handleUpdateName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()} />
              <button onClick={handleUpdateName} className="w-8 h-8 rounded-xl bg-white border border-[var(--card-border)] text-[var(--accent-green)] flex items-center justify-center shadow-sm active:scale-90 hover:border-[var(--accent-green)] transition-all"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="relative inline-flex items-center cursor-pointer group" onClick={() => setIsEditingName(true)}>
              <span className="text-lg font-black text-[#1F1939] uppercase tracking-[0.1em]">{profile?.display_name || 'User'}</span>
              <div className="absolute -right-6">
                 <Pencil className="w-3.5 h-3.5 text-purple-300 group-hover:text-[var(--secondary)] transition-colors" />
              </div>
            </div>
          )}
        </div>
        <div className="w-1/2 h-[1px] bg-purple-100 mb-4 mx-auto" />
      </header>

      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
