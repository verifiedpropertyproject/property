import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { notifyUser } from "@/lib/notify";
import { DAKTOP_DECISIONS, getDaktopDecisionLabel, recomputeDaktopVerified } from "@/lib/verificationStatus";

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

    // Build a line per field that actually changed, so the seller/agent knows exactly what
    // was updated rather than a generic "something changed" message.
    const changeLines: string[] = [];
    if (locationVerified !== undefined) {
      changeLines.push(`Location verified: ${locationVerified ? "Yes" : "No"}`);
    }
    if (ownershipVerified !== undefined) {
      changeLines.push(`Ownership verified: ${ownershipVerified ? "Yes" : "No"}`);
    }
    if (surveyVerified !== undefined) {
      changeLines.push(`Survey verified: ${surveyVerified ? "Yes" : "No"}`);
    }
    if (daktopDecision !== undefined) {
      changeLines.push(`Daktop decision: ${getDaktopDecisionLabel(daktopDecision)}`);
    }

    const updateMessage = `Daktop updated the verification status on your listing "${property.title}": ${changeLines.join(
      "; "
    )}.`;

    await notifyUser({
      senderId: session.user.id,
      receiverId: property.sellerId,
      message: daktopVerified
        ? `Your listing "${property.title}" is now DAKTOP VERIFIED — everything has been checked.`
        : updateMessage,
      propertyId: property.id,
      emailSubject: `Verification update on your listing "${property.title}"`,
    });

    return NextResponse.json({ ...updated, daktopVerified });
  } catch (err) {
    return handleApiError(err);
  }
}
