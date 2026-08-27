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
      return NextResponse.json(
        { error: "Only admins can control whether a listing's contact is shown publicly." },
        { status: 403 }
      );
    }

    const { showContact } = await req.json();
    if (typeof showContact !== "boolean") {
      return NextResponse.json({ error: "'showContact' must be true or false." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { showContact },
    });

    await notifyUser({
      senderId: session.user.id,
      receiverId: property.sellerId,
      message: showContact
        ? `Your contact details are now shown publicly on "${property.title}".`
        : `Your contact details are no longer shown publicly on "${property.title}".`,
      propertyId: property.id,
      emailSubject: `Update on your listing "${property.title}"`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
