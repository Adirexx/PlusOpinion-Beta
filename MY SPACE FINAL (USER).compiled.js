function _extends() {return _extends = Object.assign ? Object.assign.bind() : function (n) {for (var e = 1; e < arguments.length; e++) {var t = arguments[e];for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);}return n;}, _extends.apply(null, arguments);}
// Default Avatar (SVG Data URI - Rounded Shoulder, Thinner Stroke 1.2px, Scaled Down)
// Default Avatar (Refined: Navbar Style Match - Reduced Gap cy=9, Slim 0.8px, Extracted Blue #326bcb)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23090e1a'/%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%23326bcb' stroke-width='0.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='12' cy='9' r='4' stroke='%23326bcb' stroke-width='0.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const BRAND_LOGOS = {
  "OnePlus": "https://cdn.simpleicons.org/oneplus",
  "Samsung": "https://cdn.simpleicons.org/samsung",
  "Sony": "https://cdn.simpleicons.org/sony",
  "Ola Electric": "https://cdn.simpleicons.org/tesla", // Placeholder
  "Nike": "https://cdn.simpleicons.org/nike",
  "Dyson": "https://vectorlogo.zone/logos/dyson/dyson-icon.svg",
  "Apple": "https://cdn.simpleicons.org/apple",
  "Tesla": "https://cdn.simpleicons.org/tesla"
};

const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

// 🔗 GLOBAL NAVIGATION FUNCTION (PASTE HERE)
const goTo = (page) => {
  window.scrollTo(0, 0);
  window.location.href = page;
};

const renderTextWithMentions = (text) => {
  if (!text) return text;
  const parts = text.split(/(@[\w.]+)/g);
  return parts.map((part, i) => {
    if (/@[\w.]+/.test(part)) {
      const username = part.slice(1);
      return (/*#__PURE__*/
        React.createElement("span", { key: i, className: "text-neon font-semibold cursor-pointer hover:underline",
          onClick: (e) => {
            e.stopPropagation();vibrate(5);
            window.location.href = `PUBLIC POV PROFILE.HTML?username=${username}`;
          } },
        part
        ));

    }
    return part;
  });
};

const vibrate = (ms) => {
  if (navigator.vibrate) navigator.vibrate(ms || 5);
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

  ArrowLeft: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m12 19-7-7 7-7" }), /*#__PURE__*/React.createElement("path", { d: "M19 12H5" })),
  Settings: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l-.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
  ChevronRight: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m9 18 6-6-6-6" })),
  Wallet: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M21 12V7H5a2 2 0 0 1 0-4h14v4" }), /*#__PURE__*/React.createElement("path", { d: "M3 5v14a2 2 0 0 0 2 2h16v-5" }), /*#__PURE__*/React.createElement("path", { d: "M18 12a2 2 0 0 0 0 4h4v-4Z" })),
  BarChart2: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M18 20V10" }), /*#__PURE__*/React.createElement("path", { d: "M12 20V4" }), /*#__PURE__*/React.createElement("path", { d: "M6 20V14" })),
  Chart: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M3 3v18h18" }), /*#__PURE__*/React.createElement("path", { d: "m19 9-5 5-4-4-3 3" })),
  Star: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })),
  Zap: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })),
  Shield: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" })),
  Help: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }), /*#__PURE__*/React.createElement("path", { d: "M12 17h.01" })),
  Check: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("polyline", { points: "20 6 9 17 4 12" })),
  Clock: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /*#__PURE__*/React.createElement("polyline", { points: "12 6 12 12 16 14" })),
  User: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "7", r: "4" })),
  Home: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), /*#__PURE__*/React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })),
  Grid: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }), /*#__PURE__*/React.createElement("rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" })),
  Bell: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }), /*#__PURE__*/React.createElement("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })),
  Gift: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { x: "3", y: "8", width: "18", height: "4", rx: "1" }), /*#__PURE__*/React.createElement("path", { d: "M12 8v13" }), /*#__PURE__*/React.createElement("path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" }), /*#__PURE__*/React.createElement("path", { d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" })),
  MySpaceLogo: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M11 3L3 22", strokeLinejoin: "bevel" }), /*#__PURE__*/React.createElement("path", { d: "M21 22L11 3", strokeLinejoin: "bevel" }), /*#__PURE__*/React.createElement("path", { d: "M22 8L4 18", style: { transform: 'translateX(-5px) translateY(5px)', opacity: 1, stroke: 'var(--neon)' }, strokeWidth: "2.5" })),
  Lock: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), /*#__PURE__*/React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })),
  Download: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /*#__PURE__*/React.createElement("polyline", { points: "7 10 12 15 17 10" }), /*#__PURE__*/React.createElement("line", { x1: "12", x2: "12", y1: "15", y2: "3" })),
  Activity: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" })),
  Mail: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }), /*#__PURE__*/React.createElement("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })),
  Eye: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
  Users: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), /*#__PURE__*/React.createElement("circle", { cx: "9", cy: "7", r: "4" }), /*#__PURE__*/React.createElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }), /*#__PURE__*/React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })),
  X: (p) => /*#__PURE__*/React.createElement("svg", _extends({}, p, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }), /*#__PURE__*/React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
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
        className: className,
        onClick: onClick,
        alt: "Default Avatar" }
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

// --- COMPONENTS ---

// Wrapper to handle scroll hide/show separately for each view
const ViewWrapper = ({ children, onScroll }) => {
  return (/*#__PURE__*/
    React.createElement("div", {
      className: "view-content absolute inset-0 overflow-y-auto no-scrollbar pt-[75px] pb-28 px-4",
      onScroll: onScroll }, /*#__PURE__*/

    React.createElement("div", { className: "space-y-4" },
    children
    )
    ));

};

const SectionHeader = ({ title, onBack, rightElement, isVisible = true }) => /*#__PURE__*/
React.createElement("div", { className: `header-glass fixed top-0 left-0 w-full flex items-center justify-between px-4 h-[65px] z-50 animate-slide-in transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}` }, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
React.createElement("button", { onClick: onBack, className: "p-2 -ml-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors" }, /*#__PURE__*/
React.createElement(Icon, { icon: "ArrowLeft", size: 20, className: "text-white" })
), /*#__PURE__*/
React.createElement("h2", { className: "font-heading font-bold text-lg text-white tracking-wide" }, title)
),
rightElement && /*#__PURE__*/React.createElement("div", null, rightElement)
);


// WITHDRAWAL MODAL
const WithdrawalModal = ({ isOpen, onClose, balance, onConfirm }) => {
  if (!isOpen) return null;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRequest = async () => {
    const val = parseFloat(amount);
    if (!val || val < 100) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Minimum withdrawal is ₹100', icon: 'AlertTriangle' } }));
      return;
    }
    if (val > 3000) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Maximum withdrawal is ₹3,000 (beta limit)', icon: 'AlertTriangle' } }));
      return;
    }
    if (val > balance) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Insufficient balance', icon: 'AlertTriangle' } }));
      return;
    }
    if (!method) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Select a payout method', icon: 'AlertTriangle' } }));
      return;
    }

    setIsProcessing(true);
    await onConfirm(val, method);
    setIsProcessing(false);
    onClose();
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[80] flex items-center justify-center p-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-md animate-menu-fade", onClick: onClose }), /*#__PURE__*/
    React.createElement("div", { className: "relative w-full max-w-[320px] bg-[#000000] border border-white/10 rounded-3xl p-6 shadow-2xl animate-pop" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center mb-6" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-lg font-heading font-bold text-white" }, "Withdraw Funds"), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-2 bg-white/5 rounded-full text-muted hover:text-white" }, /*#__PURE__*/React.createElement(Icon, { icon: "X", size: 18 }))
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-4" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 block" }, "Amount (\u20B9100 - \u20B93,000)"), /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold" }, "\u20B9"), /*#__PURE__*/
    React.createElement("input", {
      type: "number",
      value: amount,
      onChange: (e) => setAmount(e.target.value),
      className: "w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-neon/50 outline-none transition-colors",
      placeholder: "0.00",
      min: "100",
      max: "3000" }
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-right mt-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted" }, "Available: \u20B9", balance.toLocaleString())
    )
    ), /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 block" }, "Payout method"), /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-2 gap-2" },
    [{ label: 'UPI', value: 'upi' }, { label: 'Bank Transfer', value: 'bank' }].map((m) => /*#__PURE__*/
    React.createElement("button", {
      key: m.value,
      onClick: () => setMethod(m.value),
      className: `py-2.5 rounded-xl text-xs font-bold border transition-all ${method === m.value ? 'bg-neon/10 border-neon text-neon' : 'bg-white/5 border-transparent text-muted hover:border-white/10'}` },

    m.label
    )
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-[9px] text-muted/70 mt-2" }, "Payment details from your Partner Application will be used")
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: handleRequest,
      disabled: isProcessing,
      className: "w-full py-3.5 rounded-xl bg-gradient-to-r from-neon to-blue-500 text-white font-bold text-sm shadow-lg shadow-neon/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-2" },

    isProcessing ? 'Processing...' : 'Request Withdrawal'
    )
    )
    )
    ));

};

