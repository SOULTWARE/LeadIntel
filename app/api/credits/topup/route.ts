import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";

const TopupRequestSchema = z.object({
  amount: z.coerce.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return NextResponse.json({ success: false, error: "Missing Idempotency-Key header" }, { status: 400 });
  }

  const parsed = TopupRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  await creditsService.addCredits({
    userId: user.id,
    amount: parsed.data.amount,
    idempotencyKey,
    meta: { source: "manual" },
  });

  const balance = await creditsService.getBalance(user.id);

  return NextResponse.json({
    success: true,
    data: {
      balance,
    },
  });
}
