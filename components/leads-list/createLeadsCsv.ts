import type { Lead } from '@prisma/client';

export function createLeadsCsv(leads: Lead[]): string {
  const headers = [
    "Name",
    "Type",
    "Address",
    "Phone",
    "Website",
    "Recommendation",
    "Compatibility Score",
    "Reasoning",
    "Email",
  ];

  return [
    headers.join(","),
    ...leads.map((l) =>
      [
        `"${l.name}"`,
        `"${l.type || ''}"`,
        `"${l.address || ''}"`,
        `"${l.phone || ''}"`,
        `"${l.website || ''}"`,
        `"${l.recommendation || ''}"`,
        `${l.compatibilityScore || 0}%`,
        `"${l.reasoning?.replace(/"/g, '""') || ''}"`,
        `"${l.email || ''}"`,
      ].join(",")
    ),
  ].join("\n");
}
