import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

type DialogType = 'info' | 'success' | 'error' | 'confirm';

interface DialogOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: DialogType;
}

interface DialogContextType {
  showAlert: (message: string, type?: DialogType) => void;
  showConfirm: (message: string, onConfirm: () => void, options?: DialogOptions) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<{ message: string; type: DialogType } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void; options?: DialogOptions } | null>(null);

  const showAlert = useCallback((message: string, type: DialogType = 'info') => {
    setAlert({ message, type });
    if (type !== 'error') {
      setTimeout(() => setAlert(null), 3000);
    }
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, options?: DialogOptions) => {
    setConfirm({ message, onConfirm, options });
  }, []);

  const handleConfirm = () => {
    if (confirm) {
      confirm.onConfirm();
      setConfirm(null);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* Toast Alert */}
      {alert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xs animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md ${
            alert.type === 'error' ? 'bg-red-50/90 border-red-100 text-red-800' :
            alert.type === 'success' ? 'bg-green-50/90 border-green-100 text-green-800' :
            'bg-blue-50/90 border-blue-100 text-blue-800'
          }`}>
            {alert.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {(alert.type === 'info' || !alert.type) && <Info className="w-5 h-5 shrink-0 text-blue-400" />}
            <p className="text-xs font-black uppercase tracking-wide leading-tight">{alert.message}</p>
            <button onClick={() => setAlert(null)} className="ml-auto p-1 hover:bg-black/5 rounded-full transition-colors">
              <X className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setConfirm(null)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative z-10 animate-entrance border-2 border-blue-50 shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-black text-[#1F1939] mb-4 uppercase tracking-tight leading-tight">
              {confirm.options?.title || 'Bist du sicher?'}
            </h3>
            <p className="text-sm text-[#4A4468] font-bold leading-relaxed mb-8">
              {confirm.message}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirm} 
                className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all hover:bg-blue-600"
              >
                {confirm.options?.confirmLabel || 'Ja, weiter'}
              </button>
              <button 
                onClick={() => setConfirm(null)} 
                className="w-full py-3 text-sm font-black text-blue-300 uppercase tracking-widest hover:text-blue-500 transition-colors"
              >
                {confirm.options?.cancelLabel || 'Abbrechen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
