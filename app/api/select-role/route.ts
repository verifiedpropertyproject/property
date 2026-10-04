import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isValidPhone, PHONE_FORMAT_HINT } from "@/lib/phoneValidation";
import { recordReferral } from "@/lib/referralServer";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { role, phone, ref } = await req.json();
    // ADMIN is intentionally not self-selectable — see scripts/create-admin.js.
    if (!["BUYER", "OWNER", "AGENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (["OWNER", "AGENT"].includes(role) && (!phone || !phone.trim())) {
      return NextResponse.json(
        { error: "Phone number is required for owner and agent accounts." },
        { status: 400 }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: PHONE_FORMAT_HINT }, { status: 400 });
    }

    // A Google account has no role until this step, so "role is still null" is how we know this
    // is a brand-new signup (and not a returning user) — the only time a referral may be credited.
    const before = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    await prisma.user.update({
      where: { email: session.user.email },
      data: { role, ...(phone ? { phone: phone.trim() } : {}) },
    });

    if (before && !before.role && ref) {
      try {
        await recordReferral(before.id, ref);
      } catch (err) {
        console.error("Failed to record referral:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
