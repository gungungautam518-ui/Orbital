import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Mic, 
  MicOff, 
  RefreshCw, 
  FileText, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  Plus,
  Shield,
  Briefcase,
  GraduationCap,
  TrendingUp
} from "lucide-react";
import { ProductivityProfile } from "../types";

interface AIAssistantViewProps {
  notes: { id: string; text: string; createdAt: string }[];
  aiEnabled: boolean;
  isListening: boolean;
  voiceTranscript: string;
  voiceReply: string;
  voiceProcessing: boolean;
  convertingNoteId: string | null;
  isMuted: boolean;
  recognitionSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onVoiceSubmit: (text: string) => void;
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
  onConvertNote: (id: string) => void;
  onToggleMuted: () => void;
  profile?: ProductivityProfile;
}

export default function AIAssistantView({
  notes,
  aiEnabled,
  isListening,
  voiceTranscript,
  voiceReply,
  voiceProcessing,
  convertingNoteId,
  isMuted,
  recognitionSupported,
  onStartListening,
  onStopListening,
  onVoiceSubmit,
  onAddNote,
  onDeleteNote,
  onConvertNote,
  onToggleMuted,
  profile
}: AIAssistantViewProps) {
  const [inputText, setInputText] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onVoiceSubmit(inputText);
    setInputText("");
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText);
    setNewNoteText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-gray-200">
      
      {/* Left side: AI Voice & Chat */}
      <div className="lg:col-span-7 space-y-6">
        <div className="cyber-glass border border-cyan-500/20 rounded-2xl p-7 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-white/10 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              <div>
                <h2 className="text-lg font-bold text-white">
                  Aibi Chat Assistant
                </h2>
                <span className="block text-xs text-gray-400 mt-1">
                  Ask Aibi anything or plan your day
                </span>
              </div>
            </div>

            {/* Mute button */}
            <button
              onClick={onToggleMuted}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMuted 
                  ? "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/40" 
                  : "bg-cyan-950/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40"
              }`}
              title={isMuted ? "Unmute Assistant voice" : "Mute Assistant voice"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Active Persona Banner */}
          {(() => {
            const persona = profile?.persona || "professional";
            if (persona === "professional") {
              return (
                <div className="mb-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-cyan-300 block mb-0.5">Working Professional Persona Active</span>
                    <p className="text-gray-300 leading-normal">
                      Focus: Protecting <span className="font-semibold text-white">Deep Work</span> blocks, identifying and avoiding meeting overlaps, and extracting clear deliverables from transcripts.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setInputText("Extract key action items and protect deep work blocks")}
                        className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 transition-all cursor-pointer"
                      >
                        ⚡ Protect deep work blocks
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputText("What calendar conflicts or meeting overlaps do I have today?")}
                        className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 transition-all cursor-pointer"
                      >
                        ⚡ Check calendar conflicts
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else if (persona === "student") {
              return (
                <div className="mb-6 p-4 rounded-xl border border-purple-500/20 bg-purple-950/10 flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-purple-300 block mb-0.5">Student Persona Active</span>
                    <p className="text-gray-300 leading-normal">
                      Focus: Managing <span className="font-semibold text-white">Syllabus deadlines</span>, breaking down major papers into tiny milestones, and gamifying active-recall study loops.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setInputText("Generate an active-recall study quiz for my upcoming exams")}
                        className="px-2.5 py-1 rounded bg-purple-950/40 hover:bg-purple-950/80 border border-purple-500/30 text-[10px] text-purple-300 transition-all cursor-pointer"
                      >
                        ⚡ Active-recall exam quiz
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputText("Break down a major syllabus term paper into daily micro-milestones")}
                        className="px-2.5 py-1 rounded bg-purple-950/40 hover:bg-purple-950/80 border border-purple-500/30 text-[10px] text-purple-300 transition-all cursor-pointer"
                      >
                        ⚡ Paper milestone breakdown
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-amber-300 block mb-0.5">Business Owner Persona Active</span>
                    <p className="text-gray-300 leading-normal">
                      Focus: Prioritizing <span className="font-semibold text-white">Macro Priorities</span>, delegating secondary tasks, filtering low-impact items, and highlighting the Top 3 highest-leverage goals.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => setInputText("Show my top 3 highest-leverage actions and filter low-impact items")}
                        className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-950/80 border border-amber-500/30 text-[10px] text-amber-300 transition-all cursor-pointer"
                      >
                        ⚡ Top 3 highest-leverage actions
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputText("Generate a delegation tracking schedule to monitor macro operations")}
                        className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-950/80 border border-amber-500/30 text-[10px] text-amber-300 transition-all cursor-pointer"
                      >
                        ⚡ Delegation & macro operations
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })()}

          {/* Assistant conversation log area */}
          <div className="space-y-4 mb-6">
            
            {/* Robo message bubble */}
            <div className="bg-[#04081b]/80 border border-cyan-500/20 p-5 rounded-2xl relative">
              <div className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="block text-xs text-cyan-400 font-bold tracking-wider mb-1.5 pl-4">Aibi:</span>
              <p className="text-sm text-gray-100 leading-relaxed pl-4 font-medium">
                {voiceReply}
              </p>
            </div>

            {/* Listening state indicator */}
            {isListening && (
              <div className="bg-cyan-950/15 border border-cyan-500/30 p-5 rounded-2xl flex items-center gap-4 animate-pulse">
                <div className="flex gap-1 items-center shrink-0">
                  <span className="w-2.5 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2.5 h-6 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs text-cyan-400 font-bold">Listening...</span>
                  <p className="text-sm text-gray-400 italic truncate">{voiceTranscript}</p>
                </div>
              </div>
            )}
          </div>

          {/* Microphone trigger area */}
          <div className="flex flex-col items-center justify-center py-8 bg-black/45 rounded-xl border border-white/5 space-y-4 mb-6">
            {recognitionSupported ? (
              <>
                <button
                  onClick={isListening ? onStopListening : onStartListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                    isListening 
                      ? "bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]" 
                      : "bg-cyan-500/10 border-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  }`}
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <div className="text-center px-4">
                  <span className="block text-sm font-bold uppercase tracking-wider text-gray-200">
                    {isListening ? "I'm listening..." : "Tap to Speak"}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    {isListening ? "Click to submit voice recording" : "Try saying: 'Walk the dog today at 5pm' or 'Remind me to call John'"}
                  </p>
                </div>
              </>
            ) : (
              <div className="p-5 text-center">
                <MicOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400 font-bold uppercase">Microphone not supported</p>
                <p className="text-xs text-gray-400 mt-2">Please use the text terminal box below to message Aibi.</p>
              </div>
            )}
          </div>

          {/* Message form input */}
          <form onSubmit={handleSendText} className="flex gap-2.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="How can I help you today?"
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/60"
              disabled={voiceProcessing}
            />
            <button
              type="submit"
              className="px-5 bg-cyan-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition cursor-pointer shrink-0 text-sm"
              disabled={voiceProcessing}
            >
              {voiceProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right side: Notes */}
      <div className="lg:col-span-5 space-y-6">
        <div className="cyber-glass border border-white/5 rounded-2xl p-7 text-white space-y-5">
          
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-300" />
              Voice & Text Notes
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Quick thoughts waiting to be turned into tasks
            </p>
          </div>

          {/* Quick manual note form */}
          <form onSubmit={handleAddNoteSubmit} className="flex gap-2 bg-black/45 p-2 rounded-xl border border-white/10">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Save a quick note or idea..."
              className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none px-2"
            />
            <button
              type="submit"
              className="p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg cursor-pointer transition"
            >
              <Plus className="w-4 h-4 font-bold" />
            </button>
          </form>

          {/* List of notes */}
          {notes.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-gray-400">No notes saved yet.</p>
              <p className="text-xs text-gray-500 mt-1.5">Type or dictate a note to keep track of your ideas!</p>
            </div>
          ) : (
            <div className="space-y-4.5 max-h-[400px] overflow-y-auto pr-1">
              {notes.map(note => (
                <div key={note.id} className="p-4 bg-black/60 border border-white/15 rounded-xl flex flex-col justify-between gap-4 group relative hover:border-cyan-500/30 transition-all">
                  <p className="text-sm text-gray-200 leading-relaxed">{note.text}</p>
                  
                  <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-1.5 text-xs text-gray-400">
                    <span>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onConvertNote(note.id)}
                        disabled={convertingNoteId === note.id}
                        className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs text-cyan-300 rounded flex items-center gap-1.5 transition cursor-pointer"
                        title="Turn this note into a task"
                      >
                        {convertingNoteId === note.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>Create Task</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
