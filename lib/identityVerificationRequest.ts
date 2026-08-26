import { prisma } from "@/lib/prisma";
import { canRequestIdentityVerification } from "@/lib/identityVerification";
import type { User } from "@prisma/client";

// Shared by app/api/profile/identity-verification (dashboard request) and app/api/properties
// (the "also request identity verification" checkbox at listing creation) so both paths behave
// identically. Silently does nothing if the user isn't eligible to request (already
// pending/approved, or not a seller role) — callers that need to surface that as an error do
// their own eligibility check first; this is also used as a best-effort side effect during
// listing creation, where we don't want an ineligible checkbox to fail the whole submission.
export async function submitIdentityVerificationRequest(user: User): Promise<boolean> {
  if (user.role !== "OWNER" && user.role !== "AGENT") return false;
  if (!canRequestIdentityVerification(user.identityVerificationStatus)) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      identityVerificationStatus: "PENDING",
      identityVerificationRequestedAt: new Date(),
      identityVerificationReviewedAt: null,
      identityVerificationNote: null,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin: User) => ({
        message: `${user.name || user.email} requested identity verification.`,
        senderId: user.id,
        receiverId: admin.id,
      })),
    });
  }

  return true;
}
