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
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] text-left text-sm font-semibold text-[var(--dk-heading)] transition-colors duration-150 hover:text-[var(--dk-primary)]"
      >
        <span className="inline-flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
          {open ? "Hide verification details" : "View verification"}
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--dk-muted)]">
          {completedCount} of {totalCount} checks complete
          {daktopVerified && !open && (
            <span className="dk-seal">Daktop Verified</span>
          )}
        </span>
      </button>

      {open && (
        <div className="mt-5 space-y-6 border-t border-[var(--dk-border)] pt-5">
          <div>
            <h2 className="m-0 [font-family:var(--font-display)] text-lg font-semibold text-[var(--dk-heading)]">
              Property verification
            </h2>

            {daktopVerified && (
              <p className="mt-2 mb-0 rounded-[var(--radius-md)] border border-[var(--dk-gold)]/40 bg-[var(--dk-gold-bg)] px-3.5 py-2.5 text-sm text-[var(--dk-gold-deep)]">
                <strong>DAKTOP VERIFIED</strong> — every check below has been completed.
              </p>
            )}
          </div>

          <div aria-label="Verification summary">
            <p className="m-0 text-sm font-semibold text-[var(--dk-ink)]">
              {completedCount} of {totalCount} checks complete
              {allVerified && <span className="text-[var(--dk-primary)]"> — fully verified</span>}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-medium ${
                    check.verified
                      ? "border-[var(--dk-primary)]/30 bg-[var(--dk-success-bg)] text-[var(--dk-primary)]"
                      : "border-[var(--dk-border)] bg-[var(--dk-ivory)] text-[var(--dk-muted)]"
                  }`}
                >
                  <span aria-hidden="true">{check.verified ? "\u2713" : "\u25cb"}</span>
                  {check.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="m-0 mb-2 text-sm font-semibold text-[var(--dk-ink)]">Documents</h3>
            {documents.length > 0 ? (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm text-[var(--dk-muted)]">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3">
                    <span>{doc.documentType ? DOCUMENT_TYPE_LABELS[doc.documentType] : "Document"} received</span>
                    <span className={doc.verified ? "font-semibold text-[var(--dk-primary)]" : "text-[var(--dk-muted)]"}>
                      {doc.verified ? "\u2713 Verified" : "Pending"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-[var(--dk-muted)]">No supporting documents submitted yet.</p>
            )}
          </div>

          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm text-[var(--dk-muted)]">
            <li className="flex items-center justify-between gap-3">
              <span>Location verification</span>
              <span className={locationVerified ? "font-semibold text-[var(--dk-primary)]" : ""}>
                {locationVerified ? "\u2713 Verified" : "Pending"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Ownership verification</span>
              <span className={ownershipVerified ? "font-semibold text-[var(--dk-primary)]" : ""}>
                {ownershipVerified ? "\u2713 Verified" : "Pending"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Survey verification</span>
              <span className={surveyVerified ? "font-semibold text-[var(--dk-primary)]" : ""}>
                {surveyVerified ? "\u2713 Verified" : "Pending"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Daktop decision</span>
              <span>{getDaktopDecisionLabel(daktopDecision)}</span>
            </li>
          </ul>

          <div>
            <h2 className="m-0 mb-2 [font-family:var(--font-display)] text-lg font-semibold text-[var(--dk-heading)]">
              About the {getRoleLabel(seller.role).toLowerCase()}
            </h2>

            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm text-[var(--dk-muted)]">
              <li className="flex items-center justify-between gap-3">
                <span>Name</span>
                <span className="text-[var(--dk-ink)]">{seller.name || seller.email}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Account status</span>
                <span className={seller.verified ? "font-semibold text-[var(--dk-primary)]" : ""}>
                  {seller.verified
                    ? `\u2713 Verified ${getRoleLabel(seller.role)}`
                    : `Not yet a verified ${getRoleLabel(seller.role).toLowerCase()}`}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Identity check</span>
                <span>{getIdentityVerificationLabel(seller.identityVerificationStatus)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Member since</span>
                <span>{sellerMemberSinceLabel}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Active listing{sellerListingCount === 1 ? "" : "s"} on DAKTOP360</span>
                <span>{sellerListingCount}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
