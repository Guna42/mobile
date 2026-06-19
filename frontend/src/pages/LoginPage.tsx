import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { emotionAPI } from '../services/api';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [successUser, setSuccessUser] = useState('');

    // Forgot Password Wizard States
    const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (!authLoading && isAuthenticated && !showSuccessAnimation) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, location, showSuccessAnimation]);

    useEffect(() => {
        if (showSuccessAnimation) {
            const timer = setTimeout(() => {
                const from = (location.state as any)?.from?.pathname || '/';
                navigate(from, { replace: true });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessAnimation, navigate, location]);

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (forgotStep === 1) {
                const res = await emotionAPI.sendForgotOTP(email);
                if (res.sent) {
                    toast.success("Verification code sent to your email!");
                    setForgotStep(2);
                } else {
                    toast.error("Failed to send code. Please try again.");
                }
            } else if (forgotStep === 2) {
                const res = await emotionAPI.verifyForgotOTP(email, otp);
                if (res.valid) {
                    toast.success("Code verified successfully!");
                    setForgotStep(3);
                } else {
                    toast.error("Invalid verification code.");
                }
            } else if (forgotStep === 3) {
                const res = await emotionAPI.resetForgotAndPassword(email, otp, newPassword);
                if (res.success) {
                    toast.success("Password updated successfully! Please sign in.");
                    setMode('login');
                    setForgotStep(1);
                    setOtp('');
                    setNewPassword('');
                } else {
                    toast.error("Failed to reset password.");
                }
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || err?.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Time how long the login/signup takes
        if ((window as any).mixpanel) {
            (window as any).mixpanel.time_event(mode === 'login' ? 'Login' : 'Sign Up');
        }

        try {
            const displayName = fullName || email.split('@')[0];
            const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            setSuccessUser(formattedName);

            if (mode === 'login') {
                await login(email, password);

                if ((window as any).mixpanel) {
                    (window as any).mixpanel.identify(email);
                    (window as any).mixpanel.people.set({
                        '$email': email,
                        '$last_login': new Date().toISOString(),
                    });
                    (window as any).mixpanel.people.increment('total_logins', 1);
                    (window as any).mixpanel.track('Login', {
                        method: 'email_password',
                    });
                }

                setShowSuccessAnimation(true);
            } else {
                await register(email, password, fullName);

                if ((window as any).mixpanel) {
                    (window as any).mixpanel.identify(email);
                    (window as any).mixpanel.people.set({
                        '$email':       email,
                        '$name':        fullName,
                        '$created':     new Date().toISOString(),
                        'first_seen':   new Date().toISOString(),
                        'signup_source': document.referrer || 'direct',
                        'platform':     /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    });
                    (window as any).mixpanel.people.set_once({
                        'first_login_date': new Date().toISOString(),
                    });
                    (window as any).mixpanel.track('Sign Up', {
                        method:         'email_password',
                        has_full_name:  !!fullName.trim(),
                    });
                }

                setShowSuccessAnimation(true);
            }
        } catch (err: any) {
            // Track failures — critical for debugging drop-offs
            if ((window as any).mixpanel) {
                (window as any).mixpanel.track(mode === 'login' ? 'Login Failed' : 'Sign Up Failed', {
                    error_message: err?.response?.data?.detail || err?.message || 'Unknown error',
                });
            }
            let apiMessage = 'Verification failed. Please check your credentials.';
            if (err?.response?.data?.detail) {
                apiMessage = typeof err.response.data.detail === 'string'
                    ? err.response.data.detail
                    : 'System verification failed.';
            }
            toast.error(apiMessage);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
            }}>
                <motion.img
                    src="/logo.png"
                    alt="Emolit"
                    animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 80, height: 80, objectFit: 'contain' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a6b5a', opacity: 0.4 }}
                            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.9, 0.4] }}
                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative font-body overflow-hidden">
            
            {/* AMBIENT GRADIENTS */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-[400px] z-10 space-y-12"
            >
                {/* LOGO */}
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex justify-center"
                >
                    <img src="/logo.png" alt="Emolit" className="h-16 w-auto object-contain" />
                </motion.div>

                <AnimatePresence mode="wait">
                    {mode === 'forgot' ? (
                        <motion.div 
                            key="forgot"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-10"
                        >
                            <div className="space-y-2 text-center">
                                <h1 className="text-4xl font-heading font-black text-primary tracking-tighter italic">
                                    Reset Password.
                                </h1>
                                <p className="text-xs text-secondary/40 font-black uppercase tracking-widest px-6">
                                    {forgotStep === 1 && 'Enter your email to receive a secure code'}
                                    {forgotStep === 2 && 'Enter the 6-digit code sent to your email'}
                                    {forgotStep === 3 && 'Create a secure new password for your account'}
                                </p>
                            </div>

                            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {forgotStep === 1 && (
                                        <div className="group">
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full bg-light-bg/50 border border-primary/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-primary font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-secondary/10 text-lg"
                                                    placeholder="Email Address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {forgotStep === 2 && (
                                        <div className="group">
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    pattern="[0-9]{6}"
                                                    maxLength={6}
                                                    className="w-full bg-light-bg/50 border border-primary/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-primary font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-secondary/10 text-lg text-center tracking-[0.5em] font-mono"
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {forgotStep === 3 && (
                                        <div className="group text-left">
                                            <div className="relative">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    className="w-full bg-light-bg/50 border border-primary/5 rounded-[1.5rem] py-5 pl-16 pr-14 text-primary font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-secondary/10 text-lg"
                                                    placeholder="New Password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white h-16 rounded-[1.5rem] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {loading ? (
                                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }}
                                                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-heading font-black text-[10px] uppercase tracking-[0.4em] ml-2">
                                                {forgotStep === 1 && 'Send Reset Code'}
                                                {forgotStep === 2 && 'Verify Code'}
                                                {forgotStep === 3 && 'Reset Password'}
                                            </span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            <div className="text-center">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setMode('login');
                                        setForgotStep(1);
                                        setOtp('');
                                        setNewPassword('');
                                    }}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30 hover:text-primary transition-colors flex items-center justify-center gap-3 mx-auto"
                                >
                                    Remembered your password?
                                    <span className="text-primary border-b border-primary/20 pb-0.5">
                                        Sign In Now
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key={mode}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-10"
                        >
                            <div className="space-y-2 text-center">
                                <h1 className="text-4xl font-heading font-black text-primary tracking-tighter italic">
                                    {mode === 'login' ? 'Welcome Back.' : 'Start Fresh.'}
                                </h1>
                                <p className="text-xs text-secondary/40 font-black uppercase tracking-widest">
                                    {mode === 'login' ? 'Sync your emotional journey' : 'Begin your emotional odyssey'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {mode === 'register' && (
                                        <div className="group">
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-light-bg/50 border border-primary/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-primary font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-secondary/10 text-lg"
                                                    placeholder="Full Name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="group">
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                className="w-full bg-light-bg/50 border border-primary/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-primary font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-secondary/10 text-lg"
                                                placeholder="Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="group text-left">
                                        <div className="relative">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="w-full bg-light-bg/50 border border-primary/5 rounded-[1.5rem] py-5 pl-16 pr-14 text-primary font-bold focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-secondary/10 text-lg"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/20 hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {mode === 'login' && (
                                        <div className="text-right pr-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode('forgot');
                                                    setForgotStep(1);
                                                    setOtp('');
                                                    setNewPassword('');
                                                }}
                                                className="text-[10px] font-black uppercase tracking-wider text-secondary/35 hover:text-primary transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white h-16 rounded-[1.5rem] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {loading ? (
                                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }}
                                                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-heading font-black text-[10px] uppercase tracking-[0.4em] ml-2">{mode === 'login' ? 'Initialize Sync' : 'Register Identity'}</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            <div className="text-center">
                                <button 
                                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/30 hover:text-primary transition-colors flex items-center justify-center gap-3 mx-auto"
                                >
                                    {mode === 'login' ? "New to Emolit?" : "Existing Citizen?"}
                                    <span className="text-primary border-b border-primary/20 pb-0.5">
                                        {mode === 'login' ? 'Create Account' : 'Sign In Now'}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FOOTER */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-12 text-center"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary/10">Protected by Emolit Neural Shield // 2024</p>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showSuccessAnimation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.45 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            background: 'rgba(255,255,255,0.82)',
                        }}
                    >
                        {/* GIF — free floating, no container */}
                        <motion.img
                            src="/assets/login_sucess.gif"
                            alt="Welcome"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
                            style={{
                                width: 260, height: 260,
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 8px 30px rgba(26,107,90,0.18))',
                            }}
                        />

                        {/* Welcome text */}
                        <motion.h2
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.55 }}
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '2rem', fontWeight: 900,
                                fontStyle: 'italic', color: '#1a6b5a',
                                margin: '4px 0 0', letterSpacing: '-0.02em',
                                textAlign: 'center',
                            }}
                        >
                            Welcome, {successUser} 🌿
                        </motion.h2>

                        {/* Creative subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.55, duration: 0.55 }}
                            style={{
                                fontFamily: "'Lora', serif",
                                fontSize: 11, fontWeight: 600,
                                color: 'rgba(26,107,90,0.5)',
                                textAlign: 'center',
                                margin: '10px 0 0',
                                padding: '0 40px',
                                lineHeight: 1.7,
                                letterSpacing: '0.01em',
                            }}
                        >
                            You're in a safe space — crafted to help you feel,{'\n'}understand, and grow through your emotions.
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginPage;
