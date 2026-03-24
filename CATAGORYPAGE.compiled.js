function _extends() {return _extends = Object.assign ? Object.assign.bind() : function (n) {for (var e = 1; e < arguments.length; e++) {var t = arguments[e];for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);}return n;}, _extends.apply(null, arguments);}
const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion;

// 🔗 GLOBAL NAVIGATION FUNCTION (PASTE HERE)
const goTo = (page) => {
  window.scrollTo(0, 0);
  window.location.href = page;
};

const checkMySpaceRedirect = async () => {
  try {
    const user = await window.getCurrentUser();

    if (!user) {
      setShowAuthModal(true);
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

function dispatchAction(action) {
  if (window.PlusOpinionActions && window.PlusOpinionActions[action]) {
    // Already on homepage
    window.PlusOpinionActions[action]();
  } else {
    // On another page → redirect with hash
    window.location.href = `HOMEPAGE_FINAL.HTML#${action.replace('open', '').toLowerCase()}`;
  }
}

const triggerAction = (action) => {
  if (window.PlusOpinionActions?.[action]) {
    window.PlusOpinionActions[action]();
  } else {
    window.location.href = `HOMEPAGE_FINAL.HTML#${action.replace('open', '').toLowerCase()}`;
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

// --- ICONS ---
const Icons = {
  Smile: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("path", { d: "M8 14s1.5 2 4 2 4-2 4-2" }), /*#__PURE__*/React.createElement("line", { x1: "9", y1: "9", x2: "9.01", y2: "9" }), /*#__PURE__*/React.createElement("line", { x1: "15", y1: "9", x2: "15.01", y2: "9" })),
  Running: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M13 4a2 2 0 10-4 0 2 2 0 004 0z" }), /*#__PURE__*/React.createElement("path", { d: "M10 7l-2 4 4 2-1 6" }), /*#__PURE__*/React.createElement("path", { d: "M12 13l4-1 2-4" }), /*#__PURE__*/React.createElement("path", { d: "M8 7l-2 0 2 3" })),

  Home: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), /*#__PURE__*/React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })),
  Grid: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })),
  User: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "7", r: "4" })),
  Bell: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }), /*#__PURE__*/React.createElement("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })),
  Search: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /*#__PURE__*/React.createElement("path", { d: "m21 21-4.3-4.3" })),
  ChevronRight: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m9 18 6-6-6-6" })),
  ChevronLeft: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m15 18-6-6 6-6" })),
  Menu: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), /*#__PURE__*/React.createElement("line", { x1: "4", x2: "20", y1: "18", y2: "18" })),
  Cpu: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }), /*#__PURE__*/React.createElement("rect", { x: "9", y: "9", width: "6", height: "6" }), /*#__PURE__*/React.createElement("line", { x1: "9", x2: "9", y1: "1", y2: "4" }), /*#__PURE__*/React.createElement("line", { x1: "15", x2: "15", y1: "1", y2: "4" }), /*#__PURE__*/React.createElement("line", { x1: "9", x2: "9", y1: "20", y2: "23" }), /*#__PURE__*/React.createElement("line", { x1: "15", x2: "15", y1: "20", y2: "23" }), /*#__PURE__*/React.createElement("line", { x1: "20", x2: "23", y1: "9", y2: "9" }), /*#__PURE__*/React.createElement("line", { x1: "20", x2: "23", y1: "14", y2: "14" }), /*#__PURE__*/React.createElement("line", { x1: "1", x2: "4", y1: "9", y2: "9" }), /*#__PURE__*/React.createElement("line", { x1: "1", x2: "4", y1: "14", y2: "14" })),
  Shirt: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" })),
  Coffee: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M17 8h1a4 4 0 1 1 0 8h-1" }), /*#__PURE__*/React.createElement("path", { d: "M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" }), /*#__PURE__*/React.createElement("line", { x1: "6", x2: "6", y1: "2", y2: "6" }), /*#__PURE__*/React.createElement("line", { x1: "10", x2: "10", y1: "2", y2: "6" }), /*#__PURE__*/React.createElement("line", { x1: "14", x2: "14", y1: "2", y2: "6" })),
  Car: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" }), /*#__PURE__*/React.createElement("circle", { cx: "7", cy: "17", r: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "17", cy: "17", r: "2" })),
  Heart: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" })),
  Landmark: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "3", x2: "21", y1: "22", y2: "22" }), /*#__PURE__*/React.createElement("line", { x1: "6", x2: "6", y1: "18", y2: "11" }), /*#__PURE__*/React.createElement("line", { x1: "10", x2: "10", y1: "18", y2: "11" }), /*#__PURE__*/React.createElement("line", { x1: "14", x2: "14", y1: "18", y2: "11" }), /*#__PURE__*/React.createElement("line", { x1: "18", x2: "18", y1: "18", y2: "11" }), /*#__PURE__*/React.createElement("polygon", { points: "12 2 20 7 4 7" })),
  Armchair: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" }), /*#__PURE__*/React.createElement("path", { d: "M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" }), /*#__PURE__*/React.createElement("path", { d: "M5 18v2" }), /*#__PURE__*/React.createElement("path", { d: "M19 18v2" })),
  BookOpen: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }), /*#__PURE__*/React.createElement("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" })),
  Plane: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M2 12h5" }), /*#__PURE__*/React.createElement("path", { d: "M13 12h3" }), /*#__PURE__*/React.createElement("path", { d: "M13 2c7.75 0 8.97 2.47 9 10 0 8.95-3.6 9.87-9 10" }), /*#__PURE__*/React.createElement("path", { d: "M10 16.6c5.56.86 10-.9 10-4.6 0-4.66-6.66-2-6-6" })),
  Plus: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12 5v14M5 12h14" })),
  X: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
  Trending: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), /*#__PURE__*/React.createElement("polyline", { points: "17 6 23 6 23 12" })),
  Briefcase: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "20", height: "14", x: "2", y: "7", rx: "2", ry: "2" }), /*#__PURE__*/React.createElement("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" })),
  Gamepad: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "6", x2: "10", y1: "12", y2: "12" }), /*#__PURE__*/React.createElement("line", { x1: "8", x2: "8", y1: "10", y2: "14" }), /*#__PURE__*/React.createElement("line", { x1: "15", x2: "15.01", y1: "13", y2: "13" }), /*#__PURE__*/React.createElement("line", { x1: "18", x2: "18.01", y1: "11", y2: "11" }), /*#__PURE__*/React.createElement("rect", { width: "20", height: "12", x: "2", y: "6", rx: "2" })),
  Music: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M9 18V5l12-2v13" }), /*#__PURE__*/React.createElement("circle", { cx: "6", cy: "18", r: "3" }), /*#__PURE__*/React.createElement("circle", { cx: "18", cy: "16", r: "3" })),
  Paw: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "5", r: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "6", cy: "8", r: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "18", cy: "8", r: "2" }), /*#__PURE__*/React.createElement("path", { d: "M18.8 13.9a3.6 3.6 0 0 0-3.6-2.9 3.6 3.6 0 0 0-3.6 2.9 3.6 3.6 0 0 1-7.2 0 6 6 0 0 1 12 0 3.6 3.6 0 0 0 2.4-3Z" })),
  Camera: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "13", r: "3" })),
  Dumbbell: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m6.5 6.5 11 11" }), /*#__PURE__*/React.createElement("path", { d: "m21 21-1-1" }), /*#__PURE__*/React.createElement("path", { d: "m3 3 1 1" }), /*#__PURE__*/React.createElement("path", { d: "m18 22 4-4" }), /*#__PURE__*/React.createElement("path", { d: "m2 6 4-4" }), /*#__PURE__*/React.createElement("path", { d: "m3 10 7-7" }), /*#__PURE__*/React.createElement("path", { d: "m14 21 7-7" })),
  Tent: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M3.5 21 14 3" }), /*#__PURE__*/React.createElement("path", { d: "M20.5 21 10 3" }), /*#__PURE__*/React.createElement("path", { d: "M15.5 21 12 15l-3.5 6" }), /*#__PURE__*/React.createElement("path", { d: "M2 21h20" })),
  DollarSign: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "2", y2: "22" }), /*#__PURE__*/React.createElement("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })),
  MySpaceLogo: (p) => /*#__PURE__*/
  React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/
  React.createElement("path", { d: "M11 3L3 22", strokeLinejoin: "bevel" }), /*#__PURE__*/
  React.createElement("path", { d: "M21 22L11 3", strokeLinejoin: "bevel" }), /*#__PURE__*/
  React.createElement("path", { d: "M22 8L4 18", strokeWidth: "2.5" })
  ),

  // Additional Icons for Categories
  Film: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }), /*#__PURE__*/React.createElement("path", { d: "M7 3v18" }), /*#__PURE__*/React.createElement("path", { d: "M3 7.5h4" }), /*#__PURE__*/React.createElement("path", { d: "M3 12h18" }), /*#__PURE__*/React.createElement("path", { d: "M3 16.5h4" }), /*#__PURE__*/React.createElement("path", { d: "M17 3v18" }), /*#__PURE__*/React.createElement("path", { d: "M17 7.5h4" }), /*#__PURE__*/React.createElement("path", { d: "M17 16.5h4" })),
  Book: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" })),
  Activity: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" })),
  MapPin: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "10", r: "3" })),
  ShoppingBag: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }), /*#__PURE__*/React.createElement("path", { d: "M3 6h18" }), /*#__PURE__*/React.createElement("path", { d: "M16 10a4 4 0 0 1-8 0" })),
  Zap: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })),
  Truck: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }), /*#__PURE__*/React.createElement("path", { d: "M15 18H9" }), /*#__PURE__*/React.createElement("path", { d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }), /*#__PURE__*/React.createElement("circle", { cx: "17", cy: "18", r: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "7", cy: "18", r: "2" })),
  PenTool: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m12 19 7-7 3 3-7 7-3-3z" }), /*#__PURE__*/React.createElement("path", { d: "m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" }), /*#__PURE__*/React.createElement("path", { d: "m2 2 7.586 7.586" }), /*#__PURE__*/React.createElement("circle", { cx: "11", cy: "11", r: "2" })),
  Tool: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })),
  Radio: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M4.9 19.1C1 15.2 1 8.8 4.9 4.9" }), /*#__PURE__*/React.createElement("path", { d: "M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /*#__PURE__*/React.createElement("path", { d: "M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" }), /*#__PURE__*/React.createElement("path", { d: "M19.1 4.9C23 8.8 23 15.1 19.1 19" })),
  Atom: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "1" }), /*#__PURE__*/React.createElement("path", { d: "M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" }), /*#__PURE__*/React.createElement("path", { d: "M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" })),
  GraduationCap: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M22 10v6M2 10l10-5 10 5-10 5z" }), /*#__PURE__*/React.createElement("path", { d: "M6 12v5c3 3 9 3 12 0v-5" })),
  MoreHorizontal: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "1" }), /*#__PURE__*/React.createElement("circle", { cx: "19", cy: "12", r: "1" }), /*#__PURE__*/React.createElement("circle", { cx: "5", cy: "12", r: "1" })),
  Sparkles: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" }), /*#__PURE__*/React.createElement("path", { d: "M5 3v4" }), /*#__PURE__*/React.createElement("path", { d: "M19 17v4" }), /*#__PURE__*/React.createElement("path", { d: "M3 5h4" }), /*#__PURE__*/React.createElement("path", { d: "M17 19h4" })),
  Wallet: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }), /*#__PURE__*/React.createElement("path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }))
};

