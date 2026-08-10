// Owner-side document types (proof tied to the property/owner) and agent-side document types
// (proof the agent is actually authorized to sell, used when they don't have — or don't yet
// have — the owner's own paperwork). Either role can pick from the full list; it's not
// role-restricted, since who has which document in hand varies case by case.
export const DOCUMENT_TYPES = [
  "TITLE_DEED",
  "OFFICIAL_SEARCH",
  "OWNERSHIP_DOCUMENT",
  "SALE_AGREEMENT",
  "AUTHORIZATION_LETTER",
  "AGENCY_MANAGEMENT_AGREEMENT",
  "AGENCY_COMPANY_DOCUMENT",
  "AGENT_LICENSE",
  "OTHER",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  TITLE_DEED: "Title Deed",
  OFFICIAL_SEARCH: "Official Search",
  OWNERSHIP_DOCUMENT: "Ownership Document",
  SALE_AGREEMENT: "Sale Agreement",
  AUTHORIZATION_LETTER: "Authorization Letter",
  AGENCY_MANAGEMENT_AGREEMENT: "Agency Management Agreement",
  AGENCY_COMPANY_DOCUMENT: "Agency Company Document",
  AGENT_LICENSE: "Agent License / Certification",
  OTHER: "Other",
};
