import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard,
  Cpu,
  Calendar as CalendarIcon,
  ListTodo,
  Activity,
  Bell,
  Sliders,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Clock,
  Sparkles,
  CheckCircle2,
  Database
} from "lucide-react";
import { Task, ProductivityProfile, User, Reminder, TrackerNode, Habit } from "./types";
import DashboardView from "./components/DashboardView";
import AIAssistantView from "./components/AIAssistantView";
import CalendarView from "./components/CalendarView";
import TasksView from "./components/TasksView";
import LifeTrackerView from "./components/LifeTrackerView";
import RemindersView from "./components/RemindersView";
import SettingsView from "./components/SettingsView";
import HabitTrackerView from "./components/HabitTrackerView";
import AuthPage from "./components/AuthPage";
import FloatingStars from "./components/FloatingStars";

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [trackers, setTrackers] = useState<TrackerNode[]>([]);
  const [profile, setProfile] = useState<ProductivityProfile>({
    peakHours: "Morning (09:00 - 12:00)",
    focusDuration: 25,
    currentEnergy: "High",
    streakDays: 1,
    totalFocusHours: 0,
    level: 1,
    xp: 10,
    completedQuests: 0,
    unlockedBadges: []
  });
  
  const [generalInsight, setGeneralInsight] = useState<string>("System initialized. Awaiting user parameters calibration.");
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [prioritizing, setPrioritizing] = useState<boolean>(false);
  
  // Navigation State
  const [activeView, setActiveView] = useState<
    "dashboard" | "ai-assistant" | "calendar" | "habits" | "life-tracker" | "reminders" | "settings"
  >("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Voice Assistant State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceReply, setVoiceReply] = useState<string>("Orbital is online. Tap the microphone to dictate commands or speak tasks directly.");
  const [voiceProcessing, setVoiceProcessing] = useState<boolean>(false);
  const [convertingNoteId, setConvertingNoteId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(true);

  // Spoken Alarm Core State
  const [activeAlarm, setActiveAlarm] = useState<{
    id: string;
    title: string;
    deadline: string;
    greeting: string;
    snoozeResponse: string;
    isTask?: boolean;
  } | null>(null);
  const [alarmTriggeredIds, setAlarmTriggeredIds] = useState<string[]>([]);
  const [alarmFetching, setAlarmFetching] = useState<boolean>(false);
  const [snoozeCount, setSnoozeCount] = useState<number>(0);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);
  const [alarmStateText, setAlarmStateText] = useState<string>("");
  const [snoozedAlarms, setSnoozedAlarms] = useState<Record<string, number>>({});

  // Ticker Time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Indian Standard Time (IST) Helpers
  const getISTDate = () => {
    const now = new Date();
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const getValue = (type: string) => parseInt(parts.find(p => p.type === type)?.value || "0", 10);
      
      const year = getValue("year");
      const month = getValue("month") - 1; // 0-indexed
      const day = getValue("day");
      let hour = getValue("hour");
      if (hour === 24) hour = 0;
      const minute = getValue("minute");
      const second = getValue("second");
      
      return new Date(year, month, day, hour, minute, second);
    } catch (e) {
      return now;
    }
  };

  const parseDeadlineAsLocal = (deadlineStr: string) => {
    if (!deadlineStr) return new Date();
    const match = deadlineStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      const [_, y, m, d, h, min] = match.map(Number);
      return new Date(y, m - 1, d, h, min, 0);
    }
    return new Date(deadlineStr);
  };

  const formatIST = (date: Date) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-ZA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      return formatter.format(date).replace(",", "");
    } catch (e) {
      return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    }
  };

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript("Listening to audio stream...");
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setVoiceTranscript(resultText);
      handleVoiceSubmit(resultText);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "aborted") {
        console.warn("Speech Recognition aborted gracefully.");
        setVoiceTranscript("Voice capture stopped.");
      } else if (event.error === "no-speech") {
        console.warn("Speech Recognition: no speech detected.");
        setVoiceTranscript("No speech detected.");
      } else {
        console.warn("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceTranscript("Microphone access blocked. Please open the app in a new tab using the top-right icon to grant microphone permissions.");
        } else if (event.error === "audio-capture") {
          setVoiceTranscript("Audio capture failed. Ensure a microphone is connected, or open this app in a new tab to bypass iframe permission constraints.");
        } else {
          setVoiceTranscript(`Capture error: ${event.error}. You can also type your command below.`);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // Check Session & Bootstrap user
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          if (data.token) {
            localStorage.setItem("auth_token", data.token);
          }
          setCurrentUser(data.user);
          await fetchConfig();
          await fetchProfile();
          await fetchTasks();
          await fetchNotes();
          await fetchInsight();
          await fetchReminders();
          await fetchTrackers();
          await fetchHabits();
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Session handshake aborted:", err);
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    checkSession();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setAiEnabled(data.aiEnabled);
    } catch (e) {
      console.error("Failed configuration query:", e);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      console.error("Failed profile query:", e);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Could not retrieve tasks:", e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Could not fetch speech logs:", e);
      setNotes([]);
    }
  };

  const fetchInsight = async () => {
    try {
      const res = await fetch("/api/insight");
      if (res.ok) {
        const data = await res.json();
        if (data.insight) setGeneralInsight(data.insight);
      }
    } catch (e) {
      console.error("AI Insight fetch aborted:", e);
    }
  };

  // Reminders Fetch and Actions
  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Could not fetch reminders:", e);
      setReminders([]);
    }
  };

  const handleAddReminder = async (
    title: string,
    deadline: string,
    location?: string,
    energyRequired?: 'Low' | 'Medium' | 'High',
    dependentTaskId?: string
  ) => {
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, deadline, location, energyRequired, dependentTaskId })
      });
      const newRem = await res.json();
      setReminders(prev => [...prev, newRem]);
    } catch (e) {
      console.error("Failed to add reminder:", e);
    }
  };

  const handleToggleReminder = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
      });
      const updated = await res.json();
      setReminders(prev => prev.map(r => r.id === id ? updated : r));
    } catch (e) {
      console.error("Failed to toggle reminder:", e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error("Failed to delete reminder:", e);
    }
  };

  // --- SPOKEN ALARM CORE & DIGITAL COACH FUNCTIONS ---
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const defaultVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))) || voices.find(v => v.lang.startsWith("en"));
    if (defaultVoice) {
      utterance.voice = defaultVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsAlarmPlaying(true);
    utterance.onend = () => setIsAlarmPlaying(false);
    utterance.onerror = () => setIsAlarmPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const triggerSpokenAlarm = async (reminder: { id: string; title: string; deadline: string }, isTask = false) => {
    if (activeAlarm && activeAlarm.id === reminder.id) return;
    
    if (!alarmTriggeredIds.includes(reminder.id)) {
      setAlarmTriggeredIds(prev => [...prev, reminder.id]);
    }

    setAlarmFetching(true);
    setAlarmStateText("Connecting to Orbital Voice Core...");
    try {
      const res = await fetch("/api/reminders/voice-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: reminder.title, deadline: reminder.deadline })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAlarm({
          id: reminder.id,
          title: reminder.title,
          deadline: reminder.deadline,
          greeting: data.greeting,
          snoozeResponse: data.snoozeResponse,
          isTask: isTask
        });
        setSnoozeCount(0);
        setAlarmStateText("COGNITIVE BROADCAST ACTIVE");
        speakText(data.greeting);
      } else {
        console.error("Could not fetch voice alarm script. Status:", res.status);
      }
    } catch (e) {
      console.error("Could not fetch voice alarm script:", e);
    } finally {
      setAlarmFetching(false);
    }
  };

  const handleAlarmDone = async () => {
    if (!activeAlarm) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (activeAlarm.isTask) {
      await handleToggleTaskStatus(activeAlarm.id);
      speakText(`Task completed and logged. Neural pathway verified! Excellent execution.`);
    } else {
      await handleToggleReminder(activeAlarm.id, true);
      speakText(`Cognitive block cleared. Excellent work completing your reminder: ${activeAlarm.title}. Maintain this momentum!`);
    }
    setActiveAlarm(null);
  };

  const handleAlarmSnooze = () => {
    if (!activeAlarm) return;
    
    const nextCount = snoozeCount + 1;
    setSnoozeCount(nextCount);
    
    if (nextCount >= 3) {
      const blockMessage = `Negative. You have attempted to snooze three times. Access denied. You must execute ${activeAlarm.title} immediately. No further excuses.`;
      speakText(blockMessage);
      setAlarmStateText("SNOOZE OVERRIDE LOCKED");
      return;
    }

    setAlarmStateText(`SNOOZE ATTEMPT ${nextCount} OF 3`);
    speakText(activeAlarm.snoozeResponse);

    // Silence currently speaking alarm voice
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Snooze for 1 minute for interactive/responsive testing (or 5 min, let's do 1 min so it's super easy to demonstrate and works flawlessly in preview!)
    const snoozeTimeMs = 1 * 60 * 1000;
    const wakeupTime = new Date().getTime() + snoozeTimeMs;

    setSnoozedAlarms(prev => ({
      ...prev,
      [activeAlarm.id]: wakeupTime
    }));

    // Allow it to trigger again after snooze is finished
    setAlarmTriggeredIds(prev => prev.filter(id => id !== activeAlarm.id));

    // Close the alarm overlay after a brief delay
    setTimeout(() => {
      setActiveAlarm(null);
    }, 2000);
  };

  // Periodic Spoken Alarm Check Effect for both Reminders and Tasks
  useEffect(() => {
    if (!currentUser || activeAlarm) return;

    const checkDueItems = () => {
      const nowIST = getISTDate();
      const currentTimeMs = new Date().getTime();

      // 1. Scan active reminders
      const dueReminder = reminders.find(rem => {
        if (rem.completed || alarmTriggeredIds.includes(rem.id)) return false;
        if (snoozedAlarms[rem.id] && currentTimeMs < snoozedAlarms[rem.id]) return false;

        const deadlineIST = parseDeadlineAsLocal(rem.deadline);
        const diffMs = nowIST.getTime() - deadlineIST.getTime();
        return diffMs >= 0 && diffMs <= 15 * 60 * 1000;
      });

      if (dueReminder) {
        triggerSpokenAlarm(dueReminder, false);
        return;
      }

      // 2. Scan active pending tasks
      const dueTask = tasks.find(tsk => {
        if (tsk.status === "completed" || alarmTriggeredIds.includes(tsk.id)) return false;
        if (snoozedAlarms[tsk.id] && currentTimeMs < snoozedAlarms[tsk.id]) return false;

        const deadlineIST = parseDeadlineAsLocal(tsk.deadline);
        const diffMs = nowIST.getTime() - deadlineIST.getTime();
        return diffMs >= 0 && diffMs <= 15 * 60 * 1000;
      });

      if (dueTask) {
        triggerSpokenAlarm({
          id: dueTask.id,
          title: dueTask.title,
          deadline: dueTask.deadline
        }, true);
      }
    };

    checkDueItems();
    const interval = setInterval(checkDueItems, 8000);
    return () => clearInterval(interval);
  }, [reminders, tasks, currentUser, activeAlarm, alarmTriggeredIds, snoozedAlarms]);

  // Habits Fetch and Actions
  const calculateHabitStreak = (completedDaysList: string[]): number => {
    if (!completedDaysList || completedDaysList.length === 0) return 0;
    
    // Deduplicate and filter any invalid or empty dates
    const uniqueDays = Array.from(new Set(completedDaysList.filter(Boolean)));
    const todayStr = getLocalDateString();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    const hasToday = uniqueDays.includes(todayStr);
    const hasYesterday = uniqueDays.includes(yesterdayStr);
    
    if (!hasToday && !hasYesterday) {
      return 0;
    }
    
    let streakCount = 0;
    let currentCheckStr = hasToday ? todayStr : yesterdayStr;
    
    while (uniqueDays.includes(currentCheckStr)) {
      streakCount++;
      const [y, m, d] = currentCheckStr.split("-").map(Number);
      const prevDate = new Date(y, m - 1, d - 1);
      currentCheckStr = getLocalDateString(prevDate);
    }
    
    return streakCount;
  };

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Recalculate streak for each habit to ensure correctness on mount
        const updatedData = data.map(habit => {
          const recalculated = calculateHabitStreak(habit.completedDays || []);
          return { ...habit, streak: recalculated };
        });
        setHabits(updatedData);

        // Sync any changed streaks back to the server in the background
        updatedData.forEach(async (h, idx) => {
          if (h.streak !== data[idx].streak) {
            try {
              await fetch(`/api/habits/${h.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completedDays: h.completedDays, streak: h.streak })
              });
            } catch (err) {
              console.error("Failed to sync habit streak updates:", err);
            }
          }
        });
      } else {
        setHabits([]);
      }
    } catch (e) {
      console.error("Could not retrieve habits:", e);
      setHabits([]);
    }
  };

  const handleAddHabit = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), streak: 0, completedDays: [] })
      });
      if (res.ok) {
        const newHabit = await res.json();
        setHabits(prev => [...prev, newHabit]);
      }
    } catch (e) {
      console.error("Failed to add habit:", e);
    }
  };

  const handleToggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const todayStr = getLocalDateString();
    const isCompletedToday = habit.completedDays.includes(todayStr);

    let nextCompletedDays = [...habit.completedDays];
    if (isCompletedToday) {
      nextCompletedDays = nextCompletedDays.filter(d => d !== todayStr);
    } else {
      nextCompletedDays.push(todayStr);
    }

    const nextStreak = calculateHabitStreak(nextCompletedDays);

    // Optimistically update
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedDays: nextCompletedDays, streak: nextStreak } : h));

    try {
      await fetch(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedDays: nextCompletedDays, streak: nextStreak })
      });
    } catch (e) {
      console.error("Failed to toggle habit:", e);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error("Failed to delete habit:", e);
    }
  };

  // Trackers Fetch and Actions
  const fetchTrackers = async () => {
    try {
      const res = await fetch("/api/trackers");
      const data = await res.json();
      setTrackers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Could not retrieve trackers:", e);
      setTrackers([]);
    }
  };

  const handleAddTracker = async (
    metricName: string, 
    value: number, 
    unit: string,
    taskTitle?: string,
    mindState?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metricName, value, unit, taskTitle, mindState, notes })
      });
      const newTracker = await res.json();
      setTrackers(prev => [...prev, newTracker]);
    } catch (e) {
      console.error("Failed to add tracker record:", e);
    }
  };

  const handleDeleteTracker = async (id: string) => {
    try {
      await fetch(`/api/trackers/${id}`, { method: "DELETE" });
      setTrackers(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Failed to delete tracker record:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      localStorage.removeItem("auth_token");
      setCurrentUser(null);
      // Clean up all local states on logout so next login is completely clean
      setTasks([]);
      setHabits([]);
      setNotes([]);
      setReminders([]);
      setTrackers([]);
      setProfile({
        peakHours: "Morning (09:00 - 12:00)",
        focusDuration: 25,
        currentEnergy: "High",
        streakDays: 1,
        totalFocusHours: 0,
      });
      setGeneralInsight("System initialized. Awaiting user parameters calibration.");
    }
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    await fetchConfig();
    await fetchProfile();
    await fetchTasks();
    await fetchNotes();
    await fetchInsight();
    await fetchReminders();
    await fetchTrackers();
    await fetchHabits();
  };

  const speakVoice = (text: string) => {
    if (isMuted) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      window.speechSynthesis.cancel();
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const handleVoiceSubmit = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    try {
      setVoiceProcessing(true);
      const res = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: textToProcess })
      });
      const data = await res.json();
      if (data.reply) {
        setVoiceReply(data.reply);
        speakVoice(data.reply);
      }
      await fetchTasks();
      await fetchNotes();
      await fetchInsight();
    } catch (e) {
      console.error("Failed to process speech command:", e);
    } finally {
      setVoiceProcessing(false);
    }
  };

  const updateProfileProperty = async (updates: Partial<ProductivityProfile>) => {
    try {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });
    } catch (e) {
      console.error("Failed to save profile updates:", e);
    }
  };

  const handleFocusComplete = async (
    focusedMinutes: number, 
    taskId?: string, 
    mindState?: string, 
    notes?: string
  ) => {
    try {
      const task = taskId ? tasks.find(t => t.id === taskId) : undefined;
      const taskTitle = task ? task.title : undefined;

      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricName: "Focus Session",
          value: focusedMinutes,
          unit: "mins",
          taskTitle,
          mindState,
          notes
        })
      });

      if (res.ok) {
        const newTracker = await res.json();
        setTrackers(prev => [...prev, newTracker]);
      } else {
        await handleAddTracker("Focus Session", focusedMinutes, "mins");
      }
      
      const gainedXp = focusedMinutes * 2;
      let newXp = (profile.xp || 10) + gainedXp;
      let newLevel = profile.level || 1;
      if (newXp >= 100) {
        newLevel += Math.floor(newXp / 100);
        newXp = newXp % 100;
        speakVoice(`Level upward trajectory logged. You are now level ${newLevel}.`);
      } else {
        speakVoice(`Focus interval complete. Acquired ${gainedXp} experience points.`);
      }

      await updateProfileProperty({
        totalFocusHours: (profile.totalFocusHours || 0) + (focusedMinutes / 60),
        xp: newXp,
        level: newLevel
      });

      if (taskId) {
        await handleToggleTaskStatus(taskId);
      }
    } catch (err) {
      console.error("Focus synchronization error:", err);
    }
  };

  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    deadline: string;
    duration: number;
    energyRequired: "Low" | "Medium" | "High";
    category: "Work" | "Personal" | "Health" | "Urgent" | "Other";
  }) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        await fetchTasks();
        await handlePrioritize();
      }
    } catch (e) {
      console.error("Failed to save task:", e);
    }
  };

  const handleToggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";

    if (newStatus === "completed") {
      // Optimistically remove the task from the state since it should be removed once ticked
      setTasks(prev => prev.filter(t => t.id !== id));

      const updatedStreak = (profile.streakDays || 1) + 1;
      const updatedFocus = Math.round(((profile.totalFocusHours || 0) + (task.duration / 60)) * 10) / 10;
      updateProfileProperty({ streakDays: updatedStreak, totalFocusHours: updatedFocus });
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }

    try {
      if (newStatus === "completed") {
        // Remove from the backend immediately on completion
        await fetch(`/api/tasks/${id}`, {
          method: "DELETE"
        });
      } else {
        await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
      }
      await fetchTasks();
    } catch (e) {
      console.error("Task update aborted:", e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      await fetchTasks();
    } catch (e) {
      console.error("Task deletion failed:", e);
    }
  };

  const handleAddNote = async (text: string) => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        await fetchNotes();
      }
    } catch (e) {
      console.error("Failed to add thought note:", e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      await fetchNotes();
    } catch (e) {
      console.error("Failed to delete note:", e);
    }
  };

  const handleConvertNoteToTask = async (noteId: string) => {
    setConvertingNoteId(noteId);
    try {
      const response = await fetch(`/api/notes/convert/${noteId}`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.message || `Excellent. Orbital has compiled note into your schedule.`;
        setVoiceReply(reply);
        speakVoice(reply);
        await fetchNotes();
        await fetchTasks();
        await handlePrioritize();
      }
    } catch (e) {
      console.error("Failed to convert thought note:", e);
    } finally {
      setConvertingNoteId(null);
    }
  };

  const handlePrioritize = async () => {
    try {
      setPrioritizing(true);
      const res = await fetch("/api/tasks/prioritize", { method: "POST" });
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
      if (data.generalInsight) setGeneralInsight(data.generalInsight);
    } catch (e) {
      console.error("Prioritization failure:", e);
    } finally {
      setPrioritizing(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#020410] flex items-center justify-center font-mono text-cyan-400">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Sidebar Menu Configuration
  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "ai-assistant", label: "AI Assistant", icon: Cpu },
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
    { key: "habits", label: "Habit Tracker", icon: CheckCircle2 },
    { key: "life-tracker", label: "Life Tracker", icon: Activity },
    { key: "reminders", label: "Reminders", icon: Bell },
    { key: "settings", label: "Settings", icon: Sliders }
  ];

  return (
    <div className="min-h-screen bg-[#020412] bg-radial-[at_top_right] from-[#0a0f35] via-[#020412] to-[#010208] flex text-gray-200 relative overflow-hidden">
      
      {/* Cosmic Floating Stars */}
      <FloatingStars />

      {/* Futuristic Soft Glowing Cosmic Nebulae Clouds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/8 rounded-full blur-[130px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: "14s" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-500/8 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: "18s" }} />
      <div className="absolute top-[35%] left-[25%] w-[40%] h-[40%] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-black/60 border-r border-white/5 font-mono select-none shrink-0 z-20">
        
        {/* Core Title Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-white/5">
          <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <span className="block text-sm font-bold tracking-widest text-white uppercase font-display">Orbital</span>
            <span className="block text-[8px] text-cyan-400 font-bold uppercase tracking-widest">Workspace v2.1</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveView(item.key as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm uppercase tracking-wider font-bold transition-all duration-300 border cursor-pointer hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                  isActive 
                    ? "bg-cyan-500 text-black border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.55)] scale-105 -translate-y-0.5" 
                    : "text-gray-400 border-transparent hover:text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_22px_rgba(6,182,212,0.25)]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account footer inside sidebar */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-black/40">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 font-sans">
              {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : currentUser.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-white truncate font-sans">{currentUser.fullName || currentUser.username}</span>
              <span className="block text-[9px] text-gray-500 truncate">{currentUser.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs uppercase tracking-wider font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Vaporize Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE RESPONSIVE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden font-mono">
          <div className="w-64 bg-[#020410] border-r border-white/10 h-full flex flex-col p-4 animate-slide-in relative">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg border border-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-8 mt-2 pb-4 border-b border-white/5">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">ORBITAL WORKSPACE</span>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveView(item.key as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-300 border cursor-pointer hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                      isActive 
                        ? "bg-cyan-500 text-black border-cyan-400/30 shadow-[0_0_16px_rgba(6,182,212,0.45)] scale-105 -translate-y-0.5" 
                        : "text-gray-400 border-transparent hover:text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_18px_rgba(6,182,212,0.2)]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-bold text-cyan-400 font-sans">
                  {currentUser.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate font-sans">{currentUser.fullName || currentUser.username}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-[10px] uppercase tracking-wider font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-16 bg-black/40 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg border border-white/10 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-xs sm:text-sm font-extrabold font-mono uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.45)] hidden sm:block">
              {menuItems.find(item => item.key === activeView)?.label}
            </h2>
          </div>

          {/* Time indicator and Dropdown profile menu */}
          <div className="flex items-center gap-5 font-mono">
            {/* Real-time IST status ticker */}
            <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-wider">
              <Clock className="w-3.5 h-3.5 text-gray-600 animate-pulse" />
              <span>IST: {formatIST(currentTime)}</span>
            </div>

            {/* User profile dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-400 font-sans">
                  {currentUser.username[0].toUpperCase()}
                </div>
                <span className="text-gray-300 font-medium hidden sm:inline max-w-[120px] truncate font-sans">
                  {currentUser.fullName || currentUser.username}
                </span>
              </button>

              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-[#04081b] border border-white/10 rounded-xl shadow-2xl p-2.5 z-20 space-y-1">
                    <div className="px-2.5 py-1.5 border-b border-white/5 pb-2 mb-1">
                      <span className="block text-[10px] text-gray-500 uppercase">Cognitive Mind:</span>
                      <span className="text-xs text-white font-bold font-sans truncate block">{currentUser.fullName || currentUser.username}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveView("settings");
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                    >
                      Settings Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/15 rounded-lg transition"
                    >
                      Logout Session
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CORE CONTENT PANE CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          
          {/* Active component view matching route tab */}
          <div className="max-w-7xl mx-auto pb-12">
            {activeView === "dashboard" && (
              <DashboardView
                currentUser={currentUser}
                profile={profile}
                tasks={tasks}
                habits={habits}
                onToggleHabit={handleToggleHabit}
                generalInsight={generalInsight}
                onFocusComplete={handleFocusComplete}
                onToggleTaskStatus={handleToggleTaskStatus}
                onDeleteTask={handleDeleteTask}
                onPrioritizeTasks={handlePrioritize}
                onUpdateProfile={updateProfileProperty}
                onAddTask={handleAddTask}
                onOpenAiAssistant={() => setActiveView("ai-assistant")}
              />
            )}

            {activeView === "ai-assistant" && (
              <AIAssistantView
                notes={notes}
                aiEnabled={aiEnabled}
                isListening={isListening}
                voiceTranscript={voiceTranscript}
                voiceReply={voiceReply}
                voiceProcessing={voiceProcessing}
                convertingNoteId={convertingNoteId}
                isMuted={isMuted}
                recognitionSupported={recognitionSupported}
                onStartListening={startListening}
                onStopListening={stopListening}
                onVoiceSubmit={handleVoiceSubmit}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onConvertNote={handleConvertNoteToTask}
                onToggleMuted={() => setIsMuted(!isMuted)}
                profile={profile}
              />
            )}

            {activeView === "calendar" && (
              <CalendarView
                tasks={tasks}
                onToggleStatus={handleToggleTaskStatus}
                onDelete={handleDeleteTask}
                onSelectDate={(dateString) => {
                  setActiveView("dashboard");
                }}
              />
            )}

            {activeView === "habits" && (
              <HabitTrackerView
                habits={habits}
                onAddHabit={handleAddHabit}
                onToggleHabit={handleToggleHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            )}

            {activeView === "life-tracker" && (
              <LifeTrackerView
                tasks={tasks}
                profile={profile}
                trackers={trackers}
                onAddTracker={handleAddTracker}
                onDeleteTracker={handleDeleteTracker}
              />
            )}

            {activeView === "reminders" && (
              <RemindersView
                reminders={reminders}
                tasks={tasks}
                onAddReminder={handleAddReminder}
                onToggleReminder={handleToggleReminder}
                onDeleteReminder={handleDeleteReminder}
                onTestAlarm={triggerSpokenAlarm}
              />
            )}

            {activeView === "settings" && (
              <SettingsView
                currentUser={currentUser}
                profile={profile}
                onUpdateProfile={updateProfileProperty}
              />
            )}
          </div>
        </main>
      </div>

      {/* 4. DYNAMIC VOICE-ACTIVATION ALARM CORE OVERLAY */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#04081c] border-2 border-pink-500/30 rounded-3xl p-8 space-y-6 text-white font-mono shadow-[0_0_50px_rgba(236,72,153,0.25)] text-center overflow-hidden">
            
            {/* Glowing top scanline bar */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 animate-pulse" />
            
            {/* Cyber Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] uppercase tracking-widest font-bold animate-pulse">
                <Bell className="w-3.5 h-3.5" />
                <span>{alarmStateText}</span>
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider text-white font-sans mt-2">
                Core System Interruption
              </h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                Orbital Spoken Alarm Protocol Activated
              </p>
            </div>

            {/* Pulsating Voice Core Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1.5 py-6">
              {[...Array(9)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 rounded-full bg-gradient-to-t from-pink-500 to-rose-400 transition-all duration-300 ${
                    isAlarmPlaying ? 'animate-bounce' : 'h-3'
                  }`}
                  style={{
                    height: isAlarmPlaying ? `${[24, 40, 56, 32, 48, 64, 36, 44, 20][i]}px` : '12px',
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>

            {/* Reminder Core Specs */}
            <div className="p-4 bg-black/50 border border-white/5 rounded-2xl text-left space-y-2">
              <span className="text-[9px] text-pink-400 uppercase tracking-widest font-bold block">
                Scheduled Objective:
              </span>
              <h3 className="text-base font-bold text-white font-sans leading-snug">
                {activeAlarm.title}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">
                Alert Time: {new Date(activeAlarm.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Assistant Voice Transcription Speech Script Bubble */}
            <div className="text-left bg-pink-950/10 border border-pink-500/10 rounded-2xl p-4 relative">
              <div className="absolute top-2 right-3 text-[8px] text-pink-400 font-bold uppercase tracking-wider">
                TTS Stream
              </div>
              <p className="text-xs text-gray-300 leading-relaxed italic font-sans pr-8">
                "{snoozeCount === 0 ? activeAlarm.greeting : activeAlarm.snoozeResponse}"
              </p>
            </div>

            {/* Interactive Response Terminal Controls */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Snooze option with strict coach override */}
              <button
                onClick={handleAlarmSnooze}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  snoozeCount >= 3 
                    ? 'border-gray-800 text-gray-600 bg-black/40 cursor-not-allowed'
                    : 'border-white/10 text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                }`}
                disabled={snoozeCount >= 3}
              >
                <span>Snooze Alert</span>
                <span className="block text-[8px] opacity-60 mt-0.5">
                  {snoozeCount >= 3 ? "SYSTEM LOCKED" : `Attempt ${snoozeCount}/3`}
                </span>
              </button>

              {/* Complete objective */}
              <button
                onClick={handleAlarmDone}
                className="py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(236,72,153,0.2)] cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span>Task Completed</span>
                <span className="block text-[8px] text-pink-100 uppercase tracking-widest">
                  Discharge Alarm
                </span>
              </button>
            </div>

            {/* Quick manual audio replay */}
            <button
              onClick={() => speakText(snoozeCount === 0 ? activeAlarm.greeting : activeAlarm.snoozeResponse)}
              className="text-[10px] text-pink-400 hover:text-pink-300 underline uppercase tracking-wider cursor-pointer"
            >
              Replay Audio Broadcast
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
