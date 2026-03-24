function _extends() {return _extends = Object.assign ? Object.assign.bind() : function (n) {for (var e = 1; e < arguments.length; e++) {var t = arguments[e];for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);}return n;}, _extends.apply(null, arguments);}
// Default Avatar (Refined: Navbar Style Match - Reduced Gap cy=9, Slim 0.8px, Extracted Blue #326bcb)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23090e1a'/%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%23326bcb' stroke-width='0.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='12' cy='9' r='4' stroke='%23326bcb' stroke-width='0.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

// Global Vibrate Helper (Safe Polyfill)
const vibrate = (ms) => {
  if (window.navigator && window.navigator.vibrate) {
    try {window.navigator.vibrate(ms);} catch (e) {}
  }
};
window.vibrate = vibrate;

const { useState, useEffect, useMemo, useRef } = React;

// SAFE MOTION RESTORATION
let motion = {
  div: 'div', span: 'span', button: 'button', p: 'p', section: 'section', ul: 'ul', li: 'li', a: 'a', img: 'img'
};
let AnimatePresence = ({ children }) => children;
let useMotionValue = (v) => ({ get: () => v, set: () => {} });
let useTransform = () => {};

if (window.Motion) {
  motion = window.Motion.motion;
  AnimatePresence = window.Motion.AnimatePresence;
  useMotionValue = window.Motion.useMotionValue;
  useTransform = window.Motion.useTransform;
}

const goTo = (page) => {
  window.scrollTo(0, 0);
  window.location.href = page;
};

const checkMySpaceRedirect = async () => {
  try {
    const user = await window.getCurrentUser();
    if (!user) {
      window.location.href = 'MY SPACE FINAL (USER).HTML';
      return;
    }
    const { data: profile } = await window.supabase.
    from('profiles').
    select('is_business_account, company_name').
    eq('id', user.id).
    single();

    if (profile && profile.is_business_account) {
      window.location.href = 'MY SPACE FINAL(COMPANIES).HTML';
    } else {
      window.location.href = 'MY SPACE FINAL (USER).HTML';
    }
  } catch (e) {
    window.location.href = 'MY SPACE FINAL (USER).HTML';
  }
};

// --- INTELLIGENT BRIDGE MEMORY (Connects with Profile Page) ---
// This acts as the "Bridge" between pages, ensuring data saved here 
// is readable by runtime.js or direct checks in the Profile page.
const Memory = {
  saveDraft(draft) {
    console.log("Memory: Attempting to save draft...");

    // 1. Get existing drafts from the Runtime Storage Key if available
    // This mimics how `runtime.js` might operate if it were fully active
    const STORAGE_KEY = 'plusopinion_runtime';
    let state = {};

    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (storedState) {
        state = JSON.parse(storedState);
      } else {
        // Initialize if empty
        state = { drafts: [] };
      }
    } catch (e) {console.error("Error reading runtime state", e);}

    // Ensure drafts array exists
    if (!state.drafts) state.drafts = [];

    // 2. Add new draft to the Runtime State
    // Note: Profile page likely reads from this specific structure based on `runtime.js`
    state.drafts.unshift(draft); // Add to beginning

    // 3. Save back to LocalStorage (Persistence)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {console.log("LocalStorage blocked");}

    // 4. ALSO save to a simple key as a fallback/redundancy
    // This covers cases where simple scripts check 'drafts' or 'plusopinion:drafts' directly
    let simpleDrafts = [];
    try {
      const sd = localStorage.getItem('plusopinion:drafts');
      if (sd) simpleDrafts = JSON.parse(sd);
      simpleDrafts.unshift(draft);
      localStorage.setItem('plusopinion:drafts', JSON.stringify(simpleDrafts));
    } catch (e) {}

    // 5. Update Global Window State (Immediate Access)
    // This is crucial for single-page-app feel where window isn't reloaded
    if (window.PlusOpinion && window.PlusOpinion.state) {
      if (!window.PlusOpinion.state.drafts) window.PlusOpinion.state.drafts = [];
      window.PlusOpinion.state.drafts.unshift(draft);
    }

    // 6. Dispatch Custom Event (The "Signal")
    // Profile page listens for 'plusopinion:draftSaved' to re-render
    window.dispatchEvent(new CustomEvent('plusopinion:draftSaved'));

    console.log("Draft Saved Successfully:", draft);
  }
};

// 🔁 PAGE → TAB MAP (GLOBAL)
const PAGE_TAB_MAP = {
  'HOMEPAGE_FINAL.HTML': 'home',
  'CATAGORYPAGE.HTML': 'categories',
  'MY SPACE FINAL (USER).HTML': 'myspace',
  'NOTIFICATION PANEL.HTML': 'notifs',
  'PRIVATE OWNER PROFILE.HTML': 'profile'
};

// --- ICONS (Merged) ---
const Icons = {
  Smile: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("path", { d: "M8 14s1.5 2 4 2 4-2 4-2" }), /*#__PURE__*/React.createElement("line", { x1: "9", y1: "9", x2: "9.01", y2: "9" }), /*#__PURE__*/React.createElement("line", { x1: "15", y1: "9", x2: "15.01", y2: "9" })),
  Running: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M13 4a2 2 0 10-4 0 2 2 0 004 0z" }), /*#__PURE__*/React.createElement("path", { d: "M10 7l-2 4 4 2-1 6" }), /*#__PURE__*/React.createElement("path", { d: "M12 13l4-1 2-4" }), /*#__PURE__*/React.createElement("path", { d: "M8 7l-2 0 2 3" })),

  Home: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2z" }), /*#__PURE__*/React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })),
  Grid: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })),
  User: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "7", r: "4" })),
  Bell: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }), /*#__PURE__*/React.createElement("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })),
  Search: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /*#__PURE__*/React.createElement("path", { d: "m21 21-4.3-4.3" })),
  ThumbsUp: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M7 10v12" }), /*#__PURE__*/React.createElement("path", { d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" })),
  MessageCircle: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" })),
  Share: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }), /*#__PURE__*/React.createElement("polyline", { points: "16 6 12 2 8 6" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "2", y2: "15" })),
  MoreVertical: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "1" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "5", r: "1" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "19", r: "1" })),
  MoreHorizontal: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "1" }), /*#__PURE__*/React.createElement("circle", { cx: "19", cy: "12", r: "1" }), /*#__PURE__*/React.createElement("circle", { cx: "5", cy: "12", r: "1" })),
  AlertTriangle: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "9", y2: "13" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12.01", y1: "17", y2: "17" })),
  Clock: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("polyline", { points: "12 6 12 12 16 14" })),
  ShieldCheck: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" }), /*#__PURE__*/React.createElement("path", { d: "m9 12 2 2 4-4" })),
  Plus: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12 5v14M5 12h14" })),
  X: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
  Menu: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "20", y1: "18", y2: "18" })),
  RefreshCw: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), /*#__PURE__*/React.createElement("path", { d: "M21 3v5h-5" }), /*#__PURE__*/React.createElement("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), /*#__PURE__*/React.createElement("path", { d: "M3 21v-5h5" })),
  Tag: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" }), /*#__PURE__*/React.createElement("path", { d: "M7 7h.01" })),
  Image: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "9", cy: "9", r: "2" }), /*#__PURE__*/React.createElement("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })),
  Video: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m22 8-6 4 6 4V8Z" }), /*#__PURE__*/React.createElement("rect", { width: "14", height: "12", x: "2", y: "6", rx: "2", ry: "2" })),
  Upload: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /*#__PURE__*/React.createElement("polyline", { points: "17 8 12 3 7 8" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "3", y2: "15" })),
  Sparkles: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275-1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" })),
  ChevronRight: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m9 18 6-6-6-6" })),
  ChevronLeft: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m15 18-6-6 6-6" })),
  Info: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("path", { d: "M12 16v-4" }), /*#__PURE__*/React.createElement("path", { d: "M12 8h.01" })),
  Save: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }), /*#__PURE__*/React.createElement("polyline", { points: "17 21 17 13 7 13 7 21" }), /*#__PURE__*/React.createElement("polyline", { points: "7 3 7 8 15 8" })),
  Check: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polyline", { points: "20 6 9 17 4 12" })),
  CornerDownLeft: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polyline", { points: "9 10 4 15 9 20" }), /*#__PURE__*/React.createElement("path", { d: "M20 4v7a4 4 0 0 1-4 4H4" })),
  Filter: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" })),
  Trending: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), /*#__PURE__*/React.createElement("polyline", { points: "17 6 23 6 23 12" })),
  Zap: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })),
  ArrowRight: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M5 12h14" }), /*#__PURE__*/React.createElement("path", { d: "m12 5 7 7-7 7" })),
  Moon: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })),
  Shield: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" })),
  FileText: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }), /*#__PURE__*/React.createElement("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }), /*#__PURE__*/React.createElement("path", { d: "M10 9H8" }), /*#__PURE__*/React.createElement("path", { d: "M16 13H8" }), /*#__PURE__*/React.createElement("path", { d: "M16 17H8" })),
  LifeBuoy: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("path", { d: "m4.93 4.93 4.24 4.24" }), /*#__PURE__*/React.createElement("path", { d: "m14.83 9.17 4.24-4.24" }), /*#__PURE__*/React.createElement("path", { d: "m14.83 14.83 4.24 4.24" }), /*#__PURE__*/React.createElement("path", { d: "m9.17 14.83-4.24 4.24" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "4" })),
  HelpCircle: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }), /*#__PURE__*/React.createElement("path", { d: "M12 17h.01" })),
  LogOut: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }), /*#__PURE__*/React.createElement("polyline", { points: "16 17 21 12 16 7" }), /*#__PURE__*/React.createElement("line", { x1: "21", x2: "9", y1: "12", y2: "12" })),
  Instagram: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5" }), /*#__PURE__*/React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }), /*#__PURE__*/React.createElement("line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5" })),
  WhatsApp: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" }), /*#__PURE__*/React.createElement("path", { d: "M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" })),
  Twitter: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" })),
  Link: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /*#__PURE__*/React.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })),
  Trash: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M3 6h18" }), /*#__PURE__*/React.createElement("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }), /*#__PURE__*/React.createElement("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })),
  Flag: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "4", y1: "22", y2: "15" })),
  Send: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), /*#__PURE__*/React.createElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })),
  EyeOff: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }), /*#__PURE__*/React.createElement("path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }), /*#__PURE__*/React.createElement("path", { d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" }), /*#__PURE__*/React.createElement("line", { x1: "2", x2: "22", y1: "2", y2: "22" })),
  Bookmark: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" })),
  BookmarkFilled: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" })),
  BarChart: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "20", y2: "10" }), /*#__PURE__*/React.createElement("line", { x1: "18", x2: "18", y1: "20", y2: "4" }), /*#__PURE__*/React.createElement("line", { x1: "6", x2: "6", y1: "20", y2: "16" })),
  RotateCcw: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), /*#__PURE__*/React.createElement("path", { d: "M3 3v5h5" })),
  MySpaceLogo: (p) => /*#__PURE__*/
  React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/
  React.createElement("path", { d: "M11 3L3 22", strokeLinejoin: "bevel" }), /*#__PURE__*/
  React.createElement("path", { d: "M21 22L11 3", strokeLinejoin: "bevel" }), /*#__PURE__*/
  React.createElement("path", { d: "M22 8L4 18", className: "myspace-swoosh", strokeWidth: "2.5" })
  )

};

const Icon = ({ icon, size = 20, className = "" }) => {
  const Component = Icons[icon];
  if (!Component) return null;
  return /*#__PURE__*/React.createElement(Component, { width: size, height: size, className: className });
};

const Avatar = ({ src, className, fallbackSize = 24, onClick }) => {
  const [error, setError] = useState(false);

  useEffect(() => {setError(false);}, [src]);

  if (!src || error) {
    return (/*#__PURE__*/
      React.createElement("img", {
        src: DEFAULT_AVATAR,
        className: `${className} object-cover`,
        onClick: onClick,
        alt: "Avatar" }
      ));

  }

  return (/*#__PURE__*/
    React.createElement("img", {
      src: src,
      className: className,
      onError: () => setError(true),
      onClick: onClick,
      alt: "Avatar" }
    ));

};

// --- MOCK DATA ---
const MOCK_COMMENTS = [
{ id: 1, user: "Alex T.", avatar: "https://i.pravatar.cc/150?u=123", text: "Totally agree with this! 🔥", time: "2m" },
{ id: 2, user: "Sarah J.", avatar: "https://i.pravatar.cc/150?u=124", text: "I had a different experience, but good point.", time: "15m" }];


// --- FULL POST DATA (Restored 50 Items) ---
const RAW_POSTS = [];

// LENS FILTERS - Smart filtering options
const LENS_FILTERS = [
{ id: 'foryou', label: 'For You', icon: 'User' },
{ id: 'trending', label: 'Trending', icon: 'TrendingUp' },
{ id: 'verified', label: 'Verified Only', icon: 'CheckCircle' },
{ id: 'highrqs', label: 'High RQS', icon: 'Shield' }];


// --- HELPERS ---
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

const formatTimeAgo = formatTime;

// --- COMPONENTS ---

const SkeletonPost = ({ delay }) => /*#__PURE__*/
React.createElement("div", { className: "glass-panel rounded-2xl p-4 mb-4 animate-fade-in", style: { animationDelay: delay } }, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-3 mb-4" }, /*#__PURE__*/
React.createElement("div", { className: "w-10 h-10 rounded-full skeleton-bg" }), /*#__PURE__*/
React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
React.createElement("div", { className: "w-24 h-3 rounded skeleton-bg mb-2" }), /*#__PURE__*/
React.createElement("div", { className: "w-16 h-2 rounded skeleton-bg" })
)
), /*#__PURE__*/
React.createElement("div", { className: "w-full h-3 rounded skeleton-bg mb-2" }), /*#__PURE__*/
React.createElement("div", { className: "w-3/4 h-3 rounded skeleton-bg mb-4" }), /*#__PURE__*/
React.createElement("div", { className: "w-full h-48 rounded-xl skeleton-bg" })
);


const NavItem = ({ icon, label, isActive, onClick, isMySpace }) => /*#__PURE__*/
React.createElement("button", {
  onClick: (e) => {
    e.stopPropagation();
    if (typeof vibrate === 'function') vibrate(5);
    if (isMySpace) {
      checkMySpaceRedirect();
    } else {
      onClick();
    }
  },
  className: "flex-1 flex flex-col items-center justify-center gap-1 group relative touch-scale transition-transform h-full" }, /*#__PURE__*/

React.createElement("div", { className: `relative ${isMySpace ? 'myspace-trigger' : ''} p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/5 scale-105' : ''}` }, /*#__PURE__*/
React.createElement(Icon, { icon: icon, size: 24, className: `transition-all duration-300 ${isActive ? 'text-white glow-white stroke-[2.5px]' : 'text-muted group-hover:text-white stroke-[1.5px]'}` }), /*#__PURE__*/
React.createElement("span", { className: "delayed-label absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg" },
label
)
)
);






// --- Clickable @mention renderer ---
const renderTextWithMentions = (text) => {
  if (!text) return text;
  const parts = text.split(/(@[\w.]+)/g);
  return parts.map((part, i) => {
    if (/@[\w.]+/.test(part)) {
      const username = part.slice(1);
      return (/*#__PURE__*/
        React.createElement("span", {
          key: i,
          className: "text-neon font-semibold cursor-pointer hover:underline",
          onClick: (e) => {
            e.stopPropagation();
            vibrate(5);
            window.location.href = `PUBLIC POV PROFILE.HTML?username=${username}`;
          } },

        part
        ));

    }
    return part;
  });
};

// --- Mention Autocomplete ---
const MentionAutocomplete = ({ query, onSelect, direction = 'up', coords }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 1) {setUsers([]);return;}
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await window.searchUsersForMention(query);
        setUsers(results);
      } catch (e) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!query || users.length === 0 && !loading) return null;

  const positionClass = direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2';
  const style = coords ? {
    position: 'absolute',
    top: `${coords.top + 25}px`,
    left: `${coords.left}px`,
    width: '220px',
    zIndex: 100
  } : {};

  return (/*#__PURE__*/
    React.createElement("div", {
      style: style,
      className: `${coords ? '' : 'absolute ' + positionClass + ' left-0 right-0'} bg-[#1A1C2E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in` },

    loading && /*#__PURE__*/React.createElement("div", { className: "px-3 py-2 text-xs text-muted" }, "Searching..."),
    users.map((u) => /*#__PURE__*/
    React.createElement("button", {
      key: u.id,
      onMouseDown: (e) => {e.preventDefault();onSelect(u);},
      className: "w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left" }, /*#__PURE__*/

    React.createElement(Avatar, { src: u.avatar_url, className: "w-7 h-7 rounded-full border border-white/10 object-cover flex-shrink-0", fallbackSize: 13 }), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "text-white text-xs font-semibold truncate" }, u.full_name), /*#__PURE__*/
    React.createElement("div", { className: "text-muted text-[10px] truncate" }, "@", u.username)
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] text-neon/60 font-bold shrink-0" }, "RQS ", u.rqs_score)
    )
    )
    ));

};

