import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";
import { RESALE_CATEGORIES } from "@/lib/resaleCategory";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only admins can set a listing's resale category." }, { status: 403 });
    }

    const { resaleCategory } = await req.json();

    // Empty string / null clears the category — it's optional even on an admin-listed
    // property (not every admin listing is a resale one).
    if (resaleCategory !== null && resaleCategory !== "" && !(RESALE_CATEGORIES as readonly string[]).includes(resaleCategory)) {
      return NextResponse.json({ error: "Invalid resale category." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: { seller: { select: { role: true } } },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    // The resale category only ever applies to a property listed directly by an admin — never
    // to an Owner/Agent's own listing.
    if (!isAdminRole(property.seller.role)) {
      return NextResponse.json(
        { error: "Resale category can only be set on a listing created by an admin." },
        { status: 400 }
      );
    }

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { resaleCategory: resaleCategory || null },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
