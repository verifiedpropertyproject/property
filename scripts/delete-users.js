/**
 * Deletes user accounts from the database. DESTRUCTIVE and IRREVERSIBLE.
 *
 * Because of the `onDelete: Cascade` relations in prisma/schema.prisma, deleting a user also
 * deletes everything that belongs to them: their properties (and those properties' documents,
 * saved-property entries, enquiries and viewing requests), messages, referrals, etc.
 * Uploaded image/PDF files in Vercel Blob are NOT removed by this script.
 *
 * Usage (nothing is deleted unless --yes is passed — without it you just get a preview):
 *   node scripts/delete-users.js                 preview: delete everyone EXCEPT admins/super admins
 *   node scripts/delete-users.js --yes           actually do that
 *   node scripts/delete-users.js --all           preview: delete EVERY user, admins included
 *   node scripts/delete-users.js --all --yes     actually do that (you'll then have to re-run
 *                                                create-admin to be able to log in as admin)
 *
 * Run against production by passing the production URLs, e.g.
 *   DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npm run delete-users -- --yes
 */

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const confirmed = args.includes("--yes");

  const where = all ? {} : { NOT: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } };

  const [toDelete, total] = await Promise.all([prisma.user.count({ where }), prisma.user.count()]);
  const dbHost = (process.env.DATABASE_URL || "").replace(/^.*@/, "").split("/")[0] || "(unknown)";

  console.log(`Database: ${dbHost}`);
  console.log(`Users in database: ${total}`);
  console.log(
    all
      ? `Mode: ALL users (admins included) -> ${toDelete} will be deleted.`
      : `Mode: everyone except ADMIN / SUPER_ADMIN -> ${toDelete} will be deleted, ${total - toDelete} kept.`
  );

  if (toDelete === 0) {
    console.log("Nothing to delete.");
    return;
  }

  if (!confirmed) {
    console.log("\nPreview only — nothing was deleted. Re-run with --yes to delete for real.");
    return;
  }

  const result = await prisma.user.deleteMany({ where });
  console.log(`\nDeleted ${result.count} user(s) and all of their related data.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err.message || err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
