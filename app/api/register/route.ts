import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { validatePassword } from "@/lib/passwordPolicy";
import { issueVerificationLink } from "@/lib/emailVerification";
import { isValidPhone, PHONE_FORMAT_HINT } from "@/lib/phoneValidation";
import { generateReferralCode } from "@/lib/referral";
import { recordReferral } from "@/lib/referralServer";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, confirmPassword, role, ref } = await req.json();

    if (!name || !email || !password || !confirmPassword || !role) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // ADMIN is intentionally not a self-registerable role — see scripts/create-admin.js.
    // This check rejects it even if someone crafts a raw API request bypassing the UI.
    if (!["BUYER", "OWNER", "AGENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    // Owners and agents need a phone on file so buyers/admins can reach them and admins can
    // search for their listings by it. Optional for buyers, but if given, must be a complete,
    // valid number either way — not a partial/short one.
    if (["OWNER", "AGENT"].includes(role) && (!phone || !phone.trim())) {
      return NextResponse.json(
        { error: "Phone number is required for owner and agent accounts." },
        { status: 400 }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: PHONE_FORMAT_HINT }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    // referralCode is required + unique, but the id (which the old id-derived scheme needed)
    // doesn't exist until this same create() call returns — so instead generate a random code
    // up front and retry on the (rare) collision.
    let user;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        user = await prisma.user.create({
          data: { name, email, phone: phone || null, password: hashed, role, referralCode: generateReferralCode() },
        });
        break;
      } catch (err: any) {
        const isReferralCodeCollision = err?.code === "P2002" && err?.meta?.target?.includes?.("referralCode");
        if (!isReferralCodeCollision) throw err;
        // else: loop and try another random code
      }
    }
    if (!user) {
      return NextResponse.json(
        { error: "Could not create your account right now. Please try again." },
        { status: 500 }
      );
    }

    // If they signed up via someone else's referral link, record it (starts as "awaiting
    // purchase"). A missing/invalid code is not an error, and a failure here must never stop the
    // signup itself, so it's only logged.
    try {
      await recordReferral(user.id, ref);
    } catch (err) {
      console.error("Failed to record referral:", err);
    }

    const { verifyUrl, emailSent } = await issueVerificationLink(user.id, user.email);

    return NextResponse.json(
      { id: user.id, email: user.email, emailSent, verifyUrl: emailSent ? undefined : verifyUrl },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
