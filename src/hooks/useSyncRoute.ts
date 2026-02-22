/**
 * SyncRoute – Real Supabase Hooks
 *
 * Tables used:
 *   public.users       – id, username, email, preferences (jsonb)
 *   public.trips       – id, title, vibe, theme_color, created_by, is_workspace, created_at
 *   public.trip_members – trip_id, user_id, joined_at
 *   public.invitations  – id, trip_id, inviter_id, invitee_id, status, created_at
 *   public.messages     – id, trip_id, sender_id, content, is_ai, created_at
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

export interface Profile {
    id: string;
    username: string;
    email: string;
    avatar_color: string;
    budget_pref: number;
    pace_pref: number;
    interests: string[];
}

export interface Message {
    id: string;
    trip_id: string;
    user_id: string;
    username: string;
    avatar: string;
    avatar_color: string;
    text: string;
    time: string;
    isAI: boolean;
    isYou?: boolean;
    isStreaming?: boolean;   // true while Groq tokens are being received
    reply_to?: { username: string; text: string } | null;
}

export interface Trip {
    id: string;
    name: string;
    description: string;
    color: string;
    lastMsg: string;
    unread: number;
    active: boolean;
    members: string[];
    is_workspace: boolean;
}

export interface Invitation {
    id: string;
    fromUsername: string;
    tripName: string;
    tripColor: string;
    trip_id: string;
}

// ─── COLOUR HELPERS ────────────────────────────────────────────────────────────

const AVATAR_COLOURS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];
function colourFor(str: string) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + h * 31;
    return AVATAR_COLOURS[Math.abs(h) % AVATAR_COLOURS.length];
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── HOOK: useCurrentUser ──────────────────────────────────────────────────────

export function useCurrentUser() {
    const [supaUser, setSupaUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (uid: string) => {
        const { data } = await supabase.from("users").select("*").eq("id", uid).single();
        if (data) {
            const prefs = (data.preferences as Record<string, unknown>) ?? {};
            setProfile({
                id: data.id,
                username: data.username ?? "You",
                email: data.email ?? "",
                avatar_color: (prefs.avatar_color as string) ?? colourFor(data.username ?? uid),
                budget_pref: (prefs.budget as number) ?? 65,
                pace_pref: (prefs.pace as number) ?? 70,
                interests: (prefs.interests as string[]) ?? [],
            });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setSupaUser(u);
            if (u) loadProfile(u.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
            const u = session?.user ?? null;
            setSupaUser(u);
            if (u) loadProfile(u.id);
            else { setProfile(null); setLoading(false); }
        });

        return () => subscription.unsubscribe();
    }, [loadProfile]);

    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (!supaUser) return;
        setProfile(prev => prev ? { ...prev, ...updates } : prev);
        // merge into preferences jsonb
        const prefPatch: Record<string, unknown> = {};
        if (updates.budget_pref !== undefined) prefPatch.budget = updates.budget_pref;
        if (updates.pace_pref !== undefined) prefPatch.pace = updates.pace_pref;
        if (updates.interests !== undefined) prefPatch.interests = updates.interests;
        if (Object.keys(prefPatch).length) {
            const { data: existing } = await supabase.from("users").select("preferences").eq("id", supaUser.id).single();
            await supabase.from("users").update({
                preferences: { ...((existing?.preferences as object) ?? {}), ...prefPatch },
            }).eq("id", supaUser.id);
        }
    }, [supaUser]);

    return { user: supaUser, profile, loading, updateProfile };
}

// ─── HOOK: useTrips ────────────────────────────────────────────────────────────

export function useTrips(userId: string | null) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrips = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);

        try {
            // Step 1: get trip IDs this user belongs to
            const { data: memberRows, error: memberErr } = await supabase
                .from("trip_members")
                .select("trip_id")
                .eq("user_id", userId);

            if (memberErr) { console.error("fetchTrips:members", memberErr); setLoading(false); return; }
            const tripIds = (memberRows ?? []).map(r => r.trip_id);

            if (tripIds.length === 0) { setTrips([]); setLoading(false); return; }

            // Step 2a: trip details
            const { data: tripRows, error: tripErr } = await supabase
                .from("trips")
                .select("id, title, vibe, theme_color, is_workspace, created_at")
                .in("id", tripIds);
            if (tripErr) { console.error("fetchTrips:trips", tripErr); setLoading(false); return; }

            // Step 2b: all members for these trips (username via join)
            const { data: allMemberRows, error: memberDetailErr } = await supabase
                .from("trip_members")
                .select("trip_id, users!inner(username)")
                .in("trip_id", tripIds);
            if (memberDetailErr) console.warn("fetchTrips:memberDetail", memberDetailErr);

            const membersByTrip: Record<string, string[]> = {};
            for (const row of allMemberRows ?? []) {
                const uname = (row.users as unknown as { username: string })?.username ?? "?";
                if (!membersByTrip[row.trip_id]) membersByTrip[row.trip_id] = [];
                membersByTrip[row.trip_id].push(uname);
            }

            const mapped: Trip[] = (tripRows ?? []).map(t => ({
                id: t.id,
                name: t.title,
                description: t.vibe ?? "",
                color: t.theme_color,
                lastMsg: "",
                unread: 0,
                active: false,
                members: membersByTrip[t.id] ?? [],
                is_workspace: t.is_workspace,
            }));
            mapped.sort((a, b) => (a.is_workspace ? -1 : b.is_workspace ? 1 : 0));
            setTrips(mapped);
        } catch (e) {
            console.error("fetchTrips:unexpected", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Ensure a safarDM trip exists for this user
    const ensureSafarDM = useCallback(async (): Promise<string | null> => {
        if (!userId) return null;
        // Already in trips list?
        const existing = trips.find(t => t.is_workspace);
        if (existing) return existing.id;
        // Query DB directly
        const { data: memberRow } = await supabase
            .from("trip_members")
            .select("trip_id, trips!inner(id, is_workspace)")
            .eq("user_id", userId)
            .filter("trips.is_workspace", "eq", true)
            .maybeSingle();
        if (memberRow) return (memberRow as { trip_id: string }).trip_id;
        // Create one
        const { data: newTrip } = await supabase.from("trips").insert({
            title: "Safar AI",
            vibe: "Your private AI travel assistant",
            theme_color: "#6366f1",
            created_by: userId,
            is_workspace: true,
        }).select("id").single();
        if (newTrip) {
            await supabase.from("trip_members").insert({ trip_id: newTrip.id, user_id: userId });
            return newTrip.id;
        }
        return null;
    }, [userId, trips]);

    useEffect(() => {
        if (userId) fetchTrips();
    }, [userId, fetchTrips]);

    const addTrip = useCallback(async (name: string, description: string, color: string): Promise<string | null> => {
        if (!userId) return null;
        const { data } = await supabase.from("trips").insert({
            title: name,
            vibe: description,
            theme_color: color,
            created_by: userId,
            is_workspace: false,
        }).select("id").single();
        if (data) {
            await supabase.from("trip_members").insert({ trip_id: data.id, user_id: userId });
            await fetchTrips();
            return data.id;
        }
        return null;
    }, [userId, fetchTrips]);

    const deleteTrip = useCallback(async (id: string) => {
        await supabase.from("trips").delete().eq("id", id);
        setTrips(prev => prev.filter(t => t.id !== id));
    }, []);

    // Local-only collaborator add (for optimistic UI; real invite goes through invitations table)
    const addCollaborator = useCallback((tripId: string, memberName: string) => {
        if (!memberName.trim()) return;
        setTrips(prev => prev.map(t =>
            t.id === tripId && !t.members.includes(memberName)
                ? { ...t, members: [...t.members, memberName] } : t
        ));
    }, []);

    return { trips, loading, addTrip, deleteTrip, addCollaborator, ensureSafarDM, refetchTrips: fetchTrips };
}

// Re-export for dashboard compat
export function useProfile() {
    const { profile, updateProfile, loading } = useCurrentUser();
    return { profile: profile ?? { id: "", username: "You", email: "", avatar_color: "#3b82f6", budget_pref: 65, pace_pref: 70, interests: [] }, updateProfile, loading };
}

// ─── HOOK: useChatMessages ────────────────────────────────────────────────────

export function useChatMessages(tripId: string | null, currentUser: Profile | null, isWorkspace?: boolean) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const messagesRef = useRef<Message[]>([]);
    messagesRef.current = messages;
    const processedIdsRef = useRef<Set<string>>(new Set());

    const toClientMsg = useCallback((m: {
        id: string; trip_id: string; sender_id: string | null; is_ai: boolean;
        content: string; created_at: string; users?: { username: string } | null;
    }, selfId?: string): Message => ({
        id: m.id,
        trip_id: m.trip_id,
        user_id: m.sender_id ?? "ai",
        username: m.is_ai ? "Safar AI" : (m.users?.username ?? "Unknown"),
        avatar: m.is_ai ? "✦" : (m.users?.username?.charAt(0).toUpperCase() ?? "?"),
        avatar_color: m.is_ai ? "#6366f1" : colourFor(m.users?.username ?? m.sender_id ?? "x"),
        text: m.content,
        time: fmtTime(m.created_at),
        isAI: m.is_ai,
        isYou: m.sender_id === selfId,
    }), []);

    useEffect(() => {
        if (!tripId) { setMessages([]); processedIdsRef.current.clear(); return; }
        setLoading(true);
        setMessages([]);
        processedIdsRef.current.clear();

        // Fetch historical messages
        (async () => {
            const { data } = await supabase
                .from("messages")
                .select("*, users(username)")
                .eq("trip_id", tripId)
                .order("created_at", { ascending: true });
            if (data) setMessages(data.map(m => toClientMsg(m, currentUser?.id)));
            setLoading(false);
        })();

        // Realtime subscription — fires for ALL users' messages
        const channel = supabase
            .channel(`messages:${tripId}:${Date.now()}`) // unique channel name avoids stale channel reuse
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `trip_id=eq.${tripId}`,
            }, async (payload) => {
                const m = payload.new as { id: string; trip_id: string; sender_id: string | null; is_ai: boolean; content: string; created_at: string };

                // Deduplicate: skip if already processed (Set check is synchronous, unlike state)
                if (processedIdsRef.current.has(m.id)) return;
                if (messagesRef.current.some(ex => ex.id === m.id)) return;
                processedIdsRef.current.add(m.id);

                // For own messages: if there's a temp optimistic message with matching content + sender, replace it
                // instead of adding a duplicate
                const selfId = currentUser?.id;
                if (selfId && m.sender_id === selfId) {
                    setMessages(prev => {
                        const tempIdx = prev.findIndex(ex => ex.id.startsWith("temp-") && ex.user_id === selfId && ex.text === m.content);
                        if (tempIdx !== -1) {
                            // Replace the temp bubble with the real one
                            const updated = [...prev];
                            updated[tempIdx] = { ...updated[tempIdx], id: m.id };
                            return updated;
                        }
                        // No temp found — just append (edge case)
                        return [...prev, toClientMsg({ ...m, users: { username: currentUser?.username ?? "You" } }, selfId)];
                    });
                    return;
                }

                // Message from another user or AI — fetch their username and append
                let username = m.is_ai ? "Safar AI" : "Unknown";
                if (m.sender_id && !m.is_ai) {
                    const { data: u } = await supabase.from("users").select("username").eq("id", m.sender_id).single();
                    if (u) username = u.username;
                }
                setMessages(prev => [...prev, toClientMsg({ ...m, users: { username } }, currentUser?.id)]);
            })
            .subscribe((status) => {
                if (status === "CHANNEL_ERROR") {
                    console.error("Realtime channel error on messages:", tripId);
                }
            });

        return () => { supabase.removeChannel(channel); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]);


    // @Safar AI helper — streams tokens from /api/safar (SSE)
    const callSafar = useCallback(async (userText: string) => {
        if (!tripId) return;
        setAiLoading(true);

        // Create a placeholder bubble immediately
        const streamId = `stream-${Date.now()}`;
        const nowIso = new Date().toISOString();
        const streamingMsg: Message = {
            id: streamId,
            trip_id: tripId,
            user_id: "ai",
            username: "Safar AI",
            avatar: "✦",
            avatar_color: "#6366f1",
            text: "",
            time: fmtTime(nowIso),
            isAI: true,
            isYou: false,
            isStreaming: true,
        };
        setMessages(prev => [...prev, streamingMsg]);

        try {
            // Build context from last 12 messages (skip any streaming placeholders)
            const recent = messagesRef.current
                .filter(m => !m.isStreaming && m.text.trim())
                .slice(-12)
                .map(m => ({
                    role: (m.isAI ? "assistant" : "user") as "assistant" | "user",
                    content: m.text,
                }));
            recent.push({ role: "user", content: userText });

            const res = await fetch("/api/safar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: recent }),
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullReply = "";
            let buffer = "";

            // Read SSE stream token by token
            outer: while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // Process complete lines from buffer
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? ""; // keep incomplete last line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;
                    const payload = trimmed.slice(5).trim();
                    if (payload === "[DONE]") break outer;
                    try {
                        const parsed = JSON.parse(payload);
                        const token: string = parsed.choices?.[0]?.delta?.content ?? "";
                        if (token) {
                            fullReply += token;
                            setMessages(prev => prev.map(m =>
                                m.id === streamId ? { ...m, text: fullReply } : m
                            ));
                        }
                        // Groq signals finish_reason=stop inline
                        if (parsed.choices?.[0]?.finish_reason === "stop") break outer;
                    } catch { /* skip malformed chunks */ }
                }
            }

            const finalText = fullReply.trim() || "...";

            // Persist to DB
            const { data: aiMsg } = await supabase.from("messages").insert({
                trip_id: tripId,
                sender_id: null,
                content: finalText,
                is_ai: true,
            }).select("id, created_at").single();

            // Replace streaming placeholder with real record
            setMessages(prev => prev.map(m =>
                m.id === streamId
                    ? { ...m, id: aiMsg?.id ?? streamId, text: finalText, time: fmtTime(aiMsg?.created_at ?? nowIso), isStreaming: false }
                    : m
            ));
        } catch (e) {
            console.error("@Safar stream error:", e);
            setMessages(prev => prev.map(m =>
                m.id === streamId
                    ? { ...m, text: "Sorry, Safar hit a snag. Try again! ✈️", isStreaming: false }
                    : m
            ));
        } finally {
            setAiLoading(false);
        }
    }, [tripId, currentUser?.id]);

    const sendMessage = useCallback(async (
        text: string,
        replyTo?: { username: string; text: string } | null,
        skipAI?: boolean
    ) => {
        if (!tripId || !currentUser || !text.trim()) return;

        // Optimistic local insert
        const tempId = `temp-${Date.now()}`;
        const optimistic: Message = {
            id: tempId,
            trip_id: tripId,
            user_id: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.username.charAt(0).toUpperCase(),
            avatar_color: currentUser.avatar_color,
            text,
            time: fmtTime(new Date().toISOString()),
            isAI: false,
            isYou: true,
            reply_to: replyTo ?? null,
        };
        setMessages(prev => [...prev, optimistic]);

        // Persist to DB (replace temp after realtime echoes, or keep as-is)
        const { data: saved } = await supabase.from("messages").insert({
            trip_id: tripId,
            sender_id: currentUser.id,
            content: text,
            is_ai: false,
        }).select("id, created_at").single();

        // Replace temp id with real id
        if (saved) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: saved.id, time: fmtTime(saved.created_at) } : m));
        }

        // AI trigger: @Safar keyword OR workspace (every msg goes to AI)
        // Skip if caller already handles it (e.g. itinerary generation uses its own endpoint)
        const shouldCallAI = !skipAI && (isWorkspace || /\@Safar\b/i.test(text));
        if (shouldCallAI) await callSafar(text);
    }, [tripId, currentUser, isWorkspace, callSafar]);

    return { messages, loading, aiLoading, sendMessage };
}

