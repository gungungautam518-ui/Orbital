import React, { useState } from "react";
import { 
  Sparkles, 
  Plus, 
  Clock, 
  Layers, 
  ListTodo, 
  CheckCircle2, 
  Database,
  Search,
  Zap,
  Flame
} from "lucide-react";
import { Task } from "../types";
import TaskCard from "./TaskCard";

interface TasksViewProps {
  tasks: Task[];
  loading: boolean;
  onAddTask: (taskData: {
    title: string;
    description: string;
    deadline: string;
    duration: number;
    energyRequired: "Low" | "Medium" | "High";
    category: "Work" | "Personal" | "Health" | "Urgent" | "Other";
  }) => void;
  onToggleTaskStatus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onPrioritizeTasks: () => void;
}

export default function TasksView({
  tasks,
  loading,
  onAddTask,
  onToggleTaskStatus,
  onDeleteTask,
  onPrioritizeTasks
}: TasksViewProps) {
  // Local Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duration, setDuration] = useState(30);
  const [energyRequired, setEnergyRequired] = useState<"Low" | "Medium" | "High">("Medium");
  const [category, setCategory] = useState<"Work" | "Personal" | "Health" | "Urgent" | "Other">("Work");

  // Local Filter state
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "all">("pending");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title,
      description,
      deadline,
      duration,
      energyRequired,
      category
    });
    // Reset form
    setTitle("");
    setDescription("");
    setDeadline("");
    setDuration(30);
    setEnergyRequired("Medium");
    setCategory("Work");
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // 1. Calculate top-priority tasks
  const pendingTasks = safeTasks.filter(t => t.status === "pending");
  const topPriorityTask = pendingTasks.length > 0 
    ? [...pendingTasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0]
    : null;

  // 2. Filter tasks based on search, category and active tab status
  const filteredTasks = safeTasks.filter((task) => {
    // Tab filter
    if (activeTab === "pending" && task.status !== "pending") return false;
    if (activeTab === "completed" && task.status !== "completed") return false;

    // Category filter
    if (activeCategory !== "All" && task.category !== activeCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      return matchTitle || matchDesc;
    }

    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left side Form Scheduler Entry */}
      <div className="lg:col-span-5 space-y-6">
        <div className="cyber-glass border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden text-white font-mono">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />
          
          <h2 className="text-sm font-bold font-display text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Schedule Task Node</span>
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Objective Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Conduct daily system audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60 font-mono placeholder-gray-600 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Intel Description</label>
              <textarea
                placeholder="Add details about task milestones and criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60 font-mono placeholder-gray-600 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Due Date</label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60 font-mono transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Stamina Needed</label>
                <select
                  value={energyRequired}
                  onChange={(e) => setEnergyRequired(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60 font-mono transition"
                >
                  <option value="Low">Low Stamina</option>
                  <option value="Medium">Medium Core</option>
                  <option value="High">High Focus</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Sector Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/60 font-mono transition"
                >
                  <option value="Work">Work Sector</option>
                  <option value="Personal">Personal Sector</option>
                  <option value="Health">Health Sector</option>
                  <option value="Urgent">Urgent Sector</option>
                  <option value="Other">Other Sector</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>Initialize Task Node</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right side Task grid list with filters */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Top Priority dynamic billboard */}
        {topPriorityTask && (
          <div className="relative overflow-hidden rounded-2xl border border-pink-500/40 bg-gradient-to-br from-pink-950/20 via-[#050917] to-purple-950/20 p-5 glow-pink font-mono text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-center gap-3 mb-3">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-950/50 border border-pink-500/40 text-[10px] font-bold uppercase text-pink-400 tracking-widest">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI Suggested Node Priority
              </span>
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] text-gray-400">
                Score: {topPriorityTask.priorityScore || 50}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              {topPriorityTask.title}
            </h3>
            {topPriorityTask.description && (
              <p className="text-xs text-gray-300 leading-normal mb-3 font-sans line-clamp-1">
                {topPriorityTask.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 pt-2.5 border-t border-white/5">
              <span className="flex items-center gap-1 text-cyan-400">
                <Clock className="w-3.5 h-3.5" />
                Slot: {topPriorityTask.aiSuggestedSlot || "Morning Focus Block"}
              </span>
              <span className="text-white/10">|</span>
              <span className="text-pink-400 italic">
                "{topPriorityTask.aiReasoning || "Matches cognitive capacity metric."}"
              </span>
            </div>
          </div>
        )}

        {/* Filters control pane */}
        <div className="space-y-3">
          
          {/* Search bar & Prioritize trigger */}
          <div className="flex gap-2 bg-black/40 border border-white/5 p-2 rounded-xl">
            <div className="flex-1 bg-black/60 rounded-lg border border-white/10 flex items-center px-3 gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search active missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none py-2 text-xs text-gray-200 focus:outline-none font-mono"
              />
            </div>

            {pendingTasks.length > 1 && (
              <button
                onClick={onPrioritizeTasks}
                className="px-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-mono uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prioritize</span>
              </button>
            )}
          </div>

          {/* Filtering options */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-black/50 border border-white/5 p-3 rounded-xl font-mono text-white">
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/5">
              {[
                { key: "pending", label: "Active Nodes" },
                { key: "completed", label: "Completed" },
                { key: "all", label: "All Logs" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all duration-300 border cursor-pointer font-bold hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                    activeTab === tab.key 
                      ? "bg-cyan-500 text-black border-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.5)] scale-105 -translate-y-0.5" 
                      : "text-gray-400 border-transparent hover:text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Sector:</span>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="All">All Sectors</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Urgent">Urgent</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

        </div>

        {/* Task lists flow */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {loading ? (
            <div className="cyber-glass border border-white/5 rounded-xl p-12 text-center">
              <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Retrieving tasks queue...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="cyber-glass border border-white/5 rounded-xl p-12 text-center font-mono text-white">
              <Database className="w-10 h-10 text-gray-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-gray-400 uppercase tracking-widest">No active parameters match filters.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleTaskStatus}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>

      </div>

    </div>
  );
}
