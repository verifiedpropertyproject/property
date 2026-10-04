import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiError";
import { isAdminRole } from "@/lib/roles";
import { notifyUser } from "@/lib/notify";
import { getReferralStage } from "@/lib/referral";

// Admin-only. Moves a referral through its lifecycle (see lib/referral.ts):
//   CONFIRM_PURCHASE  AWAITING_PURCHASE  -> PURCHASE_CONFIRMED  (needs a short note)
//   UNDO_CONFIRMATION PURCHASE_CONFIRMED -> AWAITING_PURCHASE
//   MARK_PAID         PURCHASE_CONFIRMED -> PAID                (optional payment reference)
//   UNDO_PAID         PAID               -> PURCHASE_CONFIRMED
// Money never moves through the app: buyers pay outside the website and the admin pays the
// referrer manually (e.g. M-Pesa). This only records what the admin has checked and done.
const ACTIONS = ["CONFIRM_PURCHASE", "UNDO_CONFIRMATION", "MARK_PAID", "UNDO_PAID"] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Only admins can update a referral." }, { status: 403 });
    }

    const body = await req.json();
    const action = body?.action as Action;
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const reference = typeof body?.reference === "string" ? body.reference.trim() : "";

    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: { referredUser: { select: { name: true, email: true } } },
    });
    if (!referral) {
      return NextResponse.json({ error: "Referral not found." }, { status: 404 });
    }

    // An admin can't approve or pay out a reward that would go to themselves.
    if (referral.referrerId === session.user.id) {
      return NextResponse.json(
        { error: "You can't confirm or pay your own referral — ask another admin to handle it." },
        { status: 403 }
      );
    }

    const stage = getReferralStage(referral);
    const referredName = referral.referredUser.name || referral.referredUser.email;
    const amount = `KSh ${referral.rewardAmount.toLocaleString()}`;

    if (action === "CONFIRM_PURCHASE") {
      if (stage !== "AWAITING_PURCHASE") {
        return NextResponse.json({ error: "This referral's purchase is already confirmed." }, { status: 400 });
      }
      if (note.length < 3) {
        return NextResponse.json(
          { error: "Add a short note on what you checked (e.g. \"Plot in Kitengela — sale agreement seen\"). The referrer can see it." },
          { status: 400 }
        );
      }
      const updated = await prisma.referral.update({
        where: { id: params.id },
        data: {
          purchaseConfirmedAt: new Date(),
          purchaseNote: note.slice(0, 300),
          purchaseConfirmedBy: session.user.name || session.user.email || session.user.id,
        },
      });
      await notifyUser({
        senderId: session.user.id,
        receiverId: referral.referrerId,
        message: `Good news — ${referredName}'s purchase has been confirmed, so you've earned ${amount}. The Daktop360 team will pay you directly and let you know once it's sent.`,
        emailSubject: "Your referral reward is confirmed",
      });
      return NextResponse.json(updated);
    }

    if (action === "UNDO_CONFIRMATION") {
      if (stage !== "PURCHASE_CONFIRMED") {
        return NextResponse.json(
          { error: stage === "PAID" ? "Undo the payment first." : "This purchase isn't confirmed." },
          { status: 400 }
        );
      }
      const updated = await prisma.referral.update({
        where: { id: params.id },
        data: { purchaseConfirmedAt: null, purchaseNote: null, purchaseConfirmedBy: null },
      });
      return NextResponse.json(updated);
    }

    if (action === "MARK_PAID") {
      if (stage !== "PURCHASE_CONFIRMED") {
        return NextResponse.json(
          { error: stage === "PAID" ? "Already marked as paid." : "Confirm the purchase before marking it paid." },
          { status: 400 }
        );
      }
      const updated = await prisma.referral.update({
        where: { id: params.id },
        data: { payoutStatus: "PAID", paidAt: new Date(), paymentReference: reference ? reference.slice(0, 100) : null },
      });
      await notifyUser({
        senderId: session.user.id,
        receiverId: referral.referrerId,
        message: `Your referral reward of ${amount} for ${referredName} has been paid${reference ? ` (reference ${reference})` : ""}. Thank you for referring!`,
        emailSubject: "Your referral reward has been paid",
      });
      return NextResponse.json(updated);
    }

    // UNDO_PAID
    if (stage !== "PAID") {
      return NextResponse.json({ error: "This referral isn't marked as paid." }, { status: 400 });
    }
    const updated = await prisma.referral.update({
      where: { id: params.id },
      data: { payoutStatus: "PENDING", paidAt: null, paymentReference: null },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