const Icon = ({ icon, size = 20, className = "" }) => {
  const Component = Icons[icon];
  if (!Component) return null;
  return /*#__PURE__*/React.createElement(Component, { width: size, height: size, className: className });
};

const vibrate = (pattern = 5) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Comprehensive Category Color Map
const CATEGORY_COLORS = {
  // Technology & Electronics
  'technology': '#22D3EE',
  'tech': '#22D3EE',
  'electronics': '#22D3EE',

  // Gaming
  'gaming': '#D946EF',
  'games': '#D946EF',

  // Fashion & Apparel
  'fashion': '#EC4899',
  'apparel': '#EC4899',
  'clothing': '#EC4899',

  // Food & Beverage
  'food': '#F97316',
  'food & drink': '#F97316',
  'food & bev': '#F97316',
  'beverage': '#F97316',
  'restaurants': '#F97316',

  // Personal Care & Beauty
  'personal care': '#A855F7',
  'beauty': '#A855F7',
  'cosmetics': '#A855F7',

  // Automotive
  'automotive': '#10B981',
  'cars': '#10B981',
  'vehicles': '#10B981',

  // Home & Living
  'home': '#EC4899',
  'home & living': '#EC4899',
  'furniture': '#EC4899',

  // Travel
  'travel': '#0EA5E9',
  'tourism': '#0EA5E9',

  // Finance
  'finance': '#3B82F6',
  'banking': '#3B82F6',

  // Education
  'education': '#8B5CF6',
  'learning': '#8B5CF6',

  // Office & Business
  'office': '#6B7280',
  'business': '#6B7280',
  'work': '#6B7280',

  // Entertainment
  'movies': '#8B5CF6',
  'music': '#EC4899',
  'books': '#3B82F6',
  'entertainment': '#A855F7',

  // Health & Fitness
  'health': '#10B981',
  'fitness': '#22D3EE',
  'wellness': '#10B981',

  // Beauty & Skin Care
  'beauty & skin care': '#F43F5E',
  'beauty-skincare': '#F43F5E',

  // Sports
  'sports': '#F97316',
  'outdoor': '#10B981',

  // Photography
  'photography': '#6B7280',
  'camera': '#6B7280',

  // Pets
  'pets': '#F97316',
  'animals': '#F97316',

  // Science
  'science': '#3B82F6',

  // Others / Miscellaneous
  'others': '#6B7280',
  'miscellaneous': '#6B7280',

  // Default fallback
  'default': '#6B7280'
};

