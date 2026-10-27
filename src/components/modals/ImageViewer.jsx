import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../ui/Icon';

const ImageViewer = ({ src, type, images, initialIndex = 0, onClose }) => {
            // Normalize: images[] takes priority; fall back to single src
            const imgList = (images && images.length > 0) ? images : (src && type !== 'video' ? [src] : []);
            const isVideo = type === 'video' && (!images || images.length === 0);
            const isMulti = imgList.length > 1;

            const [currentIdx, setCurrentIdx] = useState(initialIndex || 0);
            const [scale, setScale] = useState(1);
            const [position, setPosition] = useState({ x: 0, y: 0 });
            const [isPinching, setIsPinching] = useState(false);
            const [isDragging, setIsDragging] = useState(false);
            const [dragDelta, setDragDelta] = useState(0);
            const initialDist = useRef(null);
            const lastScale = useRef(1);
            const lastTouch = useRef({ x: 0, y: 0 });
            const dragStart = useRef(null);
            const SWIPE_THRESHOLD = 50;

            if (!src && imgList.length === 0) return null;

            const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

            // ── Touch handlers (pinch + pan + swipe) ────────────────────────────────
            const handleTouchStart = (e) => {
                if (e.touches.length === 2) {
                    setIsPinching(true);
                    const t1 = e.touches[0], t2 = e.touches[1];
                    initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    lastScale.current = scale;
                } else if (e.touches.length === 1) {
                    if (scale > 1) {
                        lastTouch.current = { x: e.touches[0].pageX - position.x, y: e.touches[0].pageY - position.y };
                    } else if (isMulti) {
                        dragStart.current = e.touches[0].clientX;
                        setIsDragging(true);
                    }
                }
            };

            const handleTouchMove = (e) => {
                if (e.touches.length === 2 && isPinching && initialDist.current) {
                    e.preventDefault();
                    const t1 = e.touches[0], t2 = e.touches[1];
                    const d = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    setScale(Math.min(Math.max((d / initialDist.current) * lastScale.current, 1), 5));
                } else if (e.touches.length === 1 && scale > 1) {
                    const newX = e.touches[0].pageX - lastTouch.current.x;
                    const newY = e.touches[0].pageY - lastTouch.current.y;
                    const limitX = (scale - 1) * (window.innerWidth / 2);
                    const limitY = (scale - 1) * (window.innerHeight / 2);
                    setPosition({ x: Math.min(Math.max(newX, -limitX), limitX), y: Math.min(Math.max(newY, -limitY), limitY) });
                } else if (e.touches.length === 1 && isDragging && isMulti && scale <= 1) {
                    const delta = e.touches[0].clientX - dragStart.current;
                    if ((currentIdx === 0 && delta > 0) || (currentIdx === imgList.length - 1 && delta < 0)) {
                        setDragDelta(delta * 0.2);
                    } else {
                        setDragDelta(delta);
                    }
                }
            };

            const handleTouchEnd = () => {
                setIsPinching(false);
                if (scale <= 1) setPosition({ x: 0, y: 0 });
                if (isDragging) {
                    setIsDragging(false);
                    if (dragDelta < -SWIPE_THRESHOLD && currentIdx < imgList.length - 1) {
                        setCurrentIdx(i => i + 1);
                        resetZoom();
                    } else if (dragDelta > SWIPE_THRESHOLD && currentIdx > 0) {
                        setCurrentIdx(i => i - 1);
                        resetZoom();
                    }
                    setDragDelta(0);
                    dragStart.current = null;
                }
            };

            const handleDoubleTap = (e) => {
                e.stopPropagation();
                if (scale > 1) { resetZoom(); } else { setScale(2.5); }
            };

            return (
                <div
                    className="fixed inset-0 z-[9999] bg-black animate-fade-in overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-full text-white z-50 backdrop-blur-sm"
                        onClick={onClose}
                    >
                        <Icon icon="X" size={22} />
                    </button>

                    {/* Counter */}
                    {isMulti && (
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-bold z-50">
                            {currentIdx + 1} / {imgList.length}
                        </div>
                    )}

                    {isVideo ? (
                        /* ── Full-screen video ─────────── */
                        <div className="w-full h-full flex items-center justify-center p-4" onClick={onClose}>
                            <video
                                src={src}
                                className="max-w-full max-h-full object-contain"
                                controls autoPlay
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    ) : isMulti ? (
                        /* ── Multi-image swipeable fullscreen ── */
                        <>
                            <div
                                className="absolute inset-0 flex items-center"
                                style={{
                                    transform: `translateX(calc(${-currentIdx * (100 / imgList.length)}% + ${dragDelta}px))`,
                                    transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
                                    width: `${imgList.length * 100}%`
                                }}
                            >
                                {imgList.map((imgSrc, idx) => (
                                    <div key={idx} className="h-full flex items-center justify-center flex-shrink-0" style={{ width: `${100 / imgList.length}%` }}>
                                        <img
                                            src={imgSrc}
                                            alt={`Image ${idx + 1}`}
                                            className={`select-none ${type === 'avatar' ? 'w-[85vw] h-[85vw] max-w-[400px] max-h-[400px] rounded-full object-cover shadow-2xl border-4 border-white/10' : 'max-w-full max-h-full object-contain p-2'}`}
                                            style={idx === currentIdx ? { transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s' } : {}}
                                            onDoubleClick={idx === currentIdx ? handleDoubleTap : undefined}
                                            draggable="false"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Dot indicators */}
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none z-50">
                                {imgList.map((_, idx) => (
                                    <div key={idx} style={{
                                        width: idx === currentIdx ? '20px' : '6px',
                                        height: '6px', borderRadius: '3px',
                                        background: idx === currentIdx ? 'white' : 'rgba(255,255,255,0.4)',
                                        transition: 'all 0.3s'
                                    }} />
                                ))}
                            </div>
                        </>
                    ) : (
                        /* ── Single image ──────────────── */
                        <div
                            className="w-full h-full flex items-center justify-center"
                            onClick={onClose}
                        >
                            <img
                                src={imgList[0] || src}
                                className={`select-none ${type === 'avatar' ? 'w-[85vw] h-[85vw] max-w-[400px] max-h-[400px] rounded-full object-cover shadow-2xl border-4 border-white/10' : 'max-w-full max-h-full object-contain p-2'}`}
                                style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s ease-out' }}
                                onDoubleClick={handleDoubleTap}
                                onClick={e => e.stopPropagation()}
                                draggable="false"
                            />
                        </div>
                    )}
                </div>
            );
        };;

export default ImageViewer;
