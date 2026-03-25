type RankedContactCandidate = {
  email: string;
  fullName?: string;
  roleTitle?: string;
  department?: string;
  seniority?: string;
  confidenceScore: number;
  isDecisionMaker: boolean;
  source: string;
  discoveryMethod: string;
};

const ROLE_ALIAS_MAP: Array<{
  aliases: string[];
  roleTitle: string;
  department?: string;
  seniority?: string;
  isDecisionMaker: boolean;
  bonus: number;
}> = [
  { aliases: ["ceo", "founder", "owner", "president"], roleTitle: "CEO", seniority: "Executive", isDecisionMaker: true, bonus: 35 },
  { aliases: ["cto", "tech", "engineering"], roleTitle: "CTO", department: "Engineering", seniority: "Executive", isDecisionMaker: true, bonus: 30 },
  { aliases: ["cmo", "marketing"], roleTitle: "CMO", department: "Marketing", seniority: "Executive", isDecisionMaker: true, bonus: 28 },
  { aliases: ["growth"], roleTitle: "Head of Growth", department: "Growth", seniority: "Head", isDecisionMaker: true, bonus: 24 },
  { aliases: ["sales"], roleTitle: "Head of Sales", department: "Sales", seniority: "Head", isDecisionMaker: true, bonus: 22 },
  { aliases: ["operations", "ops"], roleTitle: "Head of Operations", department: "Operations", seniority: "Head", isDecisionMaker: true, bonus: 20 },
  { aliases: ["info", "contact", "hello", "support"], roleTitle: "General Inbox", department: "Operations", seniority: "Unknown", isDecisionMaker: false, bonus: 6 },
];

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
]);

function titleCase(value: string): string {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeRoleHints(roleHints?: string[]): string[] {
  return (roleHints || []).map((hint) => hint.trim().toLowerCase()).filter(Boolean);
}

function inferContactFromLocalPart(localPart: string, roleHints: string[]) {
  const normalized = localPart.toLowerCase();

  for (const entry of ROLE_ALIAS_MAP) {
    if (entry.aliases.some((alias) => normalized.includes(alias))) {
      return {
        roleTitle: entry.roleTitle,
        department: entry.department,
        seniority: entry.seniority,
        isDecisionMaker: entry.isDecisionMaker,
        bonus: entry.bonus + roleHintBonus(entry.roleTitle, roleHints),
      };
    }
  }

  const maybeName = normalized
    .split(/[._-]+/)
    .filter((piece) => piece.length > 1 && /[a-z]/.test(piece));

  if (maybeName.length >= 2) {
    return {
      fullName: titleCase(maybeName.slice(0, 2).join(" ")),
      roleTitle: roleHints[0] ? titleCase(roleHints[0]) : undefined,
      isDecisionMaker: roleHints.length > 0,
      bonus: 18 + (roleHints[0] ? 12 : 0),
    };
  }

  return {
    roleTitle: roleHints[0] ? titleCase(roleHints[0]) : undefined,
    isDecisionMaker: roleHints.length > 0,
    bonus: roleHints[0] ? 14 : 8,
  };
}

function roleHintBonus(roleTitle: string, roleHints: string[]) {
  const normalizedRole = roleTitle.toLowerCase();
  return roleHints.some((hint) => normalizedRole.includes(hint) || hint.includes(normalizedRole)) ? 12 : 0;
}

export function rankDiscoveredContacts(input: {
  emails: string[];
  roleHints?: string[];
  source?: string;
  discoveryMethod?: string;
}): RankedContactCandidate[] {
  const roleHints = normalizeRoleHints(input.roleHints);
  const uniqueEmails = Array.from(new Set(input.emails.map((email) => email.trim().toLowerCase()).filter(Boolean)));

  const ranked = uniqueEmails.map((email) => {
    const [localPart = "", domain = ""] = email.split("@");
    const inference = inferContactFromLocalPart(localPart, roleHints);
    const isFreeInbox = FREE_EMAIL_DOMAINS.has(domain);
    const confidenceScore = Math.max(
      5,
      Math.min(100, 30 + inference.bonus - (isFreeInbox ? 8 : 0)),
    );

    return {
      email,
      fullName: inference.fullName,
      roleTitle: inference.roleTitle,
      department: inference.department,
      seniority: inference.seniority,
      confidenceScore,
      isDecisionMaker: inference.isDecisionMaker,
      source: input.source || "contact-discovery",
      discoveryMethod: input.discoveryMethod || "domain-search",
    } satisfies RankedContactCandidate;
  });

  return ranked.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function getPrimaryContactCandidate(input: {
  emails: string[];
  roleHints?: string[];
  source?: string;
  discoveryMethod?: string;
}): RankedContactCandidate | null {
  return rankDiscoveredContacts(input)[0] || null;
}
