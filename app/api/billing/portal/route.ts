import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar/server";
import { getPolarCustomerIdByUserId } from "@/lib/polar/customers";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const customerId = await getPolarCustomerIdByUserId(user.id);
  if (!customerId) {
    return NextResponse.json({ success: false, error: "Missing Polar customer" }, { status: 400 });
  }

  const session = await polar.customerSessions.create({
    customerId,
  });

  return NextResponse.json({
    success: true,
    data: { url: session.customerPortalUrl },
  });
}
