import { NextRequest, NextResponse } from "next/server";

/**
 * /api/compare-trips
 *
 * Takes member preferences (budget, energy, interests, destination)
 * and generates 3 AI-powered scenario comparisons via Groq.
 */

const COMPARE_SYSTEM_PROMPT = `You are Safar, an expert AI travel planner inside SyncRoute.
You analyze group member preferences (budget, energy levels, interests) and generate exactly 3 trip scenario comparisons to resolve conflicts.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

The JSON must have this EXACT structure:
{
  "title": "Comparison title (e.g. 'Goa vs Kerala' or 'Extend Ladakh +2 days')",
  "ai_recommendation": "Name of the scenario you recommend",
  "regret_budget": { "current": <number 0-100>, "max": 50 },
  "scenarios": [
    {
      "id": "short-id",
      "title": "Scenario name",
      "subtitle": "Short description",
      "days": <number>,
      "base_cost": "₹XX.Xk",
      "extra_cost": "+₹X.Xk or null",
      "experience": <0-100>,
      "low_fatigue": <0-100>,
      "regret_risk": <0-100>,
      "tags": ["Location1", "Location2"],
      "notes": [
        { "icon": "cost|fatigue|unlock|regret|nature|mix|info", "text": "Note text", "color": "#hexcolor" }
      ],
      "badges": [
        { "label": "Badge text", "color": "#hexcolor", "text_color": "#000 or #fff" }
      ],
      "radar": {
        "experience": <0-100>,
        "low_fatigue": <0-100>,
        "budget_safety": <0-100>,
        "low_regret": <0-100>,
        "feasibility": <0-100>
      },
      "is_recommended": true/false
    }
  ],
  "analysis": "A 2-3 sentence explanation of why you recommend this option and how it resolves the group conflicts."
}

Rules:
- Generate EXACTLY 3 scenarios
- The first scenario is the "baseline" (cheapest/simplest)
- The second expands on it (adds more or changes destination)
- The third is your balanced "AI Pick" that resolves conflicts
- Mark only ONE scenario as is_recommended: true
- Give it both "Least Regret" and "AI Pick" badges
- Use Indian Rupee (₹) for all costs
- Make scenarios realistic and practical
- regret_risk should be LOWER for better options (low regret = good)
- Analyze genuine trade-offs between member preferences
- If someone wants beaches and another wants mountains, find creative combinations
- RESPOND WITH RAW JSON ONLY. NO MARKDOWN FENCES.`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            destination: string;
            members: {
                name: string;
                budget: string;
                energy: string;
                interests: string[];
            }[];
        };

        const { destination, members } = body;

        // Build the user prompt from member preferences
        const memberDescriptions = members.map((m, i) =>
            `Member ${i + 1} (${m.name}): Budget=${m.budget}, Energy Level=${m.energy}, Interests=${m.interests.join(", ")}`
        ).join("\n");

        const userPrompt = `Generate 3 trip scenarios for: "${destination}"

Group Members:
${memberDescriptions}

Analyze their preferences, identify any conflicts (budget differences, energy mismatches, interest clashes), and create 3 scenarios:
1. A baseline that favors the majority
2. An alternative that addresses minority preferences  
3. A balanced "AI Pick" that minimizes regret for everyone

Consider real locations, realistic costs in INR, and practical timelines.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: COMPARE_SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 3000,
                stream: false,
                response_format: { type: "json_object" },
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("Groq compare error:", groqRes.status, errText);
            return NextResponse.json({ error: "AI comparison failed" }, { status: 500 });
        }

        const groqData = await groqRes.json();
        const rawContent = groqData.choices?.[0]?.message?.content ?? "{}";

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            console.error("Failed to parse compare JSON:", rawContent);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json(parsed);
    } catch (err) {
        console.error("Compare route error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
