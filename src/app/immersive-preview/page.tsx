"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Eye, MapPin, Star, Navigation, Smartphone,
    ChevronRight, Clock, Sparkles,
    Plane, Coffee, Mountain, Ship, Camera, UtensilsCrossed,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────── */
/*  DATA                                                             */
/* ──────────────────────────────────────────────────────────────── */

interface ItineraryItem {
    id: string; time: string; activity: string; location: string;
    cost: string; vibeRating: number; distance: string;
    icon: React.ReactNode; lat: number; lng: number; heading: number;
}
interface ItineraryDay {
    day: string; title: string; icon: React.ReactNode; items: ItineraryItem[];
}

const ITINERARY: ItineraryDay[] = [
    {
        day: "Day 1", title: "Arrival & North Goa", icon: <Plane className="w-4 h-4" />,
        items: [
            { id: "d1_1", time: "10:00 AM", activity: "Check-in at Beachside Resort", location: "Calangute, Goa", cost: "₹4,500", vibeRating: 4.8, distance: "—", icon: <MapPin className="w-3.5 h-3.5" />, lat: 15.5449, lng: 73.7553, heading: 200 },
            { id: "d1_2", time: "12:30 PM", activity: "Lunch at Britto's", location: "Baga Beach, Goa", cost: "₹1,200", vibeRating: 4.5, distance: "2.3 km", icon: <UtensilsCrossed className="w-3.5 h-3.5" />, lat: 15.5528, lng: 73.7517, heading: 120 },
            { id: "d1_3", time: "3:00 PM", activity: "Fort Aguada Visit", location: "Sinquerim, Goa", cost: "₹50", vibeRating: 4.7, distance: "5.1 km", icon: <Camera className="w-3.5 h-3.5" />, lat: 15.4920, lng: 73.7736, heading: 300 },
            { id: "d1_4", time: "6:00 PM", activity: "Sunset at Vagator Beach", location: "Vagator, Goa", cost: "Free", vibeRating: 4.9, distance: "12.4 km", icon: <Mountain className="w-3.5 h-3.5" />, lat: 15.5986, lng: 73.7378, heading: 270 },
        ],
    },
    {
        day: "Day 2", title: "South Goa Exploration", icon: <Ship className="w-3.5 h-3.5" />,
        items: [
            { id: "d2_1", time: "9:00 AM", activity: "Breakfast at Café Bodega", location: "Sunaparanta, Panaji", cost: "₹600", vibeRating: 4.6, distance: "18.2 km", icon: <Coffee className="w-3.5 h-3.5" />, lat: 15.4989, lng: 73.8278, heading: 90 },
            { id: "d2_2", time: "11:00 AM", activity: "Basilica of Bom Jesus", location: "Old Goa", cost: "Free", vibeRating: 4.8, distance: "10.5 km", icon: <Camera className="w-3.5 h-3.5" />, lat: 15.5009, lng: 73.9116, heading: 180 },
            { id: "d2_3", time: "2:00 PM", activity: "Palolem Beach Chill", location: "Canacona, Goa", cost: "₹300", vibeRating: 4.9, distance: "67.3 km", icon: <Mountain className="w-3.5 h-3.5" />, lat: 15.0100, lng: 74.0230, heading: 220 },
        ],
    },
    {
        day: "Day 3", title: "Adventure & Departure", icon: <Sparkles className="w-3.5 h-3.5" />,
        items: [
            { id: "d3_1", time: "7:00 AM", activity: "Dudhsagar Falls Trek", location: "Sanguem, Goa", cost: "₹2,500", vibeRating: 4.9, distance: "60 km", icon: <Mountain className="w-3.5 h-3.5" />, lat: 15.3144, lng: 74.3143, heading: 0 },
            { id: "d3_2", time: "3:00 PM", activity: "Spice Plantation Tour", location: "Ponda, Goa", cost: "₹800", vibeRating: 4.4, distance: "32 km", icon: <Coffee className="w-3.5 h-3.5" />, lat: 15.4000, lng: 74.0078, heading: 90 },
        ],
    },
];

