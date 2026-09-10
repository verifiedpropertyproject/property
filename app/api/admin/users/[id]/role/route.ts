import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only admins can change a user's role." }, { status: 403 });
    }

    const { role } = await req.json();
    if (!["BUYER", "OWNER", "AGENT"].includes(role)) {
      return NextResponse.json({ error: "Role must be BUYER, OWNER, or AGENT." }, { status: 400 });
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: "You can't change your own role here." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Promoting/demoting into or out of ADMIN or SUPER_ADMIN isn't done through this endpoint
    // at all (see scripts/create-admin.js) — this only ever moves someone between the three
    // ordinary roles, so an existing admin account is never a valid target here.
    if (isAdminRole(targetUser.role)) {
      return NextResponse.json({ error: "Admin accounts can't be changed from here." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });

    return NextResponse.json({ id: updated.id, role: updated.role });
  } catch (err) {
    return handleApiError(err);
  }
}
