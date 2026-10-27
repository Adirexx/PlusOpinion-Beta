/**
 * MySpace.jsx — Creator Studio Dashboard (Phase 6.4)
 *
 * Ported from MY SPACE FINAL (USER).jsx. This is the user's personal
 * dashboard with sub-views for RQS, Earnings, Partner Program,
 * Brand Interactions, Security, and Support.
 *
 * Architecture:
 *   - Internal view routing via `view` state (no URL changes)
 *   - All API calls via src/lib/api/earnings.js
 *   - Supabase realtime for RQS updates
 *   - jsPDF lazy-loaded on demand
 *   - Cache-first via dataCache.js
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModalHistory } from '../hooks/useModalHistory';
import { supabase } from '../lib/supabaseClient';
import {
  getMyEarnings, getMyBrandInteractions, getPartnerStats,
  getPartnerStatus, getPartnerApplication, requestWithdrawal,
  submitPartnerApplication, uploadPartnerDocument
} from '../lib/api/earnings';
import { getCached, setCached, isStale } from '../lib/dataCache';
import Icon from '../components/ui/Icon';
import Avatar from '../components/ui/Avatar';
import CelebrationConfetti from '../components/CelebrationConfetti';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';

const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms || 5); };

// ── BRAND LOGOS MAP ─────────────────────────────────────────────────
const BRAND_LOGOS = {
  'OnePlus': 'https://cdn.simpleicons.org/oneplus',
  'Samsung': 'https://cdn.simpleicons.org/samsung',
  'Sony': 'https://cdn.simpleicons.org/sony',
  'Ola Electric': 'https://cdn.simpleicons.org/tesla',
  'Nike': 'https://cdn.simpleicons.org/nike',
  'Dyson': 'https://vectorlogo.zone/logos/dyson/dyson-icon.svg',
  'Apple': 'https://cdn.simpleicons.org/apple',
  'Tesla': 'https://cdn.simpleicons.org/tesla',
};

// ── PARTNER PROGRAM CONSTANTS ───────────────────────────────────────
const RQS_TARGET = 75;
const INTERACTIONS_TARGET = 500;
const STREAK_TARGET = 4;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── HELPER: Status tag from progress ────────────────────────────────
const getStatusTag = (progress) => {
  if (progress <= 50) return '(Setting up)';
  if (progress <= 90) return '(Emerging)';
  if (progress < 100) return '(So close)';
  return '(Eligible)';
};

// ══════════════════════════════════════════════════════════════════════
// LOCAL COMPONENTS
// ══════════════════════════════════════════════════════════════════════

const ViewWrapper = ({ children, onScroll, scrollRef, className = '', style }) => (
  <div
    ref={scrollRef}
    className={`view-content absolute inset-0 overflow-y-auto no-scrollbar pt-[75px] pb-28 px-4 ${className}`}
    onScroll={onScroll}
    style={style}
  >
    <div className="space-y-4">{children}</div>
  </div>
);

const SectionHeader = ({ title, onBack, rightElement, isVisible = true }) => (
  <div className={`header-glass fixed top-0 left-0 w-full z-50 transition-transform duration-400 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
    <div className="w-full h-14 flex items-center justify-between px-4 relative">
      <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors touch-scale z-10 relative" aria-label="Back">
        <Icon icon="ArrowLeft" size={18} className="text-white" />
      </button>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <span className="font-heading font-bold text-sm tracking-widest text-white uppercase">{title}</span>
      </div>
      {rightElement ? <div className="z-10 relative">{rightElement}</div> : <div className="w-8" />}
    </div>
  </div>
);

const DashboardCard = ({ icon, title, value, subtext, onClick, color = 'text-white', delay = '0s', isLocked }) => (
  <div
    onClick={isLocked
      ? () => window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Required progression not reached', icon: 'Lock' } }))
      : onClick
    }
    className={`glass-panel rounded-2xl p-5 relative overflow-hidden touch-scale transition-all cursor-pointer group ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}
    style={{ animationDelay: delay }}
  >
    {isLocked && (
      <div className="absolute top-3 right-3 text-muted/40">
        <Icon icon="Lock" size={14} />
      </div>
    )}
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors ${isLocked ? '' : 'group-hover:border-neon/30'}`}>
          <Icon icon={icon} size={20} className={isLocked ? 'text-muted' : color} />
        </div>
        <span className="text-sm font-medium text-muted group-hover:text-white transition-colors">{title}</span>
      </div>
      {!isLocked && <Icon icon="ChevronRight" size={16} className="text-muted/30 group-hover:text-white transition-colors" />}
    </div>
    <div className="pl-1">
      <h3 className={`font-heading font-bold text-2xl tracking-tight mb-1 transition-transform origin-left ${isLocked ? 'text-muted' : 'text-white group-hover:scale-105'}`}>
        {isLocked ? 'Locked' : value}
      </h3>
      <p className="text-[11px] text-muted font-medium">{subtext}</p>
    </div>
  </div>
);

// ── WITHDRAWAL MODAL ────────────────────────────────────────────────
const WithdrawalModal = ({ isOpen, onClose, balance, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-[320px] bg-[#000000] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-heading font-bold text-white">Withdraw Funds</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted hover:text-white touch-scale transition-all">
            <Icon icon="X" size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 block">Amount (₹100 - ₹3,000)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-neon/50 outline-none transition-colors"
                placeholder="0.00"
                min="100"
                max="3000"
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-[10px] text-muted">Available: ₹{balance.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1.5 block">Payout method</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'UPI', value: 'upi' }, { label: 'Bank Transfer', value: 'bank' }].map(m => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all touch-scale ${method === m.value ? 'bg-neon/10 border-neon text-neon' : 'bg-white/5 border-transparent text-muted hover:border-white/10'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-muted/70 mt-2">Payment details from your Partner Application will be used</p>
          </div>

          <button
            onClick={handleRequest}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon to-blue-500 text-white font-bold text-sm shadow-lg shadow-neon/20 touch-scale transition-all disabled:opacity-50 mt-2"
          >
            {isProcessing ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── PARTNER APPLICATION MODAL ───────────────────────────────────────
const PartnerApplicationModal = ({ isOpen, onClose, onSubmit, initialData }) => {
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
    upi_id: '',
  });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setFormData({
        legal_name: initialData?.legal_name || '',
        permanent_email: initialData?.permanent_email || '',
        id_number: initialData?.id_number || '',
        bank_account_no: initialData?.bank_account_no || '',
        bank_ifsc: initialData?.bank_ifsc || '',
        bank_holder_name: initialData?.bank_holder_name || '',
        upi_id: initialData?.upi_id || '',
      });
      setStep(1);
      setSelectedFile(null);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      let id_document_url = initialData?.id_document_url || 'none';

      if (selectedFile) {
        id_document_url = await uploadPartnerDocument(selectedFile);
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
        return (
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm mb-4">Step 1: General Information</h4>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">Legal Full Name</label>
              <input type="text" value={formData.legal_name} onChange={e => updateField('legal_name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                placeholder="As per Government ID" />
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">Permanent Email</label>
              <input type="email" value={formData.permanent_email} onChange={e => updateField('permanent_email', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                placeholder="example@email.com" />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3.5 bg-neon rounded-xl text-white font-bold text-sm mt-4 touch-scale transition-transform">
              Next Step
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm mb-4">Step 2: Identity Verification</h4>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">Government ID Number</label>
              <input type="text" value={formData.id_number} onChange={e => updateField('id_number', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                placeholder="PAN / Passport / Voter ID" />
            </div>
            <div
              className={`p-6 border-2 border-dashed rounded-2xl text-center bg-white/5 transition-colors cursor-pointer ${selectedFile ? 'border-neon/50' : 'border-white/10'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])} accept=".jpg,.jpeg,.png,.pdf" />
              <Icon icon="Shield" size={32} className={`${selectedFile ? 'text-neon' : 'text-muted'} mx-auto mb-3`} />
              <p className="text-[11px] text-muted">
                {selectedFile ? (
                  <span className="text-white font-bold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                ) : (initialData?.id_document_url && initialData.id_document_url !== 'none') ? (
                  <span className="text-accent-green font-bold">
                    ✓ Previous document on file<br />
                    <span className="text-[10px] text-muted font-normal">Click to upload a replacement photo/PDF</span>
                  </span>
                ) : (
                  <>Upload Photo of ID Document<br />(Max 5MB • JPG, PNG, PDF)</>
                )}
              </p>
              <button className="mt-4 px-6 py-2 bg-white/10 rounded-lg text-xs font-bold text-white pointer-events-none">
                {selectedFile ? 'Change File' : (initialData?.id_document_url && initialData.id_document_url !== 'none') ? 'Replace File' : 'Select File'}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3.5 bg-white/5 rounded-xl text-white font-bold text-sm touch-scale transition-transform">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3.5 bg-neon rounded-xl text-white font-bold text-sm touch-scale transition-transform">Next Step</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm mb-4">Step 3: Payout Details</h4>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">Bank Account Holder Name</label>
              <input type="text" value={formData.bank_holder_name} onChange={e => updateField('bank_holder_name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                placeholder="Full Name as per Bank" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">Account Number</label>
                <input type="text" value={formData.bank_account_no} onChange={e => updateField('bank_account_no', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                  placeholder="XXXX XXXX XXXX" />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">IFSC Code</label>
                <input type="text" value={formData.bank_ifsc} onChange={e => updateField('bank_ifsc', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                  placeholder="SBIN000XXXX" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase font-bold mb-1.5 block">UPI ID (Optional)</label>
              <input type="text" value={formData.upi_id} onChange={e => updateField('upi_id', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-neon/50"
                placeholder="username@upi" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 bg-white/5 rounded-xl text-white font-bold text-sm touch-scale transition-transform">Back</button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex-1 py-3.5 bg-accent-green text-black font-bold text-sm rounded-xl touch-scale transition-transform disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Complete Application'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#000000] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-heading font-bold text-white">Partner Application</h3>
            <p className="text-[10px] text-muted uppercase font-medium">Progress: {step}/3</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted hover:text-white transition-colors touch-scale">
            <Icon icon="X" size={18} />
          </button>
        </div>
        {renderStep()}
        <div className="h-1 w-full bg-white/5 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-neon transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// SUB-VIEWS
// ══════════════════════════════════════════════════════════════════════

// ── 1. EARNINGS VIEW ────────────────────────────────────────────────
const EarningsView = ({ onBack, onScroll, isHeaderVisible, earnings: rawEarnings, profile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(() => searchParams.get('modal') === 'withdraw');

  useModalHistory(isWithdrawOpen, () => {
    setIsWithdrawOpen(false);
    if (searchParams.get('modal') === 'withdraw') {
      setSearchParams(prev => { prev.delete('modal'); return prev; }, { replace: true });
    }
  });

  const openWithdrawModal = () => {
    vibrate(5);
    setIsWithdrawOpen(true);
  };

  const closeWithdrawModal = () => {
    setIsWithdrawOpen(false);
    if (searchParams.get('modal') === 'withdraw') {
      setSearchParams(prev => { prev.delete('modal'); return prev; }, { replace: true });
    }
  };

  const earnings = { total: 0, lastMonth: 0, logs: [], coupons: [], breakdown: [], ...rawEarnings };

  const handleWithdraw = async (amount, method) => {
    try {
      await requestWithdrawal(amount, method);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Withdrawal requested successfully!', icon: 'Check', isSuccess: true } }));
    } catch (error) {
      console.error(error);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: error.message || 'Failed to request withdrawal', icon: 'AlertTriangle' } }));
    }
  };

  const handleDownloadStatement = async () => {
    try {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Preparing statement...', icon: 'Clock' } }));
      const { generateStatement } = await import('../lib/generateStatement');
      await generateStatement(profile, earnings);
    } catch (err) {
      console.error('Statement generation failed:', err);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to generate statement', icon: 'AlertTriangle' } }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] relative">
      <SectionHeader title="Revenue Studio" onBack={onBack} isVisible={isHeaderVisible} />
      <ViewWrapper onScroll={onScroll}>
        {/* Revenue Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-1">Monthly Earning</p>
          <h1 className="font-heading text-4xl font-bold text-white mb-6">₹{earnings.total.toLocaleString('en-IN')}</h1>
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] text-muted uppercase">Last 30 Days</p>
              <p className="text-lg font-bold text-white">+₹{earnings.lastMonth}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase">RPM</p>
              <p className="text-lg font-bold text-white">₹145</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button onClick={handleDownloadStatement}
            className="flex-1 glass-panel py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/5 hover:border-neon/30 transition-all touch-scale">
            <div className="w-10 h-10 rounded-full bg-neon/10 flex items-center justify-center text-neon">
              <Icon icon="Download" size={20} />
            </div>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Download Statement</span>
          </button>
          <button onClick={openWithdrawModal}
            className="flex-1 bg-neon py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-neon/20 hover:bg-neon/90 transition-all touch-scale">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Icon icon="Wallet" size={20} />
            </div>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Request Payout</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider px-1">Recent Activity</h3>
          <div className="space-y-2">
            {earnings.logs.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No recent activity.</p>
            ) : earnings.logs.map(log => (
              <div key={log.id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/5 p-2.5 rounded-xl">
                    <Icon icon={log.icon || 'Clock'} size={16} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{log.label}</p>
                    <p className="text-[10px] text-muted font-medium">
                      {log.date} • <span className={log.status === 'Paid' ? 'text-accent-green' : 'text-accent-gold'}>{log.status}</span>
                    </p>
                  </div>
                </div>
                <span className="font-heading font-bold text-sm text-white">
                  {log.amount < 0 ? '-' : '+'}₹{Math.abs(log.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={openWithdrawModal}
          className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] touch-scale transition-transform">
          Withdraw Funds
        </button>
      </ViewWrapper>

      <WithdrawalModal isOpen={isWithdrawOpen} onClose={closeWithdrawModal}
        balance={earnings.total} onConfirm={handleWithdraw} />
    </div>
  );
};

// ── 2. RQS VIEW ─────────────────────────────────────────────────────
const RQSView = ({ onBack, onScroll, isHeaderVisible, profile }) => {
  const score = profile.rqs;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const targetOffset = circumference - ((score / 100) * circumference);
    const timer = setTimeout(() => setDashOffset(targetOffset), 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <SectionHeader title="Reputation Score" onBack={onBack} isVisible={isHeaderVisible} />
      <ViewWrapper onScroll={onScroll}>
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-full h-full rqs-svg">
              <circle cx="128" cy="128" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <circle
                className="progress-circle neon-filter"
                cx="128" cy="128" r={radius}
                stroke="var(--neon)" strokeWidth="8" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            {/* Benchmark marker at 75% (270deg) */}
            <div className="absolute inset-0 pointer-events-none" style={{ transform: 'rotate(270deg)' }}>
              <div className="absolute top-[38px] left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white/90 shadow-[0_0_8px_white]" />
            </div>
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 text-[9px] text-white/90 font-medium bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
              Eligibility (75)
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-muted uppercase tracking-widest mb-1">Score</span>
              <span className="font-heading text-6xl font-bold text-white tracking-tighter">{score}</span>
              <div className="mt-2 bg-neon/10 px-3 py-1 rounded-full border border-neon/20">
                <span className="text-[10px] font-bold text-neon uppercase tracking-wide">Reputed Reviewer</span>
              </div>
            </div>
          </div>

          {/* Score Components */}
          <div className="w-full space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-2">Score Components</h3>
            {[
              { icon: 'Check', label: 'Consistency', desc: 'Posts & Comments Given', value: `${profile.rqs_consistency}/20`, color: 'text-white' },
              { icon: 'Shield', label: 'Verification', desc: 'Verified Product Reviews', value: `${profile.rqs_verification}/40`, color: 'text-neon' },
              { icon: 'Star', label: 'Impact', desc: 'Agrees & Comments Rec.', value: `${profile.rqs_impact}/30`, color: 'text-white' },
              { icon: 'User', label: 'Legacy', desc: 'Account Age & Profile', value: `${profile.rqs_legacy_score || 0}/10`, color: 'text-white' },
            ].map((item) => (
              <div key={item.label} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon icon={item.icon} size={18} className={item.color} />
                  <div>
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-heading font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </ViewWrapper>
    </div>
  );
};

// ── 3. MONETIZATION / PARTNER PROGRAM VIEW ──────────────────────────
const MonetizationView = ({
  onBack,
  onScroll,
  isHeaderVisible,
  profile,
  partnerStats,
  status,
  rejectionReason,
  openPartnerModal,
  onRevenueClick,
  onContactSupport,
  onTriggerCelebration
}) => {
  const rqsProgress = Math.min((profile.rqs / RQS_TARGET) * 100, 100);
  const intProgress = Math.min((partnerStats.interactionCount / INTERACTIONS_TARGET) * 100, 100);
  const streakProgress = Math.min((partnerStats.streakWeeks / STREAK_TARGET) * 100, 100);
  const totalProgress = Math.round((rqsProgress + intProgress + streakProgress) / 3);
  const isEligible = profile.rqs >= RQS_TARGET && partnerStats.interactionCount >= INTERACTIONS_TARGET && partnerStats.streakWeeks >= STREAK_TARGET;
  const statusTag = getStatusTag(totalProgress);

  const applyButton = (totalProgress === 100 && (status === 'none' || status === 'rejected')) ? (
    <button onClick={openPartnerModal}
      className="bg-brand-blue text-white text-[10px] font-black px-4 py-2 rounded-full shadow-[0_0_15px_rgba(47,139,255,0.4)] touch-scale transition-all">
      {status === 'rejected' ? 'REAPPLY' : 'APPLY'}
    </button>
  ) : null;

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <SectionHeader title="Partner Program" onBack={onBack} rightElement={applyButton} isVisible={isHeaderVisible} />
      <ViewWrapper onScroll={onScroll}>
        {/* Status Header */}
        <div className="relative pt-4 pb-8 text-center">
          <div className="inline-block relative">
            <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all ${
              status === 'approved' ? 'border-accent-green bg-accent-green/5 shadow-[0_0_30px_rgba(0,230,118,0.25)]' :
              status === 'rejected' ? 'border-red-500/40 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.25)]' :
              (isEligible || status === 'approved') ? 'border-neon bg-neon/5 shadow-[0_0_30px_rgba(47,139,255,0.2)]' :
              'border-white/10 bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.03)]'
            }`}>
              <Icon
                icon={status === 'approved' ? 'CheckCircle' : status === 'rejected' ? 'AlertTriangle' : 'Zap'}
                size={32}
                className={
                  status === 'approved' ? 'text-accent-green' :
                  status === 'rejected' ? 'text-red-400' :
                  isEligible ? 'text-neon' :
                  'text-muted'
                }
              />
            </div>
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-3 py-1 rounded-full shadow-lg border whitespace-nowrap transition-all ${
              status === 'approved' ? 'bg-accent-green text-black border-accent-green shadow-[0_0_15px_rgba(0,230,118,0.4)]' :
              status === 'pending' ? 'bg-amber-500 text-black border-amber-400' :
              status === 'applied' ? 'bg-blue-500 text-white border-blue-400' :
              status === 'rejected' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
              isEligible ? 'bg-neon text-white border-white/20' :
              'bg-black text-muted border-white/10'
            }`}>
              {status === 'approved' ? 'APPROVED' :
               status === 'pending' ? 'APPLICATION RECEIVED' :
               status === 'applied' ? 'APPLICATION SENT' :
               status === 'rejected' ? 'APPLICATION REJECTED' :
               status === 'none' ? statusTag.toUpperCase() : 'UNDER REVIEW'}
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold text-white mt-4">
            {status === 'approved' ? 'Partner Active' :
             status === 'pending' ? 'Application Received' :
             status === 'applied' ? 'Application Sent' :
             status === 'rejected' ? 'Application Rejected' :
             isEligible ? 'Eligible to Apply' : 'Partner Program'}
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
            {status === 'approved' ? 'Your monetization is now active.' :
             status === 'pending' ? 'We are reviewing your profile.' :
             status === 'applied' ? 'Your request has been sent to admin.' :
             status === 'rejected' ? 'Please review the reason below and rectify your application.' :
             isEligible ? 'You have met all criteria!' : 'Progression active. Your actions count.'}
          </p>

          {totalProgress === 100 && status === 'none' && (
            <button onClick={openPartnerModal}
              className="mt-6 px-10 py-3.5 bg-neon text-white font-bold rounded-xl shadow-[0_0_20px_rgba(47,139,255,0.4)] touch-scale transition-transform text-sm">
              Apply for Partner Program
            </button>
          )}

          {status === 'approved' && onTriggerCelebration && (
            <div className="mt-4 flex justify-center">
              <button onClick={onTriggerCelebration}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neon/10 border border-neon/30 text-[10px] font-bold text-neon hover:bg-neon/20 transition-all touch-scale shadow-[0_0_15px_rgba(47,139,255,0.2)]">
                <span>🎉</span> Celebrate Approval
              </button>
            </div>
          )}
        </div>

        {/* Pending Card */}
        {status === 'pending' && (
          <div className="mb-6">
            <div className="glass-panel p-6 rounded-2xl border-neon/20 bg-neon/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Icon icon="Shield" size={64} /></div>
              <h3 className="text-white font-heading font-bold text-lg mb-2">Review in Progress</h3>
              <p className="text-xs text-muted leading-relaxed mb-4">
                "Thank you for your application. Our team is currently verifying your identity and bank details to ensure a secure partnership. You will be notified once the review is complete."
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                <div>
                  <p className="text-[10px] font-bold text-white">Aditya Kumar</p>
                  <p className="text-[8px] text-muted">Founder, PlusOpinion</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approved Card */}
        {status === 'approved' && (
          <div className="mb-6">
            <div className="glass-panel p-6 rounded-2xl border-neon/20 bg-neon/5 relative overflow-hidden shadow-[0_0_40px_rgba(47,139,255,0.05)]">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-neon"><Icon icon="CheckCircle" size={64} /></div>
              <h3 className="text-white font-heading font-bold text-lg mb-2">Welcome to the Program</h3>
              <p className="text-xs text-muted leading-relaxed mb-4">
                "Congratulations! Your application has been approved. We are excited to have you as a verified partner. Your contributions are now part of our official creator economy, and your earnings and professional dashboard are fully activated."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon/20 flex items-center justify-center text-[10px] font-bold text-neon border border-neon/20 shadow-inner">AK</div>
                <div>
                  <p className="text-[10px] font-bold text-white">Aditya Kumar</p>
                  <p className="text-[8px] text-muted">Founder, PlusOpinion</p>
                </div>
              </div>
              <button onClick={onRevenueClick}
                className="w-full mt-6 py-3 bg-neon text-white text-xs font-black rounded-xl hover:shadow-[0_0_20px_rgba(47,139,255,0.3)] transition-all flex items-center justify-center gap-2 touch-scale">
                <Icon icon="Wallet" size={14} /> OPEN REVENUE STUDIO
              </button>
            </div>
          </div>
        )}

        {/* Rejected Card — Styled in identical executive caliber as the Approved/Pending Cards */}
        {status === 'rejected' && (
          <div className="mb-6">
            <div className="glass-panel p-6 rounded-2xl border-red-500/25 bg-red-500/5 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.08)]">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500">
                <Icon icon="AlertTriangle" size={64} />
              </div>

              {/* Status Header Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                  APPLICATION NOT APPROVED
                </span>
              </div>

              <h3 className="text-white font-heading font-bold text-lg mb-2">
                Application Decision
              </h3>

              <p className="text-xs text-muted leading-relaxed mb-4">
                "Thank you for your interest in the PlusOpinion Partner Program. Following a comprehensive review of your submitted credentials, our verification team was unable to approve your application at this time."
              </p>

              {/* Specific Reason Box from Database */}
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 mb-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-red-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                  <Icon icon="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
                  <span>Reason for Rejection</span>
                </div>
                <p className="text-xs text-white/95 font-medium leading-relaxed pl-5">
                  {rejectionReason || 'Submitted identity documentation or bank credentials could not be verified. Please ensure your legal name matches your government ID and bank account details exactly.'}
                </p>
              </div>

              {/* Founder Signature Badge */}
              <div className="flex items-center gap-3 pb-5 border-b border-white/5">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-400 border border-red-500/30 shadow-inner">
                  AK
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white">Aditya Kumar</p>
                  <p className="text-[8px] text-muted">Founder, PlusOpinion</p>
                </div>
              </div>

              {/* Action Toggles */}
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={openPartnerModal}
                  className="w-full py-3.5 bg-neon text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(47,139,255,0.35)] transition-all flex items-center justify-center gap-2 touch-scale"
                >
                  <Icon icon="Edit3" size={15} />
                  RECTIFY & REAPPLY APPLICATION
                </button>

                <button
                  onClick={onContactSupport}
                  className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 touch-scale"
                >
                  <Icon icon="HelpCircle" size={15} className="text-muted" />
                  REACH OUT TO PARTNER SUPPORT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex justify-between text-xs font-bold mb-3">
            <span className="text-white">Eligibility Progress</span>
            <span className="text-neon">{totalProgress}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full relative">
            <div className="h-full bg-neon rounded-full relative shadow-[0_0_15px_var(--neon)] transition-all duration-1000" style={{ width: `${totalProgress}%` }}>
              <div className="glow-tip" />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-4 mt-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Requirements</h3>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${profile.rqs >= RQS_TARGET ? 'bg-neon/10 border-neon/30' : 'bg-white/5 border-white/10'}`}>
                <Icon icon={profile.rqs >= RQS_TARGET ? 'Check' : 'Activity'} size={14} className={profile.rqs >= RQS_TARGET ? 'text-neon' : 'text-muted'} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Reputation Score</p>
                <p className="text-[10px] text-muted">Must be ≥ {RQS_TARGET}</p>
              </div>
            </div>
            <span className={`text-xs font-bold ${profile.rqs >= RQS_TARGET ? 'text-neon' : 'text-white'}`}>{profile.rqs}</span>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${partnerStats.interactionCount >= INTERACTIONS_TARGET ? 'bg-neon/10 border-neon/30' : 'bg-white/5 border-white/10'}`}>
                <span className={`text-xs font-bold ${partnerStats.interactionCount >= INTERACTIONS_TARGET ? 'text-neon' : 'text-white'}`}>2</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Community Interactions</p>
                <p className="text-[10px] text-muted">Likes, comments, shares</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white">{partnerStats.interactionCount} / {INTERACTIONS_TARGET}</span>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${partnerStats.streakWeeks >= STREAK_TARGET ? 'bg-neon/10 border-neon/30' : 'bg-white/5 border-white/10'}`}>
                <span className={`text-xs font-bold ${partnerStats.streakWeeks >= STREAK_TARGET ? 'text-neon' : 'text-white'}`}>4</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Active Streak</p>
                <p className="text-[10px] text-muted">Consecutive weeks</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white">{partnerStats.streakWeeks} / {STREAK_TARGET}</span>
          </div>
        </div>
      </ViewWrapper>
    </div>
  );
};


// ── 5. BRAND INTERACTIONS VIEW ──────────────────────────────────────
const BrandInteractionView = ({ onBack, onScroll, isHeaderVisible, posts = [] }) => {
  const brands = posts;

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <SectionHeader title="Brand Interactions" onBack={onBack} isVisible={isHeaderVisible} />
      <ViewWrapper onScroll={onScroll}>
        <p className="text-xs text-muted/60 mb-6 px-2 leading-relaxed">
          Official acknowledgments from brands. Verified interactions boost your partner status.
        </p>
        <div className="space-y-3">
          {brands.length === 0 ? (
            <div className="text-center text-muted/50 py-10 font-heading tracking-widest">NO INTERACTIONS YET</div>
          ) : brands.map((item, i) => {
            const brandName = item.seen_by_brand || item.brand_name || 'Brand';
            return (
              <div key={item.id || i} className="glass-panel p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-sm shrink-0">
                    {BRAND_LOGOS[brandName] ? (
                      <img src={BRAND_LOGOS[brandName]} alt={brandName}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-white to-gray-100 text-[#000000] ${BRAND_LOGOS[brandName] ? 'hidden' : ''}`}>
                      {brandName ? brandName[0].toUpperCase() : 'B'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-neon/80 font-bold tracking-wider bg-neon/5 px-2 py-1 rounded border border-neon/10 cursor-default flex items-center gap-2 uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]" />
                      Seen by {brandName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted/50 font-medium">
                  <Icon icon="Clock" size={10} />
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ViewWrapper>
    </div>
  );
};

// ── 6. SECURITY VIEW ────────────────────────────────────────────────
const SecurityView = ({ onBack, onScroll, isHeaderVisible }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <SectionHeader title="Security Center" onBack={onBack} isVisible={isHeaderVisible} />
      <ViewWrapper onScroll={onScroll}>
        <div className="glass-panel p-6 rounded-2xl text-center mb-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Icon icon="Shield" size={28} className="text-white" />
          </div>
          <h2 className="font-heading text-xl font-bold text-white">Protected</h2>
          <p className="text-xs text-muted mt-2">Account status: Secure</p>
        </div>
        <div className="space-y-2">
          <button onClick={() => navigate('/change-password')}
            className="w-full glass-panel p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors group touch-scale">
            <span className="text-sm text-white font-medium group-hover:text-neon transition-colors">Password Manager</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted">Change</span>
              <Icon icon="ChevronRight" size={14} className="text-muted" />
            </div>
          </button>
          <div className="glass-panel p-4 rounded-xl flex justify-between items-center">
            <span className="text-sm text-white font-medium">Login Activity</span>
            <span className="text-[10px] text-muted">Current Device</span>
          </div>
        </div>
      </ViewWrapper>
    </div>
  );
};

// ── 7. SUPPORT VIEW ─────────────────────────────────────────────────
const SupportView = ({ onBack, onScroll, isHeaderVisible }) => (
  <div className="flex flex-col h-full bg-[#000000]">
    <SectionHeader title="Help & Support" onBack={onBack} isVisible={isHeaderVisible} />
    <ViewWrapper onScroll={onScroll}>
      <div className="space-y-3">
        <a href="mailto:support@plusopinion.com?subject=Partner%20Program%20Inquiry"
          className="w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-neon/30 transition-all touch-scale text-left group block border-neon/20 bg-neon/5">
          <div className="p-2 rounded-lg bg-neon/10 group-hover:bg-neon/20 transition-colors">
            <Icon icon="Zap" size={20} className="text-neon" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white group-hover:text-neon transition-colors">Partner Program Support</h4>
            <p className="text-[10px] text-muted">Application review, verification & appeals</p>
          </div>
          <Icon icon="ChevronRight" size={16} className="text-muted/50 group-hover:text-neon transition-colors" />
        </a>

        <a href="mailto:support@plusopinion.com?subject=Withdrawal Inquiry"
          className="w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-neon/30 transition-all touch-scale text-left group block">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-neon/10 transition-colors">
            <Icon icon="Wallet" size={20} className="text-white group-hover:text-neon" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white group-hover:text-neon transition-colors">Withdrawals</h4>
            <p className="text-[10px] text-muted">Payment status & help</p>
          </div>
          <Icon icon="ChevronRight" size={16} className="text-muted/50 group-hover:text-neon transition-colors" />
        </a>

        <a href="mailto:support@plusopinion.com?subject=Ticket History Request"
          className="w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-neon/30 transition-all touch-scale text-left group block">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-neon/10 transition-colors">
            <Icon icon="Mail" size={20} className="text-white group-hover:text-neon" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white group-hover:text-neon transition-colors">Ticket History</h4>
            <p className="text-[10px] text-muted">View past inquiries</p>
          </div>
          <Icon icon="ChevronRight" size={16} className="text-muted/50 group-hover:text-neon transition-colors" />
        </a>

        <a href="https://wa.me/918700591393" target="_blank" rel="noopener noreferrer"
          className="w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-accent-green/30 transition-all touch-scale text-left group block">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-accent-green/10 transition-colors">
            <Icon icon="Activity" size={20} className="text-white group-hover:text-accent-green" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white group-hover:text-accent-green transition-colors">Live Chat</h4>
            <p className="text-[10px] text-accent-green">Agents Online</p>
          </div>
          <Icon icon="ChevronRight" size={16} className="text-muted/50 group-hover:text-accent-green transition-colors" />
        </a>

        <a href="mailto:founder@plusopinion.com?subject=Critical Issue Report"
          className="w-full glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-danger/30 transition-all touch-scale text-left group mt-4 border-danger/10 block">
          <div className="p-2 rounded-lg bg-danger/5 group-hover:bg-danger/10 transition-colors">
            <Icon icon="Shield" size={20} className="text-danger" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white group-hover:text-danger transition-colors">Report Issue</h4>
            <p className="text-[10px] text-muted">Escalate critical bugs</p>
          </div>
          <Icon icon="ChevronRight" size={16} className="text-muted/50 group-hover:text-danger transition-colors" />
        </a>
      </div>
    </ViewWrapper>
  </div>
);

// ── 8. MY SPACE SKELETON (Faded ambient background placeholder) ──
const MySpaceSkeleton = ({ view = 'dashboard' }) => {
  const wrapperClass = "flex flex-col h-full bg-[#000000] overflow-hidden relative opacity-40 pointer-events-none select-none";

  if (view === 'monetization') {
    return (
      <div className={wrapperClass}>
        <div className="header-glass fixed top-0 left-0 w-full flex items-center justify-between px-4 h-14 z-50">
          <div className="w-8 h-8 rounded-full skeleton-bg" />
          <div className="w-32 h-3.5 rounded-full skeleton-bg" />
          <div className="w-8" />
        </div>
        <div className="view-content absolute inset-0 overflow-y-auto no-scrollbar pt-[75px] pb-28 px-4">
          <div className="space-y-4">
            <div className="pt-6 pb-4 text-center space-y-3">
              <div className="w-16 h-16 rounded-full skeleton-bg mx-auto" />
              <div className="w-36 h-4 rounded-full skeleton-bg mx-auto mt-2" />
              <div className="w-48 h-2 rounded-full skeleton-bg mx-auto" />
            </div>
            <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03] space-y-3">
              <div className="w-28 h-3 rounded-full skeleton-bg" />
              <div className="h-1.5 w-full rounded-full skeleton-bg" />
            </div>
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.03] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full skeleton-bg shrink-0" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-3 rounded-full skeleton-bg" />
                      <div className="w-20 h-2 rounded-full skeleton-bg" />
                    </div>
                  </div>
                  <div className="w-10 h-3 rounded-full skeleton-bg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'earnings') {
    return (
      <div className={wrapperClass}>
        <div className="header-glass fixed top-0 left-0 w-full flex items-center justify-between px-4 h-14 z-50">
          <div className="w-8 h-8 rounded-full skeleton-bg" />
          <div className="w-24 h-3.5 rounded-full skeleton-bg" />
          <div className="w-8" />
        </div>
        <div className="view-content absolute inset-0 overflow-y-auto no-scrollbar pt-[75px] pb-28 px-4">
          <div className="space-y-4">
            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.03] space-y-4">
              <div className="w-20 h-2.5 rounded-full skeleton-bg" />
              <div className="w-36 h-7 rounded-lg skeleton-bg" />
              <div className="w-full h-9 rounded-xl skeleton-bg mt-2" />
            </div>
            <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03] space-y-3">
              <div className="w-32 h-3 rounded-full skeleton-bg" />
              <div className="h-2 w-full rounded-full skeleton-bg" />
            </div>
            <div className="space-y-2.5 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.03] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full skeleton-bg shrink-0" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-3 rounded-full skeleton-bg" />
                      <div className="w-16 h-2 rounded-full skeleton-bg" />
                    </div>
                  </div>
                  <div className="w-12 h-3 rounded-full skeleton-bg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'rqs') {
    return (
      <div className={wrapperClass}>
        <div className="header-glass fixed top-0 left-0 w-full flex items-center justify-between px-4 h-14 z-50">
          <div className="w-8 h-8 rounded-full skeleton-bg" />
          <div className="w-28 h-3.5 rounded-full skeleton-bg" />
          <div className="w-8" />
        </div>
        <div className="view-content absolute inset-0 overflow-y-auto no-scrollbar pt-[75px] pb-28 px-4">
          <div className="space-y-4">
            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.03] flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-24 h-24 rounded-full skeleton-bg" />
              <div className="w-36 h-3.5 rounded-full skeleton-bg" />
              <div className="w-48 h-2 rounded-full skeleton-bg" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.03] space-y-2">
                  <div className="w-24 h-3 rounded-full skeleton-bg" />
                  <div className="h-1.5 w-full rounded-full skeleton-bg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Dashboard View Skeleton
  return (
    <div className={wrapperClass}>
      {/* Header Skeleton */}
      <div className="header-glass fixed top-0 left-0 w-full px-4 flex items-center justify-between h-14 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full skeleton-bg shrink-0" />
          <div className="space-y-1.5">
            <div className="w-24 h-3 rounded-full skeleton-bg" />
            <div className="w-16 h-2 rounded-full skeleton-bg" />
          </div>
        </div>
        <div className="w-7 h-7 rounded-full skeleton-bg" />
      </div>

      {/* Content Skeleton */}
      <div className="view-content absolute inset-0 overflow-y-auto no-scrollbar pt-[75px] pb-28 px-4">
        <div className="space-y-3 px-1">
          {/* Revenue Card Skeleton */}
          <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03] relative overflow-hidden space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg skeleton-bg shrink-0" />
              <div className="w-20 h-2.5 rounded-full skeleton-bg" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="w-32 h-6 rounded-lg skeleton-bg" />
              <div className="w-40 h-2 rounded-full skeleton-bg" />
            </div>
          </div>

          {/* RQS Card Skeleton */}
          <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03] relative overflow-hidden space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-3.5 rounded-md skeleton-bg" />
              <div className="w-24 h-2.5 rounded-full skeleton-bg" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="w-24 h-6 rounded-lg skeleton-bg" />
              <div className="w-44 h-2 rounded-full skeleton-bg" />
            </div>
            <div className="pt-2">
              <div className="h-1.5 w-full rounded-full skeleton-bg" />
            </div>
          </div>

          {/* Partner Program Card Skeleton */}
          <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03] relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg skeleton-bg shrink-0" />
                <div className="w-28 h-2.5 rounded-full skeleton-bg" />
              </div>
              <div className="w-12 h-3.5 rounded-full skeleton-bg" />
            </div>
            <div className="pt-1">
              <div className="h-1.5 w-full rounded-full skeleton-bg" />
            </div>
          </div>

          {/* Brand Interactions Card Skeleton */}
          <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.03] relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg skeleton-bg shrink-0" />
                <div className="w-32 h-2.5 rounded-full skeleton-bg" />
              </div>
              <div className="w-10 h-3.5 rounded-full skeleton-bg" />
            </div>
            <div className="h-5 w-2/3 rounded-lg skeleton-bg mt-1" />
          </div>

          {/* Quick Links Skeleton */}
          <div className="mt-2 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.03] flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full skeleton-bg" />
                <div className="w-12 h-2 rounded-full skeleton-bg" />
              </div>
              <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.03] flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full skeleton-bg" />
                <div className="w-12 h-2 rounded-full skeleton-bg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function MySpace() {
  const { user } = useAuth();

  // ── View routing ──
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'dashboard';

  const setView = useCallback((newView) => {
    if (newView === 'dashboard') {
      setSearchParams({}, { replace: false });
    } else {
      setSearchParams({ view: newView }, { replace: false });
    }
  }, [setSearchParams]);

  // ── Data state ──
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    id: '', name: 'Loading...', username: '', full_name: '',
    avatar_url: null, rqs: 0, rqs_consistency: 0,
    rqs_verification: 0, rqs_impact: 0, rqs_legacy_score: 0,
    total_earnings: 0, verified_count: 0,
  });
  const [partnerStats, setPartnerStats] = useState({
    interactionCount: 0, streakWeeks: 0, verifiedCount: 0, tier: 'None',
  });
  const [brandInteractions, setBrandInteractions] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, lastMonth: 0, logs: [], coupons: [], breakdown: [] });
  const [status, setStatus] = useState('loading');
  const [rejectionReason, setRejectionReason] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── Modals ──
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(() => searchParams.get('modal') === 'partner');
  useModalHistory(isPartnerModalOpen, () => {
    setIsPartnerModalOpen(false);
    if (searchParams.get('modal') === 'partner') {
      setSearchParams(prev => { prev.delete('modal'); return prev; }, { replace: true });
    }
  });

  const openPartnerModal = () => {
    vibrate(5);
    setIsPartnerModalOpen(true);
  };
  const closePartnerModal = () => {
    setIsPartnerModalOpen(false);
    if (searchParams.get('modal') === 'partner') {
      setSearchParams(prev => { prev.delete('modal'); return prev; }, { replace: true });
    }
  };

  // ── Scroll / Nav ──
  const [navVisible, setNavVisible] = useState(true);
  const lastY = useRef(0);

  // ── Infinite scroll for brands ──
  const [brandOffset, setBrandOffset] = useState(0);
  const [hasMoreBrands, setHasMoreBrands] = useState(true);
  const [isLoadingMoreBrands, setIsLoadingMoreBrands] = useState(false);

  // ── Route guard for insights/analytics (Toast alert instead of separate page) ──
  useEffect(() => {
    const currentView = searchParams.get('view');
    if (currentView === 'insights' || currentView === 'analytics') {
      setView('dashboard');
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Analytics feature coming soon in post beta', icon: 'Clock' } }));
    }
  }, [searchParams, setView]);

  // ── LOAD DATA (Cache-first + background refetch) ──
  const fetchDashboardData = useCallback(async (skipCache = false) => {
    if (!user?.id) return;
    const cacheKey = `myspace_${user.id}`;
    try {
      if (!skipCache) {
        const cached = getCached(cacheKey);
        if (cached) {
          setProfile(cached.profile);
          setPartnerStats(cached.partnerStats);
          setStatus(cached.status);
          if (cached.rejectionReason) setRejectionReason(cached.rejectionReason);
          if (cached.existingApplication) setExistingApplication(cached.existingApplication);
          setEarnings(cached.earnings);
          setBrandInteractions(cached.brandInteractions);
          setIsLoading(false);
          if (!isStale(cacheKey, CACHE_TTL)) return;
        }
      }

      const [
        { data: profileData },
        stats,
        pStatus,
        earningsData,
        interactions,
        partnerApp,
      ] = await Promise.all([
        supabase.from('profiles').select('*, rqs_legacy_score').eq('id', user.id).single(),
        getPartnerStats(),
        getPartnerStatus(),
        getMyEarnings(),
        getMyBrandInteractions(),
        getPartnerApplication(user.id),
      ]);

      const profileObj = profileData ? {
        id: user.id,
        name: profileData.full_name || 'User',
        full_name: profileData.full_name || 'User',
        username: profileData.username || '',
        avatar_url: profileData.avatar_url,
        rqs: profileData.rqs_score || 0,
        rqs_consistency: profileData.rqs_consistency_score || 0,
        rqs_verification: profileData.rqs_verification_score || 0,
        rqs_impact: profileData.rqs_impact_score || 0,
        rqs_legacy_score: profileData.rqs_legacy_score || 0,
        total_earnings: profileData.total_earnings || 0,
        verified_count: 0,
      } : {
        id: user.id,
        name: 'User',
        full_name: 'User',
        username: '',
        avatar_url: null,
        rqs: 0,
        rqs_consistency: 0,
        rqs_verification: 0,
        rqs_impact: 0,
        rqs_legacy_score: 0,
        total_earnings: 0,
        verified_count: 0,
      };

      const activeStatus = partnerApp?.status || pStatus || 'none';

      setProfile(profileObj);
      setPartnerStats(stats);
      setStatus(activeStatus);
      if (partnerApp?.rejection_reason) {
        setRejectionReason(partnerApp.rejection_reason);
      }
      if (partnerApp) {
        setExistingApplication(partnerApp);
      }
      setEarnings(earningsData);
      setBrandInteractions(interactions);

      setCached(cacheKey, {
        profile: profileObj, partnerStats: stats,
        status: activeStatus, rejectionReason: partnerApp?.rejection_reason || null,
        existingApplication: partnerApp || null, earnings: earningsData,
        brandInteractions: interactions,
      });
    } catch (error) {
      console.error('MySpace: Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handlePullRefresh = useCallback(async () => {
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  const dashboardScrollRef = useRef(null);
  const ptr = usePullToRefresh(dashboardScrollRef, handlePullRefresh, {
    disabled: view !== 'dashboard',
  });

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // ── REALTIME RQS & PARTNER APPLICATION SUBSCRIPTIONS ──
  useEffect(() => {
    if (!user?.id) return;

    // 1. Profile updates (RQS, tier, status)
    const profileChannel = supabase
      .channel(`myspace_profile_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        const newData = payload.new;
        setProfile(prev => ({
          ...prev,
          name: newData.full_name || prev.name,
          full_name: newData.full_name || prev.full_name,
          username: newData.username || prev.username,
          avatar_url: newData.avatar_url || prev.avatar_url,
          rqs: newData.rqs_score || 0,
          rqs_consistency: newData.rqs_consistency_score || 0,
          rqs_verification: newData.rqs_verification_score || 0,
          rqs_impact: newData.rqs_impact_score || 0,
          rqs_legacy_score: newData.rqs_legacy_score || 0,
        }));

        // Handle real-time partner application status changes on profiles
        if (newData.partner_application_status) {
          const newStatus = newData.partner_application_status;
          setStatus(prev => {
            if (prev !== newStatus) {
              if (newStatus === 'approved') {
                setShowCelebration(true);
                sessionStorage.setItem(`partner_celebrated_${user.id}`, 'true');
                window.dispatchEvent(new CustomEvent('toast', {
                  detail: { message: '🎉 Partner Application Approved! Welcome!', icon: 'CheckCircle', isSuccess: true }
                }));
              } else if (newStatus === 'rejected') {
                getPartnerApplication(user.id).then(app => {
                  if (app?.rejection_reason) setRejectionReason(app.rejection_reason);
                  if (app) setExistingApplication(app);
                });
                window.dispatchEvent(new CustomEvent('toast', {
                  detail: { message: 'Partner Application was reviewed. Please see update.', icon: 'AlertTriangle' }
                }));
              }
            }
            return newStatus;
          });
        }

        // Refresh partner stats on profile update
        getPartnerStats().then(stats => {
          setPartnerStats(prev => ({ ...prev, ...stats, tier: newData.partner_program_tier }));
        });
      })
      .subscribe();

    // 2. Partner applications table updates (status, rejection_reason, credentials)
    const partnerAppChannel = supabase
      .channel(`myspace_partner_app_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'partner_applications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const app = payload.new;
        if (!app) return;

        const newStatus = app.status;
        if (newStatus) {
          setStatus(prev => {
            if (prev !== newStatus) {
              if (newStatus === 'approved') {
                setShowCelebration(true);
                sessionStorage.setItem(`partner_celebrated_${user.id}`, 'true');
                window.dispatchEvent(new CustomEvent('toast', {
                  detail: { message: '🎉 Partner Application Approved! Welcome!', icon: 'CheckCircle', isSuccess: true }
                }));
              } else if (newStatus === 'rejected') {
                window.dispatchEvent(new CustomEvent('toast', {
                  detail: { message: 'Partner Application was reviewed. Please see update.', icon: 'AlertTriangle' }
                }));
              }
            }
            return newStatus;
          });

          setRejectionReason(app.rejection_reason || null);
          setExistingApplication(app);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(partnerAppChannel);
    };
  }, [user?.id]);

  // ── LOAD MORE BRANDS (infinite scroll) ──
  const loadMoreBrands = useCallback(async (currentOffset = 0) => {
    if (isLoadingMoreBrands) return;
    setIsLoadingMoreBrands(true);
    try {
      const interactions = await getMyBrandInteractions({ limit: 10, offset: currentOffset });
      setBrandInteractions(prev => [...prev, ...interactions]);
      setHasMoreBrands(interactions.length === 10);
      setBrandOffset(currentOffset + 10);
    } catch (e) {
      console.error('Failed to load more brand interactions:', e);
    } finally {
      setIsLoadingMoreBrands(false);
    }
  }, [isLoadingMoreBrands]);

  // ── PARTNER FORM SUBMIT ──
  const handlePartnerSubmit = useCallback(async (formData) => {
    try {
      await submitPartnerApplication(formData);
      setStatus('pending');
      setRejectionReason(null);
      setExistingApplication(prev => ({ ...prev, ...formData, status: 'pending', rejection_reason: null }));
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Application Submitted Successfully!', icon: 'Check', isSuccess: true }
      }));
    } catch (err) {
      console.error('Partner submission failed:', err);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Submission failed. Try again.', icon: 'AlertTriangle' }
      }));
    }
  }, []);

  // ── SCROLL HANDLER (Phase 6 standard: global nav broadcast) ──
  const handleScroll = useCallback((e) => {
    const el = e.currentTarget || e.target;
    const currentY = el.scrollTop;

    if (currentY <= 50) {
      setNavVisible(true);
      window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
    } else {
      const delta = currentY - lastY.current;
      if (Math.abs(delta) >= 6) {
        const visible = delta < 0;
        setNavVisible(visible);
        window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible } }));
      }
    }
    lastY.current = currentY;

    // Infinite scroll for brands view
    if (view === 'brands' && el.scrollHeight - currentY - el.clientHeight < 400) {
      if (!isLoadingMoreBrands && hasMoreBrands) {
        loadMoreBrands(brandOffset);
      }
    }
  }, [view, isLoadingMoreBrands, hasMoreBrands, brandOffset, loadMoreBrands]);

  // ── LOADING SKELETON ──
  if (isLoading) {
    return <MySpaceSkeleton view={view} />;
  }

  // ── VIEW ROUTER ──
  const renderView = () => {
    if (view === 'earnings') return <EarningsView onBack={() => setView('dashboard')} onScroll={handleScroll} isHeaderVisible={navVisible} earnings={earnings} profile={profile} />;
    if (view === 'rqs') return <RQSView onBack={() => setView('dashboard')} onScroll={handleScroll} isHeaderVisible={navVisible} profile={profile} />;
    if (view === 'monetization') return (
      <MonetizationView
        onBack={() => setView('dashboard')}
        onScroll={handleScroll}
        isHeaderVisible={navVisible}
        profile={profile}
        partnerStats={partnerStats}
        status={status}
        rejectionReason={rejectionReason}
        openPartnerModal={openPartnerModal}
        onRevenueClick={() => setView('earnings')}
        onContactSupport={() => setView('support')}
        onTriggerCelebration={() => setShowCelebration(true)}
      />
    );
    if (view === 'brands') return <BrandInteractionView onBack={() => setView('dashboard')} onScroll={handleScroll} isHeaderVisible={navVisible} posts={brandInteractions} />;
    if (view === 'security') return <SecurityView onBack={() => setView('dashboard')} onScroll={handleScroll} isHeaderVisible={navVisible} />;
    if (view === 'support') return <SupportView onBack={() => setView('dashboard')} onScroll={handleScroll} isHeaderVisible={navVisible} />;

    // ── DASHBOARD HOME ──
    const isApproved = status === 'approved';

    const rqsProgress = Math.min((profile.rqs / RQS_TARGET) * 100, 100);
    const intProgress = Math.min((partnerStats.interactionCount / INTERACTIONS_TARGET) * 100, 100);
    const streakProgress = Math.min((partnerStats.streakWeeks / STREAK_TARGET) * 100, 100);
    const totalMonetizationProgress = Math.round((rqsProgress + intProgress + streakProgress) / 3);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <PullToRefreshIndicator {...ptr.indicatorProps} />
      {/* Dashboard Header */}
      <div className={`header-glass fixed top-0 left-0 w-full z-50 transition-transform duration-400 ease-out ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="w-full h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Avatar src={profile.avatar_url} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 shadow-lg object-cover" fallbackSize={16} />
            <div>
              <h1 className="font-heading text-sm font-bold text-white tracking-widest uppercase leading-tight cursor-default">My Space</h1>
              <p className="text-[9px] text-muted font-bold tracking-widest uppercase">Creator Studio</p>
            </div>
          </div>
          <button onClick={() => window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Settings coming soon', icon: 'Clock' } }))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted hover:bg-white/10 hover:text-white transition-colors touch-scale"
            aria-label="Settings">
            <Icon icon="Settings" size={18} />
          </button>
        </div>
      </div>

      <ViewWrapper
        scrollRef={dashboardScrollRef}
        onScroll={handleScroll}
        className={`${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
        style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
      >
        <div className="space-y-4 px-1">
          {/* Revenue Card */}
          <DashboardCard icon="Wallet" title="Revenue"
            value={`₹${(profile.total_earnings || 0).toLocaleString()}`}
            subtext={`Last 30 days: +₹${earnings.lastMonth.toLocaleString()}`}
            color="text-neon" onClick={() => setView('earnings')}
            isLocked={!isApproved} delay="0ms" />

          {/* RQS Card */}
          <div onClick={() => setView('rqs')} className="glass-panel rounded-2xl p-5 relative overflow-hidden touch-scale transition-all cursor-pointer group">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-brand-blue text-white px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest">RQS</div>
                <span className="text-sm font-medium text-muted group-hover:text-white transition-colors">Reputation</span>
              </div>
              <Icon icon="ChevronRight" size={16} className="text-muted/30 group-hover:text-white transition-colors" />
            </div>
            <div className="pl-1">
              <h3 className="font-heading font-bold text-4xl text-white tracking-tight mb-1">
                {profile.rqs} <span className="text-base font-normal text-muted">/ 100</span>
              </h3>
              <p className="text-[11px] text-muted font-bold uppercase tracking-wide">REPUTED REVIEWER</p>
            </div>
          </div>

          {/* Partner Program Card */}
          <div onClick={() => setView('monetization')} className="glass-panel rounded-2xl p-5 relative overflow-hidden touch-scale transition-all cursor-pointer group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:border-neon/30 transition-colors">
                  <Icon icon="Zap" size={20} className="text-neon" />
                </div>
                <span className="text-sm font-medium text-muted group-hover:text-white transition-colors">Partner Program</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded border tracking-widest ${
                isApproved ? 'bg-accent-green/20 text-accent-green border-accent-green/20' :
                status === 'pending' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' :
                status === 'applied' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' :
                'bg-transparent text-white border-white/30'
              }`}>
                {isApproved ? 'APPROVED' :
                 status === 'pending' ? 'RECEIVED' :
                 status === 'applied' ? 'SENT' :
                 getStatusTag(totalMonetizationProgress).toUpperCase()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full relative mt-2">
              <div className="h-full rounded-full relative transition-all duration-1000 ease-out bg-neon shadow-[0_0_15px_var(--neon)]"
                style={{ width: `${isApproved ? 100 : totalMonetizationProgress}%` }}>
                <div className="glow-tip" />
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3 font-medium">
              Active Progression: {isApproved ? '100%' : `${totalMonetizationProgress}%`}
            </p>
          </div>

          {/* Analytics Card */}
          <DashboardCard icon="BarChart2" title="Insights" value="View Analytics" subtext="Coming Soon"
            color="text-white"
            onClick={() => window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Analytics feature coming soon in post beta', icon: 'Clock' } }))}
            delay="300ms" />

          {/* Brand Interactions Preview */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">BRAND INTERACTIONS</h3>
              <button onClick={() => setView('brands')} className="text-[10px] text-neon flex items-center gap-1 hover:text-white transition-colors touch-scale">
                View All <Icon icon="ChevronRight" size={10} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
              {brandInteractions.length === 0 ? (
                <div className="text-[10px] text-muted p-2">No brand interactions yet</div>
              ) : brandInteractions.slice(0, 5).map((b, i) => {
                const bName = b.seen_by_brand || b.brand_name || 'Brand';
                return (
                  <div key={i} className="snap-start shrink-0 glass-panel rounded-xl p-3 min-w-[100px] active:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center mb-2 shadow-sm overflow-hidden p-1">
                      {BRAND_LOGOS[bName] ? (
                        <img src={BRAND_LOGOS[bName]} className="w-full h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center font-bold text-xs bg-white text-[#000000] ${BRAND_LOGOS[bName] ? 'hidden' : ''}`}>
                        {bName[0].toUpperCase()}
                      </div>
                    </div>
                    <h4 className="text-[11px] font-bold text-white mb-1 truncate">{bName}</h4>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-2 mb-8 pt-6 border-t border-white/5">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setView('security')} className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors touch-scale">
                <Icon icon="Shield" size={20} className="text-muted" />
                <span className="text-xs font-bold text-muted">Security</span>
              </button>
              <button onClick={() => setView('support')} className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors touch-scale">
                <Icon icon="HelpCircle" size={20} className="text-muted" />
                <span className="text-xs font-bold text-muted">Support</span>
              </button>
            </div>
          </div>
        </div>
      </ViewWrapper>
    </div>
  );
  };

  return (
    <>
      {renderView()}
      {/* Celebration Confetti on Partner Approval */}
      {showCelebration && (
        <CelebrationConfetti onComplete={() => setShowCelebration(false)} />
      )}
      {/* Partner Application Modal */}
      <PartnerApplicationModal
        isOpen={isPartnerModalOpen}
        onClose={closePartnerModal}
        onSubmit={handlePartnerSubmit}
        initialData={existingApplication}
      />
    </>
  );
}