// ─── HOOK: useInvitations ─────────────────────────────────────────────────────

export function useInvitations(userId: string | null) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInvitations = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const { data } = await supabase
            .from("invitations")
            .select(`
                id, trip_id, status, created_at,
                trips ( title, theme_color ),
                inviter:users!invitations_inviter_id_fkey ( username )
            `)
            .eq("invitee_id", userId)
            .eq("status", "pending");

        if (data) {
            setInvitations(data.map(inv => {
                type InvJoin = {
                    id: string; trip_id: string; status: string; created_at: string;
                    trips: { title: string; theme_color: string }[] | null;
                    inviter: { username: string }[] | null;
                };
                const row = (inv as unknown) as InvJoin;
                const trip = Array.isArray(row.trips) ? row.trips[0] : row.trips;
                const inviter = Array.isArray(row.inviter) ? row.inviter[0] : row.inviter;
                return {
                    id: row.id,
                    fromUsername: inviter?.username ?? "Someone",
                    tripName: trip?.title ?? "A trip",
                    tripColor: trip?.theme_color ?? "#3b82f6",
                    trip_id: row.trip_id,
                };
            }));
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchInvitations();

        if (!userId) return;
        // Realtime: new invitation for me
        const channel = supabase
            .channel(`invitations:${userId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "invitations",
                filter: `invitee_id=eq.${userId}`,
            }, () => { fetchInvitations(); })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId, fetchInvitations]);

    // Send invite by username (case-insensitive)
    const sendInvite = useCallback(async (tripId: string, inviterId: string, username: string): Promise<"ok" | "not_found" | "already" | "error"> => {
        // 1) Look up the invitee by username
        const { data: targetUser, error: lookupErr } = await supabase
            .from("users")
            .select("id")
            .ilike("username", username.trim())
            .limit(1)
            .maybeSingle();

        if (lookupErr) { console.error("sendInvite:lookup", lookupErr); return "error"; }
        if (!targetUser) return "not_found";

        // 2) Prevent self-invite
        if (targetUser.id === inviterId) return "already";

        // 3) Check if already a member of this trip
        const { data: existingMember } = await supabase
            .from("trip_members")
            .select("user_id")
            .eq("trip_id", tripId)
            .eq("user_id", targetUser.id)
            .maybeSingle();
        if (existingMember) return "already";

        // 4) Insert the invitation
        const { error } = await supabase.from("invitations").insert({
            trip_id: tripId,
            inviter_id: inviterId,
            invitee_id: targetUser.id,
            status: "pending",
        });
        if (error) {
            console.error("sendInvite:insert", error);
            if (error.code === "23505") return "already"; // unique constraint violation
            return "error";
        }
        return "ok";
    }, []);

    const acceptInvitation = useCallback(async (invId: string, tripId: string, inviteeId: string, refetchTrips: () => void) => {
        await supabase.from("invitations").update({ status: "accepted" }).eq("id", invId);
        await supabase.from("trip_members").upsert({ trip_id: tripId, user_id: inviteeId }, { onConflict: "trip_id,user_id" });
        setInvitations(prev => prev.filter(i => i.id !== invId));
        refetchTrips();
    }, []);

    const declineInvitation = useCallback(async (invId: string) => {
        await supabase.from("invitations").update({ status: "declined" }).eq("id", invId);
        setInvitations(prev => prev.filter(i => i.id !== invId));
    }, []);

    return { invitations, loading, sendInvite, acceptInvitation, declineInvitation, refetchInvitations: fetchInvitations };
}

// ─── HOOK: useTyping ──────────────────────────────────────────────────────────
// Uses Supabase Realtime Broadcast (no DB writes) to share typing presence.

export function useTyping(tripId: string | null, currentUsername: string | null) {
    // List of OTHER users currently typing (their usernames)
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    // Ref to the broadcast channel so we can send events
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    // Timer ref to auto-clear our own typing status
    const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Per-user expiry timers so remote users auto-clear if they disconnect
    const userTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        if (!tripId) return;

        const channel = supabase
            .channel(`typing:${tripId}`, { config: { broadcast: { self: false } } })
            .on("broadcast", { event: "typing" }, ({ payload }: { payload: { username: string; isTyping: boolean } }) => {
                const { username, isTyping } = payload;

                // Clear any existing auto-expire timer for this user
                if (userTimers.current[username]) {
                    clearTimeout(userTimers.current[username]);
                    delete userTimers.current[username];
                }

                if (isTyping) {
                    setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
                    // Auto-remove after 3s in case the "stopped" event is missed
                    userTimers.current[username] = setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u !== username));
                        delete userTimers.current[username];
                    }, 3000);
                } else {
                    setTypingUsers(prev => prev.filter(u => u !== username));
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
            // Clear all expiry timers
            Object.values(userTimers.current).forEach(clearTimeout);
            userTimers.current = {};
        };
    }, [tripId]);

    // Called by the input's onChange — debounced stop after 2.5s of no keystrokes
    const broadcastTyping = useCallback(() => {
        if (!channelRef.current || !currentUsername) return;

        // Send "started typing"
        channelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: { username: currentUsername, isTyping: true },
        });

        // Reset the stop timer
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
            channelRef.current?.send({
                type: "broadcast",
                event: "typing",
                payload: { username: currentUsername, isTyping: false },
            });
        }, 2500);
    }, [currentUsername]);

    // Call this when message is sent to immediately clear typing indicator
    const stopTyping = useCallback(() => {
        if (!channelRef.current || !currentUsername) return;
        if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
        channelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: { username: currentUsername, isTyping: false },
        });
    }, [currentUsername]);

    return { typingUsers, broadcastTyping, stopTyping };
}
