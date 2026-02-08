import { Polar } from "@polar-sh/sdk";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

export const polar = new Polar({
  accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
});