// --- Reply item ---
const ReplyItem = ({ reply, onReply }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reply.likes?.[0]?.count || 0);
  useEffect(() => {
    if (window.hasLikedComment) window.hasLikedComment(reply.id).then(setIsLiked).catch(() => {});
  }, [reply.id]);
  const handleLike = async () => {
    vibrate(5);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((p) => next ? p + 1 : p - 1);
    try {
      next ? await window.likeComment(reply.id) : await window.unlikeComment(reply.id);
    } catch (e) {setIsLiked(!next);setLikesCount((p) => !next ? p + 1 : p - 1);}
  };
  return (/*#__PURE__*/
    React.createElement("div", { className: `flex gap-2 text-sm mt-2 ${reply.isPending ? 'opacity-50' : ''}` }, /*#__PURE__*/
    React.createElement("div", { className: "ml-5 flex-shrink-0" }, /*#__PURE__*/
    React.createElement(Avatar, { src: reply.avatar, className: "w-5 h-5 rounded-full border border-white/10 object-cover cursor-pointer", fallbackSize: 10,
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${reply.user_id}`;} })
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-white text-[11px] cursor-pointer hover:text-neon transition-colors",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${reply.user_id}`;} },
    reply.user
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] text-muted" }, reply.time)
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("button", { onClick: () => onReply && onReply(reply), className: "text-[9px] text-muted hover:text-white transition-colors" }, "Reply"), /*#__PURE__*/
    React.createElement("button", { onClick: handleLike, className: `flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ThumbsUp", size: 10, style: { fill: isLiked ? 'white' : 'none', color: isLiked ? 'white' : 'inherit' } }),
    likesCount > 0 && /*#__PURE__*/React.createElement("span", { className: "text-[9px]" }, likesCount)
    )
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-gray-300 text-[11px] leading-relaxed mt-0.5" }, renderTextWithMentions(reply.text))
    )
    ));

};


const CommentItem = ({ comment, onReply }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes?.[0]?.count || 0);

  useEffect(() => {
    if (window.hasLikedComment) window.hasLikedComment(comment.id).then(setIsLiked).catch(() => {});
  }, [comment.id]);

  const handleLike = async () => {
    vibrate(5);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((p) => next ? p + 1 : p - 1);
    try {
      next ? await window.likeComment(comment.id) : await window.unlikeComment(comment.id);
    } catch (e) {setIsLiked(!next);setLikesCount((p) => !next ? p + 1 : p - 1);}
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: `flex gap-3 text-sm animate-fade-in ${comment.isPending ? 'opacity-50' : ''}` }, /*#__PURE__*/
    React.createElement("div", { className: "flex-shrink-0" }, /*#__PURE__*/
    React.createElement(Avatar, { src: comment.avatar, className: "w-6 h-6 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer", fallbackSize: 12,
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${comment.user_id}`;} })
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-white text-xs cursor-pointer hover:text-neon transition-colors",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${comment.user_id}`;} },
    comment.user
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted" }, comment.time)
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("button", { onClick: () => onReply && onReply(comment), className: "text-[10px] text-muted hover:text-white transition-colors" }, "Reply"), /*#__PURE__*/
    React.createElement("button", { onClick: handleLike, className: `flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ThumbsUp", size: 12, style: { fill: isLiked ? 'white' : 'none', color: isLiked ? 'white' : 'inherit' } }),
    likesCount > 0 && /*#__PURE__*/React.createElement("span", { className: "text-[10px]" }, likesCount)
    )
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-gray-300 text-xs leading-relaxed mt-0.5" }, renderTextWithMentions(comment.text)),

    (comment.replies || []).map((r) => /*#__PURE__*/
    React.createElement(ReplyItem, { key: r.id, reply: r, onReply: onReply })
    )
    )
    ));

};


const Opinion = ({ post, index, onComment, onShare, onReport, onSave, comments = [], onAddComment, onImageClick, onRemove, onEdit, onBookmark, userProfile, savedPosts }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.agrees);
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState(comments);
  const [commentText, setCommentText] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const isSaved = savedPosts?.has(String(post.id));
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comments);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const commentInputRef = useRef(null);
  const commentsFetchedRef = useRef(false);

  // Portal menu positioning
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const moreButtonRef = useRef(null);


  useEffect(() => {
    if (showMoreMenu && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 10,
        right: window.innerWidth - rect.right
      });
    }
  }, [showMoreMenu]);

  useEffect(() => {
    setLocalLikes(post.agrees);
  }, [post.agrees]);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (window.hasLikedPost) {
        try {
          const hasLiked = await window.hasLikedPost(post.id);
          setIsLiked(hasLiked);
        } catch (e) {
          console.error('Like check failed', e);
        }
      }
    };
    checkLikeStatus();
  }, [post.id]);

  // Realtime Like/Agree Count Logic
  useEffect(() => {
    const channel = window.supabase.channel(`post-likes:${post.id}`).
    on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'posts',
      filter: `id=eq.${post.id}`
    }, (payload) => {
      if (payload.new) {
        if (payload.new.agrees_count !== undefined) {
          setLocalLikes(payload.new.agrees_count);
        }
        if (payload.new.comments_count !== undefined) {
          setLocalCommentCount(payload.new.comments_count);
        }
      }
    }).
    subscribe();

    return () => {
      window.supabase.removeChannel(channel);
    };
  }, [post.id]);

  const handleLike = async () => {
    vibrate(10);
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLocalLikes((prev) => newStatus ? prev + 1 : prev - 1);

    try {
      if (newStatus) {
        await window.likePost(post.id);
      } else {
        await window.unlikePost(post.id);
      }
    } catch (error) {
      console.error('Like failed', error);
      // Revert UI on error
      setIsLiked(!newStatus);
      setLocalLikes((prev) => !newStatus ? prev + 1 : prev - 1);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: error.message || 'Action failed', icon: 'AlertTriangle', isSuccess: false } }));
    }
  };

  const transformComment = (c) => ({
    id: c.id,
    user_id: c.user_id,
    user: c.profiles?.full_name || 'User',
    username: c.profiles?.username || '',
    avatar: c.profiles?.avatar_url || '',
    text: c.text_content,
    time: formatTime(c.created_at),
    parent_comment_id: c.parent_comment_id || null,
    likes: c.likes,
    replies: (c.replies || []).map((r) => transformComment(r))
  });

  const toggleComments = async () => {
    vibrate(5);
    const shouldShow = !showComments;
    setShowComments(shouldShow);
    if (shouldShow && !commentsFetchedRef.current) {
      setIsLoadingComments(true);
      try {
        const fetchedComments = await window.getComments(post.id);
        setLocalComments(fetchedComments.map(transformComment));
        commentsFetchedRef.current = true;
      } catch (error) {
        console.error('Failed to load comments', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  // Realtime: subscribe once on mount
  useEffect(() => {
    const channel = window.supabase.channel(`comments:${post.id}`).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, async (payload) => {
      const currentUser = await window.getCurrentUser();
      if (payload.new.user_id === currentUser?.id) return;
      const { data: profile } = await window.supabase.
      from('profiles').select('full_name, username, avatar_url').
      eq('id', payload.new.user_id).maybeSingle();
      const newEntry = {
        id: payload.new.id, user_id: payload.new.user_id,
        user: profile?.full_name || 'User', username: profile?.username || '',
        avatar: profile?.avatar_url || '', text: payload.new.text_content,
        time: 'Just now',
        parent_comment_id: payload.new.parent_comment_id || null,
        likes: [], replies: []
      };
      const parentId = payload.new.parent_comment_id;
      if (!parentId) {
        setLocalComments((prev) => prev.some((c) => c.id === newEntry.id) ? prev : [...prev, newEntry]);
      } else {
        setLocalComments((prev) => {
          if (!prev.some((c) => c.id === parentId)) return prev;
          return prev.map((c) => c.id === parentId ?
          { ...c, replies: [...(c.replies || []).filter((r) => r.id !== newEntry.id), newEntry] } :
          c);
        });
      }
      vibrate(5);
    }).
    subscribe();
    return () => window.supabase.removeChannel(channel);
  }, [post.id]);

  const toggleShareMenu = () => {
    vibrate(5);
    setShowShareMenu(!showShareMenu);
  };

  const toggleMoreMenu = (e) => {
    e.stopPropagation();
    vibrate(5);
    setShowMoreMenu(!showMoreMenu);
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    const isReply = !!replyingTo;
    const tempId = Date.now();
    const tempEntry = {
      id: tempId, user: userProfile?.full_name || 'You',
      username: userProfile?.username || '', user_id: userProfile?.id,
      avatar: userProfile?.avatar_url || '', text: commentText,
      time: 'Just now', isPending: true, likes: [], replies: []
    };
    if (isReply) {
      setLocalComments((prev) => prev.map((c) =>
      c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), tempEntry] } : c
      ));
    } else {
      setLocalComments((prev) => [...prev, tempEntry]);
    }
    const textToSend = commentText;
    setCommentText('');
    setReplyingTo(null);
    setMentionQuery(null);
    vibrate(10);
    try {
      let newData;
      if (isReply) {
        newData = await window.createReply(post.id, replyingTo.id, textToSend);
        setLocalComments((prev) => prev.map((c) => c.id === replyingTo.id ?
        {
          ...c, replies: (c.replies || []).map((r) => r.id === tempId ? {
            id: newData.id, user: userProfile?.full_name || 'You',
            username: userProfile?.username || '', user_id: userProfile?.id,
            avatar: userProfile?.avatar_url || '', text: newData.text_content,
            time: 'Just now', likes: [], replies: []
          } : r)
        } :
        c
        ));
      } else {
        newData = await window.createComment(post.id, textToSend);
        setLocalComments((prev) => prev.map((c) => c.id === tempId ? {
          id: newData.id, user: userProfile?.full_name || 'You',
          username: userProfile?.username || '', avatar: userProfile?.avatar_url || '',
          text: newData.text_content, time: 'Just now', likes: newData.likes || [], replies: []
        } : c));
      }
      if (onAddComment) onAddComment(post.id, textToSend);
    } catch (error) {
      console.error('Comment failed', error);
      if (isReply) {
        setLocalComments((prev) => prev.map((c) =>
        c.id === replyingTo?.id ? { ...c, replies: (c.replies || []).filter((r) => r.id !== tempId) } : c
        ));
      } else {
        setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      }
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to post comment', icon: 'AlertTriangle', isSuccess: false } }));
    }
  };

  const handleReply = (commentOrReply, topLevelId = null) => {
    const parentId = topLevelId || commentOrReply.parent_comment_id || commentOrReply.id;
    setReplyingTo({ id: parentId, user: commentOrReply.user, username: commentOrReply.username || '' });
    setCommentText(`@${commentOrReply.username || commentOrReply.user} `);
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const cursor = e.target.selectionStart;
    const atMatch = val.substring(0, cursor).match(/@([\w.]*)$/);
    setMentionQuery(atMatch ? atMatch[1] : null);
  };

  const handleMentionSelect = (user) => {
    const cursor = commentInputRef.current?.selectionStart || commentText.length;
    const textBeforeCursor = commentText.substring(0, cursor);
    const textAfterCursor = commentText.substring(cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const newTextBefore = textBeforeCursor.substring(0, atIndex) + '@' + user.username + ' ';
      setCommentText(newTextBefore + textAfterCursor);
      setMentionQuery(null);
      // Reset cursor position after React update
      setTimeout(() => {
        if (commentInputRef.current) {
          const newPos = newTextBefore.length;
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleShareClick = () => {
    vibrate(5);
    if (onShare) onShare(post);
  };

  const handleMoreAction = (action) => {
    vibrate(10);
    setShowMoreMenu(false);

    if (action === 'edit') {
      // Enforce one-time edit policy
      if (post.is_edited) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinions can only be edited once.', icon: 'Lock', isSuccess: false } }));
        return;
      }
      if (onEdit) onEdit(post);else
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Edit feature coming soon!', icon: 'FileText', isSuccess: false } }));
    } else if (action === 'delete') {
      // Logic handled in parent via onRemove
      onRemove(post.id, 'Deleted');
    } else
    if (action === 'not_interested') {
      onRemove(post.id, 'Marked as not interested', 'not_interested');
    } else if (action === 'hide') {
      setIsHidden(true); // Immediate local hide
      onRemove(post.id, 'Opinion hidden', 'hide_post'); // Persist
    } else if (action === 'block_brand') {
      onRemove(post.id, `Posts from ${post.seenBy || 'Brand'} hidden`, 'mute_brand', post.seenBy);
    } else if (action === 'bookmark') {
      if (onBookmark) onBookmark(post.id, !isSaved);
    } else if (action === 'insight') {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Insight feature coming soon!', icon: 'BarChart', isSuccess: false } }));
    } else if (action === 'report') {
      // Trigger Report Modal in Parent
      // We need a way to bubble this up specific for reporting
      if (onRemove) onRemove(post.id, 'Reported', 'REPORT_INTENT');
    }
  };

  const handleReport = () => {
    vibrate(10);
    if (onReport) onReport(post.id);
  };

  // Simplified display logic - rely on parent prop which is realtime updated
  const displayComments = post.comments;

  // Unhide handler
  const handleUnhide = async () => {
    vibrate(10);
    try {
      // Call API to remove from hidden_items table
      await window.unhideItem('post', post.id);

      // Update local state
      setIsHidden(false);

      // Notify parent to update hidden items
      window.dispatchEvent(new CustomEvent('unhidePost', { detail: { postId: post.id } }));

      // Show success toast
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Opinion restored', icon: 'Check', isSuccess: true }
      }));
    } catch (error) {
      console.error('Failed to unhide post:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Failed: ${error.message || 'Unknown error'}`, icon: 'AlertTriangle', isSuccess: false }
      }));
    }
  };

  if (isHidden) {
    return (/*#__PURE__*/
      React.createElement("div", { className: "glass-panel rounded-2xl p-4 mb-4 flex items-center justify-between animate-fade-in" }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "EyeOff", size: 20, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", { className: "text-sm text-gray-400" }, "Opinion hidden")
      ), /*#__PURE__*/
      React.createElement("button", { onClick: handleUnhide, className: "px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-colors" }, "Unhide"

      )
      ));

  }

  return (/*#__PURE__*/
    React.createElement("div", {
      className: `glass-panel rounded-2xl p-4 mb-4 relative transition-all duration-300 animate-stagger ${showMoreMenu ? 'z-50' : 'z-0'}`,
      style: { animationDelay: `${Math.min(index * 50, 1000)}ms` } },




    showMoreMenu && ReactDOM.createPortal(/*#__PURE__*/
      React.createElement(React.Fragment, null, /*#__PURE__*/
      React.createElement("div", { className: "fixed inset-0 z-[9998]", onClick: (e) => {e.stopPropagation();setShowMoreMenu(false);} }), /*#__PURE__*/
      React.createElement("div", {
        className: "absolute z-[9999] bg-[#1A1C2E] border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-56 animate-fade-in origin-top-right backdrop-blur-xl",
        style: { top: `${menuPosition.top}px`, right: `${menuPosition.right}px` },
        onClick: (e) => e.stopPropagation() },

      userProfile && userProfile.id === (post.user_id || post.profiles?.id) ? /*#__PURE__*/
      /* Owner Options */
      React.createElement(React.Fragment, null, /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('edit'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "FileText", size: 16, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", null, "Edit Opinion")
      ), /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('delete'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-red-400 group" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "Trash", size: 16, className: "text-red-400" }), /*#__PURE__*/
      React.createElement("span", null, "Delete Opinion")
      ), /*#__PURE__*/
      React.createElement("div", { className: "h-px bg-white/10 my-1" }), /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('bookmark'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: isSaved ? "BookmarkFilled" : "Bookmark", size: 16, className: isSaved ? "text-neon fill-neon" : "text-muted" }), /*#__PURE__*/
      React.createElement("span", null, isSaved ? 'Bookmarked' : 'Bookmark')
      )
      ) : /*#__PURE__*/

      /* Non-Owner Options */
      React.createElement(React.Fragment, null, /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('not_interested'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "EyeOff", size: 16, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", null, "Not interested in this post")
      ), /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('hide'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "X", size: 16, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", null, "Hide this opinion")
      ), /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('block_brand'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "Flag", size: 16, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", null, "Don't show posts from ", post.seenBy || 'Brand')
      ), /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('bookmark'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: isSaved ? "BookmarkFilled" : "Bookmark", size: 16, className: isSaved ? "text-neon fill-neon" : "text-muted" }), /*#__PURE__*/
      React.createElement("span", null, isSaved ? 'Bookmarked' : 'Bookmark')
      )
      ), /*#__PURE__*/


      React.createElement("div", { className: "h-px bg-white/10 my-1" }), /*#__PURE__*/
      React.createElement("button", { onClick: () => handleMoreAction('insight'), className: "flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "BarChart", size: 16, className: "text-muted" }), /*#__PURE__*/
      React.createElement("div", { className: "flex flex-col items-start" }, /*#__PURE__*/
      React.createElement("span", null, "View Insights"), /*#__PURE__*/
      React.createElement("span", { className: "text-[8px] text-neon font-bold tracking-wider" }, "COMING SOON")
      )
      )
      )
      ),
      document.body
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex justify-between items-start mb-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 w-full" }, /*#__PURE__*/
    React.createElement("div", {
      className: "group relative cursor-pointer active:scale-95 transition-transform",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id}`;} },

    post.avatar ? /*#__PURE__*/
    React.createElement(Avatar, {
      src: post.avatar,
      className: "w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover",
      fallbackSize: 20 }
    ) : /*#__PURE__*/

    React.createElement("img", { src: DEFAULT_AVATAR, className: "w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" }), /*#__PURE__*/

    React.createElement("span", { className: "delayed-label absolute top-12 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "View Profile")
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 min-w-0 pr-8" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: "group relative cursor-pointer hover:text-neon transition-colors",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id}`;} }, /*#__PURE__*/

    React.createElement("span", { className: "font-heading font-bold text-white text-sm truncate" }, post.name), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute bottom-6 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "View Profile")
    ), /*#__PURE__*/
    React.createElement("div", { className: "group relative rqs-pill px-2 py-0.5 rounded-full flex items-center shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-[9px] text-white tracking-wide cursor-default" }, "RQS ", post.rqs), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "Review Quality Score")
    )
    ), /*#__PURE__*/
    React.createElement("div", {
      className: "group relative inline-block cursor-pointer",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id}`;} }, /*#__PURE__*/

    React.createElement("div", { className: "text-xs text-muted truncate hover:text-white transition-colors" }, "@", post.username), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute top-5 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "View Profile")
    )
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute top-4 right-4 touch-scale text-muted/60 hover:text-white group z-10", onClick: toggleMoreMenu, ref: moreButtonRef }, /*#__PURE__*/
    React.createElement(Icon, { icon: "MoreVertical", size: 18 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center flex-wrap gap-2 mb-3 mt-1" }, /*#__PURE__*/
    React.createElement("div", { className: "group relative border border-white/10 rounded-full px-3 py-1 flex items-center bg-white/5 text-[10px] text-white/80 font-medium" }, /*#__PURE__*/
    React.createElement("span", { className: "text-neon" }, post.category), /*#__PURE__*/
    React.createElement("span", { className: "mx-1.5 opacity-30" }, "|"), /*#__PURE__*/
    React.createElement("span", null, post.product), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute -top-8 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "Filter")
    ),

    post.verified && /*#__PURE__*/
    React.createElement("div", { className: "flex items-center text-accent-green touch-scale group relative", title: "Verified Purchase" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ShieldCheck", size: 16 })
    )

    ), /*#__PURE__*/

    React.createElement("p", { className: "text-sm text-gray-200 leading-relaxed mb-3 font-light pr-2" }, renderTextWithMentions(post.text)),

    (post.media || post.images && post.images.length > 0) && /*#__PURE__*/
    React.createElement(SmartMedia, {
      src: post.media,
      type: post.media_type,
      images: post.images,
      onImageClick: onImageClick }
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-end justify-between pt-3 mt-1 relative" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-6" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: handleLike,
      className: "flex items-center gap-1.5 touch-scale group relative" }, /*#__PURE__*/

    React.createElement("div", { className: isLiked ? "animate-pop" : "" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "ThumbsUp", size: 20,
      className: `transition-all duration-300 stroke-[1.5px] ${isLiked ? 'fill-white stroke-black/80 filter drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]' : ''}`,
      style: isLiked ? {
        fill: 'white',
        stroke: '#000',
        strokeWidth: '1.5px',
        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
      } : {} }
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-medium" }, localLikes)
    ), /*#__PURE__*/
    React.createElement("button", { className: `flex items-center gap-1.5 touch-scale transition-transform group relative ${showComments ? 'text-white' : 'text-muted hover:text-white'}`, onClick: toggleComments }, /*#__PURE__*/
    React.createElement(Icon, { icon: "MessageCircle", size: 20, className: "stroke-[1.5]" }), /*#__PURE__*/

    React.createElement("span", { className: "text-xs font-medium" }, showComments ? localComments.length : Math.max(localCommentCount, localComments.length))
    ), /*#__PURE__*/

    React.createElement("button", { className: "text-muted hover:text-white transition-colors touch-scale group relative", onClick: handleShareClick }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Share", size: 20 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-3" },
    post.seenBy && /*#__PURE__*/
    React.createElement("span", { className: "group relative text-[9px] text-neon/80 font-medium tracking-wide bg-neon/5 px-2 py-0.5 rounded border border-neon/10 cursor-default flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]" }), "Seen by ",
    post.seenBy
    ), /*#__PURE__*/

    React.createElement("button", { className: "text-muted/40 hover:text-red-400 transition-colors touch-scale group relative", onClick: handleReport }, /*#__PURE__*/
    React.createElement(Icon, { icon: "AlertTriangle", size: 18 })
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-muted/40 font-medium" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Clock", size: 12 }), /*#__PURE__*/
    React.createElement("span", null, post.time === 'Just now' ? 'Posted Just now' : `Posted ${post.time} ago`)
    ),


    showComments && /*#__PURE__*/
    React.createElement("div", { className: "mt-4 pt-0 border-t border-white/5 animate-fade-in origin-top" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center mb-3 pt-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-white" }, "Comments (", localComments.length, ")"), /*#__PURE__*/
    React.createElement("button", { onClick: () => setShowComments(false), className: "text-muted hover:text-white text-xs" }, "Close")
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-3 mb-4 max-h-60 overflow-y-auto no-scrollbar" },
    isLoadingComments && /*#__PURE__*/React.createElement("div", { className: "text-center text-muted text-xs py-2" }, "Loading comments..."),

    localComments.map((c) => /*#__PURE__*/
    React.createElement(CommentItem, { key: c.id, comment: c, onReply: (target, topLevelId = null) => handleReply(target, topLevelId || c.id) })
    ),

    !isLoadingComments && localComments.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "text-center text-muted text-xs py-2" }, "No comments yet. Be the first!")

    ), /*#__PURE__*/

    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement(MentionAutocomplete, { query: mentionQuery, onSelect: handleMentionSelect }),
    replyingTo && /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between px-3 py-1.5 bg-neon/5 border border-neon/20 rounded-t-xl mb-0.5 text-[10px]" }, /*#__PURE__*/
    React.createElement("span", { className: "text-neon" }, "Replying to ", /*#__PURE__*/React.createElement("strong", null, "@", replyingTo.username || replyingTo.user)), /*#__PURE__*/
    React.createElement("button", { onClick: () => {setReplyingTo(null);setCommentText('');}, className: "text-muted hover:text-white" }, "\u2715")
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-neon/50 transition-colors" }, /*#__PURE__*/
    React.createElement("input", {
      ref: commentInputRef,
      value: commentText,
      onChange: handleCommentChange,
      placeholder: replyingTo ? `Reply to @${replyingTo.username || replyingTo.user}...` : 'Add a comment or type @ to mention...',
      className: "bg-transparent flex-1 text-xs text-white outline-none placeholder-white/30",
      onKeyDown: (e) => e.key === 'Enter' && handleSendComment() }
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleSendComment, className: `${commentText.trim() ? 'text-neon' : 'text-muted'} transition-colors` }, /*#__PURE__*/React.createElement(Icon, { icon: "Send", size: 14 }))
    )
    )
    )

    ));

};

// --- SUB-COMPONENTS FOR OVERLAYS ---

// MENU ITEM
const MenuItem = ({ icon, label, subLabel, hasAction = false, onClick, className = "" }) => {
  return (/*#__PURE__*/
    React.createElement("button", {
      onClick: () => {vibrate(5);onClick();},
      className: `w-full flex items-center justify-between p-4 rounded-xl border border-transparent active:bg-white/5 transition-all duration-150 group text-left relative overflow-hidden touch-manipulation ${className}` }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-4 relative z-10" }, /*#__PURE__*/
    React.createElement("div", { className: "text-muted group-active:text-neon transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: icon, size: 22 })
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col" }, /*#__PURE__*/
    React.createElement("span", { className: "text-gray-300 text-base font-medium tracking-wide group-active:text-white transition-colors font-body" }, label)
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative z-10 flex items-center gap-3" },
    subLabel && /*#__PURE__*/React.createElement("span", { className: "text-muted text-xs font-medium hidden sm:block group-active:text-neon/70" }, subLabel), /*#__PURE__*/
    React.createElement("div", { className: "text-muted group-active:text-neon transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronRight", size: 18 })
    )
    )
    ));

};

// ─── SMART MEDIA RATIO DETECTION HELPER ───────────────────────────────────
const getAspectClass = (ratio) => {
  if (ratio >= 1.55) return 'aspect-[16/9]';
  if (ratio >= 0.89) return 'aspect-square';
  return 'aspect-[4/5]';
};

// ─── SMART MEDIA COMPONENT ────────────────────────────────────────────────
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


  // Listen for internal chat post rendering
  useEffect(() => {
    const handleRenderSharedPost = async (e) => {
      const { postId, containerId } = e.detail;
      if (!postId || !containerId) return;

      setSharedPostsToRender((prev) => ({ ...prev, [containerId]: { isLoading: true, post: null } }));

      try {
        const fullPost = await window.getPost(postId);
        if (fullPost && fullPost.id) {
          const uiPost = {
            id: fullPost.id,
            user_id: fullPost.user_id,
            name: fullPost.profiles?.full_name || 'User',
            username: fullPost.profiles?.username || 'user',
            avatar: fullPost.profiles?.avatar_url || "",
            rqs: fullPost.profiles?.rqs_score || 0,
            verified: fullPost.is_verified_purchase || fullPost.profiles?.is_verified,
            category: fullPost.category,
            product: fullPost.product_name,
            text: fullPost.text_content,
            media: fullPost.media_url,
            media_type: fullPost.media_type || 'image',
            images: fullPost.images || null,
            time: "Shared",
            agrees: fullPost.agrees_count || 0,
            comments: fullPost.comments_count || 0,
            seenBy: fullPost.seen_by_brand
          };
          setSharedPostsToRender((prev) => ({ ...prev, [containerId]: { isLoading: false, post: uiPost } }));
        } else {
          setSharedPostsToRender((prev) => ({ ...prev, [containerId]: { isLoading: false, error: true } }));
        }
      } catch (err) {
        setSharedPostsToRender((prev) => ({ ...prev, [containerId]: { isLoading: false, error: true } }));
      }
    };
    window.addEventListener('render_shared_post', handleRenderSharedPost);

    // Expose openFullPost globally
    window.openFullPost = async (postId) => {
      if (window.closeInbox) window.closeInbox();
      window.location.href = `POST_VIEWER_HTML_OR_SIMILAR?id=${postId}`;
    };
    window.scrollToPost = window.openFullPost;

    return () => window.removeEventListener('render_shared_post', handleRenderSharedPost);
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

  const [aspectClass, setAspectClass] = useState('aspect-[4/5]');
  const [ratioDetected, setRatioDetected] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
  const [isPinching, setIsPinching] = useState(false);
  const initialDist = useRef(null);
  const SWIPE_THRESHOLD = 40;
  const handleMediaLoad = (e) => {
    if (ratioDetected) return;
    const el = e.target;
    const w = el.naturalWidth || el.videoWidth || el.clientWidth;
    const h = el.naturalHeight || el.videoHeight || el.clientHeight;
    if (w && h) {setAspectClass(getAspectClass(w / h));setRatioDetected(true);}
  };
  const onCarouselTouchStart = (e) => {e.stopPropagation();if (e.touches.length !== 1) return;dragStart.current = e.touches[0].clientX;setIsDragging(true);};
  const onCarouselTouchMove = (e) => {
    e.stopPropagation();
    if (!isDragging || dragStart.current === null) return;
    const delta = e.touches[0].clientX - dragStart.current;
    if (activeIdx === 0 && delta > 0 || activeIdx === imageList.length - 1 && delta < 0) {setDragDelta(delta * 0.2);} else {setDragDelta(delta);}
  };
  const onCarouselTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragDelta < -SWIPE_THRESHOLD && activeIdx < imageList.length - 1) setActiveIdx((i) => i + 1);else
    if (dragDelta > SWIPE_THRESHOLD && activeIdx > 0) setActiveIdx((i) => i - 1);
    setDragDelta(0);dragStart.current = null;
  };
  const onSingleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const t1 = e.touches[0],t2 = e.touches[1];
      initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {const mx = (t1.pageX + t2.pageX) / 2,my = (t1.pageY + t2.pageY) / 2;setPinchOrigin({ x: (mx - rect.left) / rect.width * 100, y: (my - rect.top) / rect.height * 100 });}
    }
  };
  const onSingleTouchMove = (e) => {if (e.touches.length === 2 && isPinching && initialDist.current) {e.preventDefault();const t1 = e.touches[0],t2 = e.touches[1];setScale(Math.min(Math.max(Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY) / initialDist.current, 1), 4));}};
  const onSingleTouchEnd = () => {setIsPinching(false);setScale(1);initialDist.current = null;};
  const handleClick = () => {
    if (isPinching || isMulti && Math.abs(dragDelta) > 5) return;
    if (isMulti) onImageClick(null, 'images', imageList, activeIdx);else
    onImageClick(src, type);
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
    if (activeIdx === 0 && delta > 0 || activeIdx === imageList.length - 1 && delta < 0) {
      setDragDelta(delta * 0.2);
    } else {
      setDragDelta(delta);
    }
  };

  const onCarouselMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragDelta < -SWIPE_THRESHOLD && activeIdx < imageList.length - 1) {
      setActiveIdx((i) => i + 1);
    } else if (dragDelta > SWIPE_THRESHOLD && activeIdx > 0) {
      setActiveIdx((i) => i - 1);
    }
    setDragDelta(0);
    dragStart.current = null;
  };

  return (/*#__PURE__*/
    React.createElement("div", { ref: containerRef, className: `w-full rounded-xl mb-3 border border-white/5 relative bg-black overflow-hidden cursor-pointer select-none media-zoom-effect ${aspectClass}`, style: { zIndex: isPinching ? 50 : 1 }, onClick: handleClick },
    isVideo ? /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0", onTouchStart: onSingleTouchStart, onTouchMove: onSingleTouchMove, onTouchEnd: onSingleTouchEnd, style: { transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' } }, /*#__PURE__*/
    React.createElement("video", { src: src, className: "w-full h-full object-cover pointer-events-none", playsInline: true, loop: true, muted: isMuted || !isInView, autoPlay: true, onLoadedMetadata: handleMediaLoad }), /*#__PURE__*/
    React.createElement("button", { onClick: toggleMute, className: "absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white transition-all z-10 pointer-events-auto" },
    isMuted ? /*#__PURE__*/
    React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), /*#__PURE__*/React.createElement("line", { x1: "23", y1: "9", x2: "17", y2: "15" }), /*#__PURE__*/React.createElement("line", { x1: "17", y1: "9", x2: "23", y2: "15" })) : /*#__PURE__*/

    React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), /*#__PURE__*/React.createElement("path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" }))

    )
    ) :
    isMulti ? /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", {
      className: "absolute inset-0 flex",
      style: { transform: `translateX(calc(${-activeIdx * (100 / imageList.length)}% + ${dragDelta}px))`, transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)', width: `${imageList.length * 100}%` },
      onTouchStart: onCarouselTouchStart,
      onTouchMove: onCarouselTouchMove,
      onTouchEnd: onCarouselTouchEnd,
      onMouseDown: onCarouselMouseDown,
      onMouseMove: onCarouselMouseMove,
      onMouseUp: onCarouselMouseUp,
      onMouseLeave: onCarouselMouseUp },

    imageList.map((imgSrc, idx) => /*#__PURE__*/React.createElement("div", { key: idx, className: "h-full flex-shrink-0", style: { width: `${100 / imageList.length}%` } }, /*#__PURE__*/React.createElement("img", { src: imgSrc, alt: `Image ${idx + 1}`, loading: idx === 0 ? 'eager' : 'lazy', className: "w-full h-full object-cover pointer-events-none", onLoad: idx === 0 ? handleMediaLoad : undefined, draggable: "false" })))
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10" }, imageList.map((_, idx) => /*#__PURE__*/React.createElement("div", { key: idx, className: "transition-all duration-300", style: { width: idx === activeIdx ? '18px' : '6px', height: '6px', borderRadius: '3px', background: idx === activeIdx ? 'white' : 'rgba(255,255,255,0.4)' } }))), /*#__PURE__*/
    React.createElement("div", { className: "absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white font-bold pointer-events-none z-10" }, activeIdx + 1, "/", imageList.length)
    ) : /*#__PURE__*/

    React.createElement("div", { className: "absolute inset-0", onTouchStart: onSingleTouchStart, onTouchMove: onSingleTouchMove, onTouchEnd: onSingleTouchEnd, style: { transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' } }, /*#__PURE__*/
    React.createElement("img", { src: src, alt: "Post media", loading: "lazy", className: "w-full h-full object-cover pointer-events-none", onLoad: handleMediaLoad, draggable: "false" })
    )

    ));

};

// ─── FULL-SCREEN IMAGE VIEWER (multi-image swipe + pinch-zoom) ────────────
const ImageViewer = ({ src, type, images, initialIndex = 0, onClose }) => {
  const imgList = images && images.length > 0 ? images : src && type !== 'video' ? [src] : [];
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
  const resetZoom = () => {setScale(1);setPosition({ x: 0, y: 0 });};
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {setIsPinching(true);const t1 = e.touches[0],t2 = e.touches[1];initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);lastScale.current = scale;} else
    if (e.touches.length === 1) {if (scale > 1) {lastTouch.current = { x: e.touches[0].pageX - position.x, y: e.touches[0].pageY - position.y };} else if (isMulti) {dragStart.current = e.touches[0].clientX;setIsDragging(true);}}
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinching && initialDist.current) {e.preventDefault();const t1 = e.touches[0],t2 = e.touches[1];setScale(Math.min(Math.max(Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY) / initialDist.current * lastScale.current, 1), 5));} else
    if (e.touches.length === 1 && scale > 1) {const lx = (scale - 1) * (window.innerWidth / 2),ly = (scale - 1) * (window.innerHeight / 2);setPosition({ x: Math.min(Math.max(e.touches[0].pageX - lastTouch.current.x, -lx), lx), y: Math.min(Math.max(e.touches[0].pageY - lastTouch.current.y, -ly), ly) });} else
    if (e.touches.length === 1 && isDragging && isMulti && scale <= 1) {const delta = e.touches[0].clientX - dragStart.current;setDragDelta(currentIdx === 0 && delta > 0 || currentIdx === imgList.length - 1 && delta < 0 ? delta * 0.2 : delta);}
  };
  const handleTouchEnd = () => {setIsPinching(false);if (scale <= 1) setPosition({ x: 0, y: 0 });if (isDragging) {setIsDragging(false);if (dragDelta < -SWIPE_THRESHOLD && currentIdx < imgList.length - 1) {setCurrentIdx((i) => i + 1);resetZoom();} else if (dragDelta > SWIPE_THRESHOLD && currentIdx > 0) {setCurrentIdx((i) => i - 1);resetZoom();}setDragDelta(0);dragStart.current = null;}};
  const handleDoubleTap = (e) => {e.stopPropagation();if (scale > 1) resetZoom();else setScale(2.5);};
  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[100] bg-black animate-fade-in overflow-hidden", onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd }, /*#__PURE__*/
    React.createElement("button", { className: "absolute top-5 right-5 p-2.5 bg-white/10 rounded-full text-white z-50 backdrop-blur-sm", onClick: onClose }, /*#__PURE__*/React.createElement(Icon, { icon: "X", size: 22 })),
    isMulti && /*#__PURE__*/React.createElement("div", { className: "absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-bold z-50" }, currentIdx + 1, " / ", imgList.length),
    isVideo ? /*#__PURE__*/
    React.createElement("div", { className: "w-full h-full flex items-center justify-center p-4", onClick: onClose }, /*#__PURE__*/React.createElement("video", { src: src, className: "max-w-full max-h-full object-contain", controls: true, autoPlay: true, onClick: (e) => e.stopPropagation() })) :
    isMulti ? /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 flex items-center", style: { transform: `translateX(calc(${-currentIdx * (100 / imgList.length)}% + ${dragDelta}px))`, transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)', width: `${imgList.length * 100}%` } },
    imgList.map((imgSrc, idx) => /*#__PURE__*/React.createElement("div", { key: idx, className: "h-full flex items-center justify-center flex-shrink-0", style: { width: `${100 / imgList.length}%` } }, /*#__PURE__*/React.createElement("img", { src: imgSrc, alt: `Image ${idx + 1}`, className: "max-w-full max-h-full object-contain select-none p-2", style: idx === currentIdx ? { transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s' } : {}, onDoubleClick: idx === currentIdx ? handleDoubleTap : undefined, draggable: "false", onClick: (e) => e.stopPropagation() })))
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none z-50" }, imgList.map((_, idx) => /*#__PURE__*/React.createElement("div", { key: idx, style: { width: idx === currentIdx ? '20px' : '6px', height: '6px', borderRadius: '3px', background: idx === currentIdx ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' } })))
    ) : /*#__PURE__*/

    React.createElement("div", { className: "w-full h-full flex items-center justify-center", onClick: onClose }, /*#__PURE__*/React.createElement("img", { src: imgList[0] || src, className: "max-w-full max-h-full object-contain p-2 select-none", style: { transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s ease-out' }, onDoubleClick: handleDoubleTap, onClick: (e) => e.stopPropagation(), draggable: "false" }))

    ));

};

// LOGOUT MODAL
const LogoutModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[80] flex items-center justify-center p-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-md animate-menu-fade", onClick: onCancel }), /*#__PURE__*/

    React.createElement("div", { className: "relative w-full max-w-[320px] bg-[#0A0F1D] border border-white/10 rounded-3xl p-6 shadow-2xl transform transition-all animate-pop overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" }), /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col items-center text-center space-y-5 pt-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-16 rounded-full bg-red-500/5 flex items-center justify-center border border-red-500/10 mb-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "AlertTriangle", size: 28, className: "text-red-400" })
    ), /*#__PURE__*/

    React.createElement("h3", { className: "text-2xl font-heading font-bold text-white" }, "Log Out?"), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-base leading-relaxed" }, "You'll need to sign in again to access your dashboard."

    ), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 gap-3 w-full mt-2" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: onConfirm,
      className: "w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 active:from-red-500 active:to-red-400 text-white font-bold text-base transition-all shadow-lg shadow-red-900/20" },
    "Log Out"

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: onCancel,
      className: "w-full py-4 rounded-xl border border-white/5 bg-white/5 active:bg-white/10 text-muted font-medium text-base transition-colors" },
    "Cancel"

    )
    )
    )
    )
    ));

};



// LENS CARD (UPDATED)
const ProductCard = ({ product }) => /*#__PURE__*/
React.createElement("div", { className: "flex-shrink-0 w-32 group cursor-pointer snap-start", onClick: () => vibrate(5) }, /*#__PURE__*/
React.createElement("div", { className: "relative aspect-[4/5] overflow-hidden rounded-xl bg-[#0B1221] border border-white/5 group-hover:border-neon/30 transition-colors" }, /*#__PURE__*/
React.createElement("img", { src: product.image, className: "w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" }), /*#__PURE__*/
React.createElement("div", { className: "absolute top-1.5 right-1.5 rqs-pill px-1.5 py-0.5 rounded text-[8px] font-bold text-white shadow-lg" }, product.rqs), /*#__PURE__*/
React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" }), /*#__PURE__*/
React.createElement("div", { className: "absolute bottom-2 left-2 right-2" }, /*#__PURE__*/
React.createElement("p", { className: "text-[9px] text-neon font-bold uppercase mb-0.5 tracking-wider" }, product.brand), /*#__PURE__*/
React.createElement("h4", { className: "text-xs font-bold text-white leading-tight truncate" }, product.name)
)
)
);


// LENS REVIEWER
const ReviewerCircle = ({ user, isEnd }) => {
  if (isEnd) return (/*#__PURE__*/
    React.createElement("div", { className: "flex-shrink-0 w-20 flex flex-col items-center justify-center gap-2 snap-start", onClick: () => vibrate(5) }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-neon hover:bg-white/10 transition-colors shadow-lg" }, /*#__PURE__*/React.createElement(Icon, { icon: "ArrowRight", size: 20 })), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-neon font-medium tracking-wide" }, "Explore More")
    ));

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex-shrink-0 w-16 flex flex-col items-center gap-2 snap-start", onClick: () => vibrate(5) }, /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement(Avatar, {
      src: user.avatar,
      className: "w-14 h-14 rounded-full border border-white/10 object-cover shrink-0",
      fallbackSize: 24 }
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 shadow-lg" }, /*#__PURE__*/
    React.createElement("div", { className: "rqs-pill px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" }, user.rqs)
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-gray-300 font-medium truncate w-full text-center" }, user.handle)
    ));

};

// --- OVERLAY COMPONENTS ---

// MENU DRAWER (UPDATED PROFILE & CLOSE BUTTON)
const MenuDrawer = ({ isOpen, onClose, onLogout, userProfile }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (window.PullToRefresh) window.PullToRefresh.setEnabled(false);
    } else {
      document.body.style.overflow = '';
      if (window.PullToRefresh) window.PullToRefresh.setEnabled(true);
    }
    return () => {
      document.body.style.overflow = '';
      if (window.PullToRefresh) window.PullToRefresh.setEnabled(true);
    };
  }, [isOpen]);

  return (/*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/

    React.createElement("div", {
      className: `fixed inset-0 z-40 bg-black/70 backdrop-blur-[8px] transition-opacity duration-300 ease-out touch-none ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`,

      onClick: onClose }
    ), /*#__PURE__*/


    React.createElement("div", {
      className: `fixed top-0 left-0 h-full z-50 w-[90%] md:w-[400px] bg-[#070A12]/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl transform transition-transform duration-[350ms] cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}` }, /*#__PURE__*/


    React.createElement("div", { className: "absolute top-0 left-0 w-full h-96 bg-neon/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" }), /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-0 right-0 w-full h-80 bg-indigo-900/10 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3 pointer-events-none" }), /*#__PURE__*/

    React.createElement("div", { className: "relative flex-1 flex flex-col overflow-y-auto no-scrollbar px-6 pt-safe pb-safe" }, /*#__PURE__*/


    React.createElement("div", { className: "flex justify-between items-center mt-6 mb-6" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-heading font-bold tracking-[0.2em] text-muted uppercase" }, "Menu"), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-3 -mr-3 text-muted active:text-white transition-colors active:scale-95 touch-manipulation" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 26 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative rounded-2xl p-5 mb-8 overflow-hidden group shrink-0 active:scale-[0.99] transition-transform duration-200 cursor-pointer", onClick: () => window.location.href = 'PRIVATE OWNER PROFILE.HTML' },
    userProfile.banner_url ? /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0" }, /*#__PURE__*/React.createElement("img", { src: userProfile.banner_url, alt: "Banner", className: "w-full h-full object-cover" }), /*#__PURE__*/React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-black/70 to-black/50" })) : /*#__PURE__*/

    React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-[#0F1627] to-[#1a2332]" }), /*#__PURE__*/




    React.createElement("div", { className: "relative z-10 flex flex-col items-start" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-start justify-between w-full mb-4" }, /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute -inset-1.5 rounded-full border border-neon/30 animate-pulse-slow" }), /*#__PURE__*/
    React.createElement("div", { className: "w-[68px] h-[68px] rounded-full bg-gray-800 border-2 border-[#0F1627] flex items-center justify-center relative z-10 overflow-hidden" }, /*#__PURE__*/
    React.createElement(Avatar, {
      src: userProfile.avatar_url,
      className: "w-full h-full object-cover",
      fallbackSize: 32 }
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-neon/30 rounded-full shadow-[0_0_10px_rgba(47,139,255,0.15)]" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Shield", size: 14, className: "text-neon" }), /*#__PURE__*/
    React.createElement("span", { className: "text-cyan-100 text-[11px] font-heading font-bold tracking-wider uppercase" }, "RQS ", userProfile.rqs)
    )
    ), /*#__PURE__*/

    React.createElement("h2", { className: "text-white font-heading font-bold text-xl tracking-wide mb-0.5" }, userProfile.full_name), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm font-medium" }, "@", userProfile.username)
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 space-y-8" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] font-bold text-muted uppercase tracking-widest mb-3 px-2" }, "Settings"), /*#__PURE__*/
    React.createElement("div", { className: "space-y-3" }, /*#__PURE__*/
    React.createElement(MenuItem, { icon: "Bookmark", label: "Bookmarks", onClick: () => {window.location.href = 'BOOKMARKS.HTML';} }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "Moon", label: "Appearance", subLabel: "PlusOpinion Midnight", hasAction: true, onClick: () => {} }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "Shield", label: "Privacy Policy", onClick: () => {} }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "FileText", label: "Terms & Conditions", onClick: () => {} })
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" }), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] font-bold text-muted uppercase tracking-widest mb-3 px-2" }, "Support"), /*#__PURE__*/
    React.createElement("div", { className: "space-y-3" }, /*#__PURE__*/
    React.createElement(MenuItem, { icon: "LifeBuoy", label: "Support & Legal", onClick: () => {} }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "HelpCircle", label: "Help Center", onClick: () => {} })
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-8 pt-6 border-t border-white/5 pb-8" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: onLogout,
      className: "w-full group relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition-all duration-300 active:bg-red-500/10 active:scale-[0.98] touch-manipulation" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between relative z-10" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "LogOut", size: 20, className: "text-red-400" }), /*#__PURE__*/
    React.createElement("span", { className: "text-red-400 font-medium tracking-wide text-base" }, "Log Out")
    ), /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-red-900/40" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-6 text-center" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted font-mono tracking-widest uppercase" }, "PlusOpinion Beta \u2022 v0.1.2"

    )
    )
    )

    )
    )
    ));

};

