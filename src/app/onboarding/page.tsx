"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
    ChevronLeft, ChevronRight, Check, Loader2, Eye, EyeOff,
    Leaf, Egg, Beef, Sprout, Flower2,
    Train, Plane, Bus, Car, CarTaxiFront,
    User, Users, Home,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

/* ──────────────────────────────────────────────────────────
   SUPABASE-READY FORM STATE
   When integrating: await supabase.from('profiles').upsert(formState)
────────────────────────────────────────────────────────── */
interface OnboardingState {
    budget: number;          // 500–25000
    pace: number;            // 0–100
    startHour: number;       // 6–14
    endHour: number;         // 14–24
    dietaryPref: string;
    transport: string[];
    travelStyle: string;
    interests: string[];
}

const INITIAL_STATE: OnboardingState = {
    budget: 5000,
    pace: 50,
    startHour: 8,
    endHour: 22,
    dietaryPref: "",
    transport: [],
    travelStyle: "",
    interests: [],
};

/* ──────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────── */
const DIETARY: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "veg", label: "Pure Veg", icon: <Leaf className="w-6 h-6" />, color: "text-green-400" },
    { id: "egg", label: "Eggetarian", icon: <Egg className="w-6 h-6" />, color: "text-amber-400" },
    { id: "nonveg", label: "Non-Veg", icon: <Beef className="w-6 h-6" />, color: "text-red-400" },
    { id: "vegan", label: "Vegan", icon: <Sprout className="w-6 h-6" />, color: "text-emerald-400" },
    { id: "jain", label: "Jain", icon: <Flower2 className="w-6 h-6" />, color: "text-purple-400" },
];

const TRANSPORT: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "train", label: "Train", icon: <Train className="w-4 h-4" /> },
    { id: "flight", label: "Flight", icon: <Plane className="w-4 h-4" /> },
    { id: "bus", label: "Bus", icon: <Bus className="w-4 h-4" /> },
    { id: "drive", label: "Self-Drive", icon: <Car className="w-4 h-4" /> },
    { id: "cab", label: "Cab/Taxi", icon: <CarTaxiFront className="w-4 h-4" /> },
];

const TRAVEL_STYLE: { id: string; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { id: "solo", label: "Solo", icon: <User className="w-7 h-7" />, color: "text-blue-400", desc: "Just me, myself & I" },
    { id: "friends", label: "With Friends", icon: <Users className="w-7 h-7" />, color: "text-purple-400", desc: "Crew mode on" },
    { id: "family", label: "With Family", icon: <Home className="w-7 h-7" />, color: "text-green-400", desc: "Everyone's together" },
];

const INTERESTS = [
    "Adventure", "Food & Street Food", "Photography", "Beach",
    "Culture & Arts", "Nightlife", "Nature", "History & Heritage",
    "Wellness & Spa", "Shopping", "Trekking", "Wildlife",
    "Spirituality", "Architecture", "Festivals",
];

/* ──────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────── */
function budgetLabel(v: number) {
    if (v < 2000) return "Budget Backpacker";
    if (v < 6000) return "Smart Traveler";
    if (v < 12000) return "Comfort Seeker";
    if (v < 20000) return "Premium Explorer";
    return "Luxury Traveler";
}

function paceLabel(v: number) {
    if (v < 33) return "Chill (2–3 activities/day)";
    if (v < 66) return "Balanced (3–4 activities/day)";
    return "Explorer (5–6 activities/day)";
}

function formatHour(h: number) {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
}

/* ──────────────────────────────────────────────────────────
   CUSTOM SLIDER
────────────────────────────────────────────────────────── */
function Slider({ min, max, value, onChange }:
    { min: number; max: number; value: number; onChange: (v: number) => void }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-1.5 rounded-full bg-white/10" />
            <div className="absolute h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
            <input
                type="range" min={min} max={max} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: 2 }}
            />
            <div
                className="absolute w-5 h-5 rounded-full bg-white shadow-lg shadow-blue-500/40 border-2 border-blue-500 pointer-events-none"
                style={{ left: `calc(${pct}% - 10px)` }}
            />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   TIME PICKER — inline spinner, no dropdown, no clipping
