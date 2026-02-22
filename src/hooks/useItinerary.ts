/**
 * useItinerary - Hook for AI-powered itinerary generation, replanning,
 *                Supabase persistence, and real-time travel alerts.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    checkWeatherDisruption,
    checkFlightDisruption,
    fetchWeather,
    fetchFlightStatus,
    type DisruptionReport,
    type WeatherData,
    type FlightData,
} from "@/services/liveTravelData";

// --- TYPES ---

export interface ItineraryActivityData {
    time: string;
    activity: string;
    cost: string;
    icon_type: string;
    warning: string | null;
}

export interface ItineraryDayData {
    day: string;
    title: string;
    items: ItineraryActivityData[];
}

export interface LiveAlert {
    id: string;
    type: "weather" | "flight" | "advisory";
    severity: "info" | "warning" | "danger";
    title: string;
    description: string;
    canReplan: boolean;
    rawData: WeatherData | FlightData | null;
}

// --- ITINERARY TRIGGER DETECTION ---

const ITINERARY_KEYWORDS = [
    "plan a trip", "plan my trip", "plan the trip",
    "create an itinerary", "create itinerary",
    "make an itinerary", "build an itinerary",
    "plan a day", "plan my day", "plan our trip",
    "generate itinerary", "trip plan", "travel plan",
    "make a plan", "plan for", "itinerary for",
    "plan a vacation", "plan vacation", "plan a holiday",
];

export function isItineraryRequest(text: string): boolean {
    const lower = text.toLowerCase();
    const hasSafar = /@safar\b/i.test(text);
    const hasKeyword = ITINERARY_KEYWORDS.some((kw) => lower.includes(kw));
    return (hasSafar && hasKeyword) || hasKeyword;
}

// --- SUPABASE HELPERS ---

async function saveItineraryToSupabase(
    tripId: string,
    data: ItineraryDayData[]
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("trips")
            .update({ itinerary_data: data })
            .eq("id", tripId);
        if (error) return false;
        return true;
    } catch {
        return false;
    }
}

async function fetchItineraryFromSupabase(
    tripId: string
): Promise<ItineraryDayData[] | null> {
    try {
        const { data, error } = await supabase
            .from("trips")
            .select("itinerary_data")
            .eq("id", tripId)
            .single();
        if (error) return null;
        const raw = data?.itinerary_data;
        if (Array.isArray(raw) && raw.length > 0) return raw as ItineraryDayData[];
        return null;
    } catch {
        return null;
    }
}

// --- LIVE ALERT BUILDER ---

function buildWeatherAlert(weather: WeatherData): LiveAlert | null {
    if (weather.is_stormy) {
        return {
            id: "weather-storm",
            type: "weather",
            severity: "danger",
            title: `Storm Alert in ${weather.city}`,
            description: `${weather.description} with winds of ${weather.wind_speed} m/s. Temperature ${weather.temp}°C. All outdoor activities are at risk.`,
            canReplan: true,
            rawData: weather,
        };
    }
    if (weather.is_rainy) {
        return {
            id: "weather-rain",
            type: "weather",
            severity: "warning",
            title: `Rain Forecast in ${weather.city}`,
            description: `${weather.description}, ${weather.temp}°C, humidity ${weather.humidity}%. Beach and outdoor activities may be affected.`,
            canReplan: true,
            rawData: weather,
        };
    }
    // Even sunny weather gets shown as contextual info
    return {
        id: "weather-clear",
        type: "weather",
        severity: "info",
        title: `Weather in ${weather.city}: ${weather.temp}°C`,
        description: `${weather.description}. Feels like ${weather.feels_like}°C. Humidity ${weather.humidity}%. Great conditions for outdoor plans!`,
        canReplan: false,
        rawData: weather,
    };
}

function buildFlightAlert(flight: FlightData): LiveAlert | null {
    if (flight.is_delayed) {
        const delayHrs = Math.round((flight.delay_minutes ?? 0) / 60 * 10) / 10;
        return {
            id: "flight-delay",
            type: "flight",
            severity: "danger",
            title: `Flight ${flight.flight_number} Delayed`,
            description: `${flight.airline} ${flight.flight_number} (${flight.departure_airport} → ${flight.arrival_airport}) delayed by ${delayHrs}h. Status: ${flight.status}. Arrival activities need rescheduling.`,
            canReplan: true,
            rawData: flight,
        };
    }
    return {
        id: "flight-ok",
        type: "flight",
        severity: "info",
        title: `Flight ${flight.flight_number} On Time`,
        description: `${flight.airline} ${flight.flight_number} (${flight.departure_airport} → ${flight.arrival_airport}). Status: ${flight.status}.`,
        canReplan: false,
        rawData: flight,
    };
}

// --- HOOK ---

export function useItinerary(tripId: string | null) {
    const [itineraryData, setItineraryData] = useState<ItineraryDayData[]>([]);
    const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
    const [isFetchingItinerary, setIsFetchingItinerary] = useState(false);
    const [activeDisruption, setActiveDisruption] = useState<string | null>(null);
    const [disruptionReport, setDisruptionReport] = useState<DisruptionReport | null>(null);
    const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const lastItineraryRef = useRef<ItineraryDayData[]>([]);

    // Fetch itinerary from Supabase when tripId changes
    useEffect(() => {
        if (!tripId) {
            setItineraryData([]);
            setActiveDisruption(null);
            setDisruptionReport(null);
            setLiveAlerts([]);
            return;
        }

        let cancelled = false;
        setIsFetchingItinerary(true);
        setActiveDisruption(null);
        setDisruptionReport(null);
        setLiveAlerts([]);

        fetchItineraryFromSupabase(tripId).then((data) => {
            if (cancelled) return;
            if (data) {
                setItineraryData(data);
                lastItineraryRef.current = data;
            } else {
                setItineraryData([]);
                lastItineraryRef.current = [];
            }
            setIsFetchingItinerary(false);
        });

        return () => { cancelled = true; };
    }, [tripId]);

    // Auto-fetch live alerts when itinerary data changes
    useEffect(() => {
        if (itineraryData.length === 0) {
            setLiveAlerts([]);
            return;
        }

        let cancelled = false;
        setAlertsLoading(true);

        const fetchAlerts = async () => {
            const alerts: LiveAlert[] = [];

            // Fetch real-time weather for "Goa" (destination from itinerary)
            // Try to extract destination from itinerary titles
            const destination = extractDestination(itineraryData);
            try {
                const weather = await fetchWeather(destination);
                const weatherAlert = buildWeatherAlert(weather);
                if (weatherAlert) alerts.push(weatherAlert);
            } catch { /* skip */ }

            // Fetch real-time flight status
            try {
                const flight = await fetchFlightStatus();
                const flightAlert = buildFlightAlert(flight);
                if (flightAlert) alerts.push(flightAlert);
            } catch { /* skip */ }

            if (!cancelled) {
                setLiveAlerts(alerts);
                setAlertsLoading(false);
            }
        };

        fetchAlerts();
        return () => { cancelled = true; };
    }, [itineraryData]);

    // Generate itinerary from chat context
    const generateItinerary = useCallback(
        async (
            chatMessages: { role: "user" | "assistant" | "system"; content: string }[],
            userText: string
        ): Promise<{ chat_reply: string; itinerary_data: ItineraryDayData[] } | null> => {
            if (!tripId) return null;
            setIsGeneratingItinerary(true);
            setActiveDisruption(null);
            setDisruptionReport(null);

            try {
                const res = await fetch("/api/safar-itinerary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [
                            ...chatMessages.slice(-10),
                            { role: "user", content: userText },
                        ],
                        mode: "generate",
                    }),
                });

                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();

                if (data.itinerary_data && data.itinerary_data.length > 0) {
                    await saveItineraryToSupabase(tripId, data.itinerary_data);
                    setItineraryData(data.itinerary_data);
                    lastItineraryRef.current = data.itinerary_data;
                }

                return data;
            } catch (err) {
                console.error("generateItinerary error:", err);
                return null;
            } finally {
                setIsGeneratingItinerary(false);
            }
        },
        [tripId]
    );

    // Replan itinerary from a live alert
    const replanFromAlert = useCallback(
        async (alert: LiveAlert) => {
            const currentItinerary = lastItineraryRef.current;
            if (currentItinerary.length === 0 || !tripId) return null;

            const destination = extractDestination(currentItinerary);

            // Build a disruption report from the alert
            const disruption: DisruptionReport = {
                type: alert.type === "weather" ? "rain" : "flight_delay",
                severity: alert.severity === "danger" ? "high" : "medium",
                summary: `${alert.title}: ${alert.description}`,
                raw_data: alert.rawData,
            };

            setIsGeneratingItinerary(true);
            setDisruptionReport(disruption);
            setActiveDisruption(alert.type);

            try {
                const systemMessage = alert.type === "weather"
                    ? `LIVE WEATHER ALERT: ${alert.title} - ${alert.description}\n\nHere is the current itinerary JSON that needs to be updated:\n${JSON.stringify(currentItinerary, null, 2)}\n\nINSTRUCTIONS:\n1. Regenerate this itinerary for ${destination}\n2. Replace ALL outdoor activities with indoor alternatives due to the weather\n3. For EACH changed activity, set the "warning" field explaining the swap\n4. Keep unchanged activities with warning: null\n5. Maintain the same day structure and time slots\n6. Return ONLY the JSON response`
                    : `LIVE FLIGHT ALERT: ${alert.title} - ${alert.description}\n\nHere is the current itinerary JSON that needs to be updated:\n${JSON.stringify(currentItinerary, null, 2)}\n\nINSTRUCTIONS:\n1. Regenerate this itinerary for ${destination}\n2. On Day 1, shift ALL activities forward by 2 hours due to the flight delay\n3. Remove or merge activities that no longer fit\n4. For EACH changed/shifted activity, set the "warning" field explaining the change\n5. Keep unchanged activities with warning: null\n6. Return ONLY the JSON response`;

                const res = await fetch("/api/safar-itinerary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [{ role: "user", content: systemMessage }],
                        mode: "replan",
                    }),
                });

                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();

                if (data.itinerary_data && data.itinerary_data.length > 0) {
                    await saveItineraryToSupabase(tripId, data.itinerary_data);
                    setItineraryData(data.itinerary_data);
                    lastItineraryRef.current = data.itinerary_data;
                }

                return data;
            } catch (err) {
                console.error("replanFromAlert error:", err);
                return null;
            } finally {
                setIsGeneratingItinerary(false);
            }
        },
        [tripId]
    );

    return {
        itineraryData,
        isGeneratingItinerary,
        isFetchingItinerary,
        activeDisruption,
        disruptionReport,
        liveAlerts,
        alertsLoading,
        generateItinerary,
        replanFromAlert,
        setItineraryData,
    };
}

// --- HELPER: Extract destination from itinerary ---
function extractDestination(data: ItineraryDayData[]): string {
    // Try to find destination from itinerary content
    const allText = data.map(d => d.title + " " + d.items.map(i => i.activity).join(" ")).join(" ").toLowerCase();
    const DESTINATIONS = ["goa", "mumbai", "delhi", "jaipur", "kerala", "manali", "shimla", "udaipur", "varanasi", "agra", "rishikesh", "ooty", "darjeeling", "ladakh", "andaman"];
    for (const dest of DESTINATIONS) {
        if (allText.includes(dest)) return dest.charAt(0).toUpperCase() + dest.slice(1);
    }
    return "Goa"; // fallback
}
