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
  InboxTray: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }), /*#__PURE__*/React.createElement("path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" })),
  MessagesDuo: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" }), /*#__PURE__*/React.createElement("path", { d: "M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" })),
  InboxArchive: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" }), /*#__PURE__*/React.createElement("path", { d: "M3 10v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9" }), /*#__PURE__*/React.createElement("path", { d: "M10 12h4" })),
  MailOpen: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M21.2 8.4c.5.3.8.8.8 1.4v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.8c0-.6.3-1.1.8-1.4l7.5-4.5a2 2 0 0 1 2.4 0l7.5 4.5Z" }), /*#__PURE__*/React.createElement("path", { d: "m22 9-10 7L2 9" }), /*#__PURE__*/React.createElement("path", { d: "M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" })),
  Mail: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }), /*#__PURE__*/React.createElement("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })),
  PaperPlane: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M22 2 15 22l-4-9L2 9z" }), /*#__PURE__*/React.createElement("path", { d: "M22 2 11 13v6l4-3" })),
  PlusOpinionInbox: (p) => /*#__PURE__*/
  React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/
  React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }), /*#__PURE__*/
  React.createElement("polyline", { points: "3 5 12 11 21 5" })
  ),

  PlusOpinionInboxFilled: (p) => /*#__PURE__*/
  React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "currentColor", stroke: "none" }), /*#__PURE__*/
  React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }), /*#__PURE__*/
  React.createElement("polyline", { points: "3 5 12 11 21 5", fill: "none", stroke: "#020205", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" })
  ),

  ActiveChat: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }), /*#__PURE__*/React.createElement("circle", { cx: "8", cy: "10", r: "1.5", fill: "currentColor", stroke: "none" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "10", r: "1.5", fill: "currentColor", stroke: "none" }), /*#__PURE__*/React.createElement("circle", { cx: "16", cy: "10", r: "1.5", fill: "currentColor", stroke: "none" })),
  Share: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }), /*#__PURE__*/React.createElement("polyline", { points: "16 6 12 2 8 6" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "2", y2: "15" })),
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
  ArrowLeft: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 12H5" }), /*#__PURE__*/React.createElement("path", { d: "m12 19-7-7 7-7" })),
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
  BookMark: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" })),
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


const NavItem = ({ icon, label, isActive, onClick, isMySpace, badge }) => /*#__PURE__*/
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
  className: `relative group flex flex-col items-center justify-center w-14 h-14 ${isActive ? '' : ''}` }, /*#__PURE__*/

React.createElement("div", { className: `relative ${isMySpace ? 'myspace-trigger' : ''} p-1.5 rounded-xl ${isActive ? 'bg-white/5' : ''}` }, /*#__PURE__*/
React.createElement(Icon, { icon: icon, size: 24, className: `${isActive ? 'text-white glow-white stroke-[2.5px]' : 'text-muted group-hover:text-white stroke-[1.5px]'}` }),


badge > 0 && /*#__PURE__*/
React.createElement("div", { className: "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-blue-500 rounded-full border-2 border-[#020205] z-50 animate-pulse-subtle" }, /*#__PURE__*/
React.createElement("span", { className: "absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" }), /*#__PURE__*/
React.createElement("span", { className: "relative text-[10px] font-bold text-white px-1 leading-none" },
badge > 99 ? '99+' : badge
)
)


)
);


const BottomNav = ({ activeTab, setActiveTab, isVisible = true, isGuest, onAuthRequired, unreadInboxCount, setUnreadInboxCount }) => {
  // Initialize with cached value to prevent flicker
  const [unreadCount, setUnreadCount] = useState(() => {
    return window.getUnreadCountFromCache ? window.getUnreadCountFromCache() : 0;
  });

  useEffect(() => {
    const getUnreadCount = () => {
      return window.getUnreadCountFromCache ? window.getUnreadCountFromCache() : 0;
    };

    const updateTitle = (notifCount, inboxCount) => {
      let displayStr = '';
      const total = notifCount + inboxCount;
      if (total > 0) {
        displayStr = `(${total})`;
      }
      const baseTitle = "PlusOpinion - Your Local Network";
      document.title = displayStr ? `${displayStr} ${baseTitle}` : baseTitle;
    };

    // Subscribe to real-time unread count
    const unsubscribe = window.subscribeToUnreadCount && window.subscribeToUnreadCount((count) => {
      setUnreadCount(count);
      updateTitle(count, unreadInboxCount);
    });

    // Subscribe to real-time inbox unread count
    const unsubscribeInbox = window.subscribeToInboxUnreadCount && window.subscribeToInboxUnreadCount((count) => {
      setUnreadInboxCount(count);
      const nCount = getUnreadCount();
      updateTitle(nCount, count);
    });

    const handleInboxUnread = (e) => {
      const iCount = e.detail || 0;
      setUnreadInboxCount(iCount);
      const nCount = getUnreadCount();
      updateTitle(nCount, iCount);
    };

    window.addEventListener('inbox_unread_changed', handleInboxUnread);

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
      if (unsubscribeInbox && typeof unsubscribeInbox === 'function') unsubscribeInbox();
      window.removeEventListener('inbox_unread_changed', handleInboxUnread);
    };
  }, [unreadInboxCount, setUnreadInboxCount]);

  return (/*#__PURE__*/
    React.createElement("div", { id: "bottom-nav-bar", className: `nav-glass fixed bottom-0 left-0 w-full h-[65px] px-2 pb-2 flex justify-between items-center z-[50] transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}` }, /*#__PURE__*/
    React.createElement(NavItem, { icon: "Home", label: "Home", isActive: activeTab === 'home', onClick: () => goTo('HOMEPAGE_FINAL.HTML') }), /*#__PURE__*/
    React.createElement(NavItem, { icon: "Grid", label: "Categories", isActive: activeTab === 'categories', onClick: () => goTo('CATAGORYPAGE.HTML') }), /*#__PURE__*/
    React.createElement(NavItem, { icon: "MySpaceLogo", label: "My Space", isActive: activeTab === 'myspace', isMySpace: true, onClick: () => !isGuest ? console.log('myspace') : onAuthRequired() }), /*#__PURE__*/
    React.createElement(NavItem, {
      icon: "Bell",
      label: "Notifications",
      isActive: activeTab === 'notifs',
      onClick: () => !isGuest ? goTo('NOTIFICATION PANEL.HTML') : onAuthRequired(),
      badge: unreadCount }
    ), /*#__PURE__*/
    React.createElement(NavItem, { icon: "User", label: "Profile", isActive: activeTab === 'profile', onClick: () => !isGuest ? goTo('PRIVATE OWNER PROFILE.HTML') : onAuthRequired() })
    ));

};



