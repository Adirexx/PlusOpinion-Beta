import React, { useState } from 'react';
import Icon from '../ui/Icon';

const LogoutModal = ({ isOpen, onCancel, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Modal Dialog Card */}
      <div
        className="relative z-10 w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #161b27 100%)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.08)',
        }}
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-500/10 text-red-400 border border-red-500/20">
            <Icon icon="LogOut" size={20} />
          </div>
          <div>
            <h3 className="text-base font-heading font-bold text-white tracking-wide">Log Out</h3>
            <p className="text-[11px] text-muted font-medium">Session termination</p>
          </div>
        </div>

        {/* Message Body */}
        <p className="text-xs text-slate-300 leading-relaxed font-light">
          Are you sure you want to log out of PlusOpinion? You will need to sign in again to access your account.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 bg-red-500 hover:bg-red-600 shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
          >
            {submitting ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon icon="LogOut" size={14} />
                <span>Log Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