// 1. EARNINGS STUDIO
const EarningsView = ({ onBack, onScroll, isHeaderVisible, earnings: rawEarnings, profile }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Safety Defaults
  const earnings = {
    total: 0,
    lastMonth: 0,
    logs: [],
    coupons: [],
    breakdown: [],
    ...rawEarnings
  };

  const handleWithdraw = async (amount, method) => {
    try {
      await window.requestWithdrawal(amount, method);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Withdrawal requested successfully!', icon: 'Check', isSuccess: true } }));
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to request withdrawal', icon: 'AlertTriangle' } }));
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in relative" }, /*#__PURE__*/
    React.createElement(SectionHeader, { title: "Revenue Studio", onBack: onBack, isVisible: isHeaderVisible }), /*#__PURE__*/
    React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/

    React.createElement("div", { className: "glass-panel p-6 rounded-2xl relative overflow-hidden group" }, /*#__PURE__*/
    React.createElement("p", { className: "text-muted text-xs font-medium uppercase tracking-wider mb-1" }, "Monthly Earning"), /*#__PURE__*/
    React.createElement("h1", { className: "font-heading text-4xl font-bold text-white mb-6" }, "\u20B9", earnings.total.toLocaleString('en-IN')), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-2 gap-4 border-t border-white/10 pt-4" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted uppercase" }, "Last 30 Days"), /*#__PURE__*/
    React.createElement("p", { className: "text-lg font-bold text-white" }, "+\u20B9", earnings.lastMonth)
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted uppercase" }, "RPM"), /*#__PURE__*/
    React.createElement("p", { className: "text-lg font-bold text-white" }, "\u20B9145")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex gap-3 mb-4" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => window.generateStatement(profile, earnings),
      className: "flex-1 glass-panel py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:border-neon/30 transition-all active:scale-[0.98]" }, /*#__PURE__*/

    React.createElement("div", { className: "w-10 h-10 rounded-full bg-neon/10 flex items-center justify-center text-neon" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Download", size: 20 })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-white uppercase tracking-wider" }, "Download Statement")
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setShowWithdrawModal(true),
      className: "flex-1 bg-neon py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-neon/20 hover:bg-neon/90 transition-all active:scale-[0.98]" }, /*#__PURE__*/

    React.createElement("div", { className: "w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Wallet", size: 20 })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-white uppercase tracking-wider" }, "Request Payout")
    )
    ), /*#__PURE__*/


    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs font-bold text-white mb-3 uppercase tracking-wider px-1" }, "Recent Activity"), /*#__PURE__*/
    React.createElement("div", { className: "space-y-2" },
    earnings.logs.length === 0 ? /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted text-center py-4" }, "No recent activity.") :
    earnings.logs.map((log) => /*#__PURE__*/
    React.createElement("div", { key: log.id, className: "glass-panel rounded-xl p-4 flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "bg-white/5 p-2.5 rounded-xl" }, /*#__PURE__*/
    React.createElement(Icon, { icon: log.icon || 'Clock', size: 16, className: "text-muted" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-sm font-bold text-white mb-0.5" }, log.label), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted font-medium" }, log.date, " \u2022 ", /*#__PURE__*/React.createElement("span", { className: log.status === 'Paid' ? 'text-accent-green' : 'text-accent-gold' }, log.status))
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-heading font-bold text-sm text-white" }, log.amount < 0 ? '-' : '+', "\u20B9", Math.abs(log.amount))
    )
    )
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => {vibrate(5);setShowWithdrawModal(true);},
      className: "w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-transform" },
    "Withdraw Funds"

    )
    ), /*#__PURE__*/

    React.createElement(WithdrawalModal, {
      isOpen: showWithdrawModal,
      onClose: () => setShowWithdrawModal(false),
      balance: earnings.total,
      onConfirm: handleWithdraw }
    )
    ));

};

// 2. RQS VIEW (Correct Start Point & Bench)
const RQSView = ({ onBack, onScroll, isHeaderVisible, profile }) => {
  const score = profile.rqs;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);

  // Trigger Animation
  useEffect(() => {
    const targetOffset = circumference - score / 100 * circumference;
    setTimeout(() => setDashOffset(targetOffset), 300);
  }, [score]);

  // Calculate benchmark position: 75% of circle from top
  // Top is 0 degrees (due to rotate(-90)). 75% of 360 is 270 degrees.
  // So we want the marker at 270 degrees clockwise from top.
  // Which corresponds to the 9 o'clock position (Left) visually.

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in" }, /*#__PURE__*/
    React.createElement(SectionHeader, { title: "Reputation Score", onBack: onBack, isVisible: isHeaderVisible }), /*#__PURE__*/
    React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "relative w-64 h-64 mb-8" }, /*#__PURE__*/
    React.createElement("svg", { className: "w-full h-full rqs-svg" }, /*#__PURE__*/

    React.createElement("circle", { cx: "128", cy: "128", r: radius, stroke: "rgba(255,255,255,0.05)", strokeWidth: "8", fill: "none" }), /*#__PURE__*/

    React.createElement("circle", {
      className: "progress-circle neon-filter",
      cx: "128", cy: "128", r: radius,
      stroke: "var(--neon)", strokeWidth: "8", fill: "none",
      strokeDasharray: circumference,
      strokeDashoffset: dashOffset,
      strokeLinecap: "round" }
    )
    ), /*#__PURE__*/







    React.createElement("div", { className: "absolute inset-0 pointer-events-none", style: { transform: 'rotate(270deg)' } }, /*#__PURE__*/

    React.createElement("div", { className: "absolute top-[38px] left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/90 shadow-[0_0_8px_white]" })
    ), /*#__PURE__*/


    React.createElement("div", { className: "absolute top-1/2 -left-4 -translate-y-1/2 text-[9px] text-white/90 font-medium bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md" }, "Eligibility (75)"

    ), /*#__PURE__*/

    React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center" }, /*#__PURE__*/
    React.createElement("span", { className: "text-sm font-bold text-muted uppercase tracking-widest mb-1" }, "Score"), /*#__PURE__*/
    React.createElement("span", { className: "font-heading text-6xl font-bold text-white tracking-tighter" }, score), /*#__PURE__*/
    React.createElement("div", { className: "mt-2 bg-neon/10 px-3 py-1 rounded-full border border-neon/20" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-neon uppercase tracking-wide" }, "Reputed Reviewer")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "w-full space-y-3" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs font-bold text-muted uppercase tracking-wider px-1 mb-2" }, "Score Components"), /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Check", size: 18, className: "text-white" }), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-white" }, "Consistency"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Posts & Comments Given")
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-sm font-heading font-bold text-white" }, profile.rqs_consistency, "/20")
    ), /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Shield", size: 18, className: "text-neon" }), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-white" }, "Verification"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Verified Product Reviews")
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-sm font-heading font-bold text-white" }, profile.rqs_verification, "/40")
    ), /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Star", size: 18, className: "text-white" }), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-white" }, "Impact"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Agrees & Comments Rec.")
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-sm font-heading font-bold text-white" }, profile.rqs_impact, "/30")
    ), /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "User", size: 18, className: "text-white" }), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-white" }, "Legacy"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Account Age & Profile")
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-sm font-heading font-bold text-white" }, profile.rqs_legacy_score || 0, "/10")
    )
    )
    )
    )
    ));

};

