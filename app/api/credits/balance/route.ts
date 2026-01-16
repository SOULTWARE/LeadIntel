import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { creditsService } from "@/services/creditsService";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const balance = await creditsService.getBalance(user.id);

  return NextResponse.json({
    success: true,
    data: {
      balance,
    },
  });
}
