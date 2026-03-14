"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, ChevronDown, ChevronUp, BarChart3, Sparkles, AlertTriangle,
    Check, TrendingUp, Zap, Heart, DollarSign, ShieldCheck, Plus,
    Trash2, Loader2, UserPlus, MapPin,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────── */
/*  TYPES                                                            */
/* ──────────────────────────────────────────────────────────────── */

interface MemberInput {
    id: string;
    name: string;
    budget: string;
    energy: string;
    interests: string[];
}

interface ScenarioMetric {
    label: string;
    value: number;
    color: string;
}

interface ScenarioNote {
    icon: "cost" | "fatigue" | "unlock" | "regret" | "nature" | "mix" | "info";
    text: string;
    color: string;
}

interface ScenarioBadge {
    label: string;
    color: string;
    textColor?: string;
}

interface Scenario {
    id: string;
    title: string;
    subtitle: string;
    days: number;
    baseCost: string;
    extraCost?: string;
    metrics: ScenarioMetric[];
    tags: string[];
    notes: ScenarioNote[];
    badges: ScenarioBadge[];
    radarValues: number[];
    isRecommended?: boolean;
}

interface ComparisonData {
    title: string;
    aiRecommendation: string;
    regretBudget: { current: number; max: number };
    scenarios: Scenario[];
    radarLabels: string[];
    analysis: string;
}

/* ──────────────────────────────────────────────────────────────── */
/*  INTEREST OPTIONS                                                 */
/* ──────────────────────────────────────────────────────────────── */

const INTEREST_OPTIONS = [
    "Beaches", "Mountains", "Culture", "Nightlife", "Adventure",
    "Food & Cuisine", "History", "Nature", "Shopping", "Wildlife",
    "Water Sports", "Temples", "Relaxation", "Photography", "Trekking",
];

const ENERGY_LEVELS = [
    { value: "low", label: "🧘 Low", desc: "Relax & chill" },
    { value: "medium", label: "⚡ Medium", desc: "Balanced pace" },
    { value: "high", label: "🔥 High", desc: "Pack it all in" },
];

const BUDGET_RANGES = [
    { value: "budget", label: "₹10k-20k", desc: "Budget" },
    { value: "moderate", label: "₹20k-35k", desc: "Moderate" },
    { value: "premium", label: "₹35k-50k", desc: "Premium" },
    { value: "luxury", label: "₹50k+", desc: "Luxury" },
];

/* ──────────────────────────────────────────────────────────────── */
/*  RADAR CHART (SVG)                                                */
/* ──────────────────────────────────────────────────────────────── */

