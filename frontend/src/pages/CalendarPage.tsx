import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FullScreenLoader from '../components/FullScreenLoader';
import {
    CaretLeft, CaretRight, Sparkle, ArrowUpRight, Lightning, 
    Compass, ArrowRight, FileText, FileArrowDown,
    CircleNotch, TrendUp
} from '@phosphor-icons/react';
import { emotionAPI } from '../services/api';
import toast from 'react-hot-toast';

interface EmojiConfig {
    emoji: string;
    url: string;
    lightBg: string;
    lightBorder: string;
    darkBg: string;
    darkBorder: string;
    shadow: string;
}

const EMOTION_EMOJIS: Record<string, EmojiConfig> = {
    // Database values
    'Happy': {
        emoji: '😊',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Smiling%20Eyes.png',
        lightBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
        lightBorder: 'border-amber-200/80',
        darkBg: 'bg-gradient-to-br from-amber-950/25 to-amber-900/10',
        darkBorder: 'border-amber-500/20',
        shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    'Sad': {
        emoji: '😢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pensive%20Face.png',
        lightBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
        lightBorder: 'border-indigo-200/80',
        darkBg: 'bg-gradient-to-br from-indigo-950/25 to-indigo-900/10',
        darkBorder: 'border-indigo-500/20',
        shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    },
    'Angry': {
        emoji: '😡',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Enraged%20Face.png',
        lightBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',
        lightBorder: 'border-rose-200/80',
        darkBg: 'bg-gradient-to-br from-rose-950/25 to-rose-900/10',
        darkBorder: 'border-rose-500/20',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    'Fearful': {
        emoji: '😨',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Anxious%20Face%20with%20Sweat.png',
        lightBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50',
        lightBorder: 'border-violet-200/80',
        darkBg: 'bg-gradient-to-br from-violet-950/25 to-violet-900/10',
        darkBorder: 'border-violet-500/20',
        shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    },
    'Disgusted': {
        emoji: '🤢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Nauseated%20Face.png',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
        lightBorder: 'border-emerald-200/80',
        darkBg: 'bg-gradient-to-br from-emerald-950/25 to-emerald-900/10',
        darkBorder: 'border-emerald-500/20',
        shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    'Surprised': {
        emoji: '😲',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Astonished%20Face.png',
        lightBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50',
        lightBorder: 'border-cyan-200/80',
        darkBg: 'bg-gradient-to-br from-cyan-950/25 to-cyan-900/10',
        darkBorder: 'border-cyan-500/20',
        shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },

    // UI Fallbacks
    'Joy': {
        emoji: '😊',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Smiling%20Eyes.png',
        lightBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
        lightBorder: 'border-amber-200/80',
        darkBg: 'bg-gradient-to-br from-amber-950/25 to-amber-900/10',
        darkBorder: 'border-amber-500/20',
        shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    'Sadness': {
        emoji: '😢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Pensive%20Face.png',
        lightBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
        lightBorder: 'border-indigo-200/80',
        darkBg: 'bg-gradient-to-br from-indigo-950/25 to-indigo-900/10',
        darkBorder: 'border-indigo-500/20',
        shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    },
    'Anger': {
        emoji: '😡',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Enraged%20Face.png',
        lightBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',
        lightBorder: 'border-rose-200/80',
        darkBg: 'bg-gradient-to-br from-rose-950/25 to-rose-900/10',
        darkBorder: 'border-rose-500/20',
        shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    'Fear': {
        emoji: '😨',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Anxious%20Face%20with%20Sweat.png',
        lightBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50',
        lightBorder: 'border-violet-200/80',
        darkBg: 'bg-gradient-to-br from-violet-950/25 to-violet-900/10',
        darkBorder: 'border-violet-500/20',
        shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
    },
    'Disgust': {
        emoji: '🤢',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Nauseated%20Face.png',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
        lightBorder: 'border-emerald-200/80',
        darkBg: 'bg-gradient-to-br from-emerald-950/25 to-emerald-900/10',
        darkBorder: 'border-emerald-500/20',
        shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    'Surprise': {
        emoji: '😲',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Astonished%20Face.png',
        lightBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/50',
        lightBorder: 'border-cyan-200/80',
        darkBg: 'bg-gradient-to-br from-cyan-950/25 to-cyan-900/10',
        darkBorder: 'border-cyan-500/20',
        shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    },
    'Love': {
        emoji: '❤️',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Hearts.png',
        lightBg: 'bg-gradient-to-br from-pink-50 to-pink-100/50',
        lightBorder: 'border-pink-200/80',
        darkBg: 'bg-gradient-to-br from-pink-950/25 to-pink-900/10',
        darkBorder: 'border-pink-500/20',
        shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
    },
    'Trust': {
        emoji: '🤝',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Hugging%20Face.png',
        lightBg: 'bg-gradient-to-br from-teal-50 to-teal-100/50',
        lightBorder: 'border-teal-200/80',
        darkBg: 'bg-gradient-to-br from-teal-950/25 to-teal-900/10',
        darkBorder: 'border-teal-500/20',
        shadow: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]',
    },
    'Anticipation': {
        emoji: '🤩',
        url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Thinking%20Face.png',
        lightBg: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
        lightBorder: 'border-orange-200/80',
        darkBg: 'bg-gradient-to-br from-orange-950/25 to-orange-900/10',
        darkBorder: 'border-orange-500/20',
        shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    },
};

const CalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const [viewDate, setViewDate] = useState(new Date());
    const [history, setHistory] = useState<any[]>([]);
    const [selDay, setSelDay] = useState(formatDate(new Date()));
    const [loading, setLoading] = useState(true);
    const [isAnalyzingWeekly, setIsAnalyzingWeekly] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteRequest = async () => {
        setIsDeleting(true);
        try {
            const res = await emotionAPI.requestDeleteAccount();
            if (res.success) {
                toast.success("Verification link sent! Check your email.", {
                    style: {
                        background: '#2F8F83',
                        color: '#fff',
                        borderRadius: '1rem',
                    }
                });
                setShowDeleteConfirm(false);
            } else {
                toast.error("Failed to send deletion verification link.");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || "Error requesting account deletion.";
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        if ((window as any).mixpanel) {
            (window as any).mixpanel.track('Viewed Calendar Page');
        }

        const loadHistory = async () => {
            try {
                const res = await emotionAPI.getJournalHistory();
                setHistory(res.entries || []);
            } catch (e) {
                console.error("Archive Sync Fail:", e);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    const dataMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        history.forEach(item => {
            if (!item.data?.created_at) return;
            const key = formatDate(new Date(item.data.created_at));
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());
        });
        return map;
    }, [history]);

    const streakData = useMemo(() => {
        const dates = Object.keys(dataMap).sort().reverse();
        if (dates.length === 0) return { current: 0, highest: 0 };
        
        let current = 0;
        let highest = 0;
        let temp = 0;
        
        // Calculate Current Streak
        let currDate = new Date();
        currDate.setHours(0, 0, 0, 0);
        for (let i = 0; i < dates.length; i++) {
            const d = new Date(dates[i]);
            d.setHours(0, 0, 0, 0);
            const diff = (currDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 0 || diff === 1) {
                current++;
                currDate = d;
            } else if (diff > 1) break;
        }

        // Calculate Highest Streak
        const sortedDates = Object.keys(dataMap).sort();
        if (sortedDates.length > 0) {
            temp = 1;
            highest = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const d1 = new Date(sortedDates[i-1]);
                const d2 = new Date(sortedDates[i]);
                const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    temp++;
                } else {
                    temp = 1;
                }
                if (temp > highest) highest = temp;
            }
        }

        return { current, highest };
    }, [dataMap]);

    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const grid = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => formatDate(new Date(year, month, i + 1)))
    ];

    const activeItems = useMemo(() => {
        return dataMap[selDay] || [];
    }, [dataMap, selDay]);

    const journalEntries = activeItems.filter(i => i.type === 'journal');
    const learnedWords = activeItems.filter(i => i.type === 'learned_word');

    const insight = useMemo(() => {
        const journals = history.filter(i => i.type === 'journal');
        return journals.length > 5
            ? "Your journey of self-discovery is gaining momentum."
            : "Every small step in reflection leads to deeper self-awareness.";
    }, [history]);

    const handleMonthlyExport = async () => {
        if ((window as any).mixpanel) {
            (window as any).mixpanel.track('Exported PDF Report', { month: month + 1, year });
        }
        setIsAnalyzingWeekly(true);
        try {
            await emotionAPI.exportReport(month + 1, year);
        } catch (e) {
            console.error("Monthly Export Fail:", e);
        } finally {
            setIsAnalyzingWeekly(false);
        }
    };

    if (loading) {
        return (
            <FullScreenLoader
                gifSrc="/assets/calendar.gif"
                gifSize={220}
                title="Syncing Timeline"
                subtitle="Restoring historical context..."
                accentColor="#1a6b5a"
            />
        );
    }

    return (
        <div className="min-h-screen bg-white text-dark-bg pb-32 pt-16 w-screen relative overflow-x-hidden left-0">
            <div className="px-6 mx-auto space-y-8">
                
                {/* PREMIUM HEADER SECTION */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-4 pt-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                        <span className="text-[10px] font-heading font-black uppercase tracking-[0.4em] text-secondary/40">Personal Chronicle</span>
                    </div>
                    <h1 className="text-[3.2rem] font-heading font-black text-primary leading-[0.85] tracking-tighter italic">
                        Soul <br/>
                        <span className="text-accent underline decoration-4 decoration-accent/10 underline-offset-[12px]">Timeline.</span>
                    </h1>
                    <p className="text-sm font-body font-bold text-secondary/60 leading-tight border-l-2 border-accent/20 pl-4 py-1">
                        A beautiful history of your emotional evolution, <br/> 
                        one feeling at a time.
                    </p>
                </motion.div>

                {/* ARCHIVE EXPORT (GREEN PREMIUM ANALYTICS) */}
                <motion.button 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ delay: 0.2 }}
                    onClick={handleMonthlyExport}
                    disabled={isAnalyzingWeekly}
                    className="w-full bg-[#3e685f] p-5 rounded-[2.5rem] flex items-center justify-between group shadow-xl shadow-[#3e685f]/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-2xl text-white relative overflow-hidden">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute -inset-2 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md"></motion.div>
                            <FileArrowDown size={28} weight="regular" className="relative z-10" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-heading font-black text-white/50 uppercase tracking-[0.3em] mb-1">Analytics</p>
                            <h4 className="text-[1.3rem] font-heading font-black text-white italic tracking-tight leading-none">Download PDF Report</h4>
                        </div>
                    </div>
                    {isAnalyzingWeekly ? (
                        <CircleNotch className="animate-spin text-white/40" weight="bold" />
                    ) : (
                        <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            <ArrowRight size={24} className="text-white/40 group-hover:text-white transition-all" />
                        </motion.div>
                    )}
                </motion.button>

                {/* PREMIUM DUAL STREAK CARDS */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[3rem] p-8 shadow-xl shadow-black/5 flex flex-col justify-between h-[180px]"
                    >
                        <TrendUp className="text-accent" size={32} weight="bold" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-heading font-black text-secondary/40 uppercase tracking-[0.2em] block">Current Streak</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-heading font-black text-primary tracking-tighter">{streakData.current}</span>
                                <span className="text-lg font-heading font-black text-accent italic">Streaks</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#3e685f] rounded-[3rem] p-8 shadow-xl shadow-black/10 flex flex-col justify-between h-[180px]"
                    >
                        <Lightning className="text-white/40" size={32} weight="fill" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-heading font-black text-white/40 uppercase tracking-[0.2em] block">Highest Streak</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-heading font-black text-white tracking-tighter">{streakData.highest}</span>
                                <span className="text-lg font-heading font-black text-white italic">Streaks</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* CALENDAR CARD */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-xl shadow-secondary/5 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-heading font-black text-primary">
                            {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate)}
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 bg-light-bg rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
                                <CaretLeft size={18} weight="bold" />
                            </button>
                            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 bg-light-bg rounded-xl text-primary hover:bg-primary hover:text-white transition-all">
                                <CaretRight size={18} weight="bold" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-heading font-black text-primary/20 uppercase tracking-widest">{d}</div>
                        ))}
                        {grid.map((date, idx) => {
                            if (!date) return <div key={idx} className="aspect-square" />;
                            const dStr = date as string;
                            const isSel = selDay === dStr;
                            const hasAct = (dataMap[dStr] || []).length > 0;
                            const dayNum = new Date(dStr).getDate();
                            const isToday = dStr === formatDate(new Date());

                            // Look up journal items and emojis
                            const journalItem = (dataMap[dStr] || []).find(item => item.type === 'journal');
                            let emojiConfig = null;
                            if (journalItem) {
                                const primaryEmotion = journalItem.data?.detected_emotions?.[0];
                                const core = primaryEmotion?.core;
                                const word = primaryEmotion?.word;
                                emojiConfig = EMOTION_EMOJIS[core] || EMOTION_EMOJIS[word] || null;
                            }

                            if (emojiConfig) {
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelDay(dStr);
                                            if ((window as any).mixpanel) {
                                                (window as any).mixpanel.track('Calendar Day Viewed', {
                                                    date:           dStr,
                                                    has_entries:    hasAct,
                                                    entry_count:    (dataMap[dStr] || []).length,
                                                    is_today:       isToday,
                                                    days_ago:       Math.round((Date.now() - new Date(dStr).getTime()) / 86400000),
                                                });
                                            }
                                        }}
                                        className={`relative aspect-square rounded-2xl flex items-center justify-center border transition-all ${isSel 
                                            ? `scale-110 shadow-xl ${emojiConfig.darkBg} ${emojiConfig.darkBorder}` 
                                            : `${emojiConfig.lightBg} ${emojiConfig.lightBorder} ${emojiConfig.shadow}`}`}
                                    >
                                        <span className={`absolute top-1 left-1.5 text-[9px] font-black ${isSel ? 'text-white/60' : 'text-primary/40'}`}>
                                            {String(dayNum).padStart(2, '0')}
                                        </span>
                                        <img 
                                            src={emojiConfig.url} 
                                            alt={emojiConfig.emoji} 
                                            className="w-8 h-8 object-contain mt-2" 
                                        />
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelDay(dStr);
                                        if ((window as any).mixpanel) {
                                            (window as any).mixpanel.track('Calendar Day Viewed', {
                                                date:           dStr,
                                                has_entries:    hasAct,
                                                entry_count:    (dataMap[dStr] || []).length,
                                                is_today:       isToday,
                                                days_ago:       Math.round((Date.now() - new Date(dStr).getTime()) / 86400000),
                                            });
                                        }
                                    }}
                                    className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-heading font-black transition-all ${isSel 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                                        : isToday 
                                            ? 'bg-accent/10 text-accent border border-accent/20'
                                            : hasAct ? 'text-primary bg-white shadow-md border border-primary/10' : 'text-primary/70 bg-primary/5 hover:bg-primary/10'}`}
                                >
                                    {dayNum}
                                    {hasAct && !isSel && (
                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent shadow-sm"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* DAILY ACTIVITY */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-heading font-black uppercase tracking-[0.3em] text-secondary/40">
                             Activity Details
                        </h3>
                        <span className="text-xs font-heading font-bold text-primary">{new Date(selDay).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    {activeItems.length > 0 ? (
                        <div className="space-y-4">
                            {journalEntries.map((item, i) => (
                                <div key={i} className="bg-white rounded-3xl p-6 border border-primary/5 shadow-xl shadow-secondary/5 space-y-4 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-accent/10 rounded-xl text-accent">
                                                <FileText size={16} weight="duotone" />
                                            </div>
                                            <span className="text-[10px] font-heading font-black uppercase tracking-widest text-primary/40">Journal Entry</span>
                                        </div>
                                        <span className="text-[10px] font-heading font-bold text-primary/20">
                                            {new Date(item.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-primary font-body font-medium italic">"{item.data.entry_text}"</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.data.detected_emotions?.map((e: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-light-bg text-primary text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                {e.word}
                                            </span>
                                        ))}
                                    </div>

                                    {item.data.emotional_observation && (
                                        <div className="space-y-3 pt-3 border-t border-primary/5">
                                            <div className="flex items-center gap-2">
                                                <Sparkle size={14} className="text-accent" weight="fill" />
                                                <span className="text-[10px] font-heading font-black uppercase tracking-widest text-accent">AI Reflection</span>
                                            </div>
                                            <div className="space-y-3">
                                                {item.data.emotional_observation && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary/30">Observation</p>
                                                        <p className="text-sm font-body text-primary/80 leading-relaxed">{item.data.emotional_observation}</p>
                                                    </div>
                                                )}
                                                {item.data.pattern_insight && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary/30">Emotional Signature</p>
                                                        <p className="text-sm font-body text-primary/80 leading-relaxed">{item.data.pattern_insight}</p>
                                                    </div>
                                                )}
                                                {item.data.ruler?.section_1 && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary/30">Feeling</p>
                                                        <p className="text-sm font-body text-primary/80 leading-relaxed">{item.data.ruler.section_1}</p>
                                                    </div>
                                                )}
                                                {item.data.reflection_question && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary/30">Reflection</p>
                                                        <p className="text-sm font-body text-primary/80 leading-relaxed italic">"{item.data.reflection_question}"</p>
                                                    </div>
                                                )}
                                                {item.data.regulation_suggestion && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary/30">Regulate</p>
                                                        <p className="text-sm font-body text-primary/80 leading-relaxed">{item.data.regulation_suggestion}</p>
                                                    </div>
                                                )}
                                                {item.data.ruler?.["What can be done"] && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary/30">Growth Action</p>
                                                        <p className="text-sm font-body text-primary/80 leading-relaxed">{item.data.ruler["What can be done"]}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                             {learnedWords.map((item, i) => {
                                const theWord = item.data.word_details?.word || item.data.word || "Unknown";
                                return (
                                <div key={`learned-${i}`} className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 opacity-40">
                                            <Sparkle size={14} weight="duotone" />
                                            <span className="text-[10px] font-heading font-black uppercase tracking-widest">Learned Today</span>
                                        </div>
                                        <h4 className="text-2xl font-heading font-black tracking-tight">{theWord}</h4>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/word/${theWord}`)}
                                        className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"
                                    >
                                        <ArrowUpRight size={20} weight="bold" />
                                    </button>
                                </div>
                                );
                             })}
                        </div>
                    ) : (
                        <div className="bg-white/50 rounded-3xl p-12 border border-dashed border-primary/10 text-center space-y-4">
                            <Compass className="w-10 h-10 text-primary/10 mx-auto" weight="duotone" />
                            <p className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-secondary/30">No activity discovered yet</p>
                        </div>
                    )}
                </div>

                <div className="bg-accent/5 border border-accent/20 rounded-3xl p-8 space-y-4">
                    <div className="flex items-center gap-2 text-accent">
                        <Lightning size={18} weight="fill" />
                        <span className="text-[10px] font-heading font-black uppercase tracking-widest">Strategic Insight</span>
                    </div>
                    <p className="text-primary font-heading font-bold italic leading-tight">
                        "{insight}"
                    </p>
                </div>

                {/* SECURITY & PRIVACY CARD */}
                <div className="bg-rose-50/20 border border-rose-100/40 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-2 text-rose-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-[10px] font-heading font-black uppercase tracking-widest">Security & Privacy</span>
                    </div>
                    
                    {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-primary">Delete Emolit Account</h4>
                                <p className="text-xs text-secondary/60">Permanently delete your profile and all journal data.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100/50 text-rose-600 text-xs font-bold rounded-xl transition-all"
                            >
                                Delete Account
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-rose-700 font-bold leading-relaxed">
                                Are you sure you want to delete your account? This will send a secure verification link to your email to permanently delete all your entries and profile.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteRequest}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <CircleNotch className="animate-spin" size={14} />
                                    ) : 'Send Verification Link'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 bg-light-bg hover:bg-primary/5 text-primary text-xs font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
