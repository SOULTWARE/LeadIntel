import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ success: false, error: "Invalid contact id" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: parsedParams.data.id },
      include: {
        lead: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    if (contact.userId !== user.id || contact.lead.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.contact.updateMany({
        where: { leadId: contact.leadId },
        data: { isPrimary: false },
      });

      await tx.contact.update({
        where: { id: contact.id },
        data: { isPrimary: true },
      });

      await tx.lead.update({
        where: { id: contact.leadId },
        data: {
          primaryContactId: contact.id,
          email: contact.email,
          emailVerificationStatus: contact.emailVerificationStatus,
          emailVerifiedAt: contact.emailVerifiedAt,
          emailVerificationProvider: contact.emailVerificationProvider,
          primaryDecisionMakerRole: contact.roleTitle || contact.lead.primaryDecisionMakerRole,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        contactId: contact.id,
        leadId: contact.leadId,
        email: contact.email,
      },
    });
  } catch (error) {
    console.error("[API /api/contacts/[id]/primary] Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
