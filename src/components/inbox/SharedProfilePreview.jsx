import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../ui/Icon';

export default function SharedProfilePreview({ profileId, onClick }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url, rqs_score, is_verified, banner_url')
                    .eq('id', profileId)
                    .single();
                
                if (data) setProfile(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [profileId]);

    if (loading) {
        return (
            <div className="w-full h-24 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center border border-white/10 my-2">
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Loading Profile...</span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 my-2 flex items-center justify-center">
                <span className="text-white/40 text-xs">Profile not found</span>
            </div>
        );
    }

    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="cursor-pointer transition-transform hover:scale-[0.98] w-[240px] sm:w-[280px]"
        >
            <div className="rounded-2xl border border-white/10 relative overflow-hidden flex flex-col shadow-2xl bg-[#050505]">
                {/* Banner Background */}
                <div className="h-16 w-full relative">
                    {profile.banner_url ? (
                        <img 
                            src={profile.banner_url} 
                            className="w-full h-full object-cover" 
                            alt="Banner" 
                        />
                    ) : (
                        <img 
                            src={profile.avatar_url || '/icon-192.png'} 
                            className="w-full h-full object-cover opacity-40 blur-md scale-110" 
                            alt="Banner" 
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Profile Info */}
                <div className="px-4 pb-4 pt-0 relative flex flex-col items-center text-center -mt-8">
                    <img 
                        src={profile.avatar_url || '/icon-192.png'} 
                        className="w-16 h-16 rounded-full object-cover border-[3px] border-[#1a1a1a] shadow-lg relative z-10 bg-black" 
                        alt="Avatar" 
                    />
                    <div className="mt-2 w-full flex flex-col items-center">
                        <span className="text-white font-bold text-lg leading-tight truncate w-full flex justify-center items-center gap-1">
                            {profile.full_name}
                            {profile.is_verified && <Icon icon="ShieldCheck" size={14} className="text-accent-green" />}
                        </span>
                        <span className="text-white/50 text-sm truncate w-full font-medium">@{profile.username}</span>
                        
                        <div className="mt-3 flex gap-4 text-xs font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5 text-blue-400">
                            RQS {profile.rqs_score || 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
