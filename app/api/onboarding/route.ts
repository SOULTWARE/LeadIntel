import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/db";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      onboardingCompleted: profile?.onboardingCompleted ?? false,
      profile: profile ?? null,
    });
  } catch (error) {
    console.error("[api/onboarding GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const {
      fullName,
      companyName,
      industry,
      companySize,
      role,
      referralSource,
    } = body as {
      fullName?: string;
      companyName?: string;
      industry?: string;
      companySize?: string;
      role?: string;
      referralSource?: string;
    };

    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName: fullName?.trim() || null,
        companyName: companyName?.trim() || null,
        industry: industry?.trim() || null,
        companySize: companySize?.trim() || null,
        role: role?.trim() || null,
        referralSource: referralSource?.trim() || null,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
      update: {
        fullName: fullName?.trim() || null,
        companyName: companyName?.trim() || null,
        industry: industry?.trim() || null,
        companySize: companySize?.trim() || null,
        role: role?.trim() || null,
        referralSource: referralSource?.trim() || null,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });

    const response = NextResponse.json({ success: true, profile });
    response.cookies.set("onboarding_completed", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    console.error("[api/onboarding POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
