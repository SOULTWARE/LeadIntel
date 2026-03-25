import type { LeadWithRelations } from "@/lib/leads/types";

export function collectExportableBatchIds(leads: LeadWithRelations[]): string[] {
  return Array.from(
    new Set(
      leads
        .map((lead) => lead.batch?.id || lead.batchId || null)
        .filter((batchId): batchId is string => typeof batchId === "string"),
    ),
  );
}

export async function markBatchesExported(batchIds: string[]): Promise<void> {
  if (batchIds.length === 0) return;

  await fetch("/api/batches/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batchIds }),
  });
}
