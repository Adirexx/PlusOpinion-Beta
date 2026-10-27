import { DEFAULT_AVATAR } from '../../lib/constants';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const Avatar = ({ src, className, fallbackSize = 24, onClick }) => {
            const [error, setError] = useState(false);

            useEffect(() => { setError(false); }, [src]);

            if (!src || error) {
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
                    src={src}
                    className={className}
                    onError={() => setError(true)}
                    onClick={onClick}
                    alt="Avatar"
                />
            );
        };

export default Avatar;
