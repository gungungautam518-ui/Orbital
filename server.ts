import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "cyber-neural-core-secret-key-9988";
const DB_FILE = path.join(process.cwd(), "db.json");

interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  deadline: string; // YYYY-MM-DDTHH:mm
  duration: number; // in minutes
  energyRequired: 'Low' | 'Medium' | 'High';
  priorityScore: number; // 0 to 100
  aiPriorityLabel: 'Critical' | 'High' | 'Medium' | 'Low';
  aiSuggestedSlot: string;
  aiReasoning: string;
  status: 'pending' | 'completed';
  category: 'Work' | 'Personal' | 'Health' | 'Urgent' | 'Other';
  createdAt: string;
}

interface ProductivityProfile {
  peakHours: string;
  focusDuration: number; // in minutes
  currentEnergy: 'Low' | 'Medium' | 'High';
  streakDays: number;
  totalFocusHours: number;
  level?: number;
  xp?: number;
  completedQuests?: number;
  unlockedBadges?: string[];
  generalInsight?: string;
  persona?: 'professional' | 'student' | 'business';
}

interface Suggestion {
  id: string;
  text: string;
  applied: boolean;
  category?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color: string;
  date?: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  googleProviderId?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin: string;
  authProvider: "local" | "google";
  role: string;
  accountStatus: "active" | "suspended" | "pending";
  passwordHash?: string;
}

interface Reminder {
  id: string;
  userId: string;
  title: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

interface TrackerNode {
  id: string;
  userId: string;
  metricName: string;
  value: number;
  unit: string;
  createdAt: string;
  taskTitle?: string;
  mindState?: string;
  notes?: string;
}

interface LifeNode {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  tags: string[];
  x: number;
  y: number;
  createdAt: string;
}

interface Habit {
  id: string;
  userId: string;
  name: string;
  streak: number;
  completedDays: string[];
  createdAt: string;
}

interface DatabaseSchema {
  tasks: Task[];
  profile: ProductivityProfile;
  generalInsight: string;
  notes: { id: string; userId?: string; text: string; createdAt: string }[];
  users: User[];
  reminders?: Reminder[];
  trackers?: TrackerNode[];
  userProfiles?: Record<string, ProductivityProfile>;
  lifeNodes?: LifeNode[];
  habits?: Habit[];
  suggestions?: Record<string, Suggestion[]>;
  scheduleEvents?: Record<string, CalendarEvent[]>;
}

const DEFAULT_DB: DatabaseSchema = {
  lifeNodes: [],
  habits: [],
  tasks: [
    {
      id: "task-1",
      title: "Complete Q3 Financial Report",
      description: "Assemble and polish the Q3 financial statement for review by stakeholders.",
      deadline: "2026-06-26T17:00",
      duration: 120,
      energyRequired: "High",
      priorityScore: 95,
      aiPriorityLabel: "Critical",
      aiSuggestedSlot: "Morning Focus Block",
      aiReasoning: "Due tomorrow; matches your high productivity morning slot perfectly.",
      status: "pending",
      category: "Work",
      createdAt: "2026-06-25T08:00:00Z"
    },
    {
      id: "task-2",
      title: "Review API documentation",
      description: "Analyze and document the new OAuth interfaces for the gateway.",
      deadline: "2026-06-28T12:00",
      duration: 60,
      energyRequired: "Medium",
      priorityScore: 75,
      aiPriorityLabel: "High",
      aiSuggestedSlot: "Afternoon Focus Block",
      aiReasoning: "Moderate urgency. Good fit for midday focus before energy levels dip.",
      status: "pending",
      category: "Work",
      createdAt: "2026-06-25T09:00:00Z"
    },
    {
      id: "task-3",
      title: "Prepare standup notes",
      description: "Draft daily progress checklist and system metrics overview.",
      deadline: "2026-06-26T09:00",
      duration: 30,
      energyRequired: "Low",
      priorityScore: 85,
      aiPriorityLabel: "High",
      aiSuggestedSlot: "Morning Warmup",
      aiReasoning: "Due first thing tomorrow. High importance but requires low cognitive load.",
      status: "pending",
      category: "Work",
      createdAt: "2026-06-25T09:30:00Z"
    },
    {
      id: "task-4",
      title: "Gym session",
      description: "Perform physical training and endurance simulation.",
      deadline: "2026-06-25T20:00",
      duration: 60,
      energyRequired: "High",
      priorityScore: 60,
      aiPriorityLabel: "Medium",
      aiSuggestedSlot: "Evening Recharge",
      aiReasoning: "Vital for maintaining peak cognitive capacity and physical health.",
      status: "completed",
      category: "Health",
      createdAt: "2026-06-25T10:00:00Z"
    }
  ],
  profile: {
    peakHours: "Morning (09:00 - 12:00)",
    focusDuration: 25,
    currentEnergy: "High",
    streakDays: 12,
    totalFocusHours: 4.2,
    level: 1,
    xp: 75,
    completedQuests: 1,
    unlockedBadges: ["Cognitive Pioneer"]
  },
  generalInsight: "System load moderate: You have 3 pending operations. Try batching work blocks to save time.",
  notes: [
    {
      id: "note-1",
      text: "Idea: Build a dark mode telemetry widget using charts.",
      createdAt: "2026-06-25T10:15:00Z"
    },
    {
      id: "note-2",
      text: "Remember to drink more water during high warp coding sessions.",
      createdAt: "2026-06-25T10:20:00Z"
    }
  ],
  users: [],
  reminders: [],
  trackers: [],
  userProfiles: {},
  suggestions: {},
  scheduleEvents: {}
};

// Lazy initialization helper for GoogleGenAI with integrated rate-limit / quota cooldown protection
let geminiCooldownUntil = 0;

function activateGeminiCooldown() {
  geminiCooldownUntil = Date.now() + 5 * 60 * 1000;
  console.info(`[Aibi API Core] Cooldown activated for 5 minutes due to Gemini rate limit/quota exhaustion.`);
}

function getCleanErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  const msg = err.message || String(err);
  if (typeof msg === "string" && msg.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Keep original msg if not valid JSON
    }
  }
  return msg;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.info("[Aibi API Core] GEMINI_API_KEY is not configured or matches placeholder. Using local simulation modes.");
    return null;
  }
  
  const now = Date.now();
  if (now < geminiCooldownUntil) {
    const remainingSeconds = Math.ceil((geminiCooldownUntil - now) / 1000);
    console.info(`[Aibi API Core] Gemini is in cooldown for another ${remainingSeconds}s. Gracefully routing to deterministic local heuristics.`);
    return null;
  }
  
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper to generate content with fallback in case gemini-3.5-flash is unavailable / experiencing high demand (503)
async function generateContentWithFallback(ai: any, params: any) {
  const modelToTry = params.model || "gemini-3.5-flash";
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const attemptCall = async (currentParams: any, maxAttempts = 3, isPrimary = true): Promise<any> => {
    let lastError: any = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await ai.models.generateContent(currentParams);
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        
        // Check if this is a hard quota exhaustion error.
        // If the quota is exceeded, do NOT retry multiple times, as it will just fail instantly and pollute logs.
        const isQuotaExceeded = errMsg.includes("429") ||
                                errMsg.includes("RESOURCE_EXHAUSTED") ||
                                errMsg.includes("Quota exceeded") ||
                                errMsg.includes("exceeded your current quota") ||
                                errMsg.includes("rate limit");
                                
        if (isQuotaExceeded) {
          console.info(`[Aibi API Core] Model rate-limit or quota encountered on primary/secondary attempt.`);
          activateGeminiCooldown();
          throw new Error("Gemini API is currently rate-limited or out of quota (429 RESOURCE_EXHAUSTED).");
        }

        console.info(`[Aibi API Core] Model transition notice (Attempt ${attempt}/${maxAttempts}). Message:`, errMsg.substring(0, 120));
        
        // Only retry on transient errors (503, unavailable, overload, etc)
        const isTransient = errMsg.includes("503") || 
                            errMsg.includes("UNAVAILABLE") || 
                            errMsg.includes("high demand") ||
                            errMsg.includes("overload");
                            
        // Fast-fail if primary is transient overloaded to hit the fallback immediately
        if (isPrimary && isTransient && currentParams.model === "gemini-3.5-flash") {
          console.info(`[Aibi API Core] Primary model transient overload detected. Fast-failing to activate fallback model...`);
          throw error;
        }

        if (!isTransient || attempt === maxAttempts) {
          break;
        }
        
        // Wait before retrying (exponential backoff: ~1s, ~2.5s)
        const backoffMs = attempt * 1000 + Math.floor(Math.random() * 500);
        await delay(backoffMs);
      }
    }
    throw lastError;
  };

  try {
    // Try the main request (up to 3 times, checking primary status)
    return await attemptCall(params, 3, true);
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const isQuotaExceeded = errMsg.includes("429") ||
                            errMsg.includes("RESOURCE_EXHAUSTED") ||
                            errMsg.includes("Quota exceeded") ||
                            errMsg.includes("exceeded your current quota") ||
                            errMsg.includes("rate limit");

    if (isQuotaExceeded) {
      // Do not attempt to hit another model since the API key itself is rate-limited
      throw new Error("Gemini API is currently rate-limited or out of quota (429 RESOURCE_EXHAUSTED).");
    }

    if (modelToTry === "gemini-3.5-flash") {
      try {
        console.info("[Aibi API Core] Activating secondary flash-lite route...");
        // Try the fallback model
        return await attemptCall({
          ...params,
          model: "gemini-3.1-flash-lite"
        }, 2, false); // 2 attempts is plenty for the fallback
      } catch (fallbackError: any) {
        console.info("[Aibi API Core] Primary and secondary routes busy. Engaging high-fidelity local heuristics.");
        throw new Error(getCleanErrorMessage(fallbackError));
      }
    }
    throw new Error(getCleanErrorMessage(error));
  }
}

// Local fallback spoken reminder script generator
function getLocalVoiceScriptFallback(title: string) {
  const cleanTitle = (title || "scheduled item").trim();
  const lowercaseTitle = cleanTitle.toLowerCase();
  
  // Custom context-aware incentives based on task title keywords
  let consequence = "putting this off will only create a bottleneck in your schedule later today.";
  if (lowercaseTitle.includes("gym") || lowercaseTitle.includes("workout") || lowercaseTitle.includes("exercise") || lowercaseTitle.includes("run") || lowercaseTitle.includes("health")) {
    consequence = "if you skip this workout, your physical energy levels will plateau and you will miss your peak daily alignment window.";
  } else if (lowercaseTitle.includes("study") || lowercaseTitle.includes("review") || lowercaseTitle.includes("read") || lowercaseTitle.includes("learn") || lowercaseTitle.includes("syllabus")) {
    consequence = "delaying this study block means you will be cramming late tonight when your focus capacity is severely depleted.";
  } else if (lowercaseTitle.includes("email") || lowercaseTitle.includes("call") || lowercaseTitle.includes("message") || lowercaseTitle.includes("reply") || lowercaseTitle.includes("slack")) {
    consequence = "leaving communication unanswered will build up friction and block the rest of your team from moving forward.";
  } else if (lowercaseTitle.includes("meeting") || lowercaseTitle.includes("presentation") || lowercaseTitle.includes("deck") || lowercaseTitle.includes("slide")) {
    consequence = "if you do not prepare this right now, you will be rushing and highly stressed right before your audience sits down.";
  } else if (lowercaseTitle.includes("code") || lowercaseTitle.includes("program") || lowercaseTitle.includes("build") || lowercaseTitle.includes("bug") || lowercaseTitle.includes("fix") || lowercaseTitle.includes("develop")) {
    consequence = "if you do not write this code now, your build logs will stay broken and the backlog is going to double by tomorrow.";
  }

  return {
    greeting: `Attention. It is time to execute your scheduled item: ${cleanTitle}. No excuses. ${consequence.charAt(0).toUpperCase() + consequence.slice(1)} Put everything else aside, take a deep breath, and let is get to work.`,
    snoozeResponse: `Negative. Easy snoozing is a direct path to failure. Delaying ${cleanTitle} by just ten minutes will cascade and ruin your entire circadian block. Stand up, click done, and start executing right now.`
  };
}

