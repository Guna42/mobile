import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { emotionAPI } from '../services/api';

// ─── Data ─────────────────────────────────────────────────────────
const STATE_MAP: Record<string, string[]> = {
  India: [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
    'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
    'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
    'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
    'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
  ],
  'United States': [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
    'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
    'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
    'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
    'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  ],
};
const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Germany','France','Singapore','UAE','Other'];
const LANGUAGES = ['Tamil','Telugu','Hindi','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','English','Spanish','French','German','Arabic','Mandarin','Portuguese','Other'];
const GENDERS = ['Male','Female','Non-binary','Prefer not to say'];
const ROLES = ['Student','Working Professional','Other'];

// ─── Theme ─────────────────────────────────────────────────────────
const P = '#1a6b5a';          // primary green
const LEAF = '#4caf82';       // soft leaf green
const BG = '#f2f7f5';         // page background
const CARD = '#ffffff';

// ─── Slide animation ───────────────────────────────────────────────
const slide = {
  enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0 }),
};

// ─── Input ─────────────────────────────────────────────────────────
const Inp: React.FC<{
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
  max?: string;
}> = ({ icon, type = 'text', placeholder, value, onChange, right, max }) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: `${P}55`, display: 'flex' }}>
      {icon}
    </span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      max={max}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: '#f8fbf9', border: `1.5px solid ${P}18`,
        borderRadius: 14, padding: '14px 44px 14px 46px',
        fontSize: 15, color: P, fontWeight: 500,
        outline: 'none', transition: 'border-color .2s, box-shadow .2s',
        fontFamily: 'inherit',
      }}
      onFocus={e => { e.target.style.borderColor = `${P}60`; e.target.style.boxShadow = `0 0 0 3px ${P}12`; }}
      onBlur={e => { e.target.style.borderColor = `${P}18`; e.target.style.boxShadow = 'none'; }}
    />
    {right && (
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: `${P}55` }}>
        {right}
      </span>
    )}
  </div>
);

// ─── Select ────────────────────────────────────────────────────────
const Sel: React.FC<{ icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; options: string[] }> = ({ icon, placeholder, value, onChange, options }) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: `${P}55`, display: 'flex', zIndex: 1 }}>
      {icon}
    </span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: '#f8fbf9', border: `1.5px solid ${P}18`,
        borderRadius: 14, padding: '14px 44px 14px 46px',
        fontSize: 15, color: value ? P : `${P}55`, fontWeight: 500,
        outline: 'none', appearance: 'none', cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: `${P}55`, pointerEvents: 'none' }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </span>
  </div>
);

// ─── Pill Button ───────────────────────────────────────────────────
const Pill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
    style={{
      padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
      border: `1.5px solid ${active ? P : `${P}25`}`,
      background: active ? P : 'white',
      color: active ? 'white' : `${P}99`,
      cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
    }}
  >
    {label}
  </motion.button>
);

// ─── Dots loader ───────────────────────────────────────────────────
const Dots = () => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
    {[0,1,2].map(i => (
      <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }}
        animate={{ scale: [1,1.6,1], opacity: [0.5,1,0.5] }}
        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
    ))}
  </div>
);

// ─── SVG Icons ─────────────────────────────────────────────────────
const IconUser = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconMail = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IconLock = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IconCalendar = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconGlobe = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconMap = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IconLang = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M2 5h14M9 2v3M4 9c0 3.3 2.7 6 6 6M12 9c0 3.3-2.7 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M14 14l2 5 2-5m-3.5 3h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconEye = ({ off }: { off?: boolean }) => off
  ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  : <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IconArrow = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconShield = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── Floating Leaf Decoration ──────────────────────────────────────
