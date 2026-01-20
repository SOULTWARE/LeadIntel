import { prisma } from "../db";
import { EmailVerificationStatus, type Prisma } from "@prisma/client";

const REQUEST_TIMEOUT_MS = 15_000;

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

function mapKickboxResultToStatus(result: KickboxVerifyResponse["result"]): EmailVerificationStatus {
  if (result === "deliverable") return EmailVerificationStatus.VALID;
  if (result === "undeliverable") return EmailVerificationStatus.INVALID;
  if (result === "risky") return EmailVerificationStatus.RISKY;
  return EmailVerificationStatus.UNKNOWN;
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
        status: existing.status,
        normalizedEmail: raw.email || input,
        raw,
      };
    }

    const url = new URL("https://api.kickbox.com/v2/verify");
    url.searchParams.set("email", input);
    url.searchParams.set("apikey", this.apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let json: KickboxVerifyResponse;
    try {
      const res = await fetch(url.toString(), { method: "GET", signal: controller.signal });
      json = (await res.json()) as KickboxVerifyResponse;

      if (res.status >= 500) {
        throw new Error(`Kickbox service unavailable (status ${res.status})`);
      }

      if (res.status >= 400) {
        throw new Error(json.message || `Kickbox client error (status ${res.status})`);
      }

      if (!json.success) {
        throw new Error(json.message || `Kickbox API error: ${res.status}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Kickbox API request timed out");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const status = mapKickboxResultToStatus(json.result);

    await prisma.emailVerification.create({
      data: {
        email: input,
        provider,
        status,
        rawResponseJson: json as unknown as Prisma.InputJsonValue,
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
