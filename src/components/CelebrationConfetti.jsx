import React, { useEffect, useRef } from 'react';

/**
 * CelebrationConfetti — High-performance 60fps canvas celebration confetti effect
 * Runs for ~4.5 seconds when triggered, then automatically unmounts/fades out.
 */
export default function CelebrationConfetti({ onComplete, duration = 4500 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let startTime = performance.now();

    const dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle colors matching PlusOpinion palette
    const colors = [
      '#2f8bff', // Neon Blue
      '#00E676', // Accent Green
      '#FFD700', // Gold
      '#FF007A', // Neon Pink
      '#00F0FF', // Cyan
      '#A855F7', // Purple
      '#FFFFFF', // White
    ];

    const particleCount = 140;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Spawn origins: 40% from bottom-left, 40% from bottom-right, 20% from top
      const originType = Math.random();
      let startX, startY, vx, vy;

      if (originType < 0.4) {
        // Bottom left cannon
        startX = Math.random() * (window.innerWidth * 0.2);
        startY = window.innerHeight + 10;
        vx = Math.random() * 8 + 4;
        vy = -(Math.random() * 16 + 12);
      } else if (originType < 0.8) {
        // Bottom right cannon
        startX = window.innerWidth - Math.random() * (window.innerWidth * 0.2);
        startY = window.innerHeight + 10;
        vx = -(Math.random() * 8 + 4);
        vy = -(Math.random() * 16 + 12);
      } else {
        // Center/top shower
        startX = Math.random() * window.innerWidth;
        startY = -10;
        vx = (Math.random() - 0.5) * 6;
        vy = Math.random() * 6 + 2;
      }

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        flipSpeed: Math.random() * 0.15 + 0.05,
        flip: Math.random() * Math.PI,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        drag: 0.985,
        gravity: 0.38,
      });
    }

    const render = (now) => {
      const elapsed = now - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (onComplete) onComplete();
        return;
      }

      // Smooth fade-out in final 30% of duration
      const globalAlpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = Math.max(0, globalAlpha);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(1, Math.cos(p.flip));

        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden flex flex-col items-center justify-start pt-16 animate-fadeIn">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {/* Floating Celebratory Badge */}
      <div className="relative z-10 px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-xl border border-neon/50 shadow-[0_0_35px_rgba(47,139,255,0.6)] flex items-center gap-2.5 animate-bounce">
        <span className="text-lg">🎉</span>
        <span className="text-xs font-heading font-black tracking-wider text-white uppercase">
          Application Approved! You are a Partner!
        </span>
        <span className="text-lg">✨</span>
      </div>
    </div>
  );
}
