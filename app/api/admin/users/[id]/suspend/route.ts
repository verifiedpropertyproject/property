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

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Admin accounts can't be suspended from here." }, { status: 400 });
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
