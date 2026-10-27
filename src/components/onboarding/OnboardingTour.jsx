/**
 * OnboardingTour.jsx — New User Guided Tour
 *
 * Strictly shown only to NEW users (gate lives in Feed.jsx):
 *   - localStorage `po_tour_completed_<uid>` checked in Feed before showing
 *   - This component handles: spotlight, card, step flow, completion
 *
 * Design: bottom-sheet card, SVG cutout spotlight (not a ring overlay),
 * smooth step transitions, minimal professional look — no artificial effects.
 *
 * Phase 9 UI Refinement.
 */

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../ui/Icon';

// ── Haptic helper ────────────────────────────────────────────────
const vibrate = (ms) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
};

// ── Step definitions ─────────────────────────────────────────────
const STEPS = [
  {
    id: 'lens',
    selector: '#header-lens-btn',
    fallbacks: ['[aria-label="Search"]'],
    title: 'Explore & Discover',
    description: 'Search unfiltered opinions on anything — trending discussions, top profiles, and verified product reviews.',
    icon: 'Search',
    position: 'bottom',
  },
  {
    id: 'inbox',
    selector: '#header-inbox-btn',
    fallbacks: ['[aria-label="Open inbox"]'],
    title: 'Encrypted Messaging',
    description: 'Chat with anyone, fully end-to-end encrypted. Swipe up from the bottom bar anytime to jump straight in.',
    icon: 'PlusOpinionInboxFilled',
    hint: { icon: 'ArrowUp', text: 'Swipe up from the bottom bar to open anytime' },
    position: 'bottom',
  },
  {
    id: 'categories',
    selector: '#bottom-nav-categories',
    fallbacks: [],
    title: 'Browse by Category',
    description: 'Curated opinions grouped by the topics you care about — tech, food, travel, and more.',
    icon: 'Grid',
    position: 'top',
  },
  {
    id: 'myspace',
    selector: '#bottom-nav-myspace',
    fallbacks: [],
    title: 'Your Creator Hub',
    description: 'Track your Review Quality Score, partner earnings, and see which brands are engaging with your content.',
    icon: 'MySpaceLogo',
    position: 'top',
  },
  {
    id: 'composer',
    selector: '#opinion-fab-pill',
    fallbacks: ['.opinion-btn'],
    title: 'Share Your First Opinion',
    description: 'Write about any product, service, or experience. Tag categories, add proof, and start building your RQS.',
    icon: 'Plus',
    isLast: true,
    position: 'top',
  },
];

// ── Resolve target element ───────────────────────────────────────
function resolveTarget(step) {
  let el = document.querySelector(step.selector);
  if (!el && step.fallbacks?.length) {
    for (const sel of step.fallbacks) {
      el = document.querySelector(sel);
      if (el) break;
    }
  }
  return el;
}

// ── Spotlight geometry + tooltip positioning ─────────────────────
const PAD = 8;       // padding around highlighted element
const CLOUD_W = 272; // fixed tooltip width
const CLOUD_GAP = 14; // gap between spotlight and cloud

function measureLayout(targetEl) {
  if (!targetEl) return null;
  const r = targetEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spot = {
    x: Math.max(0, r.left - PAD),
    y: Math.max(0, r.top - PAD),
    w: r.width + PAD * 2,
    h: r.height + PAD * 2,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };

  // Determine tooltip placement: prefer 'below' for top elements, 'above' for bottom elements
  // Also pick left/center/right based on element x position
  let placement = 'below'; // default
  const spaceBelow = vh - (spot.y + spot.h);
  const spaceAbove = spot.y;

  if (spaceBelow < 180 && spaceAbove > 160) placement = 'above';
  else if (spaceBelow >= 160) placement = 'below';
  else placement = 'above'; // fallback

  // Horizontal alignment of cloud: keep within screen bounds
  let cloudLeft = spot.cx - CLOUD_W / 2;
  cloudLeft = Math.max(10, Math.min(vw - CLOUD_W - 10, cloudLeft));

  // Cloud top/bottom
  let cloudTop;
  let arrowSide; // 'top' = arrow points up (cloud is below target), 'bottom' = cloud above
  if (placement === 'below') {
    cloudTop = spot.y + spot.h + CLOUD_GAP;
    arrowSide = 'top';
  } else {
    cloudTop = spot.y - CLOUD_GAP; // will subtract cloud height via CSS transform
    arrowSide = 'bottom';
  }

  // Arrow horizontal position relative to cloud
  const arrowAbsX = spot.cx; // we want arrow at center of element
  const arrowRelX = Math.max(20, Math.min(CLOUD_W - 20, arrowAbsX - cloudLeft));

  return { spot, placement, cloudLeft, cloudTop, arrowSide, arrowRelX };
}