// 3. MONETIZATION (UPDATED: Application Flow)
const MonetizationView = ({ onBack, onScroll, isHeaderVisible, profile, partnerStats, status, setStatus, setIsPartnerModalOpen, onRevenueClick }) => {
  // Calculation Logic
  const rqsTarget = 75;
  const interactionsTarget = 500;
  const streakTarget = 4;

  const rqsProgress = Math.min(profile.rqs / rqsTarget * 100, 100);
  const intProgress = Math.min(partnerStats.interactionCount / interactionsTarget * 100, 100);
  const streakProgress = Math.min(partnerStats.streakWeeks / streakTarget * 100, 100);

  const totalProgress = Math.round((rqsProgress + intProgress + streakProgress) / 3);

  const isEligible = profile.rqs >= rqsTarget &&
  partnerStats.interactionCount >= interactionsTarget &&
  partnerStats.streakWeeks >= streakTarget;

  // TAG HELPER
  const getStatusTag = (progress) => {
    if (progress <= 50) return '(Setting up)';
    if (progress <= 90) return '(Emerging)';
    if (progress < 100) return '(So close)';
    return '(Eligible)';
  };

  const statusTag = getStatusTag(totalProgress);

  const handleApplyClick = () => {
    setIsPartnerModalOpen(true);
  };

  // IF APPROVED: Removed early return to show refined Welcome UI
  // if (status === 'approved') {
  //     return <EarningsView onBack={onBack} onScroll={onScroll} earnings={{ total: profile.total_earnings || 0, lastMonth: 0, logs: [], coupons: [], breakdown: [] }} />;
  // }

  const applyButton = totalProgress === 100 && status === 'none' ? /*#__PURE__*/
  React.createElement("button", {
    onClick: handleApplyClick,
    className: "bg-brand-blue text-white text-[10px] font-black px-4 py-2 rounded-full shadow-[0_0_15px_rgba(47,139,255,0.4)] active:scale-95 transition-all" },
  "APPLY"

  ) :
  null;

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in" }, /*#__PURE__*/
    React.createElement(SectionHeader, { title: "Partner Program", onBack: onBack, rightElement: applyButton, isVisible: isHeaderVisible }), /*#__PURE__*/
    React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/

    React.createElement("div", { className: "relative pt-4 pb-8 text-center" }, /*#__PURE__*/
    React.createElement("div", { className: "inline-block relative" }, /*#__PURE__*/
    React.createElement("div", { className: `w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-[0_0_30px_rgba(47,139,255,0.15)] ${isEligible || status === 'approved' ? 'border-neon bg-neon/5' : 'border-white/10 bg-white/5'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Zap", size: 32, className: isEligible || status === 'approved' ? "text-neon" : "text-muted" })
    ), /*#__PURE__*/


    React.createElement("div", { className: `absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-3 py-1 rounded-full shadow-lg border whitespace-nowrap ${status === 'approved' ? 'bg-accent-green text-black border-accent-green' :
      status === 'pending' ? 'bg-amber-500 text-black border-amber-400' :
      status === 'applied' ? 'bg-blue-500 text-white border-blue-400' :
      status === 'rejected' ? 'bg-red-500 text-white border-red-400' :
      isEligible ? 'bg-neon text-white border-white/20' :
      'bg-black text-muted border-white/10'}` },

    status === 'approved' ? 'APPROVED' :
    status === 'pending' ? 'APPLICATION RECEIVED' :
    status === 'applied' ? 'APPLICATION SENT' :
    status === 'rejected' ? 'REJECTED' :
    status === 'none' ? statusTag.toUpperCase() : 'UNDER REVIEW'
    )
    ), /*#__PURE__*/

    React.createElement("h2", { className: "font-heading text-2xl font-bold text-white mt-4" },
    status === 'approved' ? 'Partner Active' :
    status === 'pending' ? 'Application Received' :
    status === 'applied' ? 'Application Sent' :
    status === 'rejected' ? 'Application Rejected' :
    isEligible ? 'Eligible to Apply' : 'Partner Program'
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted mt-1" },
    status === 'approved' ? 'Your monetization is now active.' :
    status === 'pending' ? 'We are reviewing your profile.' :
    status === 'applied' ? 'Your request has been sent to admin.' :
    status === 'rejected' ? 'Your application did not meet our criteria.' :
    isEligible ? 'You have met all criteria!' : 'Progression active. Your actions count.'
    ),


    totalProgress === 100 && status === 'none' && /*#__PURE__*/
    React.createElement("button", {
      onClick: handleApplyClick,
      className: "mt-6 px-10 py-3.5 bg-neon text-white font-bold rounded-xl shadow-[0_0_20px_rgba(47,139,255,0.4)] active:scale-95 transition-transform text-sm whitespace-nowrap" },
    "Apply for Partner Program"

    )

    ),


    status === 'pending' && /*#__PURE__*/
    React.createElement("div", { className: "mb-6 animate-slide-in" }, /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-6 rounded-2xl border-neon/20 bg-neon/5 relative overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute top-0 right-0 p-4 opacity-10" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Shield", size: 64 })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-white font-heading font-bold text-lg mb-2" }, "Review in Progress"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted leading-relaxed mb-4" }, "\"Thank you for your application. Our team is currently verifying your identity and bank details to ensure a secure partnership. You will be notified once the review is complete.\""

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white" }, "AK"), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] font-bold text-white" }, "Aditya Kumar"), /*#__PURE__*/
    React.createElement("p", { className: "text-[8px] text-muted" }, "Founder, PlusOpinion")
    )
    )
    )
    ),



    status === 'approved' && /*#__PURE__*/
    React.createElement("div", { className: "mb-6 animate-slide-in" }, /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-6 rounded-2xl border-neon/20 bg-neon/5 relative overflow-hidden shadow-[0_0_40px_rgba(47,139,255,0.05)]" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute top-0 right-0 p-4 opacity-10 text-neon" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "CheckCircle", size: 64 })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-white font-heading font-bold text-lg mb-2" }, "Welcome to the Program"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted leading-relaxed mb-4" }, "\"Congratulations! Your application has been approved. We are excited to have you as a verified partner. Your contributions are now part of our official creator economy, and your earnings and professional dashboard are fully activated.\""

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-full bg-neon/20 flex items-center justify-center text-[10px] font-bold text-neon border border-neon/20 shadow-inner" }, "AK"), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] font-bold text-white" }, "Aditya Kumar"), /*#__PURE__*/
    React.createElement("p", { className: "text-[8px] text-muted" }, "Founder, PlusOpinion")
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: onRevenueClick,
      className: "w-full mt-6 py-3 bg-neon text-white text-xs font-black rounded-xl hover:shadow-[0_0_20px_rgba(47,139,255,0.3)] transition-all flex items-center justify-center gap-2" }, /*#__PURE__*/

    React.createElement(Icon, { icon: "Wallet", size: 14 }), "OPEN REVENUE STUDIO"

    )
    )
    ),



    status === 'rejected' && /*#__PURE__*/
    React.createElement("div", { className: "mb-6 animate-slide-in" }, /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-6 rounded-2xl border-red-500/20 bg-red-500/5 relative overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute top-0 right-0 p-4 opacity-10 text-red-500" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "AlertTriangle", size: 64 })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-white font-heading font-bold text-lg mb-2" }, "Application Update"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-red-200/60 leading-relaxed mb-4" }, "Unfortunately, your partner application was not approved at this time. This is often due to mismatched identity documents or incomplete bank verification."

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setStatus('none'),
      className: "w-full py-3 bg-white/5 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-colors" },
    "Re-apply with Correct Details"

    )
    )
    ), /*#__PURE__*/



    React.createElement("div", { className: "glass-panel p-5 rounded-2xl" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between text-xs font-bold mb-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-white" }, "Eligibility Progress"), /*#__PURE__*/
    React.createElement("span", { className: "text-neon" }, totalProgress, "%")
    ), /*#__PURE__*/
    React.createElement("div", { className: "h-2 w-full bg-white/5 rounded-full relative" }, /*#__PURE__*/
    React.createElement("div", { className: "h-full bg-neon rounded-full relative shadow-[0_0_15px_var(--neon)] transition-all duration-1000", style: { width: `${totalProgress}%` } }, /*#__PURE__*/
    React.createElement("div", { className: "glow-tip" })
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-4 mt-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs font-bold text-muted uppercase tracking-wider px-1" }, "Requirements")
    ), /*#__PURE__*/


    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: `w-8 h-8 rounded-full flex items-center justify-center border ${profile.rqs >= rqsTarget ? 'bg-neon/10 border-neon/30' : 'bg-white/5 border-white/10'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: profile.rqs >= rqsTarget ? "Check" : "Activity", size: 14, className: profile.rqs >= rqsTarget ? "text-neon" : "text-muted" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-sm font-bold text-white" }, "Reputation Score"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Must be \u2265 ", rqsTarget)
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: `text-xs font-bold ${profile.rqs >= rqsTarget ? "text-neon" : "text-white"}` }, profile.rqs)
    ), /*#__PURE__*/


    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: `w-8 h-8 rounded-full flex items-center justify-center border ${partnerStats.interactionCount >= interactionsTarget ? 'bg-neon/10 border-neon/30' : 'bg-white/5 border-white/10'}` }, /*#__PURE__*/
    React.createElement("span", { className: `text-xs font-bold ${partnerStats.interactionCount >= interactionsTarget ? "text-neon" : "text-white"}` }, "2")
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-sm font-bold text-white" }, "Community Interactions"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Likes, comments, shares")
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-white" }, partnerStats.interactionCount, " / ", interactionsTarget)
    ), /*#__PURE__*/


    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: `w-8 h-8 rounded-full flex items-center justify-center border ${partnerStats.streakWeeks >= streakTarget ? 'bg-neon/10 border-neon/30' : 'bg-white/5 border-white/10'}` }, /*#__PURE__*/
    React.createElement("span", { className: `text-xs font-bold ${partnerStats.streakWeeks >= streakTarget ? "text-neon" : "text-white"}` }, "4")
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("p", { className: "text-sm font-bold text-white" }, "Active Streak"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted" }, "Consecutive weeks")
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-white" }, partnerStats.streakWeeks, " / ", streakTarget)
    )
    )
    )
    ));

};


// 4. ANALYTICS
const AnalyticsView = ({ onBack, onScroll, isHeaderVisible }) => {
  return (/*#__PURE__*/
    React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in" }, /*#__PURE__*/
    React.createElement(SectionHeader, { title: "Profile Insights", onBack: onBack, isVisible: isHeaderVisible }), /*#__PURE__*/
    React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col items-center justify-center py-20 px-6 text-center space-y-6" }, /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement("div", { className: "relative w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-sm" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "BarChart2", size: 40, className: "text-white/80" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("h2", { className: "font-heading text-2xl font-bold text-white" }, "Analytics Hub"), /*#__PURE__*/
    React.createElement("p", { className: "text-sm text-muted max-w-[250px] mx-auto leading-relaxed" }, "Deep insights into your audience and content performance are being baked."

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-neon animate-pulse" }), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-white uppercase tracking-widest" }, "Coming Soon")
    )
    )
    )
    ));

};

