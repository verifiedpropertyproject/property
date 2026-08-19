import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CertificateData = {
  agreementId: string;
  propertyId: string;
  propertyTitle: string;
  sellerName: string | null;
  sellerEmail: string;
  signedName: string;
  rate: number;
  agreementVersion: number;
  agreementText: string;
  signedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// pdf-lib doesn't wrap text for you — split into lines that fit CONTENT_WIDTH at the given size.
function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateCommissionCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Commission Agreement Certificate — ${data.propertyTitle}`);
  doc.setSubject("Commission agreement acceptance record");

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;
  const darkGray = rgb(0.15, 0.15, 0.15);
  const midGray = rgb(0.4, 0.4, 0.4);

  function heading(text: string, size = 18) {
    page.drawText(text, { x: MARGIN, y, size, font: boldFont, color: darkGray });
    y -= size + 10;
  }

  function label(text: string) {
    page.drawText(text, { x: MARGIN, y, size: 10, font: boldFont, color: midGray });
    y -= 14;
  }

  function value(text: string) {
    page.drawText(text, { x: MARGIN, y, size: 12, font, color: darkGray });
    y -= 22;
  }

  function rule() {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.75,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;
  }

  function paragraph(text: string, size = 10.5, lineHeight = 15) {
    for (const line of wrapText(text, font, size, CONTENT_WIDTH)) {
      page.drawText(line, { x: MARGIN, y, size, font, color: darkGray });
      y -= lineHeight;
    }
  }

  heading("Commission Agreement Certificate");
  page.drawText("This certificate records acceptance of the platform's commission terms for the listing below.", {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: midGray,
  });
  y -= 26;
  rule();

  label("PROPERTY");
  value(data.propertyTitle);
  label("PROPERTY ID");
  value(data.propertyId);

  label("LISTED BY");
  value(`${data.sellerName || "(name not on file)"} <${data.sellerEmail}>`);

  label("COMMISSION RATE AGREED");
  value(`${(data.rate * 100).toFixed(data.rate * 100 % 1 === 0 ? 0 : 2)}%`);

  rule();

  label("SIGNED NAME");
  value(data.signedName);

  label("SIGNED AT (UTC)");
  value(data.signedAt.toISOString().replace("T", "  ").replace("Z", " UTC"));

  label("IP ADDRESS AT SIGNING");
  value(data.ipAddress || "(not recorded)");

  label("BROWSER / DEVICE AT SIGNING");
  paragraph(data.userAgent || "(not recorded)", 9, 12);
  y -= 10;

  label("AGREEMENT ID");
  value(data.agreementId);

  rule();

  label(`AGREEMENT TEXT (VERSION ${data.agreementVersion})`);
  y -= 4;
  paragraph(data.agreementText);

  y -= 20;
  page.drawText(
    "This document is a system-generated record of an in-app click-to-agree action and is not a substitute for independent legal advice.",
    { x: MARGIN, y, size: 8, font, color: midGray }
  );

  return doc.save();
}
