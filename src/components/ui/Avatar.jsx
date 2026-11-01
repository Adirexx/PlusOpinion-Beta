import { DEFAULT_AVATAR } from '../../lib/constants';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { rewriteMediaUrl } from '../../lib/api/media';

const getFallbackAvatarUrl = (failedUrl) => {
    if (!failedUrl || typeof failedUrl !== 'string') return null;
    if (failedUrl.includes('/supabase-api')) {
        return failedUrl.replace(/https?:\/\/[^\/]+\/supabase-api/, 'https://ogqyemyrxogpnwitumsr.supabase.co');
    }
    if (failedUrl.includes('ogqyemyrxogpnwitumsr.supabase.co')) {
        return failedUrl.replace('https://ogqyemyrxogpnwitumsr.supabase.co', 'https://plusopinion.com/supabase-api');
    }
    return null;
};

const Avatar = ({ src, className, fallbackSize = 24, onClick }) => {
            const [error, setError] = useState(false);
            const rewrittenSrc = src ? rewriteMediaUrl(src) : src;

            useEffect(() => { setError(false); }, [src]);

            const handleError = (e) => {
                const cur = e.currentTarget.src;
                if (e.currentTarget.dataset.retried) {
                    setError(true);
                    return;
                }
                const fallback = getFallbackAvatarUrl(cur);
                if (fallback && fallback !== cur) {
                    e.currentTarget.dataset.retried = 'true';
                    e.currentTarget.src = fallback;
                } else {
                    setError(true);
                }
            };

            if (!rewrittenSrc || error) {
                return (
                    <img
                        src={DEFAULT_AVATAR}
                        className={`${className} object-cover`}
                        onClick={onClick}
                        alt="Avatar"
                    />
                );
            }

            return (
                <img
                    src={rewrittenSrc}
                    className={className}
                    onError={handleError}
                    onClick={onClick}
                    alt="Avatar"
                />
            );
        };

export default Avatar;
