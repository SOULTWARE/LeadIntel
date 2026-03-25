import type { EmailVerificationStatus } from "@prisma/client";

export function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getDomainFromWebsite(website?: string | null): string | null {
  if (!website) return null;

  try {
    const withProtocol =
      website.startsWith("http://") || website.startsWith("https://")
        ? website
        : `https://${website}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function buildBatchCode(seed?: string | null): string {
  const base =
    (seed || "batch")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "batch";

  const suffix = Date.now().toString(36).slice(-6);
  return `${base}-${suffix}`;
}

export function parseEmployeeEstimate(
  employeeRange?: string | null,
): number | undefined {
  if (!employeeRange) return undefined;
  const numbers =
    employeeRange
      .match(/\d+/g)
      ?.map(Number)
      .filter((value) => Number.isFinite(value)) ?? [];
  if (numbers.length === 0) return undefined;
  if (numbers.length === 1) return numbers[0];
  return Math.round((numbers[0] + numbers[numbers.length - 1]) / 2);
}

export function computeWarmupScore(input: {
  linkedinTouchedAt?: Date | string | null;
  contentEngagedAt?: Date | string | null;
  warmIntroRequestedAt?: Date | string | null;
}): number {
  let score = 0;
  if (input.linkedinTouchedAt) score += 40;
  if (input.contentEngagedAt) score += 35;
  if (input.warmIntroRequestedAt) score += 25;
  return Math.min(100, score);
}

export function computeLeadQualityScore(input: {
  compatibilityScore?: number | null;
  emailVerificationStatus?: EmailVerificationStatus | null;
  warmupScore?: number | null;
  companyConfidence?: number | null;
  hasDecisionMakerRole?: boolean;
}): number {
  const compatibility = clamp(input.compatibilityScore ?? 0, 0, 100);
  const warmup = clamp(input.warmupScore ?? 0, 0, 100);
  const companyConfidence = clamp(input.companyConfidence ?? 0, 0, 100);
  const emailScore = mapVerificationToScore(input.emailVerificationStatus);
  const decisionMakerBonus = input.hasDecisionMakerRole ? 10 : 0;

  const weighted =
    compatibility * 0.5 +
    emailScore * 0.2 +
    warmup * 0.15 +
    companyConfidence * 0.15 +
    decisionMakerBonus;

  return clamp(Math.round(weighted), 0, 100);
}

export function calculateRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mapVerificationToScore(
  status?: EmailVerificationStatus | null,
): number {
  if (status === "VALID") return 100;
  if (status === "RISKY") return 50;
  if (status === "UNKNOWN") return 25;
  if (status === "INVALID") return 0;
  return 10;
}
