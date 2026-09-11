import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";
import { PAYOUT_STATUSES } from "@/lib/referral";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only admins can update a referral's payout status." }, { status: 403 });
    }

    const { payoutStatus } = await req.json();
    if (!(PAYOUT_STATUSES as readonly string[]).includes(payoutStatus)) {
      return NextResponse.json({ error: "Invalid payout status." }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({ where: { id: params.id } });
    if (!referral) {
      return NextResponse.json({ error: "Referral not found." }, { status: 404 });
    }

    const updated = await prisma.referral.update({
      where: { id: params.id },
      data: {
        payoutStatus,
        paidAt: payoutStatus === "PAID" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