const FloatingLeaves = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {[
      { size: 40, top: '5%', left: '-5%', rot: 30, delay: 0 },
      { size: 28, top: '15%', right: '-3%', rot: -20, delay: 0.4 },
      { size: 22, bottom: '20%', left: '-4%', rot: 50, delay: 0.8 },
      { size: 34, bottom: '5%', right: '-5%', rot: -40, delay: 0.2 },
      { size: 18, top: '45%', right: '-2%', rot: 15, delay: 1.2 },
    ].map((l, i) => (
      <motion.div key={i}
        style={{ position: 'absolute', width: l.size, height: l.size, ...l } as any}
        animate={{ y: [0, -10, 0], rotate: [l.rot, l.rot + 8, l.rot] }}
        transition={{ duration: 4 + i, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }}>
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M20 2C10 2 2 12 2 22c0 6 4 12 18 16C34 34 38 28 38 22 38 12 30 2 20 2z" fill={`${LEAF}25`}/>
        </svg>
      </motion.div>
    ))}
  </div>
);

// ─── Progress Bar ──────────────────────────────────────────────────
const ProgressBar: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div style={{ display: 'flex', gap: 6, width: '100%', marginBottom: 24 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < step ? P : `${P}20`, overflow: 'hidden' }}>
        {i === step - 1 && (
          <motion.div style={{ height: '100%', background: P }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.4 }} />
        )}
      </div>
    ))}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────
