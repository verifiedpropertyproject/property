import path from "path";
import fs from "fs/promises";

// Certificates are genuinely sensitive (signer's full name + IP address), so they use the same
// PRIVATE blob store as supporting documents (lib/documentStorage.ts) rather than the public
// one used for property photos — reusing it instead of asking for yet another Vercel Blob store.
// "Private" here means Vercel actually gates access behind the store's token (get/del require
// it), not just an obscure-but-guessable public URL.
const CERTIFICATES_BLOB_TOKEN = process.env.doc_READ_WRITE_TOKEN;
const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "commission-certificates");

function isBlobConfigured() {
  return Boolean(CERTIFICATES_BLOB_TOKEN);
}

function blobPathname(propertyId: string, agreementId: string) {
  return `commission-certificates/${propertyId}/${agreementId}.pdf`;
}

function localPath(propertyId: string, agreementId: string) {
  return path.join(UPLOAD_ROOT, propertyId, `${agreementId}.pdf`);
}

/**
 * Stores the certificate and returns an opaque key to save on the CommissionAgreement row
 * (a blob pathname, or a local:// marker for the disk fallback) — never a fetchable URL.
 * Retrieval always goes through readCommissionCertificate + the authenticated download route.
 */
export async function saveCommissionCertificate(
  pdfBytes: Uint8Array,
  propertyId: string,
  agreementId: string
): Promise<string> {
  if (isBlobConfigured()) {
    const { put } = await import("@vercel/blob");
    const pathname = blobPathname(propertyId, agreementId);
    await put(pathname, Buffer.from(pdfBytes), {
      access: "private",
      contentType: "application/pdf",
      token: CERTIFICATES_BLOB_TOKEN,
    });
    return pathname;
  }

  const dir = path.join(UPLOAD_ROOT, propertyId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(localPath(propertyId, agreementId), Buffer.from(pdfBytes));
  return `local://${propertyId}/${agreementId}`;
}

export async function readCommissionCertificate(certificateKey: string, propertyId: string, agreementId: string): Promise<Buffer> {
  if (certificateKey.startsWith("local://")) {
    return fs.readFile(localPath(propertyId, agreementId));
  }

  if (!isBlobConfigured()) {
    throw new Error("Certificate was stored in Blob but doc_READ_WRITE_TOKEN is not configured.");
  }

  const { get } = await import("@vercel/blob");
  const result = await get(certificateKey, { access: "private", token: CERTIFICATES_BLOB_TOKEN });
  if (!result || result.statusCode !== 200) {
    throw new Error("Certificate not found in storage.");
  }
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}
