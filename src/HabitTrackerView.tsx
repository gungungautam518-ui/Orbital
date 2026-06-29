import React, { useState } from "react";
import { Plus, Trash2, Flame, CheckCircle2, TrendingUp, Award, Sparkles, Calendar } from "lucide-react";
import { Habit } from "../types";
import { getLocalDateString } from "../App";

interface HabitTrackerViewProps {
  habits: Habit[];
  onAddHabit: (name: string) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export default function HabitTrackerView({
  habits,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit
}: HabitTrackerViewProps) {
  const [newHabitName, setNewHabitName] = useState("");
  const todayStr = getLocalDateString();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName("");
  };

  // Calculate high-level stats
  const totalHabitsCount = habits.length;
  const completedTodayCount = habits.filter(h => h.completedDays.includes(todayStr)).length;
  const highestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const completionRate = totalHabitsCount > 0 
    ? Math.round((completedTodayCount / totalHabitsCount) * 100) 
    : 0;

  return (
    <div id="habit-tracker-container" className="space-y-8 animate-fade-in font-sans">
      
      {/* Title & Stats Grid Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            Habit Tracker Core
          </h1>
          <p className="text-sm text-gray-400 mt-1">Configure and monitor your daily neural routines for optimal performance.</p>
        </div>

        {/* Stats Badge */}
        <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
            Neuro-Consistency: {completionRate}%
          </span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-500/20 transition-all duration-300">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs uppercase tracking-widest text-gray-400">Active Routines</span>
            <span className="text-2xl font-bold text-white">{totalHabitsCount}</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-purple-500/20 transition-all duration-300">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-xs uppercase tracking-widest text-gray-400">Peak Streak</span>
            <span className="text-2xl font-bold text-white">{highestStreak} Days</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-pink-500/20 transition-all duration-300">
          <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs uppercase tracking-widest text-gray-400">Done Today</span>
            <span className="text-2xl font-bold text-white">{completedTodayCount} / {totalHabitsCount}</span>
          </div>
        </div>
      </div>

      {/* Adding Habit Form */}
      <div className="bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          Establish New Protocol
        </h2>
        
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="e.g., Read technical journals, 30 min cardiovascular execution..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all font-sans"
          />
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Add Habit
          </button>
        </form>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold">ACTIVE NEURAL PROTOCOLS</h3>

        {habits.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-cyan-400/40" />
            </div>
            <p className="text-gray-400 text-sm font-sans">No habit protocols configured. Create one above to begin calibrations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {habits.map((habit) => {
              const isCompletedToday = habit.completedDays.includes(todayStr);

              return (
                <div
                  key={habit.id}
                  className="bg-black/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:border-white/10 relative group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Completion Checkmark */}
                    <button
                      onClick={() => onToggleHabit(habit.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-pointer transition-all duration-300 ${
                        isCompletedToday
                          ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                          : "border-white/10 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 bg-white/5"
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${isCompletedToday ? "scale-110" : ""}`} />
                    </button>

                    <div>
                      <h4 className={`font-semibold font-sans text-white transition-all ${isCompletedToday ? "text-gray-400 line-through" : ""}`}>
                        {habit.name}
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          Created: {new Date(habit.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side controls: Streak display and Delete */}
                  <div className="flex items-center gap-4">
                    {/* Streak Indicator */}
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                      <Flame className={`w-4 h-4 ${habit.streak > 0 ? "animate-bounce text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "text-amber-500/40"}`} />
                      <span className="text-xs font-bold font-mono">{habit.streak}d Streak</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-2.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300 cursor-pointer"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
