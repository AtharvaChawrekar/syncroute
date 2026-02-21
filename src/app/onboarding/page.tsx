"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

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
const DIETARY = [
    { id: "veg", label: "Pure Veg", icon: "🥦" },
    { id: "egg", label: "Eggetarian", icon: "🥚" },
    { id: "nonveg", label: "Non-Veg", icon: "🍖" },
    { id: "vegan", label: "Vegan", icon: "🌱" },
    { id: "jain", label: "Jain", icon: "🕊️" },
];

const TRANSPORT = [
    { id: "train", label: "Train", icon: "🚆" },
    { id: "flight", label: "Flight", icon: "✈️" },
    { id: "bus", label: "Bus", icon: "🚌" },
    { id: "drive", label: "Self-Drive", icon: "🚗" },
    { id: "cab", label: "Cab/Taxi", icon: "🚕" },
];

const TRAVEL_STYLE = [
    { id: "solo", label: "Solo", icon: "🧍", desc: "Just me, myself & I" },
    { id: "partner", label: "With Partner", icon: "💑", desc: "Romantic adventures" },
    { id: "friends", label: "With Friends", icon: "👯", desc: "Crew mode on" },
    { id: "family", label: "With Family", icon: "👨‍👩‍👧‍👦", desc: "Everyone's together" },
    { id: "kids", label: "With Kids", icon: "🧒", desc: "Kid-friendly escapes" },
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
   DUAL THUMB (Time Window) — simulated with two overlapping sliders
────────────────────────────────────────────────────────── */
function DualSlider({ startHour, endHour, onChangeStart, onChangeEnd }:
    { startHour: number; endHour: number; onChangeStart: (v: number) => void; onChangeEnd: (v: number) => void }) {
    const MIN = 4; const MAX = 24;
    const s = ((startHour - MIN) / (MAX - MIN)) * 100;
    const e = ((endHour - MIN) / (MAX - MIN)) * 100;
    return (
        <div className="relative h-6 flex items-center mt-1">
            <div className="absolute w-full h-1.5 rounded-full bg-white/10" />
            <div className="absolute h-1.5 rounded-full bg-blue-500" style={{ left: `${s}%`, width: `${e - s}%` }} />
            {/* Start thumb */}
            <input type="range" min={MIN} max={endHour - 1} value={startHour}
                onChange={e => onChangeStart(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer" style={{ zIndex: 3 }} />
            {/* End thumb */}
            <input type="range" min={startHour + 1} max={MAX} value={endHour}
                onChange={e => onChangeEnd(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer" style={{ zIndex: 3 }} />
            <div className="absolute w-5 h-5 rounded-full bg-white shadow-lg border-2 border-blue-500 pointer-events-none" style={{ left: `calc(${s}% - 10px)` }} />
            <div className="absolute w-5 h-5 rounded-full bg-white shadow-lg border-2 border-blue-400 pointer-events-none" style={{ left: `calc(${e}% - 10px)` }} />
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
                <div className="flex justify-between items-end mb-3">
                    <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Preferred Hours</p>
                    <p className="text-xs text-blue-400 font-semibold">{formatHour(state.startHour)} → {formatHour(state.endHour)}</p>
                </div>
                <DualSlider
                    startHour={state.startHour} endHour={state.endHour}
                    onChangeStart={v => set({ startHour: v })} onChangeEnd={v => set({ endHour: v })}
                />
                <div className="flex justify-between text-[11px] text-white/30 mt-2">
                    <span>4 AM</span><span>Midnight</span>
                </div>
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
                            <span className="text-2xl">{d.icon}</span>
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
                                <span>{t.icon}</span> {t.label}
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
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer text-left group ${state.travelStyle === s.id
                            ? "bg-blue-600/25 border-blue-500 shadow-lg shadow-blue-500/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25"}`}>
                        <span className="text-3xl">{s.icon}</span>
                        <div>
                            <p className={`font-bold text-sm ${state.travelStyle === s.id ? "text-blue-300" : "text-white"}`}>{s.label}</p>
                            <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                        </div>
                        {state.travelStyle === s.id && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
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
   SLIDE META
────────────────────────────────────────────────────────── */
const SLIDES = [
    { heading: "Set your travel rhythm.", sub: "Tell @Safar how you like to move." },
    { heading: "How do you move and eat?", sub: "Help us personalise every meal and journey." },
    { heading: "Who do you explore with?", sub: "We'll tailor recommendations for your crew." },
    { heading: "What makes a trip memorable?", sub: "Select all that spark joy for you." },
];

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [form, setForm] = useState<OnboardingState>(INITIAL_STATE);

    const setField = (patch: Partial<OnboardingState>) => setForm(prev => ({ ...prev, ...patch }));

    const go = (newStep: number) => {
        setDir(newStep > step ? 1 : -1);
        setStep(newStep);
    };

    const handleSubmit = () => {
        // TODO: await supabase.from('profiles').upsert({ ...form, user_id: session.user.id })
        console.log("Onboarding payload →", JSON.stringify(form, null, 2));
        router.push("/dashboard");
    };

    const slideVariants = {
        initial: (d: number) => ({ opacity: 0, x: d * 48 }),
        animate: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d * -48 }),
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center font-sans overflow-hidden">

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
                Step {step + 1} of 4
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
                                    {["Budget & Pacing", "Dietary & Transport", "Travel Style", "Interests"][step]}
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
                            {[0, 1, 2, 3].map(i => (
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
                            {step < 3 ? (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => go(step + 1)}
                                    className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl font-semibold cursor-pointer transition-all shadow-lg shadow-blue-500/30"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSubmit}
                                    className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/30 whitespace-nowrap"
                                >
                                    <Check className="w-4 h-4" /> Create Account
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom hint */}
                <p className="text-center text-xs text-white/25 mt-5">
                    Already have an account?{" "}
                    <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-semibold">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}