// 5. BRAND INTERACTIONS
const BrandInteractionView = ({ onBack, onScroll, isHeaderVisible, posts = [], onShare, profile }) => {
  // Data from getMyBrandInteractions uses 'brand_name' and already filtered by 'seen_by_brand'
  const brands = posts;

  const handleImgError = (e, name) => {
    const parent = e.target.parentNode;

    // Remove the broken image
    e.target.remove();

    // Create text fallback (brand initials)
    parent.textContent = name.
    split(' ').
    map((word) => word[0]).
    join('').
    slice(0, 2).
    toUpperCase();

    parent.style.display = 'flex';
    parent.style.alignItems = 'center';
    parent.style.justifyContent = 'center';
    parent.style.color = '#000';
    parent.style.fontWeight = '700';
    parent.style.fontSize = '11px';
    parent.style.background = '#fff';
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in" }, /*#__PURE__*/
    React.createElement(SectionHeader, { title: "Brand Interactions", onBack: onBack, isVisible: isHeaderVisible }), /*#__PURE__*/
    React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted/60 mb-6 px-2 leading-relaxed" }, "Official acknowledgments from brands. Verified interactions boost your partner status."

    ), /*#__PURE__*/
    React.createElement("div", { className: "space-y-3" },
    brands.length === 0 ? /*#__PURE__*/
    React.createElement("div", { className: "text-center text-muted/50 py-10 font-heading tracking-widest" }, "NO INTERACTIONS YET") :
    brands.map((item, i) => {
      const brandName = item.seen_by_brand || item.brand_name || "Brand";
      const logoUrl = BRAND_LOGOS[brandName] || "https://via.placeholder.com/100?text=Brand";
      return (/*#__PURE__*/
        React.createElement("div", { key: item.id || i, className: "glass-panel p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-transform animate-slide-in", style: { animationDelay: `${i * 50}ms` } }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-4" }, /*#__PURE__*/
        React.createElement("div", { className: "w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-sm shrink-0" },
        BRAND_LOGOS[brandName] ? /*#__PURE__*/
        React.createElement("img", {
          src: BRAND_LOGOS[brandName],
          alt: brandName,
          className: "w-full h-full object-contain p-2",
          onError: (e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          } }
        ) :
        null, /*#__PURE__*/
        React.createElement("div", { className: `w-full h-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-white to-gray-100 text-[#000000] ${BRAND_LOGOS[brandName] ? 'hidden' : ''}` },
        brandName ? brandName[0].toUpperCase() : 'B'
        )
        ), /*#__PURE__*/
        React.createElement("div", null, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
        React.createElement("span", { className: "text-[9px] text-neon/80 font-bold tracking-wider bg-neon/5 px-2 py-1 rounded border border-neon/10 cursor-default flex items-center gap-2 uppercase" }, /*#__PURE__*/
        React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]" }), "Seen by ",
        brandName
        )
        )
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "flex flex-col items-end gap-2" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1 text-[9px] text-muted/50 font-medium" }, /*#__PURE__*/
        React.createElement(Icon, { icon: "Clock", size: 10 }), /*#__PURE__*/
        React.createElement("span", null, new Date(item.created_at).toLocaleDateString())
        )
        )
        ));

    })
    )
    )
    ));

};

// 6. HUBS (Expanded)
const SecurityView = ({ onBack, onScroll, isHeaderVisible }) => {
  const handlePasswordReset = () => {
    // Redirect to the dedicated change password page for authenticated users
    window.location.href = 'change-password.html';
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in" }, /*#__PURE__*/
    React.createElement(SectionHeader, { title: "Security Center", onBack: onBack, isVisible: isHeaderVisible }), /*#__PURE__*/
    React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-6 rounded-2xl text-center mb-4" }, /*#__PURE__*/
    React.createElement("div", { className: "w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Shield", size: 28, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("h2", { className: "font-heading text-xl font-bold text-white" }, "Protected"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-muted mt-2" }, "Account status: Secure")
    ), /*#__PURE__*/
    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: handlePasswordReset,
      className: "w-full glass-panel p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors group active:scale-[0.98]" }, /*#__PURE__*/

    React.createElement("span", { className: "text-sm text-white font-medium group-hover:text-neon transition-colors" }, "Password Manager"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted" }, "Change"), /*#__PURE__*/
    React.createElement(Icon, { icon: "ChevronRight", size: 14, className: "text-muted" })
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "glass-panel p-4 rounded-xl flex justify-between items-center" }, /*#__PURE__*/
    React.createElement("span", { className: "text-sm text-white font-medium" }, "Login Activity"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-muted" }, "Current Device")
    )
    )
    )
    ));

};

const SupportView = ({ onBack, onScroll, isHeaderVisible }) => /*#__PURE__*/
React.createElement("div", { className: "flex flex-col h-full bg-[#000000] animate-slide-in" }, /*#__PURE__*/
React.createElement(SectionHeader, { title: "Help & Support", onBack: onBack, isVisible: isHeaderVisible }), /*#__PURE__*/
React.createElement(ViewWrapper, { onScroll: onScroll }, /*#__PURE__*/
React.createElement("div", { className: "space-y-3" }, /*#__PURE__*/
React.createElement("a", {
  href: "mailto:support@plusopinion.com?subject=Withdrawal Inquiry",
  className: "w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-neon/30 transition-all active:scale-[0.98] text-left group block" }, /*#__PURE__*/

React.createElement("div", { className: "p-2 rounded-lg bg-white/5 group-hover:bg-neon/10 transition-colors" }, /*#__PURE__*/
React.createElement(Icon, { icon: "Wallet", size: 20, className: "text-white group-hover:text-neon" })
), /*#__PURE__*/
React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
React.createElement("h4", { className: "text-sm font-bold text-white group-hover:text-neon transition-colors" }, "Withdrawals"), /*#__PURE__*/
React.createElement("p", { className: "text-[10px] text-muted" }, "Payment status & help")
), /*#__PURE__*/
React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted/50 group-hover:text-neon transition-colors" })
), /*#__PURE__*/

React.createElement("a", {
  href: "mailto:support@plusopinion.com?subject=Ticket History Request",
  className: "w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-neon/30 transition-all active:scale-[0.98] text-left group block" }, /*#__PURE__*/

React.createElement("div", { className: "p-2 rounded-lg bg-white/5 group-hover:bg-neon/10 transition-colors" }, /*#__PURE__*/
React.createElement(Icon, { icon: "Mail", size: 20, className: "text-white group-hover:text-neon" })
), /*#__PURE__*/
React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
React.createElement("h4", { className: "text-sm font-bold text-white group-hover:text-neon transition-colors" }, "Ticket History"), /*#__PURE__*/
React.createElement("p", { className: "text-[10px] text-muted" }, "View past inquiries")
), /*#__PURE__*/
React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted/50 group-hover:text-neon transition-colors" })
), /*#__PURE__*/

React.createElement("a", {
  href: "https://wa.me/918700591393",
  target: "_blank",
  rel: "noopener noreferrer",
  className: "w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-accent-green/30 transition-all active:scale-[0.98] text-left group block" }, /*#__PURE__*/

React.createElement("div", { className: "p-2 rounded-lg bg-white/5 group-hover:bg-accent-green/10 transition-colors" }, /*#__PURE__*/
React.createElement(Icon, { icon: "Activity", size: 20, className: "text-white group-hover:text-accent-green" })
), /*#__PURE__*/
React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
React.createElement("h4", { className: "text-sm font-bold text-white group-hover:text-accent-green transition-colors" }, "Live Chat"), /*#__PURE__*/
React.createElement("p", { className: "text-[10px] text-accent-green" }, "Agents Online")
), /*#__PURE__*/
React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted/50 group-hover:text-accent-green transition-colors" })
), /*#__PURE__*/

React.createElement("a", {
  href: "mailto:founder@plusopinion.com?subject=Critical Issue Report",
  className: "w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-danger/30 transition-all active:scale-[0.98] text-left group mt-4 border-danger/10 block" }, /*#__PURE__*/

React.createElement("div", { className: "p-2 rounded-lg bg-danger/5 group-hover:bg-danger/10 transition-colors" }, /*#__PURE__*/
React.createElement(Icon, { icon: "Shield", size: 20, className: "text-danger" })
), /*#__PURE__*/
React.createElement("div", { className: "flex-1" }, /*#__PURE__*/
React.createElement("h4", { className: "text-sm font-bold text-white group-hover:text-danger transition-colors" }, "Report Issue"), /*#__PURE__*/
React.createElement("p", { className: "text-[10px] text-muted" }, "Escalate critical bugs")
), /*#__PURE__*/
React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted/50 group-hover:text-danger transition-colors" })
)
)
)
);


