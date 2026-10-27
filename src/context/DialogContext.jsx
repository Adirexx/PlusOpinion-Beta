import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Icon from '../components/ui/Icon';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [promptValue, setPromptValue] = useState('');

  const closeDialog = useCallback(() => {
    if (dialog?.resolve) {
      if (dialog.type === 'confirm') dialog.resolve(false);
      else if (dialog.type === 'prompt') dialog.resolve(null);
      else dialog.resolve();
    }
    setDialog(null);
    setPromptValue('');
  }, [dialog]);

  const showAlert = useCallback(({ title = 'Alert', message = '', icon = 'Info', confirmText = 'OK' }) => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        title,
        message,
        icon,
        confirmText,
        resolve,
      });
    });
  }, []);

  const showConfirm = useCallback(({
    title = 'Confirm',
    message = '',
    icon = 'HelpCircle',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
  }) => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        title,
        message,
        icon,
        confirmText,
        cancelText,
        isDanger,
        resolve,
      });
    });
  }, []);

  const showPrompt = useCallback(({
    title = 'Prompt',
    message = '',
    defaultValue = '',
    placeholder = '',
    confirmText = 'Submit',
    cancelText = 'Cancel',
  }) => {
    setPromptValue(defaultValue || '');
    return new Promise((resolve) => {
      setDialog({
        type: 'prompt',
        title,
        message,
        defaultValue,
        placeholder,
        confirmText,
        cancelText,
        resolve,
      });
    });
  }, []);

  // Expose on window for easy access across the entire app
  useEffect(() => {
    window.appAlert = (msg, title = 'Notice') => showAlert({ title, message: msg });
    window.appConfirm = (msg, title = 'Confirm', isDanger = false) => showConfirm({ title, message: msg, isDanger });
    window.appPrompt = (msg, defaultValue = '', title = 'Input') => showPrompt({ title, message: msg, defaultValue });

    // Listen to custom event 'app:dialog'
    const handleDialogEvent = (e) => {
      const { type, ...opts } = e.detail || {};
      if (type === 'confirm') showConfirm(opts);
      else if (type === 'prompt') showPrompt(opts);
      else showAlert(opts);
    };
    window.addEventListener('app:dialog', handleDialogEvent);

    return () => {
      window.removeEventListener('app:dialog', handleDialogEvent);
    };
  }, [showAlert, showConfirm, showPrompt]);

  const handleConfirm = () => {
    if (dialog?.resolve) {
      if (dialog.type === 'confirm') dialog.resolve(true);
      else if (dialog.type === 'prompt') dialog.resolve(promptValue);
      else dialog.resolve();
    }
    setDialog(null);
    setPromptValue('');
  };

  const handleCancel = () => {
    if (dialog?.resolve) {
      if (dialog.type === 'confirm') dialog.resolve(false);
      else if (dialog.type === 'prompt') dialog.resolve(null);
      else dialog.resolve();
    }
    setDialog(null);
    setPromptValue('');
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {/* In-App Native Dialog Modal */}
      {dialog && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCancel}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
          <div
            className="relative z-10 w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #0d1117 0%, #161b27 100%)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(47, 139, 255, 0.1)',
            }}
          >
            {/* Header with Icon */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  dialog.isDanger ? 'bg-red-500/10 text-red-400' : 'bg-[#2f8bff]/10 text-[#2f8bff]'
                }`}
              >
                <Icon icon={dialog.icon || (dialog.isDanger ? 'AlertTriangle' : 'Info')} size={20} />
              </div>
              <h3 className="text-base font-bold text-white tracking-wide">{dialog.title}</h3>
            </div>

            {/* Message Body */}
            {dialog.message && (
              <p className="text-xs text-slate-300 leading-relaxed font-light">{dialog.message}</p>
            )}

            {/* Prompt Input */}
            {dialog.type === 'prompt' && (
              <div className="mt-1">
                <input
                  type="text"
                  autoFocus
                  value={promptValue}
                  placeholder={dialog.placeholder || 'Type here...'}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#2f8bff] transition-colors"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-2.5 mt-2">
              {dialog.type !== 'alert' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  {dialog.cancelText || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                autoFocus={dialog.type !== 'prompt'}
                onClick={handleConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                  dialog.isDanger
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : 'bg-[#2f8bff] hover:bg-[#2563eb] shadow-blue-500/20'
                }`}
              >
                {dialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider');
  return ctx;
}