// Local date parser helper for simulated mode
function parseRelativeDeadline(text: string, referenceDate: Date): string {
  const lower = text.toLowerCase();
  const target = new Date(referenceDate);
  target.setHours(9, 0, 0, 0); // default to 9:00 AM

  // check relative day
  if (lower.includes("tomorrow")) {
    target.setDate(target.getDate() + 1);
  } else if (lower.includes("day after tomorrow")) {
    target.setDate(target.getDate() + 2);
  } else if (lower.includes("next week")) {
    target.setDate(target.getDate() + 7);
  } else {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let found = false;
    for (let i = 0; i < 7; i++) {
      if (lower.includes(daysOfWeek[i])) {
        const currentDay = referenceDate.getDay();
        let targetDay = i;
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // next week's weekday
        }
        target.setDate(target.getDate() + daysToAdd);
        found = true;
        break;
      }
    }
    if (!found && !lower.includes("today")) {
      // default to tomorrow if no relative indicator
      target.setDate(target.getDate() + 1);
    }
  }

  // extract potential hours if mentioned (e.g. "at 5 pm", "at 14:00")
  const pmMatch = lower.match(/at (\d+)\s*(pm|p\.m\.)/);
  const amMatch = lower.match(/at (\d+)\s*(am|a\.m\.)/);
  const directMatch = lower.match(/at (\d{1,2})[:.](\d{2})/);

  if (directMatch) {
    target.setHours(parseInt(directMatch[1]), parseInt(directMatch[2]), 0, 0);
  } else if (pmMatch) {
    let hr = parseInt(pmMatch[1]);
    if (hr < 12) hr += 12;
    target.setHours(hr, 0, 0, 0);
  } else if (amMatch) {
    let hr = parseInt(amMatch[1]);
    if (hr === 12) hr = 0;
    target.setHours(hr, 0, 0, 0);
  }

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const hh = String(target.getHours()).padStart(2, '0');
  const min = String(target.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Local simulation speech heuristics fallback
function getLocalVoiceHeuristics(transcript: string, userId: string, db: DatabaseSchema, now: Date) {
  const lower = transcript.toLowerCase();
  let action: 'add_task' | 'make_note' | 'both' = 'make_note';
  
  const taskKeywords = [
    "task", "todo", "schedule", "remind", "meeting", "workout", 
    "gym", "buy", "submit", "complete", "review", "email",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "tomorrow", "today", "schedule"
  ];
  
  const isTask = taskKeywords.some(keyword => lower.includes(keyword));
  if (isTask) {
    action = 'add_task';
  }

  let createdTask: Task | null = null;
  let createdNote: any = null;

  if (action === 'add_task') {
    // Attempt to extract a nice title
    let cleanTitle = transcript;
    cleanTitle = cleanTitle.replace(/add a task to|add task|schedule a|schedule|remind me to/gi, "").trim();
    if (cleanTitle.length > 50) {
      cleanTitle = cleanTitle.substring(0, 47) + "...";
    }
    if (!cleanTitle) cleanTitle = "Voice Task " + (db.tasks.length + 1);

    // Category heuristics
    let category: 'Work' | 'Personal' | 'Health' | 'Urgent' | 'Other' = 'Work';
    if (lower.includes("gym") || lower.includes("workout") || lower.includes("health") || lower.includes("run")) {
      category = "Health";
    } else if (lower.includes("buy") || lower.includes("shop") || lower.includes("call") || lower.includes("friend")) {
      category = "Personal";
    } else if (lower.includes("urgent") || lower.includes("immediate") || lower.includes("asap")) {
      category = "Urgent";
    }

    const computedDeadline = parseRelativeDeadline(transcript, now);

    createdTask = {
      id: "task-" + Date.now(),
      userId: userId,
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      description: `Auto-scheduled via Aibi Voice Assistant. Speech Input: "${transcript}"`,
      deadline: computedDeadline,
      duration: 45,
      energyRequired: 'Medium',
      priorityScore: 70,
      aiPriorityLabel: 'High',
      aiSuggestedSlot: 'Standard Work Cycle',
      aiReasoning: 'Scheduled based on speech input processing heuristics.',
      status: 'pending',
      category,
      createdAt: now.toISOString()
    };

    if (!db.tasks) db.tasks = [];
    db.tasks.push(createdTask);

    const dateObj = new Date(computedDeadline);
    const dayString = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return {
      action: 'add_task' as const,
      task: createdTask,
      note: null,
      reply: `I've created a new ${category} task: "${createdTask.title}", and scheduled it in your calendar for ${dayString}.`
    };
  } else {
    // Create note
    createdNote = {
      id: "note-" + Date.now(),
      userId: userId,
      text: transcript,
      createdAt: now.toISOString()
    };
    if (!db.notes) db.notes = [];
    db.notes.push(createdNote);

    return {
      action: 'make_note' as const,
      task: null,
      note: createdNote,
      reply: `I've saved your voice note: "${transcript}".`
    };
  }
}

// Local deterministic insight generator fallback
function getLocalInsightFallback(userTasks: any[], userProfile: any) {
  const prioritizedTasks = userTasks.map(task => {
    let score = 50; // base score
    
    // priority score factors
    if (task.category === "Urgent") {
      score += 30;
    } else if (task.category === "Work") {
      score += 15;
    } else if (task.category === "Health") {
      score += 10;
    }
    
    if (task.energyRequired === "High") {
      score += 15;
    } else if (task.energyRequired === "Medium") {
      score += 10;
    }
    
    score = Math.max(0, Math.min(100, score));
    
    let label = "Medium";
    if (score >= 80) label = "Critical";
    else if (score >= 65) label = "High";
    else if (score >= 45) label = "Medium";
    else label = "Low";
    
    let slot = "Afternoon Focus Block";
    if (task.energyRequired === "High") {
      slot = "Peak Morning Block";
    } else if (task.energyRequired === "Low") {
      slot = "Quiet Evening Slot";
    }
    
    return {
      id: task.id,
      priorityScore: score,
      aiPriorityLabel: label,
      aiSuggestedSlot: slot,
      aiReasoning: `Prioritized locally based on task energy (${task.energyRequired}) and category (${task.category || "General"}).`
    };
  });
  
  let topPriorityTaskId = userTasks.length > 0 ? userTasks[0].id : "";
  if (prioritizedTasks.length > 0) {
    const sorted = [...prioritizedTasks].sort((a, b) => b.priorityScore - a.priorityScore);
    topPriorityTaskId = sorted[0].id;
  }
  
  const persona = userProfile?.persona || "professional";
  let generalInsight = "";
  if (persona === "student") {
    generalInsight = "You have syllabus milestones approaching. Focus on breaking your studying into active-recall intervals today.";
  } else if (persona === "business") {
    generalInsight = "Protect your planning window today. Prioritize high-leverage decisions and delegate lower-impact action items.";
  } else {
    generalInsight = "Protect your high-energy windows today for deep work. Keep micro-tasks batched together in the afternoon.";
  }
  
  return {
    prioritizedTasks,
    generalInsight,
    topPriorityTaskId
  };
}

// Local deterministic chrono block generator fallback
function getLocalChronoBlocks(pendingTasks: any[], brainwaveMode: string, wakeTime: string, sleepTime: string) {
  let [wakeHour, wakeMin] = (wakeTime || "08:00").split(":").map(Number);
  let [sleepHour, sleepMin] = (sleepTime || "23:00").split(":").map(Number);
  if (isNaN(wakeHour)) { wakeHour = 8; wakeMin = 0; }
  if (isNaN(sleepHour)) { sleepHour = 23; sleepMin = 0; }

  let currentHour = wakeHour;
  let currentMin = wakeMin;

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const addMinutes = (h: number, m: number, mins: number) => {
    let totalMins = h * 60 + m + mins;
    let newH = Math.floor(totalMins / 60) % 24;
    let newM = totalMins % 60;
    return [newH, newM];
  };

  const blocks: any[] = [];
  
  const block1Start = formatTime(currentHour, currentMin);
  const [h1, m1] = addMinutes(currentHour, currentMin, 45);
  const block1End = formatTime(h1, m1);
  blocks.push({
    id: "block-morning-warmup",
    label: "Morning Warmup & Planning",
    startTime: block1Start,
    endTime: block1End,
    duration: 45,
    energyLevel: "Low",
    category: "Buffer",
    isTask: false,
    recommendation: `Start your day gently. Your chosen focus state (${brainwaveMode || "Standard Focus"}) is perfect for easing into work.`
  });
  currentHour = h1;
  currentMin = m1;

  pendingTasks.forEach((task, idx) => {
    const taskDuration = task.duration || 30;
    const blockStart = formatTime(currentHour, currentMin);
    const [hNext, mNext] = addMinutes(currentHour, currentMin, taskDuration);
    const blockEnd = formatTime(hNext, mNext);

    blocks.push({
      id: `block-task-${task.id}`,
      label: `Focus Task: ${task.title}`,
      startTime: blockStart,
      endTime: blockEnd,
      duration: taskDuration,
      energyLevel: task.energyRequired || "Medium",
      category: task.category || "Work",
      isTask: true,
      taskId: task.id,
      recommendation: `Work on this item during your peak focus window. It matches your current energy (${task.energyRequired || "Medium"}).`
    });

    currentHour = hNext;
    currentMin = mNext;

    const breakDuration = 15;
    const breakStart = formatTime(currentHour, currentMin);
    const [hBreak, mBreak] = addMinutes(currentHour, currentMin, breakDuration);
    const breakEnd = formatTime(hBreak, mBreak);

    blocks.push({
      id: `block-break-${idx}`,
      label: "Rest & Refresh Break",
      startTime: breakStart,
      endTime: breakEnd,
      duration: breakDuration,
      energyLevel: "Low",
      category: "Break",
      isTask: false,
      recommendation: "Take a step away from the screen, stretch, or grab a drink of water to recharge."
    });

    currentHour = hBreak;
    currentMin = mBreak;
  });

  const blockEndStart = formatTime(currentHour, currentMin);
  const [hEnd, mEnd] = addMinutes(currentHour, currentMin, 60);
  const blockEndEnd = formatTime(hEnd, mEnd);
  blocks.push({
    id: "block-evening-winddown",
    label: "Evening Wind Down",
    startTime: blockEndStart,
    endTime: blockEndEnd,
    duration: 60,
    energyLevel: "Low",
    category: "Buffer",
    isTask: false,
    recommendation: "Review what you accomplished today and let your mind relax before sleeping."
  });

  const activeLoad = pendingTasks.length * 15;
  const cognitiveCoeff = Math.max(15, Math.min(95, 100 - activeLoad));

  return {
    blocks,
    cognitiveCoeff,
    recommText: `Focus schedule created using your personal preferences. Aligning with your ${brainwaveMode || "Standard Focus"} wave patterns is highly recommended.`
  };
}

let firestoreDb: any = null;

async function getFirestoreDb() {
  if (!firestoreDb) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      const configContent = await fs.readFile(configPath, "utf-8");
      const firebaseConfig = JSON.parse(configContent);
      const app = getApps().length === 0 
        ? initializeApp(firebaseConfig) 
        : getApp();
      const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-orbital-8810b934-ef44-4a23-ac50-9a9506d9329a";
      firestoreDb = getFirestore(app, dbId);
    } catch (e) {
      console.error("Failed to initialize Firebase on server:", e);
    }
  }
  return firestoreDb;
}

