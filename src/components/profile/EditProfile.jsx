import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../ui/Icon';
import { useDialog } from '../../context/DialogContext';

export default function EditProfile({ onClose, currentProfile = {}, onSave }) {
            const { showConfirm, showAlert } = useDialog();
            const toast = (message, icon = 'AlertTriangle', isSuccess = false) => {
                window.dispatchEvent(new CustomEvent('toast', { detail: { message, icon, isSuccess } }));
            };

            const safeProfile = currentProfile || {};
            const [formData, setFormData] = useState({
                full_name: safeProfile.full_name || '',
                bio: safeProfile.bio || '',
                location: safeProfile.location || '',
                website: safeProfile.website || ''
            });

            const [avatarFile, setAvatarFile] = useState(null);
            const [avatarPreview, setAvatarPreview] = useState(safeProfile.avatar_url || null);
            const [bannerFile, setBannerFile] = useState(null);
            const [bannerPreview, setBannerPreview] = useState(safeProfile.banner_url || null);
            const [saving, setSaving] = useState(false);
            const avatarInputRef = useRef(null);
            const bannerInputRef = useRef(null);

            const handleAvatarChange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        toast('Please select an image file', 'AlertTriangle', false);
                        return;
                    }
                    if (file.size > 2 * 1024 * 1024) {
                        toast('Avatar must be under 2MB', 'AlertTriangle', false);
                        return;
                    }

                    setAvatarFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarPreview(reader.result);
                    reader.readAsDataURL(file);
                }
            };

            const handleBannerChange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        toast('Please select an image file', 'AlertTriangle', false);
                        return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        toast('Banner must be under 5MB', 'AlertTriangle', false);
                        return;
                    }

                    setBannerFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setBannerPreview(reader.result);
                    reader.readAsDataURL(file);
                }
            };

            const uploadFile = async (file, bucket, path) => {
                const { data, error } = await window.supabase.storage
                    .from(bucket)
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = window.supabase.storage
                    .from(bucket)
                    .getPublicUrl(path);

                return publicUrl;
            };

            const handleRemoveAvatar = async (e) => {
                e.stopPropagation();
                const ok = await showConfirm({
                    title: 'Remove Avatar?',
                    message: 'Are you sure you want to remove your profile picture?',
                    confirmText: 'Remove',
                    cancelText: 'Cancel',
                    isDanger: true,
                    icon: 'Trash'
                });
                if (!ok) return;
                setAvatarFile(null);
                setAvatarPreview(null);
            };

            const handleRemoveBanner = async (e) => {
                e.stopPropagation();
                const ok = await showConfirm({
                    title: 'Remove Banner?',
                    message: 'Are you sure you want to remove your banner image?',
                    confirmText: 'Remove',
                    cancelText: 'Cancel',
                    isDanger: true,
                    icon: 'Trash'
                });
                if (!ok) return;
                setBannerFile(null);
                setBannerPreview(null);
            };

            const handleSave = async () => {
                try {
                    setSaving(true);

                    // Get session + access token — required for authenticated REST calls
                    const { data: { session } } = await window.supabase.auth.getSession();
                    if (!session) {
                        toast('Session expired. Please log in again.', 'AlertTriangle', false);
                        return;
                    }
                    const accessToken = session.access_token;
                    const userId = session.user.id;

                    const SUPABASE_URL = 'https://ogqyemyrxogpnwitumsr.supabase.co';
                    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM';

                    // Determine final media URLs
                    // avatarPreview=null means removed; new file means re-upload; else keep existing
                    let avatarUrl = avatarPreview === null ? null : currentProfile.avatar_url;
                    let bannerUrl = bannerPreview === null ? null : currentProfile.banner_url;

                    // Upload new avatar if user picked a new file (non-fatal)
                    if (avatarFile) {
                        try {
                            const ext = avatarFile.name.split('.').pop().toLowerCase();
                            const path = `${userId}/${Date.now()}.${ext}`;
                            const { error: avErr } = await window.supabase.storage
                                .from('Avatars').upload(path, avatarFile, { upsert: true });
                            if (!avErr) {
                                const { data: { publicUrl } } = window.supabase.storage
                                    .from('Avatars').getPublicUrl(path);
                                avatarUrl = publicUrl;
                            } else {
                                console.warn('[EditProfile] Avatar upload failed (non-fatal):', avErr.message);
                            }
                        } catch (e) {
                            console.warn('[EditProfile] Avatar upload exception (non-fatal):', e.message);
                        }
                    }

                    // Upload new banner if user picked a new file (non-fatal)
                    if (bannerFile) {
                        try {
                            const ext = bannerFile.name.split('.').pop().toLowerCase();
                            const path = `banners/${userId}/${Date.now()}.${ext}`;
                            const { error: bnErr } = await window.supabase.storage
                                .from('profiles').upload(path, bannerFile, { upsert: true });
                            if (!bnErr) {
                                const { data: { publicUrl } } = window.supabase.storage
                                    .from('profiles').getPublicUrl(path);
                                bannerUrl = publicUrl;
                            } else {
                                console.warn('[EditProfile] Banner upload failed (non-fatal):', bnErr.message);
                            }
                        } catch (e) {
                            console.warn('[EditProfile] Banner upload exception (non-fatal):', e.message);
                        }
                    }

                    // Build the update payload
                    const updates = {
                        full_name: formData.full_name?.trim() || null,
                        bio: formData.bio?.trim() || null,
                        location: formData.location?.trim() || null,
                        website: formData.website?.trim() || null,
                        avatar_url: avatarUrl,
                        banner_url: bannerUrl
                    };

                    // ── Direct REST PATCH — bypasses service worker proxy ──
                    // window.supabase.from().update() goes through the SW proxy which fails
                    // on localhost (502) and is CORS-blocked in prod due to content-profile header.
                    // Direct fetch() to supabase.co works everywhere with the access_token.
                    const patchRes = await fetch(
                        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': SUPABASE_KEY,
                                'Authorization': `Bearer ${accessToken}`,
                                'Prefer': 'return=minimal'
                            },
                            body: JSON.stringify(updates)
                        }
                    );

                    if (!patchRes.ok) {
                        let body = '';
                        try { body = await patchRes.text(); } catch (_) { }
                        throw new Error(`Profile update failed (${patchRes.status}): ${body}`);
                    }

                    console.log('[EditProfile] ✅ Profile updated successfully');

                    // Reload parent profile state and close modal
                    await onSave();
                    onClose();

                } catch (error) {
                    console.error('Error updating profile:', error);
                    toast('Failed to update profile: ' + (error.message || 'Please try again.'), 'AlertTriangle', false);
                } finally {
                    setSaving(false);
                }
            };


            return (
                <div className="absolute inset-0 bg-[#020205] z-50 flex flex-col animate-enter overflow-y-auto">
                    {/* Header */}
                    <div className="h-[60px] header-glass sticky top-0 flex items-center justify-between px-4 z-10 shrink-0">
                        <button onClick={onClose} disabled={saving} className="text-white text-sm font-medium hover:text-white/80">Cancel</button>
                        <span className="font-heading font-bold text-white">Edit Profile</span>
                        <button onClick={handleSave} disabled={saving} className="text-neon text-sm font-bold disabled:opacity-50">
                            {saving ? 'Saving...' : 'Done'}
                        </button>
                    </div>

                    <div className="p-5 space-y-6">
                        {/* Avatar Uploader */}
                        <div className="flex flex-col items-center gap-4 relative">
                            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full border-4 border-white/5 overflow-hidden bg-black">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            <Icon icon="User" size={32} className="text-neon" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <Icon icon="Camera" size={24} className="text-white drop-shadow-lg" />
                                </div>

                                {/* Remove Avatar Button */}
                                {avatarPreview && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"
                                        title="Remove Avatar"
                                    >
                                        <Icon icon="Trash" size={12} />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <button onClick={() => avatarInputRef.current?.click()} className="text-neon text-xs font-bold">
                                Change Profile Photo
                            </button>
                        </div>

                        {/* Banner Uploader */}
                        <div className="relative h-32 rounded-xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                            {bannerPreview ? (
                                <img src={bannerPreview} className="w-full h-full object-cover" />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/80 flex items-center justify-center gap-2 group-hover:bg-black/60 transition-colors">
                                <Icon icon="Camera" size={20} className="text-white" />
                                <span className="text-xs font-bold text-white">Edit Banner</span>
                            </div>

                            {/* Remove Banner Button */}
                            {bannerPreview && (
                                <button
                                    onClick={handleRemoveBanner}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"
                                    title="Remove Banner"
                                >
                                    <Icon icon="Trash" size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                    />

                    {/* Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted ml-1">Full Name</label>
                            <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-neon focus:outline-none transition-colors" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted ml-1">Bio</label>
                            <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-neon focus:outline-none transition-colors resize-none" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted ml-1">Location</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"><Icon icon="MapPin" size={16} /></div>
                                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-neon focus:outline-none transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted ml-1">Website</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"><Icon icon="Link" size={16} /></div>
                                <input type="text" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-neon focus:outline-none transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

