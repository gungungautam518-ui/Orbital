import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldAlert, 
  ChevronRight, 
  Loader2, 
  KeyRound, 
  ArrowLeft,
  Sparkles,
  Info,
  Activity,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Bell,
  CheckCircle,
  X,
  Volume2,
  TrendingUp,
  Brain,
  Zap,
  MousePointer,
  ListTodo,
  Award,
  BookOpen,
  Code,
  Globe,
  Compass
} from "lucide-react";
import { User } from "../types";
import FloatingStars from "./FloatingStars";

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

interface PhysicsNode {
  id: string;
  label: string;
  description?: string;
  date?: string;
  category?: string;
  status?: 'Completed' | 'In Progress' | 'Planned';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

const getCategoryTheme = (category?: string) => {
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

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case "Career": return <Award className="w-5 h-5" />;
    case "Personal": return <UserIcon className="w-5 h-5" />;
    case "Health": return <Activity className="w-5 h-5" />;
    case "Education": return <BookOpen className="w-5 h-5" />;
    case "SaaS": return <Code className="w-5 h-5" />;
    default: return <Globe className="w-5 h-5" />;
  }
};

interface PhysicsLink {
  source: string;
  target: string;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  // Navigation / Auth Mode
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  
  // Auth Form Input fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username for login
  const [rememberMe, setRememberMe] = useState(false);

  // Auth States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingForgot, setSubmittingForgot] = useState(false);

  // Active navigation anchor in Landing Page
  const [activeAnchor, setActiveAnchor] = useState("hero");

