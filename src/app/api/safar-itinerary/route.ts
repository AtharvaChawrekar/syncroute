import { NextRequest, NextResponse } from "next/server";

/**
 * /api/safar-itinerary
 *
 * Non-streaming Groq endpoint that returns structured JSON with:
 *   { chat_reply: string, itinerary_data: ItineraryDay[] }
 *
 * Used for itinerary generation and replanning (disruption handling).
 */

const ITINERARY_SYSTEM_PROMPT = `You are Safar, an expert AI travel planner inside SyncRoute.
You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

The JSON must have exactly this structure:
{
  "chat_reply": "A friendly message to the user about their itinerary (1-2 sentences)",
  "itinerary_data": [
    {
      "day": "Day 1",
      "title": "Theme for this day",
      "items": [
        {
          "time": "10:00 AM",
          "activity": "Activity name",
          "cost": "₹1,200 or Free",
          "icon_type": "plane|coffee|ship|mountain|camera|food|mappin",
          "warning": null
        }
      ]
    }
  ]
}

Rules:
- Each day should have 3-5 activities
- Use Indian Rupee (₹) for costs
- icon_type must be one of: plane, coffee, ship, mountain, camera, food, mappin
- The "warning" field is usually null. Only add a warning string when an activity was changed due to a disruption (rain, flight delay, etc.)
- Keep the itinerary practical and fun
- If replanning due to disruption, mark changed activities with a warning explaining the swap
- RESPOND WITH RAW JSON ONLY. NO MARKDOWN FENCES.`;

export async function POST(req: NextRequest) {
    try {
        const { messages, mode } = await req.json() as {
            messages: { role: "user" | "assistant" | "system"; content: string }[];
            mode?: "generate" | "replan";
        };

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: ITINERARY_SYSTEM_PROMPT },
                    ...messages,
                ],
                temperature: mode === "replan" ? 0.6 : 0.75,
                max_tokens: 2048,
                stream: false,
                response_format: { type: "json_object" },
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("Groq itinerary error:", groqRes.status, errText);
            return NextResponse.json(
                {
                    chat_reply: "Sorry, I couldn't generate your itinerary right now. Try again!",
                    itinerary_data: [],
                },
                { status: 500 }
            );
        }

        const groqData = await groqRes.json();
        const rawContent = groqData.choices?.[0]?.message?.content ?? "{}";

        // Parse the JSON from Groq
        let parsed: { chat_reply?: string; itinerary_data?: unknown[] };
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            console.error("Failed to parse Groq JSON:", rawContent);
            parsed = {
                chat_reply: "I generated your plan but had a small formatting issue. Please try again!",
                itinerary_data: [],
            };
        }

        return NextResponse.json({
            chat_reply: parsed.chat_reply ?? "Here's your itinerary!",
            itinerary_data: parsed.itinerary_data ?? [],
        });
    } catch (err) {
        console.error("Safar itinerary route error:", err);
        return NextResponse.json(
            {
                chat_reply: "Oops! Something went wrong. Please try again.",
                itinerary_data: [],
            },
            { status: 500 }
        );
    }
}