// --- Clickable @mention and URL renderer ---
const renderTextWithMentions = (text) => {
  if (!text) return text;

  // First split by URL to identify links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /(@[\w.]+)/g;

  // Split by both URLs and mentions
  // We'll use a single pass approach by splitting on spaces and checking each token
  const tokens = text.split(/(\s+)/);

  return tokens.map((token, i) => {
    // Check for URL
    if (urlRegex.test(token)) {
      return (/*#__PURE__*/
        React.createElement("a", {
          key: i,
          href: token,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[#2f8bff] underline hover:text-blue-400 transition-colors",
          onClick: (e) => e.stopPropagation() },

        token
        ));

    }

    // Check for Mention
    if (mentionRegex.test(token)) {
      const username = token.match(/@([\w.]+)/)[1];
      return (/*#__PURE__*/
        React.createElement("span", {
          key: i,
          className: "text-neon font-semibold cursor-pointer hover:underline",
          onClick: (e) => {
            e.stopPropagation();
            if (typeof vibrate === 'function') vibrate(5);
            window.location.href = `PUBLIC POV PROFILE.HTML?username=${username}`;
          } },

        token
        ));

    }

    return token;
  });
};

// =============================================
// COMMENT REPLY ITEM (indented)
// =============================================
const ReplyItem = ({ reply, onReply }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reply.likes?.[0]?.count || 0);

  useEffect(() => {
    const checkLike = async () => {
      if (window.hasLikedComment && typeof reply.id === 'string') {
        try {setIsLiked(await window.hasLikedComment(reply.id));} catch (e) {}
      }
    };
    checkLike();
  }, [reply.id]);

  // Real-time like count for this reply
  useEffect(() => {
    const ch = window.supabase.channel(`comment-likes-rt:${reply.id}`).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${reply.id}` },
    () => setLikesCount((p) => p + 1)).
    on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${reply.id}` },
    () => setLikesCount((p) => Math.max(0, p - 1))).
    subscribe();
    return () => window.supabase.removeChannel(ch);
  }, [reply.id]);

  const handleLike = async () => {
    vibrate(5);
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikesCount((p) => newStatus ? p + 1 : Math.max(0, p - 1));
    try {
      if (newStatus) await window.likeComment(reply.id);else
      await window.unlikeComment(reply.id);
    } catch (e) {
      setIsLiked(!newStatus);
      setLikesCount((p) => !newStatus ? p + 1 : Math.max(0, p - 1));
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: `flex gap-2 text-sm animate-fade-in ml-7 pl-3 border-l border-white/10 mt-2 ${reply.isPending ? 'opacity-50' : ''}` }, /*#__PURE__*/
    React.createElement("div", { className: "flex-shrink-0" }, /*#__PURE__*/
    React.createElement(Avatar, {
      src: reply.avatar,
      className: "w-5 h-5 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer",
      fallbackSize: 10,
      onClick: () => {vibrate();if (reply.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${reply.user_id}`;} }
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1.5" }, /*#__PURE__*/
    React.createElement("span", {
      className: "font-bold text-white text-[11px] cursor-pointer hover:text-neon transition-colors",
      onClick: () => {vibrate();if (reply.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${reply.user_id}`;} },
    reply.user), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] text-muted" }, reply.time)
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleLike, className: `flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ThumbsUp", size: 10, className: `stroke-[1.5px] ${isLiked ? 'fill-white' : ''}`, style: { fill: isLiked ? 'white' : 'none' } }),
    likesCount > 0 && /*#__PURE__*/React.createElement("span", { className: "text-[9px]" }, likesCount)
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-gray-300 text-[11px] leading-relaxed mt-0.5", style: { whiteSpace: 'pre-wrap' } }, renderTextWithMentions(reply.text)), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => onReply && onReply(reply),
      className: "text-[9px] text-muted hover:text-white transition-colors mt-0.5" },
    "Reply")
    )
    ));

};

// =============================================
// COMMENT ITEM (top-level, with replies list)
// =============================================
const CommentItem = ({ comment, onReply }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes?.[0]?.count || 0);
  const [showReplies, setShowReplies] = useState(true);

  useEffect(() => {
    const checkLike = async () => {
      if (window.hasLikedComment && typeof comment.id === 'string') {
        try {
          const liked = await window.hasLikedComment(comment.id);
          setIsLiked(liked);
        } catch (e) {}
      }
    };
    checkLike();
  }, [comment.id]);

  // Real-time like count via Supabase channel
  useEffect(() => {
    if (!comment.id || comment.isPending) return;
    const ch = window.supabase.channel(`comment-likes-rt:${comment.id}`).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${comment.id}` },
    () => setLikesCount((p) => p + 1)).
    on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${comment.id}` },
    () => setLikesCount((p) => Math.max(0, p - 1))).
    subscribe();
    return () => window.supabase.removeChannel(ch);
  }, [comment.id]);

  const handleLike = async () => {
    vibrate(5);
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikesCount((p) => newStatus ? p + 1 : Math.max(0, p - 1));

    try {
      if (newStatus) {
        await window.likeComment(comment.id);
      } else {
        await window.unlikeComment(comment.id);
      }
    } catch (e) {
      console.error('Comment like failed', e);
      setIsLiked(!newStatus);
      setLikesCount((p) => !newStatus ? p + 1 : Math.max(0, p - 1));
    }
  };

  const replies = comment.replies || [];

  return (/*#__PURE__*/
    React.createElement("div", { className: `animate-fade-in ${comment.isPending ? 'opacity-50' : ''}` }, /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 text-sm group" }, /*#__PURE__*/
    React.createElement("div", { className: "flex-shrink-0" }, /*#__PURE__*/
    React.createElement("div", {
      className: "flex-shrink-0 cursor-pointer active:scale-95 transition-transform",
      onClick: () => {vibrate(5);if (comment.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${comment.user_id}`;} }, /*#__PURE__*/

    React.createElement(Avatar, {
      src: comment.avatar,
      className: "w-6 h-6 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer",
      fallbackSize: 12,
      onClick: () => {vibrate();if (comment.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${comment.user_id}`;} }
    )
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline justify-between focus-within:ring-0" }, /*#__PURE__*/
    React.createElement("div", {
      className: "flex items-baseline gap-2 cursor-pointer group/name",
      onClick: () => {vibrate(5);if (comment.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${comment.user_id}`;} }, /*#__PURE__*/

    React.createElement("span", { className: "font-bold text-white text-xs group-hover/name:text-neon transition-colors" }, comment.user), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted" }, comment.time)
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleLike, className: `flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ThumbsUp", size: 12, className: `stroke-[1.5px] ${isLiked ? "fill-white" : ""}`, style: { fill: isLiked ? 'white' : 'none', color: isLiked ? 'white' : 'inherit' } }),
    likesCount > 0 && /*#__PURE__*/React.createElement("span", { className: "text-[10px]" }, likesCount)
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-gray-300 text-xs leading-relaxed mt-0.5", style: { whiteSpace: 'pre-wrap' } }, renderTextWithMentions(comment.text)), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 mt-1" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => onReply && onReply(comment),
      className: "text-[10px] text-muted hover:text-white transition-colors font-medium" },
    "Reply", replies.length > 0 ? ` · ${replies.length}` : ''),
    replies.length > 0 && /*#__PURE__*/
    React.createElement("button", { onClick: () => setShowReplies((p) => !p), className: "text-[10px] text-neon/70 hover:text-neon transition-colors font-medium" },
    showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
    )

    )
    )
    ),


    showReplies && replies.map((r) => /*#__PURE__*/
    React.createElement(ReplyItem, { key: r.id, reply: r, onReply: () => onReply && onReply(r, comment.id) })
    )
    ));

};

// =============================================
// @MENTION AUTOCOMPLETE COMPONENT
// =============================================
const MentionAutocomplete = ({ query, onSelect, onClose, direction = 'up', coords }) => {
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

// Helper function to format timestamps (Global)
const formatTime = (timestamp) => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffMs = now - postDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);
  const diffMonths = Math.floor(diffMs / 2592000000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return `${diffMonths}mo`;
};

const PostCard = ({ post, index, onComment, onShare, onSave, comments = [], onAddComment, onImageClick, onRemove, onEdit, onBookmark, userProfile, savedPosts, isGuest, onAuthRequired, hideActions }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.agrees);
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState(comments);
  const [commentText, setCommentText] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(post.isHidden || false);
  const isSaved = savedPosts?.has(String(post.id));
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comments);
  const [replyingTo, setReplyingTo] = useState(null); // { id, topLevelId, user, username }
  const [mentionQuery, setMentionQuery] = useState(null); // active @query string
  const commentInputRef = useRef(null);
  const commentsFetchedRef = useRef(false); // tracks if we've done a fresh threaded fetch
  const localCommentsRef = useRef(localComments); // always has latest comments for realtime handler

  // Keep ref in sync with state
  useEffect(() => {
    localCommentsRef.current = localComments;
  }, [localComments]);

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
    if (isGuest) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
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
    user: c.profiles?.full_name || 'User',
    username: c.profiles?.username || '',
    avatar: c.profiles?.avatar_url || '',
    text: c.text_content,
    time: formatTime(c.created_at),
    user_id: c.user_id,
    likes: c.likes,
    parent_comment_id: c.parent_comment_id || null,
    replies: (c.replies || []).map((r) => transformComment(r))
  });

  const fetchThreadedComments = async () => {
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
  };

  const toggleComments = async () => {
    if (isGuest) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    vibrate(5);
    const shouldShow = !showComments;
    setShowComments(shouldShow);

    // Only fetch when opening AND we haven't loaded threaded data yet
    // (commentsFetchedRef is reset if the post re-mounts)
    if (shouldShow && !commentsFetchedRef.current) {
      await fetchThreadedComments();
    }
  };

  // Realtime Comments - subscribe once on mount, independent of showComments toggle
  useEffect(() => {
    const channel = window.supabase.channel(`comments:${post.id}`).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, async (payload) => {
      const currentUser = await window.getCurrentUser();
      if (payload.new.user_id === currentUser?.id) return; // Handled optimistically

      const { data: profile } = await window.supabase.
      from('profiles').
      select('full_name, username, avatar_url').
      eq('id', payload.new.user_id).
      maybeSingle();

      const newEntry = {
        id: payload.new.id,
        user_id: payload.new.user_id,
        user: profile?.full_name || 'User',
        username: profile?.username || '',
        avatar: profile?.avatar_url || '',
        text: payload.new.text_content,
        time: 'Just now',
        parent_comment_id: payload.new.parent_comment_id || null,
        likes: [],
        replies: []
      };

      const parentId = payload.new.parent_comment_id;
      if (!parentId) {
        // Top-level comment
        setLocalComments((prev) => {
          // Avoid duplicates
          if (prev.some((c) => c.id === newEntry.id)) return prev;
          return [...prev, newEntry];
        });
      } else {
        // Reply — nest under parent (use functional update to get latest state)
        setLocalComments((prev) => {
          const parentExists = prev.some((c) => c.id === parentId);
          if (!parentExists) return prev; // parent not loaded yet, skip
          return prev.map((c) =>
          c.id === parentId ?
          {
            ...c, replies: [
            ...(c.replies || []).filter((r) => r.id !== newEntry.id), // dedup
            newEntry]

          } :
          c
          );
        });
      }
      vibrate(5);
    }).
    subscribe();

    return () => {
      window.supabase.removeChannel(channel);
    };
  }, [post.id]); // only post.id, NOT showComments

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
      id: tempId,
      user: userProfile?.full_name || 'You',
      username: userProfile?.username || '',
      user_id: userProfile?.id,
      avatar: userProfile?.avatar_url || '',
      text: commentText,
      time: 'Just now',
      isPending: true,
      likes: [],
      replies: []
    };

    if (isReply) {
      // Optimistically add to topLevel's replies
      setLocalComments((prev) => prev.map((c) =>
      c.id === replyingTo.topLevelId ?
      { ...c, replies: [...(c.replies || []), tempEntry] } :
      c
      ));
    } else {
      setLocalComments((prev) => [...prev, tempEntry]);
    }

    const textToSend = commentText;
    setCommentText('');
    // Keep replyingTo in local scope for createReply call before nullifying
    const currentReplyingTo = replyingTo;
    setReplyingTo(null);
    setMentionQuery(null);
    vibrate(10);

    try {
      let newData;
      if (isReply) {
        newData = await window.createReply(post.id, currentReplyingTo.topLevelId, textToSend);
        // Update reply in parent's replies list
        setLocalComments((prev) => prev.map((c) =>
        c.id === currentReplyingTo.topLevelId ?
        {
          ...c, replies: (c.replies || []).map((r) =>
          r.id === tempId ? {
            id: newData.id,
            user: userProfile?.full_name || 'You',
            username: userProfile?.username || '',
            user_id: userProfile?.id,
            avatar: userProfile?.avatar_url || '',
            text: newData.text_content,
            time: 'Just now',
            likes: [],
            replies: []
          } : r
          )
        } :
        c
        ));
      } else {
        newData = await window.createComment(post.id, textToSend);
        setLocalComments((prev) => prev.map((c) => c.id === tempId ? {
          id: newData.id,
          user: userProfile?.full_name || 'You',
          username: userProfile?.username || '',
          avatar: userProfile?.avatar_url || '',
          text: newData.text_content,
          time: 'Just now',
          likes: newData.likes || [],
          replies: []
        } : c));
      }

      if (onAddComment) onAddComment(post.id, textToSend);
    } catch (error) {
      console.error('Comment failed', error);
      // Rollback
      if (isReply) {
        setLocalComments((prev) => prev.map((c) =>
        c.id === replyingTo?.id ?
        { ...c, replies: (c.replies || []).filter((r) => r.id !== tempId) } :
        c
        ));
      } else {
        setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      }
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to post comment', icon: 'AlertTriangle', isSuccess: false } }));
    }
  };

  // Handle reply button click from CommentItem/ReplyItem
  const handleReply = (commentOrReply) => {
    // Always reply to the top-level comment ID if replying to a reply
    const parentId = commentOrReply.parent_comment_id || commentOrReply.id;
    const parentComment = localComments.find((c) => c.id === parentId) || commentOrReply;
    setReplyingTo({ id: parentId, user: commentOrReply.user, username: commentOrReply.username || '' });
    setCommentText(`@${commentOrReply.username || commentOrReply.user} `);
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  // Detect @mention in comment input
  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    // Find active @mention: look for @ before cursor
    const cursor = e.target.selectionStart;
    const textUpToCursor = val.substring(0, cursor);
    const atMatch = textUpToCursor.match(/@([\w.]*)$/);
    setMentionQuery(atMatch ? atMatch[1] : null);
  };

  // @mention autocomplete: insert selected user into text
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
    if (action === 'edit' || action === 'delete' || action === 'bookmark') {
      if (isGuest) {
        if (onAuthRequired) onAuthRequired();
        return;
      }
    }
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

  const handleReport = async () => {
    if (isGuest) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    vibrate(10);
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
      reported_username: post.username,
      post_url: `https://plusopinion.com/post/${post.id}`
    };

    if (onRemove) onRemove(post.id, 'Reported', 'REPORT_INTENT', null, additionalData);
  };

  // Simplified display logic - rely on parent prop which is realtime updated
  const displayComments = post.comments;

  const handleUnhide = async () => {
    vibrate(10);
    try {
      await window.unhideItem('post', post.id);
      setIsHidden(false);
      // Notify parent if needed
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Opinion restored', icon: 'Eye', isSuccess: true }
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
      id: `post-${post.id}`,
      className: `glass-panel rounded-2xl p-4 mb-4 relative transition-all duration-300 animate-stagger ${showMoreMenu ? 'z-50' : 'z-0'}`,
      style: { animationDelay: `${Math.min(index * 50, 1000)}ms` } },




    showMoreMenu && ReactDOM.createPortal(/*#__PURE__*/
      React.createElement(React.Fragment, null, /*#__PURE__*/
      React.createElement("div", { className: "fixed inset-0 z-[9998]", onClick: (e) => {e.stopPropagation();setShowMoreMenu(false);} }), /*#__PURE__*/
      React.createElement("div", {
        className: "absolute z-[9999] bg-[#1A1C2E] border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-56 animate-fade-in origin-top-right backdrop-blur-xl",
        style: { top: `${menuPosition.top}px`, right: `${menuPosition.right}px` },
        onClick: (e) => e.stopPropagation() },


      userProfile && post && (
      String(userProfile.id) === String(post.user_id) ||
      String(userProfile.id) === String(post.profiles?.id)) ? /*#__PURE__*/

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
      React.createElement(Icon, { icon: "BookMark", size: 16, className: isSaved ? "text-neon fill-neon" : "text-muted" }), /*#__PURE__*/
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
      React.createElement(Icon, { icon: "BookMark", size: 16, className: isSaved ? "text-neon fill-neon" : "text-muted" }), /*#__PURE__*/
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
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.profiles?.id}`;} },

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
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.profiles?.id}`;} }, /*#__PURE__*/

    React.createElement("span", { className: "font-heading font-bold text-white text-sm truncate" }, post.name), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute bottom-6 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "View Profile")
    ), /*#__PURE__*/
    React.createElement("div", {
      className: "group relative rqs-pill px-2 py-0.5 rounded-full flex items-center shrink-0 cursor-pointer",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.profiles?.id}`;} }, /*#__PURE__*/

    React.createElement("span", { className: "font-heading font-bold text-[9px] text-white tracking-wide" }, "RQS ", post.rqs), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "Review Quality Score")
    )
    ), /*#__PURE__*/
    React.createElement("div", {
      className: "group relative inline-block cursor-pointer",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.profiles?.id}`;} }, /*#__PURE__*/

    React.createElement("div", { className: "text-xs text-muted truncate hover:text-white transition-colors" }, "@", post.username), /*#__PURE__*/
    React.createElement("span", { className: "delayed-label absolute top-5 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg" }, "View Profile")
    )
    )
    ),
    !hideActions && /*#__PURE__*/
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
    React.createElement("div", { className: "flex items-center text-accent-green touch-scale group relative ml-1", title: "Verified Purchase" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ShieldCheck", size: 16 })
    )

    ), /*#__PURE__*/

    React.createElement("p", { className: "text-sm text-gray-200 leading-relaxed mb-3 font-light pr-2", style: { whiteSpace: 'pre-wrap' } }, renderTextWithMentions(post.text)),

    (post.media || post.images && post.images.length > 0) && /*#__PURE__*/
    React.createElement(SmartMedia, {
      src: post.media,
      type: post.media_type,
      images: post.images,
      onImageClick: onImageClick }
    ),


    !hideActions && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
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
    )
    ),



    showComments && /*#__PURE__*/
    React.createElement("div", { className: "mt-4 pt-0 border-t border-white/5 animate-fade-in origin-top" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center mb-3 pt-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-white" }, "Comments (",
    localComments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0), ")"
    ), /*#__PURE__*/
    React.createElement("button", { onClick: () => {setShowComments(false);setReplyingTo(null);setMentionQuery(null);}, className: "text-muted hover:text-white text-xs" }, "Close")
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-4 mb-4 max-h-72 overflow-y-auto no-scrollbar" },
    isLoadingComments && /*#__PURE__*/React.createElement("div", { className: "text-center text-muted text-xs py-2" }, "Loading comments..."),

    localComments.map((c) => /*#__PURE__*/
    React.createElement(CommentItem, { key: c.id, comment: c, onReply: handleReply })
    ),

    !isLoadingComments && localComments.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "text-center text-muted text-xs py-2" }, "No comments yet. Be the first!")

    ),


    replyingTo && /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between px-3 py-1.5 mb-1.5 bg-neon/5 border border-neon/20 rounded-lg" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-neon/80" }, "Replying to ", /*#__PURE__*/React.createElement("span", { className: "font-bold" }, "@", replyingTo.username || replyingTo.user)), /*#__PURE__*/
    React.createElement("button", { onClick: () => {setReplyingTo(null);setCommentText('');setMentionQuery(null);}, className: "text-muted hover:text-white" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 12 })
    )
    ), /*#__PURE__*/



    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement(MentionAutocomplete, {
      query: mentionQuery,
      onSelect: handleMentionSelect }
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-neon/50 transition-colors" }, /*#__PURE__*/
    React.createElement("input", {
      ref: commentInputRef,
      value: commentText,
      onChange: handleCommentChange,
      placeholder: replyingTo ? `Reply to @${replyingTo.username || replyingTo.user}...` : "Add a comment or type @ to mention...",
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

// ─── SMART MEDIA RATIO DETECTION HELPER ────────────────────────────────────
// Decodes the image/video ratio and returns CSS aspect-ratio class
const getAspectClass = (ratio) => {
  if (ratio >= 1.55) return 'aspect-[16/9]'; // Landscape → 16:9
  if (ratio >= 0.89) return 'aspect-square'; // Square / near-square → 1:1
  return 'aspect-[4/5]'; // Portrait → 4:5 (covers tall too)
};

// ─── SMART MEDIA COMPONENT ─────────────────────────────────────────────────
// Replaces ZoomableMedia. Handles: single image, single video, multi-image carousel
// Props: src (string), type ('image'|'video'), images (string[]), onImageClick
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
    if (activeIdx === 0 && delta > 0 || activeIdx === imageList.length - 1 && delta < 0) {
      setDragDelta(delta * 0.2); // Rubber-band
    } else {
      setDragDelta(delta);
    }
  };

  const onCarouselTouchEnd = () => {
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

  // ── Pinch-zoom handlers (single media) ──────────────────────────────────
  const onSingleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const t1 = e.touches[0],t2 = e.touches[1];
      initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (t1.pageX + t2.pageX) / 2;
        const my = (t1.pageY + t2.pageY) / 2;
        setPinchOrigin({ x: (mx - rect.left) / rect.width * 100, y: (my - rect.top) / rect.height * 100 });
      }
    }
  };
  const onSingleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinching && initialDist.current) {
      e.preventDefault();
      const t1 = e.touches[0],t2 = e.touches[1];
      const d = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      setScale(Math.min(Math.max(d / initialDist.current, 1), 4));
    }
  };
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (/*#__PURE__*/
    React.createElement("div", {
      ref: containerRef,
      className: `w-full rounded-xl mb-3 border border-white/5 relative bg-black overflow-hidden cursor-pointer select-none media-zoom-effect ${aspectClass}`,
      style: { zIndex: isPinching ? 50 : 1 },
      onClick: handleClick },

    isVideo ? /*#__PURE__*/
    /* ── SINGLE VIDEO ─────────────────────────────── */
    React.createElement("div", {
      className: "absolute inset-0",
      onTouchStart: onSingleTouchStart,
      onTouchMove: onSingleTouchMove,
      onTouchEnd: onSingleTouchEnd,
      style: { transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' } }, /*#__PURE__*/

    React.createElement("video", {
      src: src,
      className: "w-full h-full object-cover pointer-events-none",
      playsInline: true, loop: true, muted: isMuted || !isInView, autoPlay: true,
      onLoadedMetadata: handleMediaLoad }
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: toggleMute,
      className: "absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white transition-all z-10 pointer-events-auto" },
    isMuted ? /*#__PURE__*/
    React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), /*#__PURE__*/React.createElement("line", { x1: "23", y1: "9", x2: "17", y2: "15" }), /*#__PURE__*/React.createElement("line", { x1: "17", y1: "9", x2: "23", y2: "15" })) : /*#__PURE__*/

    React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/React.createElement("polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }), /*#__PURE__*/React.createElement("path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" }))

    )
    ) :
    isMulti ? /*#__PURE__*/
    /* ── MULTI-IMAGE CAROUSEL ──────────────────────── */
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", {
      className: "absolute inset-0 flex",
      style: {
        transform: `translateX(calc(${-activeIdx * (100 / imageList.length)}% + ${dragDelta}px))`,
        transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
        width: `${imageList.length * 100}%`
      },
      onTouchStart: onCarouselTouchStart,
      onTouchMove: onCarouselTouchMove,
      onTouchEnd: onCarouselTouchEnd,
      onMouseDown: onCarouselMouseDown,
      onMouseMove: onCarouselMouseMove,
      onMouseUp: onCarouselMouseUp,
      onMouseLeave: onCarouselMouseUp },

    imageList.map((imgSrc, idx) => /*#__PURE__*/
    React.createElement("div", { key: idx, className: "h-full flex-shrink-0", style: { width: `${100 / imageList.length}%` } }, /*#__PURE__*/
    React.createElement("img", {
      src: imgSrc,
      alt: `Image ${idx + 1}`,
      loading: idx === 0 ? 'eager' : 'lazy',
      className: "w-full h-full object-cover pointer-events-none",
      onLoad: idx === 0 ? handleMediaLoad : undefined,
      draggable: "false" }
    )
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10" },
    imageList.map((_, idx) => /*#__PURE__*/
    React.createElement("div", { key: idx, className: "transition-all duration-300", style: {
        width: idx === activeIdx ? '18px' : '6px',
        height: '6px',
        borderRadius: '3px',
        background: idx === activeIdx ? 'white' : 'rgba(255,255,255,0.4)'
      } })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white font-bold pointer-events-none z-10" },
    activeIdx + 1, "/", imageList.length
    )
    ) : /*#__PURE__*/

    /* ── SINGLE IMAGE ──────────────────────────────── */
    React.createElement("div", {
      className: "absolute inset-0",
      onTouchStart: onSingleTouchStart,
      onTouchMove: onSingleTouchMove,
      onTouchEnd: onSingleTouchEnd,
      style: { transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' } }, /*#__PURE__*/

    React.createElement("img", {
      src: src,
      alt: "Post media",
      loading: "lazy",
      className: "w-full h-full object-cover pointer-events-none",
      onLoad: handleMediaLoad,
      draggable: "false" }
    )
    )

    ));

};

// ─── FULL-SCREEN IMAGE VIEWER (multi-image swipe + pinch-zoom) ─────────────
const ImageViewer = ({ src, type, images, initialIndex = 0, onClose }) => {
  // Normalize: images[] takes priority; fall back to single src
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

  // ── Touch handlers (pinch + pan + swipe) ────────────────────────────────
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const t1 = e.touches[0],t2 = e.touches[1];
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
      const t1 = e.touches[0],t2 = e.touches[1];
      const d = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      setScale(Math.min(Math.max(d / initialDist.current * lastScale.current, 1), 5));
    } else if (e.touches.length === 1 && scale > 1) {
      const newX = e.touches[0].pageX - lastTouch.current.x;
      const newY = e.touches[0].pageY - lastTouch.current.y;
      const limitX = (scale - 1) * (window.innerWidth / 2);
      const limitY = (scale - 1) * (window.innerHeight / 2);
      setPosition({ x: Math.min(Math.max(newX, -limitX), limitX), y: Math.min(Math.max(newY, -limitY), limitY) });
    } else if (e.touches.length === 1 && isDragging && isMulti && scale <= 1) {
      const delta = e.touches[0].clientX - dragStart.current;
      if (currentIdx === 0 && delta > 0 || currentIdx === imgList.length - 1 && delta < 0) {
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
        setCurrentIdx((i) => i + 1);
        resetZoom();
      } else if (dragDelta > SWIPE_THRESHOLD && currentIdx > 0) {
        setCurrentIdx((i) => i - 1);
        resetZoom();
      }
      setDragDelta(0);
      dragStart.current = null;
    }
  };

  const handleDoubleTap = (e) => {
    e.stopPropagation();
    if (scale > 1) {resetZoom();} else {setScale(2.5);}
  };

  return (/*#__PURE__*/
    React.createElement("div", {
      className: "fixed inset-0 z-[100] bg-black animate-fade-in overflow-hidden",
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd }, /*#__PURE__*/


    React.createElement("button", {
      className: "absolute top-5 right-5 p-2.5 bg-white/10 rounded-full text-white z-50 backdrop-blur-sm",
      onClick: onClose }, /*#__PURE__*/

    React.createElement(Icon, { icon: "X", size: 22 })
    ),


    isMulti && /*#__PURE__*/
    React.createElement("div", { className: "absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-bold z-50" },
    currentIdx + 1, " / ", imgList.length
    ),


    isVideo ? /*#__PURE__*/
    /* ── Full-screen video ─────────── */
    React.createElement("div", { className: "w-full h-full flex items-center justify-center p-4", onClick: onClose }, /*#__PURE__*/
    React.createElement("video", {
      src: src,
      className: "max-w-full max-h-full object-contain",
      controls: true, autoPlay: true,
      onClick: (e) => e.stopPropagation() }
    )
    ) :
    isMulti ? /*#__PURE__*/
    /* ── Multi-image swipeable fullscreen ── */
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", {
      className: "absolute inset-0 flex items-center",
      style: {
        transform: `translateX(calc(${-currentIdx * (100 / imgList.length)}% + ${dragDelta}px))`,
        transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
        width: `${imgList.length * 100}%`
      } },

    imgList.map((imgSrc, idx) => /*#__PURE__*/
    React.createElement("div", { key: idx, className: "h-full flex items-center justify-center flex-shrink-0", style: { width: `${100 / imgList.length}%` } }, /*#__PURE__*/
    React.createElement("img", {
      src: imgSrc,
      alt: `Image ${idx + 1}`,
      className: "max-w-full max-h-full object-contain select-none p-2",
      style: idx === currentIdx ? { transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s' } : {},
      onDoubleClick: idx === currentIdx ? handleDoubleTap : undefined,
      draggable: "false",
      onClick: (e) => e.stopPropagation() }
    )
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none z-50" },
    imgList.map((_, idx) => /*#__PURE__*/
    React.createElement("div", { key: idx, style: {
        width: idx === currentIdx ? '20px' : '6px',
        height: '6px', borderRadius: '3px',
        background: idx === currentIdx ? 'white' : 'rgba(255,255,255,0.4)',
        transition: 'all 0.3s'
      } })
    )
    )
    ) : /*#__PURE__*/

    /* ── Single image ──────────────── */
    React.createElement("div", {
      className: "w-full h-full flex items-center justify-center",
      onClick: onClose }, /*#__PURE__*/

    React.createElement("img", {
      src: imgList[0] || src,
      className: "max-w-full max-h-full object-contain p-2 select-none",
      style: { transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s ease-out' },
      onDoubleClick: handleDoubleTap,
      onClick: (e) => e.stopPropagation(),
      draggable: "false" }
    )
    )

    ));

};

