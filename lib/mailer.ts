import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD && EMAIL_FROM);

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

/**
 * Sends an email if SMTP is configured in .env. If it isn't (or sending fails),
 * returns { sent: false } so the caller can fall back to showing the link
 * directly on screen — this is the MVP's dev-friendly default.
 */
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  const t = getTransporter();
  if (!t) {
    return { sent: false as const, reason: "SMTP not configured" };
  }

  try {
    await t.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return { sent: true as const };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { sent: false as const, reason: "Send failed" };
  }
}
