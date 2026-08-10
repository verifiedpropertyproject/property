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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can change a listing's verified tag." }, { status: 403 });
    }

    const { verified } = await req.json();

    if (typeof verified !== "boolean") {
      return NextResponse.json({ error: "'verified' must be true or false." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { verified },
    });

    await prisma.notification.create({
      data: {
        message: verified
          ? `Your listing "${property.title}" was marked Verified.`
          : `Your listing "${property.title}" was marked Not Verified.`,
        senderId: session.user.id,
        receiverId: property.sellerId,
        propertyId: property.id,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
