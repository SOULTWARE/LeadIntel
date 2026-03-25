import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { createClient } from "@/lib/supabase/server";
import {
  buildBatchCode,
  computeLeadQualityScore,
  getDomainFromWebsite,
  normalizeCompanyName,
  parseEmployeeEstimate,
} from "@/lib/leads/insights";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const SaveLeadsRequestSchema = z.object({
  leads: z
    .array(
      z
        .object({
          name: z.string().min(1),
          address: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          website: z.string().nullable().optional(),
          rating: z.coerce.number().nullable().optional(),
          reviews: z.coerce.number().nullable().optional(),
          type: z.string().nullable().optional(),
          placeId: z.string().nullable().optional(),
          aiAnalysis: z
            .object({
              compatibilityScore: z.number().optional(),
              recommendation: z.string().optional(),
              reasoning: z.string().optional(),
              identifiedProblems: z.unknown().optional(),
              compatibilityHooks: z.unknown().optional(),
              companyProfile: z
                .object({
                  industry: z.string().optional(),
                  companySize: z.string().optional(),
                  employeeRange: z.string().optional(),
                  revenueRange: z.string().optional(),
                  locationSummary: z.string().optional(),
                  confidence: z.number().optional(),
                })
                .optional(),
              decisionMakerRoles: z.array(z.string()).optional(),
              outreachSignals: z.array(z.string()).optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    )
    .default([]),
  sessionName: z.string().optional(),
  target: z.string().optional(),
  location: z.string().optional(),
  contactPurpose: z.string().optional(),
  campaignName: z.string().optional(),
  segmentName: z.string().optional(),
  batchName: z.string().optional(),
  batchCode: z.string().optional(),
  qualityStrictness: z.coerce.number().int().min(0).max(100).optional(),
  employeeRangeMin: z.coerce.number().int().nonnegative().optional(),
  employeeRangeMax: z.coerce.number().int().nonnegative().optional(),
  revenueRange: z.string().optional(),
  targetRoles: z.array(z.string()).optional().default([]),
});

async function upsertCompanyForLead(input: {
  lead: z.infer<typeof SaveLeadsRequestSchema>["leads"][number];
  fallbackIndustry?: string;
  fallbackLocation?: string;
}) {
  const normalizedName = normalizeCompanyName(input.lead.name);
  const domain = getDomainFromWebsite(input.lead.website);
  const companyProfile = input.lead.aiAnalysis?.companyProfile;
  const employeeEstimate = parseEmployeeEstimate(companyProfile?.employeeRange);
  const companyData: Prisma.CompanyUncheckedCreateInput = {
    name: input.lead.name,
    normalizedName,
    domain: domain || undefined,
    websiteUrl: input.lead.website || undefined,
    hqLocation: input.lead.address || input.fallbackLocation || undefined,
    employeeCountEstimate: employeeEstimate,
    companySize: companyProfile?.companySize || undefined,
    revenueRange: companyProfile?.revenueRange || undefined,
    industry:
      companyProfile?.industry ||
      input.lead.type ||
      input.fallbackIndustry ||
      undefined,
    industryConfidence: companyProfile?.confidence,
    city: input.fallbackLocation || undefined,
    decisionMakerRoleHints: (input.lead.aiAnalysis?.decisionMakerRoles ||
      []) as Prisma.InputJsonValue,
    lastEnrichedAt: input.lead.aiAnalysis ? new Date() : undefined,
    sourceJson: {
      source: "lead-save",
      placeId: input.lead.placeId || null,
      address: input.lead.address || null,
    } as Prisma.InputJsonValue,
  };

  const existing = domain
    ? await prisma.company.findUnique({ where: { domain } })
    : await prisma.company.findFirst({ where: { normalizedName } });

  if (existing) {
    const updated = await prisma.company.update({
      where: { id: existing.id },
      data: {
        name: companyData.name,
        normalizedName: companyData.normalizedName,
        domain: companyData.domain,
        websiteUrl: companyData.websiteUrl,
        hqLocation: companyData.hqLocation,
        employeeCountEstimate: companyData.employeeCountEstimate,
        companySize: companyData.companySize,
        revenueRange: companyData.revenueRange,
        industry: companyData.industry,
        industryConfidence: companyData.industryConfidence,
        city: companyData.city,
        decisionMakerRoleHints: companyData.decisionMakerRoleHints,
        lastEnrichedAt: companyData.lastEnrichedAt,
        sourceJson: companyData.sourceJson,
      },
      select: { id: true },
    });

    return updated.id;
  }

  const created = await prisma.company.create({
    data: companyData,
    select: { id: true },
  });

  return created.id;
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
        { status: 401 },
      );
    }

    const parsed = SaveLeadsRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request. 'leads' array is required.",
        },
        { status: 400 },
      );
    }

    const {
      leads,
      sessionName,
      target,
      location,
      contactPurpose,
      campaignName,
      segmentName,
      batchName,
      batchCode,
      qualityStrictness,
      employeeRangeMin,
      employeeRangeMax,
      revenueRange,
      targetRoles,
    } = parsed.data;

    let sessionId: string | undefined;
    if (sessionName) {
      const session = await prisma.session.create({
        data: {
          name: sessionName,
          target: target,
          location: location,
          userId: user.id,
        },
      });
      sessionId = session.id;
    }

    let campaignId: string | undefined;
    if (campaignName?.trim()) {
      const campaign = await prisma.campaign.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: campaignName.trim(),
          },
        },
        update: {
          segmentName: segmentName?.trim() || undefined,
          qualityStrictness: qualityStrictness ?? 50,
          targetRoles: targetRoles as Prisma.InputJsonValue,
        },
        create: {
          userId: user.id,
          name: campaignName.trim(),
          segmentName: segmentName?.trim() || undefined,
          qualityStrictness: qualityStrictness ?? 50,
          targetRoles: targetRoles as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      campaignId = campaign.id;
    }

    const search = leads.length
      ? await prisma.search.create({
          data: {
            userId: user.id,
            status: "COMPLETE",
            industry: target?.trim() || "General",
            location: location?.trim() || "Global",
            employeeRangeMin,
            employeeRangeMax,
            revenueRange: revenueRange?.trim() || undefined,
            targetRoles: targetRoles as Prisma.InputJsonValue,
            qualityStrictness: qualityStrictness ?? 50,
            segmentName: segmentName?.trim() || undefined,
            keywords: targetRoles as Prisma.InputJsonValue,
            rawInput: {
              sessionName: sessionName || null,
              contactPurpose: contactPurpose || null,
              campaignName: campaignName || null,
              batchName: batchName || null,
            } as Prisma.InputJsonValue,
            campaignId,
          },
          select: { id: true },
        })
      : null;

    let savedBatchId: string | undefined;
    if (batchName?.trim() || batchCode?.trim()) {
      const resolvedBatchCode =
        batchCode?.trim() || buildBatchCode(batchName || sessionName || target);
      const batch = await prisma.leadBatch.upsert({
        where: {
          userId_code: {
            userId: user.id,
            code: resolvedBatchCode,
          },
        },
        update: {
          name: batchName?.trim() || resolvedBatchCode,
          status: "READY",
          maxLeads: leads.length,
          campaignId,
        },
        create: {
          userId: user.id,
          name: batchName?.trim() || resolvedBatchCode,
          code: resolvedBatchCode,
          status: "READY",
          maxLeads: leads.length,
          campaignId,
        },
        select: { id: true, code: true },
      });
      savedBatchId = batch.id;
    }

    const savedLeads = await Promise.all(
      leads.map(async (lead) => {
        const companyId = await upsertCompanyForLead({
          lead,
          fallbackIndustry: target,
          fallbackLocation: location,
        });

        const decisionMakerRoles = lead.aiAnalysis?.decisionMakerRoles || [];
        const primaryDecisionMakerRole = decisionMakerRoles[0];
        const warmupSignals = {
          linkedinTouched: false,
          contentEngaged: false,
          warmIntroRequested: false,
          suggestedTouches: lead.aiAnalysis?.outreachSignals || [],
        };
        const qualityScore = computeLeadQualityScore({
          compatibilityScore: lead.aiAnalysis?.compatibilityScore,
          warmupScore: 0,
          companyConfidence: lead.aiAnalysis?.companyProfile?.confidence,
          hasDecisionMakerRole: Boolean(primaryDecisionMakerRole),
        });

        const createData: Prisma.LeadUncheckedCreateInput = {
          name: lead.name,
          address: lead.address,
          phone: lead.phone,
          website: lead.website,
          rating: lead.rating,
          reviews: lead.reviews,
          type: lead.type,
          placeId: lead.placeId,
          sessionId: sessionId,
          userId: user.id,
          searchQuery: contactPurpose || undefined,
          location: location || undefined,
          searchId: search?.id,
          companyId,
          campaignId,
          batchId: savedBatchId,
          segmentName: segmentName?.trim() || undefined,
          qualityScore,
          decisionMakerRoles: decisionMakerRoles as Prisma.InputJsonValue,
          primaryDecisionMakerRole,
          warmupSignals: warmupSignals as Prisma.InputJsonValue,
        };

        const updateData: Prisma.LeadUncheckedUpdateInput = {
          name: lead.name,
          address: lead.address,
          phone: lead.phone,
          website: lead.website,
          rating: lead.rating,
          reviews: lead.reviews,
          type: lead.type,
          placeId: lead.placeId,
          sessionId: sessionId,
          userId: user.id,
          searchQuery: contactPurpose || undefined,
          location: location || undefined,
          searchId: search?.id,
          companyId,
          campaignId,
          batchId: savedBatchId,
          segmentName: segmentName?.trim() || undefined,
          qualityScore,
          decisionMakerRoles: decisionMakerRoles as Prisma.InputJsonValue,
          primaryDecisionMakerRole,
          warmupSignals: warmupSignals as Prisma.InputJsonValue,
        };

        if (lead.aiAnalysis) {
          createData.isEnhanced = true;
          createData.compatibilityScore = lead.aiAnalysis.compatibilityScore;
          createData.recommendation = lead.aiAnalysis.recommendation;
          createData.reasoning = lead.aiAnalysis.reasoning;
          createData.identifiedProblems = lead.aiAnalysis
            .identifiedProblems as Prisma.InputJsonValue;
          createData.compatibilityHooks = lead.aiAnalysis
            .compatibilityHooks as Prisma.InputJsonValue;

          updateData.isEnhanced = true;
          updateData.compatibilityScore = lead.aiAnalysis.compatibilityScore;
          updateData.recommendation = lead.aiAnalysis.recommendation;
          updateData.reasoning = lead.aiAnalysis.reasoning;
          updateData.identifiedProblems = lead.aiAnalysis
            .identifiedProblems as Prisma.InputJsonValue;
          updateData.compatibilityHooks = lead.aiAnalysis
            .compatibilityHooks as Prisma.InputJsonValue;
        }

        if (lead.placeId) {
          return prisma.lead.upsert({
            where: { placeId: lead.placeId },
            update: updateData,
            create: createData,
          });
        }

        const existingLead = await prisma.lead.findFirst({
          where: {
            userId: user.id,
            name: lead.name,
            website: lead.website || undefined,
          },
          select: { id: true },
        });

        if (existingLead) {
          return prisma.lead.update({
            where: { id: existingLead.id },
            data: updateData,
          });
        }

        return prisma.lead.create({ data: createData });
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        count: savedLeads.length,
        campaignId,
        batchId: savedBatchId,
        searchId: search?.id,
      },
    });
  } catch (error) {
    console.error("[API /api/leads/save] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
