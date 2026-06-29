import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  Zap, 
  Wind, 
  Activity, 
  CheckCircle, 
  Lock, 
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { Task, ProductivityProfile } from "../types";

interface QuestAchievementsProps {
  profile: ProductivityProfile;
  tasks: Task[];
  onUpdateProfile: (updates: Partial<ProductivityProfile>) => void;
  onVoiceFeedback?: (text: string) => void;
}

interface Quest {
  id: string;
  title: string;
  requirement: string;
  xpReward: number;
  isCompleted: (tasks: Task[], profile: ProductivityProfile) => boolean;
  claimedKey: string;
}

export default function QuestAchievements({ 
  profile, 
  tasks, 
  onUpdateProfile,
  onVoiceFeedback 
}: QuestAchievementsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(60); // 60s session

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const breathOscRef = useRef<OscillatorNode | null>(null);
  const breathGainRef = useRef<GainNode | null>(null);

  // Advanced Interactive Graphics Refs
  const mousePosRef = useRef({ x: -1000, y: -1000, active: false });
  const particlesRef = useRef<{
    angle: number;
    distance: number;
    speed: number;
    radius: number;
    color: string;
    alpha: number;
  }[]>([]);

  // Gamification metrics with default values for local safety
  const level = profile.level ?? 1;
  const xp = profile.xp ?? 75;
  const completedQuests = profile.completedQuests ?? 1;
  const unlockedBadges = profile.unlockedBadges ?? ["Cognitive Pioneer"];

  // Local claimed quests track to prevent double claiming within a session
  const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("aibi_claimed_quests");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveClaimedQuests = (newClaims: Record<string, boolean>) => {
    setClaimedQuests(newClaims);
    try {
      localStorage.setItem("aibi_claimed_quests", JSON.stringify(newClaims));
    } catch (e) {
      // silent
    }
  };

  // Define dynamic achievements
  const badgesList = [
    { name: "Cognitive Pioneer", desc: "First connection established with the productivity assistant.", req: "Level 1" },
    { name: "Deep focus Adept", desc: "Clocked over 3 total focus hours.", req: "3+ Focus Hours" },
    { name: "Resolute Monk", desc: "Sustained a productivity streak above 5 days.", req: "5+ Streak Days" },
    { name: "Overload Sovereign", desc: "Completed 3 High Energy tasks.", req: "3 High Stamina Tasks" },
  ];

  // Define Quests
  const quests: Quest[] = [
    {
      id: "focus-initiate",
      title: "Daily Focus Starter",
      requirement: "Complete at least one 'Work' task.",
      xpReward: 30,
      claimedKey: "focus-initiate",
      isCompleted: (ts) => ts.some(t => t.category === "Work" && t.status === "completed")
    },
    {
      id: "streak-keeper",
      title: "Consistent Focus Streak",
      requirement: "Achieve a current streak of 3 days or more.",
      xpReward: 40,
      claimedKey: "streak-keeper",
      isCompleted: (_, prof) => prof.streakDays >= 3
    },
    {
      id: "health-guardian",
      title: "Bio-System Maintenance",
      requirement: "Create or complete an operation in the 'Health' sector.",
      xpReward: 25,
      claimedKey: "health-guardian",
      isCompleted: (ts) => ts.some(t => t.category === "Health")
    },
    {
      id: "focused-titan",
      title: "High-Energy Crusade",
      requirement: "Successfully log focus hours of 4.0 or greater.",
      xpReward: 50,
      claimedKey: "focused-titan",
      isCompleted: (_, prof) => prof.totalFocusHours >= 4.0
    }
  ];

  // Claim Quest Reward
  const handleClaimQuest = (quest: Quest) => {
    if (claimedQuests[quest.claimedKey]) return;

    const newClaims = { ...claimedQuests, [quest.claimedKey]: true };
    saveClaimedQuests(newClaims);

    // Add XP
    let currentXp = xp + quest.xpReward;
    let currentLevel = level;
    let leveledUp = false;

    if (currentXp >= 100) {
      currentLevel += 1;
      currentXp = currentXp - 100;
      leveledUp = true;
    }

    // Check new badges to unlock
    const currentBadges = [...unlockedBadges];
    if (leveledUp && currentLevel === 2 && !currentBadges.includes("Deep focus Adept")) {
      currentBadges.push("Deep focus Adept");
    }
    if (profile.streakDays >= 5 && !currentBadges.includes("Resolute Monk")) {
      currentBadges.push("Resolute Monk");
    }
    if (tasks.filter(t => t.energyRequired === "High" && t.status === "completed").length >= 3 && !currentBadges.includes("Overload Sovereign")) {
      currentBadges.push("Overload Sovereign");
    }

    onUpdateProfile({
      xp: currentXp,
      level: currentLevel,
      completedQuests: completedQuests + 1,
      unlockedBadges: currentBadges
    });

    const successMessage = leveledUp 
      ? `System level up! You have advanced to Level ${currentLevel}. New cognitive bandwidth unlocked.`
      : `Quest complete: ${quest.title}. Claimed ${quest.xpReward} experience points.`;

    if (onVoiceFeedback) {
      onVoiceFeedback(successMessage);
    }
  };

  // Breathing Canvas & Audio Loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            handleBreathingComplete();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive]);

  // Canvas drawing loop for respirator wave
  useEffect(() => {
    if (!isBreathingActive || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate 45 orbiting particles if empty
    if (particlesRef.current.length === 0) {
      const colors = ["#06b6d4", "#ec4899", "#a855f7", "#3b82f6", "#10b981", "#ff3399", "#39ff14"];
      const generated = [];
      for (let i = 0; i < 45; i++) {
        generated.push({
          angle: Math.random() * Math.PI * 2,
          distance: Math.random() * 42 + 22,
          speed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          radius: Math.random() * 1.5 + 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.65 + 0.35,
        });
      }
      particlesRef.current = generated;
    }

    let startTime = Date.now();

    const draw = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const elapsed = (Date.now() - startTime) / 1000;
      
      // Breathing phase calculations (5s cycle: 2s inhale, 1s hold, 2s exhale)
      const cycleLength = 5;
      const phaseTime = elapsed % cycleLength;
      
      let scale = 1;
      let phaseName: "Inhale" | "Hold" | "Exhale" = "Inhale";

      if (phaseTime < 2) {
        // Inhale (growing)
        scale = 0.5 + 0.5 * (phaseTime / 2);
        phaseName = "Inhale";
      } else if (phaseTime < 3) {
        // Hold (stable at max)
        scale = 1.0;
        phaseName = "Hold";
      } else {
        // Exhale (shrinking)
        scale = 1.0 - 0.5 * ((phaseTime - 3) / 2);
        phaseName = "Exhale";
      }

      setBreathPhase(phaseName);

      // Centered pulsing glowing circle
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.28;
      const currentRadius = baseRadius * scale;

      // Draw beautiful ambient backdrop glow
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width / 2);
      bgGrad.addColorStop(0, "rgba(8, 12, 38, 0.95)");
      bgGrad.addColorStop(0.5, "rgba(15, 23, 62, 0.45)");
      bgGrad.addColorStop(1, "rgba(3, 5, 16, 0.98)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle interactive magnetic cursor grid attraction lines
      if (mousePosRef.current.active) {
        ctx.beginPath();
        ctx.arc(mousePosRef.current.x, mousePosRef.current.y, 24, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(6, 182, 212, 0.08)";
        ctx.fill();

        // Cursor pulse
        ctx.beginPath();
        ctx.arc(mousePosRef.current.x, mousePosRef.current.y, 10 + Math.sin(elapsed * 10) * 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw outer cyber grid ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.15, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw radar ticks
      for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
        const x1 = centerX + Math.cos(angle) * (baseRadius * 0.95);
        const y1 = centerY + Math.sin(angle) * (baseRadius * 0.95);
        const x2 = centerX + Math.cos(angle) * (baseRadius * 1.18);
        const y2 = centerY + Math.sin(angle) * (baseRadius * 1.18);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw the main pulsing breathing core with rich neon gradient
      const glowGrad = ctx.createRadialGradient(centerX, centerY, currentRadius * 0.15, centerX, centerY, currentRadius * 1.1);
      glowGrad.addColorStop(0, "rgba(6, 182, 212, 0.65)");
      glowGrad.addColorStop(0.4, "rgba(168, 85, 247, 0.4)");
      glowGrad.addColorStop(0.8, "rgba(236, 72, 153, 0.2)");
      glowGrad.addColorStop(1, "rgba(236, 72, 153, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 1.1, 0, 2 * Math.PI);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Draw crisp core circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 0.6, 0, 2 * Math.PI);
      const strokeColor = phaseName === "Inhale" ? "#06b6d4" : phaseName === "Hold" ? "#eab308" : "#ec4899";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = strokeColor;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Frequency waves around the circle
      ctx.beginPath();
      const wavePoints = 72;
      for (let i = 0; i <= wavePoints; i++) {
        const angle = (i / wavePoints) * 2 * Math.PI;
        // Modulate distance with an oscillator wave + mouse influence
        let mod = Math.sin(elapsed * 5 + i * 0.2) * 5;
        
        // Pull towards mouse if mouse is close
        let radius = currentRadius * 0.6 + mod;
        let pX = centerX + Math.cos(angle) * radius;
        let pY = centerY + Math.sin(angle) * radius;

        if (mousePosRef.current.active) {
          const dx = mousePosRef.current.x - pX;
          const dy = mousePosRef.current.y - pY;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 60) {
            const pullFactor = (1 - distToMouse / 60) * 12;
            pX += (dx / distToMouse) * pullFactor;
            pY += (dy / distToMouse) * pullFactor;
          }
        }

        if (i === 0) ctx.moveTo(pX, pY);
        else ctx.lineTo(pX, pY);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render orbiting responsive particles
      particlesRef.current.forEach((pt) => {
        // Rotate angle
        pt.angle += pt.speed;
        
        // Base coordinate calculation
        let ptX = centerX + Math.cos(pt.angle) * pt.distance * scale;
        let ptY = centerY + Math.sin(pt.angle) * pt.distance * scale;

        // Magnetized draw towards mouse if mouse active
        if (mousePosRef.current.active) {
          const dx = mousePosRef.current.x - ptX;
          const dy = mousePosRef.current.y - ptY;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 65) {
            const magnetForce = (1 - distToMouse / 65) * 16;
            ptX += (dx / distToMouse) * magnetForce;
            ptY += (dy / distToMouse) * magnetForce;
          }
        }

        // Pulse size slightly
        const sizePulse = pt.radius + Math.sin(elapsed * 8 + pt.angle) * 0.3;

        ctx.beginPath();
        ctx.arc(ptX, ptY, Math.max(0.4, sizePulse), 0, 2 * Math.PI);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = pt.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      // Trigger Web Audio tone modulation based on phase
      modulateBreathingTone(scale, phaseName);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isBreathingActive]);

  // Handle guided rest start
  const toggleBreathing = () => {
    if (isBreathingActive) {
      stopBreathingSynth();
      setIsBreathingActive(false);
      particlesRef.current = [];
    } else {
      setIsBreathingActive(true);
      setBreathTimer(60);
      startBreathingSynth();
      if (onVoiceFeedback) {
        onVoiceFeedback("Initiating bio-system synchronization breathing. Inhale with the cyan node, hold on yellow, and exhale on pink.");
      }
    }
  };

  const handleBreathingComplete = () => {
    stopBreathingSynth();
    setIsBreathingActive(false);
    
    // Reward for finishing a mindfulness break
    let currentXp = xp + 35; // 35 XP for rest
    let currentLevel = level;
    let leveledUp = false;

    if (currentXp >= 100) {
      currentLevel += 1;
      currentXp -= 100;
      leveledUp = true;
    }

    onUpdateProfile({
      xp: currentXp,
      level: currentLevel,
      streakDays: profile.streakDays + 1
    });

    const text = leveledUp 
      ? `Mindfulness session complete! Level increased to ${currentLevel}. Streak extended to ${profile.streakDays + 1} days.`
      : `Mindfulness session completed. Added 35 experience points.`;

    if (onVoiceFeedback) {
      onVoiceFeedback(text);
    }
  };

  // Web Audio for deep breathing simulation
  const startBreathingSynth = () => {
    try {
      stopBreathingSynth();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      breathGainRef.current = gain;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, ctx.currentTime); // Deep warm F2 bass note
      breathOscRef.current = osc;

      // Lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(120, ctx.currentTime);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start();
    } catch (e) {
      console.warn(e);
    }
  };

  const modulateBreathingTone = (scale: number, phase: "Inhale" | "Hold" | "Exhale") => {
    try {
      const osc = breathOscRef.current;
      const gain = breathGainRef.current;
      const ctx = audioCtxRef.current;
      if (!osc || !gain || !ctx) return;

      const baseFreq = phase === "Inhale" ? 90 : phase === "Hold" ? 110 : 80;
      const targetFreq = baseFreq + scale * 20;
      const targetGain = 0.01 + scale * 0.03;

      osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
      gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.15);
    } catch (e) {
      // silent
    }
  };

  const stopBreathingSynth = () => {
    try {
      if (breathOscRef.current) {
        breathOscRef.current.stop();
        breathOscRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      // silent
    }
  };

  return (
    <div id="quest-deck-panel" className="cyber-glass border border-yellow-500/20 rounded-2xl relative overflow-hidden font-mono text-white transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-bl-full pointer-events-none" />
      
      {/* Title block */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/30">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
          <h2 className="text-xs md:text-sm font-bold font-display uppercase tracking-widest text-white">
            Cybernetic Achievements & Bio-Rhythm Deck
          </h2>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-mono tracking-wider border border-white/10 rounded-lg hover:border-yellow-500/40 text-gray-400 hover:text-yellow-400 transition cursor-pointer"
        >
          {isOpen ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Minimize deck</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Expand achievements</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Level & Achievements Dashboard (5 columns) */}
          <div className="lg:col-span-5 space-y-5 lg:border-r lg:border-white/5 lg:pr-6">
            
            {/* Level status block */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Cognitive Tier</span>
                  <span className="text-2xl font-bold font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    LEVEL {level}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-yellow-400 font-bold">{xp} / 100 XP</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#04081b] border border-white/5 rounded-full overflow-hidden p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500 shadow-[0_0_8px_#f59e0b]"
                  style={{ width: `${xp}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-gray-500 mt-2">
                <span className="uppercase tracking-widest">Completed: {completedQuests} Quests</span>
                <span className="uppercase tracking-widest text-emerald-400">Active streak status</span>
              </div>
            </div>

            {/* Badges and milestones */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Unlocked Badges</span>
              
              <div className="grid grid-cols-1 gap-2">
                {badgesList.map((badge, idx) => {
                  const isUnlocked = unlockedBadges.includes(badge.name);
                  return (
                    <div 
                      key={idx}
                      className={`flex gap-3 items-center p-2.5 rounded-xl border transition ${
                        isUnlocked 
                          ? "bg-yellow-950/10 border-yellow-500/20 text-white" 
                          : "bg-black/20 border-white/5 text-gray-600"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isUnlocked ? "bg-yellow-500/10 text-yellow-400" : "bg-black/40 text-gray-600"}`}>
                        {isUnlocked ? <ShieldCheck className="w-4 h-4 animate-pulse" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isUnlocked ? "text-yellow-400" : "text-gray-500"}`}>{badge.name}</span>
                          <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/40 text-gray-400">{badge.req}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 leading-normal block mt-0.5">{badge.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* MIDDLE: Quest Challenges Checklist (4 columns) */}
          <div className="lg:col-span-4 space-y-4 lg:border-r lg:border-white/5 lg:pr-6">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Daily Tactical Challenges</span>

            <div className="space-y-3">
              {quests.map((quest) => {
                const finished = quest.isCompleted(tasks, profile);
                const claimed = claimedQuests[quest.claimedKey];
                return (
                  <div 
                    key={quest.id}
                    className={`p-3.5 rounded-xl border font-mono transition flex flex-col justify-between min-h-[110px] ${
                      claimed 
                        ? "bg-emerald-950/10 border-emerald-500/20 opacity-65"
                        : finished 
                        ? "bg-yellow-500/10 border-yellow-500/40 glow-yellow animate-pulse" 
                        : "bg-black/30 border-white/5"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={`text-xs font-bold leading-snug ${claimed ? "text-emerald-400" : finished ? "text-yellow-300" : "text-white"}`}>
                          {quest.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${claimed ? "bg-emerald-950/50 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          +{quest.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal mb-2.5">
                        {quest.requirement}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      {claimed ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Reward claimed</span>
                        </div>
                      ) : finished ? (
                        <button
                          onClick={() => handleClaimQuest(quest)}
                          className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-md"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Claim Reward</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                          <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                          <span>In progress...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Bio-system breathe module (3 columns) */}
          <div className="lg:col-span-3 flex flex-col justify-between items-center text-center space-y-4">
            <div className="w-full text-left">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Bio-Sync respirator</span>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                Vent cognitive load and restore dynamic bio-stamina state.
              </p>
            </div>

            {/* Visual respirator stage */}
            <div className="relative w-full aspect-square max-w-[170px] bg-black/40 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden">
              {isBreathingActive ? (
                <>
                  <canvas 
                    ref={canvasRef} 
                    width={170} 
                    height={170} 
                    className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      mousePosRef.current = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        active: true
                      };
                    }}
                    onMouseEnter={() => {
                      mousePosRef.current.active = true;
                    }}
                    onMouseLeave={() => {
                      mousePosRef.current.active = false;
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        mousePosRef.current = {
                          x: e.touches[0].clientX - rect.left,
                          y: e.touches[0].clientY - rect.top,
                          active: true
                        };
                      }
                    }}
                    onTouchStart={(e) => {
                      if (e.touches.length > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        mousePosRef.current = {
                          x: e.touches[0].clientX - rect.left,
                          y: e.touches[0].clientY - rect.top,
                          active: true
                        };
                      }
                    }}
                    onTouchEnd={() => {
                      mousePosRef.current.active = false;
                    }}
                  />
                  <div className="absolute text-center pointer-events-none select-none z-10">
                    <span className="block text-xs uppercase tracking-widest font-bold text-white mb-0.5">
                      {breathPhase}
                    </span>
                    <span className="text-2xl font-bold font-display text-white tracking-tight">
                      {breathTimer}s
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Wind className="w-8 h-8 text-cyan-500/30 mx-auto mb-2" />
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest block">Respirator Offline</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <button
              onClick={toggleBreathing}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                isBreathingActive
                  ? "bg-rose-900/30 text-rose-400 border border-rose-500/30 hover:bg-rose-900/40"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:opacity-95"
              }`}
            >
              <Wind className="w-4 h-4" />
              <span>{isBreathingActive ? "Abort Bio-Sync" : "Calibrate Breather"}</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
