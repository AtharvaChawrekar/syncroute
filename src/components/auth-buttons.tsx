"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

/* ─── Shared Input Styles ─── */
const inputBase =
    "w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-gray-400";

function Label({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider uppercase">
            {children}
        </p>
    );
}

/* ─── View Slide Variants ─── */
type Direction = 1 | -1;

function makeVariants(direction: Direction) {
    return {
        initial: { opacity: 0, x: direction * 36 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -36 },
    };
}

/* ─── View Types ─── */
type View = "login" | "signup" | "forgot" | "sent";

/* ─── Main Auth Modal ─── */
function AuthModal({ open, initialView, onClose }: {
    open: boolean;
    initialView: View;
    onClose: () => void;
}) {
    const [view, setView] = useState<View>(initialView);
    const [direction, setDirection] = useState<Direction>(1);
    const [forgotEmail, setForgotEmail] = useState("");

    const navigate = (to: View, dir: Direction = 1) => {
        setDirection(dir);
        setView(to);
    };

    // Sync view when modal reopens
    const handleOpenChange = (v: boolean) => {
        if (!v) { onClose(); setTimeout(() => setView(initialView), 300); }
    };

    const transition = { type: "tween" as const, ease: "easeInOut" as const, duration: 0.28 };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md rounded-3xl p-8 bg-white dark:bg-[#1A1A1A] border-none shadow-2xl overflow-hidden">
                <VisuallyHidden><DialogTitle>Authentication</DialogTitle></VisuallyHidden>

                <AnimatePresence mode="wait" initial={false} custom={direction}>

                    {/* ── LOGIN ── */}
                    {view === "login" && (
                        <motion.div key="login" variants={makeVariants(direction)} {...{ initial: "initial", animate: "animate", exit: "exit" }} transition={transition}>
                            <h2 className="font-heading text-3xl text-center text-gray-900 dark:text-white mb-1">Welcome Back</h2>
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                                Log in to continue planning your next adventure.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <Label>Email Address</Label>
                                    <input className={inputBase} placeholder="you@example.com" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <Label>Password</Label>
                                        <button onClick={() => navigate("forgot", 1)}
                                            className="text-xs text-blue-500 hover:text-blue-400 font-semibold cursor-pointer transition-colors">
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <input className={inputBase} type="password" placeholder="••••••••" />
                                </div>

                                <a href="/dashboard" className="block">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                                        Login
                                    </Button>
                                </a>

                                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    Don&apos;t have an account?{" "}
                                    <a href="/onboarding" className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer transition-colors">
                                        Get Started
                                    </a>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── SIGN UP ── */}
                    {view === "signup" && (
                        <motion.div key="signup" variants={makeVariants(direction)} {...{ initial: "initial", animate: "animate", exit: "exit" }} transition={transition}>
                            <h2 className="font-heading text-3xl text-center text-gray-900 dark:text-white mb-1">Join SyncRoute</h2>
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                                Create your account and start planning trips with AI.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <Label>Username</Label>
                                    <input className={inputBase} placeholder="e.g. rahul_travels" />
                                </div>
                                <div>
                                    <Label>Email Address</Label>
                                    <input className={inputBase} placeholder="you@example.com" />
                                </div>
                                <div>
                                    <Label>Password</Label>
                                    <input className={inputBase} type="password" placeholder="Min. 8 characters" />
                                </div>
                                <div>
                                    <Label>Confirm Password</Label>
                                    <input className={inputBase} type="password" placeholder="Repeat your password" />
                                </div>

                                <a href="/dashboard" className="block pt-1">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                                        Create Account
                                    </Button>
                                </a>

                                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                    Already have an account?{" "}
                                    <button onClick={() => navigate("login", -1)}
                                        className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold cursor-pointer transition-colors">
                                        Login
                                    </button>
                                </p>

                                <p className="text-center text-[11px] text-gray-400">
                                    By signing up you agree to our{" "}
                                    <span className="text-blue-500 hover:underline cursor-pointer">Terms</span> &{" "}
                                    <span className="text-blue-500 hover:underline cursor-pointer">Privacy Policy</span>.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── FORGOT PASSWORD ── */}
                    {view === "forgot" && (
                        <motion.div key="forgot" variants={makeVariants(direction)} {...{ initial: "initial", animate: "animate", exit: "exit" }} transition={transition}>
                            <button onClick={() => navigate("login", -1)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer mb-5">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                            </button>

                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                    <Mail className="w-7 h-7 text-blue-500" />
                                </div>
                            </div>

                            <h2 className="font-heading text-3xl text-center text-gray-900 dark:text-white mb-1">Reset Password</h2>
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                                Enter your email and we&apos;ll send you a reset link.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <Label>Email Address</Label>
                                    <input className={inputBase} placeholder="you@example.com"
                                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoFocus />
                                </div>
                                <Button onClick={() => { if (forgotEmail.trim()) navigate("sent", 1); }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                                    Send Reset Link
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── EMAIL SENT ── */}
                    {view === "sent" && (
                        <motion.div key="sent" variants={makeVariants(direction)} {...{ initial: "initial", animate: "animate", exit: "exit" }} transition={transition}
                            className="flex flex-col items-center text-center py-2 gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-heading text-2xl text-gray-900 dark:text-white mb-1">Check your inbox!</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    We&apos;ve sent a password reset link to<br />
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{forgotEmail}</span>
                                </p>
                            </div>
                            <p className="text-xs text-gray-400">
                                Didn&apos;t receive it?{" "}
                                <button onClick={() => navigate("forgot", -1)}
                                    className="text-blue-500 hover:underline cursor-pointer font-semibold">
                                    Try again
                                </button>
                            </p>
                            <Button onClick={() => navigate("login", -1)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-sm font-semibold shadow-lg shadow-blue-500/25 cursor-pointer">
                                Back to Login
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

import { Suspense } from "react";

/* ─── Exported Navbar Auth Section ─── */
function AuthButtonsInner() {
    const [open, setOpen] = useState(false);
    const [initialView, setInitialView] = useState<View>("login");
    const searchParams = useSearchParams();
    const router = useRouter();

    // Auto-open login modal when redirected from onboarding via /?login=true
    useEffect(() => {
        if (searchParams.get("login") === "true") {
            setInitialView("login");
            setOpen(true);
            // Clean the URL without re-render
            router.replace("/", { scroll: false });
        }
    }, [searchParams, router]);

    const openAs = (view: View) => { setInitialView(view); setOpen(true); };

    return (
        <div className="flex items-center gap-3">
            <ModeToggle />
            <button onClick={() => openAs("login")}
                className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer px-2">
                Login
            </button>
            <a href="/onboarding">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
                    Get Started
                </Button>
            </a>
            <AuthModal open={open} initialView={initialView} onClose={() => setOpen(false)} />
        </div>
    );
}

export function AuthButtons() {
    return (
        <Suspense fallback={<div className="flex items-center gap-3 h-9 w-40" />}>
            <AuthButtonsInner />
        </Suspense>
    );
}
