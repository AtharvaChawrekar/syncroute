"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import {
    Mic, Send, Plus, Search, MapPin, Clock, AlertTriangle, Sparkles,
    ChevronRight, User, Settings, LogOut, Plane, GripVertical,
    MessageSquare, Users, Edit3, Coffee, Mountain, Sunset, Ship,
    Camera, UtensilsCrossed, X
} from "lucide-react";

/* ───────────────── TYPES ───────────────── */

interface ItineraryActivity {
    time: string;
    activity: string;
    cost: string;
    icon: React.ReactNode;
    swapped?: boolean;
    aiAdded?: boolean;
}

interface ItineraryDay {
    id: number;
    day: string;
    title: string;
    icon: React.ReactNode;
    items: ItineraryActivity[];
    alert?: { type: string; text: string };
}

/* ───────────────── MOCK DATA ───────────────── */

const mockGroups = [
    { id: 1, name: "Goa Trip with College Bros", lastMsg: "@Safar find us a beach shack!", avatar: "🏖️", unread: 3, active: true },
    { id: 2, name: "Family Europe Tour", lastMsg: "Mom wants to visit the Louvre", avatar: "🇪🇺", unread: 0, active: false },
    { id: 3, name: "Solo Japan Adventure", lastMsg: "Exploring Kyoto temples tomorrow", avatar: "🗾", unread: 1, active: false },
    { id: 4, name: "Couples Bali Getaway", lastMsg: "Sunset dinner at Uluwatu?", avatar: "🌅", unread: 0, active: false },
];

const mockMessages = [
    { id: 1, user: "Rahul", avatar: "R", text: "Hey everyone! Let's finalize Goa plans", time: "10:30 AM", isAI: false },
    { id: 2, user: "Priya", avatar: "P", text: "I'm in! But can we keep budget under ₹15K per person?", time: "10:32 AM", isAI: false },
    { id: 3, user: "You", avatar: "Y", text: "@Safar generate an itinerary for us — make it relaxing for Mom but adventurous for Rahul.", time: "10:35 AM", isAI: false, isYou: true },
    { id: 4, user: "Safar AI", avatar: "✦", text: "Got it! I've analyzed everyone's profiles. Here's a balanced 4-day Goa itinerary. I've scheduled water sports in the morning when Rahul has peak energy, and reserved calm beach-side experiences for the afternoons. Budget optimized to ₹12,800/person. Check the itinerary panel →", time: "10:36 AM", isAI: true },
    { id: 5, user: "Rahul", avatar: "R", text: "This looks amazing! Can we swap the museum visit on Day 2 for jet skiing?", time: "10:40 AM", isAI: false },
    { id: 6, user: "Safar AI", avatar: "✦", text: "Done! I swapped the Goa State Museum visit with Jet Skiing at Baga Beach. This increases Rahul's satisfaction score but adds ₹800/person to the budget. The group consensus is still within range. Updated itinerary is live →", time: "10:41 AM", isAI: true },
];

