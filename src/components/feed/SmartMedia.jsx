import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const getAspectClass = (ratio) => {
  if (ratio >= 1.55) return 'aspect-[16/9]'; // Landscape → 16:9
  if (ratio >= 0.89) return 'aspect-square'; // Square / near-square → 1:1
  return 'aspect-[4/5]'; // Portrait → 4:5 (covers tall too)
};

const SmartMedia = ({ src, type, images, onImageClick }) => {
            const isVideo = type === 'video' || type?.startsWith('video/') || src?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
            const isMulti = images && images.length > 1;
            const imageList = isMulti ? images : [src].filter(Boolean);

            // Global mute state
            const [isMuted, setIsMuted] = useState(() => {
                const stored = localStorage.getItem('globalVideoMuted');
                return stored ? stored === 'true' : false; // default unmuted
            });
            const [isInView, setIsInView] = useState(false);

            useEffect(() => {
                const handleMuteChange = (e) => setIsMuted(e.detail.isMuted);
                window.addEventListener('globalMuteToggle', handleMuteChange);
                return () => window.removeEventListener('globalMuteToggle', handleMuteChange);
            }, []);

            useEffect(() => {
                if (!isVideo || !containerRef.current) return;
                const observer = new IntersectionObserver(([entry]) => {
                    setIsInView(entry.isIntersecting);
                }, { threshold: 0.6 });

                observer.observe(containerRef.current);
                return () => observer.disconnect();
            }, [isVideo]);

            const toggleMute = (e) => {
                e.stopPropagation();
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                localStorage.setItem('globalVideoMuted', newMuted);
                window.dispatchEvent(new CustomEvent('globalMuteToggle', { detail: { isMuted: newMuted } }));
            };

            // Aspect ratio state
            const [aspectClass, setAspectClass] = useState('aspect-[4/5]');
            const [ratioDetected, setRatioDetected] = useState(false);

            // Carousel state
            const [activeIdx, setActiveIdx] = useState(0);
            const [dragDelta, setDragDelta] = useState(0);
            const [isDragging, setIsDragging] = useState(false);
            const dragStart = useRef(null);
            const containerRef = useRef(null);

            // Pinch-zoom state (single media only)
            const [scale, setScale] = useState(1);
            const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
            const [isPinching, setIsPinching] = useState(false);
            const initialDist = useRef(null);

            // Detect ratio from the first image/video
            const handleMediaLoad = (e) => {
                if (ratioDetected) return;
                const el = e.target;
                const w = el.naturalWidth || el.videoWidth || el.clientWidth;
                const h = el.naturalHeight || el.videoHeight || el.clientHeight;
                if (w && h) {
                    setAspectClass(getAspectClass(w / h));
                    setRatioDetected(true);
                }
            };

            // ── Carousel touch/drag handlers ──────────────────────────────────────
            const SWIPE_THRESHOLD = 40;

            const onCarouselTouchStart = (e) => {
                e.stopPropagation();
                if (e.touches.length !== 1) return;
                dragStart.current = e.touches[0].clientX;
                setIsDragging(true);
            };

            const onCarouselTouchMove = (e) => {
                e.stopPropagation();
                if (!isDragging || dragStart.current === null) return;
                const delta = e.touches[0].clientX - dragStart.current;
                // Clamp: don't allow dragging past edges
                if ((activeIdx === 0 && delta > 0) || (activeIdx === imageList.length - 1 && delta < 0)) {
                    setDragDelta(delta * 0.2); // Rubber-band
                } else {
                    setDragDelta(delta);
                }
            };

            const onCarouselTouchEnd = () => {
                if (!isDragging) return;
                setIsDragging(false);
                if (dragDelta < -SWIPE_THRESHOLD && activeIdx < imageList.length - 1) {
                    setActiveIdx(i => i + 1);
                } else if (dragDelta > SWIPE_THRESHOLD && activeIdx > 0) {
                    setActiveIdx(i => i - 1);
                }
                setDragDelta(0);
                dragStart.current = null;
            };

            // ── Pinch-zoom handlers (single media) ──────────────────────────────────
            const onSingleTouchStart = (e) => {
                if (e.touches.length === 2) {
                    setIsPinching(true);
                    const t1 = e.touches[0], t2 = e.touches[1];
                    initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                        const mx = (t1.pageX + t2.pageX) / 2;
                        const my = (t1.pageY + t2.pageY) / 2;
                        setPinchOrigin({ x: ((mx - rect.left) / rect.width) * 100, y: ((my - rect.top) / rect.height) * 100 });
                    }
                }
            };
            const onSingleTouchMove = (e) => {
                if (e.touches.length === 2 && isPinching && initialDist.current) {
                    e.preventDefault();
                    const t1 = e.touches[0], t2 = e.touches[1];
                    const d = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    setScale(Math.min(Math.max(d / initialDist.current, 1), 4));
                }
            };
            const onSingleTouchEnd = () => { setIsPinching(false); setScale(1); initialDist.current = null; };

            const handleClick = () => {
                if (isPinching || (isMulti && Math.abs(dragDelta) > 5)) return;
                if (isMulti) onImageClick(null, 'images', imageList, activeIdx);
                else onImageClick(src, type);
            };

            // ── Desktop Mouse Drag handlers ───────────────────────────────────────
            const onCarouselMouseDown = (e) => {
                if (e.button !== 0) return; // Only left click
                dragStart.current = e.clientX;
                setIsDragging(true);
            };

            const onCarouselMouseMove = (e) => {
                if (!isDragging || dragStart.current === null) return;
                const delta = e.clientX - dragStart.current;
                if ((activeIdx === 0 && delta > 0) || (activeIdx === imageList.length - 1 && delta < 0)) {
                    setDragDelta(delta * 0.2);
                } else {
                    setDragDelta(delta);
                }
            };

            const onCarouselMouseUp = () => {
                if (!isDragging) return;
                setIsDragging(false);
                if (dragDelta < -SWIPE_THRESHOLD && activeIdx < imageList.length - 1) {
                    setActiveIdx(i => i + 1);
                } else if (dragDelta > SWIPE_THRESHOLD && activeIdx > 0) {
                    setActiveIdx(i => i - 1);
                }
                setDragDelta(0);
                dragStart.current = null;
            };

            // ── Render ──────────────────────────────────────────────────────────────
            return (
                <div
                    ref={containerRef}
                    className={`w-full rounded-xl mb-3 border border-white/5 relative bg-black overflow-hidden cursor-pointer select-none media-zoom-effect ${aspectClass}`}
                    style={{ zIndex: isPinching ? 50 : 1 }}
                    onClick={handleClick}
                >
                    {isVideo ? (
                        /* ── SINGLE VIDEO ─────────────────────────────── */
                        <div
                            className="absolute inset-0"
                            onTouchStart={onSingleTouchStart}
                            onTouchMove={onSingleTouchMove}
                            onTouchEnd={onSingleTouchEnd}
                            style={{ transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' }}
                        >
                            <video
                                src={src}
                                className="w-full h-full object-cover pointer-events-none"
                                playsInline loop muted={isMuted || !isInView} autoPlay={isInView}
                                preload="metadata"
                                onLoadStart={handleMediaLoad}
                                onLoadedMetadata={handleMediaLoad}
                            />
                            {/* Mute/Unmute button */}
                            <button
                                onClick={toggleMute}
                                className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white transition-all z-10 pointer-events-auto">
                                {isMuted ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                )}
                            </button>
                        </div>
                    ) : isMulti ? (
                        /* ── MULTI-IMAGE CAROUSEL ──────────────────────── */
                        <>
                            <div
                                className="absolute inset-0 flex"
                                data-swipeable
                                style={{
                                    transform: `translateX(calc(${-activeIdx * (100 / imageList.length)}% + ${dragDelta}px))`,
                                    transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
                                    width: `${imageList.length * 100}%`
                                }}
                                onTouchStart={onCarouselTouchStart}
                                onTouchMove={onCarouselTouchMove}
                                onTouchEnd={onCarouselTouchEnd}
                                onMouseDown={onCarouselMouseDown}
                                onMouseMove={onCarouselMouseMove}
                                onMouseUp={onCarouselMouseUp}
                                onMouseLeave={onCarouselMouseUp}
                            >
                                {imageList.map((imgSrc, idx) => (
                                    <div key={idx} className="h-full flex-shrink-0" style={{ width: `${100 / imageList.length}%` }}>
                                        <img
                                            src={imgSrc}
                                            alt={`Image ${idx + 1}`}
                                            loading={idx === 0 ? 'eager' : 'lazy'}
                                            decoding="async"
                                            className="w-full h-full object-cover pointer-events-none"
                                            onLoad={idx === 0 ? handleMediaLoad : undefined}
                                            draggable="false"
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Dot indicators */}
                            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
                                {imageList.map((_, idx) => (
                                    <div key={idx} className="transition-all duration-300" style={{
                                        width: idx === activeIdx ? '18px' : '6px',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: idx === activeIdx ? 'white' : 'rgba(255,255,255,0.4)'
                                    }} />
                                ))}
                            </div>
                            {/* Image count badge */}
                            <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white font-bold pointer-events-none z-10">
                                {activeIdx + 1}/{imageList.length}
                            </div>
                        </>
                    ) : (
                        /* ── SINGLE IMAGE ──────────────────────────────── */
                        <div
                            className="absolute inset-0"
                            onTouchStart={onSingleTouchStart}
                            onTouchMove={onSingleTouchMove}
                            onTouchEnd={onSingleTouchEnd}
                            style={{ transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' }}
                        >
                            <img
                                src={src}
                                alt="Post media"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover pointer-events-none"
                                onLoad={handleMediaLoad}
                                draggable="false"
                            />
                        </div>
                    )}
                </div>
            );
        };

export default SmartMedia;
