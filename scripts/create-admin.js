/**
 * Creates or promotes an admin account. This is the ONLY way to get an ADMIN
 * role in this app — it's intentionally not available through the public
 * registration form or the Google sign-in role picker, since letting anyone
 * self-register as admin would be a serious security hole.
 *
 * Only run this yourself, locally or on the server, with access to the
 * database (.env). Never expose this as a web-accessible endpoint.
 *
 * Usage:
 *   Promote an existing user (they already registered as Buyer/Seller):
 *     node scripts/create-admin.js someone@example.com
 *
 *   Create a brand new admin account from scratch:
 *     node scripts/create-admin.js someone@example.com "Full Name" "a-strong-password"
 */

// Minimal .env loader so this works as a plain `node` script without adding
// a dotenv dependency just for this. Prisma's own CLI commands (migrate,
// studio) load .env automatically; a standalone script using @prisma/client
// directly does not, so we do it ourselves here.
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
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, name, password] = process.argv;

  if (!email) {
    console.error("Usage:");
    console.error("  node scripts/create-admin.js <email>                       (promote existing user)");
    console.error("  node scripts/create-admin.js <email> <name> <password>     (create new admin)");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`${email} is already an admin.`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log(`Promoted existing user ${email} (was ${existing.role || "no role"}) to ADMIN.`);
    return;
  }

  if (!name || !password) {
    console.error(`No account exists yet for ${email}.`);
    console.error("To create a new one, also provide a name and password:");
    console.error('  node scripts/create-admin.js someone@example.com "Full Name" "a-strong-password"');
    process.exitCode = 1;
    return;
  }

  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exitCode = 1;
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "ADMIN",
      // Created directly by an operator, so treat it as already verified —
      // no need to route this through the normal email verification flow.
      emailVerified: new Date(),
    },
  });

  console.log(`Created new admin account for ${user.email}. They can log in immediately.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
