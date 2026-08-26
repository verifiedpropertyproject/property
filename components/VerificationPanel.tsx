"use client";

import { useState } from "react";
import { getIdentityVerificationLabel } from "@/lib/identityVerification";
import { getDaktopDecisionLabel } from "@/lib/verificationStatus";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";
import { getRoleLabel } from "@/lib/propertyConstants";

type DocumentSummary = {
  id: string;
  documentType: string | null;
  verified: boolean;
};

type Props = {
  daktopVerified: boolean;
  locationVerified: boolean;
  ownershipVerified: boolean;
  surveyVerified: boolean;
  daktopDecision: string;
  documents: DocumentSummary[];
  seller: {
    name: string | null;
    email: string;
    role: string;
    verified: boolean;
    identityVerificationStatus: string;
    createdAt: string | Date;
  };
  sellerListingCount: number;
  /** Opens expanded on first render — used when arriving via a "View verification" link. */
  defaultOpen?: boolean;
};

export default function VerificationPanel({
  daktopVerified,
  locationVerified,
  ownershipVerified,
  surveyVerified,
  daktopDecision,
  documents,
  seller,
  sellerListingCount,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const sellerMemberSinceLabel = new Date(seller.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const documentsVerified = documents.length > 0 && documents.every((doc) => doc.verified);

  const checks = [
    { label: "Location", verified: locationVerified },
    { label: "Ownership", verified: ownershipVerified },
    { label: "Survey", verified: surveyVerified },
    { label: "Documents", verified: documentsVerified },
  ];
  const completedCount = checks.filter((check) => check.verified).length;
  const totalCount = checks.length;
  const allVerified = completedCount === totalCount;

  return (
    <section id="verification">
      <button type="button" onClick={() => setOpen((prev) => !prev)} aria-expanded={open}>
        {open ? "Hide verification details" : "View verification"}
        {" — "}
        {completedCount} of {totalCount} checks complete
        {daktopVerified && !open ? " — Daktop Verified" : ""}
      </button>

      {open && (
        <div>
          <h2>Property verification</h2>

          {daktopVerified && (
            <p>
              <strong>DAKTOP VERIFIED</strong> — every check below has been completed.
            </p>
          )}

          <div aria-label="Verification summary">
            <p>
              <strong>
                {completedCount} of {totalCount} checks complete
              </strong>
              {allVerified ? " — fully verified" : ""}
            </p>
            <ul>
              {checks.map((check) => (
                <li key={check.label}>
                  {check.verified ? "\u2713" : "\u25cb"} {check.label}
                </li>
              ))}
            </ul>
          </div>

          {documents.length > 0 ? (
            <ul>
              {documents.map((doc) => (
                <li key={doc.id}>
                  {(doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Document")} received:{" "}
                  {doc.verified ? "\u2713 Verified" : "Pending"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No supporting documents submitted yet.</p>
          )}

          <ul>
            <li>Location verification: {locationVerified ? "\u2713 Verified" : "Pending"}</li>
            <li>Ownership verification: {ownershipVerified ? "\u2713 Verified" : "Pending"}</li>
            <li>Survey verification: {surveyVerified ? "\u2713 Verified" : "Pending"}</li>
            <li>Daktop decision: {getDaktopDecisionLabel(daktopDecision)}</li>
          </ul>

          <h2>About the {getRoleLabel(seller.role).toLowerCase()}</h2>

          <ul>
            <li>Name: {seller.name || seller.email}</li>
            <li>
              Account status:{" "}
              {seller.verified ? `\u2713 Verified ${getRoleLabel(seller.role)}` : `Not yet a verified ${getRoleLabel(seller.role).toLowerCase()}`}
            </li>
            <li>Identity check: {getIdentityVerificationLabel(seller.identityVerificationStatus)}</li>
            <li>Member since: {sellerMemberSinceLabel}</li>
            <li>
              {sellerListingCount} active listing{sellerListingCount === 1 ? "" : "s"} on DAKTOP360
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}
