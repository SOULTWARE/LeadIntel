import { NextResponse } from 'next/server';
import { z } from 'zod';

const GenerateEmailRequestSchema = z.object({
  lead: z
    .object({
      name: z.string().min(1),
      type: z.string().optional(),
      reasoning: z.string().optional(),
      compatibilityHooks: z.array(z.string()).optional(),
      identifiedProblems: z.array(z.string()).optional(),
      searchQuery: z.string().optional(),
    })
    .passthrough(),
  leadPurpose: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = GenerateEmailRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Lead data is required' }, { status: 400 });
    }

    const { lead, leadPurpose } = parsed.data;

    const prompt = `
You are a master of personalized outreach.
Draft a highly personalized, human-sounding email to the following business.

BUSINESS INFO:
- Name: ${lead.name}
- Type: ${lead.type || 'N/A'}
- Description: ${lead.reasoning || 'N/A'}
- Compatibility Hooks: ${JSON.stringify(lead.compatibilityHooks || [])}
- Identified Problems: ${JSON.stringify(lead.identifiedProblems || [])}

OUTREACH PURPOSE:
"${leadPurpose || 'Partnership discussion'}"

INSTRUCTIONS:
1. Use an informal but professional tone.
2. Reference at least one "Compatibility Hook" or "Problem" naturally.
3. Keep it short (max 150 words).
4. Include a clear, non-pushy Call to Action.
5. Provide a Subject Line.

Return ONLY a valid JSON object:
{
  "subject": "string",
  "body": "string"
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-5-nano",
        messages: [
          { role: "system", content: "You are a personalized outreach expert. Return JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[EmailGen] OpenAI Error:", errorData);
      return NextResponse.json({ success: false, error: 'Failed to generate email' }, { status: 500 });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("[EmailGen] Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
