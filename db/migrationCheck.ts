/**
 * Migration Check Utility
 *
 * Ensures database migrations are applied before running services.
 * Call ensureMigrationsApplied() at startup to verify DB state.
 */

import { prisma } from "./index";

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";
  }
}

/**
 * Check if the database has the required tables.
 * Throws MigrationError if migrations are not applied.
 */
export async function ensureMigrationsApplied(): Promise<void> {
  try {
    const requiredTables = [
      "candidates",
      "leads",
      "snapshots",
      "verified_resources",
      "issues",
    ];

    for (const table of requiredTables) {
      const exists = await checkTableExists(table);
      if (!exists) {
        throw new MigrationError(
          `Required table "${table}" does not exist. Run: npx prisma migrate dev`
        );
      }
    }

    const hasSnapshotIdColumn = await checkColumnExists("issues", "snapshot_id");
    if (!hasSnapshotIdColumn) {
      throw new MigrationError(
        `Column "snapshot_id" missing from issues table. Run: npx prisma migrate dev`
      );
    }

    const hasCandidateIdColumn = await checkColumnExists("leads", "candidate_id");
    if (!hasCandidateIdColumn) {
      throw new MigrationError(
        `Column "candidate_id" missing from leads table. Run: npx prisma migrate dev`
      );
    }

  } catch (error) {
    if (error instanceof MigrationError) {
      throw error;
    }
    throw new MigrationError(
      `Database connection failed. Ensure DATABASE_URL is set and migrations are applied. Error: ${error}`
    );
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } catch {
    return false;
  }
}

async function checkColumnExists(
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } catch {
    return false;
  }
}

/**
 * Wrapper to run migration check and exit on failure.
 * Use this in service entry points.
 */
export async function requireMigrations(): Promise<void> {
  try {
    await ensureMigrationsApplied();
    console.log("✓ Database migrations verified");
  } catch (error) {
    if (error instanceof MigrationError) {
      console.error(`\n❌ Migration Error: ${error.message}\n`);
      console.error("To fix this, run:");
      console.error("  npx prisma migrate dev\n");
      process.exit(1);
    }
    throw error;
  }
}