// Helper function to assign color to category
const getCategoryColor = (category) => {
  // Only use category.color if it's a valid hex/rgb color (starts with # or rgb)
  if (category.color && (category.color.startsWith('#') || category.color.startsWith('rgb'))) {
    return category.color;
  }
  const name = category.name?.toLowerCase() || category.id?.toLowerCase() || '';
  return CATEGORY_COLORS[name] || CATEGORY_COLORS['default'];
};

// State maintained in App component and Supabase
// Removed static DEEP_DB logic

// --- COMPONENTS ---

// REPLACED WITH MY SPACE NAV BAR COMPONENT
const NavItem = ({ icon, label, isActive, onClick, isMySpace, badge }) => /*#__PURE__*/
React.createElement("button", {
  onClick: () => {
    vibrate(5);
    if (isMySpace) {
      checkMySpaceRedirect();
    } else if (onClick) {
      onClick();
    }
  },
  className: `relative group flex flex-col items-center justify-center w-16 h-16 ${isActive ? '' : ''}` }, /*#__PURE__*/

React.createElement("div", {
  className: `relative ${isMySpace ? 'myspace-trigger' : ''} transition-all duration-300`,
  style: {
    padding: isActive ? '10px' : '6px',
    borderRadius: isActive ? '16px' : '12px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
  } }, /*#__PURE__*/

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


// REPLACED WITH MY SPACE BOTTOM NAV


// PREMIUM 3D CATEGORY CARD (High-depth button effect, horizontal layout)
const CategoryCard = ({ cat, onClick, type = 'standard' }) => {
  const color = getCategoryColor(cat);
  // Fix Finance logo missing
  const iconName = (cat.name || cat.title)?.toLowerCase() === 'finance' ? 'Wallet' : cat.icon;

  return (/*#__PURE__*/
    React.createElement("div", {
      onClick: () => {vibrate(5);onClick(cat);},
      className: "rounded-xl flex items-center gap-3.5 p-4 cursor-pointer group transition-all duration-300 hover:translate-y-[-5px] active:translate-y-[-1px] active:shadow-inner",
      style: {
        backgroundColor: '#161922',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '3px solid rgba(0,0,0,0.3)', // Button depth effect
        boxShadow: '0 6px 0 rgba(0,0,0,0.2), 0 10px 15px -3px rgba(0,0,0,0.5)',
        '--hover-shadow': `0 12px 24px -8px ${color}44`
      },
      onMouseEnter: (e) => e.currentTarget.style.boxShadow = `0 4px 0 rgba(0,0,0,0.3), 0 15px 25px -10px ${color}44`,
      onMouseLeave: (e) => e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.2), 0 10px 15px -3px rgba(0,0,0,0.5)' }, /*#__PURE__*/


    React.createElement("div", {
      className: "w-10 h-10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
      style: {
        backgroundColor: color,
        borderRadius: '10px',
        background: `linear-gradient(145deg, ${color} 0%, ${color}DD 100%)`,
        boxShadow: `0 4px 12px -2px ${color}88, inset 0 2px 4px rgba(255,255,255,0.3)`
      } }, /*#__PURE__*/

    React.createElement(Icon, { icon: iconName, size: 18, className: "text-white" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col min-w-0" }, /*#__PURE__*/
    React.createElement("h3", { className: "font-semibold text-white text-[13px] tracking-wide truncate" }, cat.name || cat.title), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-white/40 font-bold uppercase tracking-tighter" }, "Explore"

    )
    )
    ));

};

// SLEEK 3D LIST ITEM FOR "ALL CATEGORIES" (Zoom and Lift animation)
const ListItem = ({ cat, onClick }) => {
  const color = getCategoryColor(cat);
  // Fix Finance logo missing
  const iconName = (cat.name || cat.title)?.toLowerCase() === 'finance' ? 'Wallet' : cat.icon;

  return (/*#__PURE__*/
    React.createElement("div", {
      onClick: () => {vibrate(5);onClick(cat);},
      className: "flex items-center justify-between p-3.5 rounded-xl border border-white/[0.05] bg-[#12151C] transition-all duration-300 cursor-pointer group hover:translate-y-[-3px] hover:bg-white/[0.04] hover:shadow-lg",
      style: {
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
      } }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-4" }, /*#__PURE__*/
    React.createElement("div", {
      className: "w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
      style: {
        backgroundColor: color,
        borderRadius: '9px',
        background: `linear-gradient(145deg, ${color} 0%, ${color}DD 100%)`,
        boxShadow: `0 4px 10px -2px ${color}44`
      } }, /*#__PURE__*/

    React.createElement(Icon, { icon: iconName, size: 16, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors" }, cat.name || cat.title)
    ), /*#__PURE__*/
    React.createElement("div", { className: "w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-white/20 group-hover:text-white/50" })
    )
    ));

};

// --- SKELETON LOADERS (Matches exact UI layout) ---
const SkeletonCard = () => /*#__PURE__*/
React.createElement("div", { className: "rounded-xl flex items-center gap-3.5 p-4 border border-white/5 bg-white/[0.02] animate-pulse" }, /*#__PURE__*/
React.createElement("div", { className: "w-10 h-10 rounded-lg bg-white/5 shrink-0" }), /*#__PURE__*/
React.createElement("div", { className: "flex-1 space-y-2" }, /*#__PURE__*/
React.createElement("div", { className: "h-4 w-2/3 bg-white/5 rounded" }), /*#__PURE__*/
React.createElement("div", { className: "h-2 w-1/3 bg-white/5 rounded" })
)
);


const SkeletonListItem = () => /*#__PURE__*/
React.createElement("div", { className: "flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] animate-pulse" }, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-4 w-full" }, /*#__PURE__*/
React.createElement("div", { className: "w-9 h-9 rounded-lg bg-white/5 shrink-0" }), /*#__PURE__*/
React.createElement("div", { className: "h-4 w-1/2 bg-white/5 rounded" })
)
);


const CategorySkeleton = () => /*#__PURE__*/
React.createElement("div", { className: "space-y-10" }, /*#__PURE__*/

React.createElement("section", null, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-2.5 mb-4 px-1" }, /*#__PURE__*/
React.createElement("div", { className: "w-1 h-5 bg-white/10 rounded-full" }), /*#__PURE__*/
React.createElement("div", { className: "h-4 w-32 bg-white/5 rounded" })
), /*#__PURE__*/
React.createElement("div", { className: "grid grid-cols-2 gap-3" },
[1, 2, 3, 4].map((idx) => /*#__PURE__*/React.createElement(SkeletonCard, { key: idx }))
)
), /*#__PURE__*/

React.createElement("section", null, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-2.5 mb-4 px-1" }, /*#__PURE__*/
React.createElement("div", { className: "w-1 h-5 bg-white/10 rounded-full" }), /*#__PURE__*/
React.createElement("div", { className: "h-4 w-40 bg-white/5 rounded" })
), /*#__PURE__*/
React.createElement("div", { className: "h-32 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]" })
), /*#__PURE__*/

React.createElement("section", null, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-2.5 mb-4 px-1" }, /*#__PURE__*/
React.createElement("div", { className: "w-1 h-5 bg-white/10 rounded-full" }), /*#__PURE__*/
React.createElement("div", { className: "h-4 w-28 bg-white/5 rounded" })
), /*#__PURE__*/
React.createElement("div", { className: "grid grid-cols-1 gap-2.5" },
[1, 2, 3, 4, 5, 6].map((idx) => /*#__PURE__*/React.createElement(SkeletonListItem, { key: idx }))
)
)
);





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


