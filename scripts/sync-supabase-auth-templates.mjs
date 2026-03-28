import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const templatesDir = path.join(repoRoot, "supabase", "auth-email-templates");

const templateDefinitions = [
  {
    key: "confirmation",
    subject: "Confirm your LeadIntel Pro account",
    filename: "confirmation.html",
  },
  {
    key: "magic_link",
    subject: "Your LeadIntel Pro magic link",
    filename: "magic-link.html",
  },
  {
    key: "recovery",
    subject: "Reset your LeadIntel Pro password",
    filename: "recovery.html",
  },
  {
    key: "invite",
    subject: "You are invited to LeadIntel Pro",
    filename: "invite.html",
  },
  {
    key: "email_change",
    subject: "Confirm your new LeadIntel Pro email",
    filename: "email-change.html",
  },
];

async function buildPayload() {
  const payload = {};

  for (const template of templateDefinitions) {
    const filePath = path.join(templatesDir, template.filename);
    const content = await readFile(filePath, "utf8");

    payload[`mailer_subjects_${template.key}`] = template.subject;
    payload[`mailer_templates_${template.key}_content`] = content;
  }

  return payload;
}

function printSummary(payload) {
  console.log("Supabase auth email templates loaded:\n");

  for (const template of templateDefinitions) {
    const subjectKey = `mailer_subjects_${template.key}`;
    const contentKey = `mailer_templates_${template.key}_content`;
    const subject = payload[subjectKey];
    const content = payload[contentKey];

    console.log(`- ${template.key}`);
    console.log(`  subject: ${subject}`);
    console.log(`  file: ${template.filename}`);
    console.log(`  bytes: ${Buffer.byteLength(content, "utf8")}`);
  }
}

async function applyTemplates(payload) {
  const accessToken =
    process.env.SUPABASE_MANAGEMENT_ACCESS_TOKEN ||
    process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!accessToken) {
    throw new Error(
      "Missing SUPABASE_MANAGEMENT_ACCESS_TOKEN or SUPABASE_ACCESS_TOKEN.",
    );
  }

  if (!projectRef) {
    throw new Error("Missing SUPABASE_PROJECT_REF.");
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase Management API request failed (${response.status}): ${body}`,
    );
  }

  console.log(
    `Updated ${templateDefinitions.length} auth email templates for project ${projectRef}.`,
  );
}

async function main() {
  const shouldApply = process.argv.includes("--apply");
  const shouldPrintJson = process.argv.includes("--json");
  const payload = await buildPayload();

  if (shouldPrintJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  printSummary(payload);

  if (!shouldApply) {
    console.log(
      "\nDry run only. Pass --apply to push these templates to the hosted Supabase project.",
    );
    return;
  }

  await applyTemplates(payload);
}

main().catch((error) => {
  console.error("[supabase auth templates]", error);
  process.exitCode = 1;
});
