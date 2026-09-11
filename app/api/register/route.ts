import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { issueVerificationLink } from "@/lib/emailVerification";
import { isValidPhone, PHONE_FORMAT_HINT } from "@/lib/phoneValidation";
import { REFERRAL_REWARD_AMOUNT, deriveReferralCode } from "@/lib/referral";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, confirmPassword, role, ref } = await req.json();

    if (!name || !email || !password || !confirmPassword || !role) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
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

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, password: hashed, role },
    });

    // Give every new account its own referral code, derived from its own (already-unique) id —
    // done as a follow-up update since the id doesn't exist until after create. See
    // lib/referral.ts.
    const referralCode = deriveReferralCode(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } });

    // If they signed up via someone else's referral link, credit that person. A missing/invalid
    // code is not an error — it just means no referral is recorded, same as signing up with no
    // code at all.
    if (typeof ref === "string" && ref.trim()) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref.trim().toUpperCase() } });
      if (referrer && referrer.id !== user.id) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            rewardAmount: REFERRAL_REWARD_AMOUNT,
          },
        });
      }
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
