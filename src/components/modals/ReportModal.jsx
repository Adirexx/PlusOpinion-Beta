import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../ui/Icon';

const ReportModal = ({ isOpen, onClose, onSubmit }) => {
            const [step, setStep] = useState(1);
            const [reason, setReason] = useState(null);

            const REASONS = [
                "Fake or suspicious opinion",
                "Manipulating sentiments",
                "Unnecessary criticism",
                "Breach of privacy",
                "Spam",
                "Illegal category or business",
                "Fake media",
                "False information",
                "Something else is wrong"
            ];

            useEffect(() => {
                if (isOpen) { setStep(1); setReason(null); }
            }, [isOpen]);

            const handleReasonSelect = (r) => {
                setReason(r);
                setStep(2);
                vibrate(10);
            };

            const handleAction = (action) => {
                onSubmit(reason, action); // action: 'keep' or 'remove'
            };

            if (!isOpen) return null;

            return (
                <div className="fixed inset-0 z-[60] flex items-end justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
                    <div className="relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
                        {/* Drag Bar */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>

                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <span className="text-white font-heading font-bold text-lg flex items-center gap-2">
                                <Icon icon="AlertTriangle" size={20} className="text-red-500" />
                                {step === 1 ? 'Report Opinion' : 'Select action'}
                            </span>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                                <Icon icon="X" size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {step === 1 ? (
                                <>
                                    <p className="text-sm text-gray-400 mb-4 px-1">Why are you reporting this opinion? Please select a reason.</p>
                                    <div className="space-y-1.5">
                                        {REASONS.map((r, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleReasonSelect(r)}
                                                className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/90 transition-all active:scale-[0.98] border border-white/5"
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-3">
                                        <Icon icon="Check" size={24} />
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">Thanks for letting us know</h3>
                                    <p className="text-xs text-gray-400 mb-6 max-w-[250px] mx-auto leading-relaxed">
                                        We use these reports to make PlusOpinion safer. We will review this post shortly.
                                    </p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleAction('remove')}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all"
                                        >
                                            Remove this post from my feed
                                        </button>
                                        <button
                                            onClick={() => handleAction('keep')}
                                            className="w-full py-4 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
                                        >
                                            Keep this post on feed
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };;

export default ReportModal;
