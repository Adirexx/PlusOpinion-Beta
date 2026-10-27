/**
 * PullToRefreshIndicator.jsx — 6-Dot Orbit Loader (pull gesture & refresh)
 *
 * Phase 9.2:
 *  - 6-dot OrbitLoader rendered during both pull and active refresh (no old stroke ring flash).
 *  - During pull: rotates smoothly with gesture (forward when pulling down, backward when pushing up).
 *  - At refresh threshold / release: transitions to continuous spin and instant refresh.
 *  - Supports topOffset prop for pages with custom or multi-row headers (e.g. Lens page).
 */

import React from 'react'
import { OrbitLoader } from '../ui/Icons'
import '../../styles/pull-to-refresh.css'

const INDICATOR_H = 56 // Standard indicator travel distance

function getGlowClass(progress, isArmed) {
  if (isArmed) return 'ptr-glow-armed'
  if (progress > 0.75) return 'ptr-glow-high'
  if (progress > 0.45) return 'ptr-glow-mid'
  if (progress > 0.15) return 'ptr-glow-low'
  return ''
}

export default function PullToRefreshIndicator({
  progress = 0,
  isArmed = false,
  isRefreshing = false,
  isCompleting = false,
  pullOffset = 0,
  topOffset,
  className = '',
  style = {},
}) {
  // Don't render when completely idle
  if (progress <= 0 && !isRefreshing && !isCompleting) return null

  // Pull progress (0 -> 1)
  const pullProgress = Math.min(pullOffset / INDICATOR_H, 1)
  const pullTranslateY = isRefreshing
    ? 0
    : -INDICATOR_H * (1 - pullProgress)

  // Rotation directly tracks user pull gesture (circles forward on pull down, backwards on push up)
  const pullRotation = progress * 360
  const pullScale = Math.min(0.75 + progress * 0.25, 1)
  const glowClass = getGlowClass(progress, isArmed)

  const customTop = topOffset !== undefined
    ? (typeof topOffset === 'number'
        ? `calc(env(safe-area-inset-top, 0px) + ${topOffset}px)`
        : topOffset)
    : undefined

  return (
    <div
      className={`ptr-indicator ptr-active ${isCompleting ? 'ptr-completing' : ''} ${className}`}
      style={{
        ...(customTop ? { top: customTop } : {}),
        transform: `translateY(${pullTranslateY}px)`,
        opacity: isRefreshing ? 1 : Math.min(Math.max(progress * 1.5, 0.25), 1),
        ...style,
      }}
    >
      <div
        className={`ptr-loader-wrap ${glowClass} ${isRefreshing ? 'ptr-spinning' : ''}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${pullRotation}deg) scale(${pullScale})`,
          transition: isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <OrbitLoader size={34} className="ptr-orbit" />
      </div>
    </div>
  )
}
