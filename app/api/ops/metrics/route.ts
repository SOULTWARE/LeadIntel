/**
 * Operational Metrics Endpoint
 *
 * ⚠️ MVP WARNING: This endpoint has NO AUTHENTICATION.
 * In production, add proper auth (API key, JWT, etc.) before deploying.
 *
 * Returns operational counters for monitoring the lead generation pipeline.
 */

import { NextResponse } from "next/server";
import { getMetrics } from "@/services/monitoring";

export async function GET() {
  // MVP WARNING: No auth check - add before production!
  console.warn(
    "[SECURITY WARNING] /api/ops/metrics endpoint is unauthenticated. Add auth before production deployment."
  );

  const metrics = getMetrics();

  return NextResponse.json({
    warning: "This endpoint is unauthenticated. Do not expose in production without auth.",
    timestamp: new Date().toISOString(),
    metrics: {
      discovery: {
        requests: metrics.discoveryRequests,
      },
      fetch: {
        errors: metrics.fetchErrors,
      },
      verification: {
        failures: metrics.verificationFailures,
        recentFailuresInWindow: metrics.recentVerificationFailures,
      },
      analysis: {
        attempts: metrics.analysisAttempts,
        failures: metrics.analysisFailures,
        successRate:
          metrics.analysisAttempts > 0
            ? (
                ((metrics.analysisAttempts - metrics.analysisFailures) /
                  metrics.analysisAttempts) *
                100
              ).toFixed(1) + "%"
            : "N/A",
      },
      leads: {
        saved: metrics.leadsSaved,
      },
      system: {
        uptimeSeconds: metrics.uptimeSeconds,
        uptimeFormatted: formatUptime(metrics.uptimeSeconds),
      },
    },
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}
