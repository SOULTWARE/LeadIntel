import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailRaw = typeof body?.email === "string" ? body.email : null;

    if (!emailRaw) {
      return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 });
    }

    const email = emailRaw.trim().toLowerCase();
    const blocked = await prisma.blockedEmail.findUnique({ where: { email } });

    return NextResponse.json({ success: true, blocked: Boolean(blocked) });
  } catch (error) {
    console.error("[api/account/blocked]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
