import { NextRequest, NextResponse } from "next/server";
import { googleMapsScraperService } from "@/services/googleMapsScraperService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      categories,
      plainQueries,
      location,
      country,
      maxResults,
      language
    } = body;

    const results = await googleMapsScraperService.scrape({
      categories,
      plainQueries,
      location,
      country,
      maxResults: parseInt(maxResults) || 20,
      language
    });

    return NextResponse.json({
      success: true,
      results,
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