const mockItinerary: ItineraryDay[] = [
    {
        id: 1, day: "Day 1", title: "Arrival & Beach Vibes", icon: <Plane className="w-4 h-4" />, items: [
            { time: "10:00 AM", activity: "Arrive at Goa Airport", cost: "—", icon: <Plane className="w-3.5 h-3.5" /> },
            { time: "12:00 PM", activity: "Check-in at Beachside Resort", cost: "₹3,200", icon: <Coffee className="w-3.5 h-3.5" /> },
            { time: "4:00 PM", activity: "Calangute Beach Sunset Walk", cost: "Free", icon: <Sunset className="w-3.5 h-3.5" /> },
            { time: "8:00 PM", activity: "Seafood Dinner at Fisherman's Wharf", cost: "₹1,500", icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
        ]
    },
    {
        id: 2, day: "Day 2", title: "Adventure & Culture", icon: <Mountain className="w-4 h-4" />, items: [
            { time: "7:00 AM", activity: "Jet Skiing at Baga Beach", cost: "₹1,800", icon: <Ship className="w-3.5 h-3.5" />, swapped: true },
            { time: "11:00 AM", activity: "Old Goa Churches Tour", cost: "₹200", icon: <Camera className="w-3.5 h-3.5" /> },
            { time: "4:00 PM", activity: "Spice Plantation Visit", cost: "₹600", icon: <Mountain className="w-3.5 h-3.5" /> },
            { time: "7:00 PM", activity: "Night Market Shopping", cost: "₹1,000", icon: <MapPin className="w-3.5 h-3.5" /> },
        ], alert: { type: "warning", text: "⚠️ Flight Delayed by 2 hours. @Safar has automatically shifted the museum tour to tomorrow." }
    },
    {
        id: 3, day: "Day 3", title: "Water & Wellness", icon: <Ship className="w-4 h-4" />, items: [
            { time: "6:30 AM", activity: "Sunrise Yoga on Beach", cost: "₹500", icon: <Coffee className="w-3.5 h-3.5" /> },
            { time: "10:00 AM", activity: "Scuba Diving at Grande Island", cost: "₹2,500", icon: <Ship className="w-3.5 h-3.5" /> },
            { time: "3:00 PM", activity: "Dudhsagar Waterfalls Trek", cost: "₹1,200", icon: <Mountain className="w-3.5 h-3.5" /> },
            { time: "7:30 PM", activity: "Sunset Kayaking (Added by @Safar)", cost: "₹900", icon: <Sunset className="w-3.5 h-3.5" />, aiAdded: true },
        ]
    },
];

/* ───────────────── COMPONENT ───────────────── */

export default function Dashboard() {
    const [isListening, setIsListening] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [itineraryOpen, setItineraryOpen] = useState(true);

    return (
        <div className="h-screen flex flex-col bg-[#F5F7FA] dark:bg-[#0D0D0D] font-sans transition-colors">

            {/* TOP NAV */}
            <header className="h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-[#141414]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-40 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer lg:hidden">
                        <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <a href="/" className="flex items-center gap-2 cursor-pointer">
                        <img src="/logo.png" alt="SyncRoute" className="h-7 w-7 object-contain" />
                        <span className="font-heading text-xl tracking-[0.15em] text-[#1A1A1A] dark:text-white hidden sm:inline">SYNC<span className="text-blue-500">ROUTE</span></span>
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <button onClick={() => setItineraryOpen(!itineraryOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer lg:hidden">
                        <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                        Y
                    </div>
                </div>
            </header>

            {/* 3-PANE BODY */}
            <div className="flex flex-1 overflow-hidden">

                {/* ─── LEFT SIDEBAR: CHATS & GROUPS ─── */}
                <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#111111] flex flex-col overflow-hidden shrink-0`}>
                    {/* Search */}
                    <div className="p-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                placeholder="Search conversations..."
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 font-sans transition-colors focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer gap-2 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4" /> New Group / Add Person
                        </Button>
                    </div>

                    {/* Group List */}
                    <div className="flex-1 overflow-y-auto px-2 space-y-1">
                        {mockGroups.map((g) => (
                            <button
                                key={g.id}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${g.active
                                    ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                                    : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-lg shrink-0">
                                    {g.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm font-semibold truncate ${g.active ? "text-blue-700 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"}`}>{g.name}</p>
                                        {g.unread > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{g.unread}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">{g.lastMsg}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* User Profile */}
                    <div className="p-3 border-t border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">Y</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">Yogesh</p>
                                <p className="text-[11px] text-gray-400 truncate">user@syncroute.demo</p>
                            </div>
                            <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0" />
                        </div>
                    </div>
                </aside>

                {/* ─── CENTER: CHAT INTERFACE ─── */}
                <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0D0D0D]">

                    {/* Chat Header */}
                    <div className="h-14 flex items-center justify-between px-6 bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🏖️</span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 dark:text-white">Goa Trip with College Bros</h2>
                                <p className="text-[11px] text-gray-400">4 members · Rahul, Priya, You +1</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                        {mockMessages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.isYou ? "justify-end" : ""}`}>
                                {!msg.isYou && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.isAI
                                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                        : "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300"
                                        }`}>
                                        {msg.avatar}
                                    </div>
                                )}
                                <div className={`max-w-[75%] ${msg.isYou ? "order-first" : ""}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-semibold ${msg.isAI ? "text-blue-500" : msg.isYou ? "text-gray-500 dark:text-gray-400 text-right w-full" : "text-gray-700 dark:text-gray-300"}`}>
                                            {msg.isAI && <Sparkles className="w-3 h-3 inline mr-1" />}
                                            {msg.user}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.isAI
                                        ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/15 dark:to-purple-500/15 border border-blue-200 dark:border-blue-500/20 text-gray-800 dark:text-gray-200"
                                        : msg.isYou
                                            ? "bg-blue-600 text-white rounded-br-md"
                                            : "bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-bl-md"
                                        }`}>
                                        {msg.text.split("@Safar").map((part, i, arr) => (
                                            <span key={i}>
                                                {part}
                                                {i < arr.length - 1 && <span className="text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded-md">@Safar</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input Area */}
                    <div className="px-4 pb-4 pt-2 bg-white dark:bg-[#141414] border-t border-gray-200 dark:border-white/5">
                        {/* Listening State */}
                        {isListening && (
                            <div className="flex items-center justify-center gap-3 py-3 mb-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20 animate-pulse">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <div key={i} className="w-1 bg-blue-500 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 8}px`, animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Listening...</span>
                                <button onClick={() => setIsListening(false)} className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer transition-colors">
                                    <X className="w-4 h-4 text-blue-500" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsListening(!isListening)}
                                className={`p-3.5 rounded-2xl transition-all duration-300 cursor-pointer shrink-0 ${isListening
                                    ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 scale-110"
                                    : "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:scale-105"
                                    }`}
                            >
                                <Mic className="w-5 h-5 text-white" />
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder='Type a message or say "@Safar" to invoke AI...'
                                    className="w-full h-12 px-5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 font-sans focus:ring-2 focus:ring-blue-500/30 transition-all"
                                />
                            </div>
                            <button className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-500/20 hover:scale-105 shrink-0">
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* ─── RIGHT: ITINERARY & AI INSIGHTS ─── */}
                <aside className={`${itineraryOpen ? 'w-96' : 'w-0'} transition-all duration-300 border-l border-gray-200 dark:border-white/5 bg-white dark:bg-[#111111] flex flex-col overflow-hidden shrink-0`}>

                    <div className="p-4 border-b border-gray-200 dark:border-white/5 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-heading text-xl text-gray-800 dark:text-white tracking-wide">ITINERARY</h3>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">Live</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">Goa Trip · 4 Days · ₹12,800/person</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {mockItinerary.map((day) => (
                            <div key={day.id}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        {day.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{day.day}</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{day.title}</p>
                                    </div>
                                </div>

                                {/* Alert Banner */}
                                {day.alert && (
                                    <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                                {day.alert.text.split("@Safar").map((part, i, arr) => (
                                                    <span key={i}>
                                                        {part}
                                                        {i < arr.length - 1 && <span className="text-blue-500 font-semibold">@Safar</span>}
                                                    </span>
                                                ))}
                                            </p>
                                            <button className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 hover:underline cursor-pointer">Click to view alternatives →</button>
                                        </div>
                                    </div>
                                )}

                                {/* Activity Items */}
                                <div className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 ml-3">
                                    {day.items.map((item, idx) => (
                                        <div key={idx} className={`relative flex items-start gap-3 p-3 rounded-xl transition-all group cursor-pointer ${item.swapped
                                            ? "bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15"
                                            : item.aiAdded
                                                ? "bg-purple-50/50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/15"
                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.02] border border-transparent"
                                            }`}>
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[1.15rem] top-4 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-[#111111]" />

                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-gray-400 font-medium">{item.time}</p>
                                                    {item.swapped && <span className="text-[9px] font-bold text-blue-500 bg-blue-100 dark:bg-blue-500/15 px-1.5 py-0.5 rounded">SWAPPED</span>}
                                                    {item.aiAdded && <span className="text-[9px] font-bold text-purple-500 bg-purple-100 dark:bg-purple-500/15 px-1.5 py-0.5 rounded">AI ADDED</span>}
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{item.activity}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.cost}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                                                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"><Edit3 className="w-3 h-3 text-gray-400" /></button>
                                                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"><GripVertical className="w-3 h-3 text-gray-400" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* AI Negotiation Card */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/15 dark:to-purple-500/15 border border-blue-200 dark:border-blue-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">@Safar Negotiation</p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                Skipped early morning trek to align with Group&apos;s energy levels; added <span className="text-purple-500 font-semibold">Sunset Kayaking</span> instead. Rahul&apos;s adventure score: 9/10. Mom&apos;s comfort score: 8/10.
                            </p>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