// ─── FULL-SCREEN POST VIEWER ──────────────────────────────────────────────
const FullPostViewer = ({ post, onClose, userProfile, savedPosts, toggleSave, handleRemovePost, handleEditPost, handleAddComment, handleShare, postComments, setViewingImage, setShowOnboardingModal, isGuest }) => {
  if (!post) return null;

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[110] bg-[#070A12] animate-fade-in flex flex-col overflow-hidden" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between px-5 h-[60px] border-b border-white/5 bg-[#070A12]/80 backdrop-blur-xl shrink-0" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {vibrate(5);onClose();},
      className: "text-white/60 hover:text-white transition-colors p-2 -ml-2 active:scale-90" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "ArrowLeft", size: 24, className: "stroke-[2.5px]" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-lg tracking-wide text-white" }, "Opinions"), /*#__PURE__*/
    React.createElement("div", { className: "w-10" }), " "
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex-1 overflow-y-auto px-4 py-6 no-scrollbar pb-20" }, /*#__PURE__*/
    React.createElement("div", { className: "max-w-2xl mx-auto" }, /*#__PURE__*/
    React.createElement(PostCard, {
      post: post,
      onRemove: handleRemovePost,
      onEdit: handleEditPost,
      onBookmark: toggleSave,
      onShare: handleShare,
      userProfile: userProfile,
      savedPosts: savedPosts,
      comments: postComments[post.id] || [],
      isGuest: isGuest,
      onAuthRequired: () => setShowOnboardingModal(true),
      onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }) }
    )
    )
    )
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
const MenuDrawer = ({ isOpen, onClose, onLogout, userProfile, isGuest, onAuthRequired }) => {
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
      className: `fixed top-0 left-0 h-full z-50 w-[90%] md:w-[400px] bg-[#070A12]/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl transform transition-transform duration-[350ms] cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ptr-ignore ${isOpen ? 'translate-x-0' : '-translate-x-full'}` }, /*#__PURE__*/


    React.createElement("div", { className: "absolute top-0 left-0 w-full h-96 bg-neon/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" }), /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-0 right-0 w-full h-80 bg-indigo-900/10 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3 pointer-events-none" }), /*#__PURE__*/

    React.createElement("div", { className: "relative flex-1 flex flex-col overflow-y-auto no-scrollbar px-6 pt-safe pb-safe" }, /*#__PURE__*/


    React.createElement("div", { className: "flex justify-between items-center mt-6 mb-6" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-heading font-bold tracking-[0.2em] text-muted uppercase" }, "Menu"), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-3 -mr-3 text-muted active:text-white transition-colors active:scale-95 touch-manipulation" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 26 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative rounded-2xl p-5 mb-8 overflow-hidden group shrink-0 active:scale-[0.99] transition-transform duration-200 cursor-pointer", onClick: () => !isGuest ? goTo('PRIVATE OWNER PROFILE.HTML') : onAuthRequired() },
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
    React.createElement("span", { className: "text-cyan-100 text-[11px] font-heading font-bold tracking-wider uppercase" }, "RQS ", userProfile.rqs_score || 0)
    )
    ), /*#__PURE__*/

    React.createElement("h2", { className: "text-white font-heading font-bold text-xl tracking-wide mb-0.5" }, userProfile.full_name), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm font-medium" }, "@", userProfile.username)
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 space-y-3 pt-2" }, /*#__PURE__*/
    React.createElement("div", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-2" }, "Settings"), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "BookMark", label: "Bookmarks", onClick: () => !isGuest ? goTo('BOOKMARKS.HTML') : onAuthRequired() }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "Moon", label: "Appearance", subLabel: "PlusOpinion Midnight", hasAction: true, onClick: () => {} }), /*#__PURE__*/

    React.createElement("div", { className: "h-px bg-white/5 w-full my-4" }), /*#__PURE__*/

    React.createElement("div", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-2" }, "Support & Legal"), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "FileText", label: "Terms & Conditions", onClick: () => goTo('TERMS_AND_CONDITIONS.HTML') }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "Shield", label: "Privacy Policy", onClick: () => goTo('PRIVACY_POLICY.HTML') }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "LifeBuoy", label: "Help and Support", onClick: () => goTo('SUPPORT.HTML') }), /*#__PURE__*/
    React.createElement(MenuItem, { icon: "Info", label: "About", onClick: () => goTo('ABOUT.HTML') })
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
    React.createElement("span", { className: "text-[10px] text-muted font-mono tracking-widest uppercase" }, "PlusOpinion Beta \u2022 ", /*#__PURE__*/
    React.createElement("span", { className: "app-version" })
    )
    )
    )

    )
    )
    ));

};

