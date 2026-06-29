import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  Zap, 
  Clock, 
  Sparkles, 
  Play, 
  CheckCircle, 
  Loader2, 
  ShieldAlert, 
  Volume2, 
  Eye, 
  EyeOff, 
  Settings,
  Flame,
  CalendarDays
} from "lucide-react";
import { Task } from "../types";

interface ChronoBlock {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  duration: number;
  energyLevel: "Low" | "Medium" | "High";
  category: string;
  isTask: boolean;
  taskId?: string;
  recommendation: string;
}

interface ChronoBlockerProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  onVoiceFeedback?: (text: string) => void;
}

export default function ChronoBlocker({ tasks, onCompleteTask, onVoiceFeedback }: ChronoBlockerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [brainwaveMode, setBrainwaveMode] = useState("Alpha Creative");
  const [wakeTime, setWakeTime] = useState("08:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<ChronoBlock[]>([]);
  const [cognitiveCoeff, setCognitiveCoeff] = useState<number | null>(null);
  const [advisorText, setAdvisorText] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Load from local storage if available on mount
  useEffect(() => {
    try {
      const savedBlocks = localStorage.getItem("aibi_chrono_blocks");
      const savedCoeff = localStorage.getItem("aibi_chrono_coeff");
      const savedText = localStorage.getItem("aibi_chrono_text");
      if (savedBlocks) setBlocks(JSON.parse(savedBlocks));
      if (savedCoeff) setCognitiveCoeff(Number(savedCoeff));
      if (savedText) setAdvisorText(savedText);
    } catch (e) {
      // ignore
    }
  }, []);

  const saveToLocal = (blks: ChronoBlock[], coeff: number, text: string) => {
    try {
      localStorage.setItem("aibi_chrono_blocks", JSON.stringify(blks));
      localStorage.setItem("aibi_chrono_coeff", String(coeff));
      localStorage.setItem("aibi_chrono_text", text);
    } catch (e) {
      // ignore
    }
  };

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chrono/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainwaveMode, wakeTime, sleepTime })
      });

      if (!response.ok) {
        throw new Error("Failed to optimize circadian schedule.");
      }

      const data = await response.json();
      setBlocks(data.blocks);
      setCognitiveCoeff(data.cognitiveCoeff);
      setAdvisorText(data.recommText);
      saveToLocal(data.blocks, data.cognitiveCoeff, data.recommText);

      if (onVoiceFeedback && data.recommText) {
        onVoiceFeedback(data.recommText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for status styling
  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    if (cat === "work") return "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
    if (cat === "urgent") return "border-pink-500/30 text-pink-400 bg-pink-950/10 shadow-[0_0_10px_rgba(236,72,153,0.1)]";
    if (cat === "health") return "border-emerald-500/30 text-emerald-400 bg-emerald-950/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
    if (cat === "personal") return "border-amber-500/30 text-amber-400 bg-amber-950/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
    if (cat === "break") return "border-purple-500/20 text-purple-400 bg-purple-950/5";
    return "border-slate-500/25 text-slate-400 bg-slate-950/10";
  };

  return (
    <div id="chrono-blocker-panel" className="cyber-glass border border-cyan-500/20 rounded-2xl relative overflow-hidden font-mono text-white transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/30">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-xs md:text-sm font-bold font-display uppercase tracking-widest text-white">
              Circadian Daily Schedule & Focus Planner
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
              Align hourly schedules with focus states and pending tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 border rounded-lg hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 transition cursor-pointer ${showSettings ? "border-cyan-500/50 text-cyan-400 bg-cyan-950/20" : "border-white/10"}`}
            title="Configure bounds"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider border border-white/10 rounded-lg hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 transition cursor-pointer"
          >
            {isOpen ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Minimize Planner</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Expand Planner</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6">
          {/* Settings Sub-Drawer */}
          {showSettings && (
            <div className="bg-black/40 border border-white/10 p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Focus Mode / Mind State</label>
                <select
                  value={brainwaveMode}
                  onChange={(e) => setBrainwaveMode(e.target.value)}
                  className="w-full bg-[#04081b]/95 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Beta Focus">Focused (Deep Concentration / High-Focus)</option>
                  <option value="Alpha Creative">Creative (Design / Flow / Ideation)</option>
                  <option value="Theta Relaxation">Relaxed (Refining / Decompression)</option>
                  <option value="Gamma Sprint">Sprint (Problem Solving / Sprints)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Wakeup Hour</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-[#04081b]/95 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Sleep Hour</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full bg-[#04081b]/95 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Core Grid Control */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left controller panel (4 columns) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Brainwave state status card */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex gap-3.5 items-start">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">ACTIVE FOCUS STATE</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{brainwaveMode}</span>
                  <span className="text-[10px] text-gray-400 mt-1 block leading-normal">
                    {brainwaveMode.startsWith("Beta") && "Optimal for deep work, coding, and heavy concentration tasks."}
                    {brainwaveMode.startsWith("Alpha") && "Encourages calm alert states. Perfect for ideation, design, and brainstorming."}
                    {brainwaveMode.startsWith("Theta") && "Deep meditative flow state. Recommended for buffer breaks and review."}
                    {brainwaveMode.startsWith("Gamma") && "High mental processing alert state. Ideal for intense problem solving sprint sessions."}
                  </span>
                </div>
              </div>

              {/* Bio Capacity gauge */}
              {cognitiveCoeff !== null && (
                <div className="bg-[#030617]/50 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] text-gray-500 uppercase block">Energy Stamina</span>
                    <span className="text-sm font-bold text-cyan-400">{cognitiveCoeff}%</span>
                  </div>
                  {/* Progress segment */}
                  <div className="w-full h-2 bg-[#04081b] border border-white/5 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#06b6d4]"
                      style={{ width: `${cognitiveCoeff}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500 uppercase block mt-2">
                    {cognitiveCoeff > 75 ? "Optimal energy levels. Great time for deep focus." : "Notice: Energy is low. Plan buffer breaks or simple tasks."}
                  </span>
                </div>
              )}

              {/* Synthesis trigger */}
              <button
                onClick={handleSynthesize}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold uppercase tracking-wider rounded-xl hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Schedule...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Generate Daily Schedule</span>
                  </>
                )}
              </button>

              {/* AI Advice reply box */}
              {advisorText && (
                <div className="bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl flex gap-3 items-start relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="p-1 bg-cyan-500/10 text-cyan-400 rounded-md mt-0.5">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-cyan-400 font-bold uppercase block">AI Advisor Feedback</span>
                    <p className="text-[11px] text-gray-300 leading-relaxed mt-1 italic">
                      "{advisorText}"
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Right Schedule timeline (8 columns) */}
            <div className="lg:col-span-8 bg-black/40 border border-white/5 rounded-xl p-4 min-h-[300px] flex flex-col justify-center">
              {blocks.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-10 h-10 text-cyan-500/20 mx-auto mb-3" />
                  <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">No active schedule</h3>
                  <p className="text-[10px] text-gray-500 max-w-xs mx-auto mt-1 leading-normal">
                    Select your mind state, set your wake/sleep hours, and generate your optimized focus schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase pb-2 border-b border-white/5">
                    <span>Focus Time Slot</span>
                    <span>Block Category</span>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {blocks.map((block) => (
                      <div 
                        key={block.id}
                        className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${getCategoryStyles(block.category)}`}
                      >
                        {/* Time marker & indicator */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-bold text-white block tracking-wider font-display">
                              {block.startTime} - {block.endTime}
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase mt-0.5 tracking-widest font-mono">
                              ({block.duration} MIN)
                            </span>
                          </div>
                        </div>

                        {/* Block Title & info */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{block.label}</span>
                            <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/50 text-gray-400 border border-white/5">
                              {block.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-normal line-clamp-2">
                            {block.recommendation}
                          </p>
                        </div>

                        {/* Action parameters */}
                        {block.isTask && block.taskId && (
                          <button
                            onClick={() => {
                              onCompleteTask(block.taskId!);
                              // Remove or filter from local block list
                              setBlocks(prev => prev.filter(b => b.id !== block.id));
                            }}
                            className="w-full md:w-auto px-3 py-1.5 border border-cyan-500/30 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-lg text-[10px] uppercase font-bold tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Complete Node</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
