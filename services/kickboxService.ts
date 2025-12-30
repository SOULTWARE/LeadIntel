import { prisma } from "../db";

export interface KickboxVerifyResponse {
  result: "deliverable" | "undeliverable" | "risky" | "unknown";
  reason: string | null;
  role: boolean;
  free: boolean;
  disposable: boolean;
  accept_all: boolean;
  did_you_mean: string | null;
  sendex: number;
  email: string;
  user: string;
  domain: string;
  success: boolean;
  message: string | null;
}

export type EmailVerificationStatus =
  | "UNVERIFIED"
  | "VALID"
  | "INVALID"
  | "RISKY"
  | "UNKNOWN";

function mapKickboxResultToStatus(result: KickboxVerifyResponse["result"]): EmailVerificationStatus {
  if (result === "deliverable") return "VALID";
  if (result === "undeliverable") return "INVALID";
  if (result === "risky") return "RISKY";
  return "UNKNOWN";
}

export class KickboxService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.KICKBOX_API_KEY || "";
  }

  async verifyEmail(email: string): Promise<{
    status: EmailVerificationStatus;
    normalizedEmail: string;
    raw: KickboxVerifyResponse;
  }> {
    if (!this.apiKey) {
      throw new Error("KICKBOX_API_KEY is missing in environment variables");
    }

    const input = email.trim().toLowerCase();
    const provider = "kickbox";

    const existing = await prisma.emailVerification.findUnique({
      where: {
        email_provider: {
          email: input,
          provider,
        },
      },
    });

    if (existing) {
      const raw = (existing.rawResponseJson || {}) as unknown as KickboxVerifyResponse;
      return {
        status: existing.status as EmailVerificationStatus,
        normalizedEmail: raw.email || input,
        raw,
      };
    }

    const url = new URL("https://api.kickbox.com/v2/verify");
    url.searchParams.set("email", input);
    url.searchParams.set("apikey", this.apiKey);

    const res = await fetch(url.toString(), { method: "GET" });
    const json = (await res.json()) as KickboxVerifyResponse;

    if (!res.ok || !json.success) {
      throw new Error(json.message || `Kickbox API error: ${res.status}`);
    }

    const status = mapKickboxResultToStatus(json.result);

    await prisma.emailVerification.create({
      data: {
        email: input,
        provider,
        status: status as any,
        rawResponseJson: json as any,
      },
    });

    return {
      status,
      normalizedEmail: json.email,
      raw: json,
    };
  }
}

export const kickboxService = new KickboxService();
