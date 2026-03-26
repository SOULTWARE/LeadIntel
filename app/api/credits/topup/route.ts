import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";

const TOPUP_SECRET_ENV = "CREDITS_TOPUP_SECRET";

const TopupRequestSchema = z.object({
  amount: z.coerce.number().int().positive(),
  userId: z.string().min(1).optional(),
});

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function secretsMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function authorizeTopupRequest(
  request: NextRequest,
): { ok: true } | { ok: false; status: number; error: string } {
  const configuredSecret = process.env[TOPUP_SECRET_ENV];
  if (!configuredSecret) {
    return {
      ok: false,
      status: 503,
      error: `${TOPUP_SECRET_ENV} is not configured`,
    };
  }

  const providedSecret =
    request.headers.get("x-credits-topup-secret") ?? getBearerToken(request);

  if (!providedSecret || !secretsMatch(configuredSecret, providedSecret)) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  const topupAuthorization = authorizeTopupRequest(request);
  if (!topupAuthorization.ok) {
    return NextResponse.json(
      { success: false, error: topupAuthorization.error },
      { status: topupAuthorization.status },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return NextResponse.json(
      { success: false, error: "Missing Idempotency-Key header" },
      { status: 400 },
    );
  }

  const parsed = TopupRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const targetUserId = parsed.data.userId ?? user?.id;
  if (!targetUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  await creditsService.addCredits({
    userId: targetUserId,
    amount: parsed.data.amount,
    idempotencyKey,
    meta: { source: "internal-manual" },
  });

  const balance = await creditsService.getBalance(targetUserId);

  return NextResponse.json({
    success: true,
    data: {
      userId: targetUserId,
      balance,
    },
  });
}
