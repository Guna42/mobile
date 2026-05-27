import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Leaf SVG ──────────────────────────────────────────────────────────── */
const LeafMark: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
    <g transform="translate(6,5) rotate(-20,11,22)">
      <path d="M11 40 C11 40 0 27 1 14 C2 5 6 1 11 0 C16 1 20 5 21 14 C22 27 11 40 11 40Z" fill="#8DC9B0"/>
      <path d="M11 38 C11 25 10 13 11 1" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeLinecap="round"/>
    </g>
    <g transform="translate(17,2) rotate(-2,10,24)">
      <path d="M10 42 C10 42 -1 29 0 15 C1 5 5 0 10 0 C15 0 19 5 20 15 C21 29 10 42 10 42Z" fill="#A8D8C4"/>
      <path d="M10 40 C10 27 9 14 10 1" stroke="rgba(255,255,255,0.6)" strokeWidth={1} strokeLinecap="round"/>
    </g>
    <g transform="translate(29,12) rotate(20,8,20)">
      <path d="M8 34 C8 34 -1 23 0 11 C1 4 4 0 8 0 C12 0 15 4 16 11 C17 23 8 34 8 34Z" fill="#E8A5B0"/>
      <path d="M8 32 C8 23 7 11 8 1" stroke="rgba(255,255,255,0.5)" strokeWidth={0.9} strokeLinecap="round"/>
    </g>
  </svg>
);

/* ── Breathing phases ──────────────────────────────────────────────────── */
const PHASES = [
  { label: 'Inhale',  sec: 1.2 },
  { label: 'Hold',    sec: 0.6 },
  { label: 'Exhale',  sec: 1.2 },
];

interface Props { onComplete: () => void }

const CheckInLoader: React.FC<Props> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);   // 0→1 over 3s
  const [done,     setDone]     = useState(false);

  /* which breathing phase are we in */
  const totalSec = PHASES.reduce((a, p) => a + p.sec, 0); // = 3s
  let cumulative = 0;
  let phaseLabel = PHASES[0].label;
  let phaseRemaining = PHASES[0].sec;
  let usedTime = progress * totalSec;
  for (const ph of PHASES) {
    if (usedTime <= cumulative + ph.sec) {
      phaseLabel    = ph.label;
      phaseRemaining = Math.ceil(cumulative + ph.sec - usedTime);
      break;
    }
    cumulative += ph.sec;
  }

  useEffect(() => {
    const TOTAL = 3000, start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min((Date.now() - start) / TOTAL, 1);
      setProgress(p);
      if (p >= 1) { clearInterval(tick); setDone(true); setTimeout(onComplete, 500); }
    }, 25);
    return () => clearInterval(tick);
  }, [onComplete]);

  /* Arc maths */
  const R   = 108;
  const CIR = 2 * Math.PI * R;
  const offset = CIR * (1 - progress);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#F7FDFB',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26, fontWeight: 600,
              color: '#2D4A3E', margin: '0 0 6px',
              letterSpacing: '-0.01em',
            }}>
              Take a deep breath
            </h2>
            <p style={{ fontSize: 14, fontWeight: 300, color: '#8aaa96', margin: 0, letterSpacing: '0.01em' }}>
              You've got this
            </p>
          </motion.div>

          {/* ── Big dial circle ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative', width: 256, height: 256 }}
          >
            {/* SVG arc */}
            <svg
              width="256" height="256"
              viewBox="0 0 256 256"
              fill="none"
              style={{ position: 'absolute', inset: 0 }}
            >
              <defs>
                <linearGradient id="arcFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#A8E6CF"/>
                  <stop offset="100%" stopColor="#5aad8a"/>
                </linearGradient>
              </defs>

              {/* Track ring */}
              <circle
                cx="128" cy="128" r={R}
                stroke="#D8F0E6"
                strokeWidth="10"
                fill="none"
              />
              {/* Progress arc */}
              <circle
                cx="128" cy="128" r={R}
                stroke="url(#arcFill)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIR}
                strokeDashoffset={offset}
                transform="rotate(-90 128 128)"
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
              {/* Glowing dot at arc tip */}
              {progress > 0.01 && (() => {
                const angle = progress * 2 * Math.PI - Math.PI / 2;
                return (
                  <circle
                    cx={128 + R * Math.cos(angle)}
                    cy={128 + R * Math.sin(angle)}
                    r="6"
                    fill="#5aad8a"
                    style={{ filter: 'drop-shadow(0 0 5px #5aad8a)' }}
                  />
                );
              })()}
            </svg>

            {/* Inner white circle */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 190, height: 190,
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 4px 28px rgba(90,173,138,0.1)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6,
            }}>
              {/* Floating leaf */}
              <div style={{ animation: 'lfloat 3s ease-in-out infinite' }}>
                <LeafMark size={46}/>
              </div>

              {/* Phase label */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={phaseLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  style={{ fontSize: 14, fontWeight: 500, color: '#5aad8a', margin: 0, letterSpacing: '0.04em' }}
                >
                  {phaseLabel}
                </motion.p>
              </AnimatePresence>

              {/* Countdown */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={phaseRemaining}
                  initial={{ opacity: 0, scale: 1.35 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.28 }}
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28, fontWeight: 600, color: '#2D4A3E',
                    margin: 0, lineHeight: 1,
                  }}
                >
                  {phaseRemaining}s
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── CTA-style banner (like "Start Session" in reference) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.5 }}
            style={{
              marginTop: 52,
              background: 'linear-gradient(135deg, #7EC8A8, #5aad8a)',
              borderRadius: 50,
              padding: '16px 60px',
              boxShadow: '0 8px 28px rgba(90,173,138,0.28)',
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
              Preparing your journal…
            </p>
          </motion.div>

          {/* ── Brand footer ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ position: 'absolute', bottom: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LeafMark size={16}/>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: '#2D4A3E' }}>
                Emolit
              </span>
            </div>
            <span style={{ fontSize: 8, color: '#9abba8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Understand · Express · Grow
            </span>
          </motion.div>

          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&display=swap');
            @keyframes lfloat {
              0%,100% { transform: translateY(0) scale(1); }
              50%      { transform: translateY(-5px) scale(1.07); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckInLoader;
