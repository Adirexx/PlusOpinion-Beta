/** @type {import('tailwindcss').Config} */

/**
 * Tailwind config for plusopinion-app.
 * Colors and fontFamily are derived ONLY from what appeared
 * in the old inline tailwind.config blocks across all 8 HTML files.
 *
 * Token audit per page:
 *   HOMEPAGE_FINAL.HTML:       neon, muted, accent-green (all var()), heading font
 *   BOOKMARKS.HTML:            neon, muted, accent-green (all var()), heading font
 *   CATAGORYPAGE.HTML:         neon, muted (var()), heading font  [NO accent-green]
 *   MY SPACE FINAL (USER).HTML: neon, muted (rgba literal!), brand-blue, accent-green (#00E676 literal), accent-gold, heading font
 *   MY SPACE FINAL(COMPANIES): neon, muted, accent-green (all var()), heading font
 *   NOTIFICATION PANEL.HTML:   neon, muted, danger (all var()), heading font
 *   PRIVATE OWNER PROFILE.HTML: neon, muted, accent-green, accent-gold (all var()), heading font
 *   PUBLIC POV PROFILE.HTML:   neon, muted, accent-green, accent-gold, danger (all var()), heading font
 *
 * DIVERGENCE — accent-green and muted:
 *   MY SPACE (USER) defines:
 *     muted: 'rgba(255, 255, 255, 0.6)'   ← literal value
 *     accent-green: '#00E676'              ← literal value
 *   All other pages define:
 *     muted: 'var(--muted)'
 *     accent-green: 'var(--accent-green)'
 *
 * SOLUTION: Map both to CSS variables in the shared config.
 *   The CSS variable --muted = rgba(255,255,255,0.65) (global.css).
 *   0.6 vs 0.65 is a 2% opacity difference — not visually meaningful.
 *   For accent-green on MY SPACE USER (#00E676 = earnings green):
 *   MySpace.jsx will add a local <style> or data-page selector that
 *   overrides --accent-green to #00E676 for that page only.
 *   This is the scoped solution requested in C1.2.
 *   The Tailwind class `text-accent-green` will correctly pick up
 *   the overridden value via CSS variable cascade.
 *
 * REMOVED from Phase 1 version:
 *   borderRadius override — would change rounded-lg from 8px to 24px
 *   maxWidth.app — 450px lives in #root CSS, not Tailwind utilities
 *   bg-deep, neon-weak, success, gold, danger (invented, not in old configs)
 *   fontFamily.body — old code applied Inter via CSS body rule, not Tailwind class
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All colours present in at least one old page config.
        // Values map to CSS variables so they pick up token overrides.
        neon:           'var(--neon)',
        muted:          'var(--muted)',
        'accent-green': 'var(--accent-green)',
        'accent-gold':  'var(--accent-gold)',
        'brand-blue':   '#2f8bff',   // MY SPACE (USER) only — literal value kept
        danger:         'var(--danger)',
      },
      fontFamily: {
        // Only heading font was defined in old configs. body was not.
        heading: ['Space Grotesk', 'serif'],
      },
    },
  },
  plugins: [],
}
