import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { House, Compass, CalendarBlank, SignOut, Plus } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const MINT      = '#3AA38F';
const MINT_LT   = '#A8E6CF';
const MINT_MID  = '#7ED9B6';
const MINT_DK   = '#2F8F83';
const INACTIVE  = '#B8C4C2';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return null;

  const NavItem = ({ path, Icon, onClick }: { path: string; Icon: any; onClick?: () => void }) => {
    const isActive = location.pathname === path;

    return (
      <div
        onClick={() => { onClick ? onClick() : navigate(path); }}
        style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div
          whileTap={{ scale: 0.82 }}
          animate={{ scale: isActive ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            // Active: glowing mint circle. Inactive: subtle light circle
            background: isActive
              ? `radial-gradient(circle at 35% 30%, #c6f0e3, ${MINT_MID}88)`
              : 'rgba(168,230,207,0.10)',
            boxShadow: isActive
              ? `0 4px 18px -4px rgba(58,163,143,0.45), inset 0 1.5px 3px rgba(255,255,255,0.8)`
              : `inset 0 1px 2px rgba(255,255,255,0.6)`,
            border: isActive
              ? `1.5px solid rgba(168,230,207,0.6)`
              : `1.5px solid rgba(168,230,207,0.2)`,
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Sparkle shimmer ring visible on active */}
          {isActive && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 60%, ${MINT_LT}88, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />
          )}

          <Icon
            size={20}
            weight={isActive ? 'fill' : 'regular'}
            style={{
              color: isActive ? MINT_DK : INACTIVE,
              position: 'relative',
              zIndex: 1,
              filter: isActive ? `drop-shadow(0 2px 6px rgba(58,163,143,0.5))` : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </motion.div>
      </div>
    );
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
      paddingBottom: '20px',
    }}>
      {/* Outer wrapper: drop-shadow traces the full U-cutout shape */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.05 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '360px',
          height: '64px',          // Compact and cute
          margin: '0 20px',
          pointerEvents: 'auto',
          filter: 'drop-shadow(0 8px 24px rgba(58,163,143,0.12)) drop-shadow(0 2px 8px rgba(0,0,0,0.06))',
        }}
      >
        {/* The glass pill background — ultra-shiny white with mint shimmer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '100px',   // Full pill/capsule
          // Crystal-clear ultra white with a pearl sheen gradient
          background: 'linear-gradient(160deg, #ffffff 0%, #f6fffe 60%, #edfaf5 100%)',
          // Tight U-cutout for the FAB
          WebkitMask: 'radial-gradient(circle at 50% 2px, transparent 30px, black 30.5px)',
          mask:        'radial-gradient(circle at 50% 2px, transparent 30px, black 30.5px)',
          border: '1.5px solid rgba(168,230,207,0.35)',
        }}>
          {/* Shimmering top-edge highlight line */}
          <div style={{
            position: 'absolute',
            top: 0, left: '15%', right: '15%',
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,1) 40%, rgba(168,230,207,0.6) 60%, transparent)',
            borderRadius: '100px',
          }} />
          {/* Subtle inner bottom shadow for depth */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '40%',
            background: 'linear-gradient(to top, rgba(168,230,207,0.07), transparent)',
            borderRadius: '0 0 100px 100px',
          }} />
        </div>

        {/* Content: icons row */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          padding: '0 8px',
        }}>
          {/* Left 2 */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
            <NavItem path="/" Icon={House} />
            <NavItem path="/search" Icon={Compass} />
          </div>

          {/* FAB spacer */}
          <div style={{ width: 64, flexShrink: 0 }} />

          {/* Right 2 */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
            <NavItem path="/calendar" Icon={CalendarBlank} />
            <NavItem path="#" Icon={SignOut} onClick={() => { logout(); navigate('/login'); }} />
          </div>
        </div>

        {/* Ambient mint aura — pulses softly behind FAB */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-26px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: MINT_MID,
            filter: 'blur(18px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* ─── FAB ─── */}
        <div style={{
          position: 'absolute',
          top: '-26px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}>
          <motion.button
            whileHover={{ scale: 1.08, rotate: 90 }}
            whileTap={{ scale: 0.9, rotate: 0 }}
            onClick={() => navigate('/journal')}
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Shiny 3-stop mint gradient for premium feel
              background: `linear-gradient(145deg, ${MINT_LT} 0%, ${MINT_MID} 45%, ${MINT_DK} 100%)`,
              boxShadow: `
                0 8px 20px -4px rgba(58,163,143,0.55),
                0 2px 8px rgba(58,163,143,0.3),
                inset 0 2px 4px rgba(255,255,255,0.55),
                inset 0 -1px 3px rgba(0,0,0,0.08)
              `,
            }}
          >
            {/* Continuously breathing + icon */}
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              <Plus size={26} weight="bold" color="#fff" style={{ display: 'block', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }} />
            </motion.div>

            {/* Inner shimmer ring on the FAB surface */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 3,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, transparent 70%, rgba(255,255,255,0.35), transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          </motion.button>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