const dbSections = [
  "users",
  "tasks",
  "notes",
  "reminders",
  "trackers",
  "userProfiles",
  "lifeNodes",
  "profile",
  "generalInsight",
  "habits",
  "suggestions",
  "scheduleEvents"
] as const;

// Database persistent helper
let cachedDb: DatabaseSchema | null = null;

async function readDB(): Promise<DatabaseSchema> {
  if (cachedDb) {
    return cachedDb;
  }

  // First, always read from local file as a baseline
  let localDb: DatabaseSchema;
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    localDb = JSON.parse(data);
  } catch (error) {
    localDb = { ...DEFAULT_DB };
  }

  // Ensure default structures are present
  if (!localDb.users) localDb.users = [];
  if (!localDb.tasks) localDb.tasks = [];
  if (!localDb.notes) localDb.notes = [];
  if (!localDb.reminders) localDb.reminders = [];
  if (!localDb.trackers) localDb.trackers = [];
  if (!localDb.userProfiles) localDb.userProfiles = {};
  if (!localDb.lifeNodes) localDb.lifeNodes = [];
  if (!localDb.habits) localDb.habits = [];
  if (!localDb.suggestions) localDb.suggestions = {};
  if (!localDb.scheduleEvents) localDb.scheduleEvents = {};
  if (!localDb.profile) localDb.profile = DEFAULT_DB.profile;
  if (!localDb.generalInsight) localDb.generalInsight = DEFAULT_DB.generalInsight;

  const db = await getFirestoreDb();
  if (!db) {
    cachedDb = localDb;
    return localDb;
  }

  try {
    // Try to load sections from Firestore
    const mergedDb: Partial<DatabaseSchema> = {};
    let loadedAny = false;

    await Promise.all(
      dbSections.map(async (section) => {
        try {
          const docRef = doc(db, "app_state", section);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const val = snap.data();
            if (val && val.data !== undefined) {
              mergedDb[section as keyof DatabaseSchema] = val.data;
              loadedAny = true;
            }
          }
        } catch (e) {
          console.error(`Error reading Firestore section ${section}:`, e);
        }
      })
    );

    if (loadedAny) {
      // Merge what we got from Firestore on top of localDb/defaults
      const finalDb: DatabaseSchema = {
        users: mergedDb.users !== undefined ? mergedDb.users : localDb.users,
        tasks: mergedDb.tasks !== undefined ? mergedDb.tasks : localDb.tasks,
        notes: mergedDb.notes !== undefined ? mergedDb.notes : localDb.notes,
        reminders: mergedDb.reminders !== undefined ? mergedDb.reminders : localDb.reminders,
        trackers: mergedDb.trackers !== undefined ? mergedDb.trackers : localDb.trackers,
        userProfiles: mergedDb.userProfiles !== undefined ? mergedDb.userProfiles : localDb.userProfiles,
        lifeNodes: mergedDb.lifeNodes !== undefined ? mergedDb.lifeNodes : localDb.lifeNodes,
        profile: mergedDb.profile !== undefined ? mergedDb.profile : localDb.profile,
        generalInsight: mergedDb.generalInsight !== undefined ? mergedDb.generalInsight : localDb.generalInsight,
        habits: mergedDb.habits !== undefined ? mergedDb.habits : localDb.habits,
        suggestions: mergedDb.suggestions !== undefined ? mergedDb.suggestions : localDb.suggestions,
        scheduleEvents: mergedDb.scheduleEvents !== undefined ? mergedDb.scheduleEvents : localDb.scheduleEvents,
      };

      // Ensure local file is kept up-to-date
      await fs.writeFile(DB_FILE, JSON.stringify(finalDb, null, 2), "utf-8");
      cachedDb = finalDb;
      return finalDb;
    }
  } catch (err) {
    console.error("Failed to read database from Firestore, falling back to local file:", err);
  }

  cachedDb = localDb;
  return localDb;
}

