import React, { useEffect } from 'react';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import MenuItem from './MenuItem';

const MenuDrawer = ({ isOpen, onClose, onLogout, userProfile, isGuest, onAuthRequired, onNavigate }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Use injected navigate if available (parent has Router context), else fall back to shim
    const nav = onNavigate || window.navigateTo || (() => { });
    const go = (path) => { nav(path); onClose(); };
    const goAuth = (path) => { if (!isGuest) { go(path); } else { onAuthRequired(); } };


    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-[8px] transition-opacity duration-300 ease-out touch-none ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer Panel (Slide from Left) */}
            <div
                className={`fixed top-0 left-0 h-full z-50 w-[90%] md:w-[400px] bg-[#070A12]/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl transform transition-transform duration-[350ms] cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ptr-ignore ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="absolute top-0 left-0 w-full h-96 bg-neon/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-full h-80 bg-indigo-900/10 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3 pointer-events-none" />

                <div className="relative flex-1 flex flex-col overflow-y-auto no-scrollbar px-6 pt-safe pb-safe">

                    {/* Header */}
                    <div className="flex justify-between items-center mt-6 mb-6">
                        <span className="text-xs font-heading font-bold tracking-[0.2em] text-muted uppercase">Menu</span>
                        <button onClick={onClose} className="p-3 -mr-3 text-muted active:text-white transition-colors active:scale-95 touch-manipulation">
                            <Icon icon="X" size={26} />
                        </button>
                    </div>

                    {/* Profile card */}
                    <div
                        className="relative rounded-2xl p-5 mb-8 overflow-hidden group shrink-0 active:scale-[0.99] transition-transform duration-200 cursor-pointer"
                        onClick={() => goAuth('/myprofile')}
                    >
                        {userProfile.banner_url ? (
                            <div className="absolute inset-0"><img src={userProfile.banner_url} alt="Banner" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50"></div></div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1627] to-[#1a2332]"></div>
                        )}

                        <div className="relative z-10 flex flex-col items-start">
                            <div className="flex items-start justify-between w-full mb-4">
                                <div className="relative">
                                    <div className="absolute -inset-1.5 rounded-full border border-neon/30 animate-pulse-slow"></div>
                                    <div className="w-[68px] h-[68px] rounded-full bg-gray-800 border-2 border-[#0F1627] flex items-center justify-center relative z-10 overflow-hidden">
                                        <Avatar src={userProfile.avatar_url} className="w-full h-full object-cover" fallbackSize={32} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-neon/30 rounded-full shadow-[0_0_10px_rgba(47,139,255,0.15)]">
                                    <Icon icon="Shield" size={14} className="text-neon" />
                                    <span className="text-cyan-100 text-[11px] font-heading font-bold tracking-wider uppercase">RQS {userProfile.rqs_score || 0}</span>
                                </div>
                            </div>

                            <h2 className="text-white font-heading font-bold text-xl tracking-wide mb-0.5">{userProfile.full_name}</h2>
                            <p className="text-muted text-sm font-medium">@{userProfile.username}</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 pt-2">
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-2">Creator</div>
                        <MenuItem icon="Star" label="My Space" subLabel="Creator Studio" onClick={() => goAuth('/myspace')} />
                        <div className="h-px bg-white/5 w-full my-4"></div>

                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-2">Settings</div>
                        <MenuItem icon="Settings" label="Settings" subLabel="Account, privacy & preferences" onClick={() => goAuth('/settings')} />
                        <MenuItem icon="BookMark" label="Bookmarks" onClick={() => goAuth('/bookmarks')} />
                        <MenuItem icon="Moon" label="Appearance" subLabel="PlusOpinion Midnight" hasAction onClick={() => { }} />

                        <div className="h-px bg-white/5 w-full my-4"></div>

                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-2">Support & Legal</div>
                        <MenuItem icon="FileText" label="Terms & Conditions" onClick={() => { go('/t&c'); }} />
                        <MenuItem icon="Shield" label="Privacy Policy" onClick={() => { go('/privacy-policy'); }} />
                        <MenuItem icon="LifeBuoy" label="Help and Support" onClick={() => { go('/support'); }} />
                        <MenuItem icon="Info" label="About" onClick={() => { go('/about'); }} />
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 pb-8">
                        {isGuest ? (
                            <button
                                onClick={() => { onClose(); if (onAuthRequired) onAuthRequired(); else go('/login'); }}
                                className="w-full group relative overflow-hidden rounded-2xl border border-neon/20 bg-neon/5 p-4 transition-all duration-300 active:bg-neon/10 active:scale-[0.98] touch-manipulation"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <Icon icon="LogIn" size={20} className="text-neon" />
                                        <span className="text-neon font-medium tracking-wide text-base">Sign In / Join</span>
                                    </div>
                                    <Icon icon="ChevronRight" size={16} className="text-neon/40" />
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={onLogout}
                                className="w-full group relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition-all duration-300 active:bg-red-500/10 active:scale-[0.98] touch-manipulation"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <Icon icon="LogOut" size={20} className="text-red-400" />
                                        <span className="text-red-400 font-medium tracking-wide text-base">Log Out</span>
                                    </div>
                                    <Icon icon="ChevronRight" size={16} className="text-red-900/40" />
                                </div>
                            </button>
                        )}

                        <div className="mt-6 text-center">
                            <span className="text-[10px] text-muted font-mono tracking-widest uppercase">
                                PlusOpinion Beta • <span className="app-version"></span>
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default MenuDrawer;
