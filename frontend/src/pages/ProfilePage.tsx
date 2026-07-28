import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, BellSimple, Lock, Palette, Question, SignOut,
  X, Check, NotePencil, CaretRight, Heart, Star,
  ChatCircleDots, Lifebuoy, Confetti, Flame, BookOpen, Leaf, Drop, PencilLine,
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { emotionAPI, JournalHistoryResponse, UserProfile } from '../services/api';
import toast from 'react-hot-toast';

/* ─── Fonts ─────────────────────────────────────────────────────────────────── */
if (!document.head.querySelector('[href*="Poppins"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(l);
}

/* ─── Design Tokens (mirroring reference image exactly) ─────────────────────── */
const D = {
  bg:        '#F5FBF8',
  card:      '#FFFFFF',
  border:    '#EAEAEA',
  mintLight: '#E8F5F0',
  mint:      '#A8E6CF',
  mintMed:   '#3AA38F',
  mintDark:  '#2D7A65',
  text:      '#1E2D28',
  textSub:   '#6E8C81',
  textDim:   '#B0C8BF',
  // Progress card palettes (from reference image)
  p1: { bg: '#E8F5F2', iconColor: '#2D7A65', text: '#1A5C4A' },
  p2: { bg: '#EEE9FC', iconColor: '#7C3AED', text: '#4C1D95' },
  p3: { bg: '#FEF9E7', iconColor: '#D97706', text: '#92400E' },
  p4: { bg: '#FEF0F5', iconColor: '#BE185D', text: '#831843' },
};

/* ─── Fade helper ────────────────────────────────────────────────────────────── */
const fd = (d = 0, y = 16) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.48, ease: [0.22, 1, 0.36, 1] as any },
});
const pop = (d = 0) => ({
  initial: { opacity: 0, scale: 0.86 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay: d, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] as any },
});

/* ─── Animated Number ────────────────────────────────────────────────────────── */
const Num: React.FC<{ v: number }> = ({ v }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(v / 60));
    const t = setInterval(() => {
      cur = Math.min(cur + step, v);
      setN(cur);
      if (cur >= v) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [v]);
  return <>{n}</>;
};

/* ─────────────────────────────────────────────────────────────────────────────
   PORTAL COMPONENT FOR OVERLAY MODALS
───────────────────────────────────────────────────────────────────────────── */
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

/* ─────────────────────────────────────────────────────────────────────────────
   PREMIUM VECTOR ILLUSTRATION AVATARS
───────────────────────────────────────────────────────────────────────────── */
const MaleAvatar: React.FC = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="50" r="48" fill="#E8F5F2" />
    {/* Inner shadow/ring */}
    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(45,122,101,0.06)" strokeWidth="3" />
    
    {/* Shoulders */}
    <path d="M22 88 C 22 72, 32 64, 50 64 C 68 64, 78 72, 78 88" fill="#A8DCD0" />
    <path d="M38 68 L50 62 L62 68" stroke="#72BCA9" strokeWidth="2" fill="none" strokeLinecap="round" />
    
    {/* Neck */}
    <rect x="44" y="52" width="12" height="15" fill="#FED8B1" />
    
    {/* Face */}
    <circle cx="50" cy="40" r="21" fill="#FFE5CC" />
    
    {/* Hair - Clean line-art style */}
    <path d="M29 38 C 29 20, 42 16, 50 16 C 58 16, 71 20, 71 38 C 68 25, 50 24, 29 38" fill="#2E1D11" />
    <path d="M29 38 C 28 42, 29 46, 30 49" stroke="#2E1D11" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M71 38 C 72 42, 71 46, 70 49" stroke="#2E1D11" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    
    {/* Eyes */}
    <circle cx="43" cy="40" r="3" fill="#1C110A" />
    <circle cx="57" cy="40" r="3" fill="#1C110A" />
    <circle cx="44.5" cy="38.5" r="1" fill="#FFFFFF" />
    <circle cx="58.5" cy="38.5" r="1" fill="#FFFFFF" />
    
    {/* Smile */}
    <path d="M44 49 C 47 53, 53 53, 56 49" stroke="#A6583C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    
    {/* Blush */}
    <circle cx="35" cy="46" r="4" fill="#FF8080" opacity="0.22" />
    <circle cx="65" cy="46" r="4" fill="#FF8080" opacity="0.22" />
    
    {/* Ear decoration (little leaf) */}
    <g transform="translate(68,26) rotate(32,4,4)">
      <path d="M4 12 C4 12 0 8 0.2 4 C0.5 1.5 2 0 4 0 C6 0 7.5 1.5 7.8 4 C8 8 4 12 4 12Z" fill="#3AA38F" />
      <path d="M4 10 L4 1" stroke="#E8F5F2" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  </svg>
);

