import React from "react";
import { Task } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Compass, 
  ShieldAlert,
  Dna,
  Heart
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onToggleStatus, onDelete }: TaskCardProps) {
  const isCompleted = task.status === "completed";

  // Priority color config
  const priorityConfig = {
    Critical: {
      border: "border-pink-500/40 glow-pink",
      text: "text-pink-400",
      bg: "bg-pink-950/20",
      dot: "bg-pink-500 shadow-[0_0_8px_#f472b6]",
      bar: "bg-gradient-to-r from-pink-500 to-purple-600"
    },
    High: {
      border: "border-purple-500/40 glow-purple",
      text: "text-purple-400",
      bg: "bg-purple-950/20",
      dot: "bg-purple-500 shadow-[0_0_8px_#c084fc]",
      bar: "bg-gradient-to-r from-purple-500 to-cyan-500"
    },
    Medium: {
      border: "border-yellow-500/40 glow-yellow",
      text: "text-yellow-400",
      bg: "bg-yellow-950/20",
      dot: "bg-yellow-500 shadow-[0_0_8px_#facc15]",
      bar: "bg-gradient-to-r from-yellow-500 to-amber-600"
    },
    Low: {
      border: "border-cyan-500/30 glow-cyan",
      text: "text-cyan-400",
      bg: "bg-cyan-950/10",
      dot: "bg-cyan-500 shadow-[0_0_8px_#22d3ee]",
      bar: "bg-gradient-to-r from-cyan-400 to-blue-500"
    }
  };

  const currentStyle = priorityConfig[task.aiPriorityLabel] || priorityConfig.Medium;

  // Category Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Work":
        return <Dna className="w-4.5 h-4.5 text-blue-400" />;
      case "Personal":
        return <Compass className="w-4.5 h-4.5 text-emerald-400" />;
      case "Health":
        return <Heart className="w-4.5 h-4.5 text-rose-400" />;
      case "Urgent":
        return <ShieldAlert className="w-4.5 h-4.5 text-red-400" />;
      default:
        return <Clock className="w-4.5 h-4.5 text-gray-400" />;
    }
  };

  return (
    <div
      id={`task-card-${task.id}`}
      className={`cyber-glass border p-5 rounded-xl transition-all duration-300 relative group overflow-hidden ${
        isCompleted ? "opacity-60 border-white/5 bg-white/2" : currentStyle.border
      }`}
    >
      {/* Decorative Cyber Grid Corner lines */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 opacity-60 group-hover:border-current transition-colors duration-300 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/10 opacity-60 group-hover:border-current transition-colors duration-300 pointer-events-none" />

      <div className="flex items-start gap-4 justify-between">
        <div className="flex items-start gap-3">
          {/* Status Checkbox Button */}
          <button
            id={`toggle-status-${task.id}`}
            onClick={() => onToggleStatus(task.id)}
            className="mt-1 flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shadow-sm" />
            ) : (
              <Circle className="w-5 h-5 text-gray-500 hover:text-cyan-400" />
            )}
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Indicator */}
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 border border-white/5 text-[10px] font-mono uppercase tracking-wider text-gray-300">
                {getCategoryIcon(task.category)}
                {task.category}
              </span>

              {/* Priority Tag */}
              {!isCompleted && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${currentStyle.bg} ${currentStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStyle.dot}`} />
                  {task.aiPriorityLabel}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-base font-bold font-display mt-2 tracking-wide text-white ${isCompleted ? "line-through text-gray-500" : ""}`}>
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-gray-400 mt-1 leading-relaxed font-sans max-w-xl">
                {task.description}
              </p>
            )}

            {/* Target Slots & Details */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Energy: {task.energyRequired}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Delete Action button */}
        <button
          id={`delete-task-${task.id}`}
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded bg-black/40 border border-white/5 text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-950/20 transition-all duration-200"
          title="Vaporize task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic priority progress bar */}
      {!isCompleted && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-1">
            <span>TACTICAL PRIORITY INDEX</span>
            <span className={`font-bold ${currentStyle.text}`}>{task.priorityScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentStyle.bar}`}
              style={{ width: `${task.priorityScore}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Reasoning Display */}
      {task.aiReasoning && !isCompleted && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-black/40 border border-white/5 flex items-start gap-2">
          <span className="text-[10px] font-mono text-pink-500 uppercase tracking-widest mt-0.5">AI_LOG:</span>
          <p className="text-[11px] font-mono text-gray-300 italic flex-1 leading-normal">
            "{task.aiReasoning}"
          </p>
        </div>
      )}
    </div>
  );
}
