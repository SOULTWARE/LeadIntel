import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { creditsService, InsufficientCreditsError } from '@/services/creditsService';
import { CreditAction, getCreditCost } from '@/lib/credits/costs';
import { z } from 'zod';

const GenerateEmailRequestSchema = z.object({
  lead: z
    .object({
      name: z.string().min(1),
      type: z.string().nullish(),
      reasoning: z.string().nullish(),
      compatibilityHooks: z.array(z.string()).nullish(),
      identifiedProblems: z.array(z.string()).nullish(),
      searchQuery: z.string().nullish(),
    })
    .passthrough(),
  leadPurpose: z.string().nullish(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = GenerateEmailRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Lead data is required' }, { status: 400 });
    }

    const { lead, leadPurpose } = parsed.data;

    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return NextResponse.json({ success: false, error: 'Missing Idempotency-Key header' }, { status: 400 });
    }

    const holdAmount = getCreditCost(CreditAction.GENERATE_EMAIL);
    const shouldCharge = holdAmount > 0;

    if (shouldCharge) {
      try {
        await creditsService.createHold({
          userId: user.id,
          action: CreditAction.GENERATE_EMAIL,
          amount: holdAmount,
          idempotencyKey,
          meta: { leadName: lead.name },
        });
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 });
        }
        throw err;
      }
    }

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

      if (shouldCharge) {
        try {
          await creditsService.releaseHold({
            userId: user.id,
            action: CreditAction.GENERATE_EMAIL,
            idempotencyKey,
          });
        } catch {}
      }

      return NextResponse.json({ success: false, error: 'Failed to generate email' }, { status: 500 });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    if (shouldCharge) {
      await creditsService.captureHold({
        userId: user.id,
        action: CreditAction.GENERATE_EMAIL,
        idempotencyKey,
      });
    }

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error("[EmailGen] Error:", error);

    try {
      const idempotencyKey = req.headers.get('Idempotency-Key');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && idempotencyKey) {
        await creditsService.releaseHold({
          userId: user.id,
          action: CreditAction.GENERATE_EMAIL,
          idempotencyKey,
        });
      }
    } catch {}

    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
