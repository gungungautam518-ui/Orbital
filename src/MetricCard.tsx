import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  variant: "cyan" | "pink" | "yellow" | "purple";
}

export default function MetricCard({ id, title, value, sub, icon: Icon, variant }: MetricCardProps) {
  const variantStyles = {
    cyan: "glow-cyan border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
    pink: "glow-pink border-pink-500/30 text-pink-400 bg-pink-950/20",
    yellow: "glow-yellow border-yellow-500/30 text-yellow-400 bg-yellow-950/20",
    purple: "glow-purple border-purple-500/30 text-purple-400 bg-purple-950/20",
  };

  const glowDotStyles = {
    cyan: "bg-cyan-500 shadow-[0_0_8px_#22d3ee]",
    pink: "bg-pink-500 shadow-[0_0_8px_#f472b6]",
    yellow: "bg-yellow-500 shadow-[0_0_8px_#facc15]",
    purple: "bg-purple-500 shadow-[0_0_8px_#c084fc]",
  };

  return (
    <div
      id={id}
      className={`cyber-glass border p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group ${variantStyles[variant]}`}
    >
      {/* Laser line flare effect */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-40 group-hover:via-white transition-all duration-500" />
      
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-400 font-mono block mb-1">
            {title}
          </span>
          <span className="text-3xl font-bold font-display tracking-tight text-white block">
            {value}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
          <Icon className="w-5 h-5 text-current" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-mono">
        <span className={`w-1.5 h-1.5 rounded-full ${glowDotStyles[variant]}`} />
        <span>{sub}</span>
      </div>
    </div>
  );
}