────────────────────────────────────────────────────────── */
function TimePicker({
    label, hour24, onChange,
}: { label: string; hour24: number; onChange: (h: number) => void }) {
    const displayHour = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const isPM = hour24 >= 12;

    const cycle = (delta: number) => {
        // spin 1-12 in 12h space, then convert back
        const next = ((displayHour - 1 + delta + 12) % 12) + 1;
        const base = isPM ? (next === 12 ? 12 : next + 12) : (next === 12 ? 0 : next);
        onChange(Math.min(base, 23));
    };

    const toggleAmPm = (pm: boolean) => {
        if (pm && !isPM) onChange(hour24 === 0 ? 12 : Math.min(hour24 + 12, 23));
        if (!pm && isPM) onChange(hour24 === 12 ? 0 : hour24 - 12);
    };

    return (
        <div className="flex-1 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>

            {/* Hour spinner */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full justify-between">
                <button onClick={() => cycle(-1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-lg font-bold">
                    ‹
                </button>
                <span className="text-2xl font-bold text-white tabular-nums w-10 text-center select-none">
                    {String(displayHour).padStart(2, "0")}
                </span>
                <button onClick={() => cycle(1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-lg font-bold">
                    ›
                </button>
            </div>

            {/* AM / PM toggle */}
            <div className="flex w-full rounded-xl overflow-hidden border border-white/10">
                {([false, true] as const).map(pm => (
                    <button key={String(pm)} onClick={() => toggleAmPm(pm)}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${isPM === pm ? "bg-blue-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                            }`}>
                        {pm ? "PM" : "AM"}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   SLIDE COMPONENTS
────────────────────────────────────────────────────────── */
function Slide1({ state, set }: { state: OnboardingState; set: (p: Partial<OnboardingState>) => void }) {
    return (
        <div className="space-y-8">
            {/* Budget */}
            <div>
                <div className="flex justify-between items-end mb-3">
                    <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Daily Budget <span className="text-white/40 font-normal normal-case">/ person</span></p>
                    <div className="text-right">
                        <p className="text-blue-400 font-bold text-lg">₹{state.budget >= 25000 ? "25,000+" : state.budget.toLocaleString()}</p>
                        <p className="text-xs text-white/40">{budgetLabel(state.budget)}</p>
                    </div>
                </div>
                <Slider min={500} max={25000} value={state.budget} onChange={v => set({ budget: v })} />
                <div className="flex justify-between text-[11px] text-white/30 mt-2">
                    <span>₹500</span><span>₹25,000+</span>
                </div>
            </div>

            {/* Pace */}
            <div>
                <div className="flex justify-between items-end mb-3">
                    <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Travel Pace</p>
                    <p className="text-xs text-blue-400 font-semibold">{paceLabel(state.pace)}</p>
                </div>
                <Slider min={0} max={100} value={state.pace} onChange={v => set({ pace: v })} />
                <div className="flex justify-between text-[11px] text-white/30 mt-2">
                    <span>Chill</span><span>Explorer</span>
                </div>
            </div>

            {/* Time Window */}
            <div>
                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">Preferred Hours</p>
                <div className="flex gap-4 items-start">
                    <TimePicker label="Start Time" hour24={state.startHour} onChange={v => set({ startHour: v })} />
                    {/* divider arrow */}
                    <div className="flex flex-col items-center justify-center pt-14 text-white/20 shrink-0">
                        <span className="text-xl">→</span>
                    </div>
                    <TimePicker label="End Time" hour24={state.endHour} onChange={v => set({ endHour: v })} />
                </div>
                <p className="text-xs text-blue-400/80 text-center mt-3 font-semibold">
                    {formatHour(state.startHour)} → {formatHour(state.endHour)}
                </p>
            </div>
        </div>
    );
}

function Slide2({ state, set }: { state: OnboardingState; set: (p: Partial<OnboardingState>) => void }) {
    const toggleTransport = (id: string) => {
        set({ transport: state.transport.includes(id) ? state.transport.filter(t => t !== id) : [...state.transport, id] });
    };
    return (
        <div className="space-y-8">
            {/* Food */}
            <div>
                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Food Preference</p>
                <div className="grid grid-cols-5 gap-2">
                    {DIETARY.map(d => (
                        <button key={d.id} onClick={() => set({ dietaryPref: d.id })}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${state.dietaryPref === d.id
                                ? "bg-blue-600/30 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.05]"
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}`}>
                            <span className={`${d.color} transition-colors`}>{d.icon}</span>
                            <span className="text-[10px] font-semibold text-white/70 text-center leading-tight">{d.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transport */}
            <div>
                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Transport <span className="text-white/30 font-normal normal-case">(pick all that apply)</span></p>
                <div className="flex flex-wrap gap-2">
                    {TRANSPORT.map(t => {
                        const active = state.transport.includes(t.id);
                        return (
                            <button key={t.id} onClick={() => toggleTransport(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all cursor-pointer ${active
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-white/5 border-white/15 text-white/70 hover:border-white/30 hover:bg-white/10"}`}>
                                <span className={active ? "text-white" : "text-blue-400"}>{t.icon}</span>
                                {t.label}
                                {active && <Check className="w-3 h-3" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function Slide3({ state, set }: { state: OnboardingState; set: (p: Partial<OnboardingState>) => void }) {
    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRAVEL_STYLE.map(s => (
                    <button key={s.id} onClick={() => set({ travelStyle: s.id })}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer text-left group ${state.travelStyle === s.id
                            ? "bg-blue-600/25 border-blue-500 shadow-lg shadow-blue-500/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25"}`}>
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${state.travelStyle === s.id ? "bg-blue-500/20" : "bg-white/5"
                            }`}>
                            <span className={s.color}>{s.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`font-bold text-sm ${state.travelStyle === s.id ? "text-blue-300" : "text-white"}`}>{s.label}</p>
                            <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                        </div>
                        {state.travelStyle === s.id && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function Slide4({ state, set }: { state: OnboardingState; set: (p: Partial<OnboardingState>) => void }) {
    const toggle = (interest: string) => {
        set({ interests: state.interests.includes(interest) ? state.interests.filter(i => i !== interest) : [...state.interests, interest] });
    };
    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {INTERESTS.map(interest => {
                    const active = state.interests.includes(interest);
                    return (
                        <motion.button
                            key={interest} onClick={() => toggle(interest)}
                            whileTap={{ scale: 0.93 }}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer border ${active
                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30 scale-[1.04]"
                                : "bg-white/5 border-white/15 text-white/65 hover:border-white/30 hover:bg-white/10 hover:text-white"}`}>
                            {interest}
                        </motion.button>
                    );
                })}
            </div>
            <p className="text-xs text-white/35 mt-5 text-center">{state.interests.length} selected · Pick as many as you like</p>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   ONBOARDING PASSWORD INPUT
────────────────────────────────────────────────────────── */
function OPasswordInput({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder ?? "••••••••"}
                className="w-full h-11 px-4 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-white/30"
            />
            <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                tabIndex={-1}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   SLIDE 5 — SIGN UP
────────────────────────────────────────────────────────── */
const fieldCls = "w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-white/30";
const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5";

function Slide5({
    username, onUsername,
    email, onEmail,
    password, onPassword,
    confirm, onConfirm,
    usernameError, onBlurUsername,
}: {
    username: string; onUsername: (v: string) => void;
    email: string; onEmail: (v: string) => void;
    password: string; onPassword: (v: string) => void;
    confirm: string; onConfirm: (v: string) => void;
    usernameError: string; onBlurUsername: () => void;
}) {
    return (
        <div className="space-y-4">
            <div>
                <p className={labelCls}>Username</p>
                <input
                    value={username}
                    onChange={e => onUsername(e.target.value.replace(/\s/g, ""))}
                    onBlur={onBlurUsername}
                    placeholder="e.g. rahul_travels (no spaces)"
                    className={`${fieldCls} ${usernameError ? "border-red-500/60" : ""}`}
                />
                {usernameError && <p className="text-xs text-red-400 mt-1">{usernameError}</p>}
            </div>
            <div>
                <p className={labelCls}>Email Address</p>
                <input
                    value={email}
                    onChange={e => onEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    className={fieldCls}
                />
            </div>
            <div>
                <p className={labelCls}>Password</p>
                <OPasswordInput value={password} onChange={onPassword} placeholder="Min. 8 characters" />
                {password && password.length < 8 && (
                    <p className="text-xs text-red-400 mt-1">At least 8 characters required.</p>
                )}
            </div>
            <div>
                <p className={labelCls}>Confirm Password</p>
                <OPasswordInput value={confirm} onChange={onConfirm} placeholder="Repeat your password" />
                {confirm && password !== confirm && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                )}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────
   SLIDE META
────────────────────────────────────────────────────────── */
const SLIDES = [
    { heading: "Set your travel rhythm.", sub: "Tell @Safar how you like to move." },
    { heading: "How do you move and eat?", sub: "Help us personalise every meal and journey." },
    { heading: "Who do you explore with?", sub: "We'll tailor recommendations for your crew." },
    { heading: "What makes a trip memorable?", sub: "Select all that spark joy for you." },
    { heading: "Almost there!", sub: "Create your account to save your preferences and start planning." },
];

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [form, setForm] = useState<OnboardingState>(INITIAL_STATE);
    const [loading, setLoading] = useState(false);

    // ── Slide5 sign-up fields ──
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [usernameError, setUsernameError] = useState("");

    // Username: strip spaces inline, check uniqueness on blur
    const handleUsername = useCallback((val: string) => {
        setUsername(val);
        if (val.length > 0 && val.length < 3) setUsernameError("At least 3 characters.");
        else setUsernameError("");
    }, []);

    const checkUsernameUnique = useCallback(async () => {
        if (!username || usernameError) return;
        const { data } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
        if (data) setUsernameError("Username already taken.");
    }, [username, usernameError]);

    const setField = (patch: Partial<OnboardingState>) => setForm(prev => ({ ...prev, ...patch }));

    const go = (newStep: number) => {
        setDir(newStep > step ? 1 : -1);
        setStep(newStep);
    };

    const handleSubmit = async () => {
        // ── Validate sign-up fields ──
        if (!username.trim() || !email.trim() || !password || !confirm) {
            toast.error("Please fill in all fields."); return;
        }
        if (username.trim().length < 3) {
            toast.error("Username must be at least 3 characters."); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            toast.error("Please enter a valid email address."); return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters."); return;
        }
        if (password !== confirm) {
            toast.error("Passwords do not match."); return;
        }
        if (usernameError) {
            toast.error(usernameError); return;
        }

        setLoading(true);

        // 1) Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });
        if (authError) {
            setLoading(false);
            toast.error(authError.message); return;
        }

        // 2) Insert public profile + preferences
        const userId = authData.user?.id;
        if (userId) {
            const { error: dbError } = await supabase.from("users").insert({
                id: userId,
                username: username.trim(),
                email: email.trim(),
                preferences: form,
            });
            if (dbError) {
                setLoading(false);
                toast.error(dbError.message.includes("unique")
                    ? "Username already taken. Try another."
                    : "Account created but profile save failed.");
                return;
            }
        }

        setLoading(false);
        toast.success("Welcome to SyncRoute! ✈️ Let's start planning.");
        router.push("/dashboard");
    };

    const slideVariants = {
        initial: (d: number) => ({ opacity: 0, x: d * 48 }),
        animate: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d * -48 }),
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center font-sans overflow-hidden">
            {/* Global toast — z-index above all overlays */}
            <Toaster
                position="top-center"
                containerStyle={{ zIndex: 99999 }}
                toastOptions={{
                    style: {
                        background: "#1a1a1a",
                        color: "#f3f4f6",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        fontSize: "13px",
                        fontWeight: 500,
                    },
                    success: { iconTheme: { primary: "#3b82f6", secondary: "#fff" } },
                    error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
                }}
            />

            {/* ── Background ── */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80"
                    alt="Travel background"
                    className="w-full h-full object-cover"
                />
                {/* Multi-layer overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#020818]/75 to-blue-950/70" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "48px 48px"
                }} />
            </div>

            {/* ── Logo top-left ── */}
            <a href="/" className="absolute top-6 left-8 z-20 flex items-center gap-2 cursor-pointer">
                <img src="/logo.png" alt="SyncRoute" className="h-8 w-8 object-contain" />
                <span className="font-heading text-2xl tracking-[0.15em] text-white">SYNC<span className="text-blue-500">ROUTE</span></span>
            </a>

            {/* ── Step counter top-right ── */}
            <p className="absolute top-7 right-8 z-20 text-xs text-white/40 font-semibold tracking-widest uppercase">
                Step {step + 1} of 5
            </p>

            {/* ── Glassmorphic Card ── */}
            <div className="relative z-10 w-full max-w-xl mx-4">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-black/50 p-8 sm:p-10 overflow-hidden">

                    {/* Heading (static, fades with step) */}
                    <AnimatePresence mode="wait">
                        <motion.div key={`heading-${step}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="mb-7"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                    {["Budget & Pacing", "Dietary & Transport", "Travel Style", "Interests", "Create Account"][step]}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{SLIDES[step].heading}</h1>
                            <p className="text-sm text-white/45 mt-1">{SLIDES[step].sub}</p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Slide content */}
                    <div className="min-h-[280px]">
                        <AnimatePresence mode="wait" custom={dir}>
                            <motion.div
                                key={step}
                                custom={dir}
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                            >
                                {step === 0 && <Slide1 state={form} set={setField} />}
                                {step === 1 && <Slide2 state={form} set={setField} />}
                                {step === 2 && <Slide3 state={form} set={setField} />}
                                {step === 3 && <Slide4 state={form} set={setField} />}
                                {step === 4 && (
                                    <Slide5
                                        username={username} onUsername={handleUsername}
                                        email={email} onEmail={setEmail}
                                        password={password} onPassword={setPassword}
                                        confirm={confirm} onConfirm={setConfirm}
                                        usernameError={usernameError} onBlurUsername={checkUsernameUnique}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── Navigation ── */}
                    <div className="mt-8 flex items-center justify-between gap-4">
                        {/* Back */}
                        <div className="w-24">
                            {step > 0 && (
                                <motion.button
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    onClick={() => go(step - 1)}
                                    className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors cursor-pointer font-semibold"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </motion.button>
                            )}
                        </div>

                        {/* Dots */}
                        <div className="flex gap-2 items-center">
                            {[0, 1, 2, 3, 4].map(i => (
                                <button key={i} onClick={() => i < step && go(i)} className="cursor-pointer">
                                    <motion.div
                                        animate={{ width: i === step ? 24 : 8, backgroundColor: i === step ? "#3b82f6" : i < step ? "#60a5fa" : "rgba(255,255,255,0.2)" }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="h-2 rounded-full"
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Next / Submit */}
                        <div className="w-24 flex justify-end">
                            {step < 4 ? (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => go(step + 1)}
                                    className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl font-semibold cursor-pointer transition-all shadow-lg shadow-blue-500/30"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileTap={{ scale: loading ? 1 : 0.95 }}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/30 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <><Check className="w-4 h-4" /> Create Account</>}
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom hint */}
                <p className="text-center text-xs text-white/25 mt-5">
                    Already have an account?{" "}
                    <a href="/?login=true" className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-semibold">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}
