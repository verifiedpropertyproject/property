/**
 * Creates or promotes an admin (or super admin) account. This is the ONLY way
 * to get an ADMIN or SUPER_ADMIN role in this app — it's intentionally not
 * available through the public registration form or the Google sign-in role
 * picker, since letting anyone self-register as admin would be a serious
 * security hole.
 *
 * A SUPER_ADMIN has every ADMIN capability, plus it's the only role that can
 * suspend or delete another ADMIN account from the dashboard's user list
 * (regular admins can't act on other admins at all).
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
 *
 *   Either form also accepts a trailing --super flag to grant SUPER_ADMIN
 *   instead of ADMIN:
 *     node scripts/create-admin.js someone@example.com --super
 *     node scripts/create-admin.js someone@example.com "Full Name" "a-strong-password" --super
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

// Mirrors lib/referral.ts's generateReferralCode — duplicated here (rather than imported) since
// this is a plain Node script, not run through the TypeScript/Next.js build.
const REFERRAL_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function generateReferralCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += REFERRAL_CODE_CHARS[Math.floor(Math.random() * REFERRAL_CODE_CHARS.length)];
  }
  return code;
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const superFlagIndex = rawArgs.indexOf("--super");
  const isSuper = superFlagIndex !== -1;
  if (isSuper) rawArgs.splice(superFlagIndex, 1);

  const [email, name, password] = rawArgs;
  const targetRole = isSuper ? "SUPER_ADMIN" : "ADMIN";

  if (!email) {
    console.error("Usage:");
    console.error("  node scripts/create-admin.js <email> [--super]                       (promote existing user)");
    console.error("  node scripts/create-admin.js <email> <name> <password> [--super]     (create new admin)");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === targetRole) {
      console.log(`${email} is already ${targetRole === "SUPER_ADMIN" ? "a super admin" : "an admin"}.`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { role: targetRole },
    });

    console.log(`Promoted existing user ${email} (was ${existing.role || "no role"}) to ${targetRole}.`);
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

  // referralCode is required + unique; generate one and retry on the rare collision.
  let user;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashed,
          role: targetRole,
          // Created directly by an operator, so treat it as already verified —
          // no need to route this through the normal email verification flow.
          emailVerified: new Date(),
          referralCode: generateReferralCode(),
        },
      });
      break;
    } catch (err) {
      const isReferralCodeCollision = err?.code === "P2002" && err?.meta?.target?.includes?.("referralCode");
      if (!isReferralCodeCollision) throw err;
      // else: loop and try another random code
    }
  }
  if (!user) {
    console.error("Could not create the account after several attempts. Please try again.");
    process.exitCode = 1;
    return;
  }

  console.log(`Created new ${targetRole === "SUPER_ADMIN" ? "super admin" : "admin"} account for ${user.email}. They can log in immediately.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
