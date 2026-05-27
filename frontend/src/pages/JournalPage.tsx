import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Heart, Brain, Microphone, Stop, CaretLeft, 
  PaperPlaneTilt, Sparkle, Wind, Ghost, ShieldCheck, 
  Binoculars, Tree, Waves, Flower, Flame, Lightning,
  ArrowRight, Pulse, Compass, CheckCircle
} from '@phosphor-icons/react';
import { emotionAPI, JournalResponse } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// 🎨 WHATSAPP STYLE (APPLE) PREMIUM EMOJI PALETTE
const MOODS = [
  {
    label: 'Radiant',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Grinning%20Face%20with%20Smiling%20Eyes.png',
    color: '#854d0e',
    bg: '#FFFAF0',
    accent: '#e9a23b',
    icon: <Sun size={24} weight="duotone" />
  },
  {
    label: 'Peaceful',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Relieved%20Face.png',
    color: '#065f46',
    bg: '#F2F8F5',
    accent: '#10b981',
    icon: <Tree size={24} weight="duotone" />
  },
  {
    label: 'Centered',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Neutral%20Face.png',
    color: '#334155',
    bg: '#F8FAFC',
    accent: '#64748b',
    icon: <ShieldCheck size={24} weight="duotone" />
  },
  {
    label: 'Melancholy',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Frowning%20Face.png',
    color: '#3730a3',
    bg: '#F5F7FF',
    accent: '#6366f1',
    icon: <Waves size={24} weight="duotone" />
  },
  {
    label: 'Intense',
    img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Loudly%20Crying%20Face.png',
    color: '#9f1239',
    bg: '#FFF5F6',
    accent: '#f43f5e',
    icon: <Flame size={24} weight="duotone" />
  },
];

const parseActions = (raw?: string): string[] => {
  if (!raw?.trim()) return [];
  const byLine = raw.split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
  if (byLine.length >= 2) return byLine;
  const byNum = raw.split(/(?=\d+[\.\)]\s)/).map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
  return byNum.length >= 2 ? byNum : byLine;
};

const getActionItems = (ruler?: any): string[] => {
  const items = parseActions(ruler?.['What can be done']);
  if (items.length > 0) return items;
  return [ruler?.section_4, ruler?.section_5].filter((s): s is string => !!s?.trim());
};

const RulerRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  text?: string;
  first?: boolean;
  italic?: boolean;
  iconAnim?: any;
  iconTrans?: any;
}> = ({ icon, label, text, first, italic, iconAnim, iconTrans }) => (
  <div className={`flex items-start gap-3 ${!first ? 'pt-3.5 border-t border-white/8' : ''}`}>
    <motion.div className="flex-shrink-0 mt-0.5" animate={iconAnim} transition={iconTrans}>
      {icon}
    </motion.div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/28 mb-1">{label}</p>
      <p className={`text-[13px] font-body font-normal leading-relaxed ${italic ? 'italic text-white/45' : 'text-white/60'}`}>
        {text}
      </p>
    </div>
  </div>
);

