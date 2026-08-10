import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyers can save properties." }, { status: 403 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const existing = await prisma.savedProperty.findUnique({
      where: { buyerId_propertyId: { buyerId: session.user.id, propertyId: property.id } },
    });

    if (existing) {
      await prisma.savedProperty.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedProperty.create({
      data: { buyerId: session.user.id, propertyId: property.id },
    });

    return NextResponse.json({ saved: true });
  } catch (err) {
    return handleApiError(err);
  }
}
