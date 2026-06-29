import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Task, TrackerNode } from "../types";
import { TrendingUp, PieChart as PieIcon, Cpu, Zap, Eye, EyeOff, Clock, Brain, Activity, ListCollapse } from "lucide-react";

interface AnalyticsPanelProps {
  tasks: Task[];
  trackers?: TrackerNode[];
}

export default function AnalyticsPanel({ tasks, trackers = [] }: AnalyticsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeChart, setActiveChart] = useState<"sectors" | "load" | "radar" | "focus-history" | "focus-states">("sectors");

  // 1. Calculate Sector Allocation (Category counts)
  const categories = ["Work", "Personal", "Health", "Urgent", "Other"];
  const sectorColors: Record<string, string> = {
    Work: "#06b6d4",     // Cyan
    Urgent: "#ec4899",   // Pink
    Health: "#10b981",   // Emerald
    Personal: "#f59e0b", // Amber
    Other: "#8b5cf6"     // Purple
  };

  const sectorData = categories.map(cat => {
    const count = tasks.filter(t => t.category === cat).length;
    return {
      name: cat,
      value: count,
      color: sectorColors[cat]
    };
  }).filter(item => item.value > 0);

  // Fallback if no tasks
  const hasData = sectorData.length > 0;

  // 2. Calculate daily workload (timeline task count)
  // Group tasks by deadline date (YYYY-MM-DD)
  const dailyWorkload: Record<string, { total: number; completed: number }> = {};
  tasks.forEach(t => {
    if (t.deadline) {
      const dateStr = t.deadline.split("T")[0];
      if (!dailyWorkload[dateStr]) {
        dailyWorkload[dateStr] = { total: 0, completed: 0 };
      }
      dailyWorkload[dateStr].total += 1;
      if (t.status === "completed") {
        dailyWorkload[dateStr].completed += 1;
      }
    }
  });

  const timelineData = Object.keys(dailyWorkload)
    .sort()
    .slice(-7) // last 7 days with schedules
    .map(date => {
      const d = new Date(date);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date: label,
        Total: dailyWorkload[date].total,
        Completed: dailyWorkload[date].completed
      };
    });

  // 3. Cognitive Energy Requirements (Radar Chart data)
  const radarData = categories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    let totalScore = 0;
    catTasks.forEach(t => {
      if (t.energyRequired === "High") totalScore += 3;
      else if (t.energyRequired === "Medium") totalScore += 2;
      else totalScore += 1;
    });
    return {
      subject: cat,
      Load: catTasks.length > 0 ? Math.round((totalScore / (catTasks.length * 3)) * 100) : 0,
      fullMark: 100
    };
  });

  // 4. Focus Session Analytics
  const focusSessions = trackers.filter(t => t.metricName === "Focus Session");
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.value, 0);
  
  // Calculate dominant mind state counts
  const mindStateCounts: Record<string, number> = {};
  focusSessions.forEach(s => {
    const state = s.mindState || "Deep Concentration";
    mindStateCounts[state] = (mindStateCounts[state] || 0) + 1;
  });

  const focusStateData = Object.keys(mindStateCounts).map(state => {
    let color = "#f59e0b"; // Amber
    if (state.includes("Alpha")) color = "#06b6d4"; // Cyan
    if (state.includes("Beta")) color = "#ec4899";  // Pink
    if (state.includes("Theta")) color = "#10b981"; // Emerald
    if (state.includes("Gamma")) color = "#8b5cf6"; // Purple

    return {
      name: state,
      value: mindStateCounts[state],
      color
    };
  });

  // Dominant Mind State determination
  let dominantMindState = "None Detected";
  let maxCount = 0;
  Object.keys(mindStateCounts).forEach(state => {
    if (mindStateCounts[state] > maxCount) {
      maxCount = mindStateCounts[state];
      dominantMindState = state;
    }
  });

  const activeTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Custom tooltips for cyberpunk style
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#030617] border border-cyan-500/30 p-2.5 rounded-lg text-xs font-mono text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.color || "#ec4899" }} />
              <span className="text-gray-400">{p.name || "Sessions"}:</span>
              <span className="font-bold text-white">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cyber-glass border border-cyan-500/20 rounded-2xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />
      
      {/* Panel Title bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/30">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-xs md:text-sm font-bold font-display uppercase tracking-widest text-white">
            Cognitive Diagnostics & Productivity Analytics
          </h2>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-mono tracking-wider border border-white/10 rounded-lg hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 transition cursor-pointer"
        >
          {isOpen ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Minimize Panel</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Expand Diagnostics</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 font-mono grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Diagnostic status checklist */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4 border-r border-white/5 pr-0 lg:pr-6">
            <div className="space-y-3">
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Diagnostic Metrics</span>
              
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Completion Coefficient</span>
                <span className="text-sm font-bold text-emerald-400 font-display">{completionRate}%</span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Focused Time</span>
                <span className="text-sm font-bold text-pink-400 font-display">{totalFocusMinutes} Mins</span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Focus Resonance</span>
                <span className="text-xs font-bold text-cyan-400 text-right max-w-[150px] truncate" title={dominantMindState}>
                  {dominantMindState.split(" ")[0] || "None"}
                </span>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Active Task Units</span>
                <span className="text-sm font-bold text-purple-400 font-display">{activeTasks.length} Logs</span>
              </div>
            </div>

            {/* Visual Selector Switches */}
            <div className="space-y-1.5 pt-2">
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Visualization Mode</span>
              <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setActiveChart("sectors")}
                  className={`flex-1 min-w-[65px] py-1 text-[8px] sm:text-[9px] uppercase tracking-wider rounded-md font-bold transition cursor-pointer ${activeChart === "sectors" ? "bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-gray-400 hover:text-white"}`}
                >
                  Sectors
                </button>
                <button
                  onClick={() => setActiveChart("load")}
                  className={`flex-1 min-w-[65px] py-1 text-[8px] sm:text-[9px] uppercase tracking-wider rounded-md font-bold transition cursor-pointer ${activeChart === "load" ? "bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-gray-400 hover:text-white"}`}
                >
                  Load Area
                </button>
                <button
                  onClick={() => setActiveChart("radar")}
                  className={`flex-1 min-w-[65px] py-1 text-[8px] sm:text-[9px] uppercase tracking-wider rounded-md font-bold transition cursor-pointer ${activeChart === "radar" ? "bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "text-gray-400 hover:text-white"}`}
                >
                  Radar
                </button>
                <button
                  onClick={() => setActiveChart("focus-history")}
                  className={`flex-1 min-w-[90px] py-1 text-[8px] sm:text-[9px] uppercase tracking-wider rounded-md font-bold transition cursor-pointer ${activeChart === "focus-history" ? "bg-pink-500 text-black shadow-[0_0_8px_rgba(236,72,153,0.3)]" : "text-gray-400 hover:text-white"}`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveChart("focus-states")}
                  className={`flex-1 min-w-[90px] py-1 text-[8px] sm:text-[9px] uppercase tracking-wider rounded-md font-bold transition cursor-pointer ${activeChart === "focus-states" ? "bg-pink-500 text-black shadow-[0_0_8px_rgba(236,72,153,0.3)]" : "text-gray-400 hover:text-white"}`}
                >
                  States
                </button>
              </div>
            </div>
          </div>

          {/* Graphical Display */}
          <div className="lg:col-span-8 bg-black/30 rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center min-h-[240px]">
            {activeChart === "sectors" ? (
              !hasData ? (
                <div className="text-center py-8">
                  <PieIcon className="w-8 h-8 text-cyan-500/30 mx-auto mb-2" />
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Diagnostics standby: Create tasks to populate sectors</span>
                </div>
              ) : (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#04081b" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle" 
                        formatter={(value) => <span className="text-[10px] text-gray-400 uppercase font-mono">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : activeChart === "load" ? (
              timelineData.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-cyan-500/30 mb-2" />
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Schedule tasks with deadlines to populate timeline area</span>
                </div>
              ) : (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#4b5563" fontSize={9} fontStyle="mono" tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={9} fontStyle="mono" tickLine={false} width={24} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Total" stroke="#ec4899" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="Completed" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCompleted)" />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle" 
                        formatter={(value) => <span className="text-[10px] text-gray-400 uppercase font-mono">{value}</span>}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : activeChart === "radar" ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#1e293b" tick={false} />
                    <Radar name="Cognitive Load %" dataKey="Load" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : activeChart === "focus-states" ? (
              focusStateData.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <Brain className="w-8 h-8 text-pink-500/30 mb-2 animate-pulse" />
                  <span className="text-xs text-gray-500 uppercase tracking-widest">No brainwave state logs recorded</span>
                  <span className="text-[10px] text-gray-600 mt-1">Complete focus blocks with selected mind states</span>
                </div>
              ) : (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusStateData} layout="vertical">
                      <XAxis type="number" stroke="#4b5563" fontSize={9} fontStyle="mono" tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={8} fontStyle="mono" tickLine={false} width={130} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Sessions" fill="#ec4899" radius={[0, 4, 4, 0]}>
                        {focusStateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : (
              <div className="w-full h-[220px] overflow-y-auto pr-1 space-y-2 text-left">
                {focusSessions.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    <Clock className="w-8 h-8 text-pink-500/30 mb-2" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest">No focus sessions archived</span>
                    <span className="text-[10px] text-gray-600 mt-1">Run focus sessions in the timer to write logs</span>
                  </div>
                ) : (
                  focusSessions.slice().reverse().map((session) => (
                    <div key={session.id} className="p-3 bg-black/40 border border-white/5 hover:border-pink-500/20 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 transition duration-250">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded text-[9px] text-pink-400 font-bold uppercase tracking-widest">
                            {session.value} MINS
                          </span>
                          <span className="text-xs font-bold text-white">
                            {session.taskTitle || "Ambient Focus Session"}
                          </span>
                        </div>
                        {session.notes && (
                          <p className="text-[10px] text-gray-400 italic font-mono leading-relaxed pl-1">
                            “{session.notes}”
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[9px] text-gray-500 uppercase tracking-widest pl-1">
                          <span>Date: {session.createdAt}</span>
                          {session.mindState && (
                            <span className="text-cyan-400/80 font-bold">
                              Resonance: {session.mindState}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Complete
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
