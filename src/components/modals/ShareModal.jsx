import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../ui/Icon';
import PostCard from '../feed/PostCard';
import Avatar from '../ui/Avatar';
import { useInbox } from '../../context/InboxContext';
import { OrbitLoader } from '../ui/Icons';

const ShareModal = ({ isOpen, onClose, shareData }) => {
            const { openInbox, setShowSearch, loadSearchDefault, sendPostToUser } = useInbox();
            const [recentContacts, setRecentContacts] = useState([]);
            const [searchQuery, setSearchQuery] = useState('');
            const [searchResults, setSearchResults] = useState([]);
            const [isSearching, setIsSearching] = useState(false);
            const [isLoadingContacts, setIsLoadingContacts] = useState(false);
            const [selectedContacts, setSelectedContacts] = useState(new Set());
            const [isSending, setIsSending] = useState(false);

            useEffect(() => {
                if (!searchQuery.trim()) {
                    setSearchResults([]);
                    setIsSearching(false);
                    return;
                }
                const timer = setTimeout(async () => {
                    setIsSearching(true);
                    try {
                        const { data } = await window.supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url, username')
                            .or(`username.ilike.%${searchQuery.trim()}%,full_name.ilike.%${searchQuery.trim()}%`)
                            .limit(10);
                        
                        if (data) {
                            if (window.rewriteMediaUrl) {
                                data.forEach(c => { if (c.avatar_url) c.avatar_url = window.rewriteMediaUrl(c.avatar_url); });
                            }
                            setSearchResults(data);
                        }
                    } catch (e) {
                        console.error('Search failed', e);
                    } finally {
                        setIsSearching(false);
                    }
                }, 400);
                return () => clearTimeout(timer);
            }, [searchQuery]);

            useEffect(() => {
                const fetchContacts = async () => {
                    if (!isOpen || !window.getCurrentUser) return;
                    setIsLoadingContacts(true);
                    try {
                        const user = await window.getCurrentUser();
                        if (!user) return;

                        const { data } = await window.supabase
                            .from('conversations')
                            .select(`
                                id,
                                participant_1_id,
                                participant_2_id
                            `)
                            .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
                            .order('last_message_at', { ascending: false })
                            .limit(10);

                        if (data && data.length > 0) {
                            const otherIds = [...new Set(data.map(c => c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id))];

                            const { data: profiles } = await window.supabase
                                .from('profiles')
                                .select('id, full_name, avatar_url, username')
                                .in('id', otherIds);

                            if (profiles) {
                                const profileMap = {};
                                profiles.forEach(p => profileMap[p.id] = p);

                                const contacts = data.map(c => {
                                    const otherId = c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id;
                                    const profile = profileMap[otherId];
                                    if (!profile) return null;
                                    return { convId: c.id, ...profile };
                                }).filter(Boolean);

                                if (window.rewriteMediaUrl) {
                                    contacts.forEach(c => {
                                        if (c.avatar_url) c.avatar_url = window.rewriteMediaUrl(c.avatar_url);
                                    });
                                }
                                setRecentContacts(contacts);
                            }
                        }
                    } catch (e) {
                        console.error('Failed to load contacts for share menu', e);
                    } finally {
                        setIsLoadingContacts(false);
                    }
                };
                fetchContacts();
            }, [isOpen]);

            const toggleContact = (contact) => {
                const next = new Set(selectedContacts);
                if (next.has(contact.id)) next.delete(contact.id);
                else next.add(contact.id);
                setSelectedContacts(next);
                vibrate(5);
            };

            const isProfile = shareData?.type === 'profile';
            const post = shareData?.type === 'post' ? shareData.data : null;
            const profileData = shareData?.type === 'profile' ? shareData.data : null;

            const handleBatchSend = async () => {
                if (selectedContacts.size === 0 || isSending) return;

                if (!sendPostToUser) {
                    window.dispatchEvent(new CustomEvent('toast', {
                        detail: { message: 'Sharing system initializing...', icon: 'Clock', isSuccess: false }
                    }));
                    return;
                }

                setIsSending(true);
                vibrate(10);

                const allContacts = [...recentContacts, ...searchResults];
                const contactsToSend = allContacts.filter(c => selectedContacts.has(c.id));
                // Deduplicate by ID
                const uniqueContacts = Array.from(new Map(contactsToSend.map(c => [c.id, c])).values());
                let successCount = 0;

                for (const contact of uniqueContacts) {
                    try {
                        const payload = isProfile ? { type: 'profile', ...shareData.data } : post;
                        await sendPostToUser(contact.id, payload);
                        successCount++;
                    } catch (e) {
                        console.error(`Failed to send to ${contact.username}`, e);
                    }
                }

                window.dispatchEvent(new CustomEvent('toast', {
                    detail: {
                        message: `Post shared with ${successCount} profile${successCount > 1 ? 's' : ''}`,
                        icon: 'Send',
                        isSuccess: true
                    }
                }));

                setIsSending(false);
                onClose();
            };

            if (!isOpen || !shareData) return null;

            const shareUrl = isProfile ? `https://plusopinion.com/profile/${profileData.id}` : `https://plusopinion.com/post/${post?.id}`;
            const shareTitle = isProfile ? 'PlusOpinion Profile' : 'Top Opinion';
            const shareText = isProfile ? `Check out ${profileData.full_name}'s profile on PlusOpinion` : `Check out this opinion by @${post?.username}`;

            const handleCopy = async () => {
                try {
                    const cleanText = isProfile 
                        ? `Check out ${profileData.full_name} on PlusOpinion!\n\n${shareUrl}`
                        : `Check out this opinion on PlusOpinion:\n\n"${post?.text ? post.text.substring(0, 100) + '...' : ''}"\n\nRead more at: ${shareUrl}`;
                    await navigator.clipboard.writeText(cleanText);
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link copied', icon: 'Link', isSuccess: true } }));
                    if (window.trackShare) window.trackShare(isProfile ? profileData.id : post?.id);
                    onClose();
                } catch (err) { console.error(err); }
            };

            const handleWhatsApp = () => {
                const waText = isProfile 
                    ? `🔥 *Check out @${profileData.username} on PlusOpinion!*\n\nView Profile:\n${shareUrl}`
                    : `🔥 *New Opinion on PlusOpinion!*\n\n"@${post?.username}: ${post?.text ? post.text.substring(0, 80) : ''}..."\n\nRead full POV here:\n${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                if (window.trackShare) window.trackShare(isProfile ? profileData.id : post?.id);
                onClose();
            };

            const handleInstagram = async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
                        if (window.trackShare) window.trackShare(isProfile ? profileData.id : post?.id);
                        onClose();
                    } catch (e) { }
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link copied! Open Instagram to share.', icon: 'Instagram', isSuccess: true } }));
                    if (window.trackShare) window.trackShare(isProfile ? profileData.id : post?.id);
                    setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1000);
                    onClose();
                }
            };

            const handleMore = async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({ title: 'PlusOpinion', text: shareText, url: shareUrl });
                        if (window.trackShare) window.trackShare(post.id);
                        onClose();
                    } catch (err) { }
                } else {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Web Share not supported', icon: 'AlertTriangle', isSuccess: false } }));
                }
            };

            return (
                <div className="fixed inset-0 z-[60] flex items-end justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
                    <div className="relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Drag Bar */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>

                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <span className="text-white font-heading font-bold text-lg">{isProfile ? 'Share Profile' : 'Share Opinion'}</span>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                                <Icon icon="X" size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {/* Preview Card */}
                            <div className="mb-6 shrink-0 transform scale-[0.98] origin-top">
                                {!isProfile ? (
                                    <PostCard post={post} isGuest={true} hideActions={true} />
                                ) : (
                                    <div className="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden group flex flex-col animate-fade-in shadow-2xl">
                                        <div className="flex items-center gap-4">
                                            <img src={profileData.avatar_url || profileData.avatar || '/icon-192.png'} className="w-16 h-16 rounded-full object-cover border border-white/20" alt="Avatar" />
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-lg">{profileData.full_name}</span>
                                                <span className="text-muted text-sm">@{profileData.username}</span>
                                                <div className="mt-1 flex gap-2 text-xs">
                                                    <span className="text-blue-400">RQS {profileData.rqs_score || profileData.rqs || 0}</span>
                                                    {profileData.is_verified && <span className="text-accent-green flex items-center gap-1"><Icon icon="ShieldCheck" size={12}/> Verified</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Internal Share Strip (PLATFORM) */}
                            <div className="mb-8 overflow-hidden">
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Share to Profiles</span>
                                        {selectedContacts.size > 0 && (
                                            <button onClick={() => setSelectedContacts(new Set())} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase">Clear Selection ({selectedContacts.size})</button>
                                        )}
                                    </div>
                                    <div className="relative mt-1">
                                        <Icon icon="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="text"
                                            placeholder="Search profiles..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                                                <Icon icon="X" size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 overflow-x-auto select-none custom-scrollbar pb-2 px-1">
                                    {(isLoadingContacts || isSearching) && <div className="text-white/40 text-xs py-3 px-4">Searching...</div>}

                                    {!(isLoadingContacts || isSearching) && (searchQuery.trim() ? searchResults : recentContacts).map(c => {
                                        const isSelected = selectedContacts.has(c.id);
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => toggleContact(c)}
                                                className="flex flex-col items-center gap-2 group min-w-[64px] shrink-0"
                                            >
                                                <div className={`w-14 h-14 rounded-full border-2 transition-all duration-300 relative ${isSelected ? 'border-blue-500 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10 hover:border-white/30'}`}>
                                                    <Avatar src={c.avatar_url} className="w-full h-full rounded-full object-cover" fallbackSize={24} />
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-[#121212] animate-pop">
                                                            <Icon icon="Check" size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] truncate w-14 text-center transition-colors ${isSelected ? 'text-blue-400 font-bold' : 'text-white/70 group-hover:text-white'}`}>
                                                    {c.full_name?.split(' ')[0] || c.username}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* External Share Grid (OUTSIDE PLATFORM) */}
                            <div className="mt-2 mb-20">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-4">Share Everywhere</span>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <button onClick={handleCopy} className="flex flex-col items-center gap-2 group">
                                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                            <Icon icon="Link" size={24} className="text-white" />
                                        </div>
                                        <span className="text-[10px] text-muted text-center">Copy Link</span>
                                    </button>
                                    <button onClick={handleWhatsApp} className="flex flex-col items-center gap-2 group">
                                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                            <Icon icon="WhatsApp" size={24} className="text-white" />
                                        </div>
                                        <span className="text-[10px] text-muted text-center">WhatsApp</span>
                                    </button>
                                    <button onClick={handleInstagram} className="flex flex-col items-center gap-2 group">
                                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                            <Icon icon="Instagram" size={24} className="text-white" />
                                        </div>
                                        <span className="text-[10px] text-muted text-center">Instagram</span>
                                    </button>
                                    <button onClick={handleMore} className="flex flex-col items-center gap-2 group">
                                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                            <Icon icon="MoreHorizontal" size={24} className="text-blue-400" />
                                        </div>
                                        <span className="text-[10px] text-muted text-center">More</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Batch Send Confirmation Bar */}
                        {selectedContacts.size > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121212] border-t border-white/10 animate-slide-up z-20">
                                <button
                                    onClick={handleBatchSend}
                                    disabled={isSending}
                                    className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
                                >
                                    {isSending ? (
                                        <OrbitLoader size={20} />
                                    ) : (
                                        <Icon icon="Send" size={20} />
                                    )}
                                    <span>Send to {selectedContacts.size} profile{selectedContacts.size > 1 ? 's' : ''}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        };;

export default ShareModal;
