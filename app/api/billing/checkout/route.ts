import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { polar } from "@/lib/polar/server";
import { getOrCreatePolarCustomer } from "@/lib/polar/customers";
import {
  POLAR_ADDON_PRODUCT_ID,
  POLAR_PRO_PRODUCT_ID,
  POLAR_STARTER_PRODUCT_ID,
  POLAR_SUCCESS_URL,
} from "@/lib/polar/config";

const CheckoutRequestSchema = z.object({
  type: z.enum(["subscription", "addon"]),
  plan: z.enum(["starter", "pro"]).optional(),
});

function getProductId(input: { type: "subscription" | "addon"; plan?: "starter" | "pro" }): string | null {
  if (input.type === "addon") {
    return POLAR_ADDON_PRODUCT_ID || null;
  }

  if (input.plan === "starter") {
    return POLAR_STARTER_PRODUCT_ID || null;
  }

  if (input.plan === "pro") {
    return POLAR_PRO_PRODUCT_ID || null;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = CheckoutRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  if (parsed.data.type === "subscription" && !parsed.data.plan) {
    return NextResponse.json({ success: false, error: "Plan is required" }, { status: 400 });
  }

  const productId = getProductId(parsed.data);
  if (!productId) {
    return NextResponse.json({ success: false, error: "Missing Polar product ID" }, { status: 500 });
  }

  const customerId = await getOrCreatePolarCustomer({ userId: user.id, email: user.email });

  const checkout = await polar.checkouts.create({
    products: [productId],
    customerId,
    successUrl: POLAR_SUCCESS_URL,
    metadata: {
      userId: user.id,
      type: parsed.data.type,
      plan: parsed.data.plan ?? "",
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      url: checkout.url,
    },
  });
}
