import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { emotionAPI, UserProfilePayload } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ── Country → States map (India + USA, dropdown. Others → text input)
const STATE_MAP: Record<string, string[]> = {
  India: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
    'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  ],
};

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'UAE', 'Other',
];

const LANGUAGES = [
  'Tamil', 'Telugu', 'Hindi', 'Kannada', 'Malayalam', 'Bengali', 'Marathi',
  'Gujarati', 'Punjabi', 'Odia', 'English', 'Spanish', 'French', 'German',
  'Arabic', 'Mandarin', 'Portuguese', 'Other',
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const ROLES = ['Student', 'Working Professional', 'Other'];

// ── Reusable styled input ──────────────────────────────────────
const inputCls = `
  w-full bg-white/60 border border-[#1a6b5a]/20 rounded-2xl px-4 py-3
  text-[#1a6b5a] placeholder-[#1a6b5a]/40 text-[15px]
  focus:outline-none focus:border-[#1a6b5a]/60 focus:ring-2 focus:ring-[#1a6b5a]/10
  transition-all duration-200
`.trim();

const labelCls = `block text-[11px] font-black uppercase tracking-[0.18em] text-[#1a6b5a]/50 mb-1.5`;

// ── Slide variants ─────────────────────────────────────────────
const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { markOnboarded } = useAuth();
  const [step, setStep] = useState(0);         // 0 = name/dob/gender, 1 = role/country/state, 2 = language
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<UserProfilePayload>({
    full_name: '',
    dob: '',
    gender: '',
    role: '',
    country: '',
    state: '',
    native_language: '',
  });

  const set = (key: keyof UserProfilePayload, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const statesForCountry = STATE_MAP[form.country] || null;

  // ── Validation per step ────────────────────────────────────────
  const canProceed = () => {
    if (step === 0) return form.full_name.trim() && form.dob && form.gender;
    if (step === 1) return form.role && form.country && form.state.trim();
    if (step === 2) return !!form.native_language;
    return false;
  };

  const next = () => { setDir(1); setStep(s => s + 1); };
  const back = () => { setDir(-1); setStep(s => s - 1); };

  const submit = async () => {
    setLoading(true);
    try {
      await emotionAPI.updateUserProfile(form);
      markOnboarded();
      toast.success('You\'re all set. Welcome to Emolit.');
      onComplete();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(228, 249, 242, 0.92)',
        backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(26,107,90,0.12)',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '420px',
          padding: '40px 32px 36px',
          boxShadow: '0 32px 80px rgba(26,107,90,0.14)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "'Lora', serif",
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.26em', textTransform: 'uppercase',
            color: 'rgba(26,107,90,0.45)', marginBottom: 10,
          }}>
            Before we begin
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.75rem', fontWeight: 900,
            fontStyle: 'italic', color: '#1a6b5a',
            lineHeight: 1.25, margin: 0,
          }}>
            Tell us who you are.
          </h1>
          <p style={{
            fontFamily: "'Lora', serif",
            fontSize: 13, color: 'rgba(26,107,90,0.55)',
            marginTop: 10, lineHeight: 1.6,
          }}>
            {step === 0 && 'Your identity shapes your journey. These details stay private and help us speak your language.'}
            {step === 1 && 'Where you are matters. Your context gives meaning to your emotions.'}
            {step === 2 && 'The tongue you think in is the one you feel in. Tell us yours.'}
          </p>
        </div>

        {/* ── Step indicator ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                height: 3, flex: 1,
                borderRadius: 8,
                background: i <= step ? '#1a6b5a' : 'rgba(26,107,90,0.15)',
                transition: 'background 0.4s',
              }}
            />
          ))}
        </div>

        {/* ── Animated step content ──────────────────────── */}
        <div style={{ minHeight: 240, position: 'relative' }}>
          <AnimatePresence custom={dir} mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <label className={labelCls}>Full Name</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Priya Sharma"
                    value={form.full_name}
                    onChange={e => set('full_name', e.target.value)}
                  />
                </div>

                {/* DOB */}
                <div style={{ marginBottom: 16 }}>
                  <label className={labelCls}>Date of Birth</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => set('dob', e.target.value)}
                    style={{ colorScheme: 'light' }}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className={labelCls}>Gender</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {GENDERS.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => set('gender', g)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 12,
                          border: `1.5px solid ${form.gender === g ? '#1a6b5a' : 'rgba(26,107,90,0.2)'}`,
                          background: form.gender === g ? '#1a6b5a' : 'white',
                          color: form.gender === g ? 'white' : '#1a6b5a',
                          fontSize: 13, fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {/* Role */}
                <div style={{ marginBottom: 16 }}>
                  <label className={labelCls}>Current Role</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ROLES.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => set('role', r)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 12,
                          border: `1.5px solid ${form.role === r ? '#1a6b5a' : 'rgba(26,107,90,0.2)'}`,
                          background: form.role === r ? '#1a6b5a' : 'white',
                          color: form.role === r ? 'white' : '#1a6b5a',
                          fontSize: 13, fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div style={{ marginBottom: 16 }}>
                  <label className={labelCls}>Country</label>
                  <select
                    className={inputCls}
                    value={form.country}
                    onChange={e => { set('country', e.target.value); set('state', ''); }}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* State */}
                {form.country && (
                  <div>
                    <label className={labelCls}>State / Region</label>
                    {statesForCountry ? (
                      <select
                        className={inputCls}
                        value={form.state}
                        onChange={e => set('state', e.target.value)}
                      >
                        <option value="">Select state</option>
                        {statesForCountry.map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input
                        className={inputCls}
                        placeholder="Enter your state or region"
                        value={form.state}
                        onChange={e => set('state', e.target.value)}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <label className={labelCls}>Native Language</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {LANGUAGES.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set('native_language', l)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 12,
                        border: `1.5px solid ${form.native_language === l ? '#1a6b5a' : 'rgba(26,107,90,0.2)'}`,
                        background: form.native_language === l ? '#1a6b5a' : 'white',
                        color: form.native_language === l ? 'white' : '#1a6b5a',
                        fontSize: 13, fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: '0 0 auto', padding: '14px 20px',
                borderRadius: 16, border: '1.5px solid rgba(26,107,90,0.2)',
                background: 'white', color: '#1a6b5a',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
              }}
            >
              ←
            </button>
          )}
          <button
            onClick={step < 2 ? next : submit}
            disabled={!canProceed() || loading}
            style={{
              flex: 1, padding: '16px',
              borderRadius: 16, border: 'none',
              background: canProceed() && !loading ? '#1a6b5a' : 'rgba(26,107,90,0.25)',
              color: 'white',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900, fontSize: 15,
              fontStyle: 'italic',
              cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Saving...' : step < 2 ? 'Continue →' : 'Get Started'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