type Mode = 'welcome' | 'login' | 'forgot' | 'reg1' | 'reg2' | 'reg3';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, isLoading: authLoading, markOnboarded } = useAuth();

  const [mode, setMode] = useState<Mode>('welcome');
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successName, setSuccessName] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Forgot password
  const [forgotStep, setForgotStep] = useState<1|2|3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');

  // Reg step 1
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Reg step 2
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regRole, setRegRole] = useState('');

  // Reg step 3
  const [regCountry, setRegCountry] = useState('');
  const [regState, setRegState] = useState('');
  const [regLang, setRegLang] = useState('');

  const go = (next: Mode, d = 1) => { setDir(d); setMode(next); };

  // Redirect once authenticated (but not during success animation)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !showSuccess) {
      navigate((location.state as any)?.from?.pathname || '/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location, showSuccess]);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => navigate((location.state as any)?.from?.pathname || '/', { replace: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, navigate, location]);

  const today = new Date().toISOString().split('T')[0];

  // ── Login submit ─────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setSuccessName(loginEmail.split('@')[0]);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  // ── Reg step 1 validation & advance ─────────────────────────────
  const handleReg1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return toast.error('Please enter your name.');
    if (regPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    if (regPassword !== regConfirm) return toast.error('Passwords do not match.');
    go('reg2');
  };

  // ── Reg step 2 advance ──────────────────────────────────────────
  const handleReg2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDob) return toast.error('Please select your date of birth.');
    if (!regGender) return toast.error('Please select your gender.');
    if (!regRole) return toast.error('Please select your role.');
    go('reg3');
  };

  // ── Final reg submit ─────────────────────────────────────────────
  const handleReg3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCountry) return toast.error('Please select your country.');
    if (!regLang) return toast.error('Please select your native language.');

    setLoading(true);
    try {
      // 1. Create Firebase + backend account
      await register(regEmail, regPassword, regName);

      // 2. Save profile details immediately
      // We need to wait a moment for the token to be set in context
      await new Promise(r => setTimeout(r, 1200));

      try {
        await emotionAPI.updateUserProfile({
          full_name: regName,
          dob: regDob,
          gender: regGender,
          role: regRole,
          country: regCountry,
          state: regState,
          native_language: regLang,
        });
        markOnboarded(); // Don't show onboarding modal for new users
      } catch {
        // Profile save failed — will be caught by onboarding modal on next login
      }

      setSuccessName(regName.split(' ')[0]);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  // ── Forgot password ──────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgotStep === 1) {
        const r = await emotionAPI.sendForgotOTP(forgotEmail);
        if (r.sent) { toast.success('Code sent!'); setForgotStep(2); }
        else toast.error('Could not send code.');
      } else if (forgotStep === 2) {
        const r = await emotionAPI.verifyForgotOTP(forgotEmail, otp);
        if (r.valid) { toast.success('Verified!'); setForgotStep(3); }
        else toast.error('Invalid code.');
      } else {
        const r = await emotionAPI.resetForgotAndPassword(forgotEmail, otp, newPw);
        if (r.success) { toast.success('Password reset! Sign in now.'); go('login', -1); setForgotStep(1); }
        else toast.error('Reset failed.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Error.');
    } finally { setLoading(false); }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <motion.img src="/logo.png" alt="Emolit" animate={{ scale: [1,1.06,1], opacity: [0.8,1,0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: P }}
              animate={{ scale: [1,1.6,1], opacity: [0.4,1,0.4] }}
              transition={{ duration: 1, delay: i*0.2, repeat: Infinity }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Shared card style ────────────────────────────────────────────
  const card = {
    background: CARD, borderRadius: 28, padding: '32px 28px',
    boxShadow: '0 8px 40px rgba(26,107,90,0.10)',
    width: '100%', maxWidth: 400, position: 'relative' as const, overflow: 'hidden',
  };

  // ── CTA Button ───────────────────────────────────────────────────
  const Btn: React.FC<{ children: React.ReactNode; type?: 'submit'|'button'; onClick?: ()=>void; disabled?: boolean }> = ({ children, type='submit', onClick, disabled }) => (
    <motion.button
      type={type} onClick={onClick} disabled={disabled}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%', background: P, color: 'white', border: 'none',
        borderRadius: 16, height: 54, fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: 'pointer', boxShadow: `0 6px 24px ${P}40`, fontFamily: 'inherit',
        transition: 'opacity .2s',
      }}
    >
      {children}
    </motion.button>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', position: 'relative', fontFamily: "'Lora', serif" }}>
      <FloatingLeaves />

      <AnimatePresence mode="wait" custom={dir}>

        {/* ══════════════ WELCOME SCREEN ══════════════ */}
        {mode === 'welcome' && (
          <motion.div key="welcome" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ ...card, zIndex: 1 }}>

            {/* Logo top bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <img src="/logo.png" alt="Emolit" style={{ height: 36, objectFit: 'contain' }} />
            </div>

            {/* Hero illustration placeholder with gradient */}
            <div style={{ width: '100%', height: 200, borderRadius: 20, background: 'linear-gradient(135deg, #d4ede4 0%, #b8dfcc 50%, #a8d4be 100%)', marginBottom: 28, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Animated sun */}
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,210,100,0.9)', boxShadow: '0 0 30px rgba(255,210,100,0.5)' }} />
              {/* Hills */}
              <svg viewBox="0 0 360 120" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                <ellipse cx="180" cy="160" rx="220" ry="120" fill="#4caf8255"/>
                <ellipse cx="80" cy="170" rx="140" ry="100" fill="#1a6b5a33"/>
                <ellipse cx="290" cy="170" rx="140" ry="100" fill="#1a6b5a22"/>
                {/* Path */}
                <path d="M140 120 Q180 80 220 120" stroke="#e8d5a0" strokeWidth="6" fill="none" strokeLinecap="round"/>
              </svg>
              {/* Left plant */}
              <svg viewBox="0 0 60 120" style={{ position: 'absolute', bottom: 0, left: 10, width: 50, height: 100 }}>
                <path d="M30 120 Q30 80 30 60" stroke="#2d8a6a" strokeWidth="3" fill="none"/>
                <path d="M30 80 Q10 60 5 40" stroke="#3aab6a" strokeWidth="2.5" fill="none"/>
                <ellipse cx="5" cy="38" rx="12" ry="18" fill="#4caf8299" transform="rotate(-20,5,38)"/>
                <path d="M30 70 Q50 50 55 30" stroke="#3aab6a" strokeWidth="2.5" fill="none"/>
                <ellipse cx="55" cy="28" rx="12" ry="18" fill="#58c98899" transform="rotate(20,55,28)"/>
              </svg>
              {/* Right plant (pink leaves) */}
              <svg viewBox="0 0 60 120" style={{ position: 'absolute', bottom: 0, right: 10, width: 50, height: 100 }}>
                <path d="M30 120 Q30 80 30 60" stroke="#c47a8a" strokeWidth="3" fill="none"/>
                <ellipse cx="15" cy="60" rx="14" ry="22" fill="#e9a0b099" transform="rotate(-15,15,60)"/>
                <ellipse cx="45" cy="50" rx="14" ry="22" fill="#e9a0b088" transform="rotate(15,45,50)"/>
              </svg>
            </div>

            {/* Hero text */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: P, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Start Fresh.
              </h1>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: LEAF, margin: '6px 0 12px' }}>
                Begin Your Emotional Odyssey
              </p>
              <p style={{ fontSize: 14, color: `${P}99`, lineHeight: 1.6, margin: 0 }}>
                A safe space to understand, express and grow through your emotions.
              </p>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                { icon: <IconShield />, title: 'Private & Secure', sub: 'Your data is always protected' },
                { icon: <IconLang />, title: 'Mindful Growth', sub: 'Build self-awareness, one step at a time' },
                { icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 21C12 21 3 14 3 8a9 9 0 0 1 18 0c0 6-9 13-9 13z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>, title: 'Track & Reflect', sub: 'Monitor your journey and celebrate small wins' },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${P}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: P }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: `${P}80` }}>{f.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <Btn type="button" onClick={() => go('reg1')}>
              Begin Your Journey <IconArrow />
            </Btn>

            <p style={{ textAlign: 'center', fontSize: 13, color: `${P}80`, marginTop: 18 }}>
              Already have an account?{' '}
              <button onClick={() => go('login')} style={{ background: 'none', border: 'none', color: P, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Sign In
              </button>
            </p>
          </motion.div>
        )}

        {/* ══════════════ LOGIN ══════════════ */}
        {mode === 'login' && (
          <motion.div key="login" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ ...card, zIndex: 1 }}>

            {/* Back + logo */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => go('welcome', -1)}
                style={{ width: 36, height: 36, borderRadius: 10, background: `${P}10`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.button>
              <img src="/logo.png" alt="Emolit" style={{ height: 28, objectFit: 'contain', margin: '0 auto', marginRight: 36 }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #d4ede4, #b8dfcc)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 40 40">
                  <path d="M20 4C12 4 6 14 6 22c0 8 6 14 14 14s14-6 14-14C34 14 28 4 20 4z" fill="#4caf8255"/>
                  <path d="M20 8c-5 0-8 6-8 10" stroke="#1a6b5a" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: P, margin: 0 }}>Welcome back</h2>
              <p style={{ fontSize: 13, color: `${P}80`, marginTop: 6 }}>Let's continue your journey.</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Inp icon={<IconMail />} type="email" placeholder="Email Address" value={loginEmail} onChange={setLoginEmail} />
              <Inp icon={<IconLock />} type={showPw ? 'text' : 'password'} placeholder="Password" value={loginPassword} onChange={setLoginPassword}
                right={<button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${P}55`, display: 'flex' }}><IconEye off={showPw} /></button>} />

              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => go('forgot')} style={{ background: 'none', border: 'none', color: `${P}80`, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Forgot Password?
                </button>
              </div>

              {/* Privacy note */}
              <div style={{ background: `${P}08`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: P, flexShrink: 0 }}><IconShield /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P }}>Your privacy matters</div>
                  <div style={{ fontSize: 11, color: `${P}80` }}>We never share your personal data.</div>
                </div>
              </div>

              <Btn disabled={loading}>
                {loading ? <Dots /> : <><span>Continue</span><IconArrow /></>}
              </Btn>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: `${P}80`, marginTop: 20 }}>
              New to Emolit?{' '}
              <button onClick={() => go('reg1')} style={{ background: 'none', border: 'none', color: P, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Create Account
              </button>
            </p>
          </motion.div>
        )}

        {/* ══════════════ REGISTER STEP 1 ══════════════ */}
        {mode === 'reg1' && (
          <motion.div key="reg1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ ...card, zIndex: 1 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => go('welcome', -1)}
                style={{ width: 36, height: 36, borderRadius: 10, background: `${P}10`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.button>
              <span style={{ fontSize: 12, fontWeight: 700, color: `${P}80` }}>Step 1 of 3</span>
            </div>

            <ProgressBar step={1} total={3} />

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #d4ede4, #b8dfcc)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 40 40"><path d="M20 2C10 2 4 12 4 20c0 10 8 18 16 18s16-8 16-18C36 12 30 2 20 2z" fill="#4caf8255"/><path d="M20 6c-4 0-8 5-8 9" stroke="#1a6b5a" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: P, margin: 0 }}>Create your space</h2>
              <p style={{ fontSize: 13, color: `${P}80`, marginTop: 6 }}>Let's get to know you better.</p>
            </div>

            <form onSubmit={handleReg1} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Inp icon={<IconUser />} placeholder="Full Name" value={regName} onChange={setRegName} />
              <Inp icon={<IconMail />} type="email" placeholder="Email Address" value={regEmail} onChange={setRegEmail} />
              <Inp icon={<IconLock />} type={showRegPw ? 'text' : 'password'} placeholder="Password"
                value={regPassword} onChange={setRegPassword}
                right={<button type="button" onClick={() => setShowRegPw(!showRegPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${P}55`, display: 'flex' }}><IconEye off={showRegPw} /></button>} />
              <Inp icon={<IconLock />} type={showConfirmPw ? 'text' : 'password'} placeholder="Confirm Password"
                value={regConfirm} onChange={setRegConfirm}
                right={<button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${P}55`, display: 'flex' }}><IconEye off={showConfirmPw} /></button>} />

              <p style={{ fontSize: 11, color: `${P}70`, margin: 0 }}>At least 8 characters with a number &amp; symbol</p>

              {/* Privacy note */}
              <div style={{ background: `${P}08`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: P, flexShrink: 0 }}><IconShield /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P }}>Your privacy matters</div>
                  <div style={{ fontSize: 11, color: `${P}80` }}>We never share your personal data.</div>
                </div>
              </div>

              <Btn>Continue <IconArrow /></Btn>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: `${P}80`, marginTop: 18 }}>
              Already have an account?{' '}
              <button onClick={() => go('login', -1)} style={{ background: 'none', border: 'none', color: P, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Sign In
              </button>
            </p>
          </motion.div>
        )}

        {/* ══════════════ REGISTER STEP 2 ══════════════ */}
        {mode === 'reg2' && (
          <motion.div key="reg2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ ...card, zIndex: 1 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => go('reg1', -1)}
                style={{ width: 36, height: 36, borderRadius: 10, background: `${P}10`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.button>
              <span style={{ fontSize: 12, fontWeight: 700, color: `${P}80` }}>Step 2 of 3</span>
            </div>

            <ProgressBar step={2} total={3} />

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #d4ede4, #b8dfcc)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 40 40"><path d="M20 5a15 15 0 1 0 0 30A15 15 0 0 0 20 5z" fill="#4caf8255"/><path d="M14 22a8 8 0 0 0 12 0" stroke="#1a6b5a" strokeWidth="2" strokeLinecap="round"/><circle cx="15" cy="17" r="2" fill="#1a6b5a"/><circle cx="25" cy="17" r="2" fill="#1a6b5a"/></svg>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: P, margin: 0 }}>About you</h2>
              <p style={{ fontSize: 13, color: `${P}80`, marginTop: 6 }}>Help us personalize your experience.</p>
            </div>

            <form onSubmit={handleReg2} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* DOB */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${P}70`, display: 'block', marginBottom: 8 }}>
                  Date of Birth
                </label>
                <Inp icon={<IconCalendar />} type="date" placeholder="Date of Birth" value={regDob} onChange={setRegDob} max={today} />
              </div>

              {/* Gender */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${P}70`, display: 'block', marginBottom: 8 }}>
                  Gender
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GENDERS.map(g => <Pill key={g} label={g} active={regGender === g} onClick={() => setRegGender(g)} />)}
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${P}70`, display: 'block', marginBottom: 8 }}>
                  I am a
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ROLES.map(r => <Pill key={r} label={r} active={regRole === r} onClick={() => setRegRole(r)} />)}
                </div>
              </div>

              <Btn>Continue <IconArrow /></Btn>
            </form>
          </motion.div>
        )}

        {/* ══════════════ REGISTER STEP 3 ══════════════ */}
        {mode === 'reg3' && (
          <motion.div key="reg3" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ ...card, zIndex: 1 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => go('reg2', -1)}
                style={{ width: 36, height: 36, borderRadius: 10, background: `${P}10`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.button>
              <span style={{ fontSize: 12, fontWeight: 700, color: `${P}80` }}>Step 3 of 3</span>
            </div>

            <ProgressBar step={3} total={3} />

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #d4ede4, #b8dfcc)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#4caf8255"/><path d="M20 6c-4 5-7 9-7 13s3 8 7 10c4-2 7-6 7-10S24 11 20 6z" stroke="#1a6b5a" strokeWidth="2" strokeLinejoin="round"/><path d="M6 20h28" stroke="#1a6b5a" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: P, margin: 0 }}>Where are you from?</h2>
              <p style={{ fontSize: 13, color: `${P}80`, marginTop: 6 }}>Almost there — just one more step.</p>
            </div>

            <form onSubmit={handleReg3} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Country */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${P}70`, display: 'block', marginBottom: 8 }}>Country</label>
                <Sel icon={<IconGlobe />} placeholder="Select Country" value={regCountry} onChange={v => { setRegCountry(v); setRegState(''); }} options={COUNTRIES} />
              </div>

              {/* State */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${P}70`, display: 'block', marginBottom: 8 }}>State / Region</label>
                {STATE_MAP[regCountry] ? (
                  <Sel icon={<IconMap />} placeholder="Select State" value={regState} onChange={setRegState} options={STATE_MAP[regCountry]} />
                ) : (
                  <Inp icon={<IconMap />} placeholder="State / Region (optional)" value={regState} onChange={setRegState} />
                )}
              </div>

              {/* Native Language */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: `${P}70`, display: 'block', marginBottom: 8 }}>Native Language</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {LANGUAGES.map(l => <Pill key={l} label={l} active={regLang === l} onClick={() => setRegLang(l)} />)}
                </div>
              </div>

              <Btn disabled={loading}>
                {loading ? <Dots /> : <><span>Start My Journey</span><IconArrow /></>}
              </Btn>
            </form>
          </motion.div>
        )}

        {/* ══════════════ FORGOT PASSWORD ══════════════ */}
        {mode === 'forgot' && (
          <motion.div key="forgot" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ ...card, zIndex: 1 }}>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { go('login', -1); setForgotStep(1); setOtp(''); setNewPw(''); }}
                style={{ width: 36, height: 36, borderRadius: 10, background: `${P}10`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: P, margin: 0 }}>Reset Password.</h2>
              <p style={{ fontSize: 13, color: `${P}80`, marginTop: 8 }}>
                {forgotStep === 1 && 'Enter your email to receive a secure code'}
                {forgotStep === 2 && 'Enter the 6-digit code sent to your email'}
                {forgotStep === 3 && 'Create a secure new password'}
              </p>
            </div>

            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AnimatePresence mode="wait">
                <motion.div key={forgotStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {forgotStep === 1 && <Inp icon={<IconMail />} type="email" placeholder="Email Address" value={forgotEmail} onChange={setForgotEmail} />}
                  {forgotStep === 2 && <Inp icon={<IconShield />} placeholder="000000" value={otp} onChange={v => setOtp(v.replace(/[^0-9]/g, '').slice(0,6))} />}
                  {forgotStep === 3 && <Inp icon={<IconLock />} type="password" placeholder="New Password" value={newPw} onChange={setNewPw} />}
                </motion.div>
              </AnimatePresence>

              <Btn disabled={loading}>
                {loading ? <Dots /> : <><span>{forgotStep === 1 ? 'Send Code' : forgotStep === 2 ? 'Verify' : 'Reset Password'}</span><IconArrow /></>}
              </Btn>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ SUCCESS OVERLAY ══════════════ */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(242,247,245,0.88)' }}>
            <motion.img src="/assets/login_sucess.gif" alt="Welcome"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
              style={{ width: 240, height: 240, objectFit: 'contain', filter: `drop-shadow(0 8px 30px ${P}30)` }} />
            <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', color: P, margin: '8px 0 0', textAlign: 'center' }}>
              Welcome, {successName} 🌿
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              style={{ fontFamily: "'Lora', serif", fontSize: 13, color: `${P}80`, textAlign: 'center', margin: '10px 0 0', padding: '0 40px', lineHeight: 1.7 }}>
              You're in a safe space — crafted to help you feel, understand, and grow.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