// LENS OVERLAY - Universal Search System
const LensOverlay = ({ isOpen, onClose, handleRemove, onShare, onAddComment, onSave, onImageClick, onEdit, userProfile, savedPosts = new Set(), setShowExploreModal, setAllProfiles }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('trending');
  const [results, setResults] = useState([]);
  const [profileResults, setProfileResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [quickSearches, setQuickSearches] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [topReviewers, setTopReviewers] = useState([]);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  // Load initial data when overlay opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Load data based on active filter
  useEffect(() => {
    if (isOpen && !searchQuery) {
      applyFilter(activeFilter);
    }
  }, [isOpen, activeFilter, searchQuery]);

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {document.body.style.overflow = '';};
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      // Load recent searches (user's search history)
      const user = await window.getCurrentUser();
      if (user) {
        const searches = await window.getRecentSearches(user.id, 10);
        setQuickSearches(searches);
      }

      // Load popular products (only posts with images)
      const products = await window.getPopularProducts(10);
      setPopularProducts(products);

      // Load top reviewers
      const reviewers = await window.getTopReviewers(5);
      setTopReviewers(reviewers);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const applyFilter = async (filter) => {
    setIsSearching(true);
    try {
      let data = [];

      switch (filter) {
        case 'foryou':
          const user = await window.getCurrentUser();
          data = await window.getForYouFeed(user?.id, 15);
          break;
        case 'trending':
          data = await window.getTrendingPosts(15);
          break;
        case 'verified':
          const { data: verifiedData, error: verifiedError } = await window.supabase.
          from('posts').
          select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`).
          eq('is_verified_purchase', true).
          eq('is_deleted', false).
          eq('is_draft', false).
          order('created_at', { ascending: false }).
          limit(15);
          if (verifiedError) throw verifiedError;
          data = verifiedData || [];
          break;
        case 'highrqs':
          const highRQSData = await window.getHighRQSContent(15);
          data = highRQSData.posts || [];
          // Also set profile results for High RQS users
          setProfileResults(highRQSData.profiles || []);
          break;
        default:
          data = await window.getTrendingPosts(15);
      }

      setResults(transformPosts(data));
    } catch (error) {
      console.error('Filter failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Universal Search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchQuery.trim()) {
      setProfileResults([]);
      if (isOpen) applyFilter(activeFilter);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const q = searchQuery.toLowerCase();

        // Save search query to history
        const user = await window.getCurrentUser();
        if (user) {
          await window.saveSearchQuery(user.id, q);
          // Refresh recent searches
          const searches = await window.getRecentSearches(user.id, 10);
          setQuickSearches(searches);
        }

        // Search profiles
        const profiles = await window.searchProfiles(q, 10);
        setProfileResults(profiles);

        // Search posts
        const { data, error } = await window.supabase.
        from('posts').
        select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`).
        or(`text_content.ilike.%${q}%,product_name.ilike.%${q}%,category.ilike.%${q}%,brand_name.ilike.%${q}%`).
        eq('is_deleted', false).
        eq('is_draft', false).
        limit(20);

        if (error) throw error;
        setResults(data ? transformPosts(data) : []);
      } catch (e) {
        console.error("Search failed:", e);
        setResults([]);
        setProfileResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);

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
    LENS_FILTERS.map((filter) => /*#__PURE__*/
    React.createElement("button", {
      key: filter.id,
      onClick: () => {vibrate(5);setActiveFilter(filter.id);},
      className: `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeFilter === filter.id ? 'bg-neon/10 border-neon text-neon shadow-[0_0_10px_rgba(47,139,255,0.2)]' : 'bg-white/5 border-white/5 text-muted hover:text-white'}` },

    filter.icon && /*#__PURE__*/React.createElement(Icon, { icon: filter.icon, size: 12 }),
    filter.label
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 overflow-y-auto no-scrollbar bg-[#020205] pb-24 ptr-enabled" },


    !searchQuery && quickSearches.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "px-4 py-6 border-b border-white/5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-[10px] font-bold text-muted uppercase tracking-widest mb-3 pl-1" }, "Recent Searches"), /*#__PURE__*/
    React.createElement("div", { className: "flex flex-wrap gap-2" },
    quickSearches.map((keyword, idx) => /*#__PURE__*/
    React.createElement("div", {
      key: `${keyword}-${idx}`,
      className: "relative" }, /*#__PURE__*/

    React.createElement("button", {
      className: "px-3 py-1.5 pr-7 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 hover:border-neon/50 hover:text-white transition-all active:scale-95",
      onClick: () => {vibrate(5);setSearchQuery(keyword);} }, /*#__PURE__*/

    React.createElement(Icon, { icon: "Clock", size: 10, className: "text-neon" }), " ", keyword
    ), /*#__PURE__*/
    React.createElement("button", {
      className: "absolute right-0 top-0 bottom-0 px-2 rounded-r-lg text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all z-10 flex items-center justify-center",
      onClick: async (e) => {
        e.preventDefault();
        e.stopPropagation();
        vibrate(5);

        // Optimistic UI update for immediate feedback
        setQuickSearches((prev) => prev.filter((k) => k !== keyword));

        try {
          const user = await window.getCurrentUser();
          if (user) {
            await window.deleteSearchQuery(user.id, keyword);
          }
        } catch (err) {
          console.error("Failed to delete search query:", err);
        }
      } }, /*#__PURE__*/

    React.createElement(Icon, { icon: "X", size: 12 })
    )
    )
    )
    )
    ),



    !searchQuery && popularProducts.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "px-4 py-6 border-b border-white/5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-bold text-white font-heading" }, "Popular Products"), /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2" },
    popularProducts.map((product, idx) => /*#__PURE__*/
    React.createElement("div", {
      key: idx,
      className: "flex-shrink-0 w-32 group cursor-pointer snap-start",
      onClick: () => {vibrate(5);setSearchQuery(product.name);} }, /*#__PURE__*/

    React.createElement("div", { className: "relative aspect-[4/5] overflow-hidden rounded-xl bg-[#0B1221] border border-white/5 group-hover:border-neon/30 transition-colors" }, /*#__PURE__*/
    React.createElement("img", { src: product.image, className: "w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity", alt: product.name }), /*#__PURE__*/
    React.createElement("div", { className: "absolute top-1.5 right-1.5 rqs-pill px-1.5 py-0.5 rounded text-[8px] font-bold text-white shadow-lg" }, product.rqs), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" }), /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-2 left-2 right-2" }, /*#__PURE__*/
    React.createElement("p", { className: "text-[9px] text-neon font-bold uppercase mb-0.5 tracking-wider truncate" }, product.brand), /*#__PURE__*/
    React.createElement("h4", { className: "text-xs font-bold text-white leading-tight truncate" }, product.name)
    )
    )
    )
    )
    )
    ),



    !searchQuery && topReviewers.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "px-4 py-6 border-b border-white/5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-bold text-white font-heading mb-4" }, "Top Reviewers"), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2" },
    topReviewers.map((reviewer, idx) => /*#__PURE__*/
    React.createElement("div", {
      key: reviewer.id,
      className: "flex-shrink-0 w-16 flex flex-col items-center gap-2 snap-start cursor-pointer active:scale-95 transition-transform",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        vibrate(5);
        console.log('Navigating to profile:', reviewer.id);
        window.location.href = `PUBLIC POV PROFILE.HTML?id=${reviewer.id}`;
      } }, /*#__PURE__*/

    React.createElement("div", { className: "relative pointer-events-none" }, /*#__PURE__*/
    React.createElement(Avatar, {
      src: reviewer.avatar_url,
      className: "w-14 h-14 rounded-full border border-white/10 object-cover shrink-0 pointer-events-none",
      fallbackSize: 24 }
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 shadow-lg pointer-events-none" }, /*#__PURE__*/
    React.createElement("div", { className: "rqs-pill px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white pointer-events-none" }, reviewer.rqs_score)
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-gray-300 font-medium truncate w-full text-center pointer-events-none" }, "@", reviewer.username)
    )
    ), /*#__PURE__*/
    React.createElement("div", {
      className: "flex-shrink-0 w-20 flex flex-col items-center justify-center gap-2 snap-start cursor-pointer",
      onClick: async () => {
        vibrate(5);
        const profiles = await window.getAllProfiles();
        setAllProfiles(profiles);
        setShowExploreModal(true);
      } }, /*#__PURE__*/

    React.createElement("div", { className: "w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-neon hover:bg-white/10 transition-colors shadow-lg" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ArrowRight", size: 20 })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-neon font-medium tracking-wide" }, "Explore More")
    )
    )
    ),



    searchQuery && profileResults.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "px-4 pt-4 pb-2" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs font-bold text-muted uppercase tracking-widest mb-3" }, "Profiles"), /*#__PURE__*/
    React.createElement("div", { className: "space-y-2 mb-6" },
    profileResults.map((profile) => /*#__PURE__*/
    React.createElement("div", {
      key: profile.id,
      className: "flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon/30 transition-all cursor-pointer active:scale-[0.98]",
      onClick: () => {vibrate(5);window.location.href = `PUBLIC POV PROFILE.HTML?id=${profile.id}`;} }, /*#__PURE__*/

    React.createElement(Avatar, {
      src: profile.avatar_url,
      className: "w-12 h-12 rounded-full border border-white/10 object-cover shrink-0",
      fallbackSize: 20 }
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-1 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("h4", { className: "text-sm font-bold text-white truncate" }, profile.full_name),
    profile.is_verified && /*#__PURE__*/React.createElement(Icon, { icon: "CheckCircle", size: 14, className: "text-neon shrink-0" })
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted" }, "@", profile.username)
    ), /*#__PURE__*/
    React.createElement("div", { className: "rqs-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-white shrink-0 flex items-center gap-1" }, /*#__PURE__*/
    React.createElement("span", { className: "opacity-70" }, "RQS"), /*#__PURE__*/
    React.createElement("span", null, profile.rqs_score)
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

    searchQuery ? `${profileResults.length > 0 ? 'Opinions' : `Results for "${searchQuery}"`}` : `🔥 ${activeFilter === 'foryou' ? 'For You' : activeFilter === 'verified' ? 'Verified Purchases' : activeFilter === 'highrqs' ? 'High RQS Content' : 'Top Engagement'}`

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-4" },
    results.length > 0 ?
    results.map((post, i) => /*#__PURE__*/
    React.createElement(PostCard, {
      key: post.id,
      post: post,
      index: i,
      userProfile: userProfile,
      savedPosts: savedPosts,
      comments: [],
      onComment: () => {},
      onShare: onShare,
      onMore: () => {},
      onSave: onSave,
      onAddComment: onAddComment,
      onImageClick: onImageClick,
      onRemove: handleRemove,
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

// AUTH MODAL (Login/Signup)
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

        // Notify admin of new lead
        try {
          fetch("https://formspree.io/f/xvgzlowy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              name: formData.name,
              source: "Homepage AuthModal"
            })
          });
        } catch (e) {}

        if (signupData?.session) {
          window.location.href = 'ONBOARDING.HTML';
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
            window.location.href = 'ONBOARDING.HTML';
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

    React.createElement("video", {
      autoPlay: true,
      loop: true,
      muted: true,
      playsInline: true,
      className: "absolute inset-0 w-full h-full object-cover opacity-30" }, /*#__PURE__*/

    React.createElement("source", { src: "/bg-video.mp4", type: "video/mp4" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/90 backdrop-blur-xl animate-up", onClick: () => isClosable && onClose() }), /*#__PURE__*/
    React.createElement("div", { className: "w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl relative animate-up border border-white/10 shadow-blue-500/10", onClick: (e) => e.stopPropagation() },
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
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Full Name ", /*#__PURE__*/React.createElement("span", { className: "text-red-500" }, "*")), /*#__PURE__*/
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
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Email Address ", /*#__PURE__*/React.createElement("span", { className: "text-red-500" }, "*")), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.email,
      onChange: (e) => {setFormData({ ...formData, email: e.target.value });setInlineEmailError(null);},
      type: "email",
      placeholder: "john@example.com",
      className: `w-full bg-[#050a15] border ${inlineEmailError ? 'border-red-500 text-red-500' : 'border-white/10 text-white'} px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-sm transition-all` }
    ),
    inlineEmailError && /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5 mt-2 ml-1 text-red-500 text-[13px] font-medium" }, /*#__PURE__*/
    React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "w-3.5 h-3.5" }, /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), /*#__PURE__*/React.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })), /*#__PURE__*/
    React.createElement("span", null, inlineEmailError)
    )

    ), /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Password ", /*#__PURE__*/React.createElement("span", { className: "text-red-500" }, "*")), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.password,
      onChange: (e) => setFormData({ ...formData, password: e.target.value }),
      type: "password",
      placeholder: mode === 'signup' ? "Enter password (min 6 characters)" : "Enter your password",
      className: "w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all" }
    )
    ),

    mode === 'signup' && /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase" }, "Confirm Password ", /*#__PURE__*/React.createElement("span", { className: "text-red-500" }, "*")), /*#__PURE__*/
    React.createElement("input", {
      required: true,
      value: formData.confirmPassword,
      onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }),
      type: "password",
      placeholder: "Re-enter password",
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
      className: `w-full ${mode === 'signup' ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-blue-500/50 shadow-blue-500/30' : 'bg-blue-600 hover:bg-blue-500'} text-white py-4 rounded-2xl font-bold tracking-wide transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed` },

    loading ? mode === 'login' ? 'LOGGING IN...' : 'CREATING ACCOUNT...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT', /*#__PURE__*/
    React.createElement(Icon, { icon: "ArrowRight", size: 18 })
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative flex py-2 items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex-grow border-t border-slate-700" }), /*#__PURE__*/
    React.createElement("span", { className: "flex-shrink-0 mx-4 text-slate-500 text-xs" },
    mode === 'login' ? 'OR LOGIN WITH' : 'OR CONTINUE WITH'
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex-grow border-t border-slate-700" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "google-sso-container", "data-action": "signin" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-6 text-center text-sm text-slate-400" },
    mode === 'login' ? "Don't have an account?" : "Already have an account?", /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        vibrate(5);
        setMode(mode === 'login' ? 'signup' : 'login');
        setError(null);
      },
      className: "text-blue-400 hover:text-blue-300 font-bold ml-1 active:scale-95 transition-transform" },

    mode === 'login' ? 'Sign Up' : 'Log In'
    )
    )
    )
    ));

};