const FemaleAvatar: React.FC = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="50" r="48" fill="#FEEFF5" />
    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(190,24,93,0.06)" strokeWidth="3" />
    
    {/* Hair Back */}
    <path d="M26 40 C 22 55, 23 72, 27 82 M74 40 C 78 55, 77 72, 73 82" stroke="#4A231C" strokeWidth="8" strokeLinecap="round" fill="none" />
    
    {/* Shoulders */}
    <path d="M22 88 C 22 72, 32 64, 50 64 C 68 64, 78 72, 78 88" fill="#FCAEC7" />
    <path d="M38 68 L50 63 L62 68" stroke="#E289A8" strokeWidth="2" fill="none" strokeLinecap="round" />
    
    {/* Neck */}
    <rect x="44" y="52" width="12" height="15" fill="#FED8B1" />
    
    {/* Face */}
    <circle cx="50" cy="40" r="21" fill="#FFE5CC" />
    
    {/* Hair Front */}
    <path d="M27 38 C 27 18, 43 14, 50 14 C 57 14, 73 18, 73 38 C 71 23, 50 21, 27 38" fill="#4A231C" />
    <path d="M28 38 C 25 45, 26 54, 27 60" stroke="#4A231C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M72 38 C 75 45, 74 54, 73 60" stroke="#4A231C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    
    {/* Eyes with Lashes */}
    <circle cx="43" cy="40" r="3" fill="#1C110A" />
    <circle cx="57" cy="40" r="3" fill="#1C110A" />
    <circle cx="44.5" cy="38.5" r="1" fill="#FFFFFF" />
    <circle cx="58.5" cy="38.5" r="1" fill="#FFFFFF" />
    <path d="M39 37.5 C 41 36, 42.5 36.5, 43.5 37" stroke="#1A0F0A" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    <path d="M61 37.5 C 59 36, 57.5 36.5, 56.5 37" stroke="#1A0F0A" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    
    {/* Smile */}
    <path d="M44 49 C 47 53, 53 53, 56 49" stroke="#C0688A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    
    {/* Blush */}
    <circle cx="35" cy="46" r="4.5" fill="#FF6699" opacity="0.22" />
    <circle cx="65" cy="46" r="4.5" fill="#FF6699" opacity="0.22" />
    
    {/* Cute Flower Pin */}
    <g transform="translate(68,22)">
      <circle cx="0" cy="0" r="3.5" fill="#BE185D" />
      <circle cx="-3" cy="-3" r="2.2" fill="#FEF0F5" />
      <circle cx="3" cy="-3" r="2.2" fill="#FEF0F5" />
      <circle cx="-3" cy="3" r="2.2" fill="#FEF0F5" />
      <circle cx="3" cy="3" r="2.2" fill="#FEF0F5" />
    </g>
  </svg>
);

const NeutralAvatar: React.FC = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <circle cx="50" cy="50" r="48" fill="#EEF2F6" />
    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(71,85,105,0.06)" strokeWidth="3" />
    
    {/* Shoulders */}
    <path d="M22 88 C 22 72, 32 64, 50 64 C 68 64, 78 72, 78 88" fill="#94A3B8" />
    <path d="M38 68 L50 62 L62 68" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round" />
    
    {/* Neck */}
    <rect x="44" y="52" width="12" height="15" fill="#FED8B1" />
    
    {/* Face */}
    <circle cx="50" cy="40" r="21" fill="#FFE5CC" />
    
    {/* Hair - Stylized Wavy Cut */}
    <path d="M29 38 C 29 19, 44 15, 50 15 C 56 15, 71 19, 71 38 C 66 22, 50 22, 29 38" fill="#334155" />
    <path d="M28 38 Q 24 45, 27 52" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M72 38 Q 76 45, 73 52" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
    
    {/* Eyes */}
    <circle cx="43" cy="40" r="3" fill="#1C110A" />
    <circle cx="57" cy="40" r="3" fill="#1C110A" />
    <circle cx="44.5" cy="38.5" r="1" fill="#FFFFFF" />
    <circle cx="58.5" cy="38.5" r="1" fill="#FFFFFF" />
    
    {/* Smile */}
    <path d="M44 49 C 47 53, 53 53, 56 49" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    
    {/* Blush */}
    <circle cx="35" cy="46" r="4.2" fill="#64748B" opacity="0.15" />
    <circle cx="65" cy="46" r="4.2" fill="#64748B" opacity="0.15" />
  </svg>
);

const GenderAvatar: React.FC<{ gender?: string | null }> = ({ gender }) => {
  const g = gender?.toLowerCase() ?? '';
  if (g === 'female') return <FemaleAvatar />;
  if (g === 'male')   return <MaleAvatar />;
  return <NeutralAvatar />;
};

/* ─────────────────────────────────────────────────────────────────────────────
   BADGE DATA & COMPONENT
───────────────────────────────────────────────────────────────────────────── */
interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  category: string;
  color: string;
  check: (stats: { streak: number; journals: number; emotions: number; words: number; memberDays: number }) => boolean;
}

const ALL_BADGES: BadgeDef[] = [
  // Emotional Growth
  { id:'seed',        emoji:'🌱', name:'Emotion Seed',        desc:'Started your emotional journey',        category:'Growth',    color:'#22C55E', check: s => s.journals >= 1 },
  { id:'explorer',    emoji:'🔍', name:'Self-Aware Explorer', desc:'Completed first emotional check-in',    category:'Growth',    color:'#10B981', check: s => s.journals >= 1 },
  { id:'detective',   emoji:'💡', name:'Emotion Detective',   desc:'Identified emotions for 7 days in a row', category:'Growth', color:'#F59E0B', check: s => s.streak >= 7 },
  { id:'expressor',   emoji:'❤️', name:'Emotion Expressor',  desc:'Shared feelings openly in journals',    category:'Growth',    color:'#EF4444', check: s => s.journals >= 7 },
  { id:'regulator',   emoji:'🌊', name:'Emotional Regulator', desc:'Practiced coping strategies consistently', category:'Growth',   color:'#3B82F6', check: s => s.journals >= 20 },
  { id:'mindful',     emoji:'🧠', name:'Mindful Thinker',    desc:'Completed mindfulness activities',       category:'Growth',   color:'#8B5CF6', check: s => s.emotions >= 10 },
  { id:'resilience',  emoji:'🌈', name:'Resilience Builder', desc:'Recovered from difficult emotional periods', category:'Growth',  color:'#EC4899', check: s => s.journals >= 50 },
  // Streak Badges
  { id:'s3',   emoji:'🔥', name:'3-Day Streak',          desc:'3 days in a row',           category:'Streak', color:'#F97316', check: s => s.streak >= 3 },
  { id:'s7',   emoji:'🔥', name:'7-Day Streak',          desc:'One whole week strong!',    category:'Streak', color:'#EF4444', check: s => s.streak >= 7 },
  { id:'s30',  emoji:'🔥', name:'30-Day Streak',         desc:'A month of growth!',        category:'Streak', color:'#DC2626', check: s => s.streak >= 30 },
  { id:'s100', emoji:'🔥', name:'100-Day Streak',        desc:'Legendary consistency!',    category:'Streak', color:'#991B1B', check: s => s.streak >= 100 },
  // Learning
  { id:'beginner',    emoji:'📚', name:'Literacy Beginner',  desc:'5 saved words',          category:'Learning', color:'#6366F1', check: s => s.words >= 5 },
  { id:'intermediate',emoji:'📖', name:'Literacy Intermediate', desc:'15 saved words',     category:'Learning', color:'#4F46E5', check: s => s.words >= 15 },
  { id:'curious',     emoji:'🔎', name:'Curious Learner',    desc:'Saved your first word', category:'Learning', color:'#7C3AED', check: s => s.words >= 1 },
  // Hidden
  { id:'nightowl',  emoji:'🦉', name:'Night Owl',          desc:'Journal after midnight', category:'Hidden',  color:'#1E1B4B', check: () => false },
  { id:'sunrise',   emoji:'🌅', name:'Sunrise Reflector',  desc:'Journal before 6am',    category:'Hidden',  color:'#F59E0B', check: () => false },
  { id:'bounceback',emoji:'💪', name:'Bounce Back',        desc:'Return after a break',   category:'Hidden',  color:'#059669', check: () => false },
  // Founder
  { id:'sprout',    emoji:'🌿', name:'Growth Sprout',      desc:'Member for 30+ days',    category:'Founder', color:'#16A34A', check: s => s.memberDays >= 30 },
  { id:'tree',      emoji:'🌳', name:'Emotion Tree',       desc:'Member for 90+ days',    category:'Founder', color:'#15803D', check: s => s.memberDays >= 90 },
  { id:'light',     emoji:'🌟', name:'Inner Light',        desc:'Member for 180+ days',   category:'Founder', color:'#CA8A04', check: s => s.memberDays >= 180 },
  { id:'founding',  emoji:'👑', name:'Founding Member',   desc:'Early Emolit supporter', category:'Special', color:'#B45309', check: s => s.memberDays >= 1 },
];

