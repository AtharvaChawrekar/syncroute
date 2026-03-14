"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Search, Plane, Train, Bus, Hotel, Home, MapPin, Car, Bike,
    Star, Clock, DollarSign, AlertTriangle, TrendingUp, Sparkles,
    ChevronDown, ChevronUp, Shield, Loader2, Users, Calendar,
    ThumbsUp, Zap, Eye, CloudRain, Info, CheckCircle,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────── */
/*  TYPES                                                            */
/* ──────────────────────────────────────────────────────────────── */

interface TransportOption {
    id: string; mode: string; provider: string; route: string;
    price: string; duration: string; departure: string; arrival: string;
    class: string; convenience_score: number; tags: string[];
    is_recommended: boolean; recommendation_reason: string | null;
}

interface StayOption {
    id: string; type: string; name: string; location: string;
    price_per_night: string; total_price: string; rating: number;
    reviews: number; amenities: string[]; convenience_score: number;
    tags: string[]; is_recommended: boolean; recommendation_reason: string | null;
}

interface LocalTransportOption {
    id: string; type: string; provider: string; description: string;
    price: string; price_unit: string; convenience_score: number;
    tags: string[]; is_recommended: boolean; recommendation_reason: string | null;
}

interface HiddenInsight {
    type: string; severity: string; title: string; description: string;
}

interface AIRecommendation {
    transport: string; stay: string; local_transport: string;
    total_estimated_cost: string; reasoning: string;
}

interface ResearchData {
    destination: string; travel_period: string; summary: string;
    transport: TransportOption[]; stays: StayOption[];
    local_transport: LocalTransportOption[];
    hidden_insights: HiddenInsight[];
    ai_recommendation: AIRecommendation;
}

/* ──────────────────────────────────────────────────────────────── */
/*  HELPERS                                                          */
/* ──────────────────────────────────────────────────────────────── */

const modeIcon = (mode: string) => {
    switch (mode) {
        case "flight": return <Plane className="w-4 h-4" />;
        case "train": return <Train className="w-4 h-4" />;
        case "bus": return <Bus className="w-4 h-4" />;
        default: return <MapPin className="w-4 h-4" />;
    }
};

const stayIcon = (type: string) => {
    switch (type) {
        case "hotel": case "resort": return <Hotel className="w-4 h-4" />;
        case "airbnb": return <Home className="w-4 h-4" />;
        default: return <Hotel className="w-4 h-4" />;
    }
};

const localIcon = (type: string) => {
    switch (type) {
        case "car_rental": return <Car className="w-4 h-4" />;
        case "bike_rental": return <Bike className="w-4 h-4" />;
        case "uber": return <Car className="w-4 h-4" />;
        default: return <Car className="w-4 h-4" />;
    }
};

const insightIcon = (type: string) => {
    switch (type) {
        case "seasonal_price": return <TrendingUp className="w-4 h-4" />;
        case "peak_period": return <AlertTriangle className="w-4 h-4" />;
        case "availability": return <Eye className="w-4 h-4" />;
        case "weather": return <CloudRain className="w-4 h-4" />;
        case "local_tip": return <Info className="w-4 h-4" />;
        case "safety": return <Shield className="w-4 h-4" />;
        default: return <Info className="w-4 h-4" />;
    }
};

