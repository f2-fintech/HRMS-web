'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
const isBirthday = (dobString?: string) => {
  if (!dobString) return false;
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();

  let dobMonth: number | undefined;
  let dobDate: number | undefined;

  if (dobString.includes('-')) {
    const parts = dobString.split('-');
    if (parts[0].length === 4) {
      dobMonth = parseInt(parts[1], 10);
      dobDate = parseInt(parts[2].substring(0, 2), 10);
    } else {
      dobDate = parseInt(parts[0], 10);
      dobMonth = parseInt(parts[1], 10);
    }
  } else {
    const d = new Date(dobString);
    if (!isNaN(d.getTime())) {
      dobMonth = d.getMonth() + 1;
      dobDate = d.getDate();
    } else {
      return false;
    }
  }
  return todayMonth === dobMonth && todayDate === dobDate;
};

// ---------------------------------------------------------------------------
// Config & Palette (From User's HTML)
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = ['#FF6B9D', '#FFC93C', '#6BCB77', '#4D96FF', '#C88CFF', '#FF9F45'];

const CONFIG = {
  fromName: "Team",
  heroSubtitle: "A very happy birthday to our amazing manager!",
  storyText: "Here's to the one who leads the team, solves the problems, and still manages to keep the laughs going — {name}. Happy Birthday!",
  anniversaryDate: "2022-02-14",
  reasons: [
    "The way you keep smiling and handling things, even on the days that aren’t easy.",
    "How you overthink the smallest things, yet always manage to bring positive energy to the team.",
    "The funny moments when we tease you, and that smile makes it obvious you’re enjoying it too.",
    "The way you make even ordinary workdays a little more enjoyable with your humour and presence.",
    "How we can have a serious workday and still end up laughing over the most random things.",
    "The way you handle responsibilities quietly, while still making time for a little fun with the team.",
    "Those small moments, silly jokes, and unexpected laughs that make working together memorable.",
    "Simply you — thoughtful, hardworking, sometimes an overthinker, and always someone who makes the team moments more enjoyable."
  ],
  letterSalutation: "Dear {name},",
  letterParagraphs: [
    "Happy Birthday to our amazing manager! 🎂🥳",
    "Aapke mood ka toh koi fixed schedule nahi hai — kabhi full shanti, kabhi “Don’t disturb me” mode, aur kabhi aisi hasi ki poori team ka mood hi theek ho jaaye! 😂",
    "Hum bhi aapko pareshaan karne mein koi kasar nahi chhodte — kabhi random questions, kabhi unnecessary doubts, aur kabhi bina kisi reason ke disturb karna… 😄 Phir bhi aap hume handle kar hi lete ho. Itna patience bhi koi kaise rakhta hai! 😂",
    "Aapki calm nature, funny side aur jis tarah se aap team ko handle karte ho, wahi aapko sirf manager nahi, balki team ka ek important part banata hai. ❤️",
    "Aur haan, ek saal aur bade ho gaye ho… 😄 Lekin itna bhi mature mat ho jaana ki andar ka woh funny, crazy aur bachpana hi kho jaaye. Age badhti rahe, experience badhta rahe, responsibilities badhti rahein — bas woh hasi, masti aur bachpana hamesha waise hi rehna chahiye. 😊",
    "Aaj bas ek din ke liye manager nahi, apna special din enjoy karna hai… baaki “Don’t disturb me” kal se continue kar lena! 😂🎂",
    "Wishing you lots of happiness, success, good health, endless reasons to smile, and of course, thoda kam stress aur thodi zyada masti! 😄"
  ],
  letterSign: "Best wishes, {from}",
  finaleTitle: "Happy Birthday, {name} 🎂",
  finaleNote: "Wishing you lots of happiness, success, good health, and endless reasons to smile!",
  finaleSignature: "— {from}",
  musicTitleIdle: "Tap for birthday vibes",
  musicTitlePlaying: "Birthday vibes 🎶",
  photos: [
    { src: "https://placehold.co/500x625/241751/F7D9A0?text=Memory+01&font=raleway", caption: "First hello" },
    { src: "https://placehold.co/500x625/17123F/F2897E?text=Memory+02&font=raleway", caption: "First trip together" },
    { src: "https://placehold.co/500x625/0B1130/F4B860?text=Memory+03&font=raleway", caption: "Movie night" },
    { src: "https://placehold.co/500x625/241751/FBF6EC?text=Memory+04&font=raleway", caption: "Your favourite dessert" },
    { src: "https://placehold.co/500x625/17123F/F4B860?text=Memory+05&font=raleway", caption: "Silly selfie" },
    { src: "https://placehold.co/500x625/0B1130/F2897E?text=Memory+06&font=raleway", caption: "Rainy day walk" },
    { src: "https://placehold.co/500x625/241751/F7D9A0?text=Memory+07&font=raleway", caption: "That concert night" },
    { src: "https://placehold.co/500x625/17123F/FBF6EC?text=Memory+08&font=raleway", caption: "Sunday brunch" }
  ]
};