const LEVELS = [
  { min: 0,  max: 1,  label: 'Seed',              emoji: '🌱', color: '#22C55E' },
  { min: 2,  max: 4,  label: 'Sprout',             emoji: '🌿', color: '#10B981' },
  { min: 5,  max: 8,  label: 'Bloom',              emoji: '🌼', color: '#F59E0B' },
  { min: 9,  max: 13, label: 'Flourish',           emoji: '🌳', color: '#059669' },
  { min: 14, max: 18, label: 'Guide',              emoji: '🌟', color: '#CA8A04' },
  { min: 19, max: 23, label: 'Mentor',             emoji: '💙', color: '#3B82F6' },
  { min: 24, max: 99, label: 'Emotional Luminary', emoji: '👑', color: '#7C3AED' },
];

const BadgeCard: React.FC<{ badge: BadgeDef; earned: boolean; delay?: number }> = ({ badge, earned, delay = 0 }) => {
  const [tap, setTap] = useState(false);
  return (
    <motion.div
      {...pop(delay)}
      whileTap={{ scale: 0.93 }}
      onClick={() => setTap(t => !t)}
      style={{
        flexShrink: 0, width: 88, borderRadius: 20,
        background: earned ? D.card : '#F8FAF9',
        border: earned ? `1.5px solid ${badge.color}30` : `1.5px solid ${D.border}`,
        padding: '14px 8px 12px',
        textAlign: 'center',
        boxShadow: earned ? `0 4px 20px ${badge.color}25` : 'none',
        cursor: 'pointer', position: 'relative',
        opacity: earned ? 1 : 0.45,
      }}
    >
      {/* Earned glow */}
      {earned && (
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 20,
            background: `radial-gradient(circle at 50% 30%, ${badge.color}15, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <motion.div
        animate={earned ? { y: [0, -3, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2.8, delay: delay * 0.5, ease: 'easeInOut' }}
        style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}
      >
        {earned ? badge.emoji : '🔒'}
      </motion.div>

      <p style={{ fontSize: 9.5, fontWeight: 700, color: earned ? D.text : D.textDim, lineHeight: 1.3, margin: 0 }}>
        {badge.name}
      </p>

      {/* Tooltip on tap */}
      <AnimatePresence>
        {tap && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            style={{
              position: 'absolute', bottom: '105%', left: '50%', transform: 'translateX(-50%)',
              background: D.text, color: '#fff',
              fontSize: 10, fontWeight: 600, borderRadius: 10,
              padding: '6px 10px', whiteSpace: 'nowrap', zIndex: 10,
              maxWidth: 160, textAlign: 'center', lineHeight: 1.4,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            {earned ? `✅ ${badge.desc}` : `🔒 ${badge.desc}`}
            <div style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderTop: `5px solid ${D.text}`,
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   FEEDBACK MODAL — 4-step joyful experience (Portalled to prevent collision)
───────────────────────────────────────────────────────────────────────────── */
const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0); // 0=welcome, 1=q1, 2=q2, 3=done
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!q1.trim()) { toast.error('Please answer the first question 💚'); return; }
    if (!q2.trim()) { toast.error('Please answer the second question 💚'); return; }
    setSaving(true);
    try {
      await emotionAPI.submitFeedback({ q1: q1.trim(), q2: q2.trim() });
      setStep(3);
    } catch (err) {
      toast.error('Failed to submit feedback. Saving locally.');
      // Persist locally as fallback
      const prev = JSON.parse(localStorage.getItem('emolit_feedback') || '[]');
      localStorage.setItem('emolit_feedback', JSON.stringify([...prev, { q1: q1.trim(), q2: q2.trim(), submittedAt: new Date().toISOString() }]));
      setStep(3);
    } finally {
      setSaving(false);
    }
  };

  const ta: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: D.bg, border: `1.5px solid ${D.border}`,
    borderRadius: 16, padding: '14px 16px',
    fontSize: 14, color: D.text, fontFamily: "'Poppins', sans-serif",
    outline: 'none', resize: 'none', lineHeight: 1.6, minHeight: 120,
  };

  const steps = [
    /* ── Step 0: Welcome ── */
    <motion.div key="s0" {...fd(0, 20)} style={{ textAlign: 'center', padding: '8px 0 12px' }}>
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{ fontSize: 56, lineHeight: 1, marginBottom: 18 }}
      >💚</motion.div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
        Your voice matters!
      </h2>
      <p style={{ fontSize: 14, color: D.textSub, lineHeight: 1.6, margin: '0 0 28px' }}>
        We have <strong style={{ color: D.mintDark }}>2 quick questions</strong> that will<br />
        genuinely help us make Emolit better for you 🌱
      </p>
      <p style={{ fontSize: 11, color: D.textDim, margin: '0 0 24px' }}>Takes less than 2 minutes</p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setStep(1)}
        style={{
          width: '100%', padding: '15px',
          background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`,
          border: 'none', borderRadius: 18,
          fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
          boxShadow: `0 8px 28px ${D.mintMed}50`,
        }}
      >Let's Go! 🚀</motion.button>
    </motion.div>,

    /* ── Step 1: Question 1 ── */
    <motion.div key="s1" {...fd(0, 20)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>😤</div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: D.mintMed, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Question 1 of 2</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '2px 0 0', lineHeight: 1.35 }}>
            What was the most frustrating, confusing, or disappointing part of your experience?
          </p>
        </div>
      </div>
      <textarea
        style={ta}
        value={q1}
        onChange={e => setQ1(e.target.value)}
        placeholder="Be honest — your frustration is our roadmap. Even small things matter 💛"
        rows={5}
      />
      <p style={{ fontSize: 11, color: D.textDim, margin: '6px 0 20px', textAlign: 'right' }}>{q1.length}/500</p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => q1.trim() ? setStep(2) : toast.error('Please share your thoughts 💚')}
        style={{
          width: '100%', padding: '14px',
          background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`,
          border: 'none', borderRadius: 16,
          fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
          boxShadow: `0 6px 20px ${D.mintMed}40`,
        }}
      >Next Question →</motion.button>
    </motion.div>,

    /* ── Step 2: Question 2 ── */
    <motion.div key="s2" {...fd(0, 20)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✨</div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: D.mintMed, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Question 2 of 2</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: '2px 0 0', lineHeight: 1.35 }}>
            If you could change or add one thing that would make Emolit genuinely valuable in your daily life, what would it be?
          </p>
        </div>
      </div>
      <textarea
        style={ta}
        value={q2}
        onChange={e => setQ2(e.target.value)}
        placeholder="Dream big! Your idea might be in the next update 🚀"
        rows={5}
      />
      <p style={{ fontSize: 11, color: D.textDim, margin: '6px 0 20px', textAlign: 'right' }}>{q2.length}/500</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)} style={{
          flex: 0.4, padding: '14px', background: D.bg,
          border: `1.5px solid ${D.border}`, borderRadius: 16,
          fontSize: 13, fontWeight: 600, color: D.textSub, cursor: 'pointer',
        }}>← Back</motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
          style={{
            flex: 1, padding: '14px',
            background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`,
            border: 'none', borderRadius: 16,
            fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 6px 20px ${D.mintMed}40`,
          }}
        >
          {saving
            ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />
            : <><Check size={16} weight="bold" /> Send Feedback</>
          }
        </motion.button>
      </div>
    </motion.div>,

    /* ── Step 3: Thank you ── */
    <motion.div key="s3" {...fd(0, 20)} style={{ textAlign: 'center', padding: '16px 0' }}>
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        style={{ fontSize: 64, lineHeight: 1, marginBottom: 18 }}
      >🎉</motion.div>
      <motion.div {...fd(0.15)}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: D.text, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
          Thank you, truly! 💚
        </h2>
        <p style={{ fontSize: 14, color: D.textSub, lineHeight: 1.65, margin: '0 0 8px' }}>
          Your feedback is golden. It will directly shape<br />
          the future of Emolit for you and thousands of others.
        </p>
        <p style={{ fontSize: 13, color: D.mintDark, fontWeight: 600, margin: '0 0 28px' }}>
          🌱 You just helped someone grow.
        </p>
      </motion.div>
      <motion.button
        {...pop(0.3)} whileTap={{ scale: 0.97 }} onClick={onClose}
        style={{
          width: '100%', padding: '15px',
          background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`,
          border: 'none', borderRadius: 18,
          fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}
      >Back to Profile</motion.button>
    </motion.div>,
  ];

  // Progress dots
  const progressDots = [0, 1, 2].map(i => (
    <div key={i} style={{
      width: step === 3 ? 8 : (i <= step ? 20 : 8), height: 8, borderRadius: 99,
      background: step === 3 ? D.mintMed : (i <= step ? D.mintMed : D.border),
      transition: 'all 0.3s ease',
    }} />
  ));

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,30,20,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480,
            background: D.card, borderRadius: '28px 28px 0 0',
            padding: '24px 24px 48px', maxHeight: '90vh', overflowY: 'auto',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 44, height: 4, borderRadius: 99, background: D.border }} />
          </div>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {step < 3 ? progressDots : <span style={{ fontSize: 12, color: D.mintMed, fontWeight: 600 }}>Completed 🎉</span>}
            </div>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, border: 'none',
              background: D.bg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} color={D.textSub} />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {steps[step]}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELP MODAL — Tabbed support ticketing system (Portalled to prevent collision)