const ALL_ITEMS = ITINERARY.flatMap((d) => d.items);
const DAY_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4"];

/* ──────────────────────────────────────────────────────────────── */
/*  Smooth fly-to animation using Google Maps                       */
/* ──────────────────────────────────────────────────────────────── */

function cubicEase(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothFlyTo(
    map: google.maps.Map,
    target: { lat: number; lng: number },
    onDone?: () => void,
) {
    const start = map.getCenter()!;
    const startLat = start.lat();
    const startLng = start.lng();
    const startZoom = map.getZoom() ?? 15;
    const startTilt = map.getTilt() ?? 45;
    const startHeading = map.getHeading() ?? 0;

    const midZoom = 12;
    const endZoom = 17;
    const endTilt = 55;

    const dLat = target.lat - startLat;
    const dLng = target.lng - startLng;
    const targetHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

    const duration = 2400;
    const t0 = performance.now();

    function tick(now: number) {
        const elapsed = now - t0;
        const raw = Math.min(elapsed / duration, 1);
        const t = cubicEase(raw);

        let zoom: number, tilt: number, heading: number, lat: number, lng: number;

        if (t < 0.35) {
            const p = t / 0.35;
            zoom = startZoom + (midZoom - startZoom) * p;
            tilt = startTilt + (0 - startTilt) * p;
            heading = startHeading;
            lat = startLat;
            lng = startLng;
        } else if (t < 0.7) {
            const p = (t - 0.35) / 0.35;
            zoom = midZoom;
            tilt = 0;
            heading = startHeading + (targetHeading - startHeading) * p;
            lat = startLat + dLat * p;
            lng = startLng + dLng * p;
        } else {
            const p = (t - 0.7) / 0.3;
            zoom = midZoom + (endZoom - midZoom) * p;
            tilt = 0 + endTilt * p;
            heading = targetHeading;
            lat = target.lat;
            lng = target.lng;
        }

        map.moveCamera({ center: { lat, lng }, zoom, tilt, heading });

        if (raw < 1) {
            requestAnimationFrame(tick);
        } else {
            onDone?.();
        }
    }

    requestAnimationFrame(tick);
}

/* ──────────────────────────────────────────────────────────────── */
/*  PAGE                                                             */
/* ──────────────────────────────────────────────────────────────── */

export default function ImmersivePreview() {
    const [activeItemId, setActiveItemId] = useState(ALL_ITEMS[0].id);
    const [expandedDays, setExpandedDays] = useState<string[]>(["Day 1", "Day 2", "Day 3"]);
    const [viewMode, setViewMode] = useState<"earth" | "street">("earth");
    const [isFlying, setIsFlying] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const mapEl = useRef<HTMLDivElement>(null);
    const mapObj = useRef<google.maps.Map | null>(null);
    const panoEl = useRef<HTMLDivElement>(null);
    const panoObj = useRef<google.maps.StreetViewPanorama | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const activeGlowRef = useRef<google.maps.Circle | null>(null);

    const active = ALL_ITEMS.find((i) => i.id === activeItemId) ?? ALL_ITEMS[0];
    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

    /* ── Load Google Maps script ────────────────────────────────── */
    useEffect(() => {
        if (!mapsApiKey) return;
        if (document.querySelector("script[src*='maps.googleapis.com']")) return;

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=marker&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        document.head.appendChild(script);

        return () => {
            // Cleanup not really needed for Google Maps script
        };
    }, [mapsApiKey]);

    /* ── Initialize map ─────────────────────────────────────────── */
    const initMap = useCallback(() => {
        if (!mapEl.current || mapObj.current) return;

        const map = new google.maps.Map(mapEl.current, {
            center: { lat: active.lat, lng: active.lng },
            zoom: 16,
            tilt: 45,
            heading: active.heading,
            mapTypeId: "hybrid",
            mapId: "immersive_satellite",
            disableDefaultUI: true,
            gestureHandling: "greedy",
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        mapObj.current = map;

        // ── Route polyline ──
        const routePath = ALL_ITEMS.map((i) => ({ lat: i.lat, lng: i.lng }));
        new google.maps.Polyline({
            path: routePath,
            geodesic: true,
            strokeColor: "#3b82f6",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            icons: [{
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#60a5fa", fillColor: "#60a5fa", fillOpacity: 1 },
                offset: "0",
                repeat: "80px",
            }],
            map,
        });

        // ── Markers for all stops ──
        ITINERARY.forEach((day, di) => {
            const color = DAY_COLORS[di % DAY_COLORS.length];
            day.items.forEach((item, ii) => {
                const isFirst = item.id === ALL_ITEMS[0].id;

                // Numbered label marker
                const el = document.createElement("div");
                el.innerHTML = `<div style="
                    font-size:11px;font-weight:700;color:#fff;
                    background:${color};
                    width:${isFirst ? 28 : 22}px;height:${isFirst ? 28 : 22}px;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    border:2.5px solid rgba(255,255,255,0.9);
                    box-shadow:0 2px 8px rgba(0,0,0,0.4)${isFirst ? `,0 0 16px ${color}80` : ""};
                    transition:all 0.3s ease;
                    cursor:pointer;
                ">${ii + 1}</div>`;

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: item.lat, lng: item.lng },
                    map,
                    content: el,
                    title: item.activity,
                });

                marker.addListener("click", () => {
                    setActiveItemId(item.id);
                });

                markersRef.current.push(marker);
            });
        });

        // ── Active location glow circle ──
        const glow = new google.maps.Circle({
            center: { lat: active.lat, lng: active.lng },
            radius: 150,
            fillColor: "#3b82f6",
            fillOpacity: 0.12,
            strokeColor: "#3b82f6",
            strokeWeight: 1.5,
            strokeOpacity: 0.3,
            map,
        });
        activeGlowRef.current = glow;

        setMapReady(true);
    }, [active.lat, active.lng, active.heading]);

    // If google maps is already loaded (e.g. hot reload)
    useEffect(() => {
        if (typeof google !== "undefined" && google.maps && !mapObj.current) {
            initMap();
        }
    }, [initMap]);

    /* ── Fly to on item change ─────────────────────────────────── */
    useEffect(() => {
        if (!mapObj.current || !mapReady) return;
        const map = mapObj.current;

        setIsFlying(true);
        smoothFlyTo(map, { lat: active.lat, lng: active.lng }, () => {
            setIsFlying(false);
        });

        // Update glow circle
        if (activeGlowRef.current) {
            activeGlowRef.current.setCenter({ lat: active.lat, lng: active.lng });
        }

        // Update marker styles
        let idx = 0;
        ITINERARY.forEach((day, di) => {
            const color = DAY_COLORS[di % DAY_COLORS.length];
            day.items.forEach((item, ii) => {
                const marker = markersRef.current[idx];
                if (marker) {
                    const isActive = item.id === active.id;
                    const el = document.createElement("div");
                    el.innerHTML = `<div style="
                        font-size:${isActive ? 12 : 11}px;font-weight:700;color:#fff;
                        background:${isActive ? "#3b82f6" : color};
                        width:${isActive ? 30 : 22}px;height:${isActive ? 30 : 22}px;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        border:2.5px solid rgba(255,255,255,0.9);
                        box-shadow:0 2px 8px rgba(0,0,0,0.4)${isActive ? ",0 0 20px #3b82f680" : ""};
                        transition:all 0.3s ease;
                        cursor:pointer;
                    ">${ii + 1}</div>`;
                    marker.content = el;
                }
                idx++;
            });
        });

        // Update street view if in street mode
        if (viewMode === "street" && panoObj.current) {
            panoObj.current.setPosition({ lat: active.lat, lng: active.lng });
            panoObj.current.setPov({ heading: active.heading, pitch: 5 });
        }
    }, [activeItemId, mapReady]);

    /* ── Street view toggle ─────────────────────────────────────── */
    useEffect(() => {
        if (viewMode === "street" && panoEl.current && !panoObj.current) {
            panoObj.current = new google.maps.StreetViewPanorama(panoEl.current, {
                position: { lat: active.lat, lng: active.lng },
                pov: { heading: active.heading, pitch: 5 },
                disableDefaultUI: true,
                showRoadLabels: false,
            });
        }
        if (viewMode === "street" && panoObj.current) {
            panoObj.current.setPosition({ lat: active.lat, lng: active.lng });
            panoObj.current.setPov({ heading: active.heading, pitch: 5 });
        }
    }, [viewMode, active]);

    const toggleDay = (day: string) => setExpandedDays((p) => p.includes(day) ? p.filter((d) => d !== day) : [...p, day]);
    const vibeLabel = (r: number) => r >= 4.8 ? "Incredible" : r >= 4.5 ? "Amazing" : r >= 4.0 ? "Great" : "Good";

    /* ── RENDER ──────────────────────────────────────────────────── */
    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0a] font-sans select-none">

            {/* ═══════ MAP BACKGROUND ═══════ */}
            <div ref={mapEl} id="immersive-map-container" className="absolute inset-0 z-0" style={{ display: viewMode === "earth" ? "block" : "none" }} />
            <div ref={panoEl} id="immersive-pano-container" className="absolute inset-0 z-0" style={{ display: viewMode === "street" ? "block" : "none" }} />

            {/* Loading overlay */}
            {!mapReady && (
                <div className="absolute inset-0 z-[2] bg-gradient-to-br from-[#0a0f1a] via-[#0d1117] to-[#0a0a0a] flex items-center justify-center">
                    <div className="text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <Eye className="w-7 h-7 text-blue-500/60" />
                        </motion.div>
                        <p className="text-white/40 text-sm font-medium">Loading Immersive View…</p>
                    </div>
                </div>
            )}

            {/* No API key fallback */}
            {!mapsApiKey && (
                <div className="absolute inset-0 z-[2] bg-gradient-to-br from-[#0a0f1a] via-[#0d1117] to-[#0a0a0a] flex items-center justify-center">
                    <div className="text-center max-w-md px-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <MapPin className="w-7 h-7 text-red-400" />
                        </div>
                        <h2 className="text-white text-lg font-semibold mb-2">Google Maps API Key Required</h2>
                        <p className="text-white/40 text-sm">Add <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> to your <code className="text-blue-400 bg-white/5 px-1.5 py-0.5 rounded">.env.local</code> file and enable the Maps JavaScript API in Google Cloud Console.</p>
                    </div>
                </div>
            )}

            {/* Vignette + gradients */}
            <div className="absolute inset-0 z-[1] vignette-overlay" />
            <div className="absolute inset-x-0 top-0 h-24 z-[1] bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 z-[1] bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Flying indicator */}
            <AnimatePresence>
                {isFlying && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ background: "rgba(59,130,246,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(59,130,246,0.3)" }}
                    >
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent" />
                        <span className="text-blue-300 text-xs font-medium">Flying to {active.activity}…</span>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* ═══════ TOP NAV ═══════ */}
            <motion.header
                initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between px-5 py-3 rounded-2xl"
                style={{ background: "rgba(10,10,10,0.55)", backdropFilter: "blur(24px) saturate(1.5)", WebkitBackdropFilter: "blur(24px) saturate(1.5)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
                <a href="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline">Back to Planning</span>
                </a>
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <h1 className="text-white text-sm font-semibold tracking-wide hidden md:block">
                        Goa Trip with College Bros<span className="text-white/40 font-normal ml-1.5">— Virtual Preview</span>
                    </h1>
                </div>
                <div className="flex items-center rounded-xl p-1 gap-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button onClick={() => setViewMode("earth")} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === "earth" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-white/50 hover:text-white/80"}`}>🌍 Earth View</button>
                    <button onClick={() => setViewMode("street")} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === "street" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-white/50 hover:text-white/80"}`}>🚶 Street Walk</button>
                </div>
            </motion.header>


            {/* ═══════ LEFT ITINERARY ═══════ */}
            <motion.aside
                initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.2 }}
                className="absolute left-4 top-24 bottom-6 z-20 w-[280px] rounded-2xl flex flex-col overflow-hidden"
                style={{ background: "rgba(10,10,10,0.55)", backdropFilter: "blur(24px) saturate(1.5)", WebkitBackdropFilter: "blur(24px) saturate(1.5)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
                <div className="px-4 pt-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <h3 className="text-white text-sm font-bold tracking-wide">ITINERARY</h3>
                    </div>
                    <p className="text-white/30 text-[11px]">Click a stop to fly there</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {ITINERARY.map((day, di) => {
                        const isExpanded = expandedDays.includes(day.day);
                        const color = DAY_COLORS[di % DAY_COLORS.length];
                        return (
                            <div key={day.day}>
                                <button onClick={() => toggleDay(day.day)} className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
                                        <span style={{ color }}>{day.icon}</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{day.day}</p>
                                        <p className="text-xs text-white/70 font-medium truncate">{day.title}</p>
                                    </div>
                                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden ml-4 border-l border-white/5 pl-2 space-y-0.5">
                                            {day.items.map((item) => {
                                                const isActive = item.id === activeItemId;
                                                return (
                                                    <button key={item.id} onClick={() => setActiveItemId(item.id)}
                                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group/item ${isActive ? "bg-blue-500/15 border border-blue-500/25" : "hover:bg-white/5 border border-transparent"}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-blue-500 text-white" : "bg-white/5 text-white/40 group-hover/item:text-white/60"}`}>{item.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-medium truncate transition-colors ${isActive ? "text-blue-300" : "text-white/60 group-hover/item:text-white/80"}`}>{item.activity}</p>
                                                            <p className="text-[10px] text-white/25">{item.time}</p>
                                                        </div>
                                                        {isActive && <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                <div className="px-4 py-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-white/25 text-[10px]">
                        <Sparkles className="w-3 h-3" /><span>Powered by SyncRoute AI</span>
                    </div>
                </div>
            </motion.aside>


            {/* ═══════ CONTEXT CARD ═══════ */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={active.id}
                    initial={{ y: 20, opacity: 0, scale: 0.97 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 10, opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="absolute bottom-6 right-4 z-20 w-[360px] rounded-2xl overflow-hidden"
                    style={{ background: "rgba(10,10,10,0.6)", backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                    {/* Street View thumbnail */}
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                        {mapsApiKey && (
                            <img
                                src={`https://maps.googleapis.com/maps/api/streetview?size=720x320&location=${active.lat},${active.lng}&heading=${active.heading}&pitch=5&fov=90&key=${mapsApiKey}`}
                                alt={active.activity}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        )}
                        {!mapsApiKey && (
                            <div className="w-full h-full flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white/15" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 to-transparent" />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-white text-[11px] font-bold">{active.vibeRating}</span>
                            <span className="text-white/40 text-[10px]">{vibeLabel(active.vibeRating)}</span>
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/20">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-300 text-[11px] font-medium">{active.location}</span>
                        </div>
                    </div>

                    <div className="p-4">
                        <h3 className="text-white font-semibold text-[15px] mb-1.5">{active.activity}</h3>
                        <div className="flex items-center gap-4 text-[11px] text-white/40 mb-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{active.time}</span>
                            <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{active.distance}</span>
                            <span className="text-white/50 font-semibold">{active.cost}</span>
                        </div>
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/10 mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-300/70 leading-relaxed">
                                <span className="text-blue-400 font-semibold">@Safar says:</span> One of the top-rated spots on your itinerary. Perfect for the group&apos;s vibe.
                            </p>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold cursor-pointer hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                            <Smartphone className="w-4 h-4" />Enter AR Mode<span className="text-white/50 text-[10px] ml-1">(Mobile only)</span>
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>


            {/* ═══════ MODE INDICATOR ═══════ */}
            <motion.div
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                className="absolute bottom-6 left-[300px] z-20 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(10,10,10,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/40 text-[11px] font-medium">{viewMode === "earth" ? "Earth View" : "Street Walk"} · Live</span>
            </motion.div>
        </div>
    );
}