const fill = (str: string, userName: string) => String(str).replace(/{name}/g, userName).replace(/{from}/g, CONFIG.fromName);

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
const ConfettiPiece = ({ index }: { index: number }) => {
  const angle = (index / 60) * Math.PI * 2 + Math.random() * 0.5;
  const distance = 220 + Math.random() * 420;
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance - 100;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isCircle = index % 3 === 0;
  const size = 6 + Math.random() * 6;
  const duration = 2.4 + Math.random() * 1.4;
  const delay = Math.random() * 0.25;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
      animate={{ x: tx, y: [ty, ty + 260], opacity: [1, 1, 0], rotate: Math.random() > 0.5 ? 360 : -360, scale: 1 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', top: '50%', left: '50%', width: size, height: isCircle ? size : size * 1.6,
        marginLeft: -size / 2, marginTop: -size / 2, backgroundColor: color, borderRadius: isCircle ? '50%' : '2px',
        pointerEvents: 'none', zIndex: 100
      }}
    />
  );
};

const Candle = ({ x, lit, idx }: { x: number; lit: boolean; idx: number }) => (
  <g>
    <rect x={x - 2} y={30} width={4} height={16} rx={1} fill="#FFF4D6" />
    <AnimatePresence>
      {lit && (
        <motion.g initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.3, y: 4 }} transition={{ duration: 0.35 }}>
          <motion.ellipse
            cx={x} cy={24} rx={3.2} ry={6} fill="#FFD54A"
            animate={{ scaleY: [1, 1.15, 0.95, 1.1, 1], scaleX: [1, 0.9, 1.05, 0.95, 1] }}
            transition={{ duration: 0.8 + idx * 0.07, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: `${x}px 27px` }}
          />
          <ellipse cx={x} cy={25} rx={1.4} ry={3} fill="#FF8A3D" />
        </motion.g>
      )}
    </AnimatePresence>
  </g>
);