// --- PARTNER APPLICATION MODAL ---
const PartnerApplicationModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    legal_name: '',
    permanent_email: '',
    id_number: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_holder_name: '',
    upi_id: ''
  });

  const updateField = (field, val) => setFormData((prev) => ({ ...prev, [field]: val }));

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      let id_document_url = 'none';

      if (selectedFile) {
        const user = await window.getCurrentUser();
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `id-documents/${fileName}`;

        const { error: uploadError } = await window.supabase.storage.
        from('partner-id-docs').
        upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = window.supabase.storage.
        from('partner-id-docs').
        getPublicUrl(filePath);

        id_document_url = publicUrl;
      }

      await onSubmit({ ...formData, id_document_url });
      onClose();
    } catch (err) {
      console.error('Submission failed:', err);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Upload failed: ' + (err.message || 'Error'), icon: 'AlertTriangle' }
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (/*#__PURE__*/
          React.createElement("div", { className: "space-y-4 animate-slide-in" }, /*#__PURE__*/
          React.createElement("h4", { className: "text-white font-bold text-sm mb-4" }, "Step 1: General Information"), /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "Legal Full Name"), /*#__PURE__*/
          React.createElement("input", {
            type: "text",
            value: formData.legal_name,
            onChange: (e) => updateField('legal_name', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "As per Government ID" }
          )
          ), /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "Permanent Email"), /*#__PURE__*/
          React.createElement("input", {
            type: "email",
            value: formData.permanent_email,
            onChange: (e) => updateField('permanent_email', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "example@email.com" }
          )
          ), /*#__PURE__*/
          React.createElement("button", { onClick: handleNext, className: "w-full py-3.5 bg-neon rounded-xl text-white font-bold text-sm mt-4" }, "Next Step")
          ));

      case 2:
        return (/*#__PURE__*/
          React.createElement("div", { className: "space-y-4 animate-slide-in" }, /*#__PURE__*/
          React.createElement("h4", { className: "text-white font-bold text-sm mb-4" }, "Step 2: Identity Verification"), /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "Government ID Number"), /*#__PURE__*/
          React.createElement("input", {
            type: "text",
            value: formData.id_number,
            onChange: (e) => updateField('id_number', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "PAN / Passport / Voter ID" }
          )
          ), /*#__PURE__*/
          React.createElement("div", {
            className: `p-6 border-2 border-dashed rounded-2xl text-center bg-white/5 transition-colors cursor-pointer ${selectedFile ? 'border-neon/50' : 'border-white/10'}`,
            onClick: () => fileInputRef.current.click() }, /*#__PURE__*/

          React.createElement("input", {
            type: "file",
            ref: fileInputRef,
            className: "hidden",
            onChange: (e) => setSelectedFile(e.target.files[0]),
            accept: ".jpg,.jpeg,.png,.pdf" }
          ), /*#__PURE__*/
          React.createElement(Icon, { icon: selectedFile ? "FileCheck" : "Shield", size: 32, className: `${selectedFile ? 'text-neon' : 'text-muted'} mx-auto mb-3` }), /*#__PURE__*/
          React.createElement("p", { className: "text-[11px] text-muted" },
          selectedFile ? /*#__PURE__*/
          React.createElement("span", { className: "text-white font-bold" }, selectedFile.name, " (", (selectedFile.size / 1024).toFixed(1), " KB)") : /*#__PURE__*/

          React.createElement(React.Fragment, null, "Upload Photo of ID Document", /*#__PURE__*/React.createElement("br", null), "(Max 5MB \u2022 JPG, PNG, PDF)")

          ), /*#__PURE__*/
          React.createElement("button", { className: "mt-4 px-6 py-2 bg-white/10 rounded-lg text-xs font-bold text-white pointer-events-none" },
          selectedFile ? "Change File" : "Select File"
          )
          ), /*#__PURE__*/
          React.createElement("div", { className: "flex gap-3" }, /*#__PURE__*/
          React.createElement("button", { onClick: handleBack, className: "flex-1 py-3.5 bg-white/5 rounded-xl text-white font-bold text-sm" }, "Back"), /*#__PURE__*/
          React.createElement("button", { onClick: handleNext, className: "flex-1 py-3.5 bg-neon rounded-xl text-white font-bold text-sm" }, "Next Step")
          )
          ));

      case 3:
        return (/*#__PURE__*/
          React.createElement("div", { className: "space-y-4 animate-slide-in" }, /*#__PURE__*/
          React.createElement("h4", { className: "text-white font-bold text-sm mb-4" }, "Step 3: Payout Details"), /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "Bank Account Holder Name"), /*#__PURE__*/
          React.createElement("input", {
            type: "text",
            value: formData.bank_holder_name,
            onChange: (e) => updateField('bank_holder_name', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "Full Name as per Bank" }
          )
          ), /*#__PURE__*/
          React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "Account Number"), /*#__PURE__*/
          React.createElement("input", {
            type: "text",
            value: formData.bank_account_no,
            onChange: (e) => updateField('bank_account_no', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "XXXX XXXX XXXX" }
          )
          ), /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "IFSC Code"), /*#__PURE__*/
          React.createElement("input", {
            type: "text",
            value: formData.bank_ifsc,
            onChange: (e) => updateField('bank_ifsc', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "SBIN000XXXX" }
          )
          )
          ), /*#__PURE__*/
          React.createElement("div", null, /*#__PURE__*/
          React.createElement("label", { className: "text-[10px] text-muted uppercase font-bold mb-1.5 block" }, "UPI ID (Optional)"), /*#__PURE__*/
          React.createElement("input", {
            type: "text",
            value: formData.upi_id,
            onChange: (e) => updateField('upi_id', e.target.value),
            className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50",
            placeholder: "username@upi" }
          )
          ), /*#__PURE__*/
          React.createElement("div", { className: "flex gap-3 mt-4" }, /*#__PURE__*/
          React.createElement("button", { onClick: handleBack, className: "flex-1 py-3.5 bg-white/5 rounded-xl text-white font-bold text-sm" }, "Back"), /*#__PURE__*/
          React.createElement("button", {
            onClick: handleSubmit,
            disabled: isSubmitting,
            className: "flex-1 py-3.5 bg-accent-green text-black font-bold text-sm rounded-xl" },

          isSubmitting ? 'Submitting...' : 'Complete Application'
          )
          )
          ));

    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in", onClick: onClose }), /*#__PURE__*/
    React.createElement("div", { className: "relative w-full max-w-md bg-[#000000] border border-white/10 rounded-3xl p-6 shadow-2xl animate-pop overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "flex justify-between items-center mb-6" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h3", { className: "text-lg font-heading font-bold text-white" }, "Partner Application"), /*#__PURE__*/
    React.createElement("p", { className: "text-[10px] text-muted uppercase font-medium" }, "Progress: ", step, "/3")
    ), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-2 bg-white/5 rounded-full text-muted hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 18 })
    )
    ),

    renderStep(), /*#__PURE__*/


    React.createElement("div", { className: "h-1 w-full bg-white/5 rounded-full mt-8 overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "h-full bg-neon transition-all duration-300", style: { width: `${step / 3 * 100}%` } })
    )
    )
    ));

};

