/**
 * SyncRoute – Supabase Hook Stubs
 *
 * These are mock hooks that mirror the Supabase relational schema:
 *   messages  (id, trip_id, user_id, text, created_at, reply_to_id)
 *   profiles  (id, username, email, avatar_color, budget_pref, pace_pref, interests)
 *   trips     (id, name, description, color, created_by)
 *   trip_members (trip_id, user_id, role)
 *
 * To wire real Supabase data:
 *   1. npm install @supabase/supabase-js
 *   2. Create lib/supabase.ts with createClient(SUPABASE_URL, ANON_KEY)
 *   3. Replace the mock return values below with real queries, e.g.:
 *        const { data } = await supabase.from('messages').select('*').eq('trip_id', tripId)
 *   4. For Realtime, subscribe inside useEffect:
 *        supabase.channel('messages').on('postgres_changes', ...).subscribe()
 */

import { useState, useEffect } from "react";

// ─── TYPES (mirror Supabase table columns) ──────────────────────────────────

export interface Profile {
    id: string;
    username: string;
    email: string;
    avatar_color: string;
    budget_pref: number;    // 0–100
    pace_pref: number;      // 0–100
    interests: string[];
}

export interface Message {
    id: number;
    trip_id: string;
    user_id: string;
    username: string;
    avatar: string;
    avatar_color: string;
    text: string;
    time: string;
    isAI: boolean;
    isYou?: boolean;
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
}

// ─── MOCK HOOK: useChatMessages ──────────────────────────────────────────────
// Replace mock data with: supabase.from('messages').select('*').eq('trip_id', tripId)
// Subscribe to realtime: supabase.channel(`messages:${tripId}`).on('postgres_changes', ...)

export const MOCK_MESSAGES: Message[] = [
    { id: 1, trip_id: "trip_1", user_id: "u1", username: "Rahul", avatar: "R", avatar_color: "#f97316", text: "Hey everyone! Let's finalize Goa plans 🏖️", time: "10:30 AM", isAI: false },
    { id: 2, trip_id: "trip_1", user_id: "u2", username: "Priya", avatar: "P", avatar_color: "#a855f7", text: "I'm in! But can we keep budget under ₹15K per person?", time: "10:32 AM", isAI: false },
    { id: 3, trip_id: "trip_1", user_id: "me", username: "You", avatar: "Y", avatar_color: "#3b82f6", text: "@Safar generate an itinerary for us — make it relaxing for Mom but adventurous for Rahul.", time: "10:35 AM", isAI: false, isYou: true },
    { id: 4, trip_id: "trip_1", user_id: "ai", username: "Safar AI", avatar: "✦", avatar_color: "#6366f1", text: "Got it! I've analyzed everyone's profiles. Here's a balanced 4-day Goa itinerary. Water sports in the morning for Rahul's peak energy, calm beach experiences for the afternoons. Budget optimized to ₹12,800/person. Check the itinerary panel →", time: "10:36 AM", isAI: true },
    { id: 5, trip_id: "trip_1", user_id: "u1", username: "Rahul", avatar: "R", avatar_color: "#f97316", text: "This looks amazing! Can we swap the museum visit for jet skiing?", time: "10:40 AM", isAI: false },
    { id: 6, trip_id: "trip_1", user_id: "ai", username: "Safar AI", avatar: "✦", avatar_color: "#6366f1", text: "Done! Swapped Goa State Museum with Jet Skiing at Baga Beach. +₹800/person to budget. Group consensus still within range. Updated itinerary is live →", time: "10:41 AM", isAI: true },
];

export function useChatMessages(_tripId: string) {
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [loading, setLoading] = useState(false);

    // TODO: Replace with Supabase Realtime subscription
    // useEffect(() => {
    //   const channel = supabase.channel(`messages:${_tripId}`)
    //     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
    //       (payload) => setMessages(prev => [...prev, payload.new as Message]))
    //     .subscribe();
    //   return () => { supabase.removeChannel(channel); };
    // }, [_tripId]);

    const sendMessage = (text: string, replyTo?: { username: string; text: string } | null) => {
        // TODO: await supabase.from('messages').insert({ trip_id: _tripId, text, reply_to_id: replyTo?.id })
        const newMsg: Message = {
            id: messages.length + 1,
            trip_id: _tripId,
            user_id: "me",
            username: "You",
            avatar: "Y",
            avatar_color: "#3b82f6",
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAI: false,
            isYou: true,
            reply_to: replyTo || null,
        };
        setMessages(prev => [...prev, newMsg]);
    };

    return { messages, loading, sendMessage };
}

// ─── MOCK HOOK: useTrips ─────────────────────────────────────────────────────
// Replace with: supabase.from('trips').select('*, trip_members(*)').eq('trip_members.user_id', userId)

export const MOCK_TRIPS: Trip[] = [
    { id: "trip_1", name: "Goa Trip with College Bros", description: "Beach vibes and adventure!", color: "#3b82f6", lastMsg: "@Safar find us a beach shack!", unread: 3, active: true, members: ["Rahul", "Priya", "You", "Aakash"] },
    { id: "trip_2", name: "Family Europe Tour", description: "Relaxed cultural exploration", color: "#a855f7", lastMsg: "Mom wants to visit the Louvre", unread: 0, active: false, members: ["Mom", "Dad", "You"] },
    { id: "trip_3", name: "Solo Japan Adventure", description: "Finding inner peace in Kyoto", color: "#10b981", lastMsg: "Exploring temples tomorrow", unread: 1, active: false, members: ["You"] },
    { id: "trip_4", name: "Couples Bali Getaway", description: "Romantic sunsets and rice fields", color: "#f59e0b", lastMsg: "Sunset dinner at Uluwatu?", unread: 0, active: false, members: ["You", "Ananya"] },
];

export function useTrips() {
    const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);

    const addTrip = (name: string, description: string, color: string) => {
        // TODO: await supabase.from('trips').insert({ name, description, color, created_by: userId })
        const newTrip: Trip = { id: `trip_${Date.now()}`, name, description, color, lastMsg: "Just created!", unread: 0, active: false, members: ["You"] };
        setTrips(prev => [...prev, newTrip]);
    };

    const deleteTrip = (id: string) => {
        // TODO: await supabase.from('trips').delete().eq('id', id)
        setTrips(prev => prev.filter(t => t.id !== id));
    };

    return { trips, addTrip, deleteTrip };
}

// ─── MOCK HOOK: useProfile ───────────────────────────────────────────────────
// Replace with: supabase.from('profiles').select('*').eq('id', userId).single()

export const MOCK_PROFILE: Profile = {
    id: "me",
    username: "Yogesh",
    email: "user@syncroute.demo",
    avatar_color: "#3b82f6",
    budget_pref: 65,
    pace_pref: 70,
    interests: ["Adventure", "Food", "Photography", "Beach", "Culture"],
};

export function useProfile() {
    const [profile, setProfile] = useState<Profile>(MOCK_PROFILE);

    const updateProfile = (updates: Partial<Profile>) => {
        // TODO: await supabase.from('profiles').update(updates).eq('id', profile.id)
        setProfile(prev => ({ ...prev, ...updates }));
    };

    return { profile, updateProfile };
}
