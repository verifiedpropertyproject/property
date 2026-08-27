import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

// Every place in the app that creates an in-app Notification (dashboard bell) goes through
// here so it also gets a best-effort email. Same MVP fallback philosophy as the rest of the
// app's email use (see lib/mailer.ts): if SMTP isn't configured, or the send fails, the
// in-app notification still went through — email is a bonus, never a blocker, and a failed
// send is only logged, never thrown.

const DEFAULT_SUBJECT = "New notification on Daktop";

function textToHtml(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

type NotifyOne = {
  senderId: string;
  receiverId: string;
  message: string;
  propertyId?: string | null;
  /** Optional override for the email subject line; defaults to a generic one. */
  emailSubject?: string;
};

/**
 * Creates a single in-app notification and emails the receiver the same message
 * (if they have an email on file and SMTP is configured). Mirrors the previous
 * `prisma.notification.create({...})` call sites exactly, just with email added.
 */
export async function notifyUser({ senderId, receiverId, message, propertyId, emailSubject }: NotifyOne) {
  const [notification, receiver] = await Promise.all([
    prisma.notification.create({
      data: { message, senderId, receiverId, propertyId: propertyId ?? undefined },
    }),
    prisma.user.findUnique({ where: { id: receiverId }, select: { email: true } }),
  ]);

  if (receiver?.email) {
    sendEmail({
      to: receiver.email,
      subject: emailSubject || DEFAULT_SUBJECT,
      text: message,
      html: textToHtml(message),
    }).catch((err) => console.error("Failed to send notification email:", err));
  }

  return notification;
}

/**
 * Batch version of notifyUser, for the "notify every admin" / "notify all watchers" cases
 * that previously used `prisma.notification.createMany({...})`. Each item can have its own
 * message (they're usually identical text per admin, just a different receiverId).
 */
export async function notifyUsers(items: NotifyOne[]) {
  if (items.length === 0) return;

  const [, receivers] = await Promise.all([
    prisma.notification.createMany({
      data: items.map(({ senderId, receiverId, message, propertyId }) => ({
        message,
        senderId,
        receiverId,
        propertyId: propertyId ?? undefined,
      })),
    }),
    prisma.user.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.receiverId))] } },
      select: { id: true, email: true },
    }),
  ]);

  const emailById = new Map<string, string | null>(
    receivers.map((r: { id: string; email: string | null }) => [r.id, r.email])
  );

  await Promise.all(
    items.map((item) => {
      const email = emailById.get(item.receiverId);
      if (!email) return Promise.resolve();
      return sendEmail({
        to: email as string,
        subject: item.emailSubject || DEFAULT_SUBJECT,
        text: item.message,
        html: textToHtml(item.message),
      }).catch((err) => console.error("Failed to send notification email:", err));
    })
  );
}