// LENS OVERLAY (UPDATED: Search Filtering)
// LENS OVERLAY (UPDATED: Server-Side Search & Engagement Sorting)
const LensOverlay = ({ isOpen, onClose, onRemove, onAddComment, onSave, onImageClick, onEdit, userProfile, savedPosts = new Set() }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('foryou');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  // Debounce Ref
  const searchTimeout = useRef(null);

  // Fetch Default Trending (High Engagement)
  useEffect(() => {
    if (isOpen && !searchQuery) {
      fetchTrending();
    }
  }, [isOpen, searchQuery]);

  const fetchTrending = async () => {
    setIsSearching(true);
    try {
      // Fetch top 15 posts sorted by agrees_count desc
      // We need to join profiles to get user info
      const { data, error } = await window.supabase.
      from('posts').
      select(`
                            *,
                            profiles (full_name, username, avatar_url, rqs_score, is_verified)
                        `).
      order('agrees_count', { ascending: false }).
      limit(15);

      if (error) throw error;
      if (data) setResults(transformPosts(data));
    } catch (e) {
      console.error("Error fetching trending:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchQuery.trim()) {
      if (isOpen) fetchTrending();
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const q = searchQuery.toLowerCase();
        // Search across multiple columns
        const { data, error } = await window.supabase.
        from('posts').
        select(`
                               *,
                               profiles (full_name, username, avatar_url, rqs_score, is_verified)
                           `).
        or(`text_content.ilike.%${q}%,product_name.ilike.%${q}%,category.ilike.%${q}%`).
        limit(20);

        if (error) throw error;
        setResults(data ? transformPosts(data) : []);
      } catch (e) {
        console.error("Search failed:", e);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, isOpen]);

  // Transform DB post to UI post
  const transformPosts = (rawPosts) => {
    return rawPosts.map((post) => ({
      id: post.id,
      name: post.profiles?.full_name || 'User',
      username: post.profiles?.username || 'user',
      avatar: post.profiles?.avatar_url || "",
      rqs: post.profiles?.rqs_score || 0,
      verified: post.is_verified_purchase === true || post.is_verified_purchase === null && !!post.media_url || post.profiles?.is_verified,
      category: post.category,
      product: post.product_name,
      text: post.text_content,
      media: post.media_url,
      media_type: post.media_type || 'image',
      images: post.images || null,
      time: formatTime(post.created_at),
      agrees: post.agrees_count || 0,
      comments: post.comments_count || 0,
      seenBy: post.seen_by_brand,
      user_id: post.user_id,
      profiles: post.profiles
    }));
  };

  return (/*#__PURE__*/
    React.createElement("div", {
      className: `fixed top-0 right-0 h-full z-50 w-full bg-[#020205] flex flex-col transition-transform duration-[350ms] cubic-bezier(0.19, 1, 0.22, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}` }, /*#__PURE__*/


    React.createElement("div", { className: "pt-6 pb-2 px-4 flex items-center gap-3 border-b border-white/5 bg-[#020205]/95 backdrop-blur-md sticky top-0 z-20 shadow-xl ptr-ignore" }, /*#__PURE__*/
    React.createElement("button", { onClick: () => {vibrate(5);onClose();}, className: "p-2 -ml-2 text-white/60 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronLeft", size: 24 })
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 relative" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-white" }, /*#__PURE__*/React.createElement(Icon, { icon: "Search", size: 18, className: "stroke-[2.5px] scale-110" })), /*#__PURE__*/
    React.createElement("input", {
      ref: inputRef,
      type: "text",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      placeholder: "Search opinions, products...",
      className: "w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon/50 transition-all shadow-inner",
      autoFocus: false }
    ),
    searchQuery && /*#__PURE__*/
    React.createElement("button", { onClick: () => setSearchQuery(''), className: "absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" }, /*#__PURE__*/React.createElement(Icon, { icon: "X", size: 14 }))

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#020205] ptr-ignore" },
    LENS_TOPICS.map((topic) => /*#__PURE__*/
    React.createElement("button", {
      key: topic.id,
      onClick: () => {vibrate(5);setActiveTopic(topic.id);},
      className: `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeTopic === topic.id ? 'bg-neon/10 border-neon text-neon shadow-[0_0_10px_rgba(47,139,255,0.2)]' : 'bg-white/5 border-white/5 text-muted hover:text-white'}` },

    topic.icon && /*#__PURE__*/React.createElement(Icon, { icon: topic.icon, size: 12 }),
    topic.label
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 overflow-y-auto no-scrollbar bg-[#020205] pb-24 ptr-enabled" },


    !searchQuery && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", { className: "px-4 py-6" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-[10px] font-bold text-muted uppercase tracking-widest mb-3 pl-1" }, "Quick Searches"), /*#__PURE__*/
    React.createElement("div", { className: "flex flex-wrap gap-2" },
    LENS_SEARCHES.map((tag) => /*#__PURE__*/
    React.createElement("button", { key: tag, className: "px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 hover:border-neon/50 hover:text-white transition-all active:scale-95", onClick: () => setSearchQuery(tag) }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Search", size: 10, className: "text-neon" }), " ", tag
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "px-4 mt-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center mb-4 px-1" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-bold text-white font-heading flex items-center gap-2" },
    isSearching ? /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", { className: "w-3 h-3 border-2 border-neon border-t-transparent rounded-full animate-spin" }), " Searching...") :

    searchQuery ? `Results for "${searchQuery}"` : '🔥 Top Engagement'

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-4" },
    results.length > 0 ?
    results.map((post, i) => /*#__PURE__*/
    React.createElement(Opinion, {
      key: post.id,
      post: post,
      index: i,
      userProfile: userProfile,
      isSaved: savedPosts.has(post.id),
      onComment: () => {},
      onShare: onShare,
      onMore: () => {},
      onSave: onSave,
      onAddComment: onAddComment,
      onImageClick: onImageClick,
      onRemove: onRemove,
      onEdit: onEdit,
      onBookmark: onSave }
    )
    ) :

    !isSearching && /*#__PURE__*/React.createElement("div", { className: "text-center py-12 text-muted" }, "No opinions found.")

    )
    )
    )
    ));

};

// OPINION MODAL (Composer)
// OPINION MODAL (Composer)
const OpinionModal = ({ isOpen, onClose, onPublished, userProfile, initialPost = null }) => {
  const [stage, setStage] = useState('IDLE');
  const [text, setText] = useState('');
  const [tagName, setTagName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [mediaFiles, setMediaFiles] = useState([]); // Store actual file URLs
  const fileInputRef = useRef(null);
  const verificationInputRef = useRef(null); // Ref for verification proof upload
  const [draftId, setDraftId] = useState(null); // ID if editing existing draft
  const [mentionQuery, setMentionQuery] = useState(null);

  const PREDEFINED_CATEGORIES = ['Electronics', 'Automotive', 'Software', 'Fashion', 'Tech', 'Food', 'Gaming', 'Lifestyle', 'Fitness', 'Beauty & Skin Care', 'Other'];

  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });

  // Helper to get caret coordinates inside a textarea
  const getCaretCoordinates = (element, position) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    const properties = [
    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'stretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
    'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'];

    properties.forEach((prop) => {div.style[prop] = style[prop];});
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.top = '0';
    div.style.left = '-9999px';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    const coordinates = {
      top: span.offsetTop + parseInt(style.borderTopWidth),
      left: span.offsetLeft + parseInt(style.borderLeftWidth)
    };
    document.body.removeChild(div);
    return coordinates;
  };

  useEffect(() => {
    if (isOpen) {
      setStage('WRITE');

      // FETCH CATEGORIES DYNAMICALLY for tagging
      window.getCategories().then((cats) => {
        // Fallback structure if API fails or returns object
        const catList = Array.isArray(cats) ? cats : [];
        window.allCategories = catList; // Cache locally
      }).catch((err) => console.error("Error fetching categories for composer", err));

      if (initialPost) {
        // EDIT MODE
        setDraftId(initialPost.id); // Reuse draftId as the post ID for update
        setText(initialPost.text || '');
        setTagName(initialPost.product || '');
        setSelectedCategory(initialPost.category || '');
        if (initialPost.product) setShowTagInput(true);

        if (initialPost.media) {
          setMediaFiles([{ url: initialPost.media, type: initialPost.media_type === 'video' ? 'video/mp4' : 'image/jpeg' }]);
          setMediaCount(1);
        } else {
          setMediaFiles([]);
          setMediaCount(0);
        }
      }
      // Check for draft to edit (only if not editing existing post)
      else {
        const draftToEdit = localStorage.getItem('plusopinion_draft_edit');
        if (draftToEdit) {
          try {
            const draft = JSON.parse(draftToEdit);
            setDraftId(draft.id);
            setText(draft.text_content || draft.text || '');
            setTagName(draft.product_name || draft.product || '');
            setSelectedCategory(draft.category || '');
            if (draft.product_name || draft.product) setShowTagInput(true);
            localStorage.removeItem('plusopinion_draft_edit');
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft loaded', icon: 'Edit2', isSuccess: true } }));
          } catch (e) {console.error("Error parsing draft", e);}
        } else {
          // Reset for new post
          setDraftId(null);
          setText('');
          setTagName('');
          setSelectedCategory('');
          setShowTagInput(false);
          setMediaCount(0);
          setMediaFiles([]);
        }

      }

    } else {
      setStage('IDLE');
    }
  }, [isOpen]);

  const MIN_CHARS = 20;
  const MAX_CHARS = 200;
  const canPublish = text.length >= MIN_CHARS && text.length <= MAX_CHARS;

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) setText(val);

    // Mention logic
    const cursor = e.target.selectionStart;
    const atMatch = val.substring(0, cursor).match(/@([\w.]*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      // Calculate coordinates for caret following
      const coords = getCaretCoordinates(e.target, cursor);
      setMentionCoords(coords);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (user) => {
    const textarea = document.querySelector('textarea[placeholder*="mention"]');
    const cursor = textarea?.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursor);
    const textAfterCursor = text.substring(cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const newTextBefore = textBeforeCursor.substring(0, atIndex) + '@' + user.username + ' ';
      setText(newTextBefore + textAfterCursor);
      setMentionQuery(null);
      // Reset cursor position after React update
      setTimeout(() => {
        if (textarea) {
          const newPos = newTextBefore.length;
          textarea.focus();
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleTagToggle = () => {
    if (!showTagInput) {
      // Open category selector first
      setShowTagInput(true);
    } else {
      setShowTagInput(false);
    }
  };

  const selectCategory = (cat) => {
    const categoryName = typeof cat === 'object' ? cat.name : cat;
    setSelectedCategory(categoryName);
    // After selecting category, user can type product
  };


  const MAX_IMAGES = 4;
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const hasVideo = mediaFiles.some((f) => f.type?.startsWith('video/'));
  const hasImages = mediaFiles.some((f) => !f.type?.startsWith('video/'));

  // Handle multi-image selection (up to 4, images only)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (hasVideo) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Remove the video before adding images', icon: 'AlertTriangle', isSuccess: false } }));
      e.target.value = '';
      return;
    }
    const remaining = MAX_IMAGES - mediaFiles.filter((f) => !f.type?.startsWith('video/')).length;
    if (files.length > remaining) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Max ${MAX_IMAGES} images. ${remaining} slot(s) remaining.`, icon: 'AlertTriangle', isSuccess: false } }));
    }
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: `${file.name} is too large. Max 5MB per image.`, icon: 'AlertTriangle', isSuccess: false } }));
        return;
      }
      const url = URL.createObjectURL(file);
      setMediaFiles((prev) => [...prev, { url, file, type: file.type }]);
      setMediaCount((prev) => prev + 1);
    });
    e.target.value = '';
  };

  // Handle single video selection (no images allowed when video is set)
  const handleVideoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (hasImages) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Remove all images before adding a video', icon: 'AlertTriangle', isSuccess: false } }));
        e.target.value = '';
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Video too large. Max 20MB', icon: 'AlertTriangle', isSuccess: false } }));
        e.target.value = '';
        return;
      }
      // Replace any existing video (only 1 allowed)
      const url = URL.createObjectURL(file);
      setMediaFiles([{ url, file, type: file.type }]);
      setMediaCount(1);
    }
    e.target.value = '';
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaCount((prev) => prev - 1);
  };

  const handleVerificationFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      finishPublishing(true, e.target.files[0]);
    }
  };

  const handlePublish = () => {vibrate(10);setStage('VERIFY');};

  const finishPublishing = async (isVerified, verificationFile = null) => {
    vibrate(5);
    setStage('SUBMITTING');

    const mediaItem = mediaFiles.length > 0 ? mediaFiles[0] : null;

    try {
      // Upload verification proof if exists
      let proofUrl = initialPost?.verification_proof_url || null; // PRESERVE EXISTING
      if (isVerified && verificationFile) {
        try {
          proofUrl = await window.uploadVerificationProof(verificationFile);
        } catch (uploadError) {
          console.error("Verification upload failed", uploadError);
          // Proceed without proof? or fail? Let's proceed but maybe warn.
        }
      }

      // ── Upload Media ──────────────────────────────────
      const imageItems = mediaFiles.filter((f) => !f.type?.startsWith('video/'));
      const videoItem = mediaFiles.find((f) => f.type?.startsWith('video/'));

      let mediaUrl = null;
      let mediaType = null;
      let imagesArray = null;

      if (videoItem) {
        // Single video
        mediaType = 'video';
        if (videoItem.file) {
          try {mediaUrl = await window.uploadMedia(videoItem.file);}
          catch (err) {throw new Error('Video upload failed: ' + err.message);}
        } else if (initialPost?.media) {
          mediaUrl = initialPost.media;
        }
      } else if (imageItems.length > 0) {
        // Multiple images → upload all, save to images[]
        mediaType = 'image';
        const uploadedUrls = [];
        for (const imgItem of imageItems) {
          if (imgItem.file) {
            try {uploadedUrls.push(await window.uploadMedia(imgItem.file));}
            catch (err) {throw new Error('Image upload failed: ' + err.message);}
          } else {
            uploadedUrls.push(imgItem.url); // Existing URL (edit mode)
          }
        }
        if (uploadedUrls.length === 1) {
          // Single image — use legacy media_url for backward compat
          mediaUrl = uploadedUrls[0];
        } else {
          // Multiple images — save to images array
          imagesArray = uploadedUrls;
          mediaUrl = uploadedUrls[0]; // Keep first as fallback
        }
      } else if (initialPost?.media) {
        // Preserve existing media when editing with no new upload
        mediaUrl = initialPost.media;
        mediaType = initialPost.media_type || 'image';
        imagesArray = initialPost.images || null;
      }

      const postData = {
        text_content: text,
        product_name: tagName || "General",
        category: selectedCategory || "Category",
        is_verified_purchase: isVerified,
        verification_proof_url: proofUrl,
        media_url: mediaUrl,
        media_type: mediaType,
        images: imagesArray,
        is_draft: false
      };

      if (initialPost) {
        // UPDATE EXISTING POST
        // Check if it's an edit of a published post (not draft)
        if (!initialPost.is_draft) {
          postData.is_edited = true;
        }
        const updatedPost = await window.updatePost(initialPost.id, postData);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion Updated!', icon: 'Check', isSuccess: true } }));
        if (onPublished) onPublished(updatedPost, true);
      } else if (draftId) {
        // Update existing draft to published
        const updatedPost = await window.updatePost(draftId, postData);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft Published!', icon: 'Check', isSuccess: true } }));
        if (onPublished) onPublished(updatedPost, false);
      } else {
        // Create new post
        const newPost = await window.createPost(postData);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion Published!', icon: 'Zap', isSuccess: true } }));
        if (onPublished) onPublished(newPost, false);
      }

      onClose();

    } catch (e) {
      console.error("Publishing failed, resetting stage:", e);
      setStage('WRITE'); // Go back to editing on error
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Publishing failed: ' + e.message, icon: 'AlertTriangle', isSuccess: false } }));
    }
  };

  const handleSaveDraft = async () => {
    if (initialPost) return; // Cannot save existing post as draft
    if (!text.trim()) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft is empty', icon: 'AlertTriangle', isSuccess: false } }));
      return;
    }

    vibrate(5);

    try {
      const draftData = {
        text_content: text,
        product_name: tagName || "General",
        category: selectedCategory || "Draft",
        is_draft: true
      };

      if (draftId) {
        await window.updatePost(draftId, draftData);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft Updated', icon: 'Save', isSuccess: true } }));
      } else {
        const newPost = await window.createPost(draftData);
        setDraftId(newPost.id); // Set ID so subsequent saves update it
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft Saved', icon: 'Save', isSuccess: true } }));
      }
      // Don't close, allow continuing to edit
    } catch (e) {
      console.error("Saving draft failed", e);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to save draft', icon: 'AlertTriangle', isSuccess: false } }));
    }
  };

  if (!isOpen) return null;

  return (/*#__PURE__*/
    React.createElement("div", { className: `absolute inset-0 z-40 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` }, /*#__PURE__*/
    React.createElement("div", { className: `w-full max-w-sm bg-[#0A0F1D] border border-[#2f8bff]/20 rounded-[24px] shadow-2xl overflow-visible flex flex-col relative transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`, style: { height: '580px' } }, /*#__PURE__*/
    React.createElement("div", { className: "px-6 pt-6 pb-2 flex justify-between items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" },
    stage === 'VERIFY' && /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {vibrate(5);setStage('WRITE');},
      className: "p-1 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "ArrowLeft", size: 24 })
    ), /*#__PURE__*/

    React.createElement("h2", { className: "text-xl font-heading font-bold text-white tracking-wide" }, initialPost ? 'Edit Opinion' : 'Draft Opinion')
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleSaveDraft, className: "text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded tracking-widest border border-white/10 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1" }, /*#__PURE__*/React.createElement(Icon, { icon: "Save", size: 10 }), " SAVE DRAFT")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 flex flex-col relative overflow-visible" },
    stage === 'WRITE' && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", { className: "flex-1 px-6 py-2 relative" }, /*#__PURE__*/
    React.createElement(MentionAutocomplete, { query: mentionQuery, onSelect: handleMentionSelect, direction: "down", coords: mentionCoords }), /*#__PURE__*/
    React.createElement("textarea", { value: text, onChange: handleTextChange, placeholder: "Share, what's your opinion or type @ to mention...", className: "w-full h-full bg-transparent text-lg text-white placeholder-slate-600 outline-none resize-none font-light leading-relaxed custom-scrollbar pb-6", autoFocus: false }), /*#__PURE__*/
    React.createElement("div", { className: `absolute bottom-2 right-6 text-[10px] font-medium transition-colors ${text.length < MIN_CHARS || text.length === MAX_CHARS ? 'text-neon' : 'text-slate-600'}` }, text.length, " / ", MAX_CHARS)
    ), /*#__PURE__*/
    React.createElement("div", { className: "px-6 pb-2" },
    (tagName || selectedCategory) && !showTagInput && /*#__PURE__*/
    React.createElement("div", { className: "inline-flex items-center gap-2 mb-3 bg-[#2f8bff]/10 border border-[#2f8bff]/20 px-3 py-1.5 rounded-lg text-[#2f8bff] text-sm animate-fade-in" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Tag", size: 14, className: "fill-current" }), /*#__PURE__*/
    React.createElement("span", null, selectedCategory ? `${selectedCategory}` : '', " ", tagName ? `/ ${tagName}` : ''), /*#__PURE__*/
    React.createElement("button", { onClick: () => {setTagName('');setSelectedCategory('');setShowTagInput(true);} }, /*#__PURE__*/React.createElement(Icon, { icon: "X", size: 12 }))
    ),


    !showTagInput && !tagName && !selectedCategory && /*#__PURE__*/
    React.createElement("button", { onClick: handleTagToggle, className: "text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 py-2" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Tag", size: 16 }), " Tag Category & Product"
    ),

    showTagInput && /*#__PURE__*/
    React.createElement("div", { className: "bg-[#161922] rounded-xl p-4 border border-white/10 animate-fade-in mb-3 shadow-2xl relative" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center mb-3" }, /*#__PURE__*/
    React.createElement("h4", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-widest" }, "Select Category"), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setShowTagInput(false),
      className: "text-white/40 hover:text-white" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "X", size: 14 })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "mb-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-wrap gap-2 max-h-[100px] overflow-y-auto no-scrollbar" },
    [
    'Automotive', 'Beauty & Skin Care', 'Education', 'Electronics', 'Fashion',
    'Finance', 'Fitness', 'Food & Bev', 'Gaming', 'Health',
    'Home', 'Office', 'Personal Care', 'Pets',
    'Science', 'Sports', 'Technology', 'Travel', 'Others'].
    sort().map((cat) => /*#__PURE__*/
    React.createElement("button", {
      key: cat,
      onClick: () => selectCategory(cat),
      className: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${selectedCategory === cat ? 'bg-neon/20 border-neon text-neon' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}` },

    cat
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-3 relative pt-2" }, /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }, /*#__PURE__*/React.createElement(Icon, { icon: "Grid", size: 14 })), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      value: selectedCategory,
      onChange: (e) => setSelectedCategory(e.target.value),
      onKeyDown: (e) => e.key === 'Enter' && setShowTagInput(false),
      placeholder: "Or type custom category...",
      className: "w-full bg-[#0A0F1D] border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white focus:border-neon/50 outline-none transition-all placeholder-white/20" }
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => {vibrate(5);setShowTagInput(false);},
      className: "absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon hover:bg-neon/10 rounded-lg transition-colors border border-neon/20",
      title: "Finalize Tag" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "CornerDownLeft", size: 16 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }, /*#__PURE__*/React.createElement(Icon, { icon: "Tag", size: 14 })), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      value: tagName,
      onChange: (e) => setTagName(e.target.value),
      onKeyDown: (e) => e.key === 'Enter' && setShowTagInput(false),
      placeholder: "Brand/Model Name",
      className: "w-full bg-[#0A0F1D] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white focus:border-neon/50 outline-none transition-all placeholder-white/20" }
    )
    )
    )
    ),

    mediaFiles.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "flex gap-2 mb-3 overflow-x-auto" },
    mediaFiles.map((src, i) => /*#__PURE__*/
    React.createElement("div", { key: i, className: "w-16 h-16 bg-slate-800 rounded-lg border border-white/10 flex-shrink-0 animate-pop relative overflow-hidden group" },
    src.type?.startsWith('video') ? /*#__PURE__*/
    React.createElement("video", { src: src.url, className: "w-full h-full object-cover" }) : /*#__PURE__*/

    React.createElement("img", { src: src.url, className: "w-full h-full object-cover", alt: "attachment" }), /*#__PURE__*/

    React.createElement("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none" },
    src.type?.startsWith('video') && /*#__PURE__*/React.createElement(Icon, { icon: "Video", size: 16, className: "text-white drop-shadow-md" })
    ), /*#__PURE__*/
    React.createElement("button", { onClick: () => removeMedia(i), className: "absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors pointer-events-auto" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 10 })
    )
    )
    )
    ),

    !tagName && !selectedCategory && text.length > 0 && !showTagInput && /*#__PURE__*/React.createElement("div", { className: "text-[10px] text-slate-500 mb-2 font-medium" }, "Tag product for better reach")
    ), /*#__PURE__*/

    React.createElement("div", { className: "px-5 py-4 bg-[#020205]/50 border-t border-white/5 backdrop-blur-md flex justify-between items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3" }, /*#__PURE__*/
    React.createElement("button", { onClick: handleTagToggle, className: `p-2 rounded-full transition-all duration-300 ${tagName || showTagInput ? 'text-[#2f8bff] bg-[#2f8bff]/10' : 'text-[#2f8bff] hover:bg-white/10'}` }, /*#__PURE__*/React.createElement(Icon, { icon: "Tag", size: 20, className: `${tagName || showTagInput ? "fill-[#2f8bff]" : ""} stroke-current` })), /*#__PURE__*/


    React.createElement("input", { type: "file", ref: imageInputRef, className: "hidden", accept: "image/jpeg, image/png, image/webp, image/gif, image/heic, image/heif, image/*", multiple: "multiple", onChange: handleImageSelect }), /*#__PURE__*/
    React.createElement("input", { type: "file", ref: videoInputRef, className: "hidden", accept: "video/*", onChange: handleVideoSelect }), /*#__PURE__*/


    React.createElement("button", {
      onClick: () => imageInputRef.current?.click(),
      disabled: hasVideo || mediaFiles.filter((f) => !f.type?.startsWith('video/')).length >= MAX_IMAGES,
      className: `p-2 rounded-full transition-colors flex items-center gap-1 ${hasVideo || mediaFiles.filter((f) => !f.type?.startsWith('video/')).length >= MAX_IMAGES ?
      'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`,

      title: hasVideo ? 'Remove video first' : `Add images (${mediaFiles.filter((f) => !f.type?.startsWith('video/')).length}/${MAX_IMAGES})` }, /*#__PURE__*/

    React.createElement(Icon, { icon: "Image", size: 18 }),
    mediaFiles.filter((f) => !f.type?.startsWith('video/')).length > 0 && /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] font-bold text-neon" }, mediaFiles.filter((f) => !f.type?.startsWith('video/')).length)

    ), /*#__PURE__*/


    React.createElement("button", {
      onClick: () => videoInputRef.current?.click(),
      disabled: hasImages || hasVideo,
      className: `p-2 rounded-full transition-colors ${hasImages || hasVideo ?
      'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`,

      title: hasImages ? 'Remove images first' : hasVideo ? '1 video selected' : 'Add video' }, /*#__PURE__*/

    React.createElement(Icon, { icon: "Video", size: 18 })
    )
    ), /*#__PURE__*/
    React.createElement("button", { disabled: !canPublish, onClick: handlePublish, className: `px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${canPublish ? 'bg-white text-black hover:scale-105 shadow-lg shadow-white/10' : 'bg-white/10 text-white/30 cursor-not-allowed'}` }, "Publish")
    )
    ),

    stage === 'VERIFY' && /*#__PURE__*/
    React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in relative" }, /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-16 rounded-full bg-[#2f8bff]/10 flex items-center justify-center mb-6 text-[#2f8bff] border border-[#2f8bff]/20" }, /*#__PURE__*/React.createElement(Icon, { icon: "ShieldCheck", size: 36 })), /*#__PURE__*/
    React.createElement("h3", { className: "text-xl font-heading font-bold text-white mb-3" }, "Verify Authenticity"), /*#__PURE__*/
    React.createElement("p", { className: "text-sm text-slate-400 mb-8 leading-relaxed font-light px-2" }, "To maintain community trust, we verify ownership. Attaching a receipt or screenshot significantly improves your ", /*#__PURE__*/React.createElement("span", { className: "text-white font-medium" }, "Reputation Quality Score (RQS)"), "."), /*#__PURE__*/

    React.createElement("input", { type: "file", ref: verificationInputRef, className: "hidden", accept: "image/*,application/pdf", onChange: handleVerificationFileSelect }), /*#__PURE__*/

    React.createElement("button", { onClick: () => verificationInputRef.current?.click(), className: "w-full py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white mb-4 hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 group" }, /*#__PURE__*/React.createElement(Icon, { icon: "Upload", size: 18, className: "group-hover:-translate-y-1 transition-transform" }), " ", /*#__PURE__*/React.createElement("span", null, "Upload Purchase Proof")), /*#__PURE__*/
    React.createElement("button", { onClick: () => finishPublishing(false), className: "text-xs text-slate-500 hover:text-white transition-colors tracking-wide" }, "Skip Verification")
    ),

    stage === 'SUBMITTING' && /*#__PURE__*/
    React.createElement("div", { className: "flex-1 flex flex-col items-start justify-center p-8 animate-fade-in bg-[#0A0F1D] w-full" }, /*#__PURE__*/
    React.createElement("div", { className: "font-sans text-sm space-y-4 w-full pl-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 text-slate-300" }, /*#__PURE__*/React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#6BFFB6]" }), " Uploading photo..."), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 text-slate-300 animate-fade-in", style: { animationDelay: '0.8s' } }, /*#__PURE__*/React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#6BFFB6]" }), " Almost there..."), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 text-slate-300 animate-fade-in", style: { animationDelay: '1.8s' } }, /*#__PURE__*/React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#6BFFB6]" }), " Done."), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 text-white font-bold animate-pulse", style: { animationDelay: '2.5s' } }, /*#__PURE__*/React.createElement("span", { className: "text-[#2f8bff]" }, "\u2192"), " Publishing...")
    ), /*#__PURE__*/
    React.createElement("div", { className: "w-full bg-slate-800 h-1 mt-10 rounded-full overflow-hidden" }, /*#__PURE__*/React.createElement("div", { className: "h-full bg-[#2f8bff] w-full transition-transform duration-[2000ms] ease-linear origin-left scale-x-0 animate-[shimmer_2s_linear_forwards]", style: { transform: 'scaleX(1)' } }))
    )

    )
    )
    ));

};