// --- SHARE MODAL ---
const ShareModal = ({ isOpen, onClose, post }) => {

  const [internalContacts, setInternalContacts] = useState([]);
  const [internalLoadingContacts, setInternalLoadingContacts] = useState(false);
  const [internalSelectedContacts, setInternalSelectedContacts] = useState(new Set());
  const [internalSending, setInternalSending] = useState(false);

  useEffect(() => {
    const fetchInternalContacts = async () => {
      if (!isOpen || !window.getCurrentUser) return;
      setInternalLoadingContacts(true);
      try {
        const user = await window.getCurrentUser();
        if (!user) return;
        const { data } = await window.supabase.
        from('conversations').
        select('id, participant_1_id, participant_2_id').
        or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`).
        order('last_message_at', { ascending: false }).
        limit(10);
        if (data && data.length > 0) {
          const otherIds = [...new Set(data.map((c) => c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id))];
          const { data: profiles } = await window.supabase.
          from('profiles').select('id, full_name, avatar_url, username').in('id', otherIds);
          if (profiles) {
            const profileMap = {};
            profiles.forEach((p) => profileMap[p.id] = p);
            const contacts = data.map((c) => {
              const otherId = c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id;
              const profile = profileMap[otherId];
              if (!profile) return null;
              return { convId: c.id, ...profile };
            }).filter(Boolean);
            if (window.rewriteMediaUrl) contacts.forEach((c) => {if (c.avatar_url) c.avatar_url = window.rewriteMediaUrl(c.avatar_url);});
            setInternalContacts(contacts);
          }
        }
      } catch (e) {console.error('Failed to load contacts', e);} finally
      {setInternalLoadingContacts(false);}
    };
    fetchInternalContacts();
  }, [isOpen]);

  const handleInternalSend = async () => {
    if (internalSelectedContacts.size === 0 || internalSending) return;
    if (!window.sendPostToUser) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Sharing system initializing...', icon: 'Clock', isSuccess: false } }));
      return;
    }
    setInternalSending(true);
    const contactsToSend = internalContacts.filter((c) => internalSelectedContacts.has(c.id));
    const shareTarget = post || user;
    let successCount = 0;
    for (const contact of contactsToSend) {
      try {await window.sendPostToUser(contact.convId, contact.id, contact.full_name || contact.username, contact.avatar_url, shareTarget);successCount++;}
      catch (e) {console.error(`Failed to send to ${contact.username}`, e);}
    }
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Shared with ${successCount} profile${successCount > 1 ? 's' : ''}`, icon: 'Send', isSuccess: true } }));
    setInternalSending(false);
    onClose();
  };


  if (!isOpen || !post) return null;

  const shareUrl = `https://plusopinion.com/post/${post.id}`;
  const shareText = `Check out this interaction by @${post.username}`;

  const handleCopy = async () => {
    try {
      const cleanText = `Check out this interaction on PlusOpinion:\n\n"${post.text ? post.text.substring(0, 100) + '...' : ''}"\n\nRead more at: ${shareUrl}`;
      await navigator.clipboard.writeText(cleanText);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link & Preview copied', icon: 'Link', isSuccess: true } }));
      if (window.trackShare) window.trackShare(post.id);
      onClose();
    } catch (err) {console.error(err);}
  };

  const handleWhatsApp = () => {
    const waText = `🔥 *New Interaction on PlusOpinion!*\n\n"@${post.username}: ${post.text ? post.text.substring(0, 80) : ''}..."\n\nRead full POV here:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
    if (window.trackShare) window.trackShare(post.id);
    onClose();
  };

  const handleInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Top Interaction', text: shareText, url: shareUrl });
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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PlusOpinion', text: shareText, url: shareUrl });
        if (window.trackShare) window.trackShare(post.id);
        onClose();
      } catch (err) {}
    } else {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Sharing not supported', icon: 'AlertTriangle' } }));
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-[60] flex items-end justify-center sm:px-4" }, /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in", onClick: onClose }), /*#__PURE__*/
    React.createElement("div", { className: "relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col" }, /*#__PURE__*/

    React.createElement("div", { className: "w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" }), /*#__PURE__*/

    React.createElement("div", { className: "flex justify-between items-center mb-6 shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "text-white font-heading font-bold text-lg" }, "Share Interaction"), /*#__PURE__*/
    React.createElement("button", { onClick: onClose, className: "p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "X", size: 20 })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "glass-panel rounded-2xl p-5 mb-6 border border-white/5 relative overflow-hidden group flex flex-col animate-fade-in shadow-2xl" }, /*#__PURE__*/

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

    React.createElement("p", { className: "text-sm text-gray-200 leading-relaxed mb-3 font-light line-clamp-3" }, renderTextWithMentions(post.text)),

    (post.media || post.images && post.images.length > 0) && /*#__PURE__*/
    React.createElement("div", { className: "w-full rounded-xl mb-3 border border-white/5 relative bg-black/20 overflow-hidden" },
    post.media_type === 'video' && (!post.images || post.images.length === 0) ? /*#__PURE__*/
    React.createElement("div", { className: "w-full h-40 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement("video", { src: post.media, className: "w-full h-full object-cover opacity-60" }), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement("div", { className: "p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Video", size: 20, className: "text-white" })
    )
    )
    ) : /*#__PURE__*/

    React.createElement("div", { className: "relative w-full" }, /*#__PURE__*/
    React.createElement("img", { src: post.images && post.images.length > 0 ? post.images[0] : post.media, className: "w-full h-auto max-h-40 object-cover opacity-90" }),
    post.images && post.images.length > 1 && /*#__PURE__*/
    React.createElement("div", { className: "absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white font-bold backdrop-blur-sm pointer-events-none" }, "1/",
    post.images.length
    )

    )

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



    React.createElement("div", { className: "mb-6 overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-4" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-white/40 uppercase tracking-widest" }, "Share to Profiles"),
    internalSelectedContacts.size > 0 && /*#__PURE__*/
    React.createElement("button", { onClick: () => setInternalSelectedContacts(new Set()), className: "text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase" }, "Clear (", internalSelectedContacts.size, ")")

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex gap-4 overflow-x-auto select-none custom-scrollbar pb-2 px-1" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        onClose();
        if (window.toggleInbox) {window.toggleInbox(true);} else
        if (window.openInbox) {window.openInbox();}
        setTimeout(() => {
          if (window._inboxBootPhase1 && window._inboxBootPhase1.openSearchOverlay) window._inboxBootPhase1.openSearchOverlay();
        }, 500);
      },
      className: "flex flex-col items-center gap-2 group min-w-[64px] shrink-0" }, /*#__PURE__*/

    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-lg" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Search", size: 24, className: "text-white/70 group-hover:text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-white/70 group-hover:text-white truncate w-14 text-center" }, "Search")
    ),

    internalLoadingContacts && /*#__PURE__*/React.createElement("div", { className: "text-white/40 text-xs py-3 px-4" }, "Loading..."),
    !internalLoadingContacts && internalContacts.map((c) => {
      const isSelected = internalSelectedContacts.has(c.id);
      return (/*#__PURE__*/
        React.createElement("button", { key: c.id, onClick: () => {
            const next = new Set(internalSelectedContacts);
            if (next.has(c.id)) next.delete(c.id);else next.add(c.id);
            setInternalSelectedContacts(next);
          }, className: "flex flex-col items-center gap-2 group min-w-[64px] shrink-0" }, /*#__PURE__*/
        React.createElement("div", { className: `w-14 h-14 rounded-full border-2 transition-all duration-300 relative ${isSelected ? 'border-blue-500 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10 hover:border-white/30'}` }, /*#__PURE__*/
        React.createElement("img", { src: c.avatar_url || DEFAULT_AVATAR, className: "w-full h-full rounded-full object-cover", onError: (e) => {e.target.src = DEFAULT_AVATAR;} }),
        isSelected && /*#__PURE__*/
        React.createElement("div", { className: "absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-[#121212]" }, /*#__PURE__*/
        React.createElement(Icon, { icon: "Check", size: 10, className: "text-white" })
        )

        ), /*#__PURE__*/
        React.createElement("span", { className: "text-[10px] text-white/70 truncate w-14 text-center" }, c.full_name || c.username)
        ));

    }),
    !internalLoadingContacts && internalContacts.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "text-white/30 text-xs py-3 px-4 flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "MessageCircle", size: 14 }), /*#__PURE__*/React.createElement("span", null, "No conversations yet")
    )

    ),

    internalSelectedContacts.size > 0 && /*#__PURE__*/
    React.createElement("button", {
      onClick: handleInternalSend,
      disabled: internalSending,
      className: "mt-4 w-full py-3 rounded-2xl bg-[#2f8bff] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1a7bf0] active:scale-95 transition-all disabled:opacity-50" }, /*#__PURE__*/

    React.createElement(Icon, { icon: internalSending ? "Clock" : "Send", size: 16 }),
    internalSending ? 'Sending...' : `Send to ${internalSelectedContacts.size} Profile${internalSelectedContacts.size > 1 ? 's' : ''}`
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
    React.createElement("button", { onClick: handleNativeShare, className: "flex flex-col items-center gap-2 group" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all" }, /*#__PURE__*/
    React.createElement(Icon, { icon: "Share", size: 24, className: "text-white" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-muted" }, "More")
    )
    )
    )
    ));

};

// --- MAIN APP ---
// --- TOAST COMPONENT ---
const Toast = ({ message, icon, isSuccess, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw]" }, /*#__PURE__*/
    React.createElement("div", { className: "animate-slide-up" }, /*#__PURE__*/
    React.createElement("div", { className: `glass-panel border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-2xl ${isSuccess ? 'bg-accent-green/10' : 'bg-white/5'}` }, /*#__PURE__*/
    React.createElement("div", { className: `p-2 rounded-xl ${isSuccess ? 'bg-accent-green/20' : 'bg-white/10'}` }, /*#__PURE__*/
    React.createElement(Icon, { icon: icon || (isSuccess ? 'Check' : 'AlertTriangle'), size: 18, className: isSuccess ? 'text-accent-green' : 'text-white' })
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-sm font-bold text-white pr-2 whitespace-nowrap" }, message)
    )
    )
    ));

};

const DashboardCard = ({ icon, title, value, subtext, onClick, color = "text-white", delay = "0s", isLocked }) => /*#__PURE__*/
React.createElement("div", {
  onClick: isLocked ? () => window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Required progression not reached', icon: 'Lock' } })) : onClick,
  className: `glass-panel rounded-2xl p-5 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group animate-slide-in ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`,
  style: { animationDelay: delay } },

isLocked && /*#__PURE__*/
React.createElement("div", { className: "absolute top-3 right-3 text-muted/40" }, /*#__PURE__*/
React.createElement(Icon, { icon: "Lock", size: 14 })
), /*#__PURE__*/

React.createElement("div", { className: "flex justify-between items-start mb-3" }, /*#__PURE__*/
React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
React.createElement("div", { className: `p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors ${isLocked ? '' : 'group-hover:border-neon/30'}` }, /*#__PURE__*/
React.createElement(Icon, { icon: icon, size: 20, className: isLocked ? 'text-muted' : color })
), /*#__PURE__*/
React.createElement("span", { className: "text-sm font-medium text-muted group-hover:text-white transition-colors" }, title)
),
!isLocked && /*#__PURE__*/React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted/30 group-hover:text-white transition-colors" })
), /*#__PURE__*/
React.createElement("div", { className: "pl-1" }, /*#__PURE__*/
React.createElement("h3", { className: `font-heading font-bold text-2xl tracking-tight mb-1 transition-transform origin-left ${isLocked ? 'text-muted' : 'text-white group-hover:scale-105'}` }, isLocked ? 'Locked' : value), /*#__PURE__*/
React.createElement("p", { className: "text-[11px] text-muted font-medium" }, subtext)
)
);


const App = () => {

  const [sharedPostsToRender, setSharedPostsToRender] = useState({});

  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  // Handle URL query parameters for view redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    if (requestedView === 'rqs') {
      setView('rqs');
    } else if (requestedView === 'insights') {
      // Stay on dashboard but show toast
      setToast({
        message: 'Analytics feature coming soon in post beta',
        icon: 'Clock'
      });
    }
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

  const [activeTab, setActiveTab] = useState('myspace');
  const [navVisible, setNavVisible] = useState(true);
  const scrollTimer = useRef(null);
  const lastY = useRef(0);

  // Consolidated User State
  const [profile, setProfile] = useState({
    name: "Loading...",
    username: "",
    avatar_url: null,
    rqs: 0,
    rqs_consistency: 0,
    rqs_verification: 0,
    rqs_impact: 0,
    rqs_legacy_score: 0,
    total_earnings: 0,
    verified_count: 0
  });

  const [partnerStats, setPartnerStats] = useState({
    interactionCount: 0,
    streakWeeks: 0,
    verifiedCount: 0,
    tier: 'None'
  });

  const [brandInteractions, setBrandInteractions] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, lastMonth: 0, logs: [], coupons: [], breakdown: [] });
  const [status, setStatus] = useState('loading');

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToast = (e) => setToast(e.detail);
    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  const handleShare = (post) => {
    setSharePostData(post);
    setIsShareModalOpen(true);
  };

  const handlePartnerSubmit = async (formData) => {
    try {
      // 1. Save to partner_applications table
      const user = await window.getCurrentUser();
      const { error } = await window.supabase.
      from('partner_applications').
      upsert({
        user_id: user.id,
        legal_name: formData.legal_name,
        permanent_email: formData.permanent_email,
        id_number: formData.id_number,
        id_document_url: formData.id_document_url,
        bank_account_no: formData.bank_account_no,
        bank_ifsc: formData.bank_ifsc,
        bank_holder_name: formData.bank_holder_name,
        upi_id: formData.upi_id,
        status: 'pending',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // 2. Update status in profiles table explicitly
      await window.supabase.
      from('profiles').
      update({ partner_application_status: 'pending' }).
      eq('id', user.id);

      // 3. Update local state
      setStatus('pending');

      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Application Submitted Successfully!', icon: 'Check', isSuccess: true }
      }));
    } catch (err) {
      console.error('Partner submission failed:', err);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Submission failed. Try again.', icon: 'AlertTriangle' }
      }));
    }
  };

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch more brand interactions
  const loadMoreBrands = async (currentOffset = 0, reset = false) => {
    if (isLoadingMore && !reset) return;
    try {
      if (reset) {
        setOffset(0);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const interactions = await window.getMyBrandInteractions({ limit: 10, offset: reset ? 0 : currentOffset });
      setBrandInteractions((prev) => reset ? interactions : [...prev, ...interactions]);
      setHasMore(interactions.length === 10);

      if (!reset) setOffset(currentOffset + 10);else
      setOffset(10);
    } catch (e) {
      console.error("Failed to load more brands", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Load user data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const user = await window.getCurrentUser();
        if (!user) {
          setIsGuest(true);
          setShowAuthModal(true);
          setIsLoading(false);
          return;
        }
        setIsGuest(false);
        const cacheKey = `my_space_data_${user.id}`;

        // CACHE-FIRST: Try to load from cache first
        if (window.StateManager) {
          const cachedData = await window.StateManager.get(cacheKey);
          if (cachedData) {
            console.log('📦 Loading MY SPACE data from cache');
            setProfile(cachedData.profile);
            setPartnerStats(cachedData.partnerStats);
            setStatus(cachedData.status);
            setEarnings(cachedData.earnings);
            setBrandInteractions(cachedData.brandInteractions);
            setIsLoading(false);
            // Continue to fetch fresh data in background
          }
        }


        // ⚡ PARALLEL LOADING - All API calls fire simultaneously
        const [
        { data: profileData },
        stats,
        pStatus,
        earningsData,
        interactions] =
        await Promise.all([
        window.supabase.from('profiles').select('*, rqs_legacy_score').eq('id', user.id).single(),
        window.getPartnerStats(),
        window.getPartnerStatus(),
        window.getMyEarnings(),
        window.getMyBrandInteractions()]
        );

        const profileObj = profileData ? {
          name: profileData.full_name || "User",
          username: profileData.username || "",
          avatar_url: profileData.avatar_url,
          rqs: profileData.rqs_score || 0,
          rqs_consistency: profileData.rqs_consistency_score || 0,
          rqs_verification: profileData.rqs_verification_score || 0,
          rqs_impact: profileData.rqs_impact_score || 0,
          rqs_legacy_score: profileData.rqs_legacy_score || 0,
          total_earnings: profileData.total_earnings || 0,
          verified_count: 0
        } : profile;

        // Update state
        setProfile(profileObj);
        setPartnerStats(stats);
        setStatus(pStatus);
        setEarnings(earningsData);
        setBrandInteractions(interactions);

        // SAVE TO CACHE (5 minute TTL)
        if (window.StateManager) {
          await window.StateManager.set(cacheKey, {
            profile: profileObj,
            partnerStats: stats,
            status: pStatus,
            earnings: earningsData,
            brandInteractions: interactions
          }, { ttl: 5 * 60 * 1000 });
          console.log('💾 Saved MY SPACE data to cache');
        }


      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Setup pull-to-refresh handler
  useEffect(() => {
    const setupPullToRefresh = () => {
      if (window.PullToRefresh) {
        window.PullToRefresh.onRefresh(async () => {
          window.location.reload();
        });
      } else {
        setTimeout(setupPullToRefresh, 100);
      }
    };
    setTimeout(setupPullToRefresh, 200);
  }, []);

  // Real-time RQS Updates
  useEffect(() => {
    const setupSubscription = async () => {
      const user = await window.getCurrentUser();
      if (!user) return;

      const subscription = window.supabase.
      channel('profile_changes').
      on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime RQS Update:', payload.new);
          const newData = payload.new;
          setProfile((prev) => ({
            ...prev,
            name: newData.full_name || prev.name,
            username: newData.username || prev.username,
            avatar_url: newData.avatar_url || prev.avatar_url,
            rqs: newData.rqs_score || 0,
            rqs_consistency: newData.rqs_consistency_score || 0,
            rqs_verification: newData.rqs_verification_score || 0,
            rqs_impact: newData.rqs_impact_score || 0,
            rqs_legacy_score: newData.rqs_legacy_score || 0
            // verified_count and tier might need separate updates via stats, but this covers RQS
          }));

          // Auto-refresh other dependent stats if needed
          window.getPartnerStats().then((stats) => {
            setPartnerStats((prev) => ({ ...prev, ...stats, tier: newData.partner_program_tier }));
          });
        }
      ).
      subscribe();

      return () => {
        window.supabase.removeChannel(subscription);
      };
    };

    setupSubscription();
  }, []);

  // HOMEPAGE STYLE SCROLL LOGIC
  const handleScroll = (e) => {
    // Support checking scrollTop on target or parent (ViewWrapper)
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    const currentY = scrollTop || window.scrollY;
    const isScrollingDown = currentY > lastY.current;

    // Nav Logic (Hide on scroll down > 50, show on scroll up)
    if (isScrollingDown && currentY > 50) {
      setNavVisible(false);
    } else if (!isScrollingDown) {
      setNavVisible(true);
    }

    lastY.current = currentY;

    // Infinite Scroll Trigger for brands view or similar
    if (view === 'brands' && scrollHeight - scrollTop - clientHeight < 400) {
      if (!isLoadingMore && hasMore) {
        loadMoreBrands(offset);
      }
    }
  };

  const renderContent = () => {
    if (activeTab !== 'myspace') return /*#__PURE__*/React.createElement("div", { className: "h-full flex flex-col items-center justify-center text-neon font-heading tracking-widest text-sm opacity-50" }, "NAVIGATING...");

    // Pass handleScroll to all views so they trigger the nav logic
    if (view === 'earnings') return /*#__PURE__*/React.createElement(EarningsView, { onBack: () => setView('dashboard'), onScroll: handleScroll, isHeaderVisible: navVisible, earnings: earnings, profile: profile });
    if (view === 'rqs') return /*#__PURE__*/React.createElement(RQSView, { onBack: () => setView('dashboard'), onScroll: handleScroll, isHeaderVisible: navVisible, profile: profile });
    if (view === 'monetization') return /*#__PURE__*/React.createElement(MonetizationView, { onBack: () => setView('dashboard'), onScroll: handleScroll, isHeaderVisible: navVisible, profile: profile, partnerStats: partnerStats, status: status, setStatus: setStatus, setIsPartnerModalOpen: setIsPartnerModalOpen, onRevenueClick: () => setView('earnings') });
    if (view === 'brands') return /*#__PURE__*/React.createElement(BrandInteractionView, { onBack: () => setView('dashboard'), onScroll: handleScroll, isHeaderVisible: navVisible, posts: brandInteractions, onShare: handleShare, profile: profile });
    if (view === 'security') return /*#__PURE__*/React.createElement(SecurityView, { onBack: () => setView('dashboard'), onScroll: handleScroll, isHeaderVisible: navVisible });
    if (view === 'support') return /*#__PURE__*/React.createElement(SupportView, { onBack: () => setView('dashboard'), onScroll: handleScroll, isHeaderVisible: navVisible });

    // Unified Progression Logic (Dashboard & Inner View)
    const rqsTarget = 75;
    const interactionsTarget = 500;
    const streakTarget = 4;

    const rqsProgress = Math.min(profile.rqs / rqsTarget * 100, 100);
    const intProgress = Math.min(partnerStats.interactionCount / interactionsTarget * 100, 100);
    const streakProgress = Math.min(partnerStats.streakWeeks / streakTarget * 100, 100);

    // Final Synced Progress Calculation
    const totalMonetizationProgress = Math.round((rqsProgress + intProgress + streakProgress) / 3);

    const getStatusTag = (progress) => {
      if (progress <= 50) return '(Setting up)';
      if (progress <= 90) return '(Emerging)';
      if (progress < 100) return '(So close)';
      return '(Eligible)';
    };

    const isApproved = status === 'approved';

    // Dashboard Home
    return (/*#__PURE__*/
      React.createElement("div", { className: "flex flex-col h-full animate-slide-in overflow-hidden relative" }, /*#__PURE__*/
      React.createElement(ShareModal, { isOpen: isShareModalOpen, onClose: () => setIsShareModalOpen(false), post: sharePostData }), /*#__PURE__*/
      React.createElement("div", { className: `header-glass fixed top-0 left-0 w-full px-5 flex items-center justify-between h-[65px] z-50 transition-transform duration-500 ease-in-out ${navVisible ? 'translate-y-0' : '-translate-y-full'}` }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
      React.createElement(Avatar, {
        src: profile.avatar_url,
        className: "w-10 h-10 rounded-full bg-white/5 border border-white/10 shadow-lg object-cover",
        fallbackSize: 20 }
      ), /*#__PURE__*/
      React.createElement("div", null, /*#__PURE__*/
      React.createElement("h1", { className: "font-heading text-lg font-bold text-white leading-tight tracking-tight cursor-default" }, "My Space"

      ), /*#__PURE__*/
      React.createElement("p", { className: "text-[11px] text-muted font-medium tracking-wide" }, "Creator Studio")
      )
      ), /*#__PURE__*/
      React.createElement("button", { onClick: () => setView('settings'), className: "w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-muted border border-white/5 hover:text-white transition-colors" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "Settings", size: 20 })
      )
      ), /*#__PURE__*/

      React.createElement(ViewWrapper, { onScroll: handleScroll }, /*#__PURE__*/
      React.createElement("div", { className: "space-y-4 px-1" }, /*#__PURE__*/
      React.createElement(DashboardCard, {
        icon: "Wallet",
        title: "Revenue",
        value: `₹${(profile.total_earnings || 0).toLocaleString()}`,
        subtext: `Last 30 days: +₹${earnings.lastMonth.toLocaleString()}`,
        color: "text-neon",
        onClick: () => setView('earnings'),
        isLocked: !isApproved,
        delay: "0ms" }
      ), /*#__PURE__*/

      React.createElement("div", { onClick: () => setView('rqs'), className: "glass-panel rounded-2xl p-5 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group animate-slide-in", style: { animationDelay: '100ms' } }, /*#__PURE__*/
      React.createElement("div", { className: "flex justify-between items-center mb-3" }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
      React.createElement("div", { className: "bg-brand-blue text-white px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest " }, "RQS"), /*#__PURE__*/
      React.createElement("span", { className: "text-sm font-medium text-muted group-hover:text-white transition-colors" }, "Reputation")
      ), /*#__PURE__*/
      React.createElement(Icon, { icon: "ChevronRight", size: 16, className: "text-muted/30 group-hover:text-white transition-colors" })
      ), /*#__PURE__*/
      React.createElement("div", { className: "pl-1" }, /*#__PURE__*/
      React.createElement("h3", { className: "font-heading font-bold text-4xl text-white tracking-tight mb-1" }, profile.rqs, " ", /*#__PURE__*/React.createElement("span", { className: "text-base font-normal text-muted" }, "/ 100")), /*#__PURE__*/
      React.createElement("p", { className: "text-[11px] text-muted font-bold uppercase tracking-wide" }, "REPUTED REVIEWER")
      )
      ), /*#__PURE__*/

      React.createElement("div", { onClick: () => setView('monetization'), className: "glass-panel rounded-2xl p-5 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group animate-slide-in", style: { animationDelay: '200ms' } }, /*#__PURE__*/
      React.createElement("div", { className: "flex justify-between items-center mb-4" }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
      React.createElement("div", { className: "p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:border-neon/30 transition-colors" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "Zap", size: 20, className: "text-neon" })
      ), /*#__PURE__*/
      React.createElement("span", { className: "text-sm font-medium text-muted group-hover:text-white transition-colors" }, "Partner Program")
      ), /*#__PURE__*/
      React.createElement("span", { className: `text-[10px] font-bold px-2.5 py-1 rounded border tracking-widest ${isApproved ? 'bg-accent-green/20 text-accent-green border-accent-green/20' :
        status === 'pending' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' :
        status === 'applied' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' :
        'bg-transparent text-white border-white/30'}` },

      isApproved ? 'APPROVED' :
      status === 'pending' ? 'RECEIVED' :
      status === 'applied' ? 'SENT' :
      getStatusTag(totalMonetizationProgress).toUpperCase()
      )
      ), /*#__PURE__*/
      React.createElement("div", { className: "h-1.5 w-full bg-white/10 rounded-full relative mt-2" }, /*#__PURE__*/
      React.createElement("div", { className: `h-full rounded-full relative transition-all duration-1000 ease-out bg-neon shadow-[0_0_15px_var(--neon)]`, style: { width: `${isApproved ? 100 : totalMonetizationProgress}%` } }, /*#__PURE__*/
      React.createElement("div", { className: "glow-tip" })
      )
      ), /*#__PURE__*/
      React.createElement("p", { className: "text-[11px] text-muted mt-3 font-medium" }, "Active Progression: ", isApproved ? '100%' : `${totalMonetizationProgress}%`)
      ), /*#__PURE__*/

      React.createElement(DashboardCard, {
        icon: "BarChart2",
        title: "Insights",
        value: "View Analytics",
        subtext: "Coming Soon",
        color: "text-white",
        onClick: () => window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Analytics coming soon in post beta', icon: 'Clock' } })),
        delay: "300ms" }
      ), /*#__PURE__*/

      React.createElement("div", { className: "mt-8 animate-slide-in", style: { animationDelay: '350ms' } }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center justify-between mb-4 px-1" }, /*#__PURE__*/
      React.createElement("h3", { className: "text-xs font-bold text-white uppercase tracking-wider" }, "BRAND INTERACTIONS"), /*#__PURE__*/
      React.createElement("button", { onClick: () => setView('brands'), className: "text-[10px] text-neon flex items-center gap-1 hover:text-white transition-colors" }, "View All ", /*#__PURE__*/React.createElement(Icon, { icon: "ChevronRight", size: 10 }))
      ), /*#__PURE__*/
      React.createElement("div", { className: "flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x" },
      brandInteractions.length === 0 ? /*#__PURE__*/
      React.createElement("div", { className: "text-[10px] text-muted p-2" }, "No brand interactions yet") :
      brandInteractions.slice(0, 5).map((b, i) => {
        const bName = b.seen_by_brand || b.brand_name || "Brand";
        return (/*#__PURE__*/
          React.createElement("div", { key: i, className: "snap-start shrink-0 glass-panel rounded-xl p-3 min-w-[100px] active:bg-white/5 transition-colors" }, /*#__PURE__*/
          React.createElement("div", { className: "w-8 h-8 rounded bg-white flex items-center justify-center mb-2 shadow-sm overflow-hidden p-1" },
          BRAND_LOGOS[bName] ? /*#__PURE__*/
          React.createElement("img", {
            src: BRAND_LOGOS[bName],
            className: "w-full h-full object-contain",
            onError: (e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            } }
          ) :
          null, /*#__PURE__*/
          React.createElement("div", { className: `w-full h-full flex items-center justify-center font-bold text-xs bg-white text-[#000000] ${BRAND_LOGOS[bName] ? 'hidden' : ''}` },
          bName[0].toUpperCase()
          )
          ), /*#__PURE__*/
          React.createElement("h4", { className: "text-[11px] font-bold text-white mb-1 truncate" }, bName)
          ));

      })
      )
      ), /*#__PURE__*/

      React.createElement("div", { className: "mt-2 mb-8 pt-6 border-t border-white/5 animate-slide-in", style: { animationDelay: '400ms' } }, /*#__PURE__*/
      React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /*#__PURE__*/
      React.createElement("button", { onClick: () => setView('security'), className: "glass-panel p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors active:scale-95" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "Shield", size: 20, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", { className: "text-xs font-bold text-muted" }, "Security")
      ), /*#__PURE__*/
      React.createElement("button", { onClick: () => setView('support'), className: "glass-panel p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors active:scale-95" }, /*#__PURE__*/
      React.createElement(Icon, { icon: "Help", size: 20, className: "text-muted" }), /*#__PURE__*/
      React.createElement("span", { className: "text-xs font-bold text-muted" }, "Support")
      )
      )
      )
      )
      )
      ));

  };

  const NavItem = ({ icon, label, isActive, onClick, isMySpace, badge }) => /*#__PURE__*/
  React.createElement("button", {
    onClick: (e) => {
      e.stopPropagation();
      if (typeof vibrate === 'function') vibrate(5);
      if (isMySpace) {
        checkMySpaceRedirect();
      } else {
        if (onClick) onClick();
      }
    },
    className: `relative group flex flex-col items-center justify-center w-14 h-14 ${isActive ? '' : ''}` }, /*#__PURE__*/

  React.createElement("div", { className: `relative ${isMySpace ? 'myspace-trigger' : ''} p-1.5 rounded-xl ${isActive ? 'bg-white/5' : ''}` }, /*#__PURE__*/
  React.createElement(Icon, { icon: icon, size: 24, className: `${isActive ? 'text-white glow-white stroke-[2.5px]' : 'text-muted group-hover:text-white stroke-[1.5px]'}` }),


  badge > 0 && /*#__PURE__*/
  React.createElement("div", { className: "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-blue-500 rounded-full border-2 border-[#000000] z-50 animate-pulse-subtle" }, /*#__PURE__*/
  React.createElement("span", { className: "absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" }), /*#__PURE__*/
  React.createElement("span", { className: "relative text-[10px] font-bold text-white px-1 leading-none" },
  badge > 99 ? '99+' : badge
  )
  )


  )
  );


  const BottomNav = ({ activeTab, setActiveTab, isVisible = true }) => {
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
      React.createElement("div", {
        id: "bottom-nav-bar", className: "nav-glass fixed bottom-0 left-0 w-full h-[65px] px-2 pb-2 flex justify-between items-center z-50",
        style: {
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        } }, /*#__PURE__*/

      React.createElement(NavItem, { icon: "Home", label: "Home", isActive: activeTab === 'home', onClick: () => goTo('HOMEPAGE_FINAL.HTML') }), /*#__PURE__*/
      React.createElement(NavItem, { icon: "Grid", label: "Categories", isActive: activeTab === 'categories', onClick: () => goTo('CATAGORYPAGE.HTML') }), /*#__PURE__*/
      React.createElement(NavItem, { icon: "MySpaceLogo", label: "My Space", isActive: activeTab === 'myspace', isMySpace: true }), /*#__PURE__*/
      React.createElement(NavItem, {
        icon: "Bell",
        label: "Notifications",
        isActive: activeTab === 'notifs',
        onClick: () => goTo('NOTIFICATION PANEL.HTML'),
        badge: unreadCount // Pass unread count
      }), /*#__PURE__*/
      React.createElement(NavItem, { icon: "User", label: "Profile", isActive: activeTab === 'profile', onClick: () => goTo('PRIVATE OWNER PROFILE.HTML') })
      ));

  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "flex-1 flex flex-col relative h-full" }, /*#__PURE__*/
    React.createElement("div", { className: "flex-1 overflow-hidden relative" },
    renderContent()
    ), /*#__PURE__*/

    React.createElement(BottomNav, {
      activeTab: activeTab,
      setActiveTab: setActiveTab,
      isVisible: navVisible }
    ),
    toast && /*#__PURE__*/React.createElement(Toast, _extends({}, toast, { onClose: () => setToast(null) })), /*#__PURE__*/
    React.createElement(ShareModal, { isOpen: isShareModalOpen, onClose: () => setIsShareModalOpen(false), post: sharePostData }), /*#__PURE__*/
    React.createElement(PartnerApplicationModal, {
      isOpen: isPartnerModalOpen,
      onClose: () => setIsPartnerModalOpen(false),
      onSubmit: handlePartnerSubmit }
    ), /*#__PURE__*/


    React.createElement(AuthModal, {
      isOpen: showAuthModal,
      onClose: () => setShowAuthModal(false),
      isClosable: !isGuest }
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