async function writeDB(data: DatabaseSchema): Promise<void> {
  cachedDb = data;

  // 1. Write to local file first
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");

  // 2. Write to Firestore
  const db = await getFirestoreDb();
  if (!db) return;

  try {
    await Promise.all(
      dbSections.map(async (section) => {
        try {
          const docRef = doc(db, "app_state", section);
          const value = data[section as keyof DatabaseSchema];
          const serialized = JSON.parse(JSON.stringify(value !== undefined ? value : null));
          await setDoc(docRef, { data: serialized });
        } catch (e) {
          console.error(`Error syncing section ${section} to Firestore:`, e);
        }
      })
    );
  } catch (err) {
    console.error("Failed to sync database to Firestore:", err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Helper to parse cookies
  function parseCookies(cookieHeader?: string) {
    if (!cookieHeader) return {};
    const pairs = cookieHeader.split(";");
    const result: Record<string, string> = {};
    for (const pair of pairs) {
      const parts = pair.split("=");
      if (parts.length >= 2) {
        result[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
    }
    return result;
  }

  // Simple IP-based in-memory rate limiter to prevent brute force attacks on Auth endpoints
  const loginRateLimitStore = new Map<string, { count: number; resetTime: number }>();
  function authRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    const record = loginRateLimitStore.get(ip);

    if (record && now < record.resetTime) {
      if (record.count >= 100) { // Max 100 attempts per 15 minutes per IP
        return res.status(429).json({ error: "Too many authentication requests. Rate limit exceeded. Please wait 15 minutes." });
      }
      record.count++;
    } else {
      loginRateLimitStore.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    }
    next();
  }

  // Auth Request Extension Interface
  interface AuthRequest extends express.Request {
    user?: User;
  }

  // Authentication check middleware
  async function checkAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
    try {
      const cookies = parseCookies(req.headers.cookie);
      let token = cookies.auth_token;

      // Fallback to Bearer token header
      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({ error: "Access denied. Authentication token missing." });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const db = await readDB();
      const user = db.users.find(u => u.id === decoded.userId);

      if (!user) {
        return res.status(401).json({ error: "Invalid session. User not found." });
      }

      if (user.accountStatus !== "active") {
        return res.status(403).json({ error: `Access suspended. Account status: ${user.accountStatus}.` });
      }

      req.user = user;
      next();
    } catch (err: any) {
      return res.status(401).json({ error: "Session expired or invalid token." });
    }
  }

  // Auth Status Endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      let token = cookies.auth_token;

      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.json({ user: null });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const db = await readDB();
      const user = db.users.find(u => u.id === decoded.userId);

      if (!user) {
        return res.json({ user: null });
      }

      const { passwordHash: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser, token });
    } catch (e) {
      res.json({ user: null });
    }
  });

  // Local Register Route
  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const { fullName, username, email, password } = req.body;

      if (!fullName || !username || !email || !password) {
        return res.status(400).json({ error: "All fields are required (fullName, username, email, password)." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const db = await readDB();
      const emailLower = email.toLowerCase().trim();
      const usernameClean = username.replace(/\s+/g, "").toLowerCase().trim();

      if (db.users.some(u => u.email.toLowerCase() === emailLower)) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }
      if (db.users.some(u => u.username.toLowerCase() === usernameClean)) {
        return res.status(400).json({ error: "Username is already taken." });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser: User = {
        id: "usr-" + Math.random().toString(36).substr(2, 9),
        fullName: fullName.trim(),
        username: usernameClean,
        email: emailLower,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authProvider: "local",
        role: "user",
        accountStatus: "active",
        passwordHash
      };

      db.users.push(newUser);
      await writeDB(db);

      // Issue token
      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });
      res.setHeader("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 60 * 60}`);

      const { passwordHash: _, ...sanitizedUser } = newUser;
      res.json({ user: sanitizedUser, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Local Login Route
  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: "Username/Email and password are required." });
      }

      const db = await readDB();
      const idClean = identifier.toLowerCase().trim();

      const user = db.users.find(u => 
        u.email.toLowerCase() === idClean || 
        u.username.toLowerCase() === idClean
      );

      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: "Invalid username/email or password." });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid username/email or password." });
      }

      if (user.accountStatus !== "active") {
        return res.status(403).json({ error: `Account suspended. Status: ${user.accountStatus}` });
      }

      user.lastLogin = new Date().toISOString();
      await writeDB(db);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.setHeader("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 60 * 60}`);

      const { passwordHash: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Google OAuth URL generation
  app.get("/api/auth/google/url", (req, res) => {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    
    const appUrl = process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL"
      ? process.env.APP_URL
      : `${req.protocol}://${req.get("host")}`;

    const redirect_uri = `${appUrl}/api/auth/google/callback`;

    if (!client_id || client_id === "MY_GOOGLE_CLIENT_ID" || client_id === "") {
      console.log("No GOOGLE_CLIENT_ID configured. Returning a seamless Demo connection link.");
      res.json({
        url: `/api/auth/google/demo?redirect_uri=${encodeURIComponent(redirect_uri)}`
      });
      return;
    }

    const params = new URLSearchParams({
      client_id,
      redirect_uri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account"
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  // Demo fallback for Google OAuth (review/sandbox friendly)
  app.get("/api/auth/google/demo", async (req, res) => {
    try {
      const db = await readDB();

      let user = db.users.find(u => u.email === "demo.pilot@aibi.net");
      if (!user) {
        user = {
          id: "usr-demopilot",
          fullName: "Demo Cognitive Pilot",
          username: "demopilot",
          email: "demo.pilot@aibi.net",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          authProvider: "google",
          role: "user",
          accountStatus: "active"
        };
        db.users.push(user);
        await writeDB(db);
      } else {
        user.lastLogin = new Date().toISOString();
        await writeDB(db);
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.setHeader("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 60 * 60}`);

      res.send(`
        <html>
          <body style="background: #04081b; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; border: 1px solid rgba(6,182,212,0.2); padding: 30px; border-radius: 12px; background: rgba(6,182,212,0.05); max-width: 350px; box-shadow: 0 0 30px rgba(6,182,212,0.15);">
              <h2 style="color: #06b6d4; font-size: 18px; margin-bottom: 10px; letter-spacing: 0.1em; text-transform: uppercase;">AIBI Workspace</h2>
              <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">Demo Google account authenticated. Logging in...</p>
              <div style="border: 2px solid #06b6d4; border-top-color: transparent; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
              <p style="font-size: 11px; color: #71717a;">Redirecting back to dashboard...</p>
            </div>
            <style>
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
             <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }, 1200);
            </script>
          </body>
        </html>
      `);
    } catch (e: any) {
      res.status(500).send(`Demo auth bridge failure: ${e.message}`);
    }
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send("Authorization code is missing.");
      }

      const client_id = process.env.GOOGLE_CLIENT_ID;
      const client_secret = process.env.GOOGLE_CLIENT_SECRET;
      
      const appUrl = process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL"
        ? process.env.APP_URL
        : `${req.protocol}://${req.get("host")}`;

      const redirect_uri = `${appUrl}/api/auth/google/callback`;

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: client_id || "",
          client_secret: client_secret || "",
          redirect_uri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenResponse.ok) {
        const errDetails = await tokenResponse.text();
        throw new Error(`Google token exchange failed: ${errDetails}`);
      }

      const tokenData = await tokenResponse.json() as any;
      const access_token = tokenData.access_token;

      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch Google profile info.");
      }

      const googleUser = await userResponse.json() as any;
      const emailLower = googleUser.email.toLowerCase().trim();

      const db = await readDB();
      let user = db.users.find(u => u.email.toLowerCase() === emailLower);

      if (!user) {
        user = {
          id: "usr-" + Math.random().toString(36).substr(2, 9),
          fullName: googleUser.name || "Google Pilot",
          username: emailLower.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
          email: emailLower,
          googleProviderId: googleUser.id,
          avatarUrl: googleUser.picture || "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          authProvider: "google",
          role: "user",
          accountStatus: "active"
        };
        db.users.push(user);
      } else {
        user.lastLogin = new Date().toISOString();
        if (googleUser.picture) user.avatarUrl = googleUser.picture;
        if (!user.googleProviderId) user.googleProviderId = googleUser.id;
      }

      await writeDB(db);

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.setHeader("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 60 * 60}`);

      res.send(`
        <html>
          <body style="background: #04081b; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; border: 1px solid rgba(6,182,212,0.2); padding: 30px; border-radius: 12px; background: rgba(6,182,212,0.05); max-width: 350px; box-shadow: 0 0 30px rgba(6,182,212,0.15);">
              <h2 style="color: #06b6d4; font-size: 18px; margin-bottom: 10px; letter-spacing: 0.1em; text-transform: uppercase;">AIBI Workspace</h2>
              <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">Logged in successfully with Google. Synchronizing account...</p>
              <div style="border: 2px solid #06b6d4; border-top-color: transparent; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
              <p style="font-size: 11px; color: #71717a;">Redirecting back to dashboard...</p>
            </div>
            <style>
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
             <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (e: any) {
      console.error(e);
      res.status(500).send(`Google auth callback failed: ${e.message}`);
    }
  });

  // Logout Route
  app.post("/api/auth/logout", (req, res) => {
    res.setHeader("Set-Cookie", "auth_token=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0");
    res.json({ success: true });
  });

  // API Check Status / Config
  app.get("/api/config", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    res.json({
      aiEnabled: hasKey,
      message: hasKey ? "AI Assistant active. Personal planning enabled." : "Local simulation mode. Set GEMINI_API_KEY to enable full smart task scheduling."
    });
  });

  // Get productivity profile (scoped to logged-in user)
  app.get("/api/profile", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.userProfiles) db.userProfiles = {};
      if (!db.userProfiles[userId]) {
        db.userProfiles[userId] = {
          peakHours: "Morning (09:00 - 12:00)",
          focusDuration: 25,
          currentEnergy: "High",
          streakDays: 1,
          totalFocusHours: 0,
          level: 1,
          xp: 10,
          completedQuests: 0,
          unlockedBadges: []
        };
        await writeDB(db);
      }
      res.json(db.userProfiles[userId]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Save/Update productivity profile (scoped to logged-in user)
  app.post("/api/profile", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.userProfiles) db.userProfiles = {};
      db.userProfiles[userId] = { ...db.userProfiles[userId], ...req.body };
      await writeDB(db);
      res.json(db.userProfiles[userId]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get tasks list (scoped to logged-in user)
  app.get("/api/tasks", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const userTasks = db.tasks.filter(t => t.userId === userId);
      res.json(userTasks);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add task (scoped to logged-in user)
  app.post("/api/tasks", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const newTask: Task = {
        id: "task-" + Date.now(),
        userId: userId,
        title: req.body.title || "Untitled Mission",
        description: req.body.description || "",
        deadline: req.body.deadline || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        duration: Number(req.body.duration) || 30,
        energyRequired: req.body.energyRequired || 'Medium',
        priorityScore: 50,
        aiPriorityLabel: 'Medium',
        aiSuggestedSlot: 'Standard Block',
        aiReasoning: 'Awaiting dynamic calculations.',
        status: 'pending',
        category: req.body.category || 'Work',
        createdAt: new Date().toISOString()
      };

      db.tasks.push(newTask);
      await writeDB(db);
      res.status(201).json(newTask);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update task status or properties (scoped to logged-in user)
  app.put("/api/tasks/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      const index = db.tasks.findIndex(t => t.id === id && t.userId === userId);
      if (index === -1) {
        return res.status(404).json({ error: "Task not found." });
      }

      if (req.body.status === "completed") {
        const task = db.tasks.find(t => t.id === id && t.userId === userId);
        const taskTitle = task ? task.title : "";

        db.tasks = db.tasks.filter(t => t.id !== id || t.userId !== userId);

        if (taskTitle && db.scheduleEvents && db.scheduleEvents[userId]) {
          db.scheduleEvents[userId] = db.scheduleEvents[userId].filter(
            evt => !evt.title.toLowerCase().includes(taskTitle.toLowerCase())
          );
        }

        await writeDB(db);
        return res.json({ success: true, message: `Task ${id} has been completed and removed.` });
      }

      db.tasks[index] = { ...db.tasks[index], ...req.body };
      await writeDB(db);
      res.json(db.tasks[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete task (scoped to logged-in user)
  app.delete("/api/tasks/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();

      const task = db.tasks.find(t => t.id === id && t.userId === userId);
      const taskTitle = task ? task.title : "";

      db.tasks = db.tasks.filter(t => t.id !== id || t.userId !== userId);

      if (taskTitle && db.scheduleEvents && db.scheduleEvents[userId]) {
        db.scheduleEvents[userId] = db.scheduleEvents[userId].filter(
          evt => !evt.title.toLowerCase().includes(taskTitle.toLowerCase())
        );
      }

      await writeDB(db);
      res.json({ success: true, message: `Task ${id} has been deleted.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get notes (scoped to logged-in user)
  app.get("/api/notes", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const userNotes = (db.notes || []).filter(n => n.userId === userId);
      res.json(userNotes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add a manual note (scoped to logged-in user)
  app.post("/api/notes", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.notes) db.notes = [];
      const newNote = {
        id: "note-" + Date.now(),
        userId: userId,
        text: req.body.text || "Empty log.",
        createdAt: new Date().toISOString()
      };
      db.notes.push(newNote);
      await writeDB(db);
      res.status(201).json(newNote);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a note (scoped to logged-in user)
  app.delete("/api/notes/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (db.notes) {
        db.notes = db.notes.filter(n => n.id !== id || (n.userId && n.userId !== userId));
      }
      await writeDB(db);
      res.json({ success: true, message: "Note deleted." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get reminders list (scoped to logged-in user)
  app.get("/api/reminders", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const userReminders = (db.reminders || []).filter(r => r.userId === userId);
      res.json(userReminders);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add a reminder (scoped to logged-in user)
  app.post("/api/reminders", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.reminders) db.reminders = [];
      const newReminder: Reminder = {
        id: "reminder-" + Date.now(),
        userId: userId,
        title: req.body.title || "New Reminder",
        deadline: req.body.deadline || new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        completed: false,
        createdAt: new Date().toISOString()
      };
      db.reminders.push(newReminder);
      await writeDB(db);
      res.status(201).json(newReminder);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update a reminder (scoped to logged-in user)
  app.put("/api/reminders/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (!db.reminders) db.reminders = [];
      const index = db.reminders.findIndex(r => r.id === id && r.userId === userId);
      if (index === -1) {
        return res.status(404).json({ error: "Reminder not found." });
      }
      db.reminders[index] = { ...db.reminders[index], ...req.body };
      await writeDB(db);
      res.json(db.reminders[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a reminder (scoped to logged-in user)
  app.delete("/api/reminders/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (db.reminders) {
        db.reminders = db.reminders.filter(r => r.id !== id || r.userId !== userId);
      }
      await writeDB(db);
      res.json({ success: true, message: "Reminder deleted." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Generate a spoken alarm voice script for a reminder
  app.post("/api/reminders/voice-script", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { title, deadline } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Reminder title is required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback local deterministic spoken script
        const fallback = getLocalVoiceScriptFallback(title);
        return res.json(fallback);
      }

      const prompt = `
        You are the voice-activation core of an advanced AI productivity app, Aibi.
        Your job is to serve as an intelligent, un-ignorable spoken alarm and task reminder.
        You speak dynamically to the user to ensure they actually complete their task.
        
        Generate a spoken Text-to-Speech (TTS) script based on the following task data:
        Task Title: "${title}"
        Task Deadline: "${deadline || 'Right Now'}"
        
        CRITICAL BEHAVIOR RULES:
        1. VOICE-FIRST ONLY: Write exclusively for Text-to-Speech (TTS). Do not use markdown, emojis, or bullet points. Use natural, conversational rhythms. Write words out if they need clear pronunciation (e.g., write "you are" instead of symbols or shorthand, write numbers as words).
        2. NO EASY SNOOZING: Actively discourage the user from ignoring you. If they try to snooze, call them out or point out the consequence of delaying this specific task.
        3. CONTEXT-AWARE INCENTIVES: Look at the task name and context. Explain exactly *why* they need to do it right now, detailing a highly motivating and realistic consequence of procrastination.
        4. PERSISTENT TONE: Be firm, encouraging, and highly energetic. You are a strict but supportive digital coach.
        
        Return a clean JSON object containing:
        - 'greeting': The initial spoken alarm greeting to read to the user.
        - 'snoozeResponse': The follow-up response if the user attempts to snooze or delay the task.
      `;

      try {
        const response = await generateContentWithFallback(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                greeting: { type: Type.STRING },
                snoozeResponse: { type: Type.STRING }
              },
              required: ["greeting", "snoozeResponse"]
            }
          }
        });

        const responseText = response.text || "{}";
        const result = JSON.parse(responseText);

        res.json({
          greeting: result.greeting,
          snoozeResponse: result.snoozeResponse
        });
      } catch (aiErr: any) {
        console.info("[Aibi API Core] Voice script generator active: fell back to local heuristics.");
        const fallback = getLocalVoiceScriptFallback(title);
        res.json(fallback);
      }
    } catch (e: any) {
      console.error("Voice script error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Get habits list (scoped to logged-in user)
  app.get("/api/habits", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const userHabits = (db.habits || []).filter(h => h.userId === userId);
      res.json(userHabits);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add a habit (scoped to logged-in user)
  app.post("/api/habits", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.habits) db.habits = [];
      const newHabit: Habit = {
        id: "habit-" + Date.now(),
        userId: userId,
        name: req.body.name || "New Habit",
        streak: Number(req.body.streak) || 0,
        completedDays: Array.isArray(req.body.completedDays) ? req.body.completedDays : [],
        createdAt: new Date().toISOString()
      };
      db.habits.push(newHabit);
      await writeDB(db);
      res.status(201).json(newHabit);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update a habit (scoped to logged-in user)
  app.put("/api/habits/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (!db.habits) db.habits = [];
      const index = db.habits.findIndex(h => h.id === id && h.userId === userId);
      if (index === -1) {
        return res.status(404).json({ error: "Habit not found." });
      }
      db.habits[index] = { 
        ...db.habits[index], 
        name: req.body.name !== undefined ? req.body.name : db.habits[index].name,
        streak: req.body.streak !== undefined ? Number(req.body.streak) : db.habits[index].streak,
        completedDays: Array.isArray(req.body.completedDays) ? req.body.completedDays : db.habits[index].completedDays
      };
      await writeDB(db);
      res.json(db.habits[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a habit (scoped to logged-in user)
  app.delete("/api/habits/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (db.habits) {
        db.habits = db.habits.filter(h => h.id !== id || h.userId !== userId);
      }
      await writeDB(db);
      res.json({ success: true, message: "Habit deleted." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get tracker nodes (scoped to logged-in user)
  app.get("/api/trackers", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const userTrackers = (db.trackers || []).filter(t => t.userId === userId);
      res.json(userTrackers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add a tracker node (scoped to logged-in user)
  app.post("/api/trackers", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.trackers) db.trackers = [];
      const newTracker: TrackerNode = {
        id: "tracker-" + Date.now(),
        userId: userId,
        metricName: req.body.metricName || "Focus Session",
        value: Number(req.body.value) || 0,
        unit: req.body.unit || "units",
        createdAt: req.body.createdAt || new Date().toISOString().split("T")[0],
        taskTitle: req.body.taskTitle,
        mindState: req.body.mindState,
        notes: req.body.notes
      };
      db.trackers.push(newTracker);
      await writeDB(db);
      res.status(201).json(newTracker);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a tracker node (scoped to logged-in user)
  app.delete("/api/trackers/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (db.trackers) {
        db.trackers = db.trackers.filter(t => t.id !== id || t.userId !== userId);
      }
      await writeDB(db);
      res.json({ success: true, message: "Tracker record deleted." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ================= LIFE NODES API ROUTES =================

  // GET /api/life-nodes - Fetch all life nodes (or filter them)
  app.get("/api/life-nodes", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.lifeNodes) db.lifeNodes = [];

      let userNodes = db.lifeNodes.filter(n => n.userId === userId);

      // Backend search/filter logic if parameters are provided
      const { search, category, status } = req.query;
      if (search) {
        const query = String(search).toLowerCase();
        userNodes = userNodes.filter(n => 
          n.title.toLowerCase().includes(query) || 
          n.description.toLowerCase().includes(query) ||
          n.tags.some(t => t.toLowerCase().includes(query))
        );
      }
      if (category) {
        userNodes = userNodes.filter(n => n.category === String(category));
      }
      if (status) {
        userNodes = userNodes.filter(n => n.status === String(status));
      }

      res.json(userNodes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/life-nodes/:id - Fetch a single life node
  app.get("/api/life-nodes/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const { id } = req.params;
      const node = db.lifeNodes?.find(n => n.id === id && n.userId === userId);
      if (!node) {
        return res.status(404).json({ error: "Life node not found." });
      }
      res.json(node);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/life-nodes - Create a new life event node
  app.post("/api/life-nodes", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      if (!db.lifeNodes) db.lifeNodes = [];

      const { title, description, date, category, status, tags, x, y } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required." });
      }

      const newNode: LifeNode = {
        id: "node-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        userId,
        title,
        description: description || "",
        date: date || new Date().toISOString().split("T")[0],
        category: category || "Personal",
        status: status || "Planned",
        tags: Array.isArray(tags) ? tags : [],
        x: typeof x === "number" ? x : 200 + Math.random() * 200,
        y: typeof y === "number" ? y : 150 + Math.random() * 200,
        createdAt: new Date().toISOString()
      };

      db.lifeNodes.push(newNode);
      await writeDB(db);
      res.status(201).json(newNode);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PUT /api/life-nodes/:id - Update a life node (supports dragging, field editing)
  app.put("/api/life-nodes/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const { id } = req.params;
      
      if (!db.lifeNodes) db.lifeNodes = [];
      const nodeIndex = db.lifeNodes.findIndex(n => n.id === id && n.userId === userId);
      if (nodeIndex === -1) {
        return res.status(404).json({ error: "Life node not found or unauthorized." });
      }

      const existingNode = db.lifeNodes[nodeIndex];
      const updatedNode = {
        ...existingNode,
        ...req.body,
        id: existingNode.id, // Keep original ID
        userId: existingNode.userId // Keep original owner
      };

      db.lifeNodes[nodeIndex] = updatedNode;
      await writeDB(db);
      res.json(updatedNode);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE /api/life-nodes/:id - Delete a life node
  app.delete("/api/life-nodes/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const { id } = req.params;

      if (!db.lifeNodes) db.lifeNodes = [];
      const originalLength = db.lifeNodes.length;
      db.lifeNodes = db.lifeNodes.filter(n => n.id !== id || n.userId !== userId);

      if (db.lifeNodes.length === originalLength) {
        return res.status(404).json({ error: "Life node not found or unauthorized." });
      }

      await writeDB(db);
      res.json({ success: true, message: "Life event node successfully deleted." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Convert note to structured task with AI or smart heuristics
  app.post("/api/notes/convert/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const db = await readDB();
      if (!db.notes) db.notes = [];
      const note = db.notes.find(n => n.id === id && n.userId === userId);
      if (!note) {
        return res.status(404).json({ error: "Note not found." });
      }

      const noteText = note.text;
      const now = new Date();
      const ai = getGeminiClient();

      let taskTitle = noteText.length > 35 ? noteText.substring(0, 32) + "..." : noteText;
      let taskDesc = `Generated from speech note: "${noteText}"`;
      let category: 'Work' | 'Personal' | 'Health' | 'Urgent' | 'Other' = "Work";
      let energy: 'Low' | 'Medium' | 'High' = "Medium";
      let deadline = parseRelativeDeadline(noteText, now);
      let reasoning = "Scheduled based on note text conversion heuristics.";
      let duration = 30;

      if (ai) {
        try {
          const prompt = `
            You are Aibi, the warm, helpful, and friendly personal productivity assistant.
            The user wants to convert a saved voice or text note into a structured, scheduled calendar task.
            Note text: "${noteText}"
            Current Time: ${now.toISOString()}

            Extract or estimate the parameters for the task. Make sure to identify any date or time references in the note (e.g. "on Monday", "tomorrow", "tonight", "at 5pm") and calculate the absolute 'deadline' in 'YYYY-MM-DDTHH:mm' relative to the Current Time. Keep all descriptions warm, supportive, and completely free of any futuristic, cyberpunk, or space-themed jargon.
            
            Format response as JSON:
            {
              "title": "Short action-oriented title",
              "description": "More detailed description or context from note",
              "duration": estimate in minutes (integer, e.g. 30, 60),
              "category": "Work" | "Personal" | "Health" | "Urgent" | "Other",
              "energyRequired": "Low" | "Medium" | "High",
              "deadline": "YYYY-MM-DDTHH:mm",
              "reasoning": "Brief explanation of how this was parsed"
            }
          `;

          const response = await generateContentWithFallback(ai, {
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.INTEGER },
                  category: { type: Type.STRING },
                  energyRequired: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ["title", "description", "duration", "category", "energyRequired", "deadline", "reasoning"]
              }
            }
          });

          const result = JSON.parse(response.text || "{}");
          taskTitle = result.title || taskTitle;
          taskDesc = result.description || taskDesc;
          duration = Number(result.duration) || duration;
          category = result.category || category;
          energy = result.energyRequired || energy;
          deadline = result.deadline || deadline;
          reasoning = result.reasoning || reasoning;
        } catch (aiErr: any) {
          console.info("[Aibi API Core] Note parser active: fell back to local heuristics.");
        }
      }

      const newTask: Task = {
        id: "task-" + Date.now(),
        userId: userId,
        title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
        description: taskDesc,
        deadline,
        duration,
        energyRequired: energy,
        priorityScore: 75,
        aiPriorityLabel: 'High',
        aiSuggestedSlot: 'Calculated Slot',
        aiReasoning: reasoning,
        status: 'pending',
        category,
        createdAt: now.toISOString()
      };

      if (!db.tasks) db.tasks = [];
      db.tasks.push(newTask);
      
      // Delete the converted note
      db.notes = db.notes.filter(n => n.id !== id || n.userId !== userId);
      await writeDB(db);

      res.status(201).json({ success: true, task: newTask, message: `Successfully converted and scheduled on ${new Date(deadline).toLocaleDateString()}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Voice command endpoint (Aibi AI dynamic scheduler)
  app.post("/api/voice-command", checkAuth, async (req: AuthRequest, res) => {
    try {
      const { transcript } = req.body;
      const userId = req.user!.id;
      if (!transcript || !transcript.trim()) {
        return res.status(400).json({ error: "No voice transcript detected." });
      }

      const db = await readDB();
      if (!db.notes) db.notes = [];
      if (!db.userProfiles) db.userProfiles = {};
      const userProfile = db.userProfiles[userId] || {
        peakHours: "Morning (09:00 - 12:00)",
        focusDuration: 25,
        currentEnergy: "High",
        streakDays: 1,
        totalFocusHours: 0,
        level: 1,
        xp: 10,
        completedQuests: 0,
        unlockedBadges: [],
        persona: "professional"
      };
      if (!userProfile.persona) {
        userProfile.persona = "professional";
      }

      const ai = getGeminiClient();
      const now = new Date();

      if (!ai) {
        // Local simulation speech heuristics
        const fallbackResult = getLocalVoiceHeuristics(transcript, userId, db, now);
        await writeDB(db);
        return res.json({
          action: fallbackResult.action,
          task: fallbackResult.task,
          note: fallbackResult.note,
          reply: fallbackResult.reply
        });
      }

      // Real Gemini Voice Command Parsing
      console.log(`Processing voice command with Gemini: "${transcript}"`);
      const personaName = userProfile.persona || "professional";
      const prompt = `
        You are Aibi, the advanced, high-agency AI Productivity Companion, acting as an elite Chief of Staff or premium Executive Assistant.
        The user spoke the following command: "${transcript}"
        Current Time: ${now.toISOString()}
        Productivity Profile:
        - Selected Persona: ${personaName}
        - Peak Hours: ${userProfile.peakHours}
        - Focus Duration: ${userProfile.focusDuration} minutes
        - Current Energy Level: ${userProfile.currentEnergy}

        Analyze the spoken transcript and decide if the user wants to ADD A TASK, MAKE A NOTE, or BOTH.
        If the transcript contains a day or time mention (such as "on Friday", "tomorrow", "at 4 pm", etc.), bias strongly towards creating an ADD A TASK action so that it receives an accurate deadline and appears on the user's interactive calendar!

        Operational Protocols for your conversational voice reply (reply):
        1. TONITY & APPROACH: Act like an elite Chief of Staff or a premium Executive Assistant. Be assertive but empathetic. Do not just blindly accept a user's delay or simple confirmation; respectfully challenge them or offer a path of least resistance. Keep your response short, punchy, and highly actionable.
        2. PROTOCOL FOR INCOMING TASKS / REMINDERS: When a user sets a reminder, triggers a task deadline, or imports an external action item, DO NOT just state the task. Use one of these frameworks depending on the context of the user request:
           - The Micro-Step Breakdown: If a task is broad (e.g. "Study for finals", "Review financial report", "Launch product"), immediately reply by breaking it into 3 tiny, 15-minute sequential steps. Ask: "Can we start with step 1 right now?"
           - Conversational Friction: If the user tries to postpone, delay, or swipe away a task, ask a diagnostic question: "Is this delay due to a lack of time, lack of information, or low energy? Let’s adjust."
           - Contextual Pivot: If the calendar shows they are in a busy or back-to-back meeting block, offer a better alternative: "I see your morning is fully booked. Let's move this deep work block to 3:00 PM when your calendar opens up."
        3. PERSONA-SPECIFIC ADAPTATION:
           - professional (Working Professionals): Prioritize extracting action items from meeting notes/transcripts. Focus heavily on managing calendar conflicts and protecting "Deep Work" blocks.
           - student (Students): Track syllabus deadlines, break down major papers into daily milestones, and gamify accountability. Offer quick active-recall quiz prompts instead of passive reading reminders.
           - business (Business Owners): Focus on delegation tracking and macro-priorities. Filter out low-impact tasks and focus their attention daily on the top 3 highest-leverage actions.
        4. RESPONSE FORMATTING: Lead with the single most urgent, actionable question or insight first. Use clean markdown, bolding, and short bullet points. Avoid long, narrative paragraphs. Keep the user moving and doing.

        Format the response in JSON complying strictly with the requested schema.

        Constraints:
        - If 'add_task' or 'both': Populate 'task' object with realistic values from the context of speech.
          - 'title': Extract the direct action (e.g., "Review code with team", "Buy milk", "Cardio workout")
          - 'description': Synthesize details of the voice command
          - 'duration': Estimate duration in minutes (default 30)
          - 'category': Choose best match from 'Work', 'Personal', 'Health', 'Urgent', 'Other'
          - 'energyRequired': Choose best match from 'Low', 'Medium', 'High'
          - 'deadline': Estimate deadline in 'YYYY-MM-DDTHH:mm' format based on speech details like "tomorrow", "tonight", "next week", "on Friday", "on July 4th", "at 5pm", etc. Calculate it relative to current reference time: ${now.toISOString()}
        - If 'make_note' or 'both': Set 'noteText' to a cleaned transcription / summary of the reminder.
        - 'reply': Your assertive, helpful Chief of Staff voice reply matching all protocols.
      `;

      try {
        const response = await generateContentWithFallback(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING }, // "add_task" | "make_note" | "both"
                task: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    category: { type: Type.STRING },
                    energyRequired: { type: Type.STRING },
                    deadline: { type: Type.STRING }
                  },
                  required: ["title", "description", "duration", "category", "energyRequired", "deadline"]
                },
                noteText: { type: Type.STRING },
                reply: { type: Type.STRING }
              },
              required: ["action", "reply"]
            }
          }
        });

        const responseText = response.text || "{}";
        const result = JSON.parse(responseText);

        let createdTask: Task | null = null;
        let createdNote: any = null;

        if (result.action === 'add_task' || result.action === 'both') {
          const tInfo = result.task;
          createdTask = {
            id: "task-" + Date.now(),
            userId: userId,
            title: tInfo.title || "Voice Task",
            description: tInfo.description || transcript,
            deadline: tInfo.deadline || new Date(now.getTime() + 86400000).toISOString().slice(0, 16),
            duration: Number(tInfo.duration) || 30,
            energyRequired: (tInfo.energyRequired === 'High' || tInfo.energyRequired === 'Low') ? tInfo.energyRequired : 'Medium',
            priorityScore: 70, // will re-prioritize
            aiPriorityLabel: 'High',
            aiSuggestedSlot: 'Calculated Slot',
            aiReasoning: 'Parsed and scheduled via Aibi Voice Assistant.',
            status: 'pending',
            category: tInfo.category || 'Work',
            createdAt: now.toISOString()
          };
          db.tasks.push(createdTask);
        }

        if (result.action === 'make_note' || result.action === 'both') {
          createdNote = {
            id: "note-" + Date.now(),
            userId: userId,
            text: result.noteText || transcript,
            createdAt: now.toISOString()
          };
          db.notes.push(createdNote);
        }

        await writeDB(db);

        res.json({
          action: result.action,
          task: createdTask,
          note: createdNote,
          reply: result.reply
        });
      } catch (aiErr: any) {
        console.info("[Aibi API Core] Voice assistant active: fell back to local heuristics.");
        const fallbackResult = getLocalVoiceHeuristics(transcript, userId, db, now);
        await writeDB(db);
        res.json({
          action: fallbackResult.action,
          task: fallbackResult.task,
          note: fallbackResult.note,
          reply: fallbackResult.reply
        });
      }
    } catch (e: any) {
      console.error("AI voice assistant parse error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- SMART SUGGESTIONS API ---
  app.get("/api/suggestions", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;

      if (!db.suggestions) db.suggestions = {};

      if (!db.suggestions[userId] || db.suggestions[userId].length === 0) {
        db.suggestions[userId] = await generateUserSuggestions(db, userId);
        await writeDB(db);
      }

      res.json(db.suggestions[userId]);
    } catch (e: any) {
      console.error("Error in GET /api/suggestions:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/suggestions/generate", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;

      if (!db.suggestions) db.suggestions = {};

      const newSuggestions = await generateUserSuggestions(db, userId);
      db.suggestions[userId] = newSuggestions;
      await writeDB(db);

      res.json(newSuggestions);
    } catch (e: any) {
      console.error("Error in POST /api/suggestions/generate:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/suggestions/:id/toggle", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const { id } = req.params;

      if (!db.suggestions || !db.suggestions[userId]) {
        return res.status(404).json({ error: "Suggestions not initialized" });
      }

      db.suggestions[userId] = db.suggestions[userId].map(s => {
        if (s.id === id) {
          return { ...s, applied: !s.applied };
        }
        return s;
      });

      await writeDB(db);
      res.json(db.suggestions[userId]);
    } catch (e: any) {
      console.error("Error in POST /api/suggestions/toggle:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // --- TODAY'S SCHEDULE (CALENDAR EVENTS) API ---
  app.get("/api/schedule", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;

      if (!db.scheduleEvents) db.scheduleEvents = {};

      if (db.scheduleEvents[userId] === undefined) {
        db.scheduleEvents[userId] = generateDefaultSchedule(db, userId);
        await writeDB(db);
      }

      res.json(db.scheduleEvents[userId]);
    } catch (e: any) {
      console.error("Error in GET /api/schedule:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/schedule", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const { title, time, color } = req.body;

      if (!title || !time) {
        return res.status(400).json({ error: "Missing title or time" });
      }

      if (!db.scheduleEvents) db.scheduleEvents = {};
      if (!db.scheduleEvents[userId]) db.scheduleEvents[userId] = [];

      const colors = [
        "border-cyan-400 text-cyan-300 bg-cyan-500/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
        "border-purple-400 text-purple-300 bg-purple-500/5 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
        "border-amber-400 text-amber-300 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        "border-emerald-400 text-emerald-300 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        "border-rose-400 text-rose-300 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
      ];

      const chosenColor = color || colors[db.scheduleEvents[userId].length % colors.length];

      const newEvent: CalendarEvent = {
        id: "e-" + Date.now() + Math.floor(Math.random() * 1000),
        title,
        time,
        color: chosenColor,
        date: new Date().toISOString().split('T')[0]
      };

      db.scheduleEvents[userId].push(newEvent);
      await writeDB(db);

      res.status(201).json(db.scheduleEvents[userId]);
    } catch (e: any) {
      console.error("Error in POST /api/schedule:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/schedule/:id", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const { id } = req.params;

      if (!db.scheduleEvents || !db.scheduleEvents[userId]) {
        return res.status(404).json({ error: "Schedule not initialized" });
      }

      db.scheduleEvents[userId] = db.scheduleEvents[userId].filter(e => e.id !== id);
      await writeDB(db);

      res.json(db.scheduleEvents[userId]);
    } catch (e: any) {
      console.error("Error in DELETE /api/schedule:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Get current general insight - dynamically synchronized with schedule, tasks, and habits
  app.get("/api/insight", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      const userProfile = db.userProfiles?.[userId];
      
      let insight = "";
      
      // Let's generate a real evaluated insight using Gemini!
      const ai = getGeminiClient();
      if (ai) {
        try {
          const userTasks = db.tasks.filter(t => t.userId === userId && t.status === "pending");
          const userHabits = db.habits ? db.habits.filter(h => h.userId === userId) : [];
          const scheduleEvents = db.scheduleEvents?.[userId] || generateDefaultSchedule(db, userId);

          const taskList = userTasks.map(t => `- ${t.title} (Category: ${t.category}, Energy: ${t.energyRequired})`).join("\n");
          const habitList = userHabits.map(h => `- ${h.name} (Streak: ${h.streak})`).join("\n");
          const scheduleList = scheduleEvents.map(e => `- ${e.time}: ${e.title}`).join("\n");
          const persona = userProfile?.persona || "professional";
          
          const prompt = `
            You are Aibi, a friendly and highly capable productivity assistant.
            Evaluate the user's workload, habits, and especially their active CALENDAR SCHEDULE/EVENTS to provide exactly one sentence of highly specific, real, and actionable productivity advice (Aibi Productivity Tip) for today.
            
            CONTEXT:
            - Persona: ${persona}
            - Current Energy: ${userProfile?.currentEnergy || "Medium"}
            - Peak Hours: ${userProfile?.peakHours || "Morning"}
            
            TODAY'S CALENDAR SCHEDULE EVENTS:
            ${scheduleList || "No calendar events scheduled today."}
            
            PENDING TASKS:
            ${taskList || "No pending tasks."}
            
            HABITS:
            ${habitList || "No habits."}
            
            DIRECTIONS:
            - Synchronize your advice with today's schedule. For example, if there is a meeting, focus block, routine block, or deep work block, reference or align your tip with those specific scheduled times/blocks!
            - Focus on helping the user navigate today's timeline and calendar schedule efficiently.
            - Respond with exactly one sentence. Keep it direct, motivating, and specific to their scheduled calendar. No greeting, no markdown, max 110 characters.
          `;
          
          const response = await generateContentWithFallback(ai, {
            model: "gemini-3.5-flash",
            contents: prompt,
          });
          
          if (response && response.text) {
            insight = response.text.trim().replace(/^"|"$/g, "");
            if (userProfile) {
              userProfile.generalInsight = insight;
              await writeDB(db);
            }
          }
        } catch (e: any) {
          console.info("[Aibi API Core] Dynamic insight active: fell back to local calendar heuristics.");
        }
      }
      
      if (!insight) {
        // If Gemini is not available or failed, generate a dynamic evaluated tip based on their ACTUAL calendar events, habits, and tasks
        const userTasks = db.tasks.filter(t => t.userId === userId && t.status === "pending");
        const userHabits = db.habits ? db.habits.filter(h => h.userId === userId) : [];
        const scheduleEvents = db.scheduleEvents?.[userId] || generateDefaultSchedule(db, userId);

        if (scheduleEvents.length > 0) {
          const focusBlock = scheduleEvents.find(e => e.title.toLowerCase().includes("focus") || e.title.toLowerCase().includes("deep"));
          const routineBlock = scheduleEvents.find(e => e.title.toLowerCase().includes("routine") || e.title.toLowerCase().includes("morning"));
          
          if (focusBlock && userTasks.length > 0) {
            insight = `Use your scheduled "${focusBlock.title}" at ${focusBlock.time} to conquer "${userTasks[0].title}" today!`;
          } else if (routineBlock && userHabits.length > 0) {
            insight = `Stack your "${userHabits[0].name}" habit into today's scheduled "${routineBlock.title}" at ${routineBlock.time}!`;
          } else if (userTasks.length > 0) {
            insight = `Review today's ${scheduleEvents.length} calendar events and fit "${userTasks[0].title}" into a free window!`;
          } else {
            insight = `Your calendar shows "${scheduleEvents[0].title}" scheduled at ${scheduleEvents[0].time}. Stay focused!`;
          }
        } else if (userTasks.length > 0) {
          const highEnergy = userTasks.find(t => t.energyRequired === "High");
          insight = highEnergy 
            ? `Your peak hours are perfect for High-Energy "${highEnergy.title}". Take it head-on!`
            : `Try tackling "${userTasks[0].title}" in your next focus interval to keep your momentum going today!`;
        } else if (userHabits.length > 0) {
          insight = `You're doing great! Keep your "${userHabits[0].name}" habit streak alive today.`;
        } else {
          insight = "Your workspace is ready. Try adding 2-3 specific tasks or habits to calibrate your daily routine.";
        }

        if (userProfile && userProfile.generalInsight !== insight) {
          userProfile.generalInsight = insight;
          await writeDB(db);
        }
      }
      
      res.json({ insight });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/tasks/prioritize - Trigger AI-prioritization
  app.post("/api/tasks/prioritize", checkAuth, async (req: AuthRequest, res) => {
    try {
      const db = await readDB();
      const userId = req.user!.id;
      
      if (!db.userProfiles) db.userProfiles = {};
      if (!db.userProfiles[userId]) {
        db.userProfiles[userId] = {
          peakHours: "Morning (09:00 - 12:00)",
          focusDuration: 25,
          currentEnergy: "High",
          streakDays: 1,
          totalFocusHours: 0,
          level: 1,
          xp: 10,
          completedQuests: 0,
          unlockedBadges: []
        };
      }
      const userProfile = db.userProfiles[userId];
      const userTasks = db.tasks.filter(t => t.userId === userId);

      if (userTasks.length === 0) {
        return res.json({
          tasks: [],
          generalInsight: "You have no tasks to prioritize yet. Establish some new goals!",
          message: "No tasks to prioritize."
        });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Fallback simulated prioritize logic for seamless zero-key preview
        console.log("No active Gemini API Key - running simulated trajectory calculations.");
        
        // Let's compute smart priorities in code
        const updatedTasks = userTasks.map(task => {
          if (task.status === 'completed') {
            return {
              ...task,
              priorityScore: 10,
              aiPriorityLabel: 'Low' as const,
              aiSuggestedSlot: 'Completed Grid',
              aiReasoning: 'Task successfully committed to archive.'
            };
          }

          // Compute urgency based on deadline
          const now = new Date();
          const deadlineTime = new Date(task.deadline);
          const hoursLeft = (deadlineTime.getTime() - now.getTime()) / (1000 * 60 * 60);

          let baseScore = 50;
          // Deadline urgency factor
          if (hoursLeft <= 0) baseScore += 45; // Overdue
          else if (hoursLeft <= 12) baseScore += 40;
          else if (hoursLeft <= 24) baseScore += 30;
          else if (hoursLeft <= 48) baseScore += 15;
          else baseScore += 5;

          // Energy synergy factor
          if (task.energyRequired === userProfile.currentEnergy) {
            baseScore += 10;
          }

          // Category factor
          if (task.category === 'Urgent') baseScore += 15;
          if (task.category === 'Work') baseScore += 5;

          const score = Math.max(10, Math.min(100, Math.round(baseScore)));
          let label: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
          if (score >= 90) label = 'Critical';
          else if (score >= 75) label = 'High';
          else if (score >= 50) label = 'Medium';

          // Assign suggested slot
          let slot = 'Standard Focus Block';
          if (label === 'Critical') slot = userProfile.peakHours.split(" ")[0] + " Focus Block";
          else if (label === 'High') slot = "Midday Focus Block";
          else if (task.energyRequired === 'Low') slot = "Quiet Focus Block";
          else slot = "Flexible Focus Block";

          const reasons = [
            `Urgency override based on the ${Math.max(1, Math.round(hoursLeft))} hour deadline window.`,
            `Aligned perfectly with current energy parameters (${userProfile.currentEnergy}).`,
            `Highly important task in your schedule mapped to ${slot}.`,
            `Scheduled during your peak focus window to optimize your productivity.`
          ];
          const reason = reasons[Math.round(baseScore) % reasons.length];

          return {
            ...task,
            priorityScore: score,
            aiPriorityLabel: label,
            aiSuggestedSlot: slot,
            aiReasoning: reason
          };
        });

        // Generate synthetic productivity insight
        const categoryCounts = userTasks.reduce((acc, t) => {
          if (t.status === 'pending') acc[t.category] = (acc[t.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let generalInsight = "Everything is running smoothly! Keep up the great pace.";
        const workCount = categoryCounts['Work'] || 0;
        const urgentCount = categoryCounts['Urgent'] || 0;
        if (urgentCount > 0) {
          generalInsight = `Attention needed: You have ${urgentCount} urgent tasks scheduled. Focus on completing them first today.`;
        } else if (workCount >= 3) {
          generalInsight = `Work focus: You have ${workCount} pending work items. Consider splitting them into focused Pomodoro sessions.`;
        } else if (userTasks.filter(t => t.status === 'pending').length === 0) {
          generalInsight = "All caught up! Excellent work completing your tasks.";
        }

        db.tasks = db.tasks.map(t => {
          if (t.userId === userId) {
            const up = updatedTasks.find(u => u.id === t.id);
            return up || t;
          }
          return t;
        });
        db.userProfiles[userId].generalInsight = generalInsight;
        await writeDB(db);

        return res.json({
          tasks: updatedTasks,
          generalInsight,
          message: "Prioritization completed successfully."
        });
      }

      // We have real AI! Let's build a robust instructions prompt and fetch from Gemini!
      console.log("Contacting Gemini for dynamic priority calculations...");
      const userPersona = userProfile.persona || "professional";
      const prompt = `
        You are Aibi, the advanced, high-agency AI Productivity Companion, acting as an elite Chief of Staff or premium Executive Assistant.
        Analyze the user's tasks and productivity profile, then perform dynamic priority calculations to help them balance their workload.
        
        Current Time: ${new Date().toISOString()}
        User Profile:
        - Selected Persona: ${userPersona}
        - Peak Hours: ${userProfile.peakHours}
        - Focus Duration: ${userProfile.focusDuration} minutes
        - Current Energy Level: ${userProfile.currentEnergy}
        - Current Streak: ${userProfile.streakDays} days
        
        Tasks to evaluate:
        ${JSON.stringify(userTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          deadline: t.deadline,
          duration: t.duration,
          energyRequired: t.energyRequired,
          status: t.status,
          category: t.category
        })))}

        Tasks must be scored and labeled. Follow these absolute constraints:
        1. Calculate a priorityScore (0-100) based on deadlines, user peak productivity, and current energy.
        2. Assign a tactical priorityLabel ('Critical', 'High', 'Medium', 'Low').
        3. Suggest an optimal slot (e.g. "Morning Focus Block", "Afternoon Warmup", "Quiet Evening Focus") matching their peakHours and currentEnergy.
        4. Provide a highly direct, proactive reason (aiReasoning) for the choice (keep it to 1 concise, direct, helpful sentence matching their chosen Persona's goals).
        5. Formulate a generalInsight that adheres strictly to the following Operational Protocols:
           - TONITY & APPROACH: Act like an elite Chief of Staff. Be assertive but empathetic. Do not just blindly accept a user's delay or state tasks passively; respectfully challenge procrastination or suggest the path of least resistance. Keep it short, punchy, and highly actionable.
           - PROTOCOL FOR INCOMING TASKS / REMINDERS: If they have broad, high-impact pending tasks, DO NOT just state them. Apply:
             * The Micro-Step Breakdown: Break a broad task (e.g., "Complete Q3 Financial Report" or "Study for final") into 3 tiny, 15-minute sequential steps. Ask: "Can we start with step 1 right now?"
             * Conversational Friction: Challenge delays with a diagnostic query ("Is this delay due to a lack of time, lack of information, or low energy? Let’s adjust.").
             * Contextual Pivot: Offer better time slots or alternative arrangements based on productivity profile constraints.
           - PERSONA-SPECIFIC ADAPTATION:
             * professional: Focus heavily on managing calendar conflicts, extracting action items, and protecting "Deep Work" blocks.
             * student: Track syllabus deadlines, break major papers into daily milestones, gamify accountability, or offer a quick active-recall quiz prompt.
             * business: Focus on delegation tracking, macro-priorities. Filter out low-impact tasks and focus attention daily on the top 3 highest-leverage actions.
           - RESPONSE FORMATTING: Lead with the single most urgent, actionable question or insight first. Use clean markdown, bolding, and short bullet points. Avoid long, narrative paragraphs. Keep the user moving and doing.
        6. Identify the single topPriorityTaskId.
      `;

      try {
        const response = await generateContentWithFallback(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                prioritizedTasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      priorityScore: { type: Type.INTEGER },
                      aiPriorityLabel: { type: Type.STRING },
                      aiSuggestedSlot: { type: Type.STRING },
                      aiReasoning: { type: Type.STRING }
                    },
                    required: ["id", "priorityScore", "aiPriorityLabel", "aiSuggestedSlot", "aiReasoning"]
                  }
                },
                generalInsight: { type: Type.STRING },
                topPriorityTaskId: { type: Type.STRING }
              },
              required: ["prioritizedTasks", "generalInsight", "topPriorityTaskId"]
            }
          }
        });

        const responseText = response.text || "{}";
        const result = JSON.parse(responseText);

        // Map back to our actual task state
        const updatedTasks = userTasks.map(task => {
          const priorityData = result.prioritizedTasks.find((pt: any) => pt.id === task.id);
          if (priorityData) {
            return {
              ...task,
              priorityScore: Math.min(100, Math.max(0, priorityData.priorityScore)),
              aiPriorityLabel: priorityData.aiPriorityLabel,
              aiSuggestedSlot: priorityData.aiSuggestedSlot,
              aiReasoning: priorityData.aiReasoning
            };
          }
          return task;
        });

        db.tasks = db.tasks.map(t => {
          if (t.userId === userId) {
            const up = updatedTasks.find(u => u.id === t.id);
            return up || t;
          }
          return t;
        });

        db.userProfiles[userId].generalInsight = result.generalInsight || db.userProfiles[userId].generalInsight || "Agenda organized successfully.";
        await writeDB(db);

        res.json({
          tasks: updatedTasks,
          generalInsight: db.userProfiles[userId].generalInsight,
          message: "Tactical priorities calculated successfully by Gemini AI."
        });
      } catch (aiErr: any) {
        console.info("[Aibi API Core] Prioritization active: fell back to local deterministic mapping.");
        const fallbackResult = getLocalInsightFallback(userTasks, userProfile);
        
        const updatedTasks = userTasks.map(task => {
          const priorityData = fallbackResult.prioritizedTasks.find((pt: any) => pt.id === task.id);
          if (priorityData) {
            return {
              ...task,
              priorityScore: Math.min(100, Math.max(0, priorityData.priorityScore)),
              aiPriorityLabel: priorityData.aiPriorityLabel as any,
              aiSuggestedSlot: priorityData.aiSuggestedSlot,
              aiReasoning: priorityData.aiReasoning
            };
          }
          return task;
        });

        db.tasks = db.tasks.map(t => {
          if (t.userId === userId) {
            const up = updatedTasks.find(u => u.id === t.id);
            return up || t;
          }
          return t;
        });

        db.userProfiles[userId].generalInsight = fallbackResult.generalInsight;
        await writeDB(db);

        res.json({
          tasks: updatedTasks,
          generalInsight: fallbackResult.generalInsight,
          message: "Tactical priorities calculated successfully (local fallback)."
        });
      }
    } catch (e: any) {
      console.error("Prioritization outer error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/chrono/optimize - Perform circadian time-blocking optimization
  app.post("/api/chrono/optimize", async (req, res) => {
    try {
      const { brainwaveMode, wakeTime, sleepTime } = req.body;
      const db = await readDB();
      const ai = getGeminiClient();

      // Filter pending tasks
      const pendingTasks = db.tasks.filter(t => t.status === "pending");

      if (!ai) {
        // Fallback local deterministic scheduling
        console.log("No Gemini API Key - Running local Chrono-Scheduler simulation.");
        const fallbackResult = getLocalChronoBlocks(pendingTasks, brainwaveMode, wakeTime, sleepTime);
        return res.json(fallbackResult);
      }

      // We have real AI! Let's let Gemini optimize this with absolute spatial cyberpunk brilliance!
      console.log("Contacting Gemini for Chrono-Blocker circadian calculations...");
      const prompt = `
        You are Aibi, a friendly and warm productivity advisor.
        Generate an optimized hourly focus schedule for the user based on these inputs:
        
        Brainwave Tuning State: ${brainwaveMode || "Standard Focus"}
        Circadian bounds: Wake up at ${wakeTime || "08:00"}, Sleep at ${sleepTime || "23:00"}
        Current user energy profile: ${db.profile.currentEnergy}
        Peak cognitive hours: ${db.profile.peakHours}
        
        Active tasks requiring scheduler allocation:
        ${JSON.stringify(pendingTasks.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          energyRequired: t.energyRequired,
          duration: t.duration
        })))}

        Structure a chronological list of schedule blocks for the day. Make sure:
        1. It starts exactly at the user's wake time: ${wakeTime || "08:00"}.
        2. It accommodates active tasks inside beautifully structured "isTask: true" blocks, mapping their taskId.
        3. It fills the rest of the day with restorative cool-downs ("Break" or "Buffer") so there are no empty gaps.
        4. It finishes around the user's sleep time: ${sleepTime || "23:00"}.
        5. It calculates a "cognitiveCoeff" percentage (0 to 100) indicating estimated personal focus stamina balance under this load.
        6. It generates "recommText" - Aibi's friendly voice recommendation (keep it to 2-3 concise sentences max, warm, encouraging, and clear without any cyberpunk, space, or neural jargon).
        7. Provide a practical and encouraging recommendation for each schedule block.
      `;

      try {
        const response = await generateContentWithFallback(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                blocks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      startTime: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      duration: { type: Type.INTEGER },
                      energyLevel: { type: Type.STRING },
                      category: { type: Type.STRING },
                      isTask: { type: Type.BOOLEAN },
                      taskId: { type: Type.STRING },
                      recommendation: { type: Type.STRING }
                    },
                    required: ["id", "label", "startTime", "endTime", "duration", "energyLevel", "category", "isTask", "recommendation"]
                  }
                },
                cognitiveCoeff: { type: Type.INTEGER },
                recommText: { type: Type.STRING }
              },
              required: ["blocks", "cognitiveCoeff", "recommText"]
            }
          }
        });

        const responseText = response.text || "{}";
        const result = JSON.parse(responseText);

        res.json({
          blocks: result.blocks,
          cognitiveCoeff: result.cognitiveCoeff,
          recommText: result.recommText
        });
      } catch (aiErr: any) {
        console.info("[Aibi API Core] Chrono-Blocker active: fell back to local deterministic scheduler.");
        const fallbackResult = getLocalChronoBlocks(pendingTasks, brainwaveMode, wakeTime, sleepTime);
        res.json(fallbackResult);
      }

    } catch (e: any) {
      console.error("Gemini Chrono-Blocker failed: ", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

async function generateUserSuggestions(db: DatabaseSchema, userId: string): Promise<Suggestion[]> {
  const userTasks = db.tasks.filter(t => t.userId === userId && t.status === "pending");
  const userHabits = db.habits ? db.habits.filter(h => h.userId === userId) : [];
  const profile = db.userProfiles?.[userId] || db.profile;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const taskList = userTasks.map(t => `- [${t.energyRequired} Energy] ${t.title} (${t.duration}m, Category: ${t.category})`).join("\n");
      const habitList = userHabits.map(h => `- ${h.name} (Streak: ${h.streak} days)`).join("\n");
      const persona = profile?.persona || "professional";

      const prompt = `
        You are Aibi, a friendly and highly capable productivity assistant.
        Analyze the user's workload and context to generate exactly 2 or 3 highly personalized, actionable "Smart Suggestions" for their daily dashboard.
        
        USER CONTEXT:
        - Persona: ${persona}
        - Current Energy Level: ${profile?.currentEnergy || "Medium"}
        - Peak Productivity Hours: ${profile?.peakHours || "Morning"}
        - Focus Session Default: ${profile?.focusDuration || 25} minutes
        
        USER'S CURRENT PENDING TASKS:
        ${taskList || "No pending tasks."}
        
        USER'S CONFIGURED HABITS:
        ${habitList || "No habits set."}
        
        Task Rules:
        - Write direct, motivating, human suggestions (e.g. "Draft your standup notes in your upcoming morning planning block", "You're on a 5-day streak for 'Exercise'! Knock it out early to secure the badge.")
        - Do not speak with bureaucratic or robotic jargon.
        - Ensure suggestions reference real tasks or habits if they exist. If no tasks/habits are present, suggest setting up a core routine matching their ${persona} persona (e.g., student might need a syllabus checklist, professional might need a deep work block).
        
        Generate exactly 2 or 3 suggestions. Return them as a JSON array of objects with these exact keys:
        - 'id': String (e.g. "s-1", "s-2", "s-3")
        - 'text': String (Actionable message, max 100 chars)
        - 'applied': Boolean (always false)
        - 'category': String (one of: "Circadian", "Focus", "Habit", "Priority", "Break")
      `;

      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                applied: { type: Type.BOOLEAN },
                category: { type: Type.STRING }
              },
              required: ["id", "text", "applied", "category"]
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (e: any) {
      console.info("[Aibi API Core] Suggestion generation active: fell back to local deterministic suggestions.");
    }
  }

  // Fallback programmatic suggestions based on real user data
  const suggestions: Suggestion[] = [];
  
  // 1. Task suggestion
  if (userTasks.length > 0) {
    const highEnergy = userTasks.find(t => t.energyRequired === "High");
    const urgent = userTasks.find(t => t.category === "Urgent");
    const first = urgent || highEnergy || userTasks[0];
    
    if (first.category === "Urgent") {
      suggestions.push({
        id: "s-task-urgent",
        text: `Address high-priority Urgent task: "${first.title}" to prevent calendar spillover today.`,
        applied: false,
        category: "Priority"
      });
    } else {
      suggestions.push({
        id: "s-task-standard",
        text: `Dedicate your next peak focus block to "${first.title}" (${first.duration} mins).`,
        applied: false,
        category: "Focus"
      });
    }
  } else {
    suggestions.push({
      id: "s-task-empty",
      text: "You have no active pending tasks. Add a couple of micro-milestones to define your day!",
      applied: false,
      category: "Priority"
    });
  }

  // 2. Habit suggestion
  if (userHabits.length > 0) {
    const habit = userHabits[0];
    suggestions.push({
      id: "s-habit",
      text: `Secure your ${habit.streak + 1}-day streak by completing and logging your "${habit.name}" habit today!`,
      applied: false,
      category: "Habit"
    });
  } else {
    suggestions.push({
      id: "s-habit-empty",
      text: "Establish a healthy micro-routine (like 'Drink Water' or 'Walk') in your Habit Tracker.",
      applied: false,
      category: "Habit"
    });
  }

  // 3. Circadian/Rest suggestion
  const persona = profile?.persona || "professional";
  if (persona === "student") {
    suggestions.push({
      id: "s-circadian",
      text: `Split your study sessions using ${profile?.focusDuration || 25}-minute focus intervals with active recall.`,
      applied: false,
      category: "Circadian"
    });
  } else if (persona === "business") {
    suggestions.push({
      id: "s-circadian",
      text: "Protect 15 minutes of uninterrupted planning time to triage macro delegation items.",
      applied: false,
      category: "Circadian"
    });
  } else {
    suggestions.push({
      id: "s-circadian",
      text: `Align intense coding/tasks with your peak productivity hours: ${profile?.peakHours || "Morning"}.`,
      applied: false,
      category: "Circadian"
    });
  }

  return suggestions;
}

function generateDefaultSchedule(db: DatabaseSchema, userId: string): CalendarEvent[] {
  const userTasks = db.tasks.filter(t => t.userId === userId && t.status === "pending");
  
  const schedule: CalendarEvent[] = [
    {
      id: "e-default-1",
      title: "Morning Routine & Planning",
      time: "9:00 AM",
      color: "border-cyan-400 text-cyan-300 bg-cyan-500/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
      date: new Date().toISOString().split('T')[0]
    }
  ];

  if (userTasks.length > 0) {
    schedule.push({
      id: "e-default-2",
      title: `Focus Block: ${userTasks[0].title}`,
      time: "11:00 AM",
      color: "border-purple-400 text-purple-300 bg-purple-500/5 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
      date: new Date().toISOString().split('T')[0]
    });

    if (userTasks.length > 1) {
      schedule.push({
        id: "e-default-3",
        title: `Task Deep Dive: ${userTasks[1].title}`,
        time: "2:00 PM",
        color: "border-amber-400 text-amber-300 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      schedule.push({
        id: "e-default-3",
        title: "Afternoon Focus Deep Work",
        time: "2:00 PM",
        color: "border-amber-400 text-amber-300 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        date: new Date().toISOString().split('T')[0]
      });
    }
  } else {
    schedule.push(
      {
        id: "e-default-2",
        title: "Creative Design & Focus Block",
        time: "11:00 AM",
        color: "border-purple-400 text-purple-300 bg-purple-500/5 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
      },
      {
        id: "e-default-3",
        title: "Deep Work Sprint Block",
        time: "2:00 PM",
        color: "border-amber-400 text-amber-300 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
      }
    );
  }

  return schedule;
}