function RadarChart({
    labels,
    datasets,
}: {
    labels: string[];
    datasets: { values: number[]; color: string; label: string }[];
}) {
    const cx = 150, cy = 140, r = 100;
    const n = labels.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    const getPoint = (i: number, val: number) => {
        const angle = startAngle + i * angleStep;
        const dist = (val / 100) * r;
        return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
    };

    const rings = [20, 40, 60, 80, 100];

    return (
        <svg viewBox="0 0 300 290" className="w-full max-w-[320px] mx-auto">
            {rings.map((ring) => (
                <polygon key={ring}
                    points={Array.from({ length: n }, (_, i) => { const p = getPoint(i, ring); return `${p.x},${p.y}`; }).join(" ")}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            ))}
            {Array.from({ length: n }, (_, i) => {
                const p = getPoint(i, 100);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
            })}
            {datasets.map((ds, di) => {
                const points = ds.values.map((v, i) => { const p = getPoint(i, v); return `${p.x},${p.y}`; }).join(" ");
                return (
                    <g key={di}>
                        <polygon points={points} fill={ds.color} fillOpacity={0.15} stroke={ds.color} strokeWidth="2" strokeOpacity={0.8} />
                        {ds.values.map((v, i) => { const p = getPoint(i, v); return <circle key={i} cx={p.x} cy={p.y} r="3" fill={ds.color} />; })}
                    </g>
                );
            })}
            {labels.map((label, i) => {
                const p = getPoint(i, 120);
                return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontWeight="500">{label}</text>;
            })}
        </svg>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  NOTE ICON HELPER                                                 */
/* ──────────────────────────────────────────────────────────────── */

function NoteIcon({ icon, color }: { icon: ScenarioNote["icon"]; color: string }) {
    const cls = "w-3.5 h-3.5 shrink-0";
    switch (icon) {
        case "cost": return <DollarSign className={cls} style={{ color }} />;
        case "fatigue": return <Heart className={cls} style={{ color }} />;
        case "unlock": return <Zap className={cls} style={{ color }} />;
        case "regret": return <AlertTriangle className={cls} style={{ color }} />;
        case "nature": return <TrendingUp className={cls} style={{ color }} />;
        case "mix": return <Sparkles className={cls} style={{ color }} />;
        case "info": return <ShieldCheck className={cls} style={{ color }} />;
        default: return <Sparkles className={cls} style={{ color }} />;
    }
}

/* ──────────────────────────────────────────────────────────────── */
/*  PARSE AI RESPONSE TO ComparisonData                              */
/* ──────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIResponse(raw: any): ComparisonData {
    const scenarios: Scenario[] = (raw.scenarios || []).map((s: any) => ({
        id: s.id || Math.random().toString(36).slice(2, 8),
        title: s.title || "Scenario",
        subtitle: s.subtitle || "",
        days: s.days || 5,
        baseCost: s.base_cost || "₹0",
        extraCost: s.extra_cost || undefined,
        metrics: [
            { label: "Experience", value: s.experience ?? 70, color: "#06b6d4" },
            { label: "Low Fatigue", value: s.low_fatigue ?? 50, color: "#22c55e" },
            { label: "Regret Risk", value: s.regret_risk ?? 40, color: s.regret_risk > 50 ? "#ef4444" : s.regret_risk > 30 ? "#f97316" : "#22c55e" },
        ],
        tags: s.tags || [],
        notes: (s.notes || []).map((n: any) => ({
            icon: n.icon || "info",
            text: n.text || "",
            color: n.color || "#06b6d4",
        })),
        badges: (s.badges || []).map((b: any) => ({
            label: b.label || "",
            color: b.color || "#22c55e",
            textColor: b.text_color || "#000",
        })),
        radarValues: s.radar
            ? [s.radar.experience ?? 70, s.radar.low_fatigue ?? 50, s.radar.budget_safety ?? 60, s.radar.low_regret ?? 50, s.radar.feasibility ?? 70]
            : [70, 50, 60, 50, 70],
        isRecommended: s.is_recommended || false,
    }));

    return {
        title: raw.title || "Trip Comparison",
        aiRecommendation: raw.ai_recommendation || scenarios.find(s => s.isRecommended)?.title || "—",
        regretBudget: raw.regret_budget || { current: 25, max: 50 },
        scenarios,
        radarLabels: ["Experience", "Low Fatigue", "Budget Safety", "Low Regret", "Feasibility"],
        analysis: raw.analysis || "",
    };
}

/* ──────────────────────────────────────────────────────────────── */
/*  MODAL COMPONENT                                                  */
/* ──────────────────────────────────────────────────────────────── */

export default function TripComparisonModal({
    open,
    onClose,
    onApply,
    groupMembers,
}: {
    open: boolean;
    onClose: () => void;
    onApply?: (scenarioId: string) => void;
    groupMembers?: string[];
}) {
    // ── Phase: "input" → "loading" → "results"
    const [phase, setPhase] = useState<"input" | "loading" | "results">("input");

    // ── Input state
    const [destination, setDestination] = useState("");
    const [members, setMembers] = useState<MemberInput[]>([
        { id: "1", name: groupMembers?.[0] || "Member 1", budget: "moderate", energy: "medium", interests: ["Beaches", "Food & Cuisine"] },
    ]);

    // ── Results state
    const [data, setData] = useState<ComparisonData | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [radarOpen, setRadarOpen] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const selected = data?.scenarios.find((s) => s.id === selectedId);
    const recommended = data?.scenarios.find((s) => s.isRecommended);

    // ── Member management
    const addMember = () => {
        setMembers(prev => [...prev, {
            id: Date.now().toString(),
            name: groupMembers?.[prev.length] || `Member ${prev.length + 1}`,
            budget: "moderate",
            energy: "medium",
            interests: [],
        }]);
    };

    const removeMember = (id: string) => {
        if (members.length <= 1) return;
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const updateMember = (id: string, field: keyof MemberInput, value: string | string[]) => {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const toggleInterest = (memberId: string, interest: string) => {
        setMembers(prev => prev.map(m => {
            if (m.id !== memberId) return m;
            const has = m.interests.includes(interest);
            return { ...m, interests: has ? m.interests.filter(i => i !== interest) : [...m.interests, interest] };
        }));
    };

    // ── Call AI
    const handleAnalyze = useCallback(async () => {
        if (!destination.trim()) return;

        setPhase("loading");
        setError(null);

        try {
            const res = await fetch("/api/compare-trips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, members }),
            });

            if (!res.ok) throw new Error("AI analysis failed");

            const raw = await res.json();
            const parsed = parseAIResponse(raw);
            setData(parsed);
            setSelectedId(null);
            setPhase("results");
        } catch (err) {
            console.error(err);
            setError("Failed to generate comparison. Please try again.");
            setPhase("input");
        }
    }, [destination, members]);

    // ── Reset
    const handleBack = () => {
        setPhase("input");
        setData(null);
        setSelectedId(null);
    };

    // ── Radar chart data
    const radarDatasets = useMemo(() => {
        if (!data) return [];
        const sets: { values: number[]; color: string; label: string }[] = [];
        sets.push({ values: data.scenarios[0].radarValues, color: "#64748b", label: data.scenarios[0].title });
        const compare = selected ?? recommended ?? data.scenarios[1];
        if (compare && compare.id !== data.scenarios[0].id) {
            const clr = compare.isRecommended ? "#f97316" : "#06b6d4";
            sets.push({ values: compare.radarValues, color: clr, label: compare.title });
        }
        return sets;
    }, [selectedId, data, selected, recommended]);

    const regretPercent = data ? Math.min((data.regretBudget.current / data.regretBudget.max) * 100, 100) : 0;
    const isOverBudget = data ? data.regretBudget.current > data.regretBudget.max : false;

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                style={{ background: "rgba(4,8,20,0.92)", backdropFilter: "blur(8px)" }}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="w-full max-w-[960px] max-h-[90vh] overflow-y-auto rounded-2xl"
                    style={{ background: "#0b1120", border: "1px solid rgba(59,130,246,0.15)" }}
                >
                    {/* ════════════ HEADER ════════════ */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-base">
                                    {phase === "results" && data ? data.title : "Trip Comparison Analysis"}
                                </h2>
                                <p className="text-white/35 text-xs">
                                    {phase === "input" && "Add member preferences and destination to compare"}
                                    {phase === "loading" && "Safar AI is analyzing preferences…"}
                                    {phase === "results" && data && (
                                        <>{data.scenarios.length} scenarios · AI recommends <span className="text-orange-400 font-semibold">{data.aiRecommendation}</span></>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {phase === "results" && (
                                <button onClick={handleBack} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer">
                                    ← Edit Preferences
                                </button>
                            )}
                            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-white/50" />
                            </button>
                        </div>
                    </div>


                    {/* ════════════ PHASE: INPUT ════════════ */}
                    {phase === "input" && (
                        <div className="p-6 space-y-5">
                            {/* Destination */}
                            <div>
                                <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2 block">Destination / Trip Idea</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                    <input
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="e.g. Goa, Kerala vs Goa, 5 days in Ladakh…"
                                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Members */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-white/60 text-xs font-bold uppercase tracking-wider">Member Preferences</label>
                                    <button onClick={addMember} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors cursor-pointer">
                                        <UserPlus className="w-3.5 h-3.5" /> Add Member
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {members.map((member, mi) => (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-xl p-4 space-y-3"
                                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                    {mi + 1}
                                                </div>
                                                <input
                                                    value={member.name}
                                                    onChange={(e) => updateMember(member.id, "name", e.target.value)}
                                                    className="flex-1 h-9 px-3 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-blue-500/30"
                                                    placeholder="Name"
                                                />
                                                {members.length > 1 && (
                                                    <button onClick={() => removeMember(member.id)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer">
                                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Budget */}
                                            <div>
                                                <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-1.5">Budget</p>
                                                <div className="flex gap-1.5">
                                                    {BUDGET_RANGES.map((b) => (
                                                        <button
                                                            key={b.value}
                                                            onClick={() => updateMember(member.id, "budget", b.value)}
                                                            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${member.budget === b.value
                                                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                                                : "bg-white/3 text-white/40 border border-white/5 hover:bg-white/5"
                                                                }`}
                                                        >
                                                            <div className="font-semibold">{b.label}</div>
                                                            <div className="text-[9px] opacity-60">{b.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Energy */}
                                            <div>
                                                <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-1.5">Energy Level</p>
                                                <div className="flex gap-1.5">
                                                    {ENERGY_LEVELS.map((e) => (
                                                        <button
                                                            key={e.value}
                                                            onClick={() => updateMember(member.id, "energy", e.value)}
                                                            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${member.energy === e.value
                                                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                                                : "bg-white/3 text-white/40 border border-white/5 hover:bg-white/5"
                                                                }`}
                                                        >
                                                            <div className="font-semibold">{e.label}</div>
                                                            <div className="text-[9px] opacity-60">{e.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Interests */}
                                            <div>
                                                <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-1.5">Interests</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {INTEREST_OPTIONS.map((interest) => {
                                                        const isSelected = member.interests.includes(interest);
                                                        return (
                                                            <button
                                                                key={interest}
                                                                onClick={() => toggleInterest(member.id, interest)}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${isSelected
                                                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                                    : "bg-white/3 text-white/30 border border-white/5 hover:bg-white/5 hover:text-white/50"
                                                                    }`}
                                                            >
                                                                {interest}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                    <span className="text-red-300 text-sm">{error}</span>
                                </div>
                            )}

                            {/* Analyze button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={!destination.trim() || members.some(m => m.interests.length === 0)}
                                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                                style={{
                                    background: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)",
                                    color: "#fff",
                                    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                                }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Analyze with @Safar AI
                                </span>
                            </button>
                        </div>
                    )}


                    {/* ════════════ PHASE: LOADING ════════════ */}
                    {phase === "loading" && (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 mb-5"
                            >
                                <Loader2 className="w-7 h-7 text-blue-400" />
                            </motion.div>
                            <h3 className="text-white font-semibold text-lg mb-2">Analyzing Preferences…</h3>
                            <p className="text-white/35 text-sm text-center max-w-md">
                                @Safar is comparing {members.length} member preferences for &quot;{destination}&quot; and generating 3 optimized scenarios with trade-off analysis.
                            </p>
                            <div className="flex items-center gap-3 mt-6">
                                {["Resolving conflicts", "Calculating regret", "Building scenarios"].map((step, i) => (
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0.3 }}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 text-[11px] font-medium border border-white/5"
                                    >
                                        {step}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* ════════════ PHASE: RESULTS ════════════ */}
                    {phase === "results" && data && (
                        <>
                            {/* Regret Budget */}
                            <div className="mx-6 mt-4 p-3.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Regret Budget</span>
                                    <span className={`text-sm font-bold ${isOverBudget ? "text-red-400" : "text-green-400"}`}>
                                        {data.regretBudget.current} / {data.regretBudget.max}
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(regretPercent, 100)}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full rounded-full"
                                        style={{ background: isOverBudget ? "linear-gradient(90deg, #ef4444, #dc2626)" : "linear-gradient(90deg, #22c55e, #16a34a)" }}
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 mt-2">
                                    {isOverBudget ? (
                                        <><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-red-400 text-[11px]">This option exceeds your regret tolerance</span></>
                                    ) : (
                                        <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400 text-[11px]">Within your regret tolerance</span></>
                                    )}
                                </div>
                            </div>

                            {/* Scenario Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-6 mt-4">
                                {data.scenarios.map((scenario) => {
                                    const isSelected = selectedId === scenario.id;
                                    const borderColor = scenario.isRecommended ? "rgba(249,115,22,0.4)" : isSelected ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)";

                                    return (
                                        <motion.div
                                            key={scenario.id}
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => setSelectedId(scenario.id)}
                                            className="rounded-xl p-4 cursor-pointer transition-all relative"
                                            style={{ background: scenario.isRecommended ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.02)", border: `1.5px solid ${borderColor}` }}
                                        >
                                            {scenario.badges.length > 0 && (
                                                <div className="flex items-center gap-1.5 mb-2.5">
                                                    {scenario.badges.map((badge) => (
                                                        <span key={badge.label} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: badge.color, color: badge.textColor || "#fff" }}>{badge.label}</span>
                                                    ))}
                                                </div>
                                            )}

                                            <h3 className="text-white font-bold text-sm mb-0.5">{scenario.title}</h3>
                                            <p className="text-white/30 text-[11px] mb-3">{scenario.subtitle}</p>

                                            <div className="flex items-baseline gap-3 mb-4">
                                                <div>
                                                    <span className="text-white font-bold text-2xl">{scenario.days}d</span>
                                                    <span className="text-white/25 text-[10px] ml-1 uppercase">days</span>
                                                </div>
                                                <div>
                                                    <span className="text-white font-bold text-lg">{scenario.baseCost}</span>
                                                    <span className="text-white/25 text-[10px] ml-1 uppercase">budget</span>
                                                </div>
                                                {scenario.extraCost && (
                                                    <span className="text-orange-400 font-bold text-sm">{scenario.extraCost}
                                                        <span className="text-white/25 text-[9px] ml-0.5 uppercase">extra</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2.5">
                                                {scenario.metrics.map((m) => (
                                                    <div key={m.label}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-white/50 text-[11px]">{m.label}</span>
                                                            <span className="text-white/70 text-[11px] font-bold">{m.value}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.6, delay: 0.2 }} className="h-full rounded-full" style={{ background: m.color }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {scenario.tags.map((tag) => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/5">{tag}</span>
                                                ))}
                                            </div>

                                            {scenario.notes.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                                                    {scenario.notes.map((note, ni) => (
                                                        <div key={ni} className="flex items-center gap-1.5">
                                                            <NoteIcon icon={note.icon} color={note.color} />
                                                            <span className="text-[11px]" style={{ color: note.color }}>{note.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* AI Analysis */}
                            {data.analysis && (
                                <div className="mx-6 mt-4 flex items-start gap-2.5 p-3.5 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-blue-400 text-[11px] font-bold mb-0.5">@Safar&apos;s Analysis</p>
                                        <p className="text-blue-300/70 text-xs leading-relaxed">{data.analysis}</p>
                                    </div>
                                </div>
                            )}

                            {/* Trade-off Radar */}
                            <div className="mx-6 mt-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <button onClick={() => setRadarOpen(!radarOpen)} className="w-full flex items-center justify-between px-4 py-3 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-white/40" />
                                        <span className="text-white/70 text-sm font-semibold">Trade-off Radar</span>
                                    </div>
                                    {radarOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                                </button>
                                <AnimatePresence>
                                    {radarOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                            <div className="flex items-center gap-4 px-4 pb-2">
                                                {radarDatasets.map((ds) => (
                                                    <div key={ds.label} className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: ds.color }} />
                                                        <span className="text-white/40 text-[11px]">{ds.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="px-4 pb-4">
                                                <RadarChart labels={data.radarLabels} datasets={radarDatasets} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between px-6 py-4 mt-2 border-t border-white/5">
                                <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-white/50 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer border border-white/8">
                                    Keep current
                                </button>
                                {selected ? (
                                    <motion.button
                                        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                        onClick={() => onApply?.(selected.id)}
                                        className="px-8 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                        style={{
                                            background: selected.isRecommended ? "linear-gradient(135deg, #f97316, #ea580c)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                                            color: "#fff",
                                            boxShadow: selected.isRecommended ? "0 4px 20px rgba(249,115,22,0.3)" : "0 4px 20px rgba(59,130,246,0.3)",
                                        }}
                                    >
                                        Apply &quot;{selected.title}&quot;
                                    </motion.button>
                                ) : (
                                    <p className="text-white/25 text-sm">Select a scenario above</p>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
