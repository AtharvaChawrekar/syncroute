"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
    Mic, Send, Plus, Search, MapPin, AlertTriangle, Sparkles,
    Settings, Plane, GripVertical, MessageSquare, Users,
    Edit3, Coffee, Mountain, Ship, Camera, UtensilsCrossed,
    X, MoreVertical, Pin, Share2, Trash2, Type, UserPlus,
    CornerUpLeft, ChevronRight, Check, CloudRain, Clock, Download, Lock, Bell
} from "lucide-react";
import { useChatMessages, useTrips, useCurrentUser, useInvitations, type Trip, type Message } from "@/hooks/useSyncRoute";

/* ──────────────────────────────────────────────────────────────── */
/*  TYPES                                                           */
/* ──────────────────────────────────────────────────────────────── */

// ── Invitations (UI-only; wire to Supabase later) ──
interface Invitation {
    id: string;
    fromUsername: string;   // person who sent the invite
    tripName: string;       // name of the trip
    tripColor: string;      // accent colour for visual indicator
}

const MOCK_INVITATIONS: Invitation[] = [
    { id: "inv_1", fromUsername: "priya_travels", tripName: "Goa Trip with College Bros", tripColor: "#3b82f6" },
    { id: "inv_2", fromUsername: "aakash99", tripName: "Family Europe Tour", tripColor: "#a855f7" },
];


interface ItineraryActivity {
    time: string;
    activity: string;
    cost: string;
    icon: React.ReactNode;
    swapped?: boolean;
    aiAdded?: boolean;
    aiReason?: string;
    disrupted?: boolean;
    disruptedReplacement?: string;
}
interface ItineraryDay {
    id: number;
    day: string;
    title: string;
    icon: React.ReactNode;
    items: ItineraryActivity[];
    alert?: { type: string; text: string };
}

/* ──────────────────────────────────────────────────────────────── */
/*  INITIAL ITINERARY DATA                                          */
/* ──────────────────────────────────────────────────────────────── */

const INITIAL_ITINERARY: ItineraryDay[] = [
    {
        id: 1, day: "Day 1", title: "Arrival & Beach Vibes", icon: <Plane className="w-4 h-4" />, items: [
            { time: "10:00 AM", activity: "Arrive at Goa Airport", cost: "—", icon: <Plane className="w-3.5 h-3.5" />, aiReason: "Chose Dabolim over Mopa for closer proximity to group's hotel." },
            { time: "12:00 PM", activity: "Check-in at Beachside Resort", cost: "₹3,200", icon: <Coffee className="w-3.5 h-3.5" /> },
            { time: "4:00 PM", activity: "Calangute Beach Sunset Walk", cost: "Free", icon: <Ship className="w-3.5 h-3.5" />, aiReason: "Selected for Mom's relaxed pace preference." },
            { time: "8:00 PM", activity: "Seafood Dinner at Fisherman's Wharf", cost: "₹1,500", icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
        ]
    },
    {
        id: 2, day: "Day 2", title: "Adventure & Culture", icon: <Mountain className="w-4 h-4" />, items: [
            { time: "7:00 AM", activity: "Jet Skiing at Baga Beach", cost: "₹1,800", icon: <Ship className="w-3.5 h-3.5" />, swapped: true, aiReason: "Swapped museum visit per Rahul's preference. Adventure score +2." },
            { time: "11:00 AM", activity: "Old Goa Churches Tour", cost: "₹200", icon: <Camera className="w-3.5 h-3.5" /> },
            { time: "4:00 PM", activity: "Spice Plantation Visit", cost: "₹600", icon: <Mountain className="w-3.5 h-3.5" /> },
            { time: "7:00 PM", activity: "Night Market Shopping", cost: "₹1,000", icon: <MapPin className="w-3.5 h-3.5" /> },
        ]
    },
    {
        id: 3, day: "Day 3", title: "Water & Wellness", icon: <Ship className="w-4 h-4" />, items: [
            { time: "6:30 AM", activity: "Sunrise Yoga on Beach", cost: "₹500", icon: <Coffee className="w-3.5 h-3.5" /> },
            { time: "10:00 AM", activity: "Scuba Diving at Grande Island", cost: "₹2,500", icon: <Ship className="w-3.5 h-3.5" /> },
            { time: "3:00 PM", activity: "Dudhsagar Waterfalls Trek", cost: "₹1,200", icon: <Mountain className="w-3.5 h-3.5" /> },
            { time: "7:30 PM", activity: "Sunset Kayaking", cost: "₹900", icon: <Ship className="w-3.5 h-3.5" />, aiAdded: true, aiReason: "Added after skipping morning trek to align group energy levels." },
        ]
    },
];

/* ──────────────────────────────────────────────────────────────── */
/*  SMALL REUSABLE COMPONENTS                                       */
/* ──────────────────────────────────────────────────────────────── */

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.93, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.93, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-7"
            >
                <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
                {children}
            </motion.div>
        </div>
    );
}

