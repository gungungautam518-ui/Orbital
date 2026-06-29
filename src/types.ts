export interface Task {
  id: string;
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

export interface ProductivityProfile {
  peakHours: string;
  focusDuration: number; // in minutes
  currentEnergy: 'Low' | 'Medium' | 'High';
  streakDays: number;
  totalFocusHours: number;
  level?: number;
  xp?: number;
  completedQuests?: number;
  unlockedBadges?: string[];
  persona?: 'professional' | 'student' | 'business';
}

export interface User {
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
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
  location?: string;
  energyRequired?: 'Low' | 'Medium' | 'High';
  dependentTaskId?: string;
}

export interface TrackerNode {
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

export interface LifeNode {
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

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  streak: number;
  completedDays: string[]; // array of 'YYYY-MM-DD' strings
  createdAt: string;
}

export interface Suggestion {
  id: string;
  text: string;
  applied: boolean;
  category?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color: string;
  date: string;
}



