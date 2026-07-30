import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmationModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirmAction: (options: ConfirmationModalOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    const cleanMessage = message.replace(/^[✓✕ℹ⚠]\s*/, '').trim();
    const isDelete = /delete|deleted|remove|removed|cleared/i.test(cleanMessage);
    const finalType = isDelete ? 'error' : type;

    setToasts(prev => [...prev, { id, message: cleanMessage, type: finalType }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirmAction = useCallback((options: ConfirmationModalOptions) => {
    setConfirmModal(options);
  }, []);

  const handleConfirm = async () => {
    if (!confirmModal) return;
    try {
      setIsConfirming(true);
      await confirmModal.onConfirm();
    } catch (err: any) {
      console.error('Confirmation action failed:', err);
    } finally {
      setIsConfirming(false);
      setConfirmModal(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Floating Top-Right Toast Notifications Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          let bgStyle = 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]';

          if (toast.type === 'error') {
            bgStyle = 'bg-rose-950/90 border-rose-500/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
          } else if (toast.type === 'warning') {
            bgStyle = 'bg-amber-950/90 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
          } else if (toast.type === 'info') {
            bgStyle = 'bg-cyan-950/90 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 border px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md transition-all text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200 ${bgStyle}`}
            >
              <span className="leading-relaxed">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              {confirmModal.title}
            </h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#232d3f]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isConfirming}
                className="px-4 py-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {confirmModal.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-900/20"
              >
                {isConfirming ? 'Processing...' : (confirmModal.confirmLabel || 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
