import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { recomputeDaktopVerified } from "@/lib/verificationStatus";
import { notifyUser } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can mark a document as received." }, { status: 403 });
    }

    const { verified } = await req.json();
    if (typeof verified !== "boolean") {
      return NextResponse.json({ error: "'verified' must be true or false." }, { status: 400 });
    }

    const doc = await prisma.propertyDocument.findUnique({
      where: { id: params.id },
      include: { property: { select: { id: true, title: true, sellerId: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const updated = await prisma.propertyDocument.update({
      where: { id: doc.id },
      data: { verified },
    });

    const daktopVerified = await recomputeDaktopVerified(doc.property.id);

    await notifyUser({
      senderId: session.user.id,
      receiverId: doc.property.sellerId,
      message: daktopVerified
        ? `Your listing "${doc.property.title}" is now DAKTOP VERIFIED — everything has been checked.`
        : verified
        ? `Daktop marked "${doc.fileName}" as received on your listing "${doc.property.title}".`
        : `Daktop marked "${doc.fileName}" as pending review on your listing "${doc.property.title}".`,
      propertyId: doc.property.id,
      emailSubject: `Document update on your listing "${doc.property.title}"`,
    });

    return NextResponse.json({ ...updated, daktopVerified });
  } catch (err) {
    return handleApiError(err);
  }
}
