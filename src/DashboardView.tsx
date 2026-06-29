import React, { useState, useEffect } from "react";
import { 
  Check,
  Clock, 
  Sparkles, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  Plus,
  Trash2,
  ArrowUpDown,
  Brain,
  AlertCircle,
  ChevronUp,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { Task, ProductivityProfile, Habit } from "../types";
import { getLocalDateString } from "../App";

interface DashboardViewProps {
  currentUser: any;
  profile: ProductivityProfile;
  tasks: Task[];
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  generalInsight: string;
  onFocusComplete: (minutes: number, taskId?: string) => void;
  onToggleTaskStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onPrioritizeTasks: () => void;
  onUpdateProfile: (updates: Partial<ProductivityProfile>) => void;
  onAddTask: (taskData: {
    title: string;
    description: string;
    deadline: string;
    duration: number;
    energyRequired: "Low" | "Medium" | "High";
    category: "Work" | "Personal" | "Health" | "Urgent" | "Other";
  }) => void;
  onOpenAiAssistant: () => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color: string; // border color class
  date: string;
}

export default function DashboardView({
  currentUser,
  profile,
  tasks,
  habits,
  onToggleHabit,
  generalInsight,
  onFocusComplete,
  onToggleTaskStatus,
  onDeleteTask,
  onPrioritizeTasks,
  onUpdateProfile,
  onAddTask,
  onOpenAiAssistant
}: DashboardViewProps) {
  
  // --- STATE FOR TASK MANAGER SORTING & ADDING ---
  const [sortBy, setSortBy] = useState<"deadline" | "ai_priority">("deadline");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formDuration, setFormDuration] = useState(30);
  const [formEnergy, setFormEnergy] = useState<"Low" | "Medium" | "High">("Medium");
  const [formCategory, setFormCategory] = useState<"Work" | "Personal" | "Health" | "Urgent" | "Other">("Work");
  const [isPrioritizingSpin, setIsPrioritizingSpin] = useState(false);

  // --- FLOATING ROBOT GREETING CONTROL ---
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  
  // Clean, welcoming messages
  const welcomeMessage = "Welcome! Ready for today? What's new for today? Let's check off some of your tasks! Click me anytime to talk. 🤖";

  useEffect(() => {
    // Keep showing bubble for 10 seconds on page open, then automatically close
    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // --- AI PRIORITIZE TRIGGER ---
  const handleAiPrioritizeClick = () => {
    setIsPrioritizingSpin(true);
    onPrioritizeTasks();
    setTimeout(() => {
      setIsPrioritizingSpin(false);
    }, 1500);
  };

  // --- ADD TASK FORM SUBMIT ---
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    
    // Default deadline to 1 day from now if empty
    let finalDeadline = formDeadline;
    if (!finalDeadline) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      finalDeadline = tomorrow.toISOString().substring(0, 16);
    }

    onAddTask({
      title: formTitle,
      description: formDescription,
      deadline: finalDeadline,
      duration: Number(formDuration),
      energyRequired: formEnergy,
      category: formCategory
    });

    // Reset Form
    setFormTitle("");
    setFormDescription("");
    setFormDeadline("");
    setFormDuration(30);
    setFormEnergy("Medium");
    setFormCategory("Work");
    setIsAddFormOpen(false);
  };

  // --- SAFE TASKS PARSING ---
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Sort tasks dynamically based on selected criterion
  const sortedTasks = [...safeTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return timeA - timeB;
    } else {
      // Sort by AI priority score descending
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
  });

  // --- FRIENDLY DATE FORMATTER ---
  const formatDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return "No deadline set";
    try {
      const d = new Date(deadlineStr);
      if (isNaN(d.getTime())) return deadlineStr;
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs < 0) {
        const absMins = Math.abs(diffMins);
        if (absMins < 60) return `Overdue by ${absMins}m`;
        const absHours = Math.abs(diffHours);
        if (absHours < 24) return `Overdue by ${absHours}h`;
        return `Overdue by ${Math.abs(diffDays)}d`;
      }

      if (diffMins < 60) return `Due in ${diffMins}m`;
      if (diffHours < 24) return `Due in ${diffHours}h`;
      if (diffDays < 7) return `Due in ${diffDays}d`;
      
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return deadlineStr;
    }
  };

  // Badge dynamic style creators
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "Work":
        return "bg-blue-500/10 text-blue-300 border border-blue-500/30";
      case "Personal":
        return "bg-amber-500/10 text-amber-300 border border-amber-500/30";
      case "Health":
        return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
      case "Urgent":
        return "bg-rose-500/10 text-rose-300 border border-rose-500/30 animate-pulse";
      default:
        return "bg-purple-500/10 text-purple-300 border border-purple-500/30";
    }
  };

  const getPriorityStyle = (label?: string) => {
    switch (label) {
      case "Critical":
        return "bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)]";
      case "High":
        return "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.15)]";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-300 border border-yellow-500/25";
      case "Low":
        return "bg-cyan-500/10 text-cyan-300 border border-cyan-500/25";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  // --- STATE FOR CARD: AI SUGGESTIONS ---
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // --- STATE FOR CARD: FOCUS SESSION (COUNTDOWN TIMER) ---
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Clean 25 minutes
  const [timerRunning, setTimerRunning] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerRunning && timeLeft === 0) {
      setTimerRunning(false);
      triggerSuccessSound();
      onFocusComplete(25);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // --- STATE FOR CARD: CALENDAR EVENTS ---
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");

  // Load from backend on mount or when tasks/habits state changes
  useEffect(() => {
    fetchSuggestions();
    fetchSchedule();
  }, [tasks, habits]);

  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/suggestions");
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions", e);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/schedule");
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data);
      }
    } catch (e) {
      console.error("Failed to fetch schedule", e);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleToggleSuggestion = async (id: string) => {
    // Optimistic UI update
    setAiSuggestions(prev => prev.map(s => s.id === id ? { ...s, applied: !s.applied } : s));
    try {
      const res = await fetch(`/api/suggestions/${id}/toggle`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data);
      }
    } catch (e) {
      console.error("Failed to toggle suggestion", e);
    }
  };

  const handleRegenerateSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/suggestions/generate", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data);
      }
    } catch (e) {
      console.error("Failed to regenerate suggestions", e);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventTime.trim()) return;

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newEventTitle, time: newEventTime })
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data);
        setNewEventTitle("");
        setNewEventTime("");
        setShowAddEvent(false);
      }
    } catch (err) {
      console.error("Failed to add schedule event", err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    // Optimistic UI update
    setCalendarEvents(prev => prev.filter(evt => evt.id !== id));
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data);
      }
    } catch (err) {
      console.error("Failed to delete schedule event", err);
    }
  };

  const triggerSuccessSound = () => {
    if (audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Sound blocked", e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative text-gray-200">
      
      <style>{`
        @keyframes floatAgent {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        @keyframes pulseLaser {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes robotBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          55% { transform: scaleY(0.1); }
        }
        .animate-float-agent {
          animation: floatAgent 5s ease-in-out infinite;
        }
        .animate-pulse-laser {
          animation: pulseLaser 2.5s infinite;
        }
        .animate-robot-blink {
          animation: robotBlink 4s infinite;
        }
      `}</style>

      {/* 1. HEADER & WELCOME BLOCK */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-black/40 border border-white/10 p-8 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]">{currentUser?.fullName || currentUser?.username || "Orbital Companion"}</span>
          </h1>
          <p className="text-sm font-medium text-gray-400 mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Your assistant is ready • are you ??
          </p>
        </div>

        {/* Daily helpful suggestion tip box */}
        <div className="flex items-start gap-3 bg-cyan-950/20 border border-cyan-500/20 p-5 rounded-xl max-w-md w-full md:w-auto hover:border-cyan-500/40 transition duration-300 shadow-md">
          <Sparkles className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">Orbital Productivity Tip:</span>
            <p className="text-sm text-gray-300 mt-1 leading-relaxed">
              {generalInsight || "Your agenda is fully organized by deadline. Try finishing the urgent tasks first to free up your afternoon!"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT GRID (LEFT: TASK MANAGER, RIGHT: PRODUCTIVITY UTILITIES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRIMARY TASK MANAGER */}
        <div className="md:col-span-2 lg:col-span-2 space-y-6">
          
          <div className="cyber-glass border border-white/10 p-7 rounded-2xl flex flex-col justify-between shadow-xl relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div>
              {/* Task manager toolbar header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <Check className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">My Task Manager</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Organized by deadline and prioritized for you
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Sorting dropdown */}
                  <div className="flex items-center bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-sm">
                    <ArrowUpDown className="w-4 h-4 text-cyan-400 mr-2" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-gray-200 outline-none cursor-pointer text-sm"
                    >
                      <option value="deadline" className="bg-[#0c0e20]">Sort by Deadline</option>
                      <option value="ai_priority" className="bg-[#0c0e20]">Sort by Priority</option>
                    </select>
                  </div>

                  {/* AI Prioritize button */}
                  <button
                    onClick={handleAiPrioritizeClick}
                    disabled={isPrioritizingSpin}
                    className="h-9 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-95 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md"
                    title="Let AI prioritize your tasks"
                  >
                    <Sparkles className={`w-4 h-4 ${isPrioritizingSpin ? "animate-spin" : ""}`} />
                    <span>AI Prioritize</span>
                  </button>

                  {/* Add task toggle */}
                  <button
                    onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                    className="h-9 w-9 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl flex items-center justify-center cursor-pointer transition shadow-md"
                    title="Add a new task"
                  >
                    {isAddFormOpen ? <ChevronUp className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                  </button>
                </div>
              </div>

              {/* COLLAPSIBLE ADD NEW TASK FORM */}
              {isAddFormOpen && (
                <div className="mb-6 p-6 rounded-xl border border-cyan-500/20 bg-cyan-950/10 shadow-inner animate-slide-in text-sm text-gray-200">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add a New Task
                  </h3>
                  
                  <form onSubmit={handleTaskSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-xs text-cyan-400 block font-medium">Task Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Prepare presentation slides"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      {/* Deadline */}
                      <div className="space-y-1">
                        <label className="text-xs text-cyan-400 block font-medium">Due Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formDeadline}
                          onChange={(e) => setFormDeadline(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      
                      {/* Category */}
                      <div className="space-y-1">
                        <label className="text-xs text-cyan-400 block font-medium">Category</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer h-[40px]"
                        >
                          <option value="Work">Work</option>
                          <option value="Personal">Personal</option>
                          <option value="Health">Health</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>


                      {/* Energy */}
                      <div className="space-y-1">
                        <label className="text-xs text-cyan-400 block font-medium">Energy Level</label>
                        <select
                          value={formEnergy}
                          onChange={(e) => setFormEnergy(e.target.value as any)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer h-[40px]"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      {/* Submit */}
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full h-[40px] bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm transition cursor-pointer"
                        >
                          Save Task
                        </button>
                      </div>

                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-xs text-cyan-400 block font-medium">Description</label>
                      <input
                        type="text"
                        placeholder="Add some details, sub-tasks or notes..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </form>
                </div>
              )}

              {/* LIST OF TASKS */}
              <div className="space-y-4">
                {sortedTasks.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-white/10 rounded-2xl bg-black/20">
                    <AlertCircle className="w-10 h-10 text-cyan-500/40 mx-auto mb-3" />
                    <p className="text-base text-gray-300 font-bold">No Active Tasks</p>
                    <p className="text-sm text-gray-500 mt-1">Click the '+' button above to schedule your first task!</p>
                  </div>
                ) : (
                  sortedTasks.map((task) => {
                    const isCompleted = task.status === "completed";
                    return (
                      <div
                        key={task.id}
                        className={`group relative p-5 rounded-xl border transition-all duration-300 ${
                          isCompleted
                            ? "bg-white/[0.01] border-white/5 text-gray-500"
                            : "bg-black/40 border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] hover:shadow-lg"
                        }`}
                      >
                        <div className="absolute top-0 bottom-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {/* Checkbox button */}
                            <button
                              onClick={() => onToggleTaskStatus(task.id)}
                              className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border ${
                                isCompleted
                                  ? "bg-cyan-500 border-cyan-500 text-black shadow-md"
                                  : "border-white/20 hover:border-cyan-400 hover:bg-cyan-500/10"
                              }`}
                            >
                              {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                            </button>

                            {/* Details */}
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-base font-bold transition-all ${isCompleted ? "line-through opacity-50" : "text-white"}`}>
                                  {task.title}
                                </span>
                                
                                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${getCategoryColor(task.category)}`}>
                                  {task.category}
                                </span>

                                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${getPriorityStyle(task.aiPriorityLabel || "Medium")}`}>
                                  Priority: {task.aiPriorityLabel || "Medium"}
                                </span>
                              </div>

                              {task.description && (
                                <p className={`text-sm leading-relaxed max-w-xl ${isCompleted ? "opacity-30" : "text-gray-300"}`}>
                                  {task.description}
                                </p>
                              )}

                              {/* Due time and length parameters */}
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest font-semibold transition duration-300 ${
                                  task.deadline && new Date(task.deadline).getTime() - new Date().getTime() < 3600000 * 3 && !isCompleted
                                    ? "text-rose-400 border-rose-500/40 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                                    : "text-cyan-300 border-cyan-500/20 bg-cyan-950/20 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                }`}>
                                  <Calendar className="w-3.5 h-3.5" />
                                  Due: {formatDeadline(task.deadline)}
                                </span>
                              </div>

                              {/* AI explanation */}
                              {task.aiReasoning && !isCompleted && (
                                <div className="text-xs text-purple-300 bg-purple-500/5 p-3 rounded-lg border border-purple-500/10 mt-2 max-w-lg leading-relaxed flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                  <span>{task.aiReasoning}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Delete task */}
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="text-gray-400 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 cursor-pointer transition"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                All tasks synced and up to date
              </span>
              <span className="text-cyan-400 font-bold">
                Total: {safeTasks.length} tasks
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: FOCUS TIMER & OTHER BOXES */}
        <div className="space-y-6">

          {/* FOCUS WORK SESSION */}
          <div className="cyber-glass border border-white/10 p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group relative min-h-[300px]">
            <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 fill-emerald-400 stroke-none text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]" />
                  <h2 className="text-lg font-bold text-white tracking-wide">Focus Session</h2>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              {/* Countdown stopwatch */}
              <div className="text-center py-4 flex flex-col items-center">
                <h3 className="text-5xl font-extrabold tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] select-none">
                  {formatTime(timeLeft)}
                </h3>
                <p className="text-sm text-gray-400 mt-2 font-medium">
                  Deep work on scheduled goals
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                    timerRunning 
                      ? "bg-amber-500 text-black shadow-md hover:scale-105" 
                      : "bg-cyan-500 text-black shadow-md hover:scale-105 hover:shadow-cyan-500/40"
                  }`}
                  title={timerRunning ? "Pause" : "Start"}
                >
                  {timerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimeLeft(25 * 60);
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setAudioMuted(!audioMuted)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-pink-400/50 flex items-center justify-center text-gray-400 hover:text-pink-400 transition-all cursor-pointer"
                  title={audioMuted ? "Unmute Sound" : "Mute Sound"}
                >
                  {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
              <span>Focus timer tracker</span>
            </div>
          </div>

          {/* AI SUGGESTIONS */}
          <div className="cyber-glass border border-white/10 p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group relative min-h-[300px]">
            <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.4)]" />
                  <h2 className="text-lg font-bold text-white tracking-wide">Smart Suggestions</h2>
                </div>
                <button
                  onClick={handleRegenerateSuggestions}
                  disabled={suggestionsLoading}
                  className="p-1 px-2 border border-white/10 rounded hover:border-pink-500/50 hover:text-pink-400 text-gray-400 text-xs flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                  title="Regenerate dynamic AI suggestions"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${suggestionsLoading ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-mono">Regen</span>
                </button>
              </div>

              {suggestionsLoading && aiSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RotateCcw className="w-6 h-6 text-pink-400 animate-spin" />
                  <span className="text-xs text-gray-400 font-mono">Analysing metrics...</span>
                </div>
              ) : aiSuggestions.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500 font-mono">
                  No smart suggestions available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {aiSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSuggestion(item.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:bg-pink-500/5 ${
                        item.applied 
                          ? "bg-emerald-500/5 border-emerald-500/30 shadow-md"
                          : "bg-[#0c0e1a]/60 border-white/5 hover:border-pink-500/30"
                      }`}
                    >
                      <p className="text-sm text-gray-200 leading-relaxed font-medium">
                        {item.text}
                      </p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-pink-400 font-semibold">{item.category || "Advice"}</span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${item.applied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-400"}`}>
                          {item.applied ? "Applied" : "Apply"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
              <span>{suggestionsLoading ? "Regenerating..." : "AI-Generated Productivity Advice"}</span>
            </div>
          </div>

          {/* HABIT STREAKS */}
          <div className="cyber-glass border border-white/10 p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group relative min-h-[300px]">
            <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.4)] animate-pulse" />
                  <h2 className="text-lg font-bold text-white tracking-wide">Habit Streaks</h2>
                </div>
                <span className="text-xs text-gray-400">Weekly Consistency</span>
              </div>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {habits.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No habits configured. Go to the Habit Tracker tab to add some!</p>
                ) : (
                  habits.map((habit) => {
                    const todayStr = getLocalDateString();
                    const isCompletedToday = habit.completedDays.includes(todayStr);
                    
                    // Calculate rolling 7 days consistency percentage
                    const last7DaysCompletionsCount = habit.completedDays.filter(day => {
                      const diffMs = new Date().getTime() - new Date(day).getTime();
                      const diffDays = diffMs / (1000 * 60 * 60 * 24);
                      return diffDays <= 7 && diffDays >= 0;
                    }).length;
                    const progressPercent = Math.round((last7DaysCompletionsCount / 7) * 100);

                    const gradient = isCompletedToday
                      ? "from-cyan-500 to-teal-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]";

                    return (
                      <div
                        key={habit.id}
                        onClick={() => onToggleHabit(habit.id)}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-cyan-500/20 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group/item select-none"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Circular toggle switch check */}
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isCompletedToday 
                              ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
                              : "border-white/20 text-transparent group-hover/item:border-cyan-500/50"
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <span className={`block text-sm font-semibold truncate transition-all ${
                              isCompletedToday ? "text-gray-400 line-through" : "text-gray-200 group-hover/item:text-cyan-300"
                            }`}>{habit.name}</span>
                            
                            {/* Mini progress bar */}
                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden mt-1 border border-white/5">
                              <div
                                className={`h-full bg-gradient-to-r rounded-full transition-all duration-700 ${gradient}`}
                                style={{ width: `${Math.max(5, progressPercent)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                          <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? "animate-pulse" : "opacity-40"}`} />
                          <span>{habit.streak}d</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
              <span>Click any habit to log progress</span>
            </div>
          </div>

          {/* CALENDAR TIMEBLOCKS */}
          <div className="cyber-glass border border-white/10 p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group relative">
            <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white tracking-wide">Today's Schedule</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddEvent(!showAddEvent)}
                    className="p-1 border border-white/10 rounded hover:border-emerald-500/50 hover:text-emerald-400 text-gray-400 text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Add manual event to schedule"
                  >
                    {showAddEvent ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-mono">{showAddEvent ? "Close" : "Add"}</span>
                  </button>
                  <span className="text-xs text-gray-400">Today</span>
                </div>
              </div>

              {showAddEvent && (
                <form onSubmit={handleAddEventSubmit} className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">Event Title</label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g., Client sync, Gym, Lunch break"
                      required
                      className="w-full bg-[#080a14] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-emerald-400/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">Time</label>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="e.g., 10:00 AM, 1:30 PM, Evening"
                      required
                      className="w-full bg-[#080a14] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-emerald-400/50 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddEvent(false)}
                      className="px-2.5 py-1 text-[10px] font-mono border border-white/10 hover:bg-white/5 rounded text-gray-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-[10px] font-mono bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded cursor-pointer"
                    >
                      Add Event
                    </button>
                  </div>
                </form>
              )}

              {scheduleLoading && calendarEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="text-xs text-gray-400 font-mono">Syncing calendar...</span>
                </div>
              ) : calendarEvents.filter(evt => evt.date === getLocalDateString() || !evt.date).length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-mono">
                  Your schedule is clear today.
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarEvents.filter(evt => evt.date === getLocalDateString() || !evt.date).map((evt) => (
                    <div
                      key={evt.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-l-[3.5px] border-y-transparent border-r-transparent transition-all duration-300 hover:translate-x-1 ${evt.color}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide">{evt.title}</span>
                        <span className="text-xs opacity-75">{evt.time}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-rose-400 transition cursor-pointer"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
              <span>{scheduleLoading ? "Syncing..." : "Synced with local timeline database"}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. PORTABLE FRIENDLY FLOATING AI AGENT ROBOT */}
      <div 
        className="fixed bottom-6 right-6 z-50 flex items-end gap-3 pointer-events-none group/robot select-none"
      >
        {/* Chat message bubble - only show when open, dismissable, with manual hide button */}
        {showSpeechBubble && (
          <div className="relative bg-[#06081c]/95 border border-cyan-500/50 text-cyan-200 text-sm px-4 py-3 rounded-2xl w-56 shadow-2xl pointer-events-auto leading-relaxed transition-all duration-300 animate-fade-in hover:scale-102 border-b-2 mb-2">
            
            {/* Manual Close cross */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeechBubble(false);
              }}
              className="absolute top-2 right-2 text-cyan-400 hover:text-white p-0.5 rounded transition cursor-pointer"
              title="Dismiss greeting"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="absolute right-[-6px] bottom-6 w-3 h-3 bg-[#06081c] border-r border-b border-cyan-500/50 rotate-[-45deg] z-0" />
            
            <div className="relative z-10 space-y-1 pr-4">
              <span className="text-[10px] font-bold tracking-widest text-purple-300 block uppercase">Orbital:</span>
              <p className="text-xs font-semibold text-gray-100">{welcomeMessage}</p>
            </div>
            
            <span className="block text-[10px] text-cyan-400/80 uppercase tracking-wider text-right mt-2 font-bold animate-pulse">Click robot to talk</span>
          </div>
        )}

        {/* Robot avatar container */}
        <div
          onClick={onOpenAiAssistant}
          className="pointer-events-auto cursor-pointer animate-float-agent relative p-1"
          title="Click to interact with your AI Assistant!"
        >
          {/* Soft neon ring pulse behind the robot */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full blur-xl opacity-60 animate-pulse-laser pointer-events-none" />

          {/* Core Robot Body */}
          <div className="relative w-16 h-16 bg-gradient-to-b from-gray-900 to-slate-950 border-2 border-cyan-500 rounded-2xl shadow-xl flex flex-col items-center justify-center group-hover/robot:border-purple-400 transition-all duration-300">
            
            {/* Robot Headpiece / Antenna */}
            <div className="absolute -top-3 w-1 h-3 bg-cyan-500 group-hover/robot:bg-purple-400 rounded-full transition-colors flex items-center justify-center">
              <div className="absolute top-0 w-2 h-2 bg-pink-500 rounded-full animate-ping" />
            </div>

            {/* Glowing Digital Screen Mask */}
            <div className="w-12 h-8 bg-black border border-cyan-500/50 rounded-lg flex items-center justify-center gap-2 px-1 relative overflow-hidden group-hover/robot:border-purple-400/50 transition-colors">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
              
              {/* Animated glowing eyes */}
              <div className="w-2.5 h-2.5 bg-cyan-400 group-hover/robot:bg-pink-400 rounded-full animate-robot-blink shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              <div className="w-2.5 h-2.5 bg-cyan-400 group-hover/robot:bg-pink-400 rounded-full animate-robot-blink shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
            </div>

            {/* Subtile visual layout element */}
            <div className="w-10 h-[1.5px] bg-cyan-500/30 group-hover/robot:bg-purple-400/30 mt-2 transition-colors" />
            
            {/* Pulsing LED core indicator */}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mt-1" />
          </div>

          {/* Friendly floating badge */}
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border border-white/15 shadow-md">
            ORBITAL
          </div>
        </div>

      </div>

    </div>
  );
}
