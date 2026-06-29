import React, { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

export default function FloatingStars() {
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // Generate 55 stars with different sizes, colors, and speeds
    const colors = ["#06b6d4", "#a855f7", "#ec4899", "#3b82f6", "#10b981", "#eab308"];
    const generated: Star[] = Array.from({ length: 55 }).map((_, i) => {
      const size = Math.random() < 0.3 ? Math.random() * 4 + 3 : Math.random() * 2 + 0.8;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const opacity = size > 2.5 ? Math.random() * 0.5 + 0.4 : Math.random() * 0.6 + 0.2;
      const duration = Math.random() * 18 + 10; // 10s to 28s slow-motion
      const delay = Math.random() * -30;
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: i,
        x,
        y,
        size,
        opacity,
        duration,
        delay,
        color,
      };
    });
    setStars(generated);

    // Track mouse move for interactive cosmic flows
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setTargetPos({ x, y });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const x = (e.touches[0].clientX / window.innerWidth) * 100;
        const y = (e.touches[0].clientY / window.innerHeight) * 100;
        setTargetPos({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Smooth easing interpolation for organic fluid response
  useEffect(() => {
    let animId: number;
    const updateGlow = () => {
      setMousePos((prev) => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        // Ease factor of 0.08 for extremely silky smooth lag/following effect
        return {
          x: prev.x + dx * 0.08,
          y: prev.y + dy * 0.08,
        };
      });
      animId = requestAnimationFrame(updateGlow);
    };
    animId = requestAnimationFrame(updateGlow);
    return () => cancelAnimationFrame(animId);
  }, [targetPos]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#02030b]">
      {/* Cyberpunk fluid background mesh glow tracking cursor */}
      <div 
        className="absolute w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-500/10 to-indigo-500/5 blur-[120px] mix-blend-screen transition-opacity duration-1000 animate-pulse-slow"
        style={{
          left: `calc(${mousePos.x}% - 325px)`,
          top: `calc(${mousePos.y}% - 325px)`,
        }}
      />
      
      <div 
        className="absolute w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-purple-500/10 via-pink-500/8 to-rose-500/4 blur-[100px] mix-blend-screen transition-opacity duration-[1500ms]"
        style={{
          left: `calc(${100 - mousePos.x}% - 275px)`,
          top: `calc(${100 - mousePos.y}% - 275px)`,
        }}
      />

      <div 
        className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-emerald-500/8 via-cyan-500/6 to-teal-500/3 blur-[90px] mix-blend-screen transition-opacity duration-[2000ms]"
        style={{
          left: `calc(${mousePos.x * 0.5 + 25}% - 225px)`,
          top: `calc(${mousePos.y * 0.5 + 25}% - 225px)`,
        }}
      />

      {/* Grid lines layout depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80" />

      {/* Floating Sparkles and Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full transition-all duration-[3000ms]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: star.opacity,
            boxShadow: star.size > 2.2 
              ? `0 0 10px ${star.color}, 0 0 24px ${star.color}c0, 0 0 50px ${star.color}60` 
              : `0 0 5px ${star.color}df, 0 0 12px ${star.color}50`,
            animation: `float-star-${star.id % 4} ${star.duration}s infinite ease-in-out`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
