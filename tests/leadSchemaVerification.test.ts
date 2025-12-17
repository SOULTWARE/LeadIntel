/**
 * Lead Schema Verification Tests
 *
 * Tests that the evidence verification utilities:
 * 1. Accept valid evidence that exists in snapshots
 * 2. Reject fabricated evidence not in snapshots
 * 3. Reject references to non-existent snapshots
 * 4. Validate verified emails exist in source snapshot
 * 5. Validate phone numbers as E.164
 */

import { describe, it, expect } from "vitest";
import {
  verifyEvidenceAgainstSnapshots,
  validateE164Phone,
  type Snapshot,
} from "../lib/validators/leadSchema";

const mockSnapshots: Snapshot[] = [
  {
    id: "snapshot-1",
    url: "https://testcorp.com/",
    textExtract:
      "Welcome to Test Corp. We specialize in enterprise software solutions. Contact our CEO John Smith for partnerships. We are currently hiring and expanding our team. Email: john@testcorp.com",
    sourceType: "homepage",
  },
  {
    id: "snapshot-2",
    url: "https://testcorp.com/about",
    textExtract:
      "About Test Corp. Founded in 2020, we have grown to 50 employees. Our budget for new tools is $100k annually. Contact: info@testcorp.com Phone: +14155551234",
    sourceType: "about",
  },
  {
    id: "snapshot-3",
    url: "https://linkedin.com/company/testcorp",
    textExtract:
      "Test Corp on LinkedIn. Enterprise software company. CEO: John Smith. CTO: Jane Doe. jane@testcorp.com",
    sourceType: "linkedin",
  },
];

describe("verifyEvidenceAgainstSnapshots", () => {
  describe("issue evidence verification", () => {
    it("accepts valid evidence that exists verbatim in snapshot", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Growing team",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "currently hiring and expanding",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects fabricated evidence not in snapshot", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Fake issue",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "This text does not exist anywhere",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Fake issue");
      expect(result.errors[0]).toContain("not found verbatim");
    });

    it("rejects references to non-existent snapshots", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Issue from fake page",
            evidence: {
              source_url: "https://testcorp.com/nonexistent",
              excerpt: "some content",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("not found");
    });

    it("accepts evidence using snapshot_id instead of source_url", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Budget info",
            evidence: {
              snapshot_id: "snapshot-2",
              excerpt: "budget for new tools is $100k",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });

    it("reports missing evidence object", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Issue without evidence",
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("Missing evidence object");
    });

    it("reports missing excerpt", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Issue without excerpt",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("Missing evidence excerpt");
    });

    it("handles source_evidence format (alternative schema)", () => {
      const leadJson = {
        issues: [
          {
            title: "Issue with source_evidence",
            source_evidence: {
              source_url: "https://testcorp.com/",
              snippet: "enterprise software solutions",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });
  });

  describe("decision maker verification", () => {
    it("accepts valid decision maker evidence", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "CEO John Smith",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });

    it("rejects decision maker with invalid source_url", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            source_url: "https://testcorp.com/nonexistent",
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("John Smith");
      expect(result.errors[0]).toContain("not found in snapshots");
    });

    it("rejects decision maker evidence not in snapshot", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "Fake",
            last_name: "Person",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "Fake Person is the founder",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("Fake Person");
    });
  });

  describe("contact verification", () => {
    it("accepts verified email found in source snapshot", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            contacts: [
              {
                type: "email",
                value: "john@testcorp.com",
                is_verified: true,
                source_url: "https://testcorp.com/",
              },
            ],
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });

    it("rejects verified email not found in source snapshot", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            contacts: [
              {
                type: "email",
                value: "fake@testcorp.com",
                is_verified: true,
                source_url: "https://testcorp.com/",
              },
            ],
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("Verified email");
      expect(result.errors[0]).toContain("not found in source snapshot");
    });

    it("rejects verified contact without source_url", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            contacts: [
              {
                type: "email",
                value: "john@testcorp.com",
                is_verified: true,
              },
            ],
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("Verified contact must have source_url");
    });

    it("rejects contact with invalid source_url", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            contacts: [
              {
                type: "email",
                value: "john@testcorp.com",
                is_verified: false,
                source_url: "https://testcorp.com/nonexistent",
              },
            ],
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("source_url");
      expect(result.errors[0]).toContain("not found in snapshots");
    });

    it("rejects invalid phone number format", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            contacts: [
              {
                type: "phone",
                value: "not-a-phone",
              },
            ],
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("not valid E.164 format");
    });

    it("accepts valid E.164 phone number", () => {
      const leadJson = {
        top_issues: [],
        decision_makers: [
          {
            first_name: "John",
            last_name: "Smith",
            contacts: [
              {
                type: "phone",
                value: "+14155551234",
              },
            ],
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });
  });

  describe("multiple errors", () => {
    it("reports all verification errors", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Fabricated issue 1",
            evidence: {
              source_url: "https://testcorp.com/",
              excerpt: "fake content 1",
            },
          },
          {
            title: "Fabricated issue 2",
            evidence: {
              source_url: "https://testcorp.com/fake",
              excerpt: "fake content 2",
            },
          },
        ],
        decision_makers: [
          {
            first_name: "Fake",
            last_name: "Person",
            source_url: "https://testcorp.com/nonexistent",
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("text normalization", () => {
    it("handles whitespace differences", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Whitespace test",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "currently   hiring  and   expanding",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });

    it("handles case differences", () => {
      const leadJson = {
        top_issues: [
          {
            title: "Case test",
            evidence: {
              source_url: "https://testcorp.com/",
              snapshot_id: "snapshot-1",
              excerpt: "CEO JOHN SMITH",
            },
          },
        ],
      };

      const result = verifyEvidenceAgainstSnapshots(leadJson, mockSnapshots);

      expect(result.ok).toBe(true);
    });
  });
});

describe("validateE164Phone", () => {
  it("validates correct E.164 format", () => {
    expect(validateE164Phone("+14155551234")).toBe("+14155551234");
    expect(validateE164Phone("+442071234567")).toBe("+442071234567");
    expect(validateE164Phone("+8613912345678")).toBe("+8613912345678");
  });

  it("converts 10-digit US numbers", () => {
    expect(validateE164Phone("4155551234")).toBe("+14155551234");
  });

  it("converts 11-digit US numbers with leading 1", () => {
    expect(validateE164Phone("14155551234")).toBe("+14155551234");
  });

  it("handles formatted phone numbers", () => {
    expect(validateE164Phone("+1 (415) 555-1234")).toBe("+14155551234");
    expect(validateE164Phone("+1-415-555-1234")).toBe("+14155551234");
    expect(validateE164Phone("+1.415.555.1234")).toBe("+14155551234");
  });

  it("returns null for invalid formats", () => {
    expect(validateE164Phone("123")).toBe(null);
    expect(validateE164Phone("not-a-phone")).toBe(null);
    expect(validateE164Phone("")).toBe(null);
    expect(validateE164Phone(null)).toBe(null);
    expect(validateE164Phone(undefined)).toBe(null);
  });

  it("rejects numbers that are too short", () => {
    expect(validateE164Phone("+123456")).toBe(null);
  });

  it("rejects numbers that are too long", () => {
    expect(validateE164Phone("+12345678901234567890")).toBe(null);
  });
});
