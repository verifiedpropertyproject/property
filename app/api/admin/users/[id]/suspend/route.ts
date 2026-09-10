import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole, isSuperAdminRole } from "@/lib/roles";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only admins can suspend users." }, { status: 403 });
    }

    const { suspended } = await req.json();
    if (typeof suspended !== "boolean") {
      return NextResponse.json({ error: "'suspended' must be true or false." }, { status: 400 });
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: "You can't suspend your own account." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Only a super admin can suspend a regular admin. Nobody — not even another super
    // admin — can suspend a super admin account through this endpoint.
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super admin accounts can't be suspended from here." }, { status: 400 });
    }

    if (targetUser.role === "ADMIN" && !isSuperAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only a super admin can suspend an admin account." }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { suspended },
    });

    return NextResponse.json({ id: updated.id, suspended: updated.suspended });
  } catch (err) {
    return handleApiError(err);
  }
}
