import { NextRequest, NextResponse } from "next/server";
import { googleMapsScraperService } from "@/services/googleMapsScraperService";
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

    const results = await googleMapsScraperService.scrape({
      categories,
      plainQueries,
      location,
      country,
      maxResults: maxResults ?? 20,
      language
    });

    return NextResponse.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    console.error("[API /api/scraper] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
