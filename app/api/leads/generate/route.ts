import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateLeads } from '@/services/leadGenerationService';

const requestSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  location: z.string().min(1, 'Location is required'),
  count: z.number().int().min(1).max(50).default(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 422 }
      );
    }

    const { industry, location, count } = validation.data;

    const result = await generateLeads({
      industry,
      location,
      count,
      senderName: 'Lead Intel',
      senderCompany: 'Lead Intel',
    });

    if (!result.success && result.validLeads.length === 0) {
      return NextResponse.json(
        {
          error: 'Lead generation failed',
          invalidLeads: result.invalidLeads,
          totalProcessed: result.totalProcessed,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: result.validLeads,
      invalidLeads: result.invalidLeads,
      totalProcessed: result.totalProcessed,
    });
  } catch (error) {
    console.error('[API /api/leads/generate] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