// SHARE MODAL (New Visual Interface)
const ShareModal = ({ isOpen, onClose, post }) => {
  if (!isOpen || !post) return null;

  const shareUrl = `https://plusopinion.com/post/${post.id}`;
  const shareText = `Check out this opinion by @${post.username}`;

  const handleCopy = async () => {
    try {
      const cleanText = `Check out this opinion on PlusOpinion:\n\n"${post.text ? post.text.substring(0, 100) + '...' : ''}"\n\nRead more at: ${shareUrl}`;
      await navigator.clipboard.writeText(cleanText);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link & Preview copied', icon: 'Link', isSuccess: true } }));
      if (window.trackShare) window.trackShare(post.id);
      onClose();
    } catch (err) {console.error(err);}
  };

  const handleWhatsApp = () => {
    const waText = `🔥 *New Opinion on PlusOpinion!*\n\n"@${post.username}: ${post.text ? post.text.substring(0, 80) : ''}..."\n\nRead full POV here:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
    if (window.trackShare) window.trackShare(post.id);
    onClose();
  };

  const handleInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Top Opinion', text: shareText, url: shareUrl });
        if (window.trackShare) window.trackShare(post.id);
        onClose();
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link copied! Open Instagram to share.', icon: 'Instagram', isSuccess: true } }));
      if (window.trackShare) window.trackShare(post.id);
      setTimeout(() => {window.open('https://instagram.com', '_blank');}, 1000);
      onClose();
    }
  };

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PlusOpinion', text: shareText, url: shareUrl });
        if (window.trackShare) window.trackShare(post.id);
        onClose();
      } catch (err) {}
    } else {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Web Share not supported', icon: 'AlertTriangle', isSuccess: false } }));
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[60] flex items-end justify-center sm:px-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in", onClick: onClose }), /*#__PURE__*/
    React.createElement("div", { className: "relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col" }, /*#__PURE__*/

    React.createElement("div", { className: "w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" }), /*#__PURE__*/

    React.createElement("div", { className: "flex justify-between items-center mb-6 shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "text-white font-heading font-bold text-lg" }, "Share Opinion"), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 20 })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "glass-panel rounded-2xl p-5 mb-6 border border-white/5 relative overflow-hidden group flex flex-col animate-fade-in" }, /*#__PURE__*/

    React.createElement("div", { className: "absolute top-5 right-5 w-12 h-12 rounded-full border border-white/20 shadow-[0_0_25px_rgba(0,0,0,0.6)] overflow-hidden z-20 bg-[#121212] flex items-center justify-center" }, /*#__PURE__*/
    React.createElement("img", { src: "icon-192.png", className: "w-full h-full object-cover", alt: "PlusOpinion Logo" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex justify-between items-start mb-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 w-full" }, /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement("img", { src: post.avatar || DEFAULT_AVATAR, className: "w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" }),
    post.verified && /*#__PURE__*/
    React.createElement("div", { className: "absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-[#121212]" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Check", size: 8, className: "text-white" })
    )

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 min-w-0 pr-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-white text-sm truncate" }, post.name), /*#__PURE__*/
    React.createElement("div", { className: "rqs-pill px-2 py-0.5 rounded-full flex items-center shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-[9px] text-white tracking-wide" }, "RQS ", post.rqs)
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-xs text-muted truncate" }, "@", post.username)
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center flex-wrap gap-2 mb-3 mt-1" }, /*#__PURE__*/
    React.createElement("div", { className: "border border-white/10 rounded-full px-3 py-1 flex items-center bg-white/5 text-[10px] text-white/80 font-medium whitespace-nowrap overflow-hidden max-w-full" }, /*#__PURE__*/
    React.createElement("span", { className: "text-neon truncate" }, post.category || 'Others'), /*#__PURE__*/
    React.createElement("span", { className: "mx-1.5 opacity-30" }, "|"), /*#__PURE__*/
    React.createElement("span", { className: "truncate" }, "plus opinion")
    )
    ), /*#__PURE__*/

    React.createElement("p", { className: "text-sm text-gray-200 leading-relaxed mb-3 font-light line-clamp-3" }, post.text),

    post.media && /*#__PURE__*/
    React.createElement("div", { className: "w-full rounded-xl mb-3 border border-white/5 relative bg-black/20 overflow-hidden" },
    post.media_type === 'video' ? /*#__PURE__*/
    React.createElement("div", { className: "w-full h-40 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement("video", { src: post.media, className: "w-full h-full object-cover opacity-60" }), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement("div", { className: "p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Video", size: 20, className: "text-white" })
    )
    )
    ) : /*#__PURE__*/

    React.createElement("img", { src: post.media, className: "w-full h-auto max-h-40 object-cover opacity-90" })

    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between pt-3 mt-1 border-t border-white/5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5 text-muted hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ThumbsUp", size: 18 }), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-medium" }, post.agrees || 0)
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5 text-muted hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "MessageCircle", size: 18 }), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-medium" }, post.comments || 0)
    )
    ),

    post.seenBy && /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] text-neon/80 font-medium tracking-wide bg-neon/5 px-2 py-0.5 rounded border border-neon/10 flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-1 h-1 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]" }), "Seen by ",
    post.seenBy
    )

    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-end mt-3 text-[9px] text-muted/40 font-medium uppercase tracking-widest" }, /*#__PURE__*/
    React.createElement("div", { className: "text-white/20 font-bold" }, "PLUSOPINION.COM")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-4 gap-4 mb-4" }, /*#__PURE__*/
    React.createElement("button", { onClick: handleCopy, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Link", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-muted" }, "Copy Link")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleWhatsApp, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "WhatsApp", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-muted" }, "WhatsApp")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleInstagram, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Instagram", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-muted" }, "Instagram")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleMore, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "MoreHorizontal", size: 24, className: "text-blue-400" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-muted" }, "More")
    )
    )
    )
    ));

};

// REPORT MODAL (2-Step Flow)
const ReportModal = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState(null);

  const REASONS = [
  "Fake or suspicious opinion",
  "Manipulating sentiments",
  "Unnecessary criticism",
  "Breach of privacy",
  "Spam",
  "Illegal category or business",
  "Fake media",
  "False information",
  "Something else is wrong"];


  useEffect(() => {
    if (isOpen) {setStep(1);setReason(null);}
  }, [isOpen]);

  const handleReasonSelect = (r) => {
    setReason(r);
    setStep(2);
    vibrate(10);
  };

  const handleAction = (action) => {
    onSubmit(reason, action); // action: 'keep' or 'remove'
  };

  if (!isOpen) return null;

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[60] flex items-center justify-center px-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in", onClick: onClose }), /*#__PURE__*/
    React.createElement("div", { className: "relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scale-up" }, /*#__PURE__*/


    React.createElement("div", { className: "p-4 border-b border-white/5 flex items-center justify-between bg-[#1A1A1A]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-white flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "AlertTriangle", size: 18, className: "text-red-500" }), "Report Opinion"

    ), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "text-white/40 hover:text-white" }, /*#__PURE__*/React.createElement(Icon, { icon: "X", size: 20 }))
    ), /*#__PURE__*/


    React.createElement("div", { className: "p-4" },
    step === 1 ? /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("p", { className: "text-sm text-gray-400 mb-4 px-1" }, "Why are you reporting this opinion? Please select a reason."), /*#__PURE__*/
    React.createElement("div", { className: "space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar" },
    REASONS.map((r, i) => /*#__PURE__*/
    React.createElement("button", {
      key: i,
      onClick: () => handleReasonSelect(r),
      className: "w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/90 transition-all active:scale-[0.98] border border-transparent hover:border-white/5" },

    r
    )
    )
    )
    ) : /*#__PURE__*/

    React.createElement("div", { className: "text-center py-4" }, /*#__PURE__*/
    React.createElement("div", { className: "w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-3" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Check", size: 24 })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-white font-bold text-lg mb-2" }, "Thanks for letting us know"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-gray-400 mb-6 max-w-[250px] mx-auto leading-relaxed" }, "We use these reports to make PlusOpinion safer. We will review this post shortly."

    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-3" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => handleAction('remove'),
      className: "w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all" },
    "Remove this post from my feed"

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => handleAction('keep'),
      className: "w-full py-3.5 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all" },
    "Keep this post on feed"

    )
    )
    )

    )
    )
    ));

};

// --- HELPER COMPONENTS FOR NOTIFICATIONS ---
const getNotificationContent = (dbNotif) => {
  const metadata = dbNotif.metadata || {};
  const actorName = metadata.actor_name || 'Someone';
  const productName = metadata.product_name || metadata.item_name || '';
  const commentPreview = metadata.comment_preview || '';
  const postPreview = metadata.post_preview || '';

  // 1. REVENUE NOTIFICATIONS
  if (dbNotif.category === 'revenue' || dbNotif.type === 'revenue_credit') {
    return {
      title: 'Wallet Credited',
      message: `You earned ₹${metadata.amount || '0'} for your review on '${productName}'.`,
      tag: `+ ₹${metadata.amount || '0'}`
    };
  }

  // 2. SYSTEM NOTIFICATIONS (RQS, etc.)
  if (dbNotif.type === 'rqs_updated' || dbNotif.title?.includes('RQS')) {
    return {
      title: 'RQS Level Up',
      message: `Your score increased to ${metadata.new_score || '0'}. You are now Level ${metadata.level || '1'}.`,
      tag: `Level ${metadata.level || '1'}`
    };
  }

  // 3. USER INTERACTION: "Siddharth commented on your review"
  const type = (dbNotif.type || '').toLowerCase();
  const category = (dbNotif.category || '').toLowerCase();

  const isUserInteraction = () => {
    const types = ['post_liked', 'post_agreed', 'post_commented', 'comment_replied', 'comment_liked', 'mention', 'follow', 'post_bookmarked', 'comment', 'reply', 'agree', 'like', 'saved'];
    return types.includes(type) || category === 'interaction' || category === 'social';
  };

  if (isUserInteraction()) {
    // Comment/Reply: "Someone commented"
    if (type === 'post_commented' || type === 'comment_replied' || type === 'comment' || type === 'reply') {
      const isReply = type === 'comment_replied' || type === 'reply';
      const title = actorName ? `${actorName} ${isReply ? 'replied' : 'commented'}` : isReply ? 'New Reply' : 'New Comment';
      let message = isReply ?
      productName ? `Replied to your comment on '${productName}'` : 'Replied to your comment' :
      productName ? `Commented on your review of '${productName}'` : 'Commented on your opinion';
      if (commentPreview) message += `: "${commentPreview}"`;
      return { title, message };
    }

    // Agreement/Like: "Priya Sharma agreed"
    if (type === 'post_liked' || type === 'post_agreed' || type === 'agree' || type === 'like') {
      const title = actorName ? `${actorName} agreed` : 'New Agreement';
      const message = productName ?
      `Found your review on '${productName}' helpful.` :
      'Agreed with your opinion.';
      return { title, message };
    }

    // Like on comment: "Someone liked"
    if (type === 'comment_liked' || type === 'like_comment') {
      const title = actorName ? `${actorName} liked` : 'New Like';
      const message = productName ? `Liked your comment on '${productName}'` : 'Liked your comment';
      return { title, message };
    }

    // Bookmark/Save: "Someone saved"
    if (type === 'post_bookmarked' || type === 'saved') {
      const title = actorName ? `${actorName} saved` : 'Post Saved';
      const message = productName ? `Saved your review on '${productName}'` : 'Saved your opinion';
      return { title, message };
    }
  }

  // Default fallback
  return {
    title: dbNotif.title || 'Notification',
    message: dbNotif.message || dbNotif.desc || 'Interacted with your content.'
  };
};

const NotificationBookmarkItem = ({ data, onRemove }) => {
  const { title, message, tag } = getNotificationContent(data);
  const avatarUrl = data.metadata?.actor_avatar || DEFAULT_AVATAR;
  const actorId = data.related_user_id || data.metadata?.actor_id;

  const handleItemClick = () => {
    if (data.metadata?.type === 'message_bookmark') {
      // No redirect for message bookmarks, viewing only as requested
      return;
    }
    vibrate(10);
    window.location.href = `NOTIFICATION PANEL.HTML?highlight=${data.id}`;
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (actorId) {
      vibrate(5);
      window.location.href = `PUBLIC POV PROFILE.HTML?id=${actorId}`;
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", {
      className: "relative py-5 px-4 flex items-start gap-4 border-b border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer",
      onClick: handleItemClick }, /*#__PURE__*/

    React.createElement("div", {
      className: "shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10 hover:border-neon/50 transition-colors",
      onClick: handleAvatarClick }, /*#__PURE__*/

    React.createElement("img", {
      src: avatarUrl,
      className: "w-full h-full object-cover",
      onError: (e) => e.target.src = DEFAULT_AVATAR }
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 min-w-0 pt-0.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-start mb-1" }, /*#__PURE__*/
    React.createElement("h4", {
      className: `text-[15px] leading-tight group-hover:text-neon transition-colors cursor-pointer ${data.unread ? 'text-white font-bold' : 'text-slate-300 font-semibold'}`,
      onClick: handleAvatarClick },

    title
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "BookmarkFilled", size: 18, className: "text-neon fill-neon" })
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-[13px] text-slate-400 leading-relaxed line-clamp-2" }, message), /*#__PURE__*/
    React.createElement("div", { className: "mt-3 flex items-center justify-between" },
    tag ? /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold px-2.5 py-1 rounded bg-white/5 text-neon border border-neon/20" }, tag) : /*#__PURE__*/
    React.createElement("div", null), /*#__PURE__*/
    React.createElement("button", {
      onClick: (e) => {e.stopPropagation();onRemove(data.id);},
      className: "text-[11px] font-bold text-red-500/80 hover:text-red-500 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/5" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "Trash", size: 14 }), " REMOVE"
    )
    )
    )
    ));

};

const App = () => {

  const [sharedPostsToRender, setSharedPostsToRender] = useState({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [navVisible, setNavVisible] = useState(true);
  const [fabVisible, setFabVisible] = useState(true);




  // --- DATA STATE ---
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postComments, setPostComments] = useState({}); // { postId: ["comment1", "comment2"] }
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());
  const [hiddenItems, setHiddenItems] = useState({ posts: [], brands: [], categories: [] });
  const [removedPosts, setRemovedPosts] = useState(new Set());
  const [undoStack, setUndoStack] = useState([]); // [{type: 'remove', postId: 123}]
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // --- NOTIFICATIONS STATE ---
  const [bookmarkedNotifs, setBookmarkedNotifs] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [bookmarkTab, setBookmarkTab] = useState('opinions'); // 'opinions' | 'notifications'

  // --- UI STATES ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // --- EXPOSE TOGGLES GLOBALLY ---
  useEffect(() => {
    window.toggleSidebar = () => {vibrate(5);setIsMenuOpen((prev) => !prev);};
    window.toggleLens = () => {vibrate(5);setIsLensOpen((prev) => !prev);};
    return () => {
      delete window.toggleSidebar;
      delete window.toggleLens;
    };
  }, []);

  // Internal shortcuts
  const toggleSidebar = () => window.toggleSidebar();
  const toggleLens = () => window.toggleLens();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false); // Composer
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [viewingImage, setViewingImage] = useState(null); // Fullscreen image
  const [showOnboardingModal, setShowOnboardingModal] = useState(false); // Onboarding popup


  // Load posts helper (Professional Batch Loading)
  const loadPosts = async (currentOffset = 0, reset = false) => {
    if (isLoadingMore) return;

    try {
      if (reset) {
        setIsLoadingPosts(true);
        setOffset(0);
      } else {
        setIsLoadingMore(true);
      }

      const cacheKey = 'bookmarked_posts';

      // FETCH BOOKMARKS IN BATCHES
      const bookmarkedPosts = await window.getBookmarks({
        limit: 10,
        offset: reset ? 0 : currentOffset
      });

      if (!bookmarkedPosts || bookmarkedPosts.length === 0) {
        if (reset) {
          setPosts([]);
          setSavedPosts(new Set());
        }
        setHasMore(false);
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
        return;
      }

      if (bookmarkedPosts.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      const transformedPosts = bookmarkedPosts.map((post) => ({
        id: post.id,
        name: post.profiles?.full_name || 'User',
        username: post.profiles?.username || 'user',
        avatar: post.profiles?.avatar_url || "",
        rqs: post.profiles?.rqs_score || 0,
        verified: post.is_verified_purchase === true || post.is_verified_purchase === null && !!post.media_url || post.profiles?.is_verified,
        category: post.category,
        product: post.product_name,
        text: post.text_content,
        media: post.media_url,
        media_type: post.media_type || 'image',
        images: post.images || null,
        time: formatTime(post.created_at),
        agrees: post.agrees_count || 0,
        comments: post.comments_count || 0,
        seenBy: post.seen_by_brand,
        user_id: post.user_id
      }));

      setPosts((prev) => reset ? transformedPosts : [...prev, ...transformedPosts]);
      setSavedPosts((prev) => {
        const next = new Set(prev);
        transformedPosts.forEach((p) => next.add(String(p.id)));
        return next;
      });

      if (!reset) setOffset(currentOffset + 10);

      // SAVE TO CACHE (Only the first page for fast start)
      if (reset && window.StateManager) {
        await window.StateManager.set(cacheKey, transformedPosts, { ttl: 5 * 60 * 1000 });
      }

    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoadingPosts(false);
      setIsLoadingMore(false);
    }
  };

  const loadBookmarkedNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const user = await window.getCurrentUser();
      if (!user) return;

      // Fetch notifications with profile data
      const { data: notifs, error } = await window.supabase.
      from('notifications').
      select('*, profiles:related_user_id (id, full_name, username, avatar_url)').
      eq('user_id', user.id).
      contains('metadata', { is_bookmarked: true }).
      order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich metadata with profile data if missing
      const enriched = notifs.map((n) => {
        const profile = n.profiles;
        if (profile) {
          if (!n.metadata) n.metadata = {};
          if (!n.metadata.actor_name) n.metadata.actor_name = profile.full_name || profile.username;
          if (!n.metadata.actor_avatar) n.metadata.actor_avatar = profile.avatar_url;
          if (!n.metadata.actor_id) n.metadata.actor_id = profile.id;
        }
        return n;
      });

      // Fetch bookmarked messages from bookmarks table
      const { data: msgBookmarks, error: msgError } = await window.supabase.
      from('bookmarks').
      select(`
                            id, 
                            created_at, 
                            message_id, 
                            messages (
                                id, 
                                sender_id, 
                                conversation_id,
                                content,
                                content_iv,
                                conversations:conversation_id (
                                    participant_1_id,
                                    participant_2_id
                                )
                            )
                        `).
      eq('user_id', user.id).
      not('message_id', 'is', null).
      order('created_at', { ascending: false });

      if (msgError) console.error('Failed to load message bookmarks:', msgError);

      // Manually fetch profiles since foreign key from messages to profiles might not exist
      let profilesMap = {};
      const senderIds = [...new Set((msgBookmarks || []).map((b) => b.messages?.sender_id).filter(Boolean))];
      if (senderIds.length > 0) {
        const { data: profilesData } = await window.supabase.
        from('profiles').
        select('id, full_name, username, avatar_url').
        in('id', senderIds);
        (profilesData || []).forEach((p) => profilesMap[p.id] = p);
      }

      // Transform message bookmarks to look like notifications for the UI
      const transformedMsgs = await Promise.all((msgBookmarks || []).filter((b) => b.messages).map(async (b) => {
        const msg = b.messages;
        const profile = profilesMap[msg.sender_id] || {};

        let displayContent = msg.content || 'Message';
        try {
          // Wait for InboxCrypto if it's still loading (defer script)
          let crypto = window.InboxCrypto;
          if (!crypto) {
            await new Promise((r) => setTimeout(r, 100));
            crypto = window.InboxCrypto;
          }

          if (crypto && msg.content && msg.content_iv) {
            const conv = msg.conversations;
            const otherId = conv?.participant_1_id === user.id ? conv?.participant_2_id : conv?.participant_1_id;

            if (otherId) {
              const decrypted = await crypto.decryptFromUser(
                msg.content,
                msg.content_iv,
                user.id,
                otherId
              );
              if (decrypted) {
                try {
                  const parsed = JSON.parse(decrypted);
                  displayContent = parsed.text || decrypted;
                } catch (e) {
                  displayContent = decrypted;
                }
              }
            }
          } else if (msg.content && !msg.content_iv) {
            // Plaintext fallback
            try {
              const parsed = JSON.parse(msg.content);
              displayContent = parsed.text || msg.content;
            } catch (e) {
              displayContent = msg.content;
            }
          }
        } catch (e) {
          console.error("Decrypt error for bookmark", e);
          displayContent = "[Message encrypted — decryption failed]";
        }

        return {
          id: b.id,
          user_id: user.id,
          created_at: b.created_at,
          unread: false,
          related_user_id: profile.id,
          title: profile.full_name || profile.username || 'User',
          message: displayContent,
          tag: 'Message',
          metadata: {
            is_bookmarked: true,
            type: 'message_bookmark',
            message_id: msg.id,
            conversation_id: msg.conversation_id,
            actor_name: profile.full_name || profile.username,
            actor_avatar: profile.avatar_url,
            actor_id: profile.id
          }
        };
      }));

      // Combine and sort
      const combined = [...enriched, ...transformedMsgs].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
      );

      setBookmarkedNotifs(combined);
    } catch (err) {
      console.error('Failed to load bookmarked notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadBookmarkedNotifications();
    }
  }, [currentUser]);

  // Re-fetch on tab switch as a fallback
  useEffect(() => {
    if (bookmarkTab === 'notifications') {
      loadBookmarkedNotifications();
    }
  }, [bookmarkTab]);


  // Realtime Subscription
  useEffect(() => {
    if (!window.supabase) return;

    const channel = window.supabase.channel('public:plusopinion').
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
      if (payload.new.user_id !== (await window.getCurrentUser())?.id) {
        // Fetch full post to get profile info
        try {
          const fullPost = await window.getPost(payload.new.id);
          const uiPost = {
            id: fullPost.id,
            name: fullPost.profiles?.full_name || 'User',
            username: fullPost.profiles?.username || 'user',
            avatar: fullPost.profiles?.avatar_url || '',
            rqs: fullPost.profiles?.rqs_score || 0,
            rqs: fullPost.profiles?.rqs_score || 0,
            verified: fullPost.is_verified_purchase || fullPost.profiles?.is_verified || fullPost.is_verified_purchase === null && !!fullPost.media_url, // Support explicit flag + legacy fallback
            category: fullPost.category,
            product: fullPost.product_name,
            text: fullPost.text_content,
            media: fullPost.media_url,
            media_type: fullPost.media_type || 'image',
            images: fullPost.images || null,
            time: "Just now",
            agrees: 0,
            comments: 0,
            seenBy: null
          };
          setPosts((prev) => [uiPost, ...prev]);
          vibrate(5);
        } catch (e) {console.error('Realtime post fetch failed', e);}
      }
    }).
    on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(payload.old.id)));
    }).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload) => {
      setPosts((prev) => prev.map((p) => String(p.id) === String(payload.new.post_id) ? { ...p, agrees: p.agrees + 1 } : p));
    }).
    on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (payload) => {
      setPosts((prev) => prev.map((p) => String(p.id) === String(payload.old.post_id) ? { ...p, agrees: Math.max(0, p.agrees - 1) } : p));
    }).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
      const currentUser = await window.getCurrentUser();
      if (payload.new.user_id !== currentUser?.id) {
        setPosts((prev) => prev.map((p) => String(p.id) === String(payload.new.post_id) ? { ...p, comments: p.comments + 1 } : p));
      }
    }).
    subscribe();

    return () => {
      window.supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Notifications Real-time Subscription (Separated)
  useEffect(() => {
    if (!window.supabase) return;

    const notifChannel = window.supabase.channel('notif_bookmarks_realtime').
    on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications'
    }, (payload) => {
      // Check if the change is relevant to the current user
      const isRelevant =
      payload.new && payload.new.user_id === currentUser?.id ||
      payload.old && payload.old.user_id === currentUser?.id;

      if (isRelevant) {
        console.log('Real-time notification update detected, reloading...');
        loadBookmarkedNotifications();
      }
    }).
    subscribe();

    return () => {
      window.supabase.removeChannel(notifChannel);
    };
  }, [currentUser]);

  // Pull to Refresh Logic


  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);


  // Load user profile on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await window.getCurrentUser();
        if (!user) {
          setIsGuest(true);
          setShowOnboardingModal(true);
          setIsLoadingPosts(false);
          setLoading(false);
          return;
        }
        setIsGuest(false);
        setCurrentUser(user);
        if (user) {
          // ⚡ PARALLEL LOADING - Fetch profile and bookmarks simultaneously
          const [
          { data: profile },
          { data: bookmarks }] =
          await Promise.all([
          window.supabase.from('profiles').select('*').eq('id', user.id).single(),
          window.supabase.from('bookmarks').select('post_id').eq('user_id', user.id)]
          );

          if (profile) {
            setUserProfile({
              id: profile.id,
              full_name: profile.full_name || "User",
              username: profile.username || "",
              avatar_url: profile.avatar_url || "",
              rqs: profile.rqs_score || 0
            });
          }

          if (bookmarks) {
            setSavedPosts(new Set(bookmarks.map((b) => String(b.post_id))));
          }
        }
      } catch (e) {console.error("Init failed", e);}
    };
    initUser();
    loadPosts(0, true);
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await window.getMyProfile();
      if (profile) {
        setUserProfile({
          full_name: profile.full_name || "User",
          username: profile.username || "",
          avatar_url: profile.avatar_url || "",
          banner_url: profile.banner_url || "",
          rqs: profile.rqs || 0,
          id: profile.id
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // --- EFFECTS ---
  // 1. Initial Load & Hash Listener (Restoring cross-page signal logic)
  useEffect(() => {
    const currentPage = window.location.pathname.split('/').pop();
    const tab = PAGE_TAB_MAP[currentPage];
    if (tab) {
      setActiveTab(tab);
      try {
        // This might fail in sandboxed environment, safe to ignore
        const storage = window.localStorage || {};
        // Memory.set('activeTab', tab); // Removed direct Memory set if it relied on external scripts
      } catch (e) {}
    }

    // Check for hash signals immediately on mount
    const hash = window.location.hash;
    if (hash === '#opinion' || hash === '#compose') {
      setIsOverlayOpen(true);
      // Optional: clear hash without reload
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash === '#menu') {
      setIsMenuOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash === '#lens' || hash === '#search') {
      setIsLensOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // 2. Expose Actions Globaly (For real-time control from other scripts/console)
  useEffect(() => {
    window.PlusOpinionActions = {
      openOpinion: () => setIsOverlayOpen(true),
      openMenu: () => setIsMenuOpen(true),
      openLens: () => setIsLensOpen(true),
      sharePost: (post) => {setSharePostData(post);setIsShareModalOpen(true);},
      reportPost: (postId) => {setReportPostId(postId);setIsReportModalOpen(true);}
    };

    // Cleanup on unmount
    return () => {window.PlusOpinionActions = null;};
  }, []);

  useEffect(() => {
    const handler = (e) => showToast(e.detail.message, e.detail.icon, e.detail.isSuccess);
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  useEffect(() => {setTimeout(() => setLoading(false), 2000);}, []);

  // Setup pull-to-refresh handler
  useEffect(() => {
    const setupPullToRefresh = () => {
      if (window.PullToRefresh) {
        window.PullToRefresh.onRefresh(async () => {
          // Invalidate cache
          if (window.StateManager) {
            window.StateManager.invalidate('user_bookmarks');
          }

          // Reload bookmarks
          window.location.reload();
        });
      } else {
        setTimeout(setupPullToRefresh, 100);
      }
    };
    setTimeout(setupPullToRefresh, 200);
  }, []);



  // --- HANDLERS ---

  const showToast = (msg, icon = null, isSuccess = false, action = null) => {
    setToastMessage({ msg, icon, isSuccess, action });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleOverlay = () => {
    vibrate(10);
    if (isOverlayOpen) setEditingPost(null); // Clear edit state on close
    setIsOverlayOpen(!isOverlayOpen);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setIsOverlayOpen(true);
  };

  const handleShare = (post) => {
    setSharePostData(post);
    setIsShareModalOpen(true);
  };

  const handleNewPost = async (newPost, isUpdate = false) => {
    try {
      vibrate(10);
      // Transform to UI format
      const uiPost = {
        id: newPost.id,
        name: newPost.profiles?.full_name || 'You',
        username: newPost.profiles?.username || 'user',
        avatar: newPost.profiles?.avatar_url || '',
        rqs: newPost.profiles?.rqs_score || 0,
        verified: newPost.is_verified_purchase,
        category: newPost.category,
        product: newPost.product_name,
        text: newPost.text_content,
        media: newPost.media_url,
        media_type: newPost.media_type || 'image',
        images: newPost.images || null,
        time: "Just now",
        agrees: newPost.agrees_count || 0,
        comments: newPost.comments_count || 0,
        seenBy: null
      };

      if (isUpdate) {
        setPosts((prev) => prev.map((p) => p.id === uiPost.id ? { ...p, ...uiPost } : p));
      } else {
        setPosts((prev) => [uiPost, ...prev]);
      }

      setIsOverlayOpen(false);
      setEditingPost(null);
      vibrate(20);
    } catch (error) {
      console.error('Error handling new post:', error);
      showToast('Failed to update feed', 'AlertTriangle', false);
    }
  };




  const toggleSave = async (postId, shouldSave) => {
    // If shouldSave is undefined, toggle based on current state (legacy support)
    const isSaving = shouldSave !== undefined ? shouldSave : !savedPosts.has(postId);
    const next = new Set(savedPosts);
    if (isSaving) {
      next.add(postId);
      try {await window.bookmarkPost(postId);} catch (e) {console.error(e);}
      showToast("Saved to Bookmarks", "BookmarkFilled", true);
    } else {
      next.delete(postId);
      try {await window.removeBookmark(postId);} catch (e) {console.error(e);}
      showToast("Removed from Bookmarks", "Bookmark");
    }
    setSavedPosts(next);
    if (!isSaving) {
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
    }
    vibrate(10);
  };

  const handleRemovePost = async (postId, reason = 'Removed', type = 'delete', target = null) => {
    // If REPORT_INTENT, open Report Modal instead of removing immediately
    if (type === 'REPORT_INTENT') {
      setReportPostId(postId);
      setIsReportModalOpen(true);
      return;
    }

    // Handling Share
    if (type === 'SHARE_INTENT') {
      if (target) {// target contains post object in this hacky wiring
        setSharePostData(target);
        setIsShareModalOpen(true);
      }
      return;
    }

    setRemovedPosts((prev) => new Set(prev).add(postId));
    if (type !== 'hide_post' && type !== 'not_interested') {
      // Only undo if it's not a hard hide/block which disrupts feed logic immediately
      setUndoStack((prev) => [...prev, { type: 'remove', postId }]);
    }

    if (reason) showToast(reason, type === 'delete' ? "Trash" : "EyeOff", true); // Basic feedback

    // API Persistence
    try {
      if (type === 'hide_post') await window.hideItem('post', postId);else
      if (type === 'mute_brand') await window.hideItem('brand', target || 'Brand');else
      if (type === 'not_interested') await window.hideItem('category', target || 'General');else
      if (type === 'Deleted') await window.deletePost(postId);
    } catch (e) {console.error("Persistence failed", e);}
  };

  const submitReport = async (reason, action) => {
    const post = posts.find((p) => String(p.id) === String(reportPostId));
    // Send Report to API
    try {
      const currentUser = await window.getCurrentUser();
      let reporterUsername = 'Anonymous';
      if (currentUser) {
        const { data: profile } = await window.supabase.
        from('profiles').
        select('username').
        eq('id', currentUser.id).
        single();
        if (profile) reporterUsername = profile.username;
      }

      const additionalData = {
        reporter_username: reporterUsername,
        reported_username: post ? post.username : null,
        post_url: reportPostId ? `https://plusopinion.com/post/${reportPostId}` : null
      };

      // Use default action 'pending' if not 'remove'
      const actionTaken = action === 'remove' ? 'remove' : 'pending';

      await window.reportPost(reportPostId, reason, actionTaken, additionalData);
    } catch (e) {console.error(e);}

    setIsReportModalOpen(false);

    // Handle Action
    if (action === 'remove') {
      handleRemovePost(reportPostId, 'Thanks! We will review this.', 'hide_post');
    } else {
      showToast('Report submitted', 'Check', true);
    }
    setReportPostId(null);
  };

  const handleRemoveNotification = async (notifId) => {
    try {
      const targetItem = bookmarkedNotifs.find((n) => n.id === notifId);

      // Update UI immediately (optimistic)
      setBookmarkedNotifs((prev) => prev.filter((n) => n.id !== notifId));
      vibrate(10);

      if (targetItem?.metadata?.type === 'message_bookmark') {
        // Delete from bookmarks table for messages
        const { error: delError } = await window.supabase.
        from('bookmarks').
        delete().
        eq('id', notifId);
        if (delError) throw delError;
      } else {
        // Fetch current to merge metadata
        const { data: currentNotif } = await window.supabase.
        from('notifications').
        select('metadata').
        eq('id', notifId).
        single();

        const newMetadata = { ...(currentNotif?.metadata || {}), is_bookmarked: false };

        const { error } = await window.supabase.
        from('notifications').
        update({ metadata: newMetadata }).
        eq('id', notifId);

        if (error) throw error;
      }
      showToast("Removed from bookmarks", "Bookmark");
    } catch (err) {
      console.error('Failed to unbookmark notification:', err);
      showToast("Failed to remove", "AlertTriangle", false);
      loadBookmarkedNotifications(); // Restore if failed
    }
  };

  const handleAddComment = (postId, text) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
  };

  // Scroll Logic
  const scrollRef = useRef(null);
  const lastY = useRef(0);
  const scrollTimer = useRef(null);

  const handleScroll = (e) => {
    const currentY = e.target.scrollTop;
    const isScrollingDown = currentY > lastY.current;

    if (isScrollingDown && currentY > 50) {
      setNavVisible(false);
      setFabVisible(false);
    } else {
      setNavVisible(true);
      setFabVisible(true);
    }

    lastY.current = currentY;

    // Infinite Scroll Check
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 300) {
      if (!isLoadingMore && hasMore) {
        loadPosts(offset, false);
      }
    }
  };



  // Main UI Transform Logic
  const isAnySidePanelOpen = isMenuOpen || isLensOpen;
  const getMainContentTransform = () => {
    if (isMenuOpen) return 'scale-95 opacity-50 translate-x-[60%] rounded-[32px] overflow-hidden blur-sm';
    if (isLensOpen) return 'scale-95 opacity-50 -translate-x-[60%] rounded-[32px] overflow-hidden blur-sm';
    if (isOverlayOpen || viewingImage) return 'blur-md opacity-60 pointer-events-none';
    return 'scale-100';
  };

  const visiblePosts = posts.filter((p) => !removedPosts.has(p.id));

  return (/*#__PURE__*/
    React.createElement("div", {
      className: "flex-1 flex flex-col relative h-full overflow-hidden",
      onClick: (e) => {
        if (window.needsOnboarding && !showOnboardingModal) {
          e.preventDefault();
          e.stopPropagation();
          setShowOnboardingModal(true);
        }
      },
      onTouchStart: (e) => {
        if (window.needsOnboarding && !showOnboardingModal) {
          e.preventDefault();
          e.stopPropagation();
          setShowOnboardingModal(true);
        }
      } }, /*#__PURE__*/




    React.createElement("div", { className: `absolute top-20 left-1/2 -translate-x-1/2 z-[110] transition-all duration-300 w-auto whitespace-nowrap ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}` }, /*#__PURE__*/
    React.createElement("div", { className: "bg-slate-800/95 backdrop-blur border border-white/10 px-5 py-3 rounded-full text-xs font-bold text-white shadow-xl tracking-wide flex items-center gap-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" },
    toastMessage?.icon && /*#__PURE__*/React.createElement(Icon, { icon: toastMessage.icon, size: 16, className: toastMessage.isSuccess ? "text-[#6BFFB6]" : "text-[#2f8bff]" }), /*#__PURE__*/
    React.createElement("span", null, toastMessage?.msg)
    ),
    toastMessage?.action && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", { className: "w-[1px] h-4 bg-white/20" }), /*#__PURE__*/
    React.createElement("button", {
      onClick: (e) => {
        e.stopPropagation();
        vibrate(10);
        toastMessage.action.onClick();
      },
      className: "text-neon hover:text-white transition-colors" },

    toastMessage.action.label
    )
    )

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: `top-nav-glass fixed top-0 left-0 w-full h-[60px] flex items-center px-5 z-30 transition-transform duration-500 ease-out ${navVisible ? 'translate-y-0' : '-translate-y-full'}` }, /*#__PURE__*/
    React.createElement("button", { className: "p-3 -ml-2 text-white/80 hover:text-white transition-colors relative z-10 touch-scale", onClick: () => {if (history.length > 1) {history.back();} else {window.location.href = 'index.html';}} }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronLeft", size: 24 })
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 flex justify-center items-center -ml-6" }, /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-lg tracking-wide text-white" }, "Bookmarks")
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      ref: scrollRef,
      className: `
                            absolute inset-0 overflow-y-auto pt-[60px] pb-8 no-scrollbar smooth-scroll-container
                            transition-all duration-500 ease-out origin-center
                            ${getMainContentTransform()}
                        `,
      onScroll: handleScroll },

    loading ? /*#__PURE__*/
    React.createElement("div", { className: "px-4 pt-4" }, /*#__PURE__*/
    React.createElement(SkeletonPost, { delay: "0ms" }), /*#__PURE__*/
    React.createElement(SkeletonPost, { delay: "100ms" }), /*#__PURE__*/
    React.createElement(SkeletonPost, { delay: "200ms" })
    ) : /*#__PURE__*/

    React.createElement("div", { className: "animate-fade-in" }, /*#__PURE__*/
    React.createElement("div", { className: "sticky top-0 z-[40] bg-[#020205] border-b border-white/[0.05] flex p-1 m-4 rounded-xl bg-white/[0.03]" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setBookmarkTab('opinions'),
      className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${bookmarkTab === 'opinions' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-slate-500 hover:text-slate-300'}` },
    "Opinions (",
    posts.length, ")"
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setBookmarkTab('notifications'),
      className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${bookmarkTab === 'notifications' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-slate-500 hover:text-slate-300'}` },
    "Saved Alerts (",
    bookmarkedNotifs.length, ")"
    )
    ),

    bookmarkTab === 'opinions' ? /*#__PURE__*/
    React.createElement("div", { className: "space-y-4 px-4 pb-32" },
    visiblePosts.map((post, idx) => /*#__PURE__*/
    React.createElement(Opinion, {
      key: post.id,
      post: post,
      index: idx,
      onRemove: (reason, type, target) => handleRemovePost(post.id, reason, type, target),
      onSave: (s) => toggleSave(post.id, s),
      isSaved: true,
      userProfile: userProfile,
      onAddComment: handleAddComment,
      onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }),
      onShare: handleShare,
      onReport: (postId) => {setReportPostId(postId);setIsReportModalOpen(true);} }
    )
    ),

    !isLoadingPosts && hasMore && /*#__PURE__*/
    React.createElement("div", { className: "flex justify-center py-8" }, /*#__PURE__*/
    React.createElement("button", { onClick: () => setOffset((prev) => prev + 20), className: "text-xs font-bold text-neon tracking-widest hover:opacity-80 transition-opacity" }, "LOAD MORE")
    ),


    !isLoadingPosts && visiblePosts.length > 0 && !hasMore && /*#__PURE__*/
    React.createElement("div", { className: "py-20 flex flex-col items-center justify-center gap-4 opacity-40" }, /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent" }), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] tracking-[0.3em] font-heading text-neon" }, "END OF FEED"), /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent" })
    ),


    !isLoadingPosts && visiblePosts.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col items-center justify-center py-20 text-center opacity-60" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Bookmark", size: 48, className: "text-muted mb-4 stroke-1" }), /*#__PURE__*/
    React.createElement("p", { className: "text-white font-heading font-bold text-lg" }, "No Bookmarks Yet"), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm max-w-xs mt-2" }, "Save opinions you want to read later."), /*#__PURE__*/
    React.createElement("button", { onClick: () => window.location.href = 'HOMEPAGE_FINAL.HTML', className: "mt-6 px-6 py-2 bg-white/10 rounded-full text-white text-xs font-bold border border-white/5 hover:bg-white/20 transition-colors" }, "Go to Feed")
    )

    ) : /*#__PURE__*/

    React.createElement("div", { className: "pb-32 min-h-[400px]" },
    isLoadingNotifs ? /*#__PURE__*/
    React.createElement("div", { className: "flex justify-center items-center py-20" }, /*#__PURE__*/
    React.createElement("div", { className: "w-6 h-6 border-2 border-neon border-t-transparent rounded-full animate-spin" })
    ) :
    bookmarkedNotifs.length > 0 ? /*#__PURE__*/
    React.createElement("div", { className: "space-y-[1px]" },
    bookmarkedNotifs.map((notif) => /*#__PURE__*/
    React.createElement(NotificationBookmarkItem, {
      key: `notif-${notif.id}`,
      data: notif,
      onRemove: handleRemoveNotification }
    )
    )
    ) : /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col items-center justify-center py-24 text-center opacity-60 px-6" }, /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Bell", size: 32, className: "text-muted stroke-1" })
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-white font-heading font-bold text-lg" }, "No Saved Alerts"), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm max-w-[200px] mt-2 leading-relaxed font-light" }, "Swipe right on a notification to save it for later reference."

    )
    )

    )

    )

    ), /*#__PURE__*/


    React.createElement("button", {
      onClick: toggleOverlay,
      className: `
                            fixed bottom-6 right-5 h-12 rounded-full 
                            flex items-center justify-center 
                            opinion-btn shadow-lg shadow-neon/20 transition-all duration-300
                            ${isOverlayOpen ?
      'z-[60] w-12 p-0 bg-white text-black scale-100' :
      'z-30 pl-4 pr-5 w-auto bg-neon text-white'}
                            ${
      fabVisible && !isAnySidePanelOpen && !viewingImage ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-12 opacity-0 pointer-events-none'} 
                        ` }, /*#__PURE__*/

    React.createElement("div", { className: `opinion-icon transition-transform duration-300 ${isOverlayOpen ? 'rotate-[135deg]' : 'rotate-0'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Plus", size: 20, className: "stroke-[3px]" })
    ), /*#__PURE__*/
    React.createElement("span", { className: `font-heading font-bold text-sm tracking-wide ml-2 opinion-text transition-all duration-300 overflow-hidden whitespace-nowrap ${isOverlayOpen ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'}` }, "OPINION"

    )
    ), /*#__PURE__*/



    React.createElement(OpinionModal, { isOpen: isOverlayOpen, onClose: toggleOverlay, onPublished: handleNewPost, userProfile: userProfile, initialPost: editingPost }), /*#__PURE__*/
    React.createElement(ShareModal, { isOpen: isShareModalOpen, onClose: () => setIsShareModalOpen(false), post: sharePostData }), /*#__PURE__*/
    React.createElement(ReportModal, { isOpen: isReportModalOpen, onClose: () => setIsReportModalOpen(false), onSubmit: submitReport }), /*#__PURE__*/

    React.createElement(LogoutModal, { isOpen: showLogoutConfirm, onCancel: () => setShowLogoutConfirm(false), onConfirm: async () => {
        try {
          if (window.signOutUser) await window.signOutUser();
          sessionStorage.removeItem('plusopinion_access');
          localStorage.clear();
          setShowLogoutConfirm(false);
          setIsMenuOpen(false);
          setTimeout(() => window.location.href = 'index.html', 100);
        } catch (error) {
          console.error('Logout error:', error);
          setShowLogoutConfirm(false);
          setIsMenuOpen(false);
        }
      } }), /*#__PURE__*/


    React.createElement(ImageViewer, { src: viewingImage?.src, type: viewingImage?.type, images: viewingImage?.images, initialIndex: viewingImage?.initialIndex || 0, onClose: () => setViewingImage(null) }), /*#__PURE__*/




    React.createElement(AuthModal, {
      isOpen: showOnboardingModal && isGuest,
      onClose: () => setShowOnboardingModal(false),
      isClosable: !isGuest }
    ),


    showOnboardingModal && !isGuest && /*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/90 backdrop-blur-lg" }), /*#__PURE__*/
    React.createElement("div", { className: "relative flex flex-col items-center gap-6 text-center" }, /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-16 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "User", size: 32, className: "text-neon" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h2", { className: "text-white font-heading font-bold text-xl mb-2" }, "Complete Your Profile"), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm max-w-xs" }, "You need to set up your profile before using PlusOpinion.")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {window.location.href = 'index.html';},
      className: "px-8 py-3 bg-neon text-black font-bold rounded-full text-sm hover:opacity-90 transition-opacity active:scale-95" },
    "Set Up Profile \u2192"

    )
    )
    )

    ));

};

