import { prisma } from "@/lib/prisma";

// Daktop's overall due-diligence verdict for a listing, set by an admin once they've reviewed
// its documents, location, and ownership. Separate from Property.status (the public/pending
// review workflow) — a listing can be public while this is still Pending.
export const DAKTOP_DECISIONS = ["PENDING", "SAFE_TO_BUY", "NOT_SAFE"] as const;

export const DAKTOP_DECISION_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SAFE_TO_BUY: "Safe to buy",
  NOT_SAFE: "Not safe to buy",
};

export function getDaktopDecisionLabel(decision: string): string {
  return DAKTOP_DECISION_LABELS[decision] || decision;
}

// A listing earns the "DAKTOP VERIFIED" badge only once nothing is left pending: every
// submitted document has been marked received, location/ownership/survey are all verified, and
// Daktop's own decision is a clean Safe to buy (not still Pending, and not Not safe). At least
// one document must exist — a listing with no supporting documents at all hasn't actually been
// through document verification, regardless of the other three checks.
export function computeDaktopVerified(property: {
  locationVerified: boolean;
  ownershipVerified: boolean;
  surveyVerified: boolean;
  daktopDecision: string;
  documents: { verified: boolean }[];
}): boolean {
  return (
    property.locationVerified &&
    property.ownershipVerified &&
    property.surveyVerified &&
    property.daktopDecision === "SAFE_TO_BUY" &&
    property.documents.length > 0 &&
    property.documents.every((d) => d.verified)
  );
}

// Recalculates and persists Property.daktopVerified for one listing. Called after anything that
// could change the answer: a document being verified/unverified, a document being
// uploaded/deleted, or the location/ownership/survey/decision fields being updated. Keeping this
// as a stored column (rather than computing it on every page render) means listing cards on the
// homepage can show the badge without joining in every property's documents.
export async function recomputeDaktopVerified(propertyId: string): Promise<boolean> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      locationVerified: true,
      ownershipVerified: true,
      surveyVerified: true,
      daktopDecision: true,
      daktopVerified: true,
      documents: { select: { verified: true } },
    },
  });

  if (!property) return false;

  const nextValue = computeDaktopVerified(property);
  if (nextValue !== property.daktopVerified) {
    await prisma.property.update({ where: { id: propertyId }, data: { daktopVerified: nextValue } });
  }

  return nextValue;
}

