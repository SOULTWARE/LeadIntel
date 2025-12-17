/**
 * Monitoring Service
 *
 * Simple operational counters and alerting for the lead generation pipeline.
 *
 * ⚠️ MVP WARNING: No authentication on metrics endpoint.
 * In production, add proper auth before exposing metrics.
 */

import { prisma } from "../db";

interface MetricCounters {
  discoveryRequests: number;
  fetchErrors: number;
  verificationFailures: number;
  leadsSaved: number;
  analysisAttempts: number;
  analysisFailures: number;
}

interface TimestampedFailure {
  timestamp: number;
  reason: string;
}

const counters: MetricCounters = {
  discoveryRequests: 0,
  fetchErrors: 0,
  verificationFailures: 0,
  leadsSaved: 0,
  analysisAttempts: 0,
  analysisFailures: 0,
};

const recentVerificationFailures: TimestampedFailure[] = [];

const ALERT_THRESHOLD = 5;
const ALERT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between alerts

export function incrementDiscoveryRequests(): void {
  counters.discoveryRequests++;
}

export function incrementFetchErrors(): void {
  counters.fetchErrors++;
}

export function incrementVerificationFailures(reason: string): void {
  counters.verificationFailures++;

  recentVerificationFailures.push({
    timestamp: Date.now(),
    reason,
  });

  pruneOldFailures();
  checkVerificationFailureAlert();
}

export function incrementLeadsSaved(): void {
  counters.leadsSaved++;
}

export function incrementAnalysisAttempts(): void {
  counters.analysisAttempts++;
}

export function incrementAnalysisFailures(): void {
  counters.analysisFailures++;
}

export function getMetrics(): MetricCounters & {
  recentVerificationFailures: number;
  uptimeSeconds: number;
} {
  pruneOldFailures();

  return {
    ...counters,
    recentVerificationFailures: recentVerificationFailures.length,
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

export function resetMetrics(): void {
  counters.discoveryRequests = 0;
  counters.fetchErrors = 0;
  counters.verificationFailures = 0;
  counters.leadsSaved = 0;
  counters.analysisAttempts = 0;
  counters.analysisFailures = 0;
  recentVerificationFailures.length = 0;
}

function pruneOldFailures(): void {
  const cutoff = Date.now() - ALERT_WINDOW_MS;
  while (
    recentVerificationFailures.length > 0 &&
    recentVerificationFailures[0].timestamp < cutoff
  ) {
    recentVerificationFailures.shift();
  }
}

function checkVerificationFailureAlert(): void {
  if (recentVerificationFailures.length >= ALERT_THRESHOLD) {
    const now = Date.now();
    if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
      lastAlertTime = now;
      sendVerificationFailureAlert();
    }
  }
}

function sendVerificationFailureAlert(): void {
  const failureReasons = recentVerificationFailures
    .slice(-ALERT_THRESHOLD)
    .map((f) => f.reason)
    .join("; ");

  console.error("═".repeat(60));
  console.error("🚨 ALERT: High verification failure rate detected!");
  console.error(`   Failures in last hour: ${recentVerificationFailures.length}`);
  console.error(`   Threshold: ${ALERT_THRESHOLD}`);
  console.error(`   Recent reasons: ${failureReasons}`);
  console.error("═".repeat(60));

  // DEV-ONLY PLACEHOLDER: In production, send actual email
  // Example: await sendEmail({ to: "ops@company.com", subject: "Verification failures alert", ... })
  console.log("[DEV] Email alert would be sent to ops team");
}

/**
 * Log raw AI response to database for audit trail.
 */
export async function logRawAiResponse(params: {
  candidateId?: string;
  leadId?: string;
  responseType: "discovery" | "analysis" | "email_draft";
  prompt?: string;
  response: unknown;
  modelUsed?: string;
  tokensUsed?: number;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    // @ts-expect-error - Prisma client types will be updated after migration
    await prisma.rawAiResponse.create({
      data: {
        candidateId: params.candidateId ?? null,
        leadId: params.leadId ?? null,
        responseType: params.responseType,
        prompt: params.prompt ?? null,
        response: {
          data: params.response,
          success: params.success,
          error: params.errorMessage ?? null,
          logged_at: new Date().toISOString(),
        },
        modelUsed: params.modelUsed ?? process.env.AI_MODEL ?? "gpt-4o",
        tokensUsed: params.tokensUsed ?? null,
      },
    });
  } catch (error) {
    console.error("[Monitoring] Failed to log AI response:", error);
  }
}

/**
 * Log analysis attempt with full context for debugging.
 */
export async function logAnalysisAttempt(params: {
  candidateId: string;
  leadId?: string;
  success: boolean;
  response?: unknown;
  error?: string;
  verificationPassed?: boolean;
  confidence?: number;
}): Promise<void> {
  incrementAnalysisAttempts();

  if (!params.success) {
    incrementAnalysisFailures();
  }

  if (params.verificationPassed === false) {
    incrementVerificationFailures(
      params.error ?? `Candidate ${params.candidateId} failed verification`
    );
  }

  if (params.success && params.leadId) {
    incrementLeadsSaved();
  }

  await logRawAiResponse({
    candidateId: params.candidateId,
    leadId: params.leadId,
    responseType: "analysis",
    response: params.response,
    success: params.success,
    errorMessage: params.error,
  });
}