const severityColor = (s: string) => {
    switch (s) {
        case "alert": return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#f87171", icon: "#ef4444" };
        case "warning": return { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#fbbf24", icon: "#f59e0b" };
        default: return { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.15)", text: "#93c5fd", icon: "#3b82f6" };
    }
};

const tagColor = (tag: string) => {
    if (tag.includes("Cheapest") || tag.includes("Budget")) return { bg: "#22c55e20", text: "#4ade80", border: "#22c55e30" };
    if (tag.includes("Fastest")) return { bg: "#3b82f620", text: "#60a5fa", border: "#3b82f630" };
    if (tag.includes("Best") || tag.includes("Recommended")) return { bg: "#f9731620", text: "#fb923c", border: "#f9731630" };
    if (tag.includes("Premium") || tag.includes("Comfortable")) return { bg: "#a855f720", text: "#c084fc", border: "#a855f730" };
    if (tag.includes("Group") || tag.includes("Flexible")) return { bg: "#06b6d420", text: "#22d3ee", border: "#06b6d430" };
    return { bg: "#ffffff08", text: "#9ca3af", border: "#ffffff10" };
};

function ConvenienceBar({ score }: { score: number }) {
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  COMPONENT                                                        */
/* ──────────────────────────────────────────────────────────────── */

type TabKey = "transport" | "stays" | "local" | "insights";

export default function TravelResearchPanel({
    open, onClose,
}: {
    open: boolean; onClose: () => void;
}) {
    const [phase, setPhase] = useState<"input" | "loading" | "results">("input");
    const [destination, setDestination] = useState("");
    const [dates, setDates] = useState("");
    const [travelers, setTravelers] = useState(4);
    const [budget, setBudget] = useState("moderate");

    const [data, setData] = useState<ResearchData | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("transport");
    const [insightsOpen, setInsightsOpen] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        if (!destination.trim()) return;
        setPhase("loading");
        setError(null);
        try {
            const res = await fetch("/api/travel-research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, dates, travelers, budget }),
            });
            if (!res.ok) throw new Error("Research failed");
            const raw = await res.json();
            setData(raw as ResearchData);
            setActiveTab("transport");
            setPhase("results");
        } catch {
            setError("Failed to fetch research data. Please try again.");
            setPhase("input");
        }
    }, [destination, dates, travelers, budget]);

    if (!open) return null;

    const TABS: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: "transport", label: "Transport", icon: <Plane className="w-3.5 h-3.5" />, count: data?.transport.length },
        { key: "stays", label: "Stays", icon: <Hotel className="w-3.5 h-3.5" />, count: data?.stays.length },
        { key: "local", label: "Local Transport", icon: <Car className="w-3.5 h-3.5" />, count: data?.local_transport.length },
        { key: "insights", label: "Hidden Insights", icon: <Shield className="w-3.5 h-3.5" />, count: data?.hidden_insights.length },
    ];

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                style={{ background: "rgba(4,8,20,0.92)", backdropFilter: "blur(8px)" }}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="w-full max-w-[1060px] max-h-[90vh] overflow-y-auto rounded-2xl"
                    style={{ background: "#0b1120", border: "1px solid rgba(59,130,246,0.15)" }}
                >
                    {/* ═══════ HEADER ═══════ */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                <Search className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-base">Intelligent Travel Research</h2>
                                <p className="text-white/35 text-xs">
                                    {phase === "input" && "Multi-source analysis across flights, trains, hotels, and transport"}
                                    {phase === "loading" && "Analyzing options across all platforms…"}
                                    {phase === "results" && data && `${data.destination} · ${data.travel_period}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {phase === "results" && (
                                <button onClick={() => { setPhase("input"); setData(null); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer">← New Search</button>
                            )}
                            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>
                    </div>

                    {/* ═══════ INPUT PHASE ═══════ */}
                    {phase === "input" && (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Destination</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                                        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Mumbai to Goa" className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Travel Dates (optional)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                                        <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="e.g. March 15-20, 2026" className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Travelers</label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <button key={n} onClick={() => setTravelers(n)} className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all cursor-pointer ${travelers === n ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/3 text-white/30 border border-white/5 hover:bg-white/5"}`}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">Budget Level</label>
                                    <div className="flex gap-2">
                                        {[{ v: "budget", l: "💰 Budget" }, { v: "moderate", l: "⚡ Moderate" }, { v: "premium", l: "✨ Premium" }].map(b => (
                                            <button key={b.v} onClick={() => setBudget(b.v)} className={`flex-1 h-11 rounded-xl text-xs font-semibold transition-all cursor-pointer ${budget === b.v ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/3 text-white/30 border border-white/5 hover:bg-white/5"}`}>{b.l}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-red-300 text-sm">{error}</span>
                                </div>
                            )}

                            <button onClick={handleSearch} disabled={!destination.trim()}
                                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)", color: "#fff", boxShadow: "0 4px 20px rgba(6,182,212,0.3)" }}
                            >
                                <span className="flex items-center justify-center gap-2"><Search className="w-4 h-4" /> Research with @Safar AI</span>
                            </button>
                        </div>
                    )}

                    {/* ═══════ LOADING PHASE ═══════ */}
                    {phase === "loading" && (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-5">
                                <Loader2 className="w-7 h-7 text-cyan-400" />
                            </motion.div>
                            <h3 className="text-white font-semibold text-lg mb-2">Researching Best Options…</h3>
                            <p className="text-white/35 text-sm text-center max-w-md mb-6">@Safar is scanning flights, trains, hotels, Airbnb, car rentals, and local transport for &quot;{destination}&quot;</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {["✈️ Scanning flights", "🚂 Checking trains", "🏨 Finding hotels", "🏠 Browsing Airbnb", "🚗 Car rentals", "🛵 Bike rentals"].map((step, i) => (
                                    <motion.div key={step} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                        className="px-3 py-2 rounded-lg bg-white/5 text-white/40 text-[11px] font-medium border border-white/5 text-center">{step}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════ RESULTS PHASE ═══════ */}
                    {phase === "results" && data && (
                        <>
                            {/* Summary + AI Recommendation */}
                            <div className="mx-6 mt-4 p-4 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.06), rgba(59,130,246,0.06))", border: "1px solid rgba(6,182,212,0.15)" }}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-bold text-sm">@Safar&apos;s Recommendation</h3>
                                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI Pick</span>
                                        </div>
                                        <p className="text-white/50 text-xs leading-relaxed mb-2">{data.ai_recommendation.reasoning}</p>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5 text-cyan-300 text-sm font-bold"><DollarSign className="w-4 h-4" /> {data.ai_recommendation.total_estimated_cost}</span>
                                            <span className="text-white/25 text-[10px]">estimated total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-1 mx-6 mt-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                {TABS.map(tab => (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === tab.key ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25" : "text-white/35 hover:text-white/60 hover:bg-white/3"}`}>
                                        {tab.icon} {tab.label}
                                        {tab.count !== undefined && <span className="text-[9px] opacity-50 ml-0.5">({tab.count})</span>}
                                    </button>
                                ))}
                            </div>

                            {/* TAB: Transport */}
                            {activeTab === "transport" && (
                                <div className="px-6 mt-3 space-y-2 pb-4">
                                    {data.transport.map((t) => (
                                        <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl p-4 transition-all"
                                            style={{ background: t.is_recommended ? "rgba(6,182,212,0.04)" : "rgba(255,255,255,0.02)", border: `1.5px solid ${t.is_recommended ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.is_recommended ? "bg-cyan-500/15 text-cyan-400" : "bg-white/5 text-white/40"}`}>{modeIcon(t.mode)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="text-white font-bold text-sm">{t.provider}</h4>
                                                            {t.is_recommended && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">AI PICK</span>}
                                                        </div>
                                                        <p className="text-white/30 text-xs mb-2">{t.route} · {t.class}</p>
                                                        <div className="flex items-center gap-4 text-[11px]">
                                                            <span className="flex items-center gap-1 text-white/50"><Clock className="w-3 h-3" /> {t.departure} → {t.arrival}</span>
                                                            <span className="flex items-center gap-1 text-white/50"><Zap className="w-3 h-3" /> {t.duration}</span>
                                                        </div>
                                                        {t.is_recommended && t.recommendation_reason && (
                                                            <p className="mt-2 text-cyan-300/60 text-[11px] flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {t.recommendation_reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-white font-bold text-lg">{t.price}</p>
                                                    <ConvenienceBar score={t.convenience_score} />
                                                    <div className="flex flex-wrap gap-1 mt-2 justify-end">
                                                        {t.tags.map(tag => { const c = tagColor(tag); return <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{tag}</span>; })}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: Stays */}
                            {activeTab === "stays" && (
                                <div className="px-6 mt-3 space-y-2 pb-4">
                                    {data.stays.map((s) => (
                                        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl p-4 transition-all"
                                            style={{ background: s.is_recommended ? "rgba(6,182,212,0.04)" : "rgba(255,255,255,0.02)", border: `1.5px solid ${s.is_recommended ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.is_recommended ? "bg-cyan-500/15 text-cyan-400" : "bg-white/5 text-white/40"}`}>{stayIcon(s.type)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="text-white font-bold text-sm">{s.name}</h4>
                                                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/30">{s.type}</span>
                                                            {s.is_recommended && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">AI PICK</span>}
                                                        </div>
                                                        <p className="text-white/30 text-xs mb-2">{s.location}</p>
                                                        <div className="flex items-center gap-3 text-[11px] mb-2">
                                                            <span className="flex items-center gap-1 text-yellow-400"><Star className="w-3 h-3 fill-current" /> {s.rating}</span>
                                                            <span className="text-white/30">({s.reviews} reviews)</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {s.amenities.slice(0, 5).map(a => <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">{a}</span>)}
                                                        </div>
                                                        {s.is_recommended && s.recommendation_reason && (
                                                            <p className="mt-2 text-cyan-300/60 text-[11px] flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {s.recommendation_reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-white font-bold text-lg">{s.price_per_night}</p>
                                                    <p className="text-white/25 text-[10px]">per night</p>
                                                    <p className="text-white/50 text-xs font-semibold mt-1">{s.total_price} total</p>
                                                    <ConvenienceBar score={s.convenience_score} />
                                                    <div className="flex flex-wrap gap-1 mt-2 justify-end">
                                                        {s.tags.map(tag => { const c = tagColor(tag); return <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{tag}</span>; })}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: Local Transport */}
                            {activeTab === "local" && (
                                <div className="px-6 mt-3 space-y-2 pb-4">
                                    {data.local_transport.map((l) => (
                                        <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl p-4 transition-all"
                                            style={{ background: l.is_recommended ? "rgba(6,182,212,0.04)" : "rgba(255,255,255,0.02)", border: `1.5px solid ${l.is_recommended ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${l.is_recommended ? "bg-cyan-500/15 text-cyan-400" : "bg-white/5 text-white/40"}`}>{localIcon(l.type)}</div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="text-white font-bold text-sm">{l.provider}</h4>
                                                            {l.is_recommended && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">AI PICK</span>}
                                                        </div>
                                                        <p className="text-white/30 text-xs">{l.description}</p>
                                                        {l.is_recommended && l.recommendation_reason && (
                                                            <p className="mt-2 text-cyan-300/60 text-[11px] flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {l.recommendation_reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-white font-bold text-lg">{l.price}</p>
                                                    <p className="text-white/25 text-[10px]">{l.price_unit}</p>
                                                    <ConvenienceBar score={l.convenience_score} />
                                                    <div className="flex flex-wrap gap-1 mt-2 justify-end">
                                                        {l.tags.map(tag => { const c = tagColor(tag); return <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{tag}</span>; })}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* TAB: Hidden Insights */}
                            {activeTab === "insights" && (
                                <div className="px-6 mt-3 space-y-2 pb-4">
                                    {data.hidden_insights.map((insight, i) => {
                                        const sc = severityColor(insight.severity);
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                                className="rounded-xl p-4" style={{ background: sc.bg, border: `1.5px solid ${sc.border}` }}>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${sc.icon}15`, color: sc.icon }}>{insightIcon(insight.type)}</div>
                                                    <div>
                                                        <h4 className="font-bold text-sm mb-0.5" style={{ color: sc.text }}>{insight.title}</h4>
                                                        <p className="text-xs leading-relaxed" style={{ color: `${sc.text}99` }}>{insight.description}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
