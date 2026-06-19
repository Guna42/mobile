import React from 'react';
import { motion } from 'framer-motion';

interface SimpleLoaderProps {
  gifSrc: string;
  gifSize?: number;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

/**
 * Page loader — no background, no box, no container.
 * GIF floats gently. Text fades in below.
 */
const FullScreenLoader: React.FC<SimpleLoaderProps> = ({
  gifSrc,
  gifSize = 220,
  title,
  subtitle,
  accentColor = '#1a6b5a',
}) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
    }}
  >
    {/* Cute, simple, and clean breathing branded Emolit logo */}
    <motion.img
      src="/logo.png"
      alt="Loading..."
      animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 85,
        height: 85,
        objectFit: 'contain',
        marginBottom: 20,
      }}
    />

    {/* Title */}
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.55 }}
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.45rem',
        fontWeight: 900,
        fontStyle: 'italic',
        color: accentColor,
        margin: 0,
        letterSpacing: '-0.02em',
        textAlign: 'center',
      }}
    >
      {title}
    </motion.p>

    {/* Subtitle */}
    {subtitle && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.55 }}
        style={{
          fontFamily: "'Lora', serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: `${accentColor}50`,
          margin: '8px 0 0',
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        {subtitle}
      </motion.p>
    )}

    {/* Bouncing dots */}
    <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: accentColor,
          }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  </div>
);

export default FullScreenLoader;
