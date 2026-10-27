import React, { useState, useEffect } from 'react';
import PostCard from '../feed/PostCard';
import { supabase } from '../../lib/supabaseClient';

export default function SharedPostPreview({ postId, onClick }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPost() {
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        profiles ( full_name, username, avatar_url, rqs_score, is_verified )
                    `)
                    .eq('id', postId)
                    .single();
                
                if (data) {
                    setPost({
                        id: data.id,
                        user_id: data.user_id,
                        name: data.profiles?.full_name || 'User',
                        username: data.profiles?.username || 'user',
                        avatar: data.profiles?.avatar_url || '',
                        rqs: data.profiles?.rqs_score || 0,
                        verified: data.is_verified_purchase || data.profiles?.is_verified,
                        category: data.category,
                        product: data.product_name,
                        text: data.text_content,
                        media: data.media_url,
                        media_type: data.media_type || 'image',
                        images: data.images || null,
                        time: data.created_at,
                        agrees: data.agrees_count || 0,
                        comments: data.comments_count || 0,
                        seenBy: data.seen_by_brand
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="w-full h-32 rounded-2xl bg-white/5 animate-pulse flex items-center justify-center border border-white/10 my-2">
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Loading Post...</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 my-2 flex items-center justify-center">
                <span className="text-white/40 text-xs">Post not found or deleted</span>
            </div>
        );
    }

    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="cursor-pointer transition-transform hover:scale-[0.98] w-[260px] sm:w-[300px] pointer-events-auto shared-post-black-bg"
            style={{ 
                pointerEvents: 'auto',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
            }}
        >
            <style>{`
                .shared-post-black-bg .glass-panel {
                    background: #050505 !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    margin-bottom: 0 !important;
                }
            `}</style>
            <div className="pointer-events-none">
                <PostCard post={post} isGuest={true} hideActions={true} />
            </div>
        </div>
    );
}