// AUTH MODAL (Login/Signup) - Mirrored from HOMEPAGE_FINAL
const AuthModal = ({ isOpen, onClose, isClosable = true }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inlineEmailError, setInlineEmailError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInlineEmailError(null);
    vibrate(10);

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      await window.authReadyPromise;
      if (mode === 'signup') {
        const signupData = await window.signUpUser(formData.email, formData.password, formData.name);
        if (signupData.error) throw signupData.error;

        if (signupData?.session) {
          window.location.href = 'index.html'; // onboarding now integrated into index.html
        } else {
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Verification email sent!', icon: 'Mail', isSuccess: true }
          }));
          onClose();
        }
      } else {
        const user = await window.signInUser(formData.email, formData.password);
        if (user) {
          if (user.onboardingRequired) {
            window.location.href = 'index.html'; // onboarding now integrated into index.html
          } else {
            window.location.reload();
          }
        }
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed';
      const isSignupEmailErr = mode === 'signup' && (err.status === 422 || msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('duplicate'));
      const isLoginEmailErr = mode === 'login' && (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('user not found'));

      if (isSignupEmailErr) {
        setInlineEmailError('This email is already registered. Please log in.');
      } else if (isLoginEmailErr) {
        setInlineEmailError('Email not registered or incorrect password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await window.signInWithProvider('google');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email first");
      return;
    }
    setLoading(true);
    try {
      await window.resetPassword(formData.email);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Reset link sent to your email!', icon: 'Mail', isSuccess: true }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/95 backdrop-blur-xl", onClick: () => isClosable && onClose() }), /*#__PURE__*/
    React.createElement("div", { className: "w-full max-w-md bg-[#0A0E1A] p-8 rounded-3xl shadow-2xl relative border border-white/10", onClick: (e) => e.stopPropagation() },
    isClosable && /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "absolute top-6 right-6 text-slate-500 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 24 })
    ), /*#__PURE__*/


    React.createElement("div", { className: "text-center mb-8" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-2xl font-black tracking-tight text-white mb-2 font-heading" },
    mode === 'login' ? 'Welcome Back' : 'Sign Up'
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-slate-400 text-sm" },
    mode === 'login' ? 'Login to access your account' : 'Join the future of consumer intelligence.'
    )
    ), /*#__PURE__*/

    React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" },
    error && /*#__PURE__*/
    React.createElement("div", { className: "bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" },
    error
    ),


    mode === 'signup' && /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Full Name"), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.name,
      onChange: (e) => setFormData({ ...formData, name: e.target.value }),
      type: "text",
      placeholder: "John Doe",
      className: "w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all" }
    )
    ), /*#__PURE__*/


    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Email Address"), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.email,
      onChange: (e) => setFormData({ ...formData, email: e.target.value }),
      type: "email",
      placeholder: "john@example.com",
      className: "w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all" }
    )
    ), /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Password"), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.password,
      onChange: (e) => setFormData({ ...formData, password: e.target.value }),
      type: "password",
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      className: "w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all" }
    )
    ),

    mode === 'signup' && /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Confirm Password"), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.confirmPassword,
      onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }),
      type: "password",
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      className: "w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all" }
    )
    ),


    mode === 'login' && /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: handleForgotPassword,
      className: "text-blue-400 text-sm hover:text-blue-300 transition-colors" },
    "Forgot Password?"

    ), /*#__PURE__*/


    React.createElement("button", {
      type: "submit",
      disabled: loading,
      className: "w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold tracking-wide transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" },

    loading ? 'PROCESSING...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT', /*#__PURE__*/
    React.createElement(Icon, { icon: "ArrowRight", size: 18 })
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative flex py-2 items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex-grow border-t border-slate-700" }), /*#__PURE__*/
    React.createElement("span", { className: "flex-shrink-0 mx-4 text-slate-500 text-xs uppercase" }, "OR"), /*#__PURE__*/
    React.createElement("div", { className: "flex-grow border-t border-slate-700" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "google-sso-container", "data-action": "signin" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-6 text-center text-sm text-slate-400" },
    mode === 'login' ? "Don't have an account?" : "Already have an account?", /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {vibrate(5);setMode(mode === 'login' ? 'signup' : 'login');setError(null);},
      className: "text-blue-400 hover:text-blue-300 font-bold ml-1 active:scale-95 transition-transform" },

    mode === 'login' ? 'Sign Up' : 'Log In'
    )
    )
    )
    ));

};

const root = window.ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));