const Cake = ({ candlesLit, onBlow }: { candlesLit: boolean; onBlow: () => void }) => {
  const candleX = [90, 115, 140, 165, 190];
  return (
    <motion.div
      whileTap={{ scale: 0.97 }} onClick={onBlow}
      style={{ cursor: candlesLit ? 'pointer' : 'default', display: 'inline-block' }}
    >
      <svg width="220" height="150" viewBox="0 0 280 150">
        {candleX.map((x, i) => <Candle key={i} x={x} idx={i} lit={candlesLit} />)}
        <rect x={75} y={46} width={130} height={34} rx={6} fill="#FFB6D9" />
        <path d="M75 46 Q140 32 205 46 L205 56 Q140 44 75 56 Z" fill="#FFD9EC" />
        <rect x={45} y={80} width={190} height={46} rx={8} fill="#FF89B9" />
        <path d="M45 80 Q140 62 235 80 L235 92 Q140 76 45 92 Z" fill="#FFB6D9" />
        {[70, 110, 150, 190, 225].map((x, i) => <path key={i} d={`M${x} 80 q6 14 0 22 q-6 -8 0 -22`} fill="#FFD9EC" />)}
        <ellipse cx={140} cy={130} rx={120} ry={10} fill="rgba(0,0,0,0.15)" />
      </svg>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
const DancingSticker = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <motion.div 
      animate={{ y: [0, -6, 0], rotate: [-2, 2, -2], scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="font-hand"
      style={{ 
        position: 'absolute', top: '-15%', 
        fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', color: '#F4B860', 
        textShadow: '0 4px 15px rgba(244,184,96,0.6)', 
        whiteSpace: 'nowrap', zIndex: 10 
      }}
    >
      Aaj toh mera birthday hai! 🕺
    </motion.div>

    <motion.div
      animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width: 'min(250px, 60vw)', height: 'min(250px, 60vw)',
        borderRadius: '50%',
        border: '10px solid #FFF',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        background: '#FBF6EC'
      }}
    >
      <img src="/pic1.jpeg" alt="Dancing Sticker" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </motion.div>
  </div>
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function BirthdayAnimation({ userId }: { userId?: string }) {
  const [show, setShow] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [candlesLit, setCandlesLit] = useState(true);
  const [celebrated, setCelebrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const checkBirthday = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${userId}`);
        const data = await response.json();
        if (data && data.dob) {
          const birthdayMatch = isBirthday(data.dob);
          const hasSeen = sessionStorage.getItem('birthday_seen');
          
          if (birthdayMatch && !hasSeen) {
            setUserData(data);
            setShow(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };
    checkBirthday();
  }, [userId]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const start = new Date(CONFIG.anniversaryDate + "T00:00:00").getTime();
    const tick = () => setSeconds(Math.max(Math.floor((Date.now() - start) / 1000), 0));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [show]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem('birthday_seen', 'true');
  };

  if (!show) return null;

  const userName = userData?.first_name || "Ananya";
  
  const start = new Date(CONFIG.anniversaryDate + "T00:00:00").getTime();
  const daysTogether = Math.max(Math.floor((Date.now() - start) / 86400000), 0);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', overflowX: 'hidden',
        background: '#0B1130', color: '#FBF6EC', fontFamily: '"Outfit", sans-serif',
        lineHeight: 1.5, scrollBehavior: 'smooth'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,400..600&family=Outfit:wght@300;400;500;600;700&family=Caveat:wght@500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        .font-hand { font-family: 'Caveat', cursive; }
        ::-webkit-scrollbar { width: 0px; }
        .eyebrow { font-family: 'Caveat', cursive; font-size: 1.35rem; color: #F7D9A0; display: inline-block; margin-bottom: 6px; transform: rotate(-2deg); }
        .section-pad { padding: min(14vh, 140px) 0; }
        .wrap { width: min(1100px, 92vw); margin: 0 auto; text-align: center; }
        
        @keyframes eq { 0%, 100% { height: 4px; } 50% { height: 14px; } }
      `}</style>

      {/* LOADER */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0B1130', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}
          >
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 300, color: '#F7D9A0' }}>making a little universe…</div>
            <div style={{ width: 'min(240px, 60vw)', height: 2, background: 'rgba(247,246,236,0.15)', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
              <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #F2897E, #F4B860)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUNDS */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 50% -10%, #241751, #0B1130 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.8, background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(244,184,96,0.35), transparent 70%), radial-gradient(ellipse 50% 30% at 80% 20%, rgba(242,137,126,0.15), transparent 70%)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.035, mixBlendMode: 'overlay', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      
      {/* STARFIELD */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {Array.from({ length: 150 }).map((_, i) => (
          <motion.div key={i} animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
            style={{ position: 'absolute', top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: Math.random() > 0.5 ? 2 : 1, height: Math.random() > 0.5 ? 2 : 1, borderRadius: '50%', background: '#F7D9A0' }}
          />
        ))}
      </div>

      {/* CLOSE BUTTON */}
      <IconButton onClick={handleClose} sx={{ position: 'fixed', top: 20, right: 20, zIndex: 300, color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
        <CloseIcon />
      </IconButton>

      {/* MUSIC TOGGLE */}
      <button onClick={() => setMusicPlaying(!musicPlaying)} style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 80, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(23,18,63,0.72)', backdropFilter: 'blur(10px)', border: '1px solid rgba(247,246,236,0.15)', padding: '10px 16px 10px 12px', borderRadius: 999, boxShadow: '0 8px 30px rgba(0,0,0,0.35)', cursor: 'pointer' }}>
        <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
           <span style={{ width: 3, background: '#F4B860', borderRadius: 2, animation: musicPlaying ? 'eq 0.9s ease-in-out infinite' : 'none' }} />
           <span style={{ width: 3, background: '#F4B860', borderRadius: 2, animation: musicPlaying ? 'eq 0.9s ease-in-out infinite 0.15s' : 'none' }} />
           <span style={{ width: 3, background: '#F4B860', borderRadius: 2, animation: musicPlaying ? 'eq 0.9s ease-in-out infinite 0.3s' : 'none' }} />
        </span>
        <span style={{ fontSize: '0.78rem', letterSpacing: '0.03em', color: '#FBF6EC' }}>{musicPlaying ? CONFIG.musicTitlePlaying : CONFIG.musicTitleIdle}</span>
      </button>

      {/* CONTENT SECTIONS */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        
        {/* HERO */}
        <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8vh 6vw', position: 'relative' }}>
          <motion.svg initial={{ strokeDashoffset: 500 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1.8, ease: "easeInOut", delay: 1 }} viewBox="0 0 300 180" style={{ width: 'min(420px, 80vw)', marginBottom: 18 }}>
            <path d="M40,140 C60,60 110,40 150,70 C190,100 230,50 260,40" fill="none" stroke="#F7D9A0" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" strokeDasharray="500" />
            <circle cx="40" cy="140" r="3" fill="#FBF6EC" />
            <circle cx="90" cy="70" r="2.4" fill="#FBF6EC" />
            <circle cx="150" cy="70" r="3.2" fill="#FBF6EC" />
            <circle cx="205" cy="80" r="2.4" fill="#FBF6EC" />
            <circle cx="260" cy="40" r="3" fill="#FBF6EC" />
          </motion.svg>
          
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 1.2 }}>
            <h1 className="font-display" style={{ fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2.2rem, 7vw, 4.6rem)', lineHeight: 1.06, color: '#FBF6EC', margin: 0 }}>
              Happy Birthday, <span style={{ fontWeight: 600, fontStyle: 'normal', color: '#F4B860', display: 'block' }}>{userName}</span>
            </h1>
            <p style={{ marginTop: 22, maxWidth: 560, fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#9D8FC7', fontWeight: 300 }}>{CONFIG.heroSubtitle}</p>
          </motion.div>

          <motion.div animate={{ y: [0, 10, 0], opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ position: 'absolute', bottom: '5vh', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: '0.72rem', letterSpacing: '0.25em', color: '#9D8FC7', textTransform: 'uppercase' }}>
            <span>scroll</span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F4B860' }} />
          </motion.div>
        </section>

        {/* STORY */}
        <section className="section-pad">
          <div className="wrap" style={{ maxWidth: 680 }}>
            <motion.p initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20%" }} transition={{ duration: 0.9 }} className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1.25rem, 2.6vw, 1.75rem)', lineHeight: 1.55, color: '#E9E1D2' }}>
              Here's to the one who leads the team, solves the problems, and still manages to keep the laughs going — <span style={{ color: '#F4B860', fontStyle: 'italic' }}>{userName}</span>. Happy Birthday!
            </motion.p>
          </div>
        </section>

        {/* PANDA ANIMATION SECTION */}
        <section className="section-pad">
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="eyebrow">just for you</span>
            <h2 className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '0 0 40px 0' }}>A little happy dance</h2>
            
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }} 
              whileInView={{ scale: 1, opacity: 1, y: 0 }} 
              viewport={{ once: true, margin: "-10%" }} 
              transition={{ type: "spring", bounce: 0.5, duration: 1.2 }}
              style={{
                width: 'min(300px, 70vw)', 
                position: 'relative'
              }}
            >
               {/* Glowing circle behind the panda */}
               <motion.div 
                 animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 style={{
                   position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(244,184,96,0.4) 0%, transparent 70%)',
                   zIndex: 0, borderRadius: '50%'
                 }}
               />
               <DancingSticker />
            </motion.div>
          </div>
        </section>

        {/* MEMORIES STACK */}
        <section className="section-pad" style={{ overflow: 'hidden' }}>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="eyebrow">some great times</span>
            <h2 className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '0 0 60px 0' }}>Moments we framed</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', maxWidth: 1000, margin: '0 auto' }}>
               {[
                 { type: 'image', src: '/pic1.jpeg', label: 'Fun times! 🥳' },
                 { type: 'image', src: '/pic2.jpeg', label: 'Unforgettable!' },
                 { type: 'image', src: '/pic3.jpeg', label: 'Team goals 🌟' },
                 { type: 'image', src: '/pic4.jpeg', label: 'Good days!' },
                 { type: 'video', src: '/video1.mp4', label: 'Office vibes 😂' }
               ].map((mem, i) => {
                 return (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 50, rotate: (i % 2 === 0 ? -4 : 4) }}
                     whileInView={{ opacity: 1, y: 0, rotate: (i % 2 === 0 ? -4 : 4) }}
                     whileHover={{ scale: 1.05, rotate: 0, y: -10, zIndex: 10 }}
                     transition={{ type: "spring", bounce: 0.4, delay: i * 0.1 }}
                     style={{ position: 'relative', width: 260, height: 320, background: '#FBF6EC', padding: '14px 14px 46px', borderRadius: 4, boxShadow: '0 15px 35px rgba(0,0,0,0.3)', cursor: 'pointer' }}
                   >
                     {/* Tape effect on top */}
                     <div style={{ position: 'absolute', top: -12, left: '50%', transform: `translateX(-50%) rotate(${(i % 2 === 0 ? 3 : -3)}deg)`, width: 60, height: 20, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 4 }} />
                     
                     <div style={{ width: '100%', height: '100%', background: '#17123F', overflow: 'hidden' }}>
                       {mem.type === 'video' ? (
                         <video src={mem.src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                         <img src={mem.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Memory ${i+1}`} />
                       )}
                     </div>
                     <div className="font-hand" style={{ fontSize: '1.25rem', color: '#2A2140', textAlign: 'center', marginTop: 12 }}>{mem.label}</div>
                   </motion.div>
                 );
               })}
            </div>
          </div>
        </section>

        {/* REASONS */}
        <section className="section-pad">
          <div className="wrap">
            <span className="eyebrow">just a few, out of many</span>
            <h2 className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: 8 }}>Reasons we appreciate you</h2>
            <p style={{ color: '#9D8FC7', marginBottom: 56 }}>{CONFIG.reasons.length} reasons (and counting)</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, maxWidth: 960, margin: '0 auto' }}>
              {CONFIG.reasons.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.7, delay: (i % 4) * 0.1 }}
                  whileHover={{ scale: 1.03, y: -6, rotate: 0 }}
                  style={{ width: 220, minHeight: 170, background: '#FBF6EC', color: '#2A2140', padding: '22px 18px', borderRadius: 4, boxShadow: '0 16px 30px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', textAlign: 'center', transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (2 + (i % 4))}deg)` }}
                >
                  <div className="font-hand" style={{ fontSize: '1.28rem', lineHeight: 1.3 }}>{r}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="section-pad">
          <div className="wrap">
            <span className="eyebrow">the numbers that matter</span>
            <h2 className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>Team stats, so far</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, marginTop: 40 }}>
              <div style={{ width: 220, padding: '32px 18px', borderRadius: 14, background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(247,246,236,0.12)' }}>
                <div className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#F4B860', fontWeight: 500 }}>{daysTogether.toLocaleString()}</div>
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#9D8FC7', letterSpacing: '0.02em' }}>days of teamwork</div>
              </div>
              <div style={{ width: 220, padding: '32px 18px', borderRadius: 14, background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(247,246,236,0.12)' }}>
                <div className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#F4B860', fontWeight: 500 }}>{Math.floor(daysTogether * 2.5).toLocaleString()}+</div>
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#9D8FC7', letterSpacing: '0.02em' }}>cups of coffee</div>
              </div>
              <div style={{ width: 220, padding: '32px 18px', borderRadius: 14, background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(247,246,236,0.12)' }}>
                <div className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#F4B860', fontWeight: 500 }}>∞</div>
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#9D8FC7', letterSpacing: '0.02em' }}>inside jokes</div>
              </div>
              <div style={{ width: 220, padding: '32px 18px', borderRadius: 14, background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(247,246,236,0.12)' }}>
                <div className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#F4B860', fontWeight: 500 }}>{CONFIG.reasons.length}</div>
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#9D8FC7', letterSpacing: '0.02em' }}>reasons to smile</div>
              </div>
            </div>
          </div>
        </section>

        {/* LETTER */}
        <section className="section-pad">
          <div className="wrap" style={{ maxWidth: 640 }}>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 1 }} style={{ background: '#FBF6EC', color: '#2A2140', borderRadius: 2, padding: 'clamp(28px, 6vw, 60px)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)', position: 'relative', textAlign: 'left' }}>
              <div style={{ position: 'absolute', top: -14, left: 36, transform: 'rotate(-4deg)', width: 80, height: 26, background: 'rgba(157,143,199,0.7)' }} />
              <div className="font-display" style={{ fontStyle: 'italic', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', marginBottom: 18 }}>{fill(CONFIG.letterSalutation, userName)}</div>
              {CONFIG.letterParagraphs.map((p, i) => (
                 <motion.p key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 + i * 0.2 }} className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.85, marginBottom: 16 }}>
                   {p}
                 </motion.p>
              ))}
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 + CONFIG.letterParagraphs.length * 0.2 }} className="font-hand" style={{ fontSize: '1.6rem', marginTop: 10, color: '#241751' }}>
                {fill(CONFIG.letterSign, userName)}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CAKE */}
        <section className="section-pad" style={{ textAlign: 'center' }}>
          <span className="eyebrow">one more thing</span>
          <h2 className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: 6 }}>Make a wish</h2>
          <p style={{ color: '#9D8FC7', marginBottom: 8 }}>Blow out the candles — go on, tap each one.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 56, position: 'relative' }}>
             <Cake candlesLit={candlesLit} onBlow={() => { setCandlesLit(false); setCelebrated(true); }} />
             {celebrated && Array.from({ length: 60 }).map((_, i) => <ConfettiPiece key={i} index={i} />)}
          </div>
          
          <p className="font-hand" style={{ marginTop: 22, fontSize: '1.2rem', color: '#F7D9A0' }}>
            {candlesLit ? 'Tap the cake…' : ''}
          </p>
          <AnimatePresence>
            {celebrated && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display" style={{ fontStyle: 'italic', fontSize: '1.3rem', color: '#FBF6EC', marginTop: 10 }}>
                Wish granted. I hope every one of your wishes finds its way to you this year 💫
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* FINALE */}
        <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8vh 6vw' }}>
          <motion.div 
            onViewportEnter={() => {
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.9 }, zIndex: 10000 });
              setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.9 }, zIndex: 10000 }), 300);
              setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { y: 0.9 }, zIndex: 10000 }), 600);
            }}
          >
            <h2 className="font-display" style={{ fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 6vw, 3.6rem)', color: '#F4B860' }}>
              {fill(CONFIG.finaleTitle, userName)}
            </h2>
            <p style={{ marginTop: 18, maxWidth: 520, color: '#E9E1D2', fontSize: '1.05rem', margin: '18px auto 0' }}>
              {CONFIG.finaleNote}
            </p>
            <p className="font-hand" style={{ marginTop: 30, fontSize: '1.6rem', color: '#9D8FC7' }}>
              {fill(CONFIG.finaleSignature, userName)}
            </p>
          </motion.div>
          
          <button onClick={() => containerRef.current?.scrollTo(0, 0)} style={{ marginTop: 44, padding: '12px 26px', border: '1px solid rgba(247,246,236,0.3)', borderRadius: 999, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FBF6EC', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(244,184,96,0.14)'; e.currentTarget.style.borderColor = '#F4B860'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(247,246,236,0.3)'; }}>
            Play it again
          </button>
        </section>

        <footer style={{ textAlign: 'center', padding: '30px 0 50px', fontSize: '0.75rem', color: '#9D8FC7', position: 'relative', zIndex: 2 }}>
          made with 💛 for someone worth every scroll
        </footer>

      </div>
    </div>
  );
}