  // Living Graph State (Fully Interactive Force-directed Graph)
  const [nodes, setNodes] = useState<PhysicsNode[]>([
    { id: "1", label: "First Internship", x: 150, y: 150, vx: 0, vy: 0, color: "#3b82f6", size: 48, category: "Education", status: "Completed", date: "2024-06-01" },
    { id: "2", label: "Joined Stripe", x: 280, y: 300, vx: 0, vy: 0, color: "#06b6d4", size: 48, category: "Career", status: "Completed", date: "2024-11-15" },
    { id: "3", label: "Moved to Pune", x: 440, y: 180, vx: 0, vy: 0, color: "#f59e0b", size: 48, category: "Personal", status: "Completed", date: "2025-01-10" },
    { id: "4", label: "Daily Run", x: 600, y: 320, vx: 0, vy: 0, color: "#10b981", size: 48, category: "Health", status: "In Progress", date: "2026-01-01" },
    { id: "5", label: "Launch SaaS", x: 700, y: 200, vx: 0, vy: 0, color: "#ec4899", size: 48, category: "SaaS", status: "In Progress", date: "2026-06-25" },
  ]);
  const [links, setLinks] = useState<PhysicsLink[]>([
    { source: "1", target: "2" },
    { source: "2", target: "3" },
    { source: "3", target: "4" },
    { source: "4", target: "5" },
  ]);

  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeCategory, setNewNodeCategory] = useState("Career");
  const [newNodeStatus, setNewNodeStatus] = useState("Completed");
  const [newNodeDate, setNewNodeDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Physics animation ref and dragging info
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const dragNodeIdRef = useRef<string | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Clear auth states when mode shifts
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [mode]);

  // Pre-load saved credentials if "remember me" was checked
  useEffect(() => {
    const saved = localStorage.getItem("aibi_saved_identifier");
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  // Listen to OAuth messages from popups
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setLoading(true);
        try {
          if (event.data.token) {
            localStorage.setItem("auth_token", event.data.token);
          }
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          if (data.user) {
            if (data.token) {
              localStorage.setItem("auth_token", data.token);
            }
            setSuccess("Authentication successful. Welcome!");
            setTimeout(() => {
              onAuthSuccess(data.user);
            }, 1000);
          } else {
            setError("Authentication response was empty.");
          }
        } catch (e: any) {
          setError(`Google OAuth syncing failed: ${e.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onAuthSuccess]);

  // Force-directed graph physics engine simulation loop
  useEffect(() => {
    let animationId: number;
    
    const tick = () => {
      setNodes(prevNodes => {
        // Calculate container dimensions (approximate 800x450 boundary box)
        const width = 800;
        const height = 450;

        // Apply forces
        const nextNodes = prevNodes.map(node => {
          // If being dragged, lock position to mouse
          if (dragNodeIdRef.current === node.id) {
            return {
              ...node,
              x: mousePosRef.current.x,
              y: mousePosRef.current.y,
              vx: 0,
              vy: 0
            };
          }

          let fx = 0;
          let fy = 0;

          // 1. Gravity toward the center (350, 220)
          const centerX = width / 2;
          const centerY = height / 2;
          fx += (centerX - node.x) * 0.005;
          fy += (centerY - node.y) * 0.005;

          // 2. Electrostatic Repulsion from other nodes (prevent overlaps)
          prevNodes.forEach(other => {
            if (other.id === node.id) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const dist = Math.sqrt(distSq);
            
            if (dist < 150) {
              // strong push when close
              const force = (150 - dist) * 0.08;
              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
            }
          });

          // 3. Spring forces from connected links
          links.forEach(link => {
            let otherId = "";
            if (link.source === node.id) otherId = link.target;
            else if (link.target === node.id) otherId = link.source;

            if (otherId) {
              const other = prevNodes.find(n => n.id === otherId);
              if (other) {
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const restLength = 180; // target link length
                const strength = 0.015;
                const force = (dist - restLength) * strength;
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
              }
            }
          });

          // Calculate acceleration, friction, and new speed
          const friction = 0.85;
          const vx = (node.vx + fx) * friction;
          const vy = (node.vy + fy) * friction;

          // Next position coordinates bounded
          let x = node.x + vx;
          let y = node.y + vy;

          if (x < 40) { x = 40; }
          if (x > width - 40) { x = width - 40; }
          if (y < 40) { y = 40; }
          if (y > height - 40) { y = height - 40; }

          return {
            ...node,
            x,
            y,
            vx,
            vy
          };
        });

        return nextNodes;
      });

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [links]);

  // Mouse Interaction handlers for Living Graph
  const handleGraphMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    dragNodeIdRef.current = nodeId;
    mousePosRef.current = { x, y };
  };

  const handleGraphMouseMove = (e: React.MouseEvent) => {
    if (!dragNodeIdRef.current || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mousePosRef.current = { x, y };
  };

  const handleGraphMouseUp = () => {
    dragNodeIdRef.current = null;
  };

  // Add new node dynamically to physical network graph
  const handleAddNewNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;
    
    const newId = (Date.now()).toString();
    const randomAngle = Math.random() * Math.PI * 2;
    const spawnDistance = 100;
    const centerX = 400;
    const centerY = 225;

    const theme = getCategoryTheme(newNodeCategory);

    const newNode: PhysicsNode = {
      id: newId,
      label: newNodeLabel,
      x: centerX + Math.cos(randomAngle) * spawnDistance,
      y: centerY + Math.sin(randomAngle) * spawnDistance,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      color: theme.accent,
      size: 48,
      category: newNodeCategory,
      status: newNodeStatus as any,
      date: newNodeDate
    };

    // Link with a random existing node to anchor it to the structure
    const randomExistingIndex = nodes.length > 0 ? Math.floor(Math.random() * nodes.length) : 0;
    
    setNodes(prev => [...prev, newNode]);
    if (nodes.length > 0) {
      const targetNodeId = nodes[randomExistingIndex].id;
      setLinks(prev => [...prev, { source: newId, target: targetNodeId }]);
    }
    setNewNodeLabel("");
  };

  // Local Form validation
  const validateForm = () => {
    if (mode === "login") {
      if (!identifier.trim()) {
        setError("Username or Email is required.");
        return false;
      }
      if (!password) {
        setError("Password is required.");
        return false;
      }
    } else if (mode === "register") {
      if (!fullName.trim()) {
        setError("Full Name is required.");
        return false;
      }
      if (!username.trim()) {
        setError("Username is required.");
        return false;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("A valid Email Address is required.");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return false;
      }
    }
    return true;
  };

  // Submit standard auth credentials
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Invalid username/email or password.");
        }

        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        setSuccess("Success! Logging in...");
        
        if (rememberMe) {
          localStorage.setItem("aibi_saved_identifier", identifier);
        } else {
          localStorage.removeItem("aibi_saved_identifier");
        }

        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 1200);

      } else if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, username, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to register account.");
        }

        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        setSuccess("Account successfully created! Logging in...");
        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 1200);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth flow launcher
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/google/url");
      if (!res.ok) {
        throw new Error("Unable to contact Google login server.");
      }

      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        "aibi_google_auth",
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        throw new Error("Login popup was blocked. Please allow popups for this site.");
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  // Simulated password reset
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setSubmittingForgot(true);
    setError(null);
    setSuccess(null);

    setTimeout(() => {
      setSuccess("A password reset link has been sent to your email address.");
      setSubmittingForgot(false);
    }, 1500);
  };

  // Launch auth modal in specific mode
  const launchAuth = (selectedMode: "login" | "register") => {
    setMode(selectedMode);
    setShowAuthOverlay(true);
  };

  return (
    <div className="min-h-screen bg-[#02040c] text-gray-200 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.8deg); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-0.5deg); }
        }
        @keyframes float-slow-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(0.4deg); }
        }
        @keyframes float-slow-4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(-0.8deg); }
        }
        @keyframes pulse-neon-pink {
          0%, 100% { box-shadow: 0 0 8px rgba(236,72,153,0.05), inset 0 0 4px rgba(236,72,153,0.02); border-color: rgba(236,72,153,0.15); }
          50% { box-shadow: 0 0 25px rgba(236,72,153,0.3), inset 0 0 10px rgba(236,72,153,0.1); border-color: rgba(236,72,153,0.45); }
        }
        @keyframes pulse-neon-orange {
          0%, 100% { box-shadow: 0 0 8px rgba(249,115,22,0.05), inset 0 0 4px rgba(249,115,22,0.02); border-color: rgba(249,115,22,0.15); }
          50% { box-shadow: 0 0 25px rgba(249,115,22,0.3), inset 0 0 10px rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.45); }
        }
        @keyframes pulse-neon-purple {
          0%, 100% { box-shadow: 0 0 8px rgba(168,85,247,0.05), inset 0 0 4px rgba(168,85,247,0.02); border-color: rgba(168,85,247,0.15); }
          50% { box-shadow: 0 0 25px rgba(168,85,247,0.3), inset 0 0 10px rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.45); }
        }
        @keyframes pulse-neon-cyan {
          0%, 100% { box-shadow: 0 0 8px rgba(6,182,212,0.05), inset 0 0 4px rgba(6,182,212,0.02); border-color: rgba(6,182,212,0.15); }
          50% { box-shadow: 0 0 25px rgba(6,182,212,0.3), inset 0 0 10px rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.45); }
        }
        @keyframes pulse-neon-emerald {
          0%, 100% { box-shadow: 0 0 8px rgba(16,185,129,0.05), inset 0 0 4px rgba(16,185,129,0.02); border-color: rgba(16,185,129,0.15); }
          50% { box-shadow: 0 0 25px rgba(16,185,129,0.3), inset 0 0 10px rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.45); }
        }
        @keyframes pulse-neon-blue {
          0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.05), inset 0 0 4px rgba(59,130,246,0.02); border-color: rgba(59,130,246,0.15); }
          50% { box-shadow: 0 0 25px rgba(59,130,246,0.3), inset 0 0 10px rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.45); }
        }
        @keyframes pulse-neon-indigo {
          0%, 100% { box-shadow: 0 0 8px rgba(99,102,241,0.05), inset 0 0 4px rgba(99,102,241,0.02); border-color: rgba(99,102,241,0.15); }
          50% { box-shadow: 0 0 25px rgba(99,102,241,0.3), inset 0 0 10px rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.45); }
        }
        @keyframes pulse-neon-amber {
          0%, 100% { box-shadow: 0 0 8px rgba(245,158,11,0.05), inset 0 0 4px rgba(245,158,11,0.02); border-color: rgba(245,158,11,0.15); }
          50% { box-shadow: 0 0 25px rgba(245,158,11,0.3), inset 0 0 10px rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.45); }
        }
        @keyframes drift-slow {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift-slow-reverse {
          0% { transform: translate(0px, 0px) scale(1.15); }
          50% { transform: translate(-30px, 40px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1.15); }
        }
        @keyframes drift-particle-up {
          0% { transform: translateY(0px) translateX(0px) scale(0.8); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-200px) translateX(40px) scale(1.2); opacity: 0; }
        }
        @keyframes drift-particle-up-delayed {
          0% { transform: translateY(0px) translateX(0px) scale(1.1); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-220px) translateX(-40px) scale(0.8); opacity: 0; }
        }
        .animate-float-1 { animation: float-slow-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-slow-2 7.5s ease-in-out infinite; }
        .animate-float-3 { animation: float-slow-3 9s ease-in-out infinite; }
        .animate-float-4 { animation: float-slow-4 6.8s ease-in-out infinite; }
        
        .animate-neon-glow-pink { animation: pulse-neon-pink 4s ease-in-out infinite; }
        .animate-neon-glow-orange { animation: pulse-neon-orange 4.5s ease-in-out infinite; }
        .animate-neon-glow-purple { animation: pulse-neon-purple 5s ease-in-out infinite; }
        .animate-neon-glow-cyan { animation: pulse-neon-cyan 3.8s ease-in-out infinite; }
        .animate-neon-glow-emerald { animation: pulse-neon-emerald 4.2s ease-in-out infinite; }
        .animate-neon-glow-blue { animation: pulse-neon-blue 4.8s ease-in-out infinite; }
        .animate-neon-glow-indigo { animation: pulse-neon-indigo 4.6s ease-in-out infinite; }
        .animate-neon-glow-amber { animation: pulse-neon-amber 5.2s ease-in-out infinite; }
        
        .animate-drift-bg { animation: drift-slow 16s ease-in-out infinite; }
        .animate-drift-bg-rev { animation: drift-slow-reverse 20s ease-in-out infinite; }
        
        .particle-1 { animation: drift-particle-up 14s linear infinite; }
        .particle-2 { animation: drift-particle-up-delayed 18s linear infinite; }
        .particle-3 { animation: drift-particle-up 12s linear infinite; animation-delay: 3.5s; }
        .particle-4 { animation: drift-particle-up-delayed 16s linear infinite; animation-delay: 5s; }
      `}</style>
      
      {/* BACKGROUND GRAPHIC MATRIX (MOVING STARFIELD) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Glowing cosmic grids and ambient noise */}
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/8 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: "14s" }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/8 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: "18s" }} />
        <div className="absolute top-[35%] left-[25%] w-[40vw] h-[40vw] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
        
        {/* Star grids */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        {/* Highly Interactive Floating Twinkling Stars */}
        <FloatingStars />
      </div>

      {/* 1. HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 w-full bg-black/40 backdrop-blur-xl border-b border-white/5 z-30 select-none">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <div className="w-full h-full bg-[#030612] rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="block text-sm font-bold tracking-widest text-white uppercase font-mono">Orbital</span>
              <span className="block text-[8px] text-cyan-400 font-bold uppercase tracking-widest">The future of productivity</span>
            </div>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wider font-mono font-medium text-gray-400">
            <a href="#problem" className="hover:text-cyan-400 hover:scale-110 hover:-translate-y-0.5 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] transition-all duration-300">Problem</a>
            <a href="#features" className="hover:text-cyan-400 hover:scale-110 hover:-translate-y-0.5 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] transition-all duration-300">Features</a>
            <a href="#tracker" className="hover:text-cyan-400 hover:scale-110 hover:-translate-y-0.5 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] transition-all duration-300">Life Tracker</a>
            <a href="#dashboard" className="hover:text-cyan-400 hover:scale-110 hover:-translate-y-0.5 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] transition-all duration-300">Dashboard</a>
            <button onClick={() => launchAuth("login")} className="hover:text-cyan-400 hover:scale-110 hover:-translate-y-0.5 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] transition-all duration-300 cursor-pointer">Stories</button>
          </nav>

          {/* Call to Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => launchAuth("login")}
              className="px-4 py-2 text-sm font-bold uppercase tracking-widest text-white hover:text-cyan-400 hover:scale-110 hover:-translate-y-0.5 hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.95)] transition-all duration-300 cursor-pointer font-mono"
            >
              Sign In
            </button>
            <button
              onClick={() => launchAuth("register")}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] font-mono"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* LANDING CONTENT */}
      <div className="relative z-10">
        
        {/* SECTION 1: HERO CONTAINER */}
        <section className="py-20 lg:py-28 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Cognitive Schedule Heuristics</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Your AI Productivity Companion That Helps You <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">Finish</span>, Not Just Remember.
            </h1>

            <p className="text-gray-400 text-sm sm:text-base font-normal max-w-2xl leading-relaxed">
              Orbital doesn't just remind you of deadlines — it understands your workload, prioritizes what matters, and guides you through meaningful action so nothing important slips away.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => launchAuth("register")}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <span>Launch Alignment</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <a
                href="#problem"
                className="px-8 py-3.5 bg-black/60 hover:bg-black/80 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition flex items-center justify-center gap-2 font-mono"
              >
                Explore Heuristics
              </a>
            </div>
          </div>

          {/* Floating graphic mockup: Orbital Dashboard Widget */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-2xl blur-2xl pointer-events-none opacity-40 animate-pulse" />
            
            <div className="relative cyber-glass border border-cyan-500/30 rounded-2xl p-6 text-white font-mono space-y-4 hover:border-cyan-500/50 transition-all duration-500 hover:scale-[1.02] shadow-[0_0_40px_rgba(6,182,212,0.15)] bg-black/80 select-none">
              <div className="absolute top-2 right-4 text-[8px] text-gray-600 uppercase tracking-widest">Orbital System Active</div>
              
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Orbital Dashboard</span>
              </div>

              {/* Top Priority Widget mockup */}
              <div className="bg-[#050b1a]/90 border border-cyan-500/20 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                    Top Priority
                  </span>
                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded">Due Today</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Complete Q3 Financial Report</h4>
                  <p className="text-[10px] text-gray-400 mt-1">AI suggests 2 focused hours this afternoon</p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 h-full w-[70%] animate-pulse" />
                </div>
              </div>

              {/* Up Next / Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#050b1a]/70 border border-white/5 rounded-xl p-3 space-y-2">
                  <span className="block text-[8px] text-gray-500 uppercase font-bold">Up Next</span>
                  <ul className="text-[10px] space-y-1">
                    <li className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Team standup
                    </li>
                    <li className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Client review
                    </li>
                    <li className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Gym session
                    </li>
                  </ul>
                </div>

                <div className="bg-[#050b1a]/70 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                  <span className="block text-[8px] text-purple-400 uppercase font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-400" />
                    AI Insight
                  </span>
                  <p className="text-[9px] text-gray-400 leading-normal italic">
                    "You have 3 similar tasks. Batch them to save 45 mins."
                  </p>
                </div>
              </div>

              {/* Small Stats Strip */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                  <span className="block text-xs font-bold text-cyan-400">4.2h</span>
                  <span className="block text-[8px] text-gray-500 uppercase">Focus</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                  <span className="block text-xs font-bold text-purple-400">18/24</span>
                  <span className="block text-[8px] text-gray-500 uppercase">Tasks</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg">
                  <span className="block text-xs font-bold text-pink-400">12 days</span>
                  <span className="block text-[8px] text-gray-500 uppercase">Streak</span>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* SECTION 2: THE PRODUCTIVITY GAP (PROBLEM) */}
        <section id="problem" className="relative py-20 bg-black/30 border-y border-white/5 overflow-hidden">
          {/* Glowing ambient background highlights */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-[100px] animate-drift-bg pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] animate-drift-bg-rev pointer-events-none" />

          {/* Floating neon particles */}
          <div className="absolute left-[10%] bottom-10 w-2 h-2 bg-pink-400 rounded-full blur-[1px] particle-1 pointer-events-none" />
          <div className="absolute right-[15%] bottom-20 w-1.5 h-1.5 bg-orange-400 rounded-full blur-[1px] particle-2 pointer-events-none" />
          <div className="absolute left-[40%] bottom-5 w-2 h-2 bg-purple-400 rounded-full blur-[1px] particle-3 pointer-events-none" />
          <div className="absolute right-[45%] bottom-25 w-1 h-1 bg-cyan-400 rounded-full blur-[1px] particle-4 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>The Productivity Gap</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Deadlines shouldn’t feel like <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-500">surprises</span>.
              </h2>

              <p className="text-gray-400 text-sm leading-relaxed">
                Every day, students miss assignments, professionals miss meetings, and entrepreneurs miss opportunities. The tools we rely on remind us — but they don’t help us finish.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed">
                Orbital closes that gap by understanding your goals, your schedule, and your context to deliver the right nudge at the right moment with a clear path forward.
              </p>

              <div className="pt-2">
                <button 
                  onClick={() => launchAuth("register")}
                  className="px-6 py-3 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer font-mono"
                >
                  Bridge the Gap
                </button>
              </div>
            </div>

            {/* Right Cards list */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 bg-[#050714] border border-white/5 rounded-2xl space-y-3 font-mono animate-float-1 animate-neon-glow-pink">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-pink-400" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">Deadlines slip away</h4>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Assignments, bills, meetings, and deliverables get buried under endless notifications and to-do lists.
                </p>
              </div>

              <div className="p-5 bg-[#050714] border border-white/5 rounded-2xl space-y-3 font-mono animate-float-2 animate-neon-glow-orange">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-orange-400" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">Reminders are easy to ignore</h4>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  A simple ping at the wrong time becomes noise. Without context, reminders rarely lead to action.
                </p>
              </div>

              <div className="p-5 bg-[#050714] border border-white/5 rounded-2xl space-y-3 font-mono animate-float-3 animate-neon-glow-purple">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">Everything feels urgent</h4>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Without clear prioritization, every task feels equally important — and nothing gets done well.
                </p>
              </div>

              <div className="p-5 bg-[#050714] border border-white/5 rounded-2xl space-y-3 font-mono animate-float-4 animate-neon-glow-cyan">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">No proactive guidance</h4>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Traditional tools wait for you to remember. You need an assistant that plans and acts ahead of time.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3: CORE MATRIX FEATURES (FEATURES) */}
        <section id="features" className="relative py-20 overflow-hidden">
          {/* Glowing ambient blobs */}
          <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-drift-bg pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-drift-bg-rev pointer-events-none" />

          {/* Floating neon particles */}
          <div className="absolute left-[15%] bottom-10 w-2 h-2 bg-purple-400 rounded-full blur-[1px] particle-1 pointer-events-none" />
          <div className="absolute right-[20%] bottom-32 w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[1px] particle-2 pointer-events-none" />
          <div className="absolute left-[45%] bottom-20 w-1.5 h-1.5 bg-pink-400 rounded-full blur-[1px] particle-3 pointer-events-none" />
          <div className="absolute right-[35%] bottom-4 w-2 h-2 bg-amber-400 rounded-full blur-[1px] particle-4 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center space-y-3 mb-16">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono font-bold">System Capabilities</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">Stay ahead of your most important work.</h2>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-mono">The complete suite of next-generation features in a unified cockpit.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
              {[
                { title: "Intelligent task prioritization", desc: "AI ranks your tasks by urgency, importance, and energy fit so you always know what to do next.", icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-950/20 border-cyan-500/15", glowClass: "animate-neon-glow-cyan", floatClass: "animate-float-1" },
                { title: "AI-powered scheduling assistance", desc: "Automatically builds your daily schedule around meetings, focus blocks, and personal rhythms.", icon: Cpu, color: "text-purple-400", bg: "bg-purple-950/20 border-purple-500/15", glowClass: "animate-neon-glow-purple", floatClass: "animate-float-2" },
                { title: "Personalized recommendations", desc: "Learns how you work and suggests optimizations to improve focus, flow, and output.", icon: Sparkles, color: "text-pink-400", bg: "bg-pink-950/20 border-pink-500/15", glowClass: "animate-neon-glow-pink", floatClass: "animate-float-3" },
                { title: "Context-aware reminders", desc: "Delivers reminders based on location, time, energy, and task dependencies — not just the clock.", icon: Bell, color: "text-orange-400", bg: "bg-orange-950/20 border-orange-500/15", glowClass: "animate-neon-glow-orange", floatClass: "animate-float-4" },
                { title: "Calendar integration", desc: "Syncs with Google, Outlook, and Apple calendars to keep plans realistic and conflict-free.", icon: CalendarIcon, color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-500/15", glowClass: "animate-neon-glow-emerald", floatClass: "animate-float-2" },
                { title: "Goal and habit tracking", desc: "Breaks long-term goals into weekly habits and tracks streaks to keep momentum.", icon: Activity, color: "text-blue-400", bg: "bg-blue-950/20 border-blue-500/15", glowClass: "animate-neon-glow-blue", floatClass: "animate-float-1" },
                { title: "Voice-enabled assistance", desc: "Add tasks, check your schedule, or get a briefing using conversational commands.", icon: Volume2, color: "text-indigo-400", bg: "bg-indigo-950/20 border-indigo-500/15", glowClass: "animate-neon-glow-indigo", floatClass: "animate-float-3" },
                { title: "Autonomous planning", desc: "For routine work, Orbital can plan steps, set deadlines, and even automate basic workflows.", icon: ListTodo, color: "text-amber-400", bg: "bg-amber-950/20 border-amber-500/15", glowClass: "animate-neon-glow-amber", floatClass: "animate-float-4" },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className={`p-6 rounded-2xl border ${feature.bg} ${feature.glowClass} ${feature.floatClass} space-y-3.5 hover:scale-[1.04] transition duration-300`}>
                    <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${feature.color}`} />
                    </div>
                    <h4 className="text-sm font-extrabold text-white uppercase tracking-wider leading-relaxed">{feature.title}</h4>
                    <p className="text-xs text-gray-300 font-sans leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: LIVING GRAPH (FULLY INTERACTIVE DRIFT ENGINE) */}
        <section id="tracker" className="py-20 bg-black/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-3 mb-12">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-1.5">
                <Compass className="w-4 h-4 animate-spin-slow" />
                Interactive Neural Life-Tracker
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Your life, visualized as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">living graph</span>.
              </h2>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-mono max-w-xl mx-auto">
                Map milestones, habits, and goals across time. Drag nodes, explore connections, and watch your journey come alive.
              </p>
            </div>

            {/* DRAGGABLE FORCE PHYSICS BOX */}
            <div className="relative border border-white/5 rounded-2xl bg-black/60 overflow-hidden shadow-2xl p-4 sm:p-6 font-mono">
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

              <div className="absolute top-3 left-4 text-[9px] text-gray-500 uppercase flex items-center gap-2">
                <MousePointer className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Drag nodes to rearrange your journey in real time
              </div>

              {/* Graphic container (SVG + absolute nodes) */}
              <div 
                ref={canvasContainerRef}
                className="w-full h-[450px] border border-dashed border-cyan-500/30 hover:border-cyan-500/50 rounded-xl relative cursor-grab active:cursor-grabbing overflow-hidden bg-[#02040b] shadow-[inset_0_0_30px_rgba(6,182,212,0.08)] transition-all duration-300"
                onMouseMove={handleGraphMouseMove}
                onMouseUp={handleGraphMouseUp}
                onMouseLeave={handleGraphMouseUp}
              >
                {/* Cyber grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* SVG Links */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
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
                  {(() => {
                    const sorted = [...nodes].sort(
                      (a, b) => new Date(a.date || "").getTime() - new Date(b.date || "").getTime()
                    );
                    return sorted.map((node, i) => {
                      if (i === sorted.length - 1) return null;
                      const nextNode = sorted[i + 1];

                      const x1 = node.x;
                      const y1 = node.y;
                      const x2 = nextNode.x;
                      const y2 = nextNode.y;

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
                            strokeOpacity={0.25}
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
                    });
                  })()}
                </svg>

                {/* Floating draggable Nodes styled exactly like the Life Tracker */}
                {nodes.map(node => {
                  const theme = getCategoryTheme(node.category);
                  const isDragging = dragNodeIdRef.current === node.id;

                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => handleGraphMouseDown(node.id, e)}
                      className={`absolute select-none cursor-grab active:cursor-grabbing flex items-center justify-center rounded-full text-center transition duration-200 border-2 ${
                        theme.border
                      } ${theme.bg} ${theme.glow} ${
                        isDragging ? "scale-110 ring-4 ring-white/10" : "hover:scale-105"
                      }`}
                      style={{
                        left: `${node.x - 24}px`, // center the 48px circle on node.x
                        top: `${node.y - 24}px`, // center the 48px circle on node.y
                        width: `48px`,
                        height: `48px`,
                        zIndex: isDragging ? 30 : 10
                      }}
                    >
                      {/* Glowing center pulse for in-progress elements */}
                      {node.status === "In Progress" && (
                        <span className="absolute inset-0 rounded-full border border-pink-500 animate-ping opacity-60 pointer-events-none" />
                      )}

                      {/* Icon inside the node */}
                      <div className={`text-white ${node.status === "In Progress" ? "animate-pulse" : node.status === "Planned" ? "opacity-50 scale-90" : ""}`}>
                        {getCategoryIcon(node.category)}
                      </div>

                      {/* Floating title and date badge below the node orb */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 text-center pointer-events-none font-mono">
                        <span className="block text-[9px] font-bold text-gray-200 truncate uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                          {node.label}
                        </span>
                        <span className="block text-[7px] text-gray-500 uppercase tracking-widest">
                          {node.date || "Planned"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input section to add new dynamic Node */}
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col xl:flex-row items-center justify-between gap-4">
                <form onSubmit={handleAddNewNode} className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Milestone Title</span>
                    <input
                      type="text"
                      required
                      placeholder="Enter milestone title..."
                      value={newNodeLabel}
                      onChange={(e) => setNewNodeLabel(e.target.value)}
                      className="bg-[#05081b] border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 w-full sm:w-52 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Category</span>
                    <select
                      value={newNodeCategory}
                      onChange={(e) => setNewNodeCategory(e.target.value)}
                      className="bg-[#05081b] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer h-8 font-mono"
                    >
                      <option value="Career">Career</option>
                      <option value="Personal">Personal</option>
                      <option value="Health">Health</option>
                      <option value="Education">Education</option>
                      <option value="SaaS">SaaS</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Status</span>
                    <select
                      value={newNodeStatus}
                      onChange={(e) => setNewNodeStatus(e.target.value)}
                      className="bg-[#05081b] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer h-8 font-mono"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Planned">Planned</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">Date</span>
                    <input
                      type="date"
                      value={newNodeDate}
                      onChange={(e) => setNewNodeDate(e.target.value)}
                      className="bg-[#05081b] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 h-8 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="self-end h-8 px-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:opacity-90 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-[0_0_12px_rgba(6,182,212,0.25)] font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone Node</span>
                  </button>
                </form>

                <div className="text-[10px] text-gray-500 uppercase tracking-widest text-right">
                  Interactive Milestones: <span className="text-white font-bold">{nodes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: ONE DASHBOARD (DASHBOARD) */}
        <section id="dashboard" className="py-20 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Mockup Grid */}
            <div className="lg:col-span-7 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-2xl blur-3xl opacity-30 pointer-events-none" />
              
              <div className="relative bg-[#020510] border border-white/10 rounded-2xl p-6 font-mono text-white shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-gray-500 uppercase">Live Database sync</span>
                  </div>
                </div>

                {/* Simulated priority list card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/60 border border-white/5 rounded-xl space-y-3">
                    <span className="text-[9px] text-cyan-400 uppercase font-bold tracking-widest block flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Prioritized Missions
                    </span>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-gray-300">Finalize pitch deck</span>
                        <span className="text-gray-500 font-bold">2h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-gray-300">Review API integration</span>
                        <span className="text-gray-500 font-bold">1h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded opacity-40">
                        <span className="text-gray-400 line-through">Establish authentication</span>
                        <span className="text-emerald-400">Done</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/60 border border-white/5 rounded-xl space-y-3">
                    <span className="text-[9px] text-purple-400 uppercase font-bold tracking-widest block flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5" />
                      Alert Pipelines
                    </span>
                    <div className="space-y-2 text-[10px]">
                      <div className="p-2 bg-pink-950/20 border border-pink-500/20 rounded text-pink-400">
                        <span className="block font-bold">Quarterly report</span>
                        <span className="text-[8px] opacity-75">Due in 3 hours</span>
                      </div>
                      <div className="p-2 bg-black/40 border border-white/5 rounded text-gray-400">
                        <span className="block font-bold">Client contract</span>
                        <span className="text-[8px] opacity-75">Due tomorrow</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Advice strip */}
                <div className="p-3 bg-purple-950/10 border border-purple-500/20 rounded-xl flex gap-3 items-center">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse shrink-0" />
                  <p className="text-[10px] text-gray-300 leading-normal">
                    "Cognitive alignment suggests scheduling intense focus blocks before 11:00 AM according to your tracked biological peaks."
                  </p>
                </div>
              </div>
            </div>

            {/* Right text layout */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono font-bold">Command Center</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                One dashboard. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">Total clarity</span>.
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your personal command center brings together priorities, deadlines, habits, focus sessions, and AI insights in one beautiful, actionable view.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => launchAuth("register")}
                  className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono"
                >
                  Configure Dashboard
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 border-t border-white/5 bg-black/40 text-center font-mono">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Orbital SaaS</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              © {new Date().getFullYear()} Orbital Inc. Synchronized Scheduling matrix.
            </p>
          </div>
        </footer>

      </div>

      {/* 2. AUTHENTICATION FORM MODAL OVERLAY */}
      {showAuthOverlay && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 font-mono overflow-y-auto">
          <div className="absolute inset-0 z-0" onClick={() => setShowAuthOverlay(false)} />
          
          <div className="relative z-10 w-full max-w-md my-8">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthOverlay(false)}
              className="absolute top-[-48px] right-0 p-2 text-gray-400 hover:text-white rounded-xl border border-white/10 bg-black/60 cursor-pointer flex items-center gap-1.5 text-xs uppercase tracking-widest transition"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>

            {/* Glassmorphic Auth card */}
            <div className="cyber-glass border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl p-8 relative overflow-hidden bg-black/90 group">
              
              {/* Dynamic glowing active bar at top of card */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

              {/* MODE SIGN IN */}
              {mode === "login" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      Sign In
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Please enter your parameters to log into Orbital.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Identifier Input */}
                    <div>
                      <label className="block text-[11px] uppercase text-cyan-400 tracking-wider mb-1.5">Username or Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. pilot01 or user@example.com"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] uppercase text-cyan-400 tracking-wider">Password</label>
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Remember me option */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-cyan-500/30 bg-black text-cyan-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-xs text-gray-400">Remember Me</span>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Logging in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* MODE SIGN UP */}
              {mode === "register" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-purple-400" />
                      Create Account
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Please enter your details to register.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] uppercase text-cyan-400 tracking-wider mb-1.5">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Cynthia Weaver"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-[11px] uppercase text-cyan-400 tracking-wider mb-1.5">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Cpu className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. weaver"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="block text-[11px] uppercase text-cyan-400 tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. Cynthia@example.com"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="block text-[11px] uppercase text-cyan-400 tracking-wider mb-1.5">Password (min 6 characters)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign Up</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* MODE FORGOT PASSWORD */}
              {mode === "forgot" && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="p-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest">Reset</h2>
                      <p className="text-xs text-gray-500 mt-1">Please enter your email address to recover your key.</p>
                    </div>
                  </div>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase text-cyan-400 tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-cyan-500/60" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your-email@example.com"
                          className="block w-full pl-10 pr-3 py-2.5 border border-cyan-500/20 rounded-xl bg-[#040713] text-sm text-gray-100 placeholder-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingForgot}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                    >
                      {submittingForgot ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send Recovery Link</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Feedback alert bars */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-pink-950/20 border border-pink-500/40 text-pink-400 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-xs font-mono leading-relaxed">{error}</div>
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/40 text-cyan-400 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div className="text-xs font-mono leading-relaxed">{success}</div>
                </div>
              )}

              {/* OAuth Synapse Row */}
              {mode !== "forgot" && (
                <div className="mt-6 pt-6 border-t border-cyan-500/10">
                  <div className="relative flex justify-center text-xs uppercase mb-4">
                    <span className="bg-[#030510] px-3 text-cyan-500/60 z-10">Or connect via</span>
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/10 z-0" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-gray-200 hover:text-white text-xs transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.05)] cursor-pointer"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Google Identity Account</span>
                  </button>
                </div>
              )}

              {/* Mode Switcher */}
              <div className="mt-6 text-center">
                {mode === "login" ? (
                  <p className="text-xs text-gray-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : mode === "register" ? (
                  <p className="text-xs text-gray-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer ml-1"
                    >
                      Back to Sign In
                    </button>
                  </p>
                )}
              </div>

            </div>

            {/* Hint Box */}
            <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-[10px] text-cyan-500/50">
              <Info className="w-3.5 h-3.5" />
              <span>Real MVP database will persist your synchronized schedules.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
