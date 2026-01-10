import { NextRequest, NextResponse } from "next/server";
import { googleMapsScraperService } from "@/services/googleMapsScraperService";
import { createClient } from "@/lib/supabase/server";
import { creditsService, InsufficientCreditsError } from "@/services/creditsService";
import { CreditAction, getCreditCost } from "@/lib/credits/costs";
import { z } from "zod";

const ScraperRequestSchema = z.object({
  categories: z.string().optional(),
  plainQueries: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  maxResults: z.coerce.number().int().positive().optional(),
  language: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = ScraperRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const { categories, plainQueries, location, country, maxResults, language } = parsed.data;

    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return NextResponse.json({ success: false, error: "Missing Idempotency-Key header" }, { status: 400 });
    }

    const requestedMaxResults = maxResults ?? 20;
    const holdAmount = getCreditCost(CreditAction.SCRAPE, { resultsCount: requestedMaxResults });
    const shouldCharge = holdAmount > 0;

    if (shouldCharge) {
      try {
        await creditsService.createHold({
          userId: user.id,
          action: CreditAction.SCRAPE,
          amount: holdAmount,
          idempotencyKey,
          meta: { requestedMaxResults },
        });
      } catch (err) {
        if (err instanceof InsufficientCreditsError) {
          return NextResponse.json({ success: false, error: "Insufficient credits" }, { status: 402 });
        }
        throw err;
      }
    }

    const results = await googleMapsScraperService.scrape({
      categories,
      plainQueries,
      location,
      country,
      maxResults: requestedMaxResults,
      language
    });

    if (shouldCharge) {
      await creditsService.captureHold({
        userId: user.id,
        action: CreditAction.SCRAPE,
        idempotencyKey,
        finalAmount: results.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    console.error("[API /api/scraper] Error:", error);

    try {
      const idempotencyKey = request.headers.get("Idempotency-Key");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && idempotencyKey) {
        await creditsService.releaseHold({
          userId: user.id,
          action: CreditAction.SCRAPE,
          idempotencyKey,
        });
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
