import React, { useState } from "react";
import { 
  Bell, 
  Trash2, 
  Plus, 
  CheckSquare, 
  Square, 
  Clock, 
  AlertCircle,
  Volume2,
  MapPin,
  Zap,
  Link,
  Tag
} from "lucide-react";
import { Reminder, Task } from "../types";

interface RemindersViewProps {
  reminders: Reminder[];
  tasks?: Task[];
  onAddReminder: (
    title: string,
    deadline: string,
    location?: string,
    energyRequired?: 'Low' | 'Medium' | 'High',
    dependentTaskId?: string
  ) => void;
  onToggleReminder: (id: string, completed: boolean) => void;
  onDeleteReminder: (id: string) => void;
  onTestAlarm?: (reminder: Reminder) => void;
}

export default function RemindersView({
  reminders,
  tasks = [],
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onTestAlarm
}: RemindersViewProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [energyRequired, setEnergyRequired] = useState<'Low' | 'Medium' | 'High'>("High");
  const [dependentTaskId, setDependentTaskId] = useState("");

  const [time, setTime] = useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getISTTimeParts = (date: Date) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      });
      const parts = formatter.formatToParts(date);
      const h = parts.find(p => p.type === "hour")?.value || "00";
      const m = parts.find(p => p.type === "minute")?.value || "00";
      const s = parts.find(p => p.type === "second")?.value || "00";
      return { 
        hours: h.padStart(2, "0"), 
        minutes: m.padStart(2, "0"), 
        seconds: s.padStart(2, "0") 
      };
    } catch (e) {
      return {
        hours: String(date.getHours()).padStart(2, "0"),
        minutes: String(date.getMinutes()).padStart(2, "0"),
        seconds: String(date.getSeconds()).padStart(2, "0")
      };
    }
  };

  const { hours, minutes, seconds } = getISTTimeParts(time);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddReminder(
      title,
      deadline,
      location.trim() ? location.trim() : undefined,
      energyRequired,
      dependentTaskId ? dependentTaskId : undefined
    );
    setTitle("");
    setDeadline("");
    setLocation("");
    setEnergyRequired("High");
    setDependentTaskId("");
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);
  const pendingTasks = tasks.filter(t => t.status === "pending" && t.deadline);

  return (
    <div className="space-y-6">
      
      {/* High-Tech Digital Alarm Clock & Standby Monitor */}
      <div className="w-full bg-gradient-to-b from-[#060b26] to-[#030612] border border-cyan-500/20 rounded-2xl p-6 text-white font-mono relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
        {/* Subtle decorative glowing background patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Live Glowing Digital Time Display */}
          <div className="md:col-span-5 text-center md:text-left space-y-2 border-r border-white/5 md:pr-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold flex items-center justify-center md:justify-start gap-2">
              <Clock className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              Orbital Chronometry Terminal
            </span>
            
            <div className="flex items-center justify-center md:justify-start gap-1 font-sans">
              <span className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">{hours}</span>
              <span className="text-4xl md:text-5xl font-black text-cyan-500 animate-pulse">:</span>
              <span className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">{minutes}</span>
              <span className="text-4xl md:text-5xl font-black text-cyan-500 animate-pulse">:</span>
              <span className="text-4xl md:text-5xl font-black tracking-tight text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">{seconds}</span>
            </div>

            <div className="text-[9px] uppercase tracking-widest text-gray-400">
              System Time Zone: Asia/Kolkata (IST)
            </div>
          </div>

          {/* Active Monitoring Stats Dashboard */}
          <div className="md:col-span-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Monitoring Active & Ready
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-sm">
                System actively monitors deadlines and will launch the spoken audio alarm clock at the designated time of reminders or tasks.
              </p>
            </div>

            {/* Combined Pending Alarms counter badge */}
            <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3 text-center min-w-[120px] shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <span className="block text-[8px] uppercase tracking-widest text-gray-500 mb-0.5">Alerts Scheduled</span>
              <span className="text-xl font-bold text-cyan-400">
                {pendingReminders.length + pendingTasks.length} Active
              </span>
              <div className="flex items-center justify-center gap-2 mt-1 text-[8px] text-gray-400">
                <span>{pendingReminders.length} Reminders</span>
                <span>•</span>
                <span>{pendingTasks.length} Tasks</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Create Reminder card */}
        <div className="lg:col-span-5 cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-pink-500" />
            Set System Alert
          </h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
            Add a new reminder to your active schedule
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Alert Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review cognitive charts..."
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Alert Date & Time</label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Location Context</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Home, Office, Gym"
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Bio-Energy Level</label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <select
                  value={energyRequired}
                  onChange={(e) => setEnergyRequired(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
                >
                  <option value="Low">Low Energy</option>
                  <option value="Medium">Medium Energy</option>
                  <option value="High">High Energy</option>
                </select>
              </div>
            </div>
          </div>

          {tasks && tasks.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Dependent Task Link</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <select
                  value={dependentTaskId}
                  onChange={(e) => setDependentTaskId(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
                >
                  <option value="">-- No Task Dependency --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(236,72,153,0.15)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enqueue Reminder</span>
          </button>
        </form>

        <div className="bg-[#05091e]/50 border border-pink-500/10 p-4 rounded-xl flex gap-2.5 items-start">
          <AlertCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 leading-normal">
            Reminders are tracked under your personal secure user account, and will notify you when deadlines pass.
          </p>
        </div>
      </div>

      {/* Lists of active & complete reminders */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Active reminders */}
        <div className="cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-pink-400" />
              Pending Alerts Queue
            </h3>
            <span className="px-2 py-0.5 bg-pink-950/20 border border-pink-500/30 rounded text-[9px] text-pink-400">
              {pendingReminders.length} Active
            </span>
          </div>

          {pendingReminders.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/5 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">No pending alerts set.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {pendingReminders.map(rem => {
                const linkedTask = tasks.find(t => t.id === rem.dependentTaskId);
                return (
                  <div key={rem.id} className="p-3 bg-black/60 border border-white/5 hover:border-pink-500/20 rounded-xl flex justify-between items-center gap-4 transition-all group">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleReminder(rem.id, true)}
                        className="text-gray-500 hover:text-pink-400 transition cursor-pointer shrink-0 mt-0.5"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-white font-sans truncate">{rem.title}</span>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[9px] text-gray-500">
                          <span className="flex items-center gap-0.5 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            Due: {new Date(rem.deadline).toLocaleString()}
                          </span>

                          {rem.location && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 rounded-full shrink-0">
                              <MapPin className="w-2.5 h-2.5 text-cyan-500" />
                              {rem.location}
                            </span>
                          )}

                          {rem.energyRequired && (
                            <span className={`flex items-center gap-0.5 px-1.5 py-0.2 border rounded-full shrink-0 ${
                              rem.energyRequired === "High" 
                                ? "bg-red-950/40 text-red-400 border-red-500/20" 
                                : rem.energyRequired === "Medium"
                                ? "bg-amber-950/40 text-amber-400 border-amber-500/20"
                                : "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                            }`}>
                              <Zap className="w-2.5 h-2.5" />
                              {rem.energyRequired} Energy
                            </span>
                          )}

                          {linkedTask && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-purple-950/40 text-purple-400 border border-purple-500/20 rounded-full shrink-0 max-w-[150px] truncate" title={`Linked to task: ${linkedTask.title}`}>
                              <Link className="w-2.5 h-2.5 text-purple-400" />
                              Task: {linkedTask.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {onTestAlarm && (
                        <button
                          onClick={() => onTestAlarm(rem)}
                          title="Test spoken alarm core"
                          className="p-1 text-gray-400 hover:text-pink-400 hover:bg-pink-950/20 rounded transition cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteReminder(rem.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Reminders */}
        <div className="cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4 bg-black/20">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-gray-500" />
              Completed Logs
            </h3>
            <span className="text-[10px] text-gray-500">
              {completedReminders.length} Archive
            </span>
          </div>

          {completedReminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600 uppercase tracking-wider">No completed logs archived.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {completedReminders.map(rem => (
                <div key={rem.id} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center gap-4 transition-all opacity-60">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleReminder(rem.id, false)}
                      className="text-pink-500 hover:text-gray-400 transition cursor-pointer shrink-0"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="block text-xs text-gray-400 font-sans line-through">{rem.title}</span>
                      <span className="block text-[9px] text-gray-600 mt-0.5">
                        Completed
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteReminder(rem.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  </div>
  );
}