const App = () => {
  const [sharedPostsToRender, setSharedPostsToRender] = useState({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Removed local selectedCategory state as we redirect immediately
  const activeTab = 'categories';
  const [categories, setCategories] = useState([]);
  const [popularCats, setPopularCats] = useState([]);
  const [recommendedCats, setRecommendedCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);

  const handleScroll = (e) => {
    const currentY = e.target.scrollTop;
    const isScrollingDown = currentY > lastY.current;

    if (isScrollingDown && currentY > 50) {
      setNavVisible(false);
    } else if (!isScrollingDown) {
      setNavVisible(true);
    }
    lastY.current = currentY;
  };

  const handleCategoryClick = (category) => {
    vibrate(5);
    // Direct navigation to homepage with filter - use name for display
    const catName = (category.name || category.title || category.id)?.toLowerCase().trim();
    if (catName) {
      window.location.href = `HOMEPAGE_FINAL.HTML#category=${encodeURIComponent(catName)}`;
    }
  };


  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      if (!isMounted) return;

      // Auth Check
      const user = await window.getCurrentUser();
      if (!user) {
        setIsGuest(true);
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setIsGuest(false);
      const profile = await window.getMyProfile();
      setUserProfile(profile);

      const cacheKey = 'categories_data';

      // CACHE-FIRST: Try to load from cache first
      if (window.StateManager) {
        const cachedData = await window.StateManager.get(cacheKey);
        if (cachedData && isMounted) {
          console.log('📦 Loading categories from cache');
          setCategories(cachedData.all || []);
          setPopularCats(cachedData.popular || []);
          setRecommendedCats(cachedData.recommended || []);
          setLoading(false);
          // Continue to fetch fresh data in background
        }
      }

      try {
        const [all, popular, recommended] = await Promise.all([
        window.getCategories().catch((e) => {console.warn("getCategories failed", e);return [];}),
        window.getPopularCategories(6).catch((e) => {console.warn("getPopularCategories failed", e);return [];}),
        window.getRecommendedCategories(4).catch((e) => {console.warn("getRecommendedCategories failed", e);return [];})]
        );

        if (isMounted) {
          setCategories(all || []);
          setPopularCats(popular || []);
          setRecommendedCats(recommended || []);

          // SAVE TO CACHE (10 minute TTL)
          if (window.StateManager) {
            await window.StateManager.set(cacheKey, {
              all,
              popular,
              recommended
            }, { ttl: 10 * 60 * 1000 });
            console.log('💾 Saved categories to cache');
          }
        }
      } catch (e) {
        console.error("Failed to load categories", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAllData();
    return () => {isMounted = false;};
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
      // Implementation depends on page structure, simple redirect for non-homepage:
      window.location.href = `POST_VIEWER_HTML_OR_SIMILAR?id=${postId}`;
    };
    window.scrollToPost = window.openFullPost;

    return () => window.removeEventListener('render_shared_post', handleRenderSharedPost);
  }, []);

  // Setup pull-to-refresh handler
  useEffect(() => {
    const setupPullToRefresh = () => {
      if (window.PullToRefresh) {
        window.PullToRefresh.onRefresh(async () => {
          // Invalidate cache
          if (window.StateManager) {
            window.StateManager.invalidate('categories');
          }
          // Reload page
          window.location.reload();
        });
      } else {
        setTimeout(setupPullToRefresh, 100);
      }
    };
    setTimeout(setupPullToRefresh, 200);
  }, []);

  const displayPopular = popularCats.length > 0 ? popularCats : categories.filter((c) => c.section === 'popular').slice(0, 6);

  const allCats = React.useMemo(() =>
  [...categories].sort((a, b) => (a.name || a.title).localeCompare(b.name || b.title)),
  [categories]
  );

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex-1 flex flex-col h-full relative overflow-hidden" }, /*#__PURE__*/


    React.createElement("div", { className: `fixed top-0 left-0 w-full h-[65px] top-nav-glass flex items-center justify-between px-6 z-40 transition-transform duration-500 ease-out ${navVisible ? 'translate-y-0' : '-translate-y-full'}` }, /*#__PURE__*/
    React.createElement("button", { onClick: () => triggerAction('openMenu'), className: "touch-scale w-10 h-10 flex items-center justify-start text-white/70 hover:text-white" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Menu", size: 24 })
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-lg tracking-widest text-white uppercase opacity-95" }, "Categories"), /*#__PURE__*/
    React.createElement("button", { onClick: () => triggerAction('openLens'), className: "touch-scale w-10 h-10 flex items-center justify-end text-white/70 hover:text-white" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Search", size: 22 })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "absolute inset-0 overflow-y-auto px-5 pt-[75px] pb-28 no-scrollbar scroll-smooth", onScroll: handleScroll },
    loading ? /*#__PURE__*/
    React.createElement(CategorySkeleton, null) : /*#__PURE__*/

    React.createElement("div", { className: "space-y-10" },

    displayPopular.length > 0 && /*#__PURE__*/
    React.createElement("section", { className: "animate-fade-in" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4 px-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-1 h-5 bg-neon rounded-full" }), /*#__PURE__*/
    React.createElement("h2", { className: "text-sm font-heading font-semibold text-white/90 tracking-tight" }, "Popular Right Now")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] font-medium text-neon/80 bg-neon/10 px-2 py-0.5 rounded-md uppercase tracking-wider" }, "Trending")
    ), /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
    displayPopular.slice(0, 4).map((cat) => /*#__PURE__*/
    React.createElement(CategoryCard, { key: cat.id, cat: cat, onClick: handleCategoryClick })
    )
    )
    ), /*#__PURE__*/



    React.createElement("section", { className: "animate-fade-in", style: { animationDelay: '0.1s' } }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4 px-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-1 h-5 bg-neon rounded-full" }), /*#__PURE__*/
    React.createElement("h2", { className: "text-sm font-heading font-semibold text-white/90 tracking-tight" }, "Recommended Categories")
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "group relative flex flex-col items-center justify-center py-10 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] transition-all duration-300 hover:bg-white/[0.03] hover:border-neon/30 active:scale-[0.98] cursor-pointer" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 mb-2" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Sparkles", size: 16, className: "text-white/40 group-hover:text-neon group-hover:animate-pulse transition-colors" }), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-white/50 group-hover:text-white uppercase tracking-widest transition-colors" }, "Personalized Recommendations")
    ), /*#__PURE__*/
    React.createElement("div", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] mt-2 transition-all group-hover:border-neon/20 group-hover:bg-neon/5" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] text-white/40 group-hover:text-neon font-bold uppercase tracking-widest" }, "Post-Beta Feature")
    )
    )
    ), /*#__PURE__*/


    React.createElement("section", { className: "animate-fade-in", style: { animationDelay: '0.2s' } }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4 px-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-1 h-5 bg-neon rounded-full" }), /*#__PURE__*/
    React.createElement("h2", { className: "text-sm font-heading font-semibold text-white/90 tracking-tight" }, "All Categories")
    ), /*#__PURE__*/
    React.createElement(Icon, { icon: "Grid", size: 14, className: "text-muted/40" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-1 gap-2.5" },
    allCats.map((cat) => /*#__PURE__*/
    React.createElement(ListItem, { key: cat.id, cat: cat, onClick: handleCategoryClick })
    )
    )
    )
    )

    ), /*#__PURE__*/


    React.createElement(ShareModal, { isOpen: isShareModalOpen, onClose: () => setIsShareModalOpen(false), post: sharePostData }), /*#__PURE__*/
    React.createElement(BottomNav, { activeTab: activeTab, isVisible: navVisible }), /*#__PURE__*/

    React.createElement(AuthModal, {
      isOpen: showAuthModal,
      onClose: () => setShowAuthModal(false),
      isClosable: !isGuest }
    )

    ));

};

