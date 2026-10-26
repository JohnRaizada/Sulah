import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { SCENARIOS } from '@/data/scenarios';
import { getSimulatedReply } from '@/lib/simulator';

export async function POST(req: NextRequest) {
  let requestedScenario = SCENARIOS.find((s) => s.id === 'relationship-chores') || SCENARIOS[0];

  try {
    const { scenarioId, messages } = await req.json();

    const matched = SCENARIOS.find((s) => s.id === scenarioId);
    if (matched) {
      requestedScenario = matched;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const lastUserMessage = messages[messages.length - 1]?.text || '';

    // If no server environment key is configured, fallback cleanly to simulator
    if (!apiKey) {
      const simulated = getSimulatedReply(requestedScenario, messages, lastUserMessage);
      return NextResponse.json({
        reply: simulated.text,
        tension: simulated.tension,
        isSimulated: true,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const conversationPrompt = messages
      .map(
        (m: { sender: string; text: string }) =>
          `${m.sender === 'user' ? 'User' : requestedScenario.characterName}: ${m.text}`
      )
      .join('\n');

    const prompt = `
${requestedScenario.systemPrompt}

Conversation so far:
${conversationPrompt}

Respond to the User's latest message as ${requestedScenario.characterName}.
Remember your personality, keep it authentic and concise (2-4 sentences).
On the very last line of your response, output ONLY a JSON object formatted exactly as:
{"tension": <integer between 0 and 100>, "state": "calming" | "neutral" | "escalating"}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawOutput = response.text()?.trim() || '';

    let tension = 65;
    let cleanReply = rawOutput;

    const jsonMatch = rawOutput.match(/\{"tension":\s*(\d+)[^}]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.tension === 'number') {
          tension = Math.max(0, Math.min(100, parsed.tension));
        }
      } catch (e) {
        // Fallback parsing
      }
      cleanReply = rawOutput.replace(/\{"tension":\s*\d+[^}]*\}/g, '').trim();
    }

    return NextResponse.json({
      reply: cleanReply,
      tension,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    // Use requestedScenario rather than hardcoding SCENARIOS[0] (which was Manish's slide deck!)
    const simulated = getSimulatedReply(requestedScenario, [], 'Hello');
    return NextResponse.json({
      reply: simulated.text,
      tension: simulated.tension,
      isSimulated: true,
      errorNote: error.message || 'Error communicating with Gemini, used offline simulation',
    });
  }
}
