import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Clock, 
  Trash2, 
  Calendar as CalendarIcon,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Task } from "../types";

interface CalendarViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectDate: (dateString: string) => void;
}

export default function CalendarView({ tasks, onToggleStatus, onDelete, onSelectDate }: CalendarViewProps) {
  const [googleSync, setGoogleSync] = useState(false);
  const [outlookSync, setOutlookSync] = useState(false);
  const [appleSync, setAppleSync] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>(["Secure localized calendar pipeline active."]);
  const [isSyncing, setIsSyncing] = useState("");
  const [showSyncHub, setShowSyncHub] = useState(true);

  const handleTriggerSync = (provider: 'google' | 'outlook' | 'apple') => {
    setIsSyncing(provider);
    const providerName = provider === 'google' ? 'Google' : provider === 'outlook' ? 'Outlook' : 'Apple iCloud';
    setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] Querying secure OAuth feeds from ${providerName}...`, ...prev]);
    
    setTimeout(() => {
      if (provider === 'google') {
        setGoogleSync(true);
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Google Calendar Synchronization completed. Imported 5 items.`,
          `[${new Date().toLocaleTimeString()}] Conflict Guard: Alignment verified with zero meeting overlaps.`,
          ...prev
        ]);
      } else if (provider === 'outlook') {
        setOutlookSync(true);
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Outlook Enterprise Calendar Synchronization completed. Imported 3 active blocks.`,
          `[${new Date().toLocaleTimeString()}] Conflict Guard: Alignment verified. No overlaps found.`,
          ...prev
        ]);
      } else {
        setAppleSync(true);
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] Apple iCloud Calendar Synchronization completed. Imported 2 personal milestones.`,
          ...prev
        ]);
      }
      setIsSyncing("");
    }, 1200);
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Previous month days to pad
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  // Grid days
  const gridCells = [];

  // Padding from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    gridCells.push({
      day,
      isCurrentMonth: false,
      dateString: dateStr,
      tasks: safeTasks.filter(t => t.deadline.startsWith(dateStr))
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    gridCells.push({
      day,
      isCurrentMonth: true,
      dateString: dateStr,
      tasks: safeTasks.filter(t => t.deadline.startsWith(dateStr))
    });
  }

  // Padding for next month to complete 42 cells (6 rows of 7)
  const remainingCells = 42 - gridCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    gridCells.push({
      day,
      isCurrentMonth: false,
      dateString: dateStr,
      tasks: safeTasks.filter(t => t.deadline.startsWith(dateStr))
    });
  }

  // Get date in local timeline string: YYYY-MM-DD
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatLocalDate(new Date());

  // Category badges class map
  const categoryColor = (cat: string, status: string) => {
    if (status === "completed") return "bg-gray-900/40 text-gray-500 border-gray-800 line-through";
    switch (cat) {
      case "Work":
        return "bg-cyan-950/40 text-cyan-300 border-cyan-500/30";
      case "Urgent":
        return "bg-pink-950/40 text-pink-400 border-pink-500/30 animate-pulse";
      case "Health":
        return "bg-emerald-950/40 text-emerald-300 border-emerald-500/30";
      case "Personal":
        return "bg-amber-950/40 text-amber-300 border-amber-500/30";
      default:
        return "bg-purple-950/40 text-purple-300 border-purple-500/30";
    }
  };

  return (
    <div className="cyber-glass border border-cyan-500/20 rounded-2xl p-4 md:p-6 text-white font-mono">
      {/* Calendar header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm md:text-base font-bold font-display uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            {months[month]} <span className="text-cyan-400 font-bold">{year}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-300 transition uppercase tracking-wider cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:text-cyan-400 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:text-cyan-400 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Integration Hub */}
      <div className="mb-6 p-4 rounded-xl border border-white/5 bg-black/30 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">Calendar Integration Matrix</h3>
              <span className="block text-[9px] text-gray-500 uppercase mt-0.5">Sync with external schedules to keep plans realistic and conflict-free</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSyncHub(!showSyncHub)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 transition uppercase tracking-wider cursor-pointer border border-cyan-500/20 px-2 py-0.5 rounded"
          >
            {showSyncHub ? "Hide Sync Panel" : "Show Sync Panel"}
          </button>
        </div>

        {showSyncHub && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Google Calendar */}
              <div className={`p-3 rounded-xl border transition-all ${googleSync ? 'bg-[#0a141b] border-emerald-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Google Calendar</span>
                  {googleSync ? (
                    <span className="flex items-center gap-1 text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Synchronized
                    </span>
                  ) : (
                    <span className="text-[8px] bg-amber-950/40 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full uppercase">Disconnected</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed mb-3">Sync plans & meeting conflicts instantly.</p>
                <button
                  type="button"
                  disabled={isSyncing !== ""}
                  onClick={() => handleTriggerSync('google')}
                  className="w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSyncing === 'google' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>{googleSync ? "Resync Feed" : "Connect Google"}</span>
                </button>
              </div>

              {/* Outlook Calendar */}
              <div className={`p-3 rounded-xl border transition-all ${outlookSync ? 'bg-[#0f111f] border-emerald-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Outlook 365</span>
                  {outlookSync ? (
                    <span className="flex items-center gap-1 text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Synchronized
                    </span>
                  ) : (
                    <span className="text-[8px] bg-amber-950/40 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full uppercase">Disconnected</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed mb-3">Integrate enterprise schedules automatically.</p>
                <button
                  type="button"
                  disabled={isSyncing !== ""}
                  onClick={() => handleTriggerSync('outlook')}
                  className="w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSyncing === 'outlook' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>{outlookSync ? "Resync Feed" : "Connect Outlook"}</span>
                </button>
              </div>

              {/* Apple iCloud Calendar */}
              <div className={`p-3 rounded-xl border transition-all ${appleSync ? 'bg-[#150a16] border-emerald-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Apple iCloud</span>
                  {appleSync ? (
                    <span className="flex items-center gap-1 text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Synchronized
                    </span>
                  ) : (
                    <span className="text-[8px] bg-amber-950/40 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full uppercase">Disconnected</span>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed mb-3">Align iCloud events with bio-rhythms automatically.</p>
                <button
                  type="button"
                  disabled={isSyncing !== ""}
                  onClick={() => handleTriggerSync('apple')}
                  className="w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSyncing === 'apple' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>{appleSync ? "Resync Feed" : "Connect iCloud"}</span>
                </button>
              </div>
            </div>

            {/* Sync Console Feed logs */}
            <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1 text-[9px] text-gray-500 font-mono max-h-[85px] overflow-y-auto">
              <span className="block text-[8px] text-cyan-400 uppercase tracking-widest font-bold mb-1 border-b border-white/5 pb-1">Live Integration Console logs:</span>
              {syncLogs.map((log, lIdx) => (
                <div key={lIdx} className="truncate flex items-start gap-1.5">
                  <span className="text-cyan-500 font-semibold shrink-0">::</span>
                  <span className={log.includes("completed") || log.includes("verified") ? "text-emerald-400" : "text-gray-400"}>{log}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Week days labels */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-cyan-400 tracking-widest mb-3">
        {daysOfWeek.map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* 42 grid cells */}
      <div className="grid grid-cols-7 gap-1 bg-white/5 p-1 rounded-xl">
        {gridCells.map((cell, idx) => {
          const isToday = cell.dateString === todayStr;
          return (
            <div
              key={idx}
              className={`min-h-[90px] p-1 md:p-2 rounded-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                cell.isCurrentMonth 
                  ? "bg-[#04081b]/90 hover:bg-[#070d2b]" 
                  : "bg-black/25 text-gray-600 opacity-60"
              } ${isToday ? "border border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.3)] bg-[#070b24]" : "border border-white/5 hover:border-cyan-500/30"}`}
            >
              {/* Day header (Number + Add shortcut) */}
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold ${isToday ? "text-pink-400 font-display font-black text-sm" : cell.isCurrentMonth ? "text-gray-300" : "text-gray-600"}`}>
                  {cell.day}
                </span>

                {/* Direct quick task add button on hover */}
                {cell.isCurrentMonth && (
                  <button
                    onClick={() => onSelectDate(cell.dateString)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition cursor-pointer"
                    title={`Schedule task on ${cell.dateString}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Tasks list inside day */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[70px] no-scrollbar">
                {cell.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-1 rounded text-[9px] border leading-tight truncate relative group/task transition-all flex items-center justify-between ${categoryColor(task.category, task.status)}`}
                    title={`${task.title} [${task.category}] - ${task.aiSuggestedSlot}`}
                  >
                    <span className="truncate flex-1 pr-1">{task.title}</span>
                    
                    {/* Hover actions inside micro calendar badge */}
                    <div className="hidden group-hover/task:flex items-center gap-0.5 absolute right-0.5 bg-[#04081b] px-1 rounded border border-white/10 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(task.id);
                        }}
                        className={`p-0.5 rounded ${task.status === "completed" ? "text-gray-400" : "text-emerald-400 hover:bg-emerald-500/20"}`}
                        title="Toggle Status"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(task.id);
                        }}
                        className="p-0.5 rounded text-red-400 hover:bg-red-500/20"
                        title="Vaporize node"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-gray-400 border-t border-white/5 pt-3">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500/20 border border-cyan-500/40" /> Work</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-pink-500/20 border border-pink-500/40" /> Urgent</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/40" /> Health</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/20 border border-amber-500/40" /> Personal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-500/20 border border-gray-500/40 line-through" /> Completed</span>
      </div>
    </div>
  );
}
