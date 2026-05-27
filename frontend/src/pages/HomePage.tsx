import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { emotionAPI, JournalHistoryResponse } from '../services/api';
import { Bell, Sparkle, PenNib, Compass, CalendarBlank, Flame, ArrowRight, BookOpen } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { JourneyOnboarding } from '../components/JourneyOnboarding';
import CheckInLoader from '../components/CheckInLoader';

// Load Playfair Display for the brand logo
const playfairLink = document.createElement('link');
playfairLink.rel = 'stylesheet';
playfairLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap';
if (!document.head.querySelector('[href*="Playfair"]')) document.head.appendChild(playfairLink);



// ── Emolit Official Design Tokens (60-30-10 rule) ─────────────────────────────
// 60% → Background: #FAFAFA / Cards: #FFFFFF
// 30% → Primary Mint: #A8E6CF / Active: #7ED9B6 / Deep: #3AA38F / Dark: #2F8F83
// 10% → Accent Pink: #F7C6D9 (used very sparingly)
const D = {
  bg:        '#FAFAFA',   // primary background
  bgSecond:  '#F1FBF7',   // secondary background (mint tint)
  card:      '#FFFFFF',   // card background
  border:    '#EAEAEA',   // divider / border
  mint:      '#A8E6CF',   // primary mint
  mintActive:'#7ED9B6',   // hover/active
  mintDeep:  '#3AA38F',   // deep variant
  mintDark:  '#2F8F83',   // CTA text / dark variant
  text:      '#2E2E2E',   // primary text
  textSub:   '#6B6B6B',   // secondary text
  textDim:   '#BDBDBD',   // disabled / placeholder
  pink:      '#F7C6D9',   // accent — use sparingly
  pinkSubtle:'#FDEAF1',
};

// ── helpers ───────────────────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
};

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.45, ease: [0.22, 1, 0.36, 1] as any },
});

