import { NextRequest, NextResponse } from "next/server";
import { fetchWeather, fetchFlightStatus } from "@/services/liveTravelData";

/**
 * /api/travel-research
 *
 * AI-powered multi-source travel research.
 * Analyzes flights, trains, hotels, local transport, car & bike rentals.
 * Considers hidden variables: seasonal pricing, peak periods, availability.
 */

const RESEARCH_SYSTEM_PROMPT = `You are Safar, an expert AI travel research analyst inside SyncRoute.
You analyze travel options across MULTIPLE sources and provide intelligent recommendations.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

The JSON must have this EXACT structure:
{
  "destination": "Destination name",
  "travel_period": "e.g. Feb 2026, Peak Season",
  "summary": "One-line summary of the best overall plan",
  "transport": [
    {
      "id": "unique-id",
      "mode": "flight|train|bus",
      "provider": "IndiGo / Rajdhani Express / RedBus etc.",
      "route": "Mumbai → Goa",
      "price": "₹3,500",
      "duration": "1h 15m",
      "departure": "06:30 AM",
      "arrival": "07:45 AM",
      "class": "Economy / 3AC / Sleeper etc.",
      "convenience_score": 85,
      "tags": ["Cheapest", "Fastest", "Best Value"],
      "is_recommended": false,
      "recommendation_reason": null
    }
  ],
  "stays": [
    {
      "id": "unique-id",
      "type": "hotel|airbnb|hostel|resort",
      "name": "Property name",
      "location": "Area, City",
      "price_per_night": "₹2,500",
      "total_price": "₹12,500",
      "rating": 4.5,
      "reviews": 342,
      "amenities": ["WiFi", "Pool", "Breakfast"],
      "convenience_score": 80,
      "tags": ["Budget Pick", "Best Rated", "Group Friendly"],
      "is_recommended": false,
      "recommendation_reason": null
    }
  ],
  "local_transport": [
    {
      "id": "unique-id",
      "type": "uber|car_rental|bike_rental|auto|metro",
      "provider": "Uber / Zoomcar / Royal Brothers etc.",
      "description": "Sedan for 3 days",
      "price": "₹4,000",
      "price_unit": "total / per day / per ride",
      "convenience_score": 75,
      "tags": ["Most Flexible", "Cheapest"],
      "is_recommended": false,
      "recommendation_reason": null
    }
  ],
  "hidden_insights": [
    {
      "type": "seasonal_price|peak_period|availability|weather|local_tip|safety",
      "severity": "info|warning|alert",
      "title": "Short title",
      "description": "Detailed insight"
    }
  ],
  "ai_recommendation": {
    "transport": "Recommended transport option ID",
    "stay": "Recommended stay option ID",
    "local_transport": "Recommended local transport option ID",
    "total_estimated_cost": "₹XX,XXX",
    "reasoning": "2-3 sentences explaining why this combination is optimal for the group."
  }
}

Rules:
- Generate 3-4 options per category (transport, stays, local_transport)
- Use realistic Indian prices in ₹
- Mark exactly ONE option per category as is_recommended: true with a reason
- Include 3-5 hidden insights (seasonal pricing, peak warnings, availability issues, local tips)
- convenience_score is 0-100 based on price, time, comfort, and flexibility
- Tags should be descriptive: "Cheapest", "Fastest", "Best Value", "Most Comfortable", "Group Friendly", "Best Rated", "Budget Pick", "Premium", "Most Flexible"
- Consider real factors: flight vs train tradeoffs, hotel vs Airbnb for groups, self-drive vs cab
- Make prices realistic for Indian domestic travel
- RESPOND WITH RAW JSON ONLY. NO MARKDOWN FENCES.`;

export async function POST(req: NextRequest) {
  try {
    const { destination, dates, travelers, budget, preferences } = await req.json() as {
      destination: string;
      dates?: string;
      travelers?: number;
      budget?: string;
      preferences?: string;
    };

    const userPrompt = `Research travel options for: "${destination}"
${dates ? `Travel dates: ${dates}` : ""}
${travelers ? `Number of travelers: ${travelers}` : "Group of friends"}
${budget ? `Budget level: ${budget}` : "Moderate budget"}
${preferences ? `Preferences: ${preferences}` : ""}

Analyze all transport options (flights, trains, buses), accommodation (hotels, Airbnb, hostels), and local transport (Uber, car rentals, bike rentals).
Consider current seasonal factors, peak pricing, and availability.
Provide the best recommendation with reasoning.`;

    // --- FETCH LIVE API DATA ---
    // Naively extract the main city from something like "Manali from Delhi" -> gets "Manali"
    const mainCityMatch = destination.split(/ from | to | in /i)[0].trim() || "Goa";

    // Fetch weather and a demo flight status concurrently
    const [weatherData, flightData] = await Promise.all([
      fetchWeather(mainCityMatch),
      fetchFlightStatus() // Uses the default demo flight
    ]);

    const liveContext = `
--- REAL-TIME API DATA (MUST USE THIS IN YOUR ANALYSIS) ---
Destination Weather (${weatherData.city}): ${weatherData.temp}°C, ${weatherData.description}
Weather Alerts: Rainy? ${weatherData.is_rainy ? "Yes" : "No"}, Stormy? ${weatherData.is_stormy ? "Yes" : "No"}
Sample Incoming Flight Status (${flightData.airline} ${flightData.flight_number}): ${flightData.status.toUpperCase()}. Delayed? ${flightData.is_delayed ? `YES (${flightData.delay_minutes} mins)` : "No"}

If weather is rainy/stormy, you MUST add a 'weather' hidden_insight warning and recommend indoor stays/cabs.
If flights are delayed, you MUST add a 'peak_period' or 'availability' hidden_insight warning about flight unreliability.
-----------------------------------------------------------`;

    const finalUserPrompt = userPrompt + "\n" + liveContext;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: RESEARCH_SYSTEM_PROMPT },
          { role: "user", content: finalUserPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq research error:", groqRes.status, errText);
      return NextResponse.json({ error: "Research failed" }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const rawContent = groqData.choices?.[0]?.message?.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse research JSON:", rawContent);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Research route error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