// ── Component ────────────────────────────────────────────────────
export default function OnboardingTour({ isOpen, onClose, onCompleteTour, user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [layout, setLayout] = useState(null);
  const [cloudIn, setCloudIn] = useState(false);
  const [busy, setBusy] = useState(false);

  const step = STEPS[currentStep];

  // Measure on open + step change
  useEffect(() => {
    if (!isOpen) return;
    setCloudIn(false);

    const t = setTimeout(() => {
      const el = resolveTarget(step);
      setLayout(el ? measureLayout(el) : null);
      requestAnimationFrame(() => setCloudIn(true));
    }, 80);

    return () => { clearTimeout(t); setCloudIn(false); };
  }, [isOpen, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  const finish = useCallback((openComposer = false) => {
    if (user?.id) {
      try {
        localStorage.setItem(`po_tour_completed_${user.id}`, 'true');
        localStorage.removeItem(`po_just_onboarded_${user.id}`);
      } catch (_) {}
    }
    setCloudIn(false);
    setTimeout(() => {
      onClose?.();
      if (openComposer) onCompleteTour?.();
    }, 200);
  }, [user, onClose, onCompleteTour]);

  const goNext = useCallback(() => {
    if (busy) return;
    vibrate(10);
    if (currentStep < STEPS.length - 1) {
      setBusy(true);
      setCloudIn(false);
      setTimeout(() => { setCurrentStep(s => s + 1); setBusy(false); }, 180);
    } else {
      finish(true);
    }
  }, [busy, currentStep, finish]);

  const skip = useCallback(() => {
    if (busy) return;
    vibrate(5);
    finish(false);
  }, [busy, finish]);

  if (!isOpen) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spot = layout?.spot;

  // SVG cutout mask
  const R = 11;
  const maskPath = spot
    ? [
        `M0,0 H${vw} V${vh} H0 Z`,
        `M${spot.x + R},${spot.y}`,
        `H${spot.x + spot.w - R}`,
        `Q${spot.x + spot.w},${spot.y} ${spot.x + spot.w},${spot.y + R}`,
        `V${spot.y + spot.h - R}`,
        `Q${spot.x + spot.w},${spot.y + spot.h} ${spot.x + spot.w - R},${spot.y + spot.h}`,
        `H${spot.x + R}`,
        `Q${spot.x},${spot.y + spot.h} ${spot.x},${spot.y + spot.h - R}`,
        `V${spot.y + R}`,
        `Q${spot.x},${spot.y} ${spot.x + R},${spot.y} Z`,
      ].join(' ')
    : `M0,0 H${vw} V${vh} H0 Z`;

  // Cloud entrance animation direction
  const enterY = layout?.arrowSide === 'top' ? -10 : 10;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      {/* ── SVG dimmed backdrop with spotlight cutout ─────────── */}
      <svg
        width={vw} height={vh}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
        onClick={skip}
      >
        <path d={maskPath} fill="rgba(2,2,5,0.76)" fillRule="evenodd" />
      </svg>

      {/* ── Spotlight ring around element ─────────────────────── */}
      {spot && (
        <div
          style={{
            position: 'fixed',
            top: spot.y, left: spot.x, width: spot.w, height: spot.h,
            borderRadius: 11,
            border: '1.5px solid rgba(47,139,255,0.6)',
            boxShadow: '0 0 0 3px rgba(47,139,255,0.1)',
            pointerEvents: 'none',
            zIndex: 100001,
          }}
        />
      )}

      {/* ── Floating cloud tooltip ────────────────────────────── */}
      {layout && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: layout.cloudLeft,
            top: layout.arrowSide === 'top'
              ? layout.cloudTop
              : layout.cloudTop, // 'above' case handled by translateY below
            width: CLOUD_W,
            zIndex: 100002,
            pointerEvents: 'auto',
            transform: cloudIn
              ? (layout.arrowSide === 'bottom' ? 'translateY(-100%)' : 'translateY(0)')
              : (layout.arrowSide === 'bottom' ? `translateY(calc(-100% + ${-enterY}px))` : `translateY(${enterY}px)`),
            opacity: cloudIn ? 1 : 0,
            transition: 'transform 300ms cubic-bezier(0.34,1.18,0.64,1), opacity 220ms ease',
            willChange: 'transform, opacity',
          }}
        >
          {/* Arrow pointing TO element (top of cloud = below element) */}
          {layout.arrowSide === 'top' && (
            <div style={{
              position: 'absolute',
              top: -7,
              left: layout.arrowRelX - 7,
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid rgba(255,255,255,0.07)',
              zIndex: 1,
            }} />
          )}
          {layout.arrowSide === 'top' && (
            <div style={{
              position: 'absolute',
              top: -6,
              left: layout.arrowRelX - 6,
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid rgba(9,11,21,0.98)',
              zIndex: 2,
            }} />
          )}

          {/* Cloud body */}
          <div style={{
            background: 'rgba(9,11,21,0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '14px 15px 12px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            position: 'relative',
          }}>
            {/* Top row: icon + step label + skip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(47,139,255,0.1)',
                  border: '1px solid rgba(47,139,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#2f8bff', flexShrink: 0,
                }}>
                  <Icon icon={step.icon} size={14} />
                </div>
                <div style={{
                  fontSize: 9.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: '#4a9fff', fontFamily: 'var(--font-body)',
                }}>
                  {`${currentStep + 1} / ${STEPS.length}`}
                </div>
              </div>
              <button
                type="button" onClick={skip}
                style={{
                  background: 'none', border: 'none', padding: '3px 6px',
                  color: 'rgba(255,255,255,0.28)', fontSize: 11,
                  fontFamily: 'var(--font-body)', cursor: 'pointer', borderRadius: 6,
                }}
              >
                Skip
              </button>
            </div>

            {/* Title */}
            <h3 style={{
              margin: '0 0 4px', fontSize: 15, fontWeight: 700,
              letterSpacing: '-0.012em', color: '#fff', lineHeight: 1.25,
              fontFamily: 'var(--font-heading)',
            }}>
              {step.title}
            </h3>

            {/* Description */}
            <p style={{
              margin: '0 0 10px', fontSize: 12.5, color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6, fontFamily: 'var(--font-body)',
            }}>
              {step.description}
            </p>

            {/* Hint row (inbox swipe tip) */}
            {step.hint && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 9px', borderRadius: 8, marginBottom: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(47,139,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#2f8bff', flexShrink: 0,
                  animation: 'ot-bounce 1.5s ease-in-out infinite',
                }}>
                  <Icon icon={step.hint.icon} size={9} />
                </div>
                <span style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'var(--font-body)', lineHeight: 1.4,
                }}>{step.hint.text}</span>
              </div>
            )}

            {/* Progress + CTA */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              {/* Progress dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    height: 3, borderRadius: 1.5,
                    background: i === currentStep ? '#2f8bff'
                      : i < currentStep ? 'rgba(47,139,255,0.3)' : 'rgba(255,255,255,0.1)',
                    width: i === currentStep ? 18 : 6,
                    transition: 'all 260ms cubic-bezier(0.4,0,0.2,1)',
                  }} />
                ))}
              </div>

              {/* CTA */}
              <button
                type="button" onClick={goNext}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: step.isLast ? '8px 14px' : '7px 12px',
                  borderRadius: 10,
                  border: step.isLast ? 'none' : '1px solid rgba(255,255,255,0.09)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  fontFamily: 'var(--font-body)', letterSpacing: '0.005em',
                  background: step.isLast
                    ? 'linear-gradient(130deg, #2f8bff 0%, #5b6bff 100%)'
                    : 'rgba(255,255,255,0.07)',
                  color: step.isLast ? '#fff' : 'rgba(255,255,255,0.8)',
                  boxShadow: step.isLast ? '0 3px 14px rgba(47,139,255,0.3)' : 'none',
                  transition: 'opacity 150ms ease, transform 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span>{step.isLast ? 'Write First Opinion' : 'Next'}</span>
                <Icon icon="ArrowRight" size={11} />
              </button>
            </div>
          </div>

          {/* Arrow pointing UP (cloud is above element, arrow at bottom) */}
          {layout.arrowSide === 'bottom' && (
            <>
              <div style={{
                position: 'absolute', bottom: -7, left: layout.arrowRelX - 7,
                width: 0, height: 0,
                borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                borderTop: '7px solid rgba(255,255,255,0.07)', zIndex: 1,
              }} />
              <div style={{
                position: 'absolute', bottom: -6, left: layout.arrowRelX - 6,
                width: 0, height: 0,
                borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(9,11,21,0.98)', zIndex: 2,
              }} />
            </>
          )}
        </div>
      )}

      <style>{`@keyframes ot-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
    </div>,
    document.body
  );
}
