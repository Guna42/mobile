import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { OnboardingModal } from './components/OnboardingModal';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import WordDetailPage from './pages/WordDetailPage';
import SearchPage from './pages/SearchPage';
import JournalPage from './pages/JournalPage';
import JournalHistoryPage from './pages/JournalHistoryPage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import './index.css';

import { emotionAPI } from './services/api';
import { useAuth } from './contexts/AuthContext';

/* ── Dot loader shared ─────────────────────────────────────── */
const Dots: React.FC<{ color?: string }> = ({ color = '#1a6b5a' }) => (
  <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        style={{ width: 6, height: 6, borderRadius: '50%', background: color }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/* ── Phase 1: Emolit logo splash (1.5 s) ───────────────────── */
const LogoSplash: React.FC = () => (
  <motion.div
    key="logo-splash"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.35 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}
  >
    <motion.img
      src="/logo.png"
      alt="Emolit"
      animate={{ scale: [1, 1.07, 1], opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: 90, height: 90, objectFit: 'contain' }}
    />
    <Dots />
  </motion.div>
);

/* ── Phase 2: Server wakeup (min 3 s) ──────────────────────── */
const ServerSplash: React.FC = () => (
  <motion.div
    key="server-splash"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', serif",
    }}
  >
    {/* Floating GIF — free, no box */}
    <motion.img
      src="/assets/server_wakeup.gif"
      alt="Server waking up"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 220, height: 220,
        objectFit: 'contain',
        marginBottom: 24,
        filter: 'drop-shadow(0 6px 20px rgba(26,107,90,0.15))',
      }}
    />

    {/* Text */}
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.55rem', fontWeight: 900,
        fontStyle: 'italic', color: '#1a6b5a',
        margin: 0, letterSpacing: '-0.02em', textAlign: 'center',
      }}
    >
      Welcome to Emolit
    </motion.h2>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.55, duration: 0.6 }}
      style={{
        fontFamily: "'Lora', serif",
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.28em', textTransform: 'uppercase',
        color: 'rgba(26,107,90,0.45)',
        margin: '8px 0 0', textAlign: 'center',
        padding: '0 24px',
      }}
    >
      Just a sec — our server is waking up ✨
    </motion.p>

    <Dots />
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════ */
function AppContent() {
  const { isAuthenticated, isLoading, isEmailVerified, isOnboarded } = useAuth();

  // State-driven splash variables
  const [logoTimeElapsed, setLogoTimeElapsed] = React.useState(false);
  const [healthChecked, setHealthChecked] = React.useState(false);
  const [enteredServerTime, setEnteredServerTime] = React.useState<number | null>(null);
  const [serverMinTimeDone, setServerMinTimeDone] = React.useState(false);
  const isMountedRef = useRef(true);

  /* Notification listener */
  React.useEffect(() => {
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action.notification.extra;
        if (extra && extra.type === 'task_reminder') {
          localStorage.setItem('open_task_id', extra.taskId);
          localStorage.setItem('open_task_text', extra.taskText);
          setTimeout(() => window.dispatchEvent(new Event('task-notification-clicked')), 500);
        }
      });
    }).catch(err => console.warn('Capacitor LocalNotifications not registered:', err));

    return () => { isMountedRef.current = false; };
  }, []);

  /* 1. Timer for Logo Splash (min 1.5s) */
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) setLogoTimeElapsed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  /* 2. Server health check */
  React.useEffect(() => {
    const doCheck = async () => {
      try {
        await emotionAPI.healthCheck();
      } catch {
        try {
          await new Promise(r => setTimeout(r, 1500));
          await emotionAPI.healthCheck();
        } catch (e) {
          console.error('[Emolit] Server unreachable, proceeding anyway', e);
        }
      }
      if (isMountedRef.current) setHealthChecked(true);
    };
    doCheck();
  }, []);

  /* Determine splash phase deterministically */
  let splashPhase: 'logo' | 'server' | 'app' = 'logo';

  if (!logoTimeElapsed || isLoading) {
    // Keep showing logo splash while 1.5s hasn't passed OR firebase auth is checking
    splashPhase = 'logo';
  } else {
    // Logo elapsed & auth check finished
    if (!isAuthenticated) {
      // User not logged in -> go straight to app (LoginPage)
      splashPhase = 'app';
    } else {
      // User is logged in
      if (healthChecked) {
        // Server is ready
        if (enteredServerTime) {
          // If we had entered server wakeup screen, wait until min 3s is complete
          splashPhase = serverMinTimeDone ? 'app' : 'server';
        } else {
          // Server was fast, skip server wakeup phase completely
          splashPhase = 'app';
        }
      } else {
        // Server is not ready yet -> show server wakeup splash
        splashPhase = 'server';
      }
    }
  }

  /* 3. Timer for server wakeup phase minimum duration (3s) */
  React.useEffect(() => {
    if (splashPhase === 'server' && !enteredServerTime) {
      setEnteredServerTime(Date.now());
      const timer = setTimeout(() => {
        if (isMountedRef.current) setServerMinTimeDone(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [splashPhase, enteredServerTime]);

  return (
    <>
      {/* Splash overlay — sits on top of everything */}
      <AnimatePresence>
        {splashPhase === 'logo'   && <LogoSplash />}
        {splashPhase === 'server' && <ServerSplash />}
      </AnimatePresence>

      {/* Onboarding overlay — shown after splash, before main app */}
      {splashPhase === 'app' && isAuthenticated && isEmailVerified && !isOnboarded && (
        <OnboardingModal onComplete={() => {}} />
      )}

      {/* Main app (rendered underneath, so transition is seamless) */}
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-light-bg">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <><Navbar /><main className="relative z-10"><HomePage /></main></>
              </ProtectedRoute>
            } />

            <Route path="/explore" element={<Navigate to="/search" replace />} />

            <Route path="/calendar" element={
              <ProtectedRoute>
                <><Navbar /><main className="relative z-10"><CalendarPage /></main></>
              </ProtectedRoute>
            } />

            <Route path="/word/:wordName" element={
              <ProtectedRoute>
                <><Navbar /><main className="relative z-10"><WordDetailPage /></main></>
              </ProtectedRoute>
            } />

            <Route path="/search" element={
              <ProtectedRoute>
                <><Navbar /><main className="relative z-10"><SearchPage /></main></>
              </ProtectedRoute>
            } />

            <Route path="/journal" element={
              <ProtectedRoute>
                <><Navbar /><main className="relative z-10"><JournalPage /></main></>
              </ProtectedRoute>
            } />

            <Route path="/journal/history" element={
              <ProtectedRoute>
                <><Navbar /><main className="relative z-10"><JournalHistoryPage /></main></>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
