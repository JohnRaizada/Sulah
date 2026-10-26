import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { SCENARIOS } from "@/data/scenarios";
import { getSimulatedEvaluation } from "@/lib/simulator";

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, messages } = await req.json();

    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 },
      );
    }

    // Read exclusively from server-side environment variable
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      const evaluation = getSimulatedEvaluation(scenario, messages);
      return NextResponse.json({ evaluation, isSimulated: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: { responseMimeType: "application/json" },
    });

    const conversationTranscript = messages
      .map(
        (m: { sender: string; text: string }) =>
          `${m.sender === "user" ? "User (trainee)" : scenario.characterName}: ${m.text}`,
      )
      .join("\n");

    const prompt = `
You are an expert Conflict Resolution Coach and Executive Mediator evaluating a trainee's performance in a simulated conflict.

Scenario: ${scenario.title}
Context: ${scenario.description}
Trainee Goal: De-escalate the counterpart (${scenario.characterName}), validate their underlying needs (${scenario.underlyingNeeds.join(", ")}), and reach a collaborative solution without escalating.

Transcript:
${conversationTranscript}

Evaluate how well the Trainee managed the conflict.
Return ONLY valid JSON matching this exact structure:
{
  "score": <number 0-100>,
  "overallVerdict": "De-escalated Successfully" | "Partially Resolved" | "Escalated / Unresolved",
  "summary": "<Concise paragraph summarizing the trainee's communicative posture and outcome>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<area 1>", "<area 2>", "<area 3>"],
  "techniqueBreakdown": {
    "activeListening": <number 0-100>,
    "empathyValidation": <number 0-100>,
    "emotionalRegulation": <number 0-100>,
    "solutionOrientation": <number 0-100>
  },
  "keyTakeaways": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawJson = response.text()?.trim() || "{}";
    const evaluation = JSON.parse(rawJson);

    return NextResponse.json({ evaluation, isSimulated: false });
  } catch (error: any) {
    console.error("Feedback API Error:", error);
    const scenario = SCENARIOS[0];
    const fallbackEval = getSimulatedEvaluation(scenario, []);
    return NextResponse.json({
      evaluation: fallbackEval,
      isSimulated: true,
      errorNote: error.message,
    });
  }
}