// ─────────────────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [now, setNow] = useState(new Date());
  const [showLoader, setShowLoader] = useState(false);

  const handleCheckIn = () => {
    setShowLoader(true);
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: dailyWord } = useQuery({
    queryKey: ['dailyWord'],
    queryFn: () => emotionAPI.getDailyWord(),
  });
  const { data: historyRes } = useQuery({
    queryKey: ['journalHistory'],
    queryFn: () => emotionAPI.getJournalHistory(),
  });

  const streak = (() => {
    const entries = (historyRes as JournalHistoryResponse | undefined)?.entries ?? [];
    if (!entries.length) return 0;
    let s = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const days  = Array.from(new Set(
      entries.map(e => { const d = new Date(e.data.created_at); d.setHours(0,0,0,0); return d.getTime(); })
    )).sort((a,b) => b - a);
    let chk = today;
    for (const ts of days) {
      const diff = (chk.getTime() - ts) / 86_400_000;
      if (diff <= 1) { s++; chk = new Date(ts); } else break;
    }
    return s;
  })();

  const name       = user?.full_name?.split(' ')[0] ?? 'Friend';
  const word       = (dailyWord as any)?.word       ?? 'Resilience';
  const definition = (dailyWord as any)?.metadata?.definition ?? 'The ability to recover quickly from difficulties.';
  const core       = (dailyWord as any)?.core       ?? 'Strength';
  const totalEntries = (historyRes as JournalHistoryResponse | undefined)?.entries?.length ?? 0;
  const recentEntries = (historyRes as JournalHistoryResponse | undefined)?.entries?.slice(0, 3) ?? [];

  return (
    <div style={{
      minHeight: '100vh',
      background: D.bg,
      fontFamily: "'Poppins', sans-serif",
      paddingBottom: 110,
      overflowX: 'hidden',
    }}>
      <JourneyOnboarding userName={name} />
      {showLoader && <CheckInLoader onComplete={() => { setShowLoader(false); navigate('/journal'); }} />}

      {/* ══ STICKY TOP BAR ════════════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(250,250,250,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px 22px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${D.border}`,
      }}>
        {/* Brand logo — leaves precisely over the E */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* 3-leaf SVG positioned to float over the E only */}
            <svg
              width="28" height="20"
              viewBox="0 0 80 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                top: -14,
                left: 48,
                pointerEvents: 'none',
              }}
            >
              <g transform="translate(22,2) rotate(-28,14,32)">
                <path d="M14 52 C14 52 0 36 1 20 C3 7 10 1 14 0 C18 1 26 7 27 20 C29 36 14 52 14 52Z" fill="#8DC9B0" opacity="0.9"/>
                <path d="M14 50 C14 36 13 20 14 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round"/>
              </g>
              <g transform="translate(30,0) rotate(-6,12,32)">
                <path d="M12 55 C12 55 -1 36 1 18 C3 4 9 0 12 0 C15 0 21 4 23 18 C25 36 12 55 12 55Z" fill="#A8D8C4" opacity="0.85"/>
                <path d="M12 53 C12 36 11 18 12 1" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" strokeLinecap="round"/>
              </g>
              <g transform="translate(48,14) rotate(26,9,25)">
                <path d="M9 40 C9 40 0 28 0 15 C1 5 5 0 9 0 C13 0 17 5 18 15 C19 28 9 40 9 40Z" fill="#E8A5B0" opacity="0.88"/>
                <path d="M9 38 C9 28 8 14 9 1" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeLinecap="round"/>
              </g>
            </svg>

            {/* Brand text */}
            <div style={{ paddingTop: 4 }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22,
                fontWeight: 600,
                color: '#2D6B5A',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}>Emolit</div>
              <div style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 8,
                fontWeight: 400,
                color: D.textSub,
                letterSpacing: '0.05em',
                marginTop: 2,
              }}>Understand. Express. Grow.</div>
            </div>
          </div>
        </div>

        {/* Notification bell — animated ring */}
        <motion.div
          whileTap={{ scale: 0.88 }}
          animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6, ease: 'easeInOut' }}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: D.card,
            border: `1.5px solid ${D.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <Bell size={18} weight="duotone" color={D.mintDark} />
          <div style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, borderRadius: '50%',
            background: D.pink,
            border: `1.5px solid ${D.card}`,
          }} />
        </motion.div>
      </div>

      {/* ══ PAGE CONTENT ══════════════════════════════════════════════════════ */}
      <div style={{ padding: '22px 22px 0' }}>

        {/* ── Greeting ─────────────────────────────────────────────────────── */}
        <motion.div {...fade(0.05)} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: D.textSub, fontWeight: 500, marginBottom: 4 }}>
            {greeting()} ·{' '}
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: D.text, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Hi, {name}{' '}
            <motion.span
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8, ease: 'easeInOut' }}
              style={{ display: 'inline-block', transformOrigin: '70% 80%' }}
            >👋</motion.span>
          </h1>
          <p style={{ fontSize: 13, color: D.textSub, marginTop: 4, fontWeight: 400 }}>
            How are you feeling today?
          </p>
        </motion.div>

        {/* ── Check-in Card (#FDEAF1 pink) ──────────────────────────────────── */}
        <motion.div {...fade(0.1)} style={{ marginBottom: 14 }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckIn}
            style={{
              borderRadius: 22,
              background: '#FDEAF1',
              padding: '22px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1.5px solid rgba(247,198,217,0.5)',
            }}
          >
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#C2699B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                Daily Check-in
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#2E2E2E', lineHeight: 1.25, marginBottom: 14 }}>
                Check-in with<br/>your emotions
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#C2699B', color: '#fff',
                fontSize: 11, fontWeight: 600,
                padding: '8px 18px', borderRadius: 99,
              }}>
                Start <ArrowRight size={12} weight="bold" />
              </div>
            </div>
            <div style={{
              width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(194,105,155,0.12)',
              border: '2px solid rgba(194,105,155,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PenNib size={28} weight="duotone" color="#C2699B" />
            </div>
          </motion.div>
        </motion.div>



        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <motion.div {...fade(0.18)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {/* Streak */}
          <div style={{
            borderRadius: 18, padding: '16px 14px',
            background: D.card, border: `1.5px solid ${D.border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', color: D.textSub }}>Streak</span>
              <Flame size={16} weight={streak > 0 ? 'fill' : 'duotone'} color={streak > 0 ? D.mintDark : D.textDim} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: D.text, lineHeight: 1 }}>{streak}</p>
            <p style={{ fontSize: 11, color: D.textSub, marginTop: 4, fontWeight: 500 }}>
              {streak === 1 ? 'day' : 'days'} in a row
            </p>
          </div>

          {/* Entries */}
          <div style={{
            borderRadius: 18, padding: '16px 14px',
            background: D.card, border: `1.5px solid ${D.border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', color: D.textSub }}>Entries</span>
              <BookOpen size={16} weight="duotone" color={D.mintDark} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: D.text, lineHeight: 1 }}>{totalEntries}</p>
            <p style={{ fontSize: 11, color: D.textSub, marginTop: 4, fontWeight: 500 }}>journals written</p>
          </div>
        </motion.div>

        {/* ── Word of the Day (sage green matching reference) ──────────────────── */}
        <motion.div {...fade(0.22)} style={{ marginBottom: 14 }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/word/${word}`)}
            style={{
              borderRadius: 22,
              background: '#4E8C7E',  // lighter sage green — softer and warmer
              padding: '22px 20px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -6px rgba(61,107,94,0.35)',
            }}
          >
            {/* Label row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Sparkle size={11} weight="fill" color="rgba(168,230,207,0.7)" />
                <span style={{ fontSize: 9, fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.14em', color:'rgba(168,230,207,0.65)' }}>
                  Word of the Day
                </span>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.1em',
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                padding: '4px 12px', borderRadius: 99,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {core}
              </span>
            </div>

            {/* Word */}
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.0, marginBottom: 4 }}>
              {word}
            </h2>
            {/* Part of speech */}
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(168,230,207,0.55)', marginBottom: 14 }}>
              Noun
            </p>

            {/* Definition */}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>
              &ldquo;{definition}&rdquo;
            </p>

            {/* Emotional Intensity bar */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(168,230,207,0.45)' }}>
                  Emotional Intensity
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color:'rgba(168,230,207,0.5)' }}>4/5</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    flex:1, height: 4, borderRadius: 99,
                    background: i <= 4 ? 'rgba(168,230,207,0.55)' : 'rgba(255,255,255,0.1)',
                  }} />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Quick Explore Row ─────────────────────────────────────────────── */}
        <motion.div {...fade(0.26)} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom: 14 }}>
          {[
            { label:'Explore Words', sub:'Search emotions', Icon: Compass,       path:'/search'   },
            { label:'My History',    sub:'Past journals',  Icon: CalendarBlank,  path:'/calendar' },
          ].map(({ label, sub, Icon, path }) => (
            <motion.div
              key={path}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(path)}
              style={{
                borderRadius: 18, padding: '16px 14px',
                background: D.card, border: `1.5px solid ${D.border}`,
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: D.bgSecond,
                display:'flex', alignItems:'center', justifyContent:'center',
                marginBottom: 10,
              }}>
                <Icon size={18} weight="duotone" color={D.mintDark} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 11, color: D.textSub }}>{sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Similar Words ─────────────────────────────────────────────── */}
        <motion.div {...fade(0.30)} style={{ marginBottom: 8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Discover Similar Words</span>
            <motion.span
              whileTap={{ scale:0.95 }}
              onClick={() => navigate('/search')}
              style={{ fontSize: 12, fontWeight: 600, color: D.mintDark, cursor: 'pointer' }}
            >
              Explore all
            </motion.span>
          </div>

          {/* Vertical list — no icons, pink category badge */}
          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            {[
              { w: 'Empathy',   core: 'Connection', def: "Understanding and sharing others' feelings." },
              { w: 'Courage',   core: 'Strength',   def: 'The power to act despite fear or doubt.'    },
              { w: 'Serenity',  core: 'Calm',       def: 'A state of peacefulness and clarity.'        },
              { w: 'Gratitude', core: 'Joy',        def: 'Appreciation for what you have.'             },
              { w: 'Clarity',   core: 'Insight',    def: 'Clear understanding free from confusion.'    },
            ].map(({ w, core: c, def }, i) => (
              <motion.div
                key={w}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/word/${w}`)}
                style={{
                  borderRadius: 16, padding: '13px 16px',
                  background: D.card,
                  border: `1.5px solid ${D.border}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 2 }}>{w}</p>
                  <p style={{ fontSize: 11, color: D.textSub, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{def}</p>
                </div>
                {/* Green badge — mint theme */}
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: D.mintDark, background: D.bgSecond,
                  border: `1px solid rgba(58,163,143,0.15)`,
                  padding: '3px 10px', borderRadius: 99, flexShrink: 0,
                }}>{c}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HomePage;
