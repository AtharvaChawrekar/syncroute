import { NextRequest } from "next/server";

const SAFAR_SYSTEM_PROMPT = `You are Safar, an expert AI travel planner inside the SyncRoute app.
You help groups plan trips collaboratively. You are concise, practical, and enthusiastic about travel.
You respond in a conversational tone. When asked to plan, provide structured but friendly suggestions.
Keep responses under 300 words unless the user explicitly asks for a detailed plan.
Never mention that you are an AI language model — you are Safar, SyncRoute's built-in travel intelligence.`;

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json() as {
            messages: { role: "user" | "assistant" | "system"; content: string }[];
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
                    { role: "system", content: SAFAR_SYSTEM_PROMPT },
                    ...messages,
                ],
                temperature: 0.75,
                max_tokens: 512,
                stream: true,         // ← enable token streaming
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("Groq API error:", groqRes.status, errText);
            // Return a non-streaming fallback so the client can still read it
            return new Response(
                `data: ${JSON.stringify({ choices: [{ delta: { content: "Sorry, Safar is unavailable right now. Please try again! ✈️" }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
                { headers: { "Content-Type": "text/event-stream" } }
            );
        }

        // Pipe Groq's SSE stream straight to the browser
        return new Response(groqRes.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (err) {
        console.error("Safar route error:", err);
        return new Response(
            `data: ${JSON.stringify({ choices: [{ delta: { content: "Oops! Something went wrong. Please try again." }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
            { headers: { "Content-Type": "text/event-stream" } }
        );
    }
}
