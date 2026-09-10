import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole, isSuperAdminRole } from "@/lib/roles";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only admins can delete users." }, { status: 403 });
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Same rule as suspend: only a super admin can remove a regular admin, and super admin
    // accounts can't be removed through this endpoint at all.
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super admin accounts can't be deleted from here." }, { status: 400 });
    }

    if (targetUser.role === "ADMIN" && !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only a super admin can delete an admin account." }, { status: 403 });
    }

    // Cascades to their listings, enquiries, saved properties, and notifications
    // (see the onDelete rules in prisma/schema.prisma).
    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