const BottomNav = ({ activeTab, isVisible = true }) => {
  // Initialize with cached value to prevent flicker
  const [unreadCount, setUnreadCount] = useState(() => {
    return window.getUnreadCountFromCache ? window.getUnreadCountFromCache() : 0;
  });

  useEffect(() => {
    // Subscribe to real-time unread count
    const unsubscribe = window.subscribeToUnreadCount && window.subscribeToUnreadCount((count) => {
      setUnreadCount(count);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (/*#__PURE__*/
    React.createElement("div", { id: "bottom-nav-bar", className: `nav-glass fixed bottom-0 left-0 w-full h-[65px] px-2 pb-2 flex justify-between items-center z-40 transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}` }, /*#__PURE__*/
    React.createElement(NavItem, { icon: "Home", label: "Home", isActive: activeTab === 'home', onClick: () => goTo('HOMEPAGE_FINAL.HTML') }), /*#__PURE__*/
    React.createElement(NavItem, { icon: "Grid", label: "Categories", isActive: activeTab === 'categories', onClick: () => {} }), /*#__PURE__*/
    React.createElement(NavItem, { icon: "MySpaceLogo", label: "My Space", isActive: activeTab === 'myspace', isMySpace: true }), /*#__PURE__*/
    React.createElement(NavItem, {
      icon: "Bell",
      label: "Notifications",
      isActive: activeTab === 'notifs',
      onClick: () => goTo('NOTIFICATION PANEL.HTML'),
      badge: unreadCount }
    ), /*#__PURE__*/
    React.createElement(NavItem, { icon: "User", label: "Profile", isActive: activeTab === 'profile', onClick: () => goTo('PRIVATE OWNER PROFILE.HTML') })
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

// Mount the app
const root = window.ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));