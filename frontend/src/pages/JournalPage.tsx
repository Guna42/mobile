import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Heart, Brain, Microphone, Stop, CaretLeft, 
  PaperPlaneTilt, Sparkle, Wind, Ghost, ShieldCheck, 
  Binoculars, Tree, Waves, Flower, Flame, Lightning,
  ArrowRight, Pulse, Compass, CheckCircle, Bell, Clock, Alarm
} from '@phosphor-icons/react';
import { emotionAPI, JournalResponse } from '../services/api';
import { NotificationService } from '../services/notificationService';
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

const cleanListItem = (item: string): string => {
  return item
    .replace(/^\d+[\.\)]\s*/, '') // Strip leading numbers like "1. " or "2) "
    .replace(/^-\s*/, '')          // Strip leading bullet points like "- "
    .trim();
};

const parseActions = (raw?: string): string[] => {
  if (!raw?.trim()) return [];
  let cleaned = raw.trim();

  // Robustly handle stringified arrays or Python list strings (e.g. ['a', 'b'])
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    try {
      const jsonStr = cleaned.replace(/'/g, '"');
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map(item => cleanListItem(String(item))).filter(Boolean);
      }
    } catch (e) {
      // Fallback manual parsing if JSON fails
      const stripped = cleaned.slice(1, -1);
      return stripped
        .split(',')
        .map(item => cleanListItem(item.replace(/^['"]|['"]$/g, '')))
        .filter(Boolean);
    }
  }

  const byLine = cleaned.split('\n').map(l => cleanListItem(l)).filter(Boolean);
  if (byLine.length >= 2) return byLine;
  const byNum = cleaned.split(/(?=\d+[\.\)]\s)/).map(l => cleanListItem(l)).filter(Boolean);
  return byNum.length >= 2 ? byNum : byLine;
};

const getActionItems = (ruler?: any): string[] => {
  const items = parseActions(ruler?.['What can be done']);
  if (items.length > 0) return items.slice(0, 2);
  return [ruler?.section_4, ruler?.section_5].filter((s): s is string => !!s?.trim()).slice(0, 2);
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
  const [scheduledTasks, setScheduledTasks] = useState<Record<number, boolean>>({});
  const [showReminderPicker, setShowReminderPicker] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  const handleScheduleReminder = async (idx: number, taskText: string, seconds: number) => {
    const taskId = `task-${Date.now()}-${idx}`;
    
    const activeTasks = JSON.parse(localStorage.getItem('emolit_active_tasks') || '[]');
    activeTasks.push({
      id: taskId,
      text: taskText,
      scheduledTime: Date.now() + seconds * 1000,
      status: 'pending'
    });
    localStorage.setItem('emolit_active_tasks', JSON.stringify(activeTasks));

    await NotificationService.scheduleTaskReminder(taskId, taskText, seconds);

    setScheduledTasks(prev => ({ ...prev, [idx]: true }));
    setShowReminderPicker(null);
    toast.success('Reminder set! We will nudge you.', { icon: '🔔' });
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setMounted(true);
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('Viewed Journal Page');
      // Start timing how long they spend writing
      (window as any).mixpanel.time_event('Journal Submitted');
      (window as any).mixpanel.time_event('Voice Recording Started');
    }
  }, []);

  const startRecording = async () => {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('Voice Recording Started');
    }

    // 1. Check if mediaDevices API is available (blocked by browsers on insecure HTTP origins)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Microphone recording requires a secure origin (localhost or HTTPS). Please use a secure connection.", {
        duration: 6000,
        icon: '⚠️',
        style: { background: '#9E2A2B', color: '#fff', borderRadius: '1rem' }
      });
      return;
    }

    // 2. Check if MediaRecorder is supported by the client browser/WebView
    if (typeof MediaRecorder === 'undefined') {
      toast.error("Voice recording is not supported by this browser.", {
        duration: 5000,
        icon: '⚠️',
        style: { background: '#9E2A2B', color: '#fff', borderRadius: '1rem' }
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
        const journalResult = response as JournalResponse;
        setResult(journalResult);
        
        // Re-schedule notifications immediately since the user has journaled today!
        NotificationService.scheduleReminders();

        if ((window as any).mixpanel) {
          (window as any).mixpanel.track('Journal Submitted', {
            mood: MOODS[selectedMood]?.label,
            entry_length: entry.trim().length,
            emotions_detected: journalResult.detected_emotions?.map((e: any) => e.word),
          });
        }
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
                                onClick={() => {
                                  if ((window as any).mixpanel) {
                                    (window as any).mixpanel.track('Mood Selected', {
                                      mood: MOODS[idx].label,
                                      previous_mood: MOODS[selectedMood].label,
                                      mood_index: idx,
                                    });
                                  }
                                  setSelectedMood(idx);
                                }}
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
                        {/* Frosted background */}
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl" />

                        {/* Ambient color glow behind GIF */}
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute"
                            style={{
                                width: 280, height: 280,
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${activeMood.color}25 0%, transparent 70%)`,
                                filter: 'blur(30px)',
                            }}
                        />

                        {/* Free-floating GIF — no box, no clip */}
                        <div className="relative z-10 flex flex-col items-center gap-5">
                            <motion.img
                                src="/assets/journal_result_analyzer.gif"
                                alt="Analyzing thoughts..."
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                                style={{
                                    width: 200,
                                    height: 200,
                                    objectFit: 'contain',
                                    filter: `drop-shadow(0 8px 30px ${activeMood.color}40)`,
                                }}
                            />
                            <div className="flex flex-col items-center gap-1.5">
                                <motion.p
                                    animate={{ opacity: [0.9, 0.45, 0.9] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="text-[11px] font-black uppercase tracking-[0.45em] text-center"
                                    style={{ color: activeMood.color }}
                                >
                                    Analyzing emotions
                                </motion.p>
                                <p className="text-[9px] font-bold text-secondary/30 text-center uppercase tracking-widest">
                                    Decoding emotional signatures
                                </p>
                                {/* Typing dots */}
                                <div className="flex gap-1.5 items-center justify-center mt-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="rounded-full"
                                            style={{ width: 5, height: 5, background: activeMood.color }}
                                            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
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
                            <div className="space-y-4">
                                {getActionItems(result.ruler).map((line, idx) => {
                                    const isScheduled = scheduledTasks[idx];
                                    const isPicking = showReminderPicker === idx;

                                    return (
                                        <div key={idx} className="flex flex-col gap-2 p-3.5 bg-light-bg/30 rounded-2xl border border-primary/5">
                                            <div className="flex items-start gap-3">
                                                <motion.span
                                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-white"
                                                    style={{ backgroundColor: activeMood.accent }}
                                                    animate={{ scale: [1, 1.18, 1] }}
                                                    transition={{ duration: 2, delay: idx * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                                                >
                                                    {idx + 1}
                                                </motion.span>
                                                <p className="text-[13.5px] font-body font-bold text-primary/75 leading-relaxed flex-1">
                                                    {line}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 mt-1">
                                                {isScheduled ? (
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-xl flex items-center gap-1">
                                                        <Clock size={12} weight="fill" /> Reminder Set
                                                    </span>
                                                ) : isPicking ? (
                                                    <div className="flex flex-col gap-2.5 items-end w-full animate-fadeIn mt-1 bg-white/40 backdrop-blur-md p-3.5 rounded-2xl border border-primary/5 shadow-sm">
                                                        <p className="text-[10px] font-black uppercase tracking-wider text-primary/30 w-full text-left">Set Reminder Delay</p>
                                                        <div className="flex flex-wrap gap-1.5 justify-start w-full">
                                                            {[
                                                                { label: '2m', sec: 120 },
                                                                { label: '5m', sec: 300 },
                                                                { label: '15m', sec: 900 },
                                                                { label: '1h', sec: 3600 }
                                                            ].map((opt) => (
                                                                <button
                                                                    key={opt.label}
                                                                    onClick={() => handleScheduleReminder(idx, line, opt.sec)}
                                                                    className="text-[9px] font-black uppercase tracking-wider text-white px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                                                                    style={{ backgroundColor: activeMood.accent }}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 w-full mt-1 border-t border-primary/5 pt-2.5">
                                                            <div className="relative flex-1 flex items-center bg-light-bg/40 rounded-xl px-2.5 py-1 border border-primary/5 focus-within:border-primary/20 transition-all">
                                                                <input
                                                                    type="number"
                                                                    pattern="[0-9]*"
                                                                    inputMode="numeric"
                                                                    placeholder="Custom"
                                                                    value={customMinutes}
                                                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                                                    className="w-full bg-transparent border-none text-[12px] font-bold text-primary placeholder:text-primary/20 focus:outline-none focus:ring-0 p-0 text-left"
                                                                    min="1"
                                                                />
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-primary/30 ml-1">min</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const mins = parseInt(customMinutes);
                                                                    if (isNaN(mins) || mins <= 0) {
                                                                        toast.error("Please enter a valid number of minutes.");
                                                                        return;
                                                                    }
                                                                    handleScheduleReminder(idx, line, mins * 60);
                                                                    setCustomMinutes('');
                                                                }}
                                                                className="text-[9px] font-black uppercase tracking-wider text-white px-3 py-2 rounded-xl active:scale-95 transition-transform shrink-0"
                                                                style={{ backgroundColor: activeMood.accent }}
                                                            >
                                                                Nudge Me
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setShowReminderPicker(null);
                                                                    setCustomMinutes('');
                                                                }}
                                                                className="text-[9px] font-black uppercase tracking-wider text-primary/40 hover:text-primary px-2 py-2 rounded-xl shrink-0"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowReminderPicker(idx)}
                                                        className="text-[10px] font-black uppercase tracking-wider text-primary/50 hover:text-primary active:scale-95 transition-all flex items-center gap-1 border border-primary/10 hover:border-primary/20 px-3 py-1.5 rounded-xl bg-white shadow-sm"
                                                    >
                                                        <Bell size={12} weight="duotone" /> Remind Me
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
