import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { DAKTOP_DECISIONS, recomputeDaktopVerified } from "@/lib/verificationStatus";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can change a listing's verification status." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { locationVerified, ownershipVerified, surveyVerified, daktopDecision } = body;

    const data: {
      locationVerified?: boolean;
      ownershipVerified?: boolean;
      surveyVerified?: boolean;
      daktopDecision?: string;
    } = {};

    if (locationVerified !== undefined) {
      if (typeof locationVerified !== "boolean") {
        return NextResponse.json({ error: "'locationVerified' must be true or false." }, { status: 400 });
      }
      data.locationVerified = locationVerified;
    }

    if (ownershipVerified !== undefined) {
      if (typeof ownershipVerified !== "boolean") {
        return NextResponse.json({ error: "'ownershipVerified' must be true or false." }, { status: 400 });
      }
      data.ownershipVerified = ownershipVerified;
    }

    if (surveyVerified !== undefined) {
      if (typeof surveyVerified !== "boolean") {
        return NextResponse.json({ error: "'surveyVerified' must be true or false." }, { status: 400 });
      }
      data.surveyVerified = surveyVerified;
    }

    if (daktopDecision !== undefined) {
      if (!DAKTOP_DECISIONS.includes(daktopDecision)) {
        return NextResponse.json(
          { error: `'daktopDecision' must be one of: ${DAKTOP_DECISIONS.join(", ")}.` },
          { status: 400 }
        );
      }
      data.daktopDecision = daktopDecision;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one of locationVerified, ownershipVerified, surveyVerified, daktopDecision." },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data,
    });

    const daktopVerified = await recomputeDaktopVerified(params.id);

    await prisma.notification.create({
      data: {
        message: daktopVerified
          ? `Your listing "${property.title}" is now DAKTOP VERIFIED — everything has been checked.`
          : `Daktop updated the verification status on your listing "${property.title}".`,
        senderId: session.user.id,
        receiverId: property.sellerId,
        propertyId: property.id,
      },
    });

    return NextResponse.json({ ...updated, daktopVerified });
  } catch (err) {
    return handleApiError(err);
  }
}