function SafarTag() {
    return <span className="text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded-md mx-0.5">@Safar</span>;
}

function renderWithSafar(text: string) {
    return text.split("@Safar").map((part, i, arr) => (
        <span key={i}>{part}{i < arr.length - 1 && <SafarTag />}</span>
    ));
}

function GroupAvatar({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" }) {
    const letter = name.charAt(0).toUpperCase();
    const cls = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
    return (
        <div className={`${cls} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
            style={{ backgroundColor: color }}>
            {letter}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  SWIPEABLE MESSAGE ROW                                           */
/* ──────────────────────────────────────────────────────────────── */

function SwipeableMessage({ msg, onReply }: { msg: Message; onReply: (msg: Message) => void }) {
    const [swipeX, setSwipeX] = useState(0);
    const triggered = useRef(false);

    const handleDrag = (_: unknown, info: PanInfo) => {
        if (msg.isYou) return;
        const x = Math.max(0, Math.min(info.offset.x, 90));
        setSwipeX(x);
        if (x > 60 && !triggered.current) {
            triggered.current = true;
            onReply(msg);
        }
    };

    const handleDragEnd = () => {
        setSwipeX(0);
        triggered.current = false;
    };

    return (
        <div className="relative">
            {/* Reply hint icon revealed behind */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/15 transition-all"
                style={{ opacity: Math.min(swipeX / 60, 1), transform: `translateY(-50%) scale(${0.6 + (swipeX / 60) * 0.4})` }}
            >
                <CornerUpLeft className="w-4 h-4 text-blue-500" />
            </div>

            <motion.div
                drag={msg.isYou ? false : "x"}
                dragConstraints={{ left: 0, right: 80 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ x: swipeX }}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex gap-3 ${msg.isYou ? "justify-end" : ""}`}
                style={{ x: swipeX, touchAction: "pan-y" }}
            >
                {!msg.isYou && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${msg.isStreaming ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: msg.avatar_color, boxShadow: `0 2px 8px ${msg.avatar_color}40` }}>
                        {msg.avatar}
                    </div>
                )}
                <div className={`max-w-[75%] ${msg.isYou ? "" : ""}`}>
                    {msg.reply_to && (
                        <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border-l-2 border-blue-500 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-blue-500">{msg.reply_to.username}</span>: {msg.reply_to.text.slice(0, 60)}…
                        </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${msg.isAI ? "text-blue-500" : msg.isYou ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                            {msg.isAI && <Sparkles className="w-3 h-3 inline mr-1" />}
                            {msg.username}
                        </span>
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.isAI
                            ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/15 dark:to-purple-500/15 border border-blue-200 dark:border-blue-500/20 text-gray-800 dark:text-gray-200"
                            : msg.isYou
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                        }`}>
                        {msg.isStreaming && !msg.text ? (
                            /* Typing dots when no text yet */
                            <span className="flex items-center gap-1 h-4">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce"
                                        style={{ animationDelay: `${i * 120}ms` }} />
                                ))}
                            </span>
                        ) : (
                            <>
                                {renderWithSafar(msg.text)}
                                {msg.isStreaming && (
                                    /* Blinking cursor while tokens stream in */
                                    <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite]" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  MAIN DASHBOARD PAGE                                              */
/* ──────────────────────────────────────────────────────────────── */

const THEME_COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];
const ALL_INTERESTS = ["Adventure", "Food", "Photography", "Beach", "Culture", "Nightlife", "Nature", "History", "Wellness", "Shopping", "Trekking", "Diving"];

export default function Dashboard() {
    // ─── DATA HOOKS ────────────────────────────────────────────────
    const { user, profile, loading: authLoading, updateProfile } = useCurrentUser();
    // Non-null fallback so JSX doesn't need null-guards everywhere
    const safeProfile = profile ?? { id: "", username: "You", email: "", avatar_color: "#3b82f6", budget_pref: 65, pace_pref: 70, interests: [] as string[] };
    const { trips, loading: tripsLoading, addTrip, deleteTrip, addCollaborator, ensureSafarDM, refetchTrips } = useTrips(user?.id ?? null);

    // ─── SAFAR DM: ensure workspace trip exists and set as default ──
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [dmInitialized, setDmInitialized] = useState(false);
    useEffect(() => {
        // Wait until auth is resolved AND trips have finished loading
        if (!user || tripsLoading || dmInitialized) return;
        setDmInitialized(true); // run once per session
        const ws = trips.find(t => t.is_workspace);
        if (ws) {
            setActiveTripId(prev => prev ?? ws.id);
        } else {
            // New user: no DM yet — create it
            ensureSafarDM().then(id => {
                if (id) { setActiveTripId(prev => prev ?? id); refetchTrips(); }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, tripsLoading]);

    const activeTrip = activeTripId ?? "";
    const setActiveTrip = (id: string) => setActiveTripId(id);

    const activeTripData = trips.find(t => t.id === activeTrip);
    const isWorkspace = activeTripData?.is_workspace ?? false;

    const { messages, loading: msgsLoading, aiLoading, sendMessage } = useChatMessages(
        activeTrip || null,
        profile,
        isWorkspace,
    );


    // ─── UI STATE ──────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [itineraryOpen, setItineraryOpen] = useState(true);
    // Swipe-to-Reply
    const [replyTo, setReplyTo] = useState<Message | null>(null);

    // Dropdown menu
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Itinerary disruption state
    const [itinerary, setItinerary] = useState<ItineraryDay[]>(INITIAL_ITINERARY);
    const [activeDisruption, setActiveDisruption] = useState<string | null>(null);

    // @mention autocomplete
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);

    const MENTION_SUGGESTIONS = [
        { tag: "@Safar", keyword: "Safar", desc: "Your AI trip planner" },
        { tag: "@update", keyword: "update", desc: "Rebuild the itinerary" },
        { tag: "@budget", keyword: "budget", desc: "Optimize trip costs" },
        { tag: "@delay", keyword: "delay", desc: "Handle a disruption" },
        { tag: "@optimize", keyword: "optimize", desc: "Fine-tune the plan" },
    ];

    const filteredMentions = mentionQuery !== null
        ? MENTION_SUGGESTIONS.filter(s => s.keyword.toLowerCase().startsWith(mentionQuery.toLowerCase()))
        : [];

    // ─── MODAL STATE ───────────────────────────────────────────────
    const [modal, setModal] = useState<
        "createTrip" | "profile" | "addCollaborator" | "groupSettings" | "invitations" | null
    >(null);

    // Invitations (real Supabase)
    const { invitations, sendInvite, acceptInvitation, declineInvitation } = useInvitations(user?.id ?? null);
    const handleAcceptInvitation = (invId: string, tripId: string) => {
        if (!user) return;
        acceptInvitation(invId, tripId, user.id, refetchTrips);
    };
    const handleDeclineInvitation = (invId: string) => declineInvitation(invId);


    // Create trip form
    const [newTripName, setNewTripName] = useState("");
    const [newTripVibe, setNewTripVibe] = useState("");
    const [newTripColor, setNewTripColor] = useState(THEME_COLORS[0]);

    // Add collaborator form
    const [collaboratorName, setCollaboratorName] = useState("");

    // ─── HANDLERS ──────────────────────────────────────────────────
    const handleSend = () => {
        if (!messageInput.trim()) return;
        sendMessage(messageInput.trim(), replyTo ? { username: replyTo.username, text: replyTo.text } : null);
        setMessageInput("");
        setReplyTo(null);
        setMentionQuery(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMessageInput(val);
        // Detect '@' trigger: find last '@' and extract query after it
        const atIdx = val.lastIndexOf("@");
        if (atIdx !== -1 && (atIdx === 0 || val[atIdx - 1] === " ")) {
            const query = val.slice(atIdx + 1);
            // Only show if no space after @
            if (!query.includes(" ")) {
                setMentionQuery(query);
                return;
            }
        }
        setMentionQuery(null);
    };

    const insertMention = (tag: string) => {
        // Replace the partial @query with the full tag
        const atIdx = messageInput.lastIndexOf("@");
        const before = atIdx !== -1 ? messageInput.slice(0, atIdx) : messageInput;
        setMessageInput(before + tag + " ");
        setMentionQuery(null);
    };

    const handleCreateTrip = async () => {
        if (!newTripName.trim()) return;
        const newId = await addTrip(newTripName, newTripVibe, newTripColor);
        setNewTripName(""); setNewTripVibe(""); setNewTripColor(THEME_COLORS[0]);
        setModal(null);
        if (newId) setActiveTrip(newId);
    };

    const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "ok" | "not_found" | "already" | "error">("idle");
    const handleAddCollaborator = async () => {
        if (!collaboratorName.trim() || !user || !activeTrip) return;
        setInviteStatus("sending");
        const result = await sendInvite(activeTrip, user.id, collaboratorName.trim());
        setInviteStatus(result);
        if (result === "ok") {
            setTimeout(() => { setCollaboratorName(""); setModal(null); setInviteStatus("idle"); }, 1200);
        }
    };

    const simulateDisruption = (type: "rain" | "delay") => {
        if (activeDisruption === type) {
            setItinerary(INITIAL_ITINERARY);
            setActiveDisruption(null);
            return;
        }
        setActiveDisruption(type);
        if (type === "delay") {
            setItinerary(prev => prev.map(day =>
                day.id === 1 ? {
                    ...day, alert: { type: "warning", text: "⚠️ Flight Delayed by 2hrs. @Safar has shifted Check-in and rescheduled afternoon activities." },
                    items: day.items.map((item, i) =>
                        i === 1 ? { ...item, disrupted: true, disruptedReplacement: "Late Check-in — Rescheduled to 3:00 PM" }
                            : item
                    )
                } : day
            ));
        } else {
            setItinerary(prev => prev.map(day =>
                day.id === 3 ? {
                    ...day, alert: { type: "rain", text: "🌧️ Heavy Rain expected on Day 3. @Safar has swapped outdoor activities for indoor alternatives." },
                    items: day.items.map((item, i) =>
                        i === 1 ? { ...item, disrupted: true, disruptedReplacement: "Replaced with: Goa State Museum Tour (₹200)" }
                            : i === 2 ? { ...item, disrupted: true, disruptedReplacement: "Replaced with: Cooking Class at Spice Garden (₹800)" }
                                : item
                    )
                } : day
            ));
        }
    };

    const activeTripData2 = trips.find(t => t.id === activeTrip);
    // ─── DERIVED STATE ─────────────────────────────────────────────
    const isSafarDM = activeTripData?.is_workspace ?? false;
    const isShared = (activeTripData?.members.length ?? 0) > 1;
    // Members excluding current user for subtitle display
    const otherMembers = activeTripData?.members.filter(m => m !== profile?.username) ?? [];
    void activeTripData2; // suppress lint if unused

    return (
        <div className="h-screen flex flex-col bg-[#F5F7FA] dark:bg-[#0D0D0D] font-sans transition-colors" onClick={() => setOpenDropdown(null)}>

            {/* ╔══════════════════ TOP NAV ══════════════════╗ */}
            <header className="h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-[#141414]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-40 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                        <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <a href="/" className="flex items-center gap-2 cursor-pointer">
                        <img src="/logo.png" alt="SyncRoute" className="h-7 w-7 object-contain" />
                        <span className="font-heading text-xl tracking-[0.15em] text-[#1A1A1A] dark:text-white hidden sm:inline">SYNC<span className="text-blue-500">ROUTE</span></span>
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <button onClick={() => setItineraryOpen(!itineraryOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                        <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button onClick={() => setModal("profile")}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer ring-2 ring-blue-500/30 hover:ring-blue-500 transition-all"
                        style={{ backgroundColor: profile?.avatar_color ?? "#3b82f6" }}>
                        {(profile?.username ?? "?").charAt(0)}
                    </button>
                </div>
            </header>

            {/* ╔══════════════════ 3-PANE BODY ══════════════════╗ */}
            <div className="flex flex-1 overflow-hidden">

                {/* ════════════ LEFT SIDEBAR ════════════ */}
                <AnimatePresence initial={false}>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 304, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#111111] flex flex-col overflow-hidden shrink-0"
                        >
                            {/* Search */}
                            <div className="p-4 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input placeholder="Search trips…"
                                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/30 transition-colors" />
                                </div>
                                <button onClick={() => setModal("createTrip")}
                                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02]">
                                    <Plus className="w-4 h-4" /> New Trip
                                </button>
                            </div>

                            {/* ── WORKSPACE (pinned Safar DM) ── */}
                            <div className="px-4 pb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Workspace</p>
                                {trips.filter(t => t.id === "safarDM").map(g => (
                                    <div key={g.id}
                                        onClick={() => setActiveTrip(g.id)}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${g.id === activeTrip
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                                            : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                                            }`}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: g.color }}>
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${g.id === activeTrip ? "text-indigo-600 dark:text-indigo-400" : "text-gray-800 dark:text-gray-200"}`}>{g.name}</p>
                                            <p className="text-[11px] text-gray-400 truncate">Private AI scratchpad</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── YOUR TRIPS ── */}
                            <div className="px-4 pt-3 pb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Your Trips</p>
                            </div>
                            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                                {trips.filter(t => t.id !== "safarDM").map((g) => (
                                    <div key={g.id} className={`relative flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${g.id === activeTrip
                                        ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                                        : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"}`}
                                        onClick={() => setActiveTrip(g.id)}>
                                        <GroupAvatar name={g.name} color={g.color} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-sm font-semibold truncate ${g.id === activeTrip ? "text-blue-700 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"}`}>{g.name}</p>
                                                {/* Private / Shared indicator */}
                                                {g.members.length === 1
                                                    ? <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                                                    : <Users className="w-3 h-3 text-blue-400 shrink-0" />}
                                                {g.unread > 0 && <span className="ml-auto w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{g.unread}</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{g.lastMsg}</p>
                                        </div>
                                        {/* 3-dot context menu */}
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setOpenDropdown(openDropdown === g.id ? null : g.id)}
                                                className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-gray-200 dark:hover:bg-white/10 transition-all cursor-pointer">
                                                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                            <AnimatePresence>
                                                {openDropdown === g.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                        className="absolute right-0 top-8 z-20 w-40 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                                    >
                                                        {[
                                                            { icon: <Pin className="w-3.5 h-3.5" />, label: "Pin" },
                                                            { icon: <Share2 className="w-3.5 h-3.5" />, label: "Share" },
                                                            { icon: <Type className="w-3.5 h-3.5" />, label: "Rename" },
                                                            { icon: <Trash2 className="w-3.5 h-3.5" />, label: "Delete", danger: true, action: () => deleteTrip(g.id) },
                                                        ].map(item => (
                                                            <button key={item.label}
                                                                onClick={() => { item.action?.(); setOpenDropdown(null); }}
                                                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${(item as { danger?: boolean }).danger ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                                                                {item.icon}{item.label}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Invitations button (above profile) ── */}
                            <div className="px-4 pb-2">
                                <button
                                    onClick={() => setModal("invitations")}
                                    className="w-full h-10 flex items-center justify-center gap-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02] relative"
                                >
                                    <div className="relative shrink-0">
                                        <Bell className="w-4 h-4 text-white" />
                                        {invitations.length > 0 && (
                                            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-blue-600">
                                                {invitations.length}
                                            </span>
                                        )}
                                    </div>
                                    <span>View Invitations</span>
                                </button>
                            </div>


                            {/* User Profile snippet */}
                            <div className="p-3 border-t border-gray-200 dark:border-white/5">
                                <button onClick={() => setModal("profile")}
                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: profile?.avatar_color ?? "#3b82f6" }}>
                                        {(profile?.username ?? "?").charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{profile?.username ?? "You"}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{profile?.email ?? ""}</p>
                                    </div>
                                    <Settings className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ════════════ CENTER: CHAT ════════════ */}
                <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0D0D0D]">

                    {/* Chat Header — 3 dynamic states */}
                    <div className="h-14 flex items-center justify-between px-5 bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            {isSafarDM ? (
                                /* State A: Safar DM */
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#6366f1" }}>
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            ) : (
                                activeTripData && <GroupAvatar name={activeTripData.name} color={activeTripData.color} size="sm" />
                            )}
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 dark:text-white">
                                    {isSafarDM ? "Safar AI Assistant" : activeTripData?.name ?? "Chat"}
                                </h2>
                                <p className="text-[11px] text-gray-400">
                                    {isSafarDM
                                        ? "Always here to brainstorm."
                                        : isShared
                                            ? `Members: You${otherMembers.length > 0 ? ", " + otherMembers.join(", ") : ""}`
                                            : "Only you"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {!isSafarDM && (
                                <>
                                    {/* Add Collaborator — prominent when private, subtle when shared */}
                                    <button onClick={() => setModal("addCollaborator")}
                                        title="Add Collaborator"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${!isShared
                                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25"
                                            : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400"
                                            }`}>
                                        <UserPlus className="w-4 h-4" />
                                        {!isShared && <span className="text-xs font-semibold hidden sm:inline">Invite</span>}
                                    </button>
                                    <button onClick={() => setModal("groupSettings")}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer" title="Trip Settings">
                                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                        {messages.map((msg) => (
                            <SwipeableMessage key={msg.id} msg={msg} onReply={setReplyTo} />
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="px-4 pb-4 pt-2 bg-white dark:bg-[#141414] border-t border-gray-200 dark:border-white/5 space-y-2">
                        {/* Reply Preview */}
                        <AnimatePresence>
                            {replyTo && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 overflow-hidden"
                                >
                                    <CornerUpLeft className="w-4 h-4 text-blue-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Replying to {replyTo.username}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyTo.text.slice(0, 70)}…</p>
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer">
                                        <X className="w-3.5 h-3.5 text-blue-500" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Listening waveform */}
                        <AnimatePresence>
                            {isListening && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                                >
                                    <div className="flex items-center gap-0.5">
                                        {[14, 22, 18, 28, 16, 24, 12, 20].map((h, i) => (
                                            <motion.div key={i} className="w-1 bg-blue-500 rounded-full"
                                                animate={{ height: [h, h * 1.8, h] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
                                                style={{ height: h }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Listening…</span>
                                    <button onClick={() => setIsListening(false)} className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer">
                                        <X className="w-4 h-4 text-blue-500" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsListening(!isListening)}
                                className={`p-3.5 rounded-2xl transition-all duration-300 cursor-pointer shrink-0 ${isListening
                                    ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                                    : "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-lg shadow-blue-500/30"}`}
                            >
                                <Mic className="w-5 h-5 text-white" />
                            </motion.button>
                            <div className="flex-1 relative">
                                {/* @Mention suggestion popup */}
                                <AnimatePresence>
                                    {mentionQuery !== null && filteredMentions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                                            className="absolute bottom-full mb-2 left-0 right-0 z-30 bg-white/95 dark:bg-[#1E1E1E]/98 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                        >
                                            <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mentions</p>
                                            {filteredMentions.map((s, i) => (
                                                <button
                                                    key={s.tag}
                                                    onClick={() => insertMention(s.tag)}
                                                    className={`w-full flex items-center justify-between gap-4 px-4 py-2.5 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10 ${i < filteredMentions.length - 1 ? "border-b border-gray-100 dark:border-white/5" : ""
                                                        }`}
                                                >
                                                    <span className="font-semibold text-sm text-blue-600 dark:text-blue-400">{s.tag}</span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.desc}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <input
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    onKeyDown={e => {
                                        if (e.key === "Escape") { setMentionQuery(null); return; }
                                        if (e.key === "Enter" && mentionQuery === null) handleSend();
                                    }}
                                    placeholder='Type a message or say "@Safar plan my day…"'
                                    className="w-full h-12 px-5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
                                />
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSend}
                                className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-500/20 shrink-0"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </motion.button>
                        </div>
                    </div>
                </main>

                {/* ════════════ RIGHT: ITINERARY ════════════ */}
                <AnimatePresence initial={false}>
                    {itineraryOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 380, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="border-l border-gray-200 dark:border-white/5 bg-white dark:bg-[#111111] flex flex-col overflow-hidden shrink-0"
                        >
                            {/* Itinerary Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-white/5 shrink-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-heading text-xl text-gray-800 dark:text-white tracking-wide">ITINERARY</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-500/20 animate-pulse">● Live</span>
                                        {/* Itinerary 3-dot menu */}
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === "itinerary" ? null : "itinerary")}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer opacity-60 hover:opacity-100"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                            <AnimatePresence>
                                                {openDropdown === "itinerary" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                        className="absolute right-0 top-9 z-30 w-48 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                                                    >
                                                        {[
                                                            { icon: <Download className="w-3.5 h-3.5" />, label: "Download PDF", action: () => { /* TODO: PDF logic */ } },
                                                        ].map(item => (
                                                            <button key={item.label}
                                                                onClick={() => { item.action?.(); setOpenDropdown(null); }}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                                                {item.icon}{item.label}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">Goa Trip · 4 Days · ₹12,800/person</p>

                                {/* Disruption Simulation Chips */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => simulateDisruption("rain")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${activeDisruption === "rain"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-blue-300"}`}>
                                        <CloudRain className="w-3.5 h-3.5" /> Simulate Rain
                                    </button>
                                    <button
                                        onClick={() => simulateDisruption("delay")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${activeDisruption === "delay"
                                            ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30"
                                            : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-amber-300"}`}>
                                        <Clock className="w-3.5 h-3.5" /> Flight Delay
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {itinerary.map((day) => (
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
                                        <AnimatePresence>
                                            {day.alert && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2 overflow-hidden"
                                                >
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                                            {renderWithSafar(day.alert.text)}
                                                        </p>
                                                        <button className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 hover:underline cursor-pointer">View alternatives →</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Activity Timeline */}
                                        <div className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 ml-3">
                                            {day.items.map((item, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    layout
                                                    className={`relative flex flex-col gap-1.5 p-3 rounded-xl transition-all group cursor-pointer ${item.disrupted
                                                        ? "bg-amber-50 dark:bg-amber-500/8 border border-amber-300 dark:border-amber-500/30"
                                                        : item.swapped
                                                            ? "bg-blue-50/60 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15"
                                                            : item.aiAdded
                                                                ? "bg-purple-50/60 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/15"
                                                                : "hover:bg-gray-50 dark:hover:bg-white/[0.025] border border-transparent"}`}
                                                >
                                                    <div className="absolute -left-[1.15rem] top-4 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#111111]"
                                                        style={{ backgroundColor: item.disrupted ? "#f59e0b" : "#3b82f6" }} />

                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.disrupted ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600" : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"}`}>
                                                            {item.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-xs text-gray-400 font-medium">{item.time}</p>
                                                                {item.swapped && <span className="text-[9px] font-bold text-blue-500 bg-blue-100 dark:bg-blue-500/15 px-1.5 py-0.5 rounded">SWAPPED</span>}
                                                                {item.aiAdded && <span className="text-[9px] font-bold text-purple-500 bg-purple-100 dark:bg-purple-500/15 px-1.5 py-0.5 rounded">AI ADDED</span>}
                                                                {item.disrupted && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">DISRUPTED</span>}
                                                            </div>
                                                            <p className={`text-sm font-medium mt-0.5 ${item.disrupted ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>{item.activity}</p>
                                                            {item.disrupted && item.disruptedReplacement && (
                                                                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                                                                    <Check className="w-3 h-3" /> {item.disruptedReplacement}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-400 mt-0.5">{item.cost}</p>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                                                            <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"><Edit3 className="w-3 h-3 text-gray-400" /></button>
                                                            <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"><GripVertical className="w-3 h-3 text-gray-400" /></button>
                                                        </div>
                                                    </div>

                                                    {/* AI Reason inline callout */}
                                                    {item.aiReason && (
                                                        <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/8 border border-blue-100 dark:border-blue-500/15">
                                                            <Sparkles className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                                            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-snug">
                                                                🤖 @Safar Decision: {item.aiReason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* AI Negotiation Summary Card */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/15 dark:to-purple-500/15 border border-blue-200 dark:border-blue-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-blue-500" />
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">@Safar Negotiation</p>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        Skipped early morning trek to align with group&apos;s energy levels; added{" "}
                                        <span className="text-purple-500 font-semibold">Sunset Kayaking</span> instead.
                                        Rahul&apos;s adventure score: 9/10 · Mom&apos;s comfort score: 8/10.
                                    </p>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* ╔══════════════════ MODALS ══════════════════╗ */}

            {/* Create Trip */}
            <Modal open={modal === "createTrip"} onClose={() => setModal(null)}>
                <h2 className="font-heading text-2xl text-gray-900 dark:text-white mb-1">New Trip</h2>
                <p className="text-sm text-gray-500 mb-6">Start planning — private by default. Invite collaborators anytime.</p>
                <div className="space-y-5">
                    <input value={newTripName} onChange={e => setNewTripName(e.target.value)} placeholder="Trip Title (e.g. Goa 2026)"
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <input value={newTripVibe} onChange={e => setNewTripVibe(e.target.value)} placeholder="Vibe (e.g. Beach & adventure)"
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <div className="pt-1">
                        <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">Color</p>
                        <div className="flex gap-3 flex-wrap">
                            {THEME_COLORS.map(c => (
                                <button key={c} onClick={() => setNewTripColor(c)}
                                    className="w-9 h-9 rounded-full cursor-pointer transition-all hover:scale-110 ring-offset-2 dark:ring-offset-[#1A1A1A]"
                                    style={{ backgroundColor: c, boxShadow: newTripColor === c ? `0 0 0 3px ${c}` : "none" }} />
                            ))}
                        </div>
                    </div>
                    <div className="pt-1 space-y-3">
                        <button onClick={handleCreateTrip}
                            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" /> Create Private Trip
                        </button>
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed px-2">
                            Note: Your trip starts as a private space. You can always add members later by inviting them as collaborators from the trip header.
                        </p>
                    </div>
                </div>
            </Modal>


            {/* My Travel Profile */}
            <Modal open={modal === "profile"} onClose={() => setModal(null)}>
                <h2 className="font-heading text-2xl text-gray-900 dark:text-white mb-1">My Travel Profile</h2>
                <p className="text-sm text-gray-500 mb-5">@Safar uses these preferences when building your itinerary.</p>
                <div className="space-y-5">
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Budget</p>
                            <span className="text-sm text-blue-500 font-bold">₹{Math.round(safeProfile.budget_pref * 200 + 5000).toLocaleString()}/day</span>
                        </div>
                        <input type="range" min={0} max={100} value={safeProfile.budget_pref}
                            onChange={e => updateProfile({ budget_pref: Number(e.target.value) })}
                            className="w-full accent-blue-500 cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Budget</span><span>Luxury</span></div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Travel Pace</p>
                            <span className="text-sm text-blue-500 font-bold">{safeProfile.pace_pref < 40 ? "Relaxed" : safeProfile.pace_pref < 70 ? "Balanced" : "Fast-paced"}</span>
                        </div>
                        <input type="range" min={0} max={100} value={safeProfile.pace_pref}
                            onChange={e => updateProfile({ pace_pref: Number(e.target.value) })}
                            className="w-full accent-blue-500 cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Chill</span><span>Explorer</span></div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Interests</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_INTERESTS.map(interest => {
                                const active = safeProfile.interests.includes(interest);
                                return (
                                    <button key={interest}
                                        onClick={() => updateProfile({ interests: active ? safeProfile.interests.filter(i => i !== interest) : [...safeProfile.interests, interest] })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${active ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-blue-300"}`}>
                                        {interest}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={() => setModal(null)}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/25">
                        Save Profile
                    </button>
                </div>
            </Modal>

            {/* Add Collaborator */}
            <Modal open={modal === "addCollaborator"} onClose={() => setModal(null)}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="font-heading text-2xl text-gray-900 dark:text-white">Invite Someone</h2>
                        <p className="text-xs text-gray-400">This trip is currently private</p>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-5 mt-2">Enter their SyncRoute username to upgrade this trip to a shared space.</p>
                <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                        <input
                            value={collaboratorName}
                            onChange={e => setCollaboratorName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddCollaborator()}
                            placeholder="username"
                            className="w-full h-11 pl-8 pr-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    {inviteStatus === "not_found" && <p className="text-xs text-red-400 text-center">User not found. Check the username and try again.</p>}
                    {inviteStatus === "already" && <p className="text-xs text-amber-400 text-center">Invite already sent to this user.</p>}
                    {inviteStatus === "ok" && <p className="text-xs text-green-400 text-center">Invite sent! ✓</p>}
                    <button onClick={handleAddCollaborator} disabled={inviteStatus === "sending"}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                        {inviteStatus === "sending" ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {inviteStatus === "sending" ? "Sending…" : "Send Invite"}
                    </button>
                </div>
            </Modal>

            {/* ── Invitations ── */}
            <Modal open={modal === "invitations"} onClose={() => setModal(null)}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-amber-500" />
                        </div>
                        {invitations.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                {invitations.length}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="font-heading text-2xl text-gray-900 dark:text-white">Trip Invitations</h2>
                        <p className="text-xs text-gray-400">People who want to plan with you</p>
                    </div>
                </div>

                {invitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                            <Bell className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            You&apos;re all caught up!<br />
                            <span className="text-xs text-gray-400">No pending invitations.</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {invitations.map(inv => (
                                <motion.div
                                    key={inv.id}
                                    layout
                                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -40, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors"
                                >
                                    {/* Trip color avatar */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                                        style={{ backgroundColor: inv.tripColor }}
                                    >
                                        {inv.tripName.charAt(0)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">@{inv.fromUsername}</p>
                                        <p className="text-xs text-gray-400 truncate">invited you to &ldquo;{inv.tripName}&rdquo;</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleDeclineInvitation(inv.id)}
                                            title="Decline"
                                            className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAcceptInvitation(inv.id, inv.trip_id)}
                                            title="Accept"
                                            className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 pt-1">
                            Accepting adds the trip to your sidebar.
                        </p>
                    </div>
                )}
            </Modal>

            {/* Group Settings */}
            <Modal open={modal === "groupSettings"} onClose={() => setModal(null)}>
                <h2 className="font-heading text-2xl text-gray-900 dark:text-white mb-1">Group Settings</h2>
                <p className="text-sm text-gray-500 mb-5">Edit this group&apos;s details.</p>
                <div className="space-y-3">
                    <input defaultValue={activeTripData?.name} placeholder="Group Title"
                        className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <input defaultValue={activeTripData?.description} placeholder="Description"
                        className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <div>
                        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Theme Color</p>
                        <div className="flex gap-2">{THEME_COLORS.map(c => <button key={c} className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-all" style={{ backgroundColor: c }} />)}</div>
                    </div>
                    <button onClick={() => setModal(null)}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/25">
                        Save Changes
                    </button>
                </div>
            </Modal>
        </div>
    );
}
