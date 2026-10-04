import { prisma } from "@/lib/prisma";
import { REFERRAL_REWARD_AMOUNT } from "@/lib/referral";

/**
 * Records that `referredUserId` signed up with someone's referral code. Used by every signup
 * path (email/password in app/api/register/route.ts, and Google in app/api/select-role/route.ts)
 * so the rules are identical everywhere:
 *   - an unknown/empty code is not an error, it just records nothing;
 *   - you can't refer yourself;
 *   - a user can only ever be referred once (Referral.referredUserId is unique).
 * The new referral starts as "awaiting purchase" — nothing is owed until an admin confirms the
 * referred person's purchase. Returns true if a referral was created.
 */
export async function recordReferral(referredUserId: string, rawCode: unknown): Promise<boolean> {
  if (typeof rawCode !== "string" || !rawCode.trim()) return false;

  const referrer = await prisma.user.findUnique({
    where: { referralCode: rawCode.trim().toUpperCase() },
    select: { id: true },
  });
  if (!referrer || referrer.id === referredUserId) return false;

  try {
    await prisma.referral.create({
      data: { referrerId: referrer.id, referredUserId, rewardAmount: REFERRAL_REWARD_AMOUNT },
    });
    return true;
  } catch (err: any) {
    if (err?.code === "P2002") return false; // already referred once
    throw err;
  }
}
