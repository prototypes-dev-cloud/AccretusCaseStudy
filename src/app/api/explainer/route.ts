import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const DISCLAIMER =
  '\n\n⚠️ Disclaimer: This summary is for informational purposes only and does not constitute tax, legal, or financial advice. Please consult your qualified tax advisor and/or legal counsel regarding your specific situation.';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  let body: {
    clientName: string;
    stage: string;
    deadline45Day: string;
    days45Remaining: number;
    deadline180Day: string;
    days180Remaining: number;
    escrowStatus: string;
    fundsAmount: number;
    propertyType: string;
    closingDate: string;
    hasReplacement: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const {
    clientName,
    stage,
    deadline45Day,
    days45Remaining,
    deadline180Day,
    days180Remaining,
    escrowStatus,
    fundsAmount,
    propertyType,
    closingDate,
    hasReplacement,
  } = body;

  const systemPrompt = `You are a plain-English communication specialist for Atlanta Deferred Exchange (ADE), a Qualified Intermediary (QI) for IRS §1031 tax-deferred exchanges.

Your job is to write a SHORT (3-5 sentences), clear, jargon-free status update for a real estate client about their 1031 exchange.

STRICT RULES — follow every one of these:

ACCURACY GUARDRAILS (most important):
- You MUST only use dates and numbers that are explicitly provided in the data below. Do not calculate, estimate, or infer any dates or numbers yourself.
- If the data says "45-Day Deadline: Dec 15, 2026 (35 days remaining)", you must use "December 15, 2026" and "35 days" exactly — do not alter them.
- Do not add, subtract, or derive any new dates from the ones given.
- Do not round, approximate, or paraphrase numeric values (dollar amounts, day counts).
- If a value is not provided, omit it entirely rather than guessing.

CONTENT RULES:
- Write directly to the client using only their first name
- Use plain English — no tax jargon, no legalese, no IRC section references
- If a deadline has 10 or fewer days remaining, open with a clear urgent warning
- Do NOT give tax or legal advice of any kind
- Do NOT recommend specific replacement properties
- Do NOT add a disclaimer — one will be appended automatically
- End with exactly one clear, concrete action the client should take next
- Keep the body under 100 words`;

  const userPrompt = `Write a client status update using ONLY the following verified data. Do not use any other dates or numbers.

=== VERIFIED EXCHANGE DATA (use these values exactly) ===
Client First Name: ${clientName.split(' ')[0]}
Current Stage: ${stage}
Property Type: ${propertyType}
Original Closing Date: ${closingDate}
Escrow Status: ${escrowStatus}
Exchange Value: $${fundsAmount.toLocaleString()}
45-Day Identification Deadline: ${deadline45Day} — ${days45Remaining >= 0 ? `${days45Remaining} days remaining` : 'PASSED'}
180-Day Completion Deadline: ${deadline180Day} — ${days180Remaining >= 0 ? `${days180Remaining} days remaining` : 'PASSED'}
Replacement Property Identified: ${hasReplacement ? 'Yes' : 'No'}
=== END OF VERIFIED DATA ===`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const result = await model.generateContent([
      { text: systemPrompt + '\n\n' + userPrompt },
    ]);

    // Strip any disclaimer the model may have added anyway, then append ours
    let text = result.response.text().trim();
    // Remove common disclaimer lead-ins the model might add despite instructions
    text = text.replace(
      /\n*(disclaimer|please note|important\s*:|note\s*:)[^\n]*/gi,
      ''
    ).trim();

    return Response.json({ text: text + DISCLAIMER });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gemini API error';
    console.error('[explainer] Gemini error:', message);
    return Response.json({ error: message }, { status: 502 });
  }
}
