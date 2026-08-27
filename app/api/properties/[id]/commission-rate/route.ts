import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { notifyUser } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can change a listing's commission rate." }, { status: 403 });
    }

    const { commissionRate } = await req.json();

    // Rate is stored as a fraction (0.03 = 3%), same convention as the default. Cap at 100%
    // (1.0) as a sanity bound — this is a business rate, not a raw user input to trust blindly.
    if (typeof commissionRate !== "number" || Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      return NextResponse.json(
        { error: "commissionRate must be a number between 0 and 1 (e.g. 0.03 for 3%)." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { commissionRate },
    });

    // Rate changes don't touch commissionAgreedAt/commissionAgreementText — the seller/agent's
    // original signed agreement stays on record as-is, at whatever wording/date they saw it.
    await notifyUser({
      senderId: session.user.id,
      receiverId: property.sellerId,
      message: `The commission rate on your listing "${property.title}" was changed to ${(
        commissionRate * 100
      ).toFixed(commissionRate * 100 % 1 === 0 ? 0 : 2)}%.`,
      propertyId: property.id,
      emailSubject: `Commission rate updated on your listing "${property.title}"`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