const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [entry, setEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<number>(2);
  const [result, setResult] = useState<JournalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleVoiceSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      toast('Listening...', { icon: '🎙️', style: { background: '#1a6b5a', color: '#fff', borderRadius: '1rem' }});
    } catch (err) {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const response = await emotionAPI.submitVoiceJournal(audioBlob);
      if ('error' in response) {
        toast.error('Analysis failed. Try typing.');
      } else {
        const res = response as JournalResponse & { transcript?: string };
        setResult(res);
        if (res.transcript) setEntry(res.transcript);
        setTimeout(() => {
          document.getElementById('analysis-dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      }
    } catch (error: any) {
      console.error('[Emolit] Voice Sync Error:', error);
      const detail = error.response?.data?.detail || error.message || 'Check your mic settings';
      toast.error(`Mic error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim()) return;
    setResult(null);
    setLoading(true);
    try {
      const response = await emotionAPI.submitJournal(entry);
      if ('error' in response) {
        toast.error('Failed to analyze. Please try again.');
      } else {
        setResult(response as JournalResponse);
        setTimeout(() => {
          document.getElementById('analysis-dashboard')?.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      }
    } catch (error: any) {
      console.error('[Emolit] Analysis Sync Error:', error);
      const detail = error.response?.data?.detail || error.message || 'Check your connection';
      toast.error(`Error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const activeMood = MOODS[selectedMood];
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div 
      className="min-h-screen transition-colors duration-1000 text-dark-bg pb-40 pt-10 px-6 font-body w-screen relative overflow-x-hidden left-0"
      style={{ backgroundColor: activeMood.bg }}
    >
      <div className="mx-auto space-y-6 relative z-10">
        
        {/* Dynamic Ambient Background Elements */}
        <motion.div 
            animate={{ 
                opacity: [0.05, 0.12, 0.05],
                scale: [1, 1.3, 1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -mr-40 -mt-20"
            style={{ backgroundColor: activeMood.accent + '33' }}
        />
        
        {/* HEADER */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between"
        >
            <button onClick={() => navigate(-1)} className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-black/5 text-primary">
                <CaretLeft size={20} weight="bold" />
            </button>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/30">Sanctuary Experience</p>
                <p className="text-xs font-black text-primary italic opacity-60">{currentDate}</p>
            </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-1"
        >
            <h1 className="text-2xl font-heading font-black text-primary leading-none tracking-tighter">
                What's on your <br/>
                <span className="italic" style={{ color: activeMood.accent }}>mind?</span>
            </h1>
            <p className="text-[11px] font-body font-medium text-secondary/40 leading-relaxed max-w-[280px]">
                Your sanctuary for self-clarity. Every thought you honor here builds the bridge to a more resilient you.
            </p>
        </motion.div>

        {/* MOOD PICKER (Dynamic themed glass) */}
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`bg-white rounded-[2rem] p-6 shadow-xl transition-all duration-1000 border border-primary/5`}
            style={{ 
              boxShadow: `0 30px 60px -15px rgba(${activeMood.accent.includes('amber') ? '251,191,36' : 
                               activeMood.accent.includes('emerald') ? '52,211,153' : 
                               activeMood.accent.includes('slate') ? '148,163,184' : 
                               activeMood.accent.includes('indigo') ? '129,140,248' : '251,113,133'}, 0.12)`
            }}
        >
            <div className="flex justify-between items-center mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/40">Current Mood</span>
            </div>
            <div className="flex justify-center items-center relative gap-2">
                {MOODS.map((m, idx) => {
                    const isActive = selectedMood === idx;
                    return (
                        <div key={idx} className="relative flex flex-col items-center">
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => setSelectedMood(idx)}
                                className={`relative h-14 w-14 flex items-center justify-center transition-all duration-500 ${isActive ? 'z-20' : 'opacity-20 grayscale hover:opacity-100'}`}
                            >
                                <motion.img 
                                    animate={{ 
                                      y: isActive ? -15 : 0,
                                      scale: isActive ? 1.5 : 1,
                                    }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    src={m.img} 
                                    alt={m.label} 
                                    className="w-12 h-12 relative z-10 block mx-auto" 
                                />
                                {isActive && (
                                    <motion.div 
                                        layoutId="emoji-glow"
                                        className="absolute inset-0 bg-white/60 blur-2xl rounded-full scale-110" 
                                    />
                                )}
                            </motion.button>
                        </div>
                    );
                })}
            </div>
        </motion.div>

        {/* WRITING CONSOLE */}
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`bg-white rounded-[2rem] transition-all duration-1000 border border-primary/5 flex flex-col min-h-[300px] relative overflow-hidden`}
            style={{ 
              boxShadow: `0 40px 80px -20px rgba(0,0,0,0.08)`
            }}
        >
            <AnimatePresence>
                {/* LOADING OVERLAY */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[2rem] overflow-hidden"
                    >
                        {/* Slow rotating background gradient */}
                        <motion.div
                            className="absolute inset-0"
                            animate={{
                                background: [
                                    `conic-gradient(from 0deg at 50% 50%, ${activeMood.accent}12, transparent 40%, ${activeMood.accent}08, transparent 80%, ${activeMood.accent}12)`,
                                    `conic-gradient(from 180deg at 50% 50%, ${activeMood.accent}12, transparent 40%, ${activeMood.accent}08, transparent 80%, ${activeMood.accent}12)`,
                                    `conic-gradient(from 360deg at 50% 50%, ${activeMood.accent}12, transparent 40%, ${activeMood.accent}08, transparent 80%, ${activeMood.accent}12)`,
                                ]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        />
                        {/* White base so gradient shows subtly */}
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" />

                        <div className="relative z-10 flex flex-col items-center gap-8">
                            {/* Rings + icon cluster */}
                            <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
                                {/* 5 staggered expanding rings */}
                                {[
                                  { delay: 0,    maxR: 130, border: 1.8, startOp: 0.55 },
                                  { delay: 0.5,  maxR: 110, border: 1.5, startOp: 0.50 },
                                  { delay: 1.0,  maxR: 92,  border: 1.2, startOp: 0.45 },
                                  { delay: 1.5,  maxR: 76,  border: 1.0, startOp: 0.40 },
                                  { delay: 2.0,  maxR: 62,  border: 0.8, startOp: 0.35 },
                                ].map((ring, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute rounded-full"
                                        style={{ borderStyle: 'solid', borderColor: activeMood.accent }}
                                        animate={{
                                            width:  [52, ring.maxR],
                                            height: [52, ring.maxR],
                                            opacity: [ring.startOp, 0],
                                            borderWidth: [ring.border, 0],
                                        }}
                                        transition={{
                                            duration: 2.8,
                                            delay: ring.delay,
                                            repeat: Infinity,
                                            ease: 'easeOut',
                                        }}
                                    />
                                ))}

                                {/* Glowing center box */}
                                <motion.div
                                    className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center relative z-10"
                                    style={{ backgroundColor: activeMood.accent + '18' }}
                                    animate={{
                                        boxShadow: [
                                            `0 0 0 0px ${activeMood.accent}00, 0 0 14px ${activeMood.accent}25`,
                                            `0 0 0 6px ${activeMood.accent}15, 0 0 28px ${activeMood.accent}40`,
                                            `0 0 0 0px ${activeMood.accent}00, 0 0 14px ${activeMood.accent}25`,
                                        ],
                                        scale: [1, 1.06, 1],
                                    }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 12, -12, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Brain size={26} weight="duotone" style={{ color: activeMood.accent }} />
                                    </motion.div>
                                </motion.div>
                            </div>

                            {/* Label + waveform stacked tightly */}
                            <div className="flex flex-col items-center gap-3 -mt-4">
                                <motion.p
                                    animate={{ opacity: [0.9, 0.35, 0.9] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="text-[10px] font-black uppercase tracking-[0.45em]"
                                    style={{ color: activeMood.color }}
                                >
                                    Analyzing emotions
                                </motion.p>

                                {/* Organic waveform */}
                                <div className="flex gap-[3px] items-end" style={{ height: 28 }}>
                                    {[0.3,0.6,1,0.5,0.85,0.4,1,0.65,0.9,0.35,0.75,1,0.5,0.8,0.4,0.95,0.6].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            className="rounded-full"
                                            style={{ width: 2.5, backgroundColor: activeMood.accent }}
                                            animate={{ height: [2, h * 26, 2] }}
                                            transition={{
                                                duration: 0.75 + h * 0.5,
                                                delay: i * 0.055,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* RECORDING OVERLAY */}
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center space-y-8 text-white p-10 backdrop-blur-md"
                        style={{
                          backgroundColor: activeMood.accent.includes('amber') ? '#d97706ee' :
                                           activeMood.accent.includes('emerald') ? '#059669ee' :
                                           activeMood.accent.includes('slate') ? '#475569ee' :
                                           activeMood.accent.includes('indigo') ? '#4f46e5ee' : '#e11d48ee'
                        }}
                    >
                        <div className="flex gap-2 items-center h-20">
                            {[1,1,1,1,1,1,1,1].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [20, Math.random()*80 + 20, 20] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                                    className="w-1.5 bg-white/40 rounded-full"
                                />
                            ))}
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-heading font-black italic tracking-tight">Capturing Voice...</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Emolit Listener Active</p>
                        </div>
                        <button
                            onClick={stopRecording}
                            className="bg-white text-primary px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 active:scale-95 transition-transform shadow-2xl shadow-black/20"
                        >
                            <Stop size={16} weight="fill" /> Finalize Voice
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 p-6 pb-4 flex flex-col">
                <textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="Drop your thoughts here..."
                  className="flex-1 w-full bg-transparent border-none resize-none text-xl text-primary placeholder:text-secondary/10 focus:ring-0 leading-relaxed font-body font-bold focus:outline-none min-h-[150px]"
                />

                <div className="mt-8 flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={startRecording}
                      type="button"
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors"
                      style={{
                          backgroundColor: activeMood.accent + '22',
                          color: activeMood.accent
                      }}
                    >
                        <Microphone size={24} weight="duotone" />
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={loading || !entry.trim()}
                      className="flex-1 text-white h-14 rounded-2xl shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all overflow-hidden relative group"
                      style={{
                          backgroundColor: activeMood.accent,
                          boxShadow: `0 20px 40px ${activeMood.accent}33`
                      }}
                    >
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] ml-2">Analyze Thought</span>
                        <PaperPlaneTilt size={20} weight="duotone" className="group-hover:translate-x-1.5 group-hover:-translate-y-1.5 transition-transform duration-500" />
                    </motion.button>
                </div>
            </div>
        </motion.div>

        {/* RESULTS */}
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    id="analysis-dashboard"
                    className="space-y-4 pb-20"
                >
                    {/* HEADER ROW: emotions + new entry */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-wrap gap-1.5">
                            {result.detected_emotions?.map((e, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border"
                                    style={{
                                        backgroundColor: activeMood.accent + '15',
                                        borderColor: activeMood.accent + '30',
                                        color: activeMood.color,
                                    }}
                                >
                                    {e.word}
                                </span>
                            ))}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={() => { setResult(null); setEntry(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="ml-3 flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border"
                            style={{
                                backgroundColor: activeMood.accent + '15',
                                borderColor: activeMood.accent + '30',
                                color: activeMood.color,
                            }}
                        >
                            + New
                        </motion.button>
                    </div>

                    {/* MAIN INSIGHT CARD */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-primary rounded-[2rem] p-7 text-white shadow-2xl relative overflow-hidden"
                    >
                        <Sparkle className="absolute right-[-6%] top-[-6%] w-32 h-32 text-white/5" weight="fill" />
                        <div className="space-y-4 relative z-10">

                            <RulerRow
                                icon={<Pulse size={18} weight="duotone" style={{ color: '#fda4af' }} />}
                                label="What you're feeling"
                                text={result.ruler?.section_1} first
                                iconAnim={{ scale: [1, 1.3, 1, 1.3, 1] }}
                                iconTrans={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <RulerRow
                                icon={<Binoculars size={18} weight="duotone" style={{ color: '#c4b5fd' }} />}
                                label="What's driving this"
                                text={result.ruler?.section_2}
                                iconAnim={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                                iconTrans={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <RulerRow
                                icon={<Tree size={18} weight="duotone" style={{ color: '#67e8f9' }} />}
                                label="Grounded perspective"
                                text={result.ruler?.section_3}
                                iconAnim={{ scaleY: [1, 1.12, 1], scaleX: [1, 0.95, 1] }}
                                iconTrans={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <RulerRow
                                icon={<Lightning size={18} weight="duotone" style={{ color: '#fcd34d' }} />}
                                label="Do this now"
                                text={result.ruler?.section_4}
                                iconAnim={{ scale: [1, 1.45, 0.9, 1.25, 1], opacity: [1, 1, 0.4, 1, 1] }}
                                iconTrans={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <RulerRow
                                icon={<Sun size={18} weight="duotone" style={{ color: '#6ee7b7' }} />}
                                label="Tomorrow's focus"
                                text={result.ruler?.section_5} italic
                                iconAnim={{ rotate: [0, 360] }}
                                iconTrans={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>
                    </motion.div>

                    {/* ACTION PLAN + REFLECTION — side layout on wider screens, stacked on mobile */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {/* Action Plan */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-primary/5 space-y-4">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center"
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    <CheckCircle size={15} weight="fill" className="text-green-500" />
                                </motion.div>
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-primary/40">Action Plan</span>
                            </div>
                            <div className="space-y-3">
                                {getActionItems(result.ruler).map((line, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <motion.span
                                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-white"
                                            style={{ backgroundColor: activeMood.accent }}
                                            animate={{ scale: [1, 1.18, 1] }}
                                            transition={{ duration: 2, delay: idx * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            {idx + 1}
                                        </motion.span>
                                        <p className="text-[13px] font-body font-normal text-primary/65 leading-relaxed">
                                            {line}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reflection */}
                        <div
                            className="rounded-[2rem] p-6 relative overflow-hidden border"
                            style={{ backgroundColor: activeMood.bg, borderColor: activeMood.accent + '20' }}
                        >
                            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 85% 15%, ${activeMood.accent}20, transparent 55%)` }} />
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: activeMood.accent + '20' }}
                                        animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.1, 1] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Sparkle size={15} weight="duotone" style={{ color: activeMood.accent }} />
                                    </motion.div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-primary/40">Reflect on this</span>
                                </div>
                                <p className="text-[13px] font-body font-normal leading-relaxed" style={{ color: activeMood.color + 'cc' }}>
                                    {result.reflection_question}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JournalPage;
