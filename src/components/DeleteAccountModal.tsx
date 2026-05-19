import React, { useState, useEffect, useRef } from 'react';
import { X, CircleAlert, Shield, Fingerprint, RotateCcw, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [step, setStep] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pressed, setPressed] = useState([false, false, false]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    
    if (pressed.every(Boolean)) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(intervalRef.current!);
              setStep(3);
              return 100;
            }
            return prev + 2;
          });
        }, 60);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setProgress(0);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pressed, step]);

  if (!isOpen) return null;

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onClose();
  };

  const confirmDeletion = async () => {
    await onConfirm();
    setStep(3);
  };

  const proceedToDelete = () => {
    if (isTouchDevice) {
      setStep(2);
    } else {
      // Desktop: skip gesture, go to final confirmation step
      setStep(3);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-entrance border-2 animate-pulse-alarm-border relative">
        
        {/* Back Button for all steps */}
        <button onClick={handleBack} className="absolute top-6 left-6 p-2 rounded-full bg-purple-50 shadow-sm active:scale-95 transition-all">
          <ArrowLeft className="w-4 h-4 text-[var(--secondary)]" />
        </button>

        {/* Step Indicator */}
        <div className="absolute top-7 right-6 text-[8px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">
          Löschprozess {step}/3
        </div>

        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-6 pt-8">
            <CircleAlert className="w-16 h-16 text-red-400 animate-vibrate" />
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#1F1939]">Account wirklich löschen?</h3>
              <p className="text-sm text-[#4A4468]">Alle Daten gehen unwiderruflich verloren.<br />Dein Partner wird getrennt.</p>
            </div>
            <button onClick={onClose} className="w-full py-5 px-8 rounded-2xl text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-all animate-pulse-green shadow-lg">Nein, zurück zu den Einstellungen</button>
            <button onClick={proceedToDelete} className="text-[10px] font-black text-red-400 hover:text-red-500 underline uppercase tracking-[0.2em]">Lösch-Prozess fortführen</button>          
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center space-y-5 pt-8">
            <h3 className="flex items-center gap-2 font-black text-lg text-red-500"><AlertCircle className="w-5 h-5" /> Sicherheits-Geste</h3>
            <p className="text-sm text-red-400 font-bold">Halte alle 3 Sensoren gleichzeitig gedrückt.</p>

            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="60" stroke="#fee2e2" strokeWidth="8" fill="transparent" />
                <circle cx="72" cy="72" r="60" stroke="#ef4444" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (progress / 100) * 377} className="transition-all duration-75" />
              </svg>
              <div className="absolute font-black text-xl text-red-500">{Math.floor(progress)}%</div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              {[0, 1, 2].map(i => (
                <div key={i} onTouchStart={() => setPressed(p => p.map((v, idx) => idx === i ? true : v))} onTouchEnd={() => setPressed(p => p.map((v, idx) => idx === i ? false : v))} className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${pressed[i] ? 'bg-red-500 border-red-600 text-white' : 'bg-red-50 border-red-200 text-red-400'}`}>
                  <Fingerprint className="w-8 h-8" />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-6 pt-8">
            <div className="flex gap-4">
              <CircleAlert className="w-16 h-16 text-red-600" />
              <Trash2 className="w-16 h-16 text-red-600" />
              <CircleAlert className="w-16 h-16 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-red-600 uppercase tracking-widest">LETZTE WARNUNG!</h3>
            <p className="text-md font-bold text-red-900 p-4 rounded-xl">BIST DU DIR WIRKLICH, WIRKLICH GANZ SICHER? ALLES WIRD GELÖSCHT!</p>
            <button onClick={onConfirm} className="w-full py-6 rounded-2xl text-white font-black text-lg uppercase tracking-widest shadow-2xl animate-pulse-deep-red">JETZT UNWIDERRUFLICH LÖSCHEN</button>
            <button onClick={onClose} className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg animate-calming-gradient">Löschen abbrechen</button>
          </div>
        )}
      </div>
    </div>
  );
}