───────────────────────────────────────────────────────────────────────────── */
const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'faq' | 'support'>('faq');
  const [open, setOpen] = useState<number | null>(null);

  // Form Fields
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const faqs = [
    { q: 'How does the emotion check-in work?', a: 'Write freely in the journal and we detect your emotions using AI. Your responses are private and secure.' },
    { q: 'Can I delete my data?', a: 'Yes — go to Settings > Privacy and request a full account and data deletion.' },
    { q: 'How is my streak calculated?', a: 'Your streak increases by 1 for each consecutive day you complete at least one journal entry.' },
    { q: 'What are Words Saved?', a: 'Emotion words you\'ve bookmarked from the Explore tab to revisit and learn from.' },
    { q: 'Is my journal private?', a: 'Yes. Your journal entries are stored securely and are never shared or sold.' },
  ];

  const handleSupportSubmit = async () => {
    if (!category) return toast.error('Please choose a category');
    if (!subject.trim()) return toast.error('Please enter a subject');
    if (!message.trim()) return toast.error('Please enter your query');

    setSubmitting(true);
    try {
      await emotionAPI.submitSupport({ category, subject: subject.trim(), message: message.trim() });
      setSuccess(true);
      toast.success('Query sent successfully 💚');
    } catch {
      toast.error('Could not submit query. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: D.bg, border: `1.5px solid ${D.border}`, borderRadius: 14, padding: '13px 16px',
    fontSize: 14, fontWeight: 500, color: D.text, outline: 'none', fontFamily: "'Poppins', sans-serif",
    marginBottom: 14,
  };

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,30,20,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480,
            background: D.card, borderRadius: '28px 28px 0 0',
            padding: '24px 24px 48px', maxHeight: '85vh', overflowY: 'auto',
          }}
        >
          {/* Drag Handle */}
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <div style={{ width: 44, height: 4, borderRadius: 99, background: D.border, display: 'inline-block', marginBottom: 20 }} />
          </div>

          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.03em' }}>Support & Info</h2>
              <p style={{ fontSize: 12, color: D.textSub, margin: '3px 0 0' }}>We are always here to help you</p>
            </div>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, border: 'none',
              background: D.bg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} color={D.textSub} />
            </motion.button>
          </div>

          {/* Tab Selection */}
          {!success && (
            <div style={{ display: 'flex', background: D.bg, borderRadius: 14, padding: '4px', marginBottom: 20 }}>
              <button
                onClick={() => setTab('faq')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: tab === 'faq' ? D.card : 'transparent',
                  color: tab === 'faq' ? D.mintDark : D.textSub,
                  transition: 'all 0.25s ease',
                }}
              >📖 FAQs</button>
              <button
                onClick={() => setTab('support')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: tab === 'support' ? D.card : 'transparent',
                  color: tab === 'support' ? D.mintDark : D.textSub,
                  transition: 'all 0.25s ease',
                }}
              >✉️ Write to Us</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" {...fd(0, 10)} style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🚀</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: D.text, margin: '0 0 8px' }}>Query Submitted!</h3>
                <p style={{ fontSize: 13, color: D.textSub, lineHeight: 1.6, margin: '0 0 24px' }}>
                  Our team has received your support request.<br />
                  We will reply to your registered email address soon.
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '14px',
                    background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`,
                    border: 'none', borderRadius: 16,
                    fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                  }}
                >Close Help Center</motion.button>
              </motion.div>
            ) : tab === 'faq' ? (
              <motion.div key="faq" {...fd(0, 10)}>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ borderBottom: `1px solid ${D.border}` }}>
                    <motion.div
                      whileTap={{ scale: 0.995 }}
                      onClick={() => setOpen(open === i ? null : i)}
                      style={{
                        padding: '14px 0',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: D.text, margin: 0, lineHeight: 1.4 }}>{faq.q}</p>
                      <motion.div animate={{ rotate: open === i ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <CaretRight size={14} color={D.textDim} weight="bold" />
                      </motion.div>
                    </motion.div>
                    <AnimatePresence>
                      {open === i && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          style={{ fontSize: 13, color: D.textSub, lineHeight: 1.6, margin: 0, overflow: 'hidden', paddingBottom: 14 }}
                        >{faq.a}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                <div style={{ marginTop: 24, padding: '16px', background: D.bg, borderRadius: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: D.textSub, margin: '0 0 4px', fontWeight: 500 }}>Still have questions?</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: D.mintDark, margin: 0 }}>emolit.app@gmail.com 💌</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="support" {...fd(0, 10)}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: D.mintDark, marginBottom: 6 }}>Category</label>
                <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select Category...</option>
                  <option value="App Bug">App Bug / Issue 🐛</option>
                  <option value="Feature Request">Feature Request 💡</option>
                  <option value="Account Privacy">Account & Privacy 🔒</option>
                  <option value="General Query">General Question ❓</option>
                </select>

                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: D.mintDark, marginBottom: 6 }}>Subject</label>
                <input type="text" style={inp} placeholder="Summary of your query" value={subject} onChange={e => setSubject(e.target.value)} />

                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: D.mintDark, marginBottom: 6 }}>Detailed Message</label>
                <textarea
                  style={{ ...inp, minHeight: 100, resize: 'none', lineHeight: 1.5 }}
                  placeholder="Tell us details so we can fix it or reply accurately..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />

                <motion.button
                  whileTap={{ scale: 0.97 }} onClick={handleSupportSubmit} disabled={submitting}
                  style={{
                    width: '100%', padding: '15px',
                    background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`,
                    border: 'none', borderRadius: 18,
                    fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: `0 8px 28px ${D.mintMed}40`,
                  }}
                >
                  {submitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                      style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />
                  ) : (
                    'Submit Ticket 🚀'
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   EDIT PROFILE SHEET (Portalled to prevent collision)
───────────────────────────────────────────────────────────────────────────── */
const EditSheet: React.FC<{ profile: UserProfile | null; onClose: () => void; onSaved: () => void }> = ({ profile, onClose, onSaved }) => {
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    dob: profile?.dob ?? '',
    gender: profile?.gender ?? '',
    role: profile?.role ?? '',
    country: profile?.country ?? '',
    state: profile?.state ?? '',
    native_language: profile?.native_language ?? '',
  });
  const [saving, setSaving] = useState(false);

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: D.bg, border: `1.5px solid ${D.border}`, borderRadius: 14, padding: '13px 16px',
    fontSize: 14, fontWeight: 500, color: D.text, outline: 'none', fontFamily: "'Poppins', sans-serif",
    marginBottom: 14,
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) return toast.error('Name is required');
    if (!form.dob) return toast.error('Date of birth is required');
    setSaving(true);
    try {
      await emotionAPI.updateUserProfile(form as any);
      toast.success('Profile updated ✨');
      onSaved();
    }
    catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,30,20,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 480, background: D.card, borderRadius: '28px 28px 0 0', padding: '24px 24px 48px', maxHeight: '88vh', overflowY: 'auto' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 44, height: 4, borderRadius: 99, background: D.border, display: 'inline-block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: 0 }}>Edit Profile</h2>
              <p style={{ fontSize: 12, color: D.textSub, margin: '3px 0 0' }}>Update your personal info</p>
            </div>
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: D.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color={D.textSub} />
            </motion.button>
          </div>

          {[
            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Your full name' },
            { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: D.mintDark, marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} style={inp} value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}

          {[
            { label: 'Gender', key: 'gender', opts: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
            { label: 'Role', key: 'role', opts: ['Student', 'Working Professional', 'Other'] },
            { label: 'Country', key: 'country', opts: ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Singapore', 'UAE', 'Other'] },
            { label: 'Native Language', key: 'native_language', opts: ['Tamil', 'Telugu', 'Hindi', 'Kannada', 'Malayalam', 'Bengali', 'English', 'Spanish', 'French', 'German', 'Arabic', 'Mandarin', 'Other'] },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: D.mintDark, marginBottom: 6 }}>{f.label}</label>
              <select style={inp} value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}>
                <option value="">Select...</option>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '15px', background: `linear-gradient(135deg, ${D.mintMed}, ${D.mintDark})`, border: 'none', borderRadius: 18, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 28px ${D.mintMed}50` }}>
            {saving
              ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }} style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />
              : <><Check size={18} weight="bold" /> Save Changes</>
            }
          </motion.button>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   LOGOUT DIALOG (Portalled to prevent collision)
───────────────────────────────────────────────────────────────────────────── */
const LogoutDialog: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <ModalPortal>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,30,20,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 320, background: D.card, borderRadius: 28, padding: '32px 24px 28px', textAlign: 'center', boxShadow: '0 24px 72px rgba(0,0,0,0.18)' }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          style={{ fontSize: 44, marginBottom: 16, display: 'inline-block' }}
        >👋</motion.div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: D.text, margin: '0 0 8px', letterSpacing: '-0.03em' }}>Sign Out?</h3>
        <p style={{ fontSize: 13, color: D.textSub, lineHeight: 1.6, margin: '0 0 28px' }}>
          Your stories are safe. Come back anytime 🌿
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onCancel} style={{ flex: 1, padding: '13px', background: D.bg, border: `1.5px solid ${D.border}`, borderRadius: 16, fontSize: 14, fontWeight: 600, color: D.textSub, cursor: 'pointer' }}>Cancel</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #FC8181, #E53E3E)', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 6px 20px rgba(229,62,62,0.3)' }}>Sign Out</motion.button>
        </div>
      </motion.div>
    </motion.div>
  </ModalPortal>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SETTINGS ROW
───────────────────────────────────────────────────────────────────────────── */
const Row: React.FC<{ icon: React.ReactNode; iconBg: string; iconColor: string; title: string; sub: string; onClick?: () => void; danger?: boolean; delay?: number }> = ({
  icon, iconBg, iconColor, title, sub, onClick, danger = false, delay = 0,
}) => (
  <motion.div
    {...fd(delay, 8)}
    whileTap={onClick ? { scale: 0.985, x: 2 } : {}}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', cursor: onClick ? 'pointer' : 'default', borderBottom: `1px solid ${D.border}` }}
  >
    <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {React.cloneElement(icon as any, { size: 18, color: iconColor, weight: 'duotone' })}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: danger ? '#E53E3E' : D.text, margin: 0, lineHeight: 1.3 }}>{title}</p>
      <p style={{ fontSize: 11, color: D.textSub, margin: '2px 0 0', lineHeight: 1.3 }}>{sub}</p>
    </div>
    {onClick && <CaretRight size={14} color={D.textDim} weight="bold" />}
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PROFILE PAGE
═══════════════════════════════════════════════════════════════════════════ */
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [modal, setModal] = useState<'edit' | 'feedback' | 'help' | 'logout' | null>(null);
  const [refKey, setRefKey] = useState(0);

  /* ── Data ── */
  const { data: historyRes } = useQuery({ queryKey: ['journalHistory'], queryFn: () => emotionAPI.getJournalHistory(), staleTime: 60_000 });
  const { data: savedWordsRes } = useQuery({ queryKey: ['savedWords'], queryFn: () => emotionAPI.getSavedWords(), staleTime: 60_000 });
  const { data: profileData } = useQuery({ queryKey: ['userProfile', refKey], queryFn: () => emotionAPI.getUserProfile(), staleTime: 30_000 });

  /* ── Stats ── */
  const entries = useMemo(() => (historyRes as JournalHistoryResponse | undefined)?.entries ?? [], [historyRes]);
  const totalJournals = useMemo(() => entries.filter(e => e.type === 'journal').length, [entries]);
  const streak = useMemo(() => {
    const days = Array.from(new Set(entries.filter(e => e.type === 'journal').map(e => { const d = new Date((e.data as any).created_at); d.setHours(0,0,0,0); return d.getTime(); }))).sort((a,b) => b-a);
    let s = 0, chk = new Date(); chk.setHours(0,0,0,0);
    for (const ts of days) { if ((chk.getTime()-ts)/86_400_000 <= 1) { s++; chk = new Date(ts); } else break; }
    return s;
  }, [entries]);
  const emotionsTracked = useMemo(() => { const u = new Set<string>(); entries.filter(e=>e.type==='journal').forEach(e=>((e.data as any)?.detected_emotions??[]).forEach((em:any)=>em?.word&&u.add(em.word))); return u.size; }, [entries]);
  const wordsSaved = savedWordsRes?.saved_words?.length ?? 0;

  const memberSince = useMemo(() => {
    const oldest = [...entries].sort((a,b)=>new Date((a.data as any).created_at).getTime()-new Date((b.data as any).created_at).getTime())[0];
    const d = oldest ? new Date((oldest.data as any).created_at) : new Date();
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.toLocaleDateString('en-US', { year: '2-digit' });
    return `${month}'${year}`;
  }, [entries]);

  const memberDays = useMemo(() => {
    const oldest = [...entries].sort((a,b)=>new Date((a.data as any).created_at).getTime()-new Date((b.data as any).created_at).getTime())[0];
    if (!oldest) return 0;
    return Math.floor((Date.now()-new Date((oldest.data as any).created_at).getTime())/86_400_000);
  }, [entries]);

  const displayName = profileData?.full_name ?? user?.full_name ?? user?.email?.split('@')[0] ?? 'Friend';
  const firstName = displayName.split(' ')[0];
  const gender = profileData?.gender ?? '';

  /* ── Badges ── */
  const badgeStats = { streak, journals: totalJournals, emotions: emotionsTracked, words: wordsSaved, memberDays };
  const earnedBadges = ALL_BADGES.filter(b => b.check(badgeStats));
  const currentLevel = LEVELS.find(l => earnedBadges.length >= l.min && earnedBadges.length <= l.max) ?? LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];

  const handleLogout = async () => {
    setModal(null);
    try { await logout(); navigate('/login'); } catch { toast.error('Logout failed.'); }
  };

  /* ── Progress cards (reference image exact vector-styled line art icon bindings) ── */
  const progressCards = [
    { value: streak, label: 'Day Streak', sub: 'Keep going!', ...D.p1, icon: <Drop size={20} weight="duotone" /> },
    { value: totalJournals, label: 'Journals', sub: 'Stories captured', ...D.p2, icon: <BookOpen size={20} weight="duotone" /> },
    { value: emotionsTracked, label: 'Emotions Tracked', sub: 'Keep feeling', ...D.p3, icon: <Heart size={20} weight="duotone" /> },
    { value: wordsSaved, label: 'Words Saved', sub: 'Your vibe words', ...D.p4, icon: <PencilLine size={20} weight="duotone" /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: D.bg, fontFamily: "'Poppins', sans-serif", paddingBottom: 120, overflowX: 'hidden' }}>

      {/* ── Sticky Header (matching reference image exactly) ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(245,251,248,0.94)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        padding: '18px 22px 14px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        borderBottom: `1px solid ${D.border}`,
      }}>
        <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: D.mintDark, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>My Profile</h1>
          <p style={{ fontSize: 11, color: D.textSub, margin: '3px 0 0', fontWeight: 400 }}>Your journey matters.</p>
        </motion.div>
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }}
          whileTap={{ scale: 0.88 }}
          style={{ width: 40, height: 40, borderRadius: 14, background: D.card, border: `1.5px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          <Bell size={18} weight="duotone" color={D.mintDark} />
        </motion.div>
      </div>

      <div style={{ padding: '20px 18px 0' }}>

        {/* ── Profile Hero Card (matching reference image EXACTLY) ── */}
        <motion.div
          {...fd(0.05)}
          style={{ background: D.card, borderRadius: 22, padding: '18px', marginBottom: 20, border: `1.5px solid ${D.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar with edit button */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <motion.div
                animate={{ boxShadow: [`0 0 0 0px ${D.mint}80`, `0 0 0 5px ${D.mint}30`, `0 0 0 0px ${D.mint}80`] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                style={{ width: 74, height: 74, borderRadius: '50%', border: `2.5px solid ${D.mint}`, overflow: 'hidden', background: D.mintLight }}
              >
                <GenderAvatar gender={gender} />
              </motion.div>
              {/* Edit pencil */}
              <motion.div
                whileTap={{ scale: 0.85 }}
                onClick={() => setModal('edit')}
                style={{ position: 'absolute', bottom: 0, right: -2, width: 24, height: 24, borderRadius: '50%', background: D.mintMed, border: `2px solid ${D.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <NotePencil size={11} color="#fff" weight="fill" />
              </motion.div>
            </div>

            {/* Name + tagline */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <p style={{ fontSize: 17, fontWeight: 800, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>Hi, {firstName}</p>
                <motion.span
                  animate={{ rotate: [0, 20, -10, 20, 0], scale:[1,1.2,1] }}
                  transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.9, ease: 'easeInOut' }}
                  style={{ fontSize: 18, display: 'inline-block', transformOrigin: '70% 80%' }}
                >👋</motion.span>
              </div>
              <p style={{ fontSize: 11, color: D.textSub, margin: 0, fontWeight: 400, lineHeight: 1.4 }}>Keep showing up for yourself.</p>
            </div>
          </div>

          {/* Stat badges row (inside card, below avatar+name, premium icons) */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'space-between' }}>
            {[
              { icon: <Flame size={18} weight="duotone" color="#FC8181" />, label: 'Streak', value: `${streak} Day${streak !== 1?'s':''}` },
              { icon: <BookOpen size={18} weight="duotone" color="#7F9CF5" />, label: 'Entries', value: String(totalJournals) },
              { icon: <Leaf size={18} weight="duotone" color="#48BB78" />, label: 'Member', value: `Since ${memberSince}` },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...pop(0.12 + i * 0.07)}
                style={{ flex: 1, background: D.bg, borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <span style={{ display: 'block', marginBottom: 4 }}>{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: D.text, display: 'block', lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 9, color: D.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, display: 'block' }}>{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Your Progress (matching reference image) ── */}
        <motion.div {...fd(0.15)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  style={{ fontSize: 15 }}
                >🌿</motion.span>
                <p style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: 0 }}>Your Progress</p>
              </div>
              <p style={{ fontSize: 11, color: D.textSub, margin: '2px 0 0 22px' }}>See your growth and consistency.</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.94 }} onClick={() => navigate('/calendar')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: D.mintMed, cursor: 'pointer' }}
            >
              View Details <CaretRight size={13} weight="bold" />
            </motion.button>
          </div>

          {/* 2×2 Grid — EXACT reference image styling with premium Phosphor Icons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            {progressCards.map((c, i) => (
              <motion.div
                key={c.label}
                {...pop(0.18 + i * 0.07)}
                whileTap={{ scale: 0.97 }}
                style={{ borderRadius: 20, background: c.bg, padding: '18px 14px 16px', border: `1px solid ${c.bg}`, boxShadow: '0 2px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}
              >
                {/* Icon circle (matching reference) */}
                <div style={{ width: 36, height: 36, borderRadius: 12, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  {React.cloneElement(c.icon, { color: c.iconColor })}
                </div>
                <p style={{ fontSize: 32, fontWeight: 900, color: D.text, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
                  <Num v={c.value} />
                </p>
                <p style={{ fontSize: 12, fontWeight: 700, color: D.text, margin: '6px 0 2px' }}>{c.label}</p>
                <p style={{ fontSize: 10, color: c.text, margin: 0, fontWeight: 600 }}>{c.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Badges Section ── */}
        <motion.div {...fd(0.28)} style={{ marginBottom: 22 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>🏆</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: 0 }}>Your Badges</p>
              </div>
              <p style={{ fontSize: 11, color: D.textSub, margin: '2px 0 0 22px' }}>{earnedBadges.length} of {ALL_BADGES.length} earned</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 16 }}>{currentLevel.emoji}</span>
              <p style={{ fontSize: 10, fontWeight: 800, color: currentLevel.color, margin: 0 }}>{currentLevel.label}</p>
            </div>
          </div>

          {/* Level progress bar */}
          {nextLevel && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: D.textSub, fontWeight: 600 }}>{currentLevel.emoji} {currentLevel.label}</span>
                <span style={{ fontSize: 10, color: D.textDim }}>{nextLevel.emoji} {nextLevel.label} at {nextLevel.min}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: D.border, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((earnedBadges.length - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)}%` }}
                  transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})` }}
                />
              </div>
            </div>
          )}

          {/* Horizontal scroll badges */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {ALL_BADGES.map((badge, i) => (
              <BadgeCard key={badge.id} badge={badge} earned={badge.check(badgeStats)} delay={0.3 + i * 0.03} />
            ))}
          </div>
        </motion.div>

        {/* ── Tools & Settings (matching reference image) ── */}
        <motion.div {...fd(0.36)} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 17 }}>⚙️</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: 0 }}>Tools & Settings</p>
              <p style={{ fontSize: 11, color: D.textSub, margin: '1px 0 0' }}>Customize your experience.</p>
            </div>
          </div>

          <div style={{ background: D.card, borderRadius: 22, padding: '4px 18px', border: `1.5px solid ${D.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Row delay={0.38} icon={<BellSimple />} iconBg="#F3F0FF" iconColor="#7C3AED" title="Reminders" sub="Set daily reminders for your check-ins" onClick={() => toast('🔔 Reminders — coming soon!')} />
            <Row delay={0.41} icon={<Lock />} iconBg="#FFF0F6" iconColor="#BE185D" title="Privacy" sub="Manage your data and privacy settings" onClick={() => toast('🔒 Privacy — coming soon!')} />
            <Row delay={0.44} icon={<Palette />} iconBg="#FFF8E7" iconColor="#D97706" title="Themes" sub="Choose your favorite color theme" onClick={() => toast('🎨 Themes — coming soon!')} />
            <Row delay={0.47} icon={<Lifebuoy />} iconBg="#F0F9FF" iconColor="#0EA5E9" title="Help" sub="FAQs and ticketing support" onClick={() => setModal('help')} />
            <Row delay={0.50} icon={<ChatCircleDots />} iconBg="#F0FDF4" iconColor="#16A34A" title="Feedback" sub="Tell us how to make Emolit better" onClick={() => setModal('feedback')} />
            <div style={{ borderBottom: 'none' }}>
              <Row delay={0.53} icon={<SignOut />} iconBg="#FFF5F5" iconColor="#E53E3E" title="Sign Out" sub="See you soon 👋" onClick={() => setModal('logout')} danger />
            </div>
          </div>
        </motion.div>

        {/* ── Motivational Banner (matching reference image) ── */}
        <motion.div
          {...fd(0.55)}
          style={{
            background: D.mintLight,
            borderRadius: 24, padding: '22px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: `1.5px solid ${D.mint}60`,
            boxShadow: `0 4px 20px ${D.mint}40`,
            marginBottom: 14, overflow: 'hidden', position: 'relative',
          }}
        >
          {/* Left leaf */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{ fontSize: 24, marginRight: 14, flexShrink: 0 }}
          >🌿</motion.div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: D.mintDark, margin: 0, lineHeight: 1.35, letterSpacing: '-0.02em' }}>
              You're doing better<br />than you think.
            </p>
            <p style={{ fontSize: 12, color: D.mintMed, margin: '6px 0 0', fontWeight: 500 }}>
              Keep growing 🌱
            </p>
          </div>

          {/* Right plant illustration */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            style={{ flexShrink: 0 }}
          >
            <svg width="64" height="70" viewBox="0 0 64 70" fill="none">
              {/* Pot */}
              <path d="M18 54 L16 66 Q16 68 18 68 L46 68 Q48 68 48 66 L46 54Z" fill="#C4956A" />
              <rect x="14" y="50" width="36" height="6" rx="3" fill="#B8834E" />
              {/* Soil */}
              <ellipse cx="32" cy="50" rx="18" ry="4" fill="#6B4226" opacity="0.5" />
              {/* Main stem */}
              <path d="M32 50 Q32 35 32 18" stroke="#4DB896" strokeWidth="2.5" strokeLinecap="round" />
              {/* Left leaf */}
              <path d="M32 38 Q20 30 18 20 Q24 26 32 30 Q28 34 32 38Z" fill="#A8E6CF" />
              {/* Right leaf */}
              <path d="M32 32 Q44 24 46 14 Q40 20 32 24 Q36 28 32 32Z" fill="#7ED9B6" />
              {/* Pink flower */}
              <circle cx="32" cy="15" r="7" fill="#F9B4D0" />
              <circle cx="32" cy="15" r="3" fill="#FDEAF1" />
              {/* Small pink leaf */}
              <path d="M44 40 Q54 32 56 22 Q50 30 44 34Z" fill="#F7C6D9" opacity="0.85" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', fontSize: 11, color: D.textDim, fontWeight: 500, paddingTop: 4 }}
        >
          Emolit v1.0 · Made with 💚
        </motion.p>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal === 'edit' && <EditSheet profile={profileData ?? null} onClose={() => setModal(null)} onSaved={() => { setModal(null); setRefKey(k => k + 1); }} />}
        {modal === 'feedback' && <FeedbackModal onClose={() => setModal(null)} />}
        {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
        {modal === 'logout' && <LogoutDialog onConfirm={handleLogout} onCancel={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
