import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { readCommissionCertificate } from "@/lib/commissionCertificateStorage";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const property = await prisma.property.findUnique({ where: { id: params.id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const isOwner = property.sellerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "You don't have access to this certificate." }, { status: 403 });
    }

    const agreement = await prisma.commissionAgreement.findFirst({
      where: { propertyId: property.id },
      orderBy: { signedAt: "desc" },
    });

    if (!agreement || !agreement.certificateUrl) {
      return NextResponse.json({ error: "No commission agreement certificate is on file for this listing." }, {
        status: 404,
      });
    }

    const pdfBuffer = await readCommissionCertificate(agreement.certificateUrl, property.id, agreement.id);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="commission-agreement-${property.id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