// EXPLORE PROFILES MODAL
const ExploreProfilesModal = ({ isOpen, onClose, profiles }) => {
  if (!isOpen) return null;

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 bg-black/95 z-[9999] flex flex-col" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between px-4 py-3 border-b border-white/10" }, /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "text-white/60 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ArrowLeft", size: 24 })
    ), /*#__PURE__*/
    React.createElement("h2", { className: "text-lg font-bold text-white" }, "Explore Profiles"), /*#__PURE__*/
    React.createElement("div", { className: "w-6" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 overflow-y-auto p-4" }, /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-2 gap-3 max-w-2xl mx-auto" },
    profiles.map((profile) => /*#__PURE__*/
    React.createElement("div", {
      key: profile.id,
      className: "bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 hover:border-neon/50 transition-all active:scale-95",
      onClick: () => {
        vibrate(5);
        window.location.href = `PUBLIC POV PROFILE.HTML?id=${profile.id}`;
      } }, /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col items-center gap-2" }, /*#__PURE__*/
    React.createElement(Avatar, {
      src: profile.avatar_url,
      className: "w-16 h-16 rounded-full border border-white/10 object-cover",
      fallbackSize: 32 }
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-center w-full" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-bold text-white truncate" }, profile.full_name || 'Anonymous'), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-gray-400 truncate" }, "@", profile.username), /*#__PURE__*/
    React.createElement("div", { className: "rqs-pill px-2 py-0.5 rounded-full text-[10px] font-bold text-white mt-2 inline-block" }, "RQS ",
    profile.rqs_score || 0
    )
    )
    )
    )
    )
    ),

    profiles.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "text-center py-12 text-muted" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Users", size: 48, className: "mx-auto mb-4 opacity-50" }), /*#__PURE__*/
    React.createElement("p", null, "No profiles found")
    )

    )
    ));

};

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
  const MAX_CHARS = 400;
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
  const [recentContacts, setRecentContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!isOpen || !window.getCurrentUser) return;
      setIsLoadingContacts(true);
      try {
        const user = await window.getCurrentUser();
        if (!user) return;

        const { data } = await window.supabase.
        from('conversations').
        select(`
                                id,
                                participant_1_id,
                                participant_2_id
                            `).
        or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`).
        order('last_message_at', { ascending: false }).
        limit(10);

        if (data && data.length > 0) {
          const otherIds = [...new Set(data.map((c) => c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id))];

          const { data: profiles } = await window.supabase.
          from('profiles').
          select('id, full_name, avatar_url, username').
          in('id', otherIds);

          if (profiles) {
            const profileMap = {};
            profiles.forEach((p) => profileMap[p.id] = p);

            const contacts = data.map((c) => {
              const otherId = c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id;
              const profile = profileMap[otherId];
              if (!profile) return null;
              return { convId: c.id, ...profile };
            }).filter(Boolean);

            if (window.rewriteMediaUrl) {
              contacts.forEach((c) => {
                if (c.avatar_url) c.avatar_url = window.rewriteMediaUrl(c.avatar_url);
              });
            }
            setRecentContacts(contacts);
          }
        }
      } catch (e) {
        console.error('Failed to load contacts for share menu', e);
      } finally {
        setIsLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [isOpen]);

  const toggleContact = (contact) => {
    const next = new Set(selectedContacts);
    if (next.has(contact.id)) next.delete(contact.id);else
    next.add(contact.id);
    setSelectedContacts(next);
    vibrate(5);
  };

  const handleBatchSend = async () => {
    if (selectedContacts.size === 0 || isSending) return;

    if (!window.sendPostToUser) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Sharing system initializing...', icon: 'Clock', isSuccess: false }
      }));
      return;
    }

    setIsSending(true);
    vibrate(10);

    const contactsToSend = recentContacts.filter((c) => selectedContacts.has(c.id));
    let successCount = 0;

    for (const contact of contactsToSend) {
      try {
        await window.sendPostToUser(contact.convId, contact.id, contact.full_name || contact.username, contact.avatar_url, post);
        successCount++;
      } catch (e) {
        console.error(`Failed to send to ${contact.username}`, e);
      }
    }

    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        message: `Post shared with ${successCount} profile${successCount > 1 ? 's' : ''}`,
        icon: 'Send',
        isSuccess: true
      }
    }));

    setIsSending(false);
    onClose();
  };

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
    React.createElement("div", { className: "relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] flex flex-col" }, /*#__PURE__*/

    React.createElement("div", { className: "w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" }), /*#__PURE__*/

    React.createElement("div", { className: "flex justify-between items-center mb-6 shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "text-white font-heading font-bold text-lg" }, "Share Opinion"), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 20 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar pr-1" }, /*#__PURE__*/

    React.createElement("div", { className: "mb-6 shrink-0 transform scale-[0.98] origin-top" }, /*#__PURE__*/
    React.createElement(PostCard, { post: post, isGuest: true, hideActions: true })
    ), /*#__PURE__*/


    React.createElement("div", { className: "mb-8 overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-white/40 uppercase tracking-widest" }, "Share to Profiles"),
    selectedContacts.size > 0 && /*#__PURE__*/
    React.createElement("button", { onClick: () => setSelectedContacts(new Set()), className: "text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase" }, "Clear Selection (", selectedContacts.size, ")")

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-4 overflow-x-auto select-none custom-scrollbar pb-2 px-1" }, /*#__PURE__*/

    React.createElement("button", {
      onClick: () => {
        onClose();
        if (window.openInbox) {
          window.openInbox();
          setTimeout(() => {
            if (window._inboxBootPhase1 && window._inboxBootPhase1.openSearchOverlay) {
              window._inboxBootPhase1.openSearchOverlay();
            }
          }, 500);
        }
      },
      className: "flex flex-col items-center gap-2 group min-w-[64px] shrink-0" }, /*#__PURE__*/

    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-lg" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Search", size: 24, className: "text-white/70 group-hover:text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-white/70 group-hover:text-white truncate w-14 text-center" }, "Search")
    ),

    isLoadingContacts && /*#__PURE__*/React.createElement("div", { className: "text-white/40 text-xs py-3 px-4" }, "Loading..."),

    !isLoadingContacts && recentContacts.map((c) => {
      const isSelected = selectedContacts.has(c.id);
      return (/*#__PURE__*/
        React.createElement("button", {
          key: c.id,
          onClick: () => toggleContact(c),
          className: "flex flex-col items-center gap-2 group min-w-[64px] shrink-0" }, /*#__PURE__*/

        React.createElement("div", { className: `w-14 h-14 rounded-full border-2 transition-all duration-300 relative ${isSelected ? 'border-blue-500 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10 hover:border-white/30'}` }, /*#__PURE__*/
        React.createElement(Avatar, { src: c.avatar_url, className: "w-full h-full rounded-full object-cover", fallbackSize: 24 }),
        isSelected && /*#__PURE__*/
        React.createElement("div", { className: "absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-[#121212] animate-pop" }, /*#__PURE__*/
        React.createElement(Icon, { icon: "Check", size: 10, className: "text-white" })
        )

        ), /*#__PURE__*/
        React.createElement("span", { className: `text-[10px] truncate w-14 text-center transition-colors ${isSelected ? 'text-blue-400 font-bold' : 'text-white/70 group-hover:text-white'}` },
        c.full_name?.split(' ')[0] || c.username
        )
        ));

    })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "mt-2 mb-20" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-4" }, "Share Everywhere"), /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-4 gap-4 mb-4" }, /*#__PURE__*/
    React.createElement("button", { onClick: handleCopy, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Link", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted text-center" }, "Copy Link")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleWhatsApp, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "WhatsApp", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted text-center" }, "WhatsApp")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleInstagram, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Instagram", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted text-center" }, "Instagram")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: handleMore, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "MoreHorizontal", size: 24, className: "text-blue-400" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted text-center" }, "More")
    )
    )
    )
    ),


    selectedContacts.size > 0 && /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-0 left-0 right-0 p-4 bg-[#121212] border-t border-white/10 animate-slide-up z-20" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: handleBatchSend,
      disabled: isSending,
      className: "w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10" },

    isSending ? /*#__PURE__*/
    React.createElement("div", { className: "w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" }) : /*#__PURE__*/

    React.createElement(Icon, { icon: "Send", size: 20 }), /*#__PURE__*/

    React.createElement("span", null, "Send to ", selectedContacts.size, " profile", selectedContacts.size > 1 ? 's' : '')
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
    React.createElement("div", { className: "fixed inset-0 z-[60] flex items-end justify-center sm:px-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in", onClick: onClose }), /*#__PURE__*/
    React.createElement("div", { className: "relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col" }, /*#__PURE__*/

    React.createElement("div", { className: "w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" }), /*#__PURE__*/

    React.createElement("div", { className: "flex justify-between items-center mb-6 shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "text-white font-heading font-bold text-lg flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "AlertTriangle", size: 20, className: "text-red-500" }),
    step === 1 ? 'Report Opinion' : 'Select action'
    ), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 20 })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 overflow-y-auto no-scrollbar" },
    step === 1 ? /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("p", { className: "text-sm text-gray-400 mb-4 px-1" }, "Why are you reporting this opinion? Please select a reason."), /*#__PURE__*/
    React.createElement("div", { className: "space-y-1.5" },
    REASONS.map((r, i) => /*#__PURE__*/
    React.createElement("button", {
      key: i,
      onClick: () => handleReasonSelect(r),
      className: "w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/90 transition-all active:scale-[0.98] border border-white/5" },

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
      className: "w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all" },
    "Remove this post from my feed"

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => handleAction('keep'),
      className: "w-full py-4 rounded-xl bg-white/5 text-gray-300 font-bold text-sm border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all" },
    "Keep this post on feed"

    )
    )
    )

    )
    )
    ));

};

const EditModal = ({ isOpen, onClose, post, onSave }) => {
  const [text, setText] = useState(post?.text || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && post) setText(post.text);
  }, [isOpen, post]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    try {
      await window.editPost(post.id, text);
      onSave(post.id, text);
      onClose();
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion updated', icon: 'Check', isSuccess: true } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: e.message || 'Failed to update', icon: 'AlertTriangle', isSuccess: false } }));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" }, /*#__PURE__*/
    React.createElement("div", { className: "bg-[#0A0F1D] border border-white/10 rounded-2xl w-[90%] max-w-lg p-6 relative shadow-2xl animate-scale-in" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xl font-heading font-bold text-white mb-4" }, "Edit Opinion"), /*#__PURE__*/
    React.createElement("textarea", {
      className: "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none h-40 focus:outline-none focus:border-neon/50 transition-colors",
      value: text,
      onChange: (e) => setText(e.target.value) }
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex justify-end gap-3 mt-4" }, /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 transition-colors" }, "Cancel"), /*#__PURE__*/
    React.createElement("button", {
      onClick: handleSave,
      disabled: isSaving,
      className: "px-6 py-2 rounded-lg text-sm font-medium bg-neon text-black font-bold hover:bg-neon/90 transition-colors disabled:opacity-50" },

    isSaving ? 'Saving...' : 'Save Changes'
    )
    )
    )
    ));

};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [navVisible, setNavVisible] = useState(true);
  const [fabVisible, setFabVisible] = useState(true);
  const [userProfile, setUserProfile] = useState({
    id: null,
    full_name: "Guest User",
    username: "guest",
    avatar_url: "",
    banner_url: "",
    rqs: 0
  });
  const [isGuest, setIsGuest] = useState(false);
  const [deepLinkedPost, setDeepLinkedPost] = useState(null);
  const [feedFilters, setFeedFilters] = useState({ source: 'All', type: 'All', category: null });

  // Inbox count state for the top header badge
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  // Listen for Hash Changes (Category Filter)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#category=')) {
        const catId = decodeURIComponent(hash.replace('#category=', ''));
        console.log("Filtering by category:", catId);
        setFeedFilters((prev) => ({ ...prev, category: catId }));
        // Clear hash after setting filter? Or keep it for persistent link? 
        // Keep it for now so refresh works.
      } else if (!hash) {
        setFeedFilters((prev) => ({ ...prev, category: null }));
      }
    };

    // Check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);




  // --- DATA STATE ---
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postComments, setPostComments] = useState({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [seenIds, setSeenIds] = useState(new Set()); // CRITICAL: For deduplication in random shuffle
  // ALGORITHM BRAIN: Feed mode controls which algorithm powers the feed
  const [feedMode, setFeedMode] = useState('for-you'); // 'for-you' | 'trending' | 'verified' | 'high-rqs'
  const seenIdsByMode = useRef({ 'for-you': new Set(), 'trending': new Set(), 'verified': new Set(), 'high-rqs': new Set() });
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());
  const [hiddenItems, setHiddenItems] = useState({ posts: [], brands: [], categories: [] });

  // Ref to track the latest fetch to prevent race conditions when multiple overlapping fetches are triggered on mount
  const activeFetchIdRef = useRef(0);

  // Portals for internal messaging payloads
  const [sharedPostsToRender, setSharedPostsToRender] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Fetch hidden items on load
  useEffect(() => {
    const loadHiddenItems = async () => {
      try {
        let hidden = await window.getHiddenItems();
        // Validate shape, fallback if array or null
        if (!hidden || Array.isArray(hidden) || !hidden.posts) {
          hidden = { posts: [], brands: [], categories: [] };
        }
        setHiddenItems(hidden);

        // Also populate local hiddenPostIds for UI consistency
        if (hidden.posts && hidden.posts.length > 0) {
          setHiddenPostIds((prev) => {
            const next = new Set(prev);
            hidden.posts.forEach((id) => next.add(id));
            return next;
          });
        }
      } catch (e) {console.error('Failed to load hidden items', e);}
    };
    loadHiddenItems();
  }, []);



  const [removedPosts, setRemovedPosts] = useState(new Set());
  const [undoStack, setUndoStack] = useState([]); // [{type: 'remove', postId: 123}]

  // --- UI STATES ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLensOpen, setIsLensOpen] = useState(false);

  // Report Data State
  const [reportData, setReportData] = useState({});

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

    // Expose openFullPost globally (formerly scrollToPost)
    window.openFullPost = async (postId) => {
      if (window.closeInbox) window.closeInbox();

      try {
        // Check if we already have it in local posts or sharedPostsToRender
        let post = posts.find((p) => p.id === postId);
        if (!post) {
          // Try sharedPostsToRender
          const shared = Object.values(sharedPostsToRender).find((s) => s.post?.id === postId);
          if (shared) post = shared.post;
        }

        if (!post) {
          // Fetch from DB
          const fullPost = await window.getPost(postId);
          if (fullPost) {
            post = {
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
              time: "Shared Post",
              agrees: fullPost.agrees_count || 0,
              comments: fullPost.comments_count || 0,
              seenBy: fullPost.seen_by_brand
            };
          }
        }

        if (post) {
          setViewingFullPost(post);
        } else {
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { msg: 'Post not found', icon: 'AlertTriangle', isSuccess: false }
          }));
        }
      } catch (err) {
        console.error("Error opening full post:", err);
      }
    };
    window.scrollToPost = window.openFullPost;

    return () => window.removeEventListener('render_shared_post', handleRenderSharedPost);
  }, []);

  // --- EXPOSE TOGGLES GLOBALLY ---
  useEffect(() => {
    window.toggleSidebar = () => {vibrate(5);setIsMenuOpen((prev) => !prev);};
    window.toggleLens = () => {
      vibrate(5);
      if (isGuest) {
        setShowAuthModal(true);
        return;
      }
      setIsLensOpen((prev) => !prev);
    };
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
  const [viewingFullPost, setViewingFullPost] = useState(null); // Full-screen post viewer
  const [showOnboardingModal, setShowOnboardingModal] = useState(false); // Onboarding popup


  // Load posts helper (Professional Batch Loading + Smart Shuffle)
  const loadPosts = async (currentOffset = 0, reset = false) => {
    if (isLoadingMore) return; // Guard against rapid fire

    const currentFetchId = ++activeFetchIdRef.current;

    try {
      if (reset) {
        setIsLoadingPosts(true);
        setOffset(0);
        setSeenIds(new Set()); // Reset seen IDs on refresh for a fresh shuffle
      } else {
        setIsLoadingMore(true);
      }

      // FETCH HIDDEN ITEMS (Strict Filtering)
      let hiddenIds = new Set();
      let mutedBrands = new Set();
      let mutedCategories = new Set();

      try {
        const hItems = await window.getHiddenItems();
        if (hItems) {
          if (hItems.posts && Array.isArray(hItems.posts)) hItems.posts.forEach((id) => hiddenIds.add(String(id)));
          if (hItems.brands && Array.isArray(hItems.brands)) hItems.brands.forEach((b) => mutedBrands.add(b));
          if (hItems.categories && Array.isArray(hItems.categories)) hItems.categories.forEach((c) => mutedCategories.add(c));
        }
      } catch (e) {console.warn("Failed to fetch hidden items", e);}

      // ALGORITHM BRAIN: Route to correct feed function based on feedMode
      const currentSeenIds = seenIdsByMode.current[feedMode] || new Set();
      const excludeIdsList = Array.from(reset ? new Set() : currentSeenIds);
      let finalBatch = [];

      // If category filter is active, we always use the legacy getFeed with category filter
      if (feedFilters.category) {
        finalBatch = await window.getFeed({
          limit: 10,
          offset: reset ? 0 : currentOffset,
          category_id: feedFilters.category,
          excludeIds: excludeIdsList,
          shuffle: true
        });
      } else {
        // Route to algorithm brain based on active tab
        switch (feedMode) {
          case 'trending':
            finalBatch = window.getTrendingFeed ? await window.getTrendingFeed(15, excludeIdsList) : await window.getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            break;
          case 'verified':
            finalBatch = window.getVerifiedFeed ? await window.getVerifiedFeed(15, excludeIdsList) : await window.getFeed({ limit: 15, verifiedOnly: true, excludeIds: excludeIdsList, shuffle: true });
            break;
          case 'high-rqs':
            finalBatch = window.getHighRQSFeed ? await window.getHighRQSFeed(15, excludeIdsList) : await window.getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            break;
          case 'for-you':
          default:
            finalBatch = window.getSmartFeed ? await window.getSmartFeed(15, excludeIdsList) : await window.getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            // Fallback: If smart feed returned nothing but we aren't at the end of the global feed
            if (finalBatch.length === 0 && window.getSmartFeed) {
              finalBatch = await window.getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            }
            break;
        }
      }

      if (finalBatch.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (hiddenIds.size > 0) setHiddenPostIds(hiddenIds);

      // APPLY FILTER
      const filteredData = finalBatch.filter((post) => {
        if (mutedBrands.has(post.seen_by_brand || 'None')) return false;
        if (mutedCategories.has(post.category)) return false;
        return true;
      });

      const transformedPosts = filteredData.map((post) => ({
        id: post.id,
        user_id: post.user_id,
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
        isHidden: hiddenIds.has(String(post.id)),
        agrees: post.agrees_count || 0,
        comments: post.comments_count || 0,
        seenBy: post.seen_by_brand
      }));

      // Only shuffle for 'for-you' — other tabs are pre-ordered by the algorithm
      const finalBatchOrdered = feedMode === 'for-you' ?
      [...transformedPosts].sort(() => Math.random() - 0.5) :
      transformedPosts;

      // SAVE TO STATE + update per-mode seen IDs
      if (currentFetchId !== activeFetchIdRef.current) {
        console.log("Stale fetch prevented from overwriting active state.");
        return; // Prevent race conditions
      }

      setPosts((prev) => {
        const newPosts = reset ? finalBatchOrdered : [...prev, ...finalBatchOrdered];
        // Track seen IDs per feed mode for proper deduplication
        const modeSeenSet = seenIdsByMode.current[feedMode] || new Set();
        const nextSeen = new Set(reset ? [] : modeSeenSet);
        finalBatchOrdered.forEach((p) => nextSeen.add(p.id));
        seenIdsByMode.current[feedMode] = nextSeen;
        setSeenIds(nextSeen);
        return newPosts;
      });

      if (!reset) setOffset(currentOffset + 10);

    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      if (currentFetchId === activeFetchIdRef.current) {
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
      }
    }
  };

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
      setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
    }).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload) => {
      setPosts((prev) => prev.map((p) => p.id === payload.new.post_id ? { ...p, agrees: p.agrees + 1 } : p));
    }).
    on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (payload) => {
      setPosts((prev) => prev.map((p) => p.id === payload.old.post_id ? { ...p, agrees: Math.max(0, p.agrees - 1) } : p));
    }).
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
      const currentUser = await window.getCurrentUser();
      if (payload.new.user_id !== currentUser?.id) {
        setPosts((prev) => prev.map((p) => p.id === payload.new.post_id ? { ...p, comments: p.comments + 1 } : p));
      }
    }).
    subscribe();

    return () => {
      window.supabase.removeChannel(channel);
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await window.getMyProfile();
      if (profile) {
        setIsGuest(false);
        setUserProfile({
          id: profile.id,
          full_name: profile.full_name || "User",
          username: profile.username || "",
          avatar_url: profile.avatar_url || "",
          banner_url: profile.banner_url || "",
          rqs_score: profile.rqs_score || 0
        });

        // Load bookmarks for persistence early (using String IDs)
        const { data: bookmarks } = await window.supabase.
        from('bookmarks').
        select('post_id').
        eq('user_id', profile.id);
        if (bookmarks) {
          setSavedPosts(new Set(bookmarks.map((b) => String(b.post_id))));
        }
      } else {
        setIsGuest(true);
        // Lock page if not viewing a deep-linked post
        const searchParams = new URLSearchParams(window.location.search);
        if (!searchParams.get('post') && !window.location.pathname.startsWith('/post/')) {
          setShowOnboardingModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading user profile/bookmarks:', error);
      setIsGuest(true);
      // Lock page if not viewing a deep-linked post
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.get('post') && !window.location.pathname.startsWith('/post/')) {
        setShowOnboardingModal(true);
      }
    }
  };

  // Pull to Refresh Logic
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [sharePostData, setSharePostData] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);



  // Load user profile on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Check for deep-link post parameter
      const searchParams = new URLSearchParams(window.location.search);
      let postId = searchParams.get('post');

      if (!postId && window.location.pathname.startsWith('/post/')) {
        const segments = window.location.pathname.split('/post/');
        if (segments.length > 1 && segments[1]) {
          postId = segments[1].split('/')[0].split('?')[0]; // Clean up ID
        }
      }

      if (postId) {
        try {
          const post = await window.getPost(postId);
          if (post) {
            // Transform to UI post format
            const uiPost = {
              id: post.id,
              user_id: post.user_id,
              name: post.profiles?.full_name || 'PlusOpinion User',
              username: post.profiles?.username || 'user',
              avatar: post.profiles?.avatar_url || "",
              rqs: post.profiles?.rqs_score || 0,
              verified: !!post.profiles?.is_verified,
              category: post.category,
              product: post.product_name,
              text: post.text_content,
              media: post.media_url,
              media_type: post.media_type || 'image',
              images: post.images || null,
              time: "Recent",
              isHidden: false,
              agrees: post.agrees_count || 0,
              comments: post.comments_count || 0,
              seenBy: post.seen_by_brand
            };
            setDeepLinkedPost(uiPost);
          }
        } catch (e) {
          console.error('Failed to load deep-linked post:', e);
        }
      }

      // Phase 3: Optimistic Loading Parallelization
      // Do NOT await loadUserProfile. Fire it completely independently so the Feed UI unlocks 
      // the precise millisecond the posts arrive, bypassing all Supabase Auth waterfall bottlenecks.
      loadUserProfile().catch(console.error);
      await loadPosts(0, true);
      setLoading(false);
    };
    init();

    // Setup pull-to-refresh handler (wait for PullToRefresh to be ready)
    const setupPullToRefresh = () => {
      if (window.PullToRefresh) {
        console.log('🔄 Setting up pull-to-refresh handler');
        window.PullToRefresh.onRefresh(async () => {
          console.log('🔄 Pull-to-refresh triggered - reloading page');
          window.location.reload();
        });
      } else {
        console.warn('⚠️ PullToRefresh not ready, retrying...');
        setTimeout(setupPullToRefresh, 100);
      }
    };

    // Wait a bit for scripts to load
    setTimeout(setupPullToRefresh, 200);
  }, []);

  // Reload posts when category filter changes (from category page navigation)
  useEffect(() => {
    // Trigger reload whenever category filter changes (even if set to null)
    loadPosts(0, true);
  }, [feedFilters.category]);

  // ALGORITHM BRAIN: Reload posts whenever feed mode changes
  useEffect(() => {
    // Reset seen IDs for this mode when switching tabs
    seenIdsByMode.current[feedMode] = new Set();
    setSeenIds(new Set());
    loadPosts(0, true);
  }, [feedMode]);

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
      if (isGuest) {
        setShowAuthModal(true);
      } else {
        setIsLensOpen(true);
      }
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // 2. Expose Actions Globaly (For real-time control from other scripts/console)
  useEffect(() => {
    window.PlusOpinionActions = {
      openOpinion: () => setIsOverlayOpen(true),
      openMenu: () => setIsMenuOpen(true),
      openLens: () => {
        if (isGuest) {
          setShowAuthModal(true);
          return;
        }
        setIsLensOpen(true);
      },
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
    if (post.is_edited) {
      showToast('You can only edit a post once.', 'AlertTriangle');
      return;
    }
    setEditingPost(post);
    setIsEditModalOpen(true);
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
        user_id: newPost.user_id, // Vital for ownership check
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
        // NEW POST PRIORITY: Add to top
        setPosts((prev) => [uiPost, ...prev]);
        // Add to seenIds to prevent duplication when shuffling batches
        setSeenIds((prev) => {
          const next = new Set(prev);
          next.add(newPost.id);
          return next;
        });
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
      showToast("Saved to Bookmarks", "BookMark", true);
      try {await window.bookmarkPost(postId);} catch (e) {console.error(e);}
    } else {
      next.delete(postId);
      showToast("Removed from Bookmarks", "BookMark");
      try {await window.removeBookmark(postId);} catch (e) {console.error(e);}
    }
    setSavedPosts(next);
    vibrate(10);
  };

  // Filter posts based on hidden items and local hides
  const filteredPosts = posts.filter((post) => {
    // 1. Hidden Posts
    // Note: We no longer filter out hidden posts here to allow them to "shrink" in the UI

    // 2. Blocked Brands
    if (post.brand_name && hiddenItems?.brands?.includes(post.brand_name)) return false;
    // Fallback for current mocked data structure if brand_name is missing but seenBy exists
    if (post.seenBy && hiddenItems?.brands?.includes(post.seenBy)) return false;

    // 3. Blocked Categories
    if (post.category && hiddenItems?.categories?.includes(post.category)) return false;

    // 4. Feed Filters
    if (feedFilters.source !== 'All') {
      if (feedFilters.source === 'Tagged (Apple)' && !post.product?.toLowerCase().includes('apple')) return false;
      if (feedFilters.source === 'Competitor' && !['Samsung', 'Google'].some((b) => post.product?.includes(b))) return false;
    }
    if (feedFilters.type !== 'All') {

      // Logic for type filtering (Positive/Negative) - assuming simplified pass for now as sentiment isn't strictly typed in mock
    }
    return true;
  });

  const handleMoreAction = async (action, post) => {
    if (action === 'edit') {
      if (post.is_edited) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'You can only edit a post once.', icon: 'AlertTriangle' } }));
        return;
      }
      setEditingPost(post);
      setIsEditModalOpen(true);
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this opinion?')) {
        try {
          await window.deletePost(post.id);
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion deleted', icon: 'Trash', isSuccess: true } }));
          setHiddenPostIds((prev) => new Set(prev).add(post.id));
        } catch (e) {console.error(e);}
      }
    } else if (action === 'insight') {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Insights feature coming soon!', icon: 'BarChart' } }));
    } else if (action === 'not_interested' || action === 'hide') {
      try {
        await window.hideItem('post', post.id);
        setHiddenPostIds((prev) => new Set(prev).add(post.id));
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion hidden', icon: 'EyeOff', isSuccess: true } }));
      } catch (e) {
        console.error(e);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to hide post', icon: 'AlertTriangle', isSuccess: false } }));
      }
    } else if (action === 'block_brand') {
      try {
        const brand = post.seenBy || post.brand_name || 'Brand';
        await window.hideItem('brand', brand);
        setHiddenItems((prev) => ({ ...prev, brands: [...prev.brands, brand] }));
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: `You won't see posts from ${brand} anymore`, icon: 'Flag', isSuccess: true } }));
      } catch (e) {console.error(e);}
    } else if (action === 'report') {
      setReportPostId(post.id);
      setIsReportModalOpen(true);
    } else if (action === 'bookmark') {
      toggleSave(post.id);
    }
  };

  const handleRemovePost = async (postId, reason = 'Removed', type = 'delete', target = null, additionalData = {}) => {
    if (type === 'REPORT_INTENT') {
      setReportPostId(postId);
      setReportData(additionalData || {});
      setIsReportModalOpen(true);
      return;
    }
    if (type === 'SHARE_INTENT') {
      if (target) {
        setSharePostData(target);
        setIsShareModalOpen(true);
      }
      return;
    }

    // Optimistic UI updates for legacy calls
    if (type !== 'hide_post') {
      setRemovedPosts((prev) => new Set(prev).add(postId));
    }
    if (reason) showToast(reason, type === 'delete' ? "Trash" : "EyeOff", true);

    // Fallback API calls for legacy paths (if any)
    try {
      if (type === 'delete') await window.deletePost(postId);
    } catch (e) {console.error(e);}
  };

  const submitReport = async (reason, action) => {
    setIsReportModalOpen(false);
    if (!reportPostId) return;

    const post = posts.find((p) => p.id === reportPostId);

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

    setReportData({});

    // Handle Action
    if (action === 'remove') {
      handleRemovePost(reportPostId, 'Thanks! We will review this.', 'hide_post');
    } else {
      showToast('Report submitted', 'Check', true);
    }
    setReportPostId(null);
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

    // FAB Logic
    if (isScrollingDown && currentY > 50) {
      setFabVisible(false);
    } else if (!isScrollingDown) {
      setFabVisible(true);
    }

    // Nav & Header Logic
    if (isScrollingDown && currentY > 50) {
      setNavVisible(false);
    } else if (!isScrollingDown) {
      setNavVisible(true);
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
  const visiblePosts = filteredPosts.filter((p) => !removedPosts.has(p.id));
  // const visiblePosts = posts.filter(p => !removedPosts.has(p.id));

  return (/*#__PURE__*/
    React.createElement("div", {
      className: "flex-1 flex flex-col relative h-full overflow-hidden",
      onClick: (e) => {
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


    React.createElement("div", { className: `fixed top-0 left-0 w-full h-[60px] top-nav-glass flex items-center justify-between px-5 z-40 transition-transform duration-500 ease-out ${getMainContentTransform()} ${navVisible ? 'translate-y-0' : '-translate-y-full'}` }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center z-10" }, /*#__PURE__*/
    React.createElement("button", { className: "text-white touch-scale transition-transform", onClick: () => {vibrate(5);setIsMenuOpen(true);} }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Menu", size: 22, className: "stroke-[2.5px] scale-110" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none" }, /*#__PURE__*/
    React.createElement("h1", { className: "font-heading font-bold text-lg tracking-wide text-white m-0" }, "PlusOpinion"), /*#__PURE__*/
    React.createElement("div", { className: "border border-[#2f8bff] px-2 py-0.5 rounded-md bg-[#2f8bff]/10 shadow-[0_0_10px_rgba(47,139,255,0.1)] flex items-center justify-center" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-[#2f8bff] tracking-[0.2em] uppercase" }, "BETA")
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-6" }, /*#__PURE__*/

    React.createElement("button", { className: `relative touch-scale transition-transform text-white group`, onClick: () => {
        vibrate(5);
        if (window.openInbox) window.openInbox();
      } }, /*#__PURE__*/
    React.createElement(Icon, { icon: unreadInboxCount > 0 ? "PlusOpinionInboxFilled" : "PlusOpinionInbox", size: 24, className: `scale-105 transition-all duration-300 ${unreadInboxCount > 0 ? '' : 'stroke-[1.5px] group-hover:stroke-[2.5px]'}` }),
    unreadInboxCount > 0 && /*#__PURE__*/
    React.createElement("div", { className: "absolute -top-1.5 -right-2 flex items-center justify-center min-w-[18px] h-[18px] bg-blue-500 rounded-full border-2 border-[#020205] z-50 animate-pulse-subtle" }, /*#__PURE__*/
    React.createElement("span", { className: "absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" }), /*#__PURE__*/
    React.createElement("span", { className: "relative text-[10px] font-bold text-white px-1 leading-none" },
    unreadInboxCount > 99 ? '99+' : unreadInboxCount
    )
    )

    ), /*#__PURE__*/

    React.createElement("button", { className: "text-white touch-scale transition-transform", onClick: () => {
        console.log('Lens button clicked!');
        vibrate(5);
        setIsLensOpen(true);
        console.log('setIsLensOpen(true) called');
      } }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Search", size: 22, className: "stroke-[2.5px] scale-110" })
    )
    )
    ),



    feedFilters.category && activeTab === 'home' && /*#__PURE__*/
    React.createElement("div", { className: `fixed top-[60px] left-0 w-full z-39 transition-transform duration-500 ${navVisible ? 'translate-y-0' : '-translate-y-[120px]'}`,
      style: { zIndex: 39 } }, /*#__PURE__*/
    React.createElement("div", { className: "top-nav-glass border-b border-white/5 px-4 py-2 flex items-center justify-between gap-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-white/60 truncate" }, "Showing: ", /*#__PURE__*/
    React.createElement("span", { className: "text-neon font-bold capitalize" }, feedFilters.category)
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        setFeedFilters((prev) => ({ ...prev, category: null }));
        window.history.replaceState(null, '', window.location.pathname);
      },
      className: "shrink-0 text-[10px] text-white/40 hover:text-white border border-white/10 px-2 py-1 rounded-full transition-colors" },
    "Clear \xD7"

    )
    )
    ), /*#__PURE__*/



    React.createElement("div", {
      ref: scrollRef,
      className: `
                            absolute inset-0 overflow-y-auto px-4 pt-[75px] pb-28 no-scrollbar smooth-scroll-container 
                            transition-all duration-500 ease-out origin-center
                            ${getMainContentTransform()}
                        `,
      onScroll: handleScroll }, /*#__PURE__*/

    React.createElement("div", {
      className: "flex-1 overflow-hidden relative touch-pan-y" },

    activeTab === 'home' ? /*#__PURE__*/
    React.createElement(React.Fragment, null,




    loading && posts.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "space-y-4 pt-2" }, /*#__PURE__*/
    React.createElement(SkeletonPost, { delay: "0ms" }), /*#__PURE__*/
    React.createElement(SkeletonPost, { delay: "100ms" }), /*#__PURE__*/
    React.createElement(SkeletonPost, { delay: "200ms" })
    ),



    isGuest && !deepLinkedPost && /*#__PURE__*/
    React.createElement("div", { className: "mb-8 p-6 rounded-3xl bg-gradient-to-br from-[#0F1627] to-[#1a2332] border border-white/10 shadow-2xl relative overflow-hidden group animate-fade-in" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" }), /*#__PURE__*/
    React.createElement("div", { className: "relative z-10" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-2xl font-black text-white tracking-tight font-heading mb-2" }, "Welcome to PlusOpinion!"

    ), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm leading-relaxed mb-6 max-w-[280px]" }, "Join the future of consumer intelligence. Share opinions, earn rewards, and discover honest feedback."

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-3" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setShowOnboardingModal(true),
      className: "flex-1 h-12 bg-neon text-white font-bold rounded-xl shadow-lg shadow-neon/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2" },
    "Join the Feed", /*#__PURE__*/

    React.createElement(Icon, { icon: "ArrowRight", size: 16 })
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {vibrate(5);toggleOverlay();},
      className: "h-12 px-5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "Info", size: 18 })
    )
    )
    )
    ), /*#__PURE__*/



    React.createElement("div", { className: "space-y-6 pb-20" },

    isGuest && deepLinkedPost ? /*#__PURE__*/
    React.createElement("div", { className: "animate-slide-up" }, /*#__PURE__*/
    React.createElement(PostCard, {
      post: deepLinkedPost,
      onRemove: handleRemovePost,
      onEdit: () => {},
      onBookmark: () => setShowOnboardingModal(true),
      onShare: handleShare,
      userProfile: userProfile,
      savedPosts: savedPosts,
      comments: postComments[deepLinkedPost.id] || [],
      isGuest: isGuest,
      onAuthRequired: () => setShowOnboardingModal(true),
      onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }) }
    ), /*#__PURE__*/
    React.createElement("div", { className: "mt-12 p-8 rounded-3xl text-center bg-white/5 border border-white/10" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-lg font-bold text-white mb-2" }, "Want to see more?"), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-xs mb-6 px-4" }, "Create an account to browse thousands of authentic opinions and earn rewards."), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setShowOnboardingModal(true),
      className: "w-full h-12 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl" },
    "Create Free Account"

    )
    )
    ) : /*#__PURE__*/

    /* Normal Feed Rendering (for logged in users or casual guests) */
    React.createElement(React.Fragment, null,

    !isGuest && deepLinkedPost && /*#__PURE__*/
    React.createElement("div", { className: "animate-slide-up relative ring-2 ring-neon/50 rounded-3xl shadow-[0_0_30px_rgba(47,139,255,0.2)] mb-8 before:absolute before:inset-0 before:bg-neon/5 before:rounded-3xl before:pointer-events-none", style: { animationDelay: '0ms' } }, /*#__PURE__*/
    React.createElement("div", { className: "absolute -top-3 left-6 bg-neon text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 tracking-widest uppercase flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Link", size: 10 }), "Shared Post"

    ), /*#__PURE__*/
    React.createElement(PostCard, {
      post: deepLinkedPost,
      onRemove: handleRemovePost,
      onEdit: (post) => {setEditingPost(post);setIsEditModalOpen(true);},
      onBookmark: toggleSave,
      onShare: handleShare,
      userProfile: userProfile,
      savedPosts: savedPosts,
      comments: postComments[deepLinkedPost.id] || [],
      isGuest: false,
      onAuthRequired: () => setShowOnboardingModal(true),
      onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }) }
    )
    ),


    visiblePosts.
    filter((post) => !deepLinkedPost || post.id !== deepLinkedPost.id).
    map((post, index) => /*#__PURE__*/
    React.createElement("div", { key: post.id, className: "animate-slide-up", style: { animationDelay: `${(index + (!isGuest && deepLinkedPost ? 1 : 0)) * 50}ms` } }, /*#__PURE__*/
    React.createElement(PostCard, {
      post: post,
      onRemove: handleRemovePost,
      onEdit: (post) => {setEditingPost(post);setIsEditModalOpen(true);},
      onBookmark: toggleSave,
      onShare: handleShare,
      userProfile: userProfile,
      savedPosts: savedPosts,
      comments: postComments[post.id] || [],
      isGuest: isGuest,
      onAuthRequired: () => setShowOnboardingModal(true),
      onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }) }
    )
    )
    ),


    !loading && !isLoadingPosts && visiblePosts.length === 0 && feedFilters.category && /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col items-center justify-center py-20 px-6 animate-fade-in" }, /*#__PURE__*/
    React.createElement("div", { className: "w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Search", size: 32, className: "text-white/20" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-white font-bold text-lg mb-2" }, "No opinions found"), /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-sm text-center max-w-[240px] leading-relaxed" }, "There are no opinions in the ", /*#__PURE__*/
    React.createElement("span", { className: "text-neon capitalize" }, feedFilters.category || "selected"), " category yet."
    ),
    feedFilters.category && /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setFeedFilters((prev) => ({ ...prev, category: null })),
      className: "mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-all" },
    "Back to Feed"

    )

    )

    ),



    isLoadingMore && !deepLinkedPost && /*#__PURE__*/
    React.createElement("div", { className: "py-4 flex justify-center" }, /*#__PURE__*/
    React.createElement("div", { className: "w-6 h-6 border-2 border-neon border-t-transparent rounded-full animate-spin" })
    ),

    !hasMore && visiblePosts.length > 0 && !deepLinkedPost && /*#__PURE__*/
    React.createElement("div", { className: "py-12 flex flex-col items-center justify-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-[60px] h-[1px] bg-gradient-to-r from-transparent via-[#2f8bff]/30 to-transparent" }), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] font-medium tracking-[0.4em] uppercase text-[#2f8bff] opacity-50" }, "END OF FEED"

    ), /*#__PURE__*/
    React.createElement("div", { className: "w-[60px] h-[1px] bg-gradient-to-r from-transparent via-[#2f8bff]/30 to-transparent" })
    )

    )
    ) : /*#__PURE__*/

    React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center text-muted" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Zap", size: 48, className: "mb-4 opacity-50" }), /*#__PURE__*/
    React.createElement("p", null, "This section is under construction.")
    )

    )
    ), /*#__PURE__*/


    React.createElement("button", {
      onClick: () => !isGuest ? toggleOverlay() : setShowOnboardingModal(true),
      className: `
                            absolute bottom-24 right-5 h-12 rounded-full 
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


    React.createElement(BottomNav, {
      activeTab: activeTab,
      setActiveTab: setActiveTab,
      isGuest: isGuest,
      onAuthRequired: () => setShowOnboardingModal(true),
      isVisible: navVisible && !isOverlayOpen && !isAnySidePanelOpen && !viewingImage,
      unreadInboxCount: unreadInboxCount,
      setUnreadInboxCount: setUnreadInboxCount }
    ), /*#__PURE__*/


    React.createElement(OpinionModal, { isOpen: isOverlayOpen, onClose: toggleOverlay, onPublished: handleNewPost, userProfile: userProfile, initialPost: editingPost }), /*#__PURE__*/
    React.createElement(ExploreProfilesModal, { isOpen: showExploreModal, onClose: () => setShowExploreModal(false), profiles: allProfiles }), /*#__PURE__*/

    React.createElement(ShareModal, { isOpen: isShareModalOpen, onClose: () => setIsShareModalOpen(false), post: sharePostData }), /*#__PURE__*/
    React.createElement(ReportModal, { isOpen: isReportModalOpen, onClose: () => setIsReportModalOpen(false), onSubmit: submitReport }),
    isEditModalOpen && /*#__PURE__*/React.createElement(EditModal, { isOpen: isEditModalOpen, onClose: () => setIsEditModalOpen(false), post: editingPost, onSave: async (updatedPost) => {
        // After save completes, update local posts array
        setPosts((prev) => prev.map((p) => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
        setIsEditModalOpen(false);
      } }), /*#__PURE__*/

    React.createElement(LensOverlay, {
      isOpen: isLensOpen,
      onClose: () => setIsLensOpen(false),
      handleRemove: handleRemovePost,
      onAddComment: handleAddComment,
      onSave: toggleSave,
      onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }),
      onEdit: handleEditPost,
      userProfile: userProfile,
      savedPosts: savedPosts,
      onShare: handleShare,
      setShowExploreModal: setShowExploreModal,
      setAllProfiles: setAllProfiles }
    ), /*#__PURE__*/

    React.createElement(MenuDrawer, {
      isOpen: isMenuOpen,
      onClose: () => setIsMenuOpen(false),
      onLogout: () => setShowLogoutConfirm(true),
      userProfile: userProfile,
      isGuest: isGuest,
      onAuthRequired: () => {setIsMenuOpen(false);setShowOnboardingModal(true);} }
    ), /*#__PURE__*/

    React.createElement(LogoutModal, { isOpen: showLogoutConfirm, onCancel: () => setShowLogoutConfirm(false), onConfirm: async () => {
        try {
          // Don't close modal yet - keep it open during logout
          console.log('Starting logout...');

          // Sign out from Supabase first
          if (window.signOutUser) {
            await window.signOutUser();
            console.log('Supabase signout complete');
          } else {
            console.warn('signOutUser not found, clearing session anyway');
          }

          // Clear session storage
          sessionStorage.removeItem('plusopinion_access');
          localStorage.clear();
          console.log('Session cleared');

          // Now close modals
          setShowLogoutConfirm(false);
          setIsMenuOpen(false);

          // Small delay to ensure state updates, then redirect
          setTimeout(() => {
            console.log('Redirecting to landing page...');
            window.location.href = 'index.html';
          }, 100);

        } catch (error) {
          console.error('Logout error:', error);
          setShowLogoutConfirm(false);
          setIsMenuOpen(false);
          alert('Error logging out: ' + error.message);
        }
      } }), /*#__PURE__*/


    React.createElement(ImageViewer, { src: viewingImage?.src, type: viewingImage?.type, images: viewingImage?.images, initialIndex: viewingImage?.initialIndex || 0, onClose: () => setViewingImage(null) }),


    viewingFullPost && /*#__PURE__*/
    React.createElement(FullPostViewer, {
      post: viewingFullPost,
      onClose: () => setViewingFullPost(null),
      userProfile: userProfile,
      savedPosts: savedPosts,
      toggleSave: toggleSave,
      handleRemovePost: handleRemovePost,
      handleEditPost: (post) => {setEditingPost(post);setIsEditModalOpen(true);},
      handleAddComment: handleAddComment,
      handleShare: handleShare,
      postComments: postComments,
      setViewingImage: setViewingImage,
      setShowOnboardingModal: setShowOnboardingModal,
      isGuest: isGuest }
    ), /*#__PURE__*/



    React.createElement(AuthModal, {
      isOpen: showOnboardingModal,
      onClose: () => setShowOnboardingModal(false),
      isClosable: !isGuest || !!deepLinkedPost }
    ),


    Object.entries(sharedPostsToRender).map(([containerId, data]) => {
      const el = document.getElementById(containerId);
      if (!el) return null;

      if (data.isLoading) {
        return ReactDOM.createPortal(/*#__PURE__*/
          React.createElement("div", { className: "p-4 text-center opacity-70 text-xs text-white" }, "Loading post..."),
          el
        );
      }

      if (data.error || !data.post) {
        return ReactDOM.createPortal(/*#__PURE__*/
          React.createElement("div", { className: "p-4 text-center opacity-70 text-xs text-red-400" }, "Post unavailable"),
          el
        );
      }

      return ReactDOM.createPortal(/*#__PURE__*/
        React.createElement("div", { className: "w-full shrink-0 pointer-events-auto", onClick: (e) => {e.stopPropagation();window.scrollToPost(data.post.id);} }, /*#__PURE__*/
        React.createElement(PostCard, {
          post: data.post,
          isGuest: isGuest,
          onShare: handleShare,
          hideActions: true,
          onImageClick: (src, type, images, idx) => setViewingImage({ src, type, images, initialIndex: idx || 0 }) }
        )
        ),
        el
      );
    })

    ));

};

const root = window.ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));