import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";

// Lets the register page tell someone straight away if their referral code isn't recognised
// (instead of silently recording nothing). Only returns yes/no — never who owns the code.
export async function GET(req: Request) {
  try {
    const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() || "";
    if (!code) return NextResponse.json({ valid: false });

    const owner = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    return NextResponse.json({ valid: !!owner });
  } catch (err) {
    return handleApiError(err);
  }
}
