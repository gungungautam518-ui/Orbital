import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  Activity, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Award, 
  Calendar, 
  Milestone, 
  Search, 
  Filter, 
  X, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Tags, 
  BookOpen, 
  Code, 
  Globe, 
  User as UserIcon, 
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";
import { TrackerNode, Task, ProductivityProfile, LifeNode } from "../types";
import AnalyticsPanel from "./AnalyticsPanel";

interface LifeTrackerViewProps {
  tasks: Task[];
  profile: ProductivityProfile;
  trackers: TrackerNode[];
  onAddTracker: (
    metricName: string, 
    value: number, 
    unit: string, 
    taskTitle?: string, 
    mindState?: string, 
    notes?: string
  ) => void;
  onDeleteTracker: (id: string) => void;
}

export default function LifeTrackerView({
  tasks,
  profile,
  trackers,
  onAddTracker,
  onDeleteTracker
}: LifeTrackerViewProps) {
  // Tabs: "nodes" for Interactive Journey Graph, "metrics" for legacy logging
  const [activeTab, setActiveTab] = useState<"nodes" | "metrics">("nodes");

  // Legacy Metrics Logging states
  const [metricName, setMetricName] = useState("Water Intake");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("ml");
  const [focusTaskId, setFocusTaskId] = useState("");
  const [focusMindState, setFocusMindState] = useState("Deep Concentration");
  const [focusNotes, setFocusNotes] = useState("");

  // Journey Node states
  const [nodes, setNodes] = useState<LifeNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Details & edit form drawer states
  const [selectedNode, setSelectedNode] = useState<LifeNode | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Form states for Create/Edit Node
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState("Career");
  const [formStatus, setFormStatus] = useState<"Completed" | "In Progress" | "Planned">("Planned");
  const [formTagsString, setFormTagsString] = useState("");

  // Dragging support states
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; nodeX: number; nodeY: number } | null>(null);

  // Auto-set metric units
  useEffect(() => {
    if (metricName === "Water Intake") setUnit("ml");
    else if (metricName === "Sleep") setUnit("hours");
    else if (metricName === "Steps") setUnit("steps");
    else if (metricName === "Focus Session") setUnit("mins");
    else if (metricName === "Active Workout") setUnit("mins");
  }, [metricName]);

  // Fetch nodes on mount & when filters update
  const fetchNodes = async () => {
    setLoadingNodes(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter) params.append("status", statusFilter);
      
      const res = await fetch(`/api/life-nodes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch (e) {
      console.error("Error fetching journey nodes:", e);
    } finally {
      setLoadingNodes(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, [searchQuery, categoryFilter, statusFilter]);

  // Legacy submits
  const handleMetricSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isNaN(Number(value))) return;

    if (metricName === "Focus Session") {
      const selectedTask = tasks.find(t => t.id === focusTaskId);
      const taskTitle = selectedTask ? selectedTask.title : undefined;
      onAddTracker(metricName, Number(value), unit, taskTitle, focusMindState, focusNotes || undefined);
      setFocusTaskId("");
      setFocusNotes("");
    } else {
      onAddTracker(metricName, Number(value), unit);
    }
    setValue("");
  };

  // Drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: LifeNode) => {
    e.preventDefault();
    setActiveDragId(node.id);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      nodeX: node.x,
      nodeY: node.y
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!activeDragId || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    const newX = Math.max(20, Math.min(960, dragStartRef.current.nodeX + dx));
    const newY = Math.max(20, Math.min(480, dragStartRef.current.nodeY + dy));

    setNodes(prev => prev.map(n => n.id === activeDragId ? { ...n, x: newX, y: newY } : n));
  };

  const handleCanvasMouseUp = async () => {
    if (activeDragId) {
      const finalNode = nodes.find(n => n.id === activeDragId);
      if (finalNode) {
        // Persist drag position on backend
        try {
          await fetch(`/api/life-nodes/${finalNode.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x: finalNode.x, y: finalNode.y })
          });
        } catch (e) {
          console.error("Failed to save dragged position:", e);
        }
      }
      setActiveDragId(null);
    }
    dragStartRef.current = null;
  };

  // Mobile touch dragging
  const handleNodeTouchStart = (e: React.TouchEvent, node: LifeNode) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setActiveDragId(node.id);
    dragStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      nodeX: node.x,
      nodeY: node.y
    };
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (!activeDragId || !dragStartRef.current) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.clientX;
    const dy = touch.clientY - dragStartRef.current.clientY;

    const newX = Math.max(20, Math.min(960, dragStartRef.current.nodeX + dx));
    const newY = Math.max(20, Math.min(480, dragStartRef.current.nodeY + dy));

    setNodes(prev => prev.map(n => n.id === activeDragId ? { ...n, x: newX, y: newY } : n));
  };

  // Node CRUD APIs
  const handleNodeClick = (node: LifeNode) => {
    setSelectedNode(node);
    setIsCreateMode(false);
    setIsEditMode(false);
  };

  const openCreateDrawer = () => {
    setIsCreateMode(true);
    setSelectedNode(null);
    setIsEditMode(false);
    setFormTitle("");
    setFormDescription("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCategory("Career");
    setFormStatus("Planned");
    setFormTagsString("");
  };

  const startEditNode = (node: LifeNode) => {
    setIsEditMode(true);
    setFormTitle(node.title);
    setFormDescription(node.description);
    setFormDate(node.date);
    setFormCategory(node.category);
    setFormStatus(node.status);
    setFormTagsString(node.tags.join(", "));
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const tags = formTagsString
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      title: formTitle,
      description: formDescription,
      date: formDate,
      category: formCategory,
      status: formStatus,
      tags
    };

    try {
      if (isCreateMode) {
        const res = await fetch("/api/life-nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            x: 100 + Math.random() * 300,
            y: 100 + Math.random() * 200
          })
        });
        if (res.ok) {
          const newNode = await res.json();
          setNodes(prev => [...prev, newNode]);
          setSelectedNode(newNode);
          setIsCreateMode(false);
        }
      } else if (selectedNode) {
        const res = await fetch(`/api/life-nodes/${selectedNode.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updatedNode = await res.json();
          setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
          setSelectedNode(updatedNode);
          setIsEditMode(false);
        }
      }
    } catch (e) {
      console.error("Error saving journey milestone:", e);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event from your timeline journey?")) return;
    try {
      const res = await fetch(`/api/life-nodes/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setNodes(prev => prev.filter(n => n.id !== id));
        setSelectedNode(null);
      }
    } catch (e) {
      console.error("Error deleting journey milestone:", e);
    }
  };

  // Node coloring helpers
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "Career":
        return {
          border: "border-cyan-500",
          text: "text-cyan-400",
          glow: "shadow-[0_0_15px_rgba(6,182,212,0.6)]",
          bg: "bg-cyan-950/40",
          accent: "#06b6d4"
        };
      case "Personal":
        return {
          border: "border-amber-500",
          text: "text-amber-400",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.6)]",
          bg: "bg-amber-950/40",
          accent: "#f59e0b"
        };
      case "Health":
        return {
          border: "border-emerald-500",
          text: "text-emerald-400",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.6)]",
          bg: "bg-emerald-950/40",
          accent: "#10b981"
        };
      case "Education":
        return {
          border: "border-blue-500",
          text: "text-blue-400",
          glow: "shadow-[0_0_15px_rgba(59,130,246,0.6)]",
          bg: "bg-blue-950/40",
          accent: "#3b82f6"
        };
      case "SaaS":
        return {
          border: "border-pink-500",
          text: "text-pink-400",
          glow: "shadow-[0_0_15px_rgba(236,72,153,0.6)]",
          bg: "bg-pink-950/40",
          accent: "#ec4899"
        };
      default:
        return {
          border: "border-purple-500",
          text: "text-purple-400",
          glow: "shadow-[0_0_15px_rgba(139,92,246,0.6)]",
          bg: "bg-purple-950/40",
          accent: "#8b5cf6"
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Career": return <Award className="w-5 h-5" />;
      case "Personal": return <UserIcon className="w-5 h-5" />;
      case "Health": return <Activity className="w-5 h-5" />;
      case "Education": return <BookOpen className="w-5 h-5" />;
      case "SaaS": return <Code className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  // Sort nodes chronologically for animated lines mapping
  const chronologicalNodes = [...nodes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      
      {/* Styles injector for glowing milestone dashes */}
      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -100px;
          }
        }
        .animate-line-flow {
          animation: flowDash 3.5s linear infinite;
        }
      `}</style>

      {/* Futuristic Navigation Tabs Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-white font-display">
              Neural Life Tracker Workspace
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              Dynamic full-stack matrix mapping critical lifestyle vectors & journey nodes
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 bg-black/60 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab("nodes")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "nodes"
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            Journey Node Map
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "metrics"
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Bio-Metrics Hub
          </button>
        </div>
      </div>

      {activeTab === "nodes" ? (
        <div className="space-y-6">
          
          {/* Journey map filters & action bar */}
          <div className="cyber-glass border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1 font-mono">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search milestone tags, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="">-- ALL CATEGORIES --</option>
                <option value="Career">Career</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="SaaS">SaaS Launch</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="">-- ALL STATUSES --</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Planned">Planned</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={fetchNodes}
                className="px-3 py-2 bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/40 text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer font-mono"
                title="Synchronize database"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
              
              <button
                onClick={openCreateDrawer}
                className="flex-1 md:flex-initial px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center gap-1.5 cursor-pointer font-mono"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>

          </div>

          {/* Interactive Graph Canvas Arena */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left side: Canvas viewport */}
            <div className="md:col-span-12 lg:col-span-8 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-widest px-1">
                <span>Viewport Resolution: 1024 x 550 Pixels</span>
                <span className="flex items-center gap-1 text-cyan-500">
                  <Info className="w-3 h-3" />
                  Drag nodes to organize timeline chronologically
                </span>
              </div>

              {/* Panable Canvas Outer Container */}
              <div className="w-full bg-[#030510]/95 border border-cyan-500/15 rounded-2xl relative overflow-auto shadow-[inset_0_0_50px_rgba(6,182,212,0.12),0_0_40px_rgba(0,0,0,0.9)] scrollbar-thin transition-all duration-300 hover:border-cyan-500/30">
                
                {/* Cyber grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                
                {/* Scrollable Canvas Inner Wrapper */}
                <div
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasMouseUp}
                  className="w-[1024px] h-[550px] relative select-none"
                >
                  
                  {/* SVG Connection Layer */}
                  <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 0 }}>
                    <defs>
                      <linearGradient id="neonCyanPink" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <filter id="neonStrokeGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Draw Chronological Connective Path */}
                    {chronologicalNodes.map((node, i) => {
                      if (i === chronologicalNodes.length - 1) return null;
                      const nextNode = chronologicalNodes[i + 1];

                      // Center point vectors
                      const x1 = node.x + 24;
                      const y1 = node.y + 24;
                      const x2 = nextNode.x + 24;
                      const y2 = nextNode.y + 24;

                      const categoryTheme = getCategoryTheme(node.category);

                      return (
                        <g key={`milestone-link-${node.id}-${nextNode.id}`}>
                          {/* Main line link */}
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={categoryTheme.accent}
                            strokeWidth={1.5}
                            strokeOpacity={0.2}
                          />
                          {/* Sliding animated particles flow */}
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="url(#neonCyanPink)"
                            strokeWidth={2}
                            strokeDasharray="12, 18"
                            className="animate-line-flow"
                            style={{
                              filter: "url(#neonStrokeGlow)"
                            }}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Render node elements absolutely */}
                  {nodes.map(node => {
                    const theme = getCategoryTheme(node.category);
                    const isSelected = selectedNode?.id === node.id;
                    const isDragging = activeDragId === node.id;

                    return (
                      <div
                        key={node.id}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          zIndex: isSelected ? 30 : 10
                        }}
                        onMouseDown={(e) => handleNodeMouseDown(e, node)}
                        onTouchStart={(e) => handleNodeTouchStart(e, node)}
                        onClick={() => handleNodeClick(node)}
                        className={`absolute w-12 h-12 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center border-2 transition duration-200 ${
                          theme.border
                        } ${theme.bg} ${theme.glow} ${
                          isSelected ? "scale-125 border-white ring-4 ring-cyan-400/20" : ""
                        } ${isDragging ? "opacity-90 scale-110" : ""}`}
                      >
                        
                        {/* Glowing radial center pulse for in-progress elements */}
                        {node.status === "In Progress" && (
                          <span className="absolute inset-0 rounded-full border border-pink-500 animate-ping opacity-60 pointer-events-none" />
                        )}

                        {/* Node status indicators */}
                        {node.status === "Completed" ? (
                          <div className="text-white">
                            {getCategoryIcon(node.category)}
                          </div>
                        ) : node.status === "In Progress" ? (
                          <div className="animate-pulse text-white">
                            {getCategoryIcon(node.category)}
                          </div>
                        ) : (
                          <div className="opacity-45 text-white scale-90">
                            {getCategoryIcon(node.category)}
                          </div>
                        )}

                        {/* Floating visual badge title text below orb */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 text-center pointer-events-none font-mono">
                          <span className="block text-[9px] font-bold text-gray-200 truncate uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                            {node.title}
                          </span>
                          <span className="block text-[7px] text-gray-500 uppercase tracking-widest font-mono">
                            {node.date}
                          </span>
                        </div>

                      </div>
                    );
                  })}

                  {/* Empty canvas placeholders */}
                  {nodes.length === 0 && !loadingNodes && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono p-4">
                      <Compass className="w-10 h-10 text-cyan-500/20 mb-2" />
                      <span className="text-xs text-gray-500 uppercase tracking-widest">
                        Neural grid empty. Register nodes or reset filters to populate.
                      </span>
                    </div>
                  )}

                  {loadingNodes && (
                    <div className="absolute inset-0 flex items-center justify-center font-mono bg-black/40">
                      <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mr-2" />
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Compiling nodes layout...</span>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right side: Detailed Control Dashboard Panel */}
            <div className="md:col-span-12 lg:col-span-4 font-mono space-y-4">
              
              {!selectedNode && !isCreateMode && (
                <div className="cyber-glass border border-white/5 rounded-2xl p-6 text-center text-gray-400 space-y-3">
                  <Sparkles className="w-8 h-8 text-cyan-400/40 mx-auto animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">
                    Timeline Journey Console
                  </h4>
                  <p className="text-[10px] leading-relaxed text-gray-500">
                    Select any milestone node on the interactive grid map to view granular details, edit milestone tags, or schedule upcoming life events.
                  </p>
                  <button
                    onClick={openCreateDrawer}
                    className="w-full py-2 bg-cyan-950/30 hover:bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] uppercase font-bold rounded-xl transition cursor-pointer tracking-widest"
                  >
                    + Add New Milestone Node
                  </button>
                </div>
              )}

              {/* View/Edit Node Panel */}
              {selectedNode && (
                <div className="cyber-glass border border-white/5 rounded-2xl p-6 text-white space-y-4 relative overflow-hidden">
                  
                  {/* Category Glow backdrop */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 pointer-events-none`}
                    style={{ backgroundColor: getCategoryTheme(selectedNode.category).accent }}
                  />

                  {/* Header */}
                  <div className="border-b border-white/5 pb-3 flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-cyan-400 font-bold uppercase tracking-widest block w-max mb-1">
                        Milestone Detail
                      </span>
                      <h3 className="text-sm font-bold uppercase text-white font-display">
                        {selectedNode.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 text-gray-500 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!isEditMode ? (
                    /* Display Details Mode */
                    <div className="space-y-4 text-xs">
                      
                      {/* Grid parameters */}
                      <div className="grid grid-cols-2 gap-3 bg-black/40 border border-white/5 p-3 rounded-xl">
                        <div>
                          <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Category</span>
                          <span className="font-bold text-white flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryTheme(selectedNode.category).accent }} />
                            {selectedNode.category}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Milestone Status</span>
                          <span className="font-bold text-gray-300">
                            {selectedNode.status}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-white/5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-[10px] text-gray-400 uppercase">Accomplish Date: {selectedNode.date}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <span className="block text-[8px] text-gray-500 uppercase tracking-wider">Node Description</span>
                        <p className="text-[11px] text-gray-300 leading-relaxed font-sans bg-black/20 p-2.5 rounded-lg border border-white/5">
                          {selectedNode.description || "No granular logs loaded for this node milestone vector."}
                        </p>
                      </div>

                      {/* Tags */}
                      {selectedNode.tags && selectedNode.tags.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="block text-[8px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Tags className="w-3.5 h-3.5" />
                            Neural Metadata Tags
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {selectedNode.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-cyan-950/30 border border-cyan-500/20 rounded text-[9px] text-cyan-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline flow controls */}
                      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startEditNode(selectedNode)}
                          className="py-2.5 bg-black/40 border border-white/10 text-gray-300 hover:text-white hover:border-cyan-500/30 font-bold uppercase text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Event</span>
                        </button>
                        <button
                          onClick={() => handleDeleteNode(selectedNode.id)}
                          className="py-2.5 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge Node</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* Edit form Mode */
                    <form onSubmit={handleSaveNode} className="space-y-4 text-xs">
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest">Title</label>
                        <input
                          type="text"
                          required
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-gray-400 uppercase tracking-widest">Category</label>
                          <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value="Career">Career</option>
                            <option value="Personal">Personal</option>
                            <option value="Health">Health</option>
                            <option value="Education">Education</option>
                            <option value="SaaS">SaaS</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] text-gray-400 uppercase tracking-widest">Status</label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as any)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value="Completed">Completed</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Planned">Planned</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest">Target Date</label>
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest">Description</label>
                        <textarea
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest">Tags (Comma Separated)</label>
                        <input
                          type="text"
                          value={formTagsString}
                          onChange={(e) => setFormTagsString(e.target.value)}
                          placeholder="e.g. stripe, engineering, move"
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditMode(false)}
                          className="flex-1 py-2 bg-black/40 border border-white/10 text-gray-400 text-[10px] uppercase font-bold rounded-xl hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] uppercase font-bold rounded-xl transition shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                        >
                          Save Matrix
                        </button>
                      </div>

                    </form>
                  )}

                </div>
              )}

              {/* Create Node Form Drawer */}
              {isCreateMode && (
                <div className="cyber-glass border border-white/5 rounded-2xl p-6 text-white space-y-4">
                  
                  {/* Header */}
                  <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-cyan-400 animate-pulse" />
                        Log Journey Milestone
                      </h3>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">
                        Map a critical milestone event vector to your interactive graph
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreateMode(false)}
                      className="p-1 text-gray-500 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveNode} className="space-y-4 text-xs">
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest">Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Joined Stripe"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest">Category</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                        >
                          <option value="Career">Career</option>
                          <option value="Personal">Personal</option>
                          <option value="Health">Health</option>
                          <option value="Education">Education</option>
                          <option value="SaaS">SaaS</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest">Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Planned">Planned</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest">Accomplished Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest">Milestone Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detail the impact of this event..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-400 uppercase tracking-widest">Neural tags (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. relocation, stripe, career"
                        value={formTagsString}
                        onChange={(e) => setFormTagsString(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase text-[10px] tracking-widest rounded-xl transition shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
                    >
                      Inject Node into Grid
                    </button>

                  </form>

                </div>
              )}

            </div>

          </div>

        </div>
      ) : (
        /* Legacy Bio-Metrics Tracker View (Tab: metrics) */
        <div className="space-y-6">
          
          {/* Analytics Panel */}
          <AnalyticsPanel tasks={tasks} trackers={trackers} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form */}
            <div className="lg:col-span-5 cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Log Bio-Energy State
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                  Input physical or mental bio-metrics to align cognitive schedules
                </p>
              </div>

              <form onSubmit={handleMetricSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Metric Selector</label>
                  <select
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="Water Intake">Water Intake</option>
                    <option value="Sleep">Sleep Duration</option>
                    <option value="Steps">Daily Foot Steps</option>
                    <option value="Focus Session">Focus Block Duration</option>
                    <option value="Active Workout">Physical Workout</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Value</label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Unit</label>
                    <input
                      type="text"
                      disabled
                      value={unit}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono"
                    />
                  </div>
                </div>

                {metricName === "Focus Session" && (
                  <div className="space-y-4 pt-3 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Associated Subject / Task</label>
                      <select
                        value={focusTaskId}
                        onChange={(e) => setFocusTaskId(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="">-- No Specific Task --</option>
                        {tasks.filter(t => t.status === "pending").map(t => (
                          <option key={t.id} value={t.id}>
                            [{t.category.toUpperCase()}] {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Mind State</label>
                      <select
                        value={focusMindState}
                        onChange={(e) => setFocusMindState(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="Deep Concentration">Deep Concentration (Beta)</option>
                        <option value="Creative Flow">Creative Flow (Alpha)</option>
                        <option value="Light Review & Buffer">Light Review (Theta)</option>
                        <option value="Rapid Fire Coding">Rapid Fire (Gamma)</option>
                        <option value="Strategic Planning">Strategic Planning</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Intention Notes</label>
                      <input
                        type="text"
                        value={focusNotes}
                        onChange={(e) => setFocusNotes(e.target.value)}
                        placeholder="Brief log of focus session targets..."
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50 font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(168,85,247,0.15)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Data Point</span>
                </button>
              </form>

              <div className="bg-[#05091e]/50 border border-purple-500/10 p-4 rounded-xl space-y-3">
                <div className="flex gap-2.5 items-start">
                  <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-purple-400 font-bold uppercase">Uplink Alignment Rank:</span>
                    <span className="block text-xs text-white font-bold">
                      {profile.completedQuests && profile.completedQuests > 2 ? "Adept Cybernetic Mind" : "Cognitive Novice"}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                      Log bio-metrics daily to advance your productivity coefficient and unlock high-tier matrices.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs List */}
            <div className="lg:col-span-7 cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4">
              <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Bio-Metric Logs
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                    Raw historic input data feeds
                  </p>
                </div>
                
                <div className="px-2.5 py-1 bg-purple-950/20 border border-purple-500/20 rounded-lg text-[10px] text-purple-400">
                  Total Points: {trackers.length}
                </div>
              </div>

              {trackers.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">No bio-metrics logged in current database.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Fill the input form to populate trackers.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {trackers.slice().reverse().map(log => (
                    <div key={log.id} className="p-3 bg-black/60 border border-white/5 hover:border-purple-500/20 rounded-xl flex justify-between items-center gap-4 transition-all group">
                      <div>
                        <span className="block text-xs font-bold text-white">{log.metricName}</span>
                        <span className="block text-[9px] text-gray-500 uppercase mt-0.5">
                          Logged Date: {log.createdAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-purple-400 font-display">
                          {log.value} {log.unit}
                        </span>
                        <button
                          onClick={() => onDeleteTracker(log.id)}
                          className="p-1 text-gray-500 hover:text-red-400 transition cursor-pointer"
                          title="Purge record